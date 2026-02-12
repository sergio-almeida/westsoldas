
import React, { useState } from 'react';

const SQL_SCRIPT = `-- Copie e cole este script no SQL Editor do seu Supabase:

DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS system_config;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  reset_token TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO profiles (id, name, email, password, role, active)
VALUES ('admin-001', 'Admin Master', 'admin@oficina.com', 'admin', 'ADMIN', true);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT UNIQUE NOT NULL,
  trade_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE machines (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  voltage TEXT,
  accessories TEXT,
  visual_condition TEXT,
  tech_notes TEXT
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  problem_description TEXT,
  preliminary_diagnosis TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  parts_price DECIMAL DEFAULT 0,
  total_price DECIMAL DEFAULT 0,
  estimated_days INTEGER DEFAULT 3,
  status TEXT DEFAULT 'Em análise',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notes TEXT
);

CREATE TABLE service_orders (
  id TEXT PRIMARY KEY, 
  quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  technician_id TEXT,
  identified_defect TEXT,
  services_executed TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Aberta',
  status_history JSONB DEFAULT '[]'::jsonb,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  estimated_date TIMESTAMP WITH TIME ZONE,
  finish_date TIMESTAMP WITH TIME ZONE,
  warranty_days INTEGER DEFAULT 90,
  financial JSONB NOT NULL
);

CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB
);`;

export const DatabaseSetup: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            <i className="fas fa-database"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Setup do Banco de Dados</h1>
          <p className="text-slate-500 font-medium">As tabelas necessárias não foram encontradas no seu projeto Supabase.</p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fas fa-terminal text-blue-500"></i> Script SQL de Inicialização
          </h3>
          <div className="relative">
            <pre className="bg-slate-900 text-blue-300 p-6 rounded-2xl text-xs font-mono overflow-x-auto h-64 shadow-inner leading-relaxed">
              {SQL_SCRIPT}
            </pre>
            <button 
              onClick={handleCopy}
              className={`absolute top-4 right-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {copied ? 'Copiado!' : 'Copiar Script'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-black text-slate-900 text-sm">Próximos passos:</h4>
          <ol className="space-y-3 text-sm text-slate-600 list-decimal pl-5 font-medium">
            <li>Acesse o painel do seu projeto no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase</a>.</li>
            <li>No menu lateral, clique em <strong>SQL Editor</strong>.</li>
            <li>Clique em <strong>New Query</strong>.</li>
            <li>Cole o script acima e clique em <strong>Run</strong>.</li>
            <li>Após a execução com sucesso, volte aqui e clique no botão abaixo.</li>
          </ol>
        </div>

        <button 
          onClick={onRetry}
          className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 uppercase text-xs tracking-widest"
        >
          <i className="fas fa-sync-alt"></i> Já executei o script, tentar novamente
        </button>
      </div>
    </div>
  );
};
