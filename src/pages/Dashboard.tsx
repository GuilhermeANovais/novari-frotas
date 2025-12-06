import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { KpiCardSkeleton } from '../components/Skeletons';
import { 
  Building2, Car, Users, AlertTriangle, 
  Ban, FileWarning, Activity 
} from 'lucide-react';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Usamos o hook global para buscar tudo e calcular os totais
  const { vehicles, drivers, loading } = useAllData();

  // --- Lógica de Departamentos ---
  const allDepartments = ["SEMED", "SAUDE", "A. SOCIAL", "OBRAS", "GCM", "HGDO", "SEMASU", "PMM", "CONSELHO TUTELAR"];
  
  // Filtra quais departamentos este usuário pode ver
  const departmentsToShow = userProfile?.role === 'admin' 
    ? allDepartments 
    : userProfile?.departments || (userProfile?.department ? [userProfile.department] : []);

  // --- Lógica de KPIs (Indicadores) ---
  
  // 1. Veículos com Revisão Atrasada
  const overdueReviews = vehicles.filter(v => {
    if (!v.lastReviewDate) return false;
    const lastReview = new Date(v.lastReviewDate + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6); // 6 meses
    const today = new Date();
    // Retorna true se hoje já passou da data da próxima revisão
    return today > nextReview; 
  }).length;

  // 2. Veículos Parados
  const stoppedVehicles = vehicles.filter(v => v.situation === 'Parado').length;

  // 3. CNHs Vencidas ou a Vencer (45 dias)
  const criticalLicenses = drivers.filter(d => {
    if (!d.licenseExpiration) return false;
    const expiration = new Date(d.licenseExpiration + 'T00:00:00');
    const today = new Date();
    const daysLeft = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 45; // Inclui vencidas (negativo) e próximas (até 45 dias)
  }).length;

  // Componente interno para os Cartões de KPI
  const KpiCard = ({ title, value, icon: Icon, colorClass, bgClass, borderColor }: any) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${borderColor} flex items-center justify-between transition-all duration-200 hover:shadow-md`}>
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-zinc-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Título e Boas-vindas */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Prefeitura de Murici</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading ? (
           <>
             <KpiCardSkeleton />
             <KpiCardSkeleton />
             <KpiCardSkeleton />
             <KpiCardSkeleton />
           </>
        ) : (
           <>
            <KpiCard 
              title="Total de Veículos" 
              value={vehicles.length} 
              icon={Car} 
              colorClass="text-blue-600" 
              bgClass="bg-blue-50"
              borderColor="border-blue-100"
            />
            <KpiCard 
              title="Revisões Atrasadas" 
              value={overdueReviews} 
              icon={Activity} 
              colorClass="text-red-600" 
              bgClass="bg-red-50"
              borderColor="border-red-100"
            />
            <KpiCard 
              title="Veículos Parados" 
              value={stoppedVehicles} 
              icon={Ban} 
              colorClass="text-orange-600" 
              bgClass="bg-orange-50"
              borderColor="border-orange-100"
            />
            <KpiCard 
              title="CNHs Críticas" 
              value={criticalLicenses} 
              icon={FileWarning} 
              colorClass="text-yellow-600" 
              bgClass="bg-yellow-50"
              borderColor="border-yellow-100"
            />
           </>
        )}
      </div>

      {/* Lista de Departamentos */}
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-5 h- text-pmm-900" />
        <h2 className="text-lg font-bold text-zinc-800">Departamentos</h2>
      </div>
      
      {departmentsToShow.length === 0 ? (
        <div className="bg-white p-12 rounded-lg text-center shadow-sm border border-dashed border-zinc-300">
           <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
           <p className="text-zinc-500 font-medium">Nenhum departamento associado ao seu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentsToShow.sort().map((dept) => {
            // Cálculo local para mostrar contagem rápida no card do departamento
            const deptVehicles = vehicles.filter(v => v.department === dept).length;
            const deptDrivers = drivers.filter(d => d.department === dept).length;

            return (
              <div 
                key={dept}
                onClick={() => navigate(`/departamentos/${dept}`)}
                className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200
                           hover:shadow-lg hover:border-pmm-900 hover:-translate-y-1 
                           transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-zinc-100 p-3 rounded-full group-hover:bg-zinc-200 transition-colors border border-zinc-300">
                    <Building2 className="w-6 h-6 text-pmm-900" />
                  </div>
                  {/* Seta indicativa opcional */}
                  <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors">→</span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-black">{dept}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mt-2">
                    <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                      <Car className="w-3.5 h-3.5"/> 
                      {loading ? '-' : deptVehicles}
                    </span>
                    <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                      <Users className="w-3.5 h-3.5"/> 
                      {loading ? '-' : deptDrivers}
                    </span>
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
