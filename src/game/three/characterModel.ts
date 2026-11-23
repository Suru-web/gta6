import * as THREE from 'three';
import { Character } from '@/types/game';
import { textures } from './textures';
import { ActionState } from '../types';
import { GLTFCharacterLoader, CombatAnimations } from './gltfCharacter';
import { MoveDefinition } from '../moves';
import { attackClipTime, attackExtension } from '../attackTimeline';
import { CrouchPose } from './crouchPose';

export class CharacterModel3D {
  public group: THREE.Group;
  public character: Character;
  public isPlayer: boolean;
  public customModel: THREE.Group | null = null;
  public mixer: THREE.AnimationMixer | null = null;
  public actions: Map<string, THREE.AnimationAction> = new Map();
  public currentAction: THREE.AnimationAction | null = null;
  public currentState: ActionState = 'idle';
  private idleClip: THREE.AnimationClip | null = null;
  private lastTime: number = 0;
  private crouchPose: CrouchPose | null = null;

  // Hierarchical Body Parts / Joint Nodes
  public hips: THREE.Group;
  public torso: THREE.Group;
  public neck: THREE.Group;
  public head: THREE.Group;

  public leftShoulder: THREE.Group;
  public leftUpperArm: THREE.Mesh;
  public leftElbow: THREE.Group;
  public leftLowerArm: THREE.Mesh;
  public leftFist: THREE.Mesh;

  public rightShoulder: THREE.Group;
  public rightUpperArm: THREE.Mesh;
  public rightElbow: THREE.Group;
  public rightLowerArm: THREE.Mesh;
  public rightFist: THREE.Mesh;

  public leftHip: THREE.Group;
  public leftThigh: THREE.Mesh;
  public leftKnee: THREE.Group;
  public leftCalf: THREE.Mesh;
  public leftFoot: THREE.Mesh;

  public rightHip: THREE.Group;
  public rightThigh: THREE.Mesh;
  public rightKnee: THREE.Group;
  public rightCalf: THREE.Mesh;
  public rightFoot: THREE.Mesh;

  public blockShield: THREE.Mesh;
  public superAura: THREE.Mesh;

