/** Transit insight report generator — template-based V1 */

import type { Activation, Chart } from './ephemeris';
import type { ChartAnalysis } from './analysis';
import { ALL_CHANNELS, type Center } from './gates';
import {
  getChannelMeaning, GATE_KEYWORDS, PLANET_DURATIONS,
  transitSpeed, TYPE_GUIDANCE, AUTHORITY_GUIDANCE,
} from './meanings';

export interface TransitChannelInsight {
  channelName: string;
  gate1: number;
  gate2: number;
  keynote: string;
  description: string;
  natalPlanet: string;
  natalGate: number;
  transitPlanet: string;
  transitGate: number;
  duration: string;
  speed: 'fast' | 'medium' | 'slow';
}

export interface CenterInsight {
  center: Center;
  isTemporary: boolean; // defined by transit only, not natal
}

export interface InsightReport {
  personName: string;
  type: string;
  authority: string;
  profile: string;
  strategy: string;
  typeGuidance: string;
  authorityGuidance: string;
  transitChannels: TransitChannelInsight[];
  temporaryCenters: CenterInsight[];
  summary: string;
  fullText: string;
  generatedAt: Date;
}

const STRATEGY_MAP: Record<string, string> = {
  'Generator': 'To Respond',
  'Manifesting Generator': 'To Respond & Inform',
  'Manifestor': 'To Inform',
  'Projector': 'Wait for the Invitation',
  'Reflector': 'Wait a Lunar Cycle',
};

/** Generate a transit insight report for a person's chart + current transits */
export function generateInsightReport(
  personName: string,
  chart: Chart,
  analysis: ChartAnalysis,
  transitActivations: Activation[],
): InsightReport {
  const transitGates = new Map<number, Activation>();
  for (const a of transitActivations) {
    transitGates.set(a.gate, a);
  }

  // Find transit-completed channels: one gate from natal, other from transit
  const transitChannels: TransitChannelInsight[] = [];

  for (const ch of ALL_CHANNELS) {
    const natalHas1 = analysis.allGates.has(ch.gate1);
    const natalHas2 = analysis.allGates.has(ch.gate2);
    const transitHas1 = transitGates.has(ch.gate1);
    const transitHas2 = transitGates.has(ch.gate2);

    // Transit completes a channel: one natal gate + one transit gate (not already natal)
    if (natalHas1 && !natalHas2 && transitHas2) {
      const meaning = getChannelMeaning(ch.gate1, ch.gate2);
      const natalPlanet = findPlanetForGate(chart, ch.gate1);
      const transitAct = transitGates.get(ch.gate2)!;

      transitChannels.push({
        channelName: meaning?.name || `${ch.gate1}-${ch.gate2}`,
        gate1: ch.gate1,
        gate2: ch.gate2,
        keynote: meaning?.keynote || '',
        description: meaning?.description || '',
        natalPlanet,
        natalGate: ch.gate1,
        transitPlanet: transitAct.planet,
        transitGate: ch.gate2,
        duration: PLANET_DURATIONS[transitAct.planet] || 'varies',
        speed: transitSpeed(transitAct.planet),
      });
    } else if (natalHas2 && !natalHas1 && transitHas1) {
      const meaning = getChannelMeaning(ch.gate1, ch.gate2);
      const natalPlanet = findPlanetForGate(chart, ch.gate2);
      const transitAct = transitGates.get(ch.gate1)!;

      transitChannels.push({
        channelName: meaning?.name || `${ch.gate1}-${ch.gate2}`,
        gate1: ch.gate1,
        gate2: ch.gate2,
        keynote: meaning?.keynote || '',
        description: meaning?.description || '',
        natalPlanet,
        natalGate: ch.gate2,
        transitPlanet: transitAct.planet,
        transitGate: ch.gate1,
        duration: PLANET_DURATIONS[transitAct.planet] || 'varies',
        speed: transitSpeed(transitAct.planet),
      });
    }
  }

  // Find temporarily defined centers (defined by transit, not natal)
  const allGatesWithTransit = new Set([...analysis.allGates, ...transitGates.keys()]);
  const temporaryCenters: CenterInsight[] = [];
  for (const ch of ALL_CHANNELS) {
    if (allGatesWithTransit.has(ch.gate1) && allGatesWithTransit.has(ch.gate2)) {
      if (!analysis.definedCenters.has(ch.center1)) {
        if (!temporaryCenters.find((c) => c.center === ch.center1)) {
          temporaryCenters.push({ center: ch.center1, isTemporary: true });
        }
      }
      if (!analysis.definedCenters.has(ch.center2)) {
        if (!temporaryCenters.find((c) => c.center === ch.center2)) {
          temporaryCenters.push({ center: ch.center2, isTemporary: true });
        }
      }
    }
  }

  const strategy = STRATEGY_MAP[analysis.type] || '';
  const typeGuidance = TYPE_GUIDANCE[analysis.type] || '';
  const authorityGuidance = AUTHORITY_GUIDANCE[analysis.authority] || '';

  // Generate full text report
  const fullText = buildReportText(
    personName, analysis, strategy, typeGuidance, authorityGuidance,
    transitChannels, temporaryCenters,
  );

  const summary = transitChannels.length > 0
    ? `${transitChannels.length} transit channel${transitChannels.length > 1 ? 's' : ''} active` +
      (temporaryCenters.length > 0 ? `, ${temporaryCenters.length} temporarily defined center${temporaryCenters.length > 1 ? 's' : ''}` : '')
    : 'No transit-completed channels at this time.';

  return {
    personName,
    type: analysis.type,
    authority: analysis.authority,
    profile: `${analysis.profile[0]}/${analysis.profile[1]}`,
    strategy,
    typeGuidance,
    authorityGuidance,
    transitChannels,
    temporaryCenters,
    summary,
    fullText,
    generatedAt: new Date(),
  };
}

