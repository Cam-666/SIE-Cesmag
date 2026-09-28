import { subirEvidencia } from "@/lib/supabase-storage"

/**
 * Sube la evidencia directo al bucket privado de Supabase Storage desde el
 * navegador (ver `lib/supabase-storage.ts`): el archivo nunca pasa por el
 * backend propio, solo se guarda la ruta resultante.
 */
export async function subirArchivoANube(archivo: File): Promise<string> {
  return subirEvidencia(archivo)
}
