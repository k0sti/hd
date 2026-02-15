use std::collections::{HashMap, HashSet};
use std::fmt::Write;
use crate::chart::Chart;
use crate::gates::Center;
use crate::types::ChartAnalysis;

// ─── Layout Constants ─────────────────────────────────────────────────
// Canvas: 380 x 560, based on the reference bodygraph layout

const W: f64 = 380.0;
const H: f64 = 560.0;

// Center positions (x, y) — carefully matched to reference image
struct CPos {
    center: Center,
    x: f64,
    y: f64,
}

const CPOS: &[CPos] = &[
    CPos { center: Center::Head,         x: 190.0, y: 38.0 },
    CPos { center: Center::Ajna,         x: 190.0, y: 98.0 },
    CPos { center: Center::Throat,       x: 190.0, y: 178.0 },
    CPos { center: Center::G,            x: 190.0, y: 290.0 },
    CPos { center: Center::HeartEgo,     x: 260.0, y: 268.0 },
    CPos { center: Center::Spleen,       x: 80.0,  y: 380.0 },
    CPos { center: Center::SolarPlexus,  x: 300.0, y: 400.0 },
    CPos { center: Center::Sacral,       x: 190.0, y: 400.0 },
    CPos { center: Center::Root,         x: 190.0, y: 480.0 },
];

fn cpos(c: Center) -> (f64, f64) {
    for cp in CPOS { if cp.center == c { return (cp.x, cp.y); } }
    (190.0, 290.0)
}

// Gate positions — each gate is placed inside or near its parent center
// Format: (gate_number, x, y)
const GATE_POSITIONS: &[(u8, f64, f64)] = &[
    // Head — gates above the center
    (64, 170.0, 18.0), (61, 190.0, 18.0), (63, 210.0, 18.0),
    // Ajna — gates inside triangle
    (47, 172.0, 92.0), (24, 190.0, 92.0), (4, 208.0, 92.0),
    // Ajna→Throat channel gates
    (17, 172.0, 122.0), (11, 200.0, 122.0), (43, 190.0, 132.0),
    // Throat — gates inside square
    (62, 160.0, 162.0), (23, 178.0, 162.0), (56, 210.0, 162.0),
    (16, 155.0, 178.0), (20, 168.0, 178.0), (35, 220.0, 168.0),
    (12, 210.0, 182.0), (45, 218.0, 192.0), (31, 178.0, 192.0),
    (8,  192.0, 192.0), (33, 228.0, 178.0),
    // Throat→G channel gates
    (7, 182.0, 220.0), (1, 190.0, 235.0), (13, 202.0, 220.0),
    // G center — gates inside diamond
    (10, 172.0, 280.0), (25, 212.0, 270.0),
    (15, 172.0, 298.0), (46, 208.0, 298.0),
    (2, 190.0, 310.0),
    // Heart/Ego — gates inside
    (21, 252.0, 252.0), (26, 254.0, 274.0),
    (51, 268.0, 260.0), (40, 270.0, 280.0),
    // Spleen — gates inside left triangle
    (48, 62.0, 365.0), (57, 72.0, 375.0), (44, 82.0, 365.0),
    (50, 72.0, 388.0), (32, 62.0, 395.0), (28, 58.0, 382.0),
    (18, 56.0, 400.0),
    // Solar Plexus — gates inside right triangle
    (36, 286.0, 388.0), (22, 298.0, 392.0),
    (37, 308.0, 388.0), (6, 292.0, 402.0),
    (49, 306.0, 406.0), (55, 312.0, 398.0),
    (30, 300.0, 418.0),
    // Sacral — gates inside square
    (5, 172.0, 392.0), (14, 182.0, 400.0), (29, 200.0, 400.0),
    (59, 210.0, 392.0), (9, 178.0, 410.0), (3, 198.0, 410.0),
    (42, 188.0, 418.0), (27, 168.0, 405.0), (34, 160.0, 395.0),
    // Root — gates inside bottom square
    (53, 172.0, 468.0), (60, 190.0, 468.0), (52, 208.0, 468.0),
    (54, 165.0, 482.0), (38, 155.0, 475.0), (58, 150.0, 490.0),
    (19, 215.0, 482.0), (39, 222.0, 475.0), (41, 228.0, 490.0),
];

fn gate_pos(gate: u8) -> Option<(f64, f64)> {
    GATE_POSITIONS.iter().find(|g| g.0 == gate).map(|g| (g.1, g.2))
}

// Channel definitions: (gate1, gate2) with visual path control points
// Each channel is drawn as a path from gate1 position to gate2 position
// Some channels curve around the body shape

