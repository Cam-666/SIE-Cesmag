/**
 * Tokens de prueba para los 3 ámbitos/roles que necesita la Fase 4. No son
 * credenciales reales: cada archivo de prueba los asocia a un perfil
 * (`UsuarioAutenticado`) dentro de su propio `vi.hoisted()`, porque Vitest
 * hoista `vi.mock`/`vi.hoisted` por encima de los imports — una constante
 * importada normal no estaría lista todavía en ese punto. Mantener los
 * nombres aquí evita repetir las cadenas sueltas en cada archivo.
 */
export const TOKEN_COORDINADOR = "tok-coordinador"
export const TOKEN_ADMINISTRATIVO = "tok-administrativo"
export const TOKEN_EMPRENDEDOR = "tok-emprendedor"

/** Cabecera Authorization lista para `.set(...)` de Supertest. */
export function autorizacion(token: string) {
  return { Authorization: `Bearer ${token}` }
}
