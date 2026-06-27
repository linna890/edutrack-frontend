import React, { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '📱', title: 'Scan & Go',        desc: 'Students scan their QR card at the gate. Done in 2 seconds.', color: '#4FC3F7', bg: '#E1F5FE' },
  { icon: '📊', title: 'Live Dashboard',   desc: "See who's in school right now. Updated instantly.",           color: '#A8EDCB', bg: '#E8F5E9' },
  { icon: '📬', title: 'Parent Alerts',    desc: 'Parents get an email the moment their child arrives.',         color: '#CE93D8', bg: '#F3E5F5' },
  { icon: '🏆', title: 'Track Progress',   desc: "Know which students need support before it's too late.",      color: '#FFD54F', bg: '#FFFDE7' },
];

const STATS = [
  { value: '99%', label: 'Attendance accuracy' },
  { value: '2s',  label: 'Scan speed' },
  { value: '500+', label: 'Schools trust us' },
];

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [scrollY, setScrollY] = useState(0);

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
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 10 ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrollY > 10 ? 'blur(12px)' : 'none',
        boxShadow: scrollY > 10 ? '0 2px 16px rgba(79,195,247,0.1)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🏫</div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, color: '#1E3A5F' }}>EduTrack</span>
        </div>
        <button onClick={onEnterApp} style={{
          padding: '10px 28px', borderRadius: 14,
          background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: 15, fontFamily: "'Nunito', sans-serif",
          boxShadow: '0 4px 14px rgba(79,195,247,0.4)',
        }}>Sign In →</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '80px 60px 60px',
        background: 'linear-gradient(135deg, #E8F6FE 0%, #F0FDF4 50%, #EEF2FF 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg blobs */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.12) 0%, transparent 70%)', top: -200, left: -200, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,237,203,0.15) 0%, transparent 70%)', bottom: -150, right: 200, pointerEvents: 'none' }} />

        {/* Two-column layout */}
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>

          {/* LEFT: text */}
          <div style={{ flex: '1 1 420px', position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(79,195,247,0.12)', border: '1px solid rgba(79,195,247,0.3)',
              borderRadius: 99, padding: '6px 16px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0288D1', fontFamily: "'Nunito', sans-serif" }}>Smart School Attendance</span>
            </div>

            <h1 style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.1,
              color: '#1E3A5F', margin: '0 0 20px',
            }}>
              Every student<br />
              <span style={{ background: 'linear-gradient(135deg, #4FC3F7, #0288D1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                accounted for.
              </span>
            </h1>

            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.75, margin: '0 0 36px', maxWidth: 440 }}>
              EduTrack makes attendance effortless — QR scan at the gate, instant parent alerts, live dashboard for staff. Happy schools run on EduTrack.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <button onClick={onEnterApp} style={{
                padding: '16px 36px', borderRadius: 16,
                background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontWeight: 900, fontSize: 17, fontFamily: "'Nunito', sans-serif",
                boxShadow: '0 8px 28px rgba(79,195,247,0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >🚀 Go to Dashboard</button>
              <button style={{
                padding: '16px 28px', borderRadius: 16,
                background: 'white', border: '1.5px solid #CBD5E1',
                color: '#1E3A5F', cursor: 'pointer',
                fontWeight: 800, fontSize: 15, fontFamily: "'Nunito', sans-serif",
              }}>Learn more ↓</button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 28, color: '#0288D1' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: image */}
          <div style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Decorative ring behind image */}
            <div style={{
              position: 'absolute', width: 420, height: 420, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(168,237,203,0.2))',
              border: '2px dashed rgba(79,195,247,0.25)',
            }} />
            <img
              src="/students.png"
              alt="Happy students at EduTrack school"
              style={{
                width: '100%', maxWidth: 460,
                objectFit: 'contain',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 20px 40px rgba(30,58,95,0.12))',
                animation: 'floatImg 4s ease-in-out infinite alternate',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '96px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 40px)', color: '#1E3A5F', marginBottom: 12 }}>
              Everything just works
            </h2>
            <p style={{ color: '#64748B', fontSize: 16, maxWidth: 460, margin: '0 auto' }}>Simple for teachers. Clear for parents. Fast for everyone.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: f.bg, borderRadius: 24, padding: '32px 28px',
                border: `1.5px solid ${f.color}50`, textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 12px rgba(30,58,95,0.04)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(30,58,95,0.10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(30,58,95,0.04)'; }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18, color: '#1E3A5F', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section style={{ padding: '96px 40px', background: 'linear-gradient(160deg, #E8F6FE 0%, #F0FDF4 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 40px)', color: '#1E3A5F', marginBottom: 12 }}>Made for your whole school</h2>
          <p style={{ color: '#64748B', fontSize: 16, marginBottom: 52 }}>Three simple roles. Everyone knows exactly what to do.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { emoji: '🏫', role: 'Principal',     color: '#4FC3F7', perks: ['See live attendance', 'Spot struggling students', 'Monthly reports'] },
              { emoji: '👩‍💼', role: 'Administrator', color: '#CE93D8', perks: ['Add & manage students', 'Set school holidays', 'Control all settings'] },
              { emoji: '📱', role: 'Gate Operator',  color: '#A8EDCB', perks: ['Scan QR codes fast', 'Works on any phone', 'No training needed'] },
            ].map((r, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 24, padding: '32px 24px',
                boxShadow: '0 4px 24px rgba(30,58,95,0.07)',
                border: `2px solid ${r.color}60`,
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 56, marginBottom: 14 }}>{r.emoji}</div>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, color: '#1E3A5F', marginBottom: 16 }}>{r.role}</h3>
                {r.perks.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, textAlign: 'left' }}>
                    <span style={{ color: r.color, fontSize: 18, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: '#475569' }}>{p}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '96px 40px', textAlign: 'center',
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0F2240 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,237,203,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 540, margin: '0 auto' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 42px)', color: 'white', marginBottom: 16 }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 36 }}>
            Sign in and see your school's attendance come alive.
          </p>
          <button onClick={onEnterApp} style={{
            padding: '18px 52px', borderRadius: 18,
            background: 'linear-gradient(135deg, #4FC3F7, #A8EDCB)',
            color: '#1E3A5F', border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 18, fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 8px 32px rgba(79,195,247,0.3)',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >Sign In Now →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A1628', padding: '28px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#4FC3F7,#A8EDCB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🏫</div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: 'white', fontSize: 17 }}>EduTrack</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>© 2026 EduTrack · Smart School Attendance</p>
      </footer>

      <style>{`
        @keyframes floatImg {
          from { transform: translateY(0px); }
          to   { transform: translateY(-16px); }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          nav { padding: 0 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  );
}
