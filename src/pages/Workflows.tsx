import { useState, useEffect } from 'react';
import {
  workflowService,
  Workflow,
  WorkflowTemplate,
  WorkflowExecution,
} from '@/services/workflowService';
import {
  GitBranch, Play, Trash2, Clock, CheckCircle, XCircle,
  Loader2, GitMerge, GitCompare, ArrowRight, Sparkles, X,
  ChevronDown, ChevronUp, Copy, DownloadCloud, Check
} from 'lucide-react';
import WorkflowGraph from '@/components/WorkflowGraph';

const WORKFLOW_COLORS: Record<string, string> = {
  sequential: '0,212,255',
  parallel: '139,92,246',
  conditional: '240,20,124',
};

const getWfRgb = (type: string) => WORKFLOW_COLORS[type] ?? '0,212,255';

// Maps workflow template names to representative agent tags
const TEMPLATE_AGENTS: Record<string, Array<{ label: string; icon: string; color: string }>> = {
  'Research & Summarize':   [{ label: 'Reasoner', icon: '🧠', color: '#00d4ff' }, { label: 'Analyst', icon: '📊', color: '#8b5cf6' }],
  'Code Review Pipeline':  [{ label: 'Coder', icon: '💻', color: '#00d4ff' }, { label: 'Critic', icon: '🔍', color: '#f59e0b' }],
  'Content Creation':      [{ label: 'Writer', icon: '✍️', color: '#8b5cf6' }, { label: 'Editor', icon: '🖊️', color: '#10b981' }, { label: 'Planner', icon: '📋', color: '#f59e0b' }],
  'Data Intelligence':     [{ label: 'Analyst', icon: '📊', color: '#00d4ff' }, { label: 'Reasoner', icon: '🧠', color: '#8b5cf6' }, { label: 'Summarizer', icon: '📝', color: '#10b981' }],
  'Creative Writing':      [{ label: 'Writer', icon: '✍️', color: '#8b5cf6' }, { label: 'Planner', icon: '📋', color: '#f59e0b' }],
};

