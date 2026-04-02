import { useState, useEffect } from 'react';
import api from '../api/axios';

const priorityConfig = {
  high: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'MED' },
  low: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'LOW' },
};

const statusConfig = {
  pending: { color: 'var(--amber)', label: 'Pending' },
  approved: { color: 'var(--blue)', label: 'Approved' },
  completed: { color: 'var(--green)', label: 'Completed' },
  rejected: { color: 'var(--red)', label: 'Rejected' },
};

const inputStyle = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px 14px',
  color: 'var(--text-primary)', fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%',
};

const labelStyle = {
  fontSize: '10px', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.8px',
  display: 'block', marginBottom: '6px',
  fontFamily: 'DM Mono, monospace',
};

const sectionStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '10px', padding: '16px',
};
const AttachmentsList = ({ emailId }) => {
  const [atts, setAtts] = useState([]);
  useEffect(() => {
    if (!emailId) return;
    api.get(`/emails/${emailId}/attachments`).then(r => setAtts(r.data)).catch(() => {});
  }, [emailId]);
  if (!atts.length) return null;
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.8px', marginBottom: '6px' }}>ATTACHMENTS</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {atts.map(att => (
          <a key={att.id} href={`http://127.0.0.1:8000/emails/attachments/${att.id}/download`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '5px 10px',
              fontSize: '11px', color: 'var(--gold)',
              textDecoration: 'none', fontFamily: 'DM Mono, monospace',
            }}>
            📎 {att.filename}
          </a>
        ))}
      </div>
    </div>
  );
};

const TaskDetailModal = ({ taskId, onClose, onUpdated }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get(`/tasks/${taskId}/detail`).then(res => {
      setDetail(res.data);
      setForm({
        title: res.data.task.title,
        description: res.data.task.description,
        priority: res.data.task.priority,
        estimated_minutes: res.data.task.estimated_minutes,
      });
      setLoading(false);
    });
  }, [taskId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/tasks/${taskId}`, form);
      const res = await api.get(`/tasks/${taskId}/detail`);
      setDetail(res.data);
      setEditing(false);
      onUpdated();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const priorityValue = detail?.task?.priority?.value || detail?.task?.priority;
  const statusValue = detail?.task?.status?.value || detail?.task?.status;
  const pCfg = priorityConfig[priorityValue] || {};
  const sCfg = statusConfig[statusValue] || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '680px', maxHeight: '88vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '60px', right: '60px', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        }} />

        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.8px', marginBottom: '6px' }}>
              TASK #{taskId}
            </div>
            {editing ? (
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ ...inputStyle, fontSize: '18px', fontFamily: 'Playfair Display, serif', fontWeight: '600' }} />
            ) : (
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {loading ? 'Loading...' : detail?.task?.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '6px', width: '32px', height: '32px',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading detail...</div>
          ) : (
            <>
              {/* Status + Priority + Time */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, ...sectionStyle }}>
                  <div style={labelStyle}>Status</div>
                  <span style={{ color: sCfg.color, fontSize: '13px', fontWeight: '600', fontFamily: 'DM Mono, monospace' }}>
                    {sCfg.label}
                  </span>
                </div>
                <div style={{ flex: 1, ...sectionStyle }}>
                  <div style={labelStyle}>Priority</div>
                  {editing ? (
                    <select value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      style={{ ...inputStyle, padding: '6px 10px' }}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  ) : (
                    <span style={{
                      background: pCfg.bg, color: pCfg.color,
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: '600',
                      fontFamily: 'DM Mono, monospace',
                    }}>{pCfg.label}</span>
                  )}
                </div>
                <div style={{ flex: 1, ...sectionStyle }}>
                  <div style={labelStyle}>Est. Time</div>
                  {editing ? (
                    <input type="number" value={form.estimated_minutes}
                      onChange={e => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
                      style={{ ...inputStyle, padding: '6px 10px' }} />
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                      {detail?.task?.estimated_minutes}m
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={sectionStyle}>
                <div style={labelStyle}>Description</div>
                {editing ? (
                  <textarea value={form.description} rows={3}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {detail?.task?.description}
                  </p>
                )}
              </div>

              {/* Original Email */}
              <div style={sectionStyle}>
                <div style={labelStyle}>Original Email</div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From: </span>
                  <span style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>
                    {detail?.email?.sender}
                  </span>
                </div>
                {detail?.email?.sender_timezone && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Timezone: </span>
                  <span style={{ fontSize: '12px', color: 'var(--blue)', fontFamily: 'DM Mono, monospace' }}>
                    {detail.email.sender_timezone}
                  </span>
                </div>
            )}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subject: </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {detail?.email?.subject}
                  </span>
                </div>
                <div style={{
                  background: 'var(--bg-primary)', borderRadius: '8px',
                  padding: '12px', border: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text-secondary)',
                  lineHeight: '1.7', maxHeight: '140px', overflowY: 'auto',
                  fontFamily: 'DM Mono, monospace', whiteSpace: 'pre-wrap',
                }}>
                  {detail?.email?.body}
                </div>
                <AttachmentsList emailId={detail?.task?.email_id} />
              </div>

              {/* Schedule */}
              {detail?.schedule && (
                <div style={sectionStyle}>
                  <div style={labelStyle}>Scheduled Time</div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Start</div>
                      <div style={{ fontSize: '13px', color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
                        {new Date(detail.schedule.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>End</div>
                      <div style={{ fontSize: '13px', color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
                        {new Date(detail.schedule.end_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification */}
              {detail?.notification && (
                <div style={sectionStyle}>
                  <div style={labelStyle}>Notification Sent</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Sent to <span style={{ color: 'var(--gold)' }}>{detail.notification.recipient}</span>
                    {detail.notification.sent_at && (
                      <span> at {new Date(detail.notification.sent_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div style={{
            padding: '16px 28px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
          }}>
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} style={{
                  background: 'transparent', border: '1px solid var(--border-light)',
                  borderRadius: '8px', padding: '9px 18px',
                  color: 'var(--text-muted)', fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  border: 'none', borderRadius: '8px', padding: '9px 18px',
                  color: '#0a0c10', fontWeight: '600', fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{
                background: 'var(--gold-dim)', border: '1px solid var(--gold)',
                borderRadius: '8px', padding: '9px 18px',
                color: 'var(--gold)', fontWeight: '600', fontSize: '13px',
                fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
              }}>Edit Task</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;