import { useState, useEffect, useCallback, useRef } from 'react';
import { obtenerConfiguracionTest, finalizarPrueba } from '../services/api';
import './TestRazonamiento.css';

/* =============================================================
   Datos de demostración del Test de Razonamiento Forma B (Q26–Q55).
   Se usan SOLO cuando el backend no responde o no hay datos.
   En producción, las preguntas se cargan desde la API.
   ============================================================= */
const DEMO_PREGUNTAS = Array.from({ length: 30 }, (_, i) => ({
  id: `pregunta-${i + 1}`,
  orden: 26 + i,
  enunciado: `Serie ${26 + i}: Observe la secuencia y seleccione la alternativa que la completa lógicamente.`,
  alternativas: ['A', 'B', 'C', 'D'].map((letra) => ({
    id: `alt-${i + 1}-${letra}`,
    letra,
    texto: `Opción ${letra}`,
  })),
}));

/** Tiempo límite en segundos (12 minutos = 720s según la BFA) */
const TIEMPO_LIMITE_SEGUNDOS = 12 * 60;

/**
 * TestRazonamiento.jsx — Flujo completo del Test de Razonamiento (Forma B).
 *
 * Estados del componente:
 *  1. INSTRUCCIONES  → Pantalla pre-test (cronómetro NO arranca)
 *  2. CARGANDO       → Obteniendo preguntas del backend
 *  3. EN_PROGRESO    → Test activo (cronómetro corriendo, preguntas visibles)
 *
 * UX: Las preguntas del BFA van de Q26 a Q55, pero al estudiante
 *      se le muestra "Pregunta 1 de 30", "Pregunta 2 de 30", etc.
 *
 * @param {object}   estudiante - Datos del usuario autenticado
 * @param {string}   pruebaId   - ID de la PruebaDeRazonamiento
 * @param {function} onFinish   - Callback al finalizar (recibe resultado)
 */
