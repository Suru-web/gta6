import * as THREE from 'three';

/** Explicit material bindings for rigs whose mesh names differ from their GLB source. */
export const CHARACTER_MATERIAL_BINDINGS: Record<string, Record<string, string>> = {
  'carl-johnson': {
    Object_7: 'Mat_1',  // torso and arms
    Object_9: 'Mat_2',  // face detail
    Object_11: 'Mat_2', // head
    Object_13: 'Mat_0', // jeans
    Object_15: 'material', // shoes
  },
};

/** Clone transferred materials without changing the source model's cached textures. */
export function cloneTransferredMaterial(characterId: string, source: THREE.Material): THREE.Material {
  const material = source.clone();
  if (characterId !== 'franklin-clinton') return material;

  // Franklin's FBX UVs are the vertical inverse of the source GLB's UVs.
  // GLTFLoader sets flipY=false; FBX texture coordinates need flipY=true.
  const slots = [
    'map', 'emissiveMap', 'normalMap', 'aoMap', 'roughnessMap',
    'metalnessMap', 'alphaMap', 'bumpMap', 'displacementMap', 'specularMap',
  ] as const;
  const textured = material as THREE.Material & Partial<Record<(typeof slots)[number], THREE.Texture | null>>;
  const copies = new Map<THREE.Texture, THREE.Texture>();
  for (const slot of slots) {
    const texture = textured[slot];
    if (!texture) continue;
    let copy = copies.get(texture);
    if (!copy) {
      copy = texture.clone();
      copy.flipY = true;
      copy.needsUpdate = true;
      copies.set(texture, copy);
    }
    textured[slot] = copy;
  }
  return material;
}
