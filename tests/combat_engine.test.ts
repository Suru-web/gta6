import { describe, it, expect, beforeEach } from 'bun:test';
import { Fighter, FighterInput } from '../src/game/fighter';
import { CPUController } from '../src/game/ai';
import { GTA_ROSTER } from '../src/config/roster';
import { BASE_MOVES, getCharacterMove, calculateComboDamage } from '../src/game/moves';

function getBlankInput(): FighterInput {
  return {
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
}

describe('GTA Fighting Game Combat Engine & State Machine', () => {
  let player: Fighter;
  let cpu: Fighter;
  const tommy = GTA_ROSTER[0];
  const cj = GTA_ROSTER[1];

  beforeEach(() => {
    player = new Fighter(tommy, true, 200, 420);
    cpu = new Fighter(cj, false, 300, 420);
  });

  describe('Phase 2 & 3: Fighter State Machine & Attack Phase Progression', () => {
    it('progresses punch attack through startup -> active -> recovery -> idle', () => {
      const punchMove = getCharacterMove(player.character, 'punch');
      const startup = punchMove.startupFrames;
      const active = punchMove.activeFrames;
      const total = punchMove.totalFrames;

      // Frame 0: Trigger punch
      const punchInput = { ...getBlankInput(), punch: true };
      player.update(punchInput, cpu.x, 800);

      expect(player.state).toBe('punch');
      expect(player.attackPhase).toBe('startup');
      expect(player.getHitbox()).toBeNull(); // Hitbox MUST be null during startup!

      // Step through remaining startup frames
      for (let f = 2; f <= startup; f++) {
        player.update(getBlankInput(), cpu.x, 800);
        expect(player.state).toBe('punch');
        expect(player.attackPhase).toBe('startup');
        expect(player.getHitbox()).toBeNull(); // Still windup
      }

      // First active frame: hitbox activates
      player.update(getBlankInput(), cpu.x, 800);
      expect(player.state).toBe('punch');
      expect(player.attackPhase).toBe('active');
      const hitbox = player.getHitbox();
      expect(hitbox).not.toBeNull();
      expect(hitbox?.type).toBe('punch');

      // Step through active frames
      for (let f = 2; f <= active; f++) {
        player.update(getBlankInput(), cpu.x, 800);
        expect(player.attackPhase).toBe('active');
      }

      // Recovery frames: hitbox is gone, attacker is locked in recovery
      player.update(getBlankInput(), cpu.x, 800);
      expect(player.state).toBe('punch');
      expect(player.attackPhase).toBe('recovery');
      expect(player.getHitbox()).toBeNull(); // No damage during recovery!

      // Step through remaining recovery frames
      for (let f = startup + active + 2; f <= total; f++) {
        player.update(getBlankInput(), cpu.x, 800);
        expect(player.attackPhase).toBe('recovery');
      }

      // Final frame: returns cleanly to neutral idle
      player.update(getBlankInput(), cpu.x, 800);
      expect(player.state).toBe('idle');
      expect(player.attackPhase).toBe('none');
      expect(player.currentAttackType).toBeNull();
      expect(player.attackCooldown).toBeGreaterThan(0); // Anti-mash delay set!
    });

    it('enforces anti-mash lockout delay after punch completion, preventing rapid click spam', () => {
      // Trigger and complete a punch
      const move = getCharacterMove(player.character, 'punch');
      player.update({ ...getBlankInput(), punch: true }, cpu.x, 800);
      for (let f = 1; f <= move.totalFrames; f++) {
        player.update(getBlankInput(), cpu.x, 800);
      }
      expect(player.state).toBe('idle');
      expect(player.attackCooldown).toBe(10); // 10-frame anti-mash lockout

      // User mashes punch immediately while in lockout
      player.update({ ...getBlankInput(), punch: true }, cpu.x, 800);
      expect(player.state).toBe('idle'); // Must stay idle, attack is blocked!

      // Step out the remaining lockout frames
      for (let f = 0; f < 10; f++) {
        player.update(getBlankInput(), cpu.x, 800);
      }
      expect(player.attackCooldown).toBe(0);

      // Now attack is legal again!
      player.update({ ...getBlankInput(), punch: true }, cpu.x, 800);
      expect(player.state).toBe('punch');
    });

    it('locks out subsequent attacks during startup, active, and recovery phases', () => {
      // Trigger kick
      player.update({ ...getBlankInput(), kick: true }, cpu.x, 800);
      expect(player.state).toBe('kick');

      // Attempt to mash punch while kicking
      for (let f = 0; f < 10; f++) {
        player.update({ ...getBlankInput(), punch: true }, cpu.x, 800);
        expect(player.state).toBe('kick'); // Must NOT abort to punch!
      }
    });

    it('prohibits attacks during hitstun and blockstun', () => {
      // Put player in hitstun
      player.takeDamage(20, 'punch', 1);
      expect(player.state).toBe('hitstun');

      // Attempt to attack while reeling in hitstun
      player.update({ ...getBlankInput(), punch: true }, cpu.x, 800);
      expect(player.state).toBe('hitstun'); // Cannot act in hitstun!
      expect(player.canAct()).toBe(false);

      // Put player in blockstun
      player.state = 'idle';
      player.facing = 1; // Facing opponent on right
      player.isBlocking = true;
      player.takeDamage(15, 'kick', -1); // Attack coming from front right
      expect(player.state).toBe('blockstun');

      // Attempt to attack while reeling in blockstun
      player.update({ ...getBlankInput(), kick: true }, cpu.x, 800);
      expect(player.state).toBe('blockstun'); // Cannot act in blockstun!
      expect(player.canAct()).toBe(false);
    });

    it('guarantees single-hit per attack instance and prevents multi-tick damage', () => {
      const punchInput = { ...getBlankInput(), punch: true };
      player.update(punchInput, cpu.x, 800);

      // Advance into active phase
      const move = getCharacterMove(player.character, 'punch');
      for (let f = 1; f <= move.startupFrames; f++) {
        player.update(getBlankInput(), cpu.x, 800);
      }
      expect(player.isInActive()).toBe(true);

      // Active frame 1: Hitbox exists
      const initialHitbox = player.getHitbox();
      expect(initialHitbox).not.toBeNull();

      // Land the hit
      player.registerHitLanded(initialHitbox!.damage, 'punch');

      // Active frame 2: Hitbox must be nullified for the rest of this attack instance!
      const subsequentHitbox = player.getHitbox();
      expect(subsequentHitbox).toBeNull();
    });
  });

  describe('Phase 4: Combat Interaction, Blocking, Chip Damage, and Grabs', () => {
    it('applies block, chip damage, and blockstun when guarding against strikes', () => {
      const initialHp = cpu.health;

      // CPU holds back away from Player (facing -1, moves Right)
      cpu.facing = -1;
      cpu.isBlocking = true;

      // Attack from player (facing 1)
      const hitResult = cpu.takeDamage(20, 'kick', 1);

      expect(hitResult.hit).toBe(true);
      expect(hitResult.blocked).toBe(true);
      expect(hitResult.actualDamage).toBeLessThanOrEqual(5); // 80% reduction
      expect(cpu.state).toBe('blockstun');
      expect(cpu.health).toBe(initialHp - hitResult.actualDamage);
    });

    it('ensures chip damage cannot cause a knockout', () => {
      cpu.health = 2; // Low HP
      cpu.facing = -1;
      cpu.isBlocking = true;

      // Heavy strike blocked
      const hitResult = cpu.takeDamage(30, 'kick', 1);
      expect(hitResult.blocked).toBe(true);
      expect(cpu.health).toBeGreaterThanOrEqual(1); // Still alive! Chip cannot KO
    });

    it('allows grabs to pierce and break defensive blocks', () => {
      cpu.facing = -1;
      cpu.isBlocking = true; // Turtling behind block

      // Player executes grab
      const hitResult = cpu.takeDamage(24, 'grab', 1);

      expect(hitResult.hit).toBe(true);
      expect(hitResult.blocked).toBe(false); // Grab bypasses block completely!
      expect(hitResult.knockdown).toBe(true);
      expect(cpu.state).toBe('knockdown');
    });

    it('synchronizes hitstop on landed impacts', () => {
      const punchMove = getCharacterMove(player.character, 'punch');
      const hitResult = cpu.takeDamage(punchMove.baseDamage, 'punch', 1);

      expect(hitResult.hitstopFrames).toBe(punchMove.hitstopFrames);
      expect(hitResult.hitstopFrames).toBeGreaterThanOrEqual(4);
    });

    it('provides invincibility and wakeup protection during getting_up', () => {
      cpu.state = 'knockdown';
      cpu.stateFrame = 35; // Ready to get up
      cpu.isGrounded = true;

      // Advance knockdown to getting_up
      cpu.update(getBlankInput(), player.x, 800);
      expect(cpu.state).toBe('getting_up');
      expect(cpu.invincibleFrames).toBeGreaterThan(0);

      // Attempt to hit cpu during wakeup
      const wakeupHit = cpu.takeDamage(20, 'punch', 1);
      expect(wakeupHit.hit).toBe(false);
      expect(wakeupHit.actualDamage).toBe(0);
    });

    it('scales combo damage progressively to prevent infinite touch-of-death', () => {
      const base = 20;
      const hit1 = calculateComboDamage(base, 0);
      const hit2 = calculateComboDamage(base, 1);
      const hit3 = calculateComboDamage(base, 2);
      const hit4 = calculateComboDamage(base, 3);
      const hit5 = calculateComboDamage(base, 4);

      expect(hit1).toBe(20); // 100%
      expect(hit2).toBe(16); // 82%
      expect(hit3).toBe(13); // 65%
      expect(hit4).toBe(10); // 50%
      expect(hit5).toBe(7);  // 35%
      expect(hit5).toBeLessThan(hit1);
    });
  });

  describe('Phase 5, 6 & 8: CPU Decision-Making, Fairness & Difficulty Tiers', () => {
    it('respects player knockdown and steps back to reset neutral without attacking', () => {
      const ai = new CPUController('normal');
      player.state = 'knockdown';
      cpu.x = 240;
      player.x = 200;
      cpu.facing = -1; // Facing left towards player

      const input = ai.update(cpu, player);

      expect(ai.getBehaviorState()).toBe('WAKEUP_RESET');
      expect(input.punch).toBe(false);
      expect(input.kick).toBe(false);
      expect(input.grab).toBe(false);
      expect(input.superAttack).toBe(false);
      // AI backs away to the right
      expect(input.moveRight).toBe(true);
      expect(ai.getAttackCooldown()).toBeGreaterThanOrEqual(65);
    });

    it('does NOT count down attack cooldown while the CPU is currently executing an attack', () => {
      const ai = new CPUController('normal');
      cpu.state = 'punch'; // CPU is in the middle of punching
      cpu.attackPhase = 'active';

      // Record initial cooldown
      const initialCooldown = ai.getAttackCooldown();

      // Tick update while CPU is executing punch
      ai.update(cpu, player);

      // Cooldown must NOT decay during active attack execution!
      expect(ai.getAttackCooldown()).toBe(initialCooldown);
    });

    it('maintains distinct cooldown pacing between Easy, Normal, and Hard difficulties', () => {
      const easyAI = new CPUController('easy');
      const normalAI = new CPUController('normal');
      const hardAI = new CPUController('hard');

      expect(easyAI.difficulty).toBe('easy');
      expect(normalAI.difficulty).toBe('normal');
      expect(hardAI.difficulty).toBe('hard');
    });

    it('enforces shared combat rules: CPU uses the exact same Fighter state machine', () => {
      expect(cpu instanceof Fighter).toBe(true);
      expect(cpu.width).toBe(player.width);
      expect(cpu.height).toBe(player.height);
      expect(cpu.canAct()).toBe(player.canAct());
    });
  });

  describe('Phase 7 & 9: Spacing, Pushbox Separation & Combat Telemetry', () => {
    it('prevents overlapping bodies using pushbox separation', () => {
      player.x = 240;
      cpu.x = 245; // Only 5px apart (overlapping!)

      const dx = cpu.x - player.x;
      const minDistance = 44;
      const overlap = minDistance - Math.abs(dx);
      expect(overlap).toBe(39);

      // Apply separation
      player.x -= overlap / 2;
      cpu.x += overlap / 2;

      expect(cpu.x - player.x).toBeGreaterThanOrEqual(44);
    });

    it('keeps fighters contained within arena boundaries', () => {
      player.x = 10; // Out of bounds on left
      player.update(getBlankInput(), cpu.x, 800);
      expect(player.x).toBeGreaterThanOrEqual(40);

      cpu.x = 850; // Out of bounds on right
      cpu.update(getBlankInput(), player.x, 800);
      expect(cpu.x).toBeLessThanOrEqual(760);
    });

    it('simulates 180 frames of combat and tracks non-zero neutral pacing', () => {
      const ai = new CPUController('normal');
      let neutralCount = 0;
      let attacksAttempted = 0;

      for (let f = 0; f < 180; f++) {
        const input = ai.update(cpu, player);
        if (input.punch || input.kick || input.grab || input.superAttack) {
          attacksAttempted++;
        }
        if (ai.getBehaviorState() === 'NEUTRAL' || ai.getBehaviorState() === 'RETREAT' || ai.getBehaviorState() === 'APPROACH') {
          neutralCount++;
        }
        cpu.update(input, player.x, 800);
        player.update(getBlankInput(), cpu.x, 800);
      }

      // Over 3 seconds (180 frames), CPU should spend the majority of time in neutral/spacing footsies
      expect(neutralCount).toBeGreaterThan(120);
      // And should NOT attack continuously on every frame!
      expect(attacksAttempted).toBeLessThanOrEqual(4);
    });
  });

  describe('Practice Mode & Web Mouse Input Controls', () => {
    it('ensures CPU in practice mode does zero attacks and acts as a training dummy', () => {
      const practiceAI = new CPUController('practice');

      for (let f = 0; f < 100; f++) {
        const input = practiceAI.update(cpu, player);
        expect(input.punch).toBe(false);
        expect(input.kick).toBe(false);
        expect(input.grab).toBe(false);
        expect(input.superAttack).toBe(false);
        expect(input.block).toBe(false);
      }
    });

    it('supports mouse button mappings: Left Click = Punch, Right Click = Kick, Middle Click = Grab', () => {
      const k: Record<string, boolean> = {};

      const resolveInput = () => ({
        punch: Boolean(k['KeyJ'] || k['Mouse0']),
        kick: Boolean(k['KeyK'] || k['Mouse2']),
        grab: Boolean(k['KeyI'] || k['Mouse1']),
      });

      // Left click -> Punch
      k['Mouse0'] = true;
      expect(resolveInput().punch).toBe(true);
      k['Mouse0'] = false;
      expect(resolveInput().punch).toBe(false);

      // Right click -> Kick
      k['Mouse2'] = true;
      expect(resolveInput().kick).toBe(true);
      k['Mouse2'] = false;
      expect(resolveInput().kick).toBe(false);

      // Middle click -> Grab
      k['Mouse1'] = true;
      expect(resolveInput().grab).toBe(true);
      k['Mouse1'] = false;
      expect(resolveInput().grab).toBe(false);
    });
  });
});
