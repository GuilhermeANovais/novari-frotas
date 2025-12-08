import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { toast } from 'sonner';
import Logo from '../assets/logo.jpg'; 

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Bem-vindo de volta!");
    } catch (err: any) {
      console.error(err);
      // Tratamento de erros comuns do Firebase
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        toast.error("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/too-many-requests') {
        toast.error("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        toast.error("Erro ao entrar. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
        
        {/* Cabeçalho do Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-full overflow-hidden border border-zinc-100 shadow-sm mb-4">
             <img
                src={Logo}
                alt="GestorFrota"
                className="h-full w-full object-cover"
             />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Sistema de Gestão</h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              autoComplete="email"
            />

            <div className="space-y-1">
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <button type="button" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-2">
            Entrar no Sistema
          </Button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 text-center border-t border-zinc-100 pt-6">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Prefeitura Municipal de Murici. <br/>
            Sistema de Gestão Novare.
          </p>
        </div>
      </div>
    </div>
  );
}
