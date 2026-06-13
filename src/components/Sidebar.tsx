import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Split,
  Code2,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Puzzle,
  CalendarClock,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'var(--arc-cyan)', glow: 'var(--arc-cyan)' },
    { to: '/chat', icon: MessageSquare, label: 'Chat', color: 'var(--arc-violet)', glow: 'var(--arc-violet)' },
    { to: '/agents', icon: Bot, label: 'Agents', color: 'var(--arc-green)', glow: 'var(--arc-green)' },
    { to: '/workflows', icon: Split, label: 'Workflows', color: 'var(--arc-gold)', glow: 'var(--arc-gold)' },
    { to: '/studio', icon: Puzzle, label: 'Studio', color: 'var(--arc-magenta)', glow: 'var(--arc-magenta)' },
    { to: '/scheduled', icon: CalendarClock, label: 'Scheduled', color: '#10b981', glow: 'rgba(16,185,129,0.6)' },
    { to: '/coding', icon: Code2, label: 'Coding', color: 'var(--arc-blue)', glow: 'var(--arc-blue)' },
  ];

  return (
    <div
      style={{
        width: isCollapsed ? 72 : 240,
        transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        background: 'var(--arc-surface)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--arc-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Top edge glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--arc-cyan), var(--arc-violet), transparent)',
        opacity: 0.5,
      }} />

      {/* Animated inner border glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '1px', height: '100%',
        background: 'linear-gradient(180deg, transparent 0%, var(--arc-cyan) 30%, var(--arc-violet) 60%, transparent 100%)',
        opacity: 0.3,
        animation: 'border-trace 4s linear infinite',
      }} />

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute', right: -14, top: 40,
          zIndex: 30, width: 28, height: 28,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))',
          border: '1px solid rgba(0,212,255,0.4)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--arc-cyan)',
          boxShadow: '0 0 12px var(--arc-cyan)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.7)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.4)')}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div style={{
        padding: isCollapsed ? '24px 16px' : '24px',
        borderBottom: '1px solid var(--arc-border)',
        flexShrink: 0,
        transition: 'padding 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          {/* Animated icon */}
          <div className="hex-ring" style={{ flexShrink: 0 }}>
            <Zap
              size={isCollapsed ? 22 : 20}
              style={{
                color: 'var(--arc-cyan)',
                filter: 'drop-shadow(0 0 8px var(--arc-cyan))',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden', animation: 'fade-in 0.3s ease' }}>
              <div
                className="font-display grad-text-anim"
                style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1 }}
              >
                ARCANE
              </div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(0,212,255,0.45)', letterSpacing: '0.2em', marginTop: 3, fontFamily: 'JetBrains Mono' }}>
                AGENT RUNTIME
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: isCollapsed ? '16px 8px' : '16px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="stagger">
          {navItems.map((item, idx) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: isCollapsed ? '12px' : '11px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                overflow: 'hidden',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: isActive
                  ? `linear-gradient(135deg, ${item.color}, transparent)`
                  : 'transparent',
                border: isActive ? `1px solid ${item.color}` : '1px solid transparent',
                boxShadow: isActive ? `0 0 20px ${item.glow}` : 'none',
                animationDelay: `${idx * 0.05}s`,
                backgroundSize: '200% 100%',
                opacity: isActive ? 1 : 0.7,
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    style={{
                      color: isActive ? item.color : 'rgba(180,200,220,0.6)',
                      filter: isActive ? `drop-shadow(0 0 6px ${item.glow})` : 'none',
                      transition: 'all 0.25s ease',
                      flexShrink: 0,
                    }}
                  />
                  {!isCollapsed && (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'var(--arc-text-dim)',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.25s ease',
                    }}>
                      {item.label}
                    </span>
                  )}

                  {/* Collapsed tooltip */}
                  {isCollapsed && (
                    <div style={{
                      position: 'absolute',
                      left: '100%', top: '50%', transform: 'translateY(-50%)',
                      marginLeft: 12,
                      background: 'rgba(7,12,22,0.95)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: item.color,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      boxShadow: `0 0 12px ${item.glow.replace('0.6)', '0.4)')}`,
                    }}
                      className="sidebar-tooltip"
                    >
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Panel */}
      <div style={{
        borderTop: '1px solid var(--arc-border)',
        padding: isCollapsed ? '12px 8px' : '16px',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{ marginBottom: 10 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--arc-cyan), var(--arc-violet))',
                border: '1px solid var(--arc-cyan)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                boxShadow: '0 0 12px var(--arc-cyan)',
                flexShrink: 0,
              }}>
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--arc-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.username || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(var(--arc-cyan-rgb),0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || ''}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%',
            padding: isCollapsed ? '10px' : '9px 12px',
            borderRadius: 8,
            border: '1px solid rgba(240,20,124,0.2)',
            background: 'rgba(240,20,124,0.06)',
            color: 'rgba(240,100,140,0.8)',
            cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 500,
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,20,124,0.5)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,20,124,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f472b6';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(240,20,124,0.25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,20,124,0.2)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,20,124,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(240,100,140,0.8)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
        background: 'linear-gradient(to top, rgba(5,8,18,0.5), transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
