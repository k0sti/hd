use std::collections::HashSet;
use crate::chart::Chart;
use crate::gates::{Center, all_channels};
use crate::types::ChartAnalysis;

/// Base SVG template from hdkit (MIT license, Jonah Dempcy 2023)
const TEMPLATE: &str = include_str!("../assets/bodygraph-blank.svg");

// Colors matching traditional HD bodygraph
const COLOR_PERSONALITY: &str = "#333333";    // black (conscious)
const COLOR_DESIGN: &str = "#A44344";         // red (unconscious)
const COLOR_BOTH_P: &str = "#333333";         // split: personality half
const COLOR_BOTH_D: &str = "#A44344";         // split: design half
const COLOR_TRANSIT: &str = "#44aa55";        // green (transit activation)
const COLOR_UNDEFINED: &str = "#e0ddd8";       // light gray (inactive gate/channel)
const COLOR_GATE_TEXT_ACTIVE: &str = "#343434"; // dark text for active gates
const COLOR_GATE_BG_ACTIVE: &str = "#EFEFEF"; // light bg for active gate numbers

// Center colors when defined
fn center_color(c: Center) -> &'static str {
    match c {
        Center::Head         => "#F9F6C4",
        Center::Ajna         => "#48BB78",
        Center::Throat       => "#655144",
        Center::G            => "#F9F6C4",
        Center::HeartEgo     => "#F56565",
        Center::SolarPlexus  => "#655144",
        Center::Sacral       => "#F56565",
        Center::Spleen       => "#655144",
        Center::Root         => "#655144",
    }
}

fn center_svg_id(c: Center) -> &'static str {
    match c {
        Center::Head         => "Head",
        Center::Ajna         => "Ajna",
        Center::Throat       => "Throat",
        Center::G            => "G",
        Center::HeartEgo     => "Ego",
        Center::SolarPlexus  => "SolarPlexus",
        Center::Sacral       => "Sacral",
        Center::Spleen       => "Spleen",
        Center::Root         => "Root",
    }
}

/// Generate an SVG bodygraph by modifying the hdkit template.
///
/// Strategy: parse the SVG as text, find elements by id, replace their fill attributes.
/// This avoids needing an XML parser dependency.
pub fn generate_svg(
    chart: &Chart,
    analysis: &ChartAnalysis,
    transit_gates: Option<&HashSet<u8>>,
) -> String {
    let p_gates: HashSet<u8> = chart.personality.iter().map(|a| a.gate).collect();
    let d_gates: HashSet<u8> = chart.design.iter().map(|a| a.gate).collect();
    let all_natal: HashSet<u8> = p_gates.union(&d_gates).copied().collect();
    let empty = HashSet::new();
    let t_gates = transit_gates.unwrap_or(&empty);

    let mut svg = TEMPLATE.to_string();

    // 1. Color all gate channels — active ones in personality/design colors, inactive in gray
    for gate_num in 1u8..=64 {
        let in_p = p_gates.contains(&gate_num);
        let in_d = d_gates.contains(&gate_num);
        let in_t = t_gates.contains(&gate_num);

        let color = if in_p && in_d {
            COLOR_PERSONALITY
        } else if in_p {
            COLOR_PERSONALITY
        } else if in_d {
            COLOR_DESIGN
        } else if in_t {
            COLOR_TRANSIT
        } else {
            COLOR_UNDEFINED
        };

        // Color the gate channel path
        svg = replace_element_fill(&svg, &format!("Gate{}", gate_num), color);

        if in_p || in_d || in_t {
            // Color the gate text and background for active gates
            svg = replace_element_fill(&svg, &format!("GateText{}", gate_num), COLOR_GATE_TEXT_ACTIVE);
            svg = replace_gate_bg_fill(&svg, &format!("GateTextBg{}", gate_num), COLOR_GATE_BG_ACTIVE);
        }
    }

    // 2. Color defined centers
    let all_centers = [
        Center::Head, Center::Ajna, Center::Throat, Center::G,
        Center::HeartEgo, Center::SolarPlexus, Center::Sacral,
        Center::Spleen, Center::Root,
    ];

    // Also check if transits complete any channels (making additional centers defined)
    let channels = all_channels();
    let mut transit_defined_centers: HashSet<Center> = HashSet::new();
    for ch in &channels {
        let g1_active = all_natal.contains(&ch.gate1) || t_gates.contains(&ch.gate1);
        let g2_active = all_natal.contains(&ch.gate2) || t_gates.contains(&ch.gate2);
        if g1_active && g2_active {
            // Only count as transit-defined if at least one gate is transit-only
            let g1_transit_only = !all_natal.contains(&ch.gate1) && t_gates.contains(&ch.gate1);
            let g2_transit_only = !all_natal.contains(&ch.gate2) && t_gates.contains(&ch.gate2);
            if g1_transit_only || g2_transit_only {
                transit_defined_centers.insert(ch.center1);
                transit_defined_centers.insert(ch.center2);
            }
        }
    }

    for &center in &all_centers {
        if analysis.defined_centers.contains(&center) {
            let color = center_color(center);
            let id = center_svg_id(center);
            svg = replace_center_fill(&svg, id, color);
        } else if transit_defined_centers.contains(&center) {
            // Transit-activated centers get a lighter version
            svg = replace_center_fill(&svg, center_svg_id(center), "#d4edda");
        }
    }

    // 3. Handle the special GateSpan/Connect elements — default to gray
    svg = replace_element_fill(&svg, "GateSpan", COLOR_UNDEFINED);
    svg = replace_element_fill(&svg, "GateConnect10", COLOR_UNDEFINED);
    svg = replace_element_fill(&svg, "GateConnect34", COLOR_UNDEFINED);

    // Override with active color if relevant gates are active
    let span_active = (all_natal.contains(&34) || t_gates.contains(&34))
        && (all_natal.contains(&20) || t_gates.contains(&20))
        || (all_natal.contains(&10) || t_gates.contains(&10))
        && (all_natal.contains(&57) || t_gates.contains(&57));

    if span_active {
        let color = if p_gates.contains(&34) || p_gates.contains(&20) {
            COLOR_PERSONALITY
        } else {
            COLOR_DESIGN
        };
        svg = replace_element_fill(&svg, "GateSpan", color);
        svg = replace_element_fill(&svg, "GateConnect10", color);
        svg = replace_element_fill(&svg, "GateConnect34", color);
    }

    svg
}

