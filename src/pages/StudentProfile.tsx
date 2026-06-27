import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiGetStudents, StudentRecord, request } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, ArcElement, Title, Tooltip, Legend);

// ── Types ─────────────────────────────────────────────────────────────────────
interface DowEntry { day: string; absent: number; total: number; absentPct: number; }
interface MonthEntry { PRESENT: number; LATE: number; ABSENT: number; }

interface StudentProfileData {
  student: { id: number; studentId: string; name: string; grade: string; parentEmail: string; };
  stats: {
    totalRecords: number; present: number; late: number; absent: number;
    attendancePct: number; absentStreak: number; avgArrivalTime: string | null;
    totalSchoolDays: number;
    riskLevel: 'GOOD' | 'WARNING' | 'HIGH_RISK' | 'NO_DATA';
  };
  heatmap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT'>;
  dowPattern: DowEntry[];
  monthlyBreakdown: Record<string, MonthEntry>;
  fromDate: string;
  toDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function today(): string { return new Date().toISOString().split('T')[0]; }

const RISK_CONFIG = {
  GOOD:      { color: '#22c55e', bg: '#dcfce7', label: '✅ Good Standing', border: '#86efac' },
  WARNING:   { color: '#f59e0b', bg: '#fef3c7', label: '⚠️ Needs Attention', border: '#fcd34d' },
  HIGH_RISK: { color: '#ef4444', bg: '#fee2e2', label: '🚨 High Risk',       border: '#fca5a5' },
  NO_DATA:   { color: '#94a3b8', bg: '#f1f5f9', label: '⬜ No Data Yet',     border: '#cbd5e1' },
};

// ── Monthly Calendar Component ────────────────────────────────────────────────
const STATUS_META: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  PRESENT: { color: '#15803d', bg: '#dcfce7', border: '#86efac', icon: '✓', label: 'Present' },
  LATE:    { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', icon: '⏰', label: 'Late' },
  ABSENT:  { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', icon: '✗', label: 'Absent' },
};

function MonthlyCalendar({ heatmap, year, month, onPrev, onNext, isFirst, isLast }: {
  heatmap: Record<string, string>;
  year: number; month: number;
  onPrev: () => void; onNext: () => void;
  isFirst: boolean; isLast: boolean;
}) {
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Build the grid: leading nulls + all days of month
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Month summary
  let presentCount = 0, lateCount = 0, absentCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const s = heatmap[iso];
    if (s === 'PRESENT') presentCount++;
    else if (s === 'LATE') lateCount++;
    else if (s === 'ABSENT') absentCount++;
  }
  const tracked = presentCount + lateCount + absentCount;
  const monthPct = tracked > 0 ? Math.round(((presentCount + lateCount) / tracked) * 100) : null;

  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(30,58,95,0.10)', border: '1.5px solid #e2e8f0' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)',
        padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onPrev} disabled={isFirst} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer',
          background: isFirst ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
          color: isFirst ? 'rgba(255,255,255,0.25)' : 'white',
          fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>‹</button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: 18, fontWeight: 900, fontFamily: 'Nunito' }}>
            {monthNames[month]} {year}
          </div>
          {monthPct !== null && (
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div style={{ height: 4, width: 100, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${monthPct}%`, borderRadius: 99,
                  background: monthPct >= 90 ? '#22c55e' : monthPct >= 80 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 }}>{monthPct}%</span>
            </div>
          )}
        </div>

        <button onClick={onNext} disabled={isLast} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: isLast ? 'not-allowed' : 'pointer',
          background: isLast ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
          color: isLast ? 'rgba(255,255,255,0.25)' : 'white',
          fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>›</button>
      </div>

      {/* ── Month summary pills ── */}
      {tracked > 0 && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid #e2e8f0' }}>
          {[
            { label: 'Present', count: presentCount, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Late',    count: lateCount,    color: '#92400e', bg: '#fffbeb' },
            { label: 'Absent',  count: absentCount,  color: '#991b1b', bg: '#fff1f2' },
          ].map((item, i) => (
            <div key={item.label} style={{
              flex: 1, padding: '10px 0', textAlign: 'center', background: item.bg,
              borderRight: i < 2 ? '1.5px solid #e2e8f0' : 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Nunito', color: item.color, lineHeight: 1 }}>
                {item.count}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: item.color, opacity: 0.75,
                textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Day name header row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
        {dayNames.map(d => (
          <div key={d} style={{
            padding: '8px 0', textAlign: 'center',
            fontSize: 11, fontWeight: 800, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{d}</div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} style={{ minHeight: 64, background: '#fafbfc',
              borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />;
          }
          const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const status = heatmap[iso] as string | undefined;
          const meta   = status ? STATUS_META[status] : null;
          const isToday = iso === todayStr;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;

          return (
            <div key={idx} style={{
              minHeight: 64, padding: '8px 6px',
              borderRight: '1px solid #f1f5f9',
              borderBottom: '1px solid #f1f5f9',
              background: meta ? meta.bg : isWeekend ? '#fafbfc' : 'white',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              position: 'relative', transition: 'all 0.1s',
            }}>
              {/* Today ring */}
              {isToday && (
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1E3A5F,#4FC3F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 900, fontFamily: 'Nunito' }}>{day}</span>
                </div>
              )}

              {/* Day number */}
              {!isToday && (
                <span style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'Nunito',
                  color: meta ? meta.color : isWeekend ? '#94a3b8' : '#334155',
                  marginBottom: 4,
                }}>{day}</span>
              )}

              {/* Status icon */}
              {meta && (
                <div style={{
                  marginTop: isToday ? 8 : 2,
                  width: 22, height: 22, borderRadius: '50%',
                  background: meta.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: meta.color,
                  border: `1.5px solid ${meta.color}30`,
                }}>{meta.icon}</div>
              )}

              {/* Weekend dot */}
              {!meta && isWeekend && (
                <div style={{ width: 5, height: 5, borderRadius: '50%',
                  background: '#cbd5e1', marginTop: isToday ? 8 : 2 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ padding: '12px 20px', background: '#f8fafc',
        borderTop: '1.5px solid #e2e8f0', display: 'flex', gap: 20, flexWrap: 'wrap',
        alignItems: 'center' }}>
        {Object.entries(STATUS_META).map(([key, m]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%',
              background: m.bg, border: `1.5px solid ${m.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: m.color }}>
              {m.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{m.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Weekend</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1E3A5F,#4FC3F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: 'white' }}>T</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Today</span>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Tab — month navigator ────────────────────────────────────────────
function CalendarTabContent({ heatmap, fromDate, toDate }: {
  heatmap: Record<string, string>; fromDate: string; toDate: string;
}) {
  const [calYear,  setCalYear]  = React.useState(() => new Date(toDate + 'T00:00:00').getFullYear());
  const [calMonth, setCalMonth] = React.useState(() => new Date(toDate + 'T00:00:00').getMonth());

  const startDate = new Date(fromDate + 'T00:00:00');
  const endDate   = new Date(toDate   + 'T00:00:00');

  const isFirst = calYear === startDate.getFullYear() && calMonth === startDate.getMonth();
  const isLast  = calYear === endDate.getFullYear()   && calMonth === endDate.getMonth();

  const handlePrev = () => {
    if (isFirst) return;
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const handleNext = () => {
    if (isLast) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  // Count recent absences for the quick-log sidebar
  const recentAbsences = Object.entries(heatmap)
    .filter(([, s]) => s === 'ABSENT')
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Calendar */}
      <div style={{ flex: '1 1 420px', minWidth: 320 }}>
        <MonthlyCalendar
          heatmap={heatmap}
          year={calYear}
          month={calMonth}
          onPrev={handlePrev}
          onNext={handleNext}
          isFirst={isFirst}
          isLast={isLast}
        />
      </div>

      {/* Sidebar: recent absences + log */}
      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Recent absences */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden',
          border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(30,58,95,0.07)' }}>
          <div style={{ background: '#fff1f2', padding: '12px 16px',
            borderBottom: '1.5px solid #fca5a5' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b',
              textTransform: 'uppercase', letterSpacing: 0.8 }}>Recent Absences</div>
          </div>
          {recentAbsences.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              No absences in range 🎉
            </div>
          ) : (
            <div>
              {recentAbsences.map(([date]) => {
                const d = new Date(date + 'T00:00:00');
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={date} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderBottom: '1px solid #fff1f2',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: '#fee2e2', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', lineHeight: 1 }}>{dayName}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#991b1b', fontFamily: 'Nunito', lineHeight: 1.1 }}>
                        {d.getDate()}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{dateLabel}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 14 }}>✗</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to read */}
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: '14px 16px',
          border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>How to read</div>
          {Object.entries(STATUS_META).map(([, m]) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: m.bg, border: `1.5px solid ${m.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: m.color }}>
                {m.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{m.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#1E3A5F,#4FC3F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: 'white' }}>T</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: '#fafbfc', border: '1.5px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Weekend / Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string; }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '18px 22px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Nunito', color }}>{value}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentProfile() {
  const [students, setStudents]       = useState<StudentRecord[]>([]);
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [profile, setProfile]         = useState<StudentProfileData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError]             = useState('');
  const [rangeDays, setRangeDays]     = useState(30);
  const [activeTab, setActiveTab]     = useState<'overview' | 'calendar' | 'patterns' | 'monthly'>('overview');

  // Load student list
  useEffect(() => {
    setStudentsLoading(true);
    apiGetStudents()
      .then(setStudents)
      .catch((e: Error) => setError('Failed to load students: ' + (e.message || 'Permission denied. Contact admin.')))
      .finally(() => setStudentsLoading(false));
  }, []);

  // Load profile when student or range changes
  const loadProfile = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    const from = daysAgo(rangeDays - 1);
    const to   = today();
    request<StudentProfileData>(`/analytics/student/${selectedId}?fromDate=${from}&toDate=${to}`)
      .then(setProfile)
      .catch(e => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [selectedId, rangeDays]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase())
  );

  const risk = profile ? RISK_CONFIG[profile.stats.riskLevel] : null;

  // ── Charts ──────────────────────────────────────────────────────────────────
  const donutData = profile ? {
    labels: ['Present', 'Late', 'Absent'],
    datasets: [{ data: [profile.stats.present, profile.stats.late, profile.stats.absent],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 0, hoverOffset: 6 }],
  } : null;

  const dowData = profile ? {
    labels: profile.dowPattern.map(d => d.day.substring(0, 3)),
    datasets: [
      { label: 'Absent %', data: profile.dowPattern.map(d => d.absentPct),
        backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 8, borderSkipped: false },
      { label: 'Days tracked', data: profile.dowPattern.map(d => d.total),
        backgroundColor: 'rgba(79,195,247,0.3)', borderRadius: 8, borderSkipped: false },
    ],
  } : null;

  const monthlyLabels = profile ? Object.keys(profile.monthlyBreakdown) : [];
  const monthlyData = profile ? {
    labels: monthlyLabels.map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      { label: 'Present', data: monthlyLabels.map(k => profile.monthlyBreakdown[k].PRESENT),
        backgroundColor: '#22c55e', borderRadius: 6, borderSkipped: false },
      { label: 'Late',    data: monthlyLabels.map(k => profile.monthlyBreakdown[k].LATE),
        backgroundColor: '#f59e0b', borderRadius: 6, borderSkipped: false },
      { label: 'Absent',  data: monthlyLabels.map(k => profile.monthlyBreakdown[k].ABSENT),
        backgroundColor: '#ef4444', borderRadius: 6, borderSkipped: false },
    ],
  } : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-inner" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── LEFT: Student Picker ── */}
      <div style={{
        width: 280, flexShrink: 0, background: 'white', borderRadius: 20,
        boxShadow: 'var(--shadow)', overflow: 'hidden', position: 'sticky', top: 0,
      }}>
        <div style={{ padding: '20px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Select Student</h3>
          <input
            className="form-input"
            placeholder="🔍 Search name, ID, grade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: 13 }}
          />
        </div>
        <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          {studentsLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading…
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {search ? 'No students match your search' : 'No students found'}
            </div>
          ) : filteredStudents.map(s => (
            <div
              key={s.id}
              onClick={() => { setSelectedId(s.id); setProfile(null); setActiveTab('overview'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: selectedId === s.id ? 'linear-gradient(135deg,rgba(79,195,247,0.12),rgba(168,237,203,0.08))' : 'white',
                borderLeft: selectedId === s.id ? '4px solid var(--sky)' : '4px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                background: selectedId === s.id
                  ? 'linear-gradient(135deg,var(--sky),var(--mint))'
                  : 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, fontFamily: 'Nunito',
                color: selectedId === s.id ? 'white' : 'var(--text-muted)',
              }}>
                {initials(s.fullName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.fullName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.studentId} · Grade {s.grade}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Profile View ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Empty state */}
        {!selectedId && (
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)',
            padding: '64px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
            <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
              Select a student to view their profile
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Full attendance history, patterns, and risk analysis will appear here.
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedId && loading && (
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)',
            padding: '64px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading profile…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 12,
            padding: '12px 18px', fontSize: 13, color: '#b91c1c', fontWeight: 600,
            marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            ⚠️ {error}
            <button onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {/* Profile loaded */}
        {profile && !loading && (
          <>
            {/* ── Header Card ── */}
            <div style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)',
              borderRadius: 20, padding: '28px 32px', marginBottom: 20,
              boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden',
            }}>
              {/* decorative blob */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                borderRadius: '50%', background: 'rgba(79,195,247,0.08)', pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--sky), var(--mint))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 900, fontFamily: 'Nunito', color: 'white',
                  boxShadow: '0 8px 24px rgba(79,195,247,0.4)',
                }}>
                  {initials(profile.student.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: 'white', fontSize: 22, marginBottom: 4 }}>{profile.student.name}</h2>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      ['🆔', profile.student.studentId],
                      ['📚', `Grade ${profile.student.grade}`],
                      ['📧', profile.student.parentEmail || '—'],
                    ].map(([icon, val]) => (
                      <span key={val} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 5 }}>
                        {icon} {val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk badge */}
                {risk && (
                  <div style={{
                    background: risk.bg, border: `2px solid ${risk.border}`,
                    borderRadius: 14, padding: '10px 18px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: risk.color }}>{risk.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Nunito', color: risk.color, marginTop: 2 }}>
                      {profile.stats.attendancePct}%
                    </div>
                    <div style={{ fontSize: 10, color: risk.color, opacity: 0.7 }}>Attendance Rate</div>
                  </div>
                )}
              </div>

              {/* Quick stats row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'School Days',     val: profile.stats.totalSchoolDays, color: '#4FC3F7' },
                  { label: 'Days Recorded',    val: profile.stats.totalRecords, color: '#a78bfa' },
                  { label: 'Present',          val: profile.stats.present,      color: '#22c55e' },
                  { label: 'Late Arrivals',    val: profile.stats.late,         color: '#f59e0b' },
                  { label: 'Absences',         val: profile.stats.absent,       color: '#ef4444' },
                  { label: 'Current Streak',   val: profile.stats.absentStreak > 0 ? `${profile.stats.absentStreak} absent` : '—', color: profile.stats.absentStreak > 2 ? '#ef4444' : '#94a3b8' },
                  { label: 'Avg Arrival',      val: profile.stats.avgArrivalTime || '—', color: '#a78bfa' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Nunito', color }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Range + Tabs ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, background: 'white', borderRadius: 14, padding: 6, boxShadow: 'var(--shadow)' }}>
                {[
                  { label: '2W',  days: 14  },
                  { label: '1M',  days: 30  },
                  { label: '3M',  days: 90  },
                  { label: '6M',  days: 180 },
                ].map(({ label, days }) => (
                  <button key={days} onClick={() => setRangeDays(days)} style={{
                    padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 800, fontFamily: 'Nunito', fontSize: 12,
                    background: rangeDays === days ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'transparent',
                    color: rangeDays === days ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {fmtDate(profile.fromDate)} — {fmtDate(profile.toDate)}
              </span>
            </div>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white',
              borderRadius: 14, padding: 6, boxShadow: 'var(--shadow)', width: 'fit-content' }}>
              {([
                ['overview',  '📊 Overview'],
                ['calendar',  '📅 Calendar'],
                ['patterns',  '🔍 Patterns'],
                ['monthly',   '📈 Monthly'],
              ] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'Nunito', fontSize: 12,
                  background: activeTab === tab ? 'linear-gradient(135deg,#1E3A5F,#0F2240)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* ─────────── TAB: OVERVIEW ─────────── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

                {/* Donut chart */}
                <div style={{ flex: 1, minWidth: 260, background: 'white', borderRadius: 20,
                  boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>Attendance Breakdown</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    {profile.stats.totalRecords} recorded days
                  </p>
                  {donutData && (
                    <div style={{ maxWidth: 220, margin: '0 auto' }}>
                      <Doughnut data={donutData} options={{
                        cutout: '72%', responsive: true,
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: 700 }, padding: 16 } },
                          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} days` } },
                        },
                      }} />
                    </div>
                  )}
                </div>

                {/* Stats pills */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <StatPill label="Present" value={profile.stats.present} color="#22c55e" bg="#dcfce7" />
                    <StatPill label="Late"    value={profile.stats.late}    color="#f59e0b" bg="#fef3c7" />
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <StatPill label="Absent"     value={profile.stats.absent}         color="#ef4444" bg="#fee2e2" />
                    <StatPill label="Attendance" value={`${profile.stats.attendancePct}%`} color="#0288D1" bg="#e1f5fe" />
                  </div>

                  {/* Streak warning */}
                  {profile.stats.absentStreak >= 2 && (
                    <div style={{
                      background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14,
                      padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 24 }}>🔴</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#c2410c' }}>
                          {profile.stats.absentStreak}-day absence streak
                        </div>
                        <div style={{ fontSize: 12, color: '#9a3412', marginTop: 2 }}>
                          Student has been absent for {profile.stats.absentStreak} consecutive school days.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avg arrival */}
                  <div style={{
                    background: '#f5f3ff', border: '1.5px solid #e9d5ff', borderRadius: 14,
                    padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed',
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Average Arrival</div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Nunito', color: '#7c3aed' }}>
                      {profile.stats.avgArrivalTime || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 2 }}>
                      {profile.stats.avgArrivalTime
                        ? (profile.stats.avgArrivalTime < '08:00' ? 'Usually on time ✅' : 'Usually arriving late ⚠️')
                        : 'No arrival scans in range'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────── TAB: CALENDAR ─────────── */}
            {activeTab === 'calendar' && (
              <CalendarTabContent heatmap={profile.heatmap} fromDate={profile.fromDate} toDate={profile.toDate} />
            )}

            {/* ─────────── TAB: PATTERNS ─────────── */}
            {activeTab === 'patterns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Day-of-week chart */}
                <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>Day-of-Week Absence Pattern</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Which day does this student miss most?
                  </p>
                  {dowData && (
                    <Bar data={dowData} options={{
                      responsive: true,
                      plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } } },
                      scales: {
                        y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Nunito' } } },
                        x: { grid: { display: false }, ticks: { font: { family: 'Nunito', weight: 700 } } },
                      },
                    }} />
                  )}
                </div>

                {/* Worst day insight */}
                {profile.dowPattern.length > 0 && (() => {
                  const worst = [...profile.dowPattern].sort((a, b) => b.absentPct - a.absentPct)[0];
                  const best  = [...profile.dowPattern].filter(d => d.total > 0).sort((a, b) => a.absentPct - b.absentPct)[0];
                  return (
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ flex: 1, background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 16, padding: '18px 22px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Worst Day</div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: '#b91c1c' }}>{worst.day}</div>
                        <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>{worst.absentPct.toFixed(0)}% absence rate · {worst.absent}/{worst.total} days missed</div>
                      </div>
                      {best && (
                        <div style={{ flex: 1, background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 16, padding: '18px 22px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Best Day</div>
                          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Nunito', color: '#15803d' }}>{best.day}</div>
                          <div style={{ fontSize: 12, color: '#14532d', marginTop: 4 }}>{best.absentPct.toFixed(0)}% absence rate · {best.absent}/{best.total} days missed</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─────────── TAB: MONTHLY ─────────── */}
            {activeTab === 'monthly' && (
              <div style={{ background: 'white', borderRadius: 20, boxShadow: 'var(--shadow)', padding: '24px 28px' }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>Monthly Attendance Breakdown</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Present / Late / Absent counts by month
                </p>
                {monthlyData && monthlyLabels.length > 0 ? (
                  <Bar data={monthlyData} options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } },
                    },
                    scales: {
                      x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Nunito', weight: 700 } } },
                      y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Nunito' } } },
                    },
                  }} />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 13 }}>
                    No monthly data for this period
                  </div>
                )}

                {/* Monthly table */}
                <div style={{ marginTop: 24, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['Month', 'Present', 'Late', 'Absent', 'Total', 'Rate'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800,
                            fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)',
                            borderBottom: '2px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyLabels.map(k => {
                        const m = profile.monthlyBreakdown[k];
                        const total = m.PRESENT + m.LATE + m.ABSENT;
                        const rate  = total > 0 ? (((m.PRESENT + m.LATE) / total) * 100).toFixed(1) : '—';
                        const [y, mo] = k.split('-');
                        const label = new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return (
                          <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>{label}</td>
                            <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: 700 }}>{m.PRESENT}</td>
                            <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: 700 }}>{m.LATE}</td>
                            <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 700 }}>{m.ABSENT}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{total}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                background: rate === '—' ? '#f1f5f9' : parseFloat(rate) >= 90 ? '#dcfce7' : parseFloat(rate) >= 80 ? '#fef3c7' : '#fee2e2',
                                color:      rate === '—' ? '#94a3b8' : parseFloat(rate) >= 90 ? '#15803d' : parseFloat(rate) >= 80 ? '#92400e' : '#b91c1c',
                                borderRadius: 8, padding: '3px 10px', fontWeight: 800, fontSize: 12,
                              }}>{rate === '—' ? '—' : `${rate}%`}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
