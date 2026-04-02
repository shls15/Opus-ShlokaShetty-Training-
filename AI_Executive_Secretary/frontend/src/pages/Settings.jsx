import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Settings = () => {
  const [form, setForm] = useState({
    work_start_hour: 9, work_end_hour: 18,
    work_days: '1,2,3,4,5',
    lunch_start: '', lunch_end: '',
    slot_interval_minutes: 30,
    buffer_minutes: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    api.get('/settings/').then(res => {
      setForm({
        work_start_hour: res.data.work_start_hour,
        work_end_hour: res.data.work_end_hour,
        work_days: res.data.work_days,
        lunch_start: res.data.lunch_start ?? '',
        lunch_end: res.data.lunch_end ?? '',
        slot_interval_minutes: res.data.slot_interval_minutes,
        buffer_minutes: res.data.buffer_minutes || 10,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleDay = (val) => {
    const days = form.work_days ? form.work_days.split(',').map(Number) : [];
    const updated = days.includes(val) ? days.filter(d => d !== val) : [...days, val].sort();
    setForm({ ...form, work_days: updated.join(',') });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/settings/', {
        ...form,
        lunch_start: form.lunch_start === '' ? null : Number(form.lunch_start),
        lunch_end: form.lunch_end === '' ? null : Number(form.lunch_end),
      });
      showToast('Settings saved successfully');
    } catch { showToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const activeDays = form.work_days ? form.work_days.split(',').map(Number) : [];
  const DAYS = [{ label: 'M', value: 1 }, { label: 'T', value: 2 }, { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }, { label: 'S', value: 7 }];

  const card = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' };
  const sectionLabel = { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px', display: 'block' };
  const numInput = { background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'DM Mono, monospace', outline: 'none', width: '100%' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {toast && (
        <div style={{
          position: 'fixed', top: '72px', right: '16px', zIndex: 999,
          background: toast.type === 'error' ? 'var(--red-dim)' : 'var(--green-dim)',
          border: `1px solid ${toast.type === 'error' ? 'var(--red)' : 'var(--green)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
          boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.2s ease',
        }}>{toast.msg}</div>
      )}

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? '24px' : '30px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Work Schedule</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure your personal availability and preferences</p>
        </div>

        {loading ? <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Working Days */}
            <div style={card}>
              <span style={sectionLabel}>Working Days</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAYS.map(({ label, value }) => (
                  <button key={value} onClick={() => toggleDay(value)} style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    border: activeDays.includes(value) ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: activeDays.includes(value) ? 'var(--gold)' : 'transparent',
                    color: activeDays.includes(value) ? '#fff' : 'var(--text-muted)',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div style={card}>
              <span style={sectionLabel}>Working Hours</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[{ label: 'Start Hour', key: 'work_start_hour' }, { label: 'End Hour', key: 'work_end_hour' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{label} (0–23)</label>
                    <input type="number" min="0" max="23" value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} style={numInput} />
                  </div>
                ))}
              </div>
            </div>

            {/* Lunch */}
            <div style={card}>
              <span style={sectionLabel}>Lunch Break <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: '400', fontSize: '10px' }}>(optional)</span></span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[{ label: 'Lunch Start', key: 'lunch_start' }, { label: 'Lunch End', key: 'lunch_end' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{label}</label>
                    <input type="number" min="0" max="23" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="e.g. 13" style={numInput} />
                  </div>
                ))}
              </div>
            </div>

            {/* Slot interval */}
            <div style={card}>
              <span style={sectionLabel}>Scheduling Interval</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[15, 30, 45, 60].map(v => (
                  <button key={v} onClick={() => setForm({ ...form, slot_interval_minutes: v })} style={{
                    padding: '8px 20px', borderRadius: '8px', transition: 'all 0.15s',
                    border: form.slot_interval_minutes === v ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: form.slot_interval_minutes === v ? 'var(--gold)' : 'transparent',
                    color: form.slot_interval_minutes === v ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>{v}m</button>
                ))}
              </div>
            </div>

            {/* Buffer */}
            <div style={card}>
              <span style={sectionLabel}>Buffer Between Meetings</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[0, 5, 10, 15, 30].map(v => (
                  <button key={v} onClick={() => setForm({ ...form, buffer_minutes: v })} style={{
                    padding: '8px 20px', borderRadius: '8px', transition: 'all 0.15s',
                    border: form.buffer_minutes === v ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: form.buffer_minutes === v ? 'var(--gold)' : 'transparent',
                    color: form.buffer_minutes === v ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>{v}m</button>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving} style={{
              background: 'var(--gold)', border: 'none', borderRadius: '10px', padding: '14px',
              color: '#fff', fontWeight: '600', fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(157,123,47,0.25)',
              transition: 'all 0.15s',
            }}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;