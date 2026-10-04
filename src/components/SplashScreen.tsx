import React, { useEffect, useState } from 'react';
import { Navigation2, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onEnterApp: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterApp }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-between p-6 overflow-hidden select-none">
      {/* Background Neon Road & Particle Effect */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Perspective Road Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/80 to-slate-950" />
        
        {/* Glowing Horizon Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_20px_#00D2FF]" />

        {/* Speed Wind Lines Animation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-[800px] h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent -rotate-12 animate-pulse" />
          <div className="w-[600px] h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent rotate-6 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* Top Brand Tag */}
      <div className="relative z-10 pt-4 flex items-center gap-2">
        <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-blue-900/50 border border-blue-500/40 text-blue-300 shadow-md">
          Plataforma CURSUS
        </span>
      </div>

      {/* Centerpiece: Dynamic Moving Vehicle with Wind Trail */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-lg">
        {/* Animated vehicle symbol with wind stream */}
        <div className="relative mb-6">
          {/* Pulsing glow aura */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-lime-400 to-cyan-500 rounded-full blur-xl opacity-40 animate-pulse" />

          {/* Vehicle & Compass Badge */}
          <div className="relative w-28 h-28 rounded-3xl bg-slate-900 border-2 border-slate-700/80 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Speed Wind Streaks */}
            <div className="absolute top-4 -left-6 w-16 h-1 bg-cyan-400/70 rounded-full -rotate-45 animate-pulse" />
            <div className="absolute bottom-6 -right-4 w-12 h-1 bg-lime-400/80 rounded-full -rotate-45 animate-pulse" style={{ animationDelay: '0.2s' }} />

            <Navigation2 className="w-14 h-14 text-lime-400 transform rotate-45 drop-shadow-[0_0_15px_rgba(204,255,0,0.9)] animate-bounce" />
          </div>

          {/* Wind particles behind */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-80">
            <div className="w-1.5 h-6 rounded-full bg-cyan-400 animate-pulse" />
            <div className="w-1 h-8 rounded-full bg-lime-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1.5 h-5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Main Logo Text */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
          TÔ PASSANDO
        </h1>

        {/* Slogan */}
        <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-lime-300 via-cyan-200 to-white bg-clip-text text-transparent mt-2">
          “Você vai. A gente te guia.”
        </p>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-md leading-relaxed">
          GPS inteligente, colaborativo e multimodal para todo o Brasil. Rotas em tempo real, transporte público, segurança preventiva e alertas comunitários.
        </p>
      </div>

      {/* Bottom CTA Button */}
      <div className="relative z-10 pb-6 w-full max-w-sm flex flex-col items-center gap-3">
        <button
          onClick={onEnterApp}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-cyan-400 hover:from-lime-300 hover:to-cyan-300 text-slate-950 font-black text-sm tracking-wider shadow-2xl shadow-lime-500/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all group"
        >
          <span>ACESSAR GPS TÔ PASSANDO</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
          <span>Cobertura Nacional • 26 Estados + DF • Conforme LGPD</span>
        </div>
      </div>
    </div>
  );
};
