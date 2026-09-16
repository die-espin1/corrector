// Configuración: true exige repetir la secuencia secreta tras cada envío; false mantiene el input habilitado
const RELOCK_AFTER_SUBMIT = false;

// Debe coincidir con MAX_INPUT_CHARS en api/correct.js para evitar un viaje
// de red inútil cuando el contenido pegado es demasiado grande.
const MAX_INPUT_CHARS = 200000;

// Orden secreto de pulsación: 1 (arriba-izq) -> 4 (abajo-der) -> 2 (arriba-der) -> 3 (abajo-izq)
const SEQUENCE = [1, 4, 2, 3];
let progress = 0;
let pendingCode = '';
let isSubmitting = false;

const input = document.getElementById('secret-input');

document.querySelectorAll('.corner-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const num = parseInt(btn.dataset.num, 10);
    console.log('Botón presionado:', num);
    handlePress(num);
  });
});

function handlePress(num) {
  const expected = SEQUENCE[progress];

  if (num === expected) {
    progress++;
    if (progress === SEQUENCE.length) {
      unlockInput();
      progress = 0; // se puede volver a repetir la secuencia si se recarga la página
    }
  } else {
    // Si falla, reinicia el progreso (pero permite que el fallo sea el inicio de una nueva secuencia)
    progress = num === SEQUENCE[0] ? 1 : 0;
  }
}

function unlockInput() {
  input.disabled = false;
  input.classList.add('enabled');
  input.focus();
  console.log('Secuencia correcta: input habilitado.');
}

function lockInput() {
  input.disabled = true;
  input.classList.remove('enabled');
}

// Capturar el contenido íntegro pegado con saltos de línea sin expandir el DOM
input.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData)?.getData('text');
  if (text) {
    pendingCode = text;
    input.value = ' ';
  }
});

// Si el usuario vacía manualmente el input, limpiar el buffer en memoria
input.addEventListener('input', () => {
  if (!input.value) {
    pendingCode = '';
  }
});

input.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (isSubmitting) return;

  const content = pendingCode || input.value;
  if (!content.trim()) return;

  if (content.length > MAX_INPUT_CHARS) {
    console.error(
      `Contenido demasiado grande (${content.length} caracteres, límite ${MAX_INPUT_CHARS}). No se envió.`
    );
    return;
  }

  // Limpiar input y buffer de inmediato para no dejar rastro visible en pantalla
  input.value = '';
  pendingCode = '';
  isSubmitting = true;

  lockInput();
  console.log('Enviando contenido a la API para revisión...');

  try {
    const response = await fetch('/api/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: content }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de la API:', data?.error || 'Código de respuesta ' + response.status);
    } else if (data?.correctedCode) {
      if (data.warning) {
        console.warn('Aviso de la API:', data.warning);
      }
      try {
        await navigator.clipboard.writeText(data.correctedCode);
        console.log('Contenido corregido copiado al portapapeles.');
      } catch (clipErr) {
        console.error('Error al copiar al portapapeles:', clipErr?.message || 'Permiso denegado');
      }
    }
  } catch (err) {
    console.error('Error al contactar la API:', err?.message || 'Fallo de red');
  } finally {
    isSubmitting = false;
    if (RELOCK_AFTER_SUBMIT) {
      lockInput();
    } else {
      input.disabled = false;
      input.classList.add('enabled');
      input.focus();
    }
  }
});
