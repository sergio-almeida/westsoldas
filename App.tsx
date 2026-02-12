
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Machines from './pages/Machines';
import ServiceOrders from './pages/ServiceOrders';
import Quotes from './pages/Quotes';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import { DatabaseSetup } from './components/DatabaseSetup';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading, isDbReady, retryLoad } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando com Supabase...</p>
      </div>
    );
  }

  // Se o banco não estiver pronto, mostramos as instruções de setup
  if (!isDbReady) {
    return <DatabaseSetup onRetry={retryLoad} />;
  }

  if (!currentUser) return <Login />;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-[50] shadow-sm">
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-50 rounded-xl active:bg-slate-100"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        <div className="flex items-center gap-2">
          <i className="fas fa-plug text-blue-600"></i>
          <span className="font-black text-slate-900 text-sm tracking-tighter">WELDMASTER</span>
        </div>
        <div className="w-10"></div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden transition-all">
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/clientes" element={<Layout><Clients /></Layout>} />
          <Route path="/maquinas" element={<Layout><Machines /></Layout>} />
          <Route path="/orcamentos" element={<Layout><Quotes /></Layout>} />
          <Route path="/ordens-servico" element={<Layout><ServiceOrders /></Layout>} />
          <Route path="/usuarios" element={<Layout><Users /></Layout>} />
          <Route path="/configuracoes" element={<Layout><Settings /></Layout>} />
          <Route path="/relatorios" element={<Layout><Reports /></Layout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
