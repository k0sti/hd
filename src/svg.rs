use std::collections::{HashMap, HashSet};
use std::fmt::Write;
use crate::chart::{Activation, Chart};
use crate::gates::Center;
use crate::types::{ChartAnalysis, DefinedChannel};

/// Standard bodygraph center positions (canvas 420x680)
/// Based on the canonical Human Design bodygraph layout
struct CenterLayout {
    center: Center,
    x: f64,
    y: f64,
    w: f64,  // width
    h: f64,  // height
}

// Canonical bodygraph layout — symmetrical, vertically stacked
const CENTERS: &[CenterLayout] = &[
    CenterLayout { center: Center::Head,         x: 210.0, y: 52.0,  w: 44.0, h: 38.0 },
    CenterLayout { center: Center::Ajna,         x: 210.0, y: 128.0, w: 44.0, h: 38.0 },
    CenterLayout { center: Center::Throat,       x: 210.0, y: 214.0, w: 48.0, h: 40.0 },
    CenterLayout { center: Center::G,            x: 210.0, y: 322.0, w: 42.0, h: 42.0 },
    CenterLayout { center: Center::HeartEgo,     x: 138.0, y: 290.0, w: 36.0, h: 32.0 },
    CenterLayout { center: Center::Spleen,       x: 118.0, y: 420.0, w: 38.0, h: 38.0 },
    CenterLayout { center: Center::SolarPlexus,  x: 302.0, y: 420.0, w: 38.0, h: 38.0 },
    CenterLayout { center: Center::Sacral,       x: 210.0, y: 460.0, w: 48.0, h: 36.0 },
    CenterLayout { center: Center::Root,         x: 210.0, y: 560.0, w: 48.0, h: 40.0 },
];

fn center_pos(c: Center) -> (f64, f64) {
    for cl in CENTERS {
        if cl.center == c { return (cl.x, cl.y); }
    }
    (210.0, 350.0)
}

/// Channel path definitions: each channel connects two gate positions.
/// Gate positions are on the edge of their parent center, aimed toward the other center.
fn channel_endpoints(gate1: u8, gate2: u8) -> ((f64, f64), (f64, f64)) {
    // Get the center for each gate
    let c1 = crate::gates::gate_center(gate1);
    let c2 = crate::gates::gate_center(gate2);
    let (cx1, cy1) = center_pos(c1);
    let (cx2, cy2) = center_pos(c2);

    // Offset gates slightly from center to avoid overlap
    let gate_offset_on_center = gate_slot_offset(gate1, c1, c2);
    let gate_offset_on_center2 = gate_slot_offset(gate2, c2, c1);

    let p1 = point_toward(cx1, cy1, cx2, cy2, 25.0, gate_offset_on_center);
    let p2 = point_toward(cx2, cy2, cx1, cy1, 25.0, gate_offset_on_center2);
    (p1, p2)
}

/// Calculate a point starting from (cx,cy) moving toward (tx,ty), distance d from center
/// with a lateral offset for gate slot separation
fn point_toward(cx: f64, cy: f64, tx: f64, ty: f64, dist: f64, lateral: f64) -> (f64, f64) {
    let dx = tx - cx;
    let dy = ty - cy;
    let len = (dx * dx + dy * dy).sqrt().max(1.0);
    let ux = dx / len;
    let uy = dy / len;
    // Perpendicular
    let px = -uy;
    let py = ux;
    (cx + ux * dist + px * lateral, cy + uy * dist + py * lateral)
}

