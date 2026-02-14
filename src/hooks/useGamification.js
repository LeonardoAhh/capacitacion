
import { useState, useEffect } from 'react';
import {
    BADGES, CERTIFICATES,
    calculateLevel, getRankCurrent, getNextRank,
    XP_PER_COURSE
} from '@/utils/gamificationConfig';

export function useGamification(user, courses, stats) {
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
        earnedCertificatesCount: 0
    });

    useEffect(() => {
        if (!user || !courses) return;

        // 1. Calculate XP
        let calculatedXP = 0;

        // XP from Courses
        calculatedXP += (stats.completed || 0) * XP_PER_COURSE;

        // XP from Profile (Bonus)
        if (user.avatar) calculatedXP += 50;
        if (user.nickname) calculatedXP += 50;
        if (user.theme && user.theme !== 'light') calculatedXP += 50;

        // Base XP
        calculatedXP += 100;

        // 2. Determine Level and Ranks
        const currentLevel = calculateLevel(calculatedXP);
        const currentRank = getRankCurrent(currentLevel);
        const nextRankObj = getNextRank(currentLevel);

        // 3. Derived stats for evaluation
        const totalCourses = courses.length;
        const completedCount = stats.completed || 0;
        const viewedCount = courses.filter(c => c.status === 'viewed' || c.status === 'completed').length;
        const allViewed = totalCourses > 0 && viewedCount >= totalCourses;
        const allCompleted = totalCourses > 0 && completedCount >= totalCourses;

        // 4. Evaluate Badges (first pass — without earnedBadges count)
        const evaluationStats = {
            completed: completedCount,
            hasPerfectScore: false,
            streak: 1,
            hasEarlyLogin: new Date().getHours() < 8,
            hasLateLogin: new Date().getHours() > 20,
            hasWeekendLogin: [0, 6].includes(new Date().getDay()),
            hasCustomTheme: user.theme && user.theme !== 'light',
            hasCustomAvatar: !!user.avatar,
            hasNickname: !!user.nickname,
            level: currentLevel,
            loginCount: 5,
            hasSafetyCourse: courses.some(c => c.title?.toLowerCase().includes('seguridad') && c.status === 'completed'),
            hasQualityCourse: courses.some(c => c.title?.toLowerCase().includes('calidad') && c.status === 'completed'),
            allViewed,
            allCompleted,
            earnedBadges: 0, // Placeholder, recalculated below
        };

        // First pass: evaluate badges without self-referential count
        const firstPassBadges = BADGES.map(badge => ({
            ...badge,
            unlocked: badge.condition(evaluationStats)
        }));
        const firstPassEarned = firstPassBadges.filter(b => b.unlocked).length;

        // Second pass: re-evaluate with actual earned count (for Collector/Completist badges)
        evaluationStats.earnedBadges = firstPassEarned;
        const unlockedBadges = BADGES.map(badge => ({
            ...badge,
            unlocked: badge.condition(evaluationStats)
        }));
        const earnedBadgesCount = unlockedBadges.filter(b => b.unlocked).length;

        // Update earnedBadges if changed after second pass
        evaluationStats.earnedBadges = earnedBadgesCount;

        // 5. Evaluate Certificates
        const unlockedCertificates = CERTIFICATES.map(cert => ({
            ...cert,
            unlocked: cert.condition(evaluationStats)
        }));
        const earnedCertificatesCount = unlockedCertificates.filter(c => c.unlocked).length;

        // 6. Progress to next level
        const xpForCurrentLevel = (currentLevel - 1) * 200;
        const xpInCurrentLevel = calculatedXP - xpForCurrentLevel;
        const levelProgress = (xpInCurrentLevel / 200) * 100;

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

    }, [user, courses, stats]);

    return gamificationState;
}
