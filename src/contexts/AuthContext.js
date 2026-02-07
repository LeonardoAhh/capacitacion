'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    signInAnonymously
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (item) => {
            if (item) {
                if (item.isAnonymous) {
                    setUser({ ...item, rol: 'demo' });
                } else {
                    // Fetch User Details using item.uid (which is the uid from firebase auth)
                    await fetchAndSetUser(item.uid, item);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const fetchAndSetUser = async (uid, authUser) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({ ...authUser, ...userData });
            } else {
                // New users without doc
                setUser({ ...authUser });
            }
        } catch (e) {
            console.error("Error fetching user data", e);
            setUser({ ...authUser });
        }
    }

    const signIn = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            // Simple login, no MFA check
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signInWithGoogle = async () => {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const provider = new GoogleAuthProvider();

            // Opcional: forzar selección de cuenta
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Verificar si el usuario ya existe en Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // Usuario NO autorizado - cerrar sesión y rechazar acceso
                await firebaseSignOut(auth);

                return {
                    success: false,
                    error: 'Acceso no autorizado. Tu cuenta de Google no tiene permisos para acceder a esta aplicación. Contacta al administrador.'
                };
            }

            // Usuario autorizado (ya existe en Firestore)
            return { success: true, user: result.user, isNewUser: false };
        } catch (error) {
            console.error("Google Sign-In Error:", error);

            // Manejar cancelación del popup
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return { success: false, error: 'Inicio de sesión cancelado' };
            }

            return { success: false, error: 'Error al iniciar sesión con Google' };
        }
    };

    const signUp = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signOut = async () => {
        try {
            sessionStorage.removeItem('mfa_verified');
            await firebaseSignOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signInAnon = async () => {
        try {
            const result = await signInAnonymously(auth);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Check if user has write permissions (only super_admin can write)
    const canWrite = () => {
        return user?.rol === 'super_admin';
    };

    // Generic profile update
    const updateUserProfile = async (uid, data) => {
        try {
            if (!uid) throw new Error("No User ID provided");

            // Update Firestore
            await updateDoc(doc(db, 'users', uid), data);

            // Update local state
            setUser(prev => ({ ...prev, ...data }));

            return { success: true };
        } catch (error) {
            console.error("Profile Update Error:", error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signInWithGoogle, // Google Sign-In
        updateUserProfile,
        signInAnon,
        signUp,
        signOut,
        canWrite
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
