'use client';

import React from 'react';
import { FighterInput } from '@/game/fighter';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Shield, Zap } from 'lucide-react';

interface MobileControlsProps {
  onInputChange: (inputUpdate: Partial<FighterInput>) => void;
  canSuper: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInputChange,
  canSuper,
}) => {
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
      {/* Virtual Touch Controller (Only visible on touch devices / mobile screens) */}
      <div className="fight-touch-controls absolute inset-x-0 bottom-2 px-3 items-end justify-between pointer-events-none select-none z-30">
        
        {/* Left Side: Virtual D-Pad */}
        <div className="relative w-36 h-36 pointer-events-auto">
          {/* Jump */}
          <button
            type="button"
            onTouchStart={handleTouchStart('jump')}
            onTouchEnd={handleTouchEnd('jump')}
            onTouchCancel={handleTouchEnd('jump')}
            aria-label="Jump"
            className="absolute top-0 left-12 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowUp size={20} />
          </button>

          {/* Left */}
          <button
            type="button"
            onTouchStart={handleTouchStart('moveLeft')}
            onTouchEnd={handleTouchEnd('moveLeft')}
            onTouchCancel={handleTouchEnd('moveLeft')}
            aria-label="Move left"
            className="absolute top-12 left-0 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Block Center */}
          <button
            type="button"
            onTouchStart={handleTouchStart('block')}
            onTouchEnd={handleTouchEnd('block')}
            onTouchCancel={handleTouchEnd('block')}
            aria-label="Block"
            className="absolute top-12 left-12 w-12 h-12 rounded-xl bg-cyan-950/70 active:bg-cyan-500 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[9px] font-bold"
          >
            <Shield size={16} />
          </button>

          {/* Right */}
          <button
            type="button"
            onTouchStart={handleTouchStart('moveRight')}
            onTouchEnd={handleTouchEnd('moveRight')}
            onTouchCancel={handleTouchEnd('moveRight')}
            aria-label="Move right"
            className="absolute top-12 right-0 w-12 h-12 rounded-xl bg-black/60 active:bg-[#fca47a] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowRight size={20} />
          </button>

          {/* Crouch */}
          <button
            type="button"
            onTouchStart={handleTouchStart('crouch')}
            onTouchEnd={handleTouchEnd('crouch')}
            onTouchCancel={handleTouchEnd('crouch')}
            aria-label="Crouch"
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
            onTouchCancel={handleTouchEnd('punch')}
            aria-label="Punch"
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 active:brightness-125 border border-amber-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            PUNCH
          </button>

          {/* Kick */}
          <button
            type="button"
            onTouchStart={handleTouchStart('kick')}
            onTouchEnd={handleTouchEnd('kick')}
            onTouchCancel={handleTouchEnd('kick')}
            aria-label="Kick"
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 active:brightness-125 border border-emerald-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            KICK
          </button>

          {/* Grab */}
          <button
            type="button"
            onTouchStart={handleTouchStart('grab')}
            onTouchEnd={handleTouchEnd('grab')}
            onTouchCancel={handleTouchEnd('grab')}
            aria-label="Grab"
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 active:brightness-125 border border-purple-300/40 text-white font-bebas text-lg tracking-wider flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            GRAB
          </button>

          {/* Super */}
          <button
            type="button"
            onTouchStart={handleTouchStart('superAttack')}
            onTouchEnd={handleTouchEnd('superAttack')}
            onTouchCancel={handleTouchEnd('superAttack')}
            aria-label="Super attack"
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
