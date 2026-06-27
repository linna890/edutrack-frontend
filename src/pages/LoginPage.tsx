import React, { useState } from 'react';
import { apiLogin, setToken } from '../api';

type Role = 'admin' | 'principal' | 'scanner';

const ROLES: { key: Role; label: string; emoji: string; desc: string; color: string; bg: string; email: string }[] = [
  { key: 'principal', label: 'Principal',    emoji: '🏫', desc: 'Analytics & insights', color: '#0288D1', bg: '#E1F5FE', email: 'principal@school.edu' },
  { key: 'admin',     label: 'Admin',        emoji: '👩‍💼', desc: 'Manage the system',   color: '#7B1FA2', bg: '#F3E5F5', email: 'admin@school.edu'     },
  { key: 'scanner',   label: 'Gate Operator',emoji: '📱', desc: 'Scan QR codes',        color: '#2E7D32', bg: '#E8F5E9', email: 'scanner@school.edu'   },
];

export default function LoginPage({ onLogin, onBack }: {
  onLogin: (role: Role, fullName: string) => void;
  onBack: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>('principal');
  const [email, setEmail]       = useState('principal@school.edu');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const selected = ROLES.find(r => r.key === selectedRole)!;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin(email, password);
      setToken(data.token);
      const roleMap: Record<string, Role> = { ADMIN: 'admin', PRINCIPAL: 'principal', SCANNER: 'scanner' };
      onLogin(roleMap[data.role] ?? 'admin', data.fullName);
    } catch (err: any) {
      setError(err.message || 'Wrong email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #E8F6FE 0%, #F0FDF4 60%, #F5F3FF 100%)',
      padding: '20px', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,247,0.18) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(206,147,216,0.15) 0%, transparent 70%)', bottom: -100, right: -100, pointerEvents: 'none' }} />

      {/* Floating decorations */}
      {['📚','✏️','⭐','🎒','🖍️','📐'].map((e, i) => (
        <div key={i} style={{
          position: 'fixed', fontSize: 34, opacity: 0.09, userSelect: 'none', pointerEvents: 'none',
          top: `${8 + i * 14}%`, left: `${3 + i * 16}%`,
          animation: `floatL ${5 + i}s ease-in-out ${i * 0.8}s infinite alternate`,
        }}>{e}</div>
      ))}

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'fixed', top: 16, left: 16,
        background: 'white', border: '1.5px solid #E2EFF9', borderRadius: 12,
        padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
        color: '#475569', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', zIndex: 10,
      }}>← Back</button>

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: 28, padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(30,58,95,0.13), 0 4px 16px rgba(79,195,247,0.08)',
        width: '100%', maxWidth: 420, position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🏫</div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 26, color: '#1E3A5F', margin: 0 }}>Welcome back!</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>Sign in to EduTrack</p>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Who are you?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => { setSelectedRole(r.key); setEmail(r.email); setError(''); }}
                style={{
                  padding: '12px 8px', borderRadius: 14, border: '2px solid',
                  borderColor: selectedRole === r.key ? r.color : '#E2EFF9',
                  background: selectedRole === r.key ? r.bg : 'white',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4, transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 26 }}>{r.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "'Nunito', sans-serif", color: selectedRole === r.key ? r.color : '#475569', lineHeight: 1.2 }}>{r.label}</span>
                <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@school.edu"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14,
                border: '1.5px solid #E2EFF9', outline: 'none', fontFamily: 'inherit',
                background: '#F8FBFF', color: '#1E293B', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = selected.color)}
              onBlur={e => (e.target.style.borderColor = '#E2EFF9')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, fontSize: 14,
                  border: '1.5px solid #E2EFF9', outline: 'none', fontFamily: 'inherit',
                  background: '#F8FBFF', color: '#1E293B', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = selected.color)}
                onBlur={e => (e.target.style.borderColor = '#E2EFF9')}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFF1F2', border: '1.5px solid #FDA4AF', borderRadius: 12,
              padding: '10px 14px', fontSize: 13, color: '#BE123C', fontWeight: 600,
              marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: loading ? '#CBD5E1' : `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)`,
            color: 'white', fontWeight: 900, fontSize: 16, fontFamily: "'Nunito', sans-serif",
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 6px 24px ${selected.color}55`,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Signing in…</>
            ) : (
              <>{selected.emoji} Sign in as {selected.label}</>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes floatL {
          from { transform: translateY(0) rotate(-3deg); }
          to   { transform: translateY(-16px) rotate(3deg); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 480px) {
          div[style*="maxWidth: 420"] { padding: 24px 18px !important; }
        }
      `}</style>
    </div>
  );
}
