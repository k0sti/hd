/** Swiss Ephemeris WASM integration for planetary calculations.
 * Loads swisseph-wasm from public/ to avoid Vite bundling issues with WASM paths. */

import { longitudeToGateLine } from './gates';

export interface Activation {
  planet: string;
  longitude: number;
  gate: number;
  line: number;
}

export interface Chart {
  personality: Activation[];
  design: Activation[];
}

interface PlanetDef {
  body: number;
  name: string;
  opposite: boolean;
}

function normalize(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

// The SwissEph instance (loaded dynamically from public/)
let swe: any = null;

export async function initEphemeris(): Promise<void> {
  if (swe) return;
  // Load from public dir via dynamic import that bypasses Vite's import analysis.
  // Using Function constructor to completely avoid static analysis.
  const dynamicImport = new Function('url', 'return import(url)');
  const mod = await dynamicImport('/swisseph-wrapper.js');
  const SwissEph = mod.default;
  swe = new SwissEph();
  await swe.initSwissEph();
}

function getSwe(): any {
  if (!swe) throw new Error('Ephemeris not initialized. Call initEphemeris() first.');
  return swe;
}

// Planet constants
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
const SE_TRUE_NODE = 11;
const SEFLG_SWIEPH = 2;

const HD_PLANETS: PlanetDef[] = [
  { body: SE_SUN, name: 'Sun', opposite: false },
  { body: SE_SUN, name: 'Earth', opposite: true },
  { body: SE_MOON, name: 'Moon', opposite: false },
  { body: SE_TRUE_NODE, name: 'North Node', opposite: false },
  { body: SE_TRUE_NODE, name: 'South Node', opposite: true },
  { body: SE_MERCURY, name: 'Mercury', opposite: false },
  { body: SE_VENUS, name: 'Venus', opposite: false },
  { body: SE_MARS, name: 'Mars', opposite: false },
  { body: SE_JUPITER, name: 'Jupiter', opposite: false },
  { body: SE_SATURN, name: 'Saturn', opposite: false },
  { body: SE_URANUS, name: 'Uranus', opposite: false },
  { body: SE_NEPTUNE, name: 'Neptune', opposite: false },
  { body: SE_PLUTO, name: 'Pluto', opposite: false },
];

function calcUt(jd: number, body: number): number {
  const s = getSwe();
  const result = s.calc_ut(jd, body, SEFLG_SWIEPH);
  return result[0]; // longitude is first element of Float64Array
}

/** Calculate all planetary positions for a given Julian Day */
function calculatePositions(jd: number): Activation[] {
  return HD_PLANETS.map((def) => {
    let lon = calcUt(jd, def.body);
    if (def.opposite) {
      lon = normalize(lon + 180);
    }
    const [gate, line] = longitudeToGateLine(lon);
    return { planet: def.name, longitude: lon, gate, line };
  });
}

/** Find the Design date (when Sun was 88° behind birth Sun) */
function findDesignJd(birthJd: number): number {
  const birthSun = calcUt(birthJd, SE_SUN);
  const target = normalize(birthSun - 88);

  let jd = birthJd - 88;
  for (let i = 0; i < 100; i++) {
    const sun = calcUt(jd, SE_SUN);
    let diff = target - sun;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.00001) break;
    jd += diff / 0.9856;
  }
  return jd;
}

/** Convert date/time/tz to Julian Day */
function dateToJd(year: number, month: number, day: number, hour: number, minute: number, tzOffset: number): number {
  const s = getSwe();
  const utcHour = hour + minute / 60 - tzOffset;

  // Adjust date if UTC hour goes out of range
  let y = year, m = month, d = day, h = utcHour;
  if (h < 0) {
    h += 24;
    d -= 1;
    if (d < 1) {
      m -= 1;
      if (m < 1) { m = 12; y -= 1; }
      d = daysInMonth(y, m);
    }
  } else if (h >= 24) {
    h -= 24;
    d += 1;
    const maxD = daysInMonth(y, m);
    if (d > maxD) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }
  }

  return s.julday(y, m, d, h);
}

function daysInMonth(year: number, month: number): number {
  if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
  if ([4, 6, 9, 11].includes(month)) return 30;
  if (month === 2) return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
  return 30;
}

/** Calculate a complete Human Design chart */
export function calculateChart(year: number, month: number, day: number, hour: number, minute: number, tzOffset: number): Chart {
  const birthJd = dateToJd(year, month, day, hour, minute, tzOffset);
  const designJd = findDesignJd(birthJd);

  return {
    personality: calculatePositions(birthJd),
    design: calculatePositions(designJd),
  };
}

/** Calculate current transit positions */
export function calculateTransit(date?: Date): Activation[] {
  const s = getSwe();
  const now = date || new Date();
  const jd = s.julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60,
  );
  return calculatePositions(jd);
}
