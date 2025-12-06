import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { KpiCardSkeleton } from '../components/Skeletons';
import { 
  Building2, Car, Users, 
  Ban, FileWarning, Activity,
} from 'lucide-react';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const { vehicles, drivers, loading } = useAllData();

  const allDepartments = ["SEMED", "SAUDE", "A. SOCIAL", "OBRAS", "GCM", "HGDO", "SEMASU", "PMM", "CONSELHO TUTELAR"];
  
  const departmentsToShow = userProfile?.role === 'admin' 
    ? allDepartments 
    : userProfile?.departments || (userProfile?.department ? [userProfile.department] : []);

  // --- KPIs ---
  const overdueReviews = vehicles.filter(v => {
    if (!v.lastReviewDate) return false;
    const lastReview = new Date(v.lastReviewDate + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6); 
    const today = new Date();
    return today > nextReview; 
  }).length;

  const stoppedVehicles = vehicles.filter(v => v.situation === 'Parado').length;

  const criticalLicenses = drivers.filter(d => {
    if (!d.licenseExpiration) return false;
    const expiration = new Date(d.licenseExpiration + 'T00:00:00');
    const today = new Date();
    const daysLeft = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 45;
  }).length;

  // Cartão KPI Compacto
  const KpiCard = ({ title, value, icon: Icon, colorClass, bgClass, borderColor }: any) => (
    <div className={`bg-white px-4 py-3 rounded-lg shadow-sm border ${borderColor} flex items-center justify-between transition-all hover:shadow-md h-full`}>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-zinc-900 leading-none">{value}</h3>
      </div>
      <div className={`p-2 rounded-full ${bgClass}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 animate-fade-in h-full flex flex-col">
      
      {/* Título Compacto */}
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Visão Geral</h1>
          <p className="text-xs text-zinc-500">Resumo operacional da frota municipal de Murici/AL</p>
        </div>
      </div>

      {/* Painel de KPIs (Grid de 4 colunas em telas maiores) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 shrink-0">
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
              title="Veículos" 
              value={vehicles.length} 
              icon={Car} 
              colorClass="text-green-600" 
              bgClass="bg-blue-50"
              borderColor="border-blue-100"
            />
            <KpiCard 
              title="Rev. Atrasadas" 
              value={overdueReviews} 
              icon={Activity} 
              colorClass="text-red-600" 
              bgClass="bg-red-50"
              borderColor="border-red-100"
            />
            <KpiCard 
              title="Parados" 
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

      {/* Título da Seção */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Building2 className="w-4 h-4 text-pmm-900" />
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Departamentos</h2>
      </div>
      
      {/* Lista de Departamentos (Grid Denso) */}
      {/* Usa 'flex-1 overflow-y-auto' se quiser scroll apenas aqui, ou deixa natural */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {departmentsToShow.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center shadow-sm border border-dashed border-pmm-900">
             <Building2 className="w-10 h-10 text-pmm-900 mx-auto mb-2" />
             <p className="text-zinc-500 text-sm font-medium">Nenhum departamento associado.</p>
          </div>
        ) : (
          // Grid ajustado: 2 cols (mobile), 3 cols (tablet), 4 cols (laptop), 5 cols (wide)
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3">
            {departmentsToShow.sort().map((dept) => {
              const deptVehicles = vehicles.filter(v => v.department === dept).length;
              const deptDrivers = drivers.filter(d => d.department === dept).length;

              return (
                <div 
                  key={dept}
                  onClick={() => navigate(`/departamentos/${dept}`)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-pmm-900
                             hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 
                             transition-all duration-200 cursor-pointer group flex flex-col justify-between h-24"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black line-clamp-1" title={dept}>{dept}</h3>
                    <div className="bg-zinc-50 p-1.5 rounded-full group-hover:bg-zinc-100 transition-colors border border-zinc-100">
                      <Building2 className="w-3.5 h-3.5 text-pmm-900 group-hover:text-pmm-900" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100" title="Veículos">
                      <Car className="w-3 h-3 text-zinc-500"/> 
                      <span className="text-xs font-medium text-zinc-700">{loading ? '-' : deptVehicles}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100" title="Motoristas">
                      <Users className="w-3 h-3 text-zinc-500"/> 
                      <span className="text-xs font-medium text-zinc-700">{loading ? '-' : deptDrivers}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
