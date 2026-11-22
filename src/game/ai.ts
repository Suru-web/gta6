import { Fighter, FighterInput } from './fighter';
import { Difficulty } from '@/types/game';

export class CPUController {
  private difficulty: Difficulty;
  private reactionTimer: number = 0;
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

  private attackCooldown: number = 0;
  private comboStep: number = 0;

  constructor(difficulty: Difficulty = 'normal') {
    this.difficulty = difficulty;
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  public update(cpu: Fighter, player: Fighter): FighterInput {
    // Reset momentary inputs
    this.currentInput.punch = false;
    this.currentInput.kick = false;
    this.currentInput.grab = false;
    this.currentInput.superAttack = false;
    this.currentInput.jump = false;

    if (this.attackCooldown > 0) this.attackCooldown--;

    const distance = Math.abs(cpu.x - player.x);
    const playerIsAttacking = ['punch', 'kick', 'grab', 'super'].includes(player.state);
    const playerInRecovery = playerIsAttacking && player.stateFrame > 10;
    const playerIsBlocking = player.state === 'block';

    // Difficulty settings
    const reactionDelay = this.difficulty === 'hard' ? 5 : this.difficulty === 'normal' ? 14 : 26;
    const blockChance = this.difficulty === 'hard' ? 0.88 : this.difficulty === 'normal' ? 0.58 : 0.22;
    const aggressionRate = this.difficulty === 'hard' ? 0.85 : this.difficulty === 'normal' ? 0.55 : 0.3;

    this.reactionTimer++;

    // 1. REACTION TO INCOMING ATTACKS (DEFENSE / BLOCKING)
    if (playerIsAttacking && distance < 110) {
      if (Math.random() < blockChance) {
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
    } else {
      this.currentInput.block = false;
    }

    // Only update strategic movement every `reactionDelay` frames
    if (this.reactionTimer % reactionDelay === 0) {
      // 2. SUPER ATTACK DECISION
      if (cpu.superMeter >= 100 && distance < 130) {
        const superChance = this.difficulty === 'hard' ? 0.9 : this.difficulty === 'normal' ? 0.6 : 0.35;
        if (Math.random() < superChance) {
          this.currentInput.superAttack = true;
          this.currentInput.moveLeft = false;
          this.currentInput.moveRight = false;
          return this.currentInput;
        }
      }

      // 3. CLOSE RANGE COMBAT (< 80px)
      if (distance < 75) {
        // If player is blocking, use GRAB (unblockable)
        if (playerIsBlocking && this.difficulty !== 'easy') {
          const grabChance = this.difficulty === 'hard' ? 0.75 : 0.45;
          if (Math.random() < grabChance) {
            this.currentInput.grab = true;
            return this.currentInput;
          }
        }

        // Punish player whiff or attack directly
        if (this.attackCooldown <= 0 && Math.random() < aggressionRate) {
          if (this.difficulty === 'hard' || (this.difficulty === 'normal' && Math.random() > 0.4)) {
            // Combo initiation: alternate punch and kick
            if (this.comboStep === 0) {
              this.currentInput.punch = true;
              this.comboStep = 1;
              this.attackCooldown = 8;
            } else {
              this.currentInput.kick = true;
              this.comboStep = 0;
              this.attackCooldown = 14;
            }
          } else {
            // Easy mode: simple random punch/kick
            if (Math.random() > 0.5) this.currentInput.punch = true;
            else this.currentInput.kick = true;
            this.attackCooldown = 22;
          }
          return this.currentInput;
        }
      }

      // 4. MID RANGE (75px - 140px)
      if (distance >= 75 && distance <= 140) {
        if (this.attackCooldown <= 0 && Math.random() < (aggressionRate * 0.75)) {
          // Mid-range kick has good reach
          this.currentInput.kick = true;
          this.attackCooldown = 16;
          return this.currentInput;
        }
      }

      // 5. MOVEMENT AND SPACING
      const targetDistance = this.difficulty === 'hard' ? 65 : 85;

      if (distance > targetDistance) {
        // Advance towards player
        if (cpu.x < player.x) {
          this.currentInput.moveRight = true;
          this.currentInput.moveLeft = false;
        } else {
          this.currentInput.moveLeft = true;
          this.currentInput.moveRight = false;
        }
      } else if (distance < 45) {
        // Slight back-step if too crowded
        if (cpu.x < player.x) {
          this.currentInput.moveLeft = true;
          this.currentInput.moveRight = false;
        } else {
          this.currentInput.moveRight = true;
          this.currentInput.moveLeft = false;
        }
      } else {
        // Stand ground
        this.currentInput.moveLeft = false;
        this.currentInput.moveRight = false;
      }

      // Jump mixup (occasional leap attack in Hard mode)
      if (this.difficulty === 'hard' && distance > 100 && Math.random() < 0.12 && cpu.isGrounded) {
        this.currentInput.jump = true;
      }
    }

    return this.currentInput;
  }
}
