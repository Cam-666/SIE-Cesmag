/**
 * Casos: CP-CB-001 a CP-CB-010
 * Tipo: Unitaria – Caja blanca
 * Técnica: Análisis de complejidad ciclomática (V(G) = 10, caminos independientes)
 * Trazabilidad: RF-13 (Registro de usuarios administrativos) / HU-18
 * (Gestionar usuarios y permisos administrativos). Sostiene además la regla
 * de no escalada de privilegios de la ronda de seguridad de este proyecto.
 * Objetivo: Cubrir los 10 caminos independientes de `editarUsuario()` — ver
 * el grafo de flujo y V(G) en la respuesta de la Fase 5, la función con más
 * ramas de las 5 elegidas. Cada `if` anidado (autoprotección → existencia →
 * ámbito emprendedor → rol protegido → cambio de rol) se cubre con al menos
 * un caso que entra y uno que no.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"
import type { UsuarioAutenticado } from "@/types/express.d.ts"

vi.mock("@/lib/prisma.js", () => ({ prisma: mockDeep<PrismaClient>() }))
// usuarios.service.ts importa supabaseAdmin a nivel de módulo (lo usa
// eliminarUsuario, no editarUsuario) — sin mockearlo, cargar el archivo
// revienta por faltar las variables de entorno de Supabase.
vi.mock("@/lib/supabase.js", () => ({ supabaseAdmin: {} }))

import { prisma } from "@/lib/prisma.js"
import { editarUsuario } from "@/modules/usuarios-roles/usuarios.service.js"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const COORDINADOR: UsuarioAutenticado = {
  idUsuario: "u-coordinador",
  nombre: "Carlos Andrés Ruiz",
  correo: "coordinador@unicesmag.edu.co",
  idRol: 1,
  rolNombre: "Coordinador de Emprendimiento",
  ambito: "admin",
  permisos: [{ modulo: "usuarios-roles", acciones: ["ver", "anadir", "editar", "eliminar"] }],
}

const ADMINISTRATIVO: UsuarioAutenticado = {
  idUsuario: "u-administrativo",
  nombre: "María López",
  correo: "mlopez@unicesmag.edu.co",
  idRol: 3,
  rolNombre: "Administrativo",
  ambito: "admin",
  permisos: [{ modulo: "usuarios-roles", acciones: ["ver", "anadir", "editar"] }],
}

function usuarioActual(idUsuario: string, idRol: number, ambito: "admin" | "emprendedor" = "admin") {
  return { idUsuario, idRol, activo: true, rol: { idRol, ambito } }
}

function usuarioActualizado() {
  return {
    idUsuario: "u-objetivo",
    nombre: "Ana Gómez",
    correo: "agomez@unicesmag.edu.co",
    idRol: 3,
    activo: true,
    telefono: null,
    fechaCreacion: new Date("2026-02-10T00:00:00Z"),
    rol: {
      idRol: 3,
      nombre: "Administrativo",
      descripcion: "x",
      activo: true,
      ambito: "admin",
      fechaCreacion: new Date("2026-01-01T00:00:00Z"),
      permisos: [],
    },
  }
}

beforeEach(() => {
  mockReset(prismaMock)
  prismaMock.usuario.update.mockResolvedValue(usuarioActualizado() as never)
})

describe("editarUsuario — autoprotección (D1/D2/D3)", () => {
  it("CP-CB-001 (base) — admin edita a OTRO usuario, mismo rol: pasa derecho a actualizar", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-objetivo", 3) as never)

    await editarUsuario("u-objetivo", { idRol: 3, activo: true }, COORDINADOR)

    expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1)
  })

  it("CP-CB-002 — D1=sí, D2=no, D3=no: se edita a sí mismo sin desactivarse ni cambiar de rol", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual(COORDINADOR.idUsuario, 1) as never)

    await editarUsuario(COORDINADOR.idUsuario, { idRol: 1, activo: true }, COORDINADOR)

    expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1)
  })

  it("CP-CB-003 — D1=sí, D2=sí: intenta desactivarse a sí mismo → 400", async () => {
    await expect(editarUsuario(COORDINADOR.idUsuario, { idRol: 1, activo: false }, COORDINADOR)).rejects.toMatchObject({
      status: 400,
      message: "No puede desactivar su propia cuenta.",
    })
    expect(prismaMock.usuario.findUnique).not.toHaveBeenCalled()
  })

  it("CP-CB-004 — D1=sí, D2=no, D3=sí: intenta cambiar su propio rol → 400", async () => {
    await expect(editarUsuario(COORDINADOR.idUsuario, { idRol: 2, activo: true }, COORDINADOR)).rejects.toMatchObject({
      status: 400,
      message: "No puede cambiar su propio rol.",
    })
  })
})

describe("editarUsuario — existencia y ámbito (D4/D5)", () => {
  it("CP-CB-005 — D4=sí: el usuario no existe → 404", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null)

    await expect(editarUsuario("u-fantasma", { idRol: 3, activo: true }, COORDINADOR)).rejects.toMatchObject({
      status: 404,
      message: "Usuario no encontrado.",
    })
  })

  it("CP-CB-006 — D5a=sí, D5b=sí: intenta cambiar el rol de una cuenta de emprendedor → 400", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-emprendedor", 4, "emprendedor") as never)

    await expect(editarUsuario("u-emprendedor", { idRol: 3, activo: true }, COORDINADOR)).rejects.toMatchObject({
      status: 400,
      message: "No se puede cambiar el rol de una cuenta de emprendedor.",
    })
  })

  it("CP-CB-007 — D5a=sí, D5b=no: emprendedor, pero solo se activa/desactiva sin tocar el rol — pasa", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-emprendedor", 4, "emprendedor") as never)

    await editarUsuario("u-emprendedor", { idRol: 4, activo: false }, COORDINADOR)

    expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1)
  })
})

describe("editarUsuario — rol base protegido (D6/D7)", () => {
  it("CP-CB-008 — D6a=sí, D6b=sí: el objetivo tiene rol protegido y el actor no es Coordinador → 403", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-vicerrector", 2) as never)

    await expect(editarUsuario("u-vicerrector", { idRol: 2, activo: true }, ADMINISTRATIVO)).rejects.toMatchObject({
      status: 403,
      message: "Solo el Coordinador puede modificar a un usuario con rol base.",
    })
  })

  it("CP-CB-009 — D6a=sí, D6b=no: el objetivo tiene rol protegido, pero el actor SÍ es Coordinador → pasa", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-vicerrector", 2) as never)

    await editarUsuario("u-vicerrector", { idRol: 2, activo: true }, COORDINADOR)

    expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1)
  })
})

describe("editarUsuario — validación del nuevo rol (D8)", () => {
  it("CP-CB-010 — D8=sí: cambia de rol → se valida el rol nuevo asignable antes de guardar", async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(usuarioActual("u-objetivo", 3) as never)
    prismaMock.rol.findUnique.mockResolvedValue({
      idRol: 4,
      nombre: "Empleado",
      descripcion: "x",
      activo: true,
      ambito: "admin",
      fechaCreacion: new Date("2026-01-01T00:00:00Z"),
      permisos: [{ modulo: "usuarios_roles", puedeVer: true, puedeEditar: false, puedeAnadir: false, puedeEliminar: false }],
    } as never)

    await editarUsuario("u-objetivo", { idRol: 4, activo: true }, COORDINADOR)

    expect(prismaMock.rol.findUnique).toHaveBeenCalledWith({ where: { idRol: 4 }, include: { permisos: true } })
    expect(prismaMock.usuario.update).toHaveBeenCalledTimes(1)
  })
})
