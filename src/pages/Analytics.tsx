import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { apiGetSummary, apiGetTrend, apiGetClassComparison, SummaryData, TrendDay, ClassStat } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Analytics() {
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [trend, setTrend]       = useState<TrendDay[]>([]);
  const [classes, setClasses]   = useState<ClassStat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);
  const [errors, setErrors]     = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setErrors([]);
    Promise.allSettled([
      apiGetSummary(),
      apiGetTrend(days),
      apiGetClassComparison(),
    ]).then(([sRes, tRes, cRes]) => {
      const errs: string[] = [];
      // FIX: Track each failure individually so user knows which section failed
      if (sRes.status === 'fulfilled') setSummary(sRes.value);
      else errs.push('Failed to load summary stats');
      if (tRes.status === 'fulfilled') setTrend(tRes.value);
      else errs.push('Failed to load attendance trend');
      if (cRes.status === 'fulfilled') setClasses(cRes.value);
      else errs.push('Failed to load class comparison');
      setErrors(errs);
    }).finally(() => setLoading(false));
  }, [days]);

  // FIX: Auto-refresh every 60 seconds so analytics stay current
  useEffect(() => {
    const id = setInterval(() => {
      Promise.allSettled([
        apiGetSummary(),
        apiGetTrend(days),
        apiGetClassComparison(),
      ]).then(([sRes, tRes, cRes]) => {
        if (sRes.status === 'fulfilled') setSummary(sRes.value);
        if (tRes.status === 'fulfilled') setTrend(tRes.value);
        if (cRes.status === 'fulfilled') setClasses(cRes.value);
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [days]);

  const trendChartData = {
    labels: trend.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Attendance %',
      data: trend.map(d => d.pct),
      borderColor: '#4FC3F7', backgroundColor: 'rgba(79,195,247,0.1)',
      tension: 0.4, fill: true,
    }]
  };

  const classChartData = {
    labels: classes.map(c => c.grade),
    datasets: [
      {
        label: 'Attendance %',
        data: classes.map(c => c.pct),
        backgroundColor: 'rgba(79,195,247,0.7)', borderRadius: 8, borderSkipped: false,
      },
      {
        label: 'Target 90%',
        data: classes.map(() => 90),
        backgroundColor: 'rgba(168,237,203,0.5)', borderRadius: 8, borderSkipped: false,
      }
    ]
  };

  const periodOptions = [
    { label: 'Last 7 Days',  days: 7  },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 60 Days', days: 60 },
    { label: 'Last 90 Days', days: 90 },
  ];

  return (
    <div className="page-inner">
      {errors.length > 0 && (
        <div style={{ background: '#FFF3E0', border: '1.5px solid #FFB74D', borderRadius: 12, padding: '10px 16px',
          fontSize: 13, color: '#E65100', marginBottom: 16, fontWeight: 600, fontFamily: 'Nunito' }}>
          ⚠️ {errors.join(' · ')}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito' }}>Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* KPIs — show placeholders if summary failed to load */}
          {(
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              {[
                { label: 'Overall Attendance Today', val: summary ? `${summary.attendancePct}%` : '—', color: 'sky' },
                { label: 'Present Today',            val: summary ? String(summary.presentToday)  : '—', color: 'mint' },
                { label: 'Late Today',               val: summary ? String(summary.lateToday)     : '—', color: 'yellow' },
                { label: 'Absent Today',             val: summary ? String(summary.absentToday)   : '—', color: 'coral' },
              ].map((k, i) => (
                <div key={i} className={`stat-card ${k.color}`}>
                  <div className="stat-card-accent" />
                  <div className="stat-label" style={{ marginBottom: 8, fontSize: 12 }}>{k.label}</div>
                  <div className="stat-value" style={{ fontSize: 28 }}>{k.val}</div>
                </div>
              ))}
            </div>
          )

          {/* Period selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {periodOptions.map(p => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontFamily: 'Nunito',
                  fontSize: 12, cursor: 'pointer', border: '2px solid',
                  background: days === p.days ? 'linear-gradient(135deg,#4FC3F7,#0288D1)' : 'white',
                  color: days === p.days ? 'white' : 'var(--text-muted)',
                  borderColor: days === p.days ? '#4FC3F7' : 'var(--border)',
                }}
              >{p.label}</button>
            ))}
          </div>

          <div className="charts-row" style={{ marginBottom: 20 }}>
            {/* Class Comparison */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div><h3>Class Comparison</h3><p>Attendance % by class vs 90% target</p></div>
              </div>
              {classes.length > 0 ? (
                <Bar data={classChartData} options={{
                  responsive: true,
                  plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } } },
                  scales: {
                    y: {
                      // FIX: Dynamic min — floor at 0, not hardcoded 60.
                      // If attendance drops below 60% the old code clipped bars incorrectly.
                      min: Math.max(0, Math.floor((Math.min(...classes.map(c => c.pct), 90) - 10) / 10) * 10),
                      max: 100,
                      ticks: { callback: (v: number | string) => v + '%' },
                      grid: { color: '#E2EFF9' }
                    },
                    x: { grid: { display: false } }
                  }
                }} />
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No class data for today
                </div>
              )}
            </div>

            {/* Summary stats panel */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div><h3>Today at a Glance</h3>
                <p>{summary?.date
                  ? new Date(summary.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : ''}</p>
              </div>
              </div>
              {summary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {[
                    { label: 'Total Students', val: summary.totalStudents, color: '#4FC3F7', bg: '#E1F5FE' },
                    { label: 'Present',        val: summary.presentToday,  color: '#43A047', bg: '#E8F5E9' },
                    { label: 'Late',           val: summary.lateToday,     color: '#F9A825', bg: '#FFF9C4' },
                    { label: 'Absent',         val: summary.absentToday,   color: '#E53935', bg: '#FFEBEE' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: item.bg }}>
                      <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#1E293B' }}>{item.label}</div>
                      <div style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div><h3>Attendance Trend</h3><p>Daily attendance % over selected period</p></div>
              <span className="chip purple">Live Data</span>
            </div>
            {trend.length > 0 ? (
              <Line data={trendChartData} options={{
                responsive: true,
                plugins: { legend: { position: 'top', labels: { font: { family: 'Nunito', weight: 700 } } } },
                scales: {
                  y: {
                    // FIX: Dynamic min for trend chart too
                    min: Math.max(0, Math.floor((Math.min(...trend.map(d => d.pct), 100) - 10) / 10) * 10),
                    max: 100,
                    ticks: { callback: (v: number | string) => v + '%' },
                    grid: { color: '#E2EFF9' }
                  },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
              }} />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No trend data for this period yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
