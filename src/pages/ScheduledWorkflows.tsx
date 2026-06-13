import { useState, useEffect, useRef } from 'react';
import { Clock, Play, FileText, X, Timer, CheckCircle2, Loader2, RefreshCw, Layers, Zap, Trash2 } from 'lucide-react';
import studioService from '@/services/studioService';

/* ── Types ─────────────────────────────────── */
interface ScheduledPipeline {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  schedule: { type: string; interval?: string; cron?: string; active: boolean; last_run?: string };
  createdAt: string;
  updatedAt: string;
  last_run?: string;
  node_types: string[];
  nodes?: any[];
  edges?: any[];
  is_running?: boolean;
}

interface RunLog {
  filename: string;
  timestamp: string;
  size: number;
}

/* ── Helpers ───────────────────────────────── */
const INTERVAL_MS: Record<string, number> = {
  '1m': 60_000, '5m': 300_000, '15m': 900_000,
  '1h': 3_600_000, '12h': 43_200_000, '1d': 86_400_000,
};

const INTERVAL_LABEL: Record<string, string> = {
  '1m': '1 Minute', '5m': '5 Minutes', '15m': '15 Minutes',
  '1h': '1 Hour', '12h': '12 Hours', '1d': 'Daily',
};

const NODE_ICONS: Record<string, string> = {
  inputText: '📝', inputPdf: '📄', inputExcel: '📊',
  planner: '📋', executor: '⚙️', analyst: '📊', memory: '🧩', tool: '🔧',
  reasoner: '🧠', coder: '💻', execution: '▶️', transform: '🔀',
  outputText: '📤', outputPdf: '📑', outputExcel: '📈',
  vision: '👁️', search: '🔎', sqlAgent: '🗄️',
  chameleon: '🦎', oracle: '🔮', alchemist: '⚗️', sentinel: '🛡️',
  chronicler: '📚', validator: '✅', branch: '🔀',
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Executing…';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/* ── Countdown Component ──────────────────── */
function CountdownTimer({ lastRun, intervalKey }: { lastRun?: string; intervalKey: string }) {
  const [remaining, setRemaining] = useState(0);
  const intervalMs = INTERVAL_MS[intervalKey] || 3_600_000;

  useEffect(() => {
    const tick = () => {
      const base = lastRun ? new Date(lastRun).getTime() : Date.now() - intervalMs;
      setRemaining(Math.max(0, base + intervalMs - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRun, intervalMs]);

  const pct = Math.min(100, (1 - remaining / intervalMs) * 100);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <Timer size={11} style={{ color: '#00d4ff' }} />
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: remaining < 30000 ? '#f59e0b' : '#00d4ff', fontWeight: 600 }}>
          {formatCountdown(remaining)}
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)', borderRadius: 4, transition: 'width 1s linear' }} />
      </div>
    </div>
  );
}

