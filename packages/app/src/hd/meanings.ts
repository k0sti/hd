/** Human Design channel meanings, gate keywords, and insight text data */

export interface ChannelMeaning {
  gate1: number;
  gate2: number;
  name: string;
  keynote: string;
  description: string;
  gate1Keyword: string;
  gate2Keyword: string;
}

export interface GateKeyword {
  gate: number;
  name: string;
  keyword: string;
  center: string;
}

/** Planet transit duration descriptions */
export const PLANET_DURATIONS: Record<string, string> = {
  'Sun': '~6 days per gate',
  'Earth': '~6 days per gate',
  'Moon': '~6 hours per gate',
  'Mercury': '~3-7 days per gate',
  'Venus': '~5-6 days per gate',
  'Mars': '~6-7 days per gate',
  'Jupiter': '~33 days per gate',
  'Saturn': '~44 days per gate',
  'Uranus': '~88 days per gate',
  'Neptune': '~100 days per gate',
  'Pluto': '~115 days per gate',
  'North Node': '~90 days per gate',
  'South Node': '~90 days per gate',
};

/** Quick transit speed category */
export function transitSpeed(planet: string): 'fast' | 'medium' | 'slow' {
  if (['Moon'].includes(planet)) return 'fast';
  if (['Sun', 'Earth', 'Mercury', 'Venus', 'Mars'].includes(planet)) return 'medium';
  return 'slow';
}

/** Type-specific strategy guidance */
export const TYPE_GUIDANCE: Record<string, string> = {
  'Generator': 'Wait to respond before engaging with this energy. Notice what lights up your sacral response.',
  'Manifesting Generator': 'Wait to respond, then inform before acting. Your sacral will guide you — trust the gut response.',
  'Manifestor': 'Inform others before initiating. This transit may bring a new impulse to act on.',
  'Projector': 'Wait for recognition and invitation. Use this energy to refine your guidance and wisdom.',
  'Reflector': 'Wait a full lunar cycle before making decisions. Sample this energy without identifying with it.',
};

/** Authority-specific decision guidance */
export const AUTHORITY_GUIDANCE: Record<string, string> = {
  'Emotional (Solar Plexus)': 'Ride the emotional wave — clarity comes with time, not in the moment.',
  'Sacral': 'Trust your sacral sounds and sensations. The body knows before the mind.',
  'Splenic': 'Listen to spontaneous intuition — it speaks once, in the moment.',
  'Ego / Heart': 'Ask yourself: "Do I really want this? Is my heart in it?"',
  'Self-Projected': 'Talk it out with trusted others. Hear your own truth in your voice.',
  'Mental / Environmental': 'Discuss with your sounding board. The right environment will clarify.',
  'Lunar (None)': 'Wait 28 days. Let the Moon cycle through all gates before deciding.',
};

