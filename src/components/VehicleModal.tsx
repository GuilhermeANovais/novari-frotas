import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Upload, X } from 'lucide-react';
import { Vehicle, Driver } from '../types';
import { db, storage } from '../services/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  vehicleToEdit?: Vehicle | null; // Se for nulo, é modo de criação
  drivers: Driver[]; // Lista para o select box
}

const INITIAL_FORM_STATE = {
  licensePlate: '',
  model: '',
  cor: '',
  ano: new Date().getFullYear(),
  driverName: '',
  situation: 'Ativo',
  renavam: '',
  chassis: '',
  route: '',
  lastReviewDate: '',
  currentMileage: 0,
  nextChangeMileage: 0,
  details: ''
};

export function VehicleModal({ 
  isOpen, 
  onClose, 
  department, 
  vehicleToEdit,
  drivers 
}: VehicleModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Preenche o formulário ao abrir para edição
  useEffect(() => {
    if (isOpen) {
      if (vehicleToEdit) {
        setFormData({
          licensePlate: vehicleToEdit.licensePlate || '',
          model: vehicleToEdit.model || '',
          cor: vehicleToEdit.cor || '',
          ano: vehicleToEdit.ano || new Date().getFullYear(),
          driverName: vehicleToEdit.driverName || '',
          situation: vehicleToEdit.situation || 'Ativo',
          renavam: vehicleToEdit.renavam || '',
          chassis: vehicleToEdit.chassis || '',
          route: vehicleToEdit.route || '',
          lastReviewDate: vehicleToEdit.lastReviewDate || '',
          currentMileage: vehicleToEdit.currentMileage || 0,
          nextChangeMileage: vehicleToEdit.nextChangeMileage || 0,
          details: vehicleToEdit.details || ''
        });
        setImagePreview(vehicleToEdit.imageUrl || '');
      } else {
        setFormData(INITIAL_FORM_STATE);
        setImagePreview('');
      }
      setImageFile(null);
    }
  }, [isOpen, vehicleToEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = vehicleToEdit?.imageUrl || '';

      // 1. Upload da Imagem (se houver nova)
      if (imageFile) {
         // Se estamos editando e já tinha imagem, idealmente deletaríamos a antiga,
         // mas para simplificar, vamos apenas fazer upload da nova.
         // O ID do documento é necessário para o caminho, então se for criação, geramos antes.
      }

      const vehicleData = {
        ...formData,
        department, // Força o departamento atual
        ano: Number(formData.ano),
        currentMileage: Number(formData.currentMileage),
        nextChangeMileage: Number(formData.nextChangeMileage),
        updatedAt: serverTimestamp()
      };

      if (vehicleToEdit) {
        // --- MODO EDIÇÃO ---
        
        // Se escolheu remover a imagem e não subiu outra
        if (!imagePreview && vehicleToEdit.imageUrl) {
            try {
                const imageRef = ref(storage, vehicleToEdit.imageUrl);
                await deleteObject(imageRef);
            } catch (err) { console.error("Erro ao deletar imagem antiga", err); }
            imageUrl = '';
        }

        // Upload da nova imagem se existir
        if (imageFile) {
            const storageRef = ref(storage, `vehicle_images/${vehicleToEdit.id}/${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        await updateDoc(doc(db, 'vehicles', vehicleToEdit.id), {
            ...vehicleData,
            imageUrl
        });

      } else {
        // --- MODO CRIAÇÃO ---
        // Primeiro cria o doc para ter o ID
        const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
        
        if (imageFile) {
            const storageRef = ref(storage, `vehicle_images/${docRef.id}/${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
            // Atualiza com a URL
            await updateDoc(docRef, { imageUrl });
        }
      }

      onClose(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      alert("Erro ao salvar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? `Editar Veículo - ${vehicleToEdit.licensePlate}` : `Novo Veículo em ${department}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Área de Imagem */}
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          {imagePreview ? (
            <div className="relative w-full h-48">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
              <button 
                type="button" 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Clique para adicionar foto</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Campos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="licensePlate" label="Placa" value={formData.licensePlate} onChange={handleChange} required placeholder="ABC-1234" />
          <Input name="model" label="Modelo" value={formData.model} onChange={handleChange} required placeholder="Ex: Fiat Toro" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
             <select 
               name="situation" 
               value={formData.situation} 
               onChange={handleChange}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
             >
               <option value="Ativo">Ativo</option>
               <option value="Em Manutenção">Em Manutenção</option>
               <option value="Aguardando Peças">Aguardando Peças</option>
               <option value="Parado">Parado</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Motorista Responsável</label>
             <select 
               name="driverName" 
               value={formData.driverName} 
               onChange={handleChange}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
             >
               <option value="">Selecione...</option>
               {drivers.map(d => (
                 <option key={d.id} value={d.name}>{d.name}</option>
               ))}
             </select>
           </div>
        </div>

        {/* Detalhes Técnicos (Colapsáveis ou Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Input name="cor" label="Cor" value={formData.cor} onChange={handleChange} />
           <Input name="ano" label="Ano" type="number" value={formData.ano} onChange={handleChange} />
           <Input name="renavam" label="RENAVAM" value={formData.renavam} onChange={handleChange} />
           <Input name="chassis" label="Chassi" value={formData.chassis} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
           <Input name="lastReviewDate" label="Última Revisão" type="date" value={formData.lastReviewDate} onChange={handleChange} />
           <Input name="currentMileage" label="KM Atual" type="number" value={formData.currentMileage} onChange={handleChange} />
           <Input name="nextChangeMileage" label="Próxima Troca (KM)" type="number" value={formData.nextChangeMileage} onChange={handleChange} />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea 
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            ></textarea>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading}>
            {vehicleToEdit ? 'Salvar Alterações' : 'Criar Veículo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
