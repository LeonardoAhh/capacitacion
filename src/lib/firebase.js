import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase desde variables de entorno
// Para desarrollo local, crea un archivo .env.local con estos valores
// Para Vercel, configura estas variables en el dashboard del proyecto
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyClXZHZb1Wdfxisdwc8RdBHOySFQkqaJnY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "capacitacion-18434.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "capacitacion-18434",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "capacitacion-18434.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "935733399914",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:935733399914:web:ec00baf34db1c40020d513"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
