import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { apiService } from '../services/api';

export default function DashboardHomePage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('all');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState({ name: '', description: '' });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState({ name: '' });

  // Confirm dialog state
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const g = await apiService.getGrades();
      const s = await apiService.getSubjects();
      setGrades(Array.isArray(g) ? g : []);
      setSubjects(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error(e);
      setGrades([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Grade Handlers
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    await apiService.saveGrade(editingGrade);
    setShowGradeModal(false);
    setEditingGrade({ name: '', description: '' });
    loadData();
  };

  const handleDeleteGrade = async (id) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Grado',
      message: '¿Deseas eliminar este grado? Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: async () => {
        await apiService.deleteGrade(id);
        setConfirmModal({ open: false });
        loadData();
      },
    });
  };

  const handleDeleteSubject = async (id) => {
    setConfirmModal({
      open: true,
      title: 'Eliminar Asignatura',
      message: '¿Deseas eliminar esta asignatura? Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: async () => {
        await apiService.deleteSubject(id);
        setConfirmModal({ open: false });
        loadData();
      },
    });
  };

  // Subject Handlers
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    await apiService.saveSubject(editingSubject);
    setShowSubjectModal(false);
    setEditingSubject({ name: '' });
    loadData();
  };

  const tabs = [
    { id: 'all', label: 'Vista General' },
    { id: 'grades', label: `Grados (${grades.length})` },
    { id: 'subjects', label: `Asignaturas (${subjects.length})` }
  ];

  const hasItems = grades.length > 0 || subjects.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
        <Header
          title="Gestión de Grados y Asignaturas"
          subtitle="Administra los cursos y materias académicas"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        <div className="p-8">
          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Estructura Académica</h2>
              <p className="text-xs text-gray-500 mt-0.5">Organiza los grados y asignaturas para tus clases</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingGrade({ name: '', description: '' });
                  setShowGradeModal(true);
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus text-brand-blue"></i> Nuevo Grado
              </button>

              <button
                onClick={() => {
                  setEditingSubject({ name: '' });
                  setShowSubjectModal(true);
                }}
                className="px-4 py-2.5 bg-brand-blue hover:bg-brand-hover text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Nueva Asignatura
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl mr-2"></i> Cargando estructura...
            </div>
          ) : !hasItems ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-folder-open"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No hay datos registrados</h3>
              <p className="text-xs text-gray-500 mb-6">Comienza creando tu primer Grado o Asignatura.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setEditingGrade({ name: '', description: '' });
                    setShowGradeModal(true);
                  }}
                  className="px-4 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  <i className="fas fa-plus mr-1"></i> Crear Primer Grado
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* SECTION: GRADOS */}
              {(activeTab === 'all' || activeTab === 'grades') &&
                grades.map((grade) => (
                  <div
                    key={grade.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-brand-blue uppercase tracking-wider">
                          Grado
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingGrade(grade);
                              setShowGradeModal(true);
                            }}
                            className="text-gray-400 hover:text-brand-blue p-1 rounded"
                          >
                            <i className="fas fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg mb-1">{grade.name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{grade.description || 'Sin descripción'}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        <i className="far fa-folder text-brand-blue mr-1"></i> Nivel Académico
                      </span>
                    </div>
                  </div>
                ))}

              {/* SECTION: ASIGNATURAS */}
              {(activeTab === 'all' || activeTab === 'subjects') &&
                subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-600 uppercase tracking-wider">
                          Asignatura
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSubject(subject);
                              setShowSubjectModal(true);
                            }}
                            className="text-gray-400 hover:text-brand-blue p-1 rounded"
                          >
                            <i className="fas fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base mb-1">{subject.name}</h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <span>Materia</span>
                      <span className="text-brand-blue font-semibold">
                        <i className="fas fa-layer-group mr-1"></i> Lista para Artefactos
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: CREAR/EDITAR GRADO (Solo Nombre y Descripción) */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingGrade.id ? 'Editar Grado' : 'Nuevo Grado'}
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nombre del Grado</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 1° Secundaria"
                  value={editingGrade.name}
                  onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                  className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-gray-200 focus:border-brand-blue outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Descripción (Opcional)</label>
                <textarea
                  rows="3"
                  placeholder="Detalles sobre el nivel..."
                  value={editingGrade.description || ''}
                  onChange={(e) => setEditingGrade({ ...editingGrade, description: e.target.value })}
                  className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-gray-200 focus:border-brand-blue outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Guardar Grado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR ASIGNATURA (Solo Nombre) */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingSubject.id ? 'Editar Asignatura' : 'Nueva Asignatura'}
              </h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nombre de la Asignatura</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Matemáticas"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-gray-200 focus:border-brand-blue outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Guardar Asignatura
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
