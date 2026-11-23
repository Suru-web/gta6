import { Character } from '@/types/game';

export const GTA_ROSTER: Character[] = [
  {
    id: 'tommy-vercetti',
    name: 'Tommy Vercetti',
    alias: 'The Harwood Butcher',
    game: 'GTA: Vice City',
    releaseYear: 2002,
    tagline: '1980s Miami Drug Kingpin',
    quote: "I poke my head out of the gutter for one second, and fate shovels shit in my face!",
    portrait: '🌴',
    themeColor: '#06b6d4', // Cyan / Vice City neon
    accentColor: '#ec4899', // Pink
    stats: {
      health: 105,
      strength: 115,
      speed: 100,
      defence: 105,
    },
    specialMove: {
      name: 'Vercetti Estate Rampage',
      command: 'SUPER / L KEY',
      description: 'Swings an authentic spiked baseball bat followed by a dual-uzi spray that launches opponents backwards.',
      damage: 42,
      meterCost: 100,
      themeColor: '#ec4899',
    },
    styleDescription: 'Raw 80s brawler with heavy right hooks, high damage output, and aggressive forward momentum.',
  },
  {
    id: 'carl-johnson',
    name: 'Carl Johnson',
    alias: 'CJ',
    game: 'GTA: San Andreas',
    releaseYear: 2004,
    tagline: 'Grove Street Families OG',
    quote: "Ah shit, here we go again. Worst place in the world...",
    portrait: '👑',
    themeColor: '#10b981', // Grove Street Green
    accentColor: '#f59e0b', // Gold
    stats: {
      health: 110,
      strength: 105,
      speed: 110,
      defence: 100,
    },
    specialMove: {
      name: 'Grove Street Drive-By Blitz',
      command: 'SUPER / L KEY',
      description: 'Summons Green Sabre drive-by crossfire while CJ executes an aerial bicycle kick.',
      damage: 40,
      meterCost: 100,
      themeColor: '#10b981',
    },
    styleDescription: 'Agile martial arts gym master with fast kicks, high mobility, and devastating counter-attacks.',
  },
  {
    id: 'claude',
    name: 'Claude',
    alias: 'The Silent Assassin',
    game: 'GTA III',
    releaseYear: 2001,
    tagline: 'Mute Liberty City Enforcer',
    quote: "...",
    portrait: '🕶️',
    themeColor: '#475569', // Liberty Slate
    accentColor: '#22c55e', // Green cargo pants
    stats: {
      health: 100,
      strength: 110,
      speed: 105,
      defence: 110,
    },
    specialMove: {
      name: 'Silent Executioner',
      command: 'SUPER / L KEY',
      description: 'Throws a flash stun followed by a devastating silent military baton takedown.',
      damage: 38,
      meterCost: 100,
      themeColor: '#22c55e',
    },
    styleDescription: 'Cold, relentless, and unflinching. High defensive poise with unpredictable close-quarters grapples.',
  },
  {
    id: 'niko-bellic',
    name: 'Niko Bellic',
    alias: 'The Balkan Veteran',
    game: 'GTA IV',
    releaseYear: 2008,
    tagline: 'Ex-Military Combat Veteran',
    quote: "War is where the young and stupid are tricked by the old and bitter into killing each other.",
    portrait: '🦅',
    themeColor: '#3b82f6', // Liberty Blue
    accentColor: '#f97316', // Orange jacket trim
    stats: {
      health: 115,
      strength: 120,
      speed: 90,
      defence: 115,
    },
    specialMove: {
      name: 'Krav Maga Disarm & Pummel',
      command: 'SUPER / L KEY',
      description: 'Military martial arts counter that disarms the opponent and delivers a skull-crushing Russian sweep.',
      damage: 45,
      meterCost: 100,
      themeColor: '#3b82f6',
    },
    styleDescription: 'Brutal military CQC (Close Quarters Combat). Immense grappling power and bone-shattering strikes.',
  },
  {
    id: 'trevor-philips',
    name: 'Trevor Philips',
    alias: 'Sandy Shores Menace',
    game: 'GTA V',
    releaseYear: 2013,
    tagline: 'Unhinged Psychopath',
    quote: "I'm self-employed! I'm an entrepreneur! I operate outside the boundaries of society!",
    portrait: '💀',
    themeColor: '#ef4444', // Berserk Red
    accentColor: '#fbbf24', // Sandy yellow
    stats: {
      health: 125,
      strength: 130,
      speed: 95,
      defence: 85,
    },
    specialMove: {
      name: 'Red Mist Berserker',
      command: 'SUPER / L KEY',
      description: 'Enters psychotic invulnerability, headbutting the opponent through concrete followed by a shotgun blast.',
      damage: 50,
      meterCost: 100,
      themeColor: '#ef4444',
    },
    styleDescription: 'Wild, unpredictable brawling with unmatched raw attack damage and terrifying hyper-armor rushes.',
  },
  {
    id: 'michael-de-santa',
    name: 'Michael De Santa',
    alias: 'The Retired Mastermind',
    game: 'GTA V',
    releaseYear: 2013,
    tagline: 'Vinewood Ex-Bank Robber',
    quote: "You forget a thousand things every day, pal. Make sure this is one of 'em.",
    portrait: '💼',
    themeColor: '#6366f1', // Indigo / Sleek
    accentColor: '#38bdf8', // Blue
    stats: {
      health: 100,
      strength: 100,
      speed: 105,
      defence: 110,
    },
    specialMove: {
      name: 'Bullet-Time Dead Eye',
      command: 'SUPER / L KEY',
      description: 'Slows down time to slip past an incoming strike and unleash a point-blank surgical 4-hit combo.',
      damage: 40,
      meterCost: 100,
      themeColor: '#6366f1',
    },
    styleDescription: 'Calculated, disciplined tactical combat. Exceptional defensive spacing and precise counter-strikes.',
  },
  {
    id: 'franklin-clinton',
    name: 'Franklin Clinton',
    alias: 'The Forum Drive Hustler',
    game: 'GTA V',
    releaseYear: 2013,
    tagline: 'South Central Getaway Driver',
    quote: "I don't mind dying, homie. I just want to die for something that matters.",
    portrait: '🎯',
    themeColor: '#14b8a6', // Teal
    accentColor: '#a855f7', // Purple
    stats: {
      health: 105,
      strength: 105,
      speed: 120,
      defence: 100,
    },
    specialMove: {
      name: 'Apex Reflex Ambush',
      command: 'SUPER / L KEY',
      description: 'Super-reflex dash past the opponent, calling Chop for a distraction bite followed by an overhead slam.',
      damage: 41,
      meterCost: 100,
      themeColor: '#14b8a6',
    },
    styleDescription: 'Blistering speed and quick directional mixups. Can out-maneuver heavy hitters with rapid dash attacks.',
  },
  {
    id: 'lucia-caminos',
    name: 'Lucia Caminos',
    alias: 'Vice City Outlaw',
    game: 'GTA VI',
    releaseYear: 2026,
    tagline: 'Leonida Modern Heist Specialist',
    quote: "The only way we're gonna get through this is by sticking together, being a team.",
    portrait: '🌺',
    themeColor: '#f43f5e', // Rose Neon
    accentColor: '#f59e0b', // Gold
    stats: {
      health: 105,
      strength: 110,
      speed: 120,
      defence: 105,
    },
    specialMove: {
      name: 'Leonida Heist Duo Protocol',
      command: 'SUPER / L KEY',
      description: 'A dynamic tactical combat combo with dual suppressed sidearms and an acrobatic leg takedown.',
      damage: 44,
      meterCost: 100,
      themeColor: '#f43f5e',
    },
    styleDescription: 'Next-generation tactical agility. Fluid kick transitions, quick recovery frames, and rapid strikes.',
  },
  {
    id: 'jason-duval',
    name: 'Jason Duval',
    alias: 'The Leonida Survivor',
    game: 'GTA VI',
    releaseYear: 2026,
    tagline: 'Vice City Underground Operative',
    quote: "Trust. That's all we got left down here.",
    portrait: '🔥',
    themeColor: '#f97316', // Orange Sunset
    accentColor: '#06b6d4', // Cyan
    stats: {
      health: 110,
      strength: 115,
      speed: 110,
      defence: 105,
    },
    specialMove: {
      name: 'Gator Country Haymaker',
      command: 'SUPER / L KEY',
      description: 'Throws a flash canister and delivers a devastating swamp-brawler knockout hook.',
      damage: 43,
      meterCost: 100,
      themeColor: '#f97316',
    },
    styleDescription: 'Hard-hitting modern combatant with high resilience, strong forward pressure, and heavy punishes.',
  },
];

export function getCharacterById(id: string): Character | undefined {
  return GTA_ROSTER.find((c) => c.id === id);
}

export const DEFAULT_PLAYER_CHARACTER = GTA_ROSTER[0]; // Tommy Vercetti
export const DEFAULT_CPU_CHARACTER = GTA_ROSTER[1];    // CJ
