import { Character } from '@/types/game';

export type AttackKind = 'punch' | 'kick' | 'grab' | 'super';

export interface MoveDefinition {
  type: AttackKind;
  name: string;
  startupFrames: number;   // Windup frames before hitbox activates
  activeFrames: number;    // Window where hitbox is active and can connect
  recoveryFrames: number;  // Vulnerable window after active frames where attacker cannot act
  totalFrames: number;     // Sum of startup + active + recovery
  baseDamage: number;      // Unscaled base damage
  range: number;           // Hitbox width extending in front of fighter
  height: number;          // Hitbox height
  yOffsetRatio: number;    // Vertical offset ratio from fighter ground (0 = ground, 1 = head)
  knockback: number;       // Pushback velocity applied on hit
  hitstunFrames: number;   // Hitstun frames imposed on defender on clean hit
  blockstunFrames: number; // Blockstun frames imposed on defender on block
  hitstopFrames: number;   // Hitstop / freeze frames applied to both fighters on impact
  chipRatio: number;       // Chip damage fraction if blocked (e.g. 0.15 = 15%)
  isUnblockable: boolean;  // Whether the move ignores guard (Grabs)
  causesKnockdown: boolean;// Whether hit knocks the defender down onto the ground
  cancelWindow: { start: number; end: number } | null; // Frame window where hit can cancel into next attack
  meterGain: number;       // Super meter generated on landed hit
  meterCost: number;       // Super meter required to execute
}

export const BASE_MOVES: Record<AttackKind, MoveDefinition> = {
  punch: {
    type: 'punch',
    name: 'Quick Strike',
    startupFrames: 14,     // Fist coils and thrusts forward toward face (frames 1..14)
    activeFrames: 4,       // Fist makes contact with opponent's face (frames 15..18)
    recoveryFrames: 14,    // Retracts arm back to defensive guard (frames 19..32)
    totalFrames: 32,
    baseDamage: 14,
    range: 56,
    height: 28,
    yOffsetRatio: 0.72,
    knockback: 4.5,
    hitstunFrames: 18,     // +4 frame advantage on clean hit
    blockstunFrames: 9,    // -5 frame disadvantage on block
    hitstopFrames: 5,
    chipRatio: 0.15,
    isUnblockable: false,
    causesKnockdown: false,
    cancelWindow: { start: 16, end: 22 }, // Can chain into kick if hit connects
    meterGain: 18,
    meterCost: 0,
  },
  kick: {
    type: 'kick',
    name: 'Heavy Kick',
    startupFrames: 16,     // Leg chambers and sweeps roundhouse toward target (frames 1..16)
    activeFrames: 4,       // Foot connects with opponent (frames 17..20)
    recoveryFrames: 20,    // Foot retracts and plants back down (frames 21..40)
    totalFrames: 40,
    baseDamage: 22,
    range: 72,
    height: 34,
    yOffsetRatio: 0.48,
    knockback: 9.0,
    hitstunFrames: 25,     // +5 frame advantage on clean hit
    blockstunFrames: 11,   // -9 on block (punishable if blocked close)
    hitstopFrames: 6,
    chipRatio: 0.20,
    isUnblockable: false,
    causesKnockdown: false,
    cancelWindow: null,
    meterGain: 22,
    meterCost: 0,
  },
  grab: {
    type: 'grab',
    name: 'Command Smash / Grab',
    startupFrames: 9,
    activeFrames: 3,       // Active frames 10..12
    recoveryFrames: 24,    // Recovery frames 13..36 (heavily punishable if whiffed!)
    totalFrames: 36,
    baseDamage: 24,
    range: 42,
    height: 52,
    yOffsetRatio: 0.70,
    knockback: 13.5,
    hitstunFrames: 45,     // Full knockdown
    blockstunFrames: 0,    // Unblockable!
    hitstopFrames: 7,
    chipRatio: 0.0,
    isUnblockable: true,   // Pierces blocking defenders!
    causesKnockdown: true,
    cancelWindow: null,
    meterGain: 25,
    meterCost: 0,
  },
  super: {
    type: 'super',
    name: 'Super Surge',
    startupFrames: 16,
    activeFrames: 8,       // Active frames 17..24
    recoveryFrames: 32,    // Recovery frames 25..56 (massive recovery if blocked/whiffed)
    totalFrames: 56,
    baseDamage: 45,
    range: 72,
    height: 85,
    yOffsetRatio: 0.82,
    knockback: 22.0,
    hitstunFrames: 50,
    blockstunFrames: 14,   // -18 on block (heavily punishable on block!)
    hitstopFrames: 12,
    chipRatio: 0.30,
    isUnblockable: false,
    causesKnockdown: true,
    cancelWindow: null,
    meterGain: 0,
    meterCost: 100,
  },
};

/**
 * Calculates character-customized move properties taking into account
 * character strength, speed, defence, and special move specs.
 */
export function getCharacterMove(character: Character, type: AttackKind): MoveDefinition {
  const base = BASE_MOVES[type];
  const strengthMod = character.stats.strength / 100;
  const speedMod = character.stats.speed / 100;

  // Faster characters have slightly quicker startup (down by 1 frame if speed >= 115)
  const startupAdjustment = speedMod >= 1.15 ? -1 : speedMod <= 0.85 ? 1 : 0;
  const adjustedStartup = Math.max(4, base.startupFrames + startupAdjustment);

  // Recovery is also slightly tighter for high-speed characters
  const recoveryAdjustment = speedMod >= 1.15 ? -1 : speedMod <= 0.85 ? 2 : 0;
  const adjustedRecovery = Math.max(6, base.recoveryFrames + recoveryAdjustment);

  let damage = Math.round(base.baseDamage * strengthMod);
  if (type === 'super') {
    damage = Math.round(character.specialMove.damage * strengthMod);
  }

  // Reach bonus based on strength/size
  const reachBonus = (character.stats.strength - 100) * 0.12;
  const adjustedRange = Math.max(35, Math.round(base.range + reachBonus));

  return {
    ...base,
    startupFrames: adjustedStartup,
    recoveryFrames: adjustedRecovery,
    totalFrames: adjustedStartup + base.activeFrames + adjustedRecovery,
    baseDamage: damage,
    range: adjustedRange,
  };
}

/**
 * Combo damage scaling formula
 * Prevents degenerate infinite combos while maintaining rewarding 2-3 hit links.
 */
export function calculateComboDamage(baseDamage: number, comboHitIndex: number): number {
  let scale = 1.0;
  if (comboHitIndex === 1) scale = 0.82;
  else if (comboHitIndex === 2) scale = 0.65;
  else if (comboHitIndex === 3) scale = 0.50;
  else if (comboHitIndex >= 4) scale = 0.35;

  return Math.max(2, Math.round(baseDamage * scale));
}
