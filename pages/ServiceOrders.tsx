
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OSStatus, ServiceOrder, PaymentStatus, UserRole, PaymentMethod, MachineVoltage } from '../types';
import StatusBadge from '../components/StatusBadge';
import { maskCurrency, parseCurrencyToNumber } from '../utils/validation';
import { printDocument } from '../utils/print';

const ServiceOrders: React.FC = () => {
  const { orders, clients, machines, updateOS, addOS, currentUser, companyInfo } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingOS, setViewingOS] = useState<ServiceOrder | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingFinancial, setIsEditingFinancial] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newOSForm, setNewOSForm] = useState({ 
    clientId: '', 
    machineId: '', 
    identifiedDefect: '', 
    estimatedDate: new Date().toISOString().split('T')[0] 
  });

  const [finForm, setFinForm] = useState({ 
    serviceValue: '0,00', 
    partsValue: '0,00', 
    discount: '0,00', 
    downPayment: '0,00', 
    paymentType: 'AVISTA' as any, 
    method: PaymentMethod.PIX, 
    installments: 1, 
    status: PaymentStatus.PENDENTE 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const canEditStatus = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.TECNICO;
  const canUploadPhotos = currentUser?.role === UserRole.TECNICO || currentUser?.role === UserRole.ADMIN;
  const canCreateOS = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ATENDENTE;
  const canEditFinancial = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ATENDENTE;

  useEffect(() => {
    if (viewingOS) {
      setFinForm({
        serviceValue: maskCurrency(viewingOS.financial.serviceValue),
        partsValue: maskCurrency(viewingOS.financial.partsValue),
        discount: maskCurrency(viewingOS.financial.discount || 0),
        downPayment: maskCurrency(viewingOS.financial.downPayment || 0),
        paymentType: viewingOS.financial.paymentType,
        method: viewingOS.financial.method,
        installments: viewingOS.financial.installments || 1,
        status: viewingOS.financial.status
      });
    }
  }, [viewingOS, isEditingFinancial]);

  const handleUpdateStatus = (os: ServiceOrder, newStatus: OSStatus) => {
    const updatedOS = { ...os, status: newStatus };
    updateOS(updatedOS);
    if (viewingOS?.id === os.id) {
      setViewingOS({ 
        ...updatedOS, 
        statusHistory: [
          ...(viewingOS.statusHistory || []), 
          { status: newStatus, user: currentUser?.name || 'Sistema', timestamp: new Date().toISOString() }
        ] 
      });
    }
  };

  const handlePrint = (os: ServiceOrder) => {
    const client = clients.find(c => c.id === os.clientId);
    const machine = machines.find(m => m.id === os.machineId);
    if (client && machine) {
      printDocument('Ordem de Serviço', companyInfo, client, machine, os);
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFinForm(prev => ({ ...prev, [field]: maskCurrency(e.target.value) }));
  };

  const handleRegisterPayment = () => {
    if (!viewingOS) return;
    
    const remaining = viewingOS.financial.remainingValue || 0;
    if (remaining <= 0) {
      alert('Esta ordem de serviço já está totalmente paga.');
      return;
    }

    const valueStr = prompt(`Registrar pagamento para OS #${viewingOS.id.substring(0,8)}.\nSaldo restante: R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\nDigite o valor pago:`, remaining.toFixed(2).replace('.', ','));
    
    if (valueStr !== null) {
      const paidValue = parseCurrencyToNumber(maskCurrency(valueStr));
      if (isNaN(paidValue) || paidValue <= 0) {
        alert('Valor inválido.');
        return;
      }

      if (paidValue > remaining + 0.01) {
        alert('O valor informado é maior que o saldo restante.');
        return;
      }

      const newDownPayment = (viewingOS.financial.downPayment || 0) + paidValue;
      const newRemaining = Math.max(0, viewingOS.financial.total - newDownPayment);
      const newStatus = newRemaining <= 0.01 ? PaymentStatus.PAGO : PaymentStatus.PARCIAL;

      const updatedOS: ServiceOrder = {
        ...viewingOS,
        financial: {
          ...viewingOS.financial,
          downPayment: newDownPayment,
          remainingValue: newRemaining,
          status: newStatus,
          paymentDates: [...(viewingOS.financial.paymentDates || []), new Date().toISOString()]
        }
      };

      updateOS(updatedOS);
      setViewingOS(updatedOS);
      alert('Pagamento registrado com sucesso!');
    }
  };

  const handleSimulateBoleto = () => {
    alert('Simulando geração de boleto bancário...\n\nEm uma versão de produção, aqui seria integrado com uma API de gateway de pagamento (Asaas, Juno, PJBank, etc) para gerar o PDF real.');
  };

  const handleSaveFinancial = () => {
    if (!viewingOS) return;
    const sVal = parseCurrencyToNumber(finForm.serviceValue);
    const pVal = parseCurrencyToNumber(finForm.partsValue);
    const dVal = parseCurrencyToNumber(finForm.discount);
    const downVal = parseCurrencyToNumber(finForm.downPayment);
    
    const total = sVal + pVal - dVal;
    const remaining = total - downVal;
    
    const updatedOS: ServiceOrder = {
      ...viewingOS,
      financial: { 
        ...viewingOS.financial, 
        serviceValue: sVal, 
        partsValue: pVal, 
        discount: dVal, 
        downPayment: downVal, 
        total: Math.max(0, total), 
        remainingValue: Math.max(0, remaining), 
        paymentType: finForm.paymentType, 
        method: finForm.method, 
        installments: finForm.installments, 
        status: remaining <= 0.01 ? PaymentStatus.PAGO : (downVal > 0 ? PaymentStatus.PARCIAL : PaymentStatus.PENDENTE)
      }
    };
    updateOS(updatedOS);
    setViewingOS(updatedOS);
    setIsEditingFinancial(false);
  };

  const handleCreateDirectOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOSForm.clientId || !newOSForm.machineId) return;
    
    const newOS: ServiceOrder = {
      id: `OS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      clientId: newOSForm.clientId, 
      machineId: newOSForm.machineId, 
      identifiedDefect: newOSForm.identifiedDefect, 
      servicesExecuted: '', 
      photos: [], 
      status: OSStatus.ABERTA, 
      statusHistory: [{ status: OSStatus.ABERTA, user: currentUser?.name || 'Sistema', timestamp: new Date().toISOString() }], 
      entryDate: new Date().toISOString(), 
      estimatedDate: new Date(newOSForm.estimatedDate).toISOString(), 
      warrantyDays: 90,
      financial: { 
        serviceValue: 0, 
        partsValue: 0, 
        discount: 0, 
        total: 0, 
        paymentType: 'AVISTA', 
        status: PaymentStatus.PENDENTE, 
        method: PaymentMethod.PIX, 
        paymentDates: [] 
      }
    };
    addOS(newOS);
    setIsCreateModalOpen(false);
    setNewOSForm({ clientId: '', machineId: '', identifiedDefect: '', estimatedDate: new Date().toISOString().split('T')[0] });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingOS) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedOS = { ...viewingOS, photos: [...viewingOS.photos, reader.result as string] };
      updateOS(updatedOS);
      setViewingOS(updatedOS);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const filteredOrders = orders.filter(os => {
    const client = clients.find(c => c.id === os.clientId);
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || os.id.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">Ordens de Serviço</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Controle técnico e acompanhamento em tempo real.</p>
        </div>
        {canCreateOS && (
          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm font-bold"
          >
            <i className="fas fa-plus"></i> Nova OS Direta
          </button>
        )}
      </header>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por cliente ou número da OS..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(os => {
          const client = clients.find(c => c.id === os.clientId);
          const machine = machines.find(m => m.id === os.machineId);
          return (
            <div key={os.id} className="bg-white rounded-[2.2rem] shadow-sm border border-slate-100 p-5 md:p-6 hover:border-blue-200 transition-all group">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-tighter bg-blue-50 px-2 py-1 rounded-lg">#{os.id.substring(0, 8)}</span>
                      <StatusBadge status={os.status} />
                    </div>
                    <h3 className="font-black text-slate-900 text-base md:text-xl truncate mb-1">{client?.name || 'Cliente Removido'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{machine?.brand} {machine?.model} • {machine?.type}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total OS</p>
                    <p className="font-black text-slate-900 text-base md:text-xl text-blue-600">R$ {os.financial.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Entrada</span>
                      <span className="text-[11px] md:text-xs text-slate-600 font-black">{new Date(os.entryDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <button 
                      onClick={() => handlePrint(os)} 
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all" 
                      title="Imprimir OS"
                    >
                      <i className="fas fa-print"></i>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {canEditStatus && (
                      <select 
                        value={os.status} 
                        onChange={(e) => handleUpdateStatus(os, e.target.value as OSStatus)} 
                        className="bg-slate-50 text-[10px] font-black uppercase px-3 py-2 rounded-xl border-none outline-none h-10 cursor-pointer focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    <button 
                      onClick={() => { setViewingOS(os); setIsModalOpen(true); }} 
                      className="w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center transition-all shadow-lg shadow-blue-100"
                    >
                      <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-8">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800">Nenhuma OS encontrada</h3>
            <p className="text-slate-400 font-medium mt-2">Tente ajustar sua busca ou crie uma nova OS.</p>
          </div>
        )}
      </div>

      {/* Modal Nova OS Direta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden">
             <div className="p-6 md:p-8 border-b flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-xl md:text-2xl font-black text-slate-900">Nova Ordem de Serviço</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Criação rápida sem orçamento prévio</p>
               </div>
               <button onClick={() => setIsCreateModalOpen(false)} className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center">
                 <i className="fas fa-times"></i>
               </button>
             </div>
             <form onSubmit={handleCreateDirectOS} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cliente</label>
                    <select required value={newOSForm.clientId} onChange={(e) => setNewOSForm({...newOSForm, clientId: e.target.value, machineId: ''})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Selecione o cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Equipamento</label>
                    <select required disabled={!newOSForm.clientId} value={newOSForm.machineId} onChange={(e) => setNewOSForm({...newOSForm, machineId: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50">
                      <option value="">Selecione a máquina...</option>
                      {machines.filter(m => m.clientId === newOSForm.clientId).map(m => <option key={m.id} value={m.id}>{m.brand} {m.model} (S/N: {m.serialNumber})</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Relato do Problema</label>
                  <textarea required value={newOSForm.identifiedDefect} onChange={(e) => setNewOSForm({...newOSForm, identifiedDefect: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-32 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="O que está acontecendo com a máquina?" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Previsão de Entrega</label>
                  <input type="date" required value={newOSForm.estimatedDate} onChange={(e) => setNewOSForm({...newOSForm, estimatedDate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Descartar</button>
                  <button type="submit" className="flex-2 px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all uppercase text-[10px] tracking-widest">Abrir Ordem de Serviço</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Modal Visualização/Edição Detalhada da OS */}
      {isModalOpen && viewingOS && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-6xl h-[95vh] md:max-h-[92vh] overflow-y-auto shadow-2xl animate-slideUp no-scrollbar">
             {/* Header Fixo do Modal */}
             <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur-md z-20">
               <div className="flex-1">
                 <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900">OS #{viewingOS.id.substring(0, 8)}</h3>
                    <StatusBadge status={viewingOS.status} />
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Data de Entrada</span>
                      <span className="text-xs md:text-sm font-black text-slate-600">{new Date(viewingOS.entryDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Cliente</span>
                      <span className="text-xs md:text-sm font-black text-slate-600">{clients.find(c => c.id === viewingOS.clientId)?.name}</span>
                    </div>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <button onClick={() => handlePrint(viewingOS)} className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Imprimir OS"><i className="fas fa-print"></i></button>
                 <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 text-slate-500 w-12 h-12 rounded-full hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"><i className="fas fa-times text-lg"></i></button>
               </div>
             </div>

             <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Coluna Esquerda - Técnica */}
               <div className="lg:col-span-7 space-y-10">
                 <section>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div> Descrição do Defeito
                   </h4>
                   <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                     <p className="text-slate-700 leading-relaxed font-medium text-sm md:text-lg italic">"{viewingOS.identifiedDefect}"</p>
                   </div>
                 </section>

                 <section>
                   <div className="flex justify-between items-center mb-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Serviços Realizados
                    </h4>
                    {canEditStatus && (
                       <button 
                        onClick={() => {
                          const result = prompt("Descreva o serviço executado nesta máquina:", viewingOS.servicesExecuted);
                          if (result !== null) {
                            updateOS({...viewingOS, servicesExecuted: result});
                            setViewingOS({...viewingOS, servicesExecuted: result});
                          }
                        }}
                        className="text-blue-600 text-[10px] font-black uppercase hover:underline"
                       >
                         Atualizar Diagnóstico
                       </button>
                    )}
                   </div>
                   <div className="bg-emerald-50/20 p-8 rounded-[2rem] border border-emerald-100/50">
                     <p className="text-emerald-900 leading-relaxed text-sm md:text-lg font-bold">
                       {viewingOS.servicesExecuted || 'Nenhum serviço registrado até o momento. O técnico deve atualizar este campo conforme o progresso.'}
                     </p>
                   </div>
                 </section>

                 <section>
                   <div className="flex justify-between items-center mb-5">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Evidências Fotográficas
                     </h4>
                     {canUploadPhotos && (
                       <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-blue-600 text-[10px] font-black uppercase hover:underline">
                         + Anexar Foto
                       </button>
                     )}
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {viewingOS.photos.map((p, i) => (
                       <div key={i} className="group relative aspect-square overflow-hidden rounded-[1.5rem] border border-slate-100 shadow-sm">
                          <img src={p} alt="Máquina" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button onClick={() => window.open(p, '_blank')} className="text-white bg-white/20 p-3 rounded-full backdrop-blur-md">
                               <i className="fas fa-expand-alt"></i>
                             </button>
                          </div>
                       </div>
                     ))}
                     {viewingOS.photos.length === 0 && !isUploading && (
                       <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300">
                          <i className="fas fa-images text-2xl mb-2"></i>
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma foto anexada</p>
                       </div>
                     )}
                     {isUploading && (
                       <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50 rounded-[1.5rem] text-blue-500 animate-pulse">
                         <i className="fas fa-circle-notch fa-spin text-xl mb-2"></i>
                         <span className="text-[8px] font-black uppercase">Enviando...</span>
                       </div>
                     )}
                   </div>
                   {canUploadPhotos && <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />}
                 </section>
               </div>

               {/* Coluna Direita - Financeiro e Prazos */}
               <div className="lg:col-span-5 space-y-8">
                 <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl space-y-8 transition-all border border-white/5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest">Controle Financeiro</h4>
                      {canEditFinancial && !isEditingFinancial && (
                        <button 
                          onClick={() => setIsEditingFinancial(true)}
                          className="text-blue-400 text-[10px] font-black uppercase hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full"
                        >
                          <i className="fas fa-coins mr-2"></i> Ajustar Valores
                        </button>
                      )}
                    </div>

                    {!isEditingFinancial ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                              <p className="text-[9px] font-black opacity-40 uppercase mb-2">Serviço/Mão de Obra</p>
                              <p className="text-base font-black">R$ {viewingOS.financial.serviceValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                           </div>
                           <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                              <p className="text-[9px] font-black opacity-40 uppercase mb-2">Peças/Insumos</p>
                              <p className="text-base font-black">R$ {viewingOS.financial.partsValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                           </div>
                        </div>

                        <div className="space-y-3 px-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="opacity-50">Desconto Aplicado</span>
                            <span className="text-rose-400">- R$ {(viewingOS.financial.discount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="opacity-50 text-emerald-400">Adiantamento Pago</span>
                            <span className="text-emerald-400">R$ {(viewingOS.financial.downPayment || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="font-black text-xs uppercase opacity-40">Valor Total OS</span>
                             <span className="text-3xl font-black text-blue-400">R$ {viewingOS.financial.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                             <span className="font-black text-[10px] uppercase opacity-40">Saldo Pendente</span>
                             <span className="text-xl font-black text-amber-400">R$ {(viewingOS.financial.remainingValue || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black opacity-40 uppercase mb-1">Pagamento</span>
                              <span className="text-xs font-black text-blue-300 uppercase">{viewingOS.financial.paymentType}</span>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black opacity-40 uppercase mb-1">Status Pagam.</span>
                              <span className={`text-xs font-black uppercase ${viewingOS.financial.status === PaymentStatus.PAGO ? 'text-emerald-400' : 'text-amber-400'}`}>{viewingOS.financial.status}</span>
                           </div>
                        </div>

                        {/* Novas Ações Financeiras */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                          <button 
                            onClick={handleRegisterPayment}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/40"
                          >
                            <i className="fas fa-cash-register"></i> Registrar Pagamento
                          </button>
                          <button 
                            onClick={handleSimulateBoleto}
                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase py-4 rounded-2xl transition-all shadow-lg"
                          >
                            <i className="fas fa-barcode"></i> Gerar Boleto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-fadeIn max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest">Mão de Obra</label>
                            <input type="text" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={finForm.serviceValue} onChange={(e) => handleCurrencyChange(e, 'serviceValue')} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest">Peças</label>
                            <input type="text" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={finForm.partsValue} onChange={(e) => handleCurrencyChange(e, 'partsValue')} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest text-rose-400">Desconto</label>
                            <input type="text" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500" value={finForm.discount} onChange={(e) => handleCurrencyChange(e, 'discount')} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest text-emerald-400">Adiantamento</label>
                            <input type="text" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={finForm.downPayment} onChange={(e) => handleCurrencyChange(e, 'downPayment')} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black opacity-40 uppercase tracking-widest">Tipo de Pagamento</label>
                          <select className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={finForm.paymentType} onChange={(e) => setFinForm({...finForm, paymentType: e.target.value as any})}>
                            <option value="AVISTA" className="bg-slate-900">À Vista</option>
                            <option value="PARCELADO" className="bg-slate-900">Parcelado</option>
                            <option value="FATURADO" className="bg-slate-900">Faturado</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest">Forma</label>
                            <select className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase outline-none" value={finForm.method} onChange={(e) => setFinForm({...finForm, method: e.target.value as any})}>
                              {Object.values(PaymentMethod).map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black opacity-40 uppercase tracking-widest">Status</label>
                            <select className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase outline-none" value={finForm.status} onChange={(e) => setFinForm({...finForm, status: e.target.value as any})}>
                              {Object.values(PaymentStatus).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button onClick={handleSaveFinancial} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase p-5 rounded-2xl transition-all shadow-xl shadow-blue-900/40">Salvar Alterações</button>
                          <button onClick={() => setIsEditingFinancial(false)} className="px-6 bg-white/5 hover:bg-white/10 text-white/50 p-5 rounded-2xl font-black text-[10px] uppercase">Voltar</button>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="bg-blue-600 text-white p-8 md:p-10 rounded-[3rem] shadow-xl relative overflow-hidden group border border-blue-400">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                    <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-4">Garantia Técnica Certificada</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">{viewingOS.warrantyDays}</span>
                      <span className="text-base font-bold opacity-80 uppercase tracking-tighter">Dias Corridos</span>
                    </div>
                    <p className="text-[11px] text-blue-50/70 mt-5 leading-relaxed font-medium">Cobertura total sobre mão de obra e peças substituídas conforme política WeldMaster.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