/// Replace the `fill` attribute of an element found by its `id` attribute.
/// Handles both `<path id="GateXX" ... fill="#fff" ...>` patterns.
fn replace_element_fill(svg: &str, element_id: &str, new_fill: &str) -> String {
    // Find the element by id — look for id="<element_id>"
    let id_pattern = format!("id=\"{}\"", element_id);

    if let Some(id_pos) = svg.find(&id_pattern) {
        // Find the start of this element's tag
        let tag_start = svg[..id_pos].rfind('<').unwrap_or(id_pos);
        // Find the end of this tag (could be self-closing or not)
        let remaining = &svg[tag_start..];
        let tag_end_offset = if let Some(sc) = remaining.find("/>") {
            if let Some(gt) = remaining.find('>') {
                sc.min(gt) + if sc < gt { 2 } else { 1 }
            } else {
                sc + 2
            }
        } else if let Some(gt) = remaining.find('>') {
            gt + 1
        } else {
            return svg.to_string();
        };

        let tag = &svg[tag_start..tag_start + tag_end_offset];

        // Check if it's a <text> element — for text, replace fill= attribute
        if tag.starts_with("<text") {
            if let Some(fill_start) = tag.find("fill=\"") {
                let after_fill = &tag[fill_start + 6..];
                if let Some(fill_end) = after_fill.find('"') {
                    let old_tag = tag.to_string();
                    let new_tag = format!(
                        "{}{}{}",
                        &tag[..fill_start + 6],
                        new_fill,
                        &tag[fill_start + 6 + fill_end..]
                    );
                    return svg.replacen(&old_tag, &new_tag, 1);
                }
            }
        }

        // For path/polygon/polyline elements
        if let Some(fill_start) = tag.find("fill=\"") {
            let after_fill = &tag[fill_start + 6..];
            if let Some(fill_end) = after_fill.find('"') {
                let old_tag = tag.to_string();
                let new_tag = format!(
                    "{}{}{}",
                    &tag[..fill_start + 6],
                    new_fill,
                    &tag[fill_start + 6 + fill_end..]
                );
                return svg.replacen(&old_tag, &new_tag, 1);
            }
        }
    }
    svg.to_string()
}

/// Replace fill in gate text background groups.
/// These contain a <path> or <circle> child — we need to find the child and change its fill.
fn replace_gate_bg_fill(svg: &str, group_id: &str, new_fill: &str) -> String {
    let id_pattern = format!("id=\"{}\"", group_id);
    if let Some(id_pos) = svg.find(&id_pattern) {
        // Find the closing </g> for this group
        let after_id = &svg[id_pos..];
        if let Some(close_g) = after_id.find("</g>") {
            let group_content = &svg[id_pos..id_pos + close_g];
            // Find the first fill="transparent" in child elements
            if let Some(fill_pos) = group_content.find("fill=\"transparent\"") {
                let abs_pos = id_pos + fill_pos;
                let mut result = svg.to_string();
                result.replace_range(
                    abs_pos..abs_pos + "fill=\"transparent\"".len(),
                    &format!("fill=\"{}\"", new_fill),
                );
                return result;
            }
        }
    }
    svg.to_string()
}

/// Replace fill for a center element (which is a <g> containing a <path>).
fn replace_center_fill(svg: &str, center_id: &str, new_fill: &str) -> String {
    let id_pattern = format!("id=\"{}\"", center_id);

    // Find in the Centers group specifically
    if let Some(centers_pos) = svg.find("id=\"Centers\"") {
        let centers_section = &svg[centers_pos..];
        if let Some(id_offset) = centers_section.find(&id_pattern) {
            let abs_pos = centers_pos + id_offset;
            let after_id = &svg[abs_pos..];

            // Find the <path ... fill="#fff"/> inside this group
            if let Some(path_pos) = after_id.find("<path") {
                let path_abs = abs_pos + path_pos;
                let path_rest = &svg[path_abs..];

                if let Some(fill_pos) = path_rest.find("fill=\"") {
                    // Make sure this fill is within the same tag (before >)
                    let tag_end = path_rest.find("/>").or_else(|| path_rest.find('>')).unwrap_or(500);
                    if fill_pos < tag_end {
                        let fill_abs = path_abs + fill_pos + 6;
                        if let Some(fill_end) = svg[fill_abs..].find('"') {
                            let mut result = svg.to_string();
                            result.replace_range(fill_abs..fill_abs + fill_end, new_fill);
                            return result;
                        }
                    }
                }
            }
        }
    }
    svg.to_string()
}
