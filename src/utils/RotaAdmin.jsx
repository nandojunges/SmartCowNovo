import React from 'react';
import { Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

export default function RotaAdmin({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    const expirado = decoded.exp * 1000 < Date.now();
    if (expirado) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
    if (decoded.perfil !== 'admin') {
      return <Navigate to="/inicio" replace />;
    }
    return children;
  } catch (e) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}