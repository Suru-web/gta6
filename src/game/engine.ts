import { Character, Arena, Difficulty } from '@/types/game';
import { Fighter, FighterInput } from './fighter';
import { CPUController } from './ai';
import { ParticleSystem } from './particles';
import { RoundState, Rect } from './types';
import { gameAudio } from './audio';

export interface GameEngineCallbacks {
  onRoundChange?: (roundState: RoundState) => void;
  onHealthChange?: (playerHp: number, cpuHp: number, playerSuper: number, cpuSuper: number) => void;
  onMatchFinish?: (results: {
    playerWon: boolean;
    roundsWonPlayer: number;
    roundsWonCpu: number;
    durationSeconds: number;
    damageDealtPlayer: number;
    damageDealtCpu: number;
    maxCombo: number;
  }) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public arena: Arena;
  public difficulty: Difficulty;

  public player: Fighter;
  public cpu: Fighter;
  public cpuAI: CPUController;
  public particles: ParticleSystem;

  public width: number = 800;
  public height: number = 480;
  public groundY: number = 405;

  public roundState: RoundState = {
    currentRound: 1,
    playerRoundsWon: 0,
    cpuRoundsWon: 0,
    roundTimer: 60,
    phase: 'intro',
    bannerText: 'ROUND 1',
    bannerSubtext: 'READY...',
    bannerAlpha: 1,
    bannerScale: 1.2,
  };

  private callbacks: GameEngineCallbacks;
  private animationFrameId: number | null = null;
  private isPaused: boolean = false;
  private isDestroyed: boolean = false;

  private phaseTimer: number = 0;
  private frameCount: number = 0;
  private matchStartTimestamp: number = 0;
  private cameraShake: number = 0;

