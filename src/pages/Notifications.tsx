import React, { useState, useEffect, useCallback } from 'react';
import { apiGetToday, apiGetSummary, AttendanceRecord, SummaryData } from '../api';

interface Notif {
  icon: string;
  type: 'coral' | 'yellow' | 'mint' | 'sky';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  category: 'alert' | 'report' | 'system';
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · Today'
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildNotifs(records: AttendanceRecord[], summary: SummaryData | null): Notif[] {
  const notifs: Notif[] = [];

  // One notif per absent/late student scanned today
  for (const r of records) {
    const name = `${r.student.fullName} (${r.student.grade})`;
    if (r.status === 'ABSENT') {
      notifs.push({
        icon: '🔴',
        type: 'coral',
        title: 'Absence Alert',
        body: `${name} was marked absent. Parent notification sent.`,
        time: fmtTime(r.attendanceDate + 'T00:00:00'),
        unread: true,
        category: 'alert',
      });
    } else if (r.status === 'LATE' && r.arrivalTime) {
      const mins = Math.round(
        (new Date(r.arrivalTime).getTime() - new Date(r.attendanceDate + 'T08:00:00').getTime()) /
          60000
      );
      notifs.push({
        icon: '⏰',
        type: 'yellow',
        title: 'Lateness Alert',
        body: `${name} arrived ${mins > 0 ? mins + ' minutes late' : 'late'}. Parent notified.`,
        time: fmtTime(r.arrivalTime),
        unread: true,
        category: 'alert',
      });
    }
  }

  // Summary notif if we have data
  if (summary && summary.totalStudents > 0) {
    notifs.push({
      icon: '📊',
      type: 'sky',
      title: 'Today\'s Summary',
      body: `Present: ${summary.presentToday} · Late: ${summary.lateToday} · Absent: ${summary.absentToday} · Attendance rate: ${summary.attendancePct}%`,
      time: 'Today',
      unread: false,
      category: 'report',
    });
  }

  return notifs;
}

export default function Notifications() {
  const [filter, setFilter] = useState('All');
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readSet, setReadSet] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [records, summary] = await Promise.all([
        apiGetToday().catch(() => [] as AttendanceRecord[]),
        apiGetSummary().catch(() => null),
      ]);
      setNotifs(buildNotifs(records, summary));
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifs.filter((n, i) => n.unread && !readSet.has(i)).length;

  const markAllRead = () => {
    setReadSet(new Set(notifs.map((_, i) => i)));
  };

  const filtered = notifs.filter((n, i) => {
    const isUnread = n.unread && !readSet.has(i);
    if (filter === 'Unread') return isUnread;
    if (filter === 'Alerts') return n.category === 'alert';
    if (filter === 'Reports') return n.category === 'report';
    return true;
  });

  return (
    <div className="page-inner">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {['All', 'Unread', 'Alerts', 'Reports'].map(f => (
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
            {f} {f === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-sm"
            style={{ marginLeft: 'auto', background: 'white', color: 'var(--text-muted)', border: '2px solid var(--border)' }}
          >
            ✓ Mark all read
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #FF8A80', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#C62828', fontWeight: 600, fontFamily: 'Nunito', marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito' }}>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔔</div>
          <h3 style={{ fontFamily: 'Nunito', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
            {filter === 'Unread' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Nunito' }}>
            {filter === 'Unread'
              ? 'No unread notifications.'
              : 'Notifications will appear here when students are scanned or alerts are triggered.'}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((n, i) => {
            const isUnread = n.unread && !readSet.has(i);
            return (
              <div
                key={i}
                className={`notif-item ${isUnread ? 'unread' : ''}`}
                onClick={() => setReadSet(s => new Set([...s, i]))}
                style={{ cursor: 'pointer' }}
              >
                <div className={`notif-icon ${n.type}`}>{n.icon}</div>
                <div className="notif-content" style={{ flex: 1 }}>
                  <h4>{n.title}</h4>
                  <p>{n.body}</p>
                  <p className="notif-time">🕐 {n.time}</p>
                </div>
                {isUnread && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3F7', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
