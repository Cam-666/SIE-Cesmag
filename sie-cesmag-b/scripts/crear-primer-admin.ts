/**
 * Crea la primera cuenta de Coordinador de Emprendimiento. Necesaria una
 * sola vez: el coordinador crea a los demás usuarios administrativos, pero
 * el primero no tiene quién lo cree — este script rompe ese huevo-y-gallina.
 * Crea la cuenta directamente en Supabase Auth (con la contraseña que usted
 * elija, sin depender de que el envío de correos ya esté configurado) y su
 * fila correspondiente en USUARIO.
 *
 * Uso: pnpm bootstrap:admin <correo> "<nombre completo>" <contrasena>
 */
import "dotenv/config"
import { supabaseAdmin } from "../src/lib/supabase.js"
import { prisma } from "../src/lib/prisma.js"

async function main() {
  const [, , correo, nombre, contrasena] = process.argv
  if (!correo || !nombre || !contrasena) {
    console.error('Uso: pnpm bootstrap:admin <correo> "<nombre completo>" <contrasena>')
    process.exit(1)
  }
  if (contrasena.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.")
    process.exit(1)
  }

  const rolCoordinador = await prisma.rol.findUniqueOrThrow({
    where: { nombre: "Coordinador de Emprendimiento" },
  })

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: correo,
    password: contrasena,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw error ?? new Error("No se pudo crear el usuario en Supabase Auth.")
  }

  const usuario = await prisma.usuario.create({
    data: {
      idUsuario: data.user.id,
      nombre,
      correo,
      idRol: rolCoordinador.idRol,
    },
  })

  console.log(`Cuenta creada: ${usuario.nombre} <${usuario.correo}> — ${rolCoordinador.nombre}`)
  console.log("Ya puede iniciar sesión con esa contraseña.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
