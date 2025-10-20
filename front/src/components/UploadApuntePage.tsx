import React from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import UploadNote from './UploadNote';

interface UploadApuntePageProps {
  onBack: () => void;
  onUploaded?: () => void;
}

const UploadApuntePage: React.FC<UploadApuntePageProps> = ({ onBack, onUploaded }) => {
  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Subir Apunte</h1>
                <p className="text-sm text-muted-foreground">Comparte tus materiales con la comunidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
        <UploadNote onUploaded={onUploaded || onBack} />
      </div>
    </div>
  );
};

export default UploadApuntePage;
