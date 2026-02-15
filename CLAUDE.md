# CLAUDE.md — Human Design Chart App

## Shared Instructions
Read `seed/obsidian/` for general project conventions:
- `seed/obsidian/Project Instructions.md` — project structure, component guidelines
- `seed/obsidian/Hierarchical Workflow.md` — agent team task breakdown
- `seed/obsidian/Testing.md` — testing strategy
- `seed/obsidian/Nostr.md` — Nostr integration spec

## Environment Setup
```bash
# Rust (for CLI crate)
nix develop  # provides rustc, cargo, pkg-config, etc.
cargo build -p hd-cli

# Web app
cd packages/app
bun install
bun run dev    # Vite dev server
bun run build  # Production build
bun run test   # Playwright tests
```

## Project Structure
```
crates/cli/        — Rust CLI (swiss-eph C FFI, native only)
packages/app/      — Web app (Vite + TypeScript + Tailwind + swisseph-wasm)
assets/            — Shared assets (bodygraph-blank.svg template)
design/            — Reference images for visual specs
obsidian/          — Project docs (specs.md is the master spec)
```

## Master Spec
**READ THIS FIRST:** `obsidian/specs.md`
This is the authoritative specification. Keep it updated after changes.

## Key References
- **hdkit SVG template:** `assets/bodygraph-blank.svg` (MIT license, Jonah Dempcy)
  - Gates: `id="Gate{N}"` — path elements, color via `fill` attribute
  - Centers: `id="{Name}"` inside `id="Centers"` group — path fill
  - Gate labels: `id="GateText{N}"` — text fill
  - Gate label bg: `id="GateTextBg{N}"` — child path/circle fill
- **Reference chart image:** `design/default.png` — shows split personality/design colors on channels
- **Existing Rust implementation:** `crates/cli/src/` — reference for gate order, channels, types

## Gate Calculation
- Gate order starts at Gate 41 at 302° tropical
- Each gate = 5.625° (360/64), each line = 0.9375°
- Full gate order array in `crates/cli/src/gates.rs`
- Design date: find when Sun was 88° behind natal Sun position
- Earth = Sun + 180°, South Node = North Node + 180°

## Web App Ephemeris
Use `swisseph-wasm` npm package:
- Initialize WASM module before calculations
- Use `swe_calc_ut()` for planetary positions
- Returns ecliptic longitude → convert to HD gate using gate order

## Agent Team Configuration
Use agent teams for this project (no task manager configured).
- **Orchestrator:** breaks spec into tasks, delegates to specialists
- **Specialists:** implement individual features, verify with build+test
- Log all work in `obsidian/log.md` with timestamps

## Build & Test Commands
```bash
# Rust
cargo build -p hd-cli
cargo test -p hd-cli
cargo clippy --all

# Web (from packages/app)
bun install
bun run build
bun run test       # Playwright
bun run test:unit  # Vitest (if configured)
```

## Git Rules
- Local development only — do NOT push or create PRs
- Clear commit messages
- Commit working states frequently

## Critical Implementation Notes
- SVG manipulation: modify fill attributes on the hdkit template SVG (DOM or string replacement)
- Inactive gates should be visible in light gray (#e0ddd8)
- Split personality+design colors: use SVG linearGradient on gate paths
- Person+Person uses different color pairs (A: black/red, B: blue/purple)
- Transit gates: green (#44aa55), dashed channels
- All channels always visible (defined or not)
- Center colors: see specs.md for the full color map
- Body silhouette: create subtle background layer behind bodygraph (reference: design/default.png)
