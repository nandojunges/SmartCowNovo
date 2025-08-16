import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token'); // Limpa o token
    navigate('/login');               // Redireciona
  }, [navigate]);

  return null; // Não precisa mostrar nada
}