/* ── Pipeline Flow Visualization ──────────── */
function PipelineFlow({ nodes }: { nodes: any[] }) {
  const agentNodes = nodes.filter(n => 
    ['planner', 'executor', 'analyst', 'memory', 'tool', 'reasoner', 'coder', 'vision', 'search', 'sqlAgent', 'chronicler', 'inputText', 'inputPdf', 'inputExcel', 'outputText', 'outputPdf', 'outputExcel'].includes(n.type)
  );

  if (agentNodes.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflowX: 'auto', marginBottom: 20 }}>
      {agentNodes.map((node, i) => (
        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
             <div style={{ width: 36, height: 36, borderRadius: 10, background: node.type.startsWith('input') ? 'rgba(59,130,246,0.1)' : node.type.startsWith('output') ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)', border: `1px solid ${node.type.startsWith('input') ? 'rgba(59,130,246,0.3)' : node.type.startsWith('output') ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
               {NODE_ICONS[node.type] || '🤖'}
             </div>
             <span style={{ fontSize: '0.55rem', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
               {node.type.replace('inputText', 'Input').replace('outputText', 'Output').replace('inputPdf', 'PDF In').replace('outputPdf', 'PDF Out')}
             </span>
          </div>
          {i < agentNodes.length - 1 && (
            <div style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 300, fontSize: '0.8rem', marginTop: -15 }}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ───────────────────────── */
export default function ScheduledWorkflows() {
  const [pipelines, setPipelines] = useState<ScheduledPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScheduledPipeline | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [logContent, setLogContent] = useState<string | null>(null);
  const [logFilename, setLogFilename] = useState<string | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'running' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });
  const logRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await studioService.getScheduledPipelines();
      setPipelines(data as unknown as ScheduledPipeline[]);
    } catch (e) {
      console.error('Failed to load scheduled pipelines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  
  // NEW: Poll for updates if any pipeline is running or if the selected one is running
  useEffect(() => {
    const isAnyRunning = pipelines.some(p => p.is_running);
    const isSelectedRunning = selected?.is_running;
    
    if (isAnyRunning || isSelectedRunning) {
      const id = setInterval(async () => {
        // Refresh the list to get new run entries
        const data = await studioService.getScheduledPipelines();
        setPipelines(data as unknown as ScheduledPipeline[]);
        
        // If the selected pipeline is running, refresh its run list too
        if (selected) {
          const runsData = await studioService.getPipelineRuns(selected.id);
          setRuns(runsData);
          
          // If we are currently viewing a log from an active run, refresh the content
          if (logFilename && (logFilename.includes('running') || runsData.some(r => r.filename === logFilename))) {
             const logData = await studioService.getRunContent(selected.id, logFilename);
             setLogContent(logData.content);
          }
        }
      }, 3000);
      return () => clearInterval(id);
    }
  }, [pipelines, selected, logFilename]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logContent]);

  const openPipeline = async (p: ScheduledPipeline) => {
    setSelected(p);
    setLogContent(null);
    setRunsLoading(true);
    try {
      // Fetch full pipeline detail to get nodes/edges for the visual overview
      const detail = await studioService.getPipeline(p.id);
      setSelected({ ...p, nodes: detail.nodes, edges: detail.edges });
      
      const data = await studioService.getPipelineRuns(p.id);
      setRuns(data);
    } catch (err) { 
      console.error('Failed to open pipeline:', err);
      setRuns([]); 
    }
    finally { setRunsLoading(false); }
  };

  const openLog = async (filename: string) => {
    if (!selected) return;
    setLogFilename(filename);
    setLogLoading(true);
    try {
      const data = await studioService.getRunContent(selected.id, filename);
      setLogContent(data.content);
    } catch { setLogContent('Failed to load log content.'); }
    finally { setLogLoading(false); }
  };

  const handleDeleteSchedule = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to remove this schedule metadata?')) return;
    
    try {
      await studioService.deleteSchedule(id);
      setPipelines(prev => prev.filter(p => p.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setLogContent(null);
      }
      setStatus({ type: 'success', msg: 'Schedule removed' });
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setStatus({ type: 'error', msg: 'Failed to remove schedule' });
    }
    setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
  };

  const toggleActive = async (p: ScheduledPipeline, e: React.MouseEvent) => {
    e.stopPropagation();
    const newActive = !p.schedule.active;
    try {
      await studioService.toggleSchedule(p.id, newActive);
      setPipelines(prev => prev.map(item => 
        item.id === p.id ? { ...item, schedule: { ...item.schedule, active: newActive } } : item
      ));
      if (selected?.id === p.id) {
        setSelected({ ...selected, schedule: { ...selected.schedule, active: newActive } });
      }
      setStatus({ type: 'success', msg: newActive ? 'Schedule Activated' : 'Schedule Deactivated' });
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
      setStatus({ type: 'error', msg: 'Update failed' });
    }
    setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
  };

  const visiblePipelines = pipelines.filter(p => showInactive || p.schedule.active);
  const activeCount = pipelines.filter(p => p.schedule.active).length;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT: Scheduled Pipelines List ────────── */}
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(0,212,255,0.08)', display: 'flex', flexDirection: 'column', background: 'rgba(5,10,20,0.7)' }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(0,212,255,0.07)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '0.04em' }}>Scheduled Ops</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(16,185,129,0.7)', fontFamily: 'JetBrains Mono', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'arc-pulse 2s ease-in-out infinite' }} />
                {activeCount} active / {pipelines.length} total
              </div>
            </div>
            <button onClick={load} style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, padding: '6px 8px', color: '#00d4ff', cursor: 'pointer', transition: 'all 0.2s' }} title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
             <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.02em' }}>SHOW INACTIVE</span>
             <button 
              onClick={() => setShowInactive(!showInactive)}
              style={{
                width: 28, height: 16, borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'all 0.3s',
                background: showInactive ? '#00d4ff' : 'rgba(255,255,255,0.1)', border: 'none', padding: 0
              }}
             >
               <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: showInactive ? 14 : 2, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
             </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'rgba(0,212,255,0.4)', gap: 8 }}>
              <Loader2 size={16} style={{ animation: 'spin-arc 0.8s linear infinite' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>Loading…</span>
            </div>
          ) : pipelines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', lineHeight: 1.7 }}>
              <Clock size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              No scheduled pipelines.<br />
              Open <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Studio</span> → set a schedule on a pipeline.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visiblePipelines.map(p => {
                const isSel = selected?.id === p.id;
                const sched = p.schedule;
                const intervalKey = sched.interval || '';
                const lastRun = sched.last_run || p.last_run;
                const isActive = sched.active;

                return (
                  <div
                    key={p.id}
                    onClick={() => openPipeline(p)}
                    style={{
                      padding: '14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease',
                      background: isSel ? 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.07))' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSel ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isSel ? '0 0 20px rgba(0,212,255,0.12)' : 'none',
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    {/* Pipeline name & status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSel ? '#fff' : 'rgba(255,255,255,0.8)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontFamily: 'JetBrains Mono', color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}>
                          <Clock size={9} />
                          {sched.type === 'interval'
                            ? `Every ${INTERVAL_LABEL[intervalKey] || intervalKey}`
                            : `Cron: ${sched.cron}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button 
                            onClick={(e) => toggleActive(p, e)}
                            style={{ 
                              background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', 
                              border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, 
                              borderRadius: 6, padding: '2px 6px', color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)', 
                              fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' 
                            }}
                          >
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSchedule(p.id, e)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', padding: 2, borderRadius: 4, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.4)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete Schedule Metadata"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.is_running ? '#f59e0b' : isActive ? '#10b981' : 'rgba(255,255,255,0.1)', boxShadow: isActive ? `0 0 8px ${p.is_running ? '#f59e0b' : '#10b981'}` : 'none', flexShrink: 0, animation: p.is_running || isActive ? 'arc-pulse 2s ease-in-out infinite' : 'none' }} />
                        </div>
                        {p.is_running && <span style={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>Running</span>}
                      </div>
                    </div>

                    {/* Node type chips */}
                    {p.node_types.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {p.node_types.slice(0, 5).map(nt => (
                          <span key={nt} style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: '0.7rem' }}>{NODE_ICONS[nt] || '🤖'}</span> {nt}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Countdown */}
                    {isActive && sched.type === 'interval' && (
                      <CountdownTimer lastRun={lastRun} intervalKey={intervalKey} />
                    )}
                    {(!isActive || sched.type === 'cron') && (
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                        {lastRun ? `Last run: ${new Date(lastRun).toLocaleString()}` : 'No runs yet'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Detail Panel ──────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} style={{ color: 'rgba(16,185,129,0.4)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: 6, fontFamily: 'Space Grotesk, sans-serif' }}>Mission Control</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>Select a scheduled pipeline to view<br />countdown timers, run history & outputs</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(5,10,20,0.6)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{selected.name}</div>
                    <button 
                      onClick={(e) => toggleActive(selected, e)}
                      style={{ 
                        background: selected.schedule.active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', 
                        border: `1px solid ${selected.schedule.active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, 
                        borderRadius: 6, padding: '2px 8px', color: selected.schedule.active ? '#10b981' : 'rgba(255,255,255,0.4)', 
                        fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' 
                      }}
                    >
                      {selected.schedule.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono' }}>
                      {selected.schedule.type === 'interval'
                        ? `Every ${INTERVAL_LABEL[selected.schedule.interval || ''] || selected.schedule.interval}`
                        : `Cron: ${selected.schedule.cron}`}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(139,92,246,0.6)', fontFamily: 'JetBrains Mono' }}>
                      <Layers size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{selected.nodeCount} nodes
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    onClick={() => {
                      window.location.href = `/studio?id=${selected.id}`;
                    }}
                    style={{ 
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, 
                      padding: '6px 12px', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Layers size={12} /> Open in Studio
                  </button>
                  <button 
                    onClick={() => handleDeleteSchedule(selected.id)}
                    style={{ 
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, 
                      padding: '6px 12px', color: '#f87171', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Trash2 size={12} /> Delete Schedule
                  </button>
                  <button onClick={() => { setSelected(null); setLogContent(null); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {selected.nodes && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <PipelineFlow nodes={selected.nodes} />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!selected) return;
                      setStatus({ type: 'running', msg: 'Triggering execution...' });
                      try {
                        await studioService.executePipeline(selected.id);
                        setStatus({ type: 'success', msg: 'Execution started!' });
                        // Refresh runs after a short delay
                        setTimeout(() => openPipeline(selected), 2000);
                      } catch (err) {
                        setStatus({ type: 'error', msg: 'Failed to start' });
                      }
                      setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
                    }}
                    style={{ 
                      flexShrink: 0, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', 
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, 
                      color: '#10b981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                    className="hover-bright"
                  >
                    <Play size={14} fill="currentColor" /> Run Now
                  </button>
                </div>
              )}
            </div>

            {/* Status Feedback */}
            {status.type !== 'idle' && (
               <div style={{ padding: '4px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 8 }}>
                 {status.type === 'running' && <Loader2 size={10} style={{ animation: 'spin-arc 0.8s linear infinite', color: '#f59e0b' }} />}
                 <span style={{ fontSize: '0.65rem', color: status.type === 'success' ? '#10b981' : status.type === 'error' ? '#ef4444' : '#f59e0b', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                   {status.msg}
                 </span>
               </div>
            )}

            {/* Content: runs + log viewer */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Run list */}
              <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid rgba(0,212,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(3,7,15,0.5)' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>EXECUTION HISTORY</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {runsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, gap: 8, color: 'rgba(0,212,255,0.4)' }}>
                      <Loader2 size={14} style={{ animation: 'spin-arc 0.8s linear infinite' }} /> <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>Loading…</span>
                    </div>
                  ) : runs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 12px', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', lineHeight: 1.6 }}>
                      <Play size={20} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
                      No runs recorded yet.<br />Logs appear after each scheduled execution.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {runs.map(run => {
                        const isActive = logFilename === run.filename;
                        const isRunning = run.filename.includes('running');
                        
                        // Parse timestamp safely
                        let dateStr = 'Unknown';
                        try {
                          const cleanTs = run.timestamp.replace('_running', '');
                          const d = new Date(cleanTs);
                          dateStr = isNaN(d.getTime()) ? run.timestamp : d.toLocaleString();
                        } catch {
                          dateStr = run.timestamp;
                        }

                        return (
                          <div
                            key={run.filename}
                            onClick={() => openLog(run.filename)}
                            style={{
                              padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                              background: isActive ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isActive ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.04)'}`,
                              position: 'relative',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <FileText size={11} style={{ color: isActive ? '#00d4ff' : isRunning ? '#f59e0b' : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.68rem', color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {dateStr}
                                </span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!selected || !confirm('Delete this run log?')) return;
                                  studioService.deleteRunLog(selected.id, run.filename)
                                    .then(() => {
                                      setRuns(prev => prev.filter(r => r.filename !== run.filename));
                                      if (logFilename === run.filename) {
                                        setLogContent(null);
                                        setLogFilename(null);
                                      }
                                    })
                                    .catch(err => console.error('Failed to delete log:', err));
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.3)', cursor: 'pointer', padding: 2, borderRadius: 4 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                {isRunning ? (
                                  <><Loader2 size={9} style={{ color: '#f59e0b', animation: 'spin-arc 0.8s linear infinite' }} /> running</>
                                ) : (
                                  <><CheckCircle2 size={9} style={{ color: '#10b981' }} /> completed</>
                                )}
                              </span>
                              <span>{(run.size / 1024).toFixed(1)} KB</span>
                            </div>
                            {isRunning && (
                               <div style={{ position: 'absolute', top: 5, right: 5, width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', animation: 'arc-pulse 1.5s infinite' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Log viewer */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.35)' }}>
                {!logContent && !logLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
                    <FileText size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>Select a run to view output</div>
                  </div>
                ) : logLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'rgba(0,212,255,0.5)' }}>
                    <Loader2 size={16} style={{ animation: 'spin-arc 0.8s linear infinite' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>Loading log…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,212,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ marginLeft: 8, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{logFilename}</span>
                    </div>
                    <div
                      ref={logRef}
                      style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', lineHeight: 1.8, color: 'rgba(0,212,255,0.85)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {logContent}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
