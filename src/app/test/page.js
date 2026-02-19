'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, BookOpen, Trash2, Play } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import CoursePlayer from '@/components/Courses/CoursePlayer';
import {
    importCourseFromJSON,
    getAllCourses,
    getCourseWithSlides,
    deleteCourse,
} from '@/lib/courseService';
import styles from './test.module.css';

export default function TestPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [alert, setAlert] = useState(null); // { type: 'success'|'error', message }
    const [playerData, setPlayerData] = useState(null); // { course, slides }
    const fileInputRef = useRef(null);

    // Cargar cursos
    const loadCourses = useCallback(async () => {
        setLoading(true);
        const result = await getAllCourses();
        if (result.success) {
            setCourses(result.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    // Auto-ocultar alerta
    useEffect(() => {
        if (!alert) return;
        const timer = setTimeout(() => setAlert(null), 5000);
        return () => clearTimeout(timer);
    }, [alert]);

    // Importar JSON
    const handleImport = useCallback(async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setAlert({ type: 'error', message: 'Selecciona un archivo JSON primero.' });
            return;
        }

        setImporting(true);
        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            const result = await importCourseFromJSON(jsonData, 'admin');

            if (result.success) {
                setAlert({ type: 'success', message: `Curso importado exitosamente (ID: ${result.courseId})` });
                if (fileInputRef.current) fileInputRef.current.value = '';
                await loadCourses();
            } else {
                setAlert({ type: 'error', message: result.error });
            }
        } catch (err) {
            setAlert({ type: 'error', message: `Error al parsear JSON: ${err.message}` });
        }
        setImporting(false);
    }, [loadCourses]);

    // Abrir reproductor
    const handlePlay = useCallback(async (courseId) => {
        const result = await getCourseWithSlides(courseId);
        if (result.success) {
            setPlayerData(result.data);
        } else {
            setAlert({ type: 'error', message: 'Error al cargar el curso.' });
        }
    }, []);

    // Eliminar curso
    const handleDelete = useCallback(async (courseId, e) => {
        e.stopPropagation();
        const confirmed = window.confirm('¿Estás seguro de eliminar este curso y todos sus slides?');
        if (!confirmed) return;

        const result = await deleteCourse(courseId);
        if (result.success) {
            setAlert({ type: 'success', message: 'Curso eliminado.' });
            await loadCourses();
        } else {
            setAlert({ type: 'error', message: result.error });
        }
    }, [loadCourses]);

    // Si el player está abierto, renderizar solo el player
    if (playerData) {
        return (
            <CoursePlayer
                course={playerData.course}
                slides={playerData.slides}
                onClose={() => setPlayerData(null)}
            />
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <BackButton href="/dashboard" />

                <header className={styles.header}>
                    <span className={styles.portal}>Admin</span>
                    <h1 className={styles.title}>Gestor de Cursos</h1>
                    <p className={styles.subtitle}>Importa, administra y reproduce cursos interactivos</p>
                </header>

                {/* Importar JSON */}
                <div className={styles.importSection}>
                    <span className={styles.importLabel}>Importar curso desde JSON</span>
                    <div className={styles.importRow}>
                        <div className={styles.fileInput}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                id="json-import"
                            />
                        </div>
                        <button
                            className={styles.importBtn}
                            onClick={handleImport}
                            disabled={importing}
                        >
                            <Upload size={16} />
                            {importing ? 'Importando...' : 'Importar'}
                        </button>
                    </div>
                </div>

                {/* Alertas */}
                {alert && (
                    <div className={`${styles.alert} ${alert.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                        {alert.message}
                    </div>
                )}

                {/* Lista de Cursos */}
                <h2 className={styles.sectionTitle}>Cursos Disponibles</h2>

                {loading ? (
                    <div className={styles.loading}>Cargando cursos...</div>
                ) : courses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📚</div>
                        <p className={styles.emptyText}>
                            No hay cursos todavía. Importa un archivo JSON para comenzar.
                        </p>
                    </div>
                ) : (
                    <div className={styles.courseGrid}>
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className={styles.courseCard}
                                onClick={() => handlePlay(course.id)}
                            >
                                <div className={styles.courseIcon}>
                                    <BookOpen size={22} />
                                </div>
                                <div className={styles.courseInfo}>
                                    <span className={styles.courseTitle}>{course.title}</span>
                                    <div className={styles.courseMeta}>
                                        {course.category && (
                                            <span className={styles.courseMetaItem}>{course.category}</span>
                                        )}
                                        {course.duration && (
                                            <span className={styles.courseMetaItem}>{course.duration}</span>
                                        )}
                                        {course.slideCount && (
                                            <span className={styles.courseMetaItem}>{course.slideCount} slides</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.courseActions}>
                                    <span className={`${styles.statusBadge} ${course.published ? styles.statusPublished : styles.statusDraft}`}>
                                        {course.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => handleDelete(course.id, e)}
                                        title="Eliminar curso"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