export default function TestRazonamiento({ estudiante, pruebaId, onFinish }) {
  /* ----------------------------------------------------------
     Estados del componente
     ---------------------------------------------------------- */
  const [fase, setFase] = useState('INSTRUCCIONES'); // 'INSTRUCCIONES' | 'CARGANDO' | 'EN_PROGRESO'
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [segundosRestantes, setSegundosRestantes] = useState(TIEMPO_LIMITE_SEGUNDOS);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const timerRef = useRef(null);

  /* ----------------------------------------------------------
     Derivados
     ---------------------------------------------------------- */
  const totalPreguntas = preguntas.length;
  const pregunta = preguntas[preguntaActual] || null;
  const esUltima = preguntaActual === totalPreguntas - 1;
  const respondidas = Object.keys(respuestas).length;
  const progresoPercent = totalPreguntas > 0 ? (respondidas / totalPreguntas) * 100 : 0;

  /* ----------------------------------------------------------
     Formateo de tiempo mm:ss
     ---------------------------------------------------------- */
  const formatTiempo = (totalSeg) => {
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  /** Clase CSS del cronómetro según el tiempo restante */
  const timerClass = () => {
    if (segundosRestantes <= 60) return 'timer-display danger';
    if (segundosRestantes <= 180) return 'timer-display warning';
    return 'timer-display';
  };

  /* ----------------------------------------------------------
     Cargar preguntas del backend
     ---------------------------------------------------------- */
  const cargarPreguntas = async () => {
    setFase('CARGANDO');
    try {
      const config = await obtenerConfiguracionTest();
      // Si el backend devuelve datos válidos, usarlos
      if (config && config.preguntas && config.preguntas.length > 0) {
        setPreguntas(config.preguntas);
      } else {
        // Fallback a datos de demostración
        console.warn('⚠️ Backend no devolvió preguntas. Usando datos de demostración.');
        setPreguntas(DEMO_PREGUNTAS);
      }
    } catch (err) {
      // Si falla la conexión, usar datos demo
      console.warn('⚠️ Error al cargar preguntas del backend. Usando datos de demostración.', err);
      setPreguntas(DEMO_PREGUNTAS);
    }
    setFase('EN_PROGRESO');
  };

  /* ----------------------------------------------------------
     Iniciar prueba: cargar datos y arrancar cronómetro
     ---------------------------------------------------------- */
  const iniciarPrueba = () => {
    cargarPreguntas();
  };

  /* ----------------------------------------------------------
     Cronómetro regresivo — solo arranca en fase EN_PROGRESO
     ---------------------------------------------------------- */
  useEffect(() => {
    if (fase !== 'EN_PROGRESO') return;

    timerRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTiempoAgotado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [fase]);

  /* ----------------------------------------------------------
     Manejo de respuestas
     ---------------------------------------------------------- */
  const seleccionarRespuesta = (alternativaId) => {
    if (!pregunta) return;
    setRespuestas((prev) => ({
      ...prev,
      [pregunta.id]: alternativaId,
    }));
  };

  /* ----------------------------------------------------------
     Navegación
     ---------------------------------------------------------- */
  const irAnterior = () => {
    if (preguntaActual > 0) setPreguntaActual((p) => p - 1);
  };

  const irSiguiente = () => {
    if (preguntaActual < totalPreguntas - 1) setPreguntaActual((p) => p + 1);
  };

  /* ----------------------------------------------------------
     Envío final de respuestas
     ---------------------------------------------------------- */
  const enviarRespuestas = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    clearInterval(timerRef.current);

    // Empaquetar respuestas para el backend
    const payload = Object.entries(respuestas).map(([preguntaId, alternativaId]) => ({
      preguntaId,
      alternativaId,
    }));

    console.log('📤 Respuestas enviadas:', JSON.stringify(payload, null, 2));

    try {
      const resultado = await finalizarPrueba(pruebaId, payload);
      onFinish(resultado);
    } catch (err) {
      console.error('Error al enviar respuestas:', err);
      // Fallback: navegar a resultados con datos locales
      onFinish({
        totalRespondidas: respondidas,
        totalPreguntas,
        tiempoAgotado,
      });
    }
  }, [enviando, respuestas, pruebaId, onFinish, respondidas, totalPreguntas, tiempoAgotado]);

  /* --- Auto-submit cuando se agota el tiempo --- */
  useEffect(() => {
    if (tiempoAgotado && !enviando) {
      enviarRespuestas();
    }
  }, [tiempoAgotado, enviando, enviarRespuestas]);

  /* ==========================================================
     RENDER: Pantalla de Instrucciones (Pre-Test)
     ========================================================== */
  if (fase === 'INSTRUCCIONES') {
    return (
      <div className="instructions-wrapper">
        <div className="instructions-card">
          {/* Ícono */}
          <div className="instructions-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1>Test de Razonamiento</h1>
          <p className="instructions-subtitle">Forma B — Batería Factorial de Aptitudes</p>

          {/* Instrucciones textuales */}
          <div className="instructions-text">
            En las páginas siguientes encontrará diversas series incompletas.
            Seleccione la opción que completa lógicamente cada serie.
            Dispondrá de un límite estricto de <strong>12 minutos</strong>.
            Procure trabajar rápidamente y sin perder tiempo.
          </div>

          {/* Metadatos del test */}
          <div className="instructions-meta">
            <div className="meta-item">
              <span className="meta-value">30</span>
              <span className="meta-label">Preguntas</span>
            </div>
            <div className="meta-item">
              <span className="meta-value">12:00</span>
              <span className="meta-label">Minutos</span>
            </div>
            <div className="meta-item">
              <span className="meta-value">A–D</span>
              <span className="meta-label">Opciones</span>
            </div>
          </div>

          {/* Botón Iniciar */}
          <button
            id="btn-iniciar-prueba"
            className="btn-start"
            onClick={iniciarPrueba}
            type="button"
          >
            Iniciar Prueba
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER: Estado de Carga
     ========================================================== */
  if (fase === 'CARGANDO' || (fase === 'EN_PROGRESO' && preguntas.length === 0)) {
    return (
      <div className="instructions-wrapper">
        <div className="instructions-card">
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Cargando preguntas del test…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER: Test en Progreso
     ========================================================== */
  return (
    <div className="test-wrapper">
      {/* Barra de progreso superior */}
      <div className="progress-bar-track" role="progressbar" aria-valuenow={respondidas} aria-valuemin={0} aria-valuemax={totalPreguntas}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progresoPercent}%` }}
        />
      </div>

      {/* Cabecera con logo y cronómetro */}
      <header className="test-header">
        <div className="test-header-left">
          <div className="test-header-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <div>
            <div className="test-header-title">Test de Razonamiento — Forma B</div>
            <div className="test-header-subtitle">
              {estudiante?.nombres || 'Aspirante'} · Evaluación BFA
            </div>
          </div>
        </div>

        {/* Cronómetro */}
        <div className="timer-container" id="timer">
          <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className={timerClass()}>
            {formatTiempo(segundosRestantes)}
          </span>
        </div>
      </header>

      {/* Indicador numérico de progreso (muestra 1-30, no Q26-Q55) */}
      <div className="test-progress-info">
        Pregunta <strong>{preguntaActual + 1}</strong> de <strong>{totalPreguntas}</strong>
        &nbsp;·&nbsp; {respondidas} respondidas
      </div>

      {/* Contenido: tarjeta de pregunta */}
      <main className="test-content">
        {pregunta ? (
          <div className="test-card" key={pregunta.id}>
            {/* Badge: muestra "Pregunta X" amigable + el código real Q## sutil */}
            <div className="question-badge">
              <span>Pregunta {preguntaActual + 1}</span>
            </div>

            {/* Enunciado real de la pregunta */}
            <h2 className="question-text" id={`question-${preguntaActual}`}>
              {pregunta.enunciado}
            </h2>

            {/* Opciones A-D mapeadas desde alternativas */}
            <div className="options-grid" role="radiogroup" aria-labelledby={`question-${preguntaActual}`}>
              {pregunta.alternativas.map((alt) => {
                const isSelected = respuestas[pregunta.id] === alt.id;
                return (
                  <button
                    key={alt.id}
                    id={`option-${alt.id}`}
                    className={`option-button${isSelected ? ' selected' : ''}`}
                    onClick={() => seleccionarRespuesta(alt.id)}
                    aria-pressed={isSelected}
                    type="button"
                  >
                    <span className="option-letter">{alt.letra}</span>
                    <span className="option-text">{alt.texto}</span>
                  </button>
                );
              })}
            </div>

            {/* Navegación */}
            <div className="test-navigation">
              <button
                id="btn-anterior"
                className="btn-nav btn-nav-back"
                onClick={irAnterior}
                disabled={preguntaActual === 0}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Anterior
              </button>

              {!esUltima ? (
                <button
                  id="btn-siguiente"
                  className="btn-nav btn-nav-next"
                  onClick={irSiguiente}
                  type="button"
                >
                  Siguiente
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <button
                  id="btn-finalizar"
                  className="btn-nav btn-nav-finish"
                  onClick={enviarRespuestas}
                  disabled={enviando}
                  type="button"
                >
                  {enviando ? 'Enviando…' : 'Finalizar Prueba'}
                  {!enviando && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Fallback si la pregunta actual no existe */
          <div className="test-card">
            <div className="loading-wrapper">
              <div className="spinner" />
              <p>Cargando pregunta…</p>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Tiempo Agotado */}
      {tiempoAgotado && (
        <div className="time-expired-overlay" role="dialog" aria-modal="true">
          <div className="time-expired-modal">
            <div className="time-expired-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2>Tiempo Agotado</h2>
            <p>
              Los 12 minutos del límite han terminado.
              Tus respuestas han sido enviadas automáticamente.
            </p>
            <button
              className="btn-primary"
              onClick={() => onFinish({ tiempoAgotado: true, totalRespondidas: respondidas })}
              type="button"
            >
              Ver Resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
