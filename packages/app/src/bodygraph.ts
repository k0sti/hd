/** SVG Bodygraph renderer — colors gates, centers, adds gradients */

import { ALL_CHANNELS, type Center } from './hd';
import type { AppState, PersonChart } from './hooks/useAppState';

// Background body image config — tune these to align throat/root with chart centers
const BG_ZOOM = 2.75;       // scale of BG relative to chart width (1.0 = same width, >1 = zoomed in)
const BG_OFFSET_Y = -0.4;  // vertical offset as fraction of chart height (negative = shift up)
const BG_OFFSET_X = -0.025; // horizontal offset as fraction of container width (positive = right)

// Colors
const COLOR_INACTIVE = '#e0ddd8';
const COLOR_PERSONALITY = '#333333';
const COLOR_DESIGN = '#A44344';
const COLOR_TRANSIT = '#44aa55';
const COLOR_B_PERSONALITY = '#3366CC';
const COLOR_B_DESIGN = '#8844AA';
const COLOR_COMPOSITE = '#DAA520';

const CENTER_COLORS: Record<Center, string> = {
  Head: '#F9F6C4',
  Ajna: '#48BB78',
  Throat: '#655144',
  G: '#F9F6C4',
  HeartEgo: '#F56565',
  SolarPlexus: '#655144',
  Sacral: '#F56565',
  Spleen: '#655144',
  Root: '#655144',
};

// SVG center id mapping (SVG uses "Ego" not "HeartEgo")
const CENTER_SVG_ID: Record<Center, string> = {
  Head: 'Head',
  Ajna: 'Ajna',
  Throat: 'Throat',
  G: 'G',
  HeartEgo: 'Ego',
  SolarPlexus: 'SolarPlexus',
  Sacral: 'Sacral',
  Spleen: 'Spleen',
  Root: 'Root',
};

let svgTemplate = '';
let gradientCounter = 0;

export async function loadSvgTemplate(): Promise<string> {
  if (svgTemplate) return svgTemplate;
  const resp = await fetch('/bodygraph-blank.svg');
  svgTemplate = await resp.text();
  return svgTemplate;
}

// Gate gradient directions based on channel path orientation
interface GradDir { x1: string; y1: string; x2: string; y2: string }
const DIR_LR: GradDir = { x1: '0%', y1: '0%', x2: '100%', y2: '0%' };     // vertical channels: split left/right
const DIR_TLBR: GradDir = { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };  // diagonal top-left → bottom-right
const DIR_TRBL: GradDir = { x1: '100%', y1: '0%', x2: '0%', y2: '100%' };  // diagonal top-right → bottom-left

const GATE_GRADIENT_DIR: Record<number, GradDir> = {};

// Vertical channels (Head↔Ajna, Ajna↔Throat, Throat↔G, G↔Sacral, Sacral↔Root)
for (const g of [64,61,63,47,24,4,17,43,11,62,23,56,7,1,13,31,8,33,15,2,46,5,14,29,42,3,9,53,60,52]) {
  GATE_GRADIENT_DIR[g] = DIR_LR;
}
// Diagonal top-left to bottom-right (Throat↔SP, SP↔Root right, Ego↔SP, Ego↔Throat, Sacral↔SP)
for (const g of [35,36,12,22,45,21,37,40,30,41,55,39,49,19,6,59,51,25]) {
  GATE_GRADIENT_DIR[g] = DIR_TLBR;
}
// Diagonal top-right to bottom-left (Throat↔Spleen, Spleen↔Root, Spleen↔Sacral)
for (const g of [16,48,20,57,34,10,44,26,18,58,28,38,32,54,50,27]) {
  GATE_GRADIENT_DIR[g] = DIR_TRBL;
}

/** Create an SVG linear gradient definition with direction based on gate */
function makeGradient(id: string, color1: string, color2: string, gate?: number): string {
  const dir = (gate !== undefined && GATE_GRADIENT_DIR[gate]) || DIR_LR;
  return `<linearGradient id="${id}" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}">
    <stop offset="50%" stop-color="${color1}"/>
    <stop offset="50%" stop-color="${color2}"/>
  </linearGradient>`;
}

interface GateColorInfo {
  fill: string;      // direct color or url(#gradientId)
  gradient?: string;  // gradient SVG definition if needed
}

/** Determine gate color based on activation sources */
function getGateColor(
  gate: number,
  personalityGates: Set<number>,
  designGates: Set<number>,
  pColor: string,
  dColor: string,
): GateColorInfo {
  const inP = personalityGates.has(gate);
  const inD = designGates.has(gate);

  if (inP && inD) {
    const gradId = `grad-${gate}-${++gradientCounter}`;
    return {
      fill: `url(#${gradId})`,
      gradient: makeGradient(gradId, pColor, dColor, gate),
    };
  }
  if (inP) return { fill: pColor };
  if (inD) return { fill: dColor };
  return { fill: COLOR_INACTIVE };
}

