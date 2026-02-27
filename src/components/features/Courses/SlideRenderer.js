import TitleSlide from './slides/TitleSlide';
import ObjectiveSlide from './slides/ObjectiveSlide';
import DefinitionSlide from './slides/DefinitionSlide';
import ContentSlide from './slides/ContentSlide';
import IconGridSlide from './slides/IconGridSlide';
import BenefitsSlide from './slides/BenefitsSlide';
import ComparisonSlide from './slides/ComparisonSlide';
import QuizSlide from './slides/QuizSlide';

const SLIDE_COMPONENTS = {
    title: TitleSlide,
    objective: ObjectiveSlide,
    definition: DefinitionSlide,
    content: ContentSlide,
    icon_grid: IconGridSlide,
    benefits: BenefitsSlide,
    comparison: ComparisonSlide,
    quiz: QuizSlide,
    // Mapeos para tipos especiales
    group_quiz: QuizSlide,
    group_dynamic: ContentSlide,
    dynamic: ContentSlide,
};

export default function SlideRenderer({ slide, inline = false, onQuizSubmit }) {
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
                style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)'
                }}
                role="alert"
            >
                <p>Tipo de slide no soportado: <strong>{slide.type}</strong></p>
                <pre style={{ textAlign: 'left', fontSize: '0.7rem', marginTop: 10 }}>
                    {JSON.stringify(slide.data, null, 2)}
                </pre>
            </div>
        );
    }

    return <Component data={slideData} inline={inline} onQuizSubmit={onQuizSubmit} />;
}
