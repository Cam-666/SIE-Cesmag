import type { Agenda, EstadoAgenda } from "@prisma/client"
import { Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { fechaATexto, fechaDesdeTexto, horaATexto, horaDesdeTexto, rangoPermitidoDisponibilidad } from "../../lib/horario.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

/**
 * Para un bloque "reservado", resuelve el nombre del emprendimiento que lo
 * ocupa: la fila de ASESORIA más reciente que apunte a este `idAgenda` es la
 * reserva vigente (al reprogramar, la misma fila de asesoría cambia de
 * `idAgenda`, así que una fila más antigua que siga apuntando aquí ya quedó histórica).
 */
async function emprendimientoDelBloque(idAgenda: number): Promise<string | null> {
  const asesoria = await prisma.asesoria.findFirst({
    where: { idAgenda },
    orderBy: { idAsesoria: "desc" },
    include: { emprendimientoFase: { include: { emprendimiento: true } } },
  })
  return asesoria?.emprendimientoFase.emprendimiento.nombreReferencia ?? null
}

function bloqueBase(bloque: Agenda) {
  return {
    idAgenda: bloque.idAgenda,
    idUsuario: bloque.idUsuario,
    fecha: fechaATexto(bloque.fecha),
    horaInicio: horaATexto(bloque.horaInicio),
    horaFin: horaATexto(bloque.horaFin),
    estado: bloque.estado,
  }
}

/** Bloques propios del usuario autenticado, con el emprendimiento si están reservados. */
export async function listarMiAgenda(idUsuario: string) {
  const bloques = await prisma.agenda.findMany({
    where: { idUsuario },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  })
  return Promise.all(
    bloques.map(async (bloque) => ({
      ...bloqueBase(bloque),
      emprendimiento: bloque.estado === "reservado" ? await emprendimientoDelBloque(bloque.idAgenda) : null,
    })),
  )
}

/**
 * Agenda combinada de todo el personal administrativo (no solo el
 * coordinador) para que el emprendedor pueda agendar con quien tenga
 * disponibilidad. Se filtra a cuentas de ámbito "admin". No se expone
 * `emprendimiento` (a quién pertenece la reserva), solo `asesorNombre`.
 */
export async function listarAgendaAsesores() {
  const bloques = await prisma.agenda.findMany({
    where: { usuario: { rol: { ambito: "admin" } } },
    include: { usuario: true },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  })
  return bloques.map((bloque) => ({
    ...bloqueBase(bloque),
    asesorNombre: bloque.usuario.nombre,
  }))
}

function minutosDesdeTexto(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

function textoDesdeMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Unidad atómica de todo bloque de disponibilidad: el coordinador define un
 * rango amplio (p. ej. 8:00 a 12:00) y aquí se trocea siempre en bloques de
 * 15 minutos — la duración real de cada asesoría la elige quien agenda
 * (15/30/45/60 min, ver `DURACIONES_ASESORIA_MINUTOS`), encadenando tantos
 * bloques atómicos consecutivos como haga falta (`resolverCadenaDeBloques`).
 * Antes el coordinador fijaba una duración única por bloque y esa quedaba
 * fija para quien agendara — se corrigió a pedido del profesor evaluador
 * para que, p. ej., una disponibilidad de 8:00 a 12:00 no se pudiera agendar
 * entera de una sola vez.
 */
const GRANULARIDAD_MINUTOS = 15

/**
 * Crea tantos bloques atómicos de `GRANULARIDAD_MINUTOS` quepan entre
 * `horaInicio` y `horaFin` — un rango que no alcanza a completar ni uno solo
 * no genera nada (ver el 400 más abajo). Todo en una sola transacción: si
 * algún horario ya existía (choque con un bloque previo), no queda ninguno a medias.
 */
export async function crearBloqueAgenda(
  idUsuario: string,
  payload: { fecha: string; horaInicio: string; horaFin: string },
) {
  const { desde, hasta } = rangoPermitidoDisponibilidad()
  if (payload.fecha < desde || payload.fecha > hasta) {
    throw new ErrorApi(
      400,
      "Solo se puede configurar disponibilidad para el mes actual (o el siguiente, a partir del día 20).",
    )
  }

  const inicio = minutosDesdeTexto(payload.horaInicio)
  const fin = minutosDesdeTexto(payload.horaFin)

  const rangos: { horaInicio: string; horaFin: string }[] = []
  for (let t = inicio; t + GRANULARIDAD_MINUTOS <= fin; t += GRANULARIDAD_MINUTOS) {
    rangos.push({ horaInicio: textoDesdeMinutos(t), horaFin: textoDesdeMinutos(t + GRANULARIDAD_MINUTOS) })
  }
  if (rangos.length === 0) {
    throw new ErrorApi(400, "El rango de horario debe ser de al menos 15 minutos.")
  }

  try {
    const creados = await prisma.$transaction(
      rangos.map((r) =>
        prisma.agenda.create({
          data: {
            idUsuario,
            fecha: fechaDesdeTexto(payload.fecha),
            horaInicio: horaDesdeTexto(r.horaInicio),
            horaFin: horaDesdeTexto(r.horaFin),
          },
        }),
      ),
    )
    return creados.map((creado) => ({ ...bloqueBase(creado), emprendimiento: null }))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ErrorApi(409, "Ya tiene un bloque de disponibilidad configurado para esa fecha y alguna de esas horas de inicio.")
    }
    throw err
  }
}

/** Alternar disponible/bloqueado — nunca sobre un bloque ya reservado. */
export async function editarBloqueAgenda(idUsuario: string, idAgenda: number, estado: Extract<EstadoAgenda, "disponible" | "bloqueado">) {
  const bloque = await prisma.agenda.findUnique({ where: { idAgenda } })
  if (!bloque || bloque.idUsuario !== idUsuario) {
    throw new ErrorApi(404, "Bloque de disponibilidad no encontrado.")
  }
  if (bloque.estado === "reservado") {
    throw new ErrorApi(400, "No se puede modificar un bloque ya agendado.")
  }
  const actualizado = await prisma.agenda.update({ where: { idAgenda }, data: { estado } })
  return { ...bloqueBase(actualizado), emprendimiento: null }
}

/** Eliminar — nunca sobre un bloque ya reservado. */
export async function eliminarBloqueAgenda(idUsuario: string, idAgenda: number) {
  const bloque = await prisma.agenda.findUnique({ where: { idAgenda } })
  if (!bloque || bloque.idUsuario !== idUsuario) {
    throw new ErrorApi(404, "Bloque de disponibilidad no encontrado.")
  }
  if (bloque.estado === "reservado") {
    throw new ErrorApi(400, "No se puede eliminar un bloque ya agendado.")
  }
  await prisma.agenda.delete({ where: { idAgenda } })
}

/**
 * Encadena, a partir del bloque ancla (el horario de inicio elegido), tantos
 * bloques atómicos consecutivos y disponibles como requiera `duracionMinutos`
 * (cada uno "pega" donde terminó el anterior: `horaFin` de uno es
 * `horaInicio` del siguiente). Si en algún punto de la cadena falta un bloque
 * o ya no está disponible, se corta con un 409 — la duración elegida no cabe
 * a partir de ese horario.
 */
export async function resolverCadenaDeBloques(idAgendaAncla: number, duracionMinutos: number): Promise<Agenda[]> {
  const ancla = await prisma.agenda.findUnique({ where: { idAgenda: idAgendaAncla } })
  if (!ancla) {
    throw new ErrorApi(404, "El horario seleccionado no existe.")
  }
  if (ancla.estado !== "disponible") {
    throw new ErrorApi(409, "El horario seleccionado ya no está disponible.")
  }

  const cadena: Agenda[] = [ancla]
  let acumuladoMinutos = (ancla.horaFin.getTime() - ancla.horaInicio.getTime()) / 60_000
  let horaBuscada = ancla.horaFin

  while (acumuladoMinutos < duracionMinutos) {
    const siguiente = await prisma.agenda.findFirst({
      where: { idUsuario: ancla.idUsuario, fecha: ancla.fecha, horaInicio: horaBuscada, estado: "disponible" },
    })
    if (!siguiente) {
      throw new ErrorApi(
        409,
        "No hay disponibilidad continua suficiente para esa duración a partir de ese horario. Elija una duración menor u otro horario.",
      )
    }
    cadena.push(siguiente)
    acumuladoMinutos += (siguiente.horaFin.getTime() - siguiente.horaInicio.getTime()) / 60_000
    horaBuscada = siguiente.horaFin
  }

  return cadena
}

/**
 * Igual que `resolverCadenaDeBloques`, pero de solo lectura y sin exigir
 * "disponible": se usa para recomponer una cadena que YA está reservada (a
 * partir del ancla guardada en `ASESORIA.id_agenda` y su `duracionMinutos`),
 * de modo que cancelar/reprogramar pueda liberarla completa dentro de su
 * propia transacción en vez de dejar bloques "reservado" huérfanos.
 */
export async function resolverCadenaReservada(idAgendaAncla: number, duracionMinutos: number): Promise<Agenda[]> {
  const ancla = await prisma.agenda.findUnique({ where: { idAgenda: idAgendaAncla } })
  if (!ancla) return []

  const cadena: Agenda[] = [ancla]
  let acumuladoMinutos = (ancla.horaFin.getTime() - ancla.horaInicio.getTime()) / 60_000
  let horaBuscada = ancla.horaFin

  while (acumuladoMinutos < duracionMinutos) {
    const siguiente = await prisma.agenda.findFirst({
      where: { idUsuario: ancla.idUsuario, fecha: ancla.fecha, horaInicio: horaBuscada },
    })
    if (!siguiente) break
    cadena.push(siguiente)
    acumuladoMinutos += (siguiente.horaFin.getTime() - siguiente.horaInicio.getTime()) / 60_000
    horaBuscada = siguiente.horaFin
  }

  return cadena
}
