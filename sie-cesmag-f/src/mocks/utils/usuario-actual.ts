import { USUARIOS } from "@/mocks/data/usuarios"

/**
 * El backend real resolvería el usuario administrativo desde el JWT; aquí
 * se simula con el token de la cuenta demo. Compartido por los handlers que
 * necesitan saber "quién soy" (mi perfil, mi agenda, crear asesoría).
 */
const IDUSUARIO_POR_TOKEN: Record<string, number> = {
  "mock-token-admin": 1,
  "mock-token-empleado": 4,
}

export function idUsuarioActual(request: Request): number {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
  return IDUSUARIO_POR_TOKEN[token] ?? 1
}

export function usuarioActual(request: Request) {
  const idUsuario = idUsuarioActual(request)
  return USUARIOS.find((u) => u.idUsuario === idUsuario) ?? USUARIOS[0]
}
