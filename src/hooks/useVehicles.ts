import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Vehicle } from '../types';

export function useVehicles(department: string | undefined) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se não houver departamento selecionado, não faz nada (ou limpa a lista)
    if (!department) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Cria a query básica: Veículos do departamento X
      const constraints: QueryConstraint[] = [
        where('department', '==', department),
        orderBy('licensePlate') // Ordenar por placa como no original
      ];

      const q = query(collection(db, 'vehicles'), ...constraints);

      // onSnapshot escuta mudanças em tempo real (Realtime)
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const results: Vehicle[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Vehicle));
          
          setVehicles(results);
          setLoading(false);
        },
        (err) => {
          console.error("Erro ao buscar veículos:", err);
          setError("Falha ao carregar veículos. Verifique as permissões.");
          setLoading(false);
        }
      );

      // Função de limpeza: para de escutar quando o componente desmonta
      return () => unsubscribe();
      
    } catch (err: any) {
      console.error("Erro na configuração da query:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [department]); // Recarrega sempre que o departamento mudar

  return { vehicles, loading, error };
}
