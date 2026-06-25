/* --- API Service — Comunicación con OpenXava Backend ---
   Usa ruta relativa: el proxy de Vite redirige /ProyectoBackend
   al backend Tomcat en http://localhost:8080 automáticamente.
   ------------------------------------------------------------- */

const API_BASE = '/ProyectoBackend';

/**
 * Wrapper genérico para peticiones fetch con manejo de errores.
 * @param {string} endpoint - Ruta relativa al backend
 * @param {object} options  - Opciones de fetch (method, body, headers, etc.)
 * @returns {Promise<any>}  - Respuesta JSON parseada
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Error desconocido');
    throw new Error(`Error ${response.status}: ${errorBody}`);
  }

  // Algunas respuestas pueden no tener body (204)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/* ---------- Autenticación ---------- */

/**
 * Acceso de estudiante universitario por CIF.
 * Mapeado a AutenticacionService.accesoUniversitario(cif)
 */
export async function loginEstudiante(cif) {
  return request('/api/auth/acceso-universitario', {
    method: 'POST',
    body: JSON.stringify({ cif }),
  });
}

/**
 * Login administrativo (psicólogo evaluador).
 * Mapeado a AutenticacionService.loginAdministrativo(cif, contrasena)
 */
export async function loginAdministrativo(cif, contrasena) {
  return request('/api/auth/login-administrativo', {
    method: 'POST',
    body: JSON.stringify({ cif, contrasena }),
  });
}

/* ---------- Configuración del Test ---------- */

/**
 * Obtiene la configuración del Test de Razonamiento (Forma B),
 * incluyendo preguntas y alternativas.
 * Mapeado a ConfiguracionTestRazonamiento
 */
export async function obtenerConfiguracionTest() {
  return request('/api/test-razonamiento/configuracion');
}

/* ---------- Prueba / Intento ---------- */

/**
 * Crea un nuevo intento de prueba para el estudiante autenticado.
 * @param {string} estudianteId - ID del EstudianteUniversitario
 * @returns {Promise<object>} - PruebaDeRazonamiento creada (con id, horaInicio, etc.)
 */
export async function iniciarPrueba(estudianteId) {
  return request('/api/test-razonamiento/iniciar', {
    method: 'POST',
    body: JSON.stringify({ estudianteId }),
  });
}

/**
 * Envía las respuestas del estudiante y finaliza la prueba.
 * @param {string} pruebaId   - ID de la PruebaDeRazonamiento
 * @param {Array}  respuestas - Array de { preguntaId, alternativaId }
 * @returns {Promise<object>} - Resultado con puntuacionDirecta, percentil, estado
 */
export async function finalizarPrueba(pruebaId, respuestas) {
  return request('/api/test-razonamiento/finalizar', {
    method: 'POST',
    body: JSON.stringify({ pruebaId, respuestas }),
  });
}
