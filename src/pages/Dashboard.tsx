import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { KpiCardSkeleton } from '../components/Skeletons';
import {
  Car, Activity, Ban, FileWarning, 
  Folder, Stethoscope, GraduationCap, HardHat, Shield, Landmark, Users, Baby, Tractor, LucideIcon 
} from 'lucide-react';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const { vehicles, drivers, loading } = useAllData();

  const allDepartments = ["SEMED", "SAUDE", "A. SOCIAL", "OBRAS", "GCM", "HGDO", "SEMASU", "PMM", "CONSELHO TUTELAR"];
  
  const departmentsToShow = userProfile?.role === 'admin' 
    ? allDepartments 
    : userProfile?.departments || (userProfile?.department ? [userProfile.department] : []);

  // --- CONFIGURAÇÃO DE ÍCONES ---
  const getDepartmentIcon = (deptName: string): LucideIcon => {
    const name = deptName.toUpperCase();
    if (name.includes("SAUDE") || name.includes("HGDO")) return Stethoscope;
    if (name.includes("SEMED") || name.includes("EDUC")) return GraduationCap;
    if (name.includes("OBRAS") || name.includes("INFRA")) return HardHat;
    if (name.includes("GCM") || name.includes("GUARD")) return Shield;
    if (name.includes("SOCIAL")) return Users;
    if (name.includes("TUTELAR")) return Baby;
    if (name.includes("PMM")) return Landmark; 
    if (name.includes("SEMASU")) return Tractor;
    return Folder;
  };

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

  // Cartão KPI
  const KpiCard = ({ title, value, icon: Icon, colorClass, bgClass, borderColor }: any) => (
    <div className={`bg-white px-4 py-4 rounded-xl shadow-sm border ${borderColor} flex items-center justify-between transition-all hover:shadow-md h-full`}>
      <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-zinc-900 leading-none">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-lg ${bgClass}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    // AJUSTE PRINCIPAL AQUI: max-w-7xl e paddings iguais ao Header.tsx
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in h-full flex flex-col">
      
      {/* Título e Subtítulo */}
      <div className="mb-6 flex items-baseline justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Visão Geral</h1>
        </div>
      </div>

      {/* Painel de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
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
              colorClass="text-blue-600" 
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
      <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-zinc-200 pb-2">
        <Folder className="w-5 h-5 text-zinc-400" />
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wide">Departamentos</h2>
      </div>
      
      {/* Lista de Departamentos */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {departmentsToShow.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-dashed border-zinc-300">
             <Folder className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
             <p className="text-zinc-500 font-medium">Nenhum departamento associado.</p>
          </div>
        ) : (
          // Grid alinhado com o de cima (gap-4 e colunas proporcionais)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsToShow.sort().map((dept) => {
              const deptVehicles = vehicles.filter(v => v.department === dept).length;
              const deptDrivers = drivers.filter(d => d.department === dept).length;
              const DepartmentIcon = getDepartmentIcon(dept);

              return (
                <div 
                  key={dept}
                  onClick={() => navigate(`/departamentos/${dept}`)}
                  className="group bg-white p-5 rounded-xl shadow-sm border border-zinc-200
                             hover:shadow-md hover:border-emerald-200 hover:ring-1 hover:ring-emerald-100
                             transition-all duration-200 cursor-pointer flex items-center gap-5"
                >
                  {/* Ícone com Fundo Verde */}
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50 group-hover:scale-105 transition-transform duration-200">
                    <DepartmentIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  
                  {/* Texto */}
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                      {dept}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mt-1">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 border border-zinc-200">
                        {loading ? '-' : `${deptVehicles} veíc.`}
                      </span>
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 border border-zinc-200">
                        {loading ? '-' : `${deptDrivers} mot.`}
                      </span>
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
