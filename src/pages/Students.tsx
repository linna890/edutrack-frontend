import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiCreateStudent, apiDeleteStudent, apiRegenerateQr, StudentRecord } from '../api';

const COLORS = ['sky', 'mint', 'yellow', 'coral', 'purple'];

// ─── Cloudinary config ────────────────────────────────────────────────────────
// Set these two values to match your Cloudinary account.
// CLOUD_NAME  → Dashboard → Cloud Name (e.g. "dxyz123abc")
// UPLOAD_PRESET → Settings → Upload → Unsigned upload preset name (e.g. "edutrack_students")
const CLOUDINARY_CLOUD_NAME  = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME  || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Add REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET to your Vercel env vars.');
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('folder', 'edutrack/students');
  // Resize & crop to 300×300 on Cloudinary side — keeps file small
  fd.append('transformation', 'c_fill,w_300,h_300,q_auto,f_auto');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }
  const data = await res.json();
  // Return the secure_url — this is what gets stored in the DB
  return data.secure_url as string;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

function studentPhoto(s: StudentRecord) {
  // Prefer Cloudinary URL; fall back to legacy base64 for old students
  if (s.photoUrl) return s.photoUrl;
  if (s.photoBase64) return `data:image/jpeg;base64,${s.photoBase64}`;
  return null;
}

