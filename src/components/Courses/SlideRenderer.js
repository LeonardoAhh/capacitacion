import TitleSlide from './slides/TitleSlide';
import ObjectiveSlide from './slides/ObjectiveSlide';
import DefinitionSlide from './slides/DefinitionSlide';
import ContentSlide from './slides/ContentSlide';
import IconGridSlide from './slides/IconGridSlide';
import BenefitsSlide from './slides/BenefitsSlide';
import ComparisonSlide from './slides/ComparisonSlide';

const SLIDE_COMPONENTS = {
    title: TitleSlide,
    objective: ObjectiveSlide,
    definition: DefinitionSlide,
    content: ContentSlide,
    icon_grid: IconGridSlide,
    benefits: BenefitsSlide,
    comparison: ComparisonSlide,
    // quiz: removido — los exámenes son en papel
};

/**
 * Router de slides: mapea slide.type al componente correcto.
 * Pasa isDark para que los slides dark apliquen texto blanco.
 */
export default function SlideRenderer({ slide, isDark }) {
    if (!slide) return null;

    const Component = SLIDE_COMPONENTS[slide.type];

    if (!Component) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--text-tertiary)' }}>
                <p>Tipo de slide no soportado: <strong>{slide.type}</strong></p>
            </div>
        );
    }

    return <Component data={slide.data} isDark={isDark} />;
}
