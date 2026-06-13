import React, { useState } from 'react';
import { X, Clock, Calendar, Zap, Bell, Check } from 'lucide-react';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: any) => void;
    initialSchedule?: any;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, initialSchedule }) => {
    const [active, setActive] = useState(initialSchedule?.active ?? true);
    const [type, setType] = useState(initialSchedule?.type ?? 'interval');
    const [interval, setInterval] = useState(initialSchedule?.interval ?? '1h');
    const [cron, setCron] = useState(initialSchedule?.cron ?? '0 * * * *');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ active, type, interval, cron });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.5)]" />

                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                            <Clock size={16} className="text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white/90 font-display">Schedule Pipeline</h3>
                            <p className="text-[10px] text-white/40 font-medium font-mono uppercase tracking-widest">Automate your workflows</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white/80 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Zap size={14} className={active ? "text-yellow-400" : "text-white/20"} />
                            <span className="text-xs font-bold text-white/80">Active Schedule</span>
                        </div>
                        <button
                            onClick={() => setActive(!active)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-violet-500' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Trigger Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setType('interval')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${type === 'interval' ? 'bg-violet-500/10 border-violet-500/40 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                            >
                                <Clock size={18} />
                                <span className="text-[11px] font-bold">Interval</span>
                            </button>
                            <button
                                onClick={() => setType('cron')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${type === 'cron' ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                            >
                                <Calendar size={18} />
                                <span className="text-[11px] font-bold">Cron Expression</span>
                            </button>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {type === 'interval' ? (
                            <>
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Every</label>
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 focus:outline-none focus:border-violet-500/40 appearance-none font-mono"
                                >
                                    <option value="1m">1 Minute</option>
                                    <option value="5m">5 Minutes</option>
                                    <option value="15m">15 Minutes</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="12h">12 Hours</option>
                                    <option value="1d">Daily</option>
                                </select>
                            </>
                        ) : (
                            <>
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Cron Expression</label>
                                <input
                                    type="text"
                                    value={cron}
                                    onChange={(e) => setCron(e.target.value)}
                                    placeholder="0 * * * *"
                                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 font-mono focus:outline-none focus:border-[#00d4ff]/40"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setCron('0 0 * * *')} className="px-2 py-1 text-[9px] border border-white/10 rounded bg-white/5 text-white/50 hover:bg-[#00d4ff]/10 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 transition-colors">Daily (Midnight)</button>
                                    <button onClick={() => setCron('0 0 * * 1-5')} className="px-2 py-1 text-[9px] border border-white/10 rounded bg-white/5 text-white/50 hover:bg-[#00d4ff]/10 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 transition-colors">Weekdays</button>
                                    <button onClick={() => setCron('0 * * * *')} className="px-2 py-1 text-[9px] border border-white/10 rounded bg-white/5 text-white/50 hover:bg-[#00d4ff]/10 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 transition-colors">Hourly</button>
                                </div>
                                <p className="text-[10px] text-white/30 px-1 font-medium mt-1">Standard format: min hour day month weekday</p>
                            </>
                        )}
                    </div>

                    {/* Simulation Helper */}
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                        <Bell size={14} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                            <span className="block text-[10px] font-bold text-yellow-300/80 mb-1 tracking-wider uppercase underline decoration-yellow-500/30">Upcoming Execution</span>
                            <p className="text-[11px] text-white/50 leading-relaxed font-medium capitalize">
                                {type === 'interval' ? `Every ${interval.replace('m', ' minutes').replace('h', ' hours').replace('d', ' day')}` : `Cron: ${cron}`}
                                <span className="text-white/20 mx-1.5">•</span>
                                Starting from next trigger
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 rounded-xl text-[11px] font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 active:scale-[0.98] transition-all"
                    >
                        <Check size={14} /> Commit Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