struct ChannelVis {
    gate1: u8,
    gate2: u8,
    // Optional bezier control points for curved channels; if empty, draw straight
    curve: Option<((f64, f64), (f64, f64))>,
}

fn channel_visuals() -> Vec<ChannelVis> {
    vec![
        // Head ↔ Ajna
        ChannelVis { gate1: 64, gate2: 47, curve: None },
        ChannelVis { gate1: 61, gate2: 24, curve: None },
        ChannelVis { gate1: 63, gate2: 4,  curve: None },
        // Ajna ↔ Throat
        ChannelVis { gate1: 17, gate2: 62, curve: None },
        ChannelVis { gate1: 43, gate2: 23, curve: None },
        ChannelVis { gate1: 11, gate2: 56, curve: None },
        // Throat ↔ G
        ChannelVis { gate1: 7,  gate2: 31, curve: None },
        ChannelVis { gate1: 1,  gate2: 8,  curve: None },
        ChannelVis { gate1: 13, gate2: 33, curve: None },
        // Throat ↔ other
        ChannelVis { gate1: 16, gate2: 48, curve: Some(((100.0, 200.0), (70.0, 340.0))) }, // Throat→Spleen curve left
        ChannelVis { gate1: 20, gate2: 34, curve: Some(((130.0, 220.0), (130.0, 370.0))) },
        ChannelVis { gate1: 20, gate2: 57, curve: Some(((110.0, 220.0), (80.0, 340.0))) },
        ChannelVis { gate1: 35, gate2: 36, curve: Some(((280.0, 200.0), (300.0, 350.0))) }, // Throat→SP curve right
        ChannelVis { gate1: 12, gate2: 22, curve: Some(((270.0, 210.0), (290.0, 350.0))) },
        ChannelVis { gate1: 45, gate2: 21, curve: None }, // Throat→Ego
        // G ↔ other
        ChannelVis { gate1: 10, gate2: 20, curve: None },
        ChannelVis { gate1: 10, gate2: 34, curve: Some(((150.0, 310.0), (145.0, 370.0))) },
        ChannelVis { gate1: 10, gate2: 57, curve: Some(((130.0, 310.0), (90.0, 360.0))) },
        ChannelVis { gate1: 25, gate2: 51, curve: None }, // G→Ego
        ChannelVis { gate1: 15, gate2: 5,  curve: None }, // G→Sacral
        ChannelVis { gate1: 46, gate2: 29, curve: None },
        ChannelVis { gate1: 2,  gate2: 14, curve: None },
        // Ego ↔ other
        ChannelVis { gate1: 26, gate2: 44, curve: Some(((200.0, 300.0), (110.0, 350.0))) }, // Ego→Spleen
        ChannelVis { gate1: 40, gate2: 37, curve: Some(((285.0, 300.0), (300.0, 360.0))) }, // Ego→SP
        // Spleen ↔ Root
        ChannelVis { gate1: 18, gate2: 58, curve: None },
        ChannelVis { gate1: 28, gate2: 38, curve: None },
        ChannelVis { gate1: 32, gate2: 54, curve: None },
        // Spleen ↔ Sacral
        ChannelVis { gate1: 50, gate2: 27, curve: None },
        ChannelVis { gate1: 57, gate2: 34, curve: None },
        // Solar Plexus ↔ Root
        ChannelVis { gate1: 49, gate2: 19, curve: Some(((280.0, 440.0), (240.0, 470.0))) },
        ChannelVis { gate1: 55, gate2: 39, curve: Some(((320.0, 430.0), (260.0, 465.0))) },
        ChannelVis { gate1: 30, gate2: 41, curve: Some(((310.0, 450.0), (250.0, 480.0))) },
        // Solar Plexus ↔ Sacral
        ChannelVis { gate1: 6,  gate2: 59, curve: None },
        // Sacral ↔ Root
        ChannelVis { gate1: 42, gate2: 53, curve: None },
        ChannelVis { gate1: 3,  gate2: 60, curve: None },
        ChannelVis { gate1: 9,  gate2: 52, curve: None },
    ]
}

// ─── Colors ───────────────────────────────────────────────────────────

fn center_color(c: Center) -> &'static str {
    match c {
        Center::Head         => "#f0e68c",  // soft yellow
        Center::Ajna         => "#5faa6a",  // green
        Center::Throat       => "#8b6b4a",  // brown
        Center::G            => "#d4a844",  // gold
        Center::HeartEgo     => "#cc4444",  // red
        Center::Spleen       => "#8b6b4a",  // brown
        Center::SolarPlexus  => "#8b6b4a",  // brown
        Center::Sacral       => "#cc4444",  // red
        Center::Root         => "#8b6b4a",  // brown
    }
}

