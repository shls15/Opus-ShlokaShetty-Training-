import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RescheduleModal from '../components/RescheduleModal';
import api from '../api/axios';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const priorityColors = {
  high: 'var(--red)',
  medium: 'var(--amber)',
  low: 'var(--green)',
};

const Calendar = () => {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const load = async () => {
    try {
      const [schedRes, taskRes] = await Promise.all([api.get('/schedules/'), api.get('/tasks/')]);
      setSchedules(schedRes.data);
      const taskMap = {};
      taskRes.data.forEach(t => { taskMap[t.id] = t; });
      setTasks(taskMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getWeekDates = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(weekOffset);

  const getSchedulesForSlot = (date, hour) => schedules.filter(s => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const slotStart = new Date(date); slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date); slotEnd.setHours(hour + 1, 0, 0, 0);
    return start < slotEnd && end > slotStart && start.toDateString() === date.toDateString();
  });

  const navBtn = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '7px 14px',
    color: 'var(--text-secondary)', fontSize: '12px',
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? '24px' : '30px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Schedule View</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approved tasks auto-scheduled by AI</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>← Prev</button>
            <button onClick={() => setWeekOffset(0)} style={{ ...navBtn, color: weekOffset === 0 ? 'var(--gold)' : 'var(--text-secondary)', borderColor: weekOffset === 0 ? 'var(--gold)' : 'var(--border)' }}>Today</button>
            <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', overflow: isMobile ? 'auto' : 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ minWidth: isMobile ? '600px' : 'auto' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                <div />
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} style={{ padding: '12px 8px', borderLeft: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>{DAYS[i]}</div>
                      <div style={{
                        fontSize: '18px', fontWeight: '600', fontFamily: 'DM Mono, monospace',
                        color: isToday ? '#fff' : 'var(--text-primary)',
                        background: isToday ? 'var(--gold)' : 'transparent',
                        borderRadius: '8px', padding: '2px 6px', display: 'inline-block',
                      }}>{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {HOURS.map(hour => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', borderBottom: '1px solid var(--border)', minHeight: '60px' }}>
                  <div style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textAlign: 'right', borderRight: '1px solid var(--border)', paddingTop: '10px' }}>{hour}:00</div>
                  {weekDates.map((date, di) => {
                    const slotSchedules = getSchedulesForSlot(date, hour);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={di} style={{ borderLeft: '1px solid var(--border)', padding: '3px', background: isToday ? 'rgba(157,123,47,0.03)' : 'transparent' }}>
                        {slotSchedules.map(s => {
                          const task = tasks[s.task_id];
                          const color = priorityColors[task?.priority || 'medium'];
                          return (
                            <div key={s.id} style={{
                              background: `${color}12`, border: `1px solid ${color}30`,
                              borderLeft: `3px solid ${color}`, borderRadius: '6px',
                              padding: '5px 7px', marginBottom: '2px', cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                              onClick={() => setRescheduleTarget({ taskId: s.task_id, taskTitle: task?.title || `Task #${s.task_id}`, start: s.start_time, end: s.end_time })}
                              onMouseEnter={e => e.currentTarget.style.background = `${color}20`}
                              onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
                            >
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {task?.title || `Task #${s.task_id}`}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                                {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {s.meet_link && (
                                <a href={s.meet_link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '10px', color: 'var(--green)', textDecoration: 'none', display: 'block', fontWeight: '500' }}>▶ Join Meet</a>
                              )}
                              {s.html_link && (
                                <a href={s.html_link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '10px', color: 'var(--blue)', textDecoration: 'none', display: 'block' }}>📅 GCal</a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([p, label]) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: priorityColors[p] }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          taskId={rescheduleTarget.taskId}
          taskTitle={rescheduleTarget.taskTitle}
          currentStart={rescheduleTarget.start}
          currentEnd={rescheduleTarget.end}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => { setRescheduleTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default Calendar;