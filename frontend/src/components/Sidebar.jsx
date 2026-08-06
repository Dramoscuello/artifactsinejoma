import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Real logged in user info
  const userName = localStorage.getItem('inejoma_user_name') || 'Usuario';
  const userEmail = localStorage.getItem('inejoma_user_email') || '';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
      {/* Title Header (Sin logo gráfico) */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div
          className="font-bold text-lg text-gray-900 tracking-tight cursor-pointer"
          onClick={() => navigate('/admin/dashboard')}
        >
          ArtifactsInejoma
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider px-2">Menú Principal</h3>
          <nav className="space-y-1.5">
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive('/admin/dashboard')
                  ? 'bg-blue-50 text-brand-blue'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <i className="fas fa-home w-5 text-center"></i>
              Grados y Asignaturas
            </Link>

            <Link
              to="/admin/artifacts"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive('/admin/artifacts')
                  ? 'bg-blue-50 text-brand-blue'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <i className="fas fa-cubes w-5 text-center"></i>
              Artefactos
            </Link>

            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <i className="fas fa-key w-5 text-center text-amber-500"></i>
              Portal Estudiantes (PIN)
            </Link>
          </nav>
        </div>
      </div>

      {/* Real User Profile Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{userName}</p>
              {userEmail && <p className="text-[10px] text-gray-500 truncate">{userEmail}</p>}
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('inejoma_user_name');
              localStorage.removeItem('inejoma_user_email');
              if (onLogout) onLogout();
            }}
            title="Cerrar Sesión"
            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
