import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { getReviewStatus, getDriverStatus, getMileageStatus } from '../utils/calculations';
import { LogOut, Bell, FileSpreadsheet, AlertTriangle, X, ChevronDown } from 'lucide-react';
import Logo from '../assets/logo.jpg'; 
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { logout, userProfile } = useAuth();
  const { vehicles, drivers } = useAllData(); 
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Gerar Notificações ---
  const notifications: { id: string; text: string; type: 'error' | 'warning'; link: string }[] = [];

  // 1. Verificar Veículos (Revisão e KM)
  vehicles.forEach(v => {
    // Revisão
    const reviewStatus = getReviewStatus(v.lastReviewDate);
    if (reviewStatus === 'error') {
      notifications.push({
        id: `rev-${v.id}`,
        text: `Revisão atrasada: ${v.licensePlate} (${v.department})`,
        type: 'error',
        link: `/departamentos/${v.department}`
      });
    }

    // Quilometragem
    const mileageStatus = getMileageStatus(v.currentMileage || 0, v.nextChangeMileage || 0);
    if (mileageStatus.status === 'error' || mileageStatus.status === 'warning') {
      notifications.push({
        id: `km-${v.id}`,
        text: `Troca KM ${v.licensePlate}: ${mileageStatus.text}`,
        type: mileageStatus.status as 'error' | 'warning',
        link: `/departamentos/${v.department}`
      });
    }
  });

  // 2. Verificar Motoristas (CNH)
  drivers.forEach(d => {
    const cnhStatus = getDriverStatus(d.licenseExpiration);
    if (cnhStatus === 'error') {
      notifications.push({
        id: `cnh-${d.id}`,
        text: `CNH Vencida: ${d.name}`,
        type: 'error',
        link: `/departamentos/${d.department}`
      });
    } else if (cnhStatus === 'warning') {
      notifications.push({
        id: `cnh-${d.id}`,
        text: `CNH a vencer em breve: ${d.name}`,
        type: 'warning',
        link: `/departamentos/${d.department}`
      });
    }
  });

  const handleNotificationClick = (link: string) => {
    setShowNotifications(false);
    navigate(link);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        
        {/* Lado Esquerdo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 shadow-sm group-hover:border-gray-300 transition-colors">
               <img src={Logo} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-semibold text-gray-800 tracking-tight">Gestor Frota</span>
          </Link>
          
          {/* Separador vertical estilo Vercel */}
          <span className="text-gray-200 text-2xl font-light">/</span>

        </div>

        {/* Lado Direito */}
        <div className="flex items-center gap-4">
          
          {/* Botão de Relatórios (Estilo Outline) */}
          <Link 
            to="/relatorios"
            className="hidden md:flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Relatórios
          </Link>

          {/* Sino de Notificações */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-500 hover:text-gray-900 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {/* Badge Minimalista */}
              {/* ... lógica do badge ... */}
            </button>
            {/* ... Dropdown de notificações (use classes: border border-gray-200 shadow-lg rounded-lg) ... */}
          </div>

          {/* Perfil do Usuário */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
             <div className="flex flex-col items-end">
               <span className="text-xs font-medium text-gray-900">
                 {userProfile?.email?.split('@')[0]}
               </span>
             </div>
             
             <button
                onClick={logout}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Sair"
             >
                <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}
