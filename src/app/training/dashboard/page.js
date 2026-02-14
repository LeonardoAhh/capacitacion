'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import {
    BookOpen, LogOut, Search, GraduationCap, Clock, Award,
    User, Calendar, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import { useTrainingData } from '@/hooks/useTrainingData';
import { useTheme } from '@/contexts/ThemeContext';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector';
import SetupWizard from '@/components/SetupWizard/SetupWizard';
import UserMenu from '@/components/UserMenu/UserMenu';
import { useGamification } from '@/hooks/useGamification';
import LevelProgress from '@/components/Gamification/LevelProgress';
import BadgesGallery from '@/components/Gamification/BadgesGallery';
import CertificateCard from '@/components/Gamification/CertificateCard';
import { formatDisplayName } from '@/utils/nameUtils';
import {
    Drawer,

    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/Drawer/Drawer';
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import styles from './page.module.css';

const themeLineColors = {
    light: ["#e5e7eb", "#d1d5db", "#9ca3af"],
    dark: ["#3f3f46", "#52525b", "#71717a"],
    vinoplastic: ["#c7d2fe", "#a5b4fc", "#818cf8"],
    forest: ["#bbf7d0", "#86efac", "#4ade80"],
    ocean: ["#bae6fd", "#7dd3fc", "#38bdf8"],
    sunset: ["#fed7aa", "#fdba74", "#fb923c"],
};

// ─── Animation Variants ──────────────────────────────────────
const FADE_UP = {
    hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
};

const STAGGER_CONTAINER = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
};

const STAGGER_ITEM = {
    hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
};

const MODAL_OVERLAY = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15, delay: 0.05 } },
};

const MODAL_CONTENT = {
    hidden: { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
    visible: {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0, scale: 0.94, filter: 'blur(4px)',
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
};

export default function TrainingDashboard() {
    const { user, courses, loading, stats, markAsViewed, markAsCompleted, updateTheme, updateAvatar, updateNickname, logout } = useTrainingData();
    const { theme, setTheme, availableThemes } = useTheme();
    const gamification = useGamification(user, courses, stats);

    const [showWelcome, setShowWelcome] = useState(false);
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Check for welcome message/setup wizard and Theme
    useEffect(() => {
        if (user && typeof window !== 'undefined') {
            const hasSeenSetup = sessionStorage.getItem(`training_setup_${user.id}`);

            // If user already has a nickname (from DB), assume setup is done
            if (user.nickname && user.nickname.trim() !== '') {
                // optionally set the flag so it doesn't check again
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

            // Apply saved theme if exists
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
        // Optional: Open Welcome Drawer after Setup if desired
        setShowWelcome(true);
    };

    const handleThemeSave = async (newTheme) => {
        await updateTheme(newTheme);
    };

    const handleAvatarSave = async (newUrl) => {
        await updateAvatar(newUrl);
    };

    const handleCourseClick = (course) => {
        setSelectedCourse(course);
        markAsViewed(course);
    };

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

    return (
        <div className={styles.container}>
            <BackgroundLines
                colors={themeLineColors[theme] || themeLineColors.light}
                style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 }}
                svgOptions={{ duration: 15 }}
            />
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user.nickname || formatDisplayName(user.name)}
            />

            <SetupWizard
                isOpen={showSetupWizard}
                onClose={handleSetupClose}
                user={user}
                onUpdateAvatar={handleAvatarSave}
                onUpdateTheme={handleThemeSave}
                onUpdateNickname={updateNickname}
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
                                    sizes="80px"
                                    style={{ objectFit: 'cover' }}
                                    priority
                                    unoptimized
                                />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <DrawerTitle className={styles.welcomeTitle}>
                            ¡Bienvenido/a, {user.nickname || formatDisplayName(user.name)}!
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
            <nav className={styles.navbar} style={{ position: 'relative', zIndex: 100 }}>
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
            <main className={styles.main} style={{ position: 'relative', zIndex: 1 }}>

                {/* 1. GAMIFICATION: Level Progress (Tu Rango Actual) */}
                <motion.div
                    style={{ marginBottom: '1.5rem' }}
                    variants={FADE_UP}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                >
                    <LevelProgress
                        level={gamification.level}
                        rank={gamification.rank}
                        nextRank={gamification.nextRank}
                        xp={gamification.xp}
                        progress={gamification.progress}
                        earnedBadges={gamification.earnedBadgesCount}
                        totalBadges={gamification.badges.length}
                    />
                </motion.div>

                {/* 2. Badges Gallery (Medallas y Logros) */}
                <motion.div
                    variants={FADE_UP}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                >
                    <BadgesGallery badges={gamification.badges} />
                </motion.div>

                {/* 3. Certificates Gallery (Mis Certificados) */}
                <motion.div
                    variants={FADE_UP}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                >
                    <CertificateCard
                        certificates={gamification.certificates}
                        userName={user.name?.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || ''}
                    />
                </motion.div>

                {/* 4. Mis Cursos Asignados */}
                <motion.div
                    className={styles.header}
                    variants={FADE_UP}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                >
                    <h1 className={styles.pageTitle}>Mis Cursos Asignados</h1>
                    <p className={styles.pageSubtitle}>
                        Gestiona tu avance y completa las capacitaciones programadas.
                    </p>
                </motion.div>

                {/* Controls */}
                <motion.div
                    className={styles.controls}
                    variants={FADE_UP}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                >
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
                </motion.div>

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
                        variants={STAGGER_CONTAINER}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredCourses.map((course) => (
                            <motion.button
                                key={course.id}
                                className={styles.courseCard}
                                variants={STAGGER_ITEM}
                                onClick={() => handleCourseClick(course)}
                                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className={styles.courseHeader}>
                                    <div className={styles.courseIconWrapper}>
                                        <BookOpen size={22} />
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
                            </motion.button>
                        ))}
                    </motion.div>
                )}

            </main>

            {/* Course Modal */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        className={styles.modalOverlay}
                        variants={MODAL_OVERLAY}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => setSelectedCourse(null)}
                    >
                        <motion.div
                            className={styles.modalContent}
                            variants={MODAL_CONTENT}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
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
