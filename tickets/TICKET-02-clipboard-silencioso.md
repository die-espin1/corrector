# TICKET-02 — Respuesta nunca visible: copiar al portapapeles en silencio

## Contexto
Hoy `app.js` hace `input.value = data.correctedCode;` — es decir, muestra
el resultado en el input. Esto debe cambiar: **la respuesta de la API
nunca debe mostrarse en pantalla**. En su lugar, el código corregido debe
copiarse automáticamente al portapapeles del sistema, sin mostrar ningún
diálogo/permiso/alerta del navegador, y solo debe quedar constancia en la
consola (`console.log`).

## Archivos afectados
- `app.js`

## Flujo esperado (nuevo)
1. El input se desbloquea con la secuencia de botones (sin cambios).
2. El usuario **pega** código en el input (no lo escribe letra por letra;
   el flujo típico es Ctrl+V).
3. El usuario presiona **Enter**.
4. Se envía el código a `/api/correct` (sin cambios en el backend).
5. Al recibir la respuesta:
   - **NO** se debe hacer `input.value = correctedCode`.
   - Se debe copiar `correctedCode` al portapapeles con
     `navigator.clipboard.writeText(correctedCode)`.
   - Se debe limpiar el input (`input.value = ''`) para no dejar rastro
     visible del texto pegado.
   - Se debe imprimir en consola únicamente un mensaje de confirmación,
     por ejemplo: `console.log('Código corregido copiado al portapapeles.')`.
   - Si algo falla (la copia o la petición), solo `console.error(...)`,
     nunca `alert()`, `confirm()` ni ningún elemento visual de error.

## Detalle técnico importante: gesto de usuario y Clipboard API
`navigator.clipboard.writeText()` requiere "transient activation" (que la
llamada ocurra como resultado de una interacción directa del usuario,
como un `keydown`/`keyup` de Enter). Como aquí hay un `await fetch(...)`
de por medio, el tiempo transcurrido puede hacer que se pierda esa
activación en algunos navegadores (especialmente Safari), lo que provocaría
que el navegador **bloquee la copia o pida permiso** — justo lo que no
queremos.

Mitigación a implementar:
- Probar primero la ruta simple: llamar a `writeText` inmediatamente
  después del `await fetch/json()` dentro del mismo handler de `keydown`
  (sin `setTimeout` de por medio). En Chrome/Edge esto normalmente
  funciona bien incluso tras un `await`.
- Si en las pruebas (Chrome, Edge, Firefox) aparece algún problema de
  permisos, documentarlo en el PR y proponer alternativa (por ejemplo,
  usar `Permissions API` para verificar `clipboard-write` de antemano, o
  pedir permiso de portapapeles una sola vez al desbloquear el input, para
  que ya esté concedido cuando llegue la respuesta de la API).
- No es aceptable ninguna solución que muestre un popup nativo del
  navegador pidiendo permiso en el momento de copiar — si eso ocurre en
  algún navegador, hay que resolverlo o dejarlo documentado como
  limitación conocida de ese navegador específico.

## Criterios de aceptación
- [ ] Tras pegar código y presionar Enter, el input queda vacío y no se ve
      ningún resultado en pantalla.
- [ ] El portapapeles del sistema contiene el código corregido devuelto
      por la API (verificar pegando en otro editor de texto).
- [ ] La consola del navegador muestra únicamente un mensaje de
      confirmación (o de error si algo falla), nunca el código en sí.
- [ ] No aparece ningún `alert`, `confirm`, notificación del navegador ni
      diálogo de permisos visible durante el flujo normal en Chrome/Edge.
- [ ] Probado con al menos un bloque de código real (30+ líneas) para
      confirmar que el portapapeles recibe el texto completo, no truncado.
