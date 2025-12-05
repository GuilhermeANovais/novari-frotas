import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Driver } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  driverToEdit?: Driver | null;
}

const INITIAL_FORM_STATE = {
  name: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiration: ''
};

export function DriverModal({ 
  isOpen, 
  onClose, 
  department, 
  driverToEdit 
}: DriverModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (driverToEdit) {
        setFormData({
          name: driverToEdit.name || '',
          licenseNumber: driverToEdit.licenseNumber || '',
          licenseCategory: driverToEdit.licenseCategory || '',
          licenseExpiration: driverToEdit.licenseExpiration || ''
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
    }
  }, [isOpen, driverToEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const driverData = { ...formData, department };

      if (driverToEdit) {
        await updateDoc(doc(db, 'drivers', driverToEdit.id), driverData);
        await logActivity('update_driver', `Motorista atualizado: ${driverData.name}`, department, driverToEdit.id);
        toast.success(`Motorista ${driverData.name} atualizado!`);
      } else {
        const docRef = await addDoc(collection(db, 'drivers'), driverData);
        await logActivity('create_driver', `Motorista criado: ${driverData.name}`, department, docRef.id);
        toast.success(`Motorista ${driverData.name} cadastrado!`);
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar motorista:", error);
      toast.error("Erro ao salvar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driverToEdit ? 'Editar Motorista' : `Adicionar Motorista em ${department}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input name="name" label="Nome Completo" value={formData.name} onChange={handleChange} required placeholder="Nome do motorista" />
        <Input name="licenseNumber" label="Número da CNH" value={formData.licenseNumber} onChange={handleChange} required placeholder="Número de registo" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="licenseCategory" label="Categoria" value={formData.licenseCategory} onChange={handleChange} required placeholder="Ex: AB, D, E" />
          <Input name="licenseExpiration" label="Validade da CNH" type="date" value={formData.licenseExpiration} onChange={handleChange} required />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" isLoading={loading}>{driverToEdit ? 'Salvar Alterações' : 'Adicionar Motorista'}</Button>
        </div>
      </form>
    </Modal>
  );
}
