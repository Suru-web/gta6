import { Character } from '@/types/game';
import { ActionState, AttackType, AttackPhase, Rect, HitResult } from './types';
import { MoveDefinition, AttackKind, getCharacterMove, calculateComboDamage } from './moves';
import { attackExtension } from './attackTimeline';
import { gameAudio } from './audio';

export interface FighterInput {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  crouch: boolean;
  block: boolean;
  punch: boolean;
  kick: boolean;
  grab: boolean;
  superAttack: boolean;
}

export class Fighter {
  public character: Character;
  public isPlayer: boolean;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public facing: number = 1; // 1 = right, -1 = left
  public state: ActionState = 'idle';
  public stateFrame: number = 0;

  public maxHealth: number;
  public health: number;
  public superMeter: number = 0; // 0 - 100

  public width: number = 52;
  public height: number = 115;
  public groundY: number = 420;

  public isGrounded: boolean = true;
  public attackHit: boolean = false;
  public currentAttackType: AttackType = null;
  public attackPhase: AttackPhase = 'none';
  public currentMove: MoveDefinition | null = null;
  public superVariant: 0 | 1 = 0;
  private nextSuperVariant: 0 | 1 = 0;

  public hitstunFrames: number = 0;
  public blockstunFrames: number = 0;
  public hitstopFrames: number = 0;
  public isBlocking: boolean = false;
  public invincibleFrames: number = 0;
  public attackCooldown: number = 0; // Anti-mash delay between attacks

  // Input buffering (up to 5 frames)
  private inputBuffer: { attack: AttackKind; framesRemaining: number } | null = null;

  public comboCounter: number = 0;
  public comboTimer: number = 0;

  public totalDamageDealt: number = 0;
  public totalDamageTaken: number = 0;
  public maxCombo: number = 0;

  constructor(character: Character, isPlayer: boolean, startX: number, groundY: number = 420) {
    this.character = character;
    this.isPlayer = isPlayer;
    this.x = startX;
    this.groundY = groundY;
    this.y = groundY;
    this.facing = isPlayer ? 1 : -1;

    this.maxHealth = character.stats.health;
    this.health = this.maxHealth;
  }

  public resetPosition(startX: number) {
    this.x = startX;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.stateFrame = 0;
    this.isGrounded = true;
    this.attackHit = false;
    this.currentAttackType = null;
    this.attackPhase = 'none';
    this.currentMove = null;
    this.superVariant = 0;
    this.nextSuperVariant = 0;
    this.invincibleFrames = 0;
    this.hitstunFrames = 0;
    this.blockstunFrames = 0;
    this.hitstopFrames = 0;
    this.isBlocking = false;
    this.attackCooldown = 0;
    this.inputBuffer = null;
    this.health = this.maxHealth;
    this.facing = this.isPlayer ? 1 : -1;
  }

  public isAttacking(): boolean {
    return ['punch', 'kick', 'grab', 'super'].includes(this.state);
  }

  public isInStartup(): boolean {
    return this.isAttacking() && this.attackPhase === 'startup';
  }

  public isInActive(): boolean {
    return this.isAttacking() && this.attackPhase === 'active';
  }

  public isInRecovery(): boolean {
    return this.isAttacking() && this.attackPhase === 'recovery';
  }

  public canAct(): boolean {
    if (this.hitstopFrames > 0) return false;
    if (['hitstun', 'blockstun', 'knockdown', 'getting_up', 'victory', 'defeat'].includes(this.state)) return false;
    if (this.isAttacking()) return false;
    return true;
  }

  public canBlock(): boolean {
    return this.isGrounded && !this.isAttacking() && !['hitstun', 'knockdown', 'getting_up'].includes(this.state);
  }

  public getHurtbox(): Rect {
    const isCrouching = this.state === 'crouch';
    const currentHeight = isCrouching ? this.height * 0.65 : this.height;
    return {
      x: this.x - this.width / 2,
      y: this.y - currentHeight,
      width: this.width,
      height: currentHeight,
    };
  }

