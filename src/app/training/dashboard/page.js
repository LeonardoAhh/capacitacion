'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar/Navbar';
import CourseCard from '@/components/Training/CourseCard';
import { BookOpen, LogOut, Search, Filter } from 'lucide-react';
import styles from './page.module.css';

// Mock data (temporary until 'programacion' collection is ready)
const MOCK_COURSES = [
    {
        id: 'c1',
        title: 'Introducción a la Seguridad Industrial',
        description: 'Conceptos básicos de seguridad en planta, uso de EPP y protocolos de emergencia.',
        status: 'pending',
        duration: '45 min',
        thumbnail: null
    },
    {
        id: 'c2',
        title: 'Cultura Organizacional VIÑOPLASTIC',
        description: 'Conoce nuestra misión, visión y valores fundamentales.',
        status: 'completed',
        completedAt: '2024-02-01',
        duration: '30 min',
        thumbnail: null
    },
    {
        id: 'c3',
        title: 'Buenas Prácticas de Manufactura',
        description: 'Estándares de calidad e higiene en el proceso productivo.',
        status: 'pending',
        duration: '60 min',
        thumbnail: null
    }
];

export default function TrainingDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed

    useEffect(() => {
        // Verificar sesión
        const session = sessionStorage.getItem('training_session');
        if (!session) {
            router.push('/training/login');
            return;
        }

        setUser(JSON.parse(session));

        // Simular fetch de cursos
        setTimeout(() => {
            setCourses(MOCK_COURSES);
            setLoading(false);
        }, 1000);

    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('training_session');
        router.push('/training/login');
    };

    const handleCourseClick = (course) => {
        // TODO: Implement course viewer
        console.log('Open course:', course);
    };

    const filteredCourses = courses.filter(course => {
        if (filter === 'all') return true;
        return course.status === filter;
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
        </div>
    );
}
