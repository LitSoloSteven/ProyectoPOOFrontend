import { useState, useEffect } from 'react';
import { obtenerResultados, guardarReporteEvaluador } from '../services/api';
import './DashboardEvaluador.css';

export default function DashboardEvaluador({ evaluador, onLogout }) {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');

  // Estado para el modal de reporte
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPruebaId, setReportPruebaId] = useState(null);
  const [reportData, setReportData] = useState({ observaciones: '', requiereEntrevista: false });
  const [guardandoReporte, setGuardandoReporte] = useState(false);

  // Estado para el modal de detalles
  const [modalResult, setModalResult] = useState(null);

  const fetchResultados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerResultados();
      setResultados(data || []);
    } catch (err) {
      setError(err.message || 'Error al obtener resultados');
    } finally {
      setLoading(false);
    }
  };

  const abrirReporte = (res) => {
    setReportPruebaId(res.id);
    setReportData({
      observaciones: res.observacionesEvaluador || '',
      requiereEntrevista: res.requiereEntrevista || false
    });
    setReportModalOpen(true);
  };

  const guardarReporte = async () => {
    try {
      setGuardandoReporte(true);
      await guardarReporteEvaluador({
        pruebaId: reportPruebaId,
        observaciones: reportData.observaciones,
        requiereEntrevista: reportData.requiereEntrevista
      });
      
      alert('Reporte guardado exitosamente.');
      setReportModalOpen(false);
      fetchResultados(); // Recargar para actualizar el estado del reporte en la tabla
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoReporte(false);
    }
  };

  useEffect(() => {
    fetchResultados();
  }, []);

  const formatearFecha = (fechaArray) => {
    if (!fechaArray || fechaArray.length < 5) return 'N/A';
    const [year, month, day, hour, minute] = fechaArray;
    return `${day}/${month}/${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getScoreClass = (score) => {
    if (score >= 25) return 'score-high';
    if (score >= 15) return 'score-med';
    return 'score-low';
  };

  const resultadosFiltrados = resultados.filter((res) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch = !term ||
      (res.aspiranteNombres && res.aspiranteNombres.toLowerCase().includes(term)) ||
      (res.aspiranteApellidos && res.aspiranteApellidos.toLowerCase().includes(term)) ||
      (res.cedulaOCif && res.cedulaOCif.toLowerCase().includes(term));
      
    const matchZona = !filtroZona || (res.zona && res.zona.toLowerCase().trim() === filtroZona.toLowerCase().trim());
    
    let matchInst = true;
    if (filtroInstitucion) {
       const resInst = res.institucion ? res.institucion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
       const filInst = filtroInstitucion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
       matchInst = resInst === filInst || resInst.includes(filInst);
    }

    return matchSearch && matchZona && matchInst;
  });

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>BFA Panel de Control</h1>
          <p>Módulo de Evaluación Psicométrica</p>
        </div>
        <div className="dashboard-user">
          <div className="user-info">
            <div className="user-avatar">
              {evaluador?.nombres ? evaluador.nombres.charAt(0).toUpperCase() : 'E'}
            </div>
            <span>{evaluador?.nombres || 'Evaluador'}</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="stat-info">
              <h3>Pruebas Realizadas</h3>
              <p>{resultados.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <h3>Promedio (Pts)</h3>
              <p>
                {resultados.length > 0 
                  ? (resultados.reduce((acc, curr) => acc + (curr.puntuacionDirecta || 0), 0) / resultados.length).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="search-box">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por Nombre o CIF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filters-group">
            <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className="filter-select">
              <option value="">Todas las zonas</option>
              <option value="URBANA">Urbana</option>
              <option value="RURAL">Rural</option>
            </select>
            
            <select value={filtroInstitucion} onChange={(e) => setFiltroInstitucion(e.target.value)} className="filter-select">
              <option value="">Todas las instituciones</option>
              <option value="UAM">UAM (Universitario)</option>
              <option value="PÚBLICO">Público</option>
              <option value="PRIVADO">Privado</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-container">
          <div className="table-header">
            <h2>Resultados Recientes</h2>
            <button className="btn-refresh" onClick={fetchResultados} disabled={loading}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Actualizar
            </button>
          </div>
          
          {loading ? (
            <div className="dashboard-loading">
              <div className="spinner"></div>
              <p>Cargando resultados...</p>
            </div>
          ) : error ? (
            <div className="dashboard-loading">
              <p style={{color: '#f87171'}}>{error}</p>
            </div>
          ) : resultadosFiltrados.length === 0 ? (
            <div className="dashboard-loading">
              <p>No se encontraron resultados que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Aspirante</th>
                  <th>Tipo / Origen</th>
                  <th>Fecha/Hora</th>
                  <th>Aciertos</th>
                  <th>Percentil</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resultadosFiltrados.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <strong>{res.aspiranteNombres} {res.aspiranteApellidos}</strong>
                      <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>{res.cedulaOCif}</div>
                    </td>
                    <td>
                      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap: '4px'}}>
                        <span className="badge-tipo">{res.tipoAspirante}</span>
                        {(res.zona !== 'N/A' || res.institucion !== 'N/A') && (
                          <span style={{fontSize: '0.75rem', color: 'var(--color-text-muted)'}}>
                            {res.zona !== 'N/A' ? res.zona : ''} {res.institucion !== 'N/A' ? `· ${res.institucion}` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatearFecha(res.horaInicio)}</td>
                    <td className={getScoreClass(res.puntuacionDirecta)}>
                      {res.puntuacionDirecta !== null ? `${res.puntuacionDirecta} / 30` : 'N/E'}
                    </td>
                    <td>
                      {res.percentil !== null ? `P${res.percentil}` : 'N/E'}
                    </td>
                    <td>
                      <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                        <button className="btn-details" onClick={() => setModalResult(res)}>
                          Ver Detalles
                        </button>
                        <button 
                          className="btn-details" 
                          style={{ borderColor: res.tieneReporte ? '#4ade80' : '', color: res.tieneReporte ? '#166534' : '', background: res.tieneReporte ? '#dcfce3' : '' }} 
                          onClick={() => abrirReporte(res)}
                        >
                          {res.tieneReporte ? 'Ver Reporte' : 'Generar Reporte'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal de Detalles */}
      {modalResult && (
        <div className="modal-overlay" onClick={() => setModalResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de la Prueba</h2>
              <button className="btn-close" onClick={() => setModalResult(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-student-info">
                <h3>{modalResult.aspiranteNombres} {modalResult.aspiranteApellidos}</h3>
                <p>{modalResult.cedulaOCif} · {modalResult.tipoAspirante}</p>
                <div className="modal-scores">
                  <div className="score-box">
                    <span>Aciertos</span>
                    <strong>{modalResult.puntuacionDirecta} / 30</strong>
                  </div>
                  <div className="score-box">
                    <span>Percentil</span>
                    <strong>{modalResult.percentil}</strong>
                  </div>
                </div>
              </div>

              <h4>Desglose de Respuestas</h4>
              {!modalResult.respuestas || modalResult.respuestas.length === 0 ? (
                <p>No se encontraron respuestas guardadas para esta prueba.</p>
              ) : (
                <div className="answers-grid">
                  {modalResult.respuestas
                    .sort((a, b) => a.ordenPregunta - b.ordenPregunta)
                    .map((resp, index) => (
                    <div key={index} className={`answer-card ${resp.esCorrecta ? 'correct' : 'incorrect'}`}>
                      <span className="q-num">Q{resp.ordenPregunta}</span>
                      <span className="q-ans">{resp.letraMarcada || '?'}</span>
                      <span className="q-icon">
                        {resp.esCorrecta ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte del Evaluador */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Reporte del Evaluador</h2>
              <button className="btn-close" onClick={() => setReportModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Observaciones Cualitativas:</label>
                <textarea
                  style={{ width: '100%', height: '120px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Escriba sus observaciones sobre el aspirante..."
                  value={reportData.observaciones}
                  onChange={(e) => setReportData({...reportData, observaciones: e.target.value})}
                ></textarea>
              </div>

              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn-details" onClick={() => setReportModalOpen(false)} style={{ color: 'var(--color-text-muted)', border: 'none', background: 'transparent' }}>
                  Cancelar
                </button>
                <button 
                  className="btn-details" 
                  onClick={guardarReporte} 
                  disabled={guardandoReporte}
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  {guardandoReporte ? 'Guardando...' : 'Guardar Reporte'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
