'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseWithSlides } from '@/lib/courseService';
import SlidePlayerV2 from '@/components/features/Courses/SlidePlayerV2/SlidePlayerV2';
import styles from './page.module.css';

export default function PublicCoursePage({ params }) {
    const { courseId } = params;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [course, setCourse]   = useState(null);
    const [slides, setSlides]   = useState([]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const result = await getCourseWithSlides(courseId);
                if (!active) return;
                if (!result.success) {
                    setError(result.error || 'No se pudo cargar el curso.');
                    return;
                }
                if (!result.data.slides.length) {
                    setError('Este curso no tiene contenido aún.');
                    return;
                }
                setCourse(result.data.course);
                setSlides(result.data.slides);
            } catch {
                if (active) setError('Error inesperado al cargar el curso.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [courseId]);

    if (loading) {
        return (
            <div className={styles.shell}>
                <div className={styles.centered}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <p>Cargando curso…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.shell}>
                <div className={styles.errorCard}>
                    <span aria-hidden="true" style={{ fontSize: '2rem' }}>⚠️</span>
                    <p>{error}</p>
                    <button className={styles.btn} onClick={() => router.push('/')}>Ir al inicio</button>
                </div>
            </div>
        );
    }

    return (
        <SlidePlayerV2
            course={course}
            slides={slides}
            onClose={() => router.push('/')}
        />
    );
}
