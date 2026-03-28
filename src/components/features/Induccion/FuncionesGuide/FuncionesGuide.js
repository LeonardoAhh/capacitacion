'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FuncionesGuide.module.css';

/* ──────────────────────────────────────────────────────────────
   Datos de funciones
   ────────────────────────────────────────────────────────────── */

const SLIDE_TYPES = [
    // — Existentes —
    { emoji: '🏷️', label: 'Título', tag: 'Existente', desc: 'Portada del curso con título, subtítulo e imagen de fondo.' },
    { emoji: '📄', label: 'Contenido', tag: 'Existente', desc: 'Texto libre con título, párrafo e imagen opcional a la derecha.' },
    { emoji: '🎯', label: 'Objetivo', tag: 'Existente', desc: 'Destaca la meta del módulo con ícono y descripción.' },
    { emoji: '📖', label: 'Definición', tag: 'Existente', desc: 'Término + definición con acento visual de color primario.' },
    { emoji: '✅', label: 'Beneficios', tag: 'Existente', desc: 'Lista de ventajas o puntos clave con íconos.' },
    { emoji: '⊞', label: 'Cuadrícula', tag: 'Existente', desc: 'Grid de íconos con etiquetas, ideal para conceptos múltiples.' },
    { emoji: '⇄', label: 'Comparación', tag: 'Existente', desc: 'Dos columnas lado a lado para contrastar ideas o procesos.' },
    { emoji: '1️⃣', label: 'Pasos', tag: 'Existente', desc: 'Secuencia numerada de instrucciones o fases.' },
    { emoji: '❓', label: 'Quiz', tag: 'Existente', desc: 'Pregunta de opción múltiple con retroalimentación inmediata.' },
    // — Nuevos —
    { emoji: '▶️', label: 'Video', tag: 'Nuevo', desc: 'Incrusta YouTube o reproduce MP4/WEBM directamente en el slide.' },
    { emoji: '🃏', label: 'Tarjetas', tag: 'Nuevo', desc: 'Mazo de flashcards con animación de volteo 3D. Anverso = término, reverso = definición.' },
    { emoji: '✍️', label: 'Completa la Frase', tag: 'Nuevo', desc: 'El candiadto escribe la respuesta en un campo de texto. Al enviar, recibe feedback inmediato.' },
    { emoji: '☑️', label: 'Checklist', tag: 'Nuevo', desc: 'Lista de requisitos que el alumno marca. Puede bloquear el avance hasta completarlos todos.' },
];

const PLAYER_FEATURES = [
    { emoji: '📝', label: 'Notas por slide', desc: 'Botón flotante para escribir notas personales en cada slide. Se guardan automáticamente en Firestore.' },
    { emoji: '⭐', label: 'Calificación del curso', desc: 'Al finalizar, el alumno puede calificar el curso con 1-5 estrellas. Solo una vez por usuario.' },
    { emoji: '☑️', label: 'Bloqueo por checklist', desc: 'Si el slide de checklist tiene "Requiere completar todos", el botón Siguiente queda deshabilitado hasta marcar todos los ítems.' },
    { emoji: '⏱', label: 'Tiempo por slide', desc: 'El player registra cuántos segundos pasa el alumno en cada slide para analytics.' },
    { emoji: '⌨️', label: 'Navegación por teclado', desc: 'Flechas ← → o clic en los controles. Soporte táctil (swipe) en móvil.' },
    { emoji: '📋', label: 'Tabla de contenidos', desc: 'Menú lateral con todos los slides. El alumno puede saltar a cualquier sección.' },
    { emoji: '🏆', label: 'Pantalla de finalización', desc: 'Muestra tiempo invertido, puntaje del quiz y slides completados al terminar.' },
];

const EDITOR_FEATURES = [
    { emoji: '↕️', label: 'Reordenar slides', desc: 'Arrastra y suelta los slides en el panel izquierdo para cambiar el orden.' },
    { emoji: '➕', label: '13 tipos de slide', desc: 'Elige entre 9 tipos existentes + 4 nuevos al agregar un slide.' },
    { emoji: '🧙', label: 'Asistente de creación', desc: 'Wizard de 3 pasos al crear un nuevo curso: nombre, portada y primer slide.' },
    { emoji: '🌐', label: 'Publicar / Despublicar', desc: 'Control de visibilidad. Solo los cursos publicados aparecen para los alumnos.' },
    { emoji: '📤', label: 'Importar / Exportar JSON', desc: 'Exporta un curso completo como JSON para hacer respaldo o compartir con otro sistema.' },
];

