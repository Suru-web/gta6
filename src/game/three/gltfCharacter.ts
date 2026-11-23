'use client';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CHARACTER_MATERIAL_BINDINGS } from './characterMaterials';

export interface LoadedGLTFModel {
  scene: THREE.Group;
  mixer?: THREE.AnimationMixer;
  animations: THREE.AnimationClip[];
}

interface CachedAsset {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

/**
 * Universal Combat Animation Manager
 * Loads shared motion capture animations (Punch, Kick, Grab, Hit, Knockdown)
 * and retargets hip translations to match any character's individual proportions.
 */
export class CombatAnimations {
  private static clips: Map<string, THREE.AnimationClip> = new Map();
  private static loadingPromise: Promise<Map<string, THREE.AnimationClip>> | null = null;
  private static loader: FBXLoader | null = null;

  public static async loadClips(): Promise<Map<string, THREE.AnimationClip>> {
    if (this.clips.size >= 8) return this.clips;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      if (!this.loader) this.loader = new FBXLoader();
      const loader = this.loader;
      const files: [string, string][] = [
        ['punch', '/animations/punch.fbx'],
        ['kick', '/animations/kick.fbx'],
        ['grab', '/animations/grab.fbx'],
        ['hit', '/animations/hit.fbx'],
        ['knockdown', '/animations/knockdown.fbx'],
        ['walk', '/animations/walk.fbx'],
        ['super-1', '/animations/super-1.fbx'],
        ['super-2', '/animations/super-2.fbx'],
      ];

      await Promise.all(files.map(async ([name, url]) => {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) {
            const fbx = await loader.loadAsync(url);
            if (fbx.animations && fbx.animations.length > 0) {
              const clip = fbx.animations[0];
              clip.name = name;
              this.clips.set(name, clip);
            }
          }
        } catch (e) {
          console.warn(`[CombatAnimations] Failed loading ${name}:`, e);
        }
      }));
      return this.clips;
    })();

    return this.loadingPromise;
  }

  /**
   * Retargets an animation clip's hip translation to match the target character's scale
   */
  public static retargetClip(clip: THREE.AnimationClip, modelIdleClip?: THREE.AnimationClip, lockHorizontalRoot = false): THREE.AnimationClip {
    let targetHipY = 1.0;
    if (modelIdleClip) {
      const targetHipTrack = modelIdleClip.tracks.find((t) => /hips.*\.position/i.test(t.name));
      if (targetHipTrack && targetHipTrack.values.length >= 3) {
        targetHipY = targetHipTrack.values[1];
      }
    }

    const cloned = clip.clone();
    const hipTrack = cloned.tracks.find((t) => /hips.*\.position/i.test(t.name));
    if (hipTrack && hipTrack.values.length >= 3) {
      const animHipY = hipTrack.values[1];
      if (animHipY > 0 && targetHipY > 0) {
        const ratio = targetHipY / animHipY;
        for (let i = 0; i < hipTrack.values.length; i += 3) {
          hipTrack.values[i] *= ratio;
          hipTrack.values[i + 1] *= ratio;
          hipTrack.values[i + 2] *= ratio;
        }
      }
      if (lockHorizontalRoot) {
        // Movement belongs to the combat simulation. The imported specials
        // contain large root translations that otherwise slide the model away
        // from its hitbox and the opponent.
        const idleHip = modelIdleClip?.tracks.find((track) => /hips.*\.position/i.test(track.name));
        const idleX = idleHip?.values[0] ?? 0;
        const idleZ = idleHip?.values[2] ?? 0;
        for (let i = 0; i < hipTrack.values.length; i += 3) {
          hipTrack.values[i] = idleX;
          hipTrack.values[i + 2] = idleZ;
        }
      }
    }
    return cloned;
  }
}

/**
 * Universal 3D Character Model Loader
 * Enables photorealistic 3D models with Mixamo skeletal mocap animations
 * to seamlessly load, skin, and play at 60 FPS in GTA Legends Arena.
 */
export class GLTFCharacterLoader {
  private static gltfLoader: GLTFLoader | null = null;
  private static fbxLoader: FBXLoader | null = null;
  private static cache: Map<string, CachedAsset> = new Map();
  private static loadPromises: Map<string, Promise<LoadedGLTFModel | null>> = new Map();

