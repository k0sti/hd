use crate::gates::longitude_to_gate_line;

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

const PLANET_NAMES: [&str; 13] = [
    "Sun", "Earth", "Moon", "North Node", "South Node",
    "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
    "Uranus", "Neptune", "Pluto",
];

/// Julian Day Number from calendar date
pub fn julian_day(year: i32, month: u32, day: u32, hour: f64) -> f64 {
    let (y, m) = if month <= 2 {
        (year as f64 - 1.0, month as f64 + 12.0)
    } else {
        (year as f64, month as f64)
    };
    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();
    (365.25 * (y + 4716.0)).floor() + (30.6001 * (m + 1.0)).floor() + day as f64 + hour / 24.0 + b - 1524.5
}

/// Julian centuries from J2000.0
fn julian_centuries(jd: f64) -> f64 {
    (jd - 2451545.0) / 36525.0
}

/// Sun's ecliptic longitude (simplified VSOP87-like, accurate to ~0.01°)
fn sun_longitude(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    // Mean elements
    let l0 = normalize(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
    let m = normalize(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
    let m_rad = m.to_radians();

    // Equation of center
    let c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * m_rad.sin()
        + (0.019993 - 0.000101 * t) * (2.0 * m_rad).sin()
        + 0.000289 * (3.0 * m_rad).sin();

    // Sun's true longitude
    let sun_lon = l0 + c;

    // Apparent longitude (nutation + aberration)
    let omega = (125.04 - 1934.136 * t).to_radians();
    normalize(sun_lon - 0.00569 - 0.00478 * omega.sin())
}

/// Moon's ecliptic longitude (simplified, accurate to ~0.3°)
fn moon_longitude(jd: f64) -> f64 {
    let t = julian_centuries(jd);

    let lp = normalize(218.3165 + 481267.8813 * t); // Mean longitude
    let d = normalize(297.8502 + 445267.1115 * t); // Mean elongation
    let m = normalize(357.5291 + 35999.0503 * t);  // Sun's mean anomaly
    let mp = normalize(134.9634 + 477198.8676 * t); // Moon's mean anomaly
    let f = normalize(93.2721 + 483202.0175 * t);  // Argument of latitude

    let d_r = d.to_radians();
    let m_r = m.to_radians();
    let mp_r = mp.to_radians();
    let f_r = f.to_radians();

    let lon = lp
        + 6.289 * mp_r.sin()
        - 1.274 * (2.0 * d_r - mp_r).sin()
        + 0.658 * (2.0 * d_r).sin()
        - 0.214 * (2.0 * mp_r).sin()
        - 0.186 * m_r.sin()
        - 0.114 * (2.0 * f_r).sin()
        + 0.059 * (2.0 * (d_r - mp_r)).sin()
        + 0.057 * (2.0 * d_r - m_r - mp_r).sin()
        + 0.053 * (2.0 * d_r + mp_r).sin()
        + 0.046 * (2.0 * d_r - m_r).sin()
        - 0.041 * (m_r - mp_r).sin()
        - 0.035 * d_r.sin()
        - 0.031 * (m_r + mp_r).sin();

    normalize(lon)
}

/// Mean North Node longitude (True Node requires more complex calculation)
fn north_node_longitude(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    // Mean ascending node
    normalize(125.04452 - 1934.13626 * t + 0.00220 * t * t + t * t * t / 467441.0)
}

/// Planetary longitudes using simplified theories
fn planet_longitude(jd: f64, planet: &str) -> f64 {
    let t = julian_centuries(jd);

    match planet {
        "Mercury" => {
            let l = normalize(252.2509 + 149472.6746 * t);
            let m = normalize(174.7948 + 149472.5153 * t);
            let m_r = m.to_radians();
            normalize(l + 6.7386 * m_r.sin() + 1.2140 * (2.0 * m_r).sin()
                + 0.2869 * (3.0 * m_r).sin())
        }
        "Venus" => {
            let l = normalize(181.9798 + 58517.8156 * t);
            let m = normalize(50.4161 + 58517.8032 * t);
            let m_r = m.to_radians();
            normalize(l + 0.7758 * m_r.sin() + 0.0033 * (2.0 * m_r).sin())
        }
        "Mars" => {
            let l = normalize(355.4330 + 19140.2993 * t);
            let m = normalize(19.3730 + 19139.8585 * t);
            let m_r = m.to_radians();
            normalize(l + 10.6912 * m_r.sin() + 0.6228 * (2.0 * m_r).sin()
                + 0.0503 * (3.0 * m_r).sin())
        }
        "Jupiter" => {
            let l = normalize(34.3515 + 3034.9057 * t);
            let m = normalize(20.0202 + 3034.6874 * t);
            let m_r = m.to_radians();
            normalize(l + 5.5549 * m_r.sin() + 0.1683 * (2.0 * m_r).sin())
        }
        "Saturn" => {
            let l = normalize(50.0774 + 1222.1138 * t);
            let m = normalize(317.0207 + 1222.1116 * t);
            let m_r = m.to_radians();
            normalize(l + 6.3585 * m_r.sin() + 0.2204 * (2.0 * m_r).sin())
        }
        "Uranus" => {
            let l = normalize(314.0550 + 428.4677 * t);
            let m = normalize(141.0500 + 428.4677 * t);
            let m_r = m.to_radians();
            normalize(l + 5.3042 * m_r.sin() + 0.1534 * (2.0 * m_r).sin())
        }
        "Neptune" => {
            let l = normalize(304.2250 + 218.4862 * t);
            let m = normalize(256.2250 + 218.4862 * t);
            let m_r = m.to_radians();
            normalize(l + 0.9540 * m_r.sin())
        }
        "Pluto" => {
            // Pluto is complex; use simplified formula
            let l = normalize(238.9290 + 145.1781 * t);
            let m = normalize(25.2000 + 145.1781 * t);
            let m_r = m.to_radians();
            normalize(l + 14.0118 * m_r.sin() + 1.1429 * (2.0 * m_r).sin())
        }
        _ => 0.0,
    }
}

fn normalize(mut deg: f64) -> f64 {
    deg %= 360.0;
    if deg < 0.0 { deg += 360.0; }
    deg
}

/// Calculate all planetary positions for a given Julian Day
fn calculate_positions(jd: f64) -> Vec<Activation> {
    let sun = sun_longitude(jd);
    let earth = normalize(sun + 180.0);
    let moon = moon_longitude(jd);
    let nn = north_node_longitude(jd);
    let sn = normalize(nn + 180.0);
    let mercury = planet_longitude(jd, "Mercury");
    let venus = planet_longitude(jd, "Venus");
    let mars = planet_longitude(jd, "Mars");
    let jupiter = planet_longitude(jd, "Jupiter");
    let saturn = planet_longitude(jd, "Saturn");
    let uranus = planet_longitude(jd, "Uranus");
    let neptune = planet_longitude(jd, "Neptune");
    let pluto = planet_longitude(jd, "Pluto");

    let longitudes = [sun, earth, moon, nn, sn, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto];

    longitudes.iter().zip(PLANET_NAMES.iter()).map(|(&lon, &name)| {
        let (gate, line) = longitude_to_gate_line(lon);
        Activation { planet: name, longitude: lon, gate, line }
    }).collect()
}

/// Find the Design date (when Sun was 88° behind birth Sun)
fn find_design_jd(birth_jd: f64) -> f64 {
    let birth_sun = sun_longitude(birth_jd);
    let target = normalize(birth_sun - 88.0);

    let mut jd = birth_jd - 88.0; // approximate starting point
    for _ in 0..100 {
        let sun = sun_longitude(jd);
        let mut diff = target - sun;
        // Normalize to -180..180
        while diff > 180.0 { diff -= 360.0; }
        while diff < -180.0 { diff += 360.0; }
        if diff.abs() < 0.00001 {
            break;
        }
        jd += diff / 0.9856; // Sun moves ~0.9856°/day
    }
    jd
}

/// Calculate a complete Human Design chart
pub fn calculate_chart(year: i32, month: u32, day: u32, hour: f64, tz_offset: f64) -> Chart {
    // Convert to UTC
    let utc_hour = hour - tz_offset;
    let (y, m, d, h) = adjust_date(year, month, day, utc_hour);
    let birth_jd = julian_day(y, m, d, h);
    let design_jd = find_design_jd(birth_jd);

    Chart {
        personality: calculate_positions(birth_jd),
        design: calculate_positions(design_jd),
    }
}

/// Calculate current transit positions
pub fn calculate_transit() -> Vec<Activation> {
    let now = chrono::Utc::now();
    let jd = julian_day(
        now.format("%Y").to_string().parse().unwrap(),
        now.format("%m").to_string().parse().unwrap(),
        now.format("%d").to_string().parse().unwrap(),
        now.format("%H").to_string().parse::<f64>().unwrap()
            + now.format("%M").to_string().parse::<f64>().unwrap() / 60.0,
    );
    calculate_positions(jd)
}

/// Adjust date when hours go negative or above 24
fn adjust_date(year: i32, month: u32, day: u32, hour: f64) -> (i32, u32, u32, f64) {
    if hour < 0.0 {
        // Go to previous day
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
    if day > 1 {
        (year, month, day - 1)
    } else if month > 1 {
        let prev_month = month - 1;
        let days = days_in_month(year, prev_month);
        (year, prev_month, days)
    } else {
        (year - 1, 12, 31)
    }
}

fn next_day(year: i32, month: u32, day: u32) -> (i32, u32, u32) {
    let max = days_in_month(year, month);
    if day < max {
        (year, month, day + 1)
    } else if month < 12 {
        (year, month + 1, 1)
    } else {
        (year + 1, 1, 1)
    }
}

fn days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 29 } else { 28 },
        _ => 30,
    }
}
