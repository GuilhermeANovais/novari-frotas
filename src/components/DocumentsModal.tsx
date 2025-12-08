import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Vehicle, VehicleDocument } from '../types';
import { 
  FileText, Upload, Trash2, Download, 
  FileImage, ExternalLink, Loader2, X 
} from 'lucide-react';

// Firebase
import { db, storage, auth } from '../services/firebase';
import { 
  collection, addDoc, deleteDoc, doc, 
  query, orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logActivity } from '../services/logger';
import { toast } from 'sonner';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export function DocumentsModal({ isOpen, onClose, vehicle }: DocumentsModalProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && vehicle?.id) {
      const q = query(
        collection(db, 'vehicles', vehicle.id, 'documents'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VehicleDocument));
        setDocuments(docs);
      });

      return () => unsubscribe();
    } else {
      setDocuments([]);
    }
  }, [isOpen, vehicle]);

  // 2. Upload de Arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const storagePath = `documents/${vehicle.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const docData: Omit<VehicleDocument, 'id'> = {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedBy: auth.currentUser?.email || 'Sistema',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'vehicles', vehicle.id, 'documents'), docData);

      await logActivity(
        'upload_document', 
        `Arquivo anexado: ${file.name}`, 
        vehicle.department, 
        vehicle.id
      );

      toast.success("Documento enviado com sucesso!");
      
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Falha ao enviar documento.");
    } finally {
      setIsUploading(false);
    }
  };

  //Excluir Documento
  const handleDelete = async (docId: string, fileUrl: string, fileName: string) => {
    if (!vehicle) return;
    if (!window.confirm(`Excluir o arquivo "${fileName}"?`)) return;

    try {
      try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("Arquivo já não existia no Storage ou erro de ref:", err);
      }

      await deleteDoc(doc(db, 'vehicles', vehicle.id, 'documents', docId));
      
      toast.success("Arquivo removido.");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir arquivo.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <FileImage className="w-5 h-5 text-purple-600" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    return <FileText className="w-5 h-5 text-zinc-500" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documentos - ${vehicle?.licensePlate || ''}`}
    >
      <div className="space-y-6">
        
        {/* Área de Upload */}
        <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:bg-zinc-100 transition-colors relative">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-2" />
              <p className="text-sm text-zinc-500">Enviando arquivo...</p>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <div className="flex flex-col items-center pointer-events-none">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700">Clique ou arraste para enviar</p>
                <p className="text-xs text-zinc-400 mt-1">PDF, Imagens ou Doc (Max 5MB)</p>
              </div>
            </>
          )}
        </div>

        {/* Lista de Arquivos */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Arquivos Anexados ({documents.length})</h4>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm bg-zinc-50/50 rounded-lg border border-zinc-100">
              Nenhum documento encontrado.
            </div>
          ) : (
            <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg hover:shadow-sm transition-shadow group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 p-2 bg-zinc-50 rounded-md border border-zinc-100">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>{formatBytes(doc.size)}</span>
                        <span>•</span>
                        <span>{doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '...'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Abrir / Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => handleDelete(doc.id, doc.url, doc.name)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
}