// Autogenerador de aliases de materias basado en la malla curricular (frontend/data/curriculum.ts)
// Mantén esta lista en sincronía con la malla real cuando cambie.

export const SUBJECTS: string[] = [
  // Año 1
  'Introducción al Cálculo',
  'Álgebra',
  'Taller de Aptitudes Lógicas y Matemáticas',
  'Taller de Programación I',
  'Introducción a la Ingeniería Informática',
  'Cálculo Diferencial e Integral',
  'Álgebra Lineal',
  'Química General',
  'Taller de Programación II',
  // Año 2
  'Cálculo Multivariable',
  'Física',
  'Taller de Tecnologías Digitales',
  'Paradigmas de Programación',
  'Ecuaciones Diferenciales',
  'Electricidad y Magnetismo',
  'Probabilidades y Estadísticas',
  'Matemática Discreta',
  'Taller de Sustentabilidad',
  // Año 3
  'Estadística Avanzada',
  'Optimización',
  'Algoritmos y Estructura de Datos',
  'Taller de Innovación',
  'Infraestructura TI',
  'Taller de Emprendimiento',
  'Sistemas Operativos',
  'Bases de Datos',
  'Introducción a la Ciencia de Datos',
  'Persona y Sociedad',
  // Año 4
  'Inteligencia Artificial',
  'Big Data',
  'Aplicaciones y Tecnologías de la Web',
  'Programación Avanzada',
  'Electivo II: Formación e Identidad',
  'Taller de Interfaces y Diseño de Software',
  'Ingeniería de Software y Aseguramiento de Calidad',
  'Formulación y Evaluación de Proyectos',
  'Gestión para el Desarrollo Sostenible',
  'Electivo III: Formación e Identidad',
  // Año 5
  'Ciberseguridad',
  'Taller de Integración de Software',
  'Gestión de Proyectos TI',
  'Taller en Empresa I',
  'Electivo de Profundización I',
  'Electivo de Profundización II',
  'Transformación Digital y Gobierno TI',
  'Vía de Titulación (*)'
];

// utilidades de normalización local
const removeAccents = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');

// Stopwords y prefijos comunes que no aportan para matching
const NOISE = [
  'introduccion a', 'introducción a', 'introduccion al', 'introducción al', 'taller de', 'aplicaciones y',
  'tecnologias', 'tecnologías', 'de la', 'de las', 'de los', 'de', 'y', 'para', 'en', 'el', 'la', 'los', 'las',
  'ii', 'i', 'iii', '(*)'
];

// Abreviaturas y sinónimos típicos
const SYNONYMS: Record<string, string[]> = {
  'álgebra': ['algebra'],
  'álgebra lineal': ['algebra lineal', 'algebra', 'matrices', 'vectores'],
  'cálculo': ['calculo'],
  'cálculo diferencial e integral': ['calculo diferencial e integral', 'calculo', 'cálculo'],
  'cálculo multivariable': ['calculo multivariable', 'multivariable', 'calculo vectorial', 'funciones multivariables'],
  'química general': ['quimica general', 'quimica'],
  'física': ['fisica'],
  'probabilidades y estadísticas': ['probabilidades', 'estadisticas', 'estadística', 'estadistica', 'probabilidad'],
  'matemática discreta': ['matematica discreta', 'discretas', 'discreta'],
  'paradigmas de programación': ['paradigmas de programacion', 'programacion', 'programación'],
  'bases de datos': ['bd', 'base de datos', 'datos'],
  'sistemas operativos': ['so', 'kernel', 'procesos', 'memoria'],
  'introducción a la ciencia de datos': ['ciencia de datos', 'data science', 'analitica', 'analítica'],
  'inteligencia artificial': ['ia', 'machine learning', 'ml', 'redes neuronales'],
  'big data': ['bigdata', 'datos masivos'],
  'aplicaciones y tecnologías de la web': ['desarrollo web', 'web', 'front end', 'backend', 'full stack'],
  'programación avanzada': ['programacion avanzada'],
  'ingeniería de software y aseguramiento de calidad': ['ingenieria de software', 'is', 'qa', 'aseguramiento de calidad'],
  'ciberseguridad': ['seguridad', 'seguridad informatica', 'seguridad informática', 'cybersecurity'],
  'gestión de proyectos ti': ['gestion de proyectos', 'pmi', 'project management'],
  'transformación digital y gobierno ti': ['transformacion digital', 'gobierno ti', 'gov ti']
};

function tokenize(name: string): string[] {
  const n = removeAccents(name.toLowerCase());
  const clean = n.replace(/[()*,.:;\-]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter(t => !NOISE.includes(t));
  return filtered;
}

export function buildSubjectAliases(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const subj of SUBJECTS) {
    const canon = subj; // mantener forma original como clave canónica
    const variants = new Set<string>();
    const lower = subj.toLowerCase();
    variants.add(lower);
    variants.add(removeAccents(lower));
    // tokens relevantes
    const toks = tokenize(subj);
    if (toks.length) variants.add(toks.join(' '));
    // agrega cada token individual largo como alias (p.ej., "optimización")
    toks.filter(t => t.length > 3).forEach(t => variants.add(t));
    // sinónimos predefinidos si existen
    if (SYNONYMS[lower]) SYNONYMS[lower].forEach(a => variants.add(removeAccents(a.toLowerCase())));
    // abreviaturas heurísticas
    if (lower.includes('inteligencia artificial')) variants.add('ia');
    if (lower.includes('sistemas operativos')) variants.add('so');
    if (lower.includes('bases de datos')) variants.add('bd');
    if (lower.includes('big data')) variants.add('bigdata');

    map[canon] = Array.from(variants);
  }
  return map;
}
