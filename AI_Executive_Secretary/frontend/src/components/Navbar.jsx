import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--gold)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '700', color: '#fff',
              fontFamily: 'Playfair Display, serif',
              flexShrink: 0,
            }}>S</div>
            <span style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '17px', fontWeight: '600',
              color: 'var(--text-primary)',
            }}>SecretaryAI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'DM Mono', fontWeight: '500' }}>LIVE</span>
            </div>
          </div>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', gap: '2px' }} className="desktop-nav">
            {navLinks.map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                background: isActive(path) ? 'var(--gold-dim)' : 'transparent',
                border: 'none',
                color: isActive(path) ? 'var(--gold)' : 'var(--text-secondary)',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive(path) ? '600' : '400',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s ease',
                borderBottom: isActive(path) ? '2px solid var(--gold)' : '2px solid transparent',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '4px',
            color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* User info - desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="desktop-nav">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{user.name || 'Executive'}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{user.role || 'Admin'}</div>
            </div>
            <div style={{
              width: '34px', height: '34px',
              background: 'var(--gold-dim)',
              border: '2px solid var(--gold)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '600', color: 'var(--gold)',
              flexShrink: 0,
            }}>{(user.name || 'E')[0].toUpperCase()}</div>
            <button onClick={logout} style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}>Logout</button>
          </div>

          {/* Hamburger - mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '6px 10px', cursor: 'pointer',
            color: 'var(--text-primary)', fontSize: '16px', lineHeight: 1,
          }} className="mobile-only">☰</button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px 16px',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.15s ease',
        }}>
          {navLinks.map(({ label, path }) => (
            <button key={path} onClick={() => { navigate(path); setMenuOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: isActive(path) ? 'var(--gold-dim)' : 'transparent',
              border: 'none', borderRadius: '8px',
              padding: '10px 14px', marginBottom: '4px',
              color: isActive(path) ? 'var(--gold)' : 'var(--text-primary)',
              fontSize: '14px', fontWeight: isActive(path) ? '600' : '400',
              fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
            }}>{label}</button>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.name} · {user.role}</span>
            <button onClick={logout} style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              color: 'var(--red)', borderRadius: '6px',
              padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>Logout</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </>
  );
};

export default Navbar;