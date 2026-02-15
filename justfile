# Human Design Chart App

# Default: list recipes
default:
    @just --list

# Start web app dev server
dev:
    cd packages/app && bun run dev

# Production build
build:
    cd packages/app && bun run build

# Preview production build
preview:
    cd packages/app && bun run preview

# Run Playwright E2E tests
test:
    cd packages/app && bun run test

# Run unit tests
test-unit:
    cd packages/app && bun run test:unit

# Install web app dependencies
install:
    cd packages/app && bun install

# Build Rust CLI (requires nix develop)
cli *ARGS:
    cargo build -p hd-cli {{ARGS}}

# Run Rust CLI
run *ARGS:
    cargo run -p hd-cli -- {{ARGS}}
