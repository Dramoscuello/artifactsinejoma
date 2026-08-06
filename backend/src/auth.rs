use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub exp: usize,
}

pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

pub fn create_jwt(user_id: Uuid, email: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(7))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        email: email.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct AuthenticatedUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok());

        let auth_header = match auth_header {
            Some(header) => header,
            None => {
                let error_response = (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "Missing authorization token" })),
                );
                return Err(error_response.into_response());
            }
        };

        let token = if auth_header.starts_with("Bearer ") {
            &auth_header[7..]
        } else {
            auth_header
        };

        let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "super_secret_jwt_key_change_in_production".to_string());

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        );

        match token_data {
            Ok(data) => Ok(AuthenticatedUser(data.claims)),
            Err(_) => {
                let error_response = (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "Invalid or expired token" })),
                );
                Err(error_response.into_response())
            }
        }
    }
}
