/** Fecha y hora legibles en español, zona horaria de Colombia — para correos y mensajes de notificación. */
export function fechaLegible(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(fecha)
}
