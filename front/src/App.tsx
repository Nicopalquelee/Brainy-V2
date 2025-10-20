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
  const [showUpload, setShowUpload] = useState(false);
  const [showChat, setShowChat] = useState(false);

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

  // Mostrar el chatbot si está activo
  if (showChat) {
    return <BrainyChat onBack={() => setShowChat(false)} />;
  }

  // Mostrar la página de Subir Apunte como vista aparte
  if (showUpload) {
    return <UploadApuntePage onBack={() => setShowUpload(false)} onUploaded={() => setShowUpload(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        userName={(userData as any)?.full_name || (userData as any)?.username} 
        onLogout={() => {
          localStorage.removeItem('token');
          setToken(null);
          setUserData(null);
        }} 
        onUploadClick={() => setShowUpload(true)}
        onChatClick={() => setShowChat(true)}
      />
      
      {/* Contenido principal - ahora ocupa todo el ancho */}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <StatsCard />
          {/* El formulario de subida ahora es una página separada */}
          <NotesGrid />
          <Curriculum />
        </div>
      </main>
    </div>
  );
}

export default App;