import { useEffect, useState } from 'react';
import api from '../../api';

export default function BemVindo() {
  const [nome, setNome] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNome(res.data.user?.fazenda?.nome || ''))
      .catch(() => setNome(''));
  }, []);
  return <div className="p-4">Bem-vindo, {nome}</div>;
}
