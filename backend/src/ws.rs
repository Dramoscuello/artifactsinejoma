use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::IntoResponse,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tokio::sync::broadcast;
use tracing::{info, warn};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub pin: String,
    pub artifact_id: Uuid,
    pub code: String,
    pub status: String,
}

pub struct ActiveRoom {
    pub pin: String,
    pub artifact_id: Uuid,
    pub code: String,
    pub tx: broadcast::Sender<String>,
    pub student_count: usize,
}

#[derive(Clone)]
pub struct SessionManager {
    pub rooms: Arc<Mutex<HashMap<String, ActiveRoom>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_session(&self, artifact_id: Uuid, code: String) -> String {
        let mut rooms = self.rooms.lock().unwrap();
        let mut rng = rand::thread_rng();

        // Generate unique 4-digit PIN
        let pin = loop {
            let candidate = format!("{:04}", rng.gen_range(1000..=9999));
            if !rooms.contains_key(&candidate) {
                break candidate;
            }
        };

        let (tx, _) = broadcast::channel(100);

        rooms.insert(
            pin.clone(),
            ActiveRoom {
                pin: pin.clone(),
                artifact_id,
                code: code.clone(),
                tx,
                student_count: 0,
            },
        );

        info!("🔑 Nueva sesión creada con PIN: {}", pin);
        pin
    }

    pub fn validate_pin(&self, pin: &str) -> Option<SessionState> {
        let rooms = self.rooms.lock().unwrap();
        rooms.get(pin).map(|room| SessionState {
            pin: room.pin.clone(),
            artifact_id: room.artifact_id,
            code: room.code.clone(),
            status: "ACTIVE".to_string(),
        })
    }

    pub fn end_session(&self, pin: &str) -> bool {
        let mut rooms = self.rooms.lock().unwrap();
        if let Some(room) = rooms.remove(pin) {
            info!("🛑 Sesión con PIN {} finalizada por el profesor", pin);
            
            // Broadcast SESSION_ENDED signal to all connected clients
            let msg = serde_json::json!({
                "event": "SESSION_ENDED",
                "pin": pin,
                "message": "La sesión ha sido finalizada por el profesor",
                "countdownSeconds": 5
            }).to_string();

            let _ = room.tx.send(msg);
            true
        } else {
            false
        }
    }

    pub fn increment_student(&self, pin: &str) -> usize {
        let mut rooms = self.rooms.lock().unwrap();
        if let Some(room) = rooms.get_mut(pin) {
            room.student_count += 1;
            let count = room.student_count;

            let msg = serde_json::json!({
                "event": "STUDENT_COUNT_UPDATE",
                "pin": pin,
                "connectedStudents": count
            }).to_string();

            let _ = room.tx.send(msg);
            count
        } else {
            0
        }
    }

    pub fn decrement_student(&self, pin: &str) -> usize {
        let mut rooms = self.rooms.lock().unwrap();
        if let Some(room) = rooms.get_mut(pin) {
            if room.student_count > 0 {
                room.student_count -= 1;
            }
            let count = room.student_count;

            let msg = serde_json::json!({
                "event": "STUDENT_COUNT_UPDATE",
                "pin": pin,
                "connectedStudents": count
            }).to_string();

            let _ = room.tx.send(msg);
            count
        } else {
            0
        }
    }
}

#[derive(Deserialize)]
pub struct WsParams {
    pub pin: String,
    pub role: Option<String>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WsParams>,
    State(session_manager): State<SessionManager>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, params, session_manager))
}

async fn handle_socket(mut socket: WebSocket, params: WsParams, manager: SessionManager) {
    let pin = params.pin.clone();
    let role = params.role.unwrap_or_else(|| "STUDENT".to_string());

    let (rx, _student_count) = {
        let rooms = manager.rooms.lock().unwrap();
        match rooms.get(&pin) {
            Some(room) => (room.tx.subscribe(), room.student_count),
            None => {
                warn!("Intento de conexión WS con PIN no existente: {}", pin);
                return;
            }
        }
    };

    if role == "STUDENT" {
        manager.increment_student(&pin);
    }

    let mut rx = rx;

    loop {
        tokio::select! {
            // Receive message from broadcast channel
            Ok(msg_text) = rx.recv() => {
                if socket.send(Message::Text(msg_text)).await.is_err() {
                    break;
                }
            }
            // Receive message from client
            Some(Ok(msg)) = socket.recv() => {
                if let Message::Text(text) = msg {
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                        if parsed["action"] == "END_SESSION" {
                            manager.end_session(&pin);
                            break;
                        }
                    }
                }
            }
            else => break,
        }
    }

    if role == "STUDENT" {
        manager.decrement_student(&pin);
    }
}
