import React, { useState, useEffect } from 'react';
import './index.css';
import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import Dashboard      from './pages/Dashboard';
import Students       from './pages/Students';
import Analytics      from './pages/Analytics';
import QRScanner      from './pages/QRScanner';
import Notifications  from './pages/Notifications';
import StudentProfile from './pages/StudentProfile';
import HolidayManager from './pages/HolidayManager';
import { clearToken } from './api';

type Role = 'admin' | 'principal' | 'scanner';
type Page = 'dashboard' | 'students' | 'analytics' | 'scanner' | 'notifications' | 'studentprofile' | 'holidays';

const NAV_ITEMS: { page: Page; icon: string; label: string; roles: Role[]; badge?: number }[] = [
  { page: 'dashboard',     icon: '📊', label: 'Dashboard',       roles: ['admin', 'principal'] },
  { page: 'scanner',       icon: '📱', label: 'QR Scanner',      roles: ['admin', 'scanner'] },
  { page: 'students',      icon: '🎒', label: 'Students',        roles: ['admin'] },
  { page: 'analytics',     icon: '📈', label: 'Analytics',       roles: ['admin', 'principal'] },
  { page: 'holidays',      icon: '🎌', label: 'Holidays',        roles: ['admin'] },
  { page: 'notifications', icon: '🔔', label: 'Notifications',   roles: ['admin', 'principal'] },
  { page: 'studentprofile',icon: '👤', label: 'Student Profiles',roles: ['admin', 'principal'] },
];

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard:     { title: 'Dashboard',         subtitle: 'Live school attendance overview' },
  scanner:       { title: 'QR Scanner',        subtitle: 'Scan student arrival & departure' },
  students:      { title: 'Students',          subtitle: 'Manage students and QR codes' },
  analytics:     { title: 'Analytics',         subtitle: 'Trends, reports and insights' },
  notifications: { title: 'Notifications',     subtitle: 'Parent alerts and system logs' },
  studentprofile:{ title: 'Student Profiles',  subtitle: 'Deep-dive attendance analysis' },
  holidays:      { title: 'School Holidays',   subtitle: 'Manage special holidays and school calendar' },
};

const ROLE_LABELS: Record<Role, string> = {
  admin:     'Administrator',
  principal: 'Principal',
  scanner:   'Gate Operator',
};

function initials(name: string, role: Role) {
  return name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : role[0].toUpperCase();
}

export default function App() {
  const [view,     setView]     = useState<'landing' | 'login' | 'app'>('landing');
  const [role,     setRole]     = useState<Role>('admin');
  const [fullName, setFullName] = useState('');
  const [page,     setPage]     = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [page]);

  // Close sidebar on outside click / escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleLogin = (r: Role, name: string) => {
    setRole(r); setFullName(name);
    setPage(r === 'scanner' ? 'scanner' : 'dashboard');
    setView('app');
  };
  const handleLogout = () => { clearToken(); setView('landing'); setFullName(''); };

  if (view === 'landing') return <LandingPage onEnterApp={() => setView('login')} />;
  if (view === 'login')   return <LoginPage onLogin={handleLogin} onBack={() => setView('landing')} />;

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));
  const { title, subtitle } = PAGE_TITLES[page];
  // Bottom nav shows max 5 most important items for this role
  const bottomNav = visibleNav.slice(0, 5);

  return (
    <div className="app-layout">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Close button (mobile) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >✕</button>

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏫</div>
          <div className="sidebar-logo-text">
            <h2>EduTrack</h2>
            <span>Smart Attendance</span>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>

        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <a
              key={item.page}
              href="#!"
              className={page === item.page ? 'active' : ''}
              onClick={e => { e.preventDefault(); setPage(item.page); }}
            >
              <div className="nav-icon">{item.icon}</div>
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials(fullName, role)}</div>
            <div className="sidebar-user-info">
              <h4>{fullName || ROLE_LABELS[role]}</h4>
              <span>{ROLE_LABELS[role]}</span>
            </div>
          </div>
          <button className="signout-btn" onClick={handleLogout}>← Sign Out</button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger — mobile only */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
            <div className="topbar-titles">
              <h1>{title}</h1>
              <p className="topbar-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <span>🔍</span>
              <input placeholder="Search…" />
            </div>
            <button className="topbar-btn" onClick={() => setPage('notifications')} title="Notifications">
              🔔<span className="notif-dot" />
            </button>
            <button className="topbar-btn" onClick={handleLogout} title="Sign out">👤</button>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="page-scroll">
          {page === 'dashboard'      && <Dashboard />}
          {page === 'scanner'        && <QRScanner />}
          {page === 'students'       && <Students />}
          {page === 'analytics'      && <Analytics />}
          {page === 'notifications'  && <Notifications />}
          {page === 'studentprofile' && <StudentProfile />}
          {page === 'holidays'       && <HolidayManager />}
        </div>

        {/* ── Mobile bottom nav bar ── */}
        <nav className="bottom-nav">
          {bottomNav.map(item => (
            <button
              key={item.page}
              className={`bottom-nav-btn${page === item.page ? ' active' : ''}`}
              onClick={() => setPage(item.page)}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
