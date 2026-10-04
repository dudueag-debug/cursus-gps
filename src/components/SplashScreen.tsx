import React, { useEffect, useState } from 'react';
import { Navigation2, ArrowRight, ShieldCheck, MapPin, Sparkles, Radio } from 'lucide-react';

interface SplashScreenProps {
  onEnterApp: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterApp }) => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState('Iniciando sensores do GPS...');

  useEffect(() => {
    // Smooth loading progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2.5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onEnterApp();
          }, 450);
          return 100;
        }

        if (next < 25) {
          setLoadingPhase('Conectando à rede de satélites GPS...');
        } else if (next < 55) {
          setLoadingPhase('Carregando mapa multimodal do Brasil...');
        } else if (next < 80) {
          setLoadingPhase('Sincronizando alertas da via e radares em tempo real...');
        } else {
          setLoadingPhase('TÔ PASSANDO calibrado. Boa viagem!');
        }

        return next;
      });
    }, 55);

    return () => clearInterval(interval);
  }, [onEnterApp]);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-between p-6 overflow-hidden select-none">
      {/* Background Cyber Horizon & Perspective Highway */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950/80 to-slate-950" />
        
        {/* Glowing Horizon Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_25px_#00D2FF]" />

        {/* Perspective Highway Surface */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-900/40 to-slate-950 flex justify-center overflow-hidden [perspective:500px]">
          <div className="w-80 h-full bg-slate-900/60 border-x-2 border-cyan-500/40 relative [transform:rotateX(60deg)] origin-bottom">
            {/* Animated Highway Lane Markers rushing forward */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 flex flex-col justify-around">
              <div className="w-1.5 h-12 bg-lime-400/90 shadow-[0_0_12px_#CCFF00] animate-pulse"></div>
              <div className="w-1.5 h-12 bg-lime-400/90 shadow-[0_0_12px_#CCFF00] animate-pulse" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-12 bg-lime-400/90 shadow-[0_0_12px_#CCFF00] animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        </div>

        {/* Dynamic Speed Wind Streaks */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-[900px] h-0.5 bg-gradient-to-r from-transparent via-lime-400 to-transparent -rotate-12 animate-pulse" />
          <div className="w-[700px] h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent rotate-6 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Top Header Badge */}
      <div className="relative z-10 pt-3 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/50 border border-blue-500/40 text-blue-300 shadow-lg backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest">
            CURSUS GPS • BRASIL
          </span>
        </div>
      </div>

      {/* Center Hero: Animated 3D Vehicle Driving Across with Headlights and Wind Trails */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-lg w-full">
        {/* Animated Moving Vehicle Container */}
        <div className="relative w-full h-36 flex items-center justify-center overflow-visible mb-2">
          {/* Glowing Aura underneath vehicle */}
          <div className="absolute w-44 h-20 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />

          {/* Car Driving Motion Container */}
          <div 
            className="relative flex items-center transition-transform duration-100 ease-out"
            style={{
              transform: `translateX(${(progress - 50) * 1.8}px)`,
            }}
          >
            {/* Speed Wind Slipstream trailing behind car */}
            <div className="absolute -left-20 flex flex-col items-end gap-1.5 opacity-90 pointer-events-none">
              <div className="h-1 bg-gradient-to-l from-cyan-400 to-transparent rounded-full animate-pulse shadow-[0_0_10px_#00D2FF]" style={{ width: `${Math.min(90, progress * 1.5)}px` }}></div>
              <div className="h-1.5 bg-gradient-to-l from-lime-400 to-transparent rounded-full animate-pulse shadow-[0_0_12px_#CCFF00]" style={{ width: `${Math.min(110, progress * 1.8)}px`, animationDelay: '0.1s' }}></div>
              <div className="h-0.5 bg-gradient-to-l from-white to-transparent rounded-full animate-pulse" style={{ width: `${Math.min(70, progress * 1.2)}px`, animationDelay: '0.2s' }}></div>
            </div>

            {/* 3D Realistic Vehicle Illustration */}
            <div className="relative w-28 h-20 flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              {/* Headlight beam shooting forward */}
              <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-36 h-16 bg-gradient-to-r from-cyan-300/60 via-cyan-400/20 to-transparent [clip-path:polygon(0_35%,100%_0%,100%_100%,0_65%)] pointer-events-none" />

              <svg viewBox="0 0 120 60" className="w-28 h-14" fill="none">
                <defs>
                  <linearGradient id="splashCarBody" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#0284c7" />
                    <stop offset="30%" stop-color="#CCFF00" />
                    <stop offset="70%" stop-color="#00D2FF" />
                    <stop offset="100%" stop-color="#0066FF" />
                  </linearGradient>
                  <linearGradient id="splashGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0284c7" />
                    <stop offset="100%" stop-color="#050B14" />
                  </linearGradient>
                </defs>

                {/* Ground Shadow */}
                <ellipse cx="60" cy="52" rx="48" ry="6" fill="#000000" opacity="0.9" />

                {/* Wheels */}
                <circle cx="30" cy="48" r="9" fill="#090d16" stroke="#475569" stroke-width="2.5" />
                <circle cx="30" cy="48" r="4.5" fill="#CCFF00" />
                <circle cx="90" cy="48" r="9" fill="#090d16" stroke="#475569" stroke-width="2.5" />
                <circle cx="90" cy="48" r="4.5" fill="#CCFF00" />

                {/* Aerodynamic Body Contour */}
                <path d="M12 44 L20 44 L24 40 L36 40 L40 44 L80 44 L84 40 L96 40 L100 44 L114 44 C116 42, 116 38, 110 34 L92 24 C86 21, 62 18, 48 20 L30 28 L14 36 Z" fill="url(#splashCarBody)" stroke="#090d16" stroke-width="1.8" />

                {/* Windshield & Cabin Glass */}
                <path d="M48 22 L70 22 C78 22, 88 25, 90 28 L52 28 Z" fill="url(#splashGlass)" stroke="#0284c7" stroke-width="1" />

                {/* LED Headlight Laser */}
                <polygon points="112,36 116,36 114,40 110,40" fill="#ffffff" />
                <circle cx="113" cy="38" r="2.5" fill="#ffffff" />

                {/* Taillight Ruby Neon */}
                <rect x="12" y="36" width="3" height="6" rx="1.5" fill="#ff0033" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-lg">
          TÔ PASSANDO
        </h1>

        {/* Slogan */}
        <p className="text-lg sm:text-xl font-black bg-gradient-to-r from-lime-300 via-cyan-200 to-white bg-clip-text text-transparent mt-1">
          “Você vai. A gente te guia.”
        </p>

        {/* Progress Bar & Status */}
        <div className="w-full max-w-sm mt-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
              <span>{loadingPhase}</span>
            </span>
            <span className="font-mono text-lime-400 font-black">{Math.round(progress)}%</span>
          </div>

          {/* Futuristic High-Tech Progress Track */}
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700/80 p-0.5 overflow-hidden shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-lime-400 shadow-[0_0_12px_#CCFF00] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="relative z-10 pb-4 w-full max-w-sm flex flex-col items-center gap-3">
        <button
          onClick={onEnterApp}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-cyan-400 hover:from-lime-300 hover:to-cyan-300 text-slate-950 font-black text-xs tracking-wider shadow-2xl shadow-lime-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span>ENTRAR NO APP AGORA</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
          <span>GPS Multimodal • Cobertura Nacional 26 Estados + DF</span>
        </div>
      </div>
    </div>
  );
};
