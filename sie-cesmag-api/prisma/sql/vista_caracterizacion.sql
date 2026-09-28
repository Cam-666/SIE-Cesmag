-- vista_caracterizacion
--
-- Envoltorio de vista_caracterizacion_formulario, pero por emprendimiento
-- en vez de por formulario — la usan reportes/indicadores y "Información
-- adicional" una vez que el precandidato ya fue aprobado y existe el
-- EMPRENDIMIENTO. Aplicar DESPUÉS de vista_caracterizacion_formulario.sql, de la que depende.
--
-- LEFT JOIN a propósito: un emprendimiento sin formulario asociado (no
-- debería pasar en el flujo normal, pero la columna es nullable por
-- seguridad) igual aparece en la vista, con todas las columnas en NULL,
-- en vez de desaparecer silenciosamente de los reportes.

-- DROP + CREATE (no "OR REPLACE"): Postgres no permite insertar una
-- columna nueva en medio del listado de una vista ya existente, solo al
-- final — más simple borrarla y recrearla, nada depende de esta vista
-- todavía vía llave foránea.
DROP VIEW IF EXISTS vista_caracterizacion;

CREATE VIEW vista_caracterizacion AS
SELECT
  e.id_emprendimiento,
  v.sector,
  v.origen_idea,
  v.tipo_clientes,
  v.que_ofrece,
  v.tiempo_operando,
  v.nivel_formalizacion,
  v.descripcion,
  v.nivel_validacion,
  v.tiene_ventas,
  v.alcance_ventas,
  v.situacion_financiera,
  v.registro_financiero,
  v.conoce_costos,
  v.numero_personas,
  v.canal_ventas,
  v.herramientas_digitales,
  v.tipo_innovacion,
  v.fuente_financiacion,
  v.necesidades_estrategicas,
  v.temas_acompanamiento
FROM emprendimiento e
LEFT JOIN vista_caracterizacion_formulario v ON v.id_formulario = e.id_formulario;
