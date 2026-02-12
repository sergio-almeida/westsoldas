
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Client, ClientType } from '../types';
import { STATES } from '../constants';
import { maskDocument, maskPhone, maskCEP, isValidEmail, isValidCPF, isValidCNPJ, fetchAddressByCEP } from '../utils/validation';

const Clients: React.FC = () => {
  const { clients, addClient, updateClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const [formValues, setFormValues] = useState({
    type: ClientType.PF,
    name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zipCode: '',
    tradeName: ''
  });

  const [emailError, setEmailError] = useState(false);
  const [docError, setDocError] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setFormValues({
        type: editingClient.type,
        name: editingClient.name,
        document: editingClient.document,
        email: editingClient.email,
        phone: editingClient.phone,
        whatsapp: editingClient.whatsapp || '',
        street: editingClient.address.street,
        number: editingClient.address.number,
        complement: editingClient.address.complement || '',
        neighborhood: editingClient.address.neighborhood,
        city: editingClient.address.city,
        state: editingClient.address.state,
        zipCode: editingClient.address.zipCode,
        tradeName: editingClient.tradeName || ''
      });
      setEmailError(!isValidEmail(editingClient.email));
      setDocError(false);
    } else {
      setFormValues({
        type: ClientType.PF,
        name: '',
        document: '',
        email: '',
        phone: '',
        whatsapp: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: 'SP',
        zipCode: '',
        tradeName: ''
      });
      setEmailError(false);
      setDocError(false);
    }
  }, [editingClient, isModalOpen]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'document') {
      maskedValue = maskDocument(value);
      setDocError(false);
    }
    if (name === 'phone' || name === 'whatsapp') maskedValue = maskPhone(value);
    if (name === 'zipCode') {
      maskedValue = maskCEP(value);
      if (maskedValue.length === 9) {
        setIsLoadingCEP(true);
        const addressData = await fetchAddressByCEP(maskedValue);
        if (addressData) {
          setFormValues(prev => ({
            ...prev,
            street: addressData.street,
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: maskedValue
          }));
        }
        setIsLoadingCEP(false);
      }
    }
    
    if (name === 'email') {
      setEmailError(!isValidEmail(value) && value.length > 0);
    }

    setFormValues(prev => ({ ...prev, [name]: maskedValue }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const isPF = formValues.type === ClientType.PF;
    const isDocValid = isPF ? isValidCPF(formValues.document) : isValidCNPJ(formValues.document);

    if (!isDocValid) {
      setDocError(true);
      alert(`O ${isPF ? 'CPF' : 'CNPJ'} informado é inválido.`);
      return;
    }

    if (!isValidEmail(formValues.email)) {
      setEmailError(true);
      alert('Por favor, insira um e-mail válido.');
      return;
    }

    const clientData: Partial<Client> = {
      type: formValues.type,
      name: formValues.name,
      document: formValues.document,
      tradeName: formValues.tradeName,
      email: formValues.email,
      phone: formValues.phone,
      whatsapp: formValues.whatsapp,
      address: {
        street: formValues.street,
        number: formValues.number,
        complement: formValues.complement,
        neighborhood: formValues.neighborhood,
        city: formValues.city,
        state: formValues.state,
        zipCode: formValues.zipCode,
      },
      active: true,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
    };

    if (editingClient) {
      updateClient({ ...editingClient, ...clientData } as Client);
    } else {
      addClient({ id: Math.random().toString(36).substr(2, 9), ...clientData } as Client);
    }
    
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-slate-500 text-sm">Gerencie o cadastro de pessoas físicas e jurídicas.</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <i className="fas fa-plus"></i> Novo Cliente
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-3 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${client.type === ClientType.PJ ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {client.type}
                </span>
                <button 
                  onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <i className="fas fa-edit"></i>
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 truncate">{client.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{client.document}</p>
              
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <i className="fas fa-phone text-slate-400 w-4"></i>
                  {client.phone}
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-envelope text-slate-400 w-4"></i>
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-slate-400 w-4"></i>
                  <span className="truncate">
                    {client.address.city}, {client.address.state}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Cadastro: {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
              <span className={client.active ? 'text-emerald-500' : 'text-slate-400'}>
                {client.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                  <select 
                    name="type" 
                    value={formValues.type} 
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ClientType.PF}>Pessoa Física</option>
                    <option value={ClientType.PJ}>Pessoa Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${docError ? 'text-red-600' : 'text-slate-700'}`}>
                    Documento (CPF/CNPJ) {docError && <span className="text-[10px] font-bold">(Inválido)</span>}
                  </label>
                  <input 
                    name="document" 
                    value={formValues.document} 
                    onChange={handleInputChange}
                    placeholder={formValues.type === ClientType.PF ? "000.000.000-00" : "00.000.000/0000-00"}
                    required 
                    className={`w-full p-2.5 bg-slate-50 border ${docError ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                <input name="name" value={formValues.name} onChange={handleInputChange} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${emailError ? 'text-red-600' : 'text-slate-700'}`}>
                    E-mail {emailError && <span className="text-[10px] font-bold">(Inválido)</span>}
                  </label>
                  <input name="email" value={formValues.email} onChange={handleInputChange} required className={`w-full p-2.5 bg-slate-50 border ${emailError ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-blue-500`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone Principal</label>
                  <input name="phone" value={formValues.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-map-marked-alt text-blue-500"></i> Endereço
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">CEP</label>
                    <div className="relative">
                      <input 
                        name="zipCode" 
                        value={formValues.zipCode} 
                        onChange={handleInputChange} 
                        placeholder="00000-000" 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {isLoadingCEP && <i className="fas fa-spinner fa-spin absolute right-3 top-3.5 text-blue-500"></i>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Número</label>
                    <input name="number" value={formValues.number} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Complemento</label>
                    <input name="complement" value={formValues.complement} onChange={handleInputChange} placeholder="Apto, Sala, etc" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rua</label>
                    <input name="street" value={formValues.street} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bairro</label>
                    <input name="neighborhood" value={formValues.neighborhood} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cidade</label>
                    <input name="city" value={formValues.city} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                    <select name="state" value={formValues.state} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