/** Render the bodygraph SVG with the given state */
export function renderBodygraph(container: HTMLElement, appState: AppState): void {
  gradientCounter = 0;
  const gradients: string[] = [];
  const gateColors = new Map<number, string>(); // gate -> fill value
  const definedCenters = new Set<Center>();

  const { viewMode, transitActivations, personCharts, selectedPersonA, selectedPersonB } = appState;

  const personA = selectedPersonA ? personCharts.get(selectedPersonA) : null;
  const personB = selectedPersonB ? personCharts.get(selectedPersonB) : null;

  if (viewMode === 'transit') {
    // Transit only: all transit gates in green
    const transitGates = new Set(transitActivations.map((a) => a.gate));
    for (let g = 1; g <= 64; g++) {
      gateColors.set(g, transitGates.has(g) ? COLOR_TRANSIT : COLOR_INACTIVE);
    }
    // Find transit-defined channels for center coloring
    for (const ch of ALL_CHANNELS) {
      if (transitGates.has(ch.gate1) && transitGates.has(ch.gate2)) {
        definedCenters.add(ch.center1);
        definedCenters.add(ch.center2);
      }
    }
  } else if (viewMode === 'single' && personA) {
    colorPersonGates(personA, COLOR_PERSONALITY, COLOR_DESIGN, gateColors, gradients);
    for (const c of personA.analysis.definedCenters) definedCenters.add(c);
  } else if (viewMode === 'person-transit' && personA) {
    // Person's gates first
    colorPersonGates(personA, COLOR_PERSONALITY, COLOR_DESIGN, gateColors, gradients);
    for (const c of personA.analysis.definedCenters) definedCenters.add(c);

    // Overlay transit gates (only those not already colored by person)
    const transitGates = new Set(transitActivations.map((a) => a.gate));
    for (const g of transitGates) {
      if (!personA.analysis.allGates.has(g)) {
        gateColors.set(g, COLOR_TRANSIT);
      }
    }
    // Check for transit-completed channels
    const allGates = new Set([...personA.analysis.allGates, ...transitGates]);
    for (const ch of ALL_CHANNELS) {
      if (allGates.has(ch.gate1) && allGates.has(ch.gate2)) {
        definedCenters.add(ch.center1);
        definedCenters.add(ch.center2);
      }
    }
  } else if (viewMode === 'person-person' && personA && personB) {
    // Person A: black/red, Person B: blue/purple
    const aGatesP = personA.analysis.personalityGates;
    const aGatesD = personA.analysis.designGates;
    const bGatesP = personB.analysis.personalityGates;
    const bGatesD = personB.analysis.designGates;

    // First, find composite channels (A's gate + B's gate)
    const compositeGates = new Set<number>();
    for (const ch of ALL_CHANNELS) {
      const aHas1 = aGatesP.has(ch.gate1) || aGatesD.has(ch.gate1);
      const aHas2 = aGatesP.has(ch.gate2) || aGatesD.has(ch.gate2);
      const bHas1 = bGatesP.has(ch.gate1) || bGatesD.has(ch.gate1);
      const bHas2 = bGatesP.has(ch.gate2) || bGatesD.has(ch.gate2);

      if ((aHas1 && bHas2 && !aHas2) || (aHas2 && bHas1 && !aHas1) ||
          (bHas1 && aHas2 && !bHas2) || (bHas2 && aHas1 && !bHas1)) {
        // Composite channel: one gate from A, other from B
        compositeGates.add(ch.gate1);
        compositeGates.add(ch.gate2);
      }
    }

    for (let g = 1; g <= 64; g++) {
      const inAP = aGatesP.has(g);
      const inAD = aGatesD.has(g);
      const inBP = bGatesP.has(g);
      const inBD = bGatesD.has(g);
      const inA = inAP || inAD;
      const inB = inBP || inBD;

      if (inA && inB) {
        // Both persons have this gate - use gradient A color + B color
        const aColor = (inAP && inAD) ? COLOR_PERSONALITY : inAP ? COLOR_PERSONALITY : COLOR_DESIGN;
        const bColor = (inBP && inBD) ? COLOR_B_PERSONALITY : inBP ? COLOR_B_PERSONALITY : COLOR_B_DESIGN;
        const gradId = `grad-${g}-${++gradientCounter}`;
        gradients.push(makeGradient(gradId, aColor, bColor, g));
        gateColors.set(g, `url(#${gradId})`);
      } else if (inA) {
        const info = getGateColor(g, aGatesP, aGatesD, COLOR_PERSONALITY, COLOR_DESIGN);
        if (info.gradient) gradients.push(info.gradient);
        gateColors.set(g, info.fill);
      } else if (inB) {
        const info = getGateColor(g, bGatesP, bGatesD, COLOR_B_PERSONALITY, COLOR_B_DESIGN);
        if (info.gradient) gradients.push(info.gradient);
        gateColors.set(g, info.fill);
      } else {
        gateColors.set(g, COLOR_INACTIVE);
      }
    }

    // Defined centers from both
    for (const c of personA.analysis.definedCenters) definedCenters.add(c);
    for (const c of personB.analysis.definedCenters) definedCenters.add(c);
    // Also add composite channel centers
    for (const ch of ALL_CHANNELS) {
      const allGates = new Set([...personA.analysis.allGates, ...personB.analysis.allGates]);
      if (allGates.has(ch.gate1) && allGates.has(ch.gate2)) {
        definedCenters.add(ch.center1);
        definedCenters.add(ch.center2);
      }
    }
  }

  // Set default inactive for any unset gates
  for (let g = 1; g <= 64; g++) {
    if (!gateColors.has(g)) gateColors.set(g, COLOR_INACTIVE);
  }

  // Parse SVG and apply colors
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgTemplate, 'image/svg+xml');
  const svg = doc.documentElement;

  // Add gradients to defs
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.prepend(defs);
  }
  if (gradients.length > 0) {
    const gradFragment = parser.parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg"><defs>${gradients.join('')}</defs></svg>`,
      'image/svg+xml'
    );
    const newDefs = gradFragment.documentElement.querySelector('defs');
    if (newDefs) {
      for (const child of Array.from(newDefs.children)) {
        defs.appendChild(doc.importNode(child, true));
      }
    }
  }

  // Color gates
  for (const [gate, fill] of gateColors) {
    const gateEl = svg.querySelector(`#Gate${gate}`);
    if (gateEl) {
      gateEl.setAttribute('fill', fill);
    }
    // Also handle GateSpan, GateConnect elements for gate 10/20/34/57 compound paths
  }

  // Handle compound gate paths (GateSpan connects 10-20-57, GateConnect34 connects to 34)
  const spanEl = svg.querySelector('#GateSpan');
  if (spanEl) {
    // GateSpan bridges Gate10 and Gate20/57 area - color based on what's active
    const g10Color = gateColors.get(10) || COLOR_INACTIVE;
    const g20Color = gateColors.get(20) || COLOR_INACTIVE;
    // If both active, use the dominant one
    if (g10Color !== COLOR_INACTIVE || g20Color !== COLOR_INACTIVE) {
      spanEl.setAttribute('fill', g10Color !== COLOR_INACTIVE ? g10Color : g20Color);
    } else {
      spanEl.setAttribute('fill', COLOR_INACTIVE);
    }
  }
  const connect34 = svg.querySelector('#GateConnect34');
  if (connect34) {
    connect34.setAttribute('fill', gateColors.get(34) || COLOR_INACTIVE);
  }
  const connect10 = svg.querySelector('#GateConnect10');
  if (connect10) {
    connect10.setAttribute('fill', gateColors.get(10) || COLOR_INACTIVE);
  }

  // Highlight active gate number text
  for (const [gate, fill] of gateColors) {
    const textEl = svg.querySelector(`#GateText${gate}`) as SVGElement | null;
    if (textEl) {
      if (fill !== COLOR_INACTIVE) {
        textEl.setAttribute('fill', '#FFFFFF');
        textEl.setAttribute('style', 'filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.7))');
      } else {
        textEl.setAttribute('fill', '#B2A8A6');
      }
    }
  }

  // Color centers
  for (const center of ['Head', 'Ajna', 'Throat', 'G', 'HeartEgo', 'SolarPlexus', 'Sacral', 'Spleen', 'Root'] as Center[]) {
    const svgId = CENTER_SVG_ID[center];
    const centerGroup = svg.querySelector(`#${svgId}`);
    if (centerGroup) {
      const path = centerGroup.querySelector('path');
      if (path) {
        path.setAttribute('fill', definedCenters.has(center) ? CENTER_COLORS[center] : '#ffffff');
      }
    }
  }

  // Set responsive SVG — it defines the wrapper's intrinsic size
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('style', 'width:100%;height:auto;max-height:85vh;display:block;position:relative;z-index:1');

  // Build container: relative wrapper so BG absolute-positions against it
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;overflow:visible';

  // BG image: absolute, sized as percentage of wrapper (= chart size),
  // centered horizontally with left+transform, offset vertically
  const bgImg = document.createElement('img');
  bgImg.src = '/bg-body.png';
  bgImg.alt = '';
  bgImg.draggable = false;
  const bgOffsetYPct = BG_OFFSET_Y * 100;
  bgImg.style.cssText = [
    'position:absolute',
    'width:100%',
    'left:50%',
    `top:${bgOffsetYPct}%`,
    `transform:translateX(calc(-50% + ${BG_OFFSET_X * 100}%)) scale(${BG_ZOOM})`,
    'transform-origin:top center',
    'z-index:0',
    'pointer-events:none',
    'user-select:none',
  ].join(';');

  wrapper.appendChild(bgImg);
  wrapper.appendChild(document.importNode(svg, true));
  container.appendChild(wrapper);
}

/** Color gates for a single person */
function colorPersonGates(
  person: PersonChart,
  pColor: string,
  dColor: string,
  gateColors: Map<number, string>,
  gradients: string[],
): void {
  for (let g = 1; g <= 64; g++) {
    const info = getGateColor(g, person.analysis.personalityGates, person.analysis.designGates, pColor, dColor);
    if (info.gradient) gradients.push(info.gradient);
    gateColors.set(g, info.fill);
  }
}
