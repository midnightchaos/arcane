import { useAuthStore } from '@/store/authStore';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemService } from '@/services/systemService';
import { useThemeStore, Theme } from '@/store/themeStore';
import { Bell, Settings, Cpu, Wifi, WifiOff, Palette, Check } from 'lucide-react';

export default function Topbar() {
  const user = useAuthStore((state) => state.user);
  const [online, setOnline] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);

  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkConn = async () => {
      try {
        const s = await systemService.getStatus();
        setOnline(s?.ollamaConnected ?? false);
      } catch { setOnline(false); }
    };
    checkConn();
    const iv = setInterval(checkConn, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--arc-surface)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(var(--arc-cyan-rgb), 0.1)',
      position: 'relative',
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Bottom edge glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(var(--arc-cyan-rgb), 0.3) 30%, rgba(var(--arc-violet-rgb), 0.4) 60%, transparent 100%)',
      }} />

      {/* Left: welcome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div 
          onClick={() => navigate('/settings')}
          style={{ 
            width: 38, 
            height: 38, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, var(--arc-cyan), var(--arc-violet))',
            padding: 1.5,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 0 15px rgba(var(--arc-cyan-rgb), 0.2)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(var(--arc-cyan-rgb), 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(var(--arc-cyan-rgb), 0.2)';
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: 10,
            background: 'var(--arc-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontSize: '0.9rem',
            fontWeight: 800,
            color: 'white'
          }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user?.username || 'U').charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(var(--arc-cyan-rgb),0.5)', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono' }}>
            OPERATOR
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--arc-text)', lineHeight: 1.2 }}>
            {user?.username || 'GUEST'}
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'rgba(var(--arc-cyan-rgb),0.15)' }} />

        {/* Ollama status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {online ? (
            <Wifi size={13} style={{ color: 'var(--arc-green)' }} />
          ) : (
            <WifiOff size={13} style={{ color: 'var(--arc-danger)' }} />
          )}
          <span style={{
            fontSize: '0.7rem',
            color: online ? 'var(--arc-green)' : 'var(--arc-danger)',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.05em',
          }}>
            {online ? 'OLLAMA CONNECTED' : 'OLLAMA OFFLINE'}
          </span>
          <div className={`status-dot ${online ? 'status-online' : 'status-error'}`} />
        </div>
      </div>

      {/* Center: live clock */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="font-display neon-cyan" style={{ fontSize: '1.1rem', letterSpacing: '0.15em', lineHeight: 1, color: 'var(--arc-text)' }}>
          {fmtTime(time)}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--arc-text-dim)', letterSpacing: '0.2em', marginTop: 2, fontFamily: 'JetBrains Mono' }}>
          {fmtDate(time)}
        </div>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* CPU decoration */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px',
          border: '1px solid rgba(var(--arc-violet-rgb),0.2)',
          borderRadius: 6,
          background: 'rgba(var(--arc-violet-rgb),0.06)',
        }}>
          <Cpu size={12} style={{ color: 'var(--arc-violet)' }} />
          <span style={{ fontSize: '0.68rem', color: 'var(--arc-violet)', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>SYS</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(var(--arc-cyan-rgb),0.1)', margin: '0 4px' }} />

        {[
          { Icon: Bell, tip: 'Notifications', color: 'var(--arc-cyan-rgb)', key: 'bell' },
          { Icon: Settings, tip: 'Settings', color: 'var(--arc-violet-rgb)', key: 'settings' },
        ].map(({ Icon, tip, color, key }) => (
          <div key={key} style={{ position: 'relative' }} ref={key === 'settings' ? settingsRef : null}>
            <button
              onMouseDown={(e) => {
                if (key === 'settings') {
                  e.preventDefault();
                  navigate('/settings');
                }
              }}
              title={tip}
              style={{
                width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                border: `1px solid rgba(${color},0.15)`,
                background: `rgba(${color},0.05)`,
                color: `rgba(${color},0.7)`,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                outline: 'none',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = `rgba(${color},0.5)`;
                el.style.background = `rgba(${color},0.12)`;
                el.style.color = `rgba(${color},1)`;
                el.style.transform = 'scale(1.12)';
                el.style.boxShadow = `0 0 14px rgba(${color},0.35)`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                if (!(key === 'settings' && showSettings)) {
                  el.style.borderColor = `rgba(${color},0.15)`;
                  el.style.background = `rgba(${color},0.05)`;
                  el.style.color = `rgba(${color},0.7)`;
                  el.style.transform = 'scale(1)';
                  el.style.boxShadow = 'none';
                }
              }}
            >
              <Icon size={15} />
            </button>

            {key === 'settings' && showSettings && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: 200,
                background: 'var(--arc-surface)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--arc-border)',
                borderRadius: 12,
                padding: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                animation: 'fade-up 0.2s ease-out',
                zIndex: 1000,
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--arc-text-dim)',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                  fontFamily: 'JetBrains Mono',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Palette size={10} /> THEME SELECTOR
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { id: 'default', name: 'Deep Space', colors: ['#00d4ff', '#8b5cf6'] },
                    { id: 'pinkish', name: 'Grey & Pink', colors: ['#ff2d7d', '#94a3b8'] },
                    { id: 'light', name: 'Clean Light', colors: ['#2563eb', '#f8fafc'] },
                    { id: 'minimal', name: 'Black Minimal', colors: ['#ffffff', '#000000'] }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setTheme(t.id as Theme);
                        setShowSettings(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: currentTheme === t.id ? 'rgba(var(--arc-violet-rgb), 0.15)' : 'transparent',
                        border: '1px solid',
                        borderColor: currentTheme === t.id ? 'rgba(var(--arc-violet-rgb), 0.3)' : 'transparent',
                        color: currentTheme === t.id ? 'var(--arc-text)' : 'var(--arc-text-dim)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        fontSize: '0.85rem'
                      }}
                      onMouseEnter={e => {
                        if (currentTheme !== t.id) {
                          e.currentTarget.style.background = 'rgba(var(--arc-text-rgb), 0.05)';
                          e.currentTarget.style.color = 'var(--arc-text)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (currentTheme !== t.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--arc-text-dim)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          display: 'flex',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '1px solid var(--arc-border)'
                        }}>
                          <div style={{ flex: 1, background: t.colors[0] }} />
                          <div style={{ flex: 1, background: t.colors[1] }} />
                        </div>
                        {t.name}
                      </div>
                      {currentTheme === t.id && <Check size={14} style={{ color: 'var(--arc-violet)' }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
