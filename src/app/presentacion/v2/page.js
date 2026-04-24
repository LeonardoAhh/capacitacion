'use client';

import SlidePlayerV2 from '@/components/features/Courses/SlidePlayerV2/SlidePlayerV2';

/* Demo data — exercises most slide types */
const DEMO_COURSE = { id: 'demo', title: 'Seguridad Industrial — Curso Demo' };

const DEMO_SLIDES = [
  {
    id: '1', type: 'title', order: 0,
    data: { title: 'Seguridad Industrial', subtitle: 'Fundamentos y buenas prácticas en planta', tags: ['Seguridad', 'Planta'] },
  },
  {
    id: '2', type: 'objective', order: 1,
    data: { heading: 'Objetivo del Curso', body: 'Que el participante conozca los principios de seguridad industrial, identifique riesgos en su área de trabajo y aplique las medidas preventivas adecuadas.' },
  },
  {
    id: '3', type: 'definition', order: 2,
    data: { heading: '¿Qué es la Seguridad Industrial?', body: 'Es el conjunto de normas, procedimientos y estrategias destinadas a preservar la integridad física de los trabajadores, minimizando los riesgos derivados de las actividades laborales.' },
  },
  {
    id: '4', type: 'content', order: 3,
    data: {
      heading: 'Tipos de Riesgos',
      body: 'Existen diversas categorías de riesgo que debemos conocer para prevenir accidentes.',
      bullets: ['Riesgos físicos (ruido, vibraciones, temperatura)', 'Riesgos químicos (sustancias, vapores)', 'Riesgos ergonómicos (posturas, movimientos repetitivos)', 'Riesgos eléctricos (instalaciones, equipos)'],
    },
  },
  {
    id: '5', type: 'icon_grid', order: 4,
    data: {
      heading: 'Equipo de Protección Personal (6)',
      items: [
        { id: 'i1', icon: 'Safety', label: 'Casco', description: 'Protección craneal' },
        { id: 'i2', icon: 'Eye', label: 'Lentes', description: 'Protección ocular' },
        { id: 'i3', icon: 'Tool', label: 'Guantes', description: 'Protección manual' },
        { id: 'i4', icon: 'Bell', label: 'Tapones', description: 'Protección auditiva' },
        { id: 'i5', icon: 'Flag', label: 'Chaleco', description: 'Visibilidad' },
        { id: 'i6', icon: 'Rocket', label: 'Calzado', description: 'Protección de pies' },
      ],
    },
  },
  {
    id: '5a', type: 'icon_grid', order: 4.1,
    data: {
      heading: 'EPP Básico (5)',
      description: 'La última fila se centra cuando hay 5 elementos.',
      items: [
        { id: 'i1', icon: 'Safety', label: 'Casco' },
        { id: 'i2', icon: 'Eye', label: 'Lentes' },
        { id: 'i3', icon: 'Tool', label: 'Guantes' },
        { id: 'i4', icon: 'Flag', label: 'Chaleco' },
        { id: 'i5', icon: 'Rocket', label: 'Calzado' },
      ],
    },
  },
  {
    id: '5b', type: 'icon_grid', order: 4.2,
    data: {
      heading: 'Pilares de Seguridad (4)',
      items: [
        { id: 'i1', icon: 'Safety', label: 'Prevención', description: 'Anticiparse al riesgo' },
        { id: 'i2', icon: 'Warning', label: 'Detección', description: 'Identificar a tiempo' },
        { id: 'i3', icon: 'Heart', label: 'Respuesta', description: 'Actuar con protocolo' },
        { id: 'i4', icon: 'Book', label: 'Registro', description: 'Documentar todo' },
      ],
    },
  },
  {
    id: '5c', type: 'icon_grid', order: 4.3,
    data: {
      heading: 'Principios Clave (3)',
      items: [
        { id: 'i1', icon: 'Safety', label: 'Prevención' },
        { id: 'i2', icon: 'Heart', label: 'Respuesta' },
        { id: 'i3', icon: 'Trophy', label: 'Mejora' },
      ],
    },
  },
  {
    id: '5d', type: 'icon_grid', order: 4.4,
    data: {
      heading: 'Mensaje Central (1)',
      items: [
        { id: 'i1', icon: 'Safety', label: 'Cero accidentes', description: 'Meta compartida por todo el equipo.' },
      ],
    },
  },
  /* ── Font size + long text stress tests ──────── */
  {
    id: '5e', type: 'definition', order: 4.5,
    data: {
      fontSize: 'sm',
      heading: 'Tamaño de texto: Pequeño (sm)',
      body: 'Esta definición usa fontSize=sm. Texto largo para probar el wrap: La seguridad industrial es el conjunto integral de normas, procedimientos, políticas, estrategias preventivas y herramientas de control destinadas a preservar la integridad física y mental de los trabajadores, minimizando los riesgos derivados de las actividades laborales en el entorno productivo, administrativo y operativo de la organización.',
    },
  },
  {
    id: '5f', type: 'definition', order: 4.6,
    data: {
      heading: 'Tamaño de texto: Mediano (md, default)',
      body: 'Este es el tamaño por defecto. Sirve como referencia para comparar los demás niveles (sm / md / lg / xl). Un texto un poco largo ayuda a ver la altura de línea, el ritmo de lectura y cómo se comporta el contenido en distintos anchos de viewport.',
    },
  },
  {
    id: '5g', type: 'content', order: 4.7,
    data: {
      fontSize: 'lg',
      heading: 'Tamaño de texto: Grande (lg)',
      body: 'Con fontSize=lg el cuerpo de texto aumenta ~1.2× y los encabezados también. Ideal para aulas con proyector o público mayor.',
      bullets: [
        'Bullets también escalan a lg.',
        'Los encabezados de sección mantienen la jerarquía visual.',
        'La ley de la seguridad industrial establece responsabilidades compartidas entre empleador y colaborador.',
      ],
    },
  },
  {
    id: '5h', type: 'content', order: 4.8,
    data: {
      fontSize: 'xl',
      heading: 'Tamaño de texto: Extra grande (xl)',
      body: 'Máximo nivel de zoom tipográfico. Todos los elementos escalan: títulos, cuerpo, bullets, opciones de quiz, textos de flashcard, chips y más.',
      bullets: [
        'Accesibilidad: lectores con baja visión.',
        'Presentación presencial a grupos grandes.',
      ],
    },
  },
  {
    id: '5i', type: 'flashcard', order: 4.9,
    data: {
      fontSize: 'xl',
      heading: 'Flashcard con texto largo (xl)',
      cards: [
        {
          id: 'fL1',
          front: '¿Cuál es la definición completa de seguridad industrial según la NOM-STPS?',
          back: 'Conjunto de disposiciones técnicas, organizacionales y legales orientadas a preservar la vida, la salud y la integridad física y psicológica de los trabajadores, así como prevenir los daños materiales al entorno productivo. Incluye identificación de riesgos, controles de ingeniería y administrativos, uso correcto de EPP y programas permanentes de capacitación.',
        },
      ],
    },
  },
  {
    id: '6', type: 'benefits', order: 5,
    data: {
      heading: 'Beneficios de la Seguridad Industrial',
      items: [
        { id: 'b1', text: 'Reducción de accidentes laborales' },
        { id: 'b2', text: 'Mejora del ambiente de trabajo' },
        { id: 'b3', text: 'Cumplimiento normativo (NOM-017-STPS)' },
        { id: 'b4', text: 'Mayor productividad y motivación' },
      ],
    },
  },
  {
    id: '7', type: 'comparison', order: 6,
    data: {
      heading: 'Actos Seguros vs. Actos Inseguros',
      left: { title: '✅ Actos Seguros', items: ['Usar EPP completo', 'Seguir procedimientos', 'Reportar condiciones inseguras'] },
      right: { title: '❌ Actos Inseguros', items: ['Omitir protección', 'Improvisar tareas', 'Ignorar señalización'] },
    },
  },
  {
    id: '8', type: 'steps', order: 7,
    data: {
      heading: 'Protocolo ante un Accidente',
      steps: [
        { id: 's1', title: 'Evaluar la escena', desc: 'Verifica que sea seguro acercarse' },
        { id: 's2', title: 'Alertar', desc: 'Notifica a supervisores y servicios de emergencia' },
        { id: 's3', title: 'Primeros auxilios', desc: 'Aplica primeros auxilios básicos si estás capacitado' },
        { id: 's4', title: 'Documentar', desc: 'Llena el reporte de incidentes' },
      ],
    },
  },
  {
    id: '9', type: 'video', order: 8,
    data: { heading: 'Video: EPP en Acción', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Uso correcto del equipo de protección personal.' },
  },
  {
    id: '10', type: 'flashcard', order: 9,
    data: {
      heading: 'Tarjetas de Repaso',
      cards: [
        { id: 'f1', front: '¿Qué significa EPP?', back: 'Equipo de Protección Personal' },
        { id: 'f2', front: '¿Cuál NOM regula el EPP?', back: 'NOM-017-STPS-2008' },
        { id: 'f3', front: '¿Qué es un acto inseguro?', back: 'Acción que pone en riesgo al trabajador o a terceros.' },
      ],
    },
  },
  {
    id: '11', type: 'fill_blank', order: 10,
    data: {
      sentence: 'El ___ de protección personal es obligatorio en todas las áreas de ___.',
      answers: ['equipo', 'producción'],
      explanation: 'El EPP es obligatorio en todas las áreas de producción según la normatividad vigente.',
    },
  },
  {
    id: '12', type: 'checklist', order: 11,
    data: {
      heading: 'Checklist de Inicio de Turno',
      items: [
        { id: 'c1', text: 'Verificar estado del EPP' },
        { id: 'c2', text: 'Revisar área de trabajo' },
        { id: 'c3', text: 'Confirmar señalización visible' },
        { id: 'c4', text: 'Reportar condiciones inseguras' },
      ],
      requireAll: true,
    },
  },
  {
    id: '13', type: 'quiz', order: 12,
    data: {
      heading: 'Evaluación del Módulo',
      passingScore: 60,
      questions: [
        { q: '¿Cuál es el objetivo principal de la seguridad industrial?', options: ['Aumentar ventas', 'Preservar la integridad del trabajador', 'Reducir costos', 'Cumplir horarios'], correct: 1, explanation: 'La seguridad industrial busca proteger al trabajador.' },
        { q: '¿Qué NOM regula el uso de EPP?', options: ['NOM-001', 'NOM-017-STPS', 'NOM-035', 'NOM-011'], correct: 1, explanation: 'NOM-017-STPS-2008 establece los requisitos de EPP.' },
      ],
    },
  },
  {
    id: '15', type: 'thermal_sim', order: 14.1,
    data: {
      heading: 'Simulador: Disipación Térmica LOTO',
      subtitle: 'Ajusta componente + temperatura de operación y valida el tiempo de espera para mantenimiento.',
      safeTemp: 50,
    },
  },
  {
    id: '16', type: 'env_sim', order: 14.2,
    data: {
      heading: 'Simulador: Matriz Causa-Efecto Ambiental',
      subtitle: 'Identifica el Aspecto e Impacto ambiental de cada actividad de planta.',
      scenarios: [],
    },
  },
  {
    id: '17', type: 'iceberg_sim', order: 14.3,
    data: {
      heading: 'Simulador: El Iceberg en la Línea',
      subtitle: 'Clasifica cada situación según corresponda a parte visible o parte sumergida.',
      cards: [
        { id: 'ic1', text: 'El operador llegó tarde tres veces esta semana.', kind: 'visible', hint: 'Indicador observable en piso.' },
        { id: 'ic2', text: 'Su padre lleva enfermo dos meses.', kind: 'submerged', hint: 'Contexto emocional profundo.' },
        { id: 'ic3', text: 'Incremento de rechazos en su celda de trabajo.', kind: 'visible', hint: 'Resultado operativo medible.' },
        { id: 'ic4', text: 'Su principal motivación es pagar los estudios de su hija.', kind: 'submerged', hint: 'Motivador personal profundo.' },
      ],
    },
  },
  {
    id: '18', type: 'radar_sim', order: 14.4,
    data: {
      heading: 'Simulador: El Radar del Supervisor',
      subtitle: 'Evalúa qué tanto conoces a tu equipo y detecta vacíos de información.',
      items: [
        { id: 'r1', level: 1, prompt: 'Nombre completo del colaborador' },
        { id: 'r2', level: 1, prompt: 'Área / puesto específico' },
        { id: 'r3', level: 2, prompt: 'Principales fortalezas técnicas' },
        { id: 'r4', level: 2, prompt: 'Áreas de mejora observadas' },
        { id: 'r5', level: 3, prompt: 'Motivadores personales clave' },
        { id: 'r6', level: 3, prompt: 'Situación familiar relevante' },
      ],
    },
  },
  {
    id: '14', type: 'dynamic', order: 13,
    data: {
      heading: 'Dinámica: Inspección de Seguridad',
      instructions: 'En equipos, recorran el área asignada e identifiquen al menos 5 condiciones inseguras.',
      modality: 'Equipos de 3-4 personas',
      duration: '15 minutos',
      scenario: 'Área de producción',
      participants: { min: 3, max: 4 },
      materials: ['Checklist de inspección', 'Cámara / celular', 'Pluma y formato'],
      steps: [{ id: 'd1', title: 'Recorrer', desc: 'Caminen por el área observando' }, { id: 'd2', title: 'Registrar', desc: 'Anoten hallazgos' }, { id: 'd3', title: 'Presentar', desc: 'Expongan resultados' }],
      commitmentPrompt: '¿Qué compromiso asumes para mejorar la seguridad en tu área?',
      debriefQuestions: [{ id: 'dq1', text: '¿Cuáles fueron los hallazgos más comunes?' }, { id: 'dq2', text: '¿Qué acciones correctivas proponen?' }],
    },
  },
];

export default function PlayerV2DemoPage() {
  return (
    <SlidePlayerV2
      course={DEMO_COURSE}
      slides={DEMO_SLIDES}
      onClose={() => window.history.back()}
    />
  );
}
