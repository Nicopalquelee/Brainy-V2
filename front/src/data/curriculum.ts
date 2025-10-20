export type Course = { name: string; code: string; semester: 1 | 2; year: number; description: string };

export const curriculum: Record<number, Course[]> = {
  1: [
    // Semestre I
    { name: 'Introducción al Cálculo', code: 'MAT101', semester: 1, year: 1, description: 'Fundamentos del cálculo diferencial e integral' },
    { name: 'Álgebra', code: 'MAT102', semester: 1, year: 1, description: 'Álgebra lineal y estructuras algebraicas' },
    { name: 'Taller de Aptitudes Lógicas y Matemáticas', code: 'TAL101', semester: 1, year: 1, description: 'Desarrollo de habilidades lógicas y matemáticas' },
    { name: 'Taller de Programación I', code: 'TPR101', semester: 1, year: 1, description: 'Fundamentos de programación' },
    { name: 'Introducción a la Ingeniería Informática', code: 'ING101', semester: 1, year: 1, description: 'Perspectiva general de la ingeniería informática' },
    // Semestre II
    { name: 'Cálculo Diferencial e Integral', code: 'MAT103', semester: 2, year: 1, description: 'Cálculo diferencial e integral de una variable' },
    { name: 'Álgebra Lineal', code: 'MAT104', semester: 2, year: 1, description: 'Vectores, matrices y espacios vectoriales' },
    { name: 'Química General', code: 'QUI101', semester: 2, year: 1, description: 'Fundamentos de química general' },
    { name: 'Taller de Programación II', code: 'TPR102', semester: 2, year: 1, description: 'Programación orientada a objetos' },
  ],
  2: [
    // Semestre III
    { name: 'Cálculo Multivariable', code: 'MAT201', semester: 1, year: 2, description: 'Cálculo de varias variables y análisis vectorial' },
    { name: 'Física', code: 'FIS201', semester: 1, year: 2, description: 'Mecánica clásica y principios físicos' },
    { name: 'Taller de Tecnologías Digitales', code: 'TTD201', semester: 1, year: 2, description: 'Tecnologías digitales y sistemas' },
    { name: 'Paradigmas de Programación', code: 'PPR201', semester: 1, year: 2, description: 'Diferentes paradigmas de programación' },
    // Semestre IV
    { name: 'Ecuaciones Diferenciales', code: 'MAT202', semester: 2, year: 2, description: 'Ecuaciones diferenciales ordinarias y parciales' },
    { name: 'Electricidad y Magnetismo', code: 'FIS202', semester: 2, year: 2, description: 'Principios de electricidad y magnetismo' },
    { name: 'Probabilidades y Estadísticas', code: 'EST201', semester: 2, year: 2, description: 'Teoría de probabilidades y estadística' },
    { name: 'Matemática Discreta', code: 'MAT203', semester: 2, year: 2, description: 'Matemáticas discretas y combinatoria' },
    { name: 'Taller de Sustentabilidad', code: 'TSU201', semester: 2, year: 2, description: 'Desarrollo sostenible y responsabilidad social' },
  ],
  3: [
    // Semestre V
    { name: 'Estadística Avanzada', code: 'EST301', semester: 1, year: 3, description: 'Estadística inferencial y análisis de datos' },
    { name: 'Optimización', code: 'OPT301', semester: 1, year: 3, description: 'Métodos de optimización matemática' },
    { name: 'Algoritmos y Estructura de Datos', code: 'AED301', semester: 1, year: 3, description: 'Algoritmos avanzados y estructuras de datos' },
    { name: 'Taller de Innovación', code: 'TIN301', semester: 1, year: 3, description: 'Innovación y emprendimiento tecnológico' },
    { name: 'Infraestructura TI', code: 'ITI301', semester: 1, year: 3, description: 'Infraestructura de tecnologías de información' },
    // Semestre VI
    { name: 'Taller de Emprendimiento', code: 'TEM301', semester: 2, year: 3, description: 'Desarrollo de proyectos emprendedores' },
    { name: 'Sistemas Operativos', code: 'SOP301', semester: 2, year: 3, description: 'Gestión de procesos, memoria y archivos' },
    { name: 'Bases de Datos', code: 'BDD301', semester: 2, year: 3, description: 'Diseño y administración de bases de datos' },
    { name: 'Introducción a la Ciencia de Datos', code: 'CDS301', semester: 2, year: 3, description: 'Fundamentos de ciencia de datos' },
    { name: 'Persona y Sociedad', code: 'PYS301', semester: 2, year: 3, description: 'Aspectos sociales y humanísticos' },
  ],
  4: [
    // Semestre VII
    { name: 'Inteligencia Artificial', code: 'IA401', semester: 1, year: 4, description: 'Algoritmos de IA y machine learning' },
    { name: 'Big Data', code: 'BGD401', semester: 1, year: 4, description: 'Manejo y análisis de grandes volúmenes de datos' },
    { name: 'Aplicaciones y Tecnologías de la Web', code: 'ATW401', semester: 1, year: 4, description: 'Desarrollo web y tecnologías modernas' },
    { name: 'Programación Avanzada', code: 'PAV401', semester: 1, year: 4, description: 'Técnicas avanzadas de programación' },
    { name: 'Electivo II: Formación e Identidad', code: 'EFI401', semester: 1, year: 4, description: 'Asignatura electiva de formación e identidad' },
    // Semestre VIII
    { name: 'Taller de Interfaces y Diseño de Software', code: 'TID401', semester: 2, year: 4, description: 'Diseño de interfaces y experiencia de usuario' },
    { name: 'Ingeniería de Software y Aseguramiento de Calidad', code: 'ISA401', semester: 2, year: 4, description: 'Metodologías de desarrollo y control de calidad' },
    { name: 'Formulación y Evaluación de Proyectos', code: 'FEP401', semester: 2, year: 4, description: 'Evaluación y formulación de proyectos TI' },
    { name: 'Gestión para el Desarrollo Sostenible', code: 'GDS401', semester: 2, year: 4, description: 'Gestión sostenible en proyectos tecnológicos' },
    { name: 'Electivo III: Formación e Identidad', code: 'EFI402', semester: 2, year: 4, description: 'Segunda asignatura electiva de formación e identidad' },
  ],
  5: [
    // Semestre IX
    { name: 'Ciberseguridad', code: 'CBS501', semester: 1, year: 5, description: 'Seguridad informática y protección de datos' },
    { name: 'Taller de Integración de Software', code: 'TIS501', semester: 1, year: 5, description: 'Integración de sistemas y software' },
    { name: 'Gestión de Proyectos TI', code: 'GPT501', semester: 1, year: 5, description: 'Gestión de proyectos de tecnologías de información' },
    { name: 'Taller en Empresa I', code: 'TEM501', semester: 1, year: 5, description: 'Primera experiencia en empresa' },
    { name: 'Electivo de Profundización I', code: 'EPD501', semester: 1, year: 5, description: 'Primera asignatura de profundización' },
    { name: 'Electivo de Profundización II', code: 'EPD502', semester: 1, year: 5, description: 'Segunda asignatura de profundización' },
    // Semestre X
    { name: 'Transformación Digital y Gobierno TI', code: 'TDG501', semester: 2, year: 5, description: 'Transformación digital y gobierno de TI' },
    { name: 'Vía de Titulación (*)', code: 'VIT501', semester: 2, year: 5, description: 'Proyecto en Empresa / Proyecto de Título / Proyecto en Emprendimiento / Proyecto Trainee' },
  ]
};

export function allCourses(): Course[] {
  return Object.values(curriculum).flat();
}

export function getTotalSubjects(): number {
  return allCourses().length;
}



