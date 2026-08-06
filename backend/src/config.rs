use std::env;

pub const DEFAULT_JWT_SECRET: &str = "super_secret_jwt_key_change_in_production_2026";

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub host: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub admin_email: String,
    pub admin_password: String,
    pub admin_name: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        // Try explicit path first (Docker volume mount), then default search
        let _ = dotenvy::from_filename("/app/.env").or_else(|_| dotenvy::dotenv());

        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .unwrap_or(8000),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgres://postgres:postgres_password@localhost:5432/artifacts_inejoma".to_string()
            }),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| DEFAULT_JWT_SECRET.to_string()),
            admin_email: env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@inejoma.edu".to_string()),
            admin_password: env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "AdminPassword123!".to_string()),
            admin_name: env::var("ADMIN_NAME").unwrap_or_else(|_| "Profesor Administrador".to_string()),
        }
    }
}
