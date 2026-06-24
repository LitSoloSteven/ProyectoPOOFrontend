import { useState } from 'react';
import Login from './views/Login';
import TestRazonamiento from './views/TestRazonamiento';
import Resultados from './views/Resultados';

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
  const [vista, setVista] = useState('login'); // 'login' | 'test' | 'resultados'
  const [estudiante, setEstudiante] = useState(null);
  const [pruebaId, setPruebaId] = useState(null);
  const [resultado, setResultado] = useState(null);

  /** Callback: login exitoso → iniciar prueba */
  const handleLoginSuccess = (est) => {
    setEstudiante(est);
    // En producción se llamaría a iniciarPrueba(est.id) y se usaría el ID real
    setPruebaId('demo-prueba-001');
    setVista('test');
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
    </>
  );
}