/** All 36 channel meanings */
export const CHANNEL_MEANINGS: ChannelMeaning[] = [
  {
    gate1: 1, gate2: 8, name: 'Inspiration',
    keynote: 'Creative role model',
    description: 'The channel of creative self-expression. When activated, it brings the energy to manifest unique creative contributions that inspire others through authentic individual expression.',
    gate1Keyword: 'Self-Expression', gate2Keyword: 'Contribution',
  },
  {
    gate1: 2, gate2: 14, name: 'The Beat',
    keynote: 'Keeper of keys',
    description: 'The channel of direction and resources. This energy connects higher knowing about direction with the power to sustain effort, creating the capacity to be a keeper of important knowledge and resources.',
    gate1Keyword: 'Higher Knowing', gate2Keyword: 'Power Skills',
  },
  {
    gate1: 3, gate2: 60, name: 'Mutation',
    keynote: 'Energy to begin and sustain',
    description: 'The channel of mutation and new beginnings. This energy pulses with the potential to start something entirely new, bringing order out of chaos through accepting limitation as a creative force.',
    gate1Keyword: 'Ordering', gate2Keyword: 'Limitation',
  },
  {
    gate1: 4, gate2: 63, name: 'Logic',
    keynote: 'Mental ease mixed with doubt',
    description: 'The channel of logical thinking. This connects questioning doubt with formulaic answers, creating the mental pressure to find logical explanations and prove theories through evidence.',
    gate1Keyword: 'Formulization', gate2Keyword: 'Doubt',
  },
  {
    gate1: 5, gate2: 15, name: 'Rhythms',
    keynote: 'Being in the flow',
    description: 'The channel of natural rhythms and timing. This energy aligns personal patterns with universal flow, creating someone who embodies and models natural timing and seasonal awareness.',
    gate1Keyword: 'Fixed Rhythms', gate2Keyword: 'Extremes',
  },
  {
    gate1: 6, gate2: 59, name: 'Intimacy',
    keynote: 'Focused on reproduction',
    description: 'The channel of intimacy and connection. This emotional-sacral connection governs the process of bonding, fertility, and breaking down barriers to create deep intimate connections.',
    gate1Keyword: 'Friction', gate2Keyword: 'Sexuality',
  },
  {
    gate1: 7, gate2: 31, name: 'The Alpha',
    keynote: 'Leadership for good or ill',
    description: 'The channel of leadership. This connects the role of the democratic leader with the ability to influence through voice, creating natural leadership that guides the collective direction.',
    gate1Keyword: 'The Role of the Self', gate2Keyword: 'Influence',
  },
  {
    gate1: 9, gate2: 52, name: 'Concentration',
    keynote: 'Focused determination',
    description: 'The channel of concentration and focus. This connects the energy to attend to details with the stillness of focused awareness, creating deep concentration and determination.',
    gate1Keyword: 'Focus', gate2Keyword: 'Stillness',
  },
  {
    gate1: 10, gate2: 20, name: 'Awakening',
    keynote: 'Commitment to higher principles',
    description: 'The channel of awakening and self-love. This connects authentic behavior with presence in the now, creating someone who lives their truth in each moment with existential awareness.',
    gate1Keyword: 'Self-Love', gate2Keyword: 'The Now',
  },
  {
    gate1: 10, gate2: 34, name: 'Exploration',
    keynote: 'Following one\'s convictions',
    description: 'The channel of exploration through power. This connects authentic self-behavior with raw sacral power, creating someone who has the energy to explore life on their own terms.',
    gate1Keyword: 'Self-Love', gate2Keyword: 'Power',
  },
  {
    gate1: 10, gate2: 57, name: 'Perfected Form',
    keynote: 'Survival through intuition',
    description: 'The channel of perfected form. This connects authentic behavior with intuitive awareness, creating someone who instinctively knows what is correct behavior for their own well-being.',
    gate1Keyword: 'Self-Love', gate2Keyword: 'Intuition',
  },
  {
    gate1: 11, gate2: 56, name: 'Curiosity',
    keynote: 'A searcher',
    description: 'The channel of curiosity and storytelling. This connects the gate of ideas with the gift of stimulation through language, creating someone who collects and shares experiences and ideas.',
    gate1Keyword: 'Ideas', gate2Keyword: 'Stimulation',
  },
  {
    gate1: 12, gate2: 22, name: 'Openness',
    keynote: 'A social being',
    description: 'The channel of openness. This connects the voice of caution with emotional grace, creating someone who can transform individual feelings into social expression when the mood is right.',
    gate1Keyword: 'Caution', gate2Keyword: 'Grace',
  },
  {
    gate1: 13, gate2: 33, name: 'The Prodigal',
    keynote: 'A witness',
    description: 'The channel of the prodigal. This connects listening and collecting experiences with the ability to remember and share them as wisdom, creating a natural witness and storyteller.',
    gate1Keyword: 'The Listener', gate2Keyword: 'Privacy',
  },
  {
    gate1: 16, gate2: 48, name: 'The Wavelength',
    keynote: 'Talent through practice',
    description: 'The channel of talent. This connects enthusiasm and skill-building with the depth of collective knowledge, creating mastery through dedicated practice and repetition.',
    gate1Keyword: 'Skills', gate2Keyword: 'Depth',
  },
  {
    gate1: 17, gate2: 62, name: 'Acceptance',
    keynote: 'An organizational being',
    description: 'The channel of acceptance. This connects opinion and mental organization with the expression of facts and details, creating someone who structures understanding logically.',
    gate1Keyword: 'Opinions', gate2Keyword: 'Details',
  },
  {
    gate1: 18, gate2: 58, name: 'Judgement',
    keynote: 'Insatiability for perfection',
    description: 'The channel of judgement. This connects the drive to correct and improve with the joy of vitality, creating someone with the energy and insight to challenge and perfect patterns.',
    gate1Keyword: 'Correction', gate2Keyword: 'Vitality',
  },
  {
    gate1: 19, gate2: 49, name: 'Synthesis',
    keynote: 'Sensitivity through need',
    description: 'The channel of synthesis. This connects the pressure of need with the power of principles and revolution, creating deep tribal sensitivity and awareness of group needs.',
    gate1Keyword: 'Wanting', gate2Keyword: 'Principles',
  },
  {
    gate1: 20, gate2: 34, name: 'Charisma',
    keynote: 'Where thoughts become deeds',
    description: 'The channel of charisma. This connects present-moment awareness with raw sacral power, creating someone who acts in the now with immediate and powerful response.',
    gate1Keyword: 'The Now', gate2Keyword: 'Power',
  },
  {
    gate1: 20, gate2: 57, name: 'The Brainwave',
    keynote: 'Penetrating awareness in the now',
    description: 'The channel of the brainwave. This connects existential awareness with splenic intuition, creating someone who can express intuitive knowing in the present moment.',
    gate1Keyword: 'The Now', gate2Keyword: 'Intuition',
  },
  {
    gate1: 21, gate2: 45, name: 'Money Line',
    keynote: 'The materialist',
    description: 'The channel of money and resources. This connects willpower and control with the energy to gather and distribute material resources, creating natural material leadership.',
    gate1Keyword: 'Control', gate2Keyword: 'The Gatherer',
  },
  {
    gate1: 23, gate2: 43, name: 'Structuring',
    keynote: 'Individuality through thinking',
    description: 'The channel of structuring. This connects the voice of individual insight with inner knowing, creating the ability to express unique mental breakthroughs and "aha" moments.',
    gate1Keyword: 'Assimilation', gate2Keyword: 'Insight',
  },
  {
    gate1: 24, gate2: 61, name: 'Awareness',
    keynote: 'A thinker who rationalizes',
    description: 'The channel of awareness. This connects rationalization with inner truth and mystery, creating a mind that processes inspiration into concepts that can be communicated.',
    gate1Keyword: 'Rationalization', gate2Keyword: 'Mystery',
  },
  {
    gate1: 25, gate2: 51, name: 'Initiation',
    keynote: 'Needing to be first',
    description: 'The channel of initiation. This connects universal love with competitive spirit, creating the archetype of the spiritual warrior who initiates others through their own courage.',
    gate1Keyword: 'Universal Love', gate2Keyword: 'Shock',
  },
  {
    gate1: 26, gate2: 44, name: 'Surrender',
    keynote: 'A transmitter',
    description: 'The channel of surrender. This connects the trickster\'s persuasive ability with pattern recognition, creating someone who can sell, transmit, and make things happen through alertness.',
    gate1Keyword: 'The Trickster', gate2Keyword: 'Alertness',
  },
  {
    gate1: 27, gate2: 50, name: 'Preservation',
    keynote: 'A custodian',
    description: 'The channel of preservation. This connects nurturing energy with tribal values and responsibility, creating someone who cares for and sustains community through devoted service.',
    gate1Keyword: 'Caring', gate2Keyword: 'Values',
  },
  {
    gate1: 28, gate2: 38, name: 'Struggle',
    keynote: 'Stubbornness for purpose',
    description: 'The channel of struggle. This connects the game player\'s risk-taking with the fighter\'s determination, creating someone who persists through difficulty to find life\'s purpose.',
    gate1Keyword: 'The Game Player', gate2Keyword: 'The Fighter',
  },
  {
    gate1: 29, gate2: 46, name: 'Discovery',
    keynote: 'Succeeding where others fail',
    description: 'The channel of discovery. This connects the energy to commit with good fortune through the body, creating someone who discovers through physical experience and perseverance.',
    gate1Keyword: 'Commitment', gate2Keyword: 'Good Fortune',
  },
  {
    gate1: 30, gate2: 41, name: 'Recognition',
    keynote: 'Focused energy through feelings',
    description: 'The channel of recognition. This connects emotional desire with the pressure to begin new experiences, creating intense feeling energy that fantasizes and then manifests.',
    gate1Keyword: 'Feelings', gate2Keyword: 'Decrease',
  },
  {
    gate1: 32, gate2: 54, name: 'Transformation',
    keynote: 'A driven being',
    description: 'The channel of transformation. This connects the fear of failure with ambition and drive, creating someone who transforms community through instinct-driven material success.',
    gate1Keyword: 'Continuity', gate2Keyword: 'Ambition',
  },
  {
    gate1: 34, gate2: 57, name: 'Power',
    keynote: 'An archetype with human design',
    description: 'The channel of power. This connects raw sacral power with intuitive awareness, creating an archetype of pure survival power guided by instinct and in-the-moment awareness.',
    gate1Keyword: 'Power', gate2Keyword: 'Intuition',
  },
  {
    gate1: 35, gate2: 36, name: 'Transitoriness',
    keynote: 'A jack of all trades',
    description: 'The channel of transitoriness. This connects manifesting experience with emotional crisis and adventure, creating someone who seeks and collects diverse life experiences.',
    gate1Keyword: 'Change', gate2Keyword: 'Crisis',
  },
  {
    gate1: 37, gate2: 40, name: 'Community',
    keynote: 'A part seeking a whole',
    description: 'The channel of community. This connects bargaining within the tribe with the will to provide, creating the foundation of community through agreements and mutual support.',
    gate1Keyword: 'Friendship', gate2Keyword: 'Aloneness',
  },
  {
    gate1: 39, gate2: 55, name: 'Emoting',
    keynote: 'Spirit-driven emotionality',
    description: 'The channel of emoting. This connects the provocateur with emotional spirit, creating someone whose moods and provocations serve to awaken and elevate others\' awareness.',
    gate1Keyword: 'Provocation', gate2Keyword: 'Spirit',
  },
  {
    gate1: 42, gate2: 53, name: 'Maturation',
    keynote: 'Balanced development',
    description: 'The channel of maturation. This connects growth and completion with the pressure to start new cycles, creating someone who matures through the natural process of beginning and finishing.',
    gate1Keyword: 'Growth', gate2Keyword: 'Beginnings',
  },
  {
    gate1: 47, gate2: 64, name: 'Abstraction',
    keynote: 'Mental activity mixed with clarity',
    description: 'The channel of abstraction. This connects the process of making sense of confusion with imaginative pressure, creating a mind that resolves abstract mental patterns into understanding.',
    gate1Keyword: 'Realization', gate2Keyword: 'Confusion',
  },
];