  public getHitbox(): (Rect & { type: AttackType; damage: number; knockback: number; hitstop: number; isUnblockable: boolean }) | null {
    // Damage can ONLY connect during valid ACTIVE frames and only ONCE per attack instance
    if (!this.isInActive() || this.attackHit || !this.currentMove) {
      return null;
    }

    const move = this.currentMove;
    const hitWidth = move.range * attackExtension(move, this.stateFrame);
    const hitHeight = move.height;
    // The damaging area is at the end of the strike, not a rectangle covering
    // the entire space between the fighter and the far end of their reach.
    const tipWidth = Math.min(hitWidth, move.type === 'grab' ? 35 : 30);
    const hitX = this.facing === 1 ? this.x + 8 + hitWidth - tipWidth : this.x - 8 - hitWidth;
    const hitY = this.y - this.height * move.yOffsetRatio;

    return {
      x: hitX,
      y: hitY,
      width: tipWidth,
      height: hitHeight,
      type: move.type,
      damage: move.baseDamage,
      knockback: move.knockback,
      hitstop: move.hitstopFrames,
      isUnblockable: move.isUnblockable,
    };
  }

  public takeDamage(
    amount: number,
    attackType: AttackType,
    fromDirection: number,
    isSuper: boolean = false
  ): HitResult {
    // 1. Invincibility or Knockdown protection
    if (this.invincibleFrames > 0 || this.state === 'knockdown' || this.state === 'getting_up' || this.health <= 0) {
      return {
        hit: false,
        blocked: false,
        actualDamage: 0,
        isCounterHit: false,
        hitstopFrames: 0,
        knockdown: false,
      };
    }

    const move = attackType ? getCharacterMove(this.character, attackType as AttackKind) : null;
    const isGrab = move?.isUnblockable || attackType === 'grab';
    const hitstop = move ? move.hitstopFrames : 5;

    // 2. Check Blocking: Defender is holding back away from the attack (Grabs pierce blocks)
    const isFacingAttacker = (this.facing === 1 && fromDirection === -1) ||
                             (this.facing === -1 && fromDirection === 1);
    const holdingBack = isFacingAttacker && this.isBlocking;

    if (holdingBack && !isGrab && this.canBlock()) {
      // Successful Block
      const chipRatio = move ? move.chipRatio : 0.15;
      const chipDamage = Math.max(1, Math.round(amount * chipRatio));
      this.health = Math.max(1, this.health - chipDamage); // Chip damage cannot KO
      this.totalDamageTaken += chipDamage;

      this.state = 'blockstun';
      this.stateFrame = 0;
      this.blockstunFrames = move ? move.blockstunFrames : 8;
      this.hitstopFrames = hitstop;
      this.vx = fromDirection * 3.8; // Block pushback

      gameAudio.playBlock();
      return {
        hit: true,
        blocked: true,
        actualDamage: chipDamage,
        isCounterHit: false,
        hitstopFrames: hitstop,
        knockdown: false,
      };
    }

    // 3. Direct Clean Hit (or Counter Hit)
    const isCounterHit = this.isInStartup() || this.isInActive();
    const counterMultiplier = isCounterHit ? 1.20 : 1.0;

    // Combo Scaling
    const scaledDamage = calculateComboDamage(amount, this.comboCounter);
    const defenceFactor = 100 / this.character.stats.defence;
    const actualDamage = Math.max(2, Math.round(scaledDamage * counterMultiplier * defenceFactor));

    this.health = Math.max(0, this.health - actualDamage);
    this.totalDamageTaken += actualDamage;

    // Super meter build on taking damage
    this.superMeter = Math.min(100, this.superMeter + 4);
    this.hitstopFrames = hitstop;

    // 4. Knockout Check
    if (this.health <= 0) {
      this.state = 'knockdown';
      this.stateFrame = 0;
      this.vx = fromDirection * 12;
      this.vy = -7.5;
      this.isGrounded = false;
      this.attackPhase = 'none';
      this.currentAttackType = null;
      this.currentMove = null;
      gameAudio.playKnockout();
      return {
        hit: true,
        blocked: false,
        actualDamage,
        isCounterHit,
        hitstopFrames: hitstop + 4,
        knockdown: true,
      };
    }

    // 5. Knockdown or Hitstun State
    const causesKnockdown = (move?.causesKnockdown ?? false) || isSuper || isGrab || actualDamage >= 26;

    if (causesKnockdown) {
      this.state = 'knockdown';
      this.stateFrame = 0;
      this.vx = fromDirection * (isSuper ? 17 : 11);
      this.vy = -6.2;
      this.isGrounded = false;
      this.attackPhase = 'none';
      this.currentAttackType = null;
      this.currentMove = null;
    } else {
      this.state = 'hitstun';
      this.stateFrame = 0;
      const baseStun = move ? move.hitstunFrames : 18;
      this.hitstunFrames = isCounterHit ? baseStun + 4 : baseStun;
      this.vx = fromDirection * (move ? move.knockback * 0.7 : 4);
      this.attackPhase = 'none';
      this.currentAttackType = null;
      this.currentMove = null;
    }

    if (attackType === 'kick') gameAudio.playKick();
    else gameAudio.playPunch();

    return {
      hit: true,
      blocked: false,
      actualDamage,
      isCounterHit,
      hitstopFrames: hitstop,
      knockdown: causesKnockdown,
    };
  }

