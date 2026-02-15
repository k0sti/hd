use colored::Colorize;
use crate::chart::Chart;
use crate::types::ChartAnalysis;
use crate::transit::TransitOverlay;

pub fn print_header(date: &str, time: &str, location: &str) {
    println!();
    println!("{}", "═══════════════════════════════════════════════════════".bright_cyan());
    println!("{}", "              HUMAN DESIGN CHART".bright_cyan().bold());
    println!("{}", "═══════════════════════════════════════════════════════".bright_cyan());
    println!("  {} {} {} {} {}",
        "Birth:".dimmed(), date.white(), time.white(),
        "at".dimmed(), location.white());
    println!();
}

pub fn print_summary(analysis: &ChartAnalysis) {
    println!("{}", "───── Chart Summary ─────".bright_yellow().bold());
    println!("  {}          {}", "Type:".bright_white(), analysis.hd_type.name().bright_green().bold());
    println!("  {}      {}", "Strategy:".bright_white(), analysis.hd_type.strategy().green());
    println!("  {}     {}", "Authority:".bright_white(), analysis.authority.green());
    println!("  {}       {} ({})", "Profile:".bright_white(),
        format!("{}/{}", analysis.profile.0, analysis.profile.1).bright_green().bold(),
        analysis.profile_name.dimmed());
    println!("  {}     {}", "Signature:".bright_white(), analysis.hd_type.signature().green());
    println!("  {}      {}", "Not-Self:".bright_white(), analysis.hd_type.not_self().red());
    println!("  {} {}/{} | {}/{}",
        "Inc. Cross:".bright_white(),
        analysis.incarnation_cross.0.to_string().bright_cyan(),
        analysis.incarnation_cross.1.to_string().bright_cyan(),
        analysis.incarnation_cross.2.to_string().red(),
        analysis.incarnation_cross.3.to_string().red());
    println!();
}

pub fn print_activations(chart: &Chart) {
    println!("{}", "───── Personality (Conscious ●) ─────".bright_white().bold());
    for a in &chart.personality {
        println!("  {:12}  Gate {:>2}.{}", a.planet, a.gate.to_string().bright_cyan(), a.line);
    }

    println!();
    println!("{}", "───── Design (Unconscious ●) ─────".red().bold());
    for a in &chart.design {
        println!("  {:12}  Gate {:>2}.{}", a.planet, a.gate.to_string().red(), a.line);
    }
    println!();
}

pub fn print_channels(analysis: &ChartAnalysis) {
    println!("{}", "───── Defined Channels ─────".bright_magenta().bold());
    if analysis.defined_channels.is_empty() {
        println!("  {}", "None (Reflector)".dimmed());
    }
    for ch in &analysis.defined_channels {
        println!("  {}-{}: {} ({} ↔ {})",
            ch.gate1.to_string().bright_cyan(),
            ch.gate2.to_string().bright_cyan(),
            ch.name.white().bold(),
            ch.center1.name().dimmed(),
            ch.center2.name().dimmed());
    }
    println!();
}

pub fn print_centers(analysis: &ChartAnalysis) {
    println!("{}", "───── Centers ─────".bright_blue().bold());
    let all = [
        crate::gates::Center::Head,
        crate::gates::Center::Ajna,
        crate::gates::Center::Throat,
        crate::gates::Center::G,
        crate::gates::Center::HeartEgo,
        crate::gates::Center::SolarPlexus,
        crate::gates::Center::Sacral,
        crate::gates::Center::Spleen,
        crate::gates::Center::Root,
    ];
    for c in &all {
        if analysis.defined_centers.contains(c) {
            println!("  {} {}", "■".bright_yellow(), c.name().bright_white());
        } else {
            println!("  {} {}", "□".dimmed(), c.name().dimmed());
        }
    }
    println!();
}

pub fn print_transits(overlay: &TransitOverlay) {
    println!("{}", "═══════════════════════════════════════════════════════".bright_cyan());
    println!("{}", "              CURRENT TRANSITS".bright_cyan().bold());
    println!("{}", "═══════════════════════════════════════════════════════".bright_cyan());
    println!();

    println!("{}", "───── Transit Positions ─────".bright_yellow().bold());
    for a in &overlay.transit_positions {
        println!("  {:12}  Gate {:>2}.{}", a.planet, a.gate.to_string().yellow(), a.line);
    }
    println!();

    if !overlay.completed_channels.is_empty() {
        println!("{}", "───── Transit-Activated Channels ─────".bright_green().bold());
        for ch in &overlay.completed_channels {
            if ch.natal_gate == 0 {
                println!("  {}-{}: {} {} ({} ↔ {})",
                    ch.gate1.to_string().yellow(),
                    ch.gate2.to_string().yellow(),
                    ch.name.white().bold(),
                    "[pure transit]".dimmed(),
                    ch.center1.name().dimmed(),
                    ch.center2.name().dimmed());
            } else {
                println!("  {}-{}: {} (natal {} + transit {}) ({} ↔ {})",
                    ch.gate1.to_string().bright_green(),
                    ch.gate2.to_string().bright_green(),
                    ch.name.white().bold(),
                    ch.natal_gate.to_string().bright_cyan(),
                    ch.transit_gate.to_string().yellow(),
                    ch.center1.name().dimmed(),
                    ch.center2.name().dimmed());
            }
        }
    } else {
        println!("  {}", "No additional channels activated by current transits.".dimmed());
    }
    println!();
}
