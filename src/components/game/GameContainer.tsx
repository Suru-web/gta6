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
import { CharacterSelect3D } from './CharacterSelect3D';
import { ArenaCanvas3D } from '@/game/three/ArenaCanvas3D';
import { MatchResultModal } from './MatchResultModal';
import { ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface GameContainerProps {
  onOpenSideQuest?: () => void;
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
  const matchCredentials = useRef<{ token: string; id: string } | null>(null);
  const matchSequence = useRef(0);
  const [matchRevision, setMatchRevision] = useState(0);
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
  const [engineInstance, setEngineInstance] = useState<GameEngine | null>(null);

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
      punch: Boolean(k['KeyJ'] || k['Mouse0']),
      kick: Boolean(k['KeyK'] || k['Mouse2']),
      grab: Boolean(k['KeyI'] || k['Mouse1']),
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

      if (!e.repeat && screen === 'fight') {
        const attacks: Record<string, 'punch' | 'kick' | 'grab' | 'superAttack'> = { KeyJ: 'punch', KeyK: 'kick', KeyI: 'grab', KeyL: 'superAttack', Space: 'superAttack' };
        if (attacks[e.code]) engineRef.current?.queuePlayerAttack(attacks[e.code]);
      }

      keysDown.current[e.code] = true;
      updateEngineInput();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
      updateEngineInput();
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 0) keysDown.current['Mouse0'] = false;
      if (e.button === 2) keysDown.current['Mouse2'] = false;
      if (e.button === 1) keysDown.current['Mouse1'] = false;
      updateEngineInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [screen, updateEngineInput]);

  // Start a new match
  const handleStartFight = async (config: {
    playerChar: Character;
    cpuChar: Character;
    arena: Arena;
    difficulty: Difficulty;
  }) => {
    const sequence = ++matchSequence.current;
    matchCredentials.current = null;
    keysDown.current = {};
    setMatchRevision((revision) => revision + 1);
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
        if (sequence === matchSequence.current) {
          matchCredentials.current = { token: data.matchToken, id: data.matchId };
        }
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
        render3DMode: true,
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
          const credentials = matchCredentials.current;
          if (credentials) {
            try {
              await fetch('/api/game/match/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  matchToken: credentials.token,
                  matchId: credentials.id,
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
    setEngineInstance(engine);

    return () => {
      engine.destroy();
      setEngineInstance(null);
    };
  }, [screen, playerChar, cpuChar, arena, difficulty, matchRevision]);

  // Mobile virtual input update
  const handleMobileInput = (update: Partial<FighterInput>) => {
    if (!engineRef.current) return;
    for (const attack of ['punch', 'kick', 'grab', 'superAttack'] as const) {
      if (update[attack]) engineRef.current.queuePlayerAttack(attack);
    }
    Object.assign(engineRef.current.playerInput, update);
  };

  return (
    <div className="relative w-full">
      
      {/* ======================================================== */}
      {/* 1. TITLE SCREEN: ARCADE HERO ENTRY                       */}
      {/* ======================================================== */}
      {screen === 'title' && (
        <section className="arena-intro mx-auto max-w-7xl px-4 sm:px-6">
          <div className="arena-intro-stage">
            <div className="arena-intro-art" aria-hidden="true" />
            <div className="arena-intro-copy">
              <p className="arena-eyebrow"><span /> THE UNOFFICIAL GTA FIGHT CLUB</p>
              <h1 className="arena-intro-title">Legends<br /><em>collide.</em></h1>
              <p className="arena-intro-description">Pick your fighter, enter the arena, and settle the rivalry one round at a time.</p>
              <div className="arena-intro-actions">
                <button type="button" onClick={() => { sounds.playCheatCode(); setScreen('select'); }} className="arena-primary">
                  Choose your fighter <ChevronRight size={18} />
                </button>
                <button type="button" onClick={() => { sounds.playClick(); onScrollToLeaderboard(); }} className="arena-secondary">
                  View rankings <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
            <div className="arena-intro-caption"><span>01 / 03</span><span>YOUR CITY. YOUR RULES.</span></div>
          </div>
          <div className="arena-details">
            <div><strong>09</strong><span>Iconic fighters</span></div>
            <div><strong>01</strong><span>Fight for the top</span></div>
            <div><strong>∞</strong><span>Rivalries to settle</span></div>
            <p>THE STREETS ARE CALLING <span>↗</span></p>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. CHARACTER SELECTION SCREEN (3D FACE-OFF)              */}
      {/* ======================================================== */}
      {screen === 'select' && (
        <CharacterSelect3D
          onStartFight={handleStartFight}
          onBackToTitle={() => setScreen('title')}
        />
      )}

      {/* ======================================================== */}
      {/* 3. LIVE MATCH SCREEN (3D ARENA + HUD + MOBILE TOUCH)     */}
      {/* ======================================================== */}
      {screen === 'fight' && (
        <div className="relative w-full max-w-5xl mx-auto overflow-hidden border border-white/15 bg-[#151414] my-4">
          
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
            difficulty={difficulty}
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

          {/* 3D WebGL Arena Viewport + 2D Particle/Banner Overlay with Mouse Strike Support */}
          <div
            className="relative w-full aspect-[800/480] bg-[#151414] select-none"
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              if (screen !== 'fight') return;
              if (e.button === 0) {
                engineRef.current?.queuePlayerAttack('punch');
                // Left Click -> Punch
                keysDown.current['Mouse0'] = true;
                updateEngineInput();
              } else if (e.button === 2) {
                engineRef.current?.queuePlayerAttack('kick');
                // Right Click -> Kick
                e.preventDefault();
                keysDown.current['Mouse2'] = true;
                updateEngineInput();
              } else if (e.button === 1) {
                engineRef.current?.queuePlayerAttack('grab');
                // Middle Click -> Grab
                e.preventDefault();
                keysDown.current['Mouse1'] = true;
                updateEngineInput();
              }
            }}
            onMouseUp={(e) => {
              if (e.button === 0) {
                keysDown.current['Mouse0'] = false;
                updateEngineInput();
              } else if (e.button === 2) {
                keysDown.current['Mouse2'] = false;
                updateEngineInput();
              } else if (e.button === 1) {
                keysDown.current['Mouse1'] = false;
                updateEngineInput();
              }
            }}
          >
            <ArenaCanvas3D engine={engineInstance} />
            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              className="absolute inset-0 w-full h-full object-contain block z-10 pointer-events-none"
            />
          </div>

          {/* Desktop Keyboard & Mouse Controls Legend Bar */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-black/90 border-t border-white/10 font-mono text-[11px] text-[#a19bb5]">
            <div className="flex items-center gap-3">
              <span><strong>A/D</strong> Move</span>
              <span><strong>W</strong> Jump</span>
              <span><strong>S</strong> Crouch</span>
              <span><strong>HOLD BACK</strong> Block</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-300"><strong>LEFT CLICK / J</strong> Punch</span>
              <span className="text-pink-300"><strong>RIGHT CLICK / K</strong> Kick</span>
              <span className="text-emerald-300"><strong>MID CLICK / I</strong> Grab</span>
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
                  {difficulty === 'practice' ? 'PRACTICE PAUSED' : 'MATCH PAUSED'}
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
                    {difficulty === 'practice' ? 'Reset Dummy / Restart' : 'Restart Match'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setScreen('select');
                    }}
                    className="w-full py-2.5 bg-white/5 text-[#a19bb5] hover:text-white uppercase rounded-xl"
                  >
                    {difficulty === 'practice' ? 'Exit Practice Mode' : 'Change Characters'}
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
          onViewLeaderboard={() => {
            setScreen('title');
            setTimeout(() => {
              onScrollToLeaderboard();
            }, 60);
          }}
          onOpenSideQuest={onOpenSideQuest}
          onClose={() => setScreen('title')}
        />
      )}
    </div>
  );
};
