import React, { useState, useEffect } from 'react';

const CHARACTERS = [
  { emoji: '👦', name: 'Kavin', color: '#4FC3F7', bg: '#E1F5FE', status: '✅ Present', time: '7:42 AM' },
  { emoji: '👧', name: 'Amara', color: '#CE93D8', bg: '#F3E5F5', status: '✅ Present', time: '7:55 AM' },
  { emoji: '👦', name: 'Ruwan', color: '#FFD54F', bg: '#FFFDE7', status: '⏰ Late',    time: '8:14 AM' },
  { emoji: '👧', name: 'Sasha', color: '#A8EDCB', bg: '#E8F5E9', status: '✅ Present', time: '7:38 AM' },
];

const FEATURES = [
  { icon: '📱', title: 'Scan & Go',        desc: 'Students scan their QR card at the gate. Done in 2 seconds.', color: '#4FC3F7', bg: '#E1F5FE' },
  { icon: '📊', title: 'Live Dashboard',   desc: 'See who\'s in school right now. Updated instantly.',           color: '#A8EDCB', bg: '#E8F5E9' },
  { icon: '📬', title: 'Parent Alerts',    desc: 'Parents get an email the moment their child arrives.',         color: '#CE93D8', bg: '#F3E5F5' },
  { icon: '🏆', title: 'Track Progress',   desc: 'Know which students need support before it\'s too late.',      color: '#FFD54F', bg: '#FFFDE7' },
];

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [tick, setTick] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => (n + 1) % CHARACTERS.length), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F0F9FF', color: '#1E293B', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 10 ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrollY > 10 ? 'blur(12px)' : 'none',
        boxShadow: scrollY > 10 ? '0 2px 16px rgba(79,195,247,0.1)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🏫</div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, color: '#1E3A5F' }}>EduTrack</span>
        </div>
        <button onClick={onEnterApp} style={{
          padding: '10px 24px', borderRadius: 14,
          background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: 14, fontFamily: "'Nunito', sans-serif",
          boxShadow: '0 4px 14px rgba(79,195,247,0.4)',
        }}>Sign In →</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', textAlign: 'center',
        background: 'linear-gradient(160deg, #E8F6FE 0%, #F0FDF4 60%, #F5F3FF 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.15) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,237,203,0.18) 0%, transparent 70%)', bottom: -100, right: -100, pointerEvents: 'none' }} />

        {/* Floating school emoji decorations */}
        {[
          { e: '📚', t: '8%',  l: '4%',  s: 40 },
          { e: '✏️', t: '15%', r: '6%',  s: 36 },
          { e: '⭐', t: '40%', l: '2%',  s: 34 },
          { e: '🎒', t: '60%', r: '4%',  s: 42 },
          { e: '🖍️', t: '75%', l: '7%',  s: 34 },
          { e: '📐', t: '25%', r: '8%',  s: 32 },
        ].map((d, i) => (
          <div key={i} style={{
            position: 'absolute', top: d.t, left: (d as any).l, right: (d as any).r,
            fontSize: d.s, opacity: 0.12, userSelect: 'none',
            animation: `floatEmoji ${5 + i}s ease-in-out ${i * 0.6}s infinite alternate`,
          }}>{d.e}</div>
        ))}

        {/* Main headline */}
        <div style={{ position: 'relative', maxWidth: 680 }}>
          <div style={{ fontSize: 'clamp(48px, 8vw, 80px)', marginBottom: 8 }}>🏫</div>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 'clamp(32px, 6vw, 60px)', lineHeight: 1.15,
            color: '#1E3A5F', marginBottom: 16,
          }}>
            Welcome to<br />
            <span style={{ background: 'linear-gradient(135deg,#4FC3F7,#0288D1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EduTrack</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: '#64748B', lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
            Smart attendance for happy schools. Every student accounted for, every parent informed, every day.
          </p>

          <button onClick={onEnterApp} style={{
            padding: '16px 40px', borderRadius: 18,
            background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
            color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 18, fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 8px 32px rgba(79,195,247,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 40px rgba(79,195,247,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(79,195,247,0.45)'; }}
          >
            🚀 Go to Dashboard
          </button>
        </div>

        {/* ── Animated scan card ── */}
        <div style={{ marginTop: 56, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>

          {/* Gate scanner mock */}
          <div style={{
            background: 'white', borderRadius: 24, padding: '24px 28px',
            boxShadow: '0 12px 48px rgba(30,58,95,0.12)', border: '1.5px solid #E2EFF9',
            minWidth: 220, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Gate Scanner</div>
            <div style={{ fontSize: 64, marginBottom: 8 }}>{CHARACTERS[tick].emoji}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, color: '#1E3A5F' }}>{CHARACTERS[tick].name}</div>
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '5px 14px', borderRadius: 99,
              background: CHARACTERS[tick].bg, color: CHARACTERS[tick].color,
              fontSize: 13, fontWeight: 800, fontFamily: "'Nunito', sans-serif",
            }}>{CHARACTERS[tick].status}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{CHARACTERS[tick].time}</div>
            {/* Scan animation */}
            <div style={{ marginTop: 14, height: 3, borderRadius: 99, background: '#E2EFF9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#4FC3F7,#A8EDCB)', width: `${((tick + 1) / CHARACTERS.length) * 100}%`, transition: 'width 1.8s ease' }} />
            </div>
          </div>

          {/* Arrow */}
          <div style={{ fontSize: 32, color: '#CBD5E1', fontWeight: 900 }}>→</div>

          {/* Parent notification mock */}
          <div style={{
            background: 'white', borderRadius: 24, padding: '20px 24px',
            boxShadow: '0 12px 48px rgba(30,58,95,0.10)', border: '1.5px solid #E2EFF9',
            minWidth: 220,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Parent's Phone</div>
            <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '12px 14px', border: '1.5px solid #86efac', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📬 New Message</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', fontFamily: "'Nunito', sans-serif" }}>
                ✅ {CHARACTERS[tick].name} has arrived safely!
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{CHARACTERS[tick].time} · EduTrack School</div>
            </div>
            <div style={{ background: '#E1F5FE', borderRadius: 14, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: '#0288D1', fontWeight: 700 }}>🏠 Departure alert enabled</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 40px)', color: '#1E3A5F', marginBottom: 12 }}>
              Everything just works
            </h2>
            <p style={{ color: '#64748B', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>Simple for teachers. Clear for parents. Fast for everyone.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: f.bg, borderRadius: 20, padding: '28px 24px',
                border: `1.5px solid ${f.color}40`, textAlign: 'center',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 42, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#1E3A5F', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(160deg, #E8F6FE 0%, #F0FDF4 100%)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 40px)', color: '#1E3A5F', marginBottom: 12 }}>Made for your whole school</h2>
          <p style={{ color: '#64748B', fontSize: 15, marginBottom: 48 }}>Three simple roles. Everyone knows exactly what to do.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { emoji: '🏫', role: 'Principal',     color: '#4FC3F7', bg: 'white', perks: ['See live attendance', 'Spot struggling students', 'Monthly reports'] },
              { emoji: '👩‍💼', role: 'Administrator', color: '#CE93D8', bg: 'white', perks: ['Add & manage students', 'Set school holidays', 'Control all settings'] },
              { emoji: '📱', role: 'Gate Operator',  color: '#A8EDCB', bg: 'white', perks: ['Scan QR codes fast', 'Works on any phone', 'No training needed'] },
            ].map((r, i) => (
              <div key={i} style={{
                background: r.bg, borderRadius: 20, padding: '28px 22px',
                boxShadow: '0 4px 20px rgba(30,58,95,0.07)',
                border: `2px solid ${r.color}50`,
              }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{r.emoji}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, color: '#1E3A5F', marginBottom: 14 }}>{r.role}</h3>
                {r.perks.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, textAlign: 'left' }}>
                    <span style={{ color: r.color, fontSize: 16, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{p}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(24px, 4vw, 38px)', color: 'white', marginBottom: 14 }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
            Sign in and see your school's attendance come alive.
          </p>
          <button onClick={onEnterApp} style={{
            padding: '16px 44px', borderRadius: 18,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            color: '#1E3A5F', border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 18, fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 8px 32px rgba(79,195,247,0.3)',
          }}>Sign In Now →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A1628', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#4FC3F7,#A8EDCB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏫</div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: 'white', fontSize: 16 }}>EduTrack</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© 2026 EduTrack · Smart School Attendance</p>
      </footer>

      <style>{`
        @keyframes floatEmoji {
          from { transform: translateY(0px) rotate(-4deg); }
          to   { transform: translateY(-18px) rotate(4deg); }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          nav { padding: 0 16px !important; }
          section { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
