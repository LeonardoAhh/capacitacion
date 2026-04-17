'use client';

import { useRouter } from 'next/navigation';
import SlideEditorV2 from '@/components/features/Courses/SlidePlayerV2/SlideEditorV2';

/* ── Demo slides (same as the player demo) ───────── */
const DEMO_SLIDES = [
  { id: '1', type: 'title', order: 1, data: { title: 'Seguridad Industrial', subtitle: 'Fundamentos y buenas prácticas en planta', tags: ['Seguridad', 'Planta'] } },
  { id: '2', type: 'objective', order: 2, data: { heading: 'Objetivo del Curso', body: 'Que el participante conozca los principios de seguridad industrial, identifique riesgos en su área de trabajo y aplique las medidas preventivas adecuadas.' } },
  { id: '3', type: 'definition', order: 3, data: { heading: '¿Qué es la Seguridad Industrial?', body: 'Es el conjunto de normas, procedimientos y estrategias destinadas a preservar la integridad física de los trabajadores.' } },
  { id: '4', type: 'content', order: 4, data: { heading: 'Tipos de Riesgos', body: 'Existen diversas categorías de riesgo que debemos conocer.', bullets: ['Riesgos físicos', 'Riesgos químicos', 'Riesgos ergonómicos', 'Riesgos eléctricos'] } },
  { id: '5', type: 'icon_grid', order: 5, data: { heading: 'Equipo de Protección Personal', items: [{ id: 'i1', icon: '🪖', label: 'Casco', description: 'Protección craneal' }, { id: 'i2', icon: '🥽', label: 'Lentes', description: 'Protección ocular' }, { id: 'i3', icon: '🧤', label: 'Guantes', description: 'Protección manual' }] } },
  { id: '6', type: 'benefits', order: 6, data: { heading: 'Beneficios de la Seguridad Industrial', items: [{ id: 'b1', text: 'Reducción de accidentes' }, { id: 'b2', text: 'Mejor ambiente de trabajo' }, { id: 'b3', text: 'Cumplimiento normativo' }] } },
  { id: '7', type: 'comparison', order: 7, data: { heading: 'Actos Seguros vs. Inseguros', left: { title: 'Actos Seguros', items: ['Usar EPP', 'Seguir procedimientos'] }, right: { title: 'Actos Inseguros', items: ['Omitir protección', 'Improvisar'] } } },
  { id: '8', type: 'steps', order: 8, data: { heading: 'Protocolo ante un Accidente', steps: [{ id: 's1', title: 'Evaluar', desc: 'Verifica seguridad' }, { id: 's2', title: 'Alertar', desc: 'Notifica emergencia' }, { id: 's3', title: 'Auxiliar', desc: 'Primeros auxilios' }] } },
  { id: '9', type: 'quiz', order: 9, data: { heading: 'Evaluación', passingScore: 60, questions: [{ q: '¿Qué es EPP?', options: ['Equipo de Protección Personal', 'Evaluación de Producción', 'Plan de Emergencia'], correct: 0, explanation: 'EPP = Equipo de Protección Personal' }] } },
  { id: '10', type: 'checklist', order: 10, data: { heading: 'Checklist de Turno', items: [{ id: 'c1', text: 'Verificar EPP' }, { id: 'c2', text: 'Revisar área' }, { id: 'c3', text: 'Confirmar señalización' }], requireAll: true } },
];

let demoSlides = [...DEMO_SLIDES];
let nextId = 100;

/* ── Mock service layer (in-memory, no Firebase) ─── */
const mockLoadCourse = async () => ({
  success: true,
  data: {
    course: { id: 'demo', title: 'Seguridad Industrial — Demo' },
    slides: demoSlides,
  },
});

const mockSaveSlide = async (_courseId, slideId, payload) => {
  demoSlides = demoSlides.map(sl => sl.id === slideId ? { ...sl, data: payload.data } : sl);
  return { success: true };
};

const mockAddSlide = async (_courseId, slide) => {
  const id = String(nextId++);
  const newSlide = { id, type: slide.type, data: slide.data, order: demoSlides.length + 1 };
  demoSlides = [...demoSlides, newSlide];
  return { success: true, slideId: id, order: newSlide.order };
};

const mockDeleteSlide = async (_courseId, slideId) => {
  demoSlides = demoSlides.filter(sl => sl.id !== slideId).map((sl, i) => ({ ...sl, order: i + 1 }));
  return { success: true };
};

const mockReorder = async () => ({ success: true });
const mockSync = () => {};

export default function EditorV2DemoPage() {
  const router = useRouter();

  return (
    <SlideEditorV2
      courseId="demo"
      loadCourse={mockLoadCourse}
      saveSlideFn={mockSaveSlide}
      addSlideFn={mockAddSlide}
      deleteSlideFn={mockDeleteSlide}
      reorderSlidesFn={mockReorder}
      syncMetadataFn={mockSync}
      onClose={() => router.push('/presentacion/v2')}
    />
  );
}