  public playerInput: FighterInput = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    crouch: false,
    block: false,
    punch: false,
    kick: false,
    grab: false,
    superAttack: false,
  };

  constructor(
    canvas: HTMLCanvasElement,
    playerChar: Character,
    cpuChar: Character,
    arena: Arena,
    difficulty: Difficulty,
    callbacks: GameEngineCallbacks = {}
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.arena = arena;
    this.difficulty = difficulty;
    this.callbacks = callbacks;

    this.player = new Fighter(playerChar, true, 220, this.groundY);
    this.cpu = new Fighter(cpuChar, false, 580, this.groundY);
    this.cpuAI = new CPUController(difficulty);
    this.particles = new ParticleSystem();

    this.matchStartTimestamp = Date.now();
    this.startRound(1);
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private startRound(roundNum: number) {
    this.roundState.currentRound = roundNum;
    this.roundState.roundTimer = 60;
    this.roundState.phase = 'intro';
    this.roundState.bannerText = roundNum === 3 ? 'FINAL ROUND' : `ROUND ${roundNum}`;
    this.roundState.bannerSubtext = 'FIGHT!';
    this.roundState.bannerAlpha = 1;
    this.roundState.bannerScale = 1.3;
    this.phaseTimer = 0;

    this.player.resetPosition(220);
    this.cpu.resetPosition(580);
    this.particles.clear();

    gameAudio.playRoundStart();
    this.callbacks.onRoundChange?.(this.roundState);
  }

  private loop() {
    if (this.isDestroyed) return;

    if (!this.isPaused) {
      this.update();
      this.render();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private update() {
    this.frameCount++;
    this.phaseTimer++;

    // Shake decay
    if (this.cameraShake > 0) {
      this.cameraShake *= 0.88;
      if (this.cameraShake < 0.2) this.cameraShake = 0;
    }

    // 1. INTRO PHASE (Round Announce)
    if (this.roundState.phase === 'intro') {
      if (this.phaseTimer < 45) {
        this.roundState.bannerText = this.roundState.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.roundState.currentRound}`;
      } else {
        this.roundState.bannerText = 'FIGHT!';
      }

      this.roundState.bannerScale = Math.max(1, this.roundState.bannerScale - 0.008);

      if (this.phaseTimer >= 80) {
        this.roundState.phase = 'fight';
        this.roundState.bannerAlpha = 0;
        this.callbacks.onRoundChange?.(this.roundState);
      }
    }

    // 2. ACTIVE FIGHT PHASE
    if (this.roundState.phase === 'fight') {
      // Round Timer (decrement roughly once per second at 60fps)
      if (this.frameCount % 60 === 0 && this.roundState.roundTimer > 0) {
        this.roundState.roundTimer--;
        this.callbacks.onRoundChange?.(this.roundState);

        // Time Out Check
        if (this.roundState.roundTimer <= 0) {
          this.handleRoundTimeout();
        }
      }

      // CPU AI Decisions
      const cpuInput = this.cpuAI.update(this.cpu, this.player);

      // Update Fighters
      this.player.update(this.playerInput, this.cpu.x, this.width);
      this.cpu.update(cpuInput, this.player.x, this.width);

      // Check Combat Collisions
      this.checkCombatCollisions();

      // Check Knockout Condition
      if (this.player.health <= 0 || this.cpu.health <= 0) {
        this.roundState.phase = 'ko';
        this.phaseTimer = 0;
        this.roundState.bannerText = 'KNOCKOUT!';
        this.roundState.bannerAlpha = 1;
        this.roundState.bannerScale = 1.4;
        this.cameraShake = 15;
      }

      // Notify HUD
      this.callbacks.onHealthChange?.(
        this.player.health,
        this.cpu.health,
        this.player.superMeter,
        this.cpu.superMeter
      );
    }

    // 3. KNOCKOUT PHASE (Dramatic Slowdown & Winner Freeze)
    if (this.roundState.phase === 'ko') {
      // Keep running knockdown physics
      this.player.update(this.playerInput, this.cpu.x, this.width);
      this.cpu.update(this.playerInput, this.player.x, this.width);

      if (this.phaseTimer >= 90) {
        this.handleRoundFinish();
      }
    }

    // 4. ROUND END / TRANSITION
    if (this.roundState.phase === 'round_end') {
      if (this.phaseTimer >= 110) {
        // Next round or match end
        if (this.roundState.playerRoundsWon >= 2 || this.roundState.cpuRoundsWon >= 2) {
          this.handleMatchComplete();
        } else {
          this.startRound(this.roundState.currentRound + 1);
        }
      }
    }

    // Update Particles and Popups
    this.particles.update();
  }

  private checkCombatCollisions() {
    // 1. Check Player attack hitting CPU
    const playerHitbox = this.player.getHitbox();
    if (playerHitbox) {
      const cpuHurtbox = this.cpu.getHurtbox();
      if (this.rectIntersect(playerHitbox, cpuHurtbox)) {
        const fromDirection = this.player.facing;
        const result = this.cpu.takeDamage(
          playerHitbox.damage,
          playerHitbox.type,
          fromDirection,
          playerHitbox.type === 'super'
        );

        this.player.registerHitLanded(result.actualDamage, playerHitbox.type);

        const sparkX = fromDirection === 1 ? playerHitbox.x + playerHitbox.width : playerHitbox.x;
        const sparkY = playerHitbox.y + playerHitbox.height / 2;

        if (result.blocked) {
          this.particles.emitBlockSparks(sparkX, sparkY);
          this.particles.addPopup(sparkX, sparkY - 20, 'BLOCKED!', '#06b6d4');
        } else {
          this.particles.emitHitSparks(sparkX, sparkY, this.player.character.themeColor, 18);
          this.particles.addPopup(
            sparkX,
            sparkY - 20,
            `-${result.actualDamage}`,
            this.player.character.themeColor
          );
          this.cameraShake = playerHitbox.type === 'super' ? 14 : 6;
        }
      }
    }

    // 2. Check CPU attack hitting Player
    const cpuHitbox = this.cpu.getHitbox();
    if (cpuHitbox) {
      const playerHurtbox = this.player.getHurtbox();
      if (this.rectIntersect(cpuHitbox, playerHurtbox)) {
        const fromDirection = this.cpu.facing;
        const result = this.player.takeDamage(
          cpuHitbox.damage,
          cpuHitbox.type,
          fromDirection,
          cpuHitbox.type === 'super'
        );

        this.cpu.registerHitLanded(result.actualDamage, cpuHitbox.type);

        const sparkX = fromDirection === 1 ? cpuHitbox.x + cpuHitbox.width : cpuHitbox.x;
        const sparkY = cpuHitbox.y + cpuHitbox.height / 2;

        if (result.blocked) {
          this.particles.emitBlockSparks(sparkX, sparkY);
          this.particles.addPopup(sparkX, sparkY - 20, 'BLOCKED!', '#06b6d4');
        } else {
          this.particles.emitHitSparks(sparkX, sparkY, this.cpu.character.themeColor, 18);
          this.particles.addPopup(
            sparkX,
            sparkY - 20,
            `-${result.actualDamage}`,
            this.cpu.character.themeColor
          );
          this.cameraShake = cpuHitbox.type === 'super' ? 14 : 6;
        }
      }
    }
  }

  private handleRoundTimeout() {
    this.roundState.phase = 'round_end';
    this.phaseTimer = 0;
    this.roundState.bannerText = 'TIME UP!';
    this.roundState.bannerAlpha = 1;

    if (this.player.health > this.cpu.health) {
      this.roundState.playerRoundsWon++;
      this.player.state = 'victory';
      this.cpu.state = 'defeat';
    } else {
      this.roundState.cpuRoundsWon++;
      this.cpu.state = 'victory';
      this.player.state = 'defeat';
    }
    this.callbacks.onRoundChange?.(this.roundState);
  }

  private handleRoundFinish() {
    this.roundState.phase = 'round_end';
    this.phaseTimer = 0;

    if (this.cpu.health <= 0) {
      this.roundState.playerRoundsWon++;
      this.player.state = 'victory';
      this.cpu.state = 'defeat';
      this.roundState.bannerText = `${this.player.character.name.toUpperCase()} WINS!`;
    } else {
      this.roundState.cpuRoundsWon++;
      this.cpu.state = 'victory';
      this.player.state = 'defeat';
      this.roundState.bannerText = `${this.cpu.character.name.toUpperCase()} WINS!`;
    }

    this.roundState.bannerAlpha = 1;
    this.callbacks.onRoundChange?.(this.roundState);
  }

  private handleMatchComplete() {
    this.roundState.phase = 'match_end';
    const playerWon = this.roundState.playerRoundsWon >= 2;

    if (playerWon) {
      this.roundState.bannerText = 'VICTORY! RESPECT +999,999';
      gameAudio.playVictory();
    } else {
      this.roundState.bannerText = 'WASTED // MISSION FAILED';
      gameAudio.playDefeat();
    }

    const durationSeconds = Math.max(5, (Date.now() - this.matchStartTimestamp) / 1000);

    this.callbacks.onMatchFinish?.({
      playerWon,
      roundsWonPlayer: this.roundState.playerRoundsWon,
      roundsWonCpu: this.roundState.cpuRoundsWon,
      durationSeconds,
      damageDealtPlayer: this.player.totalDamageDealt,
      damageDealtCpu: this.cpu.totalDamageDealt,
      maxCombo: Math.max(this.player.maxCombo, 1),
    });
  }

  private rectIntersect(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Camera Shake
    if (this.cameraShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShake;
      const shakeY = (Math.random() - 0.5) * this.cameraShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Parallax Arena Background
    this.renderArena(ctx);

    // 2. Draw Fighters
    this.player.render(ctx);
    this.cpu.render(ctx);

    // 3. Draw Particles & Damage Popups
    this.particles.render(ctx);

    // 4. Draw In-Game Dynamic Announcement Banner
    if (this.roundState.bannerAlpha > 0) {
      this.renderBanner(ctx);
    }

    ctx.restore();
  }

  private renderArena(ctx: CanvasRenderingContext2D) {
    const w = this.width;
    const h = this.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    if (this.arena.id === 'vice-city') {
      skyGrad.addColorStop(0, '#1a052e');
      skyGrad.addColorStop(0.4, '#4a0e4e');
      skyGrad.addColorStop(0.75, '#c026d3');
      skyGrad.addColorStop(1, '#f97316');
    } else if (this.arena.id === 'los-santos') {
      skyGrad.addColorStop(0, '#06131c');
      skyGrad.addColorStop(0.5, '#132e27');
      skyGrad.addColorStop(1, '#365314');
    } else if (this.arena.id === 'liberty-city') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    } else if (this.arena.id === 'leonida') {
      skyGrad.addColorStop(0, '#0b0416');
      skyGrad.addColorStop(0.4, '#3b0764');
      skyGrad.addColorStop(0.8, '#831843');
      skyGrad.addColorStop(1, '#e11d48');
    } else {
      skyGrad.addColorStop(0, '#180720');
      skyGrad.addColorStop(0.6, '#581c87');
      skyGrad.addColorStop(1, '#b45309');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, this.groundY);

    // Distant City Skyline Silhouettes
    ctx.fillStyle = 'rgba(10, 5, 20, 0.75)';
    const buildings = [
      { x: 20, w: 60, h: 140 },
      { x: 90, w: 45, h: 210 },
      { x: 145, w: 80, h: 170 },
      { x: 240, w: 50, h: 250 },
      { x: 300, w: 75, h: 190 },
      { x: 385, w: 90, h: 280 },
      { x: 490, w: 65, h: 200 },
      { x: 565, w: 80, h: 240 },
      { x: 655, w: 50, h: 180 },
      { x: 715, w: 70, h: 220 },
    ];
    for (const b of buildings) {
      ctx.fillRect(b.x, this.groundY - b.h, b.w, b.h);
      // Small yellow/cyan lit windows
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(253, 224, 71, 0.4)' : 'rgba(6, 182, 212, 0.4)';
      for (let wy = this.groundY - b.h + 20; wy < this.groundY - 30; wy += 25) {
        ctx.fillRect(b.x + 8, wy, 6, 8);
        ctx.fillRect(b.x + b.w - 14, wy, 6, 8);
      }
      ctx.fillStyle = 'rgba(10, 5, 20, 0.75)';
    }

    // Palm Trees for Vice City / Leonida
    if (this.arena.id === 'vice-city' || this.arena.id === 'leonida') {
      this.drawPalmTree(ctx, 70, this.groundY);
      this.drawPalmTree(ctx, 730, this.groundY);
    }

    // Ground / Street Surface
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, h);
    groundGrad.addColorStop(0, '#0f0a1a');
    groundGrad.addColorStop(1, '#05030a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // Neon Curbs & Street Markings
    ctx.fillStyle = this.arena.neonColor;
    ctx.shadowColor = this.arena.neonColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(0, this.groundY, w, 3);
    ctx.shadowBlur = 0;

    // Road dashed stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let rx = 30; rx < w; rx += 70) {
      ctx.fillRect(rx, this.groundY + 35, 40, 4);
    }
  }

  private drawPalmTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.fillStyle = '#0a0512';
    // Trunk
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x + 12, y - 80, x + 8, y - 160);
    ctx.lineTo(x + 14, y - 160);
    ctx.quadraticCurveTo(x + 20, y - 80, x + 5, y);
    ctx.fill();

    // Fronds / Leaves
    const fronds = [
      { ex: x - 45, ey: y - 140 },
      { ex: x - 30, ey: y - 180 },
      { ex: x + 25, ey: y - 195 },
      { ex: x + 60, ey: y - 170 },
      { ex: x + 55, ey: y - 135 },
    ];
    for (const f of fronds) {
      ctx.beginPath();
      ctx.moveTo(x + 11, y - 160);
      ctx.quadraticCurveTo(f.ex + 5, f.ey - 10, f.ex, f.ey);
      ctx.strokeStyle = '#0a0512';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderBanner(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, this.roundState.bannerAlpha));
    ctx.translate(this.width / 2, this.height * 0.38);
    ctx.scale(this.roundState.bannerScale, this.roundState.bannerScale);

    ctx.font = '900 46px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // GTA Neon Shadow Glow
    ctx.shadowColor = '#fca47a';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.roundState.bannerText, 0, 0);

    ctx.fillStyle = '#fdfbf7';
    ctx.fillText(this.roundState.bannerText, 0, 0);

    ctx.restore();
  }
}
