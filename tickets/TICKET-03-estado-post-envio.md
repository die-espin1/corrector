# TICKET-03 — Estado del input tras el envío (limpieza y re-bloqueo)

## Contexto
Con el cambio del TICKET-02, el input queda vacío después de cada envío.
Falta definir qué pasa con el **estado de desbloqueo** después de eso.

## Decisión por defecto (implementar así salvo indicación contraria)
- Después de copiar al portapapeles y limpiar el input, el input
  **permanece desbloqueado** (se puede seguir pegando y enviando código
  varias veces sin repetir la secuencia de botones), hasta que se recargue
  la página.
- Al recargar la página (`F5` o nueva visita), el input vuelve a su estado
  bloqueado inicial y hay que repetir la secuencia 1 → 4 → 2 → 3.

Si se prefiere que el input se **vuelva a bloquear automáticamente** tras
cada envío (obligando a repetir la secuencia cada vez), dejarlo como una
constante fácil de cambiar en `app.js`, por ejemplo:

```js
const RELOCK_AFTER_SUBMIT = false; // true = exige repetir la secuencia tras cada envío
```

y aplicar `lockInput()` al final del flujo si `RELOCK_AFTER_SUBMIT` es
`true`.

## Archivos afectados
- `app.js`

## Criterios de aceptación
- [ ] Existe una constante clara (`RELOCK_AFTER_SUBMIT` o similar) que
      controla el comportamiento, documentada con un comentario de una
      línea.
- [ ] Comportamiento por defecto: `false` (no se vuelve a bloquear solo).
- [ ] El input, aunque quede desbloqueado, **sigue vacío y visualmente
      imperceptible** entre usos (no hay ningún indicio de que ya se usó).
