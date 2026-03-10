/**
 * Servicio para obtener datos de entrenamiento desde Firestore.
 * Extraído de useTrainingData para separar la capa de datos de la capa de estado.
 */

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Obtiene y fusiona datos frescos del perfil del usuario desde Firestore.
 *
 * @param {object} sessionData - Datos de sesión del usuario
 * @returns {Promise<object>} Perfil actualizado (o el original si no hay cambios)
 */
export async function fetchFreshProfile(sessionData) {
    const userDocRef = doc(db, 'employees_programacion', sessionData.id);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) return sessionData;

    const freshData = userDocSnap.data();
    return {
        ...sessionData,
        nickname: freshData.nickname || sessionData.nickname,
        avatar: freshData.avatar || sessionData.avatar,
        theme: freshData.theme || sessionData.theme,
    };
}

/**
 * Obtiene los cursos asignados a un empleado con sus detalles.
 *
 * @param {string} employeeId - ID del empleado
 * @returns {Promise<Array>} Lista de cursos con datos de programación y detalle
 */
export async function fetchEmployeeCourses(employeeId) {
    const progRef = collection(db, 'programacion');
    const q = query(progRef, where('employeeId', '==', employeeId));
    const progSnap = await getDocs(q);

    if (progSnap.empty) return [];

    const coursesData = await Promise.all(
        progSnap.docs.map(async (pDoc) => {
            const progData = pDoc.data();

            // Buscar primero en colección principal `cursos` (cursos interactivos nuevos)
            let courseDetail = null;
            const mainCourseDoc = await getDoc(doc(db, 'cursos', progData.courseId));
            if (mainCourseDoc.exists()) {
                const data = mainCourseDoc.data();
                courseDetail = {
                    ...data,
                    title: data.title || data.nombre || 'Sin Título',
                    description: data.description || data.descripcion || '',
                };
            } else {
                // Fallback: colección legada `cursos_induccion`
                const legacyDoc = await getDoc(doc(db, 'cursos_induccion', progData.courseId));
                if (legacyDoc.exists()) {
                    const data = legacyDoc.data();
                    courseDetail = {
                        ...data,
                        title: data.title || data.nombre || 'Sin Título',
                        description: data.description || data.descripcion || '',
                    };
                } else {
                    courseDetail = { title: 'Curso no encontrado', description: '' };
                }
            }

            return {
                id: progData.courseId,
                assignmentId: pDoc.id,
                ...courseDetail,
                ...progData, // progData al final para que status/assignedAt tengan preferencia
            };
        })
    );

    return coursesData;
}

/**
 * Obtiene el registro de capacitación del empleado desde training_records.
 * Devuelve el historial aprobado, el matrix de cumplimiento y los cursos
 * requeridos por su puesto (desde `positions`) para alimentar la gamificación.
 *
 * @param {string} employeeId - ID del empleado (campo employeeId en training_records)
 * @returns {Promise<object>} { history, matrix, positionCourses, approvedCount }
 */
export async function fetchTrainingRecord(employeeId) {
    if (!employeeId) return { history: [], matrix: null, positionCourses: [], approvedCount: 0 };

    try {
        // 1. Buscar por documento ID directo (el ID del doc suele ser el mismo employeeId)
        let recordData = null;
        const directSnap = await getDoc(doc(db, 'training_records', employeeId));
        if (directSnap.exists()) {
            recordData = directSnap.data();
        } else {
            // Fallback: buscar por campo employeeId
            const q = query(
                collection(db, 'training_records'),
                where('employeeId', '==', employeeId)
            );
            const snap = await getDocs(q);
            if (!snap.empty) recordData = snap.docs[0].data();
        }

        if (!recordData) {
            return { history: [], matrix: null, positionCourses: [], approvedCount: 0 };
        }

        const history = recordData.history || [];
        const matrix  = recordData.matrix  || null;
        const position = recordData.position || '';

        // 2. Cursos aprobados (status === 'approved' o score >= 70)
        const approved = history.filter(h =>
            h.status === 'approved' || (!h.status && parseFloat(h.score || 0) >= 70)
        );

        // 3. Cursos requeridos por el puesto (desde `positions`)
        let positionCourses = [];
        if (position) {
            const normalize = (s) => (s || '').trim().toUpperCase();
            const posSnap = await getDocs(collection(db, 'positions'));
            let requiredNames = [];
            posSnap.forEach(d => {
                if (normalize(d.data().name) === normalize(position)) {
                    requiredNames = d.data().requiredCourses || [];
                }
            });

            // Cruzar nombres requeridos con los cursos aprobados
            const approvedNormalized = new Set(approved.map(a => normalize(a.courseName || a.course || '')));
            positionCourses = requiredNames.map(name => ({
                id: normalize(name),
                title: name,
                requiredByPosition: true,
                completed: approvedNormalized.has(normalize(name)),
            }));
        }

        return {
            history,
            matrix,
            approvedCount: approved.length,
            positionCourses, // { id, title, requiredByPosition, completed }
        };
    } catch (e) {
        console.error('Error fetching training record:', e);
        return { history: [], matrix: null, positionCourses: [], approvedCount: 0 };
    }
}
