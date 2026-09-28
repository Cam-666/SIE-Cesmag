import type { Agenda, EstadoAgenda } from "@prisma/client"
import { Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma.js"
import { fechaATexto, fechaDesdeTexto, horaATexto, horaDesdeTexto } from "../../lib/horario.js"
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

/** Crear un bloque propio. */
export async function crearBloqueAgenda(
  idUsuario: string,
  payload: { fecha: string; horaInicio: string; horaFin: string },
) {
  try {
    const creado = await prisma.agenda.create({
      data: {
        idUsuario,
        fecha: fechaDesdeTexto(payload.fecha),
        horaInicio: horaDesdeTexto(payload.horaInicio),
        horaFin: horaDesdeTexto(payload.horaFin),
      },
    })
    return { ...bloqueBase(creado), emprendimiento: null }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ErrorApi(409, "Ya tiene un bloque de disponibilidad configurado para esa fecha y hora de inicio.")
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
