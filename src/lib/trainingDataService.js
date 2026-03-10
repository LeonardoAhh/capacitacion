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
