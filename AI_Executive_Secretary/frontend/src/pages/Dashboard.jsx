import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskDetailModal from '../components/TaskDetailModal';
import api from '../api/axios';

const priorityConfig = {
  high: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'MED' },
  low: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'LOW' },
};
const statusConfig = {
  pending: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'Pending' },
  approved: { color: 'var(--blue)', bg: 'var(--blue-dim)', label: 'Approved' },
  completed: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'Completed' },
  rejected: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'Rejected' },
};

const Badge = ({ type, value }) => {
  const cfg = type === 'priority' ? priorityConfig[value] : statusConfig[value];
  if (!cfg) return null;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: '5px', padding: '3px 8px',
      fontSize: '11px', fontWeight: '600',
      fontFamily: 'DM Mono, monospace', letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [testEmail, setTestEmail] = useState({ sender: '', subject: '', body: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks/');
      setTasks(res.data);
    } catch { showToast('Failed to load tasks', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const updateTask = async (id, status) => {
    try {
      await api.patch(`/tasks/${id}`, { status });
      showToast(`Task ${status}`);
      loadTasks();
    } catch { showToast('Update failed', 'error'); }
  };

  const cancelTask = async (id) => {
    try {
      await api.post(`/tasks/${id}/cancel`);
      showToast('Task cancelled');
      loadTasks();
    } catch { showToast('Cancel failed', 'error'); }
  };

  const sendTestEmail = async () => {
    setSending(true);
    try {
      await api.post('/emails/ingest', testEmail);
      showToast('Email processed');
      setShowModal(false);
      setTestEmail({ sender: '', subject: '', body: '' });
      loadTasks();
    } catch { showToast('Failed', 'error'); }
    setSending(false);
  };

  const pollGmail = async () => {
    setPolling(true);
    try {
      const res = await api.post('/emails/poll');
      showToast(`Fetched ${res.data.fetched} email(s)`);
      loadTasks();
    } catch { showToast('Poll failed', 'error'); }
    setPolling(false);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    approved: tasks.filter(t => t.status === 'approved').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const btnPrimary = {
    background: 'var(--gold)', border: 'none', borderRadius: '8px',
    padding: '9px 18px', color: '#fff', fontWeight: '600', fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(157,123,47,0.2)',
    whiteSpace: 'nowrap',
  };
  const btnSecondary = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '9px 18px',
    color: 'var(--text-secondary)', fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {toast && (
        <div style={{
          position: 'fixed', top: '72px', right: '16px', zIndex: 999,
          background: toast.type === 'error' ? 'var(--red-dim)' : 'var(--green-dim)',
          border: `1px solid ${toast.type === 'error' ? 'var(--red)' : 'var(--green)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: '500',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.2s ease',
          maxWidth: 'calc(100vw - 32px)',
        }}>{toast.msg}</div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: isMobile ? '24px' : '30px', fontWeight: '700',
              color: 'var(--text-primary)', marginBottom: '4px',
            }}>Task Intelligence</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI-extracted tasks from your inbox</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={pollGmail} disabled={polling} style={btnSecondary}>
              {polling ? 'Polling...' : '⟳ Poll Gmail'}
            </button>
            <button onClick={() => setShowModal(true)} style={btnPrimary}>+ Inject Email</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Total Tasks', value: stats.total, color: 'var(--text-primary)', accent: 'var(--gold)' },
            { label: 'Pending Review', value: stats.pending, color: 'var(--amber)', accent: 'var(--amber)' },
            { label: 'Approved', value: stats.approved, color: 'var(--blue)', accent: 'var(--blue)' },
            { label: 'Completed', value: stats.completed, color: 'var(--green)', accent: 'var(--green)' },
          ].map(({ label, value, color, accent }) => (
            <div key={label} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px',
              position: 'relative', overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accent, borderRadius: '12px 12px 0 0' }} />
              <div style={{ fontSize: '32px', fontWeight: '700', color, fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'var(--gold)' : 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              padding: '6px 16px', borderRadius: '20px',
              cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              boxShadow: filter === f ? '0 2px 8px rgba(157,123,47,0.2)' : 'none',
            }}>{f}</button>
          ))}
        </div>

        {/* Task list */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Table header - desktop only */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 90px 100px 90px 200px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-primary)',
            }}>
              {['Task', 'Description', 'Priority', 'Status', 'Time', 'Actions'].map(h => (
                <div key={h} style={{
                  fontSize: '10px', fontWeight: '600',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  fontFamily: 'DM Mono, monospace',
                }}>{h}</div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Loading tasks...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No tasks found</div>
            </div>
          ) : filtered.map((task, i) => (
            isMobile ? (
              // Mobile card view
              <div key={task.id} style={{
                padding: '16px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                animation: 'slideUp 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div onClick={() => setSelectedTaskId(task.id)} style={{
                    fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
                    cursor: 'pointer', textDecoration: 'underline',
                    textDecorationColor: 'var(--border)', flex: 1, marginRight: '12px',
                  }}>{task.title}</div>
                  <Badge type="priority" value={task.priority} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  #{task.id} · {new Date(task.created_at).toLocaleDateString()} · {task.estimated_minutes}m
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge type="status" value={task.status} />
                  {task.status === 'pending' && (
                    <>
                      <button onClick={() => updateTask(task.id, 'approved')} style={{ ...smallBtn, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)' }}>Approve</button>
                      <button onClick={() => updateTask(task.id, 'rejected')} style={{ ...smallBtn, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)' }}>Reject</button>
                    </>
                  )}
                  {task.status === 'approved' && (
                    <>
                      <button onClick={() => updateTask(task.id, 'completed')} style={{ ...smallBtn, background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)' }}>Complete</button>
                      <button onClick={() => cancelTask(task.id)} style={{ ...smallBtn, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)' }}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Desktop row
              <div key={task.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 90px 100px 90px 200px',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.1s',
                animation: 'slideUp 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div onClick={() => setSelectedTaskId(task.id)} style={{
                    fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)',
                    marginBottom: '2px', cursor: 'pointer',
                    textDecoration: 'underline', textDecorationColor: 'var(--border)',
                  }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                    #{task.id} · {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '12px', lineHeight: '1.4' }}>
                  {task.description?.slice(0, 55)}{task.description?.length > 55 ? '...' : ''}
                </div>
                <Badge type="priority" value={task.priority} />
                <Badge type="status" value={task.status} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{task.estimated_minutes}m</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {task.status === 'pending' && (
                    <>
                      <button onClick={() => updateTask(task.id, 'approved')} style={{ ...smallBtn, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)' }}>Approve</button>
                      <button onClick={() => updateTask(task.id, 'rejected')} style={{ ...smallBtn, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)' }}>Reject</button>
                    </>
                  )}
                  {task.status === 'approved' && (
                    <>
                      <button onClick={() => updateTask(task.id, 'completed')} style={{ ...smallBtn, background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)' }}>Complete</button>
                      <button onClick={() => cancelTask(task.id)} style={{ ...smallBtn, background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)' }}>Cancel</button>
                    </>
                  )}
                  {(task.status === 'completed' || task.status === 'rejected') && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Inject Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '500px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Inject Test Email</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[{ label: 'Sender Email', key: 'sender', placeholder: 'client@company.com' }, { label: 'Subject', key: 'subject', placeholder: 'Meeting at 3pm Tuesday' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>{label}</label>
                  <input value={testEmail[key]} onChange={e => setTestEmail({ ...testEmail, [key]: e.target.value })} placeholder={placeholder} style={{ width: '100%', background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Email Body</label>
                <textarea value={testEmail.body} onChange={e => setTestEmail({ ...testEmail, body: e.target.value })} placeholder="Hi, can we schedule a meeting to discuss..." rows={4} style={{ width: '100%', background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'vertical', lineHeight: '1.5' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 18px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendTestEmail} disabled={sending} style={{ background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '10px 18px', color: '#fff', fontWeight: '600', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Processing...' : 'Process Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onUpdated={() => { loadTasks(); setSelectedTaskId(null); }} />
      )}
    </div>
  );
};

const smallBtn = {
  borderRadius: '6px', padding: '4px 10px',
  fontSize: '11px', fontWeight: '600',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};

export default Dashboard;