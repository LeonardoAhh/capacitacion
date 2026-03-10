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
    where,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EXAMS_COLLECTION = 'examenes';

/**
 * Obtiene los exámenes publicados aplicables a un puesto específico.
 * Utilizado en el portal de candidatos.
 * @param {string} position - Nombre del puesto
 * @returns {Promise<Array>}
 */
export async function getPublishedExamsForPosition(position) {
    try {
        const ref = collection(db, EXAMS_COLLECTION);
        const q = query(
            ref,
            where('status', '==', 'published')
        );
        const snap = await getDocs(q);
        
        const exams = [];
        snap.docs.forEach(doc => {
            const data = doc.data();
            const puestos = data.puestosAplicables || [];
            if (puestos.includes(position)) {
                exams.push({ id: doc.id, ...data });
            }
        });

        // Ordenar alfabéticamente
        return exams.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } catch (error) {
        console.error('Error fetching published exams for position:', error);
        return [];
    }
}

/**
 * Sincroniza el campo puestosAplicables de un examen o de todos los exámenes publicados
 * leyendo la colección `positions` y buscando coincidencias exactas del título del examen
 * dentro del array `requiredCourses` o `requiredExams` de cada posición.
 * 
 * @param {string} [examId] - Si se provee, solo sincroniza ese examen. Si no, sincroniza todos los publicados.
 */
export async function syncExamPuestosFromPositions(examId = null) {
    try {
        // 1. Obtener todas las posiciones
        const positionsSnap = await getDocs(collection(db, 'positions'));
        const allPositions = positionsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.id,
            requiredCourses: doc.data().requiredCourses || [] // Aquí se guardan los títulos de cursos/exámenes
        }));

        // 2. Obtener los exámenes a actualizar
        let examsQuery;
        if (examId) {
            examsQuery = doc(db, EXAMS_COLLECTION, examId);
        } else {
            // Solo sincronizamos los exámenes que no estén eliminados (draft o published)
            examsQuery = collection(db, EXAMS_COLLECTION);
        }

        const examsSnap = examId ? await getDoc(examsQuery) : await getDocs(examsQuery);
        const examsArray = examId ? (examsSnap.exists() ? [examsSnap] : []) : examsSnap.docs;

        if (examsArray.length === 0) return { success: true, updatedCount: 0 };

        // 3. Preparar batch
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const examDoc of examsArray) {
            const examData = examDoc.data();
            const examTitle = examData.title;

            if (!examTitle) continue;

            const matchingPositions = allPositions
                .filter(p => p.requiredCourses.includes(examTitle))
                .map(p => p.name);
            
            // Ordenar alfabéticamente
            matchingPositions.sort((a, b) => a.localeCompare(b));

            // Solo actualizar si hay cambios
            const currentPuestos = examData.puestosAplicables || [];
            const hasChanged = 
                currentPuestos.length !== matchingPositions.length ||
                !currentPuestos.every((val, index) => val === matchingPositions[index]);

            if (hasChanged) {
                batch.update(examDoc.ref, { 
                    puestosAplicables: matchingPositions,
                    updatedAt: serverTimestamp() 
                });
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            await batch.commit();
        }

        return { success: true, updatedCount };
    } catch (error) {
        console.error('Error sincronizando puestos para exámenes:', error);
        return { success: false, error: error.message };
    }
}

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
            puestosAplicables: data.puestosAplicables || [], // Asegurar inicialización
            status: 'draft',
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        // Sincronizar puestos iniciales en background
        if (data.title) {
            syncExamPuestosFromPositions(docRef.id).catch(console.error);
        }

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
        
        // Si se actualizó el título, resincronizar los puestos por si coinciden distinto
        if (data.title) {
            syncExamPuestosFromPositions(examId).catch(console.error);
        }

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

        // Asegurar que al publicar, los puestos estén 100% correctos
        await syncExamPuestosFromPositions(examId);

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

/**
 * Duplica un examen existente como nuevo borrador.
 * @param {Object} exam - Objeto completo del examen
 * @param {string} userId
 */
export async function duplicateExam(exam, userId) {
    const { id, createdAt, updatedAt, publishedAt, status, ...data } = exam;
    return createExam({
        ...data,
        title: `Copia de ${data.title || 'Sin título'}`,
    }, userId);
}

/**
 * Guarda un snapshot del examen en su subcolección /historial.
 * Se llama automáticamente al publicar para mantener el historial de versiones.
 * @param {string} examId
 * @param {Object} examData - Estado del examen al momento de publicar
 * @param {string} userId
 */
export async function saveExamSnapshot(examId, examData, userId) {
    try {
        const historialRef = collection(db, EXAMS_COLLECTION, examId, 'historial');
        const { id, ...data } = examData;
        await addDoc(historialRef, {
            ...data,
            savedBy: userId,
            savedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error guardando snapshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el historial de versiones publicadas de un examen, ordenado por fecha descendente.
 * @param {string} examId
 * @returns {Promise<Object[]>}
 */
export async function getExamHistory(examId) {
    try {
        const ref = collection(db, EXAMS_COLLECTION, examId, 'historial');
        const q = query(ref, orderBy('savedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }
}

