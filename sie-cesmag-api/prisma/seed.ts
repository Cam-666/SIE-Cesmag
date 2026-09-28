/**
 * Datos base (catálogo), no datos de ejemplo/demo — sin esto el sistema no
 * puede operar: los roles con sus permisos, las 3 etapas y 12 fases de la
 * ruta metodológica (Manual Operativo v2.0), y las 26 preguntas del
 * formulario de caracterización con su `codigo` estable (los usa tanto
 * `vista_caracterizacion` como el servicio que aprueba precandidatos).
 *
 * Ejecutar con `pnpm prisma:seed` (o automáticamente tras `prisma migrate dev`).
 * Es idempotente: se puede correr varias veces sin duplicar filas.
 */
import { PrismaClient, ModuloAdmin, TipoPregunta } from "@prisma/client"

const prisma = new PrismaClient()

// ============================================================
// ROLES + PERMISOS
// ============================================================

const MODULOS: ModuloAdmin[] = [
  ModuloAdmin.dashboard,
  ModuloAdmin.emprendimientos,
  ModuloAdmin.asesorias,
  ModuloAdmin.entregables,
  ModuloAdmin.reportes,
  ModuloAdmin.usuarios_roles,
]

type Acciones = { puedeVer: boolean; puedeAnadir: boolean; puedeEditar: boolean; puedeEliminar: boolean }

/** Acciones que tiene sentido ofrecer por módulo (Dashboard/Reportes son de solo lectura, Entregables no tiene borrado físico). */
const ACCIONES_POR_MODULO: Record<ModuloAdmin, Acciones> = {
  [ModuloAdmin.dashboard]: { puedeVer: true, puedeAnadir: false, puedeEditar: false, puedeEliminar: false },
  [ModuloAdmin.emprendimientos]: { puedeVer: true, puedeAnadir: true, puedeEditar: true, puedeEliminar: true },
  [ModuloAdmin.asesorias]: { puedeVer: true, puedeAnadir: true, puedeEditar: true, puedeEliminar: true },
  [ModuloAdmin.entregables]: { puedeVer: true, puedeAnadir: true, puedeEditar: true, puedeEliminar: false },
  [ModuloAdmin.reportes]: { puedeVer: true, puedeAnadir: false, puedeEditar: false, puedeEliminar: false },
  [ModuloAdmin.usuarios_roles]: { puedeVer: true, puedeAnadir: true, puedeEditar: true, puedeEliminar: true },
}

const PERMISOS_EMPLEADO: Partial<Record<ModuloAdmin, Acciones>> = {
  [ModuloAdmin.dashboard]: { puedeVer: true, puedeAnadir: false, puedeEditar: false, puedeEliminar: false },
  [ModuloAdmin.emprendimientos]: { puedeVer: true, puedeAnadir: false, puedeEditar: true, puedeEliminar: false },
  [ModuloAdmin.asesorias]: { puedeVer: true, puedeAnadir: true, puedeEditar: true, puedeEliminar: false },
  [ModuloAdmin.entregables]: { puedeVer: true, puedeAnadir: false, puedeEditar: true, puedeEliminar: false },
  [ModuloAdmin.reportes]: { puedeVer: true, puedeAnadir: false, puedeEditar: false, puedeEliminar: false },
  [ModuloAdmin.usuarios_roles]: { puedeVer: false, puedeAnadir: false, puedeEditar: false, puedeEliminar: false },
}

