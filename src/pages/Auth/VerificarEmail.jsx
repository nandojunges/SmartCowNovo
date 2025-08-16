import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api';

export default function VerificarEmail() {
  const [codigo, setCodigo] = useState('');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [tempo, setTempo] = useState(180);
  const [podeReenviar, setPodeReenviar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem('emailCadastro');
    if (salvo) {
      setEmail(salvo);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTempo((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPodeReenviar(true), 30000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (tempo === 0) {
      toast.warn('Código expirado. Clique em reenviar.');
    }
  }, [tempo]);

  const formatarTempo = (seg) => {
    const m = String(Math.floor(seg / 60)).padStart(2, '0');
    const s = String(seg % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const reenviarCodigo = async () => {
    const dados = localStorage.getItem('dadosCadastro');
    if (!dados) {
      toast.error('Dados para reenviar não encontrados.');
      return;
    }
    try {
      await api.post('/auth/register', JSON.parse(dados));
      setTempo(180);
      setPodeReenviar(false);
      setTimeout(() => setPodeReenviar(true), 30000);
      toast.success('Código reenviado. Verifique seu e-mail.');
    } catch (err) {
      toast.error('Erro ao reenviar código.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email não encontrado. Faça o cadastro novamente.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/auth/verify-code', {
        email: email.trim().toLowerCase(),
        codigo: String(codigo).trim(),
      });
      toast.success('E-mail verificado com sucesso!');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Código incorreto ou expirado';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundImage: "url('/icones/telafundo.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <p className="text-center mb-2">
          Enviamos um código para {email}. Isso pode levar alguns segundos...
        </p>
        {!podeReenviar && (
          <div className="flex justify-center mb-2">
            <Loader2 className="animate-spin" />
          </div>
        )}
        <div className="text-center mb-2">
          Tempo restante: {formatarTempo(tempo)}
        </div>
        {tempo === 0 && (
          <div className="text-center text-red-600 mb-2">
            Código expirado. Clique em reenviar.
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            placeholder="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#1565c0',
              color: '#fff',
              borderRadius: '25px',
              padding: '10px 20px',
              fontWeight: 'bold',
              border: 'none',
              width: '60%',
              marginTop: '20px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
            disabled={enviando}
            className="hover:bg-[#0d47a1] disabled:opacity-60"
          >
            {enviando ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
        {podeReenviar && (
          <button onClick={reenviarCodigo} className="mt-2 text-sm text-blue-600 hover:underline">Reenviar código</button>
        )}
      </div>
    </div>
  );
}