
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client, Machine, Quote, ServiceOrder, UserRole, CompanyInfo, SystemPermissions } from '../types';
import { db, DbError } from '../db';

interface AppState {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  machines: Machine[];
  quotes: Quote[];
  orders: ServiceOrder[];
  companyInfo: CompanyInfo;
  systemPermissions: SystemPermissions;
  isLoading: boolean;
  isDbReady: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, message: string}>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{success: boolean, message: string}>;
  resetPasswordByToken: (token: string, newPassword: string) => Promise<{success: boolean, message: string}>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  addMachine: (machine: Machine) => Promise<void>;
  addQuote: (quote: Quote) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;
  addOS: (os: ServiceOrder) => Promise<void>;
  updateOS: (os: ServiceOrder) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  updateSystemPermissions: (perms: SystemPermissions) => Promise<void>;
  retryLoad: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbReady, setIsDbReady] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({} as CompanyInfo);
  const [systemPermissions, setSystemPermissions] = useState<SystemPermissions>({} as SystemPermissions);

  const loadAllData = async () => {
    setIsLoading(true);
    // Presumimos que está pronto até que prove o contrário
    try {
      const [u, c, m, q, o, p] = await Promise.all([
        db.getUsers(),
        db.getClients(),
        db.getMachines(),
        db.getQuotes(),
        db.getOrders(),
        db.getPermissions()
      ]);
      setUsers(u);
      setClients(c);
      setMachines(m);
      setQuotes(q);
      setOrders(o);
      setSystemPermissions(p);
      setIsDbReady(true);
    } catch (err) {
      if (err instanceof DbError && err.isTableMissing) {
        setIsDbReady(false);
        // Não logamos erro vermelho aqui pois o componente de Setup lidará com isso visualmente
        console.warn('Supabase: Tabelas não encontradas. Aguardando execução do script SQL.');
      } else {
        console.error('Erro ao conectar com Supabase:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const storedUser = localStorage.getItem('wm_current_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    const storedCompany = localStorage.getItem('wm_company');
    if (storedCompany) setCompanyInfo(JSON.parse(storedCompany));
    else setCompanyInfo({
      name: 'WestSoldas Pro',
      document: '00.000.000/0001-00',
      phone: '(00) 0000-0000',
      email: 'contato@westsoldas.com.br',
      address: 'Rua das Soldas, 123 - Centro'
    });
  }, []);

  const login = async (email: string, password: string) => {
    let user = users.find(u => u.email === email && u.password === password);
    
    if (!user && email === 'admin@oficina.com' && password === 'admin') {
      user = {
        id: 'admin-001',
        name: 'Admin Master',
        email: 'admin@oficina.com',
        password: 'admin',
        role: UserRole.ADMIN,
        active: true
      };
    }

    if (user && user.active) {
      setCurrentUser(user);
      localStorage.setItem('wm_current_user', JSON.stringify(user));
      return { success: true, message: 'OK' };
    }
    
    return { success: false, message: 'Credenciais inválidas ou erro de conexão com o banco.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wm_current_user');
  };

  const forgotPassword = async (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const token = Math.random().toString(36).substr(2, 6).toUpperCase();
      await updateUser({ ...user, resetToken: token });
      alert(`Token de recuperação (Simulação): ${token}`);
      return { success: true, message: 'Token gerado.' };
    }
    return { success: false, message: 'E-mail não encontrado.' };
  };

  const resetPasswordByToken = async (token: string, newPassword: string) => {
    const user = users.find(u => u.resetToken === token);
    if (user) {
      await updateUser({ ...user, password: newPassword, resetToken: undefined });
      return { success: true, message: 'Senha alterada.' };
    }
    return { success: false, message: 'Token inválido.' };
  };

  const addClient = async (c: Client) => { await db.saveClient(c); setClients(await db.getClients()); };
  const updateClient = async (c: Client) => { await db.saveClient(c); setClients(await db.getClients()); };
  const addMachine = async (m: Machine) => { await db.saveMachine(m); setMachines(await db.getMachines()); };
  const addQuote = async (q: Quote) => { await db.saveQuote(q); setQuotes(await db.getQuotes()); };
  const updateQuote = async (q: Quote) => { await db.saveQuote(q); setQuotes(await db.getQuotes()); };
  const addOS = async (o: ServiceOrder) => { await db.saveOrder(o); setOrders(await db.getOrders()); };
  const updateOS = async (o: ServiceOrder) => { await db.saveOrder(o); setOrders(await db.getOrders()); };
  const addUser = async (u: User) => { await db.saveUser(u); setUsers(await db.getUsers()); };
  const updateUser = async (u: User) => { await db.saveUser(u); setUsers(await db.getUsers()); };
  const updateCompanyInfo = async (info: CompanyInfo) => { 
    localStorage.setItem('wm_company', JSON.stringify(info)); 
    setCompanyInfo(info); 
  };
  const updateSystemPermissions = async (perms: SystemPermissions) => {
    await db.savePermissions(perms);
    setSystemPermissions(perms);
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, clients, machines, quotes, orders, companyInfo, systemPermissions, isLoading, isDbReady,
      login, logout, forgotPassword, resetPasswordByToken, addClient, updateClient, 
      addMachine, addQuote, updateQuote, addOS, updateOS, addUser, updateUser, 
      updateCompanyInfo, updateSystemPermissions, retryLoad: loadAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
