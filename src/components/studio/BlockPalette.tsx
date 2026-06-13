import React from 'react';
import {
    FileText, FileUp, Table2, Map, BarChart2, BookOpen,
    Brain, Code2, Terminal, Shuffle, FileOutput, Download, FileSpreadsheet,
    Image, Globe, Database, UserCheck, TrendingUp, Sparkles, ShieldCheck, History,
    CheckSquare, GitBranch,
} from 'lucide-react';

interface BlockDef {
    type: string;
    label: string;
    icon: React.ReactNode;
    category: 'input' | 'agent' | 'utility' | 'output';
    description: string;
}

const BLOCKS: BlockDef[] = [
    // Inputs
    { type: 'inputText', label: 'Text Input', icon: <FileText size={14} />, category: 'input', description: 'Raw text entry' },
    { type: 'inputPdf', label: 'PDF Input', icon: <FileUp size={14} />, category: 'input', description: 'Upload & extract PDF' },
    { type: 'inputExcel', label: 'CSV / Excel', icon: <Table2 size={14} />, category: 'input', description: 'Upload CSV or Excel' },
    // Agents
    { type: 'planner', label: 'Planner', icon: <Map size={14} />, category: 'agent', description: 'Break goal into steps' },
    { type: 'analyst', label: 'Analyst', icon: <BarChart2 size={14} />, category: 'agent', description: 'Evaluate & give insights' },
    { type: 'memory', label: 'Memory', icon: <BookOpen size={14} />, category: 'agent', description: 'Recall & summarise context' },
    { type: 'reasoner', label: 'Reasoner', icon: <Brain size={14} />, category: 'agent', description: 'Logical step-by-step thinking' },
    { type: 'coder', label: 'Coder', icon: <Code2 size={14} />, category: 'agent', description: 'AI code generation' },
    { type: 'vision', label: 'Vision', icon: <Image size={14} />, category: 'agent', description: 'See & describe images' },
    { type: 'search', label: 'Web Search', icon: <Globe size={14} />, category: 'agent', description: 'Fetch real-time info' },
    { type: 'sqlAgent', label: 'SQL Agent', icon: <Database size={14} />, category: 'agent', description: 'Query DB or CSV data' },
    { type: 'chameleon', label: 'Chameleon', icon: <UserCheck size={14} />, category: 'agent', description: 'Adopts any persona' },
    { type: 'oracle', label: 'Oracle', icon: <TrendingUp size={14} />, category: 'agent', description: 'Trend forecasting' },
    { type: 'alchemist', label: 'Alchemist', icon: <Sparkles size={14} />, category: 'agent', description: 'Format conversion' },
    { type: 'sentinel', label: 'Sentinel', icon: <ShieldCheck size={14} />, category: 'agent', description: 'Audit & Guardrails' },
    { type: 'chronicler', label: 'Chronicler', icon: <History size={14} />, category: 'agent', description: 'Long-term RAG memory' },
    // Utility
    { type: 'execution', label: 'Run Code', icon: <Terminal size={14} />, category: 'utility', description: 'Execute code in sandbox' },
    { type: 'transform', label: 'Transform', icon: <Shuffle size={14} />, category: 'utility', description: 'Text transform operation' },
    { type: 'validator', label: 'Validator', icon: <CheckSquare size={14} />, category: 'utility', description: 'JSON/Regex validation' },
    { type: 'branch', label: 'Branch (IF)', icon: <GitBranch size={14} />, category: 'utility', description: 'Conditional routing' },
    // Outputs
    { type: 'outputText', label: 'Output Text', icon: <FileOutput size={14} />, category: 'output', description: 'Display final result' },
    { type: 'outputPdf', label: 'Export PDF', icon: <Download size={14} />, category: 'output', description: 'Download as PDF' },
    { type: 'outputExcel', label: 'Export CSV', icon: <FileSpreadsheet size={14} />, category: 'output', description: 'Download as CSV / Excel' },
];

const CATEGORY_META = {
    input: { label: 'Inputs', color: 'text-blue-400', dot: 'bg-blue-400' },
    agent: { label: 'Agents', color: 'text-purple-400', dot: 'bg-purple-400' },
    utility: { label: 'Utility', color: 'text-orange-400', dot: 'bg-orange-400' },
    output: { label: 'Outputs', color: 'text-green-400', dot: 'bg-green-400' },
};

interface BlockPaletteProps {
    onDragStart: (event: React.DragEvent, type: string) => void;
}

export default function BlockPalette({ onDragStart }: BlockPaletteProps) {
    const grouped = (Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(cat => ({
        category: cat,
        meta: CATEGORY_META[cat],
        blocks: BLOCKS.filter(b => b.category === cat),
    }));

    return (
        <div className="w-56 flex-shrink-0 bg-black/60 border-r border-white/5 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold">Block Palette</p>
                <p className="text-[10px] text-white/20 mt-0.5">Drag blocks onto canvas</p>
            </div>

            <div className="flex-1 p-3 space-y-4">
                {grouped.map(({ category, meta, blocks }) => (
                    <div key={category}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w - 1.5 h - 1.5 rounded - full ${meta.dot} `} />
                            <span className={`text - [9px] uppercase tracking - widest font - bold ${meta.color} `}>{meta.label}</span>
                        </div>
                        <div className="space-y-1">
                            {blocks.map(block => (
                                <div
                                    key={block.type}
                                    draggable
                                    onDragStart={e => onDragStart(e, block.type)}
                                    className="
                    flex items-center gap-2.5 px-2.5 py-2 rounded-xl
                    bg-white/[0.03] border border-white/5
                    hover:bg-white/[0.07] hover:border-white/10
                    cursor-grab active:cursor-grabbing
                    transition-all duration-150 group
                  "
                                >
                                    <span className={`${meta.color} group - hover: scale - 110 transition - transform`}>
                                        {block.icon}
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-bold text-white/70">{block.label}</p>
                                        <p className="text-[9px] text-white/25">{block.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
