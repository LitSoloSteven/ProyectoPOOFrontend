import { useState } from 'react';
import './Login.css';

/* =============================================================
   Definición de roles disponibles en el sistema BFA.
   Cada rol tiene: id, label, sublabel e ícono SVG.
   ============================================================= */
const ROLES = [
  {
    id: 'universitario',
    label: 'Estudiante Universitario',
    sublabel: 'Con CIF institucional',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
  },
  {
    id: 'egresado',
    label: 'Egresado de Secundaria',
    sublabel: 'Bachiller graduado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <polyline points="10 2 10 10 13 7 16 10 16 2" />
      </svg>
    ),
  },
  {
    id: 'secundaria',
    label: 'Estudiante de Secundaria',
    sublabel: 'Actualmente cursando',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: 'psicologo',
    label: 'Psicólogo',
    sublabel: 'Administrador / Evaluador',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

/**
 * Login.jsx — Flujo de autenticación multi-paso.
 *
 * Paso 1: Selección de rol (4 tarjetas elegantes)
 * Paso 2: Formulario condicional según el rol seleccionado
 *
 * Roles:
 *  - Universitario  → CIF (8 dígitos), Nombre, Edad, Sexo
 *  - Egresado       → Nombre, Edad, Sexo (UUID interno)
 *  - Secundaria     → Nombre, Edad, Sexo (UUID interno)
 *  - Psicólogo      → Cédula, Contraseña
 *
 * @param {function} onLoginSuccess - Callback que recibe los datos del usuario autenticado
 */
export default function Login({ onLoginSuccess }) {
  /* ----------------------------------------------------------
     Estado del componente
     ---------------------------------------------------------- */
  const [paso, setPaso] = useState(1);           // Paso actual (1 o 2)
  const [rolSeleccionado, setRolSeleccionado] = useState(null); // Rol elegido
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos del formulario (compartidos entre todos los roles)
  const [formData, setFormData] = useState({
    cif: '',
    nombreCompleto: '',
    edad: '',
    sexo: '',
    cedula: '',
    contrasena: '',
  });

  /* ----------------------------------------------------------
     Handlers genéricos
     ---------------------------------------------------------- */

  /** Actualiza un campo individual del formulario */
  const handleChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setError(''); // Limpiar error al escribir
  };

  /** Paso 1 → Paso 2: seleccionar rol */
  const seleccionarRol = (rolId) => {
    setRolSeleccionado(rolId);
    setError('');
    // Limpiar campos al cambiar de rol
    setFormData({
      cif: '',
      nombreCompleto: '',
      edad: '',
      sexo: '',
      cedula: '',
      contrasena: '',
    });
    setPaso(2);
  };

  /** Paso 2 → Paso 1: volver atrás */
  const volverAPaso1 = () => {
    setPaso(1);
    setRolSeleccionado(null);
    setError('');
  };

  /* ----------------------------------------------------------
     Validación y envío
     ---------------------------------------------------------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // --- Validaciones por rol ---
    if (rolSeleccionado === 'universitario') {
      // CIF: exactamente 8 dígitos numéricos
      if (!/^\d{8}$/.test(formData.cif)) {
        setError('El CIF debe tener exactamente 8 dígitos numéricos (ej. 25010756).');
        return;
      }
      if (!formData.nombreCompleto.trim()) {
        setError('Ingresa tu nombre completo.');
        return;
      }
      if (!formData.edad || parseInt(formData.edad) < 15 || parseInt(formData.edad) > 80) {
        setError('Ingresa una edad válida (entre 15 y 80 años).');
        return;
      }
      if (!formData.sexo) {
        setError('Selecciona tu sexo.');
        return;
      }
    }

    if (rolSeleccionado === 'egresado' || rolSeleccionado === 'secundaria') {
      if (!formData.nombreCompleto.trim()) {
        setError('Ingresa tu nombre completo.');
        return;
      }
      if (!formData.edad || parseInt(formData.edad) < 12 || parseInt(formData.edad) > 80) {
        setError('Ingresa una edad válida (entre 12 y 80 años).');
        return;
      }
      if (!formData.sexo) {
        setError('Selecciona tu sexo.');
        return;
      }
    }

    if (rolSeleccionado === 'psicologo') {
      if (!formData.cedula.trim()) {
        setError('Ingresa tu número de cédula.');
        return;
      }
      if (!formData.contrasena) {
        setError('Ingresa tu contraseña.');
        return;
      }
    }

    // --- Empaquetar datos según el rol ---
    setLoading(true);

    let payload = { rol: rolSeleccionado };

    if (rolSeleccionado === 'universitario') {
      payload = {
        ...payload,
        cif: formData.cif,
        nombreCompleto: formData.nombreCompleto.trim(),
        edad: parseInt(formData.edad),
        sexo: formData.sexo,
      };
    } else if (rolSeleccionado === 'egresado' || rolSeleccionado === 'secundaria') {
      // El backend asignará un UUID interno, no se pide CIF
      payload = {
        ...payload,
        nombreCompleto: formData.nombreCompleto.trim(),
        edad: parseInt(formData.edad),
        sexo: formData.sexo,
      };
    } else if (rolSeleccionado === 'psicologo') {
      payload = {
        ...payload,
        cedula: formData.cedula.trim(),
        contrasena: formData.contrasena,
      };
    }

    // --- Simular envío al backend ---
    console.log('═══════════════════════════════════════════');
    console.log('📤 Datos que se enviarían al backend:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════');

    // Simular respuesta exitosa después de 800ms
    setTimeout(() => {
      setLoading(false);
      // Pasar los datos al componente padre
      onLoginSuccess({
        ...payload,
        nombres: payload.nombreCompleto || payload.cedula || payload.cif,
      });
    }, 800);
  };

  /* ----------------------------------------------------------
     Obtener datos del rol seleccionado
     ---------------------------------------------------------- */
  const rolActual = ROLES.find((r) => r.id === rolSeleccionado);

  /** Texto del botón de submit según el rol */
  const textoBotonSubmit = () => {
    if (loading) return 'Procesando…';
    if (rolSeleccionado === 'psicologo') return 'Ingresar';
    return 'Iniciar Prueba';
  };

  /* ----------------------------------------------------------
     Render
     ---------------------------------------------------------- */
  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* ===== Branding ===== */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1>BFA Test</h1>
          <p>Batería Factorial de Aptitudes</p>
        </div>

        {/* ===== Indicador de Pasos (dots) ===== */}
        <div className="step-indicator">
          <div className={`step-dot ${paso >= 1 ? 'active' : ''}`} />
          <div className={`step-line ${paso >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${paso >= 2 ? 'active' : ''}`} />
        </div>

        {/* ===== PASO 1: Selección de Rol ===== */}
        {paso === 1 && (
          <>
            <div className="step-title">
              <h2>¿Quién eres?</h2>
              <p>Selecciona tu perfil para continuar</p>
            </div>

            <div className="roles-grid" id="roles-grid">
              {ROLES.map((rol) => (
                <button
                  key={rol.id}
                  id={`role-${rol.id}`}
                  className="role-card"
                  onClick={() => seleccionarRol(rol.id)}
                  type="button"
                >
                  <div className="role-icon">{rol.icon}</div>
                  <span className="role-label">{rol.label}</span>
                  <span className="role-sublabel">{rol.sublabel}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== PASO 2: Formulario Condicional ===== */}
        {paso === 2 && (
          <>
            <div className="step-title">
              <h2>Completa tus datos</h2>
            </div>

            {/* Badge con el rol seleccionado */}
            {rolActual && (
              <div className="role-selected-badge">
                {rolActual.icon}
                {rolActual.label}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} id="login-form">

              {/* --- Formulario: Estudiante Universitario --- */}
              {rolSeleccionado === 'universitario' && (
                <>
                  <div className="form-group">
                    <label htmlFor="input-cif">CIF (Carnet Institucional)</label>
                    <input
                      id="input-cif"
                      className={`form-input ${error.includes('CIF') ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Ej. 25010756"
                      value={formData.cif}
                      onChange={(e) => {
                        // Solo permitir dígitos
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('cif', val);
                      }}
                      autoFocus
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="input-nombre">Nombre Completo</label>
                    <input
                      id="input-nombre"
                      className="form-input"
                      type="text"
                      placeholder="Ej. María López Pérez"
                      value={formData.nombreCompleto}
                      onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="input-edad">Edad</label>
                      <input
                        id="input-edad"
                        className="form-input"
                        type="number"
                        min="15"
                        max="80"
                        placeholder="Ej. 20"
                        value={formData.edad}
                        onChange={(e) => handleChange('edad', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-sexo">Sexo</label>
                      <select
                        id="input-sexo"
                        className="form-select"
                        value={formData.sexo}
                        onChange={(e) => handleChange('sexo', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* --- Formulario: Egresado o Estudiante de Secundaria --- */}
              {(rolSeleccionado === 'egresado' || rolSeleccionado === 'secundaria') && (
                <>
                  <div className="form-group">
                    <label htmlFor="input-nombre-ext">Nombre Completo</label>
                    <input
                      id="input-nombre-ext"
                      className="form-input"
                      type="text"
                      placeholder="Ej. Carlos Martínez Ruiz"
                      value={formData.nombreCompleto}
                      onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                      autoFocus
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="input-edad-ext">Edad</label>
                      <input
                        id="input-edad-ext"
                        className="form-input"
                        type="number"
                        min="12"
                        max="80"
                        placeholder="Ej. 17"
                        value={formData.edad}
                        onChange={(e) => handleChange('edad', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-sexo-ext">Sexo</label>
                      <select
                        id="input-sexo-ext"
                        className="form-select"
                        value={formData.sexo}
                        onChange={(e) => handleChange('sexo', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* --- Formulario: Psicólogo (Administrador) --- */}
              {rolSeleccionado === 'psicologo' && (
                <>
                  <div className="form-group">
                    <label htmlFor="input-cedula">Cédula de Identidad</label>
                    <input
                      id="input-cedula"
                      className="form-input"
                      type="text"
                      placeholder="Ej. 001-120485-0001X"
                      value={formData.cedula}
                      onChange={(e) => handleChange('cedula', e.target.value)}
                      autoFocus
                      autoComplete="username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="input-contrasena">Contraseña</label>
                    <input
                      id="input-contrasena"
                      className="form-input"
                      type="password"
                      placeholder="••••••••"
                      value={formData.contrasena}
                      onChange={(e) => handleChange('contrasena', e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </>
              )}

              {/* --- Mensaje de error --- */}
              {error && <div className="login-error" role="alert">{error}</div>}

              {/* --- Botones: Volver + Submit --- */}
              <div className="form-actions">
                <button
                  id="btn-volver"
                  className="btn-back"
                  type="button"
                  onClick={volverAPaso1}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Volver
                </button>

                <button
                  id="btn-submit"
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {textoBotonSubmit()}
                  {!loading && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===== Footer ===== */}
        <p className="login-footer">
          Universidad Americana · Evaluación Psicométrica
        </p>
      </div>
    </div>
  );
}
