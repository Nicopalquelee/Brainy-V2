import React from 'react';
import { Download, Eye, Calendar, Users } from 'lucide-react';
import { Note } from '../types/Note';
import StarRating from './StarRating';

interface NoteCardProps {
  note: Note;
  onRatingChange?: (noteId: string, rating: number) => void;
  onView?: (note: Note) => void;
  onDownload?: (noteId: string) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onRatingChange, onView, onDownload }) => {
  const handleRatingChange = (rating: number) => {
    onRatingChange?.(String(note.id), rating);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group hover:-translate-y-1">
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {note.title}
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${note.subjectColor}`}>
            {note.subject}
          </span>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
        {note.description}
      </p>

      {/* Rating */}
      <div className="mb-4">
        <StarRating 
          initialRating={note.rating} 
          onRatingChange={handleRatingChange}
          size="sm"
        />
      </div>

      {/* Metadatos */}
      <div className="flex flex-col space-y-2 text-xs text-muted-foreground mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span className="font-medium">{note.author || 'Anónimo'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{note.createdAt ? new Date(note.createdAt).toISOString().split('T')[0] : ''}</span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1">
            <Download className="w-3 h-3" />
            <span>{note.downloadCount} descargas</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-3">
        <button
          onClick={() => onView?.(note)}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25"
        >
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span>Ver</span>
        </button>
        <button
          onClick={() => onDownload?.(String(note.id))}
          className="flex-1 border border-border hover:border-primary text-foreground hover:text-primary py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:bg-accent"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>Descargar</span>
        </button>
      </div>

      {/* CRUD Actions removidas por solicitud */}
    </div>
  );
};

export default NoteCard;