import React from 'react';
import {
    LayoutTemplate, Type, FileText, CheckSquare,
    List, Grid, Columns, Zap, Plus
} from 'lucide-react';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

const getSlideIcon = (type) => {
    switch (type) {
        case 'title': return <Type size={14} />;
        case 'objective': return <Zap size={14} />;
        case 'definition': return <FileText size={14} />;
        case 'content': return <LayoutTemplate size={14} />;
        case 'benefits': return <List size={14} />;
        case 'icon_grid': return <Grid size={14} />;
        case 'comparison': return <Columns size={14} />;
        case 'quiz': return <CheckSquare size={14} />;
        default: return <FileText size={14} />;
    }
};

const getSlideLabel = (slide) => {
    if (slide.data?.title) return slide.data.title;
    if (slide.data?.heading) return slide.data.heading;
    if (slide.data?.question) return slide.data.question;
    return 'Sin título';
};

export default function SlideList({ slides, currentSlide, onSelect, onAdd }) {
    return (
        <div className={styles.slidesList}>
            {slides.map((slide, index) => {
                const isActive = currentSlide?.id === slide.id;
                return (
                    <div
                        key={slide.id}
                        className={`${styles.slideItem} ${isActive ? styles.active : ''}`}
                        onClick={() => onSelect(slide)}
                    >
                        <span className={styles.slideNumber}>{index + 1}</span>
                        <div className={styles.slideInfo}>
                            <span className={styles.slideType}>{slide.type}</span>
                            <span className={styles.slidePreview}>
                                {getSlideLabel(slide)}
                            </span>
                        </div>
                        <div style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                            {getSlideIcon(slide.type)}
                        </div>
                    </div>
                );
            })}

            <button className={styles.addSlideBtn} onClick={onAdd}>
                <Plus size={16} /> Nuevo Slide
            </button>
        </div>
    );
}
