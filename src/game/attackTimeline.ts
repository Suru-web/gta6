import { MoveDefinition } from './moves';

// Clip times were sampled from the shipped FBX animations. Contact is at the
// first active frame; recovery finishes after the limb has returned to guard.
const CLIP_TIMES = {
  punch: [0.35, 1.1, 1.2, 1.8],
  kick: [0.35, 1.0, 1.12, 2.0],
  grab: [0.35, 0.8, 0.95, 1.7],
  super: [2.45, 2.9, 3.0, 3.5],
} as const;
const SECOND_SUPER = [3.0, 3.4, 3.5, 4.35] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

export function attackClipTime(move: MoveDefinition, frame: number, superVariant: 0 | 1 = 0): number {
  const [start, impact, activeEnd, end] = move.type === 'super' && superVariant === 1 ? SECOND_SUPER : CLIP_TIMES[move.type];
  const firstActive = move.startupFrames + 1;
  const lastActive = move.startupFrames + move.activeFrames;
  if (frame <= firstActive) return lerp(start, impact, (frame - 1) / Math.max(1, firstActive - 1));
  if (frame <= lastActive) return lerp(impact, activeEnd, (frame - firstActive) / Math.max(1, lastActive - firstActive));
  return lerp(activeEnd, end, (frame - lastActive) / Math.max(1, move.recoveryFrames));
}

// Shared extension curve for procedural poses and time-varying strike reach.
export function attackExtension(move: MoveDefinition, frame: number): number {
  const contact = move.startupFrames + 1;
  const activeEnd = move.startupFrames + move.activeFrames;
  if (frame <= contact) return Math.max(0, Math.min(1, (frame - 1) / Math.max(1, contact - 1)));
  if (frame <= activeEnd) return 1;
  return Math.max(0, 1 - (frame - activeEnd) / Math.max(1, move.recoveryFrames));
}
