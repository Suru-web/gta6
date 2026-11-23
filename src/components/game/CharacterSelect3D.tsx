'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Character, Arena, Difficulty } from '@/types/game';
import { GTA_ROSTER, DEFAULT_PLAYER_CHARACTER, DEFAULT_CPU_CHARACTER } from '@/config/roster';
import { ARENAS, DEFAULT_ARENA } from '@/config/arenas';
import { CharacterModel3D } from '@/game/three/characterModel';
import { ArenaScene3D } from '@/game/three/arenaScene';
import { ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface CharacterSelect3DProps {
  onStartFight: (config: {
    playerChar: Character;
    cpuChar: Character;
    arena: Arena;
    difficulty: Difficulty;
  }) => void;
  onBackToTitle?: () => void;
}

export const CharacterSelect3D: React.FC<CharacterSelect3DProps> = ({
  onStartFight,
  onBackToTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'p1' | 'cpu'>('p1');
  const [selectedPlayer, setSelectedPlayer] = useState<Character>(DEFAULT_PLAYER_CHARACTER);
  const [selectedCpu, setSelectedCpu] = useState<Character>(DEFAULT_CPU_CHARACTER);
  const [selectedArena, setSelectedArena] = useState<Arena>(DEFAULT_ARENA);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const selectedPlayerRef = useRef(DEFAULT_PLAYER_CHARACTER);
  const selectedCpuRef = useRef(DEFAULT_CPU_CHARACTER);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ArenaScene3D | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const p1ModelRef = useRef<CharacterModel3D | null>(null);
  const cpuModelRef = useRef<CharacterModel3D | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const activeChar = activeTab === 'p1' ? selectedPlayer : selectedCpu;

  useEffect(() => () => sounds.stopCharacterSelection(), []);

  // Initialize Three.js 3D Face-Off Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 320;

    // 1. Scene & Camera
    const arenaScene = new ArenaScene3D(selectedArena);
    sceneRef.current = arenaScene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const fitPreview = () => {
      // Keep both fighters inside narrow portrait and split-screen previews.
      camera.position.z = Math.max(3.8, 2.6 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    };
    camera.position.set(0, 1.45, 3.8);
    fitPreview();
    camera.lookAt(0, 1.15, 0);

    // 2. WebGL Renderer with Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. 3D "VS" Emblem with Canvas Texture in Center
    const vsCanvas = document.createElement('canvas');
    vsCanvas.width = 256;
    vsCanvas.height = 256;
    const vsCtx = vsCanvas.getContext('2d');
    if (vsCtx) {
      vsCtx.clearRect(0, 0, 256, 256);
      vsCtx.font = 'italic 900 130px Impact, Arial, sans-serif';
      vsCtx.textAlign = 'center';
      vsCtx.textBaseline = 'middle';

      // Deep Shadow
      vsCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      vsCtx.fillText('VS', 134, 134);

      // Bright Orange-Red Gradient
      const vsGrad = vsCtx.createLinearGradient(0, 60, 0, 200);
      vsGrad.addColorStop(0, '#fca47a');
      vsGrad.addColorStop(0.5, '#ea580c');
      vsGrad.addColorStop(1, '#dc2626');
      vsCtx.fillStyle = vsGrad;
      vsCtx.fillText('VS', 128, 128);

      // Crisp White Outline
      vsCtx.lineWidth = 5;
      vsCtx.strokeStyle = '#ffffff';
      vsCtx.strokeText('VS', 128, 128);
    }
    const vsTexture = new THREE.CanvasTexture(vsCanvas);
    const vsGeo = new THREE.PlaneGeometry(0.85, 0.85);
    const vsMat = new THREE.MeshBasicMaterial({
      map: vsTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const vsMesh = new THREE.Mesh(vsGeo, vsMat);
    vsMesh.position.set(0, 1.45, 0.15);
    arenaScene.scene.add(vsMesh);

    // 4. Player 1 3D Model (Left, 3/4 hero angle)
    const p1Model = new CharacterModel3D(selectedPlayerRef.current, true);
    p1Model.group.position.set(-1.15, 0, 0);
    p1Model.group.rotation.y = Math.PI / 4;
    arenaScene.scene.add(p1Model.group);
    p1ModelRef.current = p1Model;

    // 5. CPU Opponent 3D Model (Right, 3/4 hero angle)
    const cpuModel = new CharacterModel3D(selectedCpuRef.current, false);
    cpuModel.group.position.set(1.15, 0, 0);
    cpuModel.group.rotation.y = -Math.PI / 4;
    arenaScene.scene.add(cpuModel.group);
    cpuModelRef.current = cpuModel;

    // 6. 60 FPS Render & Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Animate 3D Fighting Poses with 3/4 Hero Stance
      if (p1ModelRef.current) {
        p1ModelRef.current.updatePose('idle', 0, time, 1);
        p1ModelRef.current.group.rotation.y = Math.PI / 4;
      }
      if (cpuModelRef.current) {
        cpuModelRef.current.updatePose('idle', 0, time + 0.5, -1);
        cpuModelRef.current.group.rotation.y = -Math.PI / 4;
      }

      // Rotate & Pulse "VS" Mesh
      vsMesh.position.y = 1.45 + Math.sin(time * 3) * 0.04;
      vsMesh.rotation.y = Math.sin(time * 2) * 0.15;
      vsMesh.scale.setScalar(1 + Math.sin(time * 4) * 0.05);

      renderer.render(arenaScene.scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 320;
      camera.aspect = w / h;
      fitPreview();
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      p1ModelRef.current = null;
      cpuModelRef.current = null;
    };
  }, [selectedArena]);

  // Update 3D P1 Model when selected player changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (p1ModelRef.current) {
      sceneRef.current.scene.remove(p1ModelRef.current.group);
    }
    const newP1 = new CharacterModel3D(selectedPlayer, true);
    newP1.group.position.set(-1.15, 0, 0);
    newP1.group.rotation.y = Math.PI / 4;
    sceneRef.current.scene.add(newP1.group);
    p1ModelRef.current = newP1;
  }, [selectedPlayer]);

  // Update 3D CPU Model when selected CPU changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (cpuModelRef.current) {
      sceneRef.current.scene.remove(cpuModelRef.current.group);
    }
    const newCpu = new CharacterModel3D(selectedCpu, false);
    newCpu.group.position.set(1.15, 0, 0);
    newCpu.group.rotation.y = -Math.PI / 4;
    sceneRef.current.scene.add(newCpu.group);
    cpuModelRef.current = newCpu;
  }, [selectedCpu]);

  const handleSelectChar = (char: Character) => {
    sounds.playCharacterSelection(char.id);
    if (activeTab === 'p1') {
      selectedPlayerRef.current = char;
      setSelectedPlayer(char);
    } else {
      selectedCpuRef.current = char;
      setSelectedCpu(char);
    }
  };

  const handleStart = () => {
    sounds.playCheatCode();
    onStartFight({
      playerChar: selectedPlayer,
      cpuChar: selectedCpu,
      arena: selectedArena,
      difficulty,
    });
  };

  return (
    <section className="fight-select mx-auto max-w-7xl px-4 sm:px-6">
      <div className="fight-select-header">
        <div><p className="arena-eyebrow"><span /> THE FIGHT CARD</p><h2>Choose your fighters<span>.</span></h2></div>
        <button type="button" onClick={onBackToTitle} className="fight-back">← Back to arena</button>
      </div>
      <div className="fight-select-grid">
        <div className="fight-preview">
          <div ref={containerRef} className="absolute inset-0" />
          <div className="fight-preview-name left"><small>PLAYER 01</small><strong>{selectedPlayer.name}</strong><span>{selectedPlayer.game}</span></div>
          <div className="fight-preview-name right"><small>CPU OPPONENT</small><strong>{selectedCpu.name}</strong><span>{selectedCpu.game}</span></div>
          <div className="fight-preview-stage">{selectedArena.name} <span> / </span> {difficulty}</div>
        </div>
        <div className="fight-setup">
          <div className="fight-tabs" aria-label="Choose whose fighter to edit">
            <button type="button" aria-pressed={activeTab === 'p1'} onClick={() => setActiveTab('p1')}>01 <span>Your fighter</span></button>
            <button type="button" aria-pressed={activeTab === 'cpu'} onClick={() => setActiveTab('cpu')}>02 <span>Your rival</span></button>
          </div>
          <div className="fight-setup-heading"><div><span>THE ROSTER</span><h3>{activeTab === 'p1' ? 'Pick your fighter' : 'Pick your opponent'}</h3></div><span>{GTA_ROSTER.length} FIGHTERS</span></div>
          <div className="fight-roster">
            {GTA_ROSTER.map((char, index) => (
              <button key={char.id} type="button" onClick={() => handleSelectChar(char)} aria-pressed={activeChar.id === char.id} className="fight-roster-item">
                <span className="fight-roster-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="fight-roster-initial">{char.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>
                <strong>{char.name}</strong><small>{char.game.replace('GTA: ', '').replace('GTA ', '')}</small>
                {(selectedPlayer.id === char.id || selectedCpu.id === char.id) && <span className="fight-roster-mark">{selectedPlayer.id === char.id ? 'P1' : ''}{selectedPlayer.id === char.id && selectedCpu.id === char.id ? ' / ' : ''}{selectedCpu.id === char.id ? 'CPU' : ''}</span>}
              </button>
            ))}
          </div>
          <div className="fight-options">
            <fieldset><legend>STAGE</legend><div>{ARENAS.map(a => <button key={a.id} type="button" aria-pressed={selectedArena.id === a.id} onClick={() => { sounds.playClick(); setSelectedArena(a); }}>{a.city}</button>)}</div></fieldset>
            <fieldset><legend>DIFFICULTY</legend><div>{(['practice', 'easy', 'normal', 'hard'] as Difficulty[]).map(d => <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => { sounds.playClick(); setDifficulty(d); }}>{d}</button>)}</div></fieldset>
          </div>
          <button type="button" onClick={handleStart} className="arena-primary fight-start">Enter the arena <ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  );
};
