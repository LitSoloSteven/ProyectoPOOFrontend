import { useState, useEffect, useCallback, useRef } from 'react';
import { finalizarPrueba } from '../services/api';
import './TestRazonamiento.css';

/* =============================================================
   Datos de demostración del Test de Razonamiento Forma B (Q26–Q55).
   Se usan SOLO cuando el backend no responde o no hay datos.
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

const TIEMPO_LIMITE_SEGUNDOS = 12 * 60;

export default function TestRazonamiento({ estudiante, pruebaId, onFinish }) {
  /* ----------------------------------------------------------
     Estados del componente
     ---------------------------------------------------------- */
  const [fase, setFase] = useState('INSTRUCCIONES');
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [segundosRestantes, setSegundosRestantes] = useState(TIEMPO_LIMITE_SEGUNDOS);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  // NUEVO: Estado de diagnóstico
  const [estadoConexion, setEstadoConexion] = useState('Esperando inicio...');

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

  const timerClass = () => {
    if (segundosRestantes <= 60) return 'timer-display danger';
    if (segundosRestantes <= 180) return 'timer-display warning';
    return 'timer-display';
  };

  /* ----------------------------------------------------------
     Cargar preguntas del backend (CON DIAGNÓSTICO AGRESIVO)
     ---------------------------------------------------------- */
  const cargarPreguntas = async () => {
    setFase('CARGANDO');
    setEstadoConexion('Iniciando conexión con OpenXava 🚀...');

    try {
      console.log('📡 [DIAGNÓSTICO] Intentando conectar a: /ProyectoBackend/api/test-razonamiento/configuracion (vía Proxy Vite)');
      
      const response = await fetch('/ProyectoBackend/api/test-razonamiento/configuracion', {
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📥 [DIAGNÓSTICO] Respuesta recibida. Status HTTP: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No se pudo leer el body');
        console.error('📄 [DIAGNÓSTICO] Cuerpo del error recibido:', errorBody);

        if (response.status === 404) {
          if (errorBody.includes('No hay configuraciones')) {
            console.error('❌ [ERROR 404 DE LÓGICA] El endpoint existe y respondió, pero la Base de Datos dice que NO hay ninguna configuración creada. Ve a OpenXava y crea un registro en "Configuracion Test Razonamiento".');
            setEstadoConexion('BD Vacía: Falta crear la Configuración ❌');
          } else {
            console.error('❌ [ERROR 404 DE RUTA] Tomcat no encontró el endpoint. El servidor está vivo pero la ruta es incorrecta.');
            setEstadoConexion('Error 404: Ruta no encontrada ❌');
          }
        } else if (response.status === 401 || response.status === 403) {
          console.error(`🔒 [ERROR ${response.status}] Bloqueo de seguridad. Asegúrate de tener restApiAnonymousUrls configurado en naviox.properties y Tomcat reiniciado.`);
          setEstadoConexion(`Error ${response.status}: Acceso denegado 🔒`);
        } else {
          console.error(`❌ [ERROR HTTP] Status inesperado: ${response.status} - ${response.statusText}`);
          setEstadoConexion(`Error HTTP ${response.status} ❌`);
        }
        throw new Error(`HTTP Error ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log('📦 [DIAGNÓSTICO] Payload JSON decodificado:', data);

      // El endpoint personalizado devuelve { id, titulo, tiempoLimiteMinutos, preguntas: [...] }
      const arrayPreguntas = data.preguntas || [];

      if (arrayPreguntas.length === 0) {
        console.warn('⚠️ [ESTADO VACÍO] La petición fue 200 OK, pero no hay preguntas dentro de la configuración. ¡Agrega preguntas a la serie en OpenXava!');
        setEstadoConexion('Conexión OK, pero configuración sin preguntas 📭');
        setPreguntas(DEMO_PREGUNTAS);
      } else {
        console.log(`✅ [ÉXITO] Se encontraron ${arrayPreguntas.length} preguntas en la base de datos.`);
        setEstadoConexion('¡Datos cargados con éxito! ✅');
        
        // Mapeo adaptado al DTO
        const preguntasFormateadas = arrayPreguntas.map((p, index) => ({
          id: p.id || `pregunta-${index}`,
          orden: p.orden || (index + 1),
          enunciado: p.enunciado || `Sin enunciado`,
          alternativas: p.alternativas ? p.alternativas.map((a, aIdx) => ({
            id: a.id || `alt-${index}-${aIdx}`,
            letra: a.letra || '?',
            texto: a.texto || ''
          })) : []
        }));
        
        setPreguntas(preguntasFormateadas);
      }
    } catch (err) {
      console.error('💥 [ERROR CATASTRÓFICO] Falló el fetch (red o CORS):', err.message);
      setEstadoConexion('Fallo de red o servidor caído 💥');
      console.warn('⚠️ Inyectando datos de demostración como fallback...');
      setPreguntas(DEMO_PREGUNTAS);
    }
    
    // Pequeño delay para que el usuario logre leer el estado (si quiere)
    setTimeout(() => {
      setFase('EN_PROGRESO');
    }, 1500);
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
      onFinish({
        totalRespondidas: respondidas,
        totalPreguntas,
        tiempoAgotado,
      });
    }
  }, [enviando, respuestas, pruebaId, onFinish, respondidas, totalPreguntas, tiempoAgotado]);

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
        <div className="instructions-card" style={{ maxWidth: '800px' }}>
          <div className="instructions-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1>Test de Razonamiento</h1>
          <p className="instructions-subtitle">Forma B</p>

          <div className="instructions-text" style={{ textAlign: 'justify', fontSize: '0.9rem', maxHeight: '350px', overflowY: 'auto', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fdfdfd' }}>
            <p><strong>INSTRUCCIONES</strong></p>
            <p>Usted va a encontrar en las páginas siguientes diversos ejercicios. En cada uno de ellos hay una serie incompleta y cuatro posibles respuestas marcadas con la letra A, B, C, y D; una de las cuales corresponde a la solución correcta que debería colocarse en la casilla en blanco de la serie para completarla lógicamente. Marque con una equis(x) en la columna "RAZONAMIENTO" de su Hoja de Respuestas, la letra que corresponda al solución correcta que completa la serie lógicamente. Existe una sola respuesta correcta en cada ejercicio.</p>
            <p>Si usted se equivoca tache la letra señalada y marque con una equis (x) la nueva respuesta.</p>
            <p><strong>Ejemplos:</strong></p>
            <p>
              23. A-C E<br />
              A: H<br />
              B: I<br />
              C:<br />
              D: J
            </p>
            <p>La respuesta correcta es "I" Usted debe haber marcado con una equis (x) la letra B, que corresponde a la respuesta correcta, al lado derecho del número 23, en la columna RAZONAMIENTO de su Hoja de Respuestas.</p>
            <p>
              24. METAL es a MINERAL como PLANTA es a<br />
              A- NATURALEZA<br />
              B- AGRICULTURA<br />
              C- VEGETAL<br />
              D- HORTALIZA
            </p>
            <p>La solución correcta es VEGETAL. Marque con una equis (x) la letra C, que corresponde a esta palabra, al lado derecho del número 24, en la columna RAZONAMIENTO, de su Hoja de Respuestas.</p>
            <p>Haga usted el ejemplo N° 25</p>
            <p>
              25. 123-234-345<br />
              A- 567<br />
              B- 354<br />
              C- 465<br />
              D- 456
            </p>
            <p>Marque con una equis (x) la respuesta correcta al lado derecho del número 25, en la columna "RAZONAMIENTO" de su Hoja de Respuestas.</p>
            <p>Dispondrá de 12 minutos para hacer esta prueba. Procure hacer el máximo de ejercicios trabajando lo más rápidamente que pueda, sin perder tiempo. Si no encuentra la solución a un ejercicio, pase al siguiente. Usted puede intentar resolverlo al final si dispone de tiempo.</p>
          </div>

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
     RENDER: Estado de Carga / Diagnóstico
     ========================================================== */
  if (fase === 'CARGANDO' || (fase === 'EN_PROGRESO' && preguntas.length === 0)) {
    return (
      <div className="instructions-wrapper">
        <div className="instructions-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-wrapper" style={{ marginBottom: '20px' }}>
            <div className="spinner" />
          </div>
          <h2 style={{ color: '#0056b3', margin: '15px 0' }}>Diagnóstico de Red</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
            {estadoConexion}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
            Abre la consola de herramientas de desarrollo (F12) para ver los logs detallados.
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER: Test en Progreso
     ========================================================== */
  return (
    <div className="test-wrapper">
      <div className="progress-bar-track" role="progressbar" aria-valuenow={respondidas} aria-valuemin={0} aria-valuemax={totalPreguntas}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progresoPercent}%` }}
        />
      </div>

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

      <div className="test-progress-info">
        Pregunta <strong>{preguntaActual + 1}</strong> de <strong>{totalPreguntas}</strong>
        &nbsp;·&nbsp; {respondidas} respondidas
      </div>

      <main className="test-content">
        {pregunta ? (
          <div className="test-card" key={pregunta.id}>
            <div className="question-badge">
              <span>Pregunta {preguntaActual + 1}</span>
            </div>

            <h2 className="question-text" id={`question-${preguntaActual}`}>
              {pregunta.enunciado}
            </h2>

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
                    <path d="m9 18-6-6-6-6" />
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
          <div className="test-card">
            <div className="loading-wrapper">
              <div className="spinner" />
              <p>Cargando pregunta…</p>
            </div>
          </div>
        )}
      </main>

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