async function seedRoles() {
  const coordinador = await prisma.rol.upsert({
    where: { nombre: "Coordinador de Emprendimiento" },
    update: {},
    create: {
      nombre: "Coordinador de Emprendimiento",
      descripcion: "Gestiona el acompañamiento completo de los emprendimientos y administra la Unidad.",
      ambito: "admin",
    },
  })
  const vicerrector = await prisma.rol.upsert({
    where: { nombre: "Vicerrector de Investigación" },
    update: {},
    create: {
      nombre: "Vicerrector de Investigación",
      descripcion: "Supervisión institucional de la Unidad de Emprendimiento e Innovación.",
      ambito: "admin",
    },
  })
  const empleado = await prisma.rol.upsert({
    where: { nombre: "Empleado" },
    update: {},
    create: {
      nombre: "Empleado",
      descripcion: "Acompañamiento operativo: seguimiento de asesorías y entregables asignados.",
      ambito: "admin",
    },
  })
  const emprendedor = await prisma.rol.upsert({
    where: { nombre: "Emprendedor" },
    update: {},
    create: {
      nombre: "Emprendedor",
      descripcion: "Portal propio del emprendedor: consulta de su proceso y carga de entregables.",
      ambito: "emprendedor",
    },
  })
  // Rol reservado del sistema (ver NOMBRE_ROL_SIN_ROL en constantes.ts): se
  // asigna automáticamente al eliminar un rol "de todas formas", sin
  // reasignar a otro — sin ningún permiso, protegido de edición/borrado.
  await prisma.rol.upsert({
    where: { nombre: "Sin rol" },
    update: {},
    create: {
      nombre: "Sin rol",
      descripcion: "Rol reservado del sistema — sin ningún permiso. Se asigna al eliminar un rol sin reasignar a otro.",
      ambito: "admin",
    },
  })

  // Coordinador y Vicerrector: todos los permisos que tenga sentido ofrecer por módulo.
  for (const rol of [coordinador, vicerrector]) {
    for (const modulo of MODULOS) {
      await prisma.permisoRol.upsert({
        where: { idRol_modulo: { idRol: rol.idRol, modulo } },
        update: ACCIONES_POR_MODULO[modulo],
        create: { idRol: rol.idRol, modulo, ...ACCIONES_POR_MODULO[modulo] },
      })
    }
  }

  // Empleado: permisos acotados (sin acceso a Usuarios y Roles, sin eliminar).
  for (const modulo of MODULOS) {
    const acciones = PERMISOS_EMPLEADO[modulo] ?? { puedeVer: false, puedeAnadir: false, puedeEditar: false, puedeEliminar: false }
    await prisma.permisoRol.upsert({
      where: { idRol_modulo: { idRol: empleado.idRol, modulo } },
      update: acciones,
      create: { idRol: empleado.idRol, modulo, ...acciones },
    })
  }

  // Emprendedor: sin permisos administrativos (su portal no usa esta matriz).

  console.log("Roles y permisos: listo.")
  return { coordinador, vicerrector, empleado, emprendedor }
}

// ============================================================
// RUTA METODOLÓGICA (Manual Operativo v2.0 — 6 + 3 + 3 fases)
// ============================================================

const ETAPAS = [
  { numero: 1, nombre: "Formación e Ideación", descripcion: "Semestres 1 a 6, integración curricular obligatoria (PIEI)." },
  { numero: 2, nombre: "Incubación", descripcion: "Proyectos validados — acceso voluntario desde cualquier semestre." },
  { numero: 3, nombre: "Aceleración y Escala", descripcion: null },
]

const FASES: { etapaNumero: number; numero: number; nombre: string; entregablesRequeridos: string }[] = [
  { etapaNumero: 1, numero: 1, nombre: "Mentalidad EI", entregablesRequeridos: "Portafolio de oportunidades identificadas en el entorno + reflexión de perfil emprendedor personal." },
  { etapaNumero: 1, numero: 2, nombre: "Empatía", entregablesRequeridos: "Ficha de usuario validada con evidencias fotográficas/audiovisuales + insight central." },
  { etapaNumero: 1, numero: 3, nombre: "Definición del Reto", entregablesRequeridos: "Declaración de reto estructurada (POV + HMW) + mapa de actores del ecosistema del problema." },
  { etapaNumero: 1, numero: 4, nombre: "Ideación Estratégica", entregablesRequeridos: "Top 3 ideas seleccionadas con sustento metodológico + concepto de solución elegido con justificación." },
  { etapaNumero: 1, numero: 5, nombre: "Prototipado Rápido", entregablesRequeridos: "Prototipo físico o digital de baja/media fidelidad + guía de prueba con usuarios." },
  { etapaNumero: 1, numero: 6, nombre: "Validación Real", entregablesRequeridos: "Informe de validación con % de aceptación, nivel de interés, feedback estructurado y decisión (continuar, pivotar o discontinuar)." },
  { etapaNumero: 2, numero: 7, nombre: "Modelamiento Empresarial", entregablesRequeridos: "Canvas validado con evidencias de usuarios + informe de análisis de mercado." },
  { etapaNumero: 2, numero: 8, nombre: "Estructuración Financiera y Jurídica", entregablesRequeridos: "Modelo financiero en Excel + acta de constitución o minuta + solicitud de marca." },
  { etapaNumero: 2, numero: 9, nombre: "Preparación para el Mercado", entregablesRequeridos: "Pitch deck finalizado + video pitch de 3 minutos + primeras ventas o cartas de intención de compra." },
  { etapaNumero: 3, numero: 10, nombre: "Pitch", entregablesRequeridos: "Presentación ante el Comité de Selección de la Unidad." },
  { etapaNumero: 3, numero: 11, nombre: "Financiamiento Externo", entregablesRequeridos: "Vinculación a Fondo Emprender SENA, Innpulsa u otra fuente de financiamiento." },
  { etapaNumero: 3, numero: 12, nombre: "Lanzamiento y Escala", entregablesRequeridos: "Seguimiento trimestral con indicadores de sostenibilidad." },
]

