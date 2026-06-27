import React, { useState, useEffect, useCallback } from 'react';
import {
  apiGetMonthCalendar, apiAddHoliday, apiDeleteHoliday,
  MonthCalendar, HolidayRecord,
} from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function today() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
function isoToDate(iso: string) { return new Date(iso + 'T00:00:00'); }
function fmtFull(iso: string) {
  return isoToDate(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HolidayManager() {
  const { year: todayYear, month: todayMonth } = today();

  const [calYear,  setCalYear]  = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth);
  const [data,     setData]     = useState<MonthCalendar | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // Add form
  const [addDate,   setAddDate]   = useState('');
  const [addReason, setAddReason] = useState('');
  const [adding,    setAdding]    = useState(false);
  const [deleting,  setDeleting]  = useState<number | null>(null);

  // Selected day (click on calendar cell)
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetMonthCalendar(calYear, calMonth);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [calYear, calMonth]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDate || !addReason.trim()) return;
    setAdding(true);
    setError('');
    try {
      await apiAddHoliday(addDate, addReason.trim());
      setSuccess(`Holiday added for ${fmtFull(addDate)}`);
      setAddDate('');
      setAddReason('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to add holiday');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number, dateIso: string) => {
    if (!window.confirm(`Remove holiday on ${fmtFull(dateIso)}?`)) return;
    setDeleting(id);
    setError('');
    try {
      await apiDeleteHoliday(id);
      setSuccess('Holiday removed');
      if (selected === dateIso) setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to remove holiday');
    } finally {
      setDeleting(null);
    }
  };

  // ── Build calendar grid ──────────────────────────────────────────────────
  const holidayMap: Record<string, HolidayRecord> = {};
  const schoolDaySet = new Set<string>();
  if (data) {
    data.holidays.forEach(h => { holidayMap[h.date] = h; });
    data.schoolDays.forEach(d => schoolDaySet.add(d));
  }

  const firstDow   = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = new Date().toISOString().split('T')[0];

  const getIso = (day: number) =>
    `${calYear}-${String(calMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const getCellType = (iso: string, dayOfWeek: number): 'weekend' | 'holiday' | 'school' | 'future' => {
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    if (holidayMap[iso])                    return 'holiday';
    if (schoolDaySet.has(iso))              return 'school';
    return 'future';
  };

  const CELL_STYLES: Record<string, { bg: string; border: string; numColor: string; label?: string; labelColor?: string; labelBg?: string }> = {
    school:  { bg: '#f0fdf4', border: '#86efac', numColor: '#15803d' },
    weekend: { bg: '#f8fafc', border: '#e2e8f0', numColor: '#94a3b8' },
    holiday: { bg: '#fff1f2', border: '#fca5a5', numColor: '#991b1b', label: 'Holiday', labelColor: '#991b1b', labelBg: '#fee2e2' },
    future:  { bg: 'white',   border: '#e2e8f0', numColor: '#64748b' },
  };

  const selectedHoliday = selected ? holidayMap[selected] : null;

  return (
    <div className="page-inner">

      {/* ── Toast notifications ── */}
      {success && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(34,197,94,0.2)', fontSize: 14, fontWeight: 700, color: '#15803d',
          animation: 'slideIn 0.3s ease',
        }}>
          <span style={{ fontSize: 20 }}>✅</span> {success}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fff1f2', border: '1.5px solid #fca5a5', borderRadius: 12,
          padding: '12px 18px', marginBottom: 20, fontSize: 13, fontWeight: 600, color: '#991b1b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 900, fontSize: 16 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── LEFT: Calendar ── */}
        <div style={{ flex: '1 1 480px', minWidth: 320 }}>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1.5px solid #e2e8f0' }}>

            {/* Calendar header */}
            <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#0F2240)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontSize: 20, fontWeight: 900, fontFamily: 'Nunito' }}>{MONTH_NAMES[calMonth - 1]} {calYear}</div>
                {data && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>
                    {data.totalSchoolDays} school days · {data.holidays.length} holiday{data.holidays.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>

            {/* Legend strip */}
            <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0' }}>
              {[
                { label: 'School Day', color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
                { label: 'Weekend',    color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
                { label: 'Holiday',    color: '#991b1b', bg: '#fff1f2', dot: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 4px', background: item.bg, borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Day name row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading calendar…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {cells.map((day, idx) => {
                  if (!day) return (
                    <div key={idx} style={{ minHeight: 64, background: '#fafbfc', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
                  );
                  const iso     = getIso(day);
                  const dow     = idx % 7;
                  const type    = getCellType(iso, dow);
                  const cs      = CELL_STYLES[type];
                  const isToday = iso === todayIso;
                  const isSel   = selected === iso;
                  const holiday = holidayMap[iso];

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelected(isSel ? null : iso)}
                      style={{
                        minHeight: 64, padding: '8px 6px',
                        borderRight: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        background: isSel ? (type === 'holiday' ? '#fee2e2' : type === 'school' ? '#dcfce7' : '#f1f5f9') : cs.bg,
                        outline: isSel ? `2.5px solid ${type === 'holiday' ? '#ef4444' : type === 'school' ? '#22c55e' : '#94a3b8'}` : 'none',
                        outlineOffset: -2,
                        cursor: type !== 'weekend' ? 'pointer' : 'default',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        position: 'relative', transition: 'all 0.12s',
                      }}
                    >
                      {/* Today indicator */}
                      {isToday ? (
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#4FC3F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontSize: 11, fontWeight: 900, fontFamily: 'Nunito' }}>{day}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Nunito', color: cs.numColor }}>{day}</span>
                      )}

                      {/* Holiday badge */}
                      {holiday && (
                        <div style={{ marginTop: 4, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '2px 5px', maxWidth: '90%' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            🎌 {holiday.reason}
                          </div>
                        </div>
                      )}

                      {/* School day dot */}
                      {type === 'school' && !holiday && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', marginTop: 4 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected day detail card */}
          {selected && (
            <div style={{ marginTop: 16, background: 'white', borderRadius: 16, padding: '18px 22px', boxShadow: 'var(--shadow)', border: selectedHoliday ? '1.5px solid #fca5a5' : '1.5px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Selected Date</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', fontFamily: 'Nunito' }}>{fmtFull(selected)}</div>
                  {selectedHoliday && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ fontSize: 13 }}>🎌</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>{selectedHoliday.reason}</span>
                    </div>
                  )}
                  {!selectedHoliday && schoolDaySet.has(selected) && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ fontSize: 13 }}>📚</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Regular school day</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  {selectedHoliday ? (
                    <button
                      onClick={() => handleDelete(selectedHoliday.id, selected)}
                      disabled={deleting === selectedHoliday.id}
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #fca5a5', background: deleting === selectedHoliday.id ? '#f8fafc' : '#fff1f2', color: '#991b1b', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, fontFamily: 'Nunito', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {deleting === selectedHoliday.id ? '⏳' : '🗑️'} Remove Holiday
                    </button>
                  ) : schoolDaySet.has(selected) ? (
                    <button
                      onClick={() => { setAddDate(selected); setAddReason(''); }}
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #86efac', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontSize: 13, fontWeight: 800, fontFamily: 'Nunito', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      🎌 Mark as Holiday
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Add holiday form */}
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1.5px solid #e2e8f0' }}>
            <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#0F2240)', padding: '16px 20px' }}>
              <div style={{ color: 'white', fontWeight: 900, fontSize: 15, fontFamily: 'Nunito' }}>🎌 Add Holiday</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>Mark a day as a school holiday</div>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Date</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={e => setAddDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', background: '#f8fafc', color: '#1E293B', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Reason</label>
                <input
                  type="text"
                  value={addReason}
                  onChange={e => setAddReason(e.target.value)}
                  placeholder="e.g. Vesak Day, Term Break..."
                  required
                  maxLength={60}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', background: '#f8fafc', color: '#1E293B', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <button type="submit" disabled={adding} style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: adding ? '#cbd5e1' : 'linear-gradient(135deg,#1E3A5F,#0288D1)', color: 'white', fontWeight: 900, fontSize: 14, fontFamily: 'Nunito', cursor: adding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {adding ? '⏳ Adding…' : '+ Add Holiday'}
              </button>
            </form>
          </div>

          {/* Holidays list this month */}
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1.5px solid #e2e8f0' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1E293B', fontFamily: 'Nunito' }}>
                Holidays in {MONTH_NAMES[calMonth - 1]}
              </div>
              <div style={{ background: '#fff1f2', color: '#991b1b', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>
                {data?.holidays.length ?? '…'}
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {!data || data.holidays.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No holidays this month</div>
                </div>
              ) : data.holidays.map(h => (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selected === h.date ? '#fff7ed' : 'white',
                  cursor: 'pointer', transition: 'background 0.12s',
                }}
                  onClick={() => setSelected(h.date === selected ? null : h.date)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff1f2', border: '1.5px solid #fca5a5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      {MONTH_NAMES[new Date(h.date + 'T00:00:00').getMonth()].slice(0,3)}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#991b1b', fontFamily: 'Nunito', lineHeight: 1 }}>
                      {new Date(h.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.reason}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); handleDelete(h.id, h.date); }}
                    disabled={deleting === h.id}
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#991b1b', cursor: deleting === h.id ? 'not-allowed' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    title="Remove holiday"
                  >
                    {deleting === h.id ? '⏳' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Month summary */}
          {data && (
            <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#0F2240)', borderRadius: 20, padding: '20px', boxShadow: 'var(--shadow)' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                {MONTH_NAMES[calMonth - 1]} Summary
              </div>
              {[
                { label: 'Total days',    value: new Date(calYear, calMonth, 0).getDate(), color: '#94a3b8' },
                { label: 'Weekends',      value: cells.filter((d, i) => d !== null && (i % 7 === 0 || i % 7 === 6)).length, color: '#94a3b8' },
                { label: 'Special holidays', value: data.holidays.length, color: '#fca5a5' },
                { label: 'School days',   value: data.totalSchoolDays, color: '#86efac' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{row.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'Nunito', color: row.color }}>{row.value}</span>
                </div>
              ))}
              {/* School day progress bar */}
              <div style={{ marginTop: 4 }}>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#4FC3F7,#A8EDCB)', width: `${Math.round((data.totalSchoolDays / new Date(calYear, calMonth, 0).getDate()) * 100)}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' }}>
                  {Math.round((data.totalSchoolDays / new Date(calYear, calMonth, 0).getDate()) * 100)}% school days
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
}
