import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { DepartmentDetails } from "./pages/DepartmentDetails";
import { Header } from "./components/Header";
import { Loader2 } from "lucide-react";
import { Reports } from "./pages/Reports";

// Componente para proteger rotas privadas (Dashboard, Detalhes, etc.)
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

// Componente para rotas públicas (Login)
// Se o usuário já estiver logado, redireciona para o Dashboard
function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Ou um spinner, mas geralmente é muito rápido
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rota de Login (Pública) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rota Dashboard (Privada - Raiz) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Rota de Detalhes do Departamento (Privada) */}
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

        {/* Rota de Relatórios (Placeholder Futuro) */}
        <Route 
          path="/relatorios" 
          element={
            <PrivateRoute>
               <div className="p-8 text-center text-gray-500">
                 <h2 className="text-xl font-bold mb-2">Relatórios</h2>
                 <p>Módulo de relatórios em desenvolvimento.</p>
               </div>
            </PrivateRoute>
          } 
        />

        {/* Rota Catch-all (Qualquer URL desconhecida redireciona para o início) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
