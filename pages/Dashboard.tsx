
import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { OSStatus } from '../types';

const Dashboard: React.FC = () => {
  const { orders, clients, quotes, currentUser, systemPermissions } = useApp();

  const allStats = [
    { id: 'card_os_abertas', label: 'OS Abertas', value: orders.filter(o => o.status !== OSStatus.ENTREGUE && o.status !== OSStatus.CANCELADA).length, icon: 'fa-clipboard-list', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'card_clientes_ativos', label: 'Clientes Ativos', value: clients.filter(c => c.active).length, icon: 'fa-users', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'card_orcamentos_pendentes', label: 'Orçamentos', value: quotes.filter(q => q.status === 'Aguardando aprovação').length, icon: 'fa-file-invoice-dollar', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'card_faturamento', label: 'Faturamento', value: `R$ ${orders.reduce((acc, curr) => acc + curr.financial.total, 0).toLocaleString('pt-BR')}`, icon: 'fa-money-bill-wave', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  // Filtra stats baseada na permissão do usuário
  const userAllowedKeys = currentUser ? systemPermissions[currentUser.role] || [] : [];
  const stats = allStats.filter(s => userAllowedKeys.includes(s.id));

  const statusData = Object.values(OSStatus).map(status => ({
    name: status,
    value: orders.filter(o => o.status === status).length
  })).filter(item => item.value > 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Olá, {currentUser?.name}!</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Resumo operacional da oficina.</p>
        </div>
        <div className="md:hidden w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">
          {currentUser?.name.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* KPI Section */}
      <div className={`grid grid-cols-2 lg:grid-cols-${Math.max(2, Math.min(stats.length, 4))} gap-3 md:gap-4`}>
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 md:gap-4 transition-all hover:border-blue-200">
            <div className={`${stat.bg} ${stat.color} w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-sm md:text-lg shrink-0`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="min-w-0 w-full">
              <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <h3 className="text-sm md:text-2xl font-black text-slate-900 truncate">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-base md:text-lg font-black text-slate-800 mb-4 md:mb-6">Status de OS</h3>
          <div className="h-[180px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base md:text-lg font-black text-slate-800">Recentes</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline">Ver todas</button>
          </div>
          <div className="divide-y divide-slate-50">
            {orders.slice(-5).reverse().map((os) => {
              const client = clients.find(c => c.id === os.clientId);
              return (
                <div key={os.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[10px] font-black text-blue-600 uppercase">#{os.id.substring(0, 8)}</p>
                    <h4 className="text-sm font-bold text-slate-800 truncate">{client?.name || 'Cliente Removido'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Entrada: {new Date(os.entryDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={os.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
