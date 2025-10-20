import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { curriculum as data, Course } from '../data/curriculum';
import { fetchJson } from '../lib/api';

const yearTitles: Record<number, string> = {
  1: 'Año 1', 2: 'Año 2', 3: 'Año 3', 4: 'Año 4', 5: 'Año 5'
};
 

function YearBlock({ year, courses }: { year: number; courses: Course[] }) {
  const palette: Record<number, string> = {
    1: 'from-blue-500/20 to-blue-700/10 border-blue-900/30',
    2: 'from-emerald-500/20 to-emerald-700/10 border-emerald-900/30',
    3: 'from-purple-500/20 to-purple-700/10 border-purple-900/30',
    4: 'from-cyan-500/20 to-cyan-700/10 border-cyan-900/30',
    5: 'from-yellow-500/20 to-yellow-700/10 border-yellow-900/30',
  };
  const border = palette[year] || 'from-primary/20 to-secondary/10 border-border';
  const s1 = courses.filter(c => c.semester === 1);
  const s2 = courses.filter(c => c.semester === 2);
  return (
    <div className={`bg-card rounded-lg p-6 border bg-gradient-to-br ${border}`}>
      <h4 className="text-lg font-semibold text-foreground mb-4">Año {year}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[{ label: 'Semestre 1', items: s1 }, { label: 'Semestre 2', items: s2 }].map((group) => (
          <div key={group.label}>
            <h5 className="text-sm text-muted-foreground mb-2">{group.label}</h5>
            <div className="space-y-2">
              {group.items.map((c) => (
                <div key={c.code} className="border border-border rounded-md p-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.code}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Curriculum: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    // Traer más documentos para contar por asignatura (paginación grande)
    fetchJson<any>('/documents?page=1&pageSize=500').then(resp => {
      const docs = Array.isArray(resp) ? resp : (resp?.items || []);
      const c: Record<string, number> = {};
      (docs as any[]).forEach((d) => {
        const s = ((d?.subject as string) || '').toString();
        c[s] = (c[s] || 0) + 1;
      });
      setCounts(c);
    }).catch(() => setCounts({}));
  }, []);

  return (
    <section id="malla" className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-foreground" />
        <h3 className="text-2xl font-bold text-foreground">Malla Curricular</h3>
      </div>
      {/* Mostrar Semestres 1..10 agrupando por año y semestre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((semNumber) => {
          // Convertir número global de semestre (1..10) a {year, semester}
          const year = Math.ceil(semNumber / 2);
          const sem: 1 | 2 = (semNumber % 2 === 1) ? 1 : 2;
          const courses = (data[year] || []).filter(c => c.semester === sem);
          const yearColors: Record<number, string> = {
            1: 'border-blue-500/30 bg-blue-500/10',
            2: 'border-emerald-500/30 bg-emerald-500/10', 
            3: 'border-purple-500/30 bg-purple-500/10',
            4: 'border-cyan-500/30 bg-cyan-500/10',
            5: 'border-yellow-500/30 bg-yellow-500/10'
          };
          return (
            <div key={semNumber}>
              <h4 className="text-lg font-semibold text-foreground mb-3">Semestre {semNumber}</h4>
              <div className="space-y-3">
                {courses.map((c) => (
                  <div key={c.code} className={`border ${yearColors[year] || 'border-emerald-900/30 bg-card/60'} rounded-lg p-4 flex items-center justify-between hover:shadow-lg transition-all`}>
                    <div>
                      <div className="text-foreground font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.code}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{counts[c.name] || 0} apuntes</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Curriculum;


