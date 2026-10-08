/**
 * Conversión entre los strings "YYYY-MM-DD" / "HH:mm" que maneja el frontend
 * y las columnas `@db.Date` / `@db.Time` de AGENDA — no hay ningún otro
 * módulo en el proyecto que ya use `@db.Time`, así que este es el criterio
 * nuevo: todo se ancla a UTC explícitamente (con sufijo "Z") tanto al
 * escribir como al leer, para que el viaje de ida y vuelta sea consistente
 * sin importar la zona horaria del servidor (mismo espíritu que ya usa el
 * resto del código para columnas `@db.Date`, ver `emprendimientos.service.ts`).
 */

/** "YYYY-MM-DD" → Date apto para una columna `@db.Date`. */
export function fechaDesdeTexto(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`)
}

/** Columna `@db.Date` → "YYYY-MM-DD". */
export function fechaATexto(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** "HH:mm" → Date apto para una columna `@db.Time`. */
export function horaDesdeTexto(hora: string): Date {
  return new Date(`1970-01-01T${hora}:00.000Z`)
}

/** Columna `@db.Time` → "HH:mm". */
export function horaATexto(hora: Date): string {
  return hora.toISOString().slice(11, 16)
}

/** Combina una columna `@db.Date` y una `@db.Time` (mismo criterio UTC) en un DateTime completo. */
export function combinarFechaHora(fecha: Date, hora: Date): Date {
  return new Date(`${fechaATexto(fecha)}T${horaATexto(hora)}:00.000Z`)
}

/**
 * `Asesoria.fechaAsesoria` se arma con `combinarFechaHora`, que guarda la
 * hora de reloj de Bogotá tal cual, con sufijo "Z" solo por convención de
 * almacenamiento — nunca es un instante real en UTC. Comparar esa columna
 * contra `new Date()` (el instante real de ahora) corre la comparación 5
 * horas, el desfase de Bogotá (UTC-5, sin horario de verano) respecto a UTC:
 * una asesoría de las 2:00 p. m. quedaría fuera de "próximas" desde las
 * 9:00 a. m. reales. Esta función da el equivalente de "ahora" en ese mismo
 * criterio, para comparar manzanas con manzanas.
 */
export function ahoraComoFechaAsesoria(): Date {
  return new Date(Date.now() - 5 * 60 * 60 * 1000)
}

/**
 * Ventana permitida para crear NUEVA disponibilidad (no para ver lo ya
 * agendado — eso sigue visible sin límite, pasado incluido). A pedido del
 * profesor evaluador: no tiene sentido dejar agendar en un mes que ya pasó,
 * ni abrir meses muy lejanos de una vez. Por defecto solo el mes actual;
 * desde el día 20 se abre también el siguiente, para poder planear sin
 * esperar a que termine el mes. Devuelve "YYYY-MM-DD" porque esos strings
 * ya se pueden comparar directo como texto (mismo orden que cronológico).
 */
export function rangoPermitidoDisponibilidad(): { desde: string; hasta: string } {
  const ahoraBogota = ahoraComoFechaAsesoria()
  const anio = ahoraBogota.getUTCFullYear()
  const mes = ahoraBogota.getUTCMonth()
  const dia = ahoraBogota.getUTCDate()

  const desde = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
  const mesesAAbrir = dia >= 20 ? 2 : 1
  // Día 0 del mes (mes + mesesAAbrir) = último día del mes justo anterior a ese.
  const finMes = new Date(Date.UTC(anio, mes + mesesAAbrir, 0))
  const hasta = finMes.toISOString().slice(0, 10)

  return { desde, hasta }
}