function findPlanetForGate(chart: Chart, gate: number): string {
  for (const a of chart.personality) {
    if (a.gate === gate) return `${a.planet} (Personality)`;
  }
  for (const a of chart.design) {
    if (a.gate === gate) return `${a.planet} (Design)`;
  }
  return 'Unknown';
}

function buildReportText(
  name: string,
  analysis: ChartAnalysis,
  strategy: string,
  typeGuidance: string,
  authorityGuidance: string,
  transitChannels: TransitChannelInsight[],
  temporaryCenters: CenterInsight[],
): string {
  const lines: string[] = [];

  lines.push(`Transit Insight Report for ${name}`);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  lines.push(`Generated ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  lines.push('');
  lines.push(`Type: ${analysis.type} | Strategy: ${strategy}`);
  lines.push(`Authority: ${analysis.authority}`);
  lines.push(`Profile: ${analysis.profile[0]}/${analysis.profile[1]}`);
  lines.push('');
  lines.push(`As a ${analysis.type}, ${typeGuidance}`);
  lines.push(`With ${analysis.authority} authority, ${authorityGuidance.charAt(0).toLowerCase()}${authorityGuidance.slice(1)}`);
  lines.push('');

  if (transitChannels.length === 0) {
    lines.push('No transit-completed channels at this time. The transiting planets are activating gates that don\'t currently complete any channels with your natal chart.');
    lines.push('');
    lines.push('This is a time of relative stability in your energy configuration. Your defined channels continue to operate as usual.');
  } else {
    lines.push(`Currently, ${transitChannels.length} channel${transitChannels.length > 1 ? 's are' : ' is'} being temporarily completed by planetary transits:`);
    lines.push('');

    for (const tc of transitChannels) {
      const gk1 = GATE_KEYWORDS[tc.gate1];
      const gk2 = GATE_KEYWORDS[tc.gate2];

      lines.push(`--- Channel ${tc.gate1}-${tc.gate2}: ${tc.channelName} ---`);
      lines.push(`"${tc.keynote}"`);
      lines.push('');
      lines.push(tc.description);
      lines.push('');
      lines.push(`Your natal ${tc.natalPlanet} in Gate ${tc.natalGate} (${gk1?.keyword || ''}) meets transit ${tc.transitPlanet} in Gate ${tc.transitGate} (${gk2?.keyword || ''}).`);
      lines.push('');

      if (tc.speed === 'slow') {
        lines.push(`This is a longer-term transit (${tc.duration}). ${tc.transitPlanet} moves slowly, so you'll feel this energy for an extended period. Notice how this theme develops over time.`);
      } else if (tc.speed === 'fast') {
        lines.push(`This is a quick transit (${tc.duration}). The Moon moves fast, bringing brief but intense activation. Pay attention to what comes up in the next few hours.`);
      } else {
        lines.push(`This transit lasts approximately ${tc.duration}. ${tc.transitPlanet} brings this energy into your field for a moderate period — long enough to work with consciously.`);
      }
      lines.push('');
    }
  }

  if (temporaryCenters.length > 0) {
    lines.push('--- Temporarily Defined Centers ---');
    lines.push('');
    const centerNames = temporaryCenters.map((c) => c.center).join(', ');
    lines.push(`The following centers are temporarily defined by transits: ${centerNames}`);
    lines.push('');
    lines.push('When normally open centers become temporarily defined, you may feel the energy more intensely than usual. Remember that this energy is not "yours" — it\'s transiting through. Observe it without identifying with it.');
    lines.push('');

    for (const tc of temporaryCenters) {
      const desc = TEMP_CENTER_DESCRIPTIONS[tc.center];
      if (desc) {
        lines.push(`${tc.center}: ${desc}`);
      }
    }
  }

  return lines.join('\n');
}

const TEMP_CENTER_DESCRIPTIONS: Record<string, string> = {
  Head: 'You may feel unusual mental pressure to figure things out or be inspired. Let inspiration come to you rather than chasing it.',
  Ajna: 'You may feel more mentally certain than usual. Be careful not to fixate on ideas — flexibility serves you better.',
  Throat: 'You may feel increased pressure to speak or act. Choose your timing carefully rather than feeling compelled to express.',
  G: 'You may feel a stronger sense of direction or identity. Enjoy the clarity but don\'t make permanent commitments based on it.',
  HeartEgo: 'You may feel increased willpower or desire to prove yourself. Avoid overcommitting — this drive is temporary.',
  SolarPlexus: 'You may experience more emotional waves than usual. Don\'t make important decisions while riding emotional highs or lows.',
  Sacral: 'You may feel more energetic and responsive. Enjoy the vitality but pace yourself — it won\'t last indefinitely.',
  Spleen: 'You may feel heightened intuition or survival awareness. Trust the instincts but verify with your authority.',
  Root: 'You may feel more pressure to get things done. The urgency is temporary — don\'t let it drive you into stress.',
};
