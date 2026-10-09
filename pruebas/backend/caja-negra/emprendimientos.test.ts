/**
 * Casos: CP-CN-001 a CP-CN-006
 * Tipo: Unitaria – Caja negra (endpoint HTTP, vía Supertest)
 * Técnica: Particiones de equivalencia (entrada válida / inválida / no
 * autorizada / recurso inexistente)
 * Trazabilidad: RF-09 (Consulta de información del emprendimiento) / HU-13.
 * RF-06 (Gestión del estado del emprendimiento) / HU-10.
 * Objetivo: Confirmar, contra la aplicación Express real (`crearApp()`, con
 * Prisma y Supabase reemplazados por dobles de prueba — nunca se toca la
 * base de datos), que el módulo de emprendimientos responde correctamente
 * a una petición sin sesión, una lista válida, un emprendimiento
 * inexistente y un cambio de estado con datos incompletos.
 *
 * Nota de numeración: cada archivo de la Fase 4 numera su propia secuencia
 * de `CP-CN-001` en adelante — son procesos de Vitest independientes del
 * módulo de pruebas del frontend (que ya usa ese rango). Se deja así mismo
 * que ya se avisó en la matriz de la Fase 2; si hace falta un prefijo que
 * los distinga al consolidar el informe final, se ajusta en ese momento.
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
    permisos: [{ modulo: "emprendimientos", acciones: ["ver", "anadir", "editar", "eliminar"] }],
  },
  "tok-administrativo": {
    idUsuario: "u-administrativo",
    nombre: "María López",
    correo: "mlopez@unicesmag.edu.co",
    idRol: 3,
    rolNombre: "Administrativo",
    ambito: "admin",
    // Permisos reales y acotados (ver prisma/seed.ts): sin "editar" emprendimientos.
    permisos: [{ modulo: "emprendimientos", acciones: ["ver"] }],
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

// El mock se crea DENTRO de la fábrica (no como una const externa): vi.mock
// se hoista por encima de cualquier variable de nivel superior del archivo,
// así que referenciar una ya creada afuera revienta con un error de
// inicialización. Después se reimporta "@/lib/prisma.js" (ya mockeado) para
// quedarse con una referencia usable en las pruebas.
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

beforeEach(() => {
  mockReset(prismaMock)
  // Alcance por etapa (responsables.service): sin etapas asignadas = sin restricción, como antes.
  prismaMock.etapa.findMany.mockResolvedValue([])
})

describe("GET /api/emprendimientos (RF-09/HU-13)", () => {
  it("CP-CN-001 — sin sesión responde 401 y no llega a tocar Prisma", async () => {
    const r = await request(app).get("/api/emprendimientos")

    expect(r.status).toBe(401)
    expect(prismaMock.emprendimiento.findMany).not.toHaveBeenCalled()
  })

  it("CP-CN-002 — entrada válida: con sesión y permiso, responde 200 con el listado", async () => {
    prismaMock.emprendimiento.findMany.mockResolvedValue([])

    const r = await request(app).get("/api/emprendimientos").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(200)
    expect(r.body).toEqual([])
  })

  it("CP-CN-003 — no autorizado: un Emprendedor no tiene acceso a este módulo administrativo", async () => {
    const r = await request(app).get("/api/emprendimientos").set(autorizacion(TOKEN_EMPRENDEDOR))

    expect(r.status).toBe(403)
  })
})

describe("GET /api/emprendimientos/:id (RF-09/HU-13)", () => {
  it("CP-CN-004 — recurso inexistente: responde 404 sin consultar la ruta metodológica", async () => {
    prismaMock.emprendimiento.findUnique.mockResolvedValue(null)

    const r = await request(app).get("/api/emprendimientos/9999").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(404)
    expect(r.body.message).toBe("Emprendimiento no encontrado.")
  })
})

describe("PATCH /api/emprendimientos/:id/estado (RF-06/HU-10)", () => {
  it("CP-CN-005 — entrada inválida: sin 'fechaCambio' (obligatorio) responde 400, sin tocar Prisma", async () => {
    const r = await request(app)
      .patch("/api/emprendimientos/1/estado")
      .set(autorizacion(TOKEN_COORDINADOR))
      .send({ estadoNuevo: "activo" })

    expect(r.status).toBe(400)
    expect(prismaMock.emprendimiento.update).not.toHaveBeenCalled()
  })

  it("CP-CN-006 — no autorizado: el Administrativo no tiene permiso 'editar' en este módulo", async () => {
    const r = await request(app)
      .patch("/api/emprendimientos/1/estado")
      .set(autorizacion(TOKEN_ADMINISTRATIVO))
      .send({ estadoNuevo: "activo", fechaCambio: "2026-10-07" })

    expect(r.status).toBe(403)
  })
})
