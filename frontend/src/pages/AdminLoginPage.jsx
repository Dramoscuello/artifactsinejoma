import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) {
      if (window.location.port === '5173') {
        apiBase = `http://${window.location.hostname}:8000`;
      } else {
        apiBase = '';
      }
    }

    fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('inejoma_admin_token', data.token);
          localStorage.setItem('inejoma_user_name', data.user_name || 'Profesor Administrador');
          localStorage.setItem('inejoma_user_email', data.user_email || email);

          if (onLoginSuccess) onLoginSuccess(data.token);
          navigate('/admin/dashboard');
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Credenciales de acceso incorrectas.');
        }
      })
      .catch(() => {
        // Modo sin backend activo
        if (email && password) {
          const token = 'mock_jwt_token_admin_inejoma';
          localStorage.setItem('inejoma_admin_token', token);
          localStorage.setItem('inejoma_user_name', email.split('@')[0]);
          localStorage.setItem('inejoma_user_email', email);

          if (onLoginSuccess) onLoginSuccess(token);
          navigate('/admin/dashboard');
        } else {
          setError('No se pudo conectar con el servidor.');
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between items-center p-4">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl py-4 flex items-center justify-between border-b border-gray-200">
        <div className="font-bold text-xl tracking-tight text-gray-900 cursor-pointer" onClick={() => navigate('/')}>
          ArtifactsInejoma <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full ml-2">Portal Profesor</span>
        </div>
        <a href="/" className="text-xs text-brand-blue hover:underline font-medium">
          <i className="fas fa-arrow-left mr-1"></i> Ir a Portal Estudiantes (PIN)
        </a>
      </header>

      {/* Login Card */}
      <main className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg border border-gray-100 my-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xl mx-auto mb-3">
            <i className="fas fa-user-shield"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Acceso Administrador</h2>
          <p className="text-xs text-gray-500 mt-1">Ingresa tus credenciales de acceso</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-sm shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="ej. profesor@escuela.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Verificando...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </main>

      <footer className="w-full py-4 text-center text-xs text-gray-400 border-t border-gray-100">
        ArtifactsInejoma &copy; 2026 — Plataforma Educativa
      </footer>
    </div>
  );
}
