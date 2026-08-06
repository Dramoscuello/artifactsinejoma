use crate::{
    auth::AuthenticatedUser,
    models::{CreateSubjectDto, Subject},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_subjects(
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let subjects: Vec<Subject> = sqlx::query_as::<_, Subject>("SELECT * FROM subjects ORDER BY created_at ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(subjects))
}

pub async fn create_subject(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateSubjectDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let subject: Subject = sqlx::query_as::<_, Subject>(
        "INSERT INTO subjects (name) VALUES ($1) RETURNING *"
    )
    .bind(&payload.name)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok((StatusCode::CREATED, Json(subject)))
}

pub async fn update_subject(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateSubjectDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let subject: Subject = sqlx::query_as::<_, Subject>(
        "UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *"
    )
    .bind(&payload.name)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(subject))
}

pub async fn delete_subject(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query("DELETE FROM subjects WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(StatusCode::NO_CONTENT)
}
