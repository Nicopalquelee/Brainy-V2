import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, ArrowLeft, MailCheck } from 'lucide-react';
import { auth } from '../lib/supabase';

interface RegisterFormProps {
  onBack: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!email.endsWith('@correo.uss.cl')) {
      setError('Debes usar tu correo institucional (@correo.uss.cl)');
      return;
    }

    try {
      const redirect = `${window.location.origin}/auth/callback`;
      const { error: signUpError } = await auth.signUp(
        email,
        password,
        { full_name: name },
        redirect
      );
      if (signUpError) {
        setError(signUpError.message || 'No se pudo completar el registro.');
        return;
      }
      // Mostrar pantalla de confirmación de email
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el usuario. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1220] to-[#0f172a]">
      <div className="max-w-md w-full space-y-8 p-8 bg-card/80 backdrop-blur rounded-2xl shadow-2xl border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Crear cuenta en AcadUSS
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Regístrate con tu correo institucional
          </p>
        </div>
        {success ? (
          <div className="mt-8 space-y-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <MailCheck className="w-7 h-7 text-green-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Revisa tu correo</h3>
            <p className="text-sm text-muted-foreground">
              Te enviamos un enlace de confirmación a <strong>{email}</strong>.
              Abre el correo y confirma tu cuenta para iniciar sesión.
            </p>
            <button type="button" onClick={onBack} className="mt-4 group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio de sesión</span>
            </button>
          </div>
        ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <label htmlFor="name" className="sr-only">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="register-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Correo electrónico (@correo.uss.cl)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="register-password" className="sr-only">
                Contraseña
              </label>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button type="submit" className="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <UserPlus className="w-4 h-4" />
              <span>Registrarse</span>
            </button>

            <button type="button" onClick={onBack} className="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio de sesión</span>
            </button>
          </div>
        </form>
        )}

        <div className="mt-4 text-center text-sm text-muted">
          <p>
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="text-primary hover:text-primary/90">
              Términos y Condiciones
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;