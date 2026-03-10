import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EXAMS_COLLECTION = 'examenes';

/**
 * Crea un nuevo examen como borrador en Firebase.
 * @param {Object} data - Datos del examen (sin id, sin status)
 * @param {string} userId - UID del creador
 * @returns {Promise<{success: boolean, examId: string, error?: string}>}
 */
export async function createExam(data, userId) {
    try {
        const ref = collection(db, EXAMS_COLLECTION);
        const docRef = await addDoc(ref, {
            ...data,
            status: 'draft',
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { success: true, examId: docRef.id };
    } catch (error) {
        console.error('Error creando examen:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza los datos de un examen existente.
 * @param {string} examId
 * @param {Object} data - Campos a actualizar
 */
export async function updateExam(examId, data) {
    try {
        const ref = doc(db, EXAMS_COLLECTION, examId);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando examen:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene un examen por ID.
 * @param {string} examId
 * @returns {Promise<Object | null>}
 */
export async function getExam(examId) {
    try {
        const ref = doc(db, EXAMS_COLLECTION, examId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    } catch (error) {
        console.error('Error obteniendo examen:', error);
        return null;
    }
}

/**
 * Lista todos los exámenes ordenados por fecha de actualización descendente.
 * @returns {Promise<Object[]>}
 */
export async function getAllExams() {
    try {
        const ref = collection(db, EXAMS_COLLECTION);
        const q = query(ref, orderBy('updatedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error listando exámenes:', error);
        return [];
    }
}

/**
 * Elimina un examen por ID.
 * @param {string} examId
 */
export async function deleteExam(examId) {
    try {
        await deleteDoc(doc(db, EXAMS_COLLECTION, examId));
        return { success: true };
    } catch (error) {
        console.error('Error eliminando examen:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Publica un examen (cambia status a "published").
 * @param {string} examId
 */
export async function publishExam(examId) {
    try {
        await updateDoc(doc(db, EXAMS_COLLECTION, examId), {
            status: 'published',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error publicando examen:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Convierte un examen publicado de nuevo a borrador.
 * @param {string} examId
 */
export async function unpublishExam(examId) {
    try {
        await updateDoc(doc(db, EXAMS_COLLECTION, examId), {
            status: 'draft',
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error despublicando examen:', error);
        return { success: false, error: error.message };
    }
}
