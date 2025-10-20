import React from 'react';
import { BookOpen, Bell, User, Settings, Menu, LogOut, MessageCircle } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onUploadClick?: () => void;
  onChatClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout, onUploadClick, onChatClick }) => {
  return (
    <header className="bg-card border-b border-border px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Logo y marca */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">AcadUSS</h1>
          </div>
        </div>

        {/* Navegación central */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
            Apuntes
          </a>
                 <a href="#malla" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                   Malla Curricular
                 </a>
          <button onClick={onUploadClick} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            Subir Apunte
          </button>
        </nav>

        {/* Botón Chatea con Brainy */}
        {onChatClick && (
          <button
            onClick={onChatClick}
            className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Chatea con Brainy</span>
          </button>
        )}

        {/* Acciones y perfil */}
        <div className="flex items-center space-x-4">
          {/* Iconos de acción */}
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            <Settings className="w-5 h-5" />
          </button>

          {/* Perfil de usuario */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground hidden md:inline">
                {userName || 'Usuario'}
              </span>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Menú móvil */}
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;