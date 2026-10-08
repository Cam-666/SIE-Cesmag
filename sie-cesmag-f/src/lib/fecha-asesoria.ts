/**
 * `Asesoria.fechaAsesoria` (y cualquier otro DateTime armado con
 * `combinarFechaHora` en el backend) guarda la hora de reloj tal cual la
 * escribió el coordinador, con sufijo "Z" (UTC) solo por convención interna
 * de almacenamiento — nunca representa un instante real en UTC. Formatear
 * eso con `new Date(iso)` + `date-fns` aplica la zona horaria del
 * navegador y corre la hora (9:30 a. m. aparecía como 4:30 a. m. en
 * Bogotá, UTC-5). Esta función arma un Date "local" a partir de los
 * componentes UTC crudos, para que `format()` muestre la hora de reloj
 * guardada tal cual, sin ninguna conversión de zona horaria.
 */
export function fechaAsesoriaComoLocal(fechaISO: string): Date {
  const utc = new Date(fechaISO)
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
  )
}

/**
 * Equivalente de "ahora" en el mismo criterio que `fechaAsesoriaComoLocal`
 * (y que `ahoraComoFechaAsesoria` del backend) — Bogotá es UTC-5 fijo, sin
 * horario de verano. Se usa para comparar `fechaAsesoria` contra el momento
 * actual (p. ej. "¿ya pasó, toca registrar el resultado?") sin el desfase
 * de 5 horas que da comparar directo contra `new Date()`.
 */
export function ahoraComoFechaAsesoria(): Date {
  return new Date(Date.now() - 5 * 60 * 60 * 1000)
}

/**
 * Ventana permitida para crear NUEVA disponibilidad — espejo exacto de
 * `rangoPermitidoDisponibilidad` en el backend (que es quien de verdad lo
 * exige; esto es solo para que el selector de fecha y el calendario no
 * dejen ni intentar algo que el servidor va a rechazar). Por defecto solo
 * el mes actual; desde el día 20 se abre también el siguiente.
 */
export function rangoPermitidoDisponibilidad(): { desde: string; hasta: string } {
  const ahoraBogota = ahoraComoFechaAsesoria()
  const anio = ahoraBogota.getUTCFullYear()
  const mes = ahoraBogota.getUTCMonth()
  const dia = ahoraBogota.getUTCDate()

  const desde = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
  const mesesAAbrir = dia >= 20 ? 2 : 1
  const finMes = new Date(Date.UTC(anio, mes + mesesAAbrir, 0))
  const hasta = finMes.toISOString().slice(0, 10)

  return { desde, hasta }
}
