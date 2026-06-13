import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Zap, Eye, EyeOff, ArrowRight, Shield, User, Mail, Lock } from 'lucide-react';

const fields = [
  { id: 'username', label: 'CALLSIGN', type: 'text', icon: User, placeholder: 'choose a username' },
  { id: 'email', label: 'COMM CHANNEL', type: 'email', icon: Mail, placeholder: 'operator@arcane.ai' },
  { id: 'password', label: 'ACCESS CODE', type: 'password', icon: Lock, placeholder: '••••••••••' },
  { id: 'confirmPassword', label: 'CONFIRM CODE', type: 'password', icon: Shield, placeholder: '••••••••••' },
] as const;

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  useEffect(() => { 
    setMounted(true); 
    document.body.setAttribute('data-theme', 'dark');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Access codes do not match'); return; }
    if (form.password.length < 6) { setError('Access code must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.username);
      navigate('/login', { state: { message: 'Account created successfully. Please log in using your new credentials.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a14', position: 'relative', overflow: 'hidden' }}>
      {/* BG */}
      <div className="corner-orb corner-orb-tl" style={{ background: 'rgba(255,255,255,0.02)' }} />
      <div className="corner-orb corner-orb-br" style={{ background: 'rgba(255,255,255,0.02)' }} />
      <div className="scan-beam" style={{ opacity: 0.1 }} />
      <div className="neural-grid" style={{ opacity: 0.05 }} />

      {/* Aurora ribbons - monochrome */}
      {['18%', '42%', '70%', '88%'].map((top, i) => (
        <div key={i} className="aurora-ribbon" style={{
          top,
          height: '1px',
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.05 + i * 0.02}), transparent)`,
          animationDuration: `${12 + i * 4}s`,
          animationDelay: `${i * 2}s`,
        }} />
      ))}

      <div style={{
        width: 440, maxWidth: '92vw', position: 'relative', zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          background: 'rgba(13, 17, 23, 0.8)',
          backdropFilter: 'blur(40px)',
          borderRadius: 24,
          padding: '44px 40px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 0 30px rgba(255,255,255,0.15)',
            }}>
              <Zap size={26} style={{ color: 'black' }} />
            </div>
            <h1 className="font-display" style={{
              fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.25em', margin: 0,
              color: 'white'
            }}>
              CREATE PROFILE
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', letterSpacing: '0.4em', marginTop: 8, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
              JOIN THE ARCANE NETWORK
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 12, color: '#ff8080', fontSize: '0.8rem', animation: 'fade-up 0.3s ease-out' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.map(({ id, label, type, icon: Icon, placeholder }) => {
              const isPass = type === 'password';
              const showing = showPass[id];
              return (
                <div key={id}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                    <input
                      type={isPass && showing ? 'text' : type}
                      value={form[id as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                      required
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '12px 16px 12px 40px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: 'white',
                        fontFamily: 'inherit', fontSize: '0.85rem',
                        outline: 'none', paddingRight: isPass ? 44 : 16,
                        transition: 'all 0.3s ease', boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                    />
                    {isPass && (
                      <button type="button" onClick={() => setShowPass(p => ({ ...p, [id]: !p[id] }))} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                        {showing ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button type="submit" disabled={loading} style={{
              marginTop: 12, padding: '16px',
              background: loading ? 'rgba(255,255,255,0.05)' : 'white',
              border: 'none',
              borderRadius: 12, color: 'black',
              fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.2em',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 40px rgba(255,255,255,0.15)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              {loading ? 'CREATING PROFILE…' : <>INITIALIZE PROFILE <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            Already cleared?{' '}
            <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
