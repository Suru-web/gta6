import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Fighter, FighterInput } from '../src/game/fighter';
import { GTA_ROSTER } from '../src/config/roster';
import { CombatAnimations } from '../src/game/three/gltfCharacter';
import { CrouchPose } from '../src/game/three/crouchPose';
import { attackClipTime } from '../src/game/attackTimeline';
import { getCharacterMove } from '../src/game/moves';

const blank: FighterInput = { moveLeft: false, moveRight: false, jump: false, crouch: false, block: false, punch: false, kick: false, grab: false, superAttack: false };
function loadFbx(path: string) {
  const bytes = readFileSync(path);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new FBXLoader().parse(buffer, '');
}

describe('Movement and specials', () => {
  it('walks backward while guarding in either direction, and stationary block remains available', () => {
    const player = new Fighter(GTA_ROSTER[0], true, 300);
    player.update({ ...blank, moveLeft: true }, 500, 800);
    expect(player.state).toBe('walk_back');
    expect(player.x).toBeLessThan(300);
    expect(player.isBlocking).toBe(true);
    const result = player.takeDamage(10, 'punch', -1);
    expect(result.blocked).toBe(true);

    const opponent = new Fighter(GTA_ROSTER[1], false, 500);
    opponent.update({ ...blank, moveRight: true }, 300, 800);
    expect(opponent.state).toBe('walk_back');
    expect(opponent.x).toBeGreaterThan(500);
    expect(opponent.isBlocking).toBe(true);

    const guarding = new Fighter(GTA_ROSTER[0], true, 300);
    guarding.update({ ...blank, block: true }, 500, 800);
    expect(guarding.state).toBe('block');
    expect(guarding.x).toBe(300);
  });

  it('moves during attack startup, contact and recovery without cancelling the attack', () => {
    const fighter = new Fighter(GTA_ROSTER[0], true, 300);
    fighter.update({ ...blank, moveRight: true, punch: true }, 700, 800);
    expect(fighter.state).toBe('punch');
    expect(fighter.x).toBeGreaterThan(300);
    const move = fighter.currentMove!;
    const startupX = fighter.x;
    for (let i = 0; i < move.startupFrames; i++) fighter.update({ ...blank, moveRight: true }, 700, 800);
    expect(fighter.attackPhase).toBe('active');
    expect(fighter.x).toBeGreaterThan(startupX);
    const contactX = fighter.x;
    for (let i = 0; i < move.activeFrames; i++) fighter.update({ ...blank, moveLeft: true }, 700, 800);
    expect(fighter.attackPhase).toBe('recovery');
    expect(fighter.x).toBeLessThan(contactX);
    expect(fighter.facing).toBe(1);
    expect(fighter.state).toBe('punch');
    fighter.hitstopFrames = 1;
    const stoppedX = fighter.x;
    fighter.update({ ...blank, moveRight: true }, 700, 800);
    expect(fighter.x).toBe(stoppedX);
  });

  it('bends the shipped character rig while keeping its feet on the same floor', () => {
    const model = loadFbx('public/models/tommy-vercetti.fbx');
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(model.animations[0]).play();
    mixer.update(0.01);
    model.updateWorldMatrix(true, true);
    const hips = model.getObjectByName('mixamorigHips')!;
    const anchors = ['mixamorigLeftFoot', 'mixamorigRightFoot', 'mixamorigLeftToeBase', 'mixamorigRightToeBase'].map((name) => model.getObjectByName(name)).filter((bone): bone is THREE.Object3D => !!bone);
    const height = () => Math.min(...anchors.map((bone) => bone.getWorldPosition(new THREE.Vector3()).y));
    const floor = height();
    const hipY = hips.getWorldPosition(new THREE.Vector3()).y;
    const pose = new CrouchPose(model);
    expect(pose.apply(1)).toBe(true);
    model.updateWorldMatrix(true, true);
    expect(height()).toBeCloseTo(floor, 5);
    expect(hips.getWorldPosition(new THREE.Vector3()).y).toBeLessThan(hipY - 0.15);
    pose.restore();
    model.position.y = 0;
    model.updateWorldMatrix(true, true);
    expect(hips.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(hipY, 5);
  });

  it('uses both supplied clips with bounded timelines and locked horizontal root motion', () => {
    const model = loadFbx('public/models/tommy-vercetti.fbx');
    const move = getCharacterMove(GTA_ROSTER[0], 'super');
    for (const [variant, filename] of ['public/animations/super-1.fbx', 'public/animations/super-2.fbx'].entries()) {
      const original = loadFbx(filename).animations[0];
      expect(original).toBeDefined();
      const clip = CombatAnimations.retargetClip(original, model.animations[0], true);
      const hips = clip.tracks.find((track) => /hips.*\.position/i.test(track.name))!;
      for (let i = 3; i < hips.values.length; i += 3) {
        expect(hips.values[i]).toBe(hips.values[0]);
        expect(hips.values[i + 2]).toBe(hips.values[2]);
      }
      const end = attackClipTime(move, move.totalFrames, variant as 0 | 1);
      expect(end).toBeLessThanOrEqual(clip.duration);
    }
  });

  it('charges during normal play, spends the meter, and alternates special animations', () => {
    const fighter = new Fighter(GTA_ROSTER[0], true, 200);
    for (let i = 0; i < 6; i++) fighter.registerHitLanded(10, 'punch');
    expect(fighter.superMeter).toBe(100);
    fighter.update({ ...blank, superAttack: true }, 260, 800);
    expect(fighter.state).toBe('super');
    expect(fighter.superVariant).toBe(0);
    expect(fighter.superMeter).toBe(0);
    while (fighter.isAttacking()) fighter.update(blank, 260, 800);
    for (let i = 0; i < 18; i++) fighter.update(blank, 260, 800);
    fighter.superMeter = 100;
    fighter.update({ ...blank, superAttack: true }, 260, 800);
    expect(fighter.state).toBe('super');
    expect(fighter.superVariant).toBe(1);
  });
});
