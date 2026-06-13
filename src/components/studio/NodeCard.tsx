import { Handle, Position } from '@xyflow/react';
import { Trash2, Copy } from 'lucide-react';

// ─── Colour tokens per block category ────────────────
export const COLOR: Record<string, { border: string; glow: string; icon: string; badge: string }> = {
    input: { border: 'border-blue-500/40', glow: 'shadow-blue-500/20', icon: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    agent: { border: 'border-purple-500/40', glow: 'shadow-purple-500/20', icon: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
    utility: { border: 'border-orange-500/40', glow: 'shadow-orange-500/20', icon: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
    output: { border: 'border-green-500/40', glow: 'shadow-green-500/20', icon: 'text-green-400', badge: 'bg-green-500/20 text-green-300' },
};

// ─── Shared NodeCard wrapper ──────────────────────────
interface NodeCardProps {
    category: 'input' | 'agent' | 'utility' | 'output';
    icon: React.ReactNode;
    label: string;
    badge?: string;
    selected: boolean;
    running?: boolean;
    result?: string;
    error?: string;
    children?: React.ReactNode;
    hasInput?: boolean;
    hasOutput?: boolean;
    onDelete?: () => void;
    onCopy?: () => void;
}

export function NodeCard({
    category, icon, label, badge, selected, running, result, error, children,
    hasInput = true, hasOutput = true, onDelete, onCopy,
}: NodeCardProps) {
    const c = COLOR[category];
    return (
        <div
            className={`
        relative w-[260px] rounded-2xl border backdrop-blur-xl bg-black/70 group
        ${c.border} ${selected ? `shadow-lg ${c.glow}` : ''}
        transition-all duration-200 text-white text-xs font-mono
      `}
        >
            {/* Input Handle */}
            {hasInput && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-3 !h-3 !rounded-full !border-2 !border-white/30 !bg-black"
                />
            )}

            {/* Header */}
            <div className={`flex items-center gap-2 px-3 py-2 border-b ${c.border}`}>
                <span className={c.icon}>{icon}</span>
                <span className="font-bold tracking-wide text-white/90 uppercase text-[10px]">{label}</span>
                {badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.badge}`}>
                        {badge}
                    </span>
                )}
                {running && (
                    <span className="flex items-center gap-1 text-yellow-400 text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        running
                    </span>
                )}

                {/* Node Actions */}
                <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCopy?.(); }}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
                        title="Duplicate"
                    >
                        <Copy size={11} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                        className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {children}

                {/* Result display */}
                {result && (
                    <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 max-h-32 overflow-y-auto relative group/result">
                        <p className="text-[10px] text-green-300 font-mono whitespace-pre-wrap break-words pr-6">{result}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(result);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-green-400 transition-colors opacity-30 group-hover/result:opacity-100"
                            title="Copy to clipboard"
                        >
                            <Copy size={10} />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                        <p className="text-[10px] text-red-400 font-mono whitespace-pre-wrap break-words">{error}</p>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            {hasOutput && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !rounded-full !border-2 !border-white/30 !bg-black"
                />
            )}
        </div>
    );
}

// ─── Small shared textarea/input styles ──────────────
export const inputCls = `
  w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5
  text-[11px] text-white/80 placeholder-white/20
  focus:outline-none focus:border-white/30 resize-none
`;

export const labelCls = 'text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1';
