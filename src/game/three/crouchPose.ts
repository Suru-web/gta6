import * as THREE from 'three';

type Leg = { upper: THREE.Bone; lower: THREE.Bone; foot: THREE.Bone; toe?: THREE.Bone };

/** A grounded procedural crouch for the Mixamo rigs used by the roster. */
export class CrouchPose {
  private legs: Leg[] = [];
  private originals: { bone: THREE.Bone; quaternion: THREE.Quaternion }[] = [];
  private point = new THREE.Vector3();

  constructor(private model: THREE.Object3D) {
    const bones: THREE.Bone[] = [];
    model.traverse((node) => { if ((node as THREE.Bone).isBone) bones.push(node as THREE.Bone); });
    const find = (suffix: string) => bones.find((bone) => bone.name.toLowerCase().replace(/[^a-z]/g, '').endsWith(suffix));
    for (const side of ['left', 'right']) {
      const upper = find(`${side}upleg`);
      const lower = find(`${side}leg`);
      const foot = find(`${side}foot`);
      if (upper && lower && foot) this.legs.push({ upper, lower, foot, toe: find(`${side}toebase`) });
    }
  }

  /** Restore the unmodified pose before the animation mixer advances. */
  restore() {
    for (const { bone, quaternion } of this.originals) bone.quaternion.copy(quaternion);
    this.originals = [];
  }

  private lowestFoot(): number {
    return Math.min(...this.legs.flatMap(({ foot, toe }) => [foot, ...(toe ? [toe] : [])].map((bone) => bone.getWorldPosition(this.point).y)));
  }

  apply(amount: number): boolean {
    if (this.legs.length !== 2) return false;
    this.model.updateWorldMatrix(true, true);
    const initialFootY = this.lowestFoot();
    for (const { upper, lower, foot } of this.legs) {
      for (const bone of [upper, lower, foot]) this.originals.push({ bone, quaternion: bone.quaternion.clone() });
      upper.rotateX(0.9 * amount);
      lower.rotateX(-1.8 * amount);
      foot.rotateX(0.9 * amount);
    }
    this.model.updateWorldMatrix(true, true);
    // Bending shortens the legs: lower the body only by the actual change in
    // foot height, so the lowest foot remains on the same ground plane.
    this.model.position.y += initialFootY - this.lowestFoot();
    return true;
  }
}
