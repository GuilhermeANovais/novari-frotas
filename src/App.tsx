import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { DepartmentDetails } from "./pages/DepartmentDetails";
import { Reports } from "./pages/Reports";
import { Header } from "./components/Header";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="text-gray-500 font-medium">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main className="bg-gray-100 min-h-screen pb-10">
        {children}
      </main>
    </>
  );
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      {/* Configuração Global do Toast */}
      <Toaster richColors position="top-right" expand={true} />
      
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/departamentos/:nome" element={<PrivateRoute><DepartmentDetails /></PrivateRoute>} />
        <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
