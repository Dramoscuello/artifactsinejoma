import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import ArtifactSandbox from '../components/ArtifactSandbox';
import ConfirmModal from '../components/ConfirmModal';

export default function ArtifactPlayerPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pin = searchParams.get('pin');

  const [artifact, setArtifact] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false });

  useEffect(() => {
    loadArtifactAndSession();
    return () => {
      wsService.disconnect();
    };
  }, [id, pin]);

  const loadArtifactAndSession = async () => {
    setLoading(true);
    try {
      const art = await apiService.getArtifactById(id);
      setArtifact(art);

      if (pin) {
        const session = await apiService.getSessionByPin(pin);
        if (session) {
          setStudentCount(session.connectedStudents !== undefined ? session.connectedStudents : 0);
          
          // Connect WebSocket as TEACHER
          wsService.connect(pin, 'TEACHER');

          // Listen for student count updates
          wsService.on('STUDENT_COUNT_UPDATE', (data) => {
            if (data.connectedStudents !== undefined) {
              setStudentCount(data.connectedStudents);
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    setConfirmModal({
      open: true,
      title: 'Finalizar Sesión',
      message: '¿Deseas finalizar la sesión? El PIN expirará y todos los alumnos serán desconectados.',
      variant: 'danger',
      confirmLabel: 'Finalizar',
      onConfirm: async () => {
        await apiService.endSession(pin);
        wsService.endSession(pin);
        setConfirmModal({ open: false });
        setIsSessionActive(false);
      },
    });
  };

  const handleReplay = async () => {
    const newSession = await apiService.createSession(id);
    window.location.href = `/admin/player/${id}?pin=${newSession.pin}`;
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gray-900 text-white flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl mr-3 text-brand-blue"></i>
        <span>Iniciando Sala Interactiva...</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* TOP CONTROL BAR */}
      <header className="bg-gray-800/90 backdrop-blur border-b border-gray-700 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-blue/20 text-brand-blue border border-brand-blue/30 flex items-center justify-center font-bold">
            <i className="fas fa-play"></i>
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              {artifact?.title || 'Artefacto en Vivo'}
            </h1>
            <span className="text-xs text-gray-400">Control de Clase (Profesor)</span>
          </div>
        </div>

        {/* PIN DISPLAY & LIVE STUDENT COUNTER */}
        <div className="flex items-center gap-6 bg-gray-900/80 px-6 py-2 rounded-2xl border border-gray-700 shadow-inner">
          {/* PIN BOX */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-gray-400">PIN:</span>
            {isSessionActive ? (
              <span className="font-mono text-2xl font-black text-amber-400 tracking-wider bg-amber-400/10 px-3 py-0.5 rounded-lg border border-amber-400/20">
                {pin}
              </span>
            ) : (
              <span className="font-mono text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-lg border border-red-400/20">
                EXPIRADO
              </span>
            )}
          </div>

          <div className="h-6 w-px bg-gray-700"></div>

          {/* REAL-TIME STUDENT COUNTER */}
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">Alumnos Conectados</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <i className="fas fa-users text-xs"></i> {isSessionActive ? studentCount : 0}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          {isSessionActive ? (
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <i className="fas fa-power-off"></i> Finalizar Sesión
            </button>
          ) : (
            <button
              onClick={handleReplay}
              className="px-4 py-2 bg-brand-blue hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 animate-bounce"
            >
              <i className="fas fa-redo"></i> Generar Nuevo PIN
            </button>
          )}
        </div>
      </header>

      {/* MAIN FULL-SCREEN PLAY AREA */}
      <main className="flex-1 w-full h-full overflow-hidden flex flex-col bg-white">
        {!isSessionActive && (
          <div className="p-3 bg-red-900/40 border-b border-red-700 text-red-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-xs">
              <i className="fas fa-exclamation-triangle text-red-400"></i>
              <span>La sesión ha sido finalizada. El PIN {pin} ha expirado.</span>
            </div>
            <button
              onClick={handleReplay}
              className="px-3 py-1 bg-brand-blue text-white font-bold text-xs rounded-lg"
            >
              Volver a dar PLAY
            </button>
          </div>
        )}

        <div className="flex-1 w-full h-full overflow-hidden">
          <ArtifactSandbox code={artifact?.code} title={artifact?.title} hideHeader={true} />
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
      />
    </div>
  );
}
