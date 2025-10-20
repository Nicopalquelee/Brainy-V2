import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { fetchJson } from '../lib/api';

interface LoginFormProps {
  onLogin: (token: string) => void;
  onRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await fetchJson<unknown>('/auth/login', { method: 'POST', body: { email, password } });
      if (!data || data.error || !data.accessToken) {
        throw new Error(data?.error || 'Credenciales inválidas');
      }
      onLogin(data.accessToken as string);
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1220] to-[#0f172a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-card/80 backdrop-blur rounded-2xl shadow-2xl border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">Portal AcadUSS</h2>
          <p className="mt-2 text-center text-sm text-muted">Inicia sesión con tu cuenta institucional</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted text-foreground rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted text-foreground rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="text-primary hover:text-primary/90">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button type="submit" className="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <LogIn className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted">O</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onRegister}
              className="group relative w-full flex justify-center py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Crear una cuenta
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-muted">
          <p>
            Al iniciar sesión, aceptas nuestros{' '}
            <a href="#" className="text-primary hover:text-primary/90">
              Términos y Condiciones
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;