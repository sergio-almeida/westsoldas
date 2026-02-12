
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout, systemPermissions } = useApp();
  const location = useLocation();

  const menuItems = [
    { key: 'mod_dashboard', path: '/', label: 'Dashboard', icon: 'fa-chart-line' },
    { key: 'mod_clientes', path: '/clientes', label: 'Clientes', icon: 'fa-users' },
    { key: 'mod_maquinas', path: '/maquinas', label: 'Máquinas', icon: 'fa-tools' },
    { key: 'mod_orcamentos', path: '/orcamentos', label: 'Orçamentos', icon: 'fa-file-invoice-dollar' },
    { key: 'mod_ordens', path: '/ordens-servico', label: 'Ordens de Serviço', icon: 'fa-clipboard-list' },
    { key: 'mod_relatorios', path: '/relatorios', label: 'Relatórios', icon: 'fa-chart-pie' },
    { key: 'mod_equipe', path: '/usuarios', label: 'Equipe', icon: 'fa-user-cog' },
    { key: 'mod_empresa', path: '/configuracoes', label: 'Empresa', icon: 'fa-building' },
  ];

  if (!currentUser) return null;

  const userPerms = systemPermissions[currentUser.role] || [];
  const allowedMenuItems = menuItems.filter(item => userPerms.includes(item.key));

  const handleLinkClick = () => {
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden animate-fadeIn" onClick={onClose}></div>
      )}

      <aside className={`
        fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col shadow-xl z-[70] transition-transform duration-300 ease-in-out
        w-72 md:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-plug text-blue-500"></i>
            WestSoldas <span className="text-blue-500">Pro</span>
          </h1>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white text-xl p-2">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto px-4 space-y-1">
          {allowedMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-red-900 hover:text-white transition-colors text-sm font-bold"
          >
            <i className="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
