import React from 'react';
import { Filter, SortAsc, Calendar } from 'lucide-react';

interface FilterBarProps {
  onFilter?: (filter: string) => void;
  onSortChange?: (sort: 'rating' | 'date') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilter, onSortChange }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Filtros por materia */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onFilter?.('')} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 transition-colors">
            Todas
          </button>
          <button onClick={() => onFilter?.('Programación')} className="px-3 py-1 bg-accent text-foreground rounded-full text-xs font-medium hover:bg-accent/80 transition-colors">
            Programación
          </button>
          <button onClick={() => onFilter?.('Matemáticas')} className="px-3 py-1 bg-accent text-foreground rounded-full text-xs font-medium hover:bg-accent/80 transition-colors">
            Matemáticas
          </button>
          <button onClick={() => onFilter?.('Física')} className="px-3 py-1 bg-accent text-foreground rounded-full text-xs font-medium hover:bg-accent/80 transition-colors">
            Física
          </button>
          <button onClick={() => onFilter?.('IA')} className="px-3 py-1 bg-accent text-foreground rounded-full text-xs font-medium hover:bg-accent/80 transition-colors">
            IA/ML
          </button>
        </div>

        {/* Controles de ordenamiento */}
        <div className="flex items-center space-x-2">
          <button onClick={() => onSortChange?.('rating')} className="flex items-center space-x-2 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg text-sm transition-colors">
            <SortAsc className="w-4 h-4" />
            <span>Valoración</span>
          </button>
          <button onClick={() => onSortChange?.('date')} className="flex items-center space-x-2 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg text-sm transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Fecha</span>
          </button>
          <button onClick={() => alert('Pronto: filtros avanzados')} className="flex items-center space-x-2 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg text-sm transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;