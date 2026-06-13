import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, ShieldCheck, History } from 'lucide-react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(onComplete, 800);
                    return 100;
                }
                return prev + 2;
            });
        }, 40);

        const stageTimer = setInterval(() => {
            setStage(s => (s < 3 ? s + 1 : s));
        }, 800);

        return () => {
            clearInterval(timer);
            clearInterval(stageTimer);
        };
    }, [onComplete]);

    const stages = [
        { text: "Initializing Core...", icon: <Zap size={16} className="text-blue-400" /> },
        { text: "Syncing Agents...", icon: <Sparkles size={16} className="text-pink-400" /> },
        { text: "Securing Channels...", icon: <ShieldCheck size={16} className="text-green-400" /> },
        { text: "Bending Reality...", icon: <History size={16} className="text-purple-400" /> },
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-[#020409] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />

            <div className="relative flex flex-col items-center gap-8">
                {/* Logo Section */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pink-500 blur-2xl opacity-20 animate-pulse" />
                        <h1 className="text-6xl font-black tracking-[0.4em] text-white/90 uppercase drop-shadow-2xl">
                            Arcane
                        </h1>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent mt-2" />
                    <p className="text-[10px] font-bold tracking-[0.5em] text-pink-400/60 uppercase mt-4">
                        Multi-Agent Neural Architecture
                    </p>
                </div>

                {/* Loading Content */}
                <div className="flex flex-col items-center min-w-[200px]">
                    <div className="flex items-center gap-3 h-6 mb-4">
                        <div className="animate-spin duration-700">
                            {stages[stage].icon}
                        </div>
                        <span className="text-xs font-mono text-white/40 uppercase tracking-widest animate-pulse">
                            {stages[stage].text}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500/80 via-pink-500/80 to-purple-500/80 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between w-full px-1">
                        <span className="text-[10px] font-mono text-white/20">{progress}%</span>
                        <span className="text-[10px] font-mono text-white/20">VER. 0.1.0-ALPHA</span>
                    </div>
                </div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            {/* Bottom Text */}
            <div className="absolute bottom-12 flex flex-col items-center gap-1">
                <div className="flex gap-4 opacity-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