  private static getGLTFLoader(): GLTFLoader {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
    }
    return this.gltfLoader;
  }

  private static getFBXLoader(): FBXLoader {
    if (!this.fbxLoader) {
      this.fbxLoader = new FBXLoader();
    }
    return this.fbxLoader;
  }

  /**
   * Loads a custom 3D model with embedded Mixamo fighting animation.
   * Prioritizes /models/{characterId}.fbx, transferring authentic textures from .glb.
   * Falls back to /models/{characterId}.glb if no .fbx is present.
   */
  public static async loadCharacter(characterId: string): Promise<LoadedGLTFModel | null> {
    if (this.cache.has(characterId)) {
      const cached = this.cache.get(characterId)!;
      const clonedScene = SkeletonUtils.clone(cached.scene) as THREE.Group;
      return {
        scene: clonedScene,
        animations: cached.animations,
      };
    }

    if (this.loadPromises.has(characterId)) {
      const cachedResult = await this.loadPromises.get(characterId)!;
      if (!cachedResult) return null;
      const cached = this.cache.get(characterId);
      if (cached) {
        const clonedScene = SkeletonUtils.clone(cached.scene) as THREE.Group;
        return {
          scene: clonedScene,
          animations: cached.animations,
        };
      }
      return cachedResult;
    }

    const promise = (async () => {
      const fbxUrl = `/models/${characterId}.fbx`;
      const glbUrl = `/models/${characterId}.glb`;

      try {
        let hasFbx = false;
        try {
          const fbxCheck = await fetch(fbxUrl, { method: 'HEAD' });
          if (fbxCheck.ok) hasFbx = true;
        } catch {
          hasFbx = false;
        }

        if (hasFbx) {
          const fbxLoader = this.getFBXLoader();
          const fbx = await fbxLoader.loadAsync(fbxUrl);

          // Transfer authentic textures and materials from GLB
          try {
            const gltfCheck = await fetch(glbUrl, { method: 'HEAD' });
            if (gltfCheck.ok) {
              const gltfLoader = this.getGLTFLoader();
              const gltf = await gltfLoader.loadAsync(glbUrl);

              const matMap = new Map<string, THREE.Material>();
              const glbMatsList: THREE.Material[] = [];
              let firstMat: THREE.Material | null = null;

              gltf.scene.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                  const mesh = node as THREE.Mesh;
                  if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                      mesh.material.forEach((m) => {
                        matMap.set(node.name, m);
                        if (m.name) matMap.set(m.name, m);
                        glbMatsList.push(m);
                      });
                    } else {
                      matMap.set(node.name, mesh.material);
                      if (mesh.material.name) matMap.set(mesh.material.name, mesh.material);
                      glbMatsList.push(mesh.material);
                    }
                    if (!firstMat && glbMatsList.length > 0) {
                      firstMat = glbMatsList[0];
                    }
                  }
                }
              });

              // Apply materials to FBX skinned meshes
              let fbxMatIndex = 0;
              fbx.traverse((node) => {
                if ((node as THREE.SkinnedMesh).isSkinnedMesh || (node as THREE.Mesh).isMesh) {
                  const mesh = node as THREE.SkinnedMesh | THREE.Mesh;
                  const explicitMaterial = CHARACTER_MATERIAL_BINDINGS[characterId]?.[node.name];
                  if (explicitMaterial && matMap.has(explicitMaterial)) {
                    mesh.material = matMap.get(explicitMaterial)!.clone();
                  } else if (matMap.has(node.name)) {
                    mesh.material = matMap.get(node.name)!.clone();
                  } else if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map((m) =>
                      m && matMap.has(m.name) ? matMap.get(m.name)!.clone() : m
                    );
                  } else if (mesh.material && matMap.has(mesh.material.name)) {
                    mesh.material = matMap.get(mesh.material.name)!.clone();
                  } else if (glbMatsList[fbxMatIndex]) {
                    mesh.material = glbMatsList[fbxMatIndex].clone();
                    fbxMatIndex++;
                  } else if (firstMat) {
                    mesh.material = firstMat.clone();
                  }
                }
              });
            }
          } catch (glbErr) {
            console.warn(`[GLTFCharacterLoader] GLB texture transfer skipped for "${characterId}":`, glbErr);
          }

          fbx.updateMatrixWorld(true);
          fbx.traverse((node) => {
            if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
              const sm = node as THREE.SkinnedMesh;
              sm.frustumCulled = false;
              sm.castShadow = true;
              sm.receiveShadow = true;
              sm.computeBoundingBox();
              if (sm.material) {
                if (Array.isArray(sm.material)) {
                  sm.material.forEach((m) => { m.side = THREE.DoubleSide; });
                } else {
                  sm.material.side = THREE.DoubleSide;
                }
              }
            } else if ((node as THREE.Mesh).isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          // Sample initial animation pose to find exact feet and head bounds
          if (fbx.animations && fbx.animations.length > 0) {
            const tempMixer = new THREE.AnimationMixer(fbx);
            const tempAction = tempMixer.clipAction(fbx.animations[0]);
            tempAction.play();
            tempMixer.update(0.001);
          }

          let minBoneY = Infinity;
          let maxBoneY = -Infinity;
          let centerBoneX = 0;
          let centerBoneZ = 0;
          let boneCount = 0;

          fbx.traverse((c) => {
            if ((c as THREE.Bone).isBone) {
              const wp = new THREE.Vector3();
              c.getWorldPosition(wp);
              if (wp.y < minBoneY) minBoneY = wp.y;
              if (wp.y > maxBoneY) maxBoneY = wp.y;
              centerBoneX += wp.x;
              centerBoneZ += wp.z;
              boneCount++;
            }
          });

          // Normalize scale & height to ~1.85m fighting scale using bone skeleton bounds
          const boneHeight = maxBoneY - minBoneY;
          const targetHeight = 1.85;
          const scale = boneHeight > 0 && Number.isFinite(boneHeight) ? targetHeight / boneHeight : 1;
          fbx.scale.set(scale, scale, scale);

          // Center on X and Z, and place feet firmly on floor Y = 0
          const avgX = boneCount > 0 ? (centerBoneX / boneCount) * scale : 0;
          const avgZ = boneCount > 0 ? (centerBoneZ / boneCount) * scale : 0;
          fbx.position.x = -avgX;
          fbx.position.z = -avgZ;
          fbx.position.y = -minBoneY * scale;

          const container = new THREE.Group();
          container.add(fbx);

          this.cache.set(characterId, {
            scene: container,
            animations: fbx.animations || [],
          });

          const clonedScene = SkeletonUtils.clone(container) as THREE.Group;
          return {
            scene: clonedScene,
            animations: fbx.animations || [],
          };
        }

        // Fallback to GLB (Claude, Niko)
        let hasGlb = false;
        try {
          const glbCheck = await fetch(glbUrl, { method: 'HEAD' });
          if (glbCheck.ok) hasGlb = true;
        } catch {
          hasGlb = false;
        }

        if (!hasGlb) return null;

        const gltfLoader = this.getGLTFLoader();
        const gltf = await gltfLoader.loadAsync(glbUrl);
        const root = gltf.scene;

        root.updateMatrixWorld(true);
        root.traverse((node) => {
          if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
            const sm = node as THREE.SkinnedMesh;
            sm.frustumCulled = false;
            sm.computeBoundingBox();
          }
        });

        // Auto-normalize scale & height to ~1.85m fighting scale
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);

        if (size.y > 0) {
          const targetHeight = 1.85;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);
        }

        root.updateMatrixWorld(true);
        const updatedBox = new THREE.Box3().setFromObject(root);
        const center = new THREE.Vector3();
        updatedBox.getCenter(center);

        root.position.x = -center.x;
        root.position.z = -center.z;
        root.position.y = -updatedBox.min.y;

        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            const mesh = node as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.Material;
              mat.side = THREE.DoubleSide;
            }
          }
        });

        const container = new THREE.Group();
        container.add(root);

        this.cache.set(characterId, {
          scene: container,
          animations: gltf.animations || [],
        });

        const clonedScene = SkeletonUtils.clone(container) as THREE.Group;
        return {
          scene: clonedScene,
          animations: gltf.animations || [],
        };
      } catch (err) {
        console.warn(`[GLTFCharacterLoader] Model loading failed for "${characterId}":`, err);
        return null;
      }
    })();

    this.loadPromises.set(characterId, promise);
    return promise;
  }
}
