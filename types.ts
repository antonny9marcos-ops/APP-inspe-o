
export type Status = 'Aprovado' | 'Rejeitado' | 'Atenção';

export interface Inspection {
  id: string;
  realId?: string; // Supabase UUID
  material: string;
  fornecedor: string;
  data: string;
  status: Status;
  inspetor: string;
  qtdInspecionada?: number;
  qtdAprovada?: number;
  qtdRejeitada?: number;
  motivoRejeicao?: string;
  descricao?: string;
  numeroPedido?: string;
  nf?: string;
  evidencias?: string[];
  observacoes?: string;
}

export interface Metric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

export interface UserProfile {
  name: string;
  role: 'Admin' | 'Inspetor' | 'Cliente' | string;
  avatar?: string;
}

export enum View {
  DASHBOARD = 'dashboard',
  INSPECTION_FORM = 'form',
  MATERIALS = 'materials',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USERS = 'users'
}

export interface AppNotification {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'rejeicao' | 'update' | 'sistema' | 'aviso';
  lida: boolean;
  link?: string;
  created_at: string;
}
