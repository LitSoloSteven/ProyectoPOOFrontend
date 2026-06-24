import './Resultados.css';

/**
 * Resultados.jsx — Pantalla de confirmación al finalizar el test.
 *
 * Muestra un resumen visual al estudiante y un mensaje de agradecimiento.
 *
 * @param {object}   resultado  - Datos del resultado (puntuación, percentil, etc.)
 * @param {object}   estudiante - Estudiante autenticado
 * @param {function} onLogout   - Callback para cerrar sesión y volver al login
 */
export default function Resultados({ resultado, estudiante, onLogout }) {
  const respondidas = resultado?.totalRespondidas ?? '—';
  const totalPreguntas = resultado?.totalPreguntas ?? 30;
  const puntuacion = resultado?.puntuacionDirecta ?? '—';
  const percentil = resultado?.percentil ?? '—';

  return (
    <div className="resultados-wrapper">
      <div className="resultados-card">
        {/* Ícono de éxito */}
        <div className="resultados-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1>¡Prueba Finalizada!</h1>
        <p className="subtitle">
          Gracias, <strong>{estudiante?.nombres || 'aspirante'}</strong>.
          Tu evaluación ha sido registrada exitosamente.
        </p>

        {/* Resumen de estadísticas */}
        <div className="resultados-stats">
          <div className="stat-card">
            <div className="stat-value">{respondidas}/{totalPreguntas}</div>
            <div className="stat-label">Respondidas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{puntuacion}</div>
            <div className="stat-label">Punt. Directa (RT)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{percentil}</div>
            <div className="stat-label">Percentil</div>
          </div>
        </div>

        <div className="resultados-divider" />

        <p className="resultados-footer-text">
          Los resultados serán revisados por el departamento de psicología.
          Recibirás una notificación cuando estén disponibles tus resultados completos.
        </p>

        <button
          id="btn-cerrar-sesion"
          className="btn-outline"
          onClick={onLogout}
          type="button"
        >
          Cerrar Sesión
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
