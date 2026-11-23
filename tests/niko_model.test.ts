import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { repairCharacterAsset } from '../src/game/three/modelAssetFixes';
import { NikoPose } from '../src/game/three/nikoPose';

if (typeof globalThis.ProgressEvent === 'undefined') {
  globalThis.ProgressEvent = class ProgressEvent extends Event {
    constructor(type: string, init?: ProgressEventInit) { super(type); Object.assign(this, init); }
  } as typeof ProgressEvent;
}

// Parse the shipped geometry and rig without decoding browser-only image assets.
async function loadModel(name: string) {
  const glb = readFileSync(`public/models/${name}.glb`);
  const length = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + length).toString('utf8'));
  const binary = glb.subarray(20 + length + 8);
  json.materials = json.materials.map((material: { name: string }) => ({ name: material.name }));
  delete json.images;
  delete json.textures;
  delete json.samplers;
  json.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`;
  return (await new GLTFLoader().parseAsync(JSON.stringify(json), '')).scene;
}

describe('Niko model', () => {
  it('repairs the oversized hands before scaling the entire model', async () => {
    const model = await loadModel('niko-bellic');
    model.updateWorldMatrix(true, true);
    const before = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    expect(before.y).toBeGreaterThan(4000);

    repairCharacterAsset('niko-bellic', model);
    model.updateWorldMatrix(true, true);
    const after = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    expect(after.y).toBeGreaterThan(70);
    expect(after.y).toBeLessThan(80);
    expect(after.x).toBeLessThan(60);
    repairCharacterAsset('niko-bellic', model);
    const afterSecondRepair = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    expect(afterSecondRepair.distanceTo(after)).toBeLessThan(0.00001);
  });

  it('raises his guard and extends his right hand for a punch', async () => {
    const model = await loadModel('niko-bellic');
    repairCharacterAsset('niko-bellic', model);
    const pose = new NikoPose(model);
    expect(pose.available).toBe(true);
    const hand = model.getObjectByName('ValveBipedBip01_R_Hand_013')!;
    const shoulder = model.getObjectByName('ValveBipedBip01_R_UpperArm_011')!;
    const relativePosition = () => {
      model.updateWorldMatrix(true, true);
      return hand.getWorldPosition(new THREE.Vector3()).sub(shoulder.getWorldPosition(new THREE.Vector3()));
    };
    const rest = relativePosition();
    pose.apply('idle', 0, 0);
    const guard = relativePosition();
    pose.apply('punch', 0, 1);
    const punch = relativePosition();
    expect(guard.y).toBeGreaterThan(rest.y);
    expect(punch.z).toBeGreaterThan(guard.z);
    pose.apply('idle', 0, 0);
    expect(relativePosition().distanceTo(guard)).toBeLessThan(0.001);
  });

  it('moves his leg during walking and raises it for a kick', async () => {
    const model = await loadModel('niko-bellic');
    repairCharacterAsset('niko-bellic', model);
    const pose = new NikoPose(model);
    const knee = model.getObjectByName('ValveBipedBip01_R_Calf_072')!;
    const hip = model.getObjectByName('ValveBipedBip01_R_Thigh_071')!;
    const relativePosition = () => {
      model.updateWorldMatrix(true, true);
      return knee.getWorldPosition(new THREE.Vector3()).sub(hip.getWorldPosition(new THREE.Vector3()));
    };
    pose.apply('idle', 0, 0);
    const idle = relativePosition();
    pose.apply('walk_fwd', Math.PI / 18, 0);
    const walk = relativePosition();
    pose.apply('kick', 0, 1);
    const kick = relativePosition();
    expect(Math.abs(walk.z - idle.z)).toBeGreaterThan(1);
    expect(kick.y).toBeGreaterThan(idle.y);
    expect(kick.z).toBeGreaterThan(idle.z);
  });

  it('leaves Claude’s already-normal-sized asset untouched', async () => {
    const model = await loadModel('claude');
    model.updateWorldMatrix(true, true);
    const before = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    repairCharacterAsset('claude', model);
    model.updateWorldMatrix(true, true);
    const after = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    expect(after.distanceTo(before)).toBeLessThan(0.00001);
  });
});