async function seedRuta() {
  const etapasPorNumero = new Map<number, number>()
  for (const etapa of ETAPAS) {
    const fila = await prisma.etapa.upsert({
      where: { numero: etapa.numero },
      update: { nombre: etapa.nombre, descripcion: etapa.descripcion },
      create: etapa,
    })
    etapasPorNumero.set(etapa.numero, fila.idEtapa)
  }

  for (const fase of FASES) {
    const idEtapa = etapasPorNumero.get(fase.etapaNumero)!
    await prisma.fase.upsert({
      where: { numero: fase.numero },
      update: { nombre: fase.nombre, entregablesRequeridos: fase.entregablesRequeridos, idEtapa },
      create: {
        numero: fase.numero,
        nombre: fase.nombre,
        entregablesRequeridos: fase.entregablesRequeridos,
        idEtapa,
      },
    })
  }

  console.log("Ruta metodológica (3 etapas, 12 fases): listo.")
}

// ============================================================
// PREGUNTAS DEL FORMULARIO DE CARACTERIZACIÓN
// (CARACTERIZACION_EMPRENDIMIENTOS.pdf — 26 preguntas, bloques 0 a 8)
// ============================================================

type PreguntaSeed = {
  codigo: string
  bloque: number
  orden: number
  texto: string
  tipo: TipoPregunta
  obligatoria?: boolean
}

