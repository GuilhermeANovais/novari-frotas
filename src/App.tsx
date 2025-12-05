import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Header } from "./components/Header";

// Componente para proteger rotas privadas
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Header />
      <main className="bg-gray-100 min-h-screen">
        {children}
      </main>
    </>
  );
}

// Componente para redirecionar se já estiver logado
function PublicRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* Rotas Futuras (ainda vamos criar) */}
        <Route path="/departamentos/:nome" element={
          <PrivateRoute>
            <div className="p-8 text-center">Página de Detalhes do Departamento (Em construção)</div>
          </PrivateRoute>
        } />
        
        <Route path="/relatorios" element={
          <PrivateRoute>
             <div className="p-8 text-center">Página de Relatórios (Em construção)</div>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
