mod auth;
mod config;
mod db;
mod handlers;
mod models;
mod ws;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use config::AppConfig;
use db::init_db;
use handlers::{
    artifacts_handler, auth_handler, grades_handler, sessions_handler, subjects_handler,
};
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use tracing::info;
use ws::{ws_handler, SessionManager};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing logger
    tracing_subscriber::fmt()
        .with_env_filter("backend=debug,tower_http=debug")
        .init();

    info!("🚀 Iniciando backend de ArtifactsInejoma en Rust con Axum...");

    // Load configuration from environment
    let config = AppConfig::from_env();

    // Initialize database pool and run migrations + seeding
    let pool = match init_db(&config).await {
        Ok(p) => p,
        Err(e) => {
            tracing::warn!("⚠️ No se pudo conectar a PostgreSQL: {}. Continuando en modo sin BD...", e);
            return Err(e);
        }
    };

    // Shared Session Manager for WebSockets and PINs
    let session_manager = SessionManager::new();

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // API Routes
    let api_routes = Router::new()
        // Auth
        .route("/auth/login", post(auth_handler::login))
        .with_state((pool.clone(), config.clone()))
        // Grades
        .route("/grades", get(grades_handler::list_grades).post(grades_handler::create_grade))
        .route("/grades/:id", put(grades_handler::update_grade).delete(grades_handler::delete_grade))
        .with_state(pool.clone())
        // Subjects
        .route("/subjects", get(subjects_handler::list_subjects).post(subjects_handler::create_subject))
        .route("/subjects/:id", put(subjects_handler::update_subject).delete(subjects_handler::delete_subject))
        .with_state(pool.clone())
        // Artifacts
        .route("/artifacts", get(artifacts_handler::list_artifacts).post(artifacts_handler::create_artifact))
        .route("/artifacts/:id", get(artifacts_handler::get_artifact).put(artifacts_handler::update_artifact).delete(artifacts_handler::delete_artifact))
        .with_state(pool.clone())
        // Interactive Sessions & PINs
        .route("/sessions", post(sessions_handler::create_session))
        .route("/sessions/validate/:pin", get(sessions_handler::validate_pin))
        .route("/sessions/:pin", delete(sessions_handler::end_session))
        .with_state(session_manager.clone());

    // Main Router
    let app = Router::new()
        .nest("/api", api_routes)
        .route("/ws", get(ws_handler))
        .with_state(session_manager)
        .nest_service("/", ServeDir::new("../frontend/dist"))
        .layer(cors);

    let addr_str = format!("{}:{}", config.host, config.port);
    let addr: SocketAddr = addr_str.parse()?;
    info!("✅ Servidor escuchando exitosamente en http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
