'use client';

import { useCallback } from 'react';
import { doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PASSING_SCORE, INDUCTION_COURSE_NAME } from '../utils/constants';

/**
 * Custom hook for managing course progress and completion
 * Extracts course-related logic from the main dashboard component
 * 
 * @param {Object} params Hook parameters
 * @param {Object} params.candidate Current candidate data
 * @param {Function} params.setCourseProgress State setter for course progress
 * @param {Function} params.setCandidate State setter for candidate
 * @returns {Object} Course progress handlers
 */
export function useCourseProgress({ candidate, setCourseProgress, setCandidate }) {

    /**
     * Mark a specific step as complete for a course
     */
    const markStepComplete = useCallback(async (courseId, step) => {
        // 1. Optimistic UI update
        setCourseProgress(prev => ({
            ...prev,
            [courseId]: {
                ...prev[courseId],
                [step]: true
            }
        }));

        // 2. Persist to Firestore
        if (!candidate?.id) return;

        try {
            const employeeRef = doc(db, 'employees', candidate.id);

            const updatePayload = {
                coursesProgress: {
                    [courseId]: {
                        [step]: true
                    }
                }
            };

            await setDoc(employeeRef, updatePayload, { merge: true });

            // Special handling for completion
            if (step === 'examDownloaded') {
                await updateDoc(employeeRef, {
                    cursosCompletados: arrayUnion(courseId)
                });

                setCandidate(prev => ({
                    ...prev,
                    cursosCompletados: [...(prev.cursosCompletados || []), courseId]
                }));
            }
        } catch (error) {
            console.error("Error saving progress:", error);
            // Optionally revert UI state on error
        }
    }, [candidate?.id, setCourseProgress, setCandidate]);

    /**
     * Toggle course completion status
     */
    const toggleCourseCompletion = useCallback(async (courseId, shouldMarkComplete) => {
        if (!candidate?.id) return;

        const currentCompleted = candidate.cursosCompletados || [];
        const newCompleted = shouldMarkComplete
            ? [...currentCompleted, courseId]
            : currentCompleted.filter(id => id !== courseId);

        // Optimistic update
        setCandidate(prev => ({ ...prev, cursosCompletados: newCompleted }));

        try {
            const employeeRef = doc(db, 'employees', candidate.id);
            await updateDoc(employeeRef, {
                cursosCompletados: shouldMarkComplete
                    ? arrayUnion(courseId)
                    : newCompleted
            });
        } catch (error) {
            console.error('Error updating course completion:', error);
            // Revert on error
            setCandidate(prev => ({ ...prev, cursosCompletados: currentCompleted }));
        }
    }, [candidate?.id, candidate?.cursosCompletados, setCandidate]);

    /**
     * Handle exam submission and score recording
     */
    const handleExamSubmit = useCallback(async (courseId, courseName, finalScore, answers) => {
        if (!candidate?.id) return;

        try {
            const employeeRef = doc(db, 'employees', candidate.id);

            // Update progress with exam score
            await setDoc(employeeRef, {
                coursesProgress: {
                    [courseId]: {
                        examScore: finalScore,
                        examCompleted: true,
                        examAnswers: answers,
                        examDate: new Date().toISOString()
                    }
                }
            }, { merge: true });

            // Update local state
            setCourseProgress(prev => ({
                ...prev,
                [courseId]: {
                    ...prev[courseId],
                    examScore: finalScore,
                    examCompleted: true
                }
            }));

            // If passed, mark course as completed
            if (finalScore >= PASSING_SCORE) {
                await updateDoc(employeeRef, {
                    cursosCompletados: arrayUnion(courseId)
                });

                setCandidate(prev => ({
                    ...prev,
                    cursosCompletados: [...(prev.cursosCompletados || []), courseId]
                }));
            }
        } catch (error) {
            console.error("Error submitting exam:", error);
        }
    }, [candidate?.id, setCourseProgress, setCandidate]);

    /**
     * Check if a step is unlocked based on previous progress
     */
    const isStepUnlocked = useCallback((courseProgress, courseId, step) => {
        const progress = courseProgress[courseId] || {};

        switch (step) {
            case 'step1':
                return true;
            case 'presentation':
                return progress.step1Completed;
            case 'step2':
                return progress.presentationCompleted;
            case 'exam':
                return progress.step2Completed;
            default:
                return false;
        }
    }, []);

    /**
     * Get current step number for a course
     */
    const getCurrentStepNumber = useCallback((courseProgress, courseId) => {
        const progress = courseProgress[courseId] || {};
        if (!progress.step1Completed) return 1;
        if (!progress.presentationCompleted) return 2;
        if (!progress.step2Completed) return 3;
        if (!progress.examDownloaded) return 4;
        return 4;
    }, []);

    /**
     * Check if a course is the induction course
     */
    const isInductionCourse = useCallback((courseName) => {
        return courseName?.toUpperCase().includes(INDUCTION_COURSE_NAME);
    }, []);

    return {
        markStepComplete,
        toggleCourseCompletion,
        handleExamSubmit,
        isStepUnlocked,
        getCurrentStepNumber,
        isInductionCourse,
        PASSING_SCORE
    };
}

export default useCourseProgress;
