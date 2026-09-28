/**
 * Coordinador (1) y Vicerrector (2): roles base de la dependencia, nunca
 * eliminables — ni el rol en sí, ni ningún usuario que lo tenga asignado.
 * Coincide con `IDS_ROL_PROTEGIDO` en el frontend (`domain/usuario/display.ts`);
 * se repite aquí porque el servidor nunca debe confiar solo en que el
 * frontend lo respete.
 */
export const IDS_ROL_PROTEGIDO: readonly number[] = [1, 2]

/**
 * Rol reservado del sistema (sembrado en `prisma/seed.ts`, ámbito "admin",
 * sin ningún permiso): destino automático al eliminar un rol "de todas
 * formas" sin reasignar a otro. Protegido igual que `IDS_ROL_PROTEGIDO`,
 * pero identificado por nombre en vez de ID porque no tiene un ID fijo
 * garantizado. Coincide con `NOMBRE_ROL_SIN_ROL` en el frontend.
 */
export const NOMBRE_ROL_SIN_ROL = "Sin rol"