/* ──────────────────────────────────────────────────────────────
   Componente
   ────────────────────────────────────────────────────────────── */

export default function FuncionesGuide({ canEdit }) {
    const [expanded, setExpanded] = useState(false);
    const [section, setSection] = useState('slides'); // 'slides' | 'player' | 'editor'

    const existingSlides = SLIDE_TYPES.filter(s => s.tag === 'Existente');
    const newSlides = SLIDE_TYPES.filter(s => s.tag === 'Nuevo');

    return (
        <section className={styles.wrap} aria-label="Guía de funciones de cursos">
            {/* ── Header del acordeón ── */}
            <button
                type="button"
                className={`${styles.header} ${expanded ? styles.headerOpen : ''}`}
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
            >
                <span className={styles.headerLeft}>
                    <span className={styles.headerIcon} aria-hidden="true">✨</span>
                    <span className={styles.headerTitle}>Funciones de cursos nativos</span>
                    <span className={styles.headerSub}>
                        {SLIDE_TYPES.length} tipos de slide · {PLAYER_FEATURES.length} funciones del player · {EDITOR_FEATURES.length} herramientas del editor
                    </span>
                </span>
                <ChevronDown
                    size={18}
                    className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* ── Contenido expandible ── */}
            <div className={`${styles.body} ${expanded ? styles.bodyOpen : ''}`} aria-hidden={!expanded}>
              <div>
                {/* Tabs de sección */}
                <div className={styles.tabs} role="tablist">
                    {[
                        { id: 'slides', label: 'Tipos de slide', count: SLIDE_TYPES.length },
                        { id: 'player', label: 'Player', count: PLAYER_FEATURES.length },
                        { id: 'editor', label: 'Editor', count: EDITOR_FEATURES.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={section === tab.id}
                            className={`${styles.tab} ${section === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setSection(tab.id)}
                        >
                            {tab.label}
                            <span className={styles.tabCount}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* ── Tipos de slide ── */}
                {section === 'slides' && (
                    <div className={styles.sectionContent}>
                        <p className={styles.sectionNote}>
                            9 tipos existentes + 4 nuevos = <strong>13 tipos disponibles</strong> al crear o editar un curso.
                        </p>

                        <h3 className={styles.groupTitle}>
                            <span className={styles.groupDot} data-variant="existing" aria-hidden="true" />
                            Existentes
                        </h3>
                        <div className={styles.grid}>
                            {existingSlides.map(s => (
                                <SlideCard key={s.label} {...s} />
                            ))}
                        </div>

                        <h3 className={styles.groupTitle} style={{ marginTop: '20px' }}>
                            <span className={styles.groupDot} data-variant="new" aria-hidden="true" />
                            Nuevos
                        </h3>
                        <div className={styles.grid}>
                            {newSlides.map(s => (
                                <SlideCard key={s.label} {...s} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Funciones del player ── */}
                {section === 'player' && (
                    <div className={styles.sectionContent}>
                        <p className={styles.sectionNote}>
                            Funciones disponibles mientras el alumno reproduce un curso.
                        </p>
                        <div className={styles.featureList}>
                            {PLAYER_FEATURES.map(f => (
                                <FeatureRow key={f.label} {...f} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Funciones del editor ── */}
                {section === 'editor' && (
                    <div className={styles.sectionContent}>
                        <p className={styles.sectionNote}>
                            Herramientas disponibles en el editor de slides{canEdit ? '' : ' (requiere rol Instructor o superior)'}.
                        </p>
                        <div className={styles.featureList}>
                            {EDITOR_FEATURES.map(f => (
                                <FeatureRow key={f.label} {...f} />
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>
        </section>
    );
}

/* ── Sub-componentes ── */

function SlideCard({ emoji, label, tag, desc }) {
    return (
        <div className={`${styles.slideCard} ${tag === 'Nuevo' ? styles.slideCardNew : ''}`}>
            <div className={styles.slideCardTop}>
                <span className={styles.slideEmoji} aria-hidden="true">{emoji}</span>
                {tag === 'Nuevo' && <span className={styles.newBadge}>Nuevo</span>}
            </div>
            <span className={styles.slideLabel}>{label}</span>
            <p className={styles.slideDesc}>{desc}</p>
        </div>
    );
}

function FeatureRow({ emoji, label, desc }) {
    return (
        <div className={styles.featureRow}>
            <span className={styles.featureEmoji} aria-hidden="true">{emoji}</span>
            <div className={styles.featureText}>
                <span className={styles.featureLabel}>{label}</span>
                <span className={styles.featureDesc}>{desc}</span>
            </div>
        </div>
    );
}
