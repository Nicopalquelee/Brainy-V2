import { useState, useEffect } from 'react';
import { fetchJson } from './lib/api';
import Header from './components/Header';
import NotesGrid from './components/NotesGrid';
import StatsCard from './components/StatsCard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Curriculum from './components/Curriculum';
import BrainyChat from './components/BrainyChat';
import UploadApuntePage from './components/UploadApuntePage';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userData, setUserData] = useState<unknown>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [view, setView] = useState<'home' | 'upload' | 'chat'>('home');
  const [pendingAnchor, setPendingAnchor] = useState<null | 'malla'>(null);

  // Si se pidió navegar a una ancla del home (malla), esperar a que estemos en home y hacer scroll suave
  useEffect(() => {
    if (view === 'home' && pendingAnchor) {
      const id = pendingAnchor;
      setPendingAnchor(null);
      // Timeout corto para asegurar que el DOM del home esté renderizado
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  }, [view, pendingAnchor]);

  useEffect(() => {
    if (token) {
      fetchJson<unknown>('/users/me', { token })
        .then((data) => setUserData(data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  if (!token) {
    if (showRegister) {
      return (
        <RegisterForm 
          onBack={() => setShowRegister(false)}
          onRegisterSuccess={handleLogin}
        />
      );
    }
    return (
      <LoginForm 
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
    );
  }
  // Pantalla completa para chat o subir apunte
  if (view === 'chat' || view === 'upload') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header
          userName={(userData as any)?.full_name || (userData as any)?.username}
          onLogout={() => {
            localStorage.removeItem('token');
            setToken(null);
            setUserData(null);
          }}
          onUploadClick={() => setView('upload')}
          onChatClick={() => setView('chat')}
          onHomeClick={() => setView('home')}
          onCurriculumClick={() => {
            setView('home');
            setPendingAnchor('malla');
          }}
        />
        <main className="flex-1 min-h-0">
          <div className="h-full min-h-0">
            {view === 'chat' && <BrainyChat onBack={() => setView('home')} />}
            {view === 'upload' && (
              <UploadApuntePage onBack={() => setView('home')} onUploaded={() => setView('home')} />
            )}
          </div>
        </main>
      </div>
    );
  }

  // Vista dashboard por defecto
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        userName={(userData as any)?.full_name || (userData as any)?.username}
        onLogout={() => {
          localStorage.removeItem('token');
          setToken(null);
          setUserData(null);
        }}
        onUploadClick={() => setView('upload')}
        onChatClick={() => setView('chat')}
        onHomeClick={() => setView('home')}
        onCurriculumClick={() => {
          setView('home');
          setPendingAnchor('malla');
        }}
      />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <StatsCard />
          <NotesGrid />
          <Curriculum />
        </div>
      </main>
    </div>
  );
}

export default App;