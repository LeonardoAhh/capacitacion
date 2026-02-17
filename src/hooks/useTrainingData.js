import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchFreshProfile, fetchEmployeeCourses } from '@/lib/trainingDataService';
import { destroySession } from '@/lib/sessionApi';

export function useTrainingData() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
    });

    const calculateStats = useCallback((currentCourses) => {
        return {
            total: currentCourses.length,
            completed: currentCourses.filter(c => c.status === 'completed').length,
            inProgress: currentCourses.filter(c => c.status === 'viewed').length,
            pending: currentCourses.filter(c => !c.status || c.status === 'assigned').length
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (typeof window === 'undefined') return;

            const session = sessionStorage.getItem('training_session');
            if (!session) {
                router.push('/training/login');
                return;
            }

            const userData = JSON.parse(session);
            setUser(userData);

            try {
                // Fetch fresh profile from service
                const currentProfile = await fetchFreshProfile(userData);

                // Update local state and session if changed
                if (JSON.stringify(currentProfile) !== JSON.stringify(userData)) {
                    setUser(currentProfile);
                    sessionStorage.setItem('training_session', JSON.stringify(currentProfile));
                }

                // Fetch courses from service
                const coursesData = await fetchEmployeeCourses(currentProfile.id);
                setCourses(coursesData);
                setStats(calculateStats(coursesData));
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router, calculateStats]);

    const markAsViewed = useCallback(async (course) => {
        if (course.status !== 'viewed' && course.status !== 'completed') {
            try {
                // Optimistic update
                setCourses(prev => {
                    const newCourses = prev.map(c =>
                        c.assignmentId === course.assignmentId
                            ? { ...c, status: 'viewed', viewedAt: new Date() }
                            : c
                    );
                    setStats(calculateStats(newCourses));
                    return newCourses;
                });

                await updateDoc(doc(db, 'programacion', course.assignmentId), {
                    status: 'viewed',
                    viewedAt: new Date()
                });
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    }, [calculateStats]);

    const markAsCompleted = useCallback(async (assignmentId) => {
        try {
            // Optimistic update
            setCourses(prev => {
                const newCourses = prev.map(c =>
                    c.assignmentId === assignmentId
                        ? { ...c, status: 'completed', completedAt: new Date() }
                        : c
                );
                setStats(calculateStats(newCourses));
                return newCourses;
            });

            await updateDoc(doc(db, 'programacion', assignmentId), {
                status: 'completed',
                completedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error marking complete:', error);
            return false;
        }
    }, [calculateStats]);

    const updateTheme = useCallback(async (newTheme) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'employees_programacion', user.id);
            await updateDoc(userRef, { theme: newTheme });

            const updatedUser = { ...user, theme: newTheme };
            setUser(updatedUser);
            sessionStorage.setItem('training_session', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    }, [user]);

    const updateAvatar = useCallback(async (newAvatarUrl) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'employees_programacion', user.id);
            await updateDoc(userRef, { avatar: newAvatarUrl });

            const updatedUser = { ...user, avatar: newAvatarUrl };
            setUser(updatedUser);
            sessionStorage.setItem('training_session', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating avatar:', error);
        }
    }, [user]);

    const updateNickname = useCallback(async (newNickname) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'employees_programacion', user.id);
            await updateDoc(userRef, { nickname: newNickname });

            const updatedUser = { ...user, nickname: newNickname };
            setUser(updatedUser);
            sessionStorage.setItem('training_session', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating nickname:', error);
        }
    }, [user]);

    const logout = useCallback(async () => {
        if (typeof window !== 'undefined') {
            await destroySession();
            sessionStorage.removeItem('training_session');
            router.push('/training/login');
        }
    }, [router]);

    return {
        user,
        courses,
        loading,
        stats,
        markAsViewed,
        markAsCompleted,
        updateTheme,
        updateAvatar,
        updateNickname,
        logout
    };
}
