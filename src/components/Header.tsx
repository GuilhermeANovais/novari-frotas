import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAllData } from '../hooks/useAllData';
import { getReviewStatus, getDriverStatus, getMileageStatus } from '../utils/calculations';
import { LogOut, Bell, FileSpreadsheet, AlertTriangle, X, Search, Car, User, ChevronRight } from 'lucide-react';
import Logo from '../assets/logo.jpg'; 
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { logout, userProfile } = useAuth();
  // Buscamos TODOS os dados para a pesquisa global
  const { vehicles, drivers } = useAllData(); 
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA DE BUSCA GLOBAL ---
  const filteredResults = searchQuery.length < 2 ? [] : [
    ...vehicles.filter(v => 
      v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.model.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(v => ({ type: 'vehicle', id: v.id, title: v.licensePlate, subtitle: v.model, dept: v.department })),
    
    ...drivers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(d => ({ type: 'driver', id: d.id, title: d.name, subtitle: 'Motorista', dept: d.department }))
  ].slice(0, 5); // Limita a 5 resultados

  const handleSearchResultClick = (dept: string, term: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    // Navega para o departamento e passa o termo de busca na URL
    navigate(`/departamentos/${dept}?q=${term}`);
  };

  // --- LÓGICA DE NOTIFICAÇÕES (Mantida) ---
  const notifications: { id: string; text: string; type: 'error' | 'warning'; link: string }[] = [];
  vehicles.forEach(v => {
    const reviewStatus = getReviewStatus(v.lastReviewDate);
    if (reviewStatus === 'error') notifications.push({ id: `rev-${v.id}`, text: `Revisão atrasada: ${v.licensePlate}`, type: 'error', link: `/departamentos/${v.department}` });
    const mileageStatus = getMileageStatus(v.currentMileage || 0, v.nextChangeMileage || 0);
    if (mileageStatus.status === 'error' || mileageStatus.status === 'warning') notifications.push({ id: `km-${v.id}`, text: `Troca KM ${v.licensePlate}`, type: mileageStatus.status as any, link: `/departamentos/${v.department}` });
  });
  drivers.forEach(d => {
    const cnhStatus = getDriverStatus(d.licenseExpiration);
    if (cnhStatus === 'error') notifications.push({ id: `cnh-${d.id}`, text: `CNH Vencida: ${d.name}`, type: 'error', link: `/departamentos/${d.department}` });
    else if (cnhStatus === 'warning') notifications.push({ id: `cnh-${d.id}`, text: `CNH a vencer: ${d.name}`, type: 'warning', link: `/departamentos/${d.department}` });
  });

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-zinc-200 shadow-sm group-hover:border-zinc-300 transition-colors">
               <img src={Logo} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="hidden md:block text-lg font-bold text-zinc-900 tracking-tight group-hover:text-black">
              Sistema de Gestão Novari
            </span>
          </Link>
        </div>

        {/* --- BARRA DE BUSCA GLOBAL --- */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar placa, modelo ou motorista..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-100/50 border border-zinc-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
          </div>

          {/* Dropdown de Resultados da Busca */}
          {isSearchFocused && searchQuery.length > 1 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-zinc-200 overflow-hidden animate-fade-in z-50">
              {filteredResults.length === 0 ? (
                <div className="p-4 text-center text-zinc-400 text-xs">Nenhum resultado encontrado.</div>
              ) : (
                <ul>
                  {filteredResults.map((item) => (
                    <li 
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSearchResultClick(item.dept, item.title)}
                      className="px-4 py-3 hover:bg-zinc-50 cursor-pointer flex items-center justify-between group border-b border-zinc-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${item.type === 'vehicle' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.type === 'vehicle' ? <Car className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800">{item.title}</p>
                          <p className="text-xs text-zinc-500">{item.subtitle} • {item.dept}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Lado Direito (Ações) */}
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            to="/relatorios"
            className="hidden md:flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors p-2 rounded-md hover:bg-zinc-100"
            title="Relatórios"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </Link>

          {/* Notificações */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-zinc-500 hover:text-zinc-900 transition-colors relative p-2 hover:bg-zinc-100 rounded-full"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold ring-2 ring-white">
                  {notifications.length > 9 ? '!' : notifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-zinc-100 z-50 overflow-hidden animate-fade-in">
                <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex justify-between items-center">
                  <span className="font-bold text-zinc-700 text-sm">Notificações</span>
                  <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                   {notifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-sm">Tudo em dia!</div>
                   ) : (
                     <ul className="divide-y divide-zinc-100">
                       {notifications.map(notif => (
                         <li key={notif.id} onClick={() => { setShowNotifications(false); navigate(notif.link); }} className="px-4 py-3 hover:bg-zinc-50 cursor-pointer flex gap-3">
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

          <div className="h-6 w-px bg-zinc-200 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-xs font-semibold text-zinc-900">{userProfile?.email?.split('@')[0]}</span>
               <span className="text-[10px] text-zinc-500 uppercase">{userProfile?.department || 'Geral'}</span>
             </div>
             <button onClick={logout} className="text-zinc-400 hover:text-red-600 transition-colors p-1" title="Sair">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}
