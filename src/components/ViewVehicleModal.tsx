import { Modal } from './Modal';
import { Button } from './Button';
import { Vehicle } from '../types';
import { Calendar, MapPin, Hash, Truck, AlertCircle, FileText, User } from 'lucide-react';

interface ViewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function ViewVehicleModal({ isOpen, onClose, vehicle }: ViewVehicleModalProps) {
  if (!vehicle) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/D';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const InfoRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-2 text-zinc-500 mb-1 sm:mb-0">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold text-zinc-800 text-right">{value || 'N/D'}</span>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Veículo - ${vehicle.licensePlate}`}
    >
      <div className="space-y-6">
        
        {/* Imagem de Destaque */}
        <div className="w-full h-56 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
          <img 
            src={vehicle.imageUrl || "https://placehold.co/600x400/e2e8f0/cbd5e0?text=Sem+Foto"} 
            alt={vehicle.model} 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Cabeçalho de Status */}
        <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-lg border border-zinc-100">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{vehicle.model}</h3>
            <span className="text-sm text-zinc-500">{vehicle.department}</span>
          </div>
          <span className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-700 shadow-sm">
            {vehicle.situation}
          </span>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 mt-2">Dados Básicos</h4>
            <InfoRow label="Placa" value={vehicle.licensePlate} icon={Hash} />
            <InfoRow label="Ano" value={vehicle.ano} icon={Calendar} />
            <InfoRow label="Cor" value={vehicle.cor} />
            <InfoRow label="Motorista" value={vehicle.driverName} icon={User} />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 mt-2">Técnico & Rota</h4>
            <InfoRow label="RENAVAM" value={vehicle.renavam} icon={FileText} />
            <InfoRow label="Chassi" value={vehicle.chassis} icon={Hash} />
            <InfoRow label="Rota/Uso" value={vehicle.route} icon={MapPin} />
            <InfoRow label="KM Atual" value={`${(vehicle.currentMileage || 0).toLocaleString()} km`} icon={Truck} />
          </div>
        </div>

        {/* Manutenção */}
        <div>
           <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 mt-2">Status de Manutenção</h4>
           <div className="bg-zinc-50 rounded-lg border border-zinc-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Última Revisão" value={formatDate(vehicle.lastReviewDate)} icon={Calendar} />
              <InfoRow label="Próxima Troca (KM)" value={`${(vehicle.nextChangeMileage || 0).toLocaleString()} km`} icon={AlertCircle} />
           </div>
        </div>

        {/* Observações */}
        {vehicle.details && (
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Observações</h4>
            <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-md border border-zinc-100">
              {vehicle.details}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-zinc-100">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
}
