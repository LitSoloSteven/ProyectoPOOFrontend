import { useState, useEffect } from 'react';
import Login from './views/Login';
import TestRazonamiento from './views/TestRazonamiento';
import Resultados from './views/Resultados';
import DashboardEvaluador from './views/DashboardEvaluador';
import ThemeSwitcher from './components/ThemeSwitcher';

/**
 * App.jsx — Componente raíz de la aplicación BFA.
 *
 * Maneja la navegación entre tres vistas:
 *  1. Login        → Autenticación del estudiante por CIF
 *  2. Test         → Prueba de Razonamiento Forma B (30 preguntas, 12 min)
 *  3. Resultados   → Confirmación y resumen post-evaluación
 *
 * El estado de la sesión (estudiante autenticado, ID de prueba, resultado)
 * se gestiona localmente con useState.
 */
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('bfa-theme') || 'animated');
  const [vista, setVista] = useState('login'); // 'login' | 'test' | 'resultados'
  const [estudiante, setEstudiante] = useState(null);
  const [pruebaId, setPruebaId] = useState(null);
  const [resultado, setResultado] = useState(null);

  const handleLoginSuccess = (est) => {
    setEstudiante(est);
    if (est.rol === 'evaluador') {
      setVista('dashboard');
    } else {
      setVista('test');
    }
  };

  /** Callback: prueba finalizada → mostrar resultados */
  const handleTestFinish = (res) => {
    setResultado(res);
    setVista('resultados');
  };

  /** Callback: cerrar sesión → volver al login */
  const handleLogout = () => {
    setEstudiante(null);
    setPruebaId(null);
    setResultado(null);
    setVista('login');
  };

  return (
    <>
      <ThemeSwitcher theme={theme} setTheme={setTheme} />

      {vista === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {vista === 'test' && (
        <TestRazonamiento
          estudiante={estudiante}
          pruebaId={pruebaId}
          onFinish={handleTestFinish}
        />
      )}

      {vista === 'resultados' && (
        <Resultados
          resultado={resultado}
          estudiante={estudiante}
          onLogout={handleLogout}
        />
      )}

      {vista === 'dashboard' && (
        <DashboardEvaluador
          evaluador={estudiante}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
