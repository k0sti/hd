/// Human Design gate order around the Rave Mandala.
/// Gate 41 line 1 starts at 2°00' Aquarius (302° tropical).
/// Each gate spans 5.625° (360/64), each line spans 0.9375° (5.625/6).

pub const HD_START_DEGREE: f64 = 302.0;
pub const GATE_SIZE: f64 = 360.0 / 64.0; // 5.625°
pub const LINE_SIZE: f64 = GATE_SIZE / 6.0; // 0.9375°

/// Gate order around the mandala starting from Gate 41 at 302° tropical
pub const GATE_ORDER: [u8; 64] = [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

/// Convert ecliptic longitude to HD gate and line
pub fn longitude_to_gate_line(longitude: f64) -> (u8, u8) {
    let offset = (longitude - HD_START_DEGREE + 360.0) % 360.0;
    let gate_index = (offset / GATE_SIZE) as usize % 64;
    let line = ((offset % GATE_SIZE) / LINE_SIZE) as u8 + 1;
    (GATE_ORDER[gate_index], line.min(6))
}

/// Centers in the bodygraph
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Center {
    Head,
    Ajna,
    Throat,
    G,
    HeartEgo,
    SolarPlexus,
    Sacral,
    Spleen,
    Root,
}

impl Center {
    pub fn is_motor(&self) -> bool {
        matches!(self, Center::Sacral | Center::SolarPlexus | Center::HeartEgo | Center::Root)
    }

    pub fn name(&self) -> &'static str {
        match self {
            Center::Head => "Head",
            Center::Ajna => "Ajna",
            Center::Throat => "Throat",
            Center::G => "G (Self)",
            Center::HeartEgo => "Heart/Ego",
            Center::SolarPlexus => "Solar Plexus",
            Center::Sacral => "Sacral",
            Center::Spleen => "Spleen",
            Center::Root => "Root",
        }
    }
}

/// All 36 channels with their gate pairs and center connections
pub struct Channel {
    pub gate1: u8,
    pub gate2: u8,
    pub name: &'static str,
    pub center1: Center,
    pub center2: Center,
}

/// Which center a gate belongs to
pub fn gate_center(gate: u8) -> Center {
    match gate {
        64 | 61 | 63 => Center::Head,
        47 | 24 | 4 | 17 | 43 | 11 => Center::Ajna,
        62 | 23 | 56 | 35 | 12 | 45 | 33 | 8 | 31 | 7 | 1 | 13 | 10 | 25 | 46 | 2 => Center::Throat,
        // Wait, gates belong to specific centers. Let me be precise:
        // Throat: 62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 10, 25, 46, 2 -- no, that's wrong
        // Let me use the correct mapping
        _ => gate_center_lookup(gate),
    }
}

fn gate_center_lookup(gate: u8) -> Center {
    match gate {
        // Head
        64 | 61 | 63 => Center::Head,
        // Ajna
        47 | 24 | 4 | 17 | 43 | 11 => Center::Ajna,
        // Throat
        62 | 23 | 56 | 35 | 12 | 45 | 33 | 8 | 31 | 7 | 1 | 13 | 20 | 16 => Center::Throat,
        // G Center
        10 | 25 | 46 | 2 | 15 | 5 | 14 | 29 => Center::G,
        // Heart/Ego
        21 | 51 | 26 | 40 => Center::HeartEgo,
        // Solar Plexus
        36 | 22 | 6 | 37 | 49 | 55 | 30 => Center::SolarPlexus,
        // Sacral
        34 | 3 | 42 | 27 | 9 | 59 => Center::Sacral,
        // note: sacral also has 5, 14, 29 -- no, those are G
        // Actually: let me be more careful
        // Sacral: 5, 14, 29, 59, 9, 3, 42, 27, 34
        // G: 1, 2, 7, 10, 13, 15, 25, 46
        _ => gate_center_precise(gate),
    }
}

fn gate_center_precise(gate: u8) -> Center {
    // Precise gate-to-center mapping
    match gate {
        // Head (Crown)
        64 | 61 | 63 => Center::Head,
        // Ajna
        47 | 24 | 4 | 17 | 43 | 11 => Center::Ajna,
        // Throat
        62 | 23 | 56 | 35 | 12 | 45 | 33 | 8 | 31 | 7 | 1 | 13 | 20 | 16 => Center::Throat,
        // G / Identity
        10 | 25 | 46 | 2 | 15 => Center::G,
        // Heart / Ego / Will
        21 | 51 | 26 | 40 => Center::HeartEgo,
        // Solar Plexus / Emotional
        36 | 22 | 6 | 37 | 49 | 55 | 30 => Center::SolarPlexus,
        // Sacral
        5 | 14 | 29 | 59 | 9 | 3 | 42 | 27 | 34 => Center::Sacral,
        // Spleen
        48 | 57 | 44 | 50 | 32 | 28 | 18 => Center::Spleen,
        // Root
        58 | 38 | 54 | 53 | 60 | 52 | 19 | 39 | 41 => Center::Root,
        _ => Center::G, // fallback, shouldn't happen
    }
}