/** Lookup channel meaning by gate pair */
export function getChannelMeaning(gate1: number, gate2: number): ChannelMeaning | undefined {
  const a = Math.min(gate1, gate2);
  const b = Math.max(gate1, gate2);
  return CHANNEL_MEANINGS.find((c) => c.gate1 === a && c.gate2 === b);
}

/** All 64 gate keywords */
export const GATE_KEYWORDS: Record<number, GateKeyword> = {
  1: { gate: 1, name: 'The Creative', keyword: 'Self-Expression', center: 'G' },
  2: { gate: 2, name: 'The Receptive', keyword: 'Higher Knowing', center: 'G' },
  3: { gate: 3, name: 'Difficulty at the Beginning', keyword: 'Ordering', center: 'Sacral' },
  4: { gate: 4, name: 'Youthful Folly', keyword: 'Formulization', center: 'Ajna' },
  5: { gate: 5, name: 'Waiting', keyword: 'Fixed Rhythms', center: 'Sacral' },
  6: { gate: 6, name: 'Conflict', keyword: 'Friction', center: 'Solar Plexus' },
  7: { gate: 7, name: 'The Army', keyword: 'The Role of the Self', center: 'G' },
  8: { gate: 8, name: 'Holding Together', keyword: 'Contribution', center: 'Throat' },
  9: { gate: 9, name: 'Taming Power of the Small', keyword: 'Focus', center: 'Sacral' },
  10: { gate: 10, name: 'Treading', keyword: 'Self-Love', center: 'G' },
  11: { gate: 11, name: 'Peace', keyword: 'Ideas', center: 'Ajna' },
  12: { gate: 12, name: 'Standstill', keyword: 'Caution', center: 'Throat' },
  13: { gate: 13, name: 'Fellowship', keyword: 'The Listener', center: 'G' },
  14: { gate: 14, name: 'Possession in Great Measure', keyword: 'Power Skills', center: 'Sacral' },
  15: { gate: 15, name: 'Modesty', keyword: 'Extremes', center: 'G' },
  16: { gate: 16, name: 'Enthusiasm', keyword: 'Skills', center: 'Throat' },
  17: { gate: 17, name: 'Following', keyword: 'Opinions', center: 'Ajna' },
  18: { gate: 18, name: 'Work on What Has Been Spoiled', keyword: 'Correction', center: 'Spleen' },
  19: { gate: 19, name: 'Approach', keyword: 'Wanting', center: 'Root' },
  20: { gate: 20, name: 'Contemplation', keyword: 'The Now', center: 'Throat' },
  21: { gate: 21, name: 'Biting Through', keyword: 'Control', center: 'Heart/Ego' },
  22: { gate: 22, name: 'Grace', keyword: 'Openness', center: 'Solar Plexus' },
  23: { gate: 23, name: 'Splitting Apart', keyword: 'Assimilation', center: 'Throat' },
  24: { gate: 24, name: 'Return', keyword: 'Rationalization', center: 'Ajna' },
  25: { gate: 25, name: 'Innocence', keyword: 'Universal Love', center: 'G' },
  26: { gate: 26, name: 'Taming Power of the Great', keyword: 'The Trickster', center: 'Heart/Ego' },
  27: { gate: 27, name: 'Nourishment', keyword: 'Caring', center: 'Sacral' },
  28: { gate: 28, name: 'Preponderance of the Great', keyword: 'The Game Player', center: 'Spleen' },
  29: { gate: 29, name: 'The Abysmal', keyword: 'Commitment', center: 'Sacral' },
  30: { gate: 30, name: 'The Clinging Fire', keyword: 'Feelings', center: 'Solar Plexus' },
  31: { gate: 31, name: 'Influence', keyword: 'Leading', center: 'Throat' },
  32: { gate: 32, name: 'Duration', keyword: 'Continuity', center: 'Spleen' },
  33: { gate: 33, name: 'Retreat', keyword: 'Privacy', center: 'Throat' },
  34: { gate: 34, name: 'Power of the Great', keyword: 'Power', center: 'Sacral' },
  35: { gate: 35, name: 'Progress', keyword: 'Change', center: 'Throat' },
  36: { gate: 36, name: 'Darkening of the Light', keyword: 'Crisis', center: 'Solar Plexus' },
  37: { gate: 37, name: 'The Family', keyword: 'Friendship', center: 'Solar Plexus' },
  38: { gate: 38, name: 'Opposition', keyword: 'The Fighter', center: 'Root' },
  39: { gate: 39, name: 'Obstruction', keyword: 'Provocation', center: 'Root' },
  40: { gate: 40, name: 'Deliverance', keyword: 'Aloneness', center: 'Heart/Ego' },
  41: { gate: 41, name: 'Decrease', keyword: 'Contraction', center: 'Root' },
  42: { gate: 42, name: 'Increase', keyword: 'Growth', center: 'Sacral' },
  43: { gate: 43, name: 'Breakthrough', keyword: 'Insight', center: 'Ajna' },
  44: { gate: 44, name: 'Coming to Meet', keyword: 'Alertness', center: 'Spleen' },
  45: { gate: 45, name: 'Gathering Together', keyword: 'The Gatherer', center: 'Throat' },
  46: { gate: 46, name: 'Pushing Upward', keyword: 'Good Fortune', center: 'G' },
  47: { gate: 47, name: 'Oppression', keyword: 'Realization', center: 'Ajna' },
  48: { gate: 48, name: 'The Well', keyword: 'Depth', center: 'Spleen' },
  49: { gate: 49, name: 'Revolution', keyword: 'Principles', center: 'Solar Plexus' },
  50: { gate: 50, name: 'The Cauldron', keyword: 'Values', center: 'Spleen' },
  51: { gate: 51, name: 'The Arousing', keyword: 'Shock', center: 'Heart/Ego' },
  52: { gate: 52, name: 'Keeping Still', keyword: 'Stillness', center: 'Root' },
  53: { gate: 53, name: 'Development', keyword: 'Beginnings', center: 'Root' },
  54: { gate: 54, name: 'The Marrying Maiden', keyword: 'Ambition', center: 'Root' },
  55: { gate: 55, name: 'Abundance', keyword: 'Spirit', center: 'Solar Plexus' },
  56: { gate: 56, name: 'The Wanderer', keyword: 'Stimulation', center: 'Throat' },
  57: { gate: 57, name: 'The Gentle', keyword: 'Intuition', center: 'Spleen' },
  58: { gate: 58, name: 'The Joyous', keyword: 'Vitality', center: 'Root' },
  59: { gate: 59, name: 'Dispersion', keyword: 'Sexuality', center: 'Sacral' },
  60: { gate: 60, name: 'Limitation', keyword: 'Acceptance', center: 'Root' },
  61: { gate: 61, name: 'Inner Truth', keyword: 'Mystery', center: 'Head' },
  62: { gate: 62, name: 'Preponderance of the Small', keyword: 'Details', center: 'Throat' },
  63: { gate: 63, name: 'After Completion', keyword: 'Doubt', center: 'Head' },
  64: { gate: 64, name: 'Before Completion', keyword: 'Confusion', center: 'Head' },
};
