import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { VehicleModal } from '../components/VehicleModal';
import { DriverModal } from '../components/DriverModal';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { ViewVehicleModal } from '../components/ViewVehicleModal';
import { ActivityLogs } from '../components/ActivityLogs';
import { Vehicle, Driver } from '../types';
import { 
  ArrowLeft, Plus, Search, Car, User, 
  AlertTriangle, CheckCircle, Clock, History, Trash2, ChevronDown, FileText, 
} from 'lucide-react';

import { 
  collection, doc, deleteDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';
import { DocumentsModal } from '../components/DocumentsModal';

// Utilitário para formatar datas
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/D';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

// Quantidade de itens carregados por vez no botão "Carregar Mais"
const ITEMS_INCREMENT = 50;

export function DepartmentDetails() {
  const { nome: departmentName } = useParams(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook para ler a URL (Busca Global)
  
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'logs'>('vehicles');
  
  // Inicializa a busca com o valor da URL (se existir)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Estado para controlar quantidade visível (Load More)
  const [visibleCount, setVisibleCount] = useState(ITEMS_INCREMENT);

  // Estados dos Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsVehicle, setDocsVehicle] = useState<Vehicle | null>(null);

  // Estados dos Filtros Extras
  const [situationFilter, setSituationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); 

  // Hooks de Dados
  const { vehicles, loading: loadingVehicles } = useVehicles(departmentName);
  const { drivers, loading: loadingDrivers } = useDrivers(departmentName);

  // --- EFEITOS ---

  // 1. Atualiza o termo de busca se a URL mudar (ex: nova busca no Header)
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      // Se buscou algo, garante que está na aba certa (opcional, aqui priorizamos veículos)
      if (!activeTab) setActiveTab('vehicles');
    }
  }, [searchParams]);

  // 2. Reseta o "Carregar Mais" quando filtros mudam
  useEffect(() => {
    setVisibleCount(ITEMS_INCREMENT);
  }, [activeTab, searchTerm, situationFilter, statusFilter]);

  // --- HANDLERS ---

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_INCREMENT);
  };

  // Abertura de Modais
  const handleOpenCreateVehicle = () => { setEditingVehicle(null); setIsVehicleModalOpen(true); };
  const handleOpenEditVehicle = (vehicle: Vehicle) => { setEditingVehicle(vehicle); setIsVehicleModalOpen(true); };
  const handleOpenMaintenance = (vehicle: Vehicle) => { setMaintenanceVehicle(vehicle); setIsMaintenanceModalOpen(true); };
  const handleOpenViewVehicle = (vehicle: Vehicle) => { setViewingVehicle(vehicle); setIsViewModalOpen(true); };
  const handleOpenCreateDriver = () => { setEditingDriver(null); setIsDriverModalOpen(true); };
  const handleOpenEditDriver = (driver: Driver) => { setEditingDriver(driver); setIsDriverModalOpen(true); };

  // Exclusão de Veículo (com limpeza de subcoleção e imagem)
  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!window.confirm(`ATENÇÃO: Você está prestes a excluir o veículo ${vehicle.licensePlate}.\n\nIsso apagará também todo o histórico de manutenções e a foto.\n\nTem certeza absoluta?`)) return;

    try {
      const batch = writeBatch(db);
      // Apagar subcoleção de manutenções
      const maintenanceSnap = await getDocs(collection(db, 'vehicles', vehicle.id, 'maintenanceRecords'));
      maintenanceSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Apagar imagem
      if (vehicle.imageUrl) {
        try {
          const imageRef = ref(storage, vehicle.imageUrl);
          await deleteObject(imageRef);
        } catch (err) {
          console.warn("Imagem já não existia ou erro ao apagar:", err);
        }
      }

      // Apagar documento principal
      await deleteDoc(doc(db, 'vehicles', vehicle.id));

      await logActivity('delete_vehicle', `Veículo excluído: ${vehicle.licensePlate}`, vehicle.department, vehicle.id);
      toast.success("Veículo excluído com sucesso.");

    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast.error("Ocorreu um erro ao tentar excluir.");
    }
  };

  // Exclusão de Motorista
  const handleDeleteDriver = async (driver: Driver) => {
    if (!window.confirm(`Tem certeza que deseja excluir o motorista ${driver.name}?`)) return;

    try {
      await deleteDoc(doc(db, 'drivers', driver.id));
      await logActivity('delete_driver', `Motorista excluído: ${driver.name}`, driver.department, driver.id);
      toast.success("Motorista excluído.");
    } catch (error) {
      console.error("Erro ao excluir motorista:", error);
      toast.error("Erro ao excluir motorista.");
    }
  };

  const handleOpenDocs = (vehicle: Vehicle) => { 
    setDocsVehicle(vehicle); 
    setIsDocsModalOpen(true); 
  };

  // --- Helpers de Status ---
  const getVehicleStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const nextReview = new Date(new Date(dateStr + 'T00:00:00').setMonth(new Date(dateStr + 'T00:00:00').getMonth() + 6));
    const daysLeft = (nextReview.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'error';
    if (daysLeft <= 30) return 'warning';
    return 'ok';
  };

  const getDriverStatus = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const daysLeft = (new Date(dateStr + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'error';
    if (daysLeft <= 45) return 'warning';
    return 'ok';
  };

  // --- FILTRAGEM ---
  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (v.licensePlate?.toLowerCase().includes(term) || v.model?.toLowerCase().includes(term));
    const matchesSituation = situationFilter ? v.situation === situationFilter : true;
    let matchesStatus = true;
    if (statusFilter) matchesStatus = getVehicleStatus(v.lastReviewDate) === statusFilter;
    return matchesSearch && matchesSituation && matchesStatus;
  });

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter) matchesStatus = getDriverStatus(d.licenseExpiration) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- DADOS FATIADOS (LOAD MORE) ---
  const currentVehicles = filteredVehicles.slice(0, visibleCount);
  const currentDrivers = filteredDrivers.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')} 
            className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100"
            title="Voltar para Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">Gestão de {departmentName}</h1>
        </div>
        
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

      {/* Abas de Navegação */}
      <div className="border-b border-zinc-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('vehicles'); setStatusFilter(''); }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'vehicles' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            <Car className="w-5 h-5 mr-2" /> Veículos
          </button>
          <button
            onClick={() => { setActiveTab('drivers'); setStatusFilter(''); }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'drivers' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            <User className="w-5 h-5 mr-2" /> Motoristas
          </button>
          <button
            onClick={() => { setActiveTab('logs'); }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'logs' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            <History className="w-5 h-5 mr-2" /> Histórico
          </button>
        </nav>
      </div>

      {/* Barra de Filtros */}
      {activeTab !== 'logs' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
            <Input 
              placeholder="Buscar placa ou modelo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'vehicles' ? (
            <select 
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              value={situationFilter}
              onChange={(e) => setSituationFilter(e.target.value)}
            >
              <option value="">Todas as Situações</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Aguardando Peças">Aguardando Peças</option>
              <option value="Parado">Parado</option>
            </select>
          ) : <div className="hidden md:block"></div>}

          <div className="flex bg-zinc-100 p-1 rounded-lg">
            {[
              { label: 'Todos', value: '' },
              { label: activeTab === 'vehicles' ? 'Atrasada' : 'Vencida', value: 'error' },
              { label: activeTab === 'vehicles' ? 'Próxima' : 'A Vencer', value: 'warning' },
              { label: 'Em Dia', value: 'ok' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex-1 text-sm font-medium rounded-md py-1 transition-all ${statusFilter === opt.value ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- CONTEÚDO: VEÍCULOS --- */}
      {activeTab === 'vehicles' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {loadingVehicles && <div className="col-span-full text-center py-12 text-zinc-500">A carregar frota...</div>}
            
            {!loadingVehicles && filteredVehicles.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500 bg-white rounded-lg border border-dashed border-zinc-300">
                 <Car className="w-12 h-12 mb-2 opacity-20" /> <p>Nenhum veículo encontrado.</p>
              </div>
            )}

            {currentVehicles.map((vehicle) => {
              const status = getVehicleStatus(vehicle.lastReviewDate);
              const statusColor = status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600';
              const StatusIcon = status === 'error' ? AlertTriangle : status === 'warning' ? Clock : CheckCircle;

              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-zinc-200">
                  <div className="h-48 bg-zinc-200 relative group">
                    <img 
                      src={vehicle.imageUrl || "https://placehold.co/600x400/e2e8f0/cbd5e0?text=Sem+Foto"} 
                      alt={vehicle.model}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-zinc-700 shadow-sm border border-zinc-200">
                      {vehicle.situation}
                    </span>
                  </div>
                  <div className="p-4 flex-grow">
                    <h3 className="text-xl font-bold text-zinc-900">{vehicle.licensePlate}</h3>
                    <p className="text-zinc-600 text-sm mb-4 font-medium">{vehicle.model}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-zinc-100 pb-1">
                        <span className="text-zinc-500">Motorista:</span>
                        <span className="font-medium text-zinc-800 truncate max-w-[150px]" title={vehicle.driverName}>
                          {vehicle.driverName || 'N/D'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1">
                        <span className="text-zinc-500">KM Atual:</span>
                        <span className="font-medium text-zinc-800">{(vehicle.currentMileage || 0).toLocaleString()} km</span>
                      </div>
                      <div className={`flex justify-between items-center pt-1 font-semibold ${statusColor}`}>
                        <span className="flex items-center gap-1"><StatusIcon className="w-4 h-4" /> Revisão:</span>
                        <span>{formatDate(vehicle.lastReviewDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rodapé de Ações */}
                  <div className="bg-zinc-50 p-3 border-t border-zinc-100 flex justify-between items-center">
                    <button 
                      onClick={() => handleDeleteVehicle(vehicle)}
                      className="text-zinc-400 hover:text-white hover:bg-red-600 transition-colors p-2 rounded-md"
                      title="Excluir Veículo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenViewVehicle(vehicle)}
                        className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded-md transition-colors shadow-sm"
                      >
                        Detalhes
                      </button>

                      <button 
                        onClick={() => handleOpenDocs(vehicle)} 
                        className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors shadow-sm flex items-center gap-1"
                        title="Documentos (GED)"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => handleOpenEditVehicle(vehicle)} 
                        className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                      
                      <button 
                        onClick={() => handleOpenMaintenance(vehicle)} 
                        className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-black rounded-md transition-colors shadow-sm"
                      >
                        Custos
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Carregar Mais - Veículos */}
          {filteredVehicles.length > visibleCount && (
             <div className="flex justify-center mt-10">
               <Button 
                 variant="outline" 
                 onClick={handleLoadMore}
                 className="w-full md:w-auto px-8 py-3 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 shadow-sm"
               >
                 <ChevronDown className="w-4 h-4 mr-2" />
                 Carregar Mais Veículos ({filteredVehicles.length - visibleCount} restantes)
               </Button>
             </div>
          )}
        </>
      )}

      {/* --- CONTEÚDO: MOTORISTAS --- */}
      {activeTab === 'drivers' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {loadingDrivers && <div className="col-span-full text-center py-12 text-zinc-500">A carregar motoristas...</div>}
            
            {!loadingDrivers && filteredDrivers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500 bg-white rounded-lg border border-dashed border-zinc-300">
                 <User className="w-12 h-12 mb-2 opacity-20" /> <p>Nenhum motorista encontrado.</p>
              </div>
            )}

            {currentDrivers.map((driver) => {
              const status = getDriverStatus(driver.licenseExpiration);
              const statusBg = status === 'error' ? 'bg-red-50 border-red-200' : status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-zinc-200';
              const statusText = status === 'error' ? 'text-red-700' : status === 'warning' ? 'text-yellow-700' : 'text-zinc-700';

              return (
                <div key={driver.id} className={`p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${statusBg} flex flex-col justify-between`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`text-lg font-bold ${statusText}`}>{driver.name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">CNH: <span className="font-mono font-medium">{driver.licenseNumber}</span></p>
                    </div>
                    <span className="px-2 py-1 bg-zinc-100 rounded text-xs font-bold text-zinc-600 uppercase">Cat. {driver.licenseCategory}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200/50 text-sm">
                    <div>
                       <span className="text-zinc-500 block text-xs">Validade:</span>
                       <span className={`font-bold ${status === 'error' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatDate(driver.licenseExpiration)}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteDriver(driver)}
                        className="text-zinc-400 hover:text-white hover:bg-red-600 transition-colors p-2 rounded-md"
                        title="Excluir Motorista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleOpenEditDriver(driver)}
                         className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                      >
                         Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Carregar Mais - Motoristas */}
          {filteredDrivers.length > visibleCount && (
             <div className="flex justify-center mt-10">
               <Button 
                 variant="outline" 
                 onClick={handleLoadMore}
                 className="w-full md:w-auto px-8 py-3 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 shadow-sm"
               >
                 <ChevronDown className="w-4 h-4 mr-2" />
                 Carregar Mais Motoristas ({filteredDrivers.length - visibleCount} restantes)
               </Button>
             </div>
          )}
        </>
      )}

      {/* --- LOGS --- */}
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
      <ViewVehicleModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        vehicle={viewingVehicle}
      />
      <DocumentsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        vehicle={docsVehicle}
      />
    </div>
  );
}
