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
      heading: 'Equipo de Protección Personal',
      items: [
        { id: 'i1', icon: '🪖', label: 'Casco', description: 'Protección craneal' },
        { id: 'i2', icon: '🥽', label: 'Lentes', description: 'Protección ocular' },
        { id: 'i3', icon: '🧤', label: 'Guantes', description: 'Protección manual' },
        { id: 'i4', icon: '👂', label: 'Tapones', description: 'Protección auditiva' },
        { id: 'i5', icon: '🦺', label: 'Chaleco', description: 'Visibilidad' },
        { id: 'i6', icon: '👟', label: 'Calzado', description: 'Protección de pies' },
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
