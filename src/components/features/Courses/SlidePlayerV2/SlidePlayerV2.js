'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
};

const typeLabel = (type) => SLIDE_BADGES[type]?.label || type;

/**
 * SlidePlayerV2 — Unified top navbar player.
 * No sidebar, no bottom nav. Everything in one place.
 */
export default function SlidePlayerV2({ course, slides = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [quizScore, setQuizScore] = useState(null);
  const [commitmentText, setCommitmentText] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const slideAreaRef = useRef(null);
  const mainRef = useRef(null);
  const audioRef = useRef(null);
  const panelRef = useRef(null);

  /* ── Theme toggle (local to player, restores on unmount) ── */
  const prevThemeRef = useRef(null);
  useEffect(() => {
    prevThemeRef.current = document.documentElement.getAttribute('data-theme') || 'light';
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

  /* ── Background music ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && course?.backgroundMusic?.enabled && course.backgroundMusic.url) {
      const url = course.backgroundMusic.url.trim();
      const invalidDomains = ['bensound.com', 'example.com'];

      if (!url || invalidDomains.some(domain => url.includes(domain))) {
        console.warn('URL de música no válida o con problemas de certificado:', url);
        setMusicPlaying(false);
        return;
      }

      try {
        new URL(url);
      } catch {
        console.warn('URL de música inválida:', url);
        setMusicPlaying(false);
        return;
      }

      audio.loop = true;
      audio.volume = 0.3;
      audio.muted = false;

      if (audio.src !== url) {
        audio.src = url;
      }

      const handleError = () => {
        console.error('Error al cargar música de fondo:', url);
        setMusicPlaying(false);
      };

      const handleCanPlay = () => {
        if (musicPlaying) {
          audio.play().catch(() => setMusicPlaying(false));
        }
      };

      audio.addEventListener('error', handleError);
      audio.addEventListener('canplaythrough', handleCanPlay);

      if (musicPlaying) {
        audio.play().catch(() => setMusicPlaying(false));
      }

      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.pause();
      };
    }

    if (audio) {
      audio.pause();
    }

    return undefined;
  }, [course?.backgroundMusic, musicPlaying]);

  const toggleMusic = useCallback(() => {
    setMusicPlaying((prev) => !prev);
  }, []);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] ?? null;
  const progress = totalSlides > 0 ? ((currentIndex + 1) / totalSlides) * 100 : 0;

  /* ── Navigation ─────────────────────────────────── */
  const goTo = useCallback(
    (idx) => {
      if (idx >= 0 && idx < totalSlides && idx !== currentIndex) {
        setCurrentIndex(idx);
        setVisited((prev) => new Set(prev).add(idx));
        setPanelOpen(false);
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
          if (panelOpen) setPanelOpen(false);
          else if (onClose) onClose();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, goTo, totalSlides, panelOpen, onClose]);

  /* ── Close panel on outside click ── */
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  /* ── Touch swipe (horizontal) ── */
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const touchStartT = useRef(0);
  const touchScrollLocked = useRef(false);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartT.current = Date.now();
    touchScrollLocked.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dy) > Math.abs(dx)) {
      touchScrollLocked.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dt = Date.now() - touchStartT.current;
    touchStartY.current = null;
    touchStartX.current = null;

    if (touchScrollLocked.current) return;
    if (dt > 600) return;

    const THRESHOLD = 50;
    if (dx > THRESHOLD) goNext();
    else if (dx < -THRESHOLD) goPrev();
  }, [goNext, goPrev]);

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
      {/* ══ UNIFIED NAVBAR ═══════════════════════════ */}
      <nav className={s.navbar} aria-label="Controles de presentación">
        {/* Left: close + title */}
        <div className={s.navLeft}>
          {onClose && (
            <button className={s.navIconBtn} onClick={onClose} aria-label="Cerrar presentación" title="Cerrar">
              <CloseIcon />
            </button>
          )}
          <div className={s.titleGroup}>
            <h1 className={s.courseTitle}>{course?.title ?? 'Sin título'}</h1>
            {currentSlide && (
              <span className={s.badge}>{typeLabel(currentSlide.type)}</span>
            )}
          </div>
        </div>

        {/* Center: navigation */}
        <div className={s.navCenter}>
          <button
            className={s.navArrow}
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="Slide anterior"
            title="Anterior"
          >
            <ChevronLeftIcon />
          </button>
          <span className={s.slideCounter} aria-live="polite" aria-atomic="true">
            <span className={s.srOnly}>Slide </span>
            {currentIndex + 1}
            <span className={s.counterSep}>/</span>
            <span className={s.srOnly}> de </span>
            {totalSlides}
          </span>
          <button
            className={s.navArrow}
            onClick={goNext}
            disabled={currentIndex >= totalSlides - 1}
            aria-label="Siguiente slide"
            title="Siguiente"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Right: slide list + theme + music */}
        <div className={s.navRight}>
          <button
            className={`${s.navIconBtn} ${panelOpen ? s.navIconBtnActive : ''}`}
            onClick={() => setPanelOpen((v) => !v)}
            aria-label={panelOpen ? 'Cerrar índice' : 'Abrir índice'}
            aria-expanded={panelOpen}
            title="Índice de slides"
          >
            <ListIcon />
          </button>
          {course?.backgroundMusic?.enabled && (
            <button
              className={s.navIconBtn}
              onClick={toggleMusic}
              aria-label={musicPlaying ? 'Pausar música' : 'Reproducir música'}
              title={musicPlaying ? 'Pausar música' : 'Reproducir música'}
            >
              {musicPlaying ? <MusicOffIcon /> : <MusicIcon />}
            </button>
          )}
          <button
            className={s.navIconBtn}
            onClick={toggleTheme}
            aria-label={isDark ? 'Tema claro' : 'Tema oscuro'}
            title={isDark ? 'Tema claro' : 'Tema oscuro'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      {/* ══ PROGRESS BAR ═════════════════════════════ */}
      <div className={s.progressTrack} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del curso">
        <div className={s.progressBar} style={{ width: `${progress}%` }} />
      </div>

      {/* ══ SLIDE LIST PANEL (dropdown from navbar) ══ */}
      {panelOpen && (
        <div className={s.panelBackdrop} onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        className={`${s.panel} ${panelOpen ? s.panelOpen : ''}`}
        role="dialog"
        aria-label="Índice de contenido"
        aria-hidden={!panelOpen}
      >
        <div className={s.panelHeader}>
          <span className={s.panelTitle}>Contenido</span>
          <span className={s.panelCount}>{totalSlides} slides</span>
        </div>
        <nav className={s.panelList} aria-label="Lista de slides">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const isVisited = visited.has(idx);
            return (
              <button
                key={slide.id ?? idx}
                className={`${s.panelItem} ${isActive ? s.panelItemActive : ''} ${isVisited && !isActive ? s.panelItemVisited : ''}`}
                onClick={() => goTo(idx)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className={s.panelItemNum}>{idx + 1}</span>
                <div className={s.panelItemInfo}>
                  <span className={s.panelItemTitle}>
                    {slide.data?.heading || slide.data?.title || typeLabel(slide.type)}
                  </span>
                  <span className={s.panelItemMeta}>{typeLabel(slide.type)}</span>
                </div>
                {isVisited && !isActive && <CheckSmallIcon />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ══ MAIN CONTENT (full viewport) ═════════════ */}
      <main
        className={s.main}
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label={currentSlide ? `Slide ${currentIndex + 1} de ${totalSlides}` : 'Sin contenido'}
      >
        <div className={`${s.slideArea} ${s.slideAreaFullbleed}`} ref={slideAreaRef}>
          {currentSlide ? (
            <div className={s.slideFullbleed} key={currentIndex}>
              <SlideRendererV2
                slide={currentSlide}
                courseTitle={course?.title ?? ''}
                onQuizSubmit={handleQuizSubmit}
                onCheckChange={handleCheckChange}
                commitmentValue={commitmentText}
                onCommitmentChange={handleCommitmentChange}
              />
            </div>
          ) : (
            <p className={s.emptyMsg}>No hay slides en este curso.</p>
          )}
        </div>
      </main>

      {/* Background music */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}

/* ─── Inline SVG icons ───────────────────────────── */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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

function MusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function MusicOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}
