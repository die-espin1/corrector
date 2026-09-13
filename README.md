# Corrector

Sistema oculto de corrección de código vía OpenAI.

## Cómo funciona

- La página (`index.html`) se ve completamente en blanco.
- Hay 4 botones invisibles (sin borde, sin fondo, sin texto) ubicados en las
  4 esquinas de la pantalla, lo suficientemente grandes para poder pulsarlos
  a ciegas.
- Cada clic imprime en la consola del navegador el número de botón pulsado
  (1 = arriba-izq, 2 = arriba-der, 3 = abajo-izq, 4 = abajo-der).
- Si se pulsan en el orden secreto **1 → 4 → 2 → 3**, se habilita un input
  diminuto ubicado arriba, en el centro de la pantalla (casi imperceptible).
- Al escribir código en ese input y presionar **Enter**, se envía una
  petición a `/api/correct`, una función serverless de Vercel que consulta
  la API de OpenAI para corregir el código (solo lo modifica si tiene
  errores; si ya es correcto, lo devuelve igual).
- El resultado corregido reemplaza el contenido del input.

La clave de la API de OpenAI **nunca** se expone en el navegador: vive solo
en el servidor, como variable de entorno.

## Estructura

```
Corrector/
├── index.html      # Página estática (botones + input ocultos)
├── app.js          # Lógica de la secuencia secreta y llamada a la API
├── api/
│   └── correct.js  # Función serverless (Vercel) que llama a OpenAI
├── package.json
└── .gitignore
```

## Configuración local

1. Instala la CLI de Vercel (si no la tienes):
   ```bash
   npm install -g vercel
   ```
2. Dentro de la carpeta del proyecto, crea un archivo `.env.local` con tu
   clave de OpenAI (este archivo está en `.gitignore`, no se sube):
   ```
   OPENAI_API_KEY=sk-tu-clave-aqui
   ```
3. Corre el proyecto en local:
   ```bash
   vercel dev
   ```
4. Abre `http://localhost:3000`, prueba la secuencia de botones en las
   esquinas (1, 4, 2, 3) y luego escribe en el input.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio de GitHub (o usa `vercel` CLI
   directamente desde la carpeta local).
2. En el dashboard de Vercel, importa el proyecto.
3. En **Settings → Environment Variables**, agrega:
   - `OPENAI_API_KEY` = tu clave real de OpenAI
4. Despliega. Vercel detectará automáticamente `index.html` como sitio
   estático y `api/correct.js` como función serverless.

## Notas de seguridad

- Nunca pongas la clave de OpenAI directamente en `app.js` ni en ningún
  archivo del lado del cliente: sería visible para cualquiera que abra las
  herramientas de desarrollador del navegador.
- Este "sistema oculto" (botones invisibles + orden secreto) es solo una
  capa de ofuscación, no una medida de seguridad real. Cualquiera que
  inspeccione el HTML/JS puede ver la secuencia y los selectores. Si
  necesitas protección real, añade autenticación de verdad (contraseña,
  token, etc.) en el backend antes de llamar a OpenAI.