  public registerHitLanded(damageDealt: number, attackType: AttackType) {
    this.attackHit = true;
    this.totalDamageDealt += damageDealt;
    this.comboCounter += 1;
    this.comboTimer = 75; // 1.25 seconds combo retention window
    if (this.comboCounter > this.maxCombo) {
      this.maxCombo = this.comboCounter;
    }

    // Award Super meter based on move definition
    const move = attackType ? getCharacterMove(this.character, attackType as AttackKind) : null;
    const meterGain = move ? move.meterGain : 7;
    this.superMeter = Math.min(100, this.superMeter + meterGain);
  }

  private initiateAttack(type: AttackKind) {
    const move = getCharacterMove(this.character, type);
    if (type === 'super') {
      if (this.superMeter < move.meterCost) return false;
      this.superMeter -= move.meterCost;
      this.superVariant = this.nextSuperVariant;
      this.nextSuperVariant = this.nextSuperVariant === 0 ? 1 : 0;
      gameAudio.playSuperSurge();
    } else {
      gameAudio.playWhoosh();
    }

    this.state = type;
    this.stateFrame = 1; // Start on frame 1 of the attack
    this.currentAttackType = type;
    this.currentMove = move;
    this.attackHit = false;
    this.attackPhase = 'startup';
    this.vx = type === 'punch' ? this.facing * 1.4 : type === 'kick' ? this.facing * 2.0 : 0;
    return true;
  }

  public update(input: FighterInput, opponentX: number, arenaWidth: number) {
    // 1. Process Hitstop Freeze: both fighters pause briefly on impact
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      return;
    }

    this.stateFrame++;

    if (this.invincibleFrames > 0) {
      this.invincibleFrames--;
    }

