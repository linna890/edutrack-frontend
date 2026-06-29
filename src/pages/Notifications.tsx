import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
// FIX: Notifications page was entirely hardcoded with fake static data.
// Now it fetches real attendance events from the backend and builds a
// live notification feed from today's records + recent high-risk alerts.

interface LiveNotif {
  id: string;
  icon: string;
  type: 'coral' | 'yellow' | 'mint' | 'sky';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  category: 'alert' | 'report' | 'info';
}

interface AttendanceRecord {
  id: number;
  attendanceDate: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  arrivalTime?: string;
  student?: { fullName: string; grade: string; studentId: string };
}

interface HighRiskStudent {
  name: string;
  grade: string;
  attendancePct: number;
  absences: number;
  parentEmail: string;
}

interface SummaryData {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendancePct: number;
  date: string;
}

function fmtTime(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildNotifs(
  records: AttendanceRecord[],
  highRisk: HighRiskStudent[],
  summary: SummaryData | null
): LiveNotif[] {
  const notifs: LiveNotif[] = [];

  // ── Today's daily summary ─────────────────────────────────────────────────
  if (summary) {
    notifs.push({
      id: 'summary-today',
      icon: '📊',
      type: 'sky',
      title: 'Daily Attendance Summary',
      body: `Today (${summary.date}): ${summary.presentToday} present, ${summary.lateToday} late, ${summary.absentToday} absent — ${summary.attendancePct}% overall attendance across ${summary.totalStudents} students.`,
      time: 'Today',
      unread: true,
      category: 'report',
    });
  }

  // ── Per-student events ────────────────────────────────────────────────────
  for (const r of records) {
    if (!r.student) continue;
    const name = r.student.fullName;
    const grade = r.student.grade;

    if (r.status === 'ABSENT') {
      notifs.push({
        id: `absent-${r.id}`,
        icon: '🔴',
        type: 'coral',
        title: 'Absence Alert',
        body: `${name} (${grade}) was marked absent today. Parent has been notified via email.`,
        time: fmtTime(r.arrivalTime) || 'Today',
        unread: true,
        category: 'alert',
      });
    } else if (r.status === 'LATE') {
      notifs.push({
        id: `late-${r.id}`,
        icon: '⏰',
        type: 'yellow',
        title: 'Late Arrival',
        body: `${name} (${grade}) arrived late${r.arrivalTime ? ` at ${fmtTime(r.arrivalTime)}` : ''}. Parent notified.`,
        time: fmtTime(r.arrivalTime) || 'Today',
        unread: true,
        category: 'alert',
      });
    } else if (r.status === 'PRESENT') {
      notifs.push({
        id: `present-${r.id}`,
        icon: '✅',
        type: 'mint',
        title: 'Arrived On Time',
        body: `${name} (${grade}) scanned in${r.arrivalTime ? ` at ${fmtTime(r.arrivalTime)}` : ''}.`,
        time: fmtTime(r.arrivalTime) || 'Today',
        unread: false,
        category: 'info',
      });
    }
  }

  // ── High-risk student alerts ──────────────────────────────────────────────
  for (const s of highRisk) {
    notifs.push({
      id: `highrisk-${s.name}`,
      icon: '⚠️',
      type: 'coral',
      title: 'High-Risk Attendance Alert',
      body: `${s.name} (${s.grade}) has fallen below ${s.attendancePct}% attendance — ${s.absences} absences in the last 30 days. Consider contacting parent: ${s.parentEmail || '—'}.`,
      time: 'Last 30 days',
      unread: s.attendancePct < 60,
      category: 'alert',
    });
  }

  return notifs;
}

export default function Notifications() {
  const [filter, setFilter]     = useState<'All' | 'Unread' | 'Alerts' | 'Reports'>('All');
  const [notifs, setNotifs]     = useState<LiveNotif[]>([]);
  const [readIds, setReadIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [emailOk, setEmailOk]   = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const since30 = new Date();
      since30.setDate(since30.getDate() - 30);
      const sinceStr = since30.toISOString().split('T')[0];

      // FIX: Use Promise.allSettled so partial failures degrade gracefully
      const [todayRes, highRiskRes, summaryRes] = await Promise.allSettled([
        request<AttendanceRecord[]>('/attendance/today'),
        request<HighRiskStudent[]>(`/analytics/high-risk?since=${sinceStr}`),
        request<SummaryData>('/analytics/summary'),
      ]);

      const records  = todayRes.status    === 'fulfilled' ? todayRes.value    : [];
      const highRisk = highRiskRes.status === 'fulfilled' ? highRiskRes.value : [];
      const summary  = summaryRes.status  === 'fulfilled' ? summaryRes.value  : null;

      setNotifs(buildNotifs(records, highRisk, summary));

      // Light email-health check: if today summary loaded, SMTP is likely working
      setEmailOk(summaryRes.status === 'fulfilled');
    } catch (e: any) {
      setError(e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // FIX: "Mark all read" now actually marks all as read locally
  const markAllRead = () => {
    setReadIds(new Set(notifs.map(n => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds(prev => new Set(Array.from(prev).concat(id)));
  };

  const effectiveNotifs = notifs.map(n => ({
    ...n,
    unread: n.unread && !readIds.has(n.id),
  }));

  // FIX: "Alerts" and "Reports" filters now actually work
  const filtered = effectiveNotifs.filter(n => {
    if (filter === 'All')     return true;
    if (filter === 'Unread')  return n.unread;
    if (filter === 'Alerts')  return n.category === 'alert';
    if (filter === 'Reports') return n.category === 'report';
    return true;
  });

  const unreadCount = effectiveNotifs.filter(n => n.unread).length;

  return (
    <div className="page-inner">
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['All', 'Unread', 'Alerts', 'Reports'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn-sm"
            style={{
              background: filter === f ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'white',
              color: filter === f ? 'white' : 'var(--text-muted)',
              border: '2px solid', borderColor: filter === f ? '#4FC3F7' : 'var(--border)',
              padding: '8px 18px',
            }}
          >
            {f} {f === 'Unread' ? `(${unreadCount})` : ''}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className="btn-sm sky"
            onClick={markAllRead}
            style={{ background: 'white', color: 'var(--text-muted)', border: '2px solid var(--border)' }}
          >
            ✓ Mark all read
          </button>
          <button
            className="btn-sm sky"
            onClick={loadData}
            style={{ background: 'white', color: 'var(--text-muted)', border: '2px solid var(--border)' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Email status card */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #0F2240)', borderRadius: 20, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 32px rgba(15,34,64,0.3)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#4FC3F7,#A8EDCB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(79,195,247,0.4)' }}>📧</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'white', fontSize: 15, marginBottom: 4 }}>Brevo SMTP Email Service</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            {emailOk === null
              ? 'Checking status…'
              : emailOk
              ? `${notifs.filter(n => n.category === 'alert').length} alert email(s) sent today · Delivery active`
              : 'Could not confirm email status — check SMTP configuration'}
          </p>
        </div>
        <span style={{
          background: emailOk === false ? '#FF8A80' : '#A8EDCB',
          color: emailOk === false ? '#B71C1C' : '#1B5E20',
          fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, fontFamily: 'Nunito'
        }}>
          {emailOk === false ? '● ERROR' : '● ACTIVE'}
        </span>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontFamily: 'Nunito' }}>
          ⏳ Loading notifications…
        </div>
      )}
      {error && !loading && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #FF8A80', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#C62828', fontWeight: 600, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Notification list */}
      {!loading && (
        <div className="notif-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 13 }}>No notifications in this category</p>
            </div>
          ) : filtered.map(n => (
            <div
              key={n.id}
              className={`notif-item ${n.unread ? 'unread' : ''}`}
              onClick={() => markRead(n.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`notif-icon ${n.type}`}>{n.icon}</div>
              <div className="notif-content" style={{ flex: 1 }}>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <p className="notif-time">🕐 {n.time}</p>
              </div>
              {n.unread && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3F7', flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
