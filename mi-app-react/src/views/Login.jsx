import { useState } from 'react';
import { registrarEstudiante, loginAdministrativo } from '../services/api';
import './Login.css';

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
    label: 'Estudiante Egresado de Secundaria',
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
    id: 'evaluador',
    label: 'Evaluador',
    sublabel: 'Administrador del sistema',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  }
];

export default function Login({ onLoginSuccess }) {
  const [paso, setPaso] = useState(1);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    fechaNacimiento: '',
    departamento: '',
    municipio: '',
    comunidad: '',
    cif: '',
    numeroCedula: '',
    tipoInstitucion: '',
    contrasena: '',
    zona: '',
  });

  const handleChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const seleccionarRol = (rolId) => {
    setRolSeleccionado(rolId);
    setError('');
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      fechaNacimiento: '',
      departamento: '',
      municipio: '',
      comunidad: '',
      cif: '',
      numeroCedula: '',
      tipoInstitucion: '',
      contrasena: '',
      zona: '',
    });
    setPaso(2);
  };

  const volverAPaso1 = () => {
    setPaso(1);
    setRolSeleccionado(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones comunes
    if (rolSeleccionado !== 'evaluador') {
      if (!formData.nombres.trim()) { setError('Ingresa tus nombres.'); return; }
      if (!formData.apellidos.trim()) { setError('Ingresa tus apellidos.'); return; }
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { setError('Ingresa un correo electrónico válido.'); return; }
      if (!formData.fechaNacimiento) { setError('Selecciona tu fecha de nacimiento.'); return; }
      if (!formData.departamento.trim()) { setError('Ingresa tu departamento.'); return; }
      if (!formData.municipio.trim()) { setError('Ingresa tu municipio.'); return; }
      if (!formData.comunidad.trim()) { setError('Ingresa tu comunidad/barrio.'); return; }
      if (!formData.zona) { setError('Selecciona tu zona (Rural o Urbana).'); return; }
    }

    const regexCedula = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/;

    // Validaciones específicas
    if (rolSeleccionado === 'universitario') {
      if (!/^\d{8}$/.test(formData.cif)) { setError('El CIF debe tener exactamente 8 dígitos.'); return; }
      if (!formData.numeroCedula.trim()) { setError('Ingresa tu número de cédula.'); return; }
      if (!regexCedula.test(formData.numeroCedula)) { setError('Formato de cédula incorrecto. Ej: 001-080108-1047W'); return; }
    } else if (rolSeleccionado === 'egresado') {
      if (!formData.numeroCedula.trim()) { setError('Ingresa tu número de cédula.'); return; }
      if (!regexCedula.test(formData.numeroCedula)) { setError('Formato de cédula incorrecto. Ej: 001-080108-1047W'); return; }
      if (!formData.tipoInstitucion) { setError('Selecciona el tipo de institución.'); return; }
    } else if (rolSeleccionado === 'secundaria') {
      if (!formData.tipoInstitucion) { setError('Selecciona el tipo de institución.'); return; }
    } else if (rolSeleccionado === 'evaluador') {
      if (!formData.cif.trim()) { setError('Ingresa tu CIF / Cédula.'); return; }
      if (!formData.contrasena) { setError('Ingresa tu contraseña.'); return; }
    }

    setLoading(true);

    let payload = { rol: rolSeleccionado };

    if (rolSeleccionado === 'evaluador') {
      payload = { ...payload, cif: formData.cif, contrasena: formData.contrasena };
    } else {
      payload = {
        ...payload,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        fechaNacimiento: formData.fechaNacimiento,
        departamento: formData.departamento,
        municipio: formData.municipio,
        comunidad: formData.comunidad,
        zona: formData.zona,
      };
      if (rolSeleccionado === 'universitario') {
        payload = { ...payload, cif: formData.cif, numeroCedula: formData.numeroCedula };
      }
      if (rolSeleccionado === 'egresado') {
        payload = { ...payload, numeroCedula: formData.numeroCedula, tipoInstitucion: formData.tipoInstitucion };
      }
      if (rolSeleccionado === 'secundaria') {
        payload = { ...payload, tipoInstitucion: formData.tipoInstitucion };
      }
    }

    console.log('📤 Datos al backend:', payload);

    const ejecutarAutenticacion = async () => {
      try {
        if (rolSeleccionado === 'evaluador') {
          const resultado = await loginAdministrativo(payload.cif, payload.contrasena);
          onLoginSuccess({ ...resultado, rol: 'evaluador' });
        } else {
          const resultado = await registrarEstudiante(payload);
          onLoginSuccess({
            ...payload,
            id: resultado.id,
            nombres: resultado.nombres,
          });
        }
      } catch (err) {
        setError(err.message || 'Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };

    ejecutarAutenticacion();
  };

  const rolActual = ROLES.find((r) => r.id === rolSeleccionado);
  const textoBotonSubmit = () => {
    if (loading) return 'Procesando…';
    if (rolSeleccionado === 'evaluador') return 'Ingresar';
    return 'Iniciar Prueba';
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">

          <div className="login-header">
            <img src="/uam-logo.png" alt="UAM" style={{ maxWidth: '200px', marginBottom: '1rem' }} />
            <p>Batería Factorial de Aptitudes (BFA) - Forma B</p>
          </div>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${paso >= 1 ? 'active' : ''}`} />
          <div className={`step-line ${paso >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${paso >= 2 ? 'active' : ''}`} />
        </div>

        {paso === 1 && (
          <>
            <div className="step-title">
              <h2>¿Quién eres?</h2>
              <p>Selecciona tu perfil para continuar</p>
            </div>
            <div className="roles-grid" id="roles-grid">
              {ROLES.map((rol) => (
                <button key={rol.id} className="role-card" onClick={() => seleccionarRol(rol.id)} type="button">
                  <div className="role-icon">{rol.icon}</div>
                  <span className="role-label">{rol.label}</span>
                  <span className="role-sublabel">{rol.sublabel}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="step-title"><h2>Completa tus datos</h2></div>
            {rolActual && (
              <div className="role-selected-badge">
                {rolActual.icon} {rolActual.label}
              </div>
            )}
            <form className="login-form" onSubmit={handleSubmit}>
              
              {/* Sección: Campos comunes para estudiantes */}
              {rolSeleccionado !== 'evaluador' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombres</label>
                      <input className="form-input" type="text" placeholder="Ej. María" value={formData.nombres} onChange={(e) => handleChange('nombres', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Apellidos</label>
                      <input className="form-input" type="text" placeholder="Ej. López Pérez" value={formData.apellidos} onChange={(e) => handleChange('apellidos', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Correo Electrónico</label>
                      <input className="form-input" type="email" placeholder="Ej. maria@ejemplo.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Fecha de Nacimiento</label>
                      <input className="form-input" type="date" value={formData.fechaNacimiento} onChange={(e) => handleChange('fechaNacimiento', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Departamento</label>
                      <input className="form-input" type="text" placeholder="Ej. Managua" value={formData.departamento} onChange={(e) => handleChange('departamento', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Municipio</label>
                      <input className="form-input" type="text" placeholder="Ej. Tipitapa" value={formData.municipio} onChange={(e) => handleChange('municipio', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Comunidad / Barrio</label>
                      <input className="form-input" type="text" placeholder="Ej. Barrio Central" value={formData.comunidad} onChange={(e) => handleChange('comunidad', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Zona</label>
                      <select className="form-select" value={formData.zona} onChange={(e) => handleChange('zona', e.target.value)}>
                        <option value="">Seleccionar</option>
                        <option value="RURAL">Rural</option>
                        <option value="URBANA">Urbana</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Sección: Campos específicos por rol */}
              {rolSeleccionado === 'universitario' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>CIF</label>
                    <input className="form-input" type="text" maxLength={8} placeholder="Ej. 25010756" value={formData.cif} onChange={(e) => handleChange('cif', e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="form-group">
                    <label>Cédula</label>
                    <input className="form-input" type="text" placeholder="Ej. 001-..." value={formData.numeroCedula} onChange={(e) => handleChange('numeroCedula', e.target.value)} />
                  </div>
                </div>
              )}

              {rolSeleccionado === 'egresado' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Cédula</label>
                    <input className="form-input" type="text" placeholder="Ej. 001-..." value={formData.numeroCedula} onChange={(e) => handleChange('numeroCedula', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Institución</label>
                    <select className="form-select" value={formData.tipoInstitucion} onChange={(e) => handleChange('tipoInstitucion', e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="Público">Público</option>
                      <option value="Privado">Privado</option>
                    </select>
                  </div>
                </div>
              )}

              {rolSeleccionado === 'secundaria' && (
                <div className="form-group">
                  <label>Tipo de Institución</label>
                  <select className="form-select" value={formData.tipoInstitucion} onChange={(e) => handleChange('tipoInstitucion', e.target.value)}>
                    <option value="">Seleccionar</option>
                    <option value="Público">Público</option>
                    <option value="Privado">Privado</option>
                  </select>
                </div>
              )}

              {rolSeleccionado === 'evaluador' && (
                <>
                  <div className="form-group">
                    <label>CIF / Cédula</label>
                    <input className="form-input" type="text" value={formData.cif} onChange={(e) => handleChange('cif', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input className="form-input" type="password" value={formData.contrasena} onChange={(e) => handleChange('contrasena', e.target.value)} />
                  </div>
                </>
              )}
              {error && <div className="login-error" role="alert">{error}</div>}

              <div className="form-actions">
                <button className="btn-back" type="button" onClick={volverAPaso1}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg> Volver
                </button>
                <button className="btn-primary" type="submit" disabled={loading}>
                  {textoBotonSubmit()}
                </button>
              </div>
            </form>
          </>
        )}
        <p className="login-footer">Universidad Americana · Evaluación Psicométrica</p>
      </div>
    </div>
  );
}
