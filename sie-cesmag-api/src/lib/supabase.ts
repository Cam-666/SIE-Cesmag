import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env")
}

/**
 * Cliente de Supabase con la clave de servicio (`service_role`) — solo se
 * usa en el backend, nunca se expone al frontend. Sirve para Auth (crear
 * cuentas, generar enlaces de invitación/recuperación, verificar el token
 * de cada request) y, más adelante, para Storage (evidencias de entregables).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
