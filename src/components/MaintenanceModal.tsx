import { useState, useEffect, FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Trash2, Wrench, DollarSign, Calendar } from 'lucide-react';
import { db } from '../services/firebase';
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, 
  query, orderBy, onSnapshot, increment, serverTimestamp 
} from 'firebase/firestore';
import { Vehicle, MaintenanceRecord } from '../types';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function MaintenanceModal({ isOpen, onClose, vehicle }: MaintenanceModalProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado do Formulário
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');

  // Totais calculados localmente para exibição rápida
  const totalParts = records.reduce((acc, rec) => acc + (rec.partsCost || 0), 0);
  const totalLabor = records.reduce((acc, rec) => acc + (rec.laborCost || 0), 0);
  const grandTotal = totalParts + totalLabor;

  // Carregar dados em tempo real
  useEffect(() => {
    if (isOpen && vehicle?.id) {
      const q = query(
        collection(db, 'vehicles', vehicle.id, 'maintenanceRecords'),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MaintenanceRecord));
        setRecords(docs);
      });

      return () => unsubscribe();
    }
  }, [isOpen, vehicle]);

  const handleAddMaintenance = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicle?.id) return;
    setLoading(true);

    const pCost = parseFloat(partsCost) || 0;
    const lCost = parseFloat(laborCost) || 0;
    const total = pCost + lCost;

    try {
      // 1. Adicionar o registro na subcoleção
      await addDoc(collection(db, 'vehicles', vehicle.id, 'maintenanceRecords'), {
        date,
        description,
        partsCost: pCost,
        laborCost: lCost,
        createdAt: serverTimestamp()
      });

      // 2. Atualizar o custo total no veículo (Atómico)
      await updateDoc(doc(db, 'vehicles', vehicle.id), {
        totalCost: increment(total),
        situation: 'Em Manutenção' // Opcional: muda status automaticamente
      });

      // Resetar form
      setDescription('');
      setPartsCost('');
      setLaborCost('');
      alert("Manutenção registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar manutenção:", error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string, pCost: number, lCost: number) => {
    if (!vehicle?.id || !confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      // 1. Remover registro
      await deleteDoc(doc(db, 'vehicles', vehicle.id, 'maintenanceRecords', recordId));

      // 2. Decrementar custo total
      await updateDoc(doc(db, 'vehicles', vehicle.id), {
        totalCost: increment(-(pCost + lCost))
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  // Formatador de Moeda
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico de Manutenção - ${vehicle?.licensePlate || ''}`}
    >
      <div className="space-y-6">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase">Peças</p>
            <p className="text-lg font-bold text-blue-800">{formatCurrency(totalParts)}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase">Mão de Obra</p>
            <p className="text-lg font-bold text-green-800">{formatCurrency(totalLabor)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-bold uppercase">Total Geral</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(grandTotal)}</p>
          </div>
        </div>

        {/* Lista de Histórico */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm text-gray-700">
            Últimos Serviços
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {records.length === 0 ? (
              <p className="p-4 text-center text-gray-400 text-sm">Nenhum registro encontrado.</p>
            ) : (
              records.map(rec => (
                <div key={rec.id} className="p-4 hover:bg-gray-50 flex justify-between items-start group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 text-sm">
                        {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="font-medium text-gray-800 text-sm">{rec.description}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Peças: {formatCurrency(rec.partsCost)} | M. Obra: {formatCurrency(rec.laborCost)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(rec.id, rec.partsCost, rec.laborCost)}
                    className="text-gray-300 hover:text-red-600 transition-colors p-1"
                    title="Excluir registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulário de Adição */}
        <form onSubmit={handleAddMaintenance} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h4 className="font-bold text-gray-700 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Registrar Nova Manutenção
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Data</label>
               <div className="relative">
                 <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                 <input 
                   type="date" 
                   required
                   value={date}
                   onChange={e => setDate(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                 />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Descrição do Serviço</label>
               <input 
                 type="text" 
                 required
                 placeholder="Ex: Troca de óleo e filtros"
                 value={description}
                 onChange={e => setDescription(e.target.value)}
                 className="w-full px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Custo Peças (R$)</label>
               <div className="relative">
                 <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                 <input 
                   type="number" 
                   step="0.01"
                   min="0"
                   placeholder="0,00"
                   value={partsCost}
                   onChange={e => setPartsCost(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                 />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Custo Mão de Obra (R$)</label>
               <div className="relative">
                 <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                 <input 
                   type="number" 
                   step="0.01"
                   min="0"
                   placeholder="0,00"
                   value={laborCost}
                   onChange={e => setLaborCost(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                 />
               </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={loading} className="w-auto px-6">
              Adicionar Registro
            </Button>
          </div>
        </form>

      </div>
    </Modal>
  );
}
