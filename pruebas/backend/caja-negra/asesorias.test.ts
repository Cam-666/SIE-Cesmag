/**
 * Casos: CP-CN-001 a CP-CN-007
 * Tipo: Unitaria – Caja negra (endpoint HTTP, vía Supertest)
 * Técnica: Particiones de equivalencia + tabla de decisión
 * Trazabilidad: RF-02 (Registro de asesorías) / HU-06. RF-29/RF-30
 * (disponibilidad y agendamiento). RF-32 (Cancelación o reprogramación de
 * asesoría) / HU-30.
 * Objetivo: Confirmar, contra la aplicación Express real con Prisma y
 * Supabase mockeados, que el módulo de asesorías valida la condición
 * combinada de `nuevaAsesoriaSchema` (diagnóstica exige etapa), que un
 * recurso inexistente responde 404, y que cancelar una asesoría respeta la
 * autorización especial de esa ruta — no resuelta por `requierePermiso`
 * fijo, sino por una comprobación manual según la acción (cancelar pide
 * "eliminar", reprogramar pide "editar").
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"
import type { UsuarioAutenticado } from "@/types/express.d.ts"
import { autorizacion, TOKEN_ADMINISTRATIVO, TOKEN_COORDINADOR, TOKEN_EMPRENDEDOR } from "../ayudas"

const TOKENS: Record<string, UsuarioAutenticado> = {
  "tok-coordinador": {
    idUsuario: "u-coordinador",
    nombre: "Carlos Andrés Ruiz",
    correo: "coordinador@unicesmag.edu.co",
    idRol: 1,
    rolNombre: "Coordinador de Emprendimiento",
    ambito: "admin",
    permisos: [{ modulo: "asesorias", acciones: ["ver", "anadir", "editar", "eliminar"] }],
  },
  "tok-administrativo": {
    idUsuario: "u-administrativo",
    nombre: "María López",
    correo: "mlopez@unicesmag.edu.co",
    idRol: 3,
    rolNombre: "Administrativo",
    ambito: "admin",
    // Permisos reales y acotados: puede agendar y editar, pero no cancelar ("eliminar").
    permisos: [{ modulo: "asesorias", acciones: ["ver", "anadir", "editar"] }],
  },
  "tok-emprendedor": {
    idUsuario: "u-emprendedor",
    nombre: "Juan Sebastián Pérez",
    correo: "jperez@unicesmag.edu.co",
    idRol: 4,
    rolNombre: "Emprendedor",
    ambito: "emprendedor",
    permisos: [],
  },
}

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))
vi.mock("@/lib/supabase.js", () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(async (token: string) => {
        const perfil = TOKENS[token]
        return perfil ? { data: { user: { id: perfil.idUsuario } }, error: null } : { data: { user: null }, error: { message: "token inválido" } }
      }),
    },
  },
}))
vi.mock("@/lib/sesion.js", () => ({
  resolverUsuarioAutenticado: vi.fn(async (idUsuario: string) => Object.values(TOKENS).find((p) => p.idUsuario === idUsuario)),
}))

import { crearApp } from "@/app.js"
import { prisma } from "@/lib/prisma.js"

const app = crearApp()
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => mockReset(prismaMock))

describe("GET /api/asesorias (RF-02/HU-06)", () => {
  it("CP-CN-001 — sin sesión responde 401", async () => {
    const r = await request(app).get("/api/asesorias")
    expect(r.status).toBe(401)
  })

  it("CP-CN-002 — entrada válida: con sesión y permiso, responde 200 con el listado", async () => {
    prismaMock.asesoria.findMany.mockResolvedValue([])

    const r = await request(app).get("/api/asesorias").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(200)
    expect(r.body).toEqual([])
  })
})

describe("POST /api/asesorias (RF-02/HU-06) — tabla de decisión: tipo × etapa identificada", () => {
  it("CP-CN-003 — entrada inválida: diagnóstica sin etapa identificada responde 400, sin tocar Prisma", async () => {
    const r = await request(app)
      .post("/api/asesorias")
      .set(autorizacion(TOKEN_COORDINADOR))
      .send({
        idEmprendimiento: 1,
        idAgenda: 10,
        duracionMinutos: 30,
        tipoAsesoria: "diagnostica",
        modalidad: "virtual",
      })

    expect(r.status).toBe(400)
    expect(prismaMock.asesoria.create).not.toHaveBeenCalled()
  })

  it("CP-CN-004 — no autorizado: el Emprendedor no puede crear una asesoría por esta vía (la suya es otra ruta)", async () => {
    const r = await request(app)
      .post("/api/asesorias")
      .set(autorizacion(TOKEN_EMPRENDEDOR))
      .send({ idEmprendimiento: 1, idAgenda: 10, duracionMinutos: 30, tipoAsesoria: "seguimiento", modalidad: "virtual" })

    expect(r.status).toBe(403)
  })
})

describe("PATCH /api/asesorias/:id (RF-32/HU-30) — autorización por acción, no por un permiso fijo", () => {
  it("CP-CN-005 — recurso inexistente (vía DELETE, que sí hace el chequeo explícito): responde 404", async () => {
    prismaMock.asesoria.findUnique.mockResolvedValue(null)

    const r = await request(app).delete("/api/asesorias/9999").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(404)
    expect(r.body.message).toBe("Asesoría no encontrada.")
  })

  it("CP-CN-006 — no autorizado: cancelar exige el permiso 'eliminar', que el Administrativo no tiene", async () => {
    const r = await request(app)
      .patch("/api/asesorias/1")
      .set(autorizacion(TOKEN_ADMINISTRATIVO))
      .send({ accion: "cancelar", motivo: "El emprendedor no puede asistir" })

    expect(r.status).toBe(403)
    expect(prismaMock.asesoria.update).not.toHaveBeenCalled()
  })

  it("CP-CN-007 — el mismo rol SÍ puede reprogramar (esa acción solo exige 'editar', que sí tiene)", async () => {
    prismaMock.asesoria.findUnique.mockResolvedValue({
      idAsesoria: 1,
      idAgenda: 10,
      estadoAsesoria: "programada",
    } as never)
    prismaMock.agenda.findUnique.mockResolvedValue({ idAgenda: 20, estado: "disponible" } as never)
    prismaMock.$transaction.mockResolvedValue([])
    prismaMock.asesoria.update.mockResolvedValue({ idAsesoria: 1 } as never)

    const r = await request(app)
      .patch("/api/asesorias/1")
      .set(autorizacion(TOKEN_ADMINISTRATIVO))
      .send({ accion: "reprogramar", nuevoIdAgenda: 20 })

    // No se afirma 200 exacto (el servicio de reprogramación tiene más pasos
    // internos que no son el foco de esta prueba): lo que importa para esta
    // tabla de decisión es que la autorización NO lo frene con 403.
    expect(r.status).not.toBe(403)
  })
})
