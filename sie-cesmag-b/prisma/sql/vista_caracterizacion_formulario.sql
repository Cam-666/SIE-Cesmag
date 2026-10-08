-- vista_caracterizacion_formulario
--
-- Aplana las respuestas del formulario de caracterización (RESPUESTA, EAV)
-- en una fila por FORMULARIO — es la base que reutilizan tanto
-- `vista_caracterizacion` (por emprendimiento, una vez aprobado) como la
-- revisión de un precandidato, antes de que exista un EMPRENDIMIENTO, ya
-- que en ese momento solo hay un FORMULARIO.
--
-- Aplicar a mano (igual que checks.sql), ANTES de vista_caracterizacion.sql
-- porque esa depende de esta. Si se agrega un nuevo `codigo` a PREGUNTA,
-- hay que volver a aplicar ambos archivos (CREATE OR REPLACE) con la
-- columna nueva, y agregarla también a los dos bloques `view` de
-- schema.prisma.

CREATE OR REPLACE VIEW vista_caracterizacion_formulario AS
SELECT
  f.id_formulario,

  -- Bloque 3 — Caracterización del emprendimiento (selección única / texto)
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'sector' AND r.texto_libre IS NOT NULL)
                                                                        AS sector,
  -- Selección múltiple (puede incluir "Otra" junto con otras opciones
  -- marcadas) — antes era MAX(), que descartaba todo menos un valor cuando
  -- Google Forms mandaba varias filas de RESPUESTA para esta pregunta.
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'origen_idea' AND r.texto_libre IS NOT NULL)
                                                                        AS origen_idea,
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'tipo_clientes' AND r.texto_libre IS NOT NULL)
                                                                        AS tipo_clientes,
  MAX(CASE WHEN p.codigo = 'que_ofrece' THEN r.texto_libre END)           AS que_ofrece,
  MAX(CASE WHEN p.codigo = 'tiempo_operando' THEN r.texto_libre END)      AS tiempo_operando,
  MAX(CASE WHEN p.codigo = 'nivel_formalizacion' THEN r.texto_libre END)  AS nivel_formalizacion,
  -- No corresponde a ninguna pregunta real del formulario de Google —
  -- campo solo de la aplicación, editable desde el panel admin, vacío hasta
  -- que el coordinador lo llene la primera vez.
  MAX(CASE WHEN p.codigo = 'descripcion_negocio' THEN r.texto_libre END)  AS descripcion,

  -- Bloque 4 — Validación y tracción
  MAX(CASE WHEN p.codigo = 'nivel_validacion' THEN r.texto_libre END)     AS nivel_validacion,
  MAX(CASE WHEN p.codigo = 'tiene_ventas' THEN r.texto_libre END)         AS tiene_ventas,
  MAX(CASE WHEN p.codigo = 'alcance_ventas' THEN r.texto_libre END)       AS alcance_ventas,
  MAX(CASE WHEN p.codigo = 'situacion_financiera' THEN r.texto_libre END) AS situacion_financiera,

  -- Bloque 5 — Madurez financiera
  MAX(CASE WHEN p.codigo = 'registro_financiero' THEN r.texto_libre END) AS registro_financiero,
  MAX(CASE WHEN p.codigo = 'conoce_costos' THEN r.texto_libre END)       AS conoce_costos,

  -- Bloque 6 — Estructura y operación (numero_personas es numérica, valor_numero)
  MAX(CASE WHEN p.codigo = 'numero_personas' THEN r.valor_numero END) AS numero_personas,
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'canal_ventas' AND r.texto_libre IS NOT NULL)
                                                                        AS canal_ventas,
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'herramientas_digitales' AND r.texto_libre IS NOT NULL)
                                                                        AS herramientas_digitales,

  -- Bloque 7 — Innovación y escalabilidad
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'tipo_innovacion' AND r.texto_libre IS NOT NULL)
                                                                        AS tipo_innovacion,
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'fuente_financiacion' AND r.texto_libre IS NOT NULL)
                                                                        AS fuente_financiacion,

  -- Bloque 8 — Necesidades estratégicas (selección múltiple)
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'necesidades_estrategicas' AND r.texto_libre IS NOT NULL)
                                                                        AS necesidades_estrategicas,
  ARRAY_AGG(r.texto_libre ORDER BY r.id_respuesta) FILTER (WHERE p.codigo = 'temas_acompanamiento' AND r.texto_libre IS NOT NULL)
                                                                        AS temas_acompanamiento

FROM formulario f
LEFT JOIN respuesta r ON r.id_formulario = f.id_formulario
LEFT JOIN pregunta p  ON p.id_pregunta = r.id_pregunta
GROUP BY f.id_formulario;