/// Gate slot offset to space out multiple channels from the same center
fn gate_slot_offset(gate: u8, from: Center, _to: Center) -> f64 {
    // Group gates by center and assign lateral offsets so they don't overlap
    match (gate, from) {
        // Head
        (64, _) => -8.0, (61, _) => 0.0, (63, _) => 8.0,
        // Ajna
        (47, _) => -10.0, (24, _) => -5.0, (4, _) => 5.0,
        (17, _) => -5.0, (43, _) => 5.0, (11, _) => 10.0,
        // Throat — many gates, spread wide
        (62, _) => -18.0, (23, _) => -12.0, (56, _) => 12.0,
        (35, _) => 18.0, (12, _) => 14.0, (45, _) => -16.0,
        (33, _) => 16.0, (8, _) => 6.0, (31, _) => -6.0,
        (7, _) => -4.0, (1, _) => 4.0, (13, _) => 10.0,
        (20, _) => -10.0, (16, _) => -14.0,
        // G
        (10, _) => -8.0, (25, _) => 8.0, (46, _) => 6.0,
        (2, _) => -4.0, (15, _) => 4.0,
        // Heart/Ego
        (21, _) => -6.0, (51, _) => 6.0, (26, _) => -3.0, (40, _) => 3.0,
        // Spleen
        (48, _) => -8.0, (57, _) => -3.0, (44, _) => 3.0,
        (50, _) => 5.0, (32, _) => 8.0, (28, _) => -5.0, (18, _) => 10.0,
        // Solar Plexus
        (36, _) => -8.0, (22, _) => -5.0, (6, _) => 0.0,
        (37, _) => -3.0, (49, _) => 5.0, (55, _) => 8.0, (30, _) => 3.0,
        // Sacral
        (5, _) => -10.0, (14, _) => -6.0, (29, _) => 6.0,
        (59, _) => 10.0, (9, _) => -8.0, (3, _) => 0.0,
        (42, _) => 4.0, (27, _) => -4.0, (34, _) => 8.0,
        // Root
        (58, _) => -12.0, (38, _) => -8.0, (54, _) => -4.0,
        (53, _) => 0.0, (60, _) => 4.0, (52, _) => 8.0,
        (19, _) => 10.0, (39, _) => 14.0, (41, _) => 12.0,
        _ => 0.0,
    }
}

