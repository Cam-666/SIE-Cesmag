/**
 * Casos: CP-CN-053 a CP-CN-060
 * Tipo: Unitaria – Caja negra
 * Técnica: Particiones de equivalencia
 * Trazabilidad: RF-15 (Gestión de roles y permisos) / HU-18 — `tienePermiso`
 * y `ACCIONES_DISPONIBLES_POR_MODULO`. RF-14 (Autenticación de usuarios) /
 * HU-17 (Acceder al sistema según las responsabilidades asignadas) —
 * `rutaPortal`, que decide a qué portal entra cada rol tras iniciar sesión.
 * Objetivo: Validar que el control de acceso por módulo/acción distingue
 * correctamente "sin permisos", "módulo distinto" y "acción distinta" de la
 * coincidencia real, que la matriz de acciones disponibles por módulo
 * refleja las reglas de negocio documentadas (Dashboard y Reportes de solo
 * lectura, Entregables sin eliminación), y que el enrutamiento por rol es
 * una función total de dos valores (admin / emprendedor).
 */
import { describe, expect, it } from "vitest"
import { rutaPortal } from "@/domain/auth/rutas"
import { ACCIONES_DISPONIBLES_POR_MODULO, IDS_ROL_PROTEGIDO } from "@/domain/usuario/display"
import { tienePermiso } from "@/domain/usuario/permisos"
import type { PermisoModulo } from "@/domain/usuario/types"

const permisos: PermisoModulo[] = [{ modulo: "emprendimientos", acciones: ["ver", "anadir"] }]

describe("tienePermiso (RF-15/HU-18)", () => {
  it("CP-CN-053 — sin ningún permiso asignado: false", () => {
    expect(tienePermiso([], "emprendimientos", "ver")).toBe(false)
  })

  it("CP-CN-054 — el módulo solicitado no está en la lista de permisos: false", () => {
    expect(tienePermiso(permisos, "usuarios-roles", "ver")).toBe(false)
  })

  it("CP-CN-055 — el módulo está, pero no la acción solicitada: false", () => {
    expect(tienePermiso(permisos, "emprendimientos", "eliminar")).toBe(false)
  })

  it("CP-CN-056 — módulo y acción coinciden exactamente: true", () => {
    expect(tienePermiso(permisos, "emprendimientos", "anadir")).toBe(true)
  })
})

describe("ACCIONES_DISPONIBLES_POR_MODULO (RF-15/HU-18)", () => {
  it("CP-CN-057 — Dashboard y Reportes son de solo lectura (sin añadir/editar/eliminar)", () => {
    expect(ACCIONES_DISPONIBLES_POR_MODULO.dashboard).toEqual(["ver"])
    expect(ACCIONES_DISPONIBLES_POR_MODULO.reportes).toEqual(["ver"])
  })

  it("CP-CN-058 — Entregables no ofrece eliminación real (un rechazo se reintenta, no se borra)", () => {
    expect(ACCIONES_DISPONIBLES_POR_MODULO.entregables).not.toContain("eliminar")
  })

  it("CP-CN-059 — Coordinador y Vicerrector son los roles protegidos", () => {
    expect(IDS_ROL_PROTEGIDO).toEqual([1, 2])
  })
})

describe("rutaPortal (RF-14/HU-17)", () => {
  it("CP-CN-060 — ámbito admin va a /admin; cualquier otro ámbito va a /emprendedor", () => {
    expect(rutaPortal("admin")).toBe("/admin")
    expect(rutaPortal("emprendedor")).toBe("/emprendedor")
  })
})
