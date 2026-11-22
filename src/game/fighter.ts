import { Character } from '@/types/game';
import { ActionState, AttackType, Rect } from './types';
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
  public hitstunFrames: number = 0;
  public isBlocking: boolean = false;

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
    this.hitstunFrames = 0;
    this.isBlocking = false;
    this.health = this.maxHealth;
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

  public getHitbox(): (Rect & { type: AttackType; damage: number; knockback: number }) | null {
    if (this.attackHit) return null;

    const reachBonus = (this.character.stats.strength - 100) * 0.15;

    // 1. PUNCH: Active frames 4 to 9
    if (this.state === 'punch' && this.stateFrame >= 4 && this.stateFrame <= 9) {
      const punchWidth = 48 + reachBonus;
      const punchHeight = 28;
      const hitX = this.facing === 1 ? this.x + 8 : this.x - 8 - punchWidth;
      const hitY = this.y - this.height * 0.72;
      return {
        x: hitX,
        y: hitY,
        width: punchWidth,
        height: punchHeight,
        type: 'punch',
        damage: Math.round(10 * (this.character.stats.strength / 100)),
        knockback: 5,
      };
    }

    // 2. KICK: Active frames 6 to 13
    if (this.state === 'kick' && this.stateFrame >= 6 && this.stateFrame <= 13) {
      const kickWidth = 62 + reachBonus;
      const kickHeight = 32;
      const hitX = this.facing === 1 ? this.x + 10 : this.x - 10 - kickWidth;
      const hitY = this.y - this.height * 0.45;
      return {
        x: hitX,
        y: hitY,
        width: kickWidth,
        height: kickHeight,
        type: 'kick',
        damage: Math.round(16 * (this.character.stats.strength / 100)),
        knockback: 9,
      };
    }

    // 3. GRAB: Active frames 5 to 11 (close range)
    if (this.state === 'grab' && this.stateFrame >= 5 && this.stateFrame <= 11) {
      const grabWidth = 38;
      const grabHeight = 50;
      const hitX = this.facing === 1 ? this.x : this.x - grabWidth;
      const hitY = this.y - this.height * 0.75;
      return {
        x: hitX,
        y: hitY,
        width: grabWidth,
        height: grabHeight,
        type: 'grab',
        damage: Math.round(22 * (this.character.stats.strength / 100)),
        knockback: 14,
      };
    }

    // 4. SUPER ATTACK: Active frames 8 to 22
    if (this.state === 'super' && this.stateFrame >= 8 && this.stateFrame <= 22) {
      const superWidth = 90 + reachBonus;
      const superHeight = 85;
      const hitX = this.facing === 1 ? this.x + 12 : this.x - 12 - superWidth;
      const hitY = this.y - this.height * 0.85;
      return {
        x: hitX,
        y: hitY,
        width: superWidth,
        height: superHeight,
        type: 'super',
        damage: Math.round(this.character.specialMove.damage * (this.character.stats.strength / 100)),
        knockback: 22,
      };
    }

    return null;
  }

  public takeDamage(
    amount: number,
    attackType: AttackType,
    fromDirection: number,
    isSuper: boolean = false
  ): { blocked: boolean; actualDamage: number } {
    if (this.state === 'knockdown' || this.health <= 0) {
      return { blocked: false, actualDamage: 0 };
    }

    // Check Block: If holding back away from attack (Grabs cannot be blocked)
    const canBlock = attackType !== 'grab';
    const holdingBack = (this.facing === 1 && fromDirection === 1 && this.isBlocking) ||
                        (this.facing === -1 && fromDirection === -1 && this.isBlocking);

    if (canBlock && holdingBack) {
      // Successful Block: 80% damage reduction, no hitstun
      const chipDamage = Math.max(1, Math.round(amount * 0.2));
      this.health = Math.max(0, this.health - chipDamage);
      this.totalDamageTaken += chipDamage;
      this.vx = fromDirection * 3.5; // slight block pushback
      gameAudio.playBlock();
      return { blocked: true, actualDamage: chipDamage };
    }

    // Direct Hit
    const defenceFactor = 100 / this.character.stats.defence;
    const actualDamage = Math.max(2, Math.round(amount * defenceFactor));

    this.health = Math.max(0, this.health - actualDamage);
    this.totalDamageTaken += actualDamage;

    // Build super meter on taking damage
    this.superMeter = Math.min(100, this.superMeter + 4);

    if (this.health <= 0) {
      this.state = 'knockdown';
      this.stateFrame = 0;
      this.vx = fromDirection * 12;
      this.vy = -7;
      this.isGrounded = false;
      gameAudio.playKnockout();
      return { blocked: false, actualDamage };
    }

    // Hit reaction
    if (attackType === 'super' || attackType === 'grab' || actualDamage >= 24) {
      this.state = 'knockdown';
      this.stateFrame = 0;
      this.vx = fromDirection * (isSuper ? 18 : 12);
      this.vy = -6;
      this.isGrounded = false;
    } else {
      this.state = 'hitstun';
      this.stateFrame = 0;
      this.hitstunFrames = attackType === 'kick' ? 14 : 10;
      this.vx = fromDirection * (attackType === 'kick' ? 7 : 4);
    }

    if (attackType === 'kick') gameAudio.playKick();
    else gameAudio.playPunch();

    return { blocked: false, actualDamage };
  }

  public registerHitLanded(damageDealt: number, attackType: AttackType) {
    this.attackHit = true;
    this.totalDamageDealt += damageDealt;
    this.comboCounter += 1;
    this.comboTimer = 90; // 1.5 seconds at 60fps
    if (this.comboCounter > this.maxCombo) {
      this.maxCombo = this.comboCounter;
    }

    // Super meter build
    const meterGain = attackType === 'super' ? 0 : attackType === 'kick' ? 10 : 7;
    this.superMeter = Math.min(100, this.superMeter + meterGain);
  }

  public update(input: FighterInput, opponentX: number, arenaWidth: number) {
    this.stateFrame++;

    // Update combo decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCounter = 0;
      }
    }

    // Auto-face opponent unless locked in active attack/hitstun/knockdown
    const isLocked = ['punch', 'kick', 'grab', 'super', 'hitstun', 'knockdown', 'victory', 'defeat'].includes(this.state);
    if (!isLocked && this.isGrounded) {
      this.facing = this.x < opponentX ? 1 : -1;
    }

    // Check blocking intent (holding back relative to opponent)
    const holdingBack = (this.facing === 1 && input.moveLeft) || (this.facing === -1 && input.moveRight) || input.block;
    this.isBlocking = holdingBack && this.isGrounded && !['punch', 'kick', 'grab', 'super'].includes(this.state);

    // Speed multiplier from stats
    const speedMult = this.character.stats.speed / 100;
    const walkSpeed = 4.2 * speedMult;

    // State Machine
    switch (this.state) {
      case 'idle':
      case 'walk_fwd':
      case 'walk_back':
      case 'block':
      case 'crouch': {
        // Attack inputs take highest priority
        if (input.superAttack && this.superMeter >= 100 && this.isGrounded) {
          this.state = 'super';
          this.stateFrame = 0;
          this.attackHit = false;
          this.currentAttackType = 'super';
          this.superMeter = 0;
          this.vx = 0;
          gameAudio.playSuperSurge();
          break;
        }

        if (input.grab && this.isGrounded) {
          this.state = 'grab';
          this.stateFrame = 0;
          this.attackHit = false;
          this.currentAttackType = 'grab';
          this.vx = 0;
          gameAudio.playWhoosh();
          break;
        }

        if (input.punch && this.isGrounded) {
          this.state = 'punch';
          this.stateFrame = 0;
          this.attackHit = false;
          this.currentAttackType = 'punch';
          this.vx = this.facing * 1.5; // slight forward step
          gameAudio.playWhoosh();
          break;
        }

        if (input.kick && this.isGrounded) {
          this.state = 'kick';
          this.stateFrame = 0;
          this.attackHit = false;
          this.currentAttackType = 'kick';
          this.vx = this.facing * 2.2; // forward advance
          gameAudio.playWhoosh();
          break;
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
          this.state = 'crouch';
          this.vx = 0;
          break;
        }

        // Block
        if (this.isBlocking) {
          this.state = 'block';
          this.vx = 0;
          break;
        }

        // Movement
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
        // Air physics
        if (this.isGrounded) {
          this.state = 'idle';
          this.stateFrame = 0;
        }
        break;
      }

      case 'punch': {
        // Recovery after 14 frames
        if (this.stateFrame >= 14) {
          this.state = 'idle';
          this.stateFrame = 0;
          this.currentAttackType = null;
        }
        break;
      }

      case 'kick': {
        // Recovery after 20 frames
        if (this.stateFrame >= 20) {
          this.state = 'idle';
          this.stateFrame = 0;
          this.currentAttackType = null;
        }
        break;
      }

      case 'grab': {
        // Recovery after 18 frames
        if (this.stateFrame >= 18) {
          this.state = 'idle';
          this.stateFrame = 0;
          this.currentAttackType = null;
        }
        break;
      }

      case 'super': {
        // Recovery after 34 frames
        if (this.stateFrame >= 34) {
          this.state = 'idle';
          this.stateFrame = 0;
          this.currentAttackType = null;
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
        // Recover after hitting ground and waiting
        if (this.isGrounded && this.stateFrame >= 42) {
          if (this.health > 0) {
            this.state = 'idle';
            this.stateFrame = 0;
          }
        }
        break;
      }

      case 'victory':
      case 'defeat': {
        this.vx = 0;
        break;
      }
    }

    // Apply Gravity
    if (!this.isGrounded) {
      this.vy += 0.72; // gravity constant
    }

    // Apply Velocities
    this.x += this.vx;
    this.y += this.vy;

    // Friction on ground
    if (this.isGrounded) {
      this.vx *= 0.82;
    }

    // Ground Collision
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

    // 1. Shadow beneath fighter
    const shadowWidth = this.width * (this.isGrounded ? 1.4 : 0.8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY + 4, shadowWidth / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Fighter Silhouette & Arcade Costume
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const isCrouching = this.state === 'crouch';
    const isKnockdown = this.state === 'knockdown';
    const isHitstun = this.state === 'hitstun';
    const isAttacking = ['punch', 'kick', 'grab', 'super'].includes(this.state);

    if (isKnockdown) {
      // Fallen on ground pose
      ctx.rotate(-Math.PI / 2.2);
    }

    // Visual flicker on hitstun
    if (isHitstun && Math.floor(this.stateFrame / 2) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    // Super glow aura
    if (this.state === 'super') {
      ctx.shadowColor = this.character.themeColor;
      ctx.shadowBlur = 18;
    }

    const currentHeight = isCrouching ? this.height * 0.65 : this.height;

    // Legs / Pants
    ctx.fillStyle = '#1e293b';
    if (this.character.id === 'claude') ctx.fillStyle = '#15803d'; // Green cargo pants
    if (this.character.id === 'carl-johnson') ctx.fillStyle = '#1d4ed8'; // Blue denim
    if (this.character.id === 'tommy-vercetti') ctx.fillStyle = '#0284c7'; // Blue jeans

    if (isCrouching) {
      ctx.fillRect(-16, -30, 32, 28);
    } else if (this.state === 'kick' && this.stateFrame >= 5 && this.stateFrame <= 14) {
      // Extended kick leg
      ctx.fillRect(-10, -50, 18, 50); // support leg
      ctx.save();
      ctx.fillStyle = this.character.accentColor;
      ctx.fillRect(4, -45, 52, 18); // kicking leg extending forward
      ctx.restore();
    } else {
      // Standing legs
      ctx.fillRect(-14, -55, 12, 55);
      ctx.fillRect(2, -55, 12, 55);
    }

    // Torso / Shirt
    ctx.fillStyle = this.character.themeColor;
    const torsoY = isCrouching ? -62 : -88;
    const torsoH = isCrouching ? 34 : 40;
    ctx.beginPath();
    ctx.roundRect(-16, torsoY, 32, torsoH, 6);
    ctx.fill();

    // Torso accent (e.g. Hawaiian pattern, stripes, collar)
    ctx.fillStyle = this.character.accentColor;
    ctx.fillRect(-3, torsoY + 4, 6, torsoH - 8);

    // Head
    const headY = isCrouching ? -82 : -108;
    ctx.fillStyle = '#f5d0b0'; // skin tone
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Hat / Accessories
    ctx.fillStyle = '#1c1917';
    if (this.character.id === 'tommy-vercetti') ctx.fillStyle = '#292524';
    if (this.character.id === 'claude') ctx.fillStyle = '#18181b';
    if (this.character.id === 'trevor-philips') ctx.fillStyle = '#78716c';
    if (this.character.id === 'lucia-caminos') ctx.fillStyle = '#451a03';

    ctx.beginPath();
    ctx.arc(0, headY - 4, 13, Math.PI, Math.PI * 2);
    ctx.fill();

    // Arms & Attacks
    ctx.fillStyle = '#f5d0b0';

    if (this.state === 'punch' && this.stateFrame >= 3 && this.stateFrame <= 10) {
      // Extended punch fist
      ctx.fillRect(-6, torsoY + 8, 48, 14);
      ctx.fillStyle = this.character.accentColor;
      ctx.beginPath();
      ctx.arc(42, torsoY + 15, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === 'block') {
      // Guard stance with crossed arms
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(4, torsoY + 4, 12, 28);
      ctx.fillRect(10, torsoY + 12, 10, 18);
    } else if (this.state === 'super') {
      // Signature weapon / energy blast
      ctx.fillStyle = this.character.themeColor;
      ctx.fillRect(8, torsoY + 2, 70, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, torsoY + 8, 55, 12);
    } else {
      // Relaxed idle arms
      ctx.fillRect(-12, torsoY + 6, 8, 28);
      ctx.fillRect(4, torsoY + 6, 8, 28);
    }

    // Victory celebration hands up
    if (this.state === 'victory') {
      ctx.fillStyle = '#f5d0b0';
      ctx.fillRect(-14, torsoY - 20, 8, 26);
      ctx.fillRect(6, torsoY - 20, 8, 26);
    }

    ctx.restore();
  }
}
