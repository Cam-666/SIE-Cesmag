/**
 * Casos: CP-CN-001
 * Tipo: Unitaria – Caja negra (prueba de infraestructura)
 * Técnica: Humo (smoke test)
 * Trazabilidad: N/A — valida que el entorno de pruebas del backend está operativo;
 * no corresponde a un requisito funcional puntual.
 * Objetivo: Confirmar que `crearApp()` se puede instanciar y responder peticiones
 * HTTP reales (vía Supertest) sin conectarse a Supabase ni a la base de datos real.
 * Prisma y Supabase se reemplazan por dobles de prueba — ninguna prueba de este
 * proyecto toca la base de datos real.
 */
import { describe, expect, it, vi } from "vitest"
import request from "supertest"

vi.mock("@prisma/client", () => ({
  ModuloAdmin: {
    dashboard: "dashboard",
    emprendimientos: "emprendimientos",
    asesorias: "asesorias",
    entregables: "entregables",
    reportes: "reportes",
    usuarios_roles: "usuarios_roles",
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}))
vi.mock("@/lib/prisma.js", () => ({ prisma: {} }))
vi.mock("@/lib/supabase.js", () => ({
  supabaseAdmin: { auth: { getUser: vi.fn(), signInWithPassword: vi.fn() } },
}))

import { crearApp } from "@/app.js"

describe("Prueba de humo del backend", () => {
  it("CP-CN-001 — GET /api/salud responde 200 sin sesión y sin base de datos", async () => {
    const respuesta = await request(crearApp()).get("/api/salud")

    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual({ ok: true })
  })
})
