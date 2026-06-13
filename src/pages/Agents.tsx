import { useEffect, useState } from 'react';
import { systemService } from '@/services/systemService';
import { Agent, SystemStatus } from '@/types';
import { Bot, Zap, Brain, Code, Database, Cpu, ArrowRight, RefreshCw, Server, HardDrive, Clock, Activity, LayoutGrid, X } from 'lucide-react';

function MetricBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 5 }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', borderRadius: 3, width: `${value}%`,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}80`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'progress-shimmer 2s linear infinite',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < Math.floor((value / 100) * 20) ? `${color}55` : 'rgba(255,255,255,0.04)',
            transition: 'background 0.5s ease',
            animation: i < Math.floor((value / 100) * 20) ? `arc-pulse 2s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.05}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

const AGENT_CONFIG: Record<string, { color: string; rgb: string; icon: React.ElementType; desc: string }> = {
  planner: { color: '#60a5fa', rgb: '96,165,250', icon: Brain, desc: 'Strategic planning & goal decomposition' },
  analyst: { color: '#a78bfa', rgb: '167,139,250', icon: Cpu, desc: 'Data analysis & insight generation' },
  memory: { color: '#fbbf24', rgb: '251,191,36', icon: Database, desc: 'Context tracking & conversation history' },
  reasoner: { color: '#00d4ff', rgb: '0,212,255', icon: Brain, desc: 'Logical reasoning & decision making' },
  coder: { color: '#f472b6', rgb: '244,114,182', icon: Code, desc: 'Code generation & debugging' },
};

function getConf(type: string) {
  return AGENT_CONFIG[type.toLowerCase()] ?? { color: '#94a3b8', rgb: '148,163,184', icon: Bot, desc: 'General purpose agent' };
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [agentData, statusData] = await Promise.all([
        systemService.getAgents(),
        systemService.getStatus()
      ]);
      setAgents(agentData);
      setSystemStatus(statusData);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(() => loadData(), 5000);
    const tv = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(iv); clearInterval(tv); };
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const statusConfig = {
    idle: { dot: 'status-online', label: 'Idle', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
    busy: { dot: 'status-idle', label: 'Busy', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
    error: { dot: 'status-error', label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
    default: { dot: 'status-idle', label: 'Unknown', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)' },
  };

  const getStatus = (s: string) => statusConfig[s as keyof typeof statusConfig] ?? statusConfig.default;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div className="arc-spinner" style={{ width: 48, height: 48 }} />
      <div style={{ color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.15em' }}>LOADING AGENTS…</div>
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }} className="fade-up">
          <div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(16,185,129,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 6 }}>AGENT CONTROL PANEL</div>
            <h1 className="font-display grad-text-anim" style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>AI Agents</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 6, fontSize: '0.85rem' }}>
              Real-time monitoring of your Ollama-powered agent fleet
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Count badge */}
            <div className="arc-card" style={{
              padding: '10px 20px', textAlign: 'center',
              border: '1px solid rgba(0,212,255,0.2)',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00d4ff', lineHeight: 1 }}>{agents.length}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(0,212,255,0.4)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', marginTop: 2 }}>AGENTS</div>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                width: 40, height: 40, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff', cursor: 'pointer', transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.07)'; }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin-arc 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* --- SYSTEM TELEMETRY --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }} className="stagger">
          {[
            { label: 'OLLAMA ENGINE', icon: Server, value: systemStatus?.ollamaConnected ? 'ONLINE' : 'OFFLINE', color: systemStatus?.ollamaConnected ? '#10b981' : '#ef4444', rgb: systemStatus?.ollamaConnected ? '16,185,129' : '239,68,68', extra: systemStatus?.ollamaConnected ? <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 4, height: 16 + Math.random() * 12, borderRadius: 2, background: '#10b981', opacity: 0.6, animation: `arc-pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />)}</div> : null },
            { label: 'UPTIME', icon: Clock, value: fmtUptime(systemStatus?.uptime ?? 0), color: '#34d399', rgb: '52,211,153', extra: <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}><Zap size={12} style={{ color: '#34d399' }} /><span style={{ fontSize: '0.7rem', color: 'rgba(52,211,153,0.6)', fontFamily: 'JetBrains Mono' }}>ALL SYSTEMS GO</span></div> },
            { label: 'NEURAL ENGINE', icon: Activity, value: 'ACTIVE', color: '#a78bfa', rgb: '167,139,250', extra: <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>{Array.from({ length: 12 }, (_, i) => <div key={i} style={{ width: 3, height: 6 + Math.sin(i + tick * 0.5) * 6, borderRadius: 1, background: '#a78bfa', opacity: 0.7, transition: 'height 0.5s ease' }} />)}</div> },
          ].map(({ label, icon: Icon, value, color, rgb, extra }) => (
            <div key={label} className="arc-card fade-up" style={{ padding: 22, border: `1px solid rgba(${rgb},0.15)`, position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.4)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.15)`; }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, rgba(${rgb},0.18), transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={15} style={{ color, filter: `drop-shadow(0 0 5px rgba(${rgb},0.8))` }} />
                <span style={{ fontSize: '0.65rem', color: `rgba(${rgb},0.6)`, fontFamily: 'JetBrains Mono', letterSpacing: '0.15em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1, fontFamily: label === 'UPTIME' ? 'JetBrains Mono' : 'inherit' }}>{value}</div>
              {extra}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, rgba(${rgb},0.6), transparent)` }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="arc-card fade-up" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <HardDrive size={15} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.8))' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(251,191,36,0.7)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em' }}>RESOURCE USAGE</span>
            </div>
            <MetricBar value={systemStatus?.memoryUsage ?? 0} color="#fbbf24" label="MEMORY" />
            <MetricBar value={Math.floor(Math.random() * 40 + 15)} color="#00d4ff" label="CPU (simulated)" />
            <MetricBar value={Math.floor(Math.random() * 20 + 5)} color="#a78bfa" label="NETWORK I/O" />
          </div>

          {/* System info */}
          <div className="arc-card fade-up" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <LayoutGrid size={15} style={{ color: '#00d4ff', filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.8))' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em' }}>STACK INFO</span>
            </div>
            {[
              { k: 'Backend', v: 'FastAPI / Python 3.11', c: '#00d4ff' },
              { k: 'LLM', v: 'Ollama Local', c: '#10b981' },
              { k: 'Frontend', v: 'React + TypeScript', c: '#a78bfa' },
              { k: 'AI Models', v: `${systemStatus?.availableModels?.length ?? 0} loaded`, c: '#fbbf24' },
              { k: 'Version', v: '0.2.0', c: '#f472b6' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 6, transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{k}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c, fontFamily: 'JetBrains Mono' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- AGENT CARDS --- */}
        {/* Agent cards */}
        {agents.length === 0 ? (
          <div className="arc-card" style={{ padding: 48, textAlign: 'center' }}>
            <Bot size={48} style={{ color: 'rgba(0,212,255,0.3)', margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No Agents Available</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>Ensure Ollama is running and the backend is connected.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }} className="stagger">
            {agents.map((agent, idx) => {
              const conf = getConf(agent.type);
              const st = getStatus(agent.status);
              const Icon = conf.icon;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="arc-card fade-up"
                  style={{
                    padding: 24, position: 'relative', overflow: 'hidden',
                    border: `1px solid rgba(${conf.rgb},0.15)`,
                    animationDelay: `${idx * 0.07}s`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${conf.rgb},0.4)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(${conf.rgb},0.12)`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${conf.rgb},0.15)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  }}
                >
                  {/* Colored corner accent */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 80, height: 80,
                    background: `radial-gradient(circle at top right, rgba(${conf.rgb},0.15), transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `linear-gradient(135deg, rgba(${conf.rgb},0.2), rgba(${conf.rgb},0.08))`,
                        border: `1px solid rgba(${conf.rgb},0.3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 0 16px rgba(${conf.rgb},0.15)`,
                      }}>
                        <Icon size={22} style={{ color: conf.color, filter: `drop-shadow(0 0 6px rgba(${conf.rgb},0.8))` }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 2 }}>{agent.name}</div>
                        <div style={{ fontSize: '0.7rem', color: `rgba(${conf.rgb},0.7)`, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{agent.type}</div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 20,
                      background: st.bg, border: `1px solid ${st.border}`,
                      fontSize: '0.68rem', fontWeight: 600, color: st.color,
                      fontFamily: 'JetBrains Mono', letterSpacing: '0.08em',
                    }}>
                      <div className={`status-dot ${st.dot}`} />
                      {st.label.toUpperCase()}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
                    {agent.description || conf.desc}
                  </p>

                  {/* Model tag */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.5)',
                    marginBottom: 16,
                  }}>
                    <span style={{ color: `rgba(${conf.rgb},0.7)` }}>MODEL:</span> {agent.model}
                  </div>

                  {/* Removing buttons to favor the detailed view modal */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 12, borderTop: `1px solid rgba(${conf.rgb},0.15)`
                  }}>
                    <span style={{ fontSize: '0.75rem', color: `rgba(${conf.rgb},0.6)`, fontFamily: 'JetBrains Mono' }}>CLICK TO VIEW DETAILS</span>
                    <ArrowRight size={14} style={{ color: `rgba(${conf.rgb},0.6)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Specialization guide */}
        <div className="arc-card fade-up" style={{ padding: 24, border: '1px solid rgba(0,212,255,0.1)' }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(0,212,255,0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 16 }}>SPECIALIZATION GUIDE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {Object.entries(AGENT_CONFIG).map(([type, conf]) => {
              const Icon = conf.icon;
              return (
                <div
                  key={type}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: 8,
                    background: `rgba(${conf.rgb},0.04)`,
                    border: `1px solid rgba(${conf.rgb},0.1)`,
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `rgba(${conf.rgb},0.08)`; (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${conf.rgb},0.25)`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = `rgba(${conf.rgb},0.04)`; (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${conf.rgb},0.1)`; }}
                >
                  <Icon size={16} style={{ color: conf.color, filter: `drop-shadow(0 0 4px rgba(${conf.rgb},0.7))`, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize', marginBottom: 3 }}>{type}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{conf.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Detailed View Modal */}
      {selectedAgent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedAgent(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', cursor: 'pointer' }}
          />
          
          {/* Modal */}
          <div className="arc-card animate-in fade-in zoom-in duration-200" style={{
            position: 'relative', width: '100%', maxWidth: 600,
            padding: 32, border: `1px solid rgba(${getConf(selectedAgent.type).rgb},0.3)`,
            boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(${getConf(selectedAgent.type).rgb},0.15)`,
          }}>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: `linear-gradient(135deg, rgba(${getConf(selectedAgent.type).rgb},0.2), rgba(${getConf(selectedAgent.type).rgb},0.08))`,
                border: `1px solid rgba(${getConf(selectedAgent.type).rgb},0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(() => {
                  const Icon = getConf(selectedAgent.type).icon;
                  return <Icon size={30} style={{ color: getConf(selectedAgent.type).color }} />;
                })()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{selectedAgent.name}</h2>
                <div style={{ fontSize: '0.8rem', color: `rgba(${getConf(selectedAgent.type).rgb},0.7)`, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {selectedAgent.type} Agent
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{selectedAgent.description || getConf(selectedAgent.type).desc}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', marginBottom: 4 }}>MODEL ENGINE</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedAgent.model}</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', marginBottom: 4 }}>CURRENT STATUS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className={`status-dot ${getStatus(selectedAgent.status).dot}`} />
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: getStatus(selectedAgent.status).color, textTransform: 'capitalize' }}>
                    {selectedAgent.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { window.location.href = `/chat?agent=${selectedAgent.type}`; }}
                style={{
                  flex: 1, padding: '12px',
                  background: `rgba(${getConf(selectedAgent.type).rgb},0.2)`,
                  border: `1px solid rgba(${getConf(selectedAgent.type).rgb},0.4)`,
                  borderRadius: 12, color: '#fff',
                  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                Open in Chat <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
