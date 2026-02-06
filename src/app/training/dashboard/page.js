'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import {
    BookOpen, LogOut, Search, GraduationCap, Clock, Award,
    User, Calendar, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/Drawer/Drawer';
import styles from './page.module.css';

export default function TrainingDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const session = sessionStorage.getItem('training_session');
            if (!session) {
                router.push('/training/login');
                return;
            }

            const userData = JSON.parse(session);
            setUser(userData);

            // Check if first visit
            const hasSeenWelcome = sessionStorage.getItem(`training_welcome_${userData.id}`);
            if (!hasSeenWelcome) {
                setShowWelcome(true);
            }

            try {
                const progRef = collection(db, 'programacion');
                const q = query(progRef, where('employeeId', '==', userData.id));
                const progSnap = await getDocs(q);

                if (progSnap.empty) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                const coursesData = await Promise.all(progSnap.docs.map(async (pDoc) => {
                    const progData = pDoc.data();
                    const courseDoc = await getDoc(doc(db, 'cursos_induccion', progData.courseId));
                    const courseDetail = courseDoc.exists() ? courseDoc.data() : {
                        nombre: 'Curso no encontrado',
                        descripcion: ''
                    };

                    return {
                        id: progData.courseId,
                        assignmentId: pDoc.id,
                        ...courseDetail,
                        title: courseDetail.nombre || 'Sin Título',
                        description: courseDetail.descripcion || '',
                        ...progData
                    };
                }));

                setCourses(coursesData);
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleWelcomeClose = () => {
        if (user) {
            sessionStorage.setItem(`training_welcome_${user.id}`, 'true');
        }
        setShowWelcome(false);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('training_session');
        router.push('/training/login');
    };

    const handleCourseClick = async (course) => {
        setSelectedCourse(course);

        // Mark as viewed if not already
        if (course.status !== 'viewed' && course.status !== 'completed') {
            try {
                await updateDoc(doc(db, 'programacion', course.assignmentId), {
                    status: 'viewed',
                    viewedAt: new Date()
                });
                setCourses(prev => prev.map(c =>
                    c.assignmentId === course.assignmentId
                        ? { ...c, status: 'viewed', viewedAt: new Date() }
                        : c
                ));
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    };

    const handleMarkComplete = async (assignmentId) => {
        try {
            await updateDoc(doc(db, 'programacion', assignmentId), {
                status: 'completed',
                completedAt: new Date()
            });
            setCourses(prev => prev.map(c =>
                c.assignmentId === assignmentId
                    ? { ...c, status: 'completed', completedAt: new Date() }
                    : c
            ));
            setSelectedCourse(null);
        } catch (error) {
            console.error('Error marking complete:', error);
        }
    };

    const filteredCourses = courses.filter(course => {
        return course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const stats = {
        total: courses.length,
        completed: courses.filter(c => c.status === 'completed').length,
        inProgress: courses.filter(c => c.status === 'viewed').length,
        pending: courses.filter(c => !c.status || c.status === 'assigned').length
    };

    if (!user) return null;

    return (
        <div className={styles.container}>
            {/* Welcome Drawer */}
            <Drawer open={showWelcome} onOpenChange={setShowWelcome}>
                <DrawerContent className={styles.welcomeDrawerContent}>
                    <DrawerHeader className={styles.welcomeDrawerHeader}>
                        <div className={styles.welcomeAvatar}>
                            <User size={32} />
                        </div>
                        <DrawerTitle className={styles.welcomeTitle}>
                            ¡Bienvenido/a, {(() => {
                                const fullName = user.name || '';
                                const parts = fullName.trim().split(/\s+/);

                                if (parts.length === 1) {
                                    return parts[0];
                                } else if (parts.length === 2) {
                                    return `${parts[0]} ${parts[1]}`;
                                } else if (parts.length >= 3) {
                                    return parts.length === 3
                                        ? `${parts[0]} ${parts[2]}`
                                        : `${parts[0]} ${parts[2]}`;
                                }
                                return fullName;
                            })()}!
                        </DrawerTitle>
                        <DrawerDescription className={styles.welcomeText}>
                            Nos alegra tenerte en el <strong>Portal de Capacitación</strong> de Viñoplastic.
                        </DrawerDescription>
                        <DrawerClose />
                    </DrawerHeader>

                    <div className={styles.welcomeDrawerBody}>
                        <div className={styles.welcomeInfo}>
                            <div className={styles.infoItem}>
                                <User size={20} />
                                <div>
                                    <span className={styles.infoLabel}>Tu puesto</span>
                                    <span className={styles.infoValue}>{user.position}</span>
                                </div>
                            </div>

                            <div className={styles.infoItem}>
                                <BookOpen size={20} />
                                <div>
                                    <span className={styles.infoLabel}>Cursos asignados</span>
                                    <span className={styles.infoValue}>{stats.total} curso{stats.total !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>

                        <p className={styles.welcomeSubtext}>
                            Completa cada módulo para mejorar tus habilidades y avanzar en tu desarrollo profesional.
                        </p>
                    </div>

                    <DrawerFooter className={styles.welcomeDrawerFooter}>
                        <button className={styles.welcomeBtn} onClick={handleWelcomeClose}>
                            <GraduationCap size={20} />
                            Empezar mi capacitación
                        </button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                    <div className={styles.navBrand}>
                        <div className={styles.navIcon}>
                            <GraduationCap size={24} />
                        </div>
                        <div className={styles.navTexts}>
                            <span className={styles.navTitle}>Portal de Capacitación</span>
                            <span className={styles.navCompany}>VIÑOPLASTIC</span>
                        </div>
                    </div>

                    <div className={styles.navActions}>
                        <ThemeToggle />
                        <div className={styles.navUser}>
                            <div className={styles.navUserAvatar}>
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className={styles.navUserInfo}>
                                <span className={styles.navUserName}>{user.name}</span>
                                <span className={styles.navUserRole}>{user.position}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className={styles.navLogout} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <BookOpen size={20} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Cursos Totales</span>
                            <span className={styles.statValue}>{stats.total}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <Clock size={20} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>En Progreso</span>
                            <span className={styles.statValue}>{stats.inProgress}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <CheckCircle size={20} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Completados</span>
                            <span className={styles.statValue}>{stats.completed}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                            <AlertCircle size={20} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Pendientes</span>
                            <span className={styles.statValue}>{stats.pending}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Mis Cursos Asignados</h1>
                    <p className={styles.pageSubtitle}>
                        Gestiona tu avance y completa las capacitaciones programadas.
                    </p>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar curso..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className={styles.coursesGrid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={64} className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>No se encontraron cursos</h3>
                        <p className={styles.emptyText}>
                            {searchQuery ? 'Intenta con otro término de búsqueda' : 'No tienes cursos asignados en este momento'}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className={styles.coursesGrid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {filteredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                className={styles.courseCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleCourseClick(course)}
                            >
                                <div className={styles.courseHeader}>
                                    <div className={styles.courseIconWrapper}>
                                        <BookOpen size={24} />
                                    </div>
                                    {course.status === 'completed' && (
                                        <div className={styles.courseBadge}>
                                            <CheckCircle size={14} />
                                            Completado
                                        </div>
                                    )}
                                    {course.status === 'viewed' && (
                                        <div className={styles.courseBadgeProgress}>
                                            <Clock size={14} />
                                            En progreso
                                        </div>
                                    )}
                                </div>

                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                <p className={styles.courseDescription}>
                                    {course.description || 'Sin descripción disponible'}
                                </p>

                                <div className={styles.courseFooter}>
                                    <div className={styles.courseDate}>
                                        <Calendar size={14} />
                                        <span>
                                            {course.assignedAt?.toDate().toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            }) || 'Sin fecha'}
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className={styles.courseArrow} />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>

            {/* Course Modal */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCourse(null)}
                    >
                        <motion.div
                            className={styles.modalContent}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <div>
                                    <h2>{selectedCourse.title}</h2>
                                    {selectedCourse.duracionEstimada && (
                                        <div className={styles.modalDuration}>
                                            <Clock size={16} />
                                            <span>{selectedCourse.duracionEstimada} minutos</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className={styles.modalClose}
                                    onClick={() => setSelectedCourse(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                {/* Status badge */}
                                <div className={styles.statusBadgeWrapper}>
                                    {selectedCourse.status === 'completed' && (
                                        <div className={styles.statusBadgeCompleted}>
                                            <CheckCircle size={18} />
                                            Curso completado
                                        </div>
                                    )}
                                    {selectedCourse.status === 'viewed' && (
                                        <div className={styles.statusBadgeViewed}>
                                            <Clock size={18} />
                                            En progreso
                                        </div>
                                    )}
                                    {(!selectedCourse.status || selectedCourse.status === 'assigned') && (
                                        <div className={styles.statusBadgePending}>
                                            <AlertCircle size={18} />
                                            Pendiente
                                        </div>
                                    )}
                                </div>

                                {selectedCourse.description && (
                                    <p className={styles.modalDescription}>{selectedCourse.description}</p>
                                )}

                                {/* Course dates */}
                                <div className={styles.courseDates}>
                                    <div className={styles.dateItem}>
                                        <Calendar size={16} />
                                        <div>
                                            <span className={styles.dateLabel}>Asignado:</span>
                                            <span className={styles.dateValue}>
                                                {selectedCourse.assignedAt?.toDate().toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) || 'Sin fecha'}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedCourse.viewedAt && (
                                        <div className={styles.dateItem}>
                                            <Clock size={16} />
                                            <div>
                                                <span className={styles.dateLabel}>Visto por primera vez:</span>
                                                <span className={styles.dateValue}>
                                                    {selectedCourse.viewedAt?.toDate?.().toLocaleDateString('es-MX', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCourse.completedAt && (
                                        <div className={styles.dateItem}>
                                            <CheckCircle size={16} />
                                            <div>
                                                <span className={styles.dateLabel}>Completado:</span>
                                                <span className={styles.dateValue}>
                                                    {selectedCourse.completedAt?.toDate?.().toLocaleDateString('es-MX', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className={styles.courseActions}>
                                    {selectedCourse.contenidoUrl && (
                                        <a
                                            href={selectedCourse.contenidoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.actionBtnPrimary}
                                        >
                                            <BookOpen size={20} />
                                            Ver Presentación
                                        </a>
                                    )}

                                    {selectedCourse.examenUrl && (
                                        <a
                                            href={selectedCourse.examenUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.actionBtnSecondary}
                                        >
                                            <Award size={20} />
                                            Descargar Examen
                                        </a>
                                    )}
                                </div>

                                {selectedCourse.obligatorio && (
                                    <div className={styles.requiredBadge}>
                                        <AlertCircle size={16} />
                                        Este curso es obligatorio
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                {selectedCourse.status !== 'completed' ? (
                                    <button
                                        className={styles.completeBtn}
                                        onClick={() => handleMarkComplete(selectedCourse.assignmentId)}
                                    >
                                        <CheckCircle size={18} />
                                        Marcar como completado
                                    </button>
                                ) : (
                                    <div className={styles.completedMessage}>
                                        <CheckCircle size={20} />
                                        ¡Has completado este curso exitosamente!
                                    </div>
                                )}
                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => setSelectedCourse(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
