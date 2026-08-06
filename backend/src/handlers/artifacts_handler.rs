use crate::{
    auth::AuthenticatedUser,
    models::{Artifact, CreateArtifactDto},
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

pub async fn list_artifacts(
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let artifacts: Vec<Artifact> = sqlx::query_as::<_, Artifact>("SELECT * FROM artifacts ORDER BY updated_at DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(artifacts))
}

pub async fn get_artifact(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let artifact: Option<Artifact> = sqlx::query_as::<_, Artifact>("SELECT * FROM artifacts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    match artifact {
        Some(a) => Ok(Json(a)),
        None => Err((StatusCode::NOT_FOUND, Json(json!({ "error": "Artefacto no encontrado" })))),
    }
}

pub async fn create_artifact(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Json(payload): Json<CreateArtifactDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let artifact: Artifact = sqlx::query_as::<_, Artifact>(
        "INSERT INTO artifacts (grade_id, subject_id, title, code) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(payload.grade_id)
    .bind(payload.subject_id)
    .bind(&payload.title)
    .bind(&payload.code)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok((StatusCode::CREATED, Json(artifact)))
}

pub async fn update_artifact(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateArtifactDto>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let artifact: Artifact = sqlx::query_as::<_, Artifact>(
        "UPDATE artifacts SET grade_id = $1, subject_id = $2, title = $3, code = $4, updated_at = NOW() WHERE id = $5 RETURNING *"
    )
    .bind(payload.grade_id)
    .bind(payload.subject_id)
    .bind(&payload.title)
    .bind(&payload.code)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(artifact))
}

pub async fn delete_artifact(
    _user: AuthenticatedUser,
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query("DELETE FROM artifacts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(StatusCode::NO_CONTENT)
}
