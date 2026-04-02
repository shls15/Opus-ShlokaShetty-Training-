import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { ...form, role: 'executive' });
        setIsRegister(false);
      } else {
        const res = await api.post('/auth/login', form);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify({ name: form.email.split('@')[0], role: 'Executive' }));
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong');
    }
    setLoading(false);
  };

  const inp = {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'var(--gold)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px', fontWeight: '700', color: '#fff',
            fontFamily: 'Playfair Display, serif',
            boxShadow: '0 8px 24px rgba(157,123,47,0.25)',
          }}>S</div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px', fontWeight: '700',
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>SecretaryAI</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {isRegister ? 'Create your account' : 'Sign in to your workspace'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" style={inp} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" style={inp} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={inp} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid var(--red)',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13px', color: 'var(--red)',
              }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              marginTop: '4px',
              background: 'var(--gold)',
              border: 'none', borderRadius: '10px', padding: '14px',
              color: '#fff', fontWeight: '600', fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(157,123,47,0.25)',
            }}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: '600' }}>
              {isRegister ? 'Sign in' : 'Register'}
            </span>
          </p>
        </div>

        {/* Theme toggle on login */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => {
            const t = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', t);
            document.documentElement.setAttribute('data-theme', t);
          }} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '6px 16px',
            cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)',
            fontFamily: 'DM Sans, sans-serif',
          }}>Switch theme</button>
        </div>
      </div>
    </div>
  );
};

export default Login;