// ─── SVG Generation ───────────────────────────────────────────────────

pub fn generate_svg(
    chart: &Chart,
    analysis: &ChartAnalysis,
    transit_gates: Option<&HashSet<u8>>,
) -> String {
    let mut svg = String::with_capacity(30000);

    let p_gates: HashSet<u8> = chart.personality.iter().map(|a| a.gate).collect();
    let d_gates: HashSet<u8> = chart.design.iter().map(|a| a.gate).collect();
    let all_natal: HashSet<u8> = p_gates.union(&d_gates).copied().collect();

    // Header
    write!(svg, r#"<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
  <style>
    .bg {{ fill: #f0ede8; }}
    .center-def {{ stroke-width: 1.5; }}
    .center-undef {{ fill: #e8e4df; stroke: #c0bbb5; stroke-width: 1; }}
    .ch-undef {{ stroke: #d5d0ca; stroke-width: 2; fill: none; opacity: 0.4; }}
    .ch-p {{ stroke: #333333; stroke-width: 3.5; fill: none; }}
    .ch-d {{ stroke: #cc3333; stroke-width: 3.5; fill: none; }}
    .ch-transit {{ stroke: #44aa55; stroke-width: 2.5; fill: none; stroke-dasharray: 6,3; }}
    .g-num {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; fill: #ffffff; text-anchor: middle; dominant-baseline: central; font-weight: bold; }}
    .g-num-p {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; fill: #333333; text-anchor: middle; dominant-baseline: central; font-weight: bold; }}
    .g-num-d {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; fill: #cc3333; text-anchor: middle; dominant-baseline: central; font-weight: bold; }}
    .g-num-dim {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7px; fill: #a09890; text-anchor: middle; dominant-baseline: central; }}
    .g-num-transit {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5px; fill: #44aa55; text-anchor: middle; dominant-baseline: central; font-weight: bold; }}
    .c-label {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7px; fill: #ffffff88; text-anchor: middle; dominant-baseline: central; }}
    .title {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; fill: #555555; text-anchor: middle; font-weight: 600; }}
    .subtitle {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; fill: #888888; text-anchor: middle; }}
  </style>
</defs>
<rect class="bg" width="{W}" height="{H}"/>
"#).unwrap();

    // Title area
    write!(svg, r#"<text class="subtitle" x="190" y="540">{} | {} | {} | Cross {}/{} | {}/{}</text>
"#,
        analysis.hd_type.name(), analysis.profile_name,
        analysis.authority,
        analysis.incarnation_cross.0, analysis.incarnation_cross.1,
        analysis.incarnation_cross.2, analysis.incarnation_cross.3,
    ).unwrap();

    // ── Draw channels ──
    let channels = channel_visuals();
    let all_ch = crate::gates::all_channels();

    for cv in &channels {
        let g1p = gate_pos(cv.gate1);
        let g2p = gate_pos(cv.gate2);
        if g1p.is_none() || g2p.is_none() { continue; }
        let (x1, y1) = g1p.unwrap();
        let (x2, y2) = g2p.unwrap();

        let g1_natal = all_natal.contains(&cv.gate1);
        let g2_natal = all_natal.contains(&cv.gate2);
        let g1_transit = transit_gates.map_or(false, |t| t.contains(&cv.gate1));
        let g2_transit = transit_gates.map_or(false, |t| t.contains(&cv.gate2));
        let g1_p = p_gates.contains(&cv.gate1);
        let g1_d = d_gates.contains(&cv.gate1);
        let g2_p = p_gates.contains(&cv.gate2);
        let g2_d = d_gates.contains(&cv.gate2);

        let defined = (g1_natal && g2_natal)
            || (g1_natal && g2_transit) || (g2_natal && g1_transit)
            || (g1_transit && g2_transit);

        let class = if !defined {
            "ch-undef"
        } else if (!g1_natal || !g2_natal) && (g1_transit || g2_transit) {
            "ch-transit"
        } else if (g1_d || g2_d) && !(g1_p || g2_p) {
            "ch-d"
        } else {
            "ch-p"
        };

        // Draw with optional curve
        if let Some(((cx1, cy1), (cx2, cy2))) = cv.curve {
            write!(svg, "<path d=\"M{:.0},{:.0} C{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" class=\"{}\"/>\n",
                x1, y1, cx1, cy1, cx2, cy2, x2, y2, class).unwrap();
        } else {
            write!(svg, "<line x1=\"{:.0}\" y1=\"{:.0}\" x2=\"{:.0}\" y2=\"{:.0}\" class=\"{}\"/>\n",
                x1, y1, x2, y2, class).unwrap();
        }

        // For defined channels with both P and D, draw second line slightly offset
        if defined && g1_natal && g2_natal && (g1_p || g2_p) && (g1_d || g2_d) {
            // Overlay red design line on top, slightly offset
            if let Some(((cx1, cy1), (cx2, cy2))) = cv.curve {
                write!(svg, "<path d=\"M{:.0},{:.0} C{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" stroke=\"#cc3333\" stroke-width=\"2\" fill=\"none\" opacity=\"0.7\"/>\n",
                    x1+1.5, y1, cx1+1.5, cy1, cx2+1.5, cy2, x2+1.5, y2).unwrap();
            } else {
                write!(svg, "<line x1=\"{:.0}\" y1=\"{:.0}\" x2=\"{:.0}\" y2=\"{:.0}\" stroke=\"#cc3333\" stroke-width=\"2\" fill=\"none\" opacity=\"0.7\"/>\n",
                    x1+1.5, y1, x2+1.5, y2).unwrap();
            }
        }
    }

    // ── Draw centers ──
    for cp in CPOS {
        let defined = analysis.defined_centers.contains(&cp.center);
        let fill = if defined { center_color(cp.center) } else { "#e8e4df" };
        let stroke = if defined { "#00000022" } else { "#c0bbb5" };
        let sw = if defined { "1.5" } else { "1" };

        match cp.center {
            Center::Head => {
                // Triangle/arrow pointing up
                let s = 24.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x, cp.y - s, cp.x - s * 0.9, cp.y + s * 0.5, cp.x + s * 0.9, cp.y + s * 0.5,
                    fill, stroke, sw).unwrap();
            }
            Center::Ajna => {
                // Triangle pointing down
                let s = 22.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x - s * 0.9, cp.y - s * 0.5, cp.x + s * 0.9, cp.y - s * 0.5, cp.x, cp.y + s,
                    fill, stroke, sw).unwrap();
            }
            Center::HeartEgo => {
                // Small triangle pointing right
                let s = 18.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x - s * 0.5, cp.y - s, cp.x - s * 0.5, cp.y + s, cp.x + s, cp.y,
                    fill, stroke, sw).unwrap();
            }
            Center::Spleen => {
                // Triangle pointing right (toward body center)
                let s = 22.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x - s * 0.6, cp.y - s, cp.x - s * 0.6, cp.y + s, cp.x + s, cp.y,
                    fill, stroke, sw).unwrap();
            }
            Center::SolarPlexus => {
                // Triangle pointing left (toward body center)
                let s = 22.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x + s * 0.6, cp.y - s, cp.x + s * 0.6, cp.y + s, cp.x - s, cp.y,
                    fill, stroke, sw).unwrap();
            }
            Center::G => {
                // Diamond
                let s = 24.0;
                write!(svg, "<polygon points=\"{:.0},{:.0} {:.0},{:.0} {:.0},{:.0} {:.0},{:.0}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x, cp.y - s, cp.x + s, cp.y, cp.x, cp.y + s, cp.x - s, cp.y,
                    fill, stroke, sw).unwrap();
            }
            _ => {
                // Square (Throat, Sacral, Root)
                let hw = 28.0;
                let hh = 22.0;
                write!(svg, "<rect x=\"{:.0}\" y=\"{:.0}\" width=\"{:.0}\" height=\"{:.0}\" rx=\"3\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\"/>\n",
                    cp.x - hw, cp.y - hh, hw * 2.0, hh * 2.0,
                    fill, stroke, sw).unwrap();
            }
        }
    }

    // ── Draw gate numbers inside centers ──
    for &(gate, gx, gy) in GATE_POSITIONS {
        let in_p = p_gates.contains(&gate);
        let in_d = d_gates.contains(&gate);
        let in_t = transit_gates.map_or(false, |t| t.contains(&gate));

        let class = if in_p && in_d {
            // Both - show in bold white with background
            write!(svg, "<circle cx=\"{:.0}\" cy=\"{:.0}\" r=\"7\" fill=\"#7733aa\" opacity=\"0.8\"/>\n", gx, gy).unwrap();
            "g-num"
        } else if in_p {
            "g-num-p"
        } else if in_d {
            "g-num-d"
        } else if in_t {
            "g-num-transit"
        } else {
            "g-num-dim"
        };

        write!(svg, "<text class=\"{}\" x=\"{:.0}\" y=\"{:.0}\">{}</text>\n",
            class, gx, gy, gate).unwrap();
    }

    svg.push_str("</svg>\n");
    svg
}
