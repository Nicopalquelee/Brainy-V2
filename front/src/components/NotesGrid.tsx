import React, { useEffect, useMemo, useState } from 'react';
import NoteCard from './NoteCard';
import { Note } from '../types/Note';
import { absoluteFromContentUrl, fetchJson } from '../lib/api';
import { Search, Star, Calendar } from 'lucide-react';

interface NotesGridProps {
  filter?: string;
  sortBy?: 'rating' | 'date';
}

const NotesGrid: React.FC<NotesGridProps> = ({ filter = '', sortBy = 'rating' }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'rating' | 'date'>(sortBy);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let response = await fetchJson<any>('/documents?page=' + page + '&pageSize=12');
        let docs: any[] = Array.isArray(response) ? response : (response?.items || []);
        setTotalPages(response?.totalPages || 1);
        const mapped: Note[] = (docs || []).map((d: any) => ({
          id: d?.id?.toString?.() || String(d?.id || ''),
          title: d?.title || 'Apunte',
          subject: d?.subject || 'General',
          subjectColor: colorFromSubject(d?.subject || 'General'),
          description: d?.content || d?.description || '',
          rating: Number(d?.rating || 0),
          author: d?.profiles?.full_name || d?.author || d?.profiles?.username || 'Anónimo',
          downloadCount: Number(d?.downloads || d?.visits || 0),
          createdAt: d?.created_at || d?.createdAt || '',
          contentUrl: absoluteFromContentUrl(d?.file_url || d?.content_url || d?.contentUrl),
          visits: Number(d?.visits || 0),
        }));
        if (!cancelled) {
          setNotes(mapped);
          // Cargar asignaturas disponibles
          const subjects = [...new Set(mapped.map(n => n.subject).filter((s): s is string => typeof s === 'string' && s.length > 0))];
          setAvailableSubjects(subjects);
        }
      } catch (e: unknown) {
        const msg = (e as any)?.message || 'Error al cargar documentos';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page]);

  const handleRatingChange = (noteId: string, newRating: number) => {
    setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? { ...note, rating: newRating } : note));
    // fire-and-forget to backend
    const idNum = parseInt(noteId, 10);
    if (!isNaN(idNum) && idNum > 0) {
      fetchJson(`/documents/${idNum}/rate`, { method: 'POST', body: { score: newRating } }).catch(() => {});
    }
  };

  const handleDownload = async (noteId: string) => {
    const note = notes.find(n => String(n.id) === String(noteId));
    const url = note?.contentUrl;
    if (url) {
      try {
        // Disparar descarga directa
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {}
    }
    // Actualizar contador local y notificar backend (downloads)
    setNotes(prevNotes => prevNotes.map(n => String(n.id) === String(noteId) ? { ...n, downloadCount: (n.downloadCount || 0) + 1 } : n));
    const idNum = parseInt(noteId, 10);
    if (!isNaN(idNum) && idNum > 0) {
      fetchJson(`/documents/${idNum}/download`, { method: 'POST' }).catch(() => {});
    }
  };

  // Eliminados: edición/eliminación de apuntes por solicitud

  const [modalNote, setModalNote] = useState<Note | null>(null);

  const handleView = (note: Note) => {
    setModalNote(note);
  };

  const filtered = useMemo(() => {
    const f = (notes || []).filter(n => {
      // Filtro por búsqueda
      const query = (searchQuery || filter || '').toLowerCase();
      if (query) {
        const inTitle = (n.title || '').toLowerCase().includes(query);
        const inSubject = (n.subject || '').toLowerCase().includes(query);
        const inDescription = (n.description || '').toLowerCase().includes(query);
        if (!inTitle && !inSubject && !inDescription) return false;
      }
      
      // Filtro por asignatura
      if (selectedSubject && n.subject !== selectedSubject) return false;
      
      return true;
    });
    
    if (sortMode === 'rating') {
      return f.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortMode === 'date') {
      return f.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return f;
  }, [notes, filter, sortMode, searchQuery, selectedSubject]);

  function colorFromSubject(subject: string): string {
    const map: Record<string, string> = {
      'Matemáticas': 'bg-emerald-500',
      'Física': 'bg-cyan-500',
      'Inteligencia Artificial': 'bg-purple-500',
      'Programación': 'bg-red-500',
      'Bases de Datos': 'bg-orange-500',
      'General': 'bg-blue-500',
    };
    return map[subject] || 'bg-blue-500';
  }

  return (
    <div className="p-6">
      {/* Header de la sección */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Apuntes Disponibles
        </h2>
        <p className="text-muted-foreground">
          Descubre y accede a los mejores apuntes compartidos por la comunidad universitaria
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>{filtered.length} apuntes disponibles</span>
          </span>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="bg-card p-6 rounded-lg shadow-md border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar apuntes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Filtro por asignatura */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="">Todas las asignaturas</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortMode('rating')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                sortMode === 'rating' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Star className="w-4 h-4" />
              Rating
            </button>
            <button
              onClick={() => setSortMode('date')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                sortMode === 'date' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Fecha
            </button>
          </div>
        </div>
      </div>

      {/* Controles y estado */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{loading ? 'Cargando…' : `${filtered.length} resultados`}</div>
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((note, index) => (
          <div 
            key={note.id} 
            className="animate-slide-up"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
              <NoteCard 
                note={note} 
                onRatingChange={(id, r) => handleRatingChange(String(id), r)} 
                onDownload={(id) => handleDownload(String(id))} 
                onView={handleView}
              />
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalNote(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{modalNote.title}</h3>
                <p className="text-sm text-muted-foreground">{modalNote.subject} • Autor: {modalNote.author || 'Anónimo'}</p>
              </div>
              <button onClick={() => setModalNote(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            {modalNote.contentUrl && (
              <div className="mb-4">
                {modalNote.contentUrl.toLowerCase().includes('.pdf') ? (
                  <iframe src={modalNote.contentUrl} className="w-full h-96 border border-border rounded-md" />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Vista previa no disponible para este tipo de archivo</p>
                    <a href={modalNote.contentUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Descargar archivo</a>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {modalNote.contentUrl && (
                <a href={modalNote.contentUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-primary text-primary-foreground rounded-md">Abrir en nueva pestaña</a>
              )}
              <button onClick={() => setModalNote(null)} className="px-3 py-2 bg-accent rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md bg-accent disabled:opacity-50">Anterior</button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md bg-accent disabled:opacity-50">Siguiente</button>
        </div>
      )}
    </div>
  );
};

export default NotesGrid;