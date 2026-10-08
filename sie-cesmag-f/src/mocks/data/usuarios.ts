import { ACCIONES_DISPONIBLES_POR_MODULO, MODULOS_ADMIN } from "@/domain/usuario/display"
import type { Rol, Usuario } from "@/domain/usuario/types"
import { persistir } from "@/mocks/storage"

/**
 * idRol coincide con las cuentas demo de `mocks/handlers/auth.ts`
 * (idRol 1 = Coordinador, idRol 4 = Emprendedor).
 */
export const ROLES: Rol[] = persistir("roles", [
  {
    idRol: 1,
    nombre: "Coordinador de Emprendimiento",
    descripcion: "Gestiona el acompañamiento completo de los emprendimientos y administra la Unidad.",
    activo: true,
    ambito: "admin",
    permisos: MODULOS_ADMIN.map((modulo) => ({
      modulo,
      acciones: [...ACCIONES_DISPONIBLES_POR_MODULO[modulo]],
    })),
    fechaCreacion: "2026-01-01T00:00:00",
  },
  {
    idRol: 2,
    nombre: "Vicerrector de Investigación",
    descripcion: "Supervisión institucional de la Unidad de Emprendimiento e Innovación.",
    activo: true,
    ambito: "admin",
    permisos: MODULOS_ADMIN.map((modulo) => ({
      modulo,
      acciones: [...ACCIONES_DISPONIBLES_POR_MODULO[modulo]],
    })),
    fechaCreacion: "2026-01-01T00:00:00",
  },
  {
    idRol: 3,
    nombre: "Administrativo",
    descripcion: "Acompañamiento operativo: seguimiento de asesorías y entregables asignados.",
    activo: true,
    ambito: "admin",
    permisos: [
      { modulo: "dashboard", acciones: ["ver"] },
      { modulo: "emprendimientos", acciones: ["ver", "editar"] },
      { modulo: "asesorias", acciones: ["ver", "editar", "anadir"] },
      { modulo: "entregables", acciones: ["ver", "editar"] },
      { modulo: "reportes", acciones: ["ver"] },
      { modulo: "usuarios-roles", acciones: [] },
    ],
    fechaCreacion: "2026-01-01T00:00:00",
  },
  {
    idRol: 4,
    nombre: "Emprendedor",
    descripcion: "Portal propio del emprendedor: consulta de su proceso y carga de entregables.",
    activo: true,
    ambito: "emprendedor",
    permisos: [],
    fechaCreacion: "2026-01-01T00:00:00",
  },
])

export const USUARIOS: Usuario[] = persistir("usuarios", [
  {
    idUsuario: 1,
    nombre: "Carlos Andrés Ruiz",
    correo: "coordinador@unicesmag.edu.co",
    idRol: 1,
    activo: true,
    fechaCreacion: "2026-01-05T00:00:00",
  },
  {
    idUsuario: 3,
    nombre: "Fernando Ortega",
    correo: "fortega@unicesmag.edu.co",
    idRol: 2,
    activo: true,
    fechaCreacion: "2026-01-05T00:00:00",
  },
  {
    idUsuario: 4,
    nombre: "María López",
    correo: "mlopez@unicesmag.edu.co",
    idRol: 3,
    activo: true,
    fechaCreacion: "2026-01-20T00:00:00",
  },
  {
    idUsuario: 5,
    nombre: "Ana Gómez",
    correo: "agomez@unicesmag.edu.co",
    idRol: 3,
    activo: true,
    fechaCreacion: "2026-02-10T00:00:00",
  },
  {
    idUsuario: 6,
    nombre: "Laura Valentina Martínez",
    correo: "lvmartinez@unicesmag.edu.co",
    idRol: 3,
    activo: false,
    fechaCreacion: "2026-02-15T00:00:00",
  },
])

/** Responsable inicial por etapa (Manual Operativo, 3 etapas). */
export const RESPONSABLES_ETAPA: { idEtapa: number; idUsuario: number | null }[] = persistir(
  "responsables-etapa",
  [
    { idEtapa: 1, idUsuario: 4 },
    { idEtapa: 2, idUsuario: 5 },
    { idEtapa: 3, idUsuario: null },
  ],
)
