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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { authenticator } from 'otplib';

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

                // Check if MFA is verified for this session
                // If MFA is NOT enabled, they are automatically verified.
                // If MFA IS enabled, they must have the session flag.
                const isMfaVerified = !userData.mfaEnabled || sessionStorage.getItem('mfa_verified') === 'true';

                setUser({ ...authUser, ...userData, isMfaVerified });
            } else {
                // New users or no-doc users are considered verified (basic access)
                setUser({ ...authUser, isMfaVerified: true });
            }
        } catch (e) {
            console.error("Error fetching user data", e);
            setUser({ ...authUser, isMfaVerified: true });
        }
    }

    const signIn = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const uid = result.user.uid;

            // Check Custom 2FA in Firestore
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.mfaEnabled && userData.mfaSecret) {
                    // 2FA Required - Return secret to client for verification
                    // NOTE: In a strictly secure env, verification should happen on server (Cloud Function).
                    // Here we verify on client for simplicity as requested.
                    return {
                        success: false,
                        mfaRequired: true,
                        uid: uid,
                        secret: userData.mfaSecret
                    };
                }
            }

            // If no 2FA, session is already valid via onAuthStateChanged
            return { success: true, user: result.user };

        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyOtp = async (token, secret) => {
        try {
            // Configure otplib options
            authenticator.options = {
                algorithm: 'sha1',
                digits: 6,
                period: 30,
                window: 1 // Allow 1 time step before/after for clock drift
            };

            // Verify the token
            const isValid = authenticator.check(token, secret);

            if (isValid) {
                // Determine current firebase user (should be signed in by now from first step)
                const currentUser = auth.currentUser;
                if (currentUser) {
                    // Mark session as verified
                    sessionStorage.setItem('mfa_verified', 'true');
                    await fetchAndSetUser(currentUser.uid, currentUser);
                    return { success: true };
                }
            }
            return { success: false, error: 'Código inválido' };
        } catch (error) {
            console.error("OTP Error:", error);
            return { success: false, error: 'Error verificando código' };
        }
    };

    const generateMfaSecret = async (currentUser) => {
        if (!currentUser) return { success: false, error: 'No user' };
        try {
            // Generate a random secret
            const secret = authenticator.generateSecret();

            // Generate the otpauth:// URI for QR code
            const otpauth = authenticator.keyuri(
                currentUser.email || 'Usuario',
                'VinoPlastic App',
                secret
            );

            return {
                success: true,
                secret: secret,
                qrCodeUrl: otpauth
            };
        } catch (error) {
            console.error("OTP Generate Error:", error);
            return { success: false, error: 'Error generando secreto: ' + error.message };
        }
    };

    const enrollMfa = async (currentUser, verificationCode, secretKey) => {
        try {
            // Configure otplib options
            authenticator.options = {
                algorithm: 'sha1',
                digits: 6,
                period: 30,
                window: 1
            };

            // Verify the token
            const isValid = authenticator.check(verificationCode, secretKey);

            if (!isValid) return { success: false, error: 'Código inválido' };

            // Save to Firestore
            await updateDoc(doc(db, 'users', currentUser.uid || currentUser.id), {
                mfaEnabled: true,
                mfaSecret: secretKey
            });

            // Update local state
            setUser(prev => ({ ...prev, mfaEnabled: true, mfaSecret: secretKey }));

            return { success: true };
        } catch (error) {
            console.error("OTP Enroll Error:", error);
            return { success: false, error: error.message };
        }
    }

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
        verifyOtp, // Changed from resolveMfa
        generateMfaSecret,
        enrollMfa,
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
