pub mod seeder;

use crate::config::AppConfig;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tracing::info;

pub async fn init_db(config: &AppConfig) -> Result<PgPool, Box<dyn std::error::Error>> {
    info!("🔌 Conectando a la base de datos PostgreSQL en {}", config.database_url);

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    info!("⚡ Ejecutando migraciones de SQLx...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    info!("🌱 Ejecutando seeder de usuario admin...");
    seeder::seed_database(&pool, config).await?;

    Ok(pool)
}