  constructor(character: Character, isPlayer: boolean) {
    this.character = character;
    this.isPlayer = isPlayer;
    this.group = new THREE.Group();

    // Textures & Materials
    const shirtTex = textures.getCharacterShirt(character.id, character.themeColor, character.accentColor);
    const faceTex = textures.getCharacterFace(character.id);
    const pantsTex = textures.getJeansTexture(
      character.id === 'claude' ? '#15803d' : character.id === 'trevor-philips' ? '#64748b' : '#1e3a8a'
    );

    const skinColor = character.id === 'carl-johnson' ? 0x8d5524 : 0xf5d0b0;
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.6,
      metalness: 0.1,
    });

    const shirtMaterial = new THREE.MeshStandardMaterial({
      map: shirtTex,
      roughness: 0.7,
      metalness: 0.1,
    });

    const pantsMaterial = new THREE.MeshStandardMaterial({
      map: pantsTex,
      roughness: 0.8,
      metalness: 0.05,
    });

    const shoesMaterial = new THREE.MeshStandardMaterial({
      color: character.id === 'tommy-vercetti' ? 0xffffff : 0x18181b,
      roughness: 0.4,
    });

    // 1. ROOT HIPS
    this.hips = new THREE.Group();
    this.hips.position.y = 1.05; // Base hip height above ground
    this.group.add(this.hips);

    // Contoured Pelvis (smooth cylinder instead of sharp box)
    const pelvisGeo = new THREE.CylinderGeometry(0.20, 0.17, 0.24, 14);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMaterial);
    pelvis.castShadow = true;
    this.hips.add(pelvis);

    // 2. TORSO & CHEST (Contoured athletic torso)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.12;
    this.hips.add(this.torso);

    const torsoGeo = new THREE.CylinderGeometry(0.23, 0.19, 0.50, 14);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMaterial);
    torsoMesh.position.y = 0.25;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // 3. NECK & HEAD (Stylized Proportions for Arcade Presence)
    this.neck = new THREE.Group();
    this.neck.position.y = 0.50;
    this.torso.add(this.neck);

    this.head = new THREE.Group();
    this.head.position.y = 0.16;
    this.neck.add(this.head);

    // Stylized Head with Face Texture
    const headGeo = new THREE.BoxGeometry(0.36, 0.40, 0.34);
    const hairColor = character.id === 'tommy-vercetti' ? 0x27272a : character.id === 'lucia-caminos' ? 0x451a03 : 0x18181b;

    // Face material on front (+z), skin on sides/bottom, hair on back (-z)
    const headMaterials = [
      skinMaterial, // +x (right)
      skinMaterial, // -x (left)
      skinMaterial, // +y (top)
      skinMaterial, // -y (bottom)
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }), // Front face (+z)
      new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 }), // Back of head (-z)
    ];
    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // 3D Hair / Cap geometry
    const hairGeo = new THREE.BoxGeometry(0.38, 0.14, 0.38);
    const hairMesh = new THREE.Mesh(hairGeo, new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 }));
    hairMesh.position.y = 0.19;
    this.head.add(hairMesh);

    // 4. LEFT ARM (Cylindrical smooth anatomical limbs)
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.27, 0.42, 0);
    this.torso.add(this.leftShoulder);

    this.leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), shirtMaterial);
    this.leftUpperArm.position.y = -0.14;
    this.leftUpperArm.castShadow = true;
    this.leftShoulder.add(this.leftUpperArm);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.y = -0.28;
    this.leftShoulder.add(this.leftElbow);

    this.leftLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26, 12), skinMaterial);
    this.leftLowerArm.position.y = -0.13;
    this.leftLowerArm.castShadow = true;
    this.leftElbow.add(this.leftLowerArm);

    this.leftFist = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMaterial);
    this.leftFist.position.y = -0.26;
    this.leftElbow.add(this.leftFist);

    // 5. RIGHT ARM (Cylindrical smooth anatomical limbs)
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.27, 0.42, 0);
    this.torso.add(this.rightShoulder);

    this.rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), shirtMaterial);
    this.rightUpperArm.position.y = -0.14;
    this.rightUpperArm.castShadow = true;
    this.rightShoulder.add(this.rightUpperArm);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.y = -0.28;
    this.rightShoulder.add(this.rightElbow);

    this.rightLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26, 12), skinMaterial);
    this.rightLowerArm.position.y = -0.13;
    this.rightLowerArm.castShadow = true;
    this.rightElbow.add(this.rightLowerArm);

    this.rightFist = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMaterial);
    this.rightFist.position.y = -0.26;
    this.rightElbow.add(this.rightFist);

    // 6. LEFT LEG (Cylindrical smooth legs)
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.11, -0.10, 0);
    this.hips.add(this.leftHip);

    this.leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.46, 12), pantsMaterial);
    this.leftThigh.position.y = -0.23;
    this.leftThigh.castShadow = true;
    this.leftHip.add(this.leftThigh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.y = -0.46;
    this.leftHip.add(this.leftKnee);

    this.leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.44, 12), pantsMaterial);
    this.leftCalf.position.y = -0.22;
    this.leftCalf.castShadow = true;
    this.leftKnee.add(this.leftCalf);

    this.leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), shoesMaterial);
    this.leftFoot.position.set(0, -0.44, 0.05);
    this.leftFoot.castShadow = true;
    this.leftKnee.add(this.leftFoot);

    // 7. RIGHT LEG (Cylindrical smooth legs)
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.11, -0.10, 0);
    this.hips.add(this.rightHip);

    this.rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.46, 12), pantsMaterial);
    this.rightThigh.position.y = -0.23;
    this.rightThigh.castShadow = true;
    this.rightHip.add(this.rightThigh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.y = -0.46;
    this.rightHip.add(this.rightKnee);

    this.rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.44, 12), pantsMaterial);
    this.rightCalf.position.y = -0.22;
    this.rightCalf.castShadow = true;
    this.rightKnee.add(this.rightCalf);

    this.rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), shoesMaterial);
    this.rightFoot.position.set(0, -0.44, 0.05);
    this.rightFoot.castShadow = true;
    this.rightKnee.add(this.rightFoot);

    // 8. BLOCK SHIELD (Cyan Neon Hex Shield)
    const shieldGeo = new THREE.RingGeometry(0.35, 0.65, 6);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.blockShield = new THREE.Mesh(shieldGeo, shieldMat);
    this.blockShield.position.set(0, 0.45, 0.45);
    this.torso.add(this.blockShield);

    // 9. SUPER AURA SPHERE
    const auraGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(character.themeColor),
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.superAura = new THREE.Mesh(auraGeo, auraMat);
    this.superAura.position.y = 0.5;
    this.hips.add(this.superAura);

    // Check if custom real 3D model exists in /models/{character.id}.fbx or .glb
    GLTFCharacterLoader.loadCharacter(character.id).then(async (gltfModel) => {
      if (gltfModel && gltfModel.scene) {
        this.customModel = gltfModel.scene;
        this.crouchPose = new CrouchPose(this.customModel);
        this.group.add(this.customModel);
        this.hips.visible = false;

        this.mixer = new THREE.AnimationMixer(this.customModel);

        if (gltfModel.animations && gltfModel.animations.length > 0) {
          this.idleClip = gltfModel.animations[0];
          const idleAction = this.mixer.clipAction(this.idleClip);
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.actions.set('idle', idleAction);
          idleAction.play();
          this.currentAction = idleAction;
        }

        // Load and setup shared mocap combat actions
        const clips = await CombatAnimations.loadClips();
        clips.forEach((clip, name) => {
          if (!this.mixer) return;
          const retargeted = CombatAnimations.retargetClip(clip, this.idleClip || undefined, name.startsWith('super-'));
          const action = this.mixer.clipAction(retargeted);
          if (name === 'super-1' || name === 'super-2') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
          } else if (name === 'punch') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.timeScale = 1.85; // Snappy, natural mocap cross punch speed
          } else if (name === 'kick') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.timeScale = 1.45; // Fast martial arts roundhouse sweep
          } else if (name === 'grab') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.timeScale = 1.40; // Heavy, crisp elbow smash
          } else if (name === 'hit') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.timeScale = 1.35; // Sharp recoil flinch
          } else if (name === 'knockdown') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.timeScale = 1.05; // Dramatic cinematic collapse
          } else if (name === 'walk') {
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.timeScale = 1.25; // Authentic Mixamo walking stride
          }
          this.actions.set(name, action);
        });

      }
    });

    // Face towards center by default
    this.group.rotation.y = isPlayer ? Math.PI / 2 : -Math.PI / 2;
  }

  /**
   * Reset all skeletal joint rotations to default zero
   */
  public resetJoints() {
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
    this.hips.position.y = 1.05;
    this.hips.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);
    this.neck.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);

    this.leftShoulder.rotation.set(0, 0, 0);
    this.leftElbow.rotation.set(0, 0, 0);
    this.rightShoulder.rotation.set(0, 0, 0);
    this.rightElbow.rotation.set(0, 0, 0);

    this.leftHip.rotation.set(0, 0, 0);
    this.leftKnee.rotation.set(0, 0, 0);
    this.rightHip.rotation.set(0, 0, 0);
    this.rightKnee.rotation.set(0, 0, 0);

    (this.blockShield.material as THREE.MeshBasicMaterial).opacity = 0;
    (this.superAura.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  /**
   * Dynamic Skeletal Animation Engine
   * Calculates realistic limb rotations and physics bobbing based on fighter combat state
   */
  public updatePose(state: ActionState, frame: number, time: number, facing: number, move: MoveDefinition | null = null, frozen = false, superVariant: 0 | 1 = 0) {
    this.resetJoints();

    // Facing angle: facing right = PI/2 - 0.32, facing left = -PI/2 + 0.32
    // Angled ~18 degrees towards camera so face, eyes, and shirt prints remain prominent
    const targetYRot = facing === 1 ? Math.PI / 2 - 0.32 : -Math.PI / 2 + 0.32;
    this.group.rotation.y = targetYRot;

    if (this.customModel) {
      this.hips.visible = false;
      this.crouchPose?.restore();
      this.customModel.position.set(0, 0, 0);
      this.customModel.rotation.set(0, 0, 0);
      this.customModel.scale.set(1, 1, 1);

      // Handle Animation Transitions between States
      {
        let targetActionName: string | null = null;
        if (state === 'idle' || state === 'crouch' || state === 'jump' || state === 'getting_up') {
          targetActionName = 'idle';
        } else if (state === 'walk_fwd' || state === 'walk_back') {
          targetActionName = this.actions.has('walk') ? 'walk' : 'idle';
        } else if (state === 'super') {
          const special = superVariant === 0 ? 'super-1' : 'super-2';
          targetActionName = this.actions.has(special) ? special : 'punch';
        } else if (state === 'punch') {
          targetActionName = 'punch';
        } else if (state === 'kick') {
          targetActionName = 'kick';
        } else if (state === 'grab') {
          targetActionName = 'grab';
        } else if (state === 'hitstun' || state === 'blockstun') {
          targetActionName = 'hit';
        } else if (state === 'knockdown') {
          targetActionName = 'knockdown';
        }

        this.currentState = state;
        if (targetActionName && this.actions.has(targetActionName)) {
          const nextAction = this.actions.get(targetActionName)!;
          if (nextAction !== this.currentAction) {
            if (this.currentAction) {
              this.currentAction.fadeOut(0.08);
            }
            nextAction.paused = false;
            nextAction.reset().fadeIn(0.08).play();
            this.currentAction = nextAction;
          }
        }
      }

      // Update Mixamo skeletal animation if mixer is available
      if (this.mixer) {
        let delta = 0;
        if (this.lastTime > 0 && time > this.lastTime) {
          delta = Math.min(0.05, time - this.lastTime);
        }
        this.lastTime = time;
        if (move && this.currentAction && ['punch', 'kick', 'grab', 'super'].includes(state)) {
          this.currentAction.paused = true;
          // If the special asset is still loading, use the punch's own timeline.
          const timingMove = state === 'super' && this.currentAction === this.actions.get('punch') ? { ...move, type: 'punch' as const } : move;
          this.currentAction.time = Math.min(this.currentAction.getClip().duration, attackClipTime(timingMove, frame, superVariant));
        }
        this.mixer.update(frozen ? 0 : delta);
      }

      switch (state) {
        case 'idle': {
          if (!this.mixer) {
            this.customModel.position.y = Math.sin(time * 6) * 0.04;
            this.customModel.rotation.y = Math.sin(time * 3) * 0.06;
            this.customModel.rotation.z = Math.cos(time * 6) * 0.02;
            this.customModel.rotation.x = 0;
            this.customModel.position.z = 0;
          } else {
            this.customModel.position.set(0, 0, 0);
            this.customModel.rotation.set(0, 0, 0);
          }
          break;
        }

        case 'walk_fwd': {
          if (this.actions.has('walk')) {
            const walkAct = this.actions.get('walk')!;
            walkAct.timeScale = 1.25;
            this.customModel.position.set(0, 0, 0);
            this.customModel.rotation.set(0, 0, 0);
          } else {
            this.customModel.position.y = Math.abs(Math.sin(time * 12)) * 0.04;
            this.customModel.rotation.z = Math.sin(time * 12) * 0.04;
            this.customModel.rotation.x = 0.08;
          }
          break;
        }

        case 'walk_back': {
          if (this.actions.has('walk')) {
            const walkAct = this.actions.get('walk')!;
            walkAct.timeScale = -1.15; // Reverse walking gait
            this.customModel.position.set(0, 0, 0);
            this.customModel.rotation.set(0, 0, 0);
          } else {
            this.customModel.position.y = Math.abs(Math.sin(time * 12)) * 0.03;
            this.customModel.rotation.z = -Math.sin(time * 12) * 0.04;
            this.customModel.rotation.x = -0.06;
          }
          break;
        }

        case 'crouch': {
          const progress = Math.min(1, (frame + 1) / 8);
          if (!this.crouchPose?.apply(progress)) this.customModel.scale.y = 1 - progress * 0.18;
          break;
        }

        case 'jump': {
          this.customModel.position.y = 0.22;
          this.customModel.rotation.x = 0.15;
          break;
        }

        case 'block':
        case 'blockstun': {
          this.customModel.position.z = -0.16;
          this.customModel.rotation.x = -0.15;
          (this.blockShield.material as THREE.MeshBasicMaterial).opacity = 0.9;
          this.blockShield.rotation.z += 0.05;
          break;
        }

        case 'getting_up': {
          this.customModel.position.y = -0.15 * (1 - frame / 18);
          break;
        }

        case 'punch': {
          // Dynamic forward lunging impulse with Mixamo cross punch
          const progress = move ? attackExtension(move, frame) : 0;
          this.customModel.position.z = progress * 0.35;
          break;
        }

        case 'kick': {
          // Dynamic forward lunging impulse with Mixamo roundhouse kick
          const progress = move ? attackExtension(move, frame) : 0;
          this.customModel.position.z = progress * 0.40;
          this.customModel.position.y = progress * 0.15;
          break;
        }

        case 'grab': {
          // Dynamic lunge with Mixamo illegal elbow strike
          const progress = move ? attackExtension(move, frame) : 0;
          this.customModel.position.z = progress * 0.38;
          break;
        }

        case 'super': {
          // Cinematic Super Attack Surge
          const progress = move ? attackExtension(move, frame) : 0;
          this.customModel.position.z = progress * 0.12;

          const aura = this.superAura.material as THREE.MeshBasicMaterial;
          aura.opacity = 0.8 + Math.sin(time * 20) * 0.2;
          this.superAura.rotation.y += 0.08;
          break;
        }

        case 'hitstun': {
          // Recoil jitter
          const twitch = Math.sin(frame * 4) * 0.06;
          this.customModel.position.z = -0.22 + twitch;
          break;
        }

        case 'knockdown': {
          if (frame >= 35) {
            // Get-up transition: crossfade back to idle
            if (this.actions.has('idle') && this.currentAction !== this.actions.get('idle')) {
              const idle = this.actions.get('idle')!;
              if (this.currentAction) this.currentAction.fadeOut(0.2);
              idle.reset().fadeIn(0.2).play();
              this.currentAction = idle;
            }
          }
          break;
        }

        case 'victory': {
          this.customModel.position.y = Math.abs(Math.sin(time * 8)) * 0.12;
          this.customModel.rotation.y = Math.sin(time * 4) * 0.2;
          break;
        }
      }
      return;
    }

    switch (state) {
      case 'idle': {
        // Rhythmic breathing & fighting bounce
        const bounce = Math.sin(time * 6) * 0.04;
        this.hips.position.y = 1.05 + bounce;

        // Fists raised guard
        this.leftShoulder.rotation.x = 0.8 + Math.cos(time * 6) * 0.05;
        this.leftElbow.rotation.x = -1.2;
        this.rightShoulder.rotation.x = 0.6 - Math.cos(time * 6) * 0.05;
        this.rightElbow.rotation.x = -1.1;

        // Subtle head tracking
        this.head.rotation.y = Math.sin(time * 3) * 0.05;
        break;
      }

      case 'walk_fwd':
      case 'walk_back': {
        const stride = Math.sin(time * 12);
        this.hips.position.y = 1.05 + Math.abs(Math.sin(time * 12)) * 0.04;

        // Alternating leg swing
        this.leftHip.rotation.x = stride * 0.6;
        this.rightHip.rotation.x = -stride * 0.6;

        this.leftKnee.rotation.x = stride > 0 ? stride * 0.5 : 0;
        this.rightKnee.rotation.x = stride < 0 ? -stride * 0.5 : 0;

        // Arms pumping
        this.leftShoulder.rotation.x = 0.8 - stride * 0.4;
        this.rightShoulder.rotation.x = 0.6 + stride * 0.4;
        break;
      }

      case 'crouch': {
        // Deep crouch stance
        this.hips.position.y = 0.72;
        this.leftHip.rotation.x = -0.7;
        this.leftKnee.rotation.x = 1.2;
        this.rightHip.rotation.x = -0.7;
        this.rightKnee.rotation.x = 1.2;

        this.leftShoulder.rotation.x = 1.1;
        this.rightShoulder.rotation.x = 1.1;
        this.torso.rotation.x = 0.2;
        break;
      }

      case 'jump': {
        // Aerial leap with legs pulled up
        this.leftHip.rotation.x = -0.5;
        this.leftKnee.rotation.x = 0.8;
        this.rightHip.rotation.x = -0.3;
        this.rightKnee.rotation.x = 0.6;

        this.leftShoulder.rotation.z = -0.6;
        this.rightShoulder.rotation.z = 0.6;
        break;
      }

      case 'block': {
        // Tight guard: Crossed arms covering face with glowing neon shield
        this.leftShoulder.rotation.set(1.4, 0.4, 0);
        this.leftElbow.rotation.set(-1.6, 0, 0);

        this.rightShoulder.rotation.set(1.4, -0.4, 0);
        this.rightElbow.rotation.set(-1.6, 0, 0);

        (this.blockShield.material as THREE.MeshBasicMaterial).opacity = 0.85;
        this.blockShield.rotation.z += 0.05;
        break;
      }

      case 'punch': {
        // Full lunging straight right punch
        const progress = move ? attackExtension(move, frame) : 0;

        this.torso.rotation.y = progress * 0.4;
        // Right punch extending fully forward (+z in local torso space)
        this.rightShoulder.rotation.x = progress * 1.55;
        this.rightElbow.rotation.x = -progress * 0.2;

        // Left hand guards chin
        this.leftShoulder.rotation.x = 1.0;
        this.leftElbow.rotation.x = -1.4;
        break;
      }

      case 'kick': {
        // Extended high roundhouse kick
        const progress = move ? attackExtension(move, frame) : 0;

        this.hips.rotation.z = progress * 0.2;
        // Right leg sweeps high
        this.rightHip.rotation.x = -progress * 1.5;
        this.rightKnee.rotation.x = progress * 0.3;

        // Arms balance
        this.leftShoulder.rotation.z = -progress * 0.8;
        this.rightShoulder.rotation.z = progress * 0.8;
        break;
      }

      case 'grab': {
        // Both hands reaching forward
        this.leftShoulder.rotation.x = 1.4;
        this.rightShoulder.rotation.x = 1.4;
        this.torso.rotation.x = 0.2;
        break;
      }

      case 'super': {
        // Cinematic Super Surge: Arms back windup -> massive leap
        const aura = this.superAura.material as THREE.MeshBasicMaterial;
        aura.opacity = 0.75 + Math.sin(time * 20) * 0.2;
        this.superAura.rotation.y += 0.08;

        this.torso.rotation.x = -0.3;
        this.leftShoulder.rotation.x = 2.2;
        this.rightShoulder.rotation.x = 2.2;
        break;
      }

      case 'hitstun': {
        // Recoil from hit
        const twitch = Math.sin(frame * 2) * 0.3;
        this.head.rotation.x = -0.4;
        this.torso.rotation.x = -0.3 + twitch * 0.1;
        this.hips.position.y = 1.0 - 0.05;
        break;
      }

      case 'knockdown': {
        if (frame < 30) {
          // Complete knockout fall on floor
          this.hips.position.y = 0.18;
          this.group.rotation.x = -Math.PI / 2;
          this.leftShoulder.rotation.set(0.4, 0, -0.6);
          this.rightShoulder.rotation.set(0.4, 0, 0.6);
        } else if (frame < 48) {
          // Dynamic Rise / Get-Up animation pushing off the floor
          const getUpT = (frame - 30) / 18; // 0 to 1
          this.hips.position.y = 0.18 + getUpT * 0.87;
          this.group.rotation.x = (-Math.PI / 2) * (1 - getUpT);
          this.torso.rotation.x = (1 - getUpT) * 0.4;
          this.leftShoulder.rotation.x = (1 - getUpT) * 1.2;
          this.rightShoulder.rotation.x = (1 - getUpT) * 1.2;
        } else {
          this.group.rotation.x = 0;
          this.hips.position.y = 1.05;
        }
        break;
      }

      case 'victory': {
        // Hands held high in victory
        this.leftShoulder.rotation.set(2.8, 0, 0.4);
        this.rightShoulder.rotation.set(2.8, 0, -0.4);
        this.head.rotation.x = 0.2;
        this.hips.position.y = 1.05 + Math.sin(time * 4) * 0.03;
        break;
      }

      case 'defeat': {
        // Slumped in defeat
        this.torso.rotation.x = 0.5;
        this.head.rotation.x = 0.6;
        this.leftShoulder.rotation.x = 0.2;
        this.rightShoulder.rotation.x = 0.2;
        break;
      }
    }
  }
}
