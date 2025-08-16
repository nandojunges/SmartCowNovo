import React from "react";
import { Navigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

export default function RotaProtegida({ children }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);  // ✅ agora está certo
    const expirado = decoded.exp * 1000 < Date.now();
    if (expirado) {
      localStorage.removeItem("token");
      return <Navigate to="/login" />;
    }
    return children;
  } catch (e) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
}
