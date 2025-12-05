import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { 
  Building2, Car, Users, AlertTriangle, 
  Ban, FileWarning, Activity 
} from 'lucide-react';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Usamos o hook global para calcular os totais
  const { vehicles, drivers, loading } = useAllData();

  // --- Lógica de Departamentos ---
  const allDepartments = ["SEMED", "SAUDE", "A. SOCIAL", "OBRAS", "GCM", "HGDO", "SEMASU", "PMM", "CONSELHO TUTELAR"];
  
  const departmentsToShow = userProfile?.role === 'admin' 
    ? allDepartments 
    : userProfile?.departments || (userProfile?.department ? [userProfile.department] : []);

  // --- Lógica de KPIs (Indicadores) ---
  
  // 1. Veículos com Revisão Atrasada
  const overdueReviews = vehicles.filter(v => {
    if (!v.lastReviewDate) return false;
    const lastReview = new Date(v.lastReviewDate + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6);
    const today = new Date();
    return today > nextReview; // Se hoje for maior que a data da próxima revisão
  }).length;

  // 2. Veículos Parados
  const stoppedVehicles = vehicles.filter(v => v.situation === 'Parado').length;

  // 3. CNHs Vencidas ou a Vencer (45 dias)
  const criticalLicenses = drivers.filter(d => {
    if (!d.licenseExpiration) return false;
    const expiration = new Date(d.licenseExpiration + 'T00:00:00');
    const today = new Date();
    const daysLeft = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 45; // Vencida (negativo) ou vencendo em 45 dias
  }).length;

  // Componente de Cartão KPI
  const KpiCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">{loading ? '-' : value}</h3>
      </div>
      <div className={`p-3 rounded-full ${bgClass}`}>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Título de Boas-vindas */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral da Frota</h1>
        <p className="text-gray-500">Resumo operacional e departamentos</p>
      </div>

      {/* Painel de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard 
          title="Total de Veículos" 
          value={vehicles.length} 
          icon={Car} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <KpiCard 
          title="Revisões Atrasadas" 
          value={overdueReviews} 
          icon={Activity} 
          colorClass="text-red-600" 
          bgClass="bg-red-50" 
        />
        <KpiCard 
          title="Veículos Parados" 
          value={stoppedVehicles} 
          icon={Ban} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50" 
        />
        <KpiCard 
          title="CNHs Críticas" 
          value={criticalLicenses} 
          icon={FileWarning} 
          colorClass="text-yellow-600" 
          bgClass="bg-yellow-50" 
        />
      </div>

      {/* Lista de Departamentos */}
      <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        <Building2 className="w-5 h-5" /> Departamentos
      </h2>
      
      {departmentsToShow.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm">
           <p className="text-gray-500">Nenhum departamento associado ao seu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentsToShow.sort().map((dept) => {
            // Pequeno cálculo local para mostrar contagem no card
            const deptVehicles = vehicles.filter(v => v.department === dept).length;
            const deptDrivers = drivers.filter(d => d.department === dept).length;

            return (
              <div 
                key={dept}
                onClick={() => navigate(`/departamentos/${dept}`)}
                className="bg-white p-6 rounded-lg shadow-md 
                           hover:shadow-xl hover:bg-green-50 hover:-translate-y-1 
                           transition-all duration-200 cursor-pointer group border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{dept}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center"><Car className="w-3 h-3 mr-1"/> {loading ? '-' : deptVehicles}</span>
                      <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> {loading ? '-' : deptDrivers}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
