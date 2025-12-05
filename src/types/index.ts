export interface UserProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'gestor' | 'visualizador' | 'user';
  department: string;
  departments?: string[]; // Para admins/gestores que veem múltiplos
}
