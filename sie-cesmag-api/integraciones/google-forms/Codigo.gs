/**
 * RF-01: envía cada respuesta del formulario de caracterización al backend
 * del SIE (POST /api/formulario/respuestas).
 *
 * Instalación (una sola vez, en el formulario de Google):
 *  1. Formulario → menú ⋮ → "Editor de secuencias de comandos" (Apps Script).
 *  2. Pegar este archivo completo como Código.gs y guardar.
 *  3. Configuración del proyecto (engranaje) → "Propiedades de la secuencia de
 *     comandos" → agregar:  API_URL  = https://<url-publica>/api/formulario/respuestas
 *                           CLAVE    = el mismo valor de FORMULARIO_CLAVE_SECRETA del .env
 *  4. Activadores (reloj) → "Añadir activador": función alEnviarFormulario,
 *     origen "Del formulario", tipo "Al enviar el formulario".
 */

/** [prefijo del título normalizado, codigo de PREGUNTA, tipo] — los títulos se repiten entre ramas del formulario, por eso se busca por prefijo. */
var PREGUNTAS = [
  ['programa academico', 'programa_academico', 'texto'],
  ['semestre actual', 'semestre', 'numero'],
  ['jornada', 'jornada', 'texto'],
  ['nombre del emprendimiento', 'nombre_emprendimiento', 'texto'],
  ['en que sector', 'sector', 'multi'],
  ['como surgio la idea', 'origen_idea', 'texto'],
  ['a que tipo de clientes', 'tipo_clientes', 'multi'],
  ['que ofrece principalmente', 'que_ofrece', 'texto'],
  ['cuanto tiempo lleva operando', 'tiempo_operando', 'texto'],
  ['nivel de formalizacion', 'nivel_formalizacion', 'texto'],
  ['cual es el nivel de validacion', 'nivel_validacion', 'texto'],
  ['actualmente tiene ventas', 'tiene_ventas', 'texto'],
  ['cual es el alcance de sus ventas', 'alcance_ventas', 'texto'],
  ['cual describe mejor la situacion financiera', 'situacion_financiera', 'texto'],
  ['lleva algun tipo de contabilidad', 'registro_financiero', 'texto'],
  ['conoce claramente su estructura', 'conoce_costos', 'texto'],
  ['cuantas personas trabajan', 'numero_personas', 'numero'],
  ['canal principal de ventas', 'canal_ventas', 'multi'],
  ['utiliza herramientas digitales', 'herramientas_digitales', 'multi'],
  ['que tipo de innovacion', 'tipo_innovacion', 'multi'],
  ['ha buscado inversion', 'fuente_financiacion', 'multi'],
  ['cual es su principal necesidad', 'necesidades_estrategicas', 'multi'],
  ['en que temas le gustaria', 'temas_acompanamiento', 'multi'],
  ['fecha de nacimiento', 'fecha_nacimiento', 'texto'],
];

function normalizar(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!]/g, '').trim();
}

function filtroDesdeRespuesta(texto) {
  var t = normalizar(texto);
  if (t.indexOf('no me interesa') === 0) return 'no_interesa';
  if (t.indexOf('no, pero quiero emprender') === 0) return 'futuro';
  if (t.indexOf('no, pero estoy desarrollando') === 0) return 'idea';
  return 'activo';
}

/** @param {{titulo: string, respuesta: string|string[]}[]} items */
function construirPayload(items) {
  var payload = {
    numeroIdentificacion: '',
    nombre: '',
    correo: '',
    filtroInicial: 'no_interesa',
    quiereAcompanamiento: false,
    respuestas: [],
  };

  items.forEach(function (item) {
    var titulo = normalizar(item.titulo);
    var valores = Array.isArray(item.respuesta) ? item.respuesta : [item.respuesta];
    valores = valores.filter(function (v) { return v !== '' && v !== null && v !== undefined; });
    if (valores.length === 0) return;

    if (titulo.indexOf('nombres y apellidos') === 0) { payload.nombre = String(valores[0]).trim(); return; }
    if (titulo.indexOf('numero de identificacion') === 0) { payload.numeroIdentificacion = String(valores[0]).trim(); return; }
    if (titulo === 'correo') { payload.correo = String(valores[0]).trim(); return; }
    if (titulo.indexOf('actualmente tiene un emprendimiento activo') === 0) {
      payload.filtroInicial = filtroDesdeRespuesta(valores[0]);
      return;
    }
    if (titulo.indexOf('te interesa recibir acompanamiento') === 0) {
      payload.quiereAcompanamiento = normalizar(valores[0]).indexOf('si') === 0;
      return;
    }

    for (var i = 0; i < PREGUNTAS.length; i++) {
      if (titulo.indexOf(PREGUNTAS[i][0]) !== 0) continue;
      var codigo = PREGUNTAS[i][1];
      var tipo = PREGUNTAS[i][2];
      valores.forEach(function (valor) {
        if (tipo === 'numero') {
          var n = Number(valor);
          if (!isNaN(n)) payload.respuestas.push({ codigo: codigo, numero: n });
          else payload.respuestas.push({ codigo: codigo, texto: String(valor) });
        } else {
          payload.respuestas.push({ codigo: codigo, texto: String(valor) });
        }
      });
      return;
    }
  });

  return payload;
}

/** Activador "Al enviar el formulario". */
function alEnviarFormulario(e) {
  var props = PropertiesService.getScriptProperties();
  var items = e.response.getItemResponses().map(function (r) {
    return { titulo: r.getItem().getTitle(), respuesta: r.getResponse() };
  });
  var payload = construirPayload(items);

  var resultado = UrlFetchApp.fetch(props.getProperty('API_URL'), {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Formulario-Clave': props.getProperty('CLAVE'),
      'ngrok-skip-browser-warning': 'true',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  console.log(resultado.getResponseCode() + ' ' + resultado.getContentText());
}
