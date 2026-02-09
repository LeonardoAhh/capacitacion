'use client';

import { useMemo } from 'react';

/**
 * Custom hook for memoized course filtering
 * Provides optimized course categorization without recalculation on every render
 * 
 * @param {Array} courses - List of all courses
 * @param {Object} candidate - Candidate data with completed courses
 * @param {Object} courseProgress - Progress tracking for courses
 * @returns {Object} Memoized course lists and stats
 */
export function useCourseFilters(courses, candidate, courseProgress) {

    // Memoized completed courses list
    const completedCourses = useMemo(() => {
        if (!courses || !candidate?.cursosCompletados) return [];
        return courses.filter(course =>
            candidate.cursosCompletados.includes(course.id)
        );
    }, [courses, candidate?.cursosCompletados]);

    // Memoized pending courses list
    const pendingCourses = useMemo(() => {
        if (!courses || !candidate?.cursosCompletados) return courses || [];
        return courses.filter(course =>
            !candidate.cursosCompletados.includes(course.id)
        );
    }, [courses, candidate?.cursosCompletados]);

    // Memoized in-progress courses (started but not completed)
    const inProgressCourses = useMemo(() => {
        if (!courses || !courseProgress) return [];
        return courses.filter(course => {
            const progress = courseProgress[course.id];
            const isCompleted = candidate?.cursosCompletados?.includes(course.id);
            const hasProgress = progress && Object.keys(progress).some(key => progress[key] === true);
            return hasProgress && !isCompleted;
        });
    }, [courses, courseProgress, candidate?.cursosCompletados]);

    // Memoized course statistics
    const courseStats = useMemo(() => {
        const total = courses?.length || 0;
        const completed = completedCourses.length;
        const pending = pendingCourses.length;
        const inProgress = inProgressCourses.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            pending,
            inProgress,
            percentage,
            isAllCompleted: completed === total && total > 0
        };
    }, [courses?.length, completedCourses.length, pendingCourses.length, inProgressCourses.length]);

    // Check if specific course is completed
    const isCourseCompleted = useMemo(() => {
        const completedSet = new Set(candidate?.cursosCompletados || []);
        return (courseId) => completedSet.has(courseId);
    }, [candidate?.cursosCompletados]);

    // Get course progress percentage
    const getCourseProgressPercentage = useMemo(() => {
        return (courseId) => {
            const progress = courseProgress[courseId];
            if (!progress) return 0;

            const steps = ['step1Completed', 'presentationCompleted', 'step2Completed', 'examDownloaded'];
            const completedSteps = steps.filter(step => progress[step] === true).length;
            return Math.round((completedSteps / steps.length) * 100);
        };
    }, [courseProgress]);

    return {
        completedCourses,
        pendingCourses,
        inProgressCourses,
        courseStats,
        isCourseCompleted,
        getCourseProgressPercentage
    };
}

export default useCourseFilters;
