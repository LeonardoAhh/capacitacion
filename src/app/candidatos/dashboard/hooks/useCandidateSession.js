'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
    TIMEOUT_DURATION_MS,
    ONE_MINUTE_MS,
    FIVE_MINUTES_MS,
    TIMER_COLORS,
    SESSION_KEYS,
    ROUTES
} from '../utils/constants';

/**
 * Custom hook for managing candidate session state and timer
 * Extracts session logic from the main dashboard component
 * 
 * @returns {Object} Session state and handlers
 */
export function useCandidateSession() {
    const router = useRouter();

    // State
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION_MS);
    const [courseProgress, setCourseProgress] = useState({});

    // Memoized time formatting
    const formattedTime = useMemo(() => {
        const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    // Memoized timer color based on remaining time
    const timerColor = useMemo(() => {
        if (timeLeft < ONE_MINUTE_MS) return TIMER_COLORS.DANGER;
        if (timeLeft < FIVE_MINUTES_MS) return TIMER_COLORS.WARNING;
        return TIMER_COLORS.DEFAULT;
    }, [timeLeft]);

    // Logout handler
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem(SESSION_KEYS.CANDIDATE_SESSION);
            sessionStorage.removeItem(SESSION_KEYS.SESSION_EXPIRY);
            router.push(ROUTES.HOME);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            sessionStorage.removeItem(SESSION_KEYS.CANDIDATE_SESSION);
            sessionStorage.removeItem(SESSION_KEYS.SESSION_EXPIRY);
            router.push(ROUTES.HOME);
        }
    }, [router]);

    // Fetch fresh data from Firestore
    const fetchFreshData = useCallback(async (candidateId) => {
        try {
            const docRef = doc(db, 'employees', candidateId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const freshData = docSnap.data();
                setCandidate(prev => ({ ...prev, ...freshData }));
                if (freshData.coursesProgress) {
                    setCourseProgress(freshData.coursesProgress);
                }
                // Update session storage
                const currentSession = sessionStorage.getItem(SESSION_KEYS.CANDIDATE_SESSION);
                if (currentSession) {
                    const parsed = JSON.parse(currentSession);
                    const newSession = { ...parsed, ...freshData };
                    sessionStorage.setItem(SESSION_KEYS.CANDIDATE_SESSION, JSON.stringify(newSession));
                }
            }
        } catch (error) {
            console.error("Error loading fresh data:", error);
        }
    }, []);

    // Initialize session and timer
    useEffect(() => {
        // Verify session
        const session = sessionStorage.getItem(SESSION_KEYS.CANDIDATE_SESSION);
        if (!session) {
            router.push(ROUTES.CANDIDATES_LOGIN);
            return;
        }

        const candidateData = JSON.parse(session);
        setCandidate(candidateData);

        // Fetch fresh data
        fetchFreshData(candidateData.id);

        // Session Timeout Logic
        let intervalId;

        const startTimer = () => {
            let storedExpiry = sessionStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
            let expiryTime;

            if (storedExpiry) {
                expiryTime = parseInt(storedExpiry, 10);
            } else {
                expiryTime = Date.now() + TIMEOUT_DURATION_MS;
                sessionStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, expiryTime.toString());
            }

            const tick = () => {
                const now = Date.now();
                const remaining = expiryTime - now;

                if (remaining <= 0) {
                    clearInterval(intervalId);
                    setTimeLeft(0);
                    handleLogout();
                    return;
                }
                setTimeLeft(remaining);
            };

            tick();
            intervalId = setInterval(tick, 1000);
        };

        startTimer();
        setLoading(false);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [router, handleLogout, fetchFreshData]);

    // Update candidate state
    const updateCandidate = useCallback((updates) => {
        setCandidate(prev => ({ ...prev, ...updates }));
    }, []);

    // Update course progress state
    const updateCourseProgress = useCallback((courseId, stepUpdates) => {
        setCourseProgress(prev => ({
            ...prev,
            [courseId]: {
                ...prev[courseId],
                ...stepUpdates
            }
        }));
    }, []);

    return {
        // State
        candidate,
        loading,
        timeLeft,
        formattedTime,
        timerColor,
        courseProgress,

        // Actions
        handleLogout,
        updateCandidate,
        updateCourseProgress,
        setCourseProgress,
        setCandidate,
        setLoading
    };
}

