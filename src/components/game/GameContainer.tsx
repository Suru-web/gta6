'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, Arena, Difficulty } from '@/types/game';
import { DEFAULT_PLAYER_CHARACTER, DEFAULT_CPU_CHARACTER } from '@/config/roster';
import { DEFAULT_ARENA } from '@/config/arenas';
import { GameEngine } from '@/game/engine';
import { RoundState } from '@/game/types';
import { FighterInput } from '@/game/fighter';
import { gameAudio } from '@/game/audio';
import { GameHUD } from './GameHUD';
import { MobileControls } from './MobileControls';
import { CharacterSelect } from './CharacterSelect';
import { MatchResultModal } from './MatchResultModal';
import { Swords, Play, Trophy, Users, Shield, Zap, Sparkles, ChevronRight, Pause, RotateCcw } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface GameContainerProps {
  onOpenSideQuest: () => void;
  onScrollToLeaderboard: () => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  onOpenSideQuest,
  onScrollToLeaderboard,
}) => {
  const [screen, setScreen] = useState<'title' | 'select' | 'fight' | 'result'>('title');

  // Selected Fighter Configuration
  const [playerChar, setPlayerChar] = useState<Character>(DEFAULT_PLAYER_CHARACTER);
  const [cpuChar, setCpuChar] = useState<Character>(DEFAULT_CPU_CHARACTER);
  const [arena, setArena] = useState<Arena>(DEFAULT_ARENA);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Live Match State
  const [playerHp, setPlayerHp] = useState<number>(DEFAULT_PLAYER_CHARACTER.stats.health);
  const [cpuHp, setCpuHp] = useState<number>(DEFAULT_CPU_CHARACTER.stats.health);
  const [playerSuper, setPlayerSuper] = useState<number>(0);
  const [cpuSuper, setCpuSuper] = useState<number>(0);
  const [roundState, setRoundState] = useState<RoundState>({
    currentRound: 1,
    playerRoundsWon: 0,
    cpuRoundsWon: 0,
    roundTimer: 60,
    phase: 'intro',
    bannerText: 'ROUND 1',
    bannerSubtext: 'READY...',
    bannerAlpha: 1,
    bannerScale: 1.2,
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Match Result & Tokens
  const [matchToken, setMatchToken] = useState<string>('');
  const [matchId, setMatchId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<{
    playerWon: boolean;
    roundsWonPlayer: number;
    roundsWonCpu: number;
    durationSeconds: number;
    damageDealtPlayer: number;
    damageDealtCpu: number;
    maxCombo: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Keyboard input state
  const keysDown = useRef<Record<string, boolean>>({});

  const updateEngineInput = useCallback(() => {
    if (!engineRef.current) return;
    const k = keysDown.current;
    const input: FighterInput = {
      moveLeft: Boolean(k['KeyA'] || k['ArrowLeft']),
      moveRight: Boolean(k['KeyD'] || k['ArrowRight']),
      jump: Boolean(k['KeyW'] || k['ArrowUp']),
      crouch: Boolean(k['KeyS'] || k['ArrowDown']),
      block: Boolean(k['ShiftLeft'] || k['KeyB']),
      punch: Boolean(k['KeyJ']),
      kick: Boolean(k['KeyK']),
      grab: Boolean(k['KeyI']),
      superAttack: Boolean(k['KeyL'] || k['Space']),
    };
    engineRef.current.playerInput = input;
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling on arrow keys and space when fighting
      if (screen === 'fight' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Escape' && screen === 'fight') {
        setIsPaused((p) => {
          const next = !p;
          if (engineRef.current) engineRef.current.setPaused(next);
          return next;
        });
        return;
      }

      if (e.code === 'KeyM' || e.code === 'KeyN') {
        const muted = gameAudio.toggleMute();
        setIsMuted(muted);
        return;
      }

      keysDown.current[e.code] = true;
      updateEngineInput();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
      updateEngineInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, updateEngineInput]);

  // Start a new match
  const handleStartFight = async (config: {
    playerChar: Character;
    cpuChar: Character;
    arena: Arena;
    difficulty: Difficulty;
  }) => {
    setPlayerChar(config.playerChar);
    setCpuChar(config.cpuChar);
    setArena(config.arena);
    setDifficulty(config.difficulty);
    setMatchResult(null);
    setIsPaused(false);
    setScreen('fight');

    // 1. Request signed match token from backend
    try {
      const res = await fetch('/api/game/match/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCharacterId: config.playerChar.id,
          cpuCharacterId: config.cpuChar.id,
          arenaId: config.arena.id,
          difficulty: config.difficulty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatchToken(data.matchToken);
        setMatchId(data.matchId);
      }
    } catch (e) {
      console.warn('Could not register match on backend:', e);
    }
  };

  // Mount Game Engine when canvas is rendered in 'fight' screen
  useEffect(() => {
    if (screen !== 'fight' || !canvasRef.current) return;

    // Destroy existing engine if any
    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const engine = new GameEngine(
      canvasRef.current,
      playerChar,
      cpuChar,
      arena,
      difficulty,
      {
        onHealthChange: (pHp, cHp, pSup, cSup) => {
          setPlayerHp(pHp);
          setCpuHp(cHp);
          setPlayerSuper(pSup);
          setCpuSuper(cSup);
        },
        onRoundChange: (rState) => {
          setRoundState({ ...rState });
        },
        onMatchFinish: async (results) => {
          setMatchResult(results);
          setScreen('result');

          // Send results to backend for global aggregation
          if (matchToken && matchId) {
            try {
              await fetch('/api/game/match/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  matchToken,
                  matchId,
                  playerCharacterId: playerChar.id,
                  cpuCharacterId: cpuChar.id,
                  arenaId: arena.id,
                  difficulty,
                  playerWon: results.playerWon,
                  roundsWonPlayer: results.roundsWonPlayer,
                  roundsWonCpu: results.roundsWonCpu,
                  durationSeconds: results.durationSeconds,
                  damageDealtPlayer: results.damageDealtPlayer,
                  damageDealtCpu: results.damageDealtCpu,
                  maxCombo: results.maxCombo,
                }),
              });
            } catch (err) {
              console.warn('Failed to submit match result to leaderboard:', err);
            }
          }
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [screen, playerChar, cpuChar, arena, difficulty, matchToken, matchId]);

  // Mobile virtual input update
  const handleMobileInput = (update: Partial<FighterInput>) => {
    if (!engineRef.current) return;
    Object.assign(engineRef.current.playerInput, update);
  };

  return (
    <div className="relative w-full">
      
      {/* ======================================================== */}
      {/* 1. TITLE SCREEN: ARCADE HERO ENTRY                       */}
      {/* ======================================================== */}
      {screen === 'title' && (
        <section className="relative px-4 pt-6 pb-12 sm:pt-10 sm:pb-16 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            
            {/* Arcade Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#fca47a]/30 bg-[#fca47a]/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-[#fca47a] mb-5 shadow-[0_0_20px_rgba(252,164,122,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#fca47a] animate-ping" />
              <span>GTA LEGENDS ARENA // 2026 EDITION</span>
            </div>

            {/* Main Title & Headline */}
            <h1 className="font-bebas text-6xl sm:text-8xl md:text-9xl text-white tracking-wider leading-none mb-3 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              WHO IS THE STRONGEST <br />
              <span className="bg-gradient-to-r from-[#fca47a] via-[#e86b97] to-[#06b6d4] bg-clip-text text-transparent">
                GTA LEGEND?
              </span>
            </h1>

            <p className="font-mono text-sm sm:text-base text-[#a19bb5] max-w-2xl mx-auto mb-8 leading-relaxed">
              Choose your fighter. Challenge the computer. Settle the 25-year debate with authentic arcade combat. Every match updates our global community rankings.
            </p>

            {/* Big Action: START FIGHTING */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                type="button"
                onClick={() => {
                  sounds.playCheatCode();
                  setScreen('select');
                }}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-[#fca47a] via-[#e86b97] to-[#9333ea] text-lg sm:text-xl font-bebas tracking-widest text-[#090514] font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(252,164,122,0.4)] flex items-center justify-center gap-3"
              >
                <Swords size={22} />
                <span>START FIGHTING</span>
                <ChevronRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onScrollToLeaderboard();
                }}
                className="w-full sm:w-auto px-6 py-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
              >
                <Trophy size={16} className="text-yellow-400" />
                <span>View Global Rankings</span>
              </button>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto font-mono text-xs">
              <div className="rounded-2xl border border-white/5 bg-black/40 p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">🌴</span>
                <span className="font-bold text-white">14 GTA PROTAGONISTS</span>
                <span className="text-[10px] text-[#6c637e]">Tommy to Lucia & Jason</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/40 p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">🎮</span>
                <span className="font-bold text-white">REAL COMBAT ENGINE</span>
                <span className="text-[10px] text-[#6c637e]">Punches, Kicks, Supers</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/40 p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">🧠</span>
                <span className="font-bold text-white">3 CPU DIFFICULTIES</span>
                <span className="text-[10px] text-[#6c637e]">Easy, Normal, Hard AI</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/40 p-3 flex flex-col items-center">
                <span className="text-2xl mb-1">🏆</span>
                <span className="font-bold text-white">GLOBAL LEADERBOARD</span>
                <span className="text-[10px] text-[#6c637e]">Tracked via Redis</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. CHARACTER SELECTION SCREEN                            */}
      {/* ======================================================== */}
      {screen === 'select' && (
        <CharacterSelect
          onStartFight={handleStartFight}
          onBackToTitle={() => setScreen('title')}
        />
      )}

      {/* ======================================================== */}
      {/* 3. LIVE MATCH SCREEN (CANVAS + HUD + MOBILE TOUCH)       */}
      {/* ======================================================== */}
      {screen === 'fight' && (
        <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl my-2">
          
          {/* Top Arcade HUD */}
          <GameHUD
            playerChar={playerChar}
            cpuChar={cpuChar}
            playerHp={playerHp}
            cpuHp={cpuHp}
            playerSuper={playerSuper}
            cpuSuper={cpuSuper}
            roundState={roundState}
            arena={arena}
            onPause={() => {
              setIsPaused((p) => {
                const next = !p;
                if (engineRef.current) engineRef.current.setPaused(next);
                return next;
              });
            }}
            isPaused={isPaused}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = gameAudio.toggleMute();
              setIsMuted(muted);
            }}
          />

          {/* HTML5 Game Canvas (800x480 aspect ratio) */}
          <div className="relative w-full aspect-[800/480] bg-black">
            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              className="w-full h-full object-contain block"
            />
          </div>

          {/* Desktop Keyboard Controls Legend Bar */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-black/90 border-t border-white/10 font-mono text-[11px] text-[#a19bb5]">
            <div className="flex items-center gap-3">
              <span><strong>A/D</strong> Move</span>
              <span><strong>W</strong> Jump</span>
              <span><strong>S</strong> Crouch</span>
              <span><strong>HOLD BACK</strong> Block</span>
            </div>
            <div className="flex items-center gap-3">
              <span><strong>J</strong> Punch</span>
              <span><strong>K</strong> Kick</span>
              <span><strong>I</strong> Grab</span>
              <span className="text-yellow-300"><strong>L / SPACE</strong> Super</span>
              <span><strong>ESC</strong> Pause</span>
            </div>
          </div>

          {/* Mobile Virtual Touch Controls */}
          <MobileControls
            onInputChange={handleMobileInput}
            canSuper={playerSuper >= 100}
          />

          {/* Pause Menu Modal Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#120b22] border border-white/20 rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl">
                <h3 className="font-bebas text-3xl text-white tracking-wider mb-4">
                  MATCH PAUSED
                </h3>
                <div className="space-y-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsPaused(false);
                      if (engineRef.current) engineRef.current.setPaused(false);
                    }}
                    className="w-full py-3 bg-[#fca47a] text-black font-bold uppercase rounded-xl hover:brightness-110"
                  >
                    Resume Match
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      handleStartFight({ playerChar, cpuChar, arena, difficulty });
                    }}
                    className="w-full py-2.5 bg-white/10 text-white font-bold uppercase rounded-xl hover:bg-white/20"
                  >
                    Restart Match
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setScreen('select');
                    }}
                    className="w-full py-2.5 bg-white/5 text-[#a19bb5] hover:text-white uppercase rounded-xl"
                  >
                    Change Characters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POST-MATCH RESULT SCREEN                              */}
      {/* ======================================================== */}
      {screen === 'result' && matchResult && (
        <MatchResultModal
          playerWon={matchResult.playerWon}
          playerChar={playerChar}
          cpuChar={cpuChar}
          roundsWonPlayer={matchResult.roundsWonPlayer}
          roundsWonCpu={matchResult.roundsWonCpu}
          damageDealtPlayer={matchResult.damageDealtPlayer}
          maxCombo={matchResult.maxCombo}
          durationSeconds={matchResult.durationSeconds}
          difficulty={difficulty}
          arena={arena}
          onRematch={() => handleStartFight({ playerChar, cpuChar, arena, difficulty })}
          onChooseFighter={() => setScreen('select')}
          onViewLeaderboard={onScrollToLeaderboard}
          onOpenSideQuest={onOpenSideQuest}
        />
      )}
    </div>
  );
};
