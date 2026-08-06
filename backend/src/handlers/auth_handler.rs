use crate::{
    auth::{create_jwt, verify_password},
    config::AppConfig,
    models::{AuthResponse, LoginDto, User},
};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use sqlx::PgPool;

pub async fn login(
    State((pool, config)): State<(PgPool, AppConfig)>,
    Json(payload): Json<LoginDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&payload.email)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let user = match user {
        Some(u) => u,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Credenciales inválidas" })),
            ))
        }
    };

    if !verify_password(&payload.password, &user.password_hash) {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Credenciales inválidas" })),
        ));
    }

    let token = create_jwt(user.id, &user.email, &config.jwt_secret)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(AuthResponse {
        token,
        user_name: user.name,
        user_email: user.email,
    }))
}
