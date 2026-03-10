
import { useState, useEffect, useMemo } from 'react';
import {
    BADGES, CERTIFICATES,
    calculateLevel, getRankCurrent, getNextRank,
    XP_PER_COURSE
} from '@/utils/gamificationConfig';

/**
 * Hook de gamificación.
 * Recibe `trainingRecord` (de `training_records`) con el historial REAL
 * de cursos aprobados por el empleado, y `positionCourses` con los
 * cursos requeridos por su puesto.
 *
 * Base de cálculo:
 *  - XP: cursos aprobados en training_records (historial real)
 *  - allCompleted: todos los cursos del puesto han sido aprobados
 *  - allViewed: todos los cursos asignados en programacion han sido vistos/completados
 */
export function useGamification(user, courses = [], stats = {}, positionCourses = [], trainingRecord = null) {
    const [gamificationState, setGamificationState] = useState({
        level: 1,
        rank: null,
        nextRank: null,
        xp: 0,
        nextLevelXp: 0,
        progress: 0,
        badges: [],
        earnedBadgesCount: 0,
        certificates: [],
        earnedCertificatesCount: 0,
    });

    useEffect(() => {
        if (!user || !courses) return;

        // ── 1. Cursos aprobados (fuente de verdad: training_records) ────────
        // Si tenemos el registro real del sistema de capacitación, lo usamos.
        // Si no, caemos de vuelta a los cursos completados en programacion.
        const realApprovedCount = trainingRecord?.approvedCount ?? stats.completed ?? 0;

        // ── 2. allCompleted: se basa en cursos del puesto ───────────────────
        const posCompleted   = positionCourses.filter(c => c.completed).length;
        const posTotal       = positionCourses.length;
        const allCompleted   = posTotal > 0 ? posCompleted >= posTotal : (stats.completed > 0 && stats.completed >= stats.total);

        // ── 3. allViewed: sobre cursos de programacion ──────────────────────
        const viewedCount = courses.filter(c => c.status === 'viewed' || c.status === 'completed').length;
        const allViewed   = courses.length > 0 && viewedCount >= courses.length;

        // ── 4. Calcular XP ──────────────────────────────────────────────────
        let calculatedXP = 0;
        calculatedXP += realApprovedCount * XP_PER_COURSE;

        // Bonus XP por perfil
        if (user.avatar)                          calculatedXP += 50;
        if (user.nickname)                        calculatedXP += 50;

        // Base XP (primer login)
        calculatedXP += 100;

        // ── 5. Nivel y rango ────────────────────────────────────────────────
        const currentLevel  = calculateLevel(calculatedXP);
        const currentRank   = getRankCurrent(currentLevel);
        const nextRankObj   = getNextRank(currentLevel);

        // ── 6. Evaluar badges ───────────────────────────────────────────────
        const history = trainingRecord?.history || [];
        const evaluationStats = {
            completed:       realApprovedCount,
            hasPerfectScore: history.some(h => parseFloat(h.score || 0) >= 100),
            streak:          1,
            hasEarlyLogin:   new Date().getHours() < 8,
            hasLateLogin:    new Date().getHours() > 20,
            hasWeekendLogin: [0, 6].includes(new Date().getDay()),
            hasCustomAvatar: !!user.avatar,
            hasNickname:     !!user.nickname,
            level:           currentLevel,
            loginCount:      5,
            hasSafetyCourse: history.some(h =>
                h.status === 'approved' && (h.courseName || '').toLowerCase().includes('seguridad')
            ),
            hasQualityCourse: history.some(h =>
                h.status === 'approved' && (h.courseName || '').toLowerCase().includes('calidad')
            ),
            allViewed,
            allCompleted,
            earnedBadges: 0,
        };

        // Primera pasada
        const firstPassBadges  = BADGES.map(b => ({ ...b, unlocked: b.condition(evaluationStats) }));
        const firstPassEarned  = firstPassBadges.filter(b => b.unlocked).length;

        // Segunda pasada (badges que dependen de earnedBadges)
        evaluationStats.earnedBadges = firstPassEarned;
        const unlockedBadges   = BADGES.map(b => ({ ...b, unlocked: b.condition(evaluationStats) }));
        const earnedBadgesCount = unlockedBadges.filter(b => b.unlocked).length;
        evaluationStats.earnedBadges = earnedBadgesCount;

        // ── 7. Certificados ─────────────────────────────────────────────────
        const unlockedCertificates   = CERTIFICATES.map(c => ({ ...c, unlocked: c.condition(evaluationStats) }));
        const earnedCertificatesCount = unlockedCertificates.filter(c => c.unlocked).length;

        // ── 8. Progreso dentro del nivel ────────────────────────────────────
        const xpForCurrentLevel = (currentLevel - 1) * 200;
        const xpInCurrentLevel  = calculatedXP - xpForCurrentLevel;
        const levelProgress     = (xpInCurrentLevel / 200) * 100;

        setGamificationState({
            level: currentLevel,
            rank: currentRank,
            nextRank: nextRankObj,
            xp: calculatedXP,
            nextLevelXp: currentLevel * 200,
            progress: levelProgress,
            badges: unlockedBadges,
            earnedBadgesCount,
            certificates: unlockedCertificates,
            earnedCertificatesCount,
        });

    }, [user, courses, stats, positionCourses, trainingRecord]);

    return gamificationState;
}
