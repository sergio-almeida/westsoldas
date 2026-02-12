
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isValidEmail } from '../utils/validation';

type ViewState = 'login' | 'forgot' | 'reset';

const Login: React.FC = () => {
  const { login, forgotPassword, resetPasswordByToken } = useApp();
  const [view, setView] = useState<ViewState>('login');
  
  // Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot / Reset Fields
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !isValidEmail(email)) {
      setError('Insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);
    
    if (result.success) {
      setView('reset');
      alert('Se o e-mail estiver cadastrado, você receberá um token de recuperação.');
    } else {
      setError(result.message);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !newPassword) {
      setError('Preencha o token e a nova senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setIsLoading(true);
    const result = await resetPasswordByToken(token, newPassword);
    setIsLoading(false);

    if (result.success) {
      alert('Senha redefinida com sucesso! Agora você pode fazer login.');
      setView('login');
      setPassword('');
      setToken('');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-10 animate-scaleUp">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-xl shadow-blue-200">
            <i className="fas fa-plug"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900">WestSoldas <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-400 font-medium mt-2">
            {view === 'login' ? 'Acesse sua conta' : view === 'forgot' ? 'Recuperar conta' : 'Nova senha'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-fadeIn flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-slate-400">E-mail</label>
                <input 
                  type="email" 
                  autoComplete="email"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <div className="flex justify-between px-1 mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                  <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Esqueci minha senha</button>
                </div>
                <input 
                  type="password" 
                  autoComplete="current-password"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Entrar no Sistema'}
            </button>
            
            <div className="pt-4 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase">Utilize as credenciais de teste admin@oficina.com / admin</p>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed text-center font-medium">Insira o e-mail cadastrado. Enviaremos as instruções para a criação de uma nova senha.</p>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-slate-400">E-mail de Cadastro</label>
              <input 
                type="email" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest flex items-center justify-center"
              >
                {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Enviar E-mail de Recuperação'}
              </button>
              <button type="button" onClick={() => setView('login')} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Voltar para Login</button>
            </div>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-slate-400">Token enviado ao e-mail</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black tracking-widest outline-none text-center"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-slate-400">Nova Senha</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 px-1 text-slate-400">Confirmar Senha</label>
                <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest flex items-center justify-center"
              >
                {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Atualizar Senha'}
              </button>
              <button type="button" onClick={() => setView('login')} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Cancelar e voltar</button>
            </div>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Sistema de Gestão WeldMaster Pro v1.5
        </p>
      </div>
    </div>
  );
};

export default Login;
