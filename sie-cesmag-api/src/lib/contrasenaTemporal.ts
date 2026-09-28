import { randomInt } from "node:crypto"

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz" // sin I/l/O/0 para que no se confundan al leerla
const NUMEROS = "23456789"

/**
 * Genera una contraseña temporal legible (10 caracteres: letras + números,
 * sin ambigüedades visuales) para cuentas creadas por el coordinador o al
 * aprobar un precandidato. Mientras no haya un proveedor de correo real
 * conectado, esta contraseña se devuelve una sola vez en la respuesta para
 * que el coordinador la vea en pantalla y se la comparta a la persona.
 */
export function generarContrasenaTemporal(): string {
  const alfabeto = LETRAS + NUMEROS
  let contrasena = ""
  for (let i = 0; i < 10; i++) {
    contrasena += alfabeto[randomInt(alfabeto.length)]
  }
  return contrasena
}
