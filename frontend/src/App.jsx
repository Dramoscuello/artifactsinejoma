import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentPinPage from './pages/StudentPinPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardHomePage from './pages/DashboardHomePage';
import ArtifactsPage from './pages/ArtifactsPage';
import ArtifactPlayerPage from './pages/ArtifactPlayerPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('inejoma_admin_token'));

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('inejoma_admin_token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('inejoma_admin_token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Estudiante (Ingreso por PIN de 4 dígitos) */}
        <Route path="/" element={<StudentPinPage />} />

        {/* Portal Profesor / Admin */}
        <Route
          path="/admin/login"
          element={
            token ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage onLoginSuccess={(t) => setToken(t)} />
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            token ? <DashboardHomePage onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />

        <Route
          path="/admin/artifacts"
          element={
            token ? <ArtifactsPage onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />

        <Route
          path="/admin/player/:id"
          element={
            token ? <ArtifactPlayerPage /> : <Navigate to="/admin/login" replace />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
