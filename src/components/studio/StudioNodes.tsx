/**
 * All 12 Studio Block Node Components
 * Input (3) · Agent (7) · Utility (2) · Output (2)
 */
import React from 'react';
import { NodeProps } from '@xyflow/react';
import {
    FileText, FileUp, Table2, Map, Zap, BarChart2, BookOpen,
    Wrench, Brain, Code2, Terminal, Shuffle, FileOutput, Download, FileSpreadsheet,
    Image, Globe, Database, UserCheck, TrendingUp, Sparkles, ShieldCheck, History,
    CheckSquare, GitBranch, Copy,
} from 'lucide-react';
import { NodeCard, inputCls, labelCls } from './NodeCard';
import { jsPDF } from 'jspdf';

// ─── Helpers ──────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className={labelCls}>{label}</p>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────
//  INPUT NODES
// ─────────────────────────────────────────────────────

export function InputTextNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="input" icon={<FileText size={14} />} label="Input · Text" badge="IN"
            selected={!!selected} running={d.running} result={d.result} error={d.error} hasInput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Text Input">
                <textarea
                    className={inputCls}
                    rows={4}
                    placeholder="Enter text here…"
                    value={d.text || ''}
                    onChange={e => d.onChange?.('text', e.target.value)}
                />
            </Field>
        </NodeCard>
    );
}

export function InputPdfNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="input" icon={<FileUp size={14} />} label="Input · PDF" badge="IN"
            selected={!!selected} running={d.running} result={d.result} error={d.error} hasInput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Upload PDF">
                <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-blue-400/50 transition-colors">
                    <FileUp size={16} className="text-white/30 mb-1" />
                    <span className="text-[10px] text-white/30">
                        {d.fileName || 'Drop PDF or click'}
                    </span>
                    <input type="file" accept=".pdf" className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                d.onChange?.('file', file);
                                d.onChange?.('fileName', file.name);
                            }
                        }} />
                </label>
            </Field>
        </NodeCard>
    );
}

export function InputExcelNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="input" icon={<Table2 size={14} />} label="Input · Excel/CSV" badge="IN"
            selected={!!selected} running={d.running} result={d.result} error={d.error} hasInput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Upload CSV / Excel">
                <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-blue-400/50 transition-colors">
                    <Table2 size={16} className="text-white/30 mb-1" />
                    <span className="text-[10px] text-white/30">
                        {d.fileName || 'Drop CSV/XLSX or click'}
                    </span>
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                d.onChange?.('file', file);
                                d.onChange?.('fileName', file.name);
                            }
                        }} />
                </label>
            </Field>
        </NodeCard>
    );
}

// ─────────────────────────────────────────────────────
//  AGENT NODES  (all 7)
// ─────────────────────────────────────────────────────

function AgentNode({
    data, selected, icon, label, agentType, promptLabel, promptPlaceholder, extraFields,
}: NodeProps & {
    icon: React.ReactNode;
    label: string;
    agentType: string;
    promptLabel: string;
    promptPlaceholder: string;
    extraFields?: React.ReactNode;
}) {
    const d = data as any;
    return (
        <NodeCard category="agent" icon={icon} label={label} badge={agentType.toUpperCase()}
            selected={!!selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label={promptLabel}>
                <textarea
                    className={inputCls}
                    rows={3}
                    placeholder={promptPlaceholder}
                    value={d.prompt || ''}
                    onChange={e => d.onChange?.('prompt', e.target.value)}
                />
            </Field>
            {extraFields}
            <Field label="System Prompt (optional override)">
                <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="Leave blank to use default agent system prompt…"
                    value={d.systemPrompt || ''}
                    onChange={e => d.onChange?.('systemPrompt', e.target.value)}
                />
            </Field>
        </NodeCard>
    );
}

export function PlannerNode(props: NodeProps) {
    return <AgentNode {...props} icon={<Map size={14} />} label="Planner Agent" agentType="planner"
        promptLabel="Goal / Objective"
        promptPlaceholder="Describe the goal to break into steps… (e.g. 'Build a REST API for user auth')" />;
}

export function ExecutorNode(props: NodeProps) {
    return <AgentNode {...props} icon={<Zap size={14} />} label="Executor Agent" agentType="executor"
        promptLabel="Task / Instruction"
        promptPlaceholder="Give a concrete task to execute… (e.g. 'Write unit tests for the login module')" />;
}

export function AnalystNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<BarChart2 size={14} />} label="Analyst Agent" agentType="analyst"
        promptLabel="Content to Analyse"
        promptPlaceholder="Paste text, data, or results to evaluate…"
        extraFields={
            <Field label="Analysis Focus (optional)">
                <input className={inputCls} placeholder="e.g. quality, gaps, sentiment…"
                    value={d.focus || ''}
                    onChange={e => d.onChange?.('focus', e.target.value)} />
            </Field>
        } />;
}

