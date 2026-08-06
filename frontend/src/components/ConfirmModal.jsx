import React from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-brand-blue'}`}>
            <i className={`fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-question-circle'}`}></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {cancelLabel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-all ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-brand-blue hover:bg-brand-hover shadow-blue-500/20'}`}
          >
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
