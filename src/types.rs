use std::collections::{HashMap, HashSet};
use crate::chart::Chart;
use crate::gates::{Center, all_channels};

/// Human Design Type
#[derive(Debug, Clone, Copy)]
pub enum HdType {
    Generator,
    ManifestingGenerator,
    Manifestor,
    Projector,
    Reflector,
}

impl HdType {
    pub fn name(&self) -> &'static str {
        match self {
            HdType::Generator => "Generator",
            HdType::ManifestingGenerator => "Manifesting Generator",
            HdType::Manifestor => "Manifestor",
            HdType::Projector => "Projector",
            HdType::Reflector => "Reflector",
        }
    }

    pub fn strategy(&self) -> &'static str {
        match self {
            HdType::Generator | HdType::ManifestingGenerator => "To Respond",
            HdType::Manifestor => "To Inform",
            HdType::Projector => "Wait for the Invitation",
            HdType::Reflector => "Wait a Lunar Cycle",
        }
    }

    pub fn signature(&self) -> &'static str {
        match self {
            HdType::Generator | HdType::ManifestingGenerator => "Satisfaction",
            HdType::Manifestor => "Peace",
            HdType::Projector => "Success",
            HdType::Reflector => "Surprise",
        }
    }

    pub fn not_self(&self) -> &'static str {
        match self {
            HdType::Generator => "Frustration",
            HdType::ManifestingGenerator => "Frustration & Anger",
            HdType::Manifestor => "Anger",
            HdType::Projector => "Bitterness",
            HdType::Reflector => "Disappointment",
        }
    }
}

/// Defined channel info
#[derive(Debug, Clone)]
pub struct DefinedChannel {
    pub gate1: u8,
    pub gate2: u8,
    pub name: &'static str,
    pub center1: Center,
    pub center2: Center,
}

/// Analysis result
#[derive(Debug)]
pub struct ChartAnalysis {
    pub hd_type: HdType,
    pub authority: &'static str,
    pub profile: (u8, u8),
    pub profile_name: &'static str,
    pub incarnation_cross: (u8, u8, u8, u8), // p_sun, p_earth, d_sun, d_earth
    pub defined_channels: Vec<DefinedChannel>,
    pub defined_centers: HashSet<Center>,
    pub open_centers: Vec<Center>,
}

pub fn analyze(chart: &Chart) -> ChartAnalysis {
    // Collect all active gates
    let mut all_gates: HashSet<u8> = HashSet::new();
    for a in &chart.personality {
        all_gates.insert(a.gate);
    }
    for a in &chart.design {
        all_gates.insert(a.gate);
    }

    // Find defined channels
    let channels = all_channels();
    let mut defined_channels = Vec::new();
    let mut defined_centers: HashSet<Center> = HashSet::new();

    for ch in &channels {
        if all_gates.contains(&ch.gate1) && all_gates.contains(&ch.gate2) {
            defined_channels.push(DefinedChannel {
                gate1: ch.gate1,
                gate2: ch.gate2,
                name: ch.name,
                center1: ch.center1,
                center2: ch.center2,
            });
            defined_centers.insert(ch.center1);
            defined_centers.insert(ch.center2);
        }
    }

    // Build center adjacency graph for motor-to-throat check
    let mut adj: HashMap<Center, HashSet<Center>> = HashMap::new();
    for ch in &defined_channels {
        adj.entry(ch.center1).or_default().insert(ch.center2);
        adj.entry(ch.center2).or_default().insert(ch.center1);
    }

    let has_sacral = defined_centers.contains(&Center::Sacral);
    let motor_to_throat = is_connected_to_throat(&adj, &defined_centers);

    // Determine type
    let hd_type = if has_sacral {
        if motor_to_throat {
            HdType::ManifestingGenerator
        } else {
            HdType::Generator
        }
    } else if motor_to_throat {
        HdType::Manifestor
    } else if !defined_centers.is_empty() {
        HdType::Projector
    } else {
        HdType::Reflector
    };

    // Authority
    let authority = determine_authority(&defined_centers);

    // Profile from Sun lines
    let p_sun_line = chart.personality.iter().find(|a| a.planet == "Sun").unwrap().line;
    let d_sun_line = chart.design.iter().find(|a| a.planet == "Sun").unwrap().line;
    let profile = (p_sun_line, d_sun_line);
    let profile_name = match profile {
        (1, 3) => "Investigator / Martyr",
        (1, 4) => "Investigator / Opportunist",
        (2, 4) => "Hermit / Opportunist",
        (2, 5) => "Hermit / Heretic",
        (3, 5) => "Martyr / Heretic",
        (3, 6) => "Martyr / Role Model",
        (4, 6) => "Opportunist / Role Model",
        (4, 1) => "Opportunist / Investigator",
        (5, 1) => "Heretic / Investigator",
        (5, 2) => "Heretic / Hermit",
        (6, 2) => "Role Model / Hermit",
        (6, 3) => "Role Model / Martyr",
        _ => "Unknown",
    };

    // Incarnation Cross
    let p_sun = chart.personality.iter().find(|a| a.planet == "Sun").unwrap().gate;
    let p_earth = chart.personality.iter().find(|a| a.planet == "Earth").unwrap().gate;
    let d_sun = chart.design.iter().find(|a| a.planet == "Sun").unwrap().gate;
    let d_earth = chart.design.iter().find(|a| a.planet == "Earth").unwrap().gate;

    // Open centers
    let all_center_list = vec![
        Center::Head, Center::Ajna, Center::Throat, Center::G,
        Center::HeartEgo, Center::SolarPlexus, Center::Sacral,
        Center::Spleen, Center::Root,
    ];
    let open_centers: Vec<Center> = all_center_list.iter()
        .filter(|c| !defined_centers.contains(c))
        .copied()
        .collect();

    ChartAnalysis {
        hd_type,
        authority,
        profile,
        profile_name,
        incarnation_cross: (p_sun, p_earth, d_sun, d_earth),
        defined_channels,
        defined_centers,
        open_centers,
    }
}

fn is_connected_to_throat(adj: &HashMap<Center, HashSet<Center>>, defined_centers: &HashSet<Center>) -> bool {
    let motors = [Center::Sacral, Center::SolarPlexus, Center::HeartEgo, Center::Root];
    for motor in &motors {
        if defined_centers.contains(motor) && bfs_connected(adj, *motor, Center::Throat) {
            return true;
        }
    }
    false
}

fn bfs_connected(adj: &HashMap<Center, HashSet<Center>>, start: Center, end: Center) -> bool {
    let mut visited = HashSet::new();
    let mut queue = vec![start];
    while let Some(node) = queue.pop() {
        if node == end { return true; }
        if visited.contains(&node) { continue; }
        visited.insert(node);
        if let Some(neighbors) = adj.get(&node) {
            for n in neighbors {
                if !visited.contains(n) {
                    queue.push(*n);
                }
            }
        }
    }
    false
}

fn determine_authority(defined_centers: &HashSet<Center>) -> &'static str {
    if defined_centers.contains(&Center::SolarPlexus) {
        "Emotional (Solar Plexus)"
    } else if defined_centers.contains(&Center::Sacral) {
        "Sacral"
    } else if defined_centers.contains(&Center::Spleen) {
        "Splenic"
    } else if defined_centers.contains(&Center::HeartEgo) {
        "Ego / Heart"
    } else if defined_centers.contains(&Center::G) {
        "Self-Projected"
    } else if defined_centers.contains(&Center::Ajna) || defined_centers.contains(&Center::Head) {
        "Mental / Environmental"
    } else {
        "Lunar (None)"
    }
}
