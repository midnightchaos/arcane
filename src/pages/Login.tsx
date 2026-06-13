import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

function LoginCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    // Hexagonal grid nodes
    const nodes: { x: number; y: number; r: number; phase: number }[] = [];
    const cols = 18; const rows = 12;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const offset = j % 2 === 0 ? 0 : (w / cols) * 0.5;
        nodes.push({ x: offset + i * (w / cols), y: j * (h / rows), r: 1.5, phase: Math.random() * Math.PI * 2 });
      }
    }

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.012;

      // Draw connections
      nodes.forEach((n, a) => {
        nodes.forEach((m, b) => {
          if (b <= a) return;
          const d = Math.hypot(m.x - n.x, m.y - n.y);
          if (d > w / cols * 1.6) return;
          const wave = (Math.sin(t + n.phase) + 1) / 2;
          ctx.strokeStyle = `rgba(255,255,255,${0.05 * wave})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        });

        // Draw node
        const glow = (Math.sin(t + n.phase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (0.8 + glow * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + glow * 0.4})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4 }} />;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    // Force monochrome theme on body for this page
    document.body.setAttribute('data-theme', 'monochrome');
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Access Denied. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', position: 'relative', overflow: 'hidden' }}>
      {/* Backgrounds */}
      <div className="corner-orb corner-orb-tl" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <div className="corner-orb corner-orb-br" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <LoginCanvas />
      <div className="neural-grid" style={{ opacity: 0.03 }} />
      <div className="scan-beam" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.05), transparent)', height: '1px' }} />

      {/* Login card */}
      <div
        style={{
          width: 420,
          maxWidth: '90vw',
          position: 'relative',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          background: 'rgba(5, 5, 5, 0.8)',
          backdropFilter: 'blur(60px)',
          borderRadius: 32,
          padding: '64px 48px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 50px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle top light */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 24,
              background: 'white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 0 40px rgba(255,255,255,0.1)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', inset: -8, borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <Zap size={32} style={{ color: 'black' }} fill="black" />
            </div>
            <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '0.4em', color: 'white', margin: 0, textIndent: '0.4em' }}>
              ARCANE
            </h1>
            <div style={{ height: 1, width: 40, background: 'rgba(255,255,255,0.2)', margin: '16px auto' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.5em', fontWeight: 600, textTransform: 'uppercase' }}>
              Terminal Access
            </p>
          </div>

            {/* Messages */}
            {error && (
              <div style={{
                marginBottom: 24, padding: '14px 18px',
                background: 'rgba(255,0,0,0.05)',
                border: '1px solid rgba(255,0,0,0.2)',
                borderRadius: 12,
                color: '#ff6b6b',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono',
                animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
              }}>
                <span style={{ marginRight: 8 }}>ERR_</span> {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                marginBottom: 24, padding: '14px 18px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono',
              }}>
                <span style={{ marginRight: 8 }}>OK_</span> {successMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Email */}
              <div className="space-y-2">
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', paddingLeft: 4 }}>
                  Identifier
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="operator@arcane.ai"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: '16px 24px',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', paddingLeft: 4 }}>
                  Security Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      padding: '16px 24px',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      paddingRight: 56,
                      boxSizing: 'border-box',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 12,
                  padding: '18px',
                  background: loading ? 'rgba(255,255,255,0.05)' : 'white',
                  border: 'none',
                  borderRadius: 16,
                  color: 'black',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  letterSpacing: '0.3em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  textIndent: '0.3em'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 25px 50px rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {loading ? 'AUTHENTICATING...' : 'INITIALIZE ACCESS'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>

            {/* Footer link */}
            <p style={{ marginTop: 48, textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
              No access credentials?{' '}
              <Link to="/register" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 2, marginLeft: 4 }}>
                Request Access
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
