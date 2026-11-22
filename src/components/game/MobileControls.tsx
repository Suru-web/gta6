'use client';

import React, { useEffect, useState } from 'react';
import { FighterInput } from '@/game/fighter';
import { RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Shield, Zap } from 'lucide-react';

interface MobileControlsProps {
  onInputChange: (inputUpdate: Partial<FighterInput>) => void;
  canSuper: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInputChange,
  canSuper,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth <= 840;
        const portrait = window.innerHeight > window.innerWidth;
        setIsPortrait(isMobile && portrait);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleTouchStart = (key: keyof FighterInput) => (e: React.TouchEvent) => {
    e.preventDefault();
    onInputChange({ [key]: true });
  };

  const handleTouchEnd = (key: keyof FighterInput) => (e: React.TouchEvent) => {
    e.preventDefault();
    onInputChange({ [key]: false });
  };

  return (
    <>
      {/* Landscape Prompt for Mobile Devices */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 bg-[#090514]/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#fca47a]/20 border border-[#fca47a]/40 text-[#fca47a] flex items-center justify-center mb-4 animate-spin">
            <RotateCcw size={32} />
          </div>
          <h2 className="font-bebas text-3xl text-white tracking-wider mb-2">
            ROTATE YOUR PHONE
          </h2>
          <p className="text-xs text-[#a19bb5] max-w-xs font-mono">
            For the optimal GTA Legends fighting experience, turn your device to landscape mode.
          </p>
        </div>
      )}

      {/* Virtual Touch Controller (Only visible on touch devices / mobile screens) */}
      <div className="sm:hidden absolute inset-x-0 bottom-2 px-3 flex items-end justify-between pointer-events-none select-none z-30">
        
        {/* Left Side: Virtual D-Pad */}
        <div className="relative w-36 h-36 pointer-events-auto">
          {/* Jump */}
          <button
            type="button"
            onTouchStart={handleTouchStart('jump')}
            onTouchEnd={handleTouchEnd('jump')}
            className="absolute top-0 left-12 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowUp size={20} />
          </button>

          {/* Left */}
          <button
            type="button"
            onTouchStart={handleTouchStart('moveLeft')}
            onTouchEnd={handleTouchEnd('moveLeft')}
            className="absolute top-12 left-0 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Block Center */}
          <button
            type="button"
            onTouchStart={handleTouchStart('block')}
            onTouchEnd={handleTouchEnd('block')}
            className="absolute top-12 left-12 w-12 h-12 rounded-xl bg-cyan-950/70 active:bg-cyan-500 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[9px] font-bold"
          >
            <Shield size={16} />
          </button>

          {/* Right */}
          <button
            type="button"
            onTouchStart={handleTouchStart('moveRight')}
            onTouchEnd={handleTouchEnd('moveRight')}
            className="absolute top-12 right-0 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowRight size={20} />
          </button>

          {/* Crouch */}
          <button
            type="button"
            onTouchStart={handleTouchStart('crouch')}
            onTouchEnd={handleTouchEnd('crouch')}
            className="absolute bottom-0 left-12 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pointer-events-auto">
          {/* Punch */}
          <button
            type="button"
            onTouchStart={handleTouchStart('punch')}
            onTouchEnd={handleTouchEnd('punch')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 active:brightness-125 border border-amber-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            PUNCH
          </button>

          {/* Kick */}
          <button
            type="button"
            onTouchStart={handleTouchStart('kick')}
            onTouchEnd={handleTouchEnd('kick')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 active:brightness-125 border border-emerald-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            KICK
          </button>

          {/* Grab */}
          <button
            type="button"
            onTouchStart={handleTouchStart('grab')}
            onTouchEnd={handleTouchEnd('grab')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 active:brightness-125 border border-purple-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            GRAB
          </button>

          {/* Super */}
          <button
            type="button"
            onTouchStart={handleTouchStart('superAttack')}
            onTouchEnd={handleTouchEnd('superAttack')}
            className={`w-14 h-14 rounded-2xl border text-white font-bebas text-lg tracking-wider flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform ${
              canSuper
                ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-yellow-400 border-yellow-300 animate-pulse shadow-[0_0_15px_#f43f5e]'
                : 'bg-zinc-800/80 border-white/10 text-zinc-500 opacity-60'
            }`}
          >
            <Zap size={15} />
            <span>SUPER</span>
          </button>
        </div>
      </div>
    </>
  );
};
