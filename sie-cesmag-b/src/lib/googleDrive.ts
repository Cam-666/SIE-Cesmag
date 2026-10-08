import { google } from "googleapis"
import { Readable } from "stream"

/**
 * Almacenamiento de evidencias en Google Drive (reemplazo de Supabase
 * Storage, a pedido del profesor evaluador) — todo queda en la cuenta
 * institucional `unidademprendimiento2026@gmail.com`, organizado como
 * Entregables SIE CESMAG / <emprendimiento> / <etapa> / <fase> / archivo.
 *
 * Autenticación por OAuth2 con un refresh token de un solo uso (no hay
 * cuenta de Google Workspace, así que no se puede usar una cuenta de
 * servicio con delegación de dominio): `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
 * identifican la app, `GOOGLE_REFRESH_TOKEN` es el permiso ya otorgado por
 * esa cuenta una sola vez — el cliente renueva el access token solo, sin
 * volver a pedir consentimiento.
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

const drive = google.drive({ version: "v3", auth: oauth2Client })

const NOMBRE_CARPETA_RAIZ = "Entregables SIE CESMAG"

/** Busca una subcarpeta por nombre dentro de `idPadre` (o en la raíz de Mi unidad si no se indica); la crea si no existe. */
async function obtenerOCrearCarpeta(nombre: string, idPadre?: string): Promise<string> {
  const nombreEscapado = nombre.replace(/'/g, "\\'")
  const condicionPadre = idPadre ? `and '${idPadre}' in parents` : "and 'root' in parents"
  const consulta = `mimeType = 'application/vnd.google-apps.folder' and name = '${nombreEscapado}' and trashed = false ${condicionPadre}`

  const { data } = await drive.files.list({
    q: consulta,
    fields: "files(id, name)",
    spaces: "drive",
  })
  const existente = data.files?.[0]
  if (existente?.id) return existente.id

  const { data: creada } = await drive.files.create({
    requestBody: {
      name: nombre,
      mimeType: "application/vnd.google-apps.folder",
      parents: idPadre ? [idPadre] : undefined,
    },
    fields: "id",
  })
  if (!creada.id) throw new Error("No se pudo crear la carpeta en Drive.")
  return creada.id
}

/**
 * Resuelve (creando lo que haga falta) la ruta de carpetas de un entregable:
 * Entregables SIE CESMAG / <emprendimiento> / <etapa> / <fase>. Se vuelve a
 * resolver en cada subida en vez de cachear los IDs — el costo de 4
 * búsquedas es insignificante frente a la subida del archivo en sí, y evita
 * tener que invalidar una caché si alguien renombra algo.
 */
export async function resolverCarpetaEntregable(
  nombreEmprendimiento: string,
  nombreEtapa: string,
  nombreFase: string,
): Promise<string> {
  const raiz = await obtenerOCrearCarpeta(NOMBRE_CARPETA_RAIZ)
  const carpetaEmprendimiento = await obtenerOCrearCarpeta(nombreEmprendimiento, raiz)
  const carpetaEtapa = await obtenerOCrearCarpeta(nombreEtapa, carpetaEmprendimiento)
  return obtenerOCrearCarpeta(nombreFase, carpetaEtapa)
}

/**
 * Sube un archivo a la carpeta indicada y lo deja visible por enlace (sin
 * necesidad de iniciar sesión en Drive para verlo, igual que el acceso que
 * ya tenía vía URL firmada de Supabase) — pero nunca listado públicamente,
 * solo quien tenga el enlace exacto guardado en la base de datos.
 */
export async function subirArchivoADrive(
  buffer: Buffer,
  nombreArchivo: string,
  mimeType: string,
  idCarpeta: string,
): Promise<{ idArchivo: string; enlaceVisualizacion: string }> {
  const { data: archivo } = await drive.files.create({
    requestBody: { name: nombreArchivo, parents: [idCarpeta] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  })
  if (!archivo.id) throw new Error("No se pudo subir el archivo a Drive.")

  await drive.permissions.create({
    fileId: archivo.id,
    requestBody: { role: "reader", type: "anyone" },
  })

  // Pedir de nuevo el enlace: al crear, `webViewLink` a veces viene vacío
  // hasta que el permiso de lectura ya está aplicado.
  const { data: actualizado } = await drive.files.get({ fileId: archivo.id, fields: "webViewLink" })
  if (!actualizado.webViewLink) throw new Error("Drive no devolvió el enlace de visualización.")

  return { idArchivo: archivo.id, enlaceVisualizacion: actualizado.webViewLink }
}

/** Borra un archivo de Drive — usado al retractar una entrega pendiente (RF-28, botón "Borrar entrega"). */
export async function eliminarArchivoDeDrive(idArchivo: string): Promise<void> {
  await drive.files.delete({ fileId: idArchivo })
}
