import { delay, http, HttpResponse } from "msw"
import { NOTIFICACIONES_ADMIN, NOTIFICACIONES_EMPRENDEDOR } from "@/mocks/data/notificaciones"

/** El backend real resolvería el usuario desde el JWT; aquí se simula con el token de la cuenta demo. */
function listaPorToken(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? null
  return token === "mock-token-emprendedor" ? NOTIFICACIONES_EMPRENDEDOR : NOTIFICACIONES_ADMIN
}

export const notificacionHandlers = [
  http.get("/api/notificaciones", async ({ request }) => {
    await delay(300)
    const lista = listaPorToken(request)
    return HttpResponse.json(
      [...lista].sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()),
    )
  }),

  http.patch("/api/notificaciones/:id/leida", async ({ params, request }) => {
    await delay(200)
    const lista = listaPorToken(request)
    const notificacion = lista.find((n) => n.idNotificacion === Number(params.id))
    if (notificacion) notificacion.leido = true
    return new HttpResponse(null, { status: 204 })
  }),

  http.post("/api/notificaciones/marcar-todas-leidas", async ({ request }) => {
    await delay(200)
    const lista = listaPorToken(request)
    lista.forEach((n) => (n.leido = true))
    return new HttpResponse(null, { status: 204 })
  }),
]
