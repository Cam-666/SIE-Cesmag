/**
 * Casos: CP-CN-001 a CP-CN-007
 * Tipo: Unitaria – Caja negra (endpoint HTTP, vía Supertest)
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-03 (Registro de actividades, entregables y evidencias) /
 * HU-07. RF-04 (Consulta y actualización del estado de actividades y
 * entregables) / HU-08.
 * Objetivo: Confirmar, contra la aplicación Express real con Prisma y
 * Supabase mockeados, los 4 casos que pide esta fase: entrada válida
 * (listado), entrada inválida (título vacío), no autorizado — en dos
 * sentidos distintos: por la matriz de permisos del portal admin, y por
 * propiedad en el portal del emprendedor (un emprendedor no puede ver el
 * entregable de OTRO emprendimiento, aunque tenga sesión válida) — y
 * recurso inexistente.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"
import type { UsuarioAutenticado } from "@/types/express.d.ts"
import { autorizacion, TOKEN_COORDINADOR, TOKEN_EMPRENDEDOR } from "../ayudas"

const TOKENS: Record<string, UsuarioAutenticado> = {
  "tok-coordinador": {
    idUsuario: "u-coordinador",
    nombre: "Carlos Andrés Ruiz",
    correo: "coordinador@unicesmag.edu.co",
    idRol: 1,
    rolNombre: "Coordinador de Emprendimiento",
    ambito: "admin",
    permisos: [{ modulo: "entregables", acciones: ["ver", "anadir", "editar"] }],
  },
  "tok-empleado-sin-ver": {
    idUsuario: "u-empleado",
    nombre: "Ana Gómez",
    correo: "agomez@unicesmag.edu.co",
    idRol: 3,
    rolNombre: "Administrativo",
    ambito: "admin",
    // A propósito sin "ver" en entregables, para la prueba de no-autorizado del lado admin.
    permisos: [{ modulo: "entregables", acciones: [] }],
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

describe("GET /api/entregables (RF-04/HU-08)", () => {
  it("CP-CN-001 — entrada válida: con sesión y permiso, responde 200 con el listado", async () => {
    prismaMock.entregable.findMany.mockResolvedValue([])

    const r = await request(app).get("/api/entregables").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(200)
    expect(r.body).toEqual([])
  })

  it("CP-CN-002 — no autorizado: un administrativo sin el permiso 'ver' en este módulo no puede listar", async () => {
    const r = await request(app).get("/api/entregables").set(autorizacion("tok-empleado-sin-ver"))

    expect(r.status).toBe(403)
    expect(prismaMock.entregable.findMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/entregables (RF-03/HU-07)", () => {
  it("CP-CN-003 — entrada inválida: título vacío responde 400, sin tocar Prisma", async () => {
    const r = await request(app)
      .post("/api/entregables")
      .set(autorizacion(TOKEN_COORDINADOR))
      .send({ idEmprendimiento: 1, idFase: 1, titulo: "", descripcion: "x", fechaPrevista: "2026-11-01" })

    expect(r.status).toBe(400)
    expect(prismaMock.entregable.create).not.toHaveBeenCalled()
  })
})

describe("GET /api/entregables/:id (RF-04/HU-08)", () => {
  it("CP-CN-004 — recurso inexistente: responde 404", async () => {
    prismaMock.entregable.findUnique.mockResolvedValue(null)

    const r = await request(app).get("/api/entregables/9999").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(404)
    expect(r.body.message).toBe("Entregable no encontrado.")
  })

  it("CP-CN-005 — no autorizado por PROPIEDAD: el emprendedor no puede ver el entregable de OTRO emprendimiento", async () => {
    // El emprendedor autenticado pertenece al emprendimiento 10...
    prismaMock.emprendedor.findUnique.mockResolvedValue({ idEmprendedor: 1, idUsuario: "u-emprendedor" } as never)
    prismaMock.emprendedorEmprendimiento.findFirst.mockResolvedValue({ idEmprendimiento: 10, idEmprendedor: 1 } as never)
    // ...pero el entregable solicitado es del emprendimiento 999.
    prismaMock.entregable.findUnique.mockResolvedValue({
      idEntregable: 99,
      emprendimientoFase: { idEmprendimiento: 999 },
    } as never)

    const r = await request(app).get("/api/entregables/99").set(autorizacion(TOKEN_EMPRENDEDOR))

    expect(r.status).toBe(403)
    expect(r.body.message).toBe("No tiene permiso para acceder a este entregable.")
  })
})

describe("PATCH /api/entregables/:id/revision (RF-04/HU-08)", () => {
  it("CP-CN-006 — entrada inválida: rechazar sin observaciones responde 400", async () => {
    const r = await request(app)
      .patch("/api/entregables/1/revision")
      .set(autorizacion(TOKEN_COORDINADOR))
      .send({ decision: "rechazado" })

    expect(r.status).toBe(400)
  })

  it("CP-CN-007 — no autorizado: el emprendedor (ámbito distinto, sin matriz de permisos) no puede revisar", async () => {
    const r = await request(app)
      .patch("/api/entregables/1/revision")
      .set(autorizacion(TOKEN_EMPRENDEDOR))
      .send({ decision: "aprobado" })

    expect(r.status).toBe(403)
  })
})
