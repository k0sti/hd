use std::collections::HashSet;
use crate::chart::Activation;
use crate::gates::{all_channels, Center};
use crate::types::DefinedChannel;

/// Transit overlay result
#[derive(Debug)]
pub struct TransitOverlay {
    pub transit_positions: Vec<Activation>,
    pub completed_channels: Vec<CompletedChannel>,
}

/// A channel completed by transit activating a missing gate
#[derive(Debug)]
pub struct CompletedChannel {
    pub gate1: u8,
    pub gate2: u8,
    pub name: &'static str,
    pub center1: Center,
    pub center2: Center,
    pub natal_gate: u8,
    pub transit_gate: u8,
}

/// Calculate which channels are temporarily completed by current transits
pub fn overlay_transits(
    natal_gates: &HashSet<u8>,
    transit_positions: &[Activation],
    already_defined: &[DefinedChannel],
) -> Vec<CompletedChannel> {
    let transit_gates: HashSet<u8> = transit_positions.iter().map(|a| a.gate).collect();
    let defined_pairs: HashSet<(u8, u8)> = already_defined.iter()
        .map(|ch| (ch.gate1, ch.gate2))
        .collect();

    let channels = all_channels();
    let mut completed = Vec::new();

    for ch in &channels {
        let pair = (ch.gate1, ch.gate2);
        if defined_pairs.contains(&pair) {
            continue; // Already defined in natal chart
        }

        // Check if one gate is natal and the other is transit (or vice versa)
        let g1_natal = natal_gates.contains(&ch.gate1);
        let g2_natal = natal_gates.contains(&ch.gate2);
        let g1_transit = transit_gates.contains(&ch.gate1);
        let g2_transit = transit_gates.contains(&ch.gate2);

        if (g1_natal && g2_transit) || (g2_natal && g1_transit) {
            let (natal_g, transit_g) = if g1_natal && g2_transit {
                (ch.gate1, ch.gate2)
            } else {
                (ch.gate2, ch.gate1)
            };
            completed.push(CompletedChannel {
                gate1: ch.gate1,
                gate2: ch.gate2,
                name: ch.name,
                center1: ch.center1,
                center2: ch.center2,
                natal_gate: natal_g,
                transit_gate: transit_g,
            });
        }

        // Also check if both gates come from transit (pure transit channel)
        if g1_transit && g2_transit && !g1_natal && !g2_natal {
            completed.push(CompletedChannel {
                gate1: ch.gate1,
                gate2: ch.gate2,
                name: ch.name,
                center1: ch.center1,
                center2: ch.center2,
                natal_gate: 0, // pure transit
                transit_gate: 0,
            });
        }
    }

    completed
}
