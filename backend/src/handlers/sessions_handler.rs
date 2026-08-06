use crate::{
    auth::AuthenticatedUser,
    models::{CreateSessionDto, SessionResponse},
    ws::SessionManager,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;

pub async fn create_session(
    _user: AuthenticatedUser,
    State(session_manager): State<SessionManager>,
    Json(payload): Json<CreateSessionDto>,
) -> impl IntoResponse {
    let pin = session_manager.create_session(payload.artifact_id);

    (
        StatusCode::CREATED,
        Json(SessionResponse {
            pin,
            artifact_id: payload.artifact_id,
            status: "ACTIVE".to_string(),
        }),
    )
}

pub async fn validate_pin(
    State(session_manager): State<SessionManager>,
    Path(pin): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match session_manager.validate_pin(&pin) {
        Some(session) => Ok(Json(session)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "El código PIN no existe o la sesión ha finalizado" })),
        )),
    }
}

pub async fn end_session(
    _user: AuthenticatedUser,
    State(session_manager): State<SessionManager>,
    Path(pin): Path<String>,
) -> impl IntoResponse {
    let success = session_manager.end_session(&pin);
    if success {
        (StatusCode::OK, Json(json!({ "message": "Sesión finalizada exitosamente" })))
    } else {
        (StatusCode::NOT_FOUND, Json(json!({ "error": "Sesión no encontrada o ya finalizada" })))
    }
}