export default function Students() {
  const [students, setStudents]   = useState<StudentRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [showAdd, setShowAdd]     = useState(false);
  const [qrModal, setQrModal]     = useState<StudentRecord | null>(null);
  const [error, setError]         = useState('');

  // New student form
  const [form, setForm] = useState({
    studentId: '', fullName: '', grade: '',
    parentEmail: '', parentPhone: '', registrationNumber: ''
  });
  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);

  const loadStudents = () => {
    setLoading(true);
    apiGetStudents()
      .then(setStudents)
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    // Show preview immediately from local file
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let photoUrl: string | undefined;

      // Upload photo to Cloudinary first (if one was selected)
      if (photoFile) {
        setUploading(true);
        try {
          photoUrl = await uploadToCloudinary(photoFile);
        } catch (uploadErr: any) {
          // Non-fatal — student is registered without a photo
          setError(`Photo upload failed: ${uploadErr.message}. Student will be saved without a photo.`);
        } finally {
          setUploading(false);
        }
      }

      // Register student — send photoUrl (CDN URL), NOT base64
      await apiCreateStudent({
        ...form,
        photoUrl,
        // Do not send photoBase64 — Cloudinary URL is the new standard
      });

      setForm({ studentId: '', fullName: '', grade: '', parentEmail: '', parentPhone: '', registrationNumber: '' });
      setPhotoFile(null);
      setPhotoPreview('');
      setShowAdd(false);
      loadStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate ${name}? Their QR code will stop working.`)) return;
    try {
      await apiDeleteStudent(id);
      loadStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate student');
    }
  };

  const handleRegenerateQr = async (id: number) => {
    try {
      await apiRegenerateQr(id);
      loadStudents();
      setQrModal(null);
      alert('QR code regenerated! Print the new one — old cards will no longer work.');
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate QR');
    }
  };

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const isCloudinaryConfigured = !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_UPLOAD_PRESET;

  return (
    <div className="page-inner">
      {error && (
        <div style={{ background: '#FFEBEE', border: '1.5px solid #FF8A80', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#C62828', fontWeight: 600, fontFamily: 'Nunito', marginBottom: 20 }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#C62828', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="🔍 Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {['All', 'Good Standing', 'At Risk'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
            fontFamily: 'Nunito', fontSize: 12, border: '2px solid',
            background: filter === f ? 'linear-gradient(135deg, #4FC3F7, #0288D1)' : 'white',
            color: filter === f ? 'white' : 'var(--text-muted)',
            borderColor: filter === f ? '#4FC3F7' : 'var(--border)',
          }}>
            {f === 'At Risk' ? '⚠️ ' : ''}{f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
          {filtered.length} students
        </span>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #4FC3F7, #0288D1)', color: 'white', fontWeight: 700, fontFamily: 'Nunito', fontSize: 13, boxShadow: '0 4px 16px rgba(79,195,247,0.35)' }}
        >
          + Add Student
        </button>
      </div>

      {/* Student Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito' }}>Loading students…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎒</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Nunito', fontSize: 15 }}>
            {search ? 'No students match your search.' : 'No students yet. Add one to get started.'}
          </p>
        </div>
      ) : (
        <div className="students-grid">
          {filtered.map((s, i) => {
            const photo = studentPhoto(s);
            return (
              <div key={s.id} className="student-card">
                <div className={`student-card-avatar ${COLORS[i % COLORS.length]}`} style={{ overflow: 'hidden' }}>
                  {photo ? (
                    <img src={photo} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : initials(s.fullName)}
                </div>
                <h3>{s.fullName}</h3>
                {s.registrationNumber && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'Nunito' }}>Reg: {s.registrationNumber}</p>
                )}
                <p className="student-class">Class {s.grade} · {s.studentId}</p>
                <div style={{ margin: '12px 0', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setQrModal(s)} style={{ padding: '6px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer' }}>
                    🔲 View QR
                  </button>
                  <button onClick={() => handleDelete(s.id, s.fullName)} style={{ padding: '6px 14px', borderRadius: 10, border: '1.5px solid #FF8A80', background: '#FFEBEE', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito', cursor: 'pointer', color: '#C62828' }}>
                    🗑 Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Student Modal ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 4 }}>Add New Student</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>A unique QR code will be generated automatically.</p>

            <form onSubmit={handleCreate}>
              {/* Photo upload */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontFamily: 'Nunito', fontSize: 13 }}>
                  Student Photo
                  {isCloudinaryConfigured ? (
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#15803D', fontWeight: 600, background: '#DCFCE7', padding: '2px 8px', borderRadius: 20 }}>☁️ Cloudinary CDN</span>
                  ) : (
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#C62828', fontWeight: 600, background: '#FFEBEE', padding: '2px 8px', borderRadius: 20 }}>⚠️ CDN not configured</span>
                  )}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2.5px dashed var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 28 }}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" id="photo-upload" style={{ display: 'none' }} onChange={handlePhotoChange} />
                    <label htmlFor="photo-upload" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito', fontSize: 12 }}>
                      {photoPreview ? '🔄 Change Photo' : '📂 Upload Photo'}
                    </label>
                    {photoPreview && (
                      <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null); }} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C62828', fontWeight: 700 }}>
                        ✕ Remove
                      </button>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {isCloudinaryConfigured
                        ? 'Photo will be uploaded to Cloudinary CDN · JPG, PNG or WEBP'
                        : 'Add REACT_APP_CLOUDINARY_CLOUD_NAME & REACT_APP_CLOUDINARY_UPLOAD_PRESET to Vercel env'}
                    </p>
                  </div>
                </div>
              </div>

              {[
                { field: 'studentId',          label: 'Student ID',             placeholder: 'MC2024-0001',      required: true  },
                { field: 'registrationNumber', label: 'Registration Number',    placeholder: 'REG-2024-001',     required: false },
                { field: 'fullName',           label: 'Full Name',              placeholder: 'Amara Perera',     required: true  },
                { field: 'grade',              label: 'Grade / Class',          placeholder: '10A',              required: true  },
                { field: 'parentEmail',        label: 'Parent Email',           placeholder: 'parent@email.com', required: true  },
                { field: 'parentPhone',        label: 'Parent Phone (optional)', placeholder: '+94 77 123 4567', required: false },
              ].map(({ field, label, placeholder, required }) => (
                <div className="form-group" key={field}>
                  <label>{label}</label>
                  <input
                    className="form-input"
                    placeholder={placeholder}
                    value={(form as any)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    required={required}
                  />
                </div>
              ))}

              {uploading && (
                <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1D4ED8', fontWeight: 600, marginBottom: 12 }}>
                  ☁️ Uploading photo to Cloudinary…
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => { setShowAdd(false); setPhotoPreview(''); setPhotoFile(null); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: '2px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="btn-primary" style={{ flex: 1 }}>
                  {uploading ? '☁️ Uploading photo…' : saving ? '⏳ Saving…' : '✅ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QR Code Modal ──────────────────────────────────────────────────────── */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <h2 style={{ marginBottom: 4 }}>{qrModal.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Class {qrModal.grade} · {qrModal.studentId}</p>
            {qrModal.qrImageBase64 ? (
              <img src={`data:image/png;base64,${qrModal.qrImageBase64}`} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 16, border: '2px solid var(--border)' }} />
            ) : (
              <div style={{ width: 220, height: 220, background: 'var(--bg)', borderRadius: 16, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 13, color: 'var(--text-muted)' }}>
                No QR image
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 24, fontFamily: 'monospace', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8 }}>
              Token: {qrModal.qrCode}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setQrModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito', fontSize: 13 }}>
                Close
              </button>
              <button onClick={() => handleRegenerateQr(qrModal.id)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #FFD54F', background: '#FFFDE7', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito', fontSize: 13, color: '#F57F17' }}>
                🔄 Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
