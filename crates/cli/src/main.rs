mod chart;
mod display;
mod gates;
mod svg;
mod transit;
mod types;

use clap::Parser;
use std::collections::HashSet;

#[derive(Parser)]
#[command(name = "hd", about = "Human Design Chart Calculator")]
struct Args {
    /// Birth date (YYYY-MM-DD)
    #[arg(short, long)]
    date: String,

    /// Birth time (HH:MM)
    #[arg(short, long)]
    time: String,

    /// Timezone offset from UTC (e.g., +2 for EET)
    #[arg(long, default_value = "+2")]
    tz: String,

    /// Location name (for display only)
    #[arg(short, long, default_value = "Joensuu, Finland")]
    location: String,

    /// Include current transit overlay
    #[arg(long)]
    transit: bool,

    /// Output SVG bodygraph to file
    #[arg(long)]
    svg: Option<String>,
}

fn main() {
    let args = Args::parse();

    // Parse date
    let parts: Vec<&str> = args.date.split('-').collect();
    let year: i32 = parts[0].parse().expect("Invalid year");
    let month: u32 = parts[1].parse().expect("Invalid month");
    let day: u32 = parts[2].parse().expect("Invalid day");

    // Parse time
    let time_parts: Vec<&str> = args.time.split(':').collect();
    let hour: f64 = time_parts[0].parse::<f64>().unwrap()
        + time_parts[1].parse::<f64>().unwrap() / 60.0;

    // Parse timezone
    let tz: f64 = args.tz.replace("+", "").parse().expect("Invalid timezone offset");

    // Calculate chart
    let hd_chart = chart::calculate_chart(year, month, day, hour, tz);

    // Analyze
    let analysis = types::analyze(&hd_chart);

    // Display
    display::print_header(&args.date, &args.time, &args.location);
    display::print_summary(&analysis);
    display::print_activations(&hd_chart);
    display::print_channels(&analysis);
    display::print_centers(&analysis);

    // Transit overlay
    let mut transit_gate_set: Option<HashSet<u8>> = None;
    if args.transit {
        let transit_positions = chart::calculate_transit();

        // Collect natal gates
        let natal_gates: HashSet<u8> = hd_chart.personality.iter()
            .chain(hd_chart.design.iter())
            .map(|a| a.gate)
            .collect();

        let t_gates: HashSet<u8> = transit_positions.iter().map(|a| a.gate).collect();
        transit_gate_set = Some(t_gates);

        let completed = transit::overlay_transits(
            &natal_gates,
            &transit_positions,
            &analysis.defined_channels,
        );

        let overlay = transit::TransitOverlay {
            transit_positions,
            completed_channels: completed,
        };

        display::print_transits(&overlay);
    }

    // SVG output
    if let Some(path) = &args.svg {
        let svg_content = svg::generate_svg(
            &hd_chart,
            &analysis,
            transit_gate_set.as_ref(),
        );
        std::fs::write(path, &svg_content).expect("Failed to write SVG file");
        eprintln!("SVG bodygraph written to: {}", path);
    }
}
