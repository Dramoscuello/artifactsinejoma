import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ArtifactSandbox from '../components/ArtifactSandbox';
import ConfirmModal from '../components/ConfirmModal';
import { apiService } from '../services/api';

export default function ArtifactsPage({ onLogout }) {
  const [artifacts, setArtifacts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState({
    title: '',
    gradeId: '',
    subjectId: '',
    code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; text-align: center; padding: 2rem; }\n  </style>\n</head>\n<body>\n  <h1>¡Hola Artefacto!</h1>\n</body>\n</html>'
  });

  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    loadData().then(() => syncLocalToBackend());
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artList, gList, sList] = await Promise.all([
        apiService.getArtifacts(),
        apiService.getGrades(),
        apiService.getSubjects()
      ]);
      setArtifacts(Array.isArray(artList) ? artList : []);
      setGrades(Array.isArray(gList) ? gList : []);
      setSubjects(Array.isArray(sList) ? sList : []);
    } catch (e) {
      console.error(e);
      setArtifacts([]);
      setGrades([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalToBackend = async () => {
    try {
      const raw = localStorage.getItem('inejoma_v2_artifacts');
      if (!raw) return;
      const localArtifacts = JSON.parse(raw);
      if (!Array.isArray(localArtifacts) || localArtifacts.length === 0) return;

      const unsynced = localArtifacts.filter((a) =>
        typeof a.id === 'string' && a.id.startsWith('art-')
      );
      if (unsynced.length === 0) return;

      for (const artifact of unsynced) {
        const saved = await apiService.saveArtifact(artifact);
        if (saved && saved.id) {
          const updated = localArtifacts.filter((a) => a.id !== artifact.id);
          localStorage.setItem('inejoma_v2_artifacts', JSON.stringify(updated));
          loadData();
        }
      }
    } catch (e) {
      console.warn('Error sincronizando artefactos locales:', e);
    }
  };

  const handlePlayArtifact = async (artifact) => {
    const session = await apiService.createSession(artifact.id, artifact.code);
    window.open(`/admin/player/${artifact.id}?pin=${session.pin}`, '_blank');
  };

  const handleSaveArtifact = async (e) => {
    e.preventDefault();
    await apiService.saveArtifact(editingArtifact);
    setShowEditorModal(false);
    loadData();
  };

  const handleDeleteArtifact = async (id) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Artefacto',
      message: '¿Estás seguro de eliminar este artefacto? Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: async () => {
        await apiService.deleteArtifact(id);
        setConfirmModal({ open: false });
        loadData();
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
        <Header
          title="Gestión de Artefactos Educativos"
          subtitle="Crea, edita y reproduce código HTML+CSS+JS interactivo"
        />

        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Artefactos Disponibles ({artifacts.length})</h2>
              <p className="text-xs text-gray-500 mt-0.5">Selecciona un artefacto para darle "Play" y generar un PIN de clase</p>
            </div>

            <button
              onClick={() => {
                setEditingArtifact({
                  title: '',
                  gradeId: grades[0]?.id || '',
                  subjectId: subjects[0]?.id || '',
                  code: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 20px; text-align: center; background: #0f172a; color: white; }\n    button { background: #0066FF; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }\n  </style>\n</head>\n<body>\n  <h2>✨ Nuevo Artefacto Interactivo</h2>\n  <button onclick="alert('¡Interacción activa!')">Haz Clic Aquí</button>\n</body>\n</html>`
                });
                setShowEditorModal(true);
              }}
              className="px-4 py-2.5 bg-brand-blue hover:bg-brand-hover text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> Crear Nuevo Artefacto
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl mr-2"></i> Cargando artefactos...
            </div>
          ) : artifacts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-cubes"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No hay artefactos creados</h3>
              <p className="text-xs text-gray-500 mb-6">Agrega tu primer artefacto interactivo con código HTML, CSS y JavaScript.</p>
              <button
                onClick={() => {
                  setEditingArtifact({
                    title: '',
                    gradeId: grades[0]?.id || '',
                    subjectId: subjects[0]?.id || '',
                    code: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 20px; text-align: center; background: #0f172a; color: white; }\n    button { background: #0066FF; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }\n  </style>\n</head>\n<body>\n  <h2>✨ Nuevo Artefacto Interactivo</h2>\n  <button onclick="alert('¡Interacción activa!')">Haz Clic Aquí</button>\n</body>\n</html>`
                  });
                  setShowEditorModal(true);
                }}
                className="px-5 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-md"
              >
                <i className="fas fa-plus mr-1"></i> Crear Primer Artefacto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artifacts.map((art) => {
                const grade = grades.find((g) => g.id === art.gradeId);
                const subject = subjects.find((s) => s.id === art.subjectId);

                return (
                  <div
                    key={art.id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header & Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-blue-50 text-brand-blue">
                          {subject ? subject.name : 'Sin Asignatura'}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                          {grade ? grade.name : 'Sin Grado'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-brand-blue transition-colors">
                        {art.title}
                      </h3>

                      {/* Mini Live Preview Sandbox Frame */}
                      <div className="h-36 w-full rounded-xl overflow-hidden border border-gray-200 mb-4 bg-gray-50 relative">
                        <ArtifactSandbox code={art.code} title={art.title} />
                      </div>
                    </div>

                    {/* Action Bar matching design */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingArtifact(art);
                            setShowEditorModal(true);
                          }}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand-blue text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <i className="fas fa-edit"></i> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteArtifact(art.id)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 text-xs transition-colors"
                          title="Eliminar Artefacto"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>

                      <button
                        onClick={() => handlePlayArtifact(art)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 animate-pulse"
                      >
                        <i className="fas fa-play text-[10px]"></i> PLAY (PIN)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FULL-SCREEN CODE EDITOR MODAL */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                  <i className="fas fa-code"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingArtifact.id ? 'Editar Artefacto' : 'Nuevo Artefacto Web'}
                  </h3>
                  <p className="text-xs text-gray-500">Pega o edita el código HTML + CSS + JavaScript</p>
                </div>
              </div>

              <button onClick={() => setShowEditorModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Form & Split Screen Editor */}
            <form onSubmit={handleSaveArtifact} className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Título del Artefacto</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Simulador de Circuito Eléctrico"
                    value={editingArtifact.title}
                    onChange={(e) => setEditingArtifact({ ...editingArtifact, title: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Grado</label>
                  <select
                    required
                    value={editingArtifact.gradeId}
                    onChange={(e) => setEditingArtifact({ ...editingArtifact, gradeId: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none bg-white"
                  >
                    <option value="">Selecciona Grado</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Asignatura</label>
                  <select
                    required
                    value={editingArtifact.subjectId}
                    onChange={(e) => setEditingArtifact({ ...editingArtifact, subjectId: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none bg-white"
                  >
                    <option value="">Selecciona Asignatura</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Editor & Live Sandbox Preview */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 mb-4">
                {/* Left: Code Textarea */}
                <div className="flex flex-col h-full">
                  <div className="bg-gray-800 text-gray-300 text-xs px-3 py-2 rounded-t-xl font-mono flex items-center justify-between">
                    <span><i className="fas fa-file-code text-amber-400 mr-1.5"></i> HTML + CSS + JS</span>
                    <span className="text-[10px] text-gray-400">Edición en directo</span>
                  </div>
                  <textarea
                    required
                    value={editingArtifact.code}
                    onChange={(e) => setEditingArtifact({ ...editingArtifact, code: e.target.value })}
                    className="flex-1 w-full bg-gray-900 text-emerald-400 font-mono text-xs p-4 rounded-b-xl focus:outline-none resize-none shadow-inner"
                    placeholder="<!DOCTYPE html>..."
                  ></textarea>
                </div>

                {/* Right: Sandbox Live Preview */}
                <div className="flex flex-col h-full">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-2 rounded-t-xl font-semibold flex items-center justify-between border border-b-0 border-gray-200">
                    <span><i className="fas fa-desktop text-brand-blue mr-1.5"></i> Previsualización en Vivo</span>
                  </div>
                  <div className="flex-1 rounded-b-xl overflow-hidden border border-gray-200">
                    <ArtifactSandbox code={editingArtifact.code} title={editingArtifact.title} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 shrink-0 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <i className="fas fa-save"></i> Guardar Artefacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
      />
    </div>
  );
}
