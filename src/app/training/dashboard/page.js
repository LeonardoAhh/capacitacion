'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar/Navbar';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import CourseCard from '@/components/Training/CourseCard';
import CourseViewer from '@/components/Training/CourseViewer';
import { BookOpen, LogOut, Search, Filter } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import styles from './page.module.css';



export default function TrainingDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed

    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            // Verificar sesión
            const session = sessionStorage.getItem('training_session');
            if (!session) {
                router.push('/training/login');
                return;
            }

            const userData = JSON.parse(session);
            setUser(userData);

            try {
                // 1. Obtener asignaciones del empleado desde 'programacion'
                const progRef = collection(db, 'programacion');
                const q = query(progRef, where('employeeId', '==', userData.id));
                const progSnap = await getDocs(q);

                if (progSnap.empty) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // 2. Obtener detalles de cada curso desde 'cursos_induccion'
                const coursesData = await Promise.all(progSnap.docs.map(async (pDoc) => {
                    const progData = pDoc.data();
                    // Buscar detalle del curso
                    // Nota: Si courseId es un string simple o referencia, ajustar. Asumo ID string.
                    const courseDoc = await getDoc(doc(db, 'cursos_induccion', progData.courseId));
                    const courseDetail = courseDoc.exists() ? courseDoc.data() : { nombre: 'Curso no encontrado', descripcion: '' };

                    return {
                        id: progData.courseId, // ID del curso base
                        assignmentId: pDoc.id, // ID de la asignación (para updates)
                        ...courseDetail,
                        title: courseDetail.nombre || 'Sin Título', // Map nombre to title for UI components
                        description: courseDetail.descripcion || '',
                        ...progData // Sobrescribe status, fechas, etc. de la asignación
                    };
                }));

                setCourses(coursesData);
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('training_session');
        router.push('/training/login');
    };

    const handleCourseClick = (course) => {
        setSelectedCourse(course);
    };

    const handleUpdateStatus = (assignmentId, newStatus) => {
        setCourses(prev => prev.map(c =>
            c.assignmentId === assignmentId ? { ...c, status: newStatus } : c
        ));
    };

    const filteredCourses = courses.filter(course => {
        if (filter === 'all') return true;
        if (filter === 'pending') return course.status !== 'completed';
        if (filter === 'completed') return course.status === 'completed';
        return true;
    });

    if (!user) return null;

    return (
        <div className={styles.container}>
            {/* Custom Navbar for Training Portal */}
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                    <div className={styles.logo}>
                        <BookOpen className={styles.logoIcon} />
                        <div>
                            <span className={styles.logoText}>Portal de Capacitación</span>
                            <span className={styles.companyText}>VIÑOPLASTIC</span>
                        </div>
                    </div>

                    <div className={styles.userInfo}>
                        <ThemeToggle />
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user.name}</span>
                            <span className={styles.userRole}>{user.position}</span>
                        </div>
                        <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Mis Cursos Asignados</h1>
                    <p className={styles.pageSubtitle}>
                        Gestiona tu avance y completa las capacitaciones programadas para tu puesto.
                    </p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.searchBar}>
                        <Search className={styles.searchIcon} />
                        <input type="text" placeholder="Buscar curso..." className={styles.searchInput} />
                    </div>

                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Todos
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pendientes
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Completados
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingGrid}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        className={styles.grid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {filteredCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onClick={handleCourseClick}
                            />
                        ))}
                    </motion.div>
                )}
            </main>

            {selectedCourse && (
                <CourseViewer
                    course={selectedCourse}
                    assignmentId={selectedCourse.assignmentId}
                    onClose={() => setSelectedCourse(null)}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}
        </div>
    );
}
