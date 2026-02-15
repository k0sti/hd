/** Human Design gate order around the Rave Mandala.
 * Gate 41 line 1 starts at 2°00' Aquarius (302° tropical).
 * Each gate spans 5.625° (360/64), each line spans 0.9375° (5.625/6).
 */

export const HD_START_DEGREE = 302.0;
export const GATE_SIZE = 360.0 / 64.0; // 5.625°
export const LINE_SIZE = GATE_SIZE / 6.0; // 0.9375°

/** Gate order around the mandala starting from Gate 41 at 302° tropical */
export const GATE_ORDER: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

/** Convert ecliptic longitude to HD gate and line */
export function longitudeToGateLine(longitude: number): [number, number] {
  const offset = ((longitude - HD_START_DEGREE) % 360 + 360) % 360;
  const gateIndex = Math.floor(offset / GATE_SIZE) % 64;
  const line = Math.min(Math.floor((offset % GATE_SIZE) / LINE_SIZE) + 1, 6);
  return [GATE_ORDER[gateIndex], line];
}

/** Centers in the bodygraph */
export type Center =
  | 'Head'
  | 'Ajna'
  | 'Throat'
  | 'G'
  | 'HeartEgo'
  | 'SolarPlexus'
  | 'Sacral'
  | 'Spleen'
  | 'Root';

export const ALL_CENTERS: Center[] = [
  'Head', 'Ajna', 'Throat', 'G', 'HeartEgo', 'SolarPlexus', 'Sacral', 'Spleen', 'Root',
];

/** Which center a gate belongs to */
export function gateCenter(gate: number): Center {
  switch (gate) {
    case 64: case 61: case 63: return 'Head';
    case 47: case 24: case 4: case 17: case 43: case 11: return 'Ajna';
    case 62: case 23: case 56: case 35: case 12: case 45: case 33: case 8: case 31: case 7: case 1: case 13: case 20: case 16: return 'Throat';
    case 10: case 25: case 46: case 2: case 15: return 'G';
    case 21: case 51: case 26: case 40: return 'HeartEgo';
    case 36: case 22: case 6: case 37: case 49: case 55: case 30: return 'SolarPlexus';
    case 5: case 14: case 29: case 59: case 9: case 3: case 42: case 27: case 34: return 'Sacral';
    case 48: case 57: case 44: case 50: case 32: case 28: case 18: return 'Spleen';
    case 58: case 38: case 54: case 53: case 60: case 52: case 19: case 39: case 41: return 'Root';
    default: return 'G';
  }
}

export const MOTOR_CENTERS: Center[] = ['Sacral', 'SolarPlexus', 'HeartEgo', 'Root'];

export interface Channel {
  gate1: number;
  gate2: number;
  name: string;
  center1: Center;
  center2: Center;
}

export const ALL_CHANNELS: Channel[] = [
  { gate1: 1, gate2: 8, name: 'Inspiration', center1: 'G', center2: 'Throat' },
  { gate1: 2, gate2: 14, name: 'The Beat', center1: 'G', center2: 'Sacral' },
  { gate1: 3, gate2: 60, name: 'Mutation', center1: 'Sacral', center2: 'Root' },
  { gate1: 4, gate2: 63, name: 'Logic', center1: 'Ajna', center2: 'Head' },
  { gate1: 5, gate2: 15, name: 'Rhythms', center1: 'Sacral', center2: 'G' },
  { gate1: 6, gate2: 59, name: 'Intimacy', center1: 'SolarPlexus', center2: 'Sacral' },
  { gate1: 7, gate2: 31, name: 'The Alpha', center1: 'G', center2: 'Throat' },
  { gate1: 9, gate2: 52, name: 'Concentration', center1: 'Sacral', center2: 'Root' },
  { gate1: 10, gate2: 20, name: 'Awakening', center1: 'G', center2: 'Throat' },
  { gate1: 10, gate2: 34, name: 'Exploration', center1: 'G', center2: 'Sacral' },
  { gate1: 10, gate2: 57, name: 'Perfected Form', center1: 'G', center2: 'Spleen' },
  { gate1: 11, gate2: 56, name: 'Curiosity', center1: 'Ajna', center2: 'Throat' },
  { gate1: 12, gate2: 22, name: 'Openness', center1: 'Throat', center2: 'SolarPlexus' },
  { gate1: 13, gate2: 33, name: 'The Prodigal', center1: 'G', center2: 'Throat' },
  { gate1: 16, gate2: 48, name: 'The Wavelength', center1: 'Throat', center2: 'Spleen' },
  { gate1: 17, gate2: 62, name: 'Acceptance', center1: 'Ajna', center2: 'Throat' },
  { gate1: 18, gate2: 58, name: 'Judgement', center1: 'Spleen', center2: 'Root' },
  { gate1: 19, gate2: 49, name: 'Synthesis', center1: 'Root', center2: 'SolarPlexus' },
  { gate1: 20, gate2: 34, name: 'Charisma', center1: 'Throat', center2: 'Sacral' },
  { gate1: 20, gate2: 57, name: 'The Brainwave', center1: 'Throat', center2: 'Spleen' },
  { gate1: 21, gate2: 45, name: 'Money Line', center1: 'HeartEgo', center2: 'Throat' },
  { gate1: 23, gate2: 43, name: 'Structuring', center1: 'Throat', center2: 'Ajna' },
  { gate1: 24, gate2: 61, name: 'Awareness', center1: 'Ajna', center2: 'Head' },
  { gate1: 25, gate2: 51, name: 'Initiation', center1: 'G', center2: 'HeartEgo' },
  { gate1: 26, gate2: 44, name: 'Surrender', center1: 'HeartEgo', center2: 'Spleen' },
  { gate1: 27, gate2: 50, name: 'Preservation', center1: 'Sacral', center2: 'Spleen' },
  { gate1: 28, gate2: 38, name: 'Struggle', center1: 'Spleen', center2: 'Root' },
  { gate1: 29, gate2: 46, name: 'Discovery', center1: 'Sacral', center2: 'G' },
  { gate1: 30, gate2: 41, name: 'Recognition', center1: 'SolarPlexus', center2: 'Root' },
  { gate1: 32, gate2: 54, name: 'Transformation', center1: 'Spleen', center2: 'Root' },
  { gate1: 34, gate2: 57, name: 'Power', center1: 'Sacral', center2: 'Spleen' },
  { gate1: 35, gate2: 36, name: 'Transitoriness', center1: 'Throat', center2: 'SolarPlexus' },
  { gate1: 37, gate2: 40, name: 'Community', center1: 'SolarPlexus', center2: 'HeartEgo' },
  { gate1: 39, gate2: 55, name: 'Emoting', center1: 'Root', center2: 'SolarPlexus' },
  { gate1: 42, gate2: 53, name: 'Maturation', center1: 'Sacral', center2: 'Root' },
  { gate1: 47, gate2: 64, name: 'Abstraction', center1: 'Ajna', center2: 'Head' },
];
