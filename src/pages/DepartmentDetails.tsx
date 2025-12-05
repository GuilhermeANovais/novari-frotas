import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { VehicleModal } from '../components/VehicleModal';
import { DriverModal } from '../components/DriverModal';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { ActivityLogs } from '../components/ActivityLogs';
import { Vehicle, Driver } from '../types';
import { 
  ArrowLeft, Plus, Search, Car, User, 
  AlertTriangle, CheckCircle, Clock, History, Trash2 
} from 'lucide-react';

// Imports para funcionalidade de Exclusão e Feedback
import { 
  collection, doc, deleteDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';

// Utilitário para formatar datas (ex: 2023-10-05 -> 05/10/2023)
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/D';
  // Adiciona T00:00:00 para evitar problemas de fuso horário ao converter
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

export function DepartmentDetails() {
  const { nome: departmentName } = useParams(); // Pega o nome da URL (/departamentos/SAUDE)
  const navigate = useNavigate();
  
  // --- Estados de Interface ---
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'logs'>('vehicles');
  
  // Estados dos Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);

  // --- Estados dos Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [situationFilter, setSituationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'ok' | 'warning' | 'error'

  // --- Busca os dados usando Hooks (Reativos ao Firebase) ---
  const { vehicles, loading: loadingVehicles } = useVehicles(departmentName);
  const { drivers, loading: loadingDrivers } = useDrivers(departmentName);

  // --- Handlers de Abertura de Modal ---
  const handleOpenCreateVehicle = () => {
    setEditingVehicle(null); // Modo criação
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle); // Modo edição
    setIsVehicleModalOpen(true);
  };

  const handleOpenMaintenance = (vehicle: Vehicle) => {
    setMaintenanceVehicle(vehicle);
    setIsMaintenanceModalOpen(true);
  };

  const handleOpenCreateDriver = () => {
    setEditingDriver(null); // Modo criação
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setEditingDriver(driver); // Modo edição
    setIsDriverModalOpen(true);
  };

  // --- Lógica de Exclusão (Segurança) ---
  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const confirmMessage = `ATENÇÃO: Você está prestes a excluir o veículo ${vehicle.licensePlate}.\n\nIsso apagará também todo o histórico de manutenções e a foto.\n\nTem certeza absoluta?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      // 1. Apagar subcoleção de manutenções
      const batch = writeBatch(db);
      const maintenanceSnap = await getDocs(collection(db, 'vehicles', vehicle.id, 'maintenanceRecords'));
      maintenanceSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 2. Apagar imagem do Storage (se existir)
      if (vehicle.imageUrl) {
        try {
          const imageRef = ref(storage, vehicle.imageUrl);
          await deleteObject(imageRef);
        } catch (err) {
          console.warn("Imagem já não existia ou erro ao apagar:", err);
        }
      }

      // 3. Apagar o documento do veículo
      await deleteDoc(doc(db, 'vehicles', vehicle.id));

      // 4. Log de Auditoria
      await logActivity(
        'delete_vehicle', 
        `Veículo excluído: ${vehicle.licensePlate} (${vehicle.model})`, 
        vehicle.department, 
        vehicle.id
      );

      toast.success(`Veículo ${vehicle.licensePlate} excluído com sucesso.`);

    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast.error("Ocorreu um erro ao tentar excluir.");
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    if (!window.confirm(`Tem certeza que deseja excluir o motorista ${driver.name}?`)) return;

    try {
      await deleteDoc(doc(db, 'drivers', driver.id));
      
      await logActivity(
        'delete_driver', 
        `Motorista excluído: ${driver.name}`, 
        driver.department, 
        driver.id
      );

      toast.success(`Motorista ${driver.name} excluído.`);
    } catch (error) {
      console.error("Erro ao excluir motorista:", error);
      toast.error("Erro ao excluir motorista.");
    }
  };

  // --- Lógica de Filtros e Status ---
  const getVehicleStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const lastReview = new Date(dateStr + 'T00:00:00');
    const nextReview = new Date(lastReview);
    nextReview.setMonth(nextReview.getMonth() + 6); // Regra: Revisão a cada 6 meses
    const today = new Date();
    const daysLeft = (nextReview.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (daysLeft < 0) return 'error'; // Atrasada
    if (daysLeft <= 30) return 'warning'; // Próxima (30 dias)
    return 'ok'; // Em dia
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (v.licensePlate?.toLowerCase().includes(term) || 
                           v.model?.toLowerCase().includes(term));
    const matchesSituation = situationFilter ? v.situation === situationFilter : true;
    
    let matchesStatus = true;
    if (statusFilter) {
      const status = getVehicleStatus(v.lastReviewDate);
      matchesStatus = status === statusFilter;
    }

    return matchesSearch && matchesSituation && matchesStatus;
  });

  const getDriverStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const expiration = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const daysLeft = (expiration.getTime() - today.getTime()) / (1000 * 3600 * 24);
    
    if (daysLeft < 0) return 'error'; // Expirada
    if (daysLeft <= 45) return 'warning'; // A expirar (45 dias)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Cabeçalho e Botão Voltar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-500 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-200"
            title="Voltar para Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de {departmentName}</h1>
        </div>
        
        {/* Botão Adicionar (Visível apenas nas abas de Veículos e Motoristas) */}
        {activeTab !== 'logs' && (
          <div className="flex gap-2">
            <Button 
              className="w-full md:w-auto"
              onClick={() => activeTab === 'vehicles' ? handleOpenCreateVehicle() : handleOpenCreateDriver()}
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar {activeTab === 'vehicles' ? 'Veículo' : 'Motorista'}
            </Button>
          </div>
        )}
      </div>

      {/* Navegação por Abas */}
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
          <button
            onClick={() => { setActiveTab('logs'); }}
            className={`
              pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors
              ${activeTab === 'logs' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <History className="w-5 h-5 mr-2" />
            Histórico
          </button>
        </nav>
      </div>

      {/* Barra de Filtros (Oculta na aba Histórico) */}
      {activeTab !== 'logs' && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              placeholder={activeTab === 'vehicles' ? "Buscar placa ou modelo..." : "Buscar nome do motorista..."}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de Situação (Apenas Veículos) */}
          {activeTab === 'vehicles' ? (
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white focus:outline-none focus:ring-2"
              value={situationFilter}
              onChange={(e) => setSituationFilter(e.target.value)}
            >
              <option value="">Todas as Situações</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Aguardando Peças">Aguardando Peças</option>
              <option value="Parado">Parado</option>
            </select>
          ) : (
             /* Espaço vazio para manter o grid alinhado na aba de motoristas */
             <div className="hidden md:block"></div>
          )}

          {/* Filtro de Status (Revisão/CNH) */}
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
      )}

      {/* --- CONTEÚDO DA ABA VEÍCULOS --- */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {loadingVehicles ? (
            <div className="col-span-full flex justify-center py-12">
               <p className="text-gray-500">A carregar frota...</p>
            </div>
          ) : null}
          
          {!loadingVehicles && filteredVehicles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
               <Car className="w-12 h-12 mb-2 opacity-20" />
               <p>Nenhum veículo encontrado com estes filtros.</p>
            </div>
          )}

          {filteredVehicles.map((vehicle) => {
            const status = getVehicleStatus(vehicle.lastReviewDate);
            const statusColor = status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600';
            const StatusIcon = status === 'error' ? AlertTriangle : status === 'warning' ? Clock : CheckCircle;

            return (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col border border-gray-100">
                {/* Imagem do Veículo */}
                <div className="h-48 bg-gray-200 relative group">
                  <img 
                    src={vehicle.imageUrl || "https://placehold.co/600x400/e2e8f0/cbd5e0?text=Sem+Foto"} 
                    alt={vehicle.model}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-100">
                    {vehicle.situation}
                  </span>
                </div>

                {/* Corpo do Card */}
                <div className="p-4 flex-grow">
                  <h3 className="text-xl font-bold text-gray-800">{vehicle.licensePlate}</h3>
                  <p className="text-gray-600 text-sm mb-4 font-medium">{vehicle.model}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">Motorista:</span>
                      <span className="font-medium text-gray-800 truncate max-w-[150px]" title={vehicle.driverName}>
                        {vehicle.driverName || 'N/D'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="text-gray-500">KM Atual:</span>
                      <span className="font-medium text-gray-800">{(vehicle.currentMileage || 0).toLocaleString()} km</span>
                    </div>
                    <div className={`flex justify-between items-center pt-1 font-semibold ${statusColor}`}>
                      <span className="flex items-center gap-1">
                         <StatusIcon className="w-4 h-4" /> Revisão:
                      </span>
                      <span>{formatDate(vehicle.lastReviewDate)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Rodapé de Ações */}
                <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    onClick={() => handleDeleteVehicle(vehicle)}
                    className="text-gray-500 hover:text-white hover:bg-red-600 transition-colors p-2 rounded-md"
                    title="Excluir Veículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEditVehicle(vehicle)} className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleOpenMaintenance(vehicle)} className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                      Custos
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CONTEÚDO DA ABA MOTORISTAS --- */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {loadingDrivers ? (
            <div className="col-span-full flex justify-center py-12">
               <p className="text-gray-500">A carregar motoristas...</p>
            </div>
          ) : null}

          {!loadingDrivers && filteredDrivers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
               <User className="w-12 h-12 mb-2 opacity-20" />
               <p>Nenhum motorista encontrado.</p>
            </div>
          )}

          {filteredDrivers.map((driver) => {
            const status = getDriverStatus(driver.licenseExpiration);
            const statusBg = status === 'error' ? 'bg-red-50 border-red-200' : status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200';
            const statusText = status === 'error' ? 'text-red-700' : status === 'warning' ? 'text-yellow-700' : 'text-gray-700';

            return (
              <div key={driver.id} className={`p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${statusBg} flex flex-col justify-between`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${statusText}`}>{driver.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">CNH: <span className="font-mono font-medium">{driver.licenseNumber}</span></p>
                  </div>
                  <span className="px-2 py-1 bg-gray-200 rounded text-xs font-bold text-gray-600 uppercase">
                    Cat. {driver.licenseCategory}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 text-sm">
                  <div>
                     <span className="text-gray-500 block text-xs">Validade:</span>
                     <span className={`font-bold ${status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {formatDate(driver.licenseExpiration)}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteDriver(driver)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Excluir Motorista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => handleOpenEditDriver(driver)}
                       className="text-primary hover:text-green-800 font-medium hover:underline"
                    >
                       Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CONTEÚDO: HISTÓRICO (LOGS) --- */}
      {activeTab === 'logs' && (
        <div className="animate-fade-in">
          <ActivityLogs department={departmentName || ''} />
        </div>
      )}

      {/* --- MODAIS --- */}
      
      <VehicleModal 
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        department={departmentName || ''}
        vehicleToEdit={editingVehicle}
        drivers={drivers}
      />

      <DriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        department={departmentName || ''}
        driverToEdit={editingDriver}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        vehicle={maintenanceVehicle}
      />
    </div>
  );
}
