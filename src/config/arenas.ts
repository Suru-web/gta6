import { Arena } from '@/types/game';

export const ARENAS: Arena[] = [
  {
    id: 'vice-city',
    name: 'Vice City — Ocean Beach',
    city: 'Vice City',
    tagline: '1986 Neon Sunset & Palm Trees',
    bgGradient: 'linear-gradient(180deg, #1e082b 0%, #4a0d4a 40%, #c43270 70%, #ff8c42 100%)',
    groundColor: '#1a1024',
    neonColor: '#06b6d4',
    timeOfDay: 'Sunset 8:45 PM',
    landmarks: ['Ocean View Hotel', 'The Malibu Club', 'Starfish Island Bridge'],
  },
  {
    id: 'los-santos',
    name: 'Los Santos — Grove Street',
    city: 'Los Santos',
    tagline: 'Cul-de-sac Turf & Amber Smog',
    bgGradient: 'linear-gradient(180deg, #09131a 0%, #112824 45%, #244632 75%, #42522a 100%)',
    groundColor: '#171e1b',
    neonColor: '#10b981',
    timeOfDay: 'Midnight 12:00 AM',
    landmarks: ['Grove Street Cul-de-sac', 'Maze Bank Tower', 'Vinewood Sign'],
  },
  {
    id: 'liberty-city',
    name: 'Liberty City — Star Junction',
    city: 'Liberty City',
    tagline: 'Rain-Slicked Asphalt & High Rises',
    bgGradient: 'linear-gradient(180deg, #050b14 0%, #0d1b2a 40%, #1b263b 75%, #2b3a4a 100%)',
    groundColor: '#14171d',
    neonColor: '#3b82f6',
    timeOfDay: 'Rainy Dusk 6:15 PM',
    landmarks: ['Star Junction Billboards', 'Broker Bridge', 'Happiness Island'],
  },
  {
    id: 'san-andreas',
    name: 'San Andreas — Mount Chiliad',
    city: 'San Andreas',
    tagline: 'Desert Bluff & Electric Storm Horizon',
    bgGradient: 'linear-gradient(180deg, #1b0a1f 0%, #3d1428 35%, #7a2b2e 70%, #b86235 100%)',
    groundColor: '#211718',
    neonColor: '#f59e0b',
    timeOfDay: 'Twilight 7:30 PM',
    landmarks: ['Mount Chiliad Summit', 'Area 69 Perimeter', 'Verdant Meadows'],
  },
  {
    id: 'leonida',
    name: 'Leonida — Vice Beach Boardwalk',
    city: 'Leonida',
    tagline: 'Modern 2026 Nightclub Strip & Ocean Tide',
    bgGradient: 'linear-gradient(180deg, #0d061f 0%, #290d40 40%, #701a75 75%, #be185d 100%)',
    groundColor: '#181026',
    neonColor: '#f43f5e',
    timeOfDay: 'Late Night 2:15 AM',
    landmarks: ['Ocean Drive Strip', 'Kelly County Wetlands', 'Port Gellhorn Bridge'],
  },
];

export function getArenaById(id: string): Arena {
  return ARENAS.find((a) => a.id === id) || ARENAS[0];
}

export const DEFAULT_ARENA = ARENAS[0];
