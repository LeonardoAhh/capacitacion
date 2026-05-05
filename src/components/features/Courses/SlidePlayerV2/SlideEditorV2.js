'use client';

import { useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import SlideRendererV2 from './SlideRendererV2';
import { SLIDE_TYPE_LABELS, getDefaultSlideData } from '@/components/features/Courses/Editor/slideConstants';
import { updateCourseFields } from '@/lib/courseService';
import { useToast } from '@/components/ui/Toast/Toast';
import s from './editor-v2.module.css';

/* ── Slide type sections for the "add slide" modal ── */
const SLIDE_SECTIONS = [
  {
    label: 'General',
    types: [
      { type: 'title', label: 'Portada', desc: 'Título principal del curso' },
      { type: 'content', label: 'Contenido', desc: 'Texto e imagen' },
      { type: 'objective', label: 'Objetivo', desc: 'Objetivo de aprendizaje' },
      { type: 'definition', label: 'Definición', desc: 'Término y definición' },
      { type: 'benefits', label: 'Beneficios', desc: 'Lista de beneficios' },
      { type: 'icon_grid', label: 'Íconos', desc: 'Cuadrícula de íconos' },
      { type: 'comparison', label: 'Comparación', desc: 'Dos columnas comparativas' },
      { type: 'steps', label: 'Paso a Paso', desc: 'Secuencia numerada' },
      { type: 'dynamic', label: 'Dinámica', desc: 'Actividad colaborativa' },
      { type: 'quiz', label: 'Quiz', desc: 'Pregunta con opciones' },
      { type: 'video', label: 'Video', desc: 'YouTube o MP4' },
      { type: 'flashcard', label: 'Tarjetas', desc: 'Tarjetas con flip' },
      { type: 'fill_blank', label: 'Completa', desc: 'Rellena el espacio' },
      { type: 'checklist', label: 'Checklist', desc: 'Lista de verificación' },
      { type: 'org_chart', label: 'Organigrama', desc: 'Estructura organizacional' },
    ],
  },
  {
    label: 'Simuladores',
    types: [
      { type: 'thermal_sim', label: 'Sim. Térmico', desc: 'Disipación térmica LOTO' },
      { type: 'env_sim', label: 'Sim. Ambiental', desc: 'Matriz Causa-Efecto' },
      { type: 'iceberg_sim', label: 'Sim. Iceberg', desc: 'Causas visibles vs ocultas' },
      { type: 'radar_sim', label: 'Sim. Radar', desc: 'Diagnóstico de equipo' },
    ],
  },
];

/* ── Lazy-load slide editors ─────────────────────── */
import TitleSlideEditor from '@/components/features/Courses/Editor/SlideEditors/TitleSlideEditor';
import ContentSlideEditor from '@/components/features/Courses/Editor/SlideEditors/ContentSlideEditor';
import SimpleBodySlideEditor from '@/components/features/Courses/Editor/SlideEditors/SimpleBodySlideEditor';
import BenefitsSlideEditor from '@/components/features/Courses/Editor/SlideEditors/BenefitsSlideEditor';
import IconGridSlideEditor from '@/components/features/Courses/Editor/SlideEditors/IconGridSlideEditor';
import ComparisonSlideEditor from '@/components/features/Courses/Editor/SlideEditors/ComparisonSlideEditor';
import DynamicSlideEditor from '@/components/features/Courses/Editor/SlideEditors/DynamicSlideEditor';
import StepsSlideEditor from '@/components/features/Courses/Editor/SlideEditors/StepsSlideEditor';
import QuizSlideEditor from '@/components/features/Courses/Editor/SlideEditors/QuizSlideEditor';
import VideoSlideEditor from '@/components/features/Courses/Editor/SlideEditors/VideoSlideEditor';
import FlashcardSlideEditor from '@/components/features/Courses/Editor/SlideEditors/FlashcardSlideEditor';
import FillBlankSlideEditor from '@/components/features/Courses/Editor/SlideEditors/FillBlankSlideEditor';
import ChecklistSlideEditor from '@/components/features/Courses/Editor/SlideEditors/ChecklistSlideEditor';
import EnvSimSlideEditor from '@/components/features/Courses/Editor/SlideEditors/EnvSimSlideEditor';
import IcebergLineaSimSlideEditor from '@/components/features/Courses/Editor/SlideEditors/IcebergLineaSimSlideEditor';
import RadarSupervisorSimSlideEditor from '@/components/features/Courses/Editor/SlideEditors/RadarSupervisorSimSlideEditor';
import ThermalSimSlideEditor from '@/components/features/Courses/Editor/SlideEditors/ThermalSimSlideEditor';
import OrgChartSlideEditor from '@/components/features/Courses/Editor/SlideEditors/OrgChartSlideEditor';

/* ── Course config modal ─────────────────────────── */
import CourseConfigModal from '@/components/features/Courses/Editor/CourseConfigModal';

/* ── Field router ────────────────────────────────── */
function SlideFieldRouter({ type, formData, handleChange, handleBatchChange, setFormData }) {
  const props = { formData, handleChange, setFormData, styles: s };
  switch (type) {
    case 'title': return <TitleSlideEditor {...props} />;
    case 'content': return <ContentSlideEditor {...props} handleBatchChange={handleBatchChange} />;
    case 'icon_grid': return <IconGridSlideEditor {...props} />;
    case 'comparison': return <ComparisonSlideEditor {...props} />;
    case 'steps': return <StepsSlideEditor {...props} />;
    case 'group_dynamic': case 'dynamic': return <DynamicSlideEditor {...props} />;
    case 'group_quiz': case 'quiz': return <QuizSlideEditor {...props} />;
    case 'objective': case 'definition': return <SimpleBodySlideEditor {...props} />;
    case 'benefits': return <BenefitsSlideEditor {...props} />;
    case 'video': return <VideoSlideEditor {...props} />;
    case 'flashcard': return <FlashcardSlideEditor {...props} />;
    case 'fill_blank': return <FillBlankSlideEditor {...props} />;
    case 'checklist': return <ChecklistSlideEditor {...props} />;
    case 'env_sim': return <EnvSimSlideEditor {...props} />;
    case 'iceberg_sim': return <IcebergLineaSimSlideEditor {...props} />;
    case 'radar_sim': return <RadarSupervisorSimSlideEditor {...props} />;
    case 'org_chart': return <OrgChartSlideEditor {...props} />;
    case 'thermal_sim': return <ThermalSimSlideEditor {...props} />;
    default:
      return <p className={s.noEditor}>Editor no disponible para tipo: <strong>{type}</strong></p>;
  }
}

/* ── Reducer ─────────────────────────────────────── */
const initialState = {
  course: null,
  slides: [],
  loading: true,
  selectedSlide: null,
  livePreviewSlide: null,
  saving: false,
  showSlideModal: false,
  showCourseConfigModal: false,
};

function editorReducer(state, action) {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        course: action.course,
        slides: action.slides,
        selectedSlide: action.slides[0] ?? null,
        livePreviewSlide: action.slides[0] ?? null,
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false };
    case 'SELECT_SLIDE':
      return { ...state, selectedSlide: action.slide, livePreviewSlide: action.slide };
    case 'SLIDE_SAVED': {
      const slides = state.slides.map(sl =>
        sl.id === action.slideId ? { ...sl, data: action.newData } : sl
      );
      const selectedSlide = state.selectedSlide?.id === action.slideId
        ? { ...state.selectedSlide, data: action.newData }
        : state.selectedSlide;
      return { ...state, slides, selectedSlide };
    }
    case 'SLIDE_DELETED': {
      const idx = state.slides.findIndex(sl => sl.id === action.slideId);
      const remaining = state.slides.filter(sl => sl.id !== action.slideId);
      const renumbered = remaining.map((sl, i) => ({ ...sl, order: i + 1 }));
      const next = renumbered[idx] ?? renumbered[idx - 1] ?? null;
      return { ...state, slides: renumbered, selectedSlide: next, livePreviewSlide: next };
    }
    case 'SLIDE_ADDED': {
      const slides = [...state.slides, action.slide];
      return { ...state, slides, selectedSlide: action.slide, livePreviewSlide: action.slide };
    }
    case 'SLIDES_REORDERED':
      return { ...state, slides: action.slides };
    case 'FORM_CHANGED':
      return {
        ...state,
        livePreviewSlide: state.livePreviewSlide
          ? { ...state.livePreviewSlide, data: action.data }
          : null,
      };
    case 'SAVE_START': return { ...state, saving: true };
    case 'SAVE_END': return { ...state, saving: false };
    case 'TOGGLE_MODAL': return { ...state, showSlideModal: action.open };
    case 'TOGGLE_COURSE_CONFIG_MODAL': return { ...state, showCourseConfigModal: action.open };
    default: return state;
  }
}

