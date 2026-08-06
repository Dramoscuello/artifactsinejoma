import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import ArtifactSandbox from '../components/ArtifactSandbox';

export default function StudentPinPage() {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [sessionEndedMessage, setSessionEndedMessage] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Check URL params for auto PIN (e.g. /?pin=4829)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin');
    if (urlPin) {
      setPinInput(urlPin);
      handleJoinSession(urlPin);
    }
  }, []);

  // Countdown timer effect when session ends
  useEffect(() => {
    let timer;
    if (sessionEndedMessage && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Reset back to PIN entry
      setActiveSession(null);
      setArtifact(null);
      setSessionEndedMessage(null);
      setPinInput('');
      setCountdown(5);
      wsService.disconnect();
    }
    return () => clearInterval(timer);
  }, [sessionEndedMessage, countdown]);

  const handleJoinSession = async (pinToValidate) => {
    const pin = pinToValidate || pinInput;
    if (!pin || pin.length !== 4) {
      setError('Por favor ingresa un código PIN válido de 4 dígitos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const session = await apiService.getSessionByPin(pin);
      if (!session) {
        setError('El código PIN ingresado no existe o la sesión ha finalizado.');
        setLoading(false);
        return;
      }

      const artifactData = await apiService.getArtifactById(session.artifactId);
      if (!artifactData) {
        setError('No se pudo cargar el artefacto de esta sesión.');
        setLoading(false);
        return;
      }

      setActiveSession(session);
      setArtifact(artifactData);

      // Connect WebSocket for real-time alerts
      wsService.connect(pin, 'STUDENT');

      wsService.on('SESSION_ENDED', (data) => {
        setSessionEndedMessage(data.message || 'La sesión ha sido finalizada por el profesor.');
      });

    } catch (err) {
      setError('Error al conectarse a la sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
      {/* SESSION ENDED COUNTDOWN OVERLAY */}
      {sessionEndedMessage && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
            <i className="fas fa-stop-circle"></i>
          </div>
          <h2 className="text-3xl font-bold mb-2">¡Sesión Finalizada!</h2>
          <p className="text-gray-300 text-lg max-w-md mb-6">{sessionEndedMessage}</p>
          <div className="bg-gray-800 border border-gray-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <i className="fas fa-clock text-amber-400 text-xl animate-spin"></i>
            <span className="text-sm font-semibold text-gray-300">
              Redireccionando al inicio en <span className="text-amber-400 text-xl font-bold mx-1">{countdown}</span> segundos
            </span>
          </div>
        </div>
      )}

      {!activeSession ? (
        /* INGRESAR PIN (Estilo Login) */
        <div className="flex-1 flex flex-col justify-between items-center p-4">
          <header className="w-full max-w-5xl py-4 flex items-center justify-between border-b border-gray-200/80">
            <div className="font-bold text-xl tracking-tight text-gray-900">
              ArtifactsInejoma <span className="text-xs bg-blue-50 text-brand-blue font-semibold px-2 py-0.5 rounded-full border border-blue-100 ml-2">Estudiantes</span>
            </div>
            
            <a
              href="/admin/login"
              className="text-xs text-gray-500 hover:text-brand-blue font-medium flex items-center gap-1.5 transition-colors"
            >
              <i className="fas fa-lock"></i> Acceso Profesor
            </a>
          </header>

          <main className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg border border-gray-100 my-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
                <i className="fas fa-key"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Código de Clase</h2>
              <p className="text-xs text-gray-500 mt-1">Ingresa el código PIN de 4 dígitos proporcionado por tu profesor</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-sm shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinSession();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                  PIN de 4 dígitos
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0 0 0 0"
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono font-bold py-3.5 px-4 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || pinInput.length !== 4}
                className="w-full py-3.5 px-4 bg-brand-blue hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Validando Código...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play text-xs"></i> Entrar a la Sesión
                  </>
                )}
              </button>
            </form>
          </main>

          <footer className="w-full py-4 text-center text-xs text-gray-400 border-t border-gray-100">
            ArtifactsInejoma &copy; 2026 — Plataforma Educativa Interactiva
          </footer>
        </div>
      ) : (
        /* VISTA DE ESTUDIANTE: ARTEFACTO 100% PANTALLA COMPLETA */
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">
          <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <h3 className="font-bold text-white text-sm">{artifact?.title}</h3>
                <span className="text-xs text-gray-400">PIN Activo: <strong className="text-amber-400 font-mono">{activeSession.pin}</strong></span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveSession(null);
                setArtifact(null);
                wsService.disconnect();
              }}
              className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-sign-out-alt"></i> Salir de la Clase
            </button>
          </header>

          <main className="flex-1 w-full h-full overflow-hidden">
            <ArtifactSandbox code={artifact?.code} title={artifact?.title} hideHeader={true} />
          </main>
        </div>
      )}
    </div>
  );
}