    // Decrement anti-mash lockout delay when in neutral
    if (this.attackCooldown > 0 && !this.isAttacking()) {
      this.attackCooldown--;
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCounter = 0;
      }
    }

    // Auto-face opponent when in neutral states
    const lockedFacing = this.isAttacking() || ['hitstun', 'blockstun', 'knockdown', 'getting_up', 'victory', 'defeat'].includes(this.state);
    if (!lockedFacing && this.isGrounded) {
      this.facing = this.x < opponentX ? 1 : -1;
    }

    // Guard intent (holding backward away from opponent or explicit block button)
    const holdingBack = (this.facing === 1 && input.moveLeft) || (this.facing === -1 && input.moveRight) || input.block;
    this.isBlocking = holdingBack && this.canBlock();

    // Input buffer expiration
    if (this.inputBuffer) {
      this.inputBuffer.framesRemaining--;
      if (this.inputBuffer.framesRemaining <= 0) {
        this.inputBuffer = null;
      }
    }

    // Read and buffer momentary attack inputs (only when not locked out by anti-mash delay)
    if (this.attackCooldown <= 0) {
      if (input.superAttack && this.superMeter >= 100) {
        this.inputBuffer = { attack: 'super', framesRemaining: 5 };
      } else if (input.grab) {
        this.inputBuffer = { attack: 'grab', framesRemaining: 5 };
      } else if (input.kick) {
        this.inputBuffer = { attack: 'kick', framesRemaining: 5 };
      } else if (input.punch) {
        this.inputBuffer = { attack: 'punch', framesRemaining: 5 };
      }
    } else {
      this.inputBuffer = null;
    }

    // Speed multiplier from character stats
    const speedMult = this.character.stats.speed / 100;
    const walkSpeed = 4.2 * speedMult;
    const attackMoveDirection = Number(input.moveRight) - Number(input.moveLeft);
    const attackMoveSpeed = walkSpeed * 0.55;

    // 2. STATE MACHINE
    switch (this.state) {
      case 'idle':
      case 'walk_fwd':
      case 'walk_back':
      case 'block':
      case 'crouch': {
        // Execute buffered attack if available
        if (this.inputBuffer && this.isGrounded) {
          const buffered = this.inputBuffer.attack;
          this.inputBuffer = null;
          if (this.initiateAttack(buffered)) {
            if (attackMoveDirection !== 0) this.vx = attackMoveDirection * attackMoveSpeed;
            break;
          }
        }

        // Jump
        if (input.jump && this.isGrounded) {
          this.state = 'jump';
          this.stateFrame = 0;
          this.isGrounded = false;
          this.vy = -12.5;
          if (input.moveRight) this.vx = walkSpeed * 0.9;
          else if (input.moveLeft) this.vx = -walkSpeed * 0.9;
          else this.vx = 0;
          break;
        }

        // Crouch
        if (input.crouch && this.isGrounded) {
          if (this.state !== 'crouch') this.stateFrame = 0;
          this.state = 'crouch';
          this.vx = 0;
          break;
        }

        // Block
        // Holding away guards while walking backwards. The dedicated block
        // button still plants the fighter in place.
        if (this.isBlocking && input.block) {
          this.state = 'block';
          this.vx = 0;
          break;
        }

        // Horizontal Movement
        if (input.moveRight) {
          this.vx = walkSpeed;
          this.state = this.facing === 1 ? 'walk_fwd' : 'walk_back';
        } else if (input.moveLeft) {
          this.vx = -walkSpeed;
          this.state = this.facing === -1 ? 'walk_fwd' : 'walk_back';
        } else {
          this.vx = 0;
          this.state = 'idle';
        }
        break;
      }

      case 'jump': {
        if (this.isGrounded) {
          this.state = 'idle';
          this.stateFrame = 0;
        }
        break;
      }

      // 3. ATTACK STATES (Startup -> Active -> Recovery)
      case 'punch':
      case 'kick':
      case 'grab':
      case 'super': {
        const move = this.currentMove || getCharacterMove(this.character, this.state);
        const startup = move.startupFrames;
        const activeEnd = startup + move.activeFrames;
        const total = move.totalFrames;

        // Keep deliberate footwork available during a committed strike. The
        // fighter cannot turn around or bypass startup, contact, or recovery.
        if (this.isGrounded && attackMoveDirection !== 0) {
          this.vx = attackMoveDirection * attackMoveSpeed;
        }

        // Check Target Combo Cancel Window (e.g. punch -> kick on hit)
        if (this.attackHit && move.cancelWindow && this.stateFrame >= move.cancelWindow.start && this.stateFrame <= move.cancelWindow.end) {
          if (this.inputBuffer && this.inputBuffer.attack === 'kick') {
            const buffered = this.inputBuffer.attack;
            this.inputBuffer = null;
            this.initiateAttack(buffered);
            break;
          }
        }

        // Advance Attack Phases deterministically
        if (this.stateFrame <= startup) {
          this.attackPhase = 'startup';
        } else if (this.stateFrame <= activeEnd) {
          this.attackPhase = 'active';
        } else if (this.stateFrame <= total) {
          this.attackPhase = 'recovery';
        } else {
          // Attack Complete -> Return cleanly to neutral Idle with anti-mash lockout delay
          this.state = 'idle';
          this.stateFrame = 0;
          this.attackPhase = 'none';
          this.currentAttackType = null;
          this.currentMove = null;
          this.attackHit = false;
          // Set anti-mash lockout delay (10 frames for punch, 14 frames for kick, 18 frames for grab/super)
          this.attackCooldown = move.type === 'punch' ? 10 : move.type === 'kick' ? 14 : 18;
        }
        break;
      }

      case 'blockstun': {
        if (this.stateFrame >= this.blockstunFrames) {
          this.state = this.isBlocking ? 'block' : 'idle';
          this.stateFrame = 0;
        }
        break;
      }

      case 'hitstun': {
        if (this.stateFrame >= this.hitstunFrames) {
          this.state = 'idle';
          this.stateFrame = 0;
        }
        break;
      }

      case 'knockdown': {
        // Ground impact & stay down for 32 frames
        if (this.isGrounded && this.stateFrame >= 32) {
          if (this.health > 0) {
            this.state = 'getting_up';
            this.stateFrame = 0;
            this.invincibleFrames = 18; // Invincible while getting up
          }
        }
        break;
      }

      case 'getting_up': {
        // Stand up animation transition (18 frames) -> return to idle with 6 bonus invincibility frames
        if (this.stateFrame >= 18) {
          this.state = 'idle';
          this.stateFrame = 0;
          this.invincibleFrames = 6; // Wakeup spacing buffer
        }
        break;
      }

      case 'victory':
      case 'defeat': {
        this.vx = 0;
        break;
      }
    }

    // 4. Gravity & Ground Physics
    if (!this.isGrounded) {
      this.vy += 0.72; // Gravity
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.isGrounded) {
      this.vx *= 0.82; // Ground friction
    }

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Arena Boundaries
    const minX = 40;
    const maxX = arenaWidth - 40;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Shadow
    const shadowWidth = this.width * (this.isGrounded ? 1.4 : 0.8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY + 4, shadowWidth / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Silhouette & Costume
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const isCrouching = this.state === 'crouch';
    const isKnockdown = this.state === 'knockdown';
    const isGettingUp = this.state === 'getting_up';
    const isHitstun = this.state === 'hitstun' || this.state === 'blockstun';

    if (isKnockdown) {
      ctx.rotate(-Math.PI / 2.2);
    } else if (isGettingUp) {
      ctx.rotate(-Math.PI / 4 * (1 - this.stateFrame / 18));
    }

    if (isHitstun && Math.floor(this.stateFrame / 2) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    if (this.state === 'super') {
      ctx.shadowColor = this.character.themeColor;
      ctx.shadowBlur = 18;
    }

    const currentHeight = isCrouching ? this.height * 0.65 : this.height;

    // Legs / Pants
    ctx.fillStyle = '#1e293b';
    if (this.character.id === 'claude') ctx.fillStyle = '#15803d';
    if (this.character.id === 'carl-johnson') ctx.fillStyle = '#1d4ed8';
    if (this.character.id === 'tommy-vercetti') ctx.fillStyle = '#0284c7';

    if (isCrouching) {
      ctx.fillRect(-16, -30, 32, 28);
    } else if (this.state === 'kick' && this.attackPhase === 'active') {
      ctx.fillRect(-10, -50, 18, 50);
      ctx.save();
      ctx.fillStyle = this.character.accentColor;
      ctx.fillRect(8, -48, 54, 18);
      ctx.restore();
    } else {
      ctx.fillRect(-14, -50, 12, 50);
      ctx.fillRect(2, -50, 12, 50);
    }

    // Torso / Shirt
    ctx.fillStyle = this.character.themeColor;
    const torsoY = isCrouching ? -currentHeight + 10 : -currentHeight + 35;
    const torsoH = isCrouching ? 28 : 42;
    ctx.fillRect(-16, torsoY, 32, torsoH);

    // Head
    ctx.fillStyle = this.character.id === 'carl-johnson' ? '#8d5524' : '#f5d0b0';
    const headY = isCrouching ? torsoY - 22 : -currentHeight + 10;
    ctx.beginPath();
    ctx.arc(0, headY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Arms / Attack Pose
    ctx.fillStyle = this.character.accentColor;
    if (this.state === 'punch' && this.attackPhase === 'active') {
      ctx.fillRect(8, torsoY + 6, 44, 14); // Extended punch arm
    } else if (this.state === 'block' || this.state === 'blockstun') {
      ctx.fillRect(4, torsoY + 4, 14, 30); // Raised guard arms
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, torsoY + 16, 22, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else {
      ctx.fillRect(-18, torsoY + 4, 10, 24);
      ctx.fillRect(8, torsoY + 4, 10, 24);
    }

    ctx.restore();
  }
}
