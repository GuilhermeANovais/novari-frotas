import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Driver } from '../types';

export function useDrivers(department: string | undefined) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!department) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'drivers'), 
      where('department', '==', department),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Driver[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Driver));
      
      setDrivers(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [department]);

  return { drivers, loading };
}
