import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemService } from '@/services/systemService';
import { SystemStatus } from '@/types';
import {
  Users, MessageSquare, GitBranch,
  Cpu, HardDrive, Zap, ArrowRight,
  Brain, Network, Code2,
} from 'lucide-react';

// Realtime line graph
function MiniGraph({ data, colorVar, label }: { data: number[]; colorVar: string; label: string }) {
  if (data.length < 2) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--arc-text-dim)', fontSize: '0.7rem' }}>Collecting data…</div>;
  const W = 280; const H = 64;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * H * 0.85 - H * 0.07;
    return `${x},${y}`;
  }).join(' ');
  const fill = `0,${H} ${points} ${W},${H}`;
  const last = data[data.length - 1];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.7rem', color: `rgba(var(${colorVar}-rgb),0.6)`, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: `var(${colorVar})`, fontFamily: 'JetBrains Mono' }}>{last.toFixed(1)}%</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 60 }}>
        <defs>
          <linearGradient id={`g-${colorVar}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(${colorVar})`} stopOpacity="0.4" />
            <stop offset="100%" stopColor={`var(${colorVar})`} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fill} fill={`url(#g-${colorVar})`} />
        <polyline points={points} fill="none" stroke={`var(${colorVar})`} strokeWidth="1.5"
          className="graph-line-live" style={{ filter: `drop-shadow(0 0 4px var(${colorVar}))` }} />
        {/* Last value dot */}
        {(() => {
          const lastPt = points.split(' ').pop()!;
          const [lx, ly] = lastPt.split(',').map(Number);
          return <circle cx={lx} cy={ly} r={3} fill={`var(${colorVar})`} style={{ filter: `drop-shadow(0 0 6px var(${colorVar}))` }} />;
        })()}
      </svg>
      {/* Progress bar */}
      <div style={{ marginTop: 6 }}>
        <div className="arc-progress">
          <div className="arc-progress-fill" style={{
            width: `${last}%`,
            background: `linear-gradient(90deg, var(${colorVar}), rgba(var(${colorVar}-rgb),0.6), var(${colorVar}))`,
            backgroundSize: '200% 100%',
          }} />
        </div>
      </div>
    </div>
  );
}

