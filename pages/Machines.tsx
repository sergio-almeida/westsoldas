
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Machine, MachineVoltage } from '../types';
import { MACHINE_TYPES } from '../constants';

const Machines: React.FC = () => {
  const { machines, clients, addMachine } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formValues, setFormValues] = useState({
    clientId: '',
    type: MACHINE_TYPES[0],
    brand: '',
    model: '',
    serialNumber: '',
    voltage: MachineVoltage.V220,
    accessories: '',
    visualCondition: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.clientId) {
      alert('Selecione um cliente para vincular a máquina.');
      return;
    }

    const machineData: Machine = {
      id: Math.random().toString(36).substr(2, 9),
      ...formValues
    } as Machine;

    addMachine(machineData);
    setIsModalOpen(false);
    setFormValues({
      clientId: '',
      type: MACHINE_TYPES[0],
      brand: '',
      model: '',
      serialNumber: '',
      voltage: MachineVoltage.V220,
      accessories: '',
      visualCondition: '',
    });
  };

  const filteredMachines = machines.filter(m => 
    m.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Máquinas</h2>
          <p className="text-slate-500 text-sm">Gerenciamento de equipamentos em manutenção.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <i className="fas fa-plus"></i> Nova Máquina
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-3 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por marca ou número de série..."
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map(machine => {
          const client = clients.find(c => c.id === machine.clientId);
          return (
            <div key={machine.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600">
                    {machine.type}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">#{machine.serialNumber}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{machine.brand} {machine.model}</h3>
                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                  <i className="fas fa-user text-[10px]"></i> {client?.name || 'Cliente Desconhecido'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-slate-400 font-bold uppercase mb-0.5">Voltagem</p>
                    <p className="text-slate-700 font-black">{machine.voltage}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-slate-400 font-bold uppercase mb-0.5">Condição</p>
                    <p className="text-slate-700 font-black truncate">{machine.visualCondition}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMachines.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            Nenhuma máquina encontrada.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Novo Equipamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Vincular Cliente</label>
                <select 
                  name="clientId" 
                  value={formValues.clientId} 
                  onChange={handleInputChange}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                  <select name="type" value={formValues.type} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Voltagem</label>
                  <select name="voltage" value={formValues.voltage} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {Object.values(MachineVoltage).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Marca</label>
                  <input name="brand" value={formValues.brand} onChange={handleInputChange} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Modelo</label>
                  <input name="model" value={formValues.model} onChange={handleInputChange} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Série</label>
                <input name="serialNumber" value={formValues.serialNumber} onChange={handleInputChange} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Acessórios</label>
                <textarea name="accessories" value={formValues.accessories} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20" placeholder="Ex: Cabos, porta eletrodo, garra negativa..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Condição Visual</label>
                <input name="visualCondition" value={formValues.visualCondition} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Ex: Em bom estado, riscos na carenagem..." />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all">
                  Salvar Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Machines;
