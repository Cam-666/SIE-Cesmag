import type { Emprendedor, PermisoRol, Rol, Usuario } from "@prisma/client"
import { permisoAFrontend } from "./modulos.js"

type RolConPermisos = Rol & { permisos: PermisoRol[] }

export function rolParaFrontend(rol: RolConPermisos) {
  return {
    idRol: rol.idRol,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    activo: rol.activo,
    ambito: rol.ambito as "admin" | "emprendedor",
    fechaCreacion: rol.fechaCreacion.toISOString(),
    permisos: rol.permisos.map(permisoAFrontend),
  }
}

type UsuarioConRol = Usuario & { rol: RolConPermisos }

export function usuarioParaFrontend(usuario: UsuarioConRol) {
  return {
    idUsuario: usuario.idUsuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    idRol: usuario.idRol,
    rol: rolParaFrontend(usuario.rol),
    activo: usuario.activo,
    fechaCreacion: usuario.fechaCreacion.toISOString(),
    telefono: usuario.telefono,
  }
}

/**
 * Entidad EMPRENDEDOR — el identificador público sigue siendo `idUsuario`
 * (todo integrante real ya tiene cuenta) aunque por dentro la llave primaria
 * real sea `idEmprendedor`.
 */
export function emprendedorParaFrontend(emprendedor: Emprendedor) {
  return {
    idUsuario: emprendedor.idUsuario,
    nombre: emprendedor.nombre,
    correo: emprendedor.correo,
    numeroIdentificacion: emprendedor.numeroIdentificacion,
    fechaNacimiento: emprendedor.fechaNacimiento ? emprendedor.fechaNacimiento.toISOString().slice(0, 10) : null,
    fechaRegistro: emprendedor.fechaRegistro.toISOString(),
    fechaActualizacion: emprendedor.fechaActualizacion ? emprendedor.fechaActualizacion.toISOString() : null,
    telefono: emprendedor.telefono,
    programaAcademico: emprendedor.programaAcademico,
    semestre: emprendedor.semestre,
    jornada: emprendedor.jornada,
  }
}
