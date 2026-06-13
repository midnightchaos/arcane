import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Clock, Layers } from 'lucide-react';
import studioService, { PipelineInfo } from '../../services/studioService';

interface Props {
    onLoad: (id: string) => void;
    onClose: () => void;
}

export default function SavedPipelinesModal({ onLoad, onClose }: Props) {
    const [pipelines, setPipelines] = useState<PipelineInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [viewingLogsFor, setViewingLogsFor] = useState<string | null>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [selectedRunContent, setSelectedRunContent] = useState<string | null>(null);

    useEffect(() => {
        studioService.listPipelines()
            .then(setPipelines)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleting(id);
        try {
            await studioService.deletePipeline(id);
            setPipelines(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(null);
        }
    };

    const handleViewLogs = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setViewingLogsFor(id);
        setLoadingLogs(true);
        try {
            const data = await studioService.getPipelineRuns(id);
            setRuns(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleViewRunContent = async (filename: string) => {
        if (!viewingLogsFor) return;
        try {
            const data = await studioService.getRunContent(viewingLogsFor, filename);
            setSelectedRunContent(data.content);
        } catch (err) {
            console.error(err);
        }
    };

    if (selectedRunContent !== null) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-4xl max-h-[80vh] flex flex-col bg-[#0a0a0f] border border-[#00d4ff]/30 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-[#00d4ff]" />
                            <h2 className="text-sm font-bold text-white/90">Execution Log</h2>
                        </div>
                        <button onClick={() => setSelectedRunContent(null)} className="text-white/30 hover:text-white/70">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-[#020409]">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{selectedRunContent}</pre>
                    </div>
                </div>
            </div>
        );
    }

    if (viewingLogsFor) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="w-[520px] max-h-[70vh] flex flex-col bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-violet-400" />
                            <h2 className="text-sm font-bold text-white/90 tracking-wide">Headless Runs</h2>
                        </div>
                        <button onClick={() => { setViewingLogsFor(null); setRuns([]); }} className="text-white/30 hover:text-white/70">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loadingLogs ? (
                            <div className="flex justify-center p-6"><div className="w-5 h-5 border-2 border-violet-500/50 border-t-violet-500 rounded-full animate-spin" /></div>
                        ) : runs.length === 0 ? (
                            <div className="text-center text-white/30 p-6 text-xs">No runs found for this pipeline.</div>
                        ) : (
                            runs.map(run => (
                                <div key={run.filename} onClick={() => handleViewRunContent(run.filename)} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-white/80 font-mono">{new Date(run.timestamp).toLocaleString()}</span>
                                        <span className="text-[10px] text-white/40">{run.filename}</span>
                                    </div>
                                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded">{Math.round(run.size / 1024)} KB</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[520px] max-h-[70vh] flex flex-col bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <FolderOpen size={16} className="text-pink-400" />
                        <h2 className="text-sm font-bold text-white/90 tracking-wide">Saved Pipelines</h2>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && (
                        <div className="flex items-center justify-center h-24">
                            <div className="w-5 h-5 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
                        </div>
                    )}
                    {!loading && pipelines.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-24 gap-2 text-white/20">
                            <Layers size={24} />
                            <p className="text-xs">No saved pipelines yet</p>
                        </div>
                    )}
                    {pipelines.map(p => (
                        <div
                            key={p.id}
                            onClick={() => { onLoad(p.id); onClose(); }}
                            className="
                flex items-center gap-4 p-4 rounded-xl border border-white/5
                bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10
                cursor-pointer transition-all group
              "
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-white/80 truncate">
                                        {p.name.startsWith('[Template]') ? p.name.replace('[Template] ', '') : p.name}
                                    </p>
                                    {p.name.startsWith('[Template]') && (
                                        <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[8px] font-bold uppercase tracking-widest border border-pink-500/30">
                                            Template
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/30 mt-0.5">{p.description || 'No description'}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[9px] text-white/25">
                                        <Layers size={10} /> {p.nodeCount} nodes
                                    </span>
                                    {!p.name.startsWith('[Template]') && (
                                        <span className="flex items-center gap-1 text-[9px] text-white/25">
                                            <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {p.hasSchedule && (
                                    <button
                                        onClick={e => handleViewLogs(p.id, e)}
                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-[10px] hover:bg-violet-500/40 transition-all border border-violet-500/30"
                                    >
                                        Logs
                                    </button>
                                )}
                                {!p.name.startsWith('[Template]') && (
                                    <button
                                        onClick={e => handleDelete(p.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all ml-2"
                                    >
                                        {deleting === p.id
                                            ? <div className="w-4 h-4 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                                            : <Trash2 size={14} />
                                        }
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
