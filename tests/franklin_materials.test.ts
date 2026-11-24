import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { cloneTransferredMaterial } from '../src/game/three/characterMaterials';

describe('Franklin model materials', () => {
  it('matches every animated FBX material to a material in the source GLB', () => {
    const originalLoad = THREE.TextureLoader.prototype.load;
    THREE.TextureLoader.prototype.load = () => new THREE.Texture();
    try {
      const fbx = readFileSync('public/models/franklin-clinton.fbx');
      const scene = new FBXLoader().parse(fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength) as ArrayBuffer, '');
      const mesh = scene.getObjectByName('Franklin_Gta5') as THREE.Mesh;
      expect(Array.isArray(mesh.material)).toBe(true);
      const glb = readFileSync('public/models/franklin-clinton.glb');
      const source = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8')) as { materials: { name: string }[] };
      const names = source.materials.map((material) => material.name);
      for (const material of mesh.material as THREE.Material[]) expect(names).toContain(material.name);
    } finally {
      THREE.TextureLoader.prototype.load = originalLoad;
    }
  });

  it('flips cloned texture maps without modifying the source or other characters', () => {
    const map = new THREE.Texture();
    map.flipY = false;
    const material = new THREE.MeshStandardMaterial({ map, emissiveMap: map });
    const franklin = cloneTransferredMaterial('franklin-clinton', material) as THREE.MeshStandardMaterial;
    const other = cloneTransferredMaterial('carl-johnson', material) as THREE.MeshStandardMaterial;
    expect(franklin.map).not.toBe(map);
    expect(franklin.map?.flipY).toBe(true);
    expect(franklin.emissiveMap).toBe(franklin.map);
    expect(map.flipY).toBe(false);
    expect(other.map).toBe(map);
    expect(other.map?.flipY).toBe(false);
  });
});