export function MemoryNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<BookOpen size={14} />} label="Memory Agent" agentType="memory"
        promptLabel="Context / Chat to Summarize"
        promptPlaceholder="Paste conversation or context to summarize and recall…"
        extraFields={
            <Field label="Recall Query (optional)">
                <input className={inputCls} placeholder="What to recall? e.g. 'key decisions'"
                    value={d.query || ''}
                    onChange={e => d.onChange?.('query', e.target.value)} />
            </Field>
        } />;
}

export function ToolNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<Wrench size={14} />} label="Tool Agent" agentType="tool"
        promptLabel="Task / API Description"
        promptPlaceholder="Describe the tool task, API call, or data transformation…"
        extraFields={
            <Field label="Endpoint / Context (optional)">
                <input className={inputCls} placeholder="e.g. GET https://api.example.com/data"
                    value={d.endpoint || ''}
                    onChange={e => d.onChange?.('endpoint', e.target.value)} />
            </Field>
        } />;
}

export function ReasonerNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<Brain size={14} />} label="Reasoner Agent" agentType="reasoner"
        promptLabel="Problem / Question"
        promptPlaceholder="State the problem to reason through step-by-step…"
        extraFields={
            <Field label="Constraints (optional)">
                <input className={inputCls} placeholder="e.g. 'no external libraries', 'under 100ms'"
                    value={d.constraints || ''}
                    onChange={e => d.onChange?.('constraints', e.target.value)} />
            </Field>
        } />;
}

export function CoderNode(props: NodeProps) {
    const d = props.data as any;
    return (
        <NodeCard category="agent" icon={<Code2 size={14} />} label="Coder Agent" badge="CODER"
            selected={!!props.selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Code Requirement">
                <textarea className={inputCls} rows={3}
                    placeholder="Describe what code to generate…"
                    value={d.prompt || ''}
                    onChange={e => d.onChange?.('prompt', e.target.value)} />
            </Field>
            <Field label="Language Hint">
                <select className={inputCls} value={d.language || ''}
                    onChange={e => d.onChange?.('language', e.target.value)}>
                    <option value="">Auto-detect</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                </select>
            </Field>
        </NodeCard>
    );
}

// ─── PHASE 2 AGENT NODES ─────────────────────────────

export function VisionNode(props: NodeProps) {
    const d = props.data as any;
    return (
        <NodeCard category="agent" icon={<Image size={14} />} label="Vision Agent" badge="VISION"
            selected={!!props.selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Vision Prompt">
                <textarea className={inputCls} rows={3} placeholder="Describe what to look for in the image…"
                    value={d.prompt || ''} onChange={e => d.onChange?.('prompt', e.target.value)} />
            </Field>
            <Field label="Upload Image">
                <label className="flex flex-col items-center justify-center w-full h-12 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-400/50 transition-colors">
                    <Image size={14} className="text-white/30 mb-1" />
                    <span className="text-[10px] text-white/30">{d.fileName || 'Drop image or click'}</span>
                    <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                d.onChange?.('file', file);
                                d.onChange?.('fileName', file.name);
                            }
                        }} />
                </label>
            </Field>
        </NodeCard>
    );
}

export function SearchNode(props: NodeProps) {
    return <AgentNode {...props} icon={<Globe size={14} />} label="Search Agent" agentType="search"
        promptLabel="Web Search Query" promptPlaceholder="What should I search the web for?" />;
}

export function SqlNode(props: NodeProps) {
    const d = props.data as any;
    return (
        <NodeCard category="agent" icon={<Database size={14} />} label="SQL Agent" badge="SQL"
            selected={!!props.selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="SQL Query / Goal">
                <textarea className={inputCls} rows={3} placeholder="e.g. 'Show top 10 users by points'"
                    value={d.prompt || ''} onChange={e => d.onChange?.('prompt', e.target.value)} />
            </Field>
            <Field label="Connection (optional)">
                <input className={inputCls} placeholder="e.g. SQLite, PostgreSQL..."
                    value={d.connection || ''} onChange={e => d.onChange?.('connection', e.target.value)} />
            </Field>
        </NodeCard>
    );
}

export function ChameleonNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<UserCheck size={14} />} label="Chameleon (Persona)" agentType="chameleon"
        promptLabel="Task" promptPlaceholder="Ask the persona to do something…"
        extraFields={
            <Field label="Persona / Role">
                <input className={inputCls} placeholder="e.g. 'Senior Lawyer', 'Pirate', 'Linux Gov'"
                    value={d.persona || ''} onChange={e => d.onChange?.('persona', e.target.value)} />
            </Field>
        } />;
}

