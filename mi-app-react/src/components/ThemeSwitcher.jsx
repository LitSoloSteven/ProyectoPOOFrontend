import { useEffect } from 'react';
import './ThemeSwitcher.css';

const THEMES = [
  { id: 'basic', label: 'Básico (Sin animaciones)', icon: '⚪' },
  { id: 'animated', label: 'Animado (Predeterminado)', icon: '✨' },
  { id: 'dark', label: 'Modo Oscuro', icon: '🌙' },
  { id: 'vintage', label: 'Vintage Clásico', icon: '📜' }
];

export default function ThemeSwitcher({ theme, setTheme }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bfa-theme', theme);
  }, [theme]);

  return (
    <div className="theme-switcher-container">
      <div className="theme-switcher-menu">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`theme-btn ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
