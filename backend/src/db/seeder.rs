use crate::auth::hash_password;
use crate::config::AppConfig;
use sqlx::PgPool;
use tracing::info;

pub async fn seed_database(pool: &PgPool, config: &AppConfig) -> Result<(), Box<dyn std::error::Error>> {
    // Solo sembrar el usuario Administrador taking credenciales del .env
    let admin_exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
        .bind(&config.admin_email)
        .fetch_one(pool)
        .await?;

    if !admin_exists {
        info!("🌱 Creando usuario Administrador inicial desde .env ({})", config.admin_email);
        let password_hash = hash_password(&config.admin_password)?;

        sqlx::query(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'ADMIN')"
        )
        .bind(&config.admin_email)
        .bind(&password_hash)
        .bind(&config.admin_name)
        .execute(pool)
        .await?;
        info!("✅ Usuario Administrador creado exitosamente.");
    }

    Ok(())
}
