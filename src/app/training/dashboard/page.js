'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    BookOpen, LogOut, Search, GraduationCap, Clock, Award,
    User, Calendar, CheckCircle, AlertCircle, ChevronRight, Zap
} from 'lucide-react';
import { useTrainingData } from '@/hooks/useTrainingData';
import { useTheme } from '@/contexts/ThemeContext';
import SetupWizard from '@/components/SetupWizard/SetupWizard';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector';
import UserMenu from '@/components/UserMenu/UserMenu';
import { useGamification } from '@/hooks/useGamification';
import LevelProgress from '@/components/Gamification/LevelProgress';
import BadgesGallery from '@/components/Gamification/BadgesGallery';
import CertificateCard from '@/components/Gamification/CertificateCard';
import TrainingCompliance from '@/components/Gamification/TrainingCompliance';
import { formatDisplayName } from '@/utils/nameUtils';
import CoursePlayer from '@/components/Courses/CoursePlayer';
import { getCourseWithSlides } from '@/lib/courseService';
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
    const { user, courses, loading, stats, markAsViewed, markAsCompleted, updateTheme, updateAvatar, updateNickname, logout } = useTrainingData();
    const { theme, setTheme, availableThemes } = useTheme();
    const gamification = useGamification(user, courses, stats);

    const [showWelcome, setShowWelcome] = useState(false);
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [playerData, setPlayerData] = useState(null);

    useEffect(() => {
        if (user && typeof window !== 'undefined') {
            const hasSeenSetup = sessionStorage.getItem(`training_setup_${user.id}`);

            if (user.nickname && user.nickname.trim() !== '') {
                if (!hasSeenSetup) {
                    sessionStorage.setItem(`training_setup_${user.id}`, 'true');
                }

                const hasSeenWelcome = sessionStorage.getItem(`training_welcome_${user.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            } else if (!hasSeenSetup) {
                setShowSetupWizard(true);
            } else {
                const hasSeenWelcome = sessionStorage.getItem(`training_welcome_${user.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            }

            if (user.theme) {
                setTheme(user.theme);
            }
        }
    }, [user, setTheme]);

    const handleWelcomeClose = () => {
        if (user) {
            sessionStorage.setItem(`training_welcome_${user.id}`, 'true');
        }
        setShowWelcome(false);
    };

    const handleSetupClose = async () => {
        if (user) {
            sessionStorage.setItem(`training_setup_${user.id}`, 'true');
        }
        setShowSetupWizard(false);
        setShowWelcome(true);
    };

    const handleThemeSave = async (newTheme) => {
        await updateTheme(newTheme);
    };

    const handleAvatarSave = async (newUrl) => {
        await updateAvatar(newUrl);
    };

    const handleCourseClick = useCallback(async (course) => {
        // Si es curso interactivo, abrir el CoursePlayer directamente
        if (course.nativeCourseId || course.tipo === 'native') {
            markAsViewed(course);
            const result = await getCourseWithSlides(course.nativeCourseId);
            if (result.success) {
                setPlayerData(result.data);
            }
            return;
        }
        setSelectedCourse(course);
        markAsViewed(course);
    }, [markAsViewed]);

    const handlePlayNativeFromModal = useCallback(async (courseId) => {
        const result = await getCourseWithSlides(courseId);
        if (result.success) {
            setSelectedCourse(null);
            setPlayerData(result.data);
        }
    }, []);

    const handleMarkComplete = async (assignmentId) => {
        const success = await markAsCompleted(assignmentId);
        if (success) {
            setSelectedCourse(null);
        }
    };

    const filteredCourses = useMemo(() => {
        if (!searchQuery) return courses;
        const lowerQuery = searchQuery.toLowerCase();
        return courses.filter(course =>
            course.title?.toLowerCase().includes(lowerQuery) ||
            course.description?.toLowerCase().includes(lowerQuery)
        );
    }, [courses, searchQuery]);

    if (!user) return null;

    // Si el CoursePlayer está activo, renderizar solo él
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
            <SetupWizard
                isOpen={showSetupWizard}
                onClose={handleSetupClose}
                user={user}
                onUpdateAvatar={handleAvatarSave}
                onUpdateTheme={handleThemeSave}
                onUpdateNickname={updateNickname}
            />

            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user.nickname || formatDisplayName(user.name)}
            />

            {/* Welcome Drawer */}
            <Drawer open={showWelcome} onOpenChange={setShowWelcome}>
                <DrawerContent className={styles.welcomeDrawerContent}>
                    <DrawerHeader className={styles.welcomeDrawerHeader}>
                        <div className={styles.welcomeAvatar}>
                            {user.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt="Avatar"
                                    fill
                                    sizes="64px"
                                    style={{ objectFit: 'cover' }}
                                    priority
                                    unoptimized
                                />
                            ) : (
                                <User size={28} />
                            )}
                        </div>
                        <DrawerTitle className={styles.welcomeTitle}>
                            Bienvenido/a, {user.nickname || formatDisplayName(user.name)}
                        </DrawerTitle>
                        <DrawerDescription className={styles.welcomeText}>
                            Nos alegra tenerte en el Portal de Capacitación de Viñoplastic.
                        </DrawerDescription>
                        <DrawerClose />
                    </DrawerHeader>

                    <div className={styles.welcomeDrawerBody}>
                        <div className={styles.welcomeInfo}>
                            <div className={styles.infoItem}>
                                <User size={18} />
                                <div>
                                    <span className={styles.infoLabel}>Tu puesto</span>
                                    <span className={styles.infoValue}>{user.position}</span>
                                </div>
                            </div>

                            <div className={styles.infoItem}>
                                <BookOpen size={18} />
                                <div>
                                    <span className={styles.infoLabel}>Cursos</span>
                                    <span className={styles.infoValue}>{stats.total} asignados</span>
                                </div>
                            </div>
                        </div>

                        <p className={styles.welcomeSubtext}>
                            Completa cada módulo para mejorar tus habilidades y avanzar en tu desarrollo profesional.
                        </p>
                    </div>

                    <DrawerFooter className={styles.welcomeDrawerFooter}>
                        <button className={styles.welcomeBtn} onClick={handleWelcomeClose}>
                            <GraduationCap size={18} />
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
                            <GraduationCap size={22} />
                        </div>
                        <div className={styles.navTexts}>
                            <span className={styles.navTitle}>Portal de Capacitación</span>
                            <span className={styles.navCompany}>VIÑOPLASTIC</span>
                        </div>
                    </div>

                    <div className={styles.navActions}>
                        <UserMenu
                            user={user}
                            onLogout={logout}
                            onAvatarClick={() => setShowAvatarSelector(true)}
                            onThemeChange={updateTheme}
                        />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Level Progress */}
                <LevelProgress
                    level={gamification.level}
                    rank={gamification.rank}
                    nextRank={gamification.nextRank}
                    xp={gamification.xp}
                    progress={gamification.progress}
                    earnedBadges={gamification.earnedBadgesCount}
                    totalBadges={gamification.badges.length}
                />

                {/* Badges Gallery */}
                <BadgesGallery badges={gamification.badges} />

                {/* Certificates */}
                <CertificateCard
                    certificates={gamification.certificates}
                    userName={user.name?.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || ''}
                />

                {/* Compliance */}
                <TrainingCompliance user={user} />

                {/* Courses Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Mis Cursos Asignados</h1>
                    <p className={styles.pageSubtitle}>
                        Gestiona tu avance y completa las capacitaciones programadas.
                    </p>
                </div>

                {/* Search */}
                <div className={styles.controls}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={16} />
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
                        <BookOpen size={48} className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>
                            {searchQuery ? 'No se encontraron cursos' : 'Sin cursos asignados'}
                        </h3>
                        <p className={styles.emptyText}>
                            {searchQuery
                                ? 'Intenta con otro término de búsqueda'
                                : 'Actualmente no tienes capacitaciones pendientes.'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.coursesGrid}>
                        {filteredCourses.map((course) => (
                            <button
                                key={course.id}
                                className={styles.courseCard}
                                onClick={() => handleCourseClick(course)}
                            >
                                <div className={styles.courseHeader}>
                                    <div className={styles.courseIconWrapper}>
                                        <BookOpen size={20} />
                                    </div>
                                    {course.status === 'completed' && (
                                        <div className={styles.courseBadge}>
                                            <CheckCircle size={12} />
                                            Completado
                                        </div>
                                    )}
                                    {course.status === 'viewed' && (
                                        <div className={styles.courseBadgeProgress}>
                                            <Clock size={12} />
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
                                    <ChevronRight size={16} className={styles.courseArrow} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* Course Modal */}
            {selectedCourse && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedCourse(null)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>{selectedCourse.title}</h2>
                                {selectedCourse.duracionEstimada && (
                                    <div className={styles.modalDuration}>
                                        <Clock size={14} />
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
                            <div className={styles.statusBadgeWrapper}>
                                {selectedCourse.status === 'completed' && (
                                    <div className={styles.statusBadgeCompleted}>
                                        <CheckCircle size={16} />
                                        Curso completado
                                    </div>
                                )}
                                {selectedCourse.status === 'viewed' && (
                                    <div className={styles.statusBadgeViewed}>
                                        <Clock size={16} />
                                        En progreso
                                    </div>
                                )}
                                {(!selectedCourse.status || selectedCourse.status === 'assigned') && (
                                    <div className={styles.statusBadgePending}>
                                        <AlertCircle size={16} />
                                        Pendiente
                                    </div>
                                )}
                            </div>

                            {selectedCourse.description && (
                                <p className={styles.modalDescription}>{selectedCourse.description}</p>
                            )}

                            <div className={styles.courseDates}>
                                <div className={styles.dateItem}>
                                    <Calendar size={14} />
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
                                        <Clock size={14} />
                                        <div>
                                            <span className={styles.dateLabel}>Visto:</span>
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
                                        <CheckCircle size={14} />
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

                            <div className={styles.courseActions}>
                                {/* Curso interactivo nativo */}
                                {(selectedCourse.nativeCourseId || selectedCourse.tipo === 'native') ? (
                                    <button
                                        className={styles.actionBtnPrimary}
                                        style={{ border: 'none', cursor: 'pointer' }}
                                        onClick={() => handlePlayNativeFromModal(selectedCourse.nativeCourseId)}
                                    >
                                        <Zap size={16} />
                                        Abrir Curso Interactivo
                                    </button>
                                ) : selectedCourse.contenidoUrl ? (
                                    <a
                                        href={selectedCourse.contenidoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.actionBtnPrimary}
                                    >
                                        <BookOpen size={16} />
                                        Ver Presentación
                                    </a>
                                ) : null}

                                {selectedCourse.examenUrl && (
                                    <a
                                        href={selectedCourse.examenUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.actionBtnSecondary}
                                    >
                                        <Award size={16} />
                                        Descargar Examen
                                    </a>
                                )}
                            </div>

                            {selectedCourse.obligatorio && (
                                <div className={styles.requiredBadge}>
                                    <AlertCircle size={14} />
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
                                    <CheckCircle size={16} />
                                    Marcar como completado
                                </button>
                            ) : (
                                <div className={styles.completedMessage}>
                                    <CheckCircle size={18} />
                                    Has completado este curso
                                </div>
                            )}
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setSelectedCourse(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
