import React, { useState } from 'react';
import { curriculum } from '../data/curriculum';
import { Upload, FileText, Tag, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadNoteProps {
  onUploaded?: () => void;
}

const UploadNote: React.FC<UploadNoteProps> = ({ onUploaded }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    tags: '',
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.file) {
      setMessage('Por favor completa todos los campos requeridos');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('subject', formData.subject);
      uploadData.append('description', formData.description);
      uploadData.append('tags', formData.tags);
      uploadData.append('file', formData.file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Simular progreso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el apunte');
      }

      await response.json();
      setMessage('¡Apunte subido exitosamente!');
      
      // Reset form
      setFormData({ 
        title: '', 
        subject: '', 
        description: '',
        tags: '',
        file: null 
      });
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (onUploaded) {
        setTimeout(() => {
          onUploaded();
        }, 1500);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center">
          <Upload className="w-6 h-6 mr-2" />
          📤 Subir Apunte
        </h2>
        <button 
          onClick={onUploaded}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          title="Cerrar"
        >
          ×
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Título del Apunte *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              placeholder="Ej: Resumen de Programación Orientada a Objetos"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
              Asignatura *
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              required
            >
              <option value="">Selecciona una asignatura</option>
              {Object.values(curriculum).flat().map((course: any) => (
                <option key={course.code} value={course.name}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder="Describe brevemente el contenido del apunte, temas cubiertos, nivel de dificultad, etc..."
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder="algoritmos, programación, estructuras"
          />
          <p className="text-xs text-muted-foreground mt-1">Separados por comas (opcional)</p>
        </div>

        {/* Archivo */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-foreground mb-2">
            Archivo *
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              required
            />
            <label htmlFor="file" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">
                {formData.file ? formData.file.name : 'Haz clic para seleccionar archivo'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Formatos permitidos: PDF, DOC, DOCX, TXT (máximo 10MB)
              </p>
            </label>
          </div>
        </div>

        {/* Barra de progreso */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subiendo archivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensajes */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message.includes('Error') ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {message}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onUploaded}
            className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors duration-200 ${
              isUploading
                ? 'bg-muted cursor-not-allowed text-muted-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </span>
            ) : 'Subir Apunte'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadNote;