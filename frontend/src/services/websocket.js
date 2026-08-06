// Service for handling real-time WebSockets with dynamic host detection

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.activePin = null;
  }

  connect(pin, role = 'STUDENT') {
    this.activePin = pin;

    // Detect dynamic protocol and host (works for localhost, IP server, and domain)
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In local dev with Vite on port 5173, fallback to port 8000
      if (window.location.port === '5173') {
        wsUrl = `${protocol}//${window.location.hostname}:8000/ws`;
      } else {
        // In Docker / Production behind Nginx (port 80 or 443)
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
    }

    try {
      this.socket = new WebSocket(`${wsUrl}?pin=${pin}&role=${role}`);

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.event, data);
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn("WebSocket no conectado en:", wsUrl, err);
      };
    } catch (e) {
      console.warn("Fallo al conectar WebSocket real.", e);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const filtered = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, filtered);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(payload));
    }
  }

  // End session broadcast
  endSession(pin) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action: 'END_SESSION', pin }));
    }
    
    // Broadcast locally so open tabs receive immediate feedback
    this.emit('SESSION_ENDED', {
      event: 'SESSION_ENDED',
      pin,
      message: 'La sesión ha sido finalizada por el profesor',
      countdownSeconds: 5
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const wsService = new WebSocketService();
