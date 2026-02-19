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
};

export default function SlideRenderer({ slide }) {
    if (!slide) return null;

    const Component = SLIDE_COMPONENTS[slide.type];

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
            </div>
        );
    }

    return <Component data={slide.data} />;
}
