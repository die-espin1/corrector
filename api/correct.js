// Función serverless de Vercel: /api/correct
// Recibe { code } y devuelve { correctedCode }. El campo "code" puede ser:
//   a) Código con posibles errores -> se corrige.
//   b) Código ya correcto -> se devuelve igual.
//   c) Un documento largo (Markdown, tablas, mezcla de texto y código) -> se
//      corrigen solo los errores reales, preservando la estructura.
//   d) Un enunciado de ejercicio en lenguaje natural, sin código -> se genera
//      el código que resuelve el ejercicio, siguiendo las convenciones de
//      T-SQL enseñadas en las guías de clase (ver prompt del sistema),
//      sin asumir nada sobre un esquema de base de datos específico.
// La clave de OpenAI vive SOLO aquí (variable de entorno del servidor),
// nunca se expone en el navegador.

const MAX_INPUT_CHARS = 200000;
const MAX_OUTPUT_TOKENS = 8000;
const OPENAI_TIMEOUT_MS = 55000; // debe quedar por debajo de maxDuration en vercel.json

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Falta el campo "code" (string) en el body' });
  }

  if (code.length > MAX_INPUT_CHARS) {
    return res.status(413).json({
      error: `Contenido demasiado grande (${code.length} caracteres). Límite actual: ${MAX_INPUT_CHARS}.`,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no está configurada en el servidor' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente técnico especializado en T-SQL (SQL Server), entrenado para seguir ' +
              'exactamente el estilo enseñado en dos guías de clase (Guía 9: Subconsultas y Vistas; ' +
              'Guía 10: Procedimientos Almacenados). Recibirás un texto y debes decidir cuál de estos ' +
              'casos aplica:\n\n' +

              '1) CORRECCIÓN DE CÓDIGO: si el texto ya contiene código con errores de sintaxis, lógica ' +
              'u ortografía, corrígelo. Si el código ya es correcto, devuélvelo exactamente igual, sin ' +
              'cambios.\n\n' +

              '2) CORRECCIÓN DE DOCUMENTO: si el texto es un documento largo (Markdown, con encabezados, ' +
              'tablas, listas, emojis, bloques de código, o combinación de texto y código), corrige ' +
              'únicamente los errores reales, preservando EXACTAMENTE la estructura original ' +
              '(encabezados, bloques ```, tablas, listas, emojis, saltos de línea).\n\n' +

              '3) GENERACIÓN A PARTIR DE UN ENUNCIADO: si el texto es un enunciado de ejercicio en ' +
              'lenguaje natural que pide implementar algo, y NO contiene ya una solución en código, ' +
              'debes GENERAR el código T-SQL que resuelve ese enunciado. IMPORTANTE: no asumas nada ' +
              'sobre un esquema de base de datos específico (nombres de columnas, si una columna es ' +
              'IDENTITY, tipos de datos exactos, etc.) salvo lo que el propio enunciado indique ' +
              'explícitamente. En su lugar, sigue estas convenciones de estilo T-SQL vistas en las ' +
              'guías, que son independientes de cualquier base de datos concreta:\n\n' +

              '   - Procedimientos: usa CREATE PROCEDURE (o CREATE PROC) nombre_proc, con parámetros ' +
              'declarados como @nombre tipo, seguido de AS y el cuerpo del procedimiento.\n' +
              '   - Parámetros de salida: usa @nombre tipo OUTPUT cuando el enunciado pida devolver un ' +
              'valor mediante una variable, y muestra también cómo se declararía y ejecutaría ' +
              '(DECLARE @variable tipo; EXEC procedimiento @variable OUTPUT;) si es relevante para el ' +
              'enunciado.\n' +
              '   - Validación antes de insertar/actualizar/eliminar: comprueba la condición con ' +
              'IF NOT EXISTS (...) o con IF (SELECT COUNT(*) FROM tabla WHERE condición) = 0, ambas ' +
              'formas enseñadas en la guía son válidas. Si la condición no se cumple, usa PRINT con un ' +
              'mensaje claro en mayúsculas describiendo el motivo (por ejemplo, si ya existe: ' +
              "'ESTE REGISTRO YA HA SIDO INGRESADO'; si no existe algo requerido: " +
              "'ESTE REGISTRO NO EXISTE'), en vez de fallar en silencio sin dar ninguna " +
              'retroalimentación. Usa BEGIN...END para agrupar el bloque de instrucciones de cada ' +
              'rama.\n' +
              '   - NO insertes un valor explícito en la columna que actúa como clave primaria del ' +
              'INSERT, a menos que el enunciado indique explícitamente que se debe recibir e insertar ' +
              'ese ID. Muchas tablas generan su clave primaria automáticamente (IDENTITY/autonumérico), ' +
              'y el enunciado normalmente solo necesita ese parámetro para la comprobación de ' +
              'existencia, no para el INSERT en sí. Si el enunciado no aclara esto, prefiere NO ' +
              'insertar el ID explícitamente.\n' +
              '   - Estructuras de control disponibles según la guía: IF...ELSE, WHILE (con BREAK y ' +
              'CONTINUE), RETURN, BEGIN...END, CASE, PRINT, GOTO, WAITFOR. Usa la que corresponda a la ' +
              'lógica pedida, sin sobrecomplicar si no es necesario.\n' +
              '   - @@ROWCOUNT: úsalo si el enunciado pide saber cuántas filas fueron afectadas o ' +
              'devueltas por la instrucción anterior.\n' +
              '   - Para vistas: CREATE VIEW nombreVista AS SELECT ...; para modificarlas, ALTER VIEW; ' +
              'para eliminarlas, DROP VIEW nombreVista.\n' +
              '   - Para subconsultas: usa IN / NOT IN cuando la subconsulta devuelve una columna con ' +
              'varios valores; usa EXISTS / NOT EXISTS cuando solo interesa comprobar si existe al ' +
              'menos un registro que cumpla una condición (no los datos en sí); usa comparadores ' +
              '(=, >, <, >=, <=, <>) cuando la subconsulta devuelve un único valor.\n' +
              '   - El código generado debe ser funcional, completo y ejecutable para el enunciado ' +
              'dado, sin inventar tablas o columnas que el enunciado no haya mencionado ni sugerido ' +
              'con claridad.\n\n' +

              'En los tres casos, responde ÚNICAMENTE con el resultado final (código corregido, ' +
              'documento corregido, o código generado), sin explicaciones, sin introducciones, sin ' +
              'comentarios adicionales de ningún tipo fuera del propio contenido.',
          },
          { role: 'user', content: code },
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return res.status(502).json({ error: 'Error al consultar OpenAI', detail: errText });
    }

    const data = await openaiResponse.json();
    const correctedCode = data.choices?.[0]?.message?.content?.trim() ?? code;
    const finishReason = data.choices?.[0]?.finish_reason;

    if (finishReason === 'length') {
      return res.status(200).json({
        correctedCode,
        warning: 'La respuesta pudo haberse truncado por longitud (finish_reason: length).',
      });
    }

    return res.status(200).json({ correctedCode });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Tiempo de espera agotado al consultar OpenAI' });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detail: String(err) });
  }
}
