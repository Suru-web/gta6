import * as THREE from 'three';
import { ActionState } from '../types';

/** Poses Niko's ValveBiped rig, which cannot bind to the Mixamo clips. */
export class NikoPose {
  private readonly bones = new Map<string, THREE.Object3D>();
  private readonly rest = new Map<string, THREE.Quaternion>();
  private readonly pointA = new THREE.Vector3();
  private readonly pointB = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly desired = new THREE.Vector3();
  private readonly worldRotation = new THREE.Quaternion();
  private readonly parentRotation = new THREE.Quaternion();
  private readonly inverseParentRotation = new THREE.Quaternion();
  private readonly delta = new THREE.Quaternion();

  constructor(private readonly root: THREE.Object3D) {
    for (const name of [
      'ValveBipedBip01_L_UpperArm_042', 'ValveBipedBip01_L_Forearm_043', 'ValveBipedBip01_L_Hand_044',
      'ValveBipedBip01_R_UpperArm_011', 'ValveBipedBip01_R_Forearm_012', 'ValveBipedBip01_R_Hand_013',
      'ValveBipedBip01_L_Thigh_076', 'ValveBipedBip01_L_Calf_077', 'ValveBipedBip01_L_Foot_078',
      'ValveBipedBip01_R_Thigh_071', 'ValveBipedBip01_R_Calf_072', 'ValveBipedBip01_R_Foot_073',
    ]) {
      const bone = root.getObjectByName(name);
      if (bone) {
        this.bones.set(name, bone);
        this.rest.set(name, bone.quaternion.clone());
      }
    }
  }

  get available(): boolean { return this.bones.size === 12; }

  private aim(name: string, childName: string, x: number, y: number, z: number) {
    const bone = this.bones.get(name);
    const child = this.bones.get(childName);
    if (!bone || !child || !bone.parent) return;

    bone.updateWorldMatrix(true, true);
    bone.getWorldPosition(this.pointA);
    child.getWorldPosition(this.pointB);
    this.direction.subVectors(this.pointB, this.pointA).normalize();
    this.root.getWorldQuaternion(this.worldRotation);
    this.desired.set(x, y, z).normalize().applyQuaternion(this.worldRotation);
    this.delta.setFromUnitVectors(this.direction, this.desired);
    bone.parent.getWorldQuaternion(this.parentRotation);
    this.inverseParentRotation.copy(this.parentRotation).invert();
    this.delta.premultiply(this.inverseParentRotation).multiply(this.parentRotation);
    bone.quaternion.premultiply(this.delta);
    bone.updateWorldMatrix(false, true);
  }

  apply(state: ActionState, time: number, extension: number) {
    if (!this.available) return;
    for (const [name, rotation] of this.rest) this.bones.get(name)?.quaternion.copy(rotation);
    this.root.updateWorldMatrix(true, true);

    const striking = state === 'punch' || state === 'grab' || state === 'super';
    const reach = striking ? extension : 0;
    // Keep both fists raised, extending the right arm only as the attack reaches contact.
    this.aim('ValveBipedBip01_L_UpperArm_042', 'ValveBipedBip01_L_Forearm_043', 0.35, -0.36, 0.86);
    this.aim('ValveBipedBip01_L_Forearm_043', 'ValveBipedBip01_L_Hand_044', 0.12, 0.52, 0.84);
    this.aim('ValveBipedBip01_R_UpperArm_011', 'ValveBipedBip01_R_Forearm_012', -0.35 + reach * 0.2, -0.36 + reach * 0.35, 0.86 + reach * 0.14);
    this.aim('ValveBipedBip01_R_Forearm_012', 'ValveBipedBip01_R_Hand_013', -0.12 + reach * 0.08, 0.52 - reach * 0.48, 0.84 + reach * 0.16);

    const stride = state === 'walk_fwd' || state === 'walk_back' ? Math.sin(time * 9) * (state === 'walk_back' ? -0.55 : 0.55) : 0;
    const kick = state === 'kick' ? extension : 0;
    this.aim('ValveBipedBip01_L_Thigh_076', 'ValveBipedBip01_L_Calf_077', 0.06, -1, stride);
    this.aim('ValveBipedBip01_R_Thigh_071', 'ValveBipedBip01_R_Calf_072', -0.06, -1 + kick * 0.75, -stride + kick * 1.0);
    if (kick > 0) this.aim('ValveBipedBip01_R_Calf_072', 'ValveBipedBip01_R_Foot_073', 0, -1 + kick * 0.9, kick);
  }
}
