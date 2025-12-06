import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2, Wrench, DollarSign, Calendar } from 'lucide-react';
import { db } from '../services/firebase';
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, 
  query, orderBy, onSnapshot, increment, serverTimestamp 
} from 'firebase/firestore';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';
import { Vehicle, MaintenanceRecord } from '../types';

const maintenanceSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().min(3, "Descrição muito curta"),
  partsCost: z.coerce.number().min(0, "O valor não pode ser negativo"),
  laborCost: z.coerce.number().min(0, "O valor não pode ser negativo"),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function MaintenanceModal({ isOpen, onClose, vehicle }: MaintenanceModalProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      partsCost: 0,
      laborCost: 0,
      description: ''
    }
  });

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
    } else {
        reset({
            date: new Date().toISOString().split('T')[0],
            partsCost: 0,
            laborCost: 0,
            description: ''
        });
    }
  }, [isOpen, vehicle, reset]);

  const totalParts = records.reduce((acc, rec) => acc + (rec.partsCost || 0), 0);
  const totalLabor = records.reduce((acc, rec) => acc + (rec.laborCost || 0), 0);
  const grandTotal = totalParts + totalLabor;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const onSubmit: SubmitHandler<MaintenanceFormData> = async (data) => {
    if (!vehicle?.id) return;
    setIsSubmitting(true);

    const total = data.partsCost + data.laborCost;

    try {
      await addDoc(collection(db, 'vehicles', vehicle.id, 'maintenanceRecords'), {
        ...data,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'vehicles', vehicle.id), {
        totalCost: increment(total),
        situation: 'Em Manutenção'
      });
      
      await logActivity(
          'create_maintenance', 
          `Nova manutenção: ${data.description} (${formatCurrency(total)})`, 
          vehicle.department, 
          vehicle.id
      );

      toast.success("Manutenção registrada com sucesso!");
      
      reset({
        date: new Date().toISOString().split('T')[0],
        description: '',
        partsCost: 0,
        laborCost: 0
      });

    } catch (error) {
      console.error("Erro ao adicionar manutenção:", error);
      toast.error("Erro ao salvar manutenção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string, pCost: number, lCost: number) => {
    if (!vehicle?.id) return;
    if (!confirm("Tem certeza que deseja excluir este registro? O valor será estornado.")) return;

    try {
      await deleteDoc(doc(db, 'vehicles', vehicle.id, 'maintenanceRecords', recordId));

      await updateDoc(doc(db, 'vehicles', vehicle.id), { 
          totalCost: increment(-(pCost + lCost)) 
      });
      
      toast.success("Registro removido e valor estornado.");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir registro.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico de Manutenção - ${vehicle?.licensePlate || ''}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Peças</p>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatCurrency(totalParts)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Mão de Obra</p>
            <p className="text-lg font-bold text-green-800 dark:text-green-200">{formatCurrency(totalLabor)}</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase">Total Geral</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 font-medium text-sm text-zinc-700 dark:text-zinc-300">
            Últimos Serviços
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {records.length === 0 ? (
              <p className="p-8 text-center text-zinc-400 text-sm">Nenhum registro encontrado.</p>
            ) : (
              records.map(rec => (
                <div key={rec.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex justify-between items-start group transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-zinc-400 text-xs">•</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{rec.description}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      Peças: {formatCurrency(rec.partsCost)} | M. Obra: {formatCurrency(rec.laborCost)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(rec.id, rec.partsCost, rec.laborCost)}
                    className="text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                    title="Excluir registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h4 className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Registrar Nova Manutenção
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Data</label>
               <div className="relative">
                 <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                 <input 
                   type="date" 
                   {...register('date')}
                   className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                 />
               </div>
               {errors.date && <span className="text-xs text-red-500 mt-1">{errors.date.message}</span>}
            </div>
            
            <div>
               <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Descrição</label>
               <input 
                 type="text" 
                 placeholder="Ex: Troca de óleo e filtros"
                 {...register('description')}
                 className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
               />
               {errors.description && <span className="text-xs text-red-500 mt-1">{errors.description.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Peças (R$)</label>
               <div className="relative">
                 <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                 <input 
                   type="number" 
                   step="0.01"
                   placeholder="0,00"
                   {...register('partsCost')}
                   className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                 />
               </div>
               {errors.partsCost && <span className="text-xs text-red-500 mt-1">{errors.partsCost.message}</span>}
            </div>
            
            <div>
               <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Mão de Obra (R$)</label>
               <div className="relative">
                 <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                 <input 
                   type="number" 
                   step="0.01"
                   placeholder="0,00"
                   {...register('laborCost')}
                   className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                 />
               </div>
               {errors.laborCost && <span className="text-xs text-red-500 mt-1">{errors.laborCost.message}</span>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmitting} className="w-auto px-6">
              Adicionar Registro
            </Button>
          </div>
        </form>

      </div>
    </Modal>
  );
}
