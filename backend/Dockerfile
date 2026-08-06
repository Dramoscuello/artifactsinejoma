# Multi-stage build for Rust Axum Backend
FROM rust:latest as builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations

# Build release binary
RUN cargo build --release

# Production runner image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/src/app/target/release/backend /app/backend
COPY --from=builder /usr/src/app/migrations /app/migrations

EXPOSE 8000

CMD ["/app/backend"]
