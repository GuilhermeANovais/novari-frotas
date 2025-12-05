export interface MaintenanceRecord {
  id: string;
  date: string;
  description: string;
  partsCost: number;
  laborCost: number;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  department: string;
  situation: 'Ativo' | 'Em Manutenção' | 'Aguardando Peças' | 'Parado' | string;
  driverName?: string;
  imageUrl?: string;
  
  // Detalhes técnicos
  renavam?: string;
  chassis?: string;
  cor?: string;
  ano?: number;
  route?: string;
  
  // Controle de Manutenção
  currentMileage?: number;
  nextChangeMileage?: number;
  lastReviewDate?: string;
  details?: string;
  totalCost?: number;
  
  // Metadados
  updatedAt?: any;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string; // CNH
  licenseCategory: string;
  licenseExpiration: string;
  department: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'gestor' | 'visualizador' | 'user';
  department: string;
  departments?: string[];
}