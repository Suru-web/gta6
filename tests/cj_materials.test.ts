import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CHARACTER_MATERIAL_BINDINGS } from '../src/game/three/characterMaterials';

describe('CJ model materials', () => {
  it('binds each animated mesh to a material present in the source model', () => {
    const fbx = readFileSync('public/models/carl-johnson.fbx');
    const scene = new FBXLoader().parse(fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength) as ArrayBuffer, '');
    const meshes: string[] = [];
    scene.traverse((node) => { if ((node as { isMesh?: boolean }).isMesh) meshes.push(node.name); });

    const glb = readFileSync('public/models/carl-johnson.glb');
    const jsonLength = glb.readUInt32LE(12);
    const source = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8')) as { materials: { name: string }[] };
    const materials = source.materials.map((material) => material.name);
    const bindings = CHARACTER_MATERIAL_BINDINGS['carl-johnson'];

    expect(Object.keys(bindings).sort()).toEqual(meshes.sort());
    for (const material of Object.values(bindings)) expect(materials).toContain(material);
    expect(bindings.Object_7).toBe('Mat_1'); // shirt
    expect(bindings.Object_11).toBe('Mat_2'); // head
    expect(bindings.Object_13).toBe('Mat_0'); // jeans
    expect(bindings.Object_15).toBe('material'); // shoes
  });
});