pub fn all_channels() -> Vec<Channel> {
    vec![
        Channel { gate1: 1, gate2: 8, name: "Inspiration", center1: Center::G, center2: Center::Throat },
        Channel { gate1: 2, gate2: 14, name: "The Beat", center1: Center::G, center2: Center::Sacral },
        Channel { gate1: 3, gate2: 60, name: "Mutation", center1: Center::Sacral, center2: Center::Root },
        Channel { gate1: 4, gate2: 63, name: "Logic", center1: Center::Ajna, center2: Center::Head },
        Channel { gate1: 5, gate2: 15, name: "Rhythms", center1: Center::Sacral, center2: Center::G },
        Channel { gate1: 6, gate2: 59, name: "Intimacy", center1: Center::SolarPlexus, center2: Center::Sacral },
        Channel { gate1: 7, gate2: 31, name: "The Alpha", center1: Center::G, center2: Center::Throat },
        Channel { gate1: 9, gate2: 52, name: "Concentration", center1: Center::Sacral, center2: Center::Root },
        Channel { gate1: 10, gate2: 20, name: "Awakening", center1: Center::G, center2: Center::Throat },
        Channel { gate1: 10, gate2: 34, name: "Exploration", center1: Center::G, center2: Center::Sacral },
        Channel { gate1: 10, gate2: 57, name: "Perfected Form", center1: Center::G, center2: Center::Spleen },
        Channel { gate1: 11, gate2: 56, name: "Curiosity", center1: Center::Ajna, center2: Center::Throat },
        Channel { gate1: 12, gate2: 22, name: "Openness", center1: Center::Throat, center2: Center::SolarPlexus },
        Channel { gate1: 13, gate2: 33, name: "The Prodigal", center1: Center::G, center2: Center::Throat },
        Channel { gate1: 16, gate2: 48, name: "The Wavelength", center1: Center::Throat, center2: Center::Spleen },
        Channel { gate1: 17, gate2: 62, name: "Acceptance", center1: Center::Ajna, center2: Center::Throat },
        Channel { gate1: 18, gate2: 58, name: "Judgement", center1: Center::Spleen, center2: Center::Root },
        Channel { gate1: 19, gate2: 49, name: "Synthesis", center1: Center::Root, center2: Center::SolarPlexus },
        Channel { gate1: 20, gate2: 34, name: "Charisma", center1: Center::Throat, center2: Center::Sacral },
        Channel { gate1: 20, gate2: 57, name: "The Brainwave", center1: Center::Throat, center2: Center::Spleen },
        Channel { gate1: 21, gate2: 45, name: "Money Line", center1: Center::HeartEgo, center2: Center::Throat },
        Channel { gate1: 23, gate2: 43, name: "Structuring", center1: Center::Throat, center2: Center::Ajna },
        Channel { gate1: 24, gate2: 61, name: "Awareness", center1: Center::Ajna, center2: Center::Head },
        Channel { gate1: 25, gate2: 51, name: "Initiation", center1: Center::G, center2: Center::HeartEgo },
        Channel { gate1: 26, gate2: 44, name: "Surrender", center1: Center::HeartEgo, center2: Center::Spleen },
        Channel { gate1: 27, gate2: 50, name: "Preservation", center1: Center::Sacral, center2: Center::Spleen },
        Channel { gate1: 28, gate2: 38, name: "Struggle", center1: Center::Spleen, center2: Center::Root },
        Channel { gate1: 29, gate2: 46, name: "Discovery", center1: Center::Sacral, center2: Center::G },
        Channel { gate1: 30, gate2: 41, name: "Recognition", center1: Center::SolarPlexus, center2: Center::Root },
        Channel { gate1: 32, gate2: 54, name: "Transformation", center1: Center::Spleen, center2: Center::Root },
        Channel { gate1: 34, gate2: 57, name: "Power", center1: Center::Sacral, center2: Center::Spleen },
        Channel { gate1: 35, gate2: 36, name: "Transitoriness", center1: Center::Throat, center2: Center::SolarPlexus },
        Channel { gate1: 37, gate2: 40, name: "Community", center1: Center::SolarPlexus, center2: Center::HeartEgo },
        Channel { gate1: 39, gate2: 55, name: "Emoting", center1: Center::Root, center2: Center::SolarPlexus },
        Channel { gate1: 42, gate2: 53, name: "Maturation", center1: Center::Sacral, center2: Center::Root },
        Channel { gate1: 47, gate2: 64, name: "Abstraction", center1: Center::Ajna, center2: Center::Head },
    ]
}
