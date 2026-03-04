'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { IconArrowLeft, IconArrowRight, IconMenu, IconExpand, IconCompress } from '@/lib/icons';
import { AiOutlineClockCircle } from 'react-icons/ai';
import SlideRenderer from './SlideRenderer';
import CompletionScreen from './CompletionScreen';
import TableOfContents from './TableOfContents';
import { saveUserProgress, getUserProgress } from '@/lib/courseService';
import styles from './CoursePlayer.module.css';

// ── Constantes ───────────────────────────────────────────────────────────────

const WORDS_PER_MIN = 180;

/**
 * Mapa de badges por tipo de slide.
 * Definido fuera del componente para evitar recrearlo en cada render.
 */
const SLIDE_BADGES = {
    quiz: { emoji: '🧠', label: 'Quiz' },
    group_quiz: { emoji: '🧠', label: 'Quiz' },
    dynamic: { emoji: '🎯', label: 'Dinámica' },
    group_dynamic: { emoji: '🎯', label: 'Dinámica' },
    steps: { emoji: '📋', label: 'Paso a Paso' },
    title: { emoji: '🎯', label: 'Portada' },
    objective: { emoji: '🎓', label: 'Objetivo' },
    benefits: { emoji: '✅', label: 'Beneficios' },
    icon_grid: { emoji: '🔲', label: 'Íconos' },
    comparison: { emoji: '⚖️', label: 'Comparación' },
    definition: { emoji: '📖', label: 'Definición' },
    content: { emoji: '📄', label: 'Contenido' },
};

// ── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Estima el tiempo de lectura en minutos, sumando las palabras de todos los slides.
 * @param {Array} slides
 * @returns {number} Minutos estimados (mínimo 1 min por slide)
 */
function estimateReadingTime(slides) {
    let totalWords = 0;
    (slides || []).forEach(({ data = {} }) => {
        const text = [
            data.title, data.heading, data.subtitle, data.body,
            ...(data.bullets || []),
            ...(data.items || []).map(i => `${i.label || ''} ${i.text || ''} ${i.description || ''}`),
            data.question,
        ].filter(Boolean).join(' ');
        totalWords += text.split(/\s+/).filter(Boolean).length;
    });
    return Math.max(1, Math.ceil(totalWords / WORDS_PER_MIN));
}

// ── Subcomponente: Badge del tipo de slide ───────────────────────────────────

/**
 * Muestra un badge con el emoji y label del tipo de slide actual.
 * Extraído del IIFE inline para evitar redefinición en cada render.
 */
function SlideBadge({ type }) {
    const badge = SLIDE_BADGES[type];
    if (!badge) return null;
    return (
        <span className={styles.slideBadge}>
            {badge.emoji} {badge.label}
        </span>
    );
}

// ── Componente principal ─────────────────────────────────────────────────────

/**
 * CoursePlayer — Reproductor de cursos premium
 * @param {Object}   props
 * @param {Object}   props.course    - Datos del curso
 * @param {Array}    props.slides    - Array de slides (todos los tipos)
 * @param {Function} props.onClose   - Callback para cerrar el player
 * @param {boolean}  [props.inline]  - Si true, renderiza en modo editor (sin fullscreen, sin persistencia)
 * @param {string}   [props.userId]  - UID del usuario para persistencia de progreso
 */
