/**
 * Casos: CP-CN-001 a CP-CN-008
 * Tipo: Unitaria – Caja negra (endpoint HTTP, vía Supertest)
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-13 (Registro de usuarios administrativos) / HU-18.
 * RF-15 (Gestión de roles y permisos) / HU-18.
 * Objetivo: Confirmar, contra la aplicación Express real con Prisma y
 * Supabase mockeados, los 4 casos de esta fase sobre el módulo más sensible
 * del sistema — además de entrada válida/inválida/recurso inexistente, la
 * categoría "no autorizado" incluye aquí la regla de no escalada de
 * privilegios que se construyó en la ronda de seguridad de este proyecto
 * (`src/lib/escalada.ts`): nadie puede asignar un rol o conceder permisos
 * que no tiene.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"
import type { UsuarioAutenticado } from "@/types/express.d.ts"
import { autorizacion, TOKEN_COORDINADOR } from "../ayudas"

const TOKEN_ADMINISTRATIVO_LIMITADO = "tok-administrativo-limitado"

const TOKENS: Record<string, UsuarioAutenticado> = {
  "tok-coordinador": {
    idUsuario: "u-coordinador",
    nombre: "Carlos Andrés Ruiz",
    correo: "coordinador@unicesmag.edu.co",
    idRol: 1,
    rolNombre: "Coordinador de Emprendimiento",
    ambito: "admin",
    permisos: [{ modulo: "usuarios-roles", acciones: ["ver", "anadir", "editar", "eliminar"] }],
  },
  [TOKEN_ADMINISTRATIVO_LIMITADO]: {
    idUsuario: "u-administrativo",
    nombre: "María López",
    correo: "mlopez@unicesmag.edu.co",
    idRol: 3,
    rolNombre: "Administrativo",
    ambito: "admin",
    // Puede administrar usuarios y roles, pero solo con lo que él mismo tiene: ningún permiso sobre asesorías.
    permisos: [{ modulo: "usuarios-roles", acciones: ["ver", "anadir", "editar"] }],
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

describe("GET /api/usuarios (RF-13/HU-18)", () => {
  it("CP-CN-001 — sin sesión responde 401", async () => {
    const r = await request(app).get("/api/usuarios")
    expect(r.status).toBe(401)
  })

  it("CP-CN-002 — entrada válida: con sesión y permiso, responde 200 con el listado", async () => {
    prismaMock.usuario.findMany.mockResolvedValue([])

    const r = await request(app).get("/api/usuarios").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(200)
    expect(r.body).toEqual([])
  })
})

describe("POST /api/usuarios (RF-13/HU-18)", () => {
  it("CP-CN-003 — entrada inválida: correo mal formado responde 400, sin tocar Prisma", async () => {
    const r = await request(app)
      .post("/api/usuarios")
      .set(autorizacion(TOKEN_COORDINADOR))
      .send({ nombre: "Ana", correo: "mal-formado", idRol: 3 })

    expect(r.status).toBe(400)
    expect(prismaMock.usuario.create).not.toHaveBeenCalled()
  })

  it("CP-CN-004 — no autorizado por ESCALADA: un Administrativo no puede asignar el rol Coordinador (rol base)", async () => {
    prismaMock.rol.findUnique.mockResolvedValue({
      idRol: 1,
      nombre: "Coordinador de Emprendimiento",
      ambito: "admin",
      permisos: [{ modulo: "usuarios_roles", puedeVer: true, puedeEditar: true, puedeAnadir: true, puedeEliminar: true }],
    } as never)

    const r = await request(app)
      .post("/api/usuarios")
      .set(autorizacion(TOKEN_ADMINISTRATIVO_LIMITADO))
      .send({ nombre: "Ana", correo: "ana@unicesmag.edu.co", idRol: 1 })

    expect(r.status).toBe(403)
    expect(r.body.message).toBe("Solo el Coordinador puede asignar los roles base.")
  })
})

describe("PATCH /api/roles/:id (RF-15/HU-18)", () => {
  it("CP-CN-005 — no autorizado por ESCALADA: no se puede conceder un permiso que quien lo concede no tiene", async () => {
    const r = await request(app)
      .patch("/api/roles/5")
      .set(autorizacion(TOKEN_ADMINISTRATIVO_LIMITADO))
      .send({ nombre: "Administrativo", descripcion: "x", permisos: [{ modulo: "asesorias", acciones: ["eliminar"] }] })

    expect(r.status).toBe(403)
    expect(r.body.message).toBe("No puede asignar permisos que usted no tiene.")
    expect(prismaMock.rol.update).not.toHaveBeenCalled()
  })

  it("CP-CN-006 — no autorizado: nadie salvo el Coordinador puede modificar un rol base", async () => {
    const r = await request(app)
      .patch("/api/roles/1")
      .set(autorizacion(TOKEN_ADMINISTRATIVO_LIMITADO))
      .send({ nombre: "X", descripcion: "x", permisos: [] })

    expect(r.status).toBe(403)
    expect(r.body.message).toBe("Solo el Coordinador puede modificar los roles base.")
  })
})

describe("DELETE /api/roles/:id (RF-15/HU-18)", () => {
  it("CP-CN-007 — recurso inexistente: responde 404", async () => {
    prismaMock.rol.findUnique.mockResolvedValue(null)

    const r = await request(app).delete("/api/roles/9999").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(404)
    expect(r.body.message).toBe("Rol no encontrado.")
  })

  it("CP-CN-008 — entrada inválida: el rol de Coordinador o Vicerrector nunca se puede eliminar", async () => {
    const r = await request(app).delete("/api/roles/1").set(autorizacion(TOKEN_COORDINADOR))

    expect(r.status).toBe(400)
    expect(r.body.message).toBe("El rol de Coordinador o Vicerrector no se puede eliminar.")
    expect(prismaMock.rol.findUnique).not.toHaveBeenCalled()
  })
})
