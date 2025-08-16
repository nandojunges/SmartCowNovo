import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviandoConfirmacao, setEnviandoConfirmacao] = useState(false);
  const navigate = useNavigate();

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEmailEnviado(true);
      toast.success('Código enviado ao e-mail.');
    } catch (err) {
      toast.error('Erro ao enviar e-mail');
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCodigo = async (e) => {
    e.preventDefault();
    setEnviandoConfirmacao(true);
    try {
      await api.post('/auth/verify-code', {
        email: email.trim().toLowerCase(),
        codigo: String(codigo).trim(),
        senha: novaSenha,
      });
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err) {
      toast.error('Código incorreto ou expirado');
    } finally {
      setEnviandoConfirmacao(false);
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
        <h2 className="text-xl font-bold text-center mb-4">Recuperar Senha</h2>
          {!emailEnviado ? (
            <form onSubmit={enviarCodigo} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="input-senha-container">
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-senha"
                  />
                </div>
              </div>
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
                {enviando ? 'Enviando...' : 'Recuperar Senha'}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmarCodigo} className="flex flex-col gap-4">
              <p className="text-center text-green-700">Código enviado ao e-mail</p>
              <div className="input-senha-container">
                <input
                  type="text"
                  placeholder="Código"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="input-senha"
                />
              </div>
                <div className="input-senha-container">
                  <input
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="input-senha input-senha-olho"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="botao-olho"
                  >
                    {mostrarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
                disabled={enviandoConfirmacao}
                className="hover:bg-[#0d47a1] disabled:opacity-60"
              >
                {enviandoConfirmacao ? 'Enviando...' : 'Resetar Senha'}
              </button>
            </form>
          )}
      </div>
    </div>
  );
}