
export enum UserRole {
  ADMIN = 'ADMIN',
  TECNICO = 'TECNICO',
  ATENDENTE = 'ATENDENTE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha para autenticação
  phone?: string;
  role: UserRole;
  active: boolean;
  resetToken?: string; // Simulação de token para recuperação
}

export interface SystemPermissions {
  [key: string]: string[]; // Role -> Array de chaves permitidas (módulos ou cards)
}

export interface CompanyInfo {
  name: string;
  document: string; // CNPJ
  phone: string;
  email: string;
  address: string;
  logo?: string; // Base64
}

export enum ClientType {
  PF = 'PF',
  PJ = 'PJ'
}

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  document: string; // CPF or CNPJ
  tradeName?: string; // Nome Fantasia
  stateRegistration?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  createdAt: string;
  active: boolean;
}

export enum MachineVoltage {
  V110 = '110V',
  V220 = '220V',
  BIVOLT = 'Bivolt',
  TRI = 'Trifásica'
}

export interface Machine {
  id: string;
  clientId: string;
  type: string; // Inversora, MIG, etc
  brand: string;
  model: string;
  serialNumber: string;
  voltage: MachineVoltage;
  year?: string;
  accessories: string;
  visualCondition: string;
  techNotes?: string;
}

export enum QuoteStatus {
  ANALISE = 'Em análise',
  AGUARDANDO = 'Aguardando aprovação',
  APROVADO = 'Aprovado',
  REPROVADO = 'Reprovado'
}

export interface Quote {
  id: string;
  clientId: string;
  machineId: string;
  problemDescription: string;
  preliminaryDiagnosis: string;
  services: { description: string; price: number }[];
  partsPrice: number;
  totalPrice: number;
  estimatedDays: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export enum OSStatus {
  ABERTA = 'Aberta',
  DIAGNOSTICO = 'Em diagnóstico',
  AGUARDANDO = 'Aguardando aprovação',
  AGUARDANDO_PECAS = 'Aguardando peças',
  REPARO = 'Em reparo',
  FINALIZADA = 'Finalizada',
  ENTREGUE = 'Entregue',
  CANCELADA = 'Cancelada'
}

export interface StatusLog {
  status: OSStatus;
  user: string;
  timestamp: string;
}

export enum PaymentStatus {
  PENDENTE = 'Pendente',
  PARCIAL = 'Parcialmente pago',
  PAGO = 'Pago'
}

export enum PaymentMethod {
  PIX = 'PIX',
  DINHEIRO = 'Dinheiro',
  CARTAO = 'Cartão',
  BOLETO = 'Boleto'
}

export interface ServiceOrder {
  id: string;
  quoteId?: string;
  clientId: string;
  machineId: string;
  technicianId?: string;
  identifiedDefect: string;
  servicesExecuted: string;
  photos: string[]; // Base64 or URLs
  status: OSStatus;
  statusHistory: StatusLog[];
  entryDate: string;
  estimatedDate?: string;
  finishDate?: string;
  warrantyDays: number;
  financial: {
    serviceValue: number;
    partsValue: number;
    discount: number;
    total: number;
    paymentType: 'AVISTA' | 'PARCELADO' | 'FATURADO';
    installments?: number;
    installmentValue?: number;
    downPayment?: number;
    remainingValue?: number;
    status: PaymentStatus;
    method: PaymentMethod;
    paymentDates: string[];
    notes?: string;
  };
}

export interface LogEntry {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  entityId: string;
}
