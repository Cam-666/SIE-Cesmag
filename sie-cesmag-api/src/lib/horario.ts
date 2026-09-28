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
