use crate::{
    auth::AuthenticatedUser,
    models::{CreateGradeDto, Grade},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

pub async fn list_grades(
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let grades: Vec<Grade> = sqlx::query_as::<_, Grade>("SELECT * FROM grades ORDER BY created_at ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(grades))
}

pub async fn create_grade(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateGradeDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let grade: Grade = sqlx::query_as::<_, Grade>(
        "INSERT INTO grades (name, description) VALUES ($1, $2) RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        error!("Error creando grado: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() })))
    })?;

    Ok((StatusCode::CREATED, Json(grade)))
}

pub async fn update_grade(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateGradeDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let grade: Grade = sqlx::query_as::<_, Grade>(
        "UPDATE grades SET name = $1, description = $2 WHERE id = $3 RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(grade))
}

pub async fn delete_grade(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query("DELETE FROM grades WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(StatusCode::NO_CONTENT)
}
