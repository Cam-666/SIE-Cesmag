/**
 * Script de un solo uso para obtener el GOOGLE_REFRESH_TOKEN de la cuenta
 * institucional (unidademprendimiento2026@gmail.com) — se corre una sola
 * vez, nunca en producción. Requiere GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET
 * ya puestos en .env (del ID de cliente de OAuth tipo "Aplicación de
 * escritorio" creado en Google Cloud Console).
 *
 * Uso:
 *   1. pnpm exec tsx scripts/obtener-refresh-token-drive.ts
 *   2. Abrir el enlace que imprime, iniciar sesión con la cuenta
 *      unidademprendimiento2026@gmail.com y aceptar el permiso.
 *   3. Google redirige a una URL localhost que da error de "no se puede
 *      acceder a este sitio" — es normal, no hay servidor escuchando ahí.
 *      Copiar el valor del parámetro "code" de esa URL (todo lo que sigue a
 *      "code=" y antes de cualquier "&") y pegarlo cuando el script lo pida.
 *   4. El script imprime el refresh token — copiarlo a GOOGLE_REFRESH_TOKEN
 *      en .env (local) y en las variables de entorno de Railway.
 */
import "dotenv/config"
import { google } from "googleapis"
import { createInterface } from "readline/promises"

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET en .env")
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "http://localhost:3000/oauth2callback")

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  })

  console.log("\nAbra este enlace, inicie sesión con unidademprendimiento2026@gmail.com y acepte el permiso:\n")
  console.log(url)
  console.log("\nLa página redirige a localhost y da error — es normal, copie el 'code' de esa URL.\n")

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const code = await rl.question("Pegue aquí el código: ")
  rl.close()

  const { tokens } = await oauth2Client.getToken(code.trim())
  console.log("\n--- Listo ---")
  console.log("GOOGLE_REFRESH_TOKEN:", tokens.refresh_token)
}

main().catch((e) => {
  console.error("ERROR:", e)
  process.exit(1)
})