/// Generate SVG bodygraph
pub fn generate_svg(
    chart: &Chart,
    analysis: &ChartAnalysis,
    transit_gates: Option<&HashSet<u8>>,
) -> String {
    let mut svg = String::with_capacity(20000);

    let p_gates: HashSet<u8> = chart.personality.iter().map(|a| a.gate).collect();
    let d_gates: HashSet<u8> = chart.design.iter().map(|a| a.gate).collect();
    let all_natal: HashSet<u8> = p_gates.union(&d_gates).copied().collect();

    // SVG header with dark theme
    write!(svg, r#"<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 640" width="420" height="640">
<defs>
  <style>
    .bg {{ fill: #0d0d1a; }}
    .center-def {{ stroke-width: 2; }}
    .center-undef {{ fill: #1a1a2a; stroke: #333355; stroke-width: 1.5; }}
    .ch-undef {{ stroke: #1e1e30; stroke-width: 2; fill: none; }}
    .ch-p {{ stroke: #222222; stroke-width: 4; fill: none; }}
    .ch-d {{ stroke: #cc2222; stroke-width: 4; fill: none; }}
    .ch-both {{ stroke-width: 4; fill: none; }}
    .ch-transit {{ stroke: #22aa55; stroke-width: 3; fill: none; stroke-dasharray: 8,4; }}
    .g-p {{ fill: #222222; stroke: #555555; stroke-width: 1; }}
    .g-d {{ fill: #cc2222; stroke: #ff4444; stroke-width: 1; }}
    .g-both {{ fill: #7733aa; stroke: #aa55dd; stroke-width: 1; }}
    .g-transit {{ fill: #22aa55; stroke: #44dd77; stroke-width: 1; }}
    .g-num {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7.5px; fill: #ffffff; text-anchor: middle; dominant-baseline: central; font-weight: bold; }}
    .g-num-dim {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 6px; fill: #444466; text-anchor: middle; dominant-baseline: central; }}
    .c-label {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; fill: #888899; text-anchor: middle; dominant-baseline: central; }}
    .title {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; fill: #ccccee; text-anchor: middle; font-weight: 600; }}
    .subtitle {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9px; fill: #8888aa; text-anchor: middle; }}
    .legend {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 7px; fill: #888899; }}
  </style>
</defs>
<rect class="bg" width="420" height="640" rx="10"/>
"#).unwrap();

    // Title
    write!(svg, r#"<text class="title" x="210" y="18">{} — Profile {}/{}</text>
<text class="subtitle" x="210" y="32">{} | {} | Cross {}/{} | {}/{}</text>
"#,
        analysis.hd_type.name(), analysis.profile.0, analysis.profile.1,
        analysis.hd_type.strategy(), analysis.authority,
        analysis.incarnation_cross.0, analysis.incarnation_cross.1,
        analysis.incarnation_cross.2, analysis.incarnation_cross.3,
    ).unwrap();

    // Draw channels first (behind centers)
    let channels = crate::gates::all_channels();
    for ch in &channels {
        let g1_natal = all_natal.contains(&ch.gate1);
        let g2_natal = all_natal.contains(&ch.gate2);
        let g1_transit = transit_gates.map_or(false, |t| t.contains(&ch.gate1));
        let g2_transit = transit_gates.map_or(false, |t| t.contains(&ch.gate2));
        let g1_p = p_gates.contains(&ch.gate1);
        let g1_d = d_gates.contains(&ch.gate1);
        let g2_p = p_gates.contains(&ch.gate2);
        let g2_d = d_gates.contains(&ch.gate2);

        let ((x1, y1), (x2, y2)) = channel_endpoints(ch.gate1, ch.gate2);

        let defined = (g1_natal && g2_natal)
            || (g1_natal && g2_transit) || (g2_natal && g1_transit)
            || (g1_transit && g2_transit);

        if defined {
            let is_transit_only = !g1_natal || !g2_natal;
            if is_transit_only {
                write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" class="ch-transit"/>
"#, x1, y1, x2, y2).unwrap();
            } else {
                // Check if personality, design, or both
                let has_p = g1_p || g2_p;
                let has_d = g1_d || g2_d;
                if has_p && has_d {
                    // Draw split channel: half personality, half design
                    let mx = (x1 + x2) / 2.0;
                    let my = (y1 + y2) / 2.0;
                    write!(svg, "<line x1=\"{:.1}\" y1=\"{:.1}\" x2=\"{:.1}\" y2=\"{:.1}\" class=\"ch-p\"/>\n\
                    <line x1=\"{:.1}\" y1=\"{:.1}\" x2=\"{:.1}\" y2=\"{:.1}\" class=\"ch-d\"/>\n",
                    x1, y1, mx, my, mx, my, x2, y2).unwrap();
                } else if has_p {
                    write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" class="ch-p"/>
"#, x1, y1, x2, y2).unwrap();
                } else {
                    write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" class="ch-d"/>
"#, x1, y1, x2, y2).unwrap();
                }
            }
        } else {
            write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" class="ch-undef"/>
"#, x1, y1, x2, y2).unwrap();
        }
    }

    // Draw centers
    let center_colors: HashMap<Center, &str> = [
        (Center::Head, "#f5c542"),
        (Center::Ajna, "#4aad52"),
        (Center::Throat, "#c0834a"),
        (Center::G, "#d4a844"),
        (Center::HeartEgo, "#d44a4a"),
        (Center::SolarPlexus, "#c05a30"),
        (Center::Sacral, "#cc3333"),
        (Center::Spleen, "#a06030"),
        (Center::Root, "#c04040"),
    ].into_iter().collect();

    for cl in CENTERS {
        let defined = analysis.defined_centers.contains(&cl.center);
        let fill = if defined {
            center_colors.get(&cl.center).unwrap_or(&"#555588")
        } else {
            "#1a1a2a"
        };
        let stroke = if defined { "#ffffff44" } else { "#333355" };

        match cl.center {
            Center::Head | Center::Ajna => {
                // Triangle pointing up
                let s = cl.w / 2.0;
                write!(svg, r#"<polygon points="{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x, cl.y - s, cl.x - s, cl.y + s * 0.7, cl.x + s, cl.y + s * 0.7,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
            Center::SolarPlexus => {
                // Triangle pointing down (right side)
                let s = cl.w / 2.0;
                write!(svg, r#"<polygon points="{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x - s, cl.y - s * 0.7, cl.x + s, cl.y - s * 0.7, cl.x, cl.y + s,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
            Center::Spleen => {
                // Triangle pointing left
                let s = cl.w / 2.0;
                write!(svg, r#"<polygon points="{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x - s, cl.y, cl.x + s * 0.7, cl.y - s, cl.x + s * 0.7, cl.y + s,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
            Center::HeartEgo => {
                // Small triangle
                let s = cl.w / 2.0;
                write!(svg, r#"<polygon points="{:.0},{:.0} {:.0},{:.0} {:.0},{:.0}" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x, cl.y - s, cl.x - s, cl.y + s * 0.7, cl.x + s, cl.y + s * 0.7,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
            Center::G => {
                // Diamond
                let s = cl.w / 2.0;
                write!(svg, r#"<polygon points="{:.0},{:.0} {:.0},{:.0} {:.0},{:.0} {:.0},{:.0}" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x, cl.y - s, cl.x + s, cl.y, cl.x, cl.y + s, cl.x - s, cl.y,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
            _ => {
                // Square (Throat, Sacral, Root)
                write!(svg, r#"<rect x="{:.0}" y="{:.0}" width="{:.0}" height="{:.0}" rx="4" fill="{}" stroke="{}" stroke-width="{}"/>
"#, cl.x - cl.w / 2.0, cl.y - cl.h / 2.0, cl.w, cl.h,
                    fill, stroke, if defined { "2" } else { "1.5" }).unwrap();
            }
        }

        // Center label
        write!(svg, r#"<text class="c-label" x="{:.0}" y="{:.0}">{}</text>
"#, cl.x, cl.y + 2.0, cl.label()).unwrap();
    }

    // Draw gate circles on channels
    for &gate in &ALL_GATES {
        let center = crate::gates::gate_center(gate);
        let in_p = p_gates.contains(&gate);
        let in_d = d_gates.contains(&gate);
        let in_t = transit_gates.map_or(false, |t| t.contains(&gate));
        let active = in_p || in_d || in_t;

        if !active { continue; }

        // Find a channel that uses this gate to position it
        let pos = find_gate_visual_pos(gate, center);

        let (class, r) = if in_p && in_d {
            ("g-both", 7.5)
        } else if in_p {
            ("g-p", 7.0)
        } else if in_d {
            ("g-d", 7.0)
        } else {
            ("g-transit", 6.5)
        };

        write!(svg, r#"<circle cx="{:.1}" cy="{:.1}" r="{}" class="{}"/><text class="g-num" x="{:.1}" y="{:.1}">{}</text>
"#, pos.0, pos.1, r, class, pos.0, pos.1, gate).unwrap();
    }

    // Legend
    let ly = 612.0;
    let ly1 = ly + 11.0;
    let ly2 = ly + 14.0;
    write!(svg, "<rect x=\"20\" y=\"{}\" width=\"380\" height=\"22\" rx=\"4\" fill=\"#111122\"/>\n\
<circle cx=\"40\" cy=\"{}\" r=\"4\" class=\"g-p\"/><text class=\"legend\" x=\"48\" y=\"{}\">Personality</text>\n\
<circle cx=\"115\" cy=\"{}\" r=\"4\" class=\"g-d\"/><text class=\"legend\" x=\"123\" y=\"{}\">Design</text>\n\
<circle cx=\"170\" cy=\"{}\" r=\"4\" class=\"g-both\"/><text class=\"legend\" x=\"178\" y=\"{}\">Both</text>\n\
<circle cx=\"210\" cy=\"{}\" r=\"4\" class=\"g-transit\"/><text class=\"legend\" x=\"218\" y=\"{}\">Transit</text>\n",
        ly, ly1, ly2, ly1, ly2, ly1, ly2, ly1, ly2).unwrap();

    svg.push_str("</svg>\n");
    svg
}

impl CenterLayout {
    fn label(&self) -> &'static str {
        match self.center {
            Center::Head => "Head",
            Center::Ajna => "Ajna",
            Center::Throat => "Throat",
            Center::G => "G",
            Center::HeartEgo => "Ego",
            Center::SolarPlexus => "SP",
            Center::Sacral => "Sacral",
            Center::Spleen => "Spleen",
            Center::Root => "Root",
        }
    }
}

const ALL_GATES: [u8; 64] = [
    1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,
    25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,
    46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64
];

/// Find visual position for a gate — placed between its center and a connected center
fn find_gate_visual_pos(gate: u8, center: Center) -> (f64, f64) {
    let (cx, cy) = center_pos(center);
    // Find which channel this gate belongs to and compute position along it
    let channels = crate::gates::all_channels();
    for ch in &channels {
        if ch.gate1 == gate {
            let (tx, ty) = center_pos(ch.center2);
            let offset = gate_slot_offset(gate, center, ch.center2);
            return point_toward(cx, cy, tx, ty, 32.0, offset);
        }
        if ch.gate2 == gate {
            let (tx, ty) = center_pos(ch.center1);
            let offset = gate_slot_offset(gate, center, ch.center1);
            return point_toward(cx, cy, tx, ty, 32.0, offset);
        }
    }
    // Gate not in any channel — place near center
    (cx + 20.0, cy)
}
