# TICKETS — Corrector

Este directorio contiene los tickets de trabajo para la siguiente iteración
del proyecto. **Codex** y **Antigravity** implementan; **Claude supervisa
y revisa el código una vez entregado** (no implementa en esta ronda).

## Orden sugerido de implementación
1. [TICKET-01 — Input imperceptible incluso con texto largo pegado](./TICKET-01-input-imperceptible.md)
2. [TICKET-02 — Respuesta nunca visible: copiar al portapapeles en silencio](./TICKET-02-clipboard-silencioso.md)
3. [TICKET-03 — Estado del input tras el envío (limpieza y re-bloqueo)](./TICKET-03-estado-post-envio.md)

## Archivos del proyecto relevantes
- `index.html` — estructura y estilos (botones invisibles + input).
- `app.js` — lógica de la secuencia secreta, paste, envío y portapapeles.
- `api/correct.js` — función serverless de Vercel (sin cambios previstos
  en estos tickets, pero revisar que el contrato `{ code } → { correctedCode }`
  siga intacto, ya que TICKET-02 depende de él).

## Qué revisará Claude al final
- Que la secuencia de botones (1 → 4 → 2 → 3) siga funcionando y logueando
  en consola como antes.
- Que el input nunca muestre el código corregido en pantalla.
- Que el portapapeles reciba el contenido correcto y completo.
- Que no aparezca ningún `alert`/diálogo nativo de permisos en el flujo
  normal (Chrome/Edge como referencia principal).
- Que no se haya introducido ningún `console.log` que filtre el código en
  sí (solo mensajes de estado genéricos).
- Legibilidad y consistencia del código con el estilo ya existente en el
  repo.

## Nota de seguridad (recordatorio, sin cambios de alcance)
Esto sigue siendo ofuscación de interfaz, no una medida de seguridad real:
cualquiera que inspeccione el HTML/JS puede ver la secuencia y la lógica.
La clave de OpenAI sigue viviendo solo en el backend (`OPENAI_API_KEY` en
Vercel), nunca en el cliente. Ningún ticket de esta ronda cambia eso.
