import { afterAll, describe, expect, it } from 'bun:test';

const originalWindow = globalThis.window;
const originalAudio = globalThis.Audio;

class FakeAudio {
  static instances: FakeAudio[] = [];
  preload = '';
  currentTime = 0;
  volume = 1;
  paused = true;
  playCount = 0;

  constructor(public src: string) { FakeAudio.instances.push(this); }
  play() { this.paused = false; this.playCount++; return Promise.resolve(); }
  pause() { this.paused = true; }
}

globalThis.window = {} as Window & typeof globalThis;
globalThis.Audio = FakeAudio as unknown as typeof Audio;
const { sounds } = await import('../src/lib/sounds');

afterAll(() => {
  sounds.stopAll();
  globalThis.window = originalWindow;
  globalThis.Audio = originalAudio;
});

describe('fighter selection audio', () => {
  it('restarts the selected cue and stops it when another fighter is selected', () => {
    sounds.playCharacterSelection('carl-johnson');
    const cj = FakeAudio.instances.find((audio) => audio.src.endsWith('/carl-johnson.mp3'))!;
    expect(cj.paused).toBe(false);
    sounds.playCharacterSelection('carl-johnson');
    expect(cj.playCount).toBe(2);

    sounds.playCharacterSelection('trevor-philips');
    const trevor = FakeAudio.instances.find((audio) => audio.src.endsWith('/trevor-philips.mp3'))!;
    expect(cj.paused).toBe(true);
    expect(trevor.paused).toBe(false);

    sounds.stopCharacterSelection();
    expect(trevor.paused).toBe(true);
  });

  it('respects mute and does not interrupt a later fight sound during cleanup', () => {
    sounds.enabled = false;
    sounds.playCharacterSelection('carl-johnson');
    const cj = FakeAudio.instances.find((audio) => audio.src.endsWith('/carl-johnson.mp3'))!;
    expect(cj.paused).toBe(true);
    sounds.enabled = true;
    sounds.playCharacterSelection('carl-johnson');
    sounds.playSound('cheat');
    const cheat = FakeAudio.instances.find((audio) => audio.src.endsWith('/gta-cheat.mp3'))!;
    sounds.stopCharacterSelection();
    expect(cj.paused).toBe(true);
    expect(cheat.paused).toBe(false);
  });
});