export default function CoursePlayer({ course, slides, onClose, inline = false, userId = null }) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState('forward');       // 'forward' | 'backward'
    const [slideKey, setSlideKey] = useState(0);               // fuerza re-mount para animación
    const [showCompletion, setShowCompletion] = useState(false);
    const [showTOC, setShowTOC] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [quizScore, setQuizScore] = useState(null);            // score del quiz (0-100)
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const [progressLoaded, setProgressLoaded] = useState(false);

    const containerRef = useRef(null);
    const touchStartXRef = useRef(null);
    const saveTimerRef = useRef(null);

    // Refs estables para el keyboard handler (evita recrear el listener en cada render)
    const isLastRef = useRef(false);
    const showTOCRef = useRef(false);
    const showCompletionRef = useRef(false);
    const handleFinishRef = useRef(null);
    const goNextRef = useRef(null);
    const goPrevRef = useRef(null);
    const toggleFullscreenRef = useRef(null);

    // ── Slides normalizados con useMemo ──────────────────────────────────────
    const allSlides = useMemo(() => slides || [], [slides]);
    const total = allSlides.length;
    const isFirst = current === 0;
    const isLast = current === total - 1;
    const currentSlide = allSlides[current];
    const bgMedia = currentSlide?.data?.bgMedia || null;

    // Tiempo estimado memoizado — solo recalcula si cambian los slides
    const estimatedMins = useMemo(() => estimateReadingTime(allSlides), [allSlides]);

    // ── Cargar progreso guardado al montar (solo modo no-inline) ─────────────
    useEffect(() => {
        if (inline || !userId || !course?.id) {
            setProgressLoaded(true);
            return;
        }
        getUserProgress(course.id, userId)
            .then((saved) => {
                if (saved && saved.slideIndex > 0 && saved.slideIndex < total) {
                    setCurrent(saved.slideIndex);
                }
                if (saved?.quizScore !== null && saved?.quizScore !== undefined) {
                    setQuizScore(saved.quizScore);
                }
            })
            .catch((err) => {
                console.error('[CoursePlayer] Error al cargar progreso:', err);
            })
            .finally(() => {
                setProgressLoaded(true);
            });
    }, [course?.id, userId, inline, total]);

    // ── Cleanup del saveTimer al desmontar ───────────────────────────────────
    useEffect(() => {
        return () => clearTimeout(saveTimerRef.current);
    }, []);

    // ── Guardar progreso con debounce (solo modo no-inline) ──────────────────
    const persistProgress = useCallback((index, score = null) => {
        if (inline || !userId || !course?.id) return;
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveUserProgress(course.id, userId, index, score);
        }, 600);
    }, [course?.id, userId, inline]);

    // ── Cronómetro (solo modo no-inline) ─────────────────────────────────────
    useEffect(() => {
        if (inline || showCompletion) return;
        const timer = setInterval(() => setElapsedSecs(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [inline, showCompletion]);

    // ── Detector online/offline ───────────────────────────────────────────────
    useEffect(() => {
        if (inline) return;
        setIsOffline(!navigator.onLine);
        const onOnline = () => setIsOffline(false);
        const onOffline = () => setIsOffline(true);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [inline]);

    // ── Cambio de slide con animación y persistencia ──────────────────────────
    const goTo = useCallback((index, dir = 'forward') => {
        if (index < 0 || index >= total) return;
        setDirection(dir);
        setSlideKey(k => k + 1);
        setCurrent(index);
        persistProgress(index);
    }, [total, persistProgress]);

    const goNext = useCallback(() => {
        if (!isLast) goTo(current + 1, 'forward');
    }, [isLast, current, goTo]);

    const goPrev = useCallback(() => {
        if (!isFirst) goTo(current - 1, 'backward');
    }, [isFirst, current, goTo]);

    // ── Finalizar curso ───────────────────────────────────────────────────────
    // Usa el score más reciente vía ref funcional de setQuizScore para evitar stale closure
    const handleFinish = useCallback(() => {
        if (inline) { onClose(); return; }
        setShowCompletion(true);
        setQuizScore(latestScore => {
            persistProgress(current, latestScore);
            return latestScore;
        });
    }, [inline, onClose, current, persistProgress]);

    // ── Reiniciar curso ───────────────────────────────────────────────────────
    const handleRestart = useCallback(() => {
        setShowCompletion(false);
        setElapsedSecs(0);
        goTo(0, 'forward');
    }, [goTo]);

    // ── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }, []);

    useEffect(() => {
        if (inline) return;
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, [inline]);

    // ── Sincronizar refs estables para el keyboard handler ───────────────────
    useEffect(() => { isLastRef.current = isLast; }, [isLast]);
    useEffect(() => { showTOCRef.current = showTOC; }, [showTOC]);
    useEffect(() => { showCompletionRef.current = showCompletion; }, [showCompletion]);
    useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);
    useEffect(() => { goNextRef.current = goNext; }, [goNext]);
    useEffect(() => { goPrevRef.current = goPrev; }, [goPrev]);
    useEffect(() => { toggleFullscreenRef.current = toggleFullscreen; }, [toggleFullscreen]);

    // ── Teclado — listener único y estable via refs ───────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    if (isLastRef.current) handleFinishRef.current?.();
                    else goNextRef.current?.();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    goPrevRef.current?.();
                    break;
                case 'Escape':
                    if (showTOCRef.current) { setShowTOC(false); return; }
                    onClose();
                    break;
                case 'f':
                case 'F':
                    if (!inline) toggleFullscreenRef.current?.();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
        // Dependencias mínimas: solo lo que no va por ref
    }, [inline, onClose]);

    // ── Swipe mobile ──────────────────────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        touchStartXRef.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (touchStartXRef.current === null) return;
        const delta = touchStartXRef.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 50) {
            if (delta > 0) { if (isLast) handleFinish(); else goNext(); }
            else { goPrev(); }
        }
        touchStartXRef.current = null;
    }, [goNext, goPrev, isLast, handleFinish]);

    // ── Clase del contenedor ──────────────────────────────────────────────────
    const overlayClass = [
        styles.overlay,
        inline ? styles.inlineMode : '',
        isFullscreen ? styles.fullscreen : '',
    ].filter(Boolean).join(' ');

    // ── Guard: no renderizar hasta cargar el progreso guardado ────────────────
    if (!progressLoaded) return null;

    // ── Estado vacío ──────────────────────────────────────────────────────────
    if (!allSlides.length) {
        return (
            <div className={overlayClass} role="dialog" aria-modal="true">
                <div className={styles.emptyMsg}>Sin slides para mostrar.</div>
            </div>
        );
    }

    // ── Clases de animación del slide ─────────────────────────────────────────
    const slideAnimClass = direction === 'forward' ? styles.slideEnterForward : styles.slideEnterBackward;

    return (
        <div
            ref={containerRef}
            className={overlayClass}
            role="dialog"
            aria-modal="true"
            aria-label={`Reproductor de curso: ${course?.title || 'Curso'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Banner sin conexión ── */}
            {isOffline && (
                <div className={styles.offlineBanner} role="alert" aria-live="polite">
                    <span>📡 Sin conexión — El progreso no se guardará hasta que vuelvas en línea.</span>
                </div>
            )}

            {/* ── Header ── */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {!inline && (
                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowTOC(v => !v)}
                            aria-label="Índice del curso"
                            aria-expanded={showTOC}
                        >
                            <IconMenu size={18} />
                        </button>
                    )}
                    <button
                        className={styles.exitBtn}
                        onClick={onClose}
                        aria-label="Cerrar curso y volver"
                    >
                        <IconArrowLeft size={16} aria-hidden="true" />
                        <span>Salir</span>
                    </button>
                </div>

                <span className={styles.headerTitle}>{course?.title || 'Curso'}</span>

                <div className={styles.headerRight}>
                    {!inline && (
                        <span className={styles.readingTime} title="Tiempo estimado">
                            <AiOutlineClockCircle size={13} aria-hidden="true" />
                            ~{estimatedMins} min
                        </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!inline && <SlideBadge type={currentSlide?.type} />}
                        <span className={styles.counter} aria-label={`Slide ${current + 1} de ${total}`}>
                            {current + 1} / {total}
                        </span>
                    </div>

                    {!inline && (
                        <button
                            className={styles.iconBtn}
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                        >
                            {isFullscreen ? <IconCompress size={16} /> : <IconExpand size={16} />}
                        </button>
                    )}
                </div>
            </header>

            {/* ── Barra de progreso: segmentada (≤12 slides) o lineal (>12 slides) ── */}
            {total <= 12 ? (
                <div
                    className={styles.segmentedBar}
                    role="progressbar"
                    aria-valuenow={current + 1}
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-label={`Progreso: slide ${current + 1} de ${total}`}
                >
                    {allSlides.map((_, i) => (
                        <button
                            key={i}
                            className={[
                                styles.segment,
                                i === current ? styles.segmentActive : '',
                                i < current ? styles.segmentVisited : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => goTo(i, i > current ? 'forward' : 'backward')}
                            aria-label={`Slide ${i + 1}`}
                            tabIndex={-1}
                        />
                    ))}
                </div>
            ) : (
                <div
                    className={styles.linearBar}
                    role="progressbar"
                    aria-valuenow={current + 1}
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-label={`Progreso: slide ${current + 1} de ${total}`}
                >
                    <div
                        className={styles.linearBarFill}
                        style={{ width: `${((current + 1) / total) * 100}%` }}
                    />
                </div>
            )}

            {/* ── Contenido del slide ── */}
            <main
                className={styles.content}
                aria-live="polite"
                style={bgMedia?.layout === 'split' ? {
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'row',
                } : bgMedia ? {
                    position: 'relative',
                } : undefined}
            >
                {/* Fondo multimedia (full) */}
                {bgMedia && bgMedia.layout !== 'split' && (
                    <>
                        {bgMedia.type === 'video' ? (
                            <video
                                src={bgMedia.url}
                                autoPlay loop muted playsInline
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                            />
                        ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={bgMedia.url} alt="Fondo" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 0 }} />
                    </>
                )}

                {/* Slide content con animación */}
                <div
                    key={slideKey}
                    className={`${styles.slideWrapper} ${slideAnimClass}`}
                    style={bgMedia?.layout === 'split' ? {
                        position: 'relative',
                        zIndex: 1,
                        width: '50%',
                        flex: '1 1 50%',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    } : bgMedia ? {
                        position: 'relative',
                        zIndex: 1,
                    } : undefined}
                >
                    <SlideRenderer
                        slide={currentSlide}
                        inline={inline}
                        hasBgMedia={!!(bgMedia && bgMedia.layout !== 'split')}
                        onQuizSubmit={(score) => setQuizScore(score)}
                    />
                </div>

                {/* Media split */}
                {bgMedia?.layout === 'split' && (
                    <div style={{
                        width: '50%',
                        height: '100%',
                        position: 'relative',
                        borderLeft: '1px solid var(--border-color)',
                        flexShrink: 0,
                    }}>
                        {bgMedia.type === 'video' ? (
                            <video src={bgMedia.url} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={bgMedia.url} alt="Media adjunto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                    </div>
                )}
            </main>

            {/* ── Nav ── */}
            <nav className={styles.nav} aria-label="Navegación de slides">
                <button
                    className={styles.navBtn}
                    onClick={goPrev}
                    disabled={isFirst}
                    aria-label="Slide anterior"
                    aria-disabled={isFirst}
                >
                    <IconArrowLeft size={16} aria-hidden="true" />
                    <span>Anterior</span>
                </button>

                {total <= 12 && (
                    <div className={styles.dots} role="tablist" aria-label="Slides del curso">
                        {allSlides.map((slide, i) => (
                            <button
                                key={i}
                                className={[
                                    styles.dot,
                                    i === current ? styles.dotActive : '',
                                    i < current ? styles.dotVisited : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => goTo(i, i > current ? 'forward' : 'backward')}
                                role="tab"
                                aria-selected={i === current}
                                aria-label={`Ir a slide ${i + 1}: ${slide.data?.heading || slide.type}`}
                                tabIndex={i === current ? 0 : -1}
                            />
                        ))}
                    </div>
                )}

                <button
                    className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                    onClick={isLast ? handleFinish : goNext}
                    aria-label={isLast ? 'Finalizar curso' : 'Siguiente slide'}
                >
                    <span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
                    <IconArrowRight size={16} aria-hidden="true" />
                </button>
            </nav>

            {/* ── Tabla de Contenidos (Drawer) ── */}
            {!inline && (
                <TableOfContents
                    isOpen={showTOC}
                    onClose={() => setShowTOC(false)}
                    slides={allSlides}
                    current={current}
                    onSelect={(i) => goTo(i, i > current ? 'forward' : 'backward')}
                />
            )}

            {/* ── Pantalla de Finalización ── */}
            {showCompletion && (
                <CompletionScreen
                    course={course}
                    quizScore={quizScore}
                    elapsedSecs={elapsedSecs}
                    onRestart={handleRestart}
                    onClose={onClose}
                />
            )}
        </div>
    );
}