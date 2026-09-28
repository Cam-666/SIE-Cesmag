import { createClient } from "@supabase/supabase-js"
import { useAuthStore } from "@/stores/auth-store"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente de Supabase para subir evidencia directo desde el navegador al
 * bucket privado `evidencias-entregables`. Las políticas RLS del bucket son
 * las que de verdad restringen qué puede subir/leer cada quien; la clave
 * "anon" es pública y segura de exponer en el frontend.
 *
 * No inicia sesión otra vez con supabase-js: reutiliza el token que ya
 * devolvió `/auth/login` (el mismo access_token de Supabase Auth, relayado
 * por el backend) como header `Authorization`, para que `auth.uid()`
 * resuelva igual dentro de las políticas RLS.
 */
function clienteStorage() {
  const token = useAuthStore.getState().sesion?.token
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  })
}

export const BUCKET_EVIDENCIAS = "evidencias-entregables"

/** Sube un archivo a la carpeta propia del usuario autenticado (exigido por la política RLS del bucket) y devuelve la ruta del objeto. */
export async function subirEvidencia(archivo: File): Promise<string> {
  const idUsuario = useAuthStore.getState().sesion?.idUsuario
  if (!idUsuario) {
    throw new Error("No hay una sesión activa.")
  }
  const ruta = `${idUsuario}/${Date.now()}-${archivo.name}`
  const { error } = await clienteStorage().storage.from(BUCKET_EVIDENCIAS).upload(ruta, archivo)
  if (error) {
    throw error
  }
  return ruta
}
