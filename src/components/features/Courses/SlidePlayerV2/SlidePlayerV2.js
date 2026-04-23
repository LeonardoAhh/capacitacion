'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SlideRendererV2 from './SlideRendererV2';
import s from './SlidePlayerV2.module.css';

/* ── Badge map ────────────────────────────────────── */
const SLIDE_BADGES = {
  title: { label: 'Portada' },
  objective: { label: 'Objetivo' },
  definition: { label: 'Definición' },
  content: { label: 'Contenido' },
  icon_grid: { label: 'Conceptos' },
  benefits: { label: 'Beneficios' },
  comparison: { label: 'Comparación' },
  steps: { label: 'Proceso' },
  quiz: { label: 'Evaluación' },
  group_quiz: { label: 'Evaluación' },
  video: { label: 'Video' },
  flashcard: { label: 'Tarjetas' },
  fill_blank: { label: 'Completar' },
  checklist: { label: 'Checklist' },
  dynamic: { label: 'Dinámica' },
  group_dynamic: { label: 'Dinámica' },
  thermal_sim: { label: 'Sim. LOTO' },
  env_sim: { label: 'Sim. Ambiental' },
  iceberg_sim: { label: 'Sim. Iceberg' },
  radar_sim: { label: 'Sim. Radar' },
    // freeform:  { label: 'Lienzo Libre' }, // Desactivado temporal
};

const typeLabel = (type) => SLIDE_BADGES[type]?.label || type;

/**
 * SlidePlayerV2 — shadcn-styled slide player with header + responsive sidebar.
 *
 * Props:
 *  - course      : { id, title, description, ... }
 *  - slides      : [{ id, type, data, order }]
 *  - onClose     : () => void
 */