const PREGUNTAS: PreguntaSeed[] = [
  // Bloque 0 (datos generales: nombre/correo/número de identificación) NO
  // se modela aquí — se captura directo en columnas de EMPRENDEDOR, no
  // como RESPUESTA, porque identifican a la persona, no son "caracterización".

  // Bloque 1 — Filtro inicial
  { codigo: "estado_negocio_actual", bloque: 1, orden: 1, tipo: TipoPregunta.seleccion_unica,
    texto: "¿Actualmente tienes un emprendimiento activo (es decir, ya estás ofreciendo o vendiendo un producto o servicio)?" },

  // Bloque 2 — Perfil del estudiante (→ columnas de EMPRENDEDOR, no van a vista_caracterizacion)
  { codigo: "programa_academico", bloque: 2, orden: 2, tipo: TipoPregunta.seleccion_unica, texto: "Programa académico" },
  { codigo: "semestre", bloque: 2, orden: 3, tipo: TipoPregunta.seleccion_unica, texto: "Semestre actual" },
  { codigo: "jornada", bloque: 2, orden: 4, tipo: TipoPregunta.seleccion_unica, texto: "Jornada" },
  // Reemplaza a la pregunta original "Edad": se decidió pedir fecha de
  // nacimiento directamente (más flexible, alimenta EMPRENDEDOR.fecha_nacimiento).
  { codigo: "fecha_nacimiento", bloque: 2, orden: 5, tipo: TipoPregunta.texto, texto: "Fecha de nacimiento" },

  // Bloque 3 — Caracterización del emprendimiento
  { codigo: "nombre_emprendimiento", bloque: 3, orden: 6, tipo: TipoPregunta.texto, texto: "Nombre del emprendimiento" },
  { codigo: "sector", bloque: 3, orden: 7, tipo: TipoPregunta.seleccion_unica, texto: "¿En qué sector se encuentra tu emprendimiento?" },
  { codigo: "origen_idea", bloque: 3, orden: 8, tipo: TipoPregunta.seleccion_unica, texto: "¿Cómo surgió la idea?" },
  { codigo: "tipo_clientes", bloque: 3, orden: 9, tipo: TipoPregunta.seleccion_unica, texto: "¿A qué tipo de clientes está dirigido su emprendimiento?" },
  { codigo: "que_ofrece", bloque: 3, orden: 10, tipo: TipoPregunta.seleccion_unica, texto: "¿Qué ofrece principalmente su emprendimiento?" },
  { codigo: "tiempo_operando", bloque: 3, orden: 11, tipo: TipoPregunta.seleccion_unica, texto: "¿Cuánto tiempo lleva operando?" },
  { codigo: "nivel_formalizacion", bloque: 3, orden: 12, tipo: TipoPregunta.seleccion_unica, texto: "Nivel de formalización actual" },
  // No corresponde a ninguna pregunta real del formulario de Google — campo
  // solo de la aplicación, empieza vacío y lo llena el coordinador
  // manualmente desde "Información adicional".
  { codigo: "descripcion_negocio", bloque: 3, orden: 27, tipo: TipoPregunta.texto, texto: "Descripción del negocio", obligatoria: false },

  // Bloque 4 — Validación y tracción
  { codigo: "nivel_validacion", bloque: 4, orden: 13, tipo: TipoPregunta.seleccion_unica, texto: "¿Cuál es el nivel de validación de mercado de su emprendimiento?" },
  { codigo: "tiene_ventas", bloque: 4, orden: 14, tipo: TipoPregunta.seleccion_unica, texto: "¿Actualmente tiene ventas?" },
  { codigo: "alcance_ventas", bloque: 4, orden: 15, tipo: TipoPregunta.seleccion_unica, texto: "¿Cuál es el alcance de sus ventas? (si las tiene)", obligatoria: false },
  { codigo: "situacion_financiera", bloque: 4, orden: 16, tipo: TipoPregunta.seleccion_unica, texto: "¿Cuál describe mejor la situación financiera del emprendimiento?" },

  // Bloque 5 — Madurez financiera
  { codigo: "registro_financiero", bloque: 5, orden: 17, tipo: TipoPregunta.seleccion_unica, texto: "¿Lleva algún tipo de contabilidad o registro financiero?" },
  { codigo: "conoce_costos", bloque: 5, orden: 18, tipo: TipoPregunta.seleccion_unica, texto: "¿Conoce claramente su estructura de costos?" },

  // Bloque 6 — Estructura y operación
  { codigo: "numero_personas", bloque: 6, orden: 19, tipo: TipoPregunta.numero, texto: "¿Cuántas personas trabajan actualmente en el emprendimiento (incluyéndote)?" },
  { codigo: "canal_ventas", bloque: 6, orden: 20, tipo: TipoPregunta.seleccion_unica, texto: "Canal principal de ventas" },
  { codigo: "herramientas_digitales", bloque: 6, orden: 21, tipo: TipoPregunta.seleccion_multiple, texto: "¿Utiliza herramientas digitales para administrar su emprendimiento?" },

  // Bloque 7 — Innovación y escalabilidad
  { codigo: "tipo_innovacion", bloque: 7, orden: 22, tipo: TipoPregunta.seleccion_unica, texto: "¿Qué tipo de innovación incorpora principalmente su emprendimiento?" },
  { codigo: "fuente_financiacion", bloque: 7, orden: 23, tipo: TipoPregunta.seleccion_multiple, texto: "¿Ha buscado inversión o financiación externa?" },

  // Bloque 8 — Necesidades estratégicas
  { codigo: "necesidades_estrategicas", bloque: 8, orden: 24, tipo: TipoPregunta.seleccion_multiple, texto: "¿Cuál es su principal necesidad actualmente? (Selecciona máximo 3)" },
  { codigo: "temas_acompanamiento", bloque: 8, orden: 25, tipo: TipoPregunta.seleccion_multiple, texto: "¿En qué temas le gustaría recibir acompañamiento?" },
  // Su respuesta se guarda en FORMULARIO.filtro_inicial, no como RESPUESTA — se incluye aquí solo para que el catálogo de 26 preguntas quede completo.
  { codigo: "interes_acompanamiento", bloque: 8, orden: 26, tipo: TipoPregunta.seleccion_unica, texto: "¿Te interesa recibir acompañamiento de la unidad de emprendimiento?" },
]

async function seedPreguntas() {
  for (const pregunta of PREGUNTAS) {
    await prisma.pregunta.upsert({
      where: { codigo: pregunta.codigo },
      update: {
        bloque: pregunta.bloque,
        orden: pregunta.orden,
        texto: pregunta.texto,
        tipo: pregunta.tipo,
        obligatoria: pregunta.obligatoria ?? true,
      },
      create: {
        codigo: pregunta.codigo,
        bloque: pregunta.bloque,
        orden: pregunta.orden,
        texto: pregunta.texto,
        tipo: pregunta.tipo,
        obligatoria: pregunta.obligatoria ?? true,
      },
    })
  }
  console.log(`Preguntas del formulario (${PREGUNTAS.length}): listo.`)
}

async function main() {
  await seedRoles()
  await seedRuta()
  await seedPreguntas()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
