import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { getReviewStatus, getDriverStatus, getMileageStatus } from '../utils/calculations';
import { LogOut, Bell, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';
import Logo from '../assets/logo.jpg'; 
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { logout, userProfile } = useAuth();
  const { vehicles, drivers } = useAllData(); // Busca dados globais
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
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        
        {/* Logo e Título */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="cursor-pointer">
            <img
              src={Logo}
              alt="Logótipo da Frota"
              className="h-10 w-10 rounded-full object-cover shadow-md"
            />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 hidden md:block">
            Sistema de Gestão de Frota
          </h1>
        </div>

        {/* Ações (Direita) */}
        <div className="flex items-center space-x-4">
          
          {/* Sino de Notificações */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-500 hover:text-gray-700 relative p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Notificações ({notifications.length})</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      <div className="flex justify-center mb-2">
                        <Bell className="w-8 h-8 text-gray-300" />
                      </div>
                      <p>Tudo tranquilo! Nenhuma pendência.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map(notif => (
                        <li 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif.link)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3"
                        >
                          <div className={`mt-1 p-1 rounded-full shrink-0 ${notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${notif.type === 'error' ? 'text-gray-800' : 'text-gray-700'}`}>
                              {notif.text}
                            </p>
                            <p className="text-xs text-blue-500 mt-1 font-semibold hover:underline">
                              Ver Detalhes
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Link 
            to="/relatorios"
            className="hidden md:flex items-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-all shadow text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Relatórios
          </Link>

          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-sm font-bold text-gray-700">
               {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.department || 'Utilizador'}
             </span>
             <span className="text-xs text-gray-500 truncate max-w-[150px]">
               {userProfile?.email}
             </span>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
