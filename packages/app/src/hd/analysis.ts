/** Chart analysis: type, authority, profile, channels, centers */

import { Center, ALL_CENTERS, ALL_CHANNELS, MOTOR_CENTERS, type Channel } from './gates';
import type { Chart, Activation } from './ephemeris';

export type HdType = 'Generator' | 'Manifesting Generator' | 'Manifestor' | 'Projector' | 'Reflector';

export interface DefinedChannel {
  gate1: number;
  gate2: number;
  name: string;
  center1: Center;
  center2: Center;
}

export interface ChartAnalysis {
  type: HdType;
  authority: string;
  profile: [number, number];
  profileName: string;
  incarnationCross: [number, number, number, number]; // p_sun, p_earth, d_sun, d_earth
  definedChannels: DefinedChannel[];
  definedCenters: Set<Center>;
  openCenters: Center[];
  personalityGates: Set<number>;
  designGates: Set<number>;
  allGates: Set<number>;
}

const PROFILE_NAMES: Record<string, string> = {
  '1/3': 'Investigator / Martyr',
  '1/4': 'Investigator / Opportunist',
  '2/4': 'Hermit / Opportunist',
  '2/5': 'Hermit / Heretic',
  '3/5': 'Martyr / Heretic',
  '3/6': 'Martyr / Role Model',
  '4/6': 'Opportunist / Role Model',
  '4/1': 'Opportunist / Investigator',
  '5/1': 'Heretic / Investigator',
  '5/2': 'Heretic / Hermit',
  '6/2': 'Role Model / Hermit',
  '6/3': 'Role Model / Martyr',
};

function findPlanet(activations: Activation[], planet: string): Activation {
  const a = activations.find((a) => a.planet === planet);
  if (!a) throw new Error(`Planet ${planet} not found`);
  return a;
}

/** BFS to check if a motor center connects to Throat through defined channels */
function isConnectedToThroat(adj: Map<Center, Set<Center>>, definedCenters: Set<Center>): boolean {
  for (const motor of MOTOR_CENTERS) {
    if (!definedCenters.has(motor)) continue;
    // BFS from motor to Throat
    const visited = new Set<Center>();
    const queue: Center[] = [motor];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node === 'Throat') return true;
      if (visited.has(node)) continue;
      visited.add(node);
      const neighbors = adj.get(node);
      if (neighbors) {
        for (const n of neighbors) {
          if (!visited.has(n)) queue.push(n);
        }
      }
    }
  }
  return false;
}

function determineAuthority(definedCenters: Set<Center>): string {
  if (definedCenters.has('SolarPlexus')) return 'Emotional (Solar Plexus)';
  if (definedCenters.has('Sacral')) return 'Sacral';
  if (definedCenters.has('Spleen')) return 'Splenic';
  if (definedCenters.has('HeartEgo')) return 'Ego / Heart';
  if (definedCenters.has('G')) return 'Self-Projected';
  if (definedCenters.has('Ajna') || definedCenters.has('Head')) return 'Mental / Environmental';
  return 'Lunar (None)';
}

export function analyze(chart: Chart): ChartAnalysis {
  const personalityGates = new Set<number>(chart.personality.map((a) => a.gate));
  const designGates = new Set<number>(chart.design.map((a) => a.gate));
  const allGates = new Set<number>([...personalityGates, ...designGates]);

  // Find defined channels
  const definedChannels: DefinedChannel[] = [];
  const definedCenters = new Set<Center>();

  for (const ch of ALL_CHANNELS) {
    if (allGates.has(ch.gate1) && allGates.has(ch.gate2)) {
      definedChannels.push({
        gate1: ch.gate1,
        gate2: ch.gate2,
        name: ch.name,
        center1: ch.center1,
        center2: ch.center2,
      });
      definedCenters.add(ch.center1);
      definedCenters.add(ch.center2);
    }
  }

  // Build adjacency graph
  const adj = new Map<Center, Set<Center>>();
  for (const ch of definedChannels) {
    if (!adj.has(ch.center1)) adj.set(ch.center1, new Set());
    if (!adj.has(ch.center2)) adj.set(ch.center2, new Set());
    adj.get(ch.center1)!.add(ch.center2);
    adj.get(ch.center2)!.add(ch.center1);
  }

  const hasSacral = definedCenters.has('Sacral');
  const motorToThroat = isConnectedToThroat(adj, definedCenters);

  // Determine type
  let hdType: HdType;
  if (hasSacral) {
    hdType = motorToThroat ? 'Manifesting Generator' : 'Generator';
  } else if (motorToThroat) {
    hdType = 'Manifestor';
  } else if (definedCenters.size > 0) {
    hdType = 'Projector';
  } else {
    hdType = 'Reflector';
  }

  const authority = determineAuthority(definedCenters);

  // Profile
  const pSun = findPlanet(chart.personality, 'Sun');
  const dSun = findPlanet(chart.design, 'Sun');
  const profile: [number, number] = [pSun.line, dSun.line];
  const profileKey = `${profile[0]}/${profile[1]}`;
  const profileName = PROFILE_NAMES[profileKey] || 'Unknown';

  // Incarnation Cross
  const pEarth = findPlanet(chart.personality, 'Earth');
  const dEarth = findPlanet(chart.design, 'Earth');
  const incarnationCross: [number, number, number, number] = [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate];

  const openCenters = ALL_CENTERS.filter((c) => !definedCenters.has(c));

  return {
    type: hdType,
    authority,
    profile,
    profileName,
    incarnationCross,
    definedChannels,
    definedCenters,
    openCenters,
    personalityGates,
    designGates,
    allGates,
  };
}
