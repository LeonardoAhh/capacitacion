
import { useState, useEffect, useMemo } from 'react';
import { BADGES, calculateLevel, getRankCurrent, getNextRank, XP_PER_COURSE, XP_PER_LOGIN } from '@/utils/gamificationConfig';

export function useGamification(user, courses, stats) {
    const [gamificationState, setGamificationState] = useState({
        level: 1,
        rank: null,
        nextRank: null,
        xp: 0,
        nextLevelXp: 0,
        progress: 0,
        badges: [],
        earnedBadgesCount: 0
    });

    useEffect(() => {
        if (!user || !courses) return;

        // 1. Calculate XP (Simulated based on stats for now)
        // Real implementation would store XP in DB, here we derive it to be retroactive
        let calculatedXP = 0;

        // XP from Courses
        calculatedXP += (stats.completed || 0) * XP_PER_COURSE;

        // XP from Profile (Bonus)
        if (user.avatar) calculatedXP += 50;
        if (user.nickname) calculatedXP += 50;
        if (user.theme && user.theme !== 'light') calculatedXP += 50;

        // XP from Logins (Estimate or use session count if available, defaulting to 10 logins for demo)
        calculatedXP += 100; // Base XP for being here

        // 2. Determine Level and Ranks
        const currentLevel = calculateLevel(calculatedXP);
        const currentRank = getRankCurrent(currentLevel);
        const nextRankObj = getNextRank(currentLevel);

        // 3. Evaluate Badges
        // Build a stats object for the condition checkers
        const evaluationStats = {
            completed: stats.completed || 0,
            hasPerfectScore: false, // Need to implement quiz score tracking
            streak: 1, // Placeholder
            hasEarlyLogin: new Date().getHours() < 8,
            hasLateLogin: new Date().getHours() > 20,
            hasWeekendLogin: [0, 6].includes(new Date().getDay()),
            hasCustomTheme: user.theme && user.theme !== 'light',
            hasCustomAvatar: !!user.avatar,
            hasNickname: !!user.nickname,
            level: currentLevel,
            loginCount: 5, // Placeholder
            hasSafetyCourse: courses.some(c => c.title.toLowerCase().includes('seguridad') && c.status === 'completed'),
            hasQualityCourse: courses.some(c => c.title.toLowerCase().includes('calidad') && c.status === 'completed'),
        };

        const unlockedBadges = BADGES.map(badge => ({
            ...badge,
            unlocked: badge.condition(evaluationStats)
        }));

        // 4. Progress to next level/rank
        // Simplify: Level progress is just mod 200 since formula is linear
        const xpForCurrentLevel = (currentLevel - 1) * 200;
        const xpForNextLevel = currentLevel * 200;
        const xpInCurrentLevel = calculatedXP - xpForCurrentLevel;
        const levelProgress = (xpInCurrentLevel / 200) * 100;

        setGamificationState({
            level: currentLevel,
            rank: currentRank,
            nextRank: nextRankObj,
            xp: calculatedXP,
            nextLevelXp: xpForNextLevel,
            progress: levelProgress,
            badges: unlockedBadges,
            earnedBadgesCount: unlockedBadges.filter(b => b.unlocked).length
        });

    }, [user, courses, stats]);

    return gamificationState;
}
