import type { Emprendedor } from "@/domain/emprendedor/types"
import { persistir } from "@/mocks/storage"

/**
 * Perfil del emprendedor de la cuenta demo (Juan Sebastián Pérez, idUsuario 2,
 * integrante de EcoPack Solutions). Mutable para reflejar la edición de perfil.
 */
export const MI_PERFIL: Emprendedor = persistir("mi-perfil", {
  idUsuario: "2",
  nombre: "Juan Sebastián Pérez",
  correo: "jperez@unicesmag.edu.co",
  numeroIdentificacion: "1085123456",
  fechaNacimiento: "2001-04-12",
  fechaRegistro: "2026-01-10T00:00:00",
  fechaActualizacion: null,
  telefono: "300 000 0000",
  programaAcademico: "Administración de Empresas",
  semestre: 8,
  jornada: "Diurna",
  usuario: {
    idUsuario: 2,
    nombre: "Juan Sebastián Pérez",
    correo: "jperez@unicesmag.edu.co",
    idRol: 4,
    activo: true,
    fechaCreacion: "2026-01-10T00:00:00",
  },
})

/** idEmprendimiento del emprendimiento asociado a la cuenta demo del emprendedor. */
export const MI_ID_EMPRENDIMIENTO = 124
