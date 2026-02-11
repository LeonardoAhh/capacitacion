import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
        const fetchData = async () => {
            if (typeof window === 'undefined') return;

            const session = sessionStorage.getItem('training_session');
            if (!session) {
                router.push('/training/login');
                return;
            }

            // 1. Initial Load from Session
            const userData = JSON.parse(session);
            setUser(userData);

            try {
                // 2. Fetch fresh Profile Data (Avatar, Nickname, Theme)
                // This ensures we have the latest data even if session is stale
                const userDocRef = doc(db, 'employees_programacion', userData.id);
                const userDocSnap = await getDoc(userDocRef);

                let currentProfile = { ...userData };

                if (userDocSnap.exists()) {
                    const freshData = userDocSnap.data();
                    currentProfile = {
                        ...currentProfile,
                        nickname: freshData.nickname || currentProfile.nickname,
                        avatar: freshData.avatar || currentProfile.avatar,
                        theme: freshData.theme || currentProfile.theme
                    };

                    // Update local state and session if changed
                    if (JSON.stringify(currentProfile) !== JSON.stringify(userData)) {
                        setUser(currentProfile);
                        sessionStorage.setItem('training_session', JSON.stringify(currentProfile));
                    }
                }

                // 3. Fetch Courses using the (potentially updated) ID
                const progRef = collection(db, 'programacion');
                const q = query(progRef, where('employeeId', '==', currentProfile.id));
                const progSnap = await getDocs(q);

                if (progSnap.empty) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // Optimization: In a real app with many courses, request only needed IDs or use limited batches.
                // For now, keeping the Promise.all pattern but it's isolated here.
                const coursesData = await Promise.all(progSnap.docs.map(async (pDoc) => {
                    const progData = pDoc.data();
                    // We could implement a cache here if needed, but for now direct fetch
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
                setStats(calculateStats(coursesData));
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
                // Revert optimistic update if needed, but for now keeping error log
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

        // Optimistic update handled by ThemeContext or local state if needed
        try {
            // Check if user is in 'employees_programacion' or just session
            // We assume 'employees_programacion' based on login logic
            const userRef = doc(db, 'employees_programacion', user.id);
            await updateDoc(userRef, {
                theme: newTheme
            });

            // Update session storage to persist across reloads without refetching immediately
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
            await updateDoc(userRef, {
                avatar: newAvatarUrl
            });

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
            await updateDoc(userRef, {
                nickname: newNickname
            });

            const updatedUser = { ...user, nickname: newNickname };
            setUser(updatedUser);
            sessionStorage.setItem('training_session', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating nickname:', error);
        }
    }, [user]);

    const logout = useCallback(() => {
        if (typeof window !== 'undefined') {
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
