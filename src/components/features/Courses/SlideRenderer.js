import React, { memo, useMemo } from 'react';
import TitleSlide from './slides/TitleSlide';
import ObjectiveSlide from './slides/ObjectiveSlide';
import DefinitionSlide from './slides/DefinitionSlide';
import ContentSlide from './slides/ContentSlide';
import IconGridSlide from './slides/IconGridSlide';
import BenefitsSlide from './slides/BenefitsSlide';
import ComparisonSlide from './slides/ComparisonSlide';
import QuizSlide from './slides/QuizSlide';
import StepsSlide from './slides/StepsSlide';
import VideoSlide from './slides/VideoSlide';
import FlashcardSlide from './slides/FlashcardSlide';
import FillBlankSlide from './slides/FillBlankSlide';
import ChecklistSlide from './slides/ChecklistSlide';
import ThermalSimSlide from './slides/ThermalSimSlide';
import EnvSimSlide from './slides/EnvSimSlide';

const SLIDE_COMPONENTS = {
    title: TitleSlide,
    objective: ObjectiveSlide,
    definition: DefinitionSlide,
    content: ContentSlide,
    icon_grid: IconGridSlide,
    benefits: BenefitsSlide,
    comparison: ComparisonSlide,
    quiz: QuizSlide,
    steps: StepsSlide,
    video: VideoSlide,
    flashcard: FlashcardSlide,
    fill_blank: FillBlankSlide,
    checklist: ChecklistSlide,
    thermal_sim: ThermalSimSlide,
    env_sim: EnvSimSlide,
    // Mapeos para tipos especiales
    group_quiz: QuizSlide,
    group_dynamic: ContentSlide,
    dynamic: ContentSlide,
};

const SlideRenderer = memo(({ slide, inline = false, hasBgMedia = false, onQuizSubmit, onCheckChange }) => {
    if (!slide) return null;

    let Component = SLIDE_COMPONENTS[slide.type];
    let slideData = slide.data;

    // ── Adaptadores de datos para tipos especiales ──

    // 1. group_quiz -> QuizSlide
    if (slide.type === 'group_quiz') {
        // Transformar estructura de un solo quiz a array de questions para QuizSlide
        const options = slide.data.options || [];
        const correctIndex = options.findIndex(o => o.id === slide.data.correctOptionId);

        slideData = {
            heading: slide.data.heading || 'Dinámica de Pregunta',
            passingScore: 0, // No aplica score estricto en dinámicas grupales
            questions: [{
                q: slide.data.question,
                options: options.map(o => o.text),
                correct: correctIndex >= 0 ? correctIndex : 0,
                explanation: slide.data.explanation
            }]
        };
    }

    // 2. group_dynamic / dynamic -> ContentSlide
    if (slide.type === 'group_dynamic' || slide.type === 'dynamic') {
        const bullets = [];
        if (slide.data.type) bullets.push(`Tipo: ${slide.data.type}`);
        if (slide.data.duration) bullets.push(`Duración: ${slide.data.duration}`);
        if (slide.data.scenario) bullets.push(`Escenario: ${slide.data.scenario}`);
        if (slide.data.debrief) bullets.push(`Reflexión: ${slide.data.debrief}`);

        slideData = {
            heading: slide.data.heading || 'Dinámica Grupal',
            tag: 'Actividad',
            body: slide.data.instructions,
            bullets: bullets,
            image: null // O una imagen por defecto si se desea
        };
        Component = ContentSlide; // Asegurar que use ContentSlide
    }

    if (!Component) {
        return (
            <div
                className="slide-content-error"
                style={{
                    padding: 'var(--course-spacing-2xl)',
                    textAlign: 'center',
                    color: 'var(--course-slide-text-secondary)',
                    fontFamily: 'var(--font-body), sans-serif',
                }}
                role="alert"
            >
                <p>Tipo de slide no soportado: <strong style={{color: 'var(--course-accent)'}}>{slide.type}</strong></p>
                <pre style={{ textAlign: 'left', fontSize: 'var(--course-font-xs)', marginTop: 'var(--course-spacing-md)', fontFamily: 'var(--font-mono), monospace' }}>
                    {JSON.stringify(slide.data, null, 2)}
                </pre>
            </div>
        );
    }

    return (
        <div className={hasBgMedia ? "slideWrapperWithBg" : ""}>
            <Component
                data={slideData}
                inline={inline}
                hasBgMedia={hasBgMedia}
                onQuizSubmit={onQuizSubmit}
                onCheckChange={onCheckChange}
            />
        </div>
    );
});

SlideRenderer.displayName = 'SlideRenderer';

export default SlideRenderer;
