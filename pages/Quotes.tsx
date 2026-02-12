
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quote, QuoteStatus, Client, Machine, OSStatus, ServiceOrder, PaymentStatus, PaymentMethod } from '../types';
import StatusBadge from '../components/StatusBadge';
import { printDocument } from '../utils/print';

const Quotes: React.FC = () => {
  const { quotes, clients, machines, addQuote, updateQuote, addOS, orders, currentUser, companyInfo } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [formValues, setFormValues] = useState({
    clientId: '',
    machineId: '',
    problemDescription: '',
    preliminaryDiagnosis: '',
    partsPrice: 0,
    estimatedDays: 3,
    status: QuoteStatus.ANALISE,
  });

  const [services, setServices] = useState<{ description: string; price: number }[]>([
    { description: '', price: 0 }
  ]);

  useEffect(() => {
    if (editingQuote) {
      setFormValues({
        clientId: editingQuote.clientId,
        machineId: editingQuote.machineId,
        problemDescription: editingQuote.problemDescription,
        preliminaryDiagnosis: editingQuote.preliminaryDiagnosis,
        partsPrice: editingQuote.partsPrice,
        estimatedDays: editingQuote.estimatedDays,
        status: editingQuote.status,
      });
      setServices(editingQuote.services.length > 0 ? editingQuote.services : [{ description: '', price: 0 }]);
    } else {
      resetForm();
    }
  }, [editingQuote, isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const addServiceRow = () => setServices([...services, { description: '', price: 0 }]);
  
  const updateServiceRow = (index: number, field: 'description' | 'price', value: string | number) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const removeServiceRow = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    const servicesTotal = services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
    return servicesTotal + (Number(formValues.partsPrice) || 0);
  };

  const resetForm = () => {
    setFormValues({
      clientId: '',
      machineId: '',
      problemDescription: '',
      preliminaryDiagnosis: '',
      partsPrice: 0,
      estimatedDays: 3,
      status: QuoteStatus.ANALISE,
    });
    setServices([{ description: '', price: 0 }]);
  };

  const convertToOS = (quote: Quote) => {
    const osExists = orders.some(o => o.quoteId === quote.id);
    if (osExists) return;
    const serviceValue = quote.services.reduce((acc, s) => acc + s.price, 0);
    const newOS: ServiceOrder = {
      id: `OS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      quoteId: quote.id,
      clientId: quote.clientId,
      machineId: quote.machineId,
      identifiedDefect: `${quote.problemDescription}\n\nDiagnóstico: ${quote.preliminaryDiagnosis}`,
      servicesExecuted: quote.services.map(s => s.description).join(', '),
      photos: [],
      status: OSStatus.ABERTA,
      statusHistory: [{ status: OSStatus.ABERTA, user: currentUser?.name || 'Sistema', timestamp: new Date().toISOString() }],
      entryDate: new Date().toISOString(),
      estimatedDate: new Date(Date.now() + quote.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
      warrantyDays: 90,
      financial: { serviceValue, partsValue: quote.partsPrice, discount: 0, total: quote.totalPrice, paymentType: 'AVISTA', status: PaymentStatus.PENDENTE, method: PaymentMethod.PIX, paymentDates: [] }
    };
    addOS(newOS);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.clientId || !formValues.machineId) {
      alert('Selecione um cliente e uma máquina.');
      return;
    }
    const total = calculateTotal();
    const quoteData: Quote = {
      id: editingQuote ? editingQuote.id : Math.random().toString(36).substr(2, 9),
      clientId: formValues.clientId,
      machineId: formValues.machineId,
      problemDescription: formValues.problemDescription,
      preliminaryDiagnosis: formValues.preliminaryDiagnosis,
      services: services.filter(s => s.description.trim() !== ''),
      partsPrice: Number(formValues.partsPrice),
      totalPrice: total,
      estimatedDays: Number(formValues.estimatedDays),
      status: formValues.status as QuoteStatus,
      createdAt: editingQuote ? editingQuote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (editingQuote) updateQuote(quoteData); else addQuote(quoteData);
    if (quoteData.status === QuoteStatus.APROVADO) convertToOS(quoteData);
    setIsModalOpen(false);
    setEditingQuote(null);
    resetForm();
  };

  const handlePrint = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const machine = machines.find(m => m.id === quote.machineId);
    if (client && machine) {
      printDocument('Orçamento de Manutenção', companyInfo, client, machine, quote);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const client = clients.find(c => c.id === q.clientId);
    return client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || q.id.includes(searchTerm);
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">Orçamentos</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Gestão de propostas e aprovações.</p>
        </div>
        <button 
          onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all font-bold text-sm"
        >
          <i className="fas fa-plus"></i> Novo Orçamento
        </button>
      </header>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por cliente ou ID..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuotes.map(quote => {
          const client = clients.find(c => c.id === quote.clientId);
          const machine = machines.find(m => m.id === quote.machineId);
          const hasOS = orders.some(o => o.quoteId === quote.id);

          return (
            <div key={quote.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 md:p-6 hover:border-blue-200 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-blue-600 font-black text-xs">#{quote.id.substring(0, 8)}</span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{client?.name || 'Desconhecido'}</h3>
                  <p className="text-xs text-slate-500">{machine?.brand} {machine?.model}</p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Total</p>
                    <p className="font-black text-slate-900">R$ {quote.totalPrice.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePrint(quote)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all" title="Imprimir"><i className="fas fa-print"></i></button>
                    <button onClick={() => { setEditingQuote(quote); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"><i className="fas fa-edit"></i></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-4xl h-[92vh] md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="p-6 md:p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black">{editingQuote ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
              <div className="flex gap-2">
                {editingQuote && <button type="button" onClick={() => handlePrint(editingQuote)} className="w-10 h-10 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center"><i className="fas fa-print"></i></button>}
                <button onClick={() => { setIsModalOpen(false); setEditingQuote(null); }} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cliente</label>
                  <select name="clientId" value={formValues.clientId} onChange={handleInputChange} required disabled={!!editingQuote} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 disabled:opacity-60"><option value="">Selecione o cliente...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Máquina</label>
                  <select name="machineId" value={formValues.machineId} onChange={handleInputChange} disabled={!formValues.clientId || !!editingQuote} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 disabled:opacity-60"><option value="">Selecione a máquina...</option>{machines.filter(m => m.clientId === formValues.clientId).map(m => (<option key={m.id} value={m.id}>{m.brand} {m.model} (S/N: {m.serialNumber})</option>))}</select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <textarea name="problemDescription" value={formValues.problemDescription} onChange={handleInputChange} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-28 font-medium resize-none" placeholder="Relato do cliente" />
                <textarea name="preliminaryDiagnosis" value={formValues.preliminaryDiagnosis} onChange={handleInputChange} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-28 font-medium resize-none" placeholder="Diagnóstico técnico" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">Serviços e Mão de Obra</h4><button type="button" onClick={addServiceRow} className="text-blue-600 text-xs font-black">+ Adicionar Linha</button></div>
                {services.map((service, index) => (
                  <div key={index} className="flex gap-3"><input placeholder="Descrição" className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl" value={service.description} onChange={(e) => updateServiceRow(index, 'description', e.target.value)} /><input type="number" placeholder="R$ 0,00" className="w-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={service.price} onChange={(e) => updateServiceRow(index, 'price', e.target.value)} /><button type="button" onClick={() => removeServiceRow(index)} className="text-slate-300 hover:text-red-500"><i className="fas fa-trash-alt"></i></button></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                <div><label className="text-[10px] font-black text-slate-400 uppercase">Peças R$</label><input type="number" name="partsPrice" value={formValues.partsPrice} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase">Prazo (Dias)</label><input type="number" name="estimatedDays" value={formValues.estimatedDays} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase">Status</label><select name="status" value={formValues.status} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase text-xs">{Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex justify-between items-center gap-6">
                <div><p className="text-[10px] font-black opacity-40 uppercase mb-1">Total Proposta</p><p className="text-4xl font-black text-blue-400">R$ {calculateTotal().toLocaleString('pt-BR')}</p></div>
                <button type="submit" className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 shadow-xl transition-all uppercase text-xs tracking-widest">{editingQuote ? 'Atualizar' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
