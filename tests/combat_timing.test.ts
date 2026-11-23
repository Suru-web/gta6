import { describe, expect, it } from 'bun:test';
import { GameEngine } from '../src/game/engine';
import { attackClipTime, attackExtension } from '../src/game/attackTimeline';
import { GTA_ROSTER } from '../src/config/roster';
import { DEFAULT_ARENA } from '../src/config/arenas';
import { getCharacterMove } from '../src/game/moves';
import { CPUController } from '../src/game/ai';
import { Fighter } from '../src/game/fighter';

function withEngine(run: (engine: GameEngine, tick: (ms: number) => void) => void) {
  const oldRaf = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  let next: FrameRequestCallback = () => {};
  globalThis.requestAnimationFrame = (callback) => { next = callback; return 1; };
  globalThis.cancelAnimationFrame = () => {};
  const ctx = new Proxy({}, { get: () => () => {} });
  const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement;
  const engine = new GameEngine(canvas, GTA_ROSTER[0], GTA_ROSTER[1], DEFAULT_ARENA, 'practice', { render3DMode: true });
  engine.roundState.phase = 'fight';
  engine.roundState.bannerAlpha = 0;
  try { run(engine, (ms) => next(ms)); } finally {
    engine.destroy();
    globalThis.requestAnimationFrame = oldRaf;
    globalThis.cancelAnimationFrame = oldCancel;
  }
}

describe('Combat timing and contact', () => {
  it('runs the same number of combat steps at 60 and 120 Hz', () => {
    const simulate = (hz: number) => {
      let x = 0, frames = 0;
      withEngine((engine, tick) => {
        engine.playerInput.moveRight = true;
        for (let i = 0; i <= hz; i++) tick(i * 1000 / hz);
        x = engine.player.x;
        frames = Math.round(engine.simulationTime * 60);
      });
      return { x, frames };
    };
    const sixty = simulate(60);
    const oneTwenty = simulate(120);
    expect(sixty.frames).toBeGreaterThanOrEqual(59);
    expect(oneTwenty.frames).toBe(sixty.frames);
    expect(oneTwenty.x).toBe(sixty.x);
  });

  it('maps FBX contact poses to the active frames', () => {
    for (const type of ['punch', 'kick', 'grab', 'super'] as const) {
      const move = getCharacterMove(GTA_ROSTER[0], type);
      const contact = move.startupFrames + 1;
      expect(attackClipTime(move, contact)).toBeGreaterThan(attackClipTime(move, contact - 1));
      expect(attackClipTime(move, contact + move.activeFrames)).toBeGreaterThan(attackClipTime(move, contact));
      expect(attackExtension(move, contact)).toBe(1);
      expect(attackExtension(move, move.totalFrames)).toBe(0);
    }
  });

  it('holds the attack pose during hitstop', () => {
    withEngine((engine) => {
      const fighter = engine.player;
      fighter.update({ ...engine.playerInput, punch: true }, engine.cpu.x, engine.width);
      const move = fighter.currentMove!;
      fighter.hitstopFrames = 4;
      const frame = fighter.stateFrame;
      for (let i = 0; i < 4; i++) fighter.update(engine.playerInput, engine.cpu.x, engine.width);
      expect(fighter.stateFrame).toBe(frame);
      expect(attackClipTime(move, fighter.stateFrame)).toBe(attackClipTime(move, frame));
    });
  });

  it('does not lose a quick press between simulation steps', () => {
    withEngine((engine, tick) => {
      tick(0);
      engine.queuePlayerAttack('punch');
      tick(17);
      expect(engine.player.state).toBe('punch');
      expect(engine.player.attackPhase).toBe('startup');
    });
  });

  it('enforces a gap after CPU attacks, even when always choosing to attack', () => {
    const random = Math.random;
    Math.random = () => 0.2;
    try {
      const ai = new CPUController('hard');
      const cpu = new Fighter(GTA_ROSTER[1], false, 255);
      const player = new Fighter(GTA_ROSTER[0], true, 200);
      const starts: number[] = [];
      const ends: number[] = [];
      for (let frame = 0; frame < 900; frame++) {
        cpu.x = 255;
        const wasAttacking = cpu.isAttacking();
        cpu.update(ai.update(cpu, player), player.x, 800);
        if (!wasAttacking && cpu.isAttacking()) starts.push(frame);
        if (wasAttacking && !cpu.isAttacking()) ends.push(frame);
      }
      expect(starts.length).toBeGreaterThan(2);
      for (let i = 1; i < starts.length; i++) expect(starts[i] - ends[i - 1]).toBeGreaterThanOrEqual(48);
    } finally { Math.random = random; }
  });

  it('only applies one hit during contact and misses an opponent outside reach', () => {
    withEngine((engine) => {
      const attacker = engine.player;
      const defender = engine.cpu;
      attacker.x = 200;
      defender.x = 265;
      const initial = defender.health;
      const blank = { moveLeft: false, moveRight: false, jump: false, crouch: false, block: false, punch: false, kick: false, grab: false, superAttack: false };
      const check = () => (engine as unknown as { checkCombatCollisions: () => void }).checkCombatCollisions();
      attacker.update({ ...blank, punch: true }, defender.x, 800);
      const move = attacker.currentMove!;
      for (let i = 1; i < move.startupFrames; i++) { attacker.update(blank, defender.x, 800); check(); expect(defender.health).toBe(initial); }
      attacker.update(blank, defender.x, 800);
      check();
      expect(defender.health).toBeLessThan(initial);
      const afterHit = defender.health;
      check();
      expect(defender.health).toBe(afterHit);

      attacker.resetPosition(200);
      defender.resetPosition(400);
      attacker.update({ ...blank, punch: true }, defender.x, 800);
      for (let i = 0; i < move.startupFrames; i++) attacker.update(blank, defender.x, 800);
      const farHealth = defender.health;
      check();
      expect(defender.health).toBe(farHealth);
    });
  });
});
