import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Vehicle, Driver } from '../types';

export function useAllData() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        
        // 1. Buscar Veículos
        const vehiclesQuery = query(collection(db, 'vehicles'), orderBy('department'));
        const vehiclesSnap = await getDocs(vehiclesQuery);
        const vehiclesData = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        
        // 2. Buscar Motoristas
        const driversQuery = query(collection(db, 'drivers'), orderBy('name'));
        const driversSnap = await getDocs(driversQuery);
        const driversData = driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));

        setVehicles(vehiclesData);
        setDrivers(driversData);
      } catch (error) {
        console.error("Erro ao carregar dados globais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { vehicles, drivers, loading };
}
