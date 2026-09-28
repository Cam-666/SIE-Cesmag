import { prisma } from "../../lib/prisma.js"
import { crearCuentaAuth } from "../../lib/crearCuentaAuth.js"
import { emprendedorParaFrontend } from "../../lib/mappers.js"
import { ErrorApi } from "../../middleware/errorHandler.js"

/**
 * Crea la cuenta de acceso (Supabase Auth + fila USUARIO) de un EMPRENDEDOR
 * que todavía no la tiene — la usan tanto "aprobar precandidato" como
 * "agregar integrante". Si ya tiene cuenta, no crea nada nuevo. La persona
 * define su contraseña con el enlace de restablecimiento (ver `crearCuentaAuth`).
 */
export async function crearCuentaEmprendedor(idEmprendedor: number) {
  const emprendedor = await prisma.emprendedor.findUniqueOrThrow({ where: { idEmprendedor } })
  if (emprendedor.idUsuario) {
    return emprendedor
  }

  const rolEmprendedor = await prisma.rol.findUniqueOrThrow({ where: { nombre: "Emprendedor" } })
  const cuenta = await crearCuentaAuth({ correo: emprendedor.correo, nombre: emprendedor.nombre })
  if (!cuenta) {
    throw new ErrorApi(409, "No se pudo crear la cuenta de acceso — verifique que el correo no esté ya registrado.")
  }

  await prisma.$transaction([
    prisma.usuario.create({
      data: {
        idUsuario: cuenta.idUsuario,
        nombre: emprendedor.nombre,
        correo: emprendedor.correo,
        idRol: rolEmprendedor.idRol,
      },
    }),
    prisma.emprendedor.update({
      where: { idEmprendedor },
      data: { idUsuario: cuenta.idUsuario, estadoPrecandidato: "aprobado" },
    }),
  ])

  return prisma.emprendedor.findUniqueOrThrow({ where: { idEmprendedor } })
}

/** "Mi perfil" del portal del emprendedor: datos personales del emprendedor autenticado. */
export async function obtenerMiPerfil(idUsuario: string) {
  const emprendedor = await prisma.emprendedor.findUnique({ where: { idUsuario } })
  if (!emprendedor) {
    throw new ErrorApi(404, "No se encontró un perfil de emprendedor para esta cuenta.")
  }
  return emprendedorParaFrontend(emprendedor)
}

/** Edita los únicos dos campos que el propio emprendedor puede cambiar desde su perfil. */
export async function editarMiPerfil(idUsuario: string, datos: { telefono?: string; programaAcademico?: string }) {
  const emprendedor = await prisma.emprendedor.update({ where: { idUsuario }, data: datos })
  return emprendedorParaFrontend(emprendedor)
}
