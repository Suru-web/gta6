/**
 * Handles audio playback for the GTA 6 fund:
 * - Plays the 5 user-provided meme sound effects on amount selection
 * - Web Audio API synthesized celebration fanfares for missions & cheats
 */

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private currentAudio: HTMLAudioElement | null = null;

  // 5 user-uploaded sound effects stored in /public/sounds/
  public readonly donateSounds: string[] = [
    '/sounds/donate-0.mp3', // "Thank you very much, that's really nice..."
    '/sounds/donate-1.mp3', // Dramatic suspense music
    '/sounds/donate-2.mp3', // Heavy punch / boom
    '/sounds/donate-3.mp3', // Goofy meme sound
    '/sounds/donate-4.mp3', // "FAAAAH" funny scream
  ];

  // GTA / Vice City iconic audio assets
  public readonly gtaSounds: Record<string, string> = {
    cheat: '/sounds/gta-cheat.mp3',
    missionPassed: '/sounds/vice-city-mission.mp3',
    wasted: '/sounds/vice-city-death.mp3',
    police: '/sounds/police-radio.mp3',
    cash: '/sounds/cash-register.mp3',
    tommy: '/sounds/tommy-vercetti.mp3',
    bigSmoke: '/sounds/big-smoke.mp3',
  };

  private audioCache: HTMLAudioElement[] = [];
  private namedAudioCache: Map<string, HTMLAudioElement> = new Map();
  private diceAudio: HTMLAudioElement | null = null;
  private lastCycleIndex: number = -1;

  constructor() {
    if (typeof window !== 'undefined') {
      // Pre-instantiate audio objects for instant latency-free playback
      this.donateSounds.forEach((src) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.audioCache.push(audio);
      });

      Object.entries(this.gtaSounds).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.namedAudioCache.set(key, audio);
      });

      this.diceAudio = new Audio('/sounds/dice-roll.mp3');
      this.diceAudio.preload = 'auto';
    }
  }

  /**
   * Play any custom sound by named key or URL path
   */
  public playSound(keyOrPath: string, volume: number = 0.9): Promise<void> | undefined {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      const src = this.gtaSounds[keyOrPath] || keyOrPath;
      let audio = this.namedAudioCache.get(keyOrPath) || this.namedAudioCache.get(src);
      if (!audio) {
        audio = new Audio(src);
        audio.preload = 'auto';
        this.namedAudioCache.set(src, audio);
      }

      audio.currentTime = 0;
      audio.volume = volume;
      this.currentAudio = audio;

      const p = audio.play();
      if (p !== undefined) {
        return p.catch((err) => {
          console.warn('Playback interrupted or prevented:', err);
        });
      }
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  /**
   * Play the tactile sound of dice rolling (for "Next Excuse 🎲")
   */
  public playDiceRoll() {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if (!this.diceAudio) {
        this.diceAudio = new Audio('/sounds/dice-roll.mp3');
      }
      this.diceAudio.currentTime = 0;
      this.diceAudio.volume = 0.85;
      const promise = this.diceAudio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback to Web Audio synthesis if audio element fails
          this.synthesizeDiceRoll();
        });
      }
    } catch {
      this.synthesizeDiceRoll();
    }
  }

  /**
   * Web Audio API synthesized tumbling dice rattle
   */
  private synthesizeDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const impacts = [0.0, 0.06, 0.13, 0.21, 0.30, 0.40, 0.48];
      impacts.forEach((time, idx) => {
        const hitTime = now + time;
        const gainLevel = (1 - idx / impacts.length) * 0.15 + 0.03;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 150, hitTime);
        osc.frequency.exponentialRampToValueAtTime(160, hitTime + 0.04);

        gain.gain.setValueAtTime(gainLevel, hitTime);
        gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(hitTime);
        osc.stop(hitTime + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play one of the 5 user sound effects when selecting donate amount
   * @param soundIndex Specific sound index (0-4), or omitted to cycle
   */
  public playDonateSound(soundIndex?: number) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      // Stop any currently playing audio so it doesn't overlap
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      let idx: number;
      if (soundIndex !== undefined && soundIndex >= 0 && soundIndex < this.donateSounds.length) {
        idx = soundIndex;
      } else {
        // Cycle sequentially through the 5 sounds
        this.lastCycleIndex = (this.lastCycleIndex + 1) % this.donateSounds.length;
        idx = this.lastCycleIndex;
      }

      // Reuse cached element or create new
      let audio = this.audioCache[idx];
      if (!audio) {
        audio = new Audio(this.donateSounds[idx]);
        this.audioCache[idx] = audio;
      }

      audio.currentTime = 0;
      audio.volume = 0.9;
      this.currentAudio = audio;

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          // In case browser autoplay policy requires user gesture
          console.warn('Playback prevented:', err);
        });
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Coin / Click fallback sound
   */
  public playCoin() {
    this.playDonateSound();
  }

  /**
   * GTA "Mission Passed" celebration fanfare chord
   */
  public playMissionPassed() {
    if (!this.enabled) return;

    // First play the "Thank You" sound (Sound 0)
    this.playDonateSound(0);

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 261.63, time: 0.0, dur: 0.15 }, // C4
        { freq: 329.63, time: 0.12, dur: 0.15 }, // E4
        { freq: 392.00, time: 0.24, dur: 0.2 }, // G4
        { freq: 523.25, time: 0.40, dur: 0.6 }, // C5 (Triumph)
        { freq: 659.25, time: 0.45, dur: 0.6 }, // E5
        { freq: 783.99, time: 0.50, dur: 0.9 }, // G5 (Epic sustain)
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now + time);
        filter.frequency.exponentialRampToValueAtTime(3000, now + time + dur * 0.5);

        gain.gain.setValueAtTime(0.12, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Cheat code entered sound - Plays authentic GTA cheat activation chime
   */
  public playCheatCode() {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      const audio = this.namedAudioCache.get('cheat');
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.95;
        this.currentAudio = audio;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => this.synthesizeCheatCode());
          return;
        }
      } else {
        this.synthesizeCheatCode();
      }
    } catch {
      this.synthesizeCheatCode();
    }
  }

  /**
   * Web Audio API synthesized fallback for cheat activation
   */
  private synthesizeCheatCode() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const tones = [523.25, 659.25, 783.99, 1046.5];
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.14);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play original Vice City Mission Passed fanfare
   */
  public playViceCityMission() {
    this.playSound('missionPassed', 0.95);
  }

  /**
   * Play original Vice City Wasted / Death sound
   */
  public playViceCityDeath() {
    this.playSound('wasted', 0.95);
  }

  /**
   * Play GTA Police Radio dispatch sound
   */
  public playPoliceRadio() {
    this.playSound('police', 0.9);
  }

  /**
   * Play cash register cha-ching sound
   */
  public playCashRegister() {
    this.playSound('cash', 0.95);
  }

  /**
   * Play Tommy Vercetti dialogue
   */
  public playTommyVercetti() {
    this.playSound('tommy', 0.95);
  }

  /**
   * Play Big Smoke meme line
   */
  public playBigSmoke() {
    this.playSound('bigSmoke', 0.95);
  }

  /**
   * Subtle UI click sound
   */
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }
}

export const sounds = new SoundController();