/* ── Auto-save hook ──────────────────────────────── */
const DEBOUNCE_MS = 1200; // tiempo desde último cambio hasta persistir

/**
 * Hook autosave optimizado:
 *  - Debounce corto (1.2s) para sensación inmediata.
 *  - Comparación O(1) con snapshot estable (sin stringify por keystroke).
 *  - flush() expuesto vía ref para guardar inmediato (switch slide, cerrar, Ctrl+S, beforeunload).
 *  - Estado 'saving' sólo se activa cuando el timer dispara, no por cada tecla.
 */
function useAutoSave(slide, formData, onSave, flushRef) {
  const [saveState, setSaveState] = useState('idle');
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastSavedRef = useRef(null);            // snapshot serializado de lo último guardado
  const pendingDataRef = useRef(null);          // último formData "dirty" sin guardar
  const inFlightRef = useRef(false);            // evita writes solapados

  // Reset snapshot al cambiar de slide (slide?.data solo init, no debe re-disparar)
  useEffect(() => {
    lastSavedRef.current = JSON.stringify(slide?.data ?? {});
    pendingDataRef.current = null;
    setSaveState('idle');
  }, [slide?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar inmediato (manual o por flush externo)
  const doSave = useCallback(async (dataToSave) => {
    if (!slide || inFlightRef.current) return;
    const serialized = JSON.stringify(dataToSave);
    if (serialized === lastSavedRef.current) return;
    inFlightRef.current = true;
    if (mountedRef.current) setSaveState('saving');
    try {
      await onSave(slide.id, dataToSave);
      lastSavedRef.current = serialized;
      pendingDataRef.current = null;
      if (!mountedRef.current) return;
      setSaveState('saved');
      setTimeout(() => {
        if (mountedRef.current) setSaveState(c => c === 'saved' ? 'idle' : c);
      }, 1500);
    } catch {
      if (mountedRef.current) setSaveState('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [slide, onSave]);

  // Programa autosave con debounce
  useEffect(() => {
    if (!slide || Object.keys(formData).length === 0) return;
    const serialized = JSON.stringify(formData);
    if (serialized === lastSavedRef.current) return;

    pendingDataRef.current = formData;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pendingDataRef.current) doSave(pendingDataRef.current);
    }, DEBOUNCE_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [formData, slide, doSave]);

  // Exponer flush() al padre (antes de switch/close/unmount)
  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (pendingDataRef.current) {
        const data = pendingDataRef.current;
        return doSave(data);
      }
      return Promise.resolve();
    };
    return () => { if (flushRef) flushRef.current = null; };
  }, [flushRef, doSave]);

  // Mount/unmount + flush en unmount + listeners pagehide/visibilitychange/beforeunload
  useEffect(() => {
    mountedRef.current = true;
    const flushNow = () => {
      if (pendingDataRef.current && slide) {
        // sincrónico best-effort: no awaitable en pagehide
        try { onSave(slide.id, pendingDataRef.current); } catch (_) { }
        pendingDataRef.current = null;
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flushNow(); };
    const onPageHide = () => flushNow();
    const onBeforeUnload = (e) => {
      if (pendingDataRef.current) {
        flushNow();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Best-effort flush al desmontar
      if (pendingDataRef.current && slide) {
        try { onSave(slide.id, pendingDataRef.current); } catch (_) { }
      }
    };
  }, [slide, onSave]);

  return saveState;
}

/* ── Editor form sub-component ───────────────────── */
function EditorForm({ slide, onSave, onDelete, onFormChange, onFlushReady, isSaving }) {
  const [formData, setFormData] = useState(() => structuredClone(slide?.data ?? {}));
  const flushRef = useRef(null);
  const saveState = useAutoSave(slide, formData, onSave, flushRef);

  // Reportar flush al padre
  useEffect(() => {
    if (onFlushReady) onFlushReady(flushRef);
  }, [onFlushReady]);

  // Ctrl/Cmd + S → flush manual
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (flushRef.current) flushRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (onFormChange) onFormChange(formData); }, [formData, onFormChange]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (value === undefined) delete next[field];
      return next;
    });
  }, []);

  const handleBatchChange = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  if (!slide) {
    return (
      <div className={s.emptyState}>
        <div className={s.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        </div>
        <p>Selecciona un slide para editar</p>
      </div>
    );
  }

  return (
    <>
      <div className={s.editorPanelHeader}>
        <h2 className={s.editorPanelTitle}>
          Slide {slide.order} — {SLIDE_TYPE_LABELS[slide.type] || slide.type}
        </h2>
        <div className={s.editorPanelActions}>
          <span className={`${s.saveBadge} ${s[saveState] || ''}`}>
            {saveState === 'saving' && <><SpinnerIcon /> Guardando...</>}
            {saveState === 'saved' && <><CheckIcon /> Guardado</>}
            {saveState === 'error' && <>Error</>}
            {saveState === 'idle' && <span>Auto-guardado</span>}
          </span>
          <button
            className={s.deleteBtn}
            onClick={() => onDelete(slide.id)}
            disabled={isSaving}
            title="Eliminar slide"
            aria-label="Eliminar slide"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className={s.editorScrollArea}>
        {/* ── Font size selector ── */}
        <div className={s.formGroup}>
          <label className={s.label}>Tamaño de letra</label>
          <div className={s.fontSizeBar}>
            {[
              { key: 'sm', label: 'A', title: 'Pequeña' },
              { key: 'md', label: 'A', title: 'Mediana (default)' },
              { key: 'lg', label: 'A', title: 'Grande' },
              { key: 'xl', label: 'A', title: 'Extra grande' },
            ].map(({ key, label, title }) => (
              <button
                key={key}
                className={`${s.fontSizeBtn} ${(formData.fontSize || 'md') === key ? s.fontSizeBtnActive : ''}`}
                onClick={() => handleChange('fontSize', key === 'md' ? undefined : key)}
                title={title}
                aria-label={title}
                style={{ fontSize: key === 'sm' ? 11 : key === 'md' ? 13 : key === 'lg' ? 16 : 19 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <SlideFieldRouter
          type={slide.type}
          formData={formData}
          handleChange={handleChange}
          handleBatchChange={handleBatchChange}
          setFormData={setFormData}
        />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   SlideEditorV2 — Main component
   ═══════════════════════════════════════════════════ */
export default function SlideEditorV2({
  courseId,
  loadCourse,
  saveSlideFn,
  addSlideFn,
  deleteSlideFn,
  reorderSlidesFn,
  syncMetadataFn,
  onClose,
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // { onConfirm: fn }
  const [isDark, setIsDark] = useState(false);
  const [dragState, setDragState] = useState({ draggingId: null, overIndex: null });
  const dragSrcIndexRef = useRef(null);
  const { toast } = useToast();
  const stateRef = useRef(state);
  const editorFlushRef = useRef(null); // flush handle del EditorForm activo
  const prevThemeRef = useRef(null);
  useEffect(() => { stateRef.current = state; }, [state]);

  /* ── Theme toggle (local al editor, restaura al desmontar) ── */
  useEffect(() => {
    prevThemeRef.current = document.documentElement.getAttribute('data-theme') || 'light';
    let saved = null;
    try { saved = localStorage.getItem('vtx_player_theme'); } catch (_) { }
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
    return () => {
      document.documentElement.setAttribute('data-theme', prevThemeRef.current);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('vtx_player_theme', next ? 'dark' : 'light'); } catch (_) { }
      return next;
    });
  }, []);

  /* ── Load course ────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadCourse(courseId);
      if (cancelled) return;
      if (result.success) {
        dispatch({ type: 'LOAD_SUCCESS', course: result.data.course, slides: result.data.slides });
      } else {
        dispatch({ type: 'LOAD_ERROR' });
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, loadCourse]);

  /* ── Handlers ───────────────────────────────────── */
  const handleSaveSlide = useCallback(async (slideId, newData) => {
    // Strip undefined values — Firestore rejects them
    const clean = Object.fromEntries(
      Object.entries(newData).filter(([, v]) => v !== undefined)
    );
    const result = await saveSlideFn(courseId, slideId, { data: clean });
    if (result.success) dispatch({ type: 'SLIDE_SAVED', slideId, newData: clean });
  }, [courseId, saveSlideFn]);

  const handleDeleteSlide = useCallback((slideId) => {
    setConfirmDialog({
      onConfirm: async () => {
        setConfirmDialog(null);
        dispatch({ type: 'SAVE_START' });
        const result = await deleteSlideFn(courseId, slideId, stateRef.current.slides);
        if (result.success) {
          dispatch({ type: 'SLIDE_DELETED', slideId });
          const remaining = stateRef.current.slides.filter(sl => sl.id !== slideId);
          syncMetadataFn?.(courseId, remaining.length);
        }
        dispatch({ type: 'SAVE_END' });
      },
    });
  }, [courseId, deleteSlideFn, syncMetadataFn]);

  const handleAddSlide = useCallback(async (type) => {
    dispatch({ type: 'TOGGLE_MODAL', open: false });
    dispatch({ type: 'SAVE_START' });
    const defaultData = getDefaultSlideData(type);
    const result = await addSlideFn(courseId, { type, data: defaultData, order: stateRef.current.slides.length + 1 });
    if (result.success) {
      const newSlide = { id: result.slideId || result.id, type, data: defaultData, order: result.order || stateRef.current.slides.length + 1 };
      dispatch({ type: 'SLIDE_ADDED', slide: newSlide });
      syncMetadataFn?.(courseId, stateRef.current.slides.length + 1);
    }
    dispatch({ type: 'SAVE_END' });
  }, [courseId, addSlideFn, syncMetadataFn]);

  const handleSelectSlide = useCallback((slide) => {
    // Flush cambios del slide actual antes de cambiar (evita pérdida)
    if (editorFlushRef.current) {
      try { editorFlushRef.current(); } catch (_) { }
    }
    dispatch({ type: 'SELECT_SLIDE', slide });
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleFormChange = useCallback((data) => {
    dispatch({ type: 'FORM_CHANGED', data });
  }, []);

  const handleFlushReady = useCallback((flushRef) => {
    editorFlushRef.current = flushRef.current;
  }, []);

  const handleClose = useCallback(async () => {
    if (editorFlushRef.current) {
      try { await editorFlushRef.current(); } catch (_) { }
    }
    if (onClose) onClose();
  }, [onClose]);

  /* ── Drag-and-drop reorder ────────────────────── */
  const handleDragStart = useCallback((e, slide, index) => {
    dragSrcIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slide.id);
    // Pequeño delay para que el ghost image se genere antes del estado visual
    requestAnimationFrame(() => {
      setDragState(prev => ({ ...prev, draggingId: slide.id }));
    });
  }, []);

  const handleDragOver = useCallback((e, overIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => {
      if (prev.overIndex === overIndex) return prev;
      return { ...prev, overIndex };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overIndex: null });
    dragSrcIndexRef.current = null;
  }, []);

  const handleDrop = useCallback(async (e, dropIndex) => {
    e.preventDefault();
    const srcIndex = dragSrcIndexRef.current;
    setDragState({ draggingId: null, overIndex: null });
    dragSrcIndexRef.current = null;

    if (srcIndex === null || srcIndex === dropIndex) return;

    // Solo reordenar en la lista completa (no en búsqueda filtrada)
    const { slides } = stateRef.current;
    const reordered = [...slides];
    const [moved] = reordered.splice(srcIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    const renumbered = reordered.map((sl, i) => ({ ...sl, order: i + 1 }));

    dispatch({ type: 'SLIDES_REORDERED', slides: renumbered });

    if (reorderSlidesFn) {
      dispatch({ type: 'SAVE_START' });
      await reorderSlidesFn(courseId, renumbered);
      dispatch({ type: 'SAVE_END' });
    }
  }, [courseId, reorderSlidesFn]);

  const handleSaveCourseConfig = useCallback(async (config) => {
    // Asegurar que config sea un objeto válido
    const cleanConfig = {
      enabled: Boolean(config?.enabled),
      url: String(config?.url || '').trim()
    };

    const result = await updateCourseFields(courseId, { backgroundMusic: cleanConfig });
    if (result.success) {
      toast.success('Configuración guardada', 'La música de fondo ha sido actualizada.');
      dispatch({ type: 'TOGGLE_COURSE_CONFIG_MODAL', open: false });
    } else {
      toast.error('Error', result.error || 'No se pudo guardar la configuración.');
    }
  }, [courseId, toast]);

  /* ── Filtered slides ────────────────────────────── */
  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return state.slides;
    const q = searchQuery.toLowerCase();
    return state.slides.filter(sl =>
      (sl.data?.title || sl.data?.heading || '').toLowerCase().includes(q) ||
      (SLIDE_TYPE_LABELS[sl.type] || sl.type).toLowerCase().includes(q)
    );
  }, [state.slides, searchQuery]);

  /* ── Keyboard shortcuts ─────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      if (e.key === 'Escape' && stateRef.current.showSlideModal) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_MODAL', open: false });
        return;
      }

      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const { slides, selectedSlide, saving } = stateRef.current;
      const idx = slides.findIndex(sl => sl.id === selectedSlide?.id);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (slides[idx + 1]) dispatch({ type: 'SELECT_SLIDE', slide: slides[idx + 1] });
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (slides[idx - 1]) dispatch({ type: 'SELECT_SLIDE', slide: slides[idx - 1] });
          break;
        case 'n': case 'N':
          e.preventDefault();
          dispatch({ type: 'TOGGLE_MODAL', open: true });
          break;
        case 'Delete':
          e.preventDefault();
          if (selectedSlide && !saving) handleDeleteSlide(selectedSlide.id);
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleDeleteSlide]);

  /* ── Loading state ──────────────────────────────── */
  if (state.loading) {
    return (
      <div className={s.root} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <SpinnerIcon /><p style={{ marginTop: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>Cargando editor...</p>
      </div>
    );
  }

  const { course, slides, selectedSlide, livePreviewSlide, saving, showSlideModal, showCourseConfigModal } = state;

  return (
    <div className={s.root}>
      {/* ══ HEADER ═══════════════════════════════════ */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.iconBtn} onClick={() => setSidebarOpen(v => !v)} aria-label={sidebarOpen ? 'Ocultar slides' : 'Mostrar slides'} title={sidebarOpen ? 'Ocultar slides' : 'Mostrar slides'}>
            <MenuIcon />
          </button>
          <div className={s.titleGroup}>
            <h1 className={s.courseTitle}>{course?.title ?? 'Sin título'}</h1>
            <span className={s.subtitleLabel}>Editor</span>
          </div>
        </div>

        <div className={s.headerCenter}>
          <span className={s.badge}>{slides.length} slides</span>
          <span className={s.shortcutsHint}>Alt+↑↓ · Alt+N nuevo · Alt+Supr eliminar</span>
        </div>

        <div className={s.headerRight}>
          <button
            className={s.iconBtn}
            onClick={() => dispatch({ type: 'TOGGLE_COURSE_CONFIG_MODAL', open: true })}
            aria-label="Configurar curso"
            title="Configurar curso"
          >
            <SettingsIcon />
          </button>
          <button
            className={s.iconBtn}
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-pressed={isDark}
            title={isDark ? 'Tema claro' : 'Tema oscuro'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          {onClose && (
            <button className={s.closeBtn} onClick={handleClose} aria-label="Cerrar editor">
              Cerrar
            </button>
          )}
        </div>
      </header>

      {/* ══ WORKSPACE ════════════════════════════════ */}
      <div className={s.workspace}>
        {/* ── Mobile overlay ── */}
        {sidebarOpen && <div className={`${s.overlay} ${s.mobileOnly}`} onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`${s.sidebar} ${sidebarOpen ? '' : s.sidebarClosed}`}>
          <div className={s.sidebarHeader}>
            <span className={s.sidebarTitle}>Slides ({slides.length})</span>
            <button className={s.iconBtn} onClick={() => setSidebarOpen(false)} aria-label="Cerrar panel">
              <CloseIcon />
            </button>
          </div>

          <div className={s.sidebarSearch}>
            <input
              className={s.searchInput}
              type="text"
              placeholder="Buscar slide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className={s.slideList}>
            {filteredSlides.map((slide, idx) => {
              const isActive = slide.id === selectedSlide?.id;
              const label = slide.data?.heading || slide.data?.title || SLIDE_TYPE_LABELS[slide.type] || slide.type;
              const isDragging = dragState.draggingId === slide.id;
              const isDropTarget = !searchQuery.trim() && dragState.overIndex === idx && dragState.draggingId !== slide.id;
              return (
                <div
                  key={slide.id}
                  className={`${s.slideItemWrapper} ${isDropTarget ? s.slideItemDropTarget : ''}`}
                  draggable={!searchQuery.trim()}
                  onDragStart={(e) => handleDragStart(e, slide, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <button
                    className={`${s.slideItem} ${isActive ? s.slideItemActive : ''} ${isDragging ? s.slideItemDragging : ''}`}
                    onClick={() => handleSelectSlide(slide)}
                  >
                    <span className={s.slideItemDragHandle} aria-hidden="true">&#8942;</span>
                    <span className={s.slideItemNum}>{slide.order ?? idx + 1}</span>
                    <div className={s.slideItemInfo}>
                      <span className={s.slideItemTitle}>{label}</span>
                      <span className={s.slideItemMeta}>{SLIDE_TYPE_LABELS[slide.type] || slide.type}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>

          <button
            className={s.addSlideBtn}
            onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: true })}
            disabled={saving}
          >
            <PlusIcon /> Agregar slide
          </button>
        </aside>

        {/* ── Editor panel ── */}
        <div className={s.editorPanel}>
          <EditorForm
            key={selectedSlide?.id}
            slide={selectedSlide}
            onSave={handleSaveSlide}
            onDelete={handleDeleteSlide}
            onFormChange={handleFormChange}
            onFlushReady={handleFlushReady}
            isSaving={saving}
          />
        </div>

        {/* ── Live preview panel ── */}
        <div className={s.previewPanel}>
          <div className={s.previewHeader}>
            <h3 className={s.previewTitle}>Vista previa</h3>
            <div className={s.previewModeToggle} role="group" aria-label="Modo de vista previa">
              <button
                type="button"
                className={`${s.previewModeBtn} ${previewMode === 'desktop' ? s.previewModeBtnActive : ''}`}
                onClick={() => setPreviewMode('desktop')}
                aria-pressed={previewMode === 'desktop'}
                title="Vista escritorio"
              >
                <DesktopIcon /> <span>Escritorio</span>
              </button>
              <button
                type="button"
                className={`${s.previewModeBtn} ${previewMode === 'mobile' ? s.previewModeBtnActive : ''}`}
                onClick={() => setPreviewMode('mobile')}
                aria-pressed={previewMode === 'mobile'}
                title="Vista móvil"
              >
                <MobileIcon /> <span>Móvil</span>
              </button>
            </div>
          </div>
          <div className={s.previewContent}>
            <div className={`${s.previewFrame} ${previewMode === 'mobile' ? s.previewFrameMobile : ''}`}>
              {livePreviewSlide ? (
                <SlideRendererV2
                  slide={livePreviewSlide}
                  courseTitle={course?.title ?? ''}
                />
              ) : (
                <div className={s.emptyState}>
                  <p>Sin slide seleccionado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ ADD SLIDE MODAL ══════════════════════════ */}
      {showSlideModal && (
        <div className={s.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_MODAL', open: false }); }}>
          <div className={s.modalBox}>
            <div className={s.modalHeader}>
              <div>
                <h2 className={s.modalTitle}>Agregar Slide</h2>
                <p className={s.modalSubtitle}>Selecciona el tipo de slide</p>
              </div>
              <button className={s.iconBtn} onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: false })} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </div>
            <div className={s.modalBody}>
              {SLIDE_SECTIONS.map((section) => (
                <div key={section.label} className={s.modalSection}>
                  <p className={s.modalSectionLabel}>{section.label}</p>
                  <div className={s.slideTypesGrid}>
                    {section.types.map(({ type, label, desc }) => (
                      <button
                        key={type}
                        className={s.slideTypeCard}
                        onClick={() => handleAddSlide(type)}
                        disabled={saving}
                      >
                        <div className={s.slideTypeIcon}>
                          <SlideTypeIconSVG type={type} />
                        </div>
                        <div>
                          <h3 className={s.slideTypeName}>{label}</h3>
                          <p className={s.slideTypeDesc}>{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM DELETE DIALOG ════════════════════ */}
      {confirmDialog && (
        <div className={s.confirmBackdrop} onClick={() => setConfirmDialog(null)}>
          <div className={s.confirmBox} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className={s.confirmIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className={s.confirmTitle}>Eliminar slide</h2>
            <p className={s.confirmText}>Esta acción no se puede deshacer.</p>
            <div className={s.confirmActions}>
              <button className={s.confirmBtnCancel} onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button className={s.confirmBtnDanger} onClick={confirmDialog.onConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ COURSE CONFIG MODAL ═════════════════════ */}
      {showCourseConfigModal && (
        <CourseConfigModal
          course={course}
          onSave={handleSaveCourseConfig}
          onCancel={() => dispatch({ type: 'TOGGLE_COURSE_CONFIG_MODAL', open: false })}
        />
      )}
    </div>
  );
}

/* ─── Inline SVG icons ───────────────────────────── */
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className={s.spin} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ── Slide type icon (generic per-type) ──────────── */
function SlideTypeIconSVG({ type }) {
  const icons = {
    title: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="9" x2="17" y2="9" /><line x1="7" y1="13" x2="13" y2="13" /></>,
    content: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></>,
    objective: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    definition: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    benefits: <><polyline points="20,6 9,17 4,12" /></>,
    icon_grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    comparison: <><line x1="12" y1="3" x2="12" y2="21" /><rect x="2" y="3" width="20" height="18" rx="2" /></>,
    steps: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></>,
    quiz: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></>,
    dynamic: <><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></>,
    video: <><polygon points="5,3 19,12 5,21" /></>,
    flashcard: <><rect x="2" y="4" width="16" height="14" rx="2" /><rect x="6" y="6" width="16" height="14" rx="2" /></>,
    fill_blank: <><line x1="4" y1="18" x2="20" y2="18" /><line x1="4" y1="12" x2="12" y2="12" /><line x1="4" y1="6" x2="16" y2="6" /></>,
    checklist: <><rect x="3" y="5" width="4" height="4" rx="1" /><line x1="10" y1="7" x2="21" y2="7" /><rect x="3" y="15" width="4" height="4" rx="1" /><line x1="10" y1="17" x2="21" y2="17" /></>,
    freeform: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></>,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[type] || icons.content}
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="13" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}
