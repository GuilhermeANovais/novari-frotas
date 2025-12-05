import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Clock, User, Activity } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  description: string;
  userEmail: string;
  timestamp: any;
}

export function ActivityLogs({ department }: { department: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const q = query(
          collection(db, 'logs'),
          where('department', '==', department),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
        setLogs(data);
      } catch (error) {
        console.error("Erro ao buscar logs:", error);
      } finally {
        setLoading(false);
      }
    }

    if (department) {
      fetchLogs();
    }
  }, [department]);

  if (loading) return <div className="text-center py-8 text-gray-500">A carregar histórico...</div>;

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed">
        <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>Nenhuma atividade registada neste departamento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b bg-gray-50 font-semibold text-gray-700 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Histórico de Alterações
      </div>
      <div className="divide-y divide-gray-100">
        {logs.map((log) => {
          // Converter timestamp do Firestore para data legível
          const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
          
          return (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <p className="text-gray-800 font-medium text-sm">{log.description}</p>
                <span className="text-xs text-gray-400 flex items-center whitespace-nowrap ml-4">
                  <Clock className="w-3 h-3 mr-1" />
                  {date.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">
                  {log.action.toUpperCase()}
                </span>
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {log.userEmail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
