
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { isValidEmail, maskPhone } from '../utils/validation';

const Users: React.FC = () => {
  const { users, addUser, updateUser, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.TECNICO,
    active: true
  });

  const [resetPassValues, setResetPassValues] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    email: false,
    phone: false
  });

  useEffect(() => {
    setShowPassword(false);
    if (editingUser) {
      setFormValues({
        name: editingUser.name,
        email: editingUser.email,
        password: editingUser.password || '',
        phone: editingUser.phone || '',
        role: editingUser.role,
        active: editingUser.active
      });
      setErrors({ email: false, phone: false });
    } else {
      setFormValues({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: UserRole.TECNICO,
        active: true
      });
      setErrors({ email: false, phone: false });
    }
  }, [editingUser, isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let maskedValue = value;

    if (name === 'phone') {
      maskedValue = maskPhone(value);
      setErrors(prev => ({ ...prev, phone: false }));
    }
    
    if (name === 'email') {
      setErrors(prev => ({ ...prev, email: false }));
    }

    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : maskedValue;
    setFormValues(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetPassValues(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const isEmailValid = isValidEmail(formValues.email);
    const isPhoneValid = formValues.phone.replace(/\D/g, '').length >= 10;
    
    setErrors({
      email: !isEmailValid,
      phone: !isPhoneValid
    });

    return isEmailValid && isPhoneValid;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const userData: User = {
      id: editingUser ? editingUser.id : Math.random().toString(36).substr(2, 9),
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
      phone: formValues.phone,
      role: formValues.role,
      active: formValues.active
    };

    if (editingUser) {
      updateUser(userData);
    } else {
      addUser(userData);
    }
    
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleOpenResetModal = (user: User) => {
    setResettingUser(user);
    setResetPassValues({ newPassword: '', confirmPassword: '' });
    setShowResetPassword(false);
    setIsResetModalOpen(true);
  };

  const handleQuickResetSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (resetPassValues.newPassword !== resetPassValues.confirmPassword) {
      alert('As senhas não conferem!');
      return;
    }

    if (resetPassValues.newPassword.length < 3) {
      alert('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    updateUser({ ...resettingUser, password: resetPassValues.newPassword });
    setIsResetModalOpen(false);
    setResettingUser(null);
    alert('Senha atualizada com sucesso!');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="p-10 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Equipe e Usuários</h2>
          <p className="text-slate-500 text-sm font-medium">Controle de colaboradores e permissões de acesso.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm font-bold"
        >
          <i className="fas fa-plus"></i> Novo Usuário
        </button>
      </header>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:border-blue-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-2">
                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600' : user.role === UserRole.TECNICO ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  {user.role}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenResetModal(user)}
                    className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
                    title="Trocar Senha"
                  >
                    <i className="fas fa-key text-xs"></i>
                  </button>
                  <button 
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                    title="Editar Usuário"
                  >
                    <i className="fas fa-edit text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <h3 className="font-black text-slate-900 text-lg truncate">{user.name}</h3>
            <div className="space-y-1.5 mt-3">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 truncate">
                <i className="fas fa-envelope w-4 text-center text-slate-300"></i> {user.email}
              </p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <i className="fas fa-phone w-4 text-center text-slate-300"></i> {user.phone || 'N/A'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className={`text-[10px] font-black uppercase tracking-tighter ${user.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                <i className={`fas fa-circle text-[6px] mr-1 ${user.active ? 'animate-pulse' : ''}`}></i>
                {user.active ? 'Ativo' : 'Inativo'}
              </span>
              {user.id === currentUser?.id && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">Você</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edição/Novo Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scaleUp overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <h3 className="text-xl font-black text-slate-900">
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                  <input 
                    name="name" 
                    value={formValues.name} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 px-1 ${errors.email ? 'text-red-500' : 'text-slate-400'}`}>
                      E-mail {errors.email && '(Formato inválido)'}
                    </label>
                    <input 
                      type="email"
                      name="email" 
                      value={formValues.email} 
                      onChange={handleInputChange} 
                      required 
                      className={`w-full p-4 bg-slate-50 border ${errors.email ? 'border-red-300 ring-1 ring-red-50' : 'border-slate-100'} rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700`}
                      placeholder="tecnico@oficina.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Senha de Acesso</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        name="password" 
                        value={formValues.password} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        placeholder="Senha inicial"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 px-1 ${errors.phone ? 'text-red-500' : 'text-slate-400'}`}>
                    Telefone {errors.phone && '(Formato inválido)'}
                  </label>
                  <input 
                    name="phone" 
                    value={formValues.phone} 
                    onChange={handleInputChange} 
                    required 
                    className={`w-full p-4 bg-slate-50 border ${errors.phone ? 'border-red-300 ring-1 ring-red-50' : 'border-slate-100'} rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700`}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cargo / Perfil</label>
                    <select 
                      name="role" 
                      value={formValues.role} 
                      onChange={handleInputChange} 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs tracking-wider"
                    >
                      {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center pt-6 px-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          name="active" 
                          checked={formValues.active} 
                          onChange={handleInputChange} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all uppercase text-xs tracking-widest">
                  {editingUser ? 'Atualizar' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Troca Rápida de Senha */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-scaleUp overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-900">Alterar Senha</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{resettingUser.name}</p>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleQuickResetSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showResetPassword ? 'text' : 'password'}
                      name="newPassword" 
                      value={resetPassValues.newPassword} 
                      onChange={handleResetInputChange} 
                      required 
                      autoFocus
                      className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-amber-600 transition-colors"
                    >
                      <i className={`fas ${showResetPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Confirmar Senha</label>
                  <input 
                    type={showResetPassword ? 'text' : 'password'}
                    name="confirmPassword" 
                    value={resetPassValues.confirmPassword} 
                    onChange={handleResetInputChange} 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button type="submit" className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-900/20 transition-all uppercase text-xs tracking-widest">
                  Confirmar Troca
                </button>
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
