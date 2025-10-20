import React, { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { fetchJson } from '../lib/api';

interface DocumentActionsProps {
  documentId: string | number;
  currentTitle: string;
  currentSubject: string;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ 
  documentId, 
  currentTitle, 
  currentSubject, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [subject, setSubject] = useState(currentSubject);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetchJson(`/documents/${documentId}`, { 
        method: 'PUT', 
        body: { title, subject } 
      });
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este apunte?')) return;
    setLoading(true);
    try {
      await fetchJson(`/documents/${documentId}`, { method: 'DELETE' });
      onDelete?.();
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm"
          placeholder="Título"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm"
          placeholder="Asignatura"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 text-green-500 hover:text-green-400 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1 text-red-500 hover:text-red-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-blue-500 hover:text-blue-400"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1 text-red-500 hover:text-red-400 disabled:opacity-50"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DocumentActions;