export function OracleNode(props: NodeProps) {
    return <AgentNode {...props} icon={<TrendingUp size={14} />} label="Oracle (Forecaster)" agentType="oracle"
        promptLabel="Trend to Forecast" promptPlaceholder="Describe the data or trend to predict…" />;
}

export function AlchemistNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<Sparkles size={14} />} label="Alchemist (Format)" agentType="alchemist"
        promptLabel="Transformation Goal" promptPlaceholder="e.g. 'Convert this SVG to a React component'"
        extraFields={
            <Field label="Target Format">
                <input className={inputCls} placeholder="e.g. 'HTML', 'Markdown', 'JSON'"
                    value={d.format || ''} onChange={e => d.onChange?.('format', e.target.value)} />
            </Field>
        } />;
}

export function SentinelNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<ShieldCheck size={14} />} label="Sentinel (Guard)" agentType="sentinel"
        promptLabel="Content to Audit" promptPlaceholder="Paste text or code to check for safety…"
        extraFields={
            <Field label="Audit Rules">
                <input className={inputCls} placeholder="e.g. 'No PII', 'No SQL injection'"
                    value={d.rules || ''} onChange={e => d.onChange?.('rules', e.target.value)} />
            </Field>
        } />;
}

export function ChroniclerNode(props: NodeProps) {
    const d = props.data as any;
    return <AgentNode {...props} icon={<History size={14} />} label="Chronicler (RAG)" agentType="chronicler"
        promptLabel="Query / Fact to Store" promptPlaceholder="Search history or store a new fact…"
        extraFields={
            <Field label="Collection / Namespace">
                <input className={inputCls} placeholder="e.g. 'Project Alpha'"
                    value={d.namespace || ''} onChange={e => d.onChange?.('namespace', e.target.value)} />
            </Field>
        } />;
}

// ─────────────────────────────────────────────────────
//  UTILITY NODES
// ─────────────────────────────────────────────────────

export function ExecutionNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="utility" icon={<Terminal size={14} />} label="Code Execution" badge="RUN"
            selected={!!selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Language">
                <select className={inputCls} value={d.language || 'python'}
                    onChange={e => d.onChange?.('language', e.target.value)}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                </select>
            </Field>
            <Field label="Code">
                <textarea className={`${inputCls} font-mono`} rows={5}
                    placeholder="Paste code here, or wire from Coder Agent output…"
                    value={d.code || ''}
                    onChange={e => d.onChange?.('code', e.target.value)} />
                {!d.code && d.executedCode && (
                    <div className="mt-2 text-[9px] text-white/20 italic">
                        <p className="mb-1 uppercase tracking-tighter opacity-50">Incoming Code Executed:</p>
                        <pre className="p-1 px-2 border border-white/5 bg-white/5 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {d.executedCode}
                        </pre>
                    </div>
                )}
            </Field>
        </NodeCard>
    );
}

export function TransformNode({ data, selected }: NodeProps) {
    const d = data as any;
    const transforms = ['Pass-through', 'Trim whitespace', 'Uppercase', 'Lowercase', 'JSON parse', 'Extract first line'];
    return (
        <NodeCard category="utility" icon={<Shuffle size={14} />} label="Transform" badge="UTIL"
            selected={!!selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Transform Operation">
                <select className={inputCls} value={d.transform || 'Pass-through'}
                    onChange={e => d.onChange?.('transform', e.target.value)}>
                    {transforms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </Field>
            <Field label="Custom regex (optional)">
                <input className={inputCls} placeholder="e.g. /^##\s+/gm"
                    value={d.regex || ''}
                    onChange={e => d.onChange?.('regex', e.target.value)} />
            </Field>
        </NodeCard>
    );
}

export function ValidatorNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="utility" icon={<CheckSquare size={14} />} label="Validator" badge="VAL"
            selected={!!selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Validation Type">
                <select className={inputCls} value={d.validationType || 'JSON Schema'}
                    onChange={e => d.onChange?.('validationType', e.target.value)}>
                    <option value="JSON Schema">JSON Schema</option>
                    <option value="Regex">Regex</option>
                    <option value="Word Count">Word Count</option>
                </select>
            </Field>
            <Field label="Schema / Rules">
                <textarea className={inputCls} rows={4} placeholder='e.g. { "type": "object" }'
                    value={d.rules || ''} onChange={e => d.onChange?.('rules', e.target.value)} />
            </Field>
        </NodeCard>
    );
}

export function BranchNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="utility" icon={<GitBranch size={14} />} label="Logic Branch" badge="IF"
            selected={!!selected} running={d.running} result={d.result} error={d.error}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Condition (JS)">
                <input className={inputCls} placeholder="e.g. input.length > 10"
                    value={d.condition || ''} onChange={e => d.onChange?.('condition', e.target.value)} />
            </Field>
            <div className="flex gap-2 text-[10px]">
                <div className="flex-1 p-1 bg-green-500/10 rounded border border-green-500/20 text-green-400 text-center">TRUE</div>
                <div className="flex-1 p-1 bg-red-500/10 rounded border border-red-500/20 text-red-400 text-center">FALSE</div>
            </div>
            <p className="text-[9px] text-white/30 italic mt-1">* Note: Simple branching for Phase 2</p>
        </NodeCard>
    );
}

// ─────────────────────────────────────────────────────
//  OUTPUT NODES
// ─────────────────────────────────────────────────────

export function OutputTextNode({ data, selected }: NodeProps) {
    const d = data as any;

    const exportText = () => {
        const text = d.result || '';
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arcane_output_${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        if (d.result) {
            navigator.clipboard.writeText(d.result);
        }
    };

    return (
        <NodeCard category="output" icon={<FileOutput size={14} />} label="Output · Text" badge="OUT"
            selected={!!selected} running={d.running} hasOutput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Result">
                <div className="w-full min-h-[60px] bg-white/5 border border-white/10 rounded-lg p-2 mb-2 overflow-y-auto max-h-40 relative group/out">
                    {d.result
                        ? <pre className="text-[10px] text-green-300 font-mono whitespace-pre-wrap break-words pr-6">{d.result}</pre>
                        : <span className="text-[10px] text-white/20">Waiting for input…</span>
                    }
                    {d.result && (
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-green-400 transition-colors opacity-0 group-hover/out:opacity-100"
                        >
                            <Copy size={10} />
                        </button>
                    )}
                </div>
                {d.result && (
                    <button
                        onClick={exportText}
                        className="w-full py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                    >
                        Download as Text
                    </button>
                )}
            </Field>
        </NodeCard>
    );
}

export function OutputPdfNode({ data, selected }: NodeProps) {
    const d = data as any;

    const exportPdf = () => {
        const text = d.result || d.text || '';
        if (!text) return;
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 10, 10);
        doc.save(`arcane_output_${new Date().getTime()}.pdf`);
    };

    const exportText = () => {
        const text = d.result || d.text || '';
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arcane_output_${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <NodeCard category="output" icon={<Download size={14} />} label="Output · PDF" badge="OUT"
            selected={!!selected} running={d.running} hasOutput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Export as PDF">
                <div className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-lg p-2 mb-2">
                    {d.result
                        ? <pre className="text-[10px] text-green-300 whitespace-pre-wrap break-words line-clamp-3">{d.result}</pre>
                        : <span className="text-[10px] text-white/20">Waiting for input…</span>
                    }
                </div>
                <div className="flex flex-col gap-2 mt-2">
                    <button
                        disabled={!d.result}
                        onClick={exportPdf}
                        className="w-full py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Download PDF
                    </button>
                    <button
                        disabled={!d.result}
                        onClick={exportText}
                        className="w-full py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Download Text
                    </button>
                </div>
            </Field>
        </NodeCard>
    );
}

export function OutputExcelNode({ data, selected }: NodeProps) {
    const d = data as any;
    return (
        <NodeCard category="output" icon={<FileSpreadsheet size={14} />} label="Output · Excel" badge="OUT"
            selected={!!selected} running={d.running} hasOutput={false}
            onDelete={d.onDelete} onCopy={d.onCopy}>
            <Field label="Export as CSV">
                <div className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-lg p-2 mb-2">
                    {d.result
                        ? <pre className="text-[10px] text-green-300 whitespace-pre-wrap break-words line-clamp-3">{d.result}</pre>
                        : <span className="text-[10px] text-white/20">Waiting for input…</span>
                    }
                </div>
                <button
                    disabled={!d.result}
                    onClick={() => d.onExportCsv?.()}
                    className="w-full py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Download CSV
                </button>
            </Field>
        </NodeCard>
    );
}

// ─── Node type registry for React Flow ───────────────
export const nodeTypes = {
    inputText: InputTextNode,
    inputPdf: InputPdfNode,
    inputExcel: InputExcelNode,
    planner: PlannerNode,
    executor: ExecutorNode,
    analyst: AnalystNode,
    memory: MemoryNode,
    tool: ToolNode,
    reasoner: ReasonerNode,
    coder: CoderNode,
    execution: ExecutionNode,
    transform: TransformNode,
    outputText: OutputTextNode,
    outputPdf: OutputPdfNode,
    outputExcel: OutputExcelNode,
    vision: VisionNode,
    search: SearchNode,
    sqlAgent: SqlNode,
    chameleon: ChameleonNode,
    oracle: OracleNode,
    alchemist: AlchemistNode,
    sentinel: SentinelNode,
    chronicler: ChroniclerNode,
    validator: ValidatorNode,
    branch: BranchNode,
};
