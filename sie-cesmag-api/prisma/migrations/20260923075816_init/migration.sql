-- CreateEnum
CREATE TYPE "EstadoEmprendimiento" AS ENUM ('activo', 'inactivo', 'terminado');

-- CreateEnum
CREATE TYPE "EstadoFase" AS ENUM ('pendiente', 'en_curso', 'completada', 'pausada');

-- CreateEnum
CREATE TYPE "TipoAsesoria" AS ENUM ('diagnostica', 'seguimiento');

-- CreateEnum
CREATE TYPE "ModalidadAsesoria" AS ENUM ('presencial', 'virtual');

-- CreateEnum
CREATE TYPE "EstadoAsesoria" AS ENUM ('programada', 'completada', 'cancelada', 'no_realizada');

-- CreateEnum
CREATE TYPE "EstadoAgenda" AS ENUM ('disponible', 'reservado', 'bloqueado');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('pendiente', 'entregado', 'no_entregado');

-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('inactividad', 'agendamiento_asesoria', 'recordatorio_asesoria', 'recordatorio_entregable', 'resultado_revision');

-- CreateEnum
CREATE TYPE "FiltroInicial" AS ENUM ('activo', 'idea', 'futuro', 'no_interesa');

-- CreateEnum
CREATE TYPE "EstadoPrecandidato" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "Jornada" AS ENUM ('Diurna', 'Nocturna', 'Otro');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('texto', 'numero', 'seleccion_unica', 'seleccion_multiple');

-- CreateEnum
CREATE TYPE "ModuloAdmin" AS ENUM ('dashboard', 'emprendimientos', 'asesorias', 'entregables', 'reportes', 'usuarios-roles');

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(250),
    "ambito" VARCHAR(20) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "permiso_rol" (
    "id_permiso_rol" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "modulo" "ModuloAdmin" NOT NULL,
    "puede_ver" BOOLEAN NOT NULL DEFAULT false,
    "puede_editar" BOOLEAN NOT NULL DEFAULT false,
    "puede_eliminar" BOOLEAN NOT NULL DEFAULT false,
    "puede_anadir" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permiso_rol_pkey" PRIMARY KEY ("id_permiso_rol")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "telefono" VARCHAR(30),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "emprendedor" (
    "id_emprendedor" SERIAL NOT NULL,
    "id_usuario" UUID,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "numero_identificacion" VARCHAR(20) NOT NULL,
    "fecha_nacimiento" DATE,
    "programa_academico" VARCHAR(150),
    "semestre" SMALLINT,
    "jornada" "Jornada",
    "estado_precandidato" "EstadoPrecandidato" NOT NULL DEFAULT 'pendiente',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "emprendedor_pkey" PRIMARY KEY ("id_emprendedor")
);

-- CreateTable
CREATE TABLE "emprendimiento" (
    "id_emprendimiento" SERIAL NOT NULL,
    "id_formulario" INTEGER,
    "nombre_referencia" VARCHAR(150) NOT NULL,
    "estado" "EstadoEmprendimiento" NOT NULL DEFAULT 'activo',
    "motivo" VARCHAR(300),
    "fecha_ingreso" DATE NOT NULL,
    "fecha_culminacion" DATE,
    "fecha_desistimiento" DATE,
    "fecha_reingreso" DATE,
    "fecha_inactividad" DATE,

    CONSTRAINT "emprendimiento_pkey" PRIMARY KEY ("id_emprendimiento")
);

-- CreateTable
CREATE TABLE "emprendedor_emprendimiento" (
    "id_emprendedor" INTEGER NOT NULL,
    "id_emprendimiento" INTEGER NOT NULL,

    CONSTRAINT "emprendedor_emprendimiento_pkey" PRIMARY KEY ("id_emprendedor","id_emprendimiento")
);

-- CreateTable
CREATE TABLE "formulario" (
    "id_formulario" SERIAL NOT NULL,
    "id_emprendedor" INTEGER NOT NULL,
    "fecha_respuesta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filtro_inicial" "FiltroInicial" NOT NULL,
    "quiere_acompañamiento" BOOLEAN NOT NULL,

    CONSTRAINT "formulario_pkey" PRIMARY KEY ("id_formulario")
);

-- CreateTable
CREATE TABLE "pregunta" (
    "id_pregunta" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "bloque" SMALLINT NOT NULL,
    "orden" SMALLINT NOT NULL,
    "texto" VARCHAR(300) NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pregunta_pkey" PRIMARY KEY ("id_pregunta")
);

-- CreateTable
CREATE TABLE "respuesta" (
    "id_respuesta" SERIAL NOT NULL,
    "id_formulario" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "texto_libre" VARCHAR(300),
    "valor_numero" SMALLINT,
    "es_otro" BOOLEAN,

    CONSTRAINT "respuesta_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
CREATE TABLE "etapa" (
    "id_etapa" SERIAL NOT NULL,
    "numero" SMALLINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(300),
    "id_usuario_responsable" UUID,

    CONSTRAINT "etapa_pkey" PRIMARY KEY ("id_etapa")
);

-- CreateTable
CREATE TABLE "fase" (
    "id_etapa" INTEGER NOT NULL,
    "id_fase" SERIAL NOT NULL,
    "numero" SMALLINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "entregables_requeridos" VARCHAR(300),

    CONSTRAINT "fase_pkey" PRIMARY KEY ("id_fase")
);

-- CreateTable
CREATE TABLE "emprendimiento_fase" (
    "id_emprendimiento_fase" SERIAL NOT NULL,
    "id_emprendimiento" INTEGER NOT NULL,
    "id_fase" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "estado_fase" "EstadoFase" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "emprendimiento_fase_pkey" PRIMARY KEY ("id_emprendimiento_fase")
);

-- CreateTable
CREATE TABLE "agenda" (
    "id_agenda" SERIAL NOT NULL,
    "id_usuario" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "estado" "EstadoAgenda" NOT NULL DEFAULT 'disponible',

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id_agenda")
);

-- CreateTable
CREATE TABLE "asesoria" (
    "id_asesoria" SERIAL NOT NULL,
    "id_emprendimiento_fase" INTEGER NOT NULL,
    "id_agenda" INTEGER NOT NULL,
    "tipo_asesoria" "TipoAsesoria" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "fecha_asesoria" TIMESTAMP(3) NOT NULL,
    "avance" VARCHAR(300),
    "observaciones" VARCHAR(300),
    "modalidad" "ModalidadAsesoria" NOT NULL,
    "estado_asesoria" "EstadoAsesoria" NOT NULL DEFAULT 'programada',
    "actividades" JSONB,

    CONSTRAINT "asesoria_pkey" PRIMARY KEY ("id_asesoria")
);

-- CreateTable
CREATE TABLE "entregable" (
    "id_entregable" SERIAL NOT NULL,
    "id_emprendimiento_fase" INTEGER NOT NULL,
    "titulo" VARCHAR(300) NOT NULL,
    "descripcion" VARCHAR(300) NOT NULL,
    "fecha_prevista" DATE NOT NULL,
    "estado_actividad" "EstadoActividad" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "entregable_pkey" PRIMARY KEY ("id_entregable")
);

-- CreateTable
CREATE TABLE "intento_entrega" (
    "id_intento_entrega" SERIAL NOT NULL,
    "id_entregable" INTEGER NOT NULL,
    "ruta_evidencia" VARCHAR(500) NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "fecha_entrega" TIMESTAMP(3),
    "estado_revision" "EstadoRevision",
    "observaciones" VARCHAR(300),

    CONSTRAINT "intento_entrega_pkey" PRIMARY KEY ("id_intento_entrega")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" UUID NOT NULL,
    "id_asesoria" INTEGER,
    "id_entregable" INTEGER,
    "tipo" "TipoNotificacion" NOT NULL,
    "mensaje" VARCHAR(300) NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permiso_rol_id_rol_modulo_key" ON "permiso_rol"("id_rol", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "emprendedor_id_usuario_key" ON "emprendedor"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "emprendedor_numero_identificacion_key" ON "emprendedor"("numero_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "emprendimiento_id_formulario_key" ON "emprendimiento"("id_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "pregunta_codigo_key" ON "pregunta"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "etapa_numero_key" ON "etapa"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "etapa_nombre_key" ON "etapa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "fase_numero_key" ON "fase"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "fase_nombre_key" ON "fase"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "emprendimiento_fase_id_emprendimiento_id_fase_key" ON "emprendimiento_fase"("id_emprendimiento", "id_fase");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_id_usuario_fecha_hora_inicio_key" ON "agenda"("id_usuario", "fecha", "hora_inicio");

-- AddForeignKey
ALTER TABLE "permiso_rol" ADD CONSTRAINT "permiso_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendedor" ADD CONSTRAINT "emprendedor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendimiento" ADD CONSTRAINT "emprendimiento_id_formulario_fkey" FOREIGN KEY ("id_formulario") REFERENCES "formulario"("id_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendedor_emprendimiento" ADD CONSTRAINT "emprendedor_emprendimiento_id_emprendedor_fkey" FOREIGN KEY ("id_emprendedor") REFERENCES "emprendedor"("id_emprendedor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendedor_emprendimiento" ADD CONSTRAINT "emprendedor_emprendimiento_id_emprendimiento_fkey" FOREIGN KEY ("id_emprendimiento") REFERENCES "emprendimiento"("id_emprendimiento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulario" ADD CONSTRAINT "formulario_id_emprendedor_fkey" FOREIGN KEY ("id_emprendedor") REFERENCES "emprendedor"("id_emprendedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_id_formulario_fkey" FOREIGN KEY ("id_formulario") REFERENCES "formulario"("id_formulario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "pregunta"("id_pregunta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_id_usuario_responsable_fkey" FOREIGN KEY ("id_usuario_responsable") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fase" ADD CONSTRAINT "fase_id_etapa_fkey" FOREIGN KEY ("id_etapa") REFERENCES "etapa"("id_etapa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendimiento_fase" ADD CONSTRAINT "emprendimiento_fase_id_emprendimiento_fkey" FOREIGN KEY ("id_emprendimiento") REFERENCES "emprendimiento"("id_emprendimiento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprendimiento_fase" ADD CONSTRAINT "emprendimiento_fase_id_fase_fkey" FOREIGN KEY ("id_fase") REFERENCES "fase"("id_fase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesoria" ADD CONSTRAINT "asesoria_id_emprendimiento_fase_fkey" FOREIGN KEY ("id_emprendimiento_fase") REFERENCES "emprendimiento_fase"("id_emprendimiento_fase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesoria" ADD CONSTRAINT "asesoria_id_agenda_fkey" FOREIGN KEY ("id_agenda") REFERENCES "agenda"("id_agenda") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregable" ADD CONSTRAINT "entregable_id_emprendimiento_fase_fkey" FOREIGN KEY ("id_emprendimiento_fase") REFERENCES "emprendimiento_fase"("id_emprendimiento_fase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento_entrega" ADD CONSTRAINT "intento_entrega_id_entregable_fkey" FOREIGN KEY ("id_entregable") REFERENCES "entregable"("id_entregable") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_asesoria_fkey" FOREIGN KEY ("id_asesoria") REFERENCES "asesoria"("id_asesoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_entregable_fkey" FOREIGN KEY ("id_entregable") REFERENCES "entregable"("id_entregable") ON DELETE SET NULL ON UPDATE CASCADE;
