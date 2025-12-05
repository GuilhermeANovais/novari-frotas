import { useAuth } from '../contexts/AuthContext';
import { LogOut, Bell, FileText } from 'lucide-react';
import Logo from '../assets/logo.jpg'; 
import { Link } from 'react-router-dom';

export function Header() {
  const { logout, userProfile } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Lado Esquerdo: Logo e Título */}
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

        {/* Lado Direito: Ações */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <Bell className="w-6 h-6" />
            {/* Aqui podes adicionar lógica para o badge de notificação depois */}
          </button>
          
          <Link 
            to="/relatorios"
            className="hidden md:flex items-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-all shadow text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </Link>

          <div className="flex flex-col items-end mr-2">
             <span className="text-sm font-semibold text-gray-700">
               {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.department || 'Utilizador'}
             </span>
             <span className="text-xs text-gray-500 truncate max-w-[150px]">
               {userProfile?.email}
             </span>
          </div>

          <button
            onClick={logout}
            className="bg-danger hover:bg-danger-hover text-white font-bold py-2 px-4 rounded-lg transition-all shadow flex items-center"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
