import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { getReviewStatus, getDriverStatus, getMileageStatus } from '../utils/calculations';
import { LogOut, Bell, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';
import Logo from '../assets/logo.jpg'; 
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { logout, userProfile } = useAuth();
  const { vehicles, drivers } = useAllData(); 
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications: { id: string; text: string; type: 'error' | 'warning'; link: string }[] = [];

  // Lógica de Notificações
  vehicles.forEach(v => {
    const reviewStatus = getReviewStatus(v.lastReviewDate);
    if (reviewStatus === 'error') {
      notifications.push({ id: `rev-${v.id}`, text: `Revisão atrasada: ${v.licensePlate} (${v.department})`, type: 'error', link: `/departamentos/${v.department}` });
    }
    const mileageStatus = getMileageStatus(v.currentMileage || 0, v.nextChangeMileage || 0);
    if (mileageStatus.status === 'error' || mileageStatus.status === 'warning') {
      notifications.push({ id: `km-${v.id}`, text: `Troca KM ${v.licensePlate}: ${mileageStatus.text}`, type: mileageStatus.status as 'error' | 'warning', link: `/departamentos/${v.department}` });
    }
  });

  drivers.forEach(d => {
    const cnhStatus = getDriverStatus(d.licenseExpiration);
    if (cnhStatus === 'error') {
      notifications.push({ id: `cnh-${d.id}`, text: `CNH Vencida: ${d.name}`, type: 'error', link: `/departamentos/${d.department}` });
    } else if (cnhStatus === 'warning') {
      notifications.push({ id: `cnh-${d.id}`, text: `CNH a vencer em breve: ${d.name}`, type: 'warning', link: `/departamentos/${d.department}` });
    }
  });

  const handleNotificationClick = (link: string) => {
    setShowNotifications(false);
    navigate(link);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Aumentei o logo para h-10 w-10 (era h-8) */}
            <div className="h-10 w-10 rounded-full overflow-hidden border border-zinc-200 shadow-sm group-hover:border-zinc-300 transition-colors">
               <img src={Logo} alt="Logo" className="h-full w-full object-cover" />
            </div>
            {/* Aumentei a fonte para text-xl (era text-base) e bold */}
            <span className="text-xl font-bold text-zinc-900 tracking-tight group-hover:text-black transition-colors">
              GestorFrota
            </span>
          </Link>
          
          <span className="text-zinc-300 text-2xl font-light">/</span>
          
          <span className="text-sm font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
            {userProfile?.department || 'Geral'}
          </span>
        </div>

        {/* Lado Direito */}
        <div className="flex items-center gap-4">
          
          {/* Botão de Relatórios */}
          <Link 
            to="/relatorios"
            className="hidden md:flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" />
            Relatórios
          </Link>

          {/* Sino de Notificações */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-zinc-500 hover:text-zinc-900 transition-colors relative p-1.5 hover:bg-zinc-100 rounded-full"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ring-2 ring-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-zinc-100 z-50 overflow-hidden animate-fade-in">
                <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex justify-between items-center">
                  <span className="font-bold text-zinc-700 text-sm">Notificações</span>
                  <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                   {notifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-sm">
                      <p>Tudo limpo.</p>
                    </div>
                   ) : (
                     <ul className="divide-y divide-zinc-100">
                       {notifications.map(notif => (
                         <li key={notif.id} onClick={() => handleNotificationClick(notif.link)} className="px-4 py-3 hover:bg-zinc-50 cursor-pointer flex gap-3">
                            <div className={`mt-0.5 p-1 rounded-full shrink-0 h-fit ${notif.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                              <AlertTriangle className="w-3 h-3" />
                            </div>
                            <p className="text-sm font-medium text-zinc-700">{notif.text}</p>
                         </li>
                       ))}
                     </ul>
                   )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-1"></div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-xs font-semibold text-zinc-900">
                 {userProfile?.email?.split('@')[0]}
               </span>
             </div>
             
             <button
                onClick={logout}
                className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                title="Sair"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}