export default function SlidePlayerV2({ course, slides = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [quizScore, setQuizScore] = useState(null);
  const [commitmentText, setCommitmentText] = useState('');
  const [direction, setDirection] = useState('down');   // 'down' | 'up'
  const [slideKey, setSlideKey] = useState(0);          // forces re-mount for animation
  const [isDark, setIsDark] = useState(false);
  const slideAreaRef = useRef(null);
  const mainRef = useRef(null);

  /* ── Framer Motion slide variants ───────────────── */
  const slideVariants = {
    enter: (dir) => ({ opacity: 0, y: dir === 'down' ? 40 : -40 }),
    center: { opacity: 1, y: 0 },
    exit: (dir) => ({ opacity: 0, y: dir === 'down' ? -40 : 40 }),
  };
  const slideTransition = {
    duration: 0.38,
    ease: [0.16, 1, 0.3, 1],
  };

  /* ── Theme toggle (local to player, restores on unmount) ── */
  const prevThemeRef = useRef(null);
  useEffect(() => {
    prevThemeRef.current = document.documentElement.getAttribute('data-theme') || 'light';
    // Restaurar preferencia previa del usuario para el reproductor
    let saved = null;
    try { saved = localStorage.getItem('vtx_player_theme'); } catch (_) {}
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
      try { localStorage.setItem('vtx_player_theme', next ? 'dark' : 'light'); } catch (_) {}
      return next;
    });
  }, []);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] ?? null;
  const progress = totalSlides > 0 ? ((currentIndex + 1) / totalSlides) * 100 : 0;

  /* ── Navigation ─────────────────────────────────── */
  const goTo = useCallback(
    (idx) => {
      if (idx >= 0 && idx < totalSlides && idx !== currentIndex) {
        setDirection(idx > currentIndex ? 'down' : 'up');
        setSlideKey((k) => k + 1);
        setCurrentIndex(idx);
        setVisited((prev) => new Set(prev).add(idx));
        setSidebarOpen(false);
        if (slideAreaRef.current) slideAreaRef.current.scrollTop = 0;
      }
    },
    [totalSlides, currentIndex],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  /* ── Keyboard ───────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      // Don't capture keys when user is typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(totalSlides - 1);
          break;
        case 'Escape':
          e.preventDefault();
          if (sidebarOpen) setSidebarOpen(false);
          else if (onClose) onClose();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, goTo, totalSlides, sidebarOpen, onClose]);

  /* ── Touch swipe (vertical) — sólo navega si scroll está en el borde ── */
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const touchStartT = useRef(0);
  const touchScrollLocked = useRef(false); // true si el gesto comenzó scrolleando contenido

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartT.current = Date.now();
    touchScrollLocked.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const el = slideAreaRef.current;
    if (!el) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Si hay margen de scroll en la dirección del gesto, marcar como scroll-lock
    const canScrollDown = el.scrollHeight - el.clientHeight - el.scrollTop > 1;
    const canScrollUp   = el.scrollTop > 1;
    if ((dy < 0 && canScrollDown) || (dy > 0 && canScrollUp)) {
      touchScrollLocked.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = touchStartX.current !== null ? touchStartX.current - e.changedTouches[0].clientX : 0;
    const dt = Date.now() - touchStartT.current;
    touchStartY.current = null;
    touchStartX.current = null;

    // Si el gesto fue scroll de contenido, abortar navegación
    if (touchScrollLocked.current) return;
    // Descartar swipes horizontales o muy lentos
    if (Math.abs(dx) > Math.abs(dy)) return;
    if (dt > 600) return;

    const el = slideAreaRef.current;
    const atBottom = el ? (el.scrollHeight - el.clientHeight - el.scrollTop <= 1) : true;
    const atTop    = el ? (el.scrollTop <= 1) : true;

    const THRESHOLD = 80;
    if (dy > THRESHOLD && atBottom) goNext();
    else if (dy < -THRESHOLD && atTop) goPrev();
  }, [goNext, goPrev]);

  /* ── Sidebar toggle ─────────────────────────────── */
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) setSidebarOpen((v) => !v);
    else setSidebarCollapsed((v) => !v);
  }, []);

  /* ── Interactive callbacks ──────────────────────── */
  const handleQuizSubmit = useCallback((score) => setQuizScore(score), []);
  const handleCheckChange = useCallback(() => {}, []);
  const handleCommitmentChange = useCallback((val) => setCommitmentText(val), []);

  return (
    <div
      className={s.root}
      role="application"
      aria-roledescription="presentación de slides"
      aria-label={course?.title ?? 'Presentación'}
    >
      {/* ══ HEADER ══════════════════════════════════ */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <button
            className={s.iconBtn}
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Mostrar índice' : 'Ocultar índice'}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Mostrar índice' : 'Ocultar índice'}
          >
            <MenuIcon />
          </button>

          <div className={s.titleGroup}>
            <h1 className={s.courseTitle}>{course?.title ?? 'Sin título'}</h1>
            {currentSlide && (
              <span className={s.badge} data-type={currentSlide.type}>
                {typeLabel(currentSlide.type)}
              </span>
            )}
          </div>
        </div>

        <div className={s.headerCenter}>
          <span className={s.slideCounter} aria-live="polite" aria-atomic="true">
            <span className={s.srOnly}>Slide </span>
            {currentIndex + 1}
            <span className={s.counterSep} aria-hidden="true">/</span>
            <span className={s.srOnly}> de </span>
            {totalSlides}
          </span>
        </div>

        <div className={s.headerRight}>
          <button
            className={s.themeToggle}
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={isDark ? 'Tema claro' : 'Tema oscuro'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          {onClose && (
            <button className={s.closeBtn} onClick={onClose} aria-label="Cerrar presentación">
              Cerrar
            </button>
          )}
        </div>
      </header>

      {/* ══ PROGRESS BAR ════════════════════════════ */}
      <div className={s.progressTrack} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del curso">
        <div className={s.progressBar} style={{ width: `${progress}%` }} />
      </div>

      {/* ══ BODY (sidebar + main) ═══════════════════ */}
      <div className={s.body}>
        {/* ── Overlay (mobile) ── */}
        {sidebarOpen && (
          <div className={s.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`${s.sidebar} ${sidebarOpen ? s.sidebarOpen : ''} ${sidebarCollapsed ? s.sidebarCollapsed : ''}`}
          aria-label="Índice de contenido"
        >
          <div className={s.sidebarHeader}>
            <span className={s.sidebarTitle}>Contenido</span>
            <button
              className={`${s.iconBtn} ${s.sidebarCloseBtn}`}
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar índice"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className={s.slideList} aria-label="Lista de slides">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              const isVisited = visited.has(idx);
              return (
                <button
                  key={slide.id ?? idx}
                  className={`${s.slideItem} ${isActive ? s.slideItemActive : ''} ${isVisited && !isActive ? s.slideItemVisited : ''}`}
                  onClick={() => goTo(idx)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Slide ${idx + 1}: ${slide.data?.heading || slide.data?.title || typeLabel(slide.type)}${isVisited ? ' (visitado)' : ''}`}
                >
                  <span className={s.slideItemNum} aria-hidden="true">{idx + 1}</span>
                  <div className={s.slideItemInfo}>
                    <span className={s.slideItemTitle}>
                      {slide.data?.heading || slide.data?.title || typeLabel(slide.type)}
                    </span>
                    <span className={s.slideItemMeta}>
                      {typeLabel(slide.type)}
                    </span>
                  </div>
                  {isVisited && !isActive && <CheckSmallIcon />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content area ── */}
        <main
          className={s.main}
          ref={mainRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label={currentSlide ? `Slide ${currentIndex + 1} de ${totalSlides}: ${currentSlide.data?.heading || currentSlide.data?.title || typeLabel(currentSlide.type)}` : 'Sin contenido'}
        >
          <div className={`${s.slideArea} ${s.slideAreaFullbleed}`} ref={slideAreaRef}>
            {currentSlide ? (
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={slideKey}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className={s.slideFullbleed}
                >
                  <SlideRendererV2
                    slide={currentSlide}
                    courseTitle={course?.title ?? ''}
                    onQuizSubmit={handleQuizSubmit}
                    onCheckChange={handleCheckChange}
                    commitmentValue={commitmentText}
                    onCommitmentChange={handleCommitmentChange}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className={s.emptyMsg}>No hay slides en este curso.</p>
            )}
          </div>

          {/* ── Bottom nav ── */}
          <div className={s.navBar} role="toolbar" aria-label="Navegación de slides">
            <button
              className={`${s.navBtn} ${s.navBtnOutline}`}
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="Slide anterior"
            >
              <ChevronUpIcon /> <span className={s.navLabel}>Anterior</span>
            </button>

            {/* Dot indicators (desktop) */}
            <div className={s.dotsRow} aria-hidden="true">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`${s.dot} ${idx === currentIndex ? s.dotActive : ''} ${visited.has(idx) ? s.dotVisited : ''}`}
                  onClick={() => goTo(idx)}
                  tabIndex={-1}
                  aria-label={`Ir a slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              className={`${s.navBtn} ${currentIndex < totalSlides - 1 ? s.navBtnPrimary : s.navBtnOutline}`}
              onClick={goNext}
              disabled={currentIndex >= totalSlides - 1}
              aria-label="Siguiente slide"
            >
              <span className={s.navLabel}>Siguiente</span> <ChevronDownIcon />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Inline SVG icons (tiny, no extra deps) ─────── */
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18,15 12,9 6,15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0 }}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
