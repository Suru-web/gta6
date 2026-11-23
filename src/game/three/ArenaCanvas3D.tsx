'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameEngine } from '@/game/engine';
import { ArenaScene3D } from '@/game/three/arenaScene';
import { CharacterModel3D } from '@/game/three/characterModel';
import { arenaCameraDistance } from '@/game/three/cameraFraming';

interface ArenaCanvas3DProps {
  engine: GameEngine | null;
}

export const ArenaCanvas3D: React.FC<ArenaCanvas3DProps> = ({ engine }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<ArenaScene3D | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const p1ModelRef = useRef<CharacterModel3D | null>(null);
  const cpuModelRef = useRef<CharacterModel3D | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || !engine) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene & Camera
    const arenaScene = new ArenaScene3D(engine.arena);
    sceneRef.current = arenaScene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const initialDistance = Math.abs(engine.player.x - engine.cpu.x) / 400 * 5.2;
    camera.position.set(0, 1.45, arenaCameraDistance(initialDistance, camera.aspect, camera.fov));
    camera.lookAt(0, 1.15, 0);
    cameraRef.current = camera;
    engine.setImpactProjection((x, y) => {
      const point = new THREE.Vector3(((x - 400) / 400) * 5.2, (engine.groundY - y) / 60, 0).project(camera);
      return { x: (point.x + 1) * engine.width / 2, y: (1 - point.y) * engine.height / 2 };
    });

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. 3D Fighter Models
    const p1Model = new CharacterModel3D(engine.player.character, true);
    arenaScene.scene.add(p1Model.group);
    p1ModelRef.current = p1Model;

    const cpuModel = new CharacterModel3D(engine.cpu.character, false);
    arenaScene.scene.add(cpuModel.group);
    cpuModelRef.current = cpuModel;

    // 4. 60 FPS Render & Animation Loop
    const animate = () => {
      if (!engine || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const time = engine.simulationTime;

      // Convert 2D engine coordinates (0-800) into 3D world space (-5.5 to +5.5)
      const p1WorldX = ((engine.player.x - 400) / 400) * 5.2;
      const p1WorldY = Math.max(0, (engine.groundY - engine.player.y) / 60);

      const cpuWorldX = ((engine.cpu.x - 400) / 400) * 5.2;
      const cpuWorldY = Math.max(0, (engine.groundY - engine.cpu.y) / 60);

      // Update 3D Model Positions
      if (p1ModelRef.current) {
        p1ModelRef.current.group.position.set(p1WorldX, p1WorldY, 0);
        p1ModelRef.current.updatePose(
          engine.player.state,
          engine.player.stateFrame,
          time,
          engine.player.facing,
          engine.player.currentMove,
          engine.player.hitstopFrames > 0,
          engine.player.superVariant
        );
      }

      if (cpuModelRef.current) {
        cpuModelRef.current.group.position.set(cpuWorldX, cpuWorldY, 0);
        cpuModelRef.current.updatePose(
          engine.cpu.state,
          engine.cpu.stateFrame,
          time,
          engine.cpu.facing,
          engine.cpu.currentMove,
          engine.cpu.hitstopFrames > 0,
          engine.cpu.superVariant
        );
      }

      // Dynamic 3D Camera Tracking
      const midX = (p1WorldX + cpuWorldX) / 2;
      const fighterDistance = Math.abs(p1WorldX - cpuWorldX);
      const targetZ = arenaCameraDistance(fighterDistance, camera.aspect, camera.fov);

      camera.position.x += (midX - camera.position.x) * 0.08;
      camera.position.z += (targetZ - camera.position.z) * 0.08;
      camera.lookAt(camera.position.x, 1.15, 0);

      renderer.render(sceneRef.current.scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 480;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      engine.setImpactProjection(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      p1ModelRef.current = null;
      cpuModelRef.current = null;
    };
  }, [engine]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full block z-0 overflow-hidden pointer-events-none"
    />
  );
};
