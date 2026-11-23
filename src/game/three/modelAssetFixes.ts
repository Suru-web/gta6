import * as THREE from 'three';

/** Correct known export defects before calculating the character's bounds. */
export function repairCharacterAsset(characterId: string, root: THREE.Object3D): void {
  if (characterId !== 'niko-bellic') return;

  // The reference hands in this GLB were exported in a scale 100 times larger
  // than the rest of the rig. Their outlier bounds otherwise shrink the whole
  // fighter to almost nothing when the model is normalized.
  const hands = root.getObjectByName('Object_119') as THREE.Mesh | undefined;
  if (!hands?.isMesh || !hands.geometry || hands.userData.nikoHandsScaleFixed) return;
  hands.geometry = hands.geometry.clone();
  hands.geometry.scale(0.01, 0.01, 0.01);
  if ((hands as THREE.SkinnedMesh).isSkinnedMesh) {
    const skinnedHands = hands as THREE.SkinnedMesh;
    root.updateWorldMatrix(true, true);
    skinnedHands.computeBoundingBox();
    skinnedHands.computeBoundingSphere();
  }
  hands.userData.nikoHandsScaleFixed = true;
}
