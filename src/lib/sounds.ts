/**
 * Synthesizes retro arcade & GTA-style sound effects using the Web Audio API.
 * 100% self-contained, zero external audio assets required, zero 404 errors.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

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
   * Classic Ka-Ching / Coin collection sound
   */
  public playCoin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(493.88, now);
      osc2.frequency.setValueAtTime(659.25, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * GTA "Mission Passed" celebration fanfare chord
   */
  public playMissionPassed() {
    if (!this.enabled) return;
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

        // Lowpass filter for smooth 80s synth brass feel
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
      // Ignore audio restriction
    }
  }

  /**
   * Cheat code entered sound (GTA San Andreas confirmation chime)
   */
  public playCheatCode() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 quick run
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
