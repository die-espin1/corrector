// Función serverless de Vercel: /api/correct
// Recibe { code } y devuelve { correctedCode }.
// La clave de OpenAI vive SOLO aquí (variable de entorno del servidor),
// nunca se expone en el navegador.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Falta el campo "code" (string) en el body' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no está configurada en el servidor' });
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Eres un revisor de código estricto. Recibirás un fragmento de código. ' +
              'Si contiene errores (de sintaxis, lógica u otros), corrígelos y responde ' +
              'ÚNICAMENTE con el código corregido, sin explicaciones, sin comentarios, ' +
              'sin marcado de bloque de código (sin ```). ' +
              'Si el código ya es correcto, respóndelo exactamente igual, sin ningún cambio ni comentario adicional.',
          },
          { role: 'user', content: code },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return res.status(502).json({ error: 'Error al consultar OpenAI', detail: errText });
    }

    const data = await openaiResponse.json();
    const correctedCode = data.choices?.[0]?.message?.content?.trim() ?? code;

    return res.status(200).json({ correctedCode });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor', detail: String(err) });
  }
}
