# TICKET-01 — Input imperceptible incluso con texto largo pegado

## Contexto
Actualmente `#secret-input` en `index.html` mide 26×10px. El requisito nuevo
es más estricto: **aunque se pegue un texto largo (varias líneas de código),
visualmente solo debe notarse el ancho de una letra**. No debe expandirse,
no debe hacer scroll visible que delate contenido, no debe cambiar de
tamaño al escribir/pegar.

## Archivos afectados
- `index.html` (estilos de `#secret-input`)

## Requisitos
1. Fijar `width` a un valor equivalente a **un solo carácter** en el
   `font-size` usado (por ejemplo `font-size: 8px` → `width: 7px` a `9px`,
   ajustar a ojo hasta que solo se perciba un trazo/letra).
2. `height` debe mantenerse mínimo (igual o similar al actual, ~8-10px).
3. Asegurar `overflow: hidden` (por defecto en `<input>`, pero confirmar
   que no hay `overflow: visible` en ningún estilo heredado).
4. `white-space: nowrap` no es necesario en `<input>` (no aplica a inputs
   de una línea), pero verificar que no se use `<textarea>` en su lugar —
   debe seguir siendo `<input type="text">` para evitar cualquier expansión
   automática de altura.
5. El input **no debe redimensionarse** al escribir, pegar (`paste`) ni al
   recibir foco. Probar específicamente el evento `paste` con un bloque de
   código de 50+ líneas y confirmar visualmente que el elemento no crece.
6. Mantener (o mejorar) el disimulo visual: sin borde visible fuerte, sin
   fondo, color de texto casi transparente hasta que estado `enabled`.
7. No usar `resize` en CSS (los inputs de texto no lo soportan, pero
   verificar que ningún wrapper permita redimensionar).

## Criterios de aceptación
- [ ] Pegar un texto de una sola línea corta: el input se ve igual que
      antes (casi imperceptible).
- [ ] Pegar un bloque de código de 50+ líneas: el input **no cambia de
      tamaño**, sigue viéndose como una sola letra/trazo diminuto.
- [ ] El cursor de texto (`caret`) sigue siendo invisible/transparente
      mientras el input está bloqueado (`disabled`), y visible solo cuando
      está en estado `enabled` (o incluso ahí, mantenerlo discreto).
- [ ] No hay scrollbars ni indicios visuales de que hay más contenido del
      que se ve.
