use crate::gates::longitude_to_gate_line;
use swiss_eph::safe::{self, Planet};

/// Planetary activation in the chart
#[derive(Debug, Clone)]
pub struct Activation {
    pub planet: &'static str,
    pub longitude: f64,
    pub gate: u8,
    pub line: u8,
}

/// Complete chart (personality + design)
#[derive(Debug, Clone)]
pub struct Chart {
    pub personality: Vec<Activation>,
    pub design: Vec<Activation>,
}

/// Planet definitions for HD: (SwissEph planet, name, is_opposite)
struct PlanetDef {
    planet: Planet,
    name: &'static str,
    opposite: bool,
}

const HD_PLANETS: &[PlanetDef] = &[
    PlanetDef { planet: Planet::Sun, name: "Sun", opposite: false },
    PlanetDef { planet: Planet::Sun, name: "Earth", opposite: true },
    PlanetDef { planet: Planet::Moon, name: "Moon", opposite: false },
    PlanetDef { planet: Planet::TrueNode, name: "North Node", opposite: false },
    PlanetDef { planet: Planet::TrueNode, name: "South Node", opposite: true },
    PlanetDef { planet: Planet::Mercury, name: "Mercury", opposite: false },
    PlanetDef { planet: Planet::Venus, name: "Venus", opposite: false },
    PlanetDef { planet: Planet::Mars, name: "Mars", opposite: false },
    PlanetDef { planet: Planet::Jupiter, name: "Jupiter", opposite: false },
    PlanetDef { planet: Planet::Saturn, name: "Saturn", opposite: false },
    PlanetDef { planet: Planet::Uranus, name: "Uranus", opposite: false },
    PlanetDef { planet: Planet::Neptune, name: "Neptune", opposite: false },
    PlanetDef { planet: Planet::Pluto, name: "Pluto", opposite: false },
];

/// Default calculation flags (speed + ecliptic)
const CALC_FLAGS: i32 = 0; // SEFLG_SPEED = 256, but 0 = default ecliptic

fn normalize(deg: f64) -> f64 {
    let mut d = deg % 360.0;
    if d < 0.0 { d += 360.0; }
    d
}

/// Calculate all planetary positions for a given Julian Day
fn calculate_positions(jd: f64) -> Vec<Activation> {
    HD_PLANETS.iter().map(|def| {
        let pos = safe::calc_ut(jd, def.planet as i32, CALC_FLAGS)
            .expect("Swiss Ephemeris calculation failed");
        let mut lon = pos.longitude;
        if def.opposite {
            lon = normalize(lon + 180.0);
        }
        let (gate, line) = longitude_to_gate_line(lon);
        Activation {
            planet: def.name,
            longitude: lon,
            gate,
            line,
        }
    }).collect()
}

/// Find the Design date (when Sun was 88° behind birth Sun)
fn find_design_jd(birth_jd: f64) -> f64 {
    let birth_sun = safe::calc_ut(birth_jd, Planet::Sun as i32, CALC_FLAGS)
        .expect("Failed to calc birth Sun").longitude;
    let target = normalize(birth_sun - 88.0);

    let mut jd = birth_jd - 88.0;
    for _ in 0..100 {
        let sun = safe::calc_ut(jd, Planet::Sun as i32, CALC_FLAGS)
            .expect("Failed to calc design Sun").longitude;
        let mut diff = target - sun;
        while diff > 180.0 { diff -= 360.0; }
        while diff < -180.0 { diff += 360.0; }
        if diff.abs() < 0.00001 {
            break;
        }
        jd += diff / 0.9856;
    }
    jd
}

/// Calculate a complete Human Design chart
pub fn calculate_chart(year: i32, month: u32, day: u32, hour: f64, tz_offset: f64) -> Chart {
    let utc_hour = hour - tz_offset;
    let (y, m, d, h) = adjust_date(year, month, day, utc_hour);
    let birth_jd = safe::julday(y, m as i32, d as i32, h);
    let design_jd = find_design_jd(birth_jd);

    Chart {
        personality: calculate_positions(birth_jd),
        design: calculate_positions(design_jd),
    }
}

/// Calculate current transit positions
pub fn calculate_transit() -> Vec<Activation> {
    let now = chrono::Utc::now();
    let jd = safe::julday(
        now.format("%Y").to_string().parse().unwrap(),
        now.format("%m").to_string().parse::<i32>().unwrap(),
        now.format("%d").to_string().parse::<i32>().unwrap(),
        now.format("%H").to_string().parse::<f64>().unwrap()
            + now.format("%M").to_string().parse::<f64>().unwrap() / 60.0,
    );
    calculate_positions(jd)
}

fn adjust_date(year: i32, month: u32, day: u32, hour: f64) -> (i32, u32, u32, f64) {
    if hour < 0.0 {
        let (y, m, d) = prev_day(year, month, day);
        (y, m, d, hour + 24.0)
    } else if hour >= 24.0 {
        let (y, m, d) = next_day(year, month, day);
        (y, m, d, hour - 24.0)
    } else {
        (year, month, day, hour)
    }
}

fn prev_day(year: i32, month: u32, day: u32) -> (i32, u32, u32) {
    if day > 1 { (year, month, day - 1) }
    else if month > 1 { (year, month - 1, days_in_month(year, month - 1)) }
    else { (year - 1, 12, 31) }
}

fn next_day(year: i32, month: u32, day: u32) -> (i32, u32, u32) {
    let max = days_in_month(year, month);
    if day < max { (year, month, day + 1) }
    else if month < 12 { (year, month + 1, 1) }
    else { (year + 1, 1, 1) }
}

fn days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 29 } else { 28 },
        _ => 30,
    }
}
