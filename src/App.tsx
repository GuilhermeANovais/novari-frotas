import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { DepartmentDetails } from "./pages/DepartmentDetails";
import { Reports } from "./pages/Reports";
import { Header } from "./components/Header";
import { Loader2 } from "lucide-react";
import { Toaster } from 'sonner';

// Layout Fixo: Ocupa 100% da altura da tela (h-screen) e não rola a janela (overflow-hidden)
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
          <span className="text-zinc-500 font-medium">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 overflow-hidden">
      {/* Header Fixo no topo */}
      <div className="flex-none z-10">
        <Header />
      </div>
      
      {/* Área Principal: Ocupa o espaço restante (flex-1) e rola internamente (overflow-y-auto) */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {/* Container centralizado para limitar a largura em telas muito grandes */}
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; 
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" expand={true} />
      
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/departamentos/:nome" 
          element={
            <PrivateRoute>
              <DepartmentDetails />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/relatorios" 
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
