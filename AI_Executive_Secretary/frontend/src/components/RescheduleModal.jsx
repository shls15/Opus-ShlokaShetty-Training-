import { useState } from 'react';
import api from '../api/axios';

const RescheduleModal = ({ taskId, taskTitle, currentStart, currentEnd, onClose, onRescheduled }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/schedules/task/${taskId}/reschedule`);
      setResult(res.data);
      onRescheduled();
    } catch (e) {
      setError(e.response?.data?.detail || 'Reschedule failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '480px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '48px', right: '48px', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        }} />

        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px', fontWeight: '600',
            color: 'var(--text-primary)', marginBottom: '4px',
          }}>Reschedule Task</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{taskTitle}</p>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {!result ? (
            <>
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '16px',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  CURRENT SCHEDULE
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Start</div>
                    <div style={{ fontSize: '13px', color: 'var(--amber)', fontFamily: 'DM Mono, monospace' }}>
                      {new Date(currentStart).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>End</div>
                    <div style={{ fontSize: '13px', color: 'var(--amber)', fontFamily: 'DM Mono, monospace' }}>
                      {new Date(currentEnd).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--blue-dim)', border: '1px solid var(--blue)',
                borderRadius: '10px', padding: '14px',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6',
              }}>
                AI will find the next available free slot based on your working hours settings and existing schedule.
              </div>

              {error && (
                <div style={{
                  background: 'var(--red-dim)', border: '1px solid var(--red)',
                  borderRadius: '8px', padding: '10px 14px',
                  fontSize: '13px', color: 'var(--red)',
                }}>{error}</div>
              )}
            </>
          ) : (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.8px', marginBottom: '12px' }}>
                ✓ RESCHEDULED SUCCESSFULLY
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>New Start</div>
                  <div style={{ fontSize: '13px', color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
                    {new Date(result.start_time).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>New End</div>
                  <div style={{ fontSize: '13px', color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
                    {new Date(result.end_time).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
        }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border-light)',
            borderRadius: '8px', padding: '9px 18px',
            color: 'var(--text-muted)', fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
          }}>{result ? 'Close' : 'Cancel'}</button>

          {!result && (
            <button onClick={handleReschedule} disabled={loading} style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              border: 'none', borderRadius: '8px', padding: '9px 18px',
              color: '#0a0c10', fontWeight: '600', fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Finding slot...' : 'Reschedule'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;