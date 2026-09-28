
ALTER TABLE emprendimiento
  ADD CONSTRAINT chk_emprendimiento_motivo
  CHECK (estado NOT IN ('inactivo', 'terminado') OR motivo IS NOT NULL);

-- EMPRENDIMIENTO: las fechas de la trayectoria no pueden quedar antes del ingreso.
ALTER TABLE emprendimiento
  ADD CONSTRAINT chk_emprendimiento_fechas
  CHECK (
    (fecha_culminacion IS NULL OR fecha_culminacion >= fecha_ingreso) AND
    (fecha_desistimiento IS NULL OR fecha_desistimiento >= fecha_ingreso)
  );

-- EMPRENDIMIENTO_FASE: la fase no puede terminar antes de empezar.
ALTER TABLE emprendimiento_fase
  ADD CONSTRAINT chk_emprendimiento_fase_fechas
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- EMPRENDEDOR: no se puede aprobar a alguien sin haberle creado la cuenta
-- de acceso — la aprobación crea la cuenta en el mismo paso.
ALTER TABLE emprendedor
  ADD CONSTRAINT chk_emprendedor_aprobado_con_cuenta
  CHECK (estado_precandidato <> 'aprobado' OR id_usuario IS NOT NULL);

-- EMPRENDEDOR: la fecha de nacimiento no puede ser una fecha futura.
ALTER TABLE emprendedor
  ADD CONSTRAINT chk_emprendedor_fecha_nacimiento
  CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE);

-- EMPRENDEDOR: el semestre reportado en la encuesta va de 1 a 10
-- (opciones reales de CARACTERIZACION_EMPRENDIMIENTOS.pdf, pregunta 3).
ALTER TABLE emprendedor
  ADD CONSTRAINT chk_emprendedor_semestre
  CHECK (semestre IS NULL OR semestre BETWEEN 1 AND 10);

-- AGENDA: un bloque no puede terminar antes (o al mismo tiempo) de que empiece.
ALTER TABLE agenda
  ADD CONSTRAINT chk_agenda_horario
  CHECK (hora_fin > hora_inicio);

-- INTENTO_ENTREGA: rechazar un intento exige explicar el motivo.
ALTER TABLE intento_entrega
  ADD CONSTRAINT chk_intento_entrega_rechazo_con_observacion
  CHECK (estado_revision <> 'rechazado' OR observaciones IS NOT NULL);

-- ASESORIA: marcar "no realizada" exige dejar el motivo como evidencia
-- (mismo criterio que ya aplica el formulario "Registrar resultado" del frontend).
ALTER TABLE asesoria
  ADD CONSTRAINT chk_asesoria_no_realizada_con_observacion
  CHECK (estado_asesoria <> 'no_realizada' OR observaciones IS NOT NULL);

-- NOTIFICACION: debe apuntar a una asesoría O a un entregable, nunca a
-- las dos a la vez (son mutuamente excluyentes según el tipo).
ALTER TABLE notificacion
  ADD CONSTRAINT chk_notificacion_un_solo_enlace
  CHECK (NOT (id_asesoria IS NOT NULL AND id_entregable IS NOT NULL));
