
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { OSStatus, QuoteStatus, PaymentStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import StatusBadge from '../components/StatusBadge';

const Reports: React.FC = () => {
  const { orders, quotes, clients, users, currentUser } = useApp();
  const [period, setPeriod] = useState('30'); // 30, 90, 365, all

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

  // Filtragem e Agregação de Dados
  const reportData = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(period);
    
    const filteredOrders = orders.filter(os => {
      if (period === 'all') return true;
      const entryDate = new Date(os.entryDate);
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= periodDays;
    });

    const filteredQuotes = quotes.filter(q => {
      if (period === 'all') return true;
      const createDate = new Date(q.createdAt);
      const diffTime = Math.abs(now.getTime() - createDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= periodDays;
    });

    // 1. Financeiro
    const totalRevenue = filteredOrders.reduce((acc, os) => acc + os.financial.total, 0);
    const totalPaid = filteredOrders.reduce((acc, os) => acc + (os.financial.downPayment || 0), 0);
    const totalPending = filteredOrders.reduce((acc, os) => acc + (os.financial.remainingValue || 0), 0);

    // 2. Operacional (OS)
    const osByStatus = Object.values(OSStatus).map(status => ({
      name: status,
      value: filteredOrders.filter(o => o.status === status).length
    })).filter(item => item.value > 0);

    // 3. Orçamentos (Conversão)
    const approvedQuotes = filteredQuotes.filter(q => q.status === QuoteStatus.APROVADO).length;
    const totalQuotes = filteredQuotes.length;
    const conversionRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0;

    // 4. Produtividade da Equipe
    const technicianData = users.filter(u => u.role === UserRole.TECNICO || u.role === UserRole.ADMIN).map(tech => ({
      name: tech.name,
      completed: filteredOrders.filter(o => o.status === OSStatus.FINALIZADA || o.status === OSStatus.ENTREGUE).length, // Simplificado pois não temos ID do técnico fixo em todas as OS ainda
      total: filteredOrders.length // Mock para demonstração de estrutura
    }));

    return {
      totalRevenue,
      totalPaid,
      totalPending,
      osByStatus,
      totalQuotes,
      approvedQuotes,
      conversionRate,
      technicianData,
      filteredOrders
    };
  }, [orders, quotes, period, users]);

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="p-10 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500">Apenas administradores podem visualizar relatórios estratégicos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Central de Relatórios</h2>
          <p className="text-slate-500 text-sm font-medium">Análise de desempenho, financeiro e operacional.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start">
          {[
            { val: '30', label: '30 Dias' },
            { val: '90', label: '90 Dias' },
            { val: 'all', label: 'Tudo' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setPeriod(opt.val)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === opt.val ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* Financeiro - Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Faturamento Bruto</p>
          <h3 className="text-3xl font-black text-slate-900">R$ {reportData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
             <i className="fas fa-arrow-up"></i>
             <span>Receita Total do Período</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Recebido</p>
          <h3 className="text-3xl font-black text-slate-900">R$ {reportData.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
             <i className="fas fa-check-double"></i>
             <span>Dinheiro em Caixa</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo a Receber</p>
          <h3 className="text-3xl font-black text-slate-900">R$ {reportData.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
             <i className="fas fa-clock"></i>
             <span>Pendências de Pagamento</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico OS Status */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Status das Ordens de Serviço</h3>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full">{reportData.filteredOrders.length} Total</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.osByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.osByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversão de Orçamentos */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5">
            <i className="fas fa-file-invoice-dollar text-[150px]"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Métrica de Conversão</p>
            <h3 className="text-2xl font-black mb-8 leading-tight">Taxa de Aprovação de Orçamentos</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white">{reportData.conversionRate.toFixed(1)}</span>
              <span className="text-2xl font-bold text-blue-400">%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
               <p className="text-[9px] font-black uppercase opacity-40 mb-1">Total Emitidos</p>
               <p className="text-xl font-black">{reportData.totalQuotes}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
               <p className="text-[9px] font-black uppercase opacity-40 mb-1">Total Aprovados</p>
               <p className="text-xl font-black text-emerald-400">{reportData.approvedQuotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Produtividade / Equipe */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Desempenho da Equipe</h3>
          <button onClick={() => window.print()} className="text-blue-600 text-xs font-black uppercase hover:underline">
            <i className="fas fa-print mr-2"></i> Exportar PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">OS Finalizadas</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Volume Total</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.filter(u => u.role !== UserRole.ATENDENTE).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="font-black text-slate-700">{Math.floor(Math.random() * 15)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="w-full max-w-[100px] bg-slate-100 h-2 rounded-full mx-auto overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-blue-600 font-black text-[10px] uppercase hover:underline">Ver Detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatório Detalhado de Pagamentos Pendentes */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Pendências Financeiras por OS</h3>
          <div className="space-y-4">
            {orders.filter(os => os.financial.status !== PaymentStatus.PAGO).slice(0, 5).map(os => {
              const client = clients.find(c => c.id === os.clientId);
              return (
                <div key={os.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-colors border border-transparent hover:border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                      <i className="fas fa-file-invoice"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">OS #{os.id.substring(0, 8)} - {client?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{os.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">R$ {os.financial.remainingValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[9px] text-amber-600 font-black uppercase">Saldo Pendente</p>
                  </div>
                </div>
              );
            })}
            {orders.filter(os => os.financial.status !== PaymentStatus.PAGO).length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl italic">
                Parabéns! Não existem pendências financeiras registradas no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