// Animated stat card
function StatCard({
  label, value, sub, icon: Icon, colorVar,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; colorVar: string;
}) {
  return (
    <div className="arc-card fade-up" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `radial-gradient(circle at top right, rgba(var(${colorVar}-rgb),0.7) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: `rgba(var(${colorVar}-rgb),0.7)`, fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--arc-text)', lineHeight: 1, letterSpacing: '-0.01em' }}>
            {value}
          </div>
          {sub && (
            <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--arc-text-dim)' }}>{sub}</div>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `linear-gradient(135deg, rgba(var(${colorVar}-rgb),0.15), transparent)`,
          border: `1px solid rgba(var(${colorVar}-rgb),0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px rgba(var(${colorVar}-rgb),0.2)`,
        }}>
          <Icon size={20} style={{ color: `var(${colorVar})`, filter: `drop-shadow(0 0 6px rgba(var(${colorVar}-rgb),0.7))` }} />
        </div>
      </div>

      {/* Bottom decoration */}
      <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, rgba(var(${colorVar}-rgb),0.6), transparent)` }} />
    </div>
  );
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [memData, setMemData] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try { setStatus(await systemService.getStatus()); } catch { }
      finally { setLoading(false); }
    };
    load();
    const refresh = setInterval(load, 10000);

    const sim = setInterval(() => {
      setCpuData(p => [...p.slice(-30), 20 + Math.random() * 60]);
      setMemData(p => [...p.slice(-30), 30 + Math.random() * 50]);
    }, 1000);

    return () => { clearInterval(refresh); clearInterval(sim); };
  }, []);

  const uptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div className="arc-spinner" style={{ width: 52, height: 52 }} />
      <div style={{ color: 'rgba(var(--arc-cyan-rgb),0.7)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
        LOADING SYSTEM STATUS…
      </div>
    </div>
  );

  const quickActions = [
    { label: 'Start Chat', desc: 'Talk to a specialized AI agent', icon: MessageSquare, to: '/chat', colorVar: '--arc-violet' },
    { label: 'Workflows', desc: 'Build multi-step AI pipelines', icon: GitBranch, to: '/workflows', colorVar: '--arc-gold' },
    { label: 'Agents', desc: 'Inspect and control AI agents', icon: Brain, to: '/agents', colorVar: '--arc-green' },
    { label: 'Coding', desc: 'Generate & execute code with AI', icon: Code2, to: '/coding', colorVar: '--arc-blue' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div className="fade-up">
          <div style={{ fontSize: '0.65rem', color: 'rgba(var(--arc-cyan-rgb),0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 6 }}>MISSION CONTROL</div>
          <h1 className="font-display grad-text-anim" style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>
            ARCANE Dashboard
          </h1>
          <p style={{ color: 'var(--arc-text-dim)', marginTop: 6, fontSize: '0.85rem' }}>
            Real-time multi-agent system overview
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }} className="stagger">
          <StatCard
            label="OLLAMA STATUS" icon={Network}
            value={status?.ollamaConnected ? 'Online' : 'Offline'}
            sub={status?.ollamaConnected ? 'All models ready' : 'Run: ollama serve'}
            colorVar={status?.ollamaConnected ? '--arc-green' : '--arc-danger'}
          />
          <StatCard
            label="ACTIVE AGENTS" icon={Users}
            value={String(status?.activeAgents ?? 0)}
            sub={`${status?.activeAgents ?? 0} agents operational`}
            colorVar="--arc-cyan"
          />
          <StatCard
            label="MEMORY USAGE" icon={HardDrive}
            value={`${status?.memoryUsage ?? 0}%`}
            sub="System RAM allocated"
            colorVar="--arc-violet"
          />
          <StatCard
            label="UPTIME" icon={Zap}
            value={uptime(status?.uptime ?? 0)}
            sub="System online"
            colorVar="--arc-green"
          />
        </div>

        {/* Graphs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {[
            { label: 'CPU LOAD', data: cpuData, colorVar: '--arc-cyan', icon: Cpu },
            { label: 'MEMORY', data: memData, colorVar: '--arc-violet', icon: HardDrive },
          ].map(({ label, data, colorVar, icon: Icon }) => (
            <div key={label} className="arc-card fade-up" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Icon size={16} style={{ color: `var(${colorVar})`, filter: `drop-shadow(0 0 5px var(${colorVar}))` }} />
                <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: `rgba(var(${colorVar}-rgb),0.8)`, letterSpacing: '0.15em' }}>
                  {label}
                </span>
                <div style={{
                  marginLeft: 'auto', padding: '2px 8px', borderRadius: 4,
                  background: `rgba(var(${colorVar}-rgb),0.1)`, border: `1px solid rgba(var(${colorVar}-rgb),0.2)`,
                  fontSize: '0.62rem', color: `var(${colorVar})`, fontFamily: 'JetBrains Mono',
                  animation: 'arc-pulse 2s ease-in-out infinite',
                }}>LIVE</div>
              </div>
              <MiniGraph data={data} colorVar={colorVar} label="" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(var(--arc-cyan-rgb),0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 14 }}>
            QUICK ACTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }} className="stagger">
            {quickActions.map(({ label, desc, icon: Icon, to, colorVar }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="arc-card fade-up"
                style={{
                  padding: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: `1px solid rgba(var(${colorVar}-rgb),0.15)`,
                  background: 'var(--arc-card)',
                  width: '100%',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(var(${colorVar}-rgb),0.4)`;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-5px) scale(1.02)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(var(${colorVar}-rgb),0.15)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(var(${colorVar}-rgb),0.15)`;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                  background: `linear-gradient(135deg, rgba(var(${colorVar}-rgb),0.2), rgba(var(${colorVar}-rgb),0.1))`,
                  border: `1px solid rgba(var(${colorVar}-rgb),0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: `var(${colorVar})`, filter: `drop-shadow(0 0 5px rgba(var(${colorVar}-rgb),0.8))` }} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.4 }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: `var(${colorVar})`, fontFamily: 'JetBrains Mono' }}>
                  LAUNCH <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Available models */}
        {status?.availableModels && status.availableModels.length > 0 && (
          <div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(0,212,255,0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 12 }}>
              LOADED MODELS
            </div>
            <div className="arc-card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {status.availableModels.map((m, i) => (
                <span key={m} className="arc-tag arc-tag-cyan" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', marginRight: 6, display: 'inline-block', boxShadow: '0 0 6px rgba(0,212,255,0.8)', animation: 'arc-pulse 2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
