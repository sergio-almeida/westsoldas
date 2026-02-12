
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { maskDocument, maskPhone } from '../utils/validation';

const Settings: React.FC = () => {
  const { companyInfo, updateCompanyInfo, currentUser, systemPermissions, updateSystemPermissions } = useApp();
  const [form, setForm] = useState(companyInfo);
  const [perms, setPerms] = useState(systemPermissions);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'empresa' | 'permissoes'>('empresa');

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500">Apenas administradores podem configurar dados da empresa e permissões.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'document') finalValue = maskDocument(value);
    if (name === 'phone') finalValue = maskPhone(value);
    setForm(prev => ({ ...prev, [name]: finalValue }));
    setIsSaved(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (role: UserRole, key: string) => {
    const currentAllowed = perms[role] || [];
    let newAllowed = [];
    if (currentAllowed.includes(key)) {
      newAllowed = currentAllowed.filter(id => id !== key);
    } else {
      newAllowed = [...currentAllowed, key];
    }
    setPerms({ ...perms, [role]: newAllowed });
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'empresa') {
      updateCompanyInfo(form);
    } else {
      updateSystemPermissions(perms);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const systemModules = [
    { key: 'mod_dashboard', label: 'Painel Principal (Dashboard)' },
    { key: 'mod_clientes', label: 'Módulo de Clientes' },
    { key: 'mod_maquinas', label: 'Módulo de Máquinas' },
    { key: 'mod_orcamentos', label: 'Módulo de Orçamentos' },
    { key: 'mod_ordens', label: 'Módulo de Ordens de Serviço' },
    { key: 'mod_relatorios', label: 'Módulo de Relatórios' },
    { key: 'mod_equipe', label: 'Módulo de Equipe/Usuários' },
    { key: 'mod_empresa', label: 'Módulo de Config. Empresa' },
  ];

  const dashboardCards = [
    { key: 'card_os_abertas', label: 'Card: OS Abertas' },
    { key: 'card_clientes_ativos', label: 'Card: Clientes Ativos' },
    { key: 'card_orcamentos_pendentes', label: 'Card: Orçamentos' },
    { key: 'card_faturamento', label: 'Card: Faturamento Financeiro' },
  ];

  const roles = Object.values(UserRole);

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Configurações do Sistema</h2>
          <p className="text-slate-500 text-sm font-medium">Personalize os dados da empresa e permissões de acesso.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('empresa')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'empresa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            Dados Empresa
          </button>
          <button 
            onClick={() => setActiveTab('permissoes')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'permissoes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            Permissões por Perfil
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12">
        {activeTab === 'empresa' ? (
          <form onSubmit={handleSave} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div className="shrink-0 space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Logo da Empresa</label>
                  <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                     {form.logo ? (
                       <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                     ) : (
                       <i className="fas fa-image text-slate-300 text-3xl"></i>
                     )}
                     <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleLogoChange}
                     />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold text-center">Clique para alterar</p>
               </div>

               <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome da Empresa</label>
                      <input 
                        name="name" 
                        value={form.name} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">CNPJ</label>
                      <input 
                        name="document" 
                        value={form.document} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Telefone</label>
                      <input 
                        name="phone" 
                        value={form.phone} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail</label>
                      <input 
                        type="email"
                        name="email" 
                        value={form.email} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Endereço Completo</label>
                    <textarea 
                      name="address" 
                      value={form.address} 
                      onChange={handleInputChange} 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-24 outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" 
                      required
                    />
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              {isSaved && (
                <span className="text-emerald-500 font-bold text-sm animate-fadeIn">
                  <i className="fas fa-check-circle mr-2"></i> Dados salvos!
                </span>
              )}
              <div className="flex-1"></div>
              <button 
                type="submit" 
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 shadow-xl transition-all uppercase text-xs tracking-widest"
              >
                Salvar Empresa
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="mb-6">
                <h4 className="text-lg font-black text-slate-800">Módulos do Sistema</h4>
                <p className="text-slate-500 text-sm">Controle o acesso a páginas e funcionalidades laterais.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Página / Módulo</th>
                      {roles.map(role => (
                        <th key={role} className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {systemModules.map(module => (
                      <tr key={module.key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-700 text-sm">{module.label}</p>
                        </td>
                        {roles.map(role => (
                          <td key={`${role}-${module.key}`} className="py-4 px-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={perms[role]?.includes(module.key)}
                                  onChange={() => togglePermission(role, module.key)}
                                  disabled={role === UserRole.ADMIN && module.key === 'mod_empresa'} // Prevenção básica de admin se trancar
                                />
                                <div className="w-10 h-5 bg-slate-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              </div>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <h4 className="text-lg font-black text-slate-800">Cartões do Dashboard</h4>
                <p className="text-slate-500 text-sm">Controle quais indicadores de performance cada perfil visualiza.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Indicador</th>
                      {roles.map(role => (
                        <th key={role} className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboardCards.map(card => (
                      <tr key={card.key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-700 text-sm">{card.label}</p>
                        </td>
                        {roles.map(role => (
                          <td key={`${role}-${card.key}`} className="py-4 px-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={perms[role]?.includes(card.key)}
                                  onChange={() => togglePermission(role, card.key)}
                                />
                                <div className="w-10 h-5 bg-slate-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              </div>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              {isSaved && (
                <span className="text-emerald-500 font-bold text-sm animate-fadeIn">
                  <i className="fas fa-check-circle mr-2"></i> Permissões atualizadas com sucesso!
                </span>
              )}
              <div className="flex-1"></div>
              <button 
                onClick={handleSave}
                className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl transition-all uppercase text-xs tracking-widest"
              >
                Aplicar Permissões
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
