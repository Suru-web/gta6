import * as THREE from 'three';
import { Arena } from '@/types/game';
import { textures } from './textures';

export class ArenaScene3D {
  public scene: THREE.Scene;
  public arena: Arena;
  public floor: THREE.Mesh;
  public dirLight: THREE.DirectionalLight;
  public neonPointLeft: THREE.PointLight;
  public neonPointRight: THREE.PointLight;

  constructor(arena: Arena) {
    this.arena = arena;
    this.scene = new THREE.Scene();

    // Fog for depth
    this.scene.fog = new THREE.FogExp2(0x090514, 0.035);

    // 1. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Key Directional Light with Real 3D Shadows
    this.dirLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    this.dirLight.position.set(5, 12, 7);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 25;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 8;
    this.dirLight.shadow.camera.bottom = -2;
    this.scene.add(this.dirLight);

    // Cyan Neon Rim Light (Left)
    this.neonPointLeft = new THREE.PointLight(0x06b6d4, 2.5, 15);
    this.neonPointLeft.position.set(-6, 2.5, 3);
    this.scene.add(this.neonPointLeft);

    // Pink / Gold Neon Rim Light (Right)
    const rightNeonColor = arena.id === 'los-santos' ? 0x10b981 : 0xec4899;
    this.neonPointRight = new THREE.PointLight(rightNeonColor, 2.5, 15);
    this.neonPointRight.position.set(6, 2.5, 3);
    this.scene.add(this.neonPointRight);

    // 2. ARENA GROUND STAGE
    const floorGeo = new THREE.PlaneGeometry(28, 16);
    const floorTex = textures.getArenaFloorTexture(arena.neonColor);
    floorTex.repeat.set(4, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.3,
    });

    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Glowing Neon Curb Strip on Front
    const curbGeo = new THREE.BoxGeometry(28, 0.08, 0.2);
    const curbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(arena.neonColor) });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.04, 3.8);
    this.scene.add(curb);

    // 3. BACKGROUND PROPS (LANDMARKS)
    this.buildLandmarks();
  }

  private buildLandmarks() {
    // 3D Vice City / Leonida Art Deco Facade
    const hotelGeo = new THREE.BoxGeometry(16, 9, 3);
    const hotelMat = new THREE.MeshStandardMaterial({
      color: 0x181024,
      roughness: 0.8,
    });
    const hotel = new THREE.Mesh(hotelGeo, hotelMat);
    hotel.position.set(0, 4.5, -6.5);
    this.scene.add(hotel);

    // Glowing Neon Sign atop Building
    const signGeo = new THREE.BoxGeometry(6, 1.2, 0.2);
    const signMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.arena.neonColor) });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 9.6, -6.4);
    this.scene.add(sign);

    // 3D Palm Trees (Left & Right)
    this.createPalmTree(-6.5, 0, -3.5);
    this.createPalmTree(6.5, 0, -3.5);
  }

  private createPalmTree(x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Curved Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 5.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.75;
    trunk.rotation.z = x > 0 ? -0.1 : 0.1;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Green Palm Fronds / Leaves
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(1.8, 0.45);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(Math.cos(angle) * 0.7, 5.5, Math.sin(angle) * 0.7);
      frond.rotation.y = angle;
      frond.rotation.x = -0.55;
      frond.castShadow = true;
      treeGroup.add(frond);
    }

    this.scene.add(treeGroup);
  }
}