const WORKFLOW_NODE_ICONS: Record<string, string> = {
  reasoner: '🧠', coder: '💻', planner: '📋', analyst: '📊', writer: '✍️',
  memory: '🧩', search: '🔎', vision: '👁️', sql: '🗄️',
  critic: '🔍', editor: '🖊️', summarizer: '📝', rag: '📚', code: '💻',
};

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<any[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeStepOutput, setActiveStepOutput] = useState<{ agent: string, output: string, step: number } | null>(null);

  useEffect(() => { loadWorkflows(); loadTemplates(); }, []);

  const loadWorkflows = async () => {
    try { setWorkflows(await workflowService.getWorkflows()); } catch { }
    finally { setLoading(false); }
  };
  const loadTemplates = async () => {
    try { setTemplates(await workflowService.getTemplates()); } catch { }
  };
  const loadExecutions = async (id: string) => {
    try { setExecutions(await workflowService.getWorkflowExecutions(id)); } catch { }
  };

  const handleCreateFromTemplate = async (tid: string) => {
    try { const w = await workflowService.createFromTemplate(tid); setWorkflows([w, ...workflows]); setShowTemplates(false); } catch { }
  };

  const handleCreateCustomWorkflow = async () => {
    if (!customPrompt.trim()) return;
    setCreatingCustom(true);
    try {
      const w = await workflowService.createCustomWorkflow(customPrompt);
      setWorkflows([w, ...workflows]);
      setShowCustomCreator(false); setCustomPrompt('');
      setSelectedWorkflow(w); await loadExecutions(w.id);
    } catch { alert('Failed to create custom workflow.'); }
    finally { setCreatingCustom(false); }
  };

  const handleSelectWorkflow = async (w: Workflow) => {
    setSelectedWorkflow(w); await loadExecutions(w.id); setExecutionProgress([]);
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await workflowService.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      if (selectedWorkflow?.id === id) setSelectedWorkflow(null);
    } catch { }
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow || !inputPrompt.trim()) return;
    setExecuting(true); setExecutionProgress([]); setActiveStepOutput(null);
    try {
      await workflowService.executeWorkflowStream(selectedWorkflow.id, inputPrompt, u => setExecutionProgress(p => [...p, u]));
      await loadExecutions(selectedWorkflow.id); setInputPrompt('');
    } catch { setExecutionProgress(p => [...p, { type: 'error', error: 'Execution failed' }]); }
    finally { setExecuting(false); }
  };

  const toggleExecution = (id: string) => setExpandedExecutions(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const formatDate = (s: string) => {
    try { const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleString(); } catch { return '—'; }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const WfIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
    const col = `rgb(${getWfRgb(type)})`;
    const Ic = type === 'parallel' ? GitMerge : type === 'conditional' ? GitCompare : ArrowRight;
    return <Ic size={size} style={{ color: col, filter: `drop-shadow(0 0 4px ${col})` }} />;
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed') return <CheckCircle size={15} style={{ color: '#10b981' }} />;
    if (status === 'failed') return <XCircle size={15} style={{ color: '#ef4444' }} />;
    if (status === 'running') return <Loader2 size={15} style={{ color: '#00d4ff', animation: 'spin-arc 0.8s linear infinite' }} />;
    return <Clock size={15} style={{ color: '#94a3b8' }} />;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div className="arc-spinner" style={{ width: 48, height: 48 }} />
      <div style={{ color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.15em' }}>LOADING WORKFLOWS…</div>
    </div>
  );

  const sidebarStyle: React.CSSProperties = {
    width: 280, flexShrink: 0,
    borderRight: '1px solid rgba(0,212,255,0.08)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'rgba(5,10,20,0.6)',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid rgba(0,212,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(5,10,20,0.7)',
      }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(245,158,11,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 4 }}>ORCHESTRATION ENGINE</div>
          <h1 className="font-display grad-text-anim" style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>Workflows</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '✦ Custom', action: () => { setShowCustomCreator(true); setShowTemplates(false); }, rgb: '139,92,246' },
            { label: '+ Template', action: () => { setShowTemplates(!showTemplates); setShowCustomCreator(false); }, rgb: '0,212,255' },
          ].map(({ label, action, rgb }) => (
            <button key={label} onClick={action} className="btn-ripple" style={{
              padding: '9px 18px', borderRadius: 9,
              background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.35)`,
              color: `rgb(${rgb})`, fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'Space Grotesk, sans-serif',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.18)`; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px rgba(${rgb},0.3)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.1)`; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: workflow list (Hidden during Focused Execution Mode) */}
        {!executing && (
          <div style={sidebarStyle} className="fade-in">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,212,255,0.06)', fontSize: '0.65rem', color: 'rgba(0,212,255,0.4)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em' }}>YOUR WORKFLOWS</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workflows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', padding: '24px 12px' }}>No workflows yet. Create one!</div>
            ) : workflows.map(wf => {
              const rgb = getWfRgb(wf.workflowType);
              const isActive = selectedWorkflow?.id === wf.id;
              return (
                <div key={wf.id} onClick={() => handleSelectWorkflow(wf)} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: isActive ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? `rgba(${rgb},0.4)` : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.25s ease',
                  boxShadow: isActive ? `0 0 16px rgba(${rgb},0.15)` : 'none',
                }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <WfIcon type={wf.workflowType} size={14} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', padding: 4, flexShrink: 0, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.67rem', color: `rgba(${rgb},0.5)`, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{wf.workflowType}</div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* RIGHT: main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showCustomCreator ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(139,92,246,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 6 }}>AI WORKFLOW BUILDER</div>
                    <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#a78bfa' }}>Custom Workflow</h2>
                  </div>
                  <button onClick={() => { setShowCustomCreator(false); setCustomPrompt(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                    <X size={20} />
                  </button>
                </div>
                <div className="arc-card" style={{ padding: 24, border: '1px solid rgba(139,92,246,0.2)' }}>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: 'rgba(139,92,246,0.6)', letterSpacing: '0.12em', marginBottom: 10 }}>DESCRIBE YOUR WORKFLOW</label>
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Research a topic, summarize the findings, then have another agent review and critique it..."
                    rows={7} disabled={creatingCustom}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box', opacity: creatingCustom ? 0.5 : 1, lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.2)'; e.target.style.boxShadow = 'none'; }} />

                  <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: 14, marginTop: 16 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a78bfa', marginBottom: 8, fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}>💡 TIPS</div>
                    {['Be specific about each agent\'s role', 'Mention if tasks run in sequence or parallel', 'Include conditions or branching logic', 'Specify how results should be combined'].map(t => (
                      <div key={t} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>· {t}</div>
                    ))}
                  </div>

                  <button onClick={handleCreateCustomWorkflow} disabled={!customPrompt.trim() || creatingCustom} className="btn-ripple" style={{
                    marginTop: 20, width: '100%', padding: '13px', borderRadius: 10,
                    background: (!customPrompt.trim() || creatingCustom) ? 'rgba(139,92,246,0.05)' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(0,212,255,0.2))',
                    border: `1px solid ${(!customPrompt.trim() || creatingCustom) ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.5)'}`,
                    color: (!customPrompt.trim() || creatingCustom) ? 'rgba(139,92,246,0.4)' : '#a78bfa',
                    fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', cursor: (!customPrompt.trim() || creatingCustom) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: (!customPrompt.trim() || creatingCustom) ? 'none' : '0 0 24px rgba(139,92,246,0.2)', transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
                  }}>
                    {creatingCustom ? <><div className="arc-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#a78bfa' }} /> CRAFTING WORKFLOW…</> : <><Sparkles size={16} /> GENERATE WORKFLOW</>}
                  </button>
                </div>

                {/* Example prompts */}
                <div className="arc-card" style={{ padding: 20, marginTop: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 12 }}>EXAMPLE PROMPTS</div>
                  {[
                    'Research a topic, summarize findings, and generate a structured report',
                    'Build a content workflow with a writer, editor, and fact-checker in sequence',
                    'Design a parallel workflow where agents analyze data from different angles simultaneously',
                  ].map((ex, i) => (
                    <button key={i} onClick={() => setCustomPrompt(ex)} disabled={creatingCustom} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', cursor: 'pointer',
                      marginBottom: 6, transition: 'all 0.2s ease', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.4,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : showTemplates ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(0,212,255,0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 6 }}>TEMPLATE LIBRARY</div>
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 20px', color: '#00d4ff' }}>Workflow Templates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {templates.map(t => {
                    const rgb = getWfRgb(t.workflowType);
                    const agentTags = TEMPLATE_AGENTS[t.name] || [];
                    return (
                      <div key={t.id} className="arc-card" style={{ padding: 22, border: `1px solid rgba(${rgb},0.15)`, transition: 'all 0.25s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.4)`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.15)`; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <WfIcon type={t.workflowType} size={18} />
                          <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', margin: 0 }}>{t.name}</h3>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>{t.description}</p>
                        {/* Agent Preview Chips */}
                        {agentTags.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: 6 }}>AGENTS USED</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {agentTags.map((ag, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${ag.color}33`, fontSize: '0.68rem', color: ag.color, fontWeight: 600 }}>
                                  <span style={{ fontSize: '0.75rem' }}>{ag.icon}</span> {ag.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="arc-tag" style={{ color: `rgb(${rgb})`, borderColor: `rgba(${rgb},0.3)`, background: `rgba(${rgb},0.08)`, textTransform: 'capitalize', fontSize: '0.65rem' }}>{t.workflowType}</span>
                          <button onClick={() => handleCreateFromTemplate(t.id)} className="btn-ripple" style={{
                            padding: '7px 16px', borderRadius: 8, background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.3)`,
                            color: `rgb(${rgb})`, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'Space Grotesk, sans-serif',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.25)`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb},0.15)`; }}>
                            Use
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          ) : selectedWorkflow ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Top half: Graph & Execution Prompt */}
              <div style={{ display: 'flex', height: executing ? '60%' : '50%', borderBottom: '1px solid rgba(0,212,255,0.08)', transition: 'height 0.3s ease' }}>
                {/* Visual Graph Area */}
                <div style={{ flex: 2, background: 'rgba(5,10,20,0.6)', borderRight: '1px solid rgba(0,212,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                  {activeStepOutput ? (
                    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 32px', background: 'rgba(3,7,15,0.9)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 20 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                         <div>
                           <div style={{ fontSize: '0.62rem', color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.2em', marginBottom: 6 }}>STEP {activeStepOutput.step} OUTPUT</div>
                           <h3 className="font-display" style={{ margin: 0, color: '#fff', fontSize: '1.4rem', textTransform: 'capitalize', fontWeight: 800 }}>{activeStepOutput.agent} Agent</h3>
                         </div>
                         <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => handleCopy('step-copy', activeStepOutput.output)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 9, padding: '8px 16px', color: '#00d4ff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Space Grotesk' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.18)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,255,0.2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                               {copiedId === 'step-copy' ? <Check size={14} /> : <Copy size={14} />} {copiedId === 'step-copy' ? 'COPIED' : 'COPY'}
                            </button>
                            <button onClick={() => handleDownload(activeStepOutput.output, `step_${activeStepOutput.step}_${activeStepOutput.agent}.txt`)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Space Grotesk' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                               <DownloadCloud size={14} /> DOWNLOAD
                            </button>
                            <button onClick={() => setActiveStepOutput(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '8px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                               <X size={18} />
                            </button>
                         </div>
                       </div>
                       <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.1)', padding: 24, fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, fontFamily: 'JetBrains Mono', overflowY: 'auto', whiteSpace: 'pre-wrap', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
                         {activeStepOutput.output}
                       </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'absolute', top: 16, left: 24, zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <WfIcon type={selectedWorkflow.workflowType} size={18} />
                          <h2 style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem', margin: 0 }}>{selectedWorkflow.name}</h2>
                        </div>
                        <span className="arc-tag" style={{ fontSize: '0.62rem', color: `rgb(${getWfRgb(selectedWorkflow.workflowType)})`, borderColor: `rgba(${getWfRgb(selectedWorkflow.workflowType)},0.3)`, background: `rgba(${getWfRgb(selectedWorkflow.workflowType)},0.08)`, textTransform: 'capitalize' }}>{selectedWorkflow.workflowType}</span>
                      </div>
                      <WorkflowGraph workflow={selectedWorkflow} />
                    </>
                  )}
                  {/* Agent Overview Strip */}
                  {selectedWorkflow.config?.steps && selectedWorkflow.config.steps.length > 0 && (() => {
                    const steps = selectedWorkflow.config.steps;
                    return (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(3,7,15,0.85)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(0,212,255,0.08)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
                        <span style={{ fontSize: '0.58rem', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', flexShrink: 0 }}>PIPELINE:</span>
                        {steps.map((step: any, idx: number) => {
                          const agentKey = (step.agentType || step.agent_type || step.type || '').toLowerCase();
                          const icon = WORKFLOW_NODE_ICONS[agentKey] || '🤖';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.68rem', color: '#00d4ff', fontWeight: 600 }}>
                                <span>{icon}</span> <span style={{ textTransform: 'capitalize' }}>{agentKey || `Step ${idx + 1}`}</span>
                              </div>
                              {idx < steps.length - 1 && <span style={{ color: 'rgba(0,212,255,0.3)', fontSize: '0.7rem', margin: '0 2px' }}>→</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Execute panel */}
                <div style={{ flex: 1, padding: '24px', background: 'rgba(5,10,20,0.5)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(0,212,255,0.6)', fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', marginBottom: 12 }}>EXECUTION PARAMETERS</div>
                  <textarea value={inputPrompt} onChange={e => setInputPrompt(e.target.value)}
                    placeholder="Enter your prompt for this workflow…" rows={5} disabled={executing}
                    style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 8, color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', fontSize: '0.86rem', outline: 'none', resize: 'none', opacity: executing ? 0.5 : 1, marginBottom: 12 }}
                    onFocus={e => { e.target.style.borderColor = '#00d4ff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,212,255,0.18)'; e.target.style.boxShadow = 'none'; }} />
                  <button onClick={handleExecuteWorkflow} disabled={!inputPrompt.trim() || executing} className="btn-ripple" style={{
                    width: '100%', padding: '12px', borderRadius: 10,
                    background: (!inputPrompt.trim() || executing) ? 'rgba(0,212,255,0.05)' : 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(16,185,129,0.2))',
                    border: `1px solid ${(!inputPrompt.trim() || executing) ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.4)'}`,
                    color: (!inputPrompt.trim() || executing) ? 'rgba(0,212,255,0.3)' : '#00d4ff',
                    fontWeight: 700, fontSize: '0.82rem', cursor: (!inputPrompt.trim() || executing) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.25s ease', flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif',
                    boxShadow: (!inputPrompt.trim() || executing) ? 'none' : '0 0 20px rgba(0,212,255,0.2)',
                  }}>
                    {executing ? <><Loader2 size={16} style={{ animation: 'spin-arc 0.8s linear infinite' }} /> RUNNING IN FOCUSED MODE</> : <><Play size={16} /> EXECUTE WORKFLOW</>}
                  </button>


                {/* Progress */}
                {executionProgress.length > 0 && (
                  <div style={{ marginTop: 14, padding: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 8, maxHeight: 240, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.12em', marginBottom: 10 }}>EXECUTION STREAM</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {executionProgress.map((u, i) => {
                        if (u.type === 'step_start') return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00d4ff', fontSize: '0.8rem' }}><Loader2 size={13} style={{ animation: 'spin-arc 0.8s linear infinite' }} /> Step {u.step}/{u.total_steps}: Starting {u.agent}</div>;
                        if (u.type === 'step_complete') return (
                          <div key={i} 
                            onClick={() => setActiveStepOutput({ agent: u.agent, output: u.output, step: u.step })}
                            style={{ borderLeft: '2px solid #10b981', paddingLeft: 10, color: '#34d399', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '0 4px 4px 0' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><CheckCircle size={13} /> Completed {u.agent}</div>
                            {u.output && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: '4px 8px', maxHeight: 80, overflowY: 'auto' }}>{u.output.length > 200 ? u.output.slice(0, 200) + '…' : u.output}</div>}
                          </div>
                        );
                        if (u.type === 'combining') return <div key={i} style={{ color: '#fbbf24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}><GitMerge size={13} /> Combining with {u.combiner}</div>;
                        if (u.type === 'complete') return <div key={i} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '8px 12px', color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Workflow complete</div>;
                        if (u.type === 'error') return <div key={i} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={14} /> {u.error}</div>;
                        return null;
                      })}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Execution history (Bottom half) */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'rgba(5,10,20,0.3)' }}>
                <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em', marginBottom: 14 }}>EXECUTION HISTORY</div>
                {executions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>No executions yet. Run the workflow above!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {executions.map(ex => {
                      const isExp = expandedExecutions.has(ex.id);
                      const stColor = ex.status === 'completed' ? '#10b981' : ex.status === 'failed' ? '#ef4444' : '#00d4ff';
                      return (
                        <div key={ex.id} className="arc-card" style={{ border: `1px solid rgba(255,255,255,0.06)`, overflow: 'hidden' }}>
                          <div onClick={() => toggleExecution(ex.id)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <StatusIcon status={ex.status} />
                              <span style={{ fontWeight: 600, color: stColor, fontSize: '0.82rem', textTransform: 'capitalize', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>{ex.status}</span>
                              {ex.inputData && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.inputData}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}>{formatDate(ex.startedAt)}</span>
                              {isExp ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                            </div>
                          </div>
                          {isExp && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', background: 'rgba(0,0,0,0.2)' }}>
                              {ex.outputData && (
                                <div style={{ marginBottom: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(0,212,255,0.5)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>OUTPUT</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button onClick={() => handleCopy(ex.id, ex.outputData!)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copiedId === ex.id ? '#10b981' : 'rgba(0,212,255,0.6)', fontSize: '0.7rem', transition: 'color 0.2s' }}>
                                        {copiedId === ex.id ? <Check size={12} /> : <Copy size={12} />} {copiedId === ex.id ? 'COPIED' : 'COPY'}
                                      </button>
                                      <button onClick={() => handleDownload(ex.outputData!, `workflow_output_${ex.id}.txt`)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,212,255,0.6)', fontSize: '0.7rem', transition: 'color 0.2s' }}>
                                        <DownloadCloud size={12} /> DOWNLOAD
                                      </button>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 12px', maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono', lineHeight: 1.6 }}>{ex.outputData}</div>
                                </div>
                              )}
                              {ex.errorMessage && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '10px 12px', color: '#f87171', fontSize: '0.78rem' }}>{ex.errorMessage}</div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono' }}>
                                <span>Started: {formatDate(ex.startedAt)}</span>
                                {ex.completedAt && <span>Ended: {formatDate(ex.completedAt)}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
              <GitBranch size={52} style={{ color: 'rgba(0,212,255,0.15)' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Select a Workflow</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.18)' }}>Or create a new one from the buttons above</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
