import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase'; // Importe do arquivo que configuramos antes
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Lock, Mail, AlertCircle } from 'lucide-react'; // Ícones modernos
import Logo from '../assets/logo.jpg';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirecionamento será automático graças ao AuthContext que configuraremos no App.tsx
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <img
            src={Logo}
            alt="Logótipo da Frota"
            className="h-24 w-24 mx-auto mb-4 rounded-full object-cover"
          />
          <h1 className="text-3xl font-bold text-gray-800">Acesso ao Sistema</h1>
          <p className="text-gray-500 mt-2">Prefeitura Municipal de Murici</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="pl-10" // Padding extra para o ícone
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
