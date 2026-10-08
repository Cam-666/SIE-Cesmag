-- Agrega la duración real (en minutos) de cada asesoría a su propia fila, en
-- vez de derivarla del bloque de AGENDA al que apunta `id_agenda`: ese bloque
-- ahora es siempre una unidad atómica de 15 minutos (ver agenda.service.ts),
-- y una asesoría puede encadenar varios bloques atómicos consecutivos.
ALTER TABLE "asesoria" ADD COLUMN "duracion_minutos" INTEGER NOT NULL DEFAULT 15;

-- Backfill: para las asesorías ya existentes, el bloque de AGENDA al que
-- apuntan todavía conserva su duración original completa (el modelo viejo
-- creaba un único bloque por la duración elegida), así que se recupera de ahí.
UPDATE "asesoria" a
SET "duracion_minutos" = ROUND(
  (EXTRACT(EPOCH FROM g.hora_fin) - EXTRACT(EPOCH FROM g.hora_inicio)) / 60
)::INTEGER
FROM "agenda" g
WHERE g.id_agenda = a.id_agenda;
