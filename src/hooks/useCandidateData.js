import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';

export function useCandidateData() {
    const router = useRouter();
    const { setTheme } = useTheme();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            if (typeof window === 'undefined') return;

            const session = sessionStorage.getItem('candidate_session');
            if (!session) {
                // If not session, let the page handle redirect or show nothing
                setLoading(false);
                return;
            }

            let candidateData = JSON.parse(session);

            // Optimistic set
            setCandidate(candidateData);

            // Apply theme immediately if exists in session
            if (candidateData.theme) {
                setTheme(candidateData.theme);
            }

            try {
                // Fetch fresh data from Firestore
                const docRef = doc(db, 'employees', candidateData.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const freshData = docSnap.data();

                    // Merge session data with fresh data (fresh data takes precedence)
                    const newCandidateData = {
                        ...candidateData,
                        ...freshData,
                        // Ensure critical fields are preserved if missing in fresh data (shouldn't happen but safe)
                        id: candidateData.id
                    };

                    // Check for changes to update state
                    if (JSON.stringify(newCandidateData) !== JSON.stringify(candidateData)) {
                        setCandidate(newCandidateData);
                        sessionStorage.setItem('candidate_session', JSON.stringify(newCandidateData));

                        // Update theme if changed in DB
                        if (freshData.theme && freshData.theme !== candidateData.theme) {
                            setTheme(freshData.theme);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading candidate data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [setTheme]); // Removed router dependency to avoid verify loops

    // Update Theme
    const updateTheme = useCallback(async (newTheme) => {
        if (!candidate?.id) return;

        try {
            // Optimistic update
            const updatedCandidate = { ...candidate, theme: newTheme };
            setCandidate(updatedCandidate);
            sessionStorage.setItem('candidate_session', JSON.stringify(updatedCandidate));
            setTheme(newTheme);

            // DB Update
            const userRef = doc(db, 'employees', candidate.id);
            await updateDoc(userRef, { theme: newTheme });
        } catch (error) {
            console.error('Error updating theme:', error);
            // Revert on error could be added here
        }
    }, [candidate, setTheme]);

    // Update Avatar
    const updateAvatar = useCallback(async (newAvatarUrl) => {
        if (!candidate?.id) return;

        try {
            const updatedCandidate = { ...candidate, avatar: newAvatarUrl };
            setCandidate(updatedCandidate);
            sessionStorage.setItem('candidate_session', JSON.stringify(updatedCandidate));

            const userRef = doc(db, 'employees', candidate.id);
            await updateDoc(userRef, { avatar: newAvatarUrl });
        } catch (error) {
            console.error('Error updating avatar:', error);
        }
    }, [candidate]);

    // Update Nickname
    const updateNickname = useCallback(async (newNickname) => {
        if (!candidate?.id) return;

        try {
            const updatedCandidate = { ...candidate, nickname: newNickname };
            setCandidate(updatedCandidate);
            sessionStorage.setItem('candidate_session', JSON.stringify(updatedCandidate));

            const userRef = doc(db, 'employees', candidate.id);
            await updateDoc(userRef, { nickname: newNickname });
        } catch (error) {
            console.error('Error updating nickname:', error);
        }
    }, [candidate]);

    return {
        candidate,
        loading,
        setCandidate, // Expose setter for other localized updates if needed
        updateTheme,
        updateAvatar,
        updateNickname
    };
}
