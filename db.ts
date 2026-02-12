
import { supabase } from './supabaseClient';
import { 
  User, Client, Machine, Quote, ServiceOrder, 
  UserRole, OSStatus, QuoteStatus, PaymentStatus, SystemPermissions 
} from './types';

export class DbError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
  }
  get isTableMissing() {
    // Código PGRST108 ou mensagem específica do PostgREST para tabela inexistente
    return (
      this.code === 'PGRST108' || 
      this.code === '42P01' ||
      this.message.includes('Could not find the table') ||
      this.message.includes('relation "public.profiles" does not exist')
    );
  }
}

class Database {
  private handleError(error: any) {
    if (error) {
      throw new DbError(error.message, error.code);
    }
  }

  // --- USERS & PROFILES ---
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      this.handleError(error);
      return (data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role as UserRole,
        active: u.active,
        phone: u.phone,
        resetToken: u.reset_token
      })) as User[];
    } catch (e) {
      // Não logamos erro aqui para não poluir o console durante o setup inicial
      throw e;
    }
  }

  async saveUser(user: User): Promise<void> {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.active,
      phone: user.phone,
      reset_token: user.resetToken
    });
    this.handleError(error);
  }

  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    this.handleError(error);
    return (data || []).map(c => ({
      id: c.id,
      type: c.type,
      name: c.name,
      document: c.document,
      tradeName: c.trade_name,
      email: c.email,
      phone: c.phone,
      whatsapp: c.whatsapp,
      address: c.address,
      active: c.active,
      createdAt: c.created_at
    })) as Client[];
  }

  async saveClient(client: Client): Promise<void> {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      type: client.type,
      name: client.name,
      document: client.document,
      trade_name: client.tradeName,
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      address: client.address,
      active: client.active,
      created_at: client.createdAt
    });
    this.handleError(error);
  }

  // --- MACHINES ---
  async getMachines(): Promise<Machine[]> {
    const { data, error } = await supabase.from('machines').select('*');
    this.handleError(error);
    return (data || []).map(m => ({
      id: m.id,
      clientId: m.client_id,
      type: m.type,
      brand: m.brand,
      model: m.model,
      serialNumber: m.serial_number,
      voltage: m.voltage,
      accessories: m.accessories,
      visualCondition: m.visual_condition,
      techNotes: m.tech_notes
    })) as Machine[];
  }

  async saveMachine(machine: Machine): Promise<void> {
    const { error } = await supabase.from('machines').upsert({
      id: machine.id,
      client_id: machine.clientId,
      type: machine.type,
      brand: machine.brand,
      model: machine.model,
      serial_number: machine.serialNumber,
      voltage: machine.voltage,
      accessories: machine.accessories,
      visual_condition: machine.visualCondition,
      tech_notes: machine.techNotes
    });
    this.handleError(error);
  }

  // --- QUOTES ---
  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase.from('quotes').select('*');
    this.handleError(error);
    return (data || []).map(q => ({
      id: q.id,
      clientId: q.client_id,
      machineId: q.machine_id,
      problemDescription: q.problem_description,
      preliminaryDiagnosis: q.preliminary_diagnosis,
      services: q.services,
      partsPrice: q.parts_price,
      totalPrice: q.total_price,
      estimatedDays: q.estimated_days,
      status: q.status as QuoteStatus,
      createdAt: q.created_at,
      notes: q.notes
    })) as Quote[];
  }

  async saveQuote(quote: Quote): Promise<void> {
    const { error } = await supabase.from('quotes').upsert({
      id: quote.id,
      client_id: quote.clientId,
      machine_id: quote.machineId,
      problem_description: quote.problemDescription,
      preliminary_diagnosis: quote.preliminaryDiagnosis,
      services: quote.services,
      parts_price: quote.partsPrice,
      total_price: quote.totalPrice,
      estimated_days: quote.estimatedDays,
      status: quote.status,
      created_at: quote.createdAt
    });
    this.handleError(error);
  }

  // --- SERVICE ORDERS ---
  async getOrders(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase.from('service_orders').select('*');
    this.handleError(error);
    return (data || []).map(o => ({
      id: o.id,
      quoteId: o.quote_id,
      clientId: o.client_id,
      machineId: o.machine_id,
      technicianId: o.technician_id,
      identifiedDefect: o.identified_defect,
      servicesExecuted: o.services_executed,
      photos: o.photos,
      status: o.status as OSStatus,
      statusHistory: o.status_history,
      entryDate: o.entry_date,
      estimatedDate: o.estimated_date,
      finishDate: o.finish_date,
      warrantyDays: o.warranty_days,
      financial: o.financial
    })) as ServiceOrder[];
  }

  async saveOrder(order: ServiceOrder): Promise<void> {
    const { error } = await supabase.from('service_orders').upsert({
      id: order.id,
      quote_id: order.quoteId,
      client_id: order.clientId,
      machine_id: order.machineId,
      technician_id: order.technicianId,
      identified_defect: order.identifiedDefect,
      services_executed: order.servicesExecuted,
      photos: order.photos,
      status: order.status,
      status_history: order.statusHistory,
      entry_date: order.entryDate,
      estimated_date: order.estimatedDate,
      finish_date: order.finishDate,
      warranty_days: order.warrantyDays,
      financial: order.financial
    });
    this.handleError(error);
  }

  // --- PERMISSIONS ---
  async getPermissions(): Promise<SystemPermissions> {
    try {
      const { data, error } = await supabase.from('system_config').select('value').eq('key', 'permissions').maybeSingle();
      if (error || !data) throw new Error('No config');
      return data.value as SystemPermissions;
    } catch (e) {
      return {
        [UserRole.ADMIN]: ['mod_dashboard', 'mod_clientes', 'mod_maquinas', 'mod_orcamentos', 'mod_relatorios', 'mod_equipe', 'mod_empresa', 'card_os_abertas', 'card_clientes_ativos', 'card_orcamentos_pendentes', 'card_faturamento'],
        [UserRole.TECNICO]: ['mod_dashboard', 'mod_maquinas', 'mod_ordens', 'card_os_abertas'],
        [UserRole.ATENDENTE]: ['mod_dashboard', 'mod_clientes', 'mod_maquinas', 'mod_orcamentos', 'mod_ordens', 'card_os_abertas', 'card_clientes_ativos', 'card_orcamentos_pendentes']
      };
    }
  }

  async savePermissions(perms: SystemPermissions): Promise<void> {
    const { error } = await supabase.from('system_config').upsert({ key: 'permissions', value: perms });
    this.handleError(error);
  }
}

export const db = new Database();
