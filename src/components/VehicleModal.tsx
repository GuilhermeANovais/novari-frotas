import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Upload, X, Loader2 } from 'lucide-react';
import { Vehicle, Driver } from '../types';
import { db, storage } from '../services/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';

// --- 1. Definição do Schema de Validação (Regras) ---
const vehicleSchema = z.object({
  licensePlate: z.string()
    .min(7, "A placa deve ter 7 caracteres")
    .max(8, "A placa deve ter no máximo 8 caracteres")
    .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/i, "Formato inválido (Use AAA-0000 ou Mercosul)"),
  model: z.string().min(2, "Modelo é obrigatório"),
  department: z.string().min(1, "Selecione um departamento"),
  situation: z.string().min(1, "Situação é obrigatória"),
  driverName: z.string().optional(),
  cor: z.string().optional(),
  renavam: z.string().optional(),
  chassis: z.string().optional(),
  route: z.string().optional(),
  details: z.string().optional(),
  // Transformação de string para número (inputs html retornam string)
  ano: z.coerce.number().min(1950, "Ano inválido").max(new Date().getFullYear() + 1, "Ano futuro?"),
  lastReviewDate: z.string().optional(), // Data vem como string do input date
  currentMileage: z.coerce.number().min(0, "Não pode ser negativo"),
  nextChangeMileage: z.coerce.number().min(0, "Não pode ser negativo"),
});

// Inferir o tipo TypeScript a partir do schema Zod
type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  vehicleToEdit?: Vehicle | null;
  drivers: Driver[];
}

export function VehicleModal({ 
  isOpen, 
  onClose, 
  department, 
  vehicleToEdit,
  drivers 
}: VehicleModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 2. Configuração do React Hook Form ---
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    formState: { errors } 
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      department: department,
      situation: 'Ativo',
      currentMileage: 0,
      nextChangeMileage: 0,
      ano: new Date().getFullYear()
    }
  });

  // Resetar o formulário quando o modal abre ou o veículo muda
  useEffect(() => {
    if (isOpen) {
      if (vehicleToEdit) {
        // Modo Edição: Preencher campos
        reset({
          licensePlate: vehicleToEdit.licensePlate,
          model: vehicleToEdit.model,
          department: vehicleToEdit.department,
          situation: vehicleToEdit.situation,
          driverName: vehicleToEdit.driverName || '',
          cor: vehicleToEdit.cor || '',
          renavam: vehicleToEdit.renavam || '',
          chassis: vehicleToEdit.chassis || '',
          route: vehicleToEdit.route || '',
          details: vehicleToEdit.details || '',
          ano: vehicleToEdit.ano || new Date().getFullYear(),
          lastReviewDate: vehicleToEdit.lastReviewDate || '',
          currentMileage: vehicleToEdit.currentMileage || 0,
          nextChangeMileage: vehicleToEdit.nextChangeMileage || 0,
        });
        setImagePreview(vehicleToEdit.imageUrl || '');
      } else {
        // Modo Criação: Limpar campos e definir padrões
        reset({
          department: department,
          situation: 'Ativo',
          currentMileage: 0,
          nextChangeMileage: 0,
          ano: new Date().getFullYear(),
          driverName: ''
        });
        setImagePreview('');
      }
      setImageFile(null);
    }
  }, [isOpen, vehicleToEdit, department, reset]);

  // Gestão de Imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // --- 3. Função de Envio (Submit) ---
  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = vehicleToEdit?.imageUrl || '';

      // Upload de Imagem (Lógica igual à anterior)
      if (vehicleToEdit && !imagePreview && vehicleToEdit.imageUrl) {
          try {
              const imageRef = ref(storage, vehicleToEdit.imageUrl);
              await deleteObject(imageRef);
          } catch (err) { console.warn("Erro ao deletar imagem antiga", err); }
          imageUrl = '';
      }

      // Preparar dados finais
      const vehicleData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      if (vehicleToEdit) {
        // EDIÇÃO
        if (imageFile) {
            const storageRef = ref(storage, `vehicle_images/${vehicleToEdit.id}/${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        await updateDoc(doc(db, 'vehicles', vehicleToEdit.id), { ...vehicleData, imageUrl });
        await logActivity('update_vehicle', `Veículo atualizado: ${vehicleData.licensePlate}`, department, vehicleToEdit.id);
        toast.success(`Veículo ${vehicleData.licensePlate} salvo!`);

      } else {
        // CRIAÇÃO
        const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
        
        if (imageFile) {
            const storageRef = ref(storage, `vehicle_images/${docRef.id}/${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
            await updateDoc(docRef, { imageUrl });
        }

        await logActivity('create_vehicle', `Veículo criado: ${vehicleData.licensePlate}`, department, docRef.id);
        toast.success(`Veículo ${vehicleData.licensePlate} criado!`);
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? `Editar Veículo - ${vehicleToEdit.licensePlate}` : `Novo Veículo em ${department}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Área de Imagem */}
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 dark:border-zinc-700">
          {imagePreview ? (
            <div className="relative w-full h-48 group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
              <button 
                type="button" 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 p-6 rounded-md transition-colors w-full">
              <Upload className="w-10 h-10 text-zinc-400 mb-3" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Clique para adicionar foto</span>
              <span className="text-xs text-zinc-400 mt-1">JPG, PNG (Max 5MB)</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Inputs com Zod Register */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Placa" 
            placeholder="AAA-0000" 
            {...register('licensePlate')} 
            error={errors.licensePlate?.message} 
          />
          <Input 
            label="Modelo" 
            placeholder="Ex: Fiat Toro" 
            {...register('model')} 
            error={errors.model?.message} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Situação</label>
             <select 
               {...register('situation')}
               className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
             >
               <option value="Ativo">Ativo</option>
               <option value="Em Manutenção">Em Manutenção</option>
               <option value="Aguardando Peças">Aguardando Peças</option>
               <option value="Parado">Parado</option>
             </select>
             {errors.situation && <span className="text-xs text-red-500 mt-1">{errors.situation.message}</span>}
           </div>
           
           <div>
             <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Motorista Responsável</label>
             <select 
               {...register('driverName')}
               className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
             >
               <option value="">Selecione...</option>
               {drivers.map(d => (
                 <option key={d.id} value={d.name}>{d.name}</option>
               ))}
             </select>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Input label="Cor" {...register('cor')} />
           <Input label="Ano" type="number" {...register('ano')} error={errors.ano?.message} />
           <Input label="RENAVAM" {...register('renavam')} />
           <Input label="Chassi" {...register('chassis')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
           <Input label="Última Revisão" type="date" {...register('lastReviewDate')} />
           <Input label="KM Atual" type="number" {...register('currentMileage')} error={errors.currentMileage?.message} />
           <Input label="Próxima Troca (KM)" type="number" {...register('nextChangeMileage')} error={errors.nextChangeMileage?.message} />
        </div>

        <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Observações</label>
            <textarea 
                {...register('details')}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
            ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {vehicleToEdit ? 'Salvar Alterações' : 'Criar Veículo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
