import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  ArrowLeft, Plus, Search, Car, User, 
  AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';

// Utilitário para formatar datas (ex: 2023-10-05 -> 05/10/2023)
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/D';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

export function DepartmentDetails() {
  const { nome: departmentName } = useParams(); // Pega o nome da URL (/departamentos/SAUDE)
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [situationFilter, setSituationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'ok' | 'warning' | 'error'

  // Busca os dados usando nossos Hooks
  const { vehicles, loading: loadingVehicles } = useVehicles(departmentName);
  const { drivers, loading: loadingDrivers } = useDrivers(departmentName);

  // --- Lógica de Filtragem de Veículos ---
  const getVehicleStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const lastReview = new Date(dateStr + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6);
    const today = new Date();
    const daysLeft = (nextReview.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (daysLeft < 0) return 'error'; // Atrasada
    if (daysLeft <= 30) return 'warning'; // Próxima
    return 'ok'; // Em dia
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = (v.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.model?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSituation = situationFilter ? v.situation === situationFilter : true;
    
    let matchesStatus = true;
    if (statusFilter) {
      const status = getVehicleStatus(v.lastReviewDate);
      matchesStatus = status === statusFilter;
    }

    return matchesSearch && matchesSituation && matchesStatus;
  });

  // --- Lógica de Filtragem de Motoristas ---
  const getDriverStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const expiration = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const daysLeft = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
    
    if (daysLeft < 0) return 'error'; // Expirada
    if (daysLeft <= 45) return 'warning'; // A expirar
    return 'ok';
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter) {
      const status = getDriverStatus(d.licenseExpiration);
      matchesStatus = status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de {departmentName}</h1>
        </div>
        <div className="flex gap-2">
           {/* Botão placeholder para adicionar (fase futura) */}
          <Button className="w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar {activeTab === 'vehicles' ? 'Veículo' : 'Motorista'}
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('vehicles'); setStatusFilter(''); setSearchTerm(''); }}
            className={`
              pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors
              ${activeTab === 'vehicles' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Car className="w-5 h-5 mr-2" />
            Veículos
          </button>
          <button
            onClick={() => { setActiveTab('drivers'); setStatusFilter(''); setSearchTerm(''); }}
            className={`
              pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors
              ${activeTab === 'drivers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <User className="w-5 h-5 mr-2" />
            Motoristas
          </button>
        </nav>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input 
            placeholder={activeTab === 'vehicles' ? "Buscar placa ou modelo..." : "Buscar nome do motorista..."}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'vehicles' && (
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white"
            value={situationFilter}
            onChange={(e) => setSituationFilter(e.target.value)}
          >
            <option value="">Todas as Situações</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Manutenção">Em Manutenção</option>
            <option value="Parado">Parado</option>
          </select>
        )}

        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { label: 'Todos', value: '' },
            { label: activeTab === 'vehicles' ? 'Atrasada' : 'Vencida', value: 'error' },
            { label: activeTab === 'vehicles' ? 'Próxima' : 'A Vencer', value: 'warning' },
            { label: 'Em Dia', value: 'ok' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`
                flex-1 text-sm font-medium rounded-md py-1 transition-all
                ${statusFilter === opt.value ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo: Lista de Veículos */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingVehicles ? <p className="col-span-full text-center py-10">Carregando frota...</p> : null}
          
          {!loadingVehicles && filteredVehicles.length === 0 && (
            <p className="col-span-full text-center py-10 text-gray-500">Nenhum veículo encontrado.</p>
          )}

          {filteredVehicles.map((vehicle) => {
            const status = getVehicleStatus(vehicle.lastReviewDate);
            const statusColor = status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600';
            const StatusIcon = status === 'error' ? AlertTriangle : status === 'warning' ? Clock : CheckCircle;

            return (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-200 relative">
                  <img 
                    src={vehicle.imageUrl || "https://placehold.co/600x400/e2e8f0/cbd5e0?text=Sem+Foto"} 
                    alt={vehicle.model}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                    {vehicle.situation}
                  </span>
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="text-xl font-bold text-gray-800">{vehicle.licensePlate}</h3>
                  <p className="text-gray-600 text-sm mb-4">{vehicle.model}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-500">Motorista:</span>
                      <span className="font-medium truncate max-w-[150px]">{vehicle.driverName || 'N/D'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-500">KM Atual:</span>
                      <span className="font-medium">{(vehicle.currentMileage || 0).toLocaleString()} km</span>
                    </div>
                    <div className={`flex justify-between items-center pt-1 font-semibold ${statusColor}`}>
                      <span className="flex items-center gap-1">
                         <StatusIcon className="w-4 h-4" /> Revisão:
                      </span>
                      <span>{formatDate(vehicle.lastReviewDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 border-t flex justify-end gap-2">
                  <button className="text-sm font-medium text-primary hover:text-green-700">Detalhes</button>
                  {/* Botões extras como Editar/Excluir virão aqui */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conteúdo: Lista de Motoristas */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingDrivers ? <p className="col-span-full text-center py-10">Carregando motoristas...</p> : null}

          {filteredDrivers.map((driver) => {
            const status = getDriverStatus(driver.licenseExpiration);
            const statusBg = status === 'error' ? 'bg-red-50 border-red-200' : status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100';

            return (
              <div key={driver.id} className={`p-6 rounded-lg shadow-md border ${statusBg}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{driver.name}</h3>
                    <p className="text-sm text-gray-500">CNH: {driver.licenseNumber}</p>
                  </div>
                  <span className="px-2 py-1 bg-gray-200 rounded text-xs font-bold text-gray-600">
                    Cat. {driver.licenseCategory}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">Validade:</span>
                  <span className={`font-bold ${status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {formatDate(driver.licenseExpiration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
