import { Fighter, FighterInput } from './fighter';
import { Difficulty } from '@/types/game';
import { AttackKind } from './moves';

export type AIBehaviorState = 
  | 'NEUTRAL' 
  | 'APPROACH' 
  | 'RETREAT' 
  | 'DEFEND' 
  | 'ATTACK' 
  | 'PUNISH' 
  | 'WAKEUP_RESET';

export class CPUController {
  public difficulty: Difficulty;
  public behaviorState: AIBehaviorState = 'NEUTRAL';
  
  private decisionTimer: number = 0;
  private attackCooldown: number = 0;
  private postRecoveryCooldownDuration: number = 0;
  private lastFighterAttacking: boolean = false;

  // Move repetition memory (prevents spamming the same attack)
  private recentAttacks: AttackKind[] = [];

  // Pacing & hesitation timer (creates natural human cadence)
  private hesitationTicks: number = 0;
  private footsieDirection: number = 0; // -1, 0, 1

  private currentInput: FighterInput = {
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

  constructor(difficulty: Difficulty = 'normal') {
    this.difficulty = difficulty;
    this.resetState();
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
    this.resetState();
  }

  public resetState() {
    this.behaviorState = 'NEUTRAL';
    this.decisionTimer = 0;
    this.attackCooldown = 30; // Initial opening grace period
    this.postRecoveryCooldownDuration = 0;
    this.lastFighterAttacking = false;
    this.currentInput = { moveLeft: false, moveRight: false, jump: false, crouch: false, block: false, punch: false, kick: false, grab: false, superAttack: false };
    this.recentAttacks = [];
    this.hesitationTicks = 0;
    this.footsieDirection = 0;
  }

  public getBehaviorState(): AIBehaviorState {
    return this.behaviorState;
  }

  public getAttackCooldown(): number {
    return this.attackCooldown;
  }

  private recordAttack(move: AttackKind) {
    this.recentAttacks.push(move);
    if (this.recentAttacks.length > 4) {
      this.recentAttacks.shift();
    }
  }

  private isMoveRepetitive(move: AttackKind): boolean {
    if (this.recentAttacks.length < 2) return false;
    const last = this.recentAttacks[this.recentAttacks.length - 1];
    const secondLast = this.recentAttacks[this.recentAttacks.length - 2];
    return last === move && secondLast === move;
  }

  public update(cpu: Fighter, player: Fighter): FighterInput {
    // 1. Reset momentary trigger inputs every tick
    this.currentInput.punch = false;
    this.currentInput.kick = false;
    this.currentInput.grab = false;
    this.currentInput.superAttack = false;
    this.currentInput.jump = false;

    // 0. PRACTICE MODE: CPU acts as a training dummy (takes hits, never attacks, never blocks)
    if (this.difficulty === 'practice') {
      this.behaviorState = 'NEUTRAL';
      this.currentInput.moveLeft = false;
      this.currentInput.moveRight = false;
      this.currentInput.block = false;
      this.currentInput.jump = false;
      this.currentInput.crouch = false;
      return this.currentInput;
    }

    // 2. Cooldown Rule: Attack cooldown countdown ONLY begins AFTER the CPU finishes recovery and is back in neutral
    const isCpuCommittedToAttack = cpu.isAttacking();
    if (!isCpuCommittedToAttack && this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Detect when CPU finishes an attack to set post-recovery cooldown
    if (this.lastFighterAttacking && !isCpuCommittedToAttack) {
      // Attack just concluded! Now enforce fair post-recovery gap based on difficulty
      this.attackCooldown = this.postRecoveryCooldownDuration;
    }
    this.lastFighterAttacking = isCpuCommittedToAttack;

    // 3. Difficulty Tuning Parameters
    // Reaction Delay: Easy ~450ms (27 frames), Normal ~300ms (18 frames), Hard ~180ms (11 frames)
    const reactionDelayFrames = this.difficulty === 'hard' ? 11 : this.difficulty === 'normal' ? 18 : 28;
    const blockChance = this.difficulty === 'hard' ? 0.70 : this.difficulty === 'normal' ? 0.40 : 0.15;
    const punishChance = this.difficulty === 'hard' ? 0.85 : this.difficulty === 'normal' ? 0.45 : 0.10;
    const aggressionRate = this.difficulty === 'hard' ? 0.40 : this.difficulty === 'normal' ? 0.22 : 0.10;

    // Post-Recovery Cooldowns (frames after recovery finishes before another attack is legal)
    // Normal: 85 - 120 frames (1.4s - 2.0s) gap between attacks
    // Easy: 125 - 170 frames (2.1s - 2.8s) gap between attacks
    // Hard: 48 - 72 frames (0.8s - 1.2s) gap between attacks
    const punchCooldown = this.difficulty === 'hard' ? 48 : this.difficulty === 'normal' ? 88 : 130;
    const kickCooldown = this.difficulty === 'hard' ? 62 : this.difficulty === 'normal' ? 105 : 150;
    const superCooldown = this.difficulty === 'hard' ? 90 : this.difficulty === 'normal' ? 140 : 180;

    const distance = Math.abs(cpu.x - player.x);
    this.decisionTimer++;

    // 4. RESPECT PLAYER KNOCKDOWN & GETTING UP (Zero spawn camping / wakeup pressure)
    if (player.state === 'knockdown' || player.state === 'getting_up') {
      this.behaviorState = 'WAKEUP_RESET';
      this.attackCooldown = Math.max(this.attackCooldown, 65);
      this.currentInput.block = false;

      // Back away from the grounded opponent to reset to neutral
      if (cpu.facing === 1) {
        this.currentInput.moveLeft = true;
        this.currentInput.moveRight = false;
      } else {
        this.currentInput.moveRight = true;
        this.currentInput.moveLeft = false;
      }
      return this.currentInput;
    }

    // 5. DEFENSIVE REACTION TO INCOMING ATTACK
    // Only reacts if player is in startup/active of a strike within threat range
    if ((player.isInStartup() || player.isInActive()) && distance < 110) {
      // Simulate reaction delay: AI doesn't read memory inputs with 0ms speed
      if (this.decisionTimer % reactionDelayFrames <= 2) {
        if (Math.random() < blockChance) {
          this.behaviorState = 'DEFEND';
          // Hold back to block
          if (cpu.facing === 1) {
            this.currentInput.moveLeft = true;
            this.currentInput.moveRight = false;
          } else {
            this.currentInput.moveRight = true;
            this.currentInput.moveLeft = false;
          }
          this.currentInput.block = true;
          return this.currentInput;
        }
      }
    } else {
      this.currentInput.block = false;
    }

    // 6. WHIFF PUNISHMENT
    // If player is trapped in attack recovery frames, within reach, and AI is free to act
    if (this.decisionTimer % reactionDelayFrames === 0 && player.isInRecovery() && distance < 85 && cpu.canAct() && cpu.attackCooldown <= 0 && this.attackCooldown <= 0) {
      if (Math.random() < punishChance) {
        this.behaviorState = 'PUNISH';
        // Punish with quick punch or kick
        if (distance < 55 && !this.isMoveRepetitive('punch')) {
          this.currentInput.punch = true;
          this.recordAttack('punch');
          this.postRecoveryCooldownDuration = punchCooldown;
        } else if (!this.isMoveRepetitive('kick')) {
          this.currentInput.kick = true;
          this.recordAttack('kick');
          this.postRecoveryCooldownDuration = kickCooldown;
        }
        return this.currentInput;
      }
    }

    // 7. STRATEGIC DECISION-MAKING CLOCK
    // AI reassesses tactical state every `reactionDelayFrames`
    if (this.decisionTimer % reactionDelayFrames === 0) {
      // A. Super Attack Decision
      if (cpu.superMeter >= 100 && distance < 120 && cpu.canAct() && cpu.attackCooldown <= 0 && this.attackCooldown <= 0) {
        const superChance = this.difficulty === 'hard' ? 0.70 : this.difficulty === 'normal' ? 0.35 : 0.15;
        if (Math.random() < superChance && !player.isInRecovery()) {
          this.behaviorState = 'ATTACK';
          this.currentInput.superAttack = true;
          this.recordAttack('super');
          this.postRecoveryCooldownDuration = superCooldown;
          this.currentInput.moveLeft = false;
          this.currentInput.moveRight = false;
          return this.currentInput;
        }
      }

      // B. Counter Turtling: Throw / Grab against continuous blocking
      if (player.state === 'block' && distance < 60 && cpu.canAct() && cpu.attackCooldown <= 0 && this.attackCooldown <= 0) {
        const grabChance = this.difficulty === 'hard' ? 0.70 : this.difficulty === 'normal' ? 0.35 : 0.05;
        if (Math.random() < grabChance && !this.isMoveRepetitive('grab')) {
          this.behaviorState = 'ATTACK';
          this.currentInput.grab = true;
          this.recordAttack('grab');
          this.postRecoveryCooldownDuration = Math.round(punchCooldown * 1.25);
          return this.currentInput;
        }
      }

      // C. Normal Attack Decision (Close & Mid Range)
      if (cpu.canAct() && cpu.attackCooldown <= 0 && this.attackCooldown <= 0) {
        // Close Range (< 65px)
        if (distance < 65 && Math.random() < aggressionRate) {
          this.behaviorState = 'ATTACK';
          // Decide between Punch and Kick based on repetition filter
          const preferPunch = Math.random() > 0.45;
          if (preferPunch && !this.isMoveRepetitive('punch')) {
            this.currentInput.punch = true;
            this.recordAttack('punch');
            this.postRecoveryCooldownDuration = punchCooldown;
          } else if (!this.isMoveRepetitive('kick')) {
            this.currentInput.kick = true;
            this.recordAttack('kick');
            this.postRecoveryCooldownDuration = kickCooldown;
          } else if (!this.isMoveRepetitive('punch')) {
            this.currentInput.punch = true;
            this.recordAttack('punch');
            this.postRecoveryCooldownDuration = punchCooldown;
          } else {
            // Repetition penalty: retreat slightly instead of spamming
            this.behaviorState = 'RETREAT';
          }
          return this.currentInput;
        }

        // Mid Range (65px - 110px)
        if (distance >= 65 && distance <= 110 && Math.random() < (aggressionRate * 0.65)) {
          if (!this.isMoveRepetitive('kick')) {
            this.behaviorState = 'ATTACK';
            this.currentInput.kick = true;
            this.recordAttack('kick');
            this.postRecoveryCooldownDuration = kickCooldown;
            return this.currentInput;
          }
        }
      }

      // D. Tactical Spacing & Footsies (NEUTRAL / APPROACH / RETREAT)
      const optimalRange = this.difficulty === 'hard' ? 70 : 85;

      if (distance > optimalRange + 25) {
        // Too far: approach calmly
        this.behaviorState = 'APPROACH';
        if (cpu.x < player.x) {
          this.currentInput.moveRight = true;
          this.currentInput.moveLeft = false;
        } else {
          this.currentInput.moveLeft = true;
          this.currentInput.moveRight = false;
        }
      } else if (distance < 46) {
        // Too close: backstep to retain strike spacing
        this.behaviorState = 'RETREAT';
        if (cpu.x < player.x) {
          this.currentInput.moveLeft = true;
          this.currentInput.moveRight = false;
        } else {
          this.currentInput.moveRight = true;
          this.currentInput.moveLeft = false;
        }
      } else {
        // In the sweet spot (Neutral footsies)
        this.behaviorState = 'NEUTRAL';
        // Random micro-feinting: step back and forth naturally
        const feintRoll = Math.random();
        if (feintRoll < 0.25) {
          // Micro step back
          this.currentInput.moveLeft = cpu.facing === 1;
          this.currentInput.moveRight = cpu.facing === -1;
        } else if (feintRoll < 0.50) {
          // Micro step forward
          this.currentInput.moveRight = cpu.facing === 1;
          this.currentInput.moveLeft = cpu.facing === -1;
        } else {
          // Stand ground and observe
          this.currentInput.moveLeft = false;
          this.currentInput.moveRight = false;
        }
      }

      // Hard Mode: Occasional jump-in mixup
      if (this.difficulty === 'hard' && distance > 95 && distance < 140 && Math.random() < 0.10 && cpu.isGrounded) {
        this.currentInput.jump = true;
      }
    }

    return this.currentInput;
  }
}
