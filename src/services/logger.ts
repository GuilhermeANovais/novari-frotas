import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function logActivity(
  action: string, 
  description: string, 
  department: string, 
  targetId: string = ''
) {
  try {
    const user = auth.currentUser;
    
    await addDoc(collection(db, 'logs'), {
      action,
      description,
      department,
      targetId,
      userId: user?.uid || 'anon',
      userEmail: user?.email || 'Sistema',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao gravar log:", error);
  }
}
