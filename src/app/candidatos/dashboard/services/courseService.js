/**
 * Servicio para cargar cursos del candidato desde Firestore.
 * Extraído del Candidatos Dashboard para separar capa de datos.
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Carga cursos requeridos para un puesto dado.
 * Primero busca en la colección 'positions' → 'induction_courses',
 * luego enriquece con datos legacy de 'cursos_induccion'.
 * Si no encuentra, usa fallback a 'cursos_induccion' directamente.
 *
 * @param {string} position - Nombre del puesto
 * @returns {Promise<Array>} Lista de cursos
 */
export async function loadCoursesForPosition(position) {
    const positionsRef = collection(db, 'positions');
    const positionQuery = query(positionsRef, where('name', '==', position));
    const positionSnapshot = await getDocs(positionQuery);

    let coursesData = [];

    if (!positionSnapshot.empty) {
        const positionData = positionSnapshot.docs[0].data();
        const requiredCourses = positionData.requiredCourses || [];

        if (requiredCourses.length > 0) {
            const inductionRef = collection(db, 'induction_courses');

            // Firestore 'in' supports max 30 values — split into chunks
            const chunkSize = 30;
            const chunks = [];
            for (let i = 0; i < requiredCourses.length; i += chunkSize) {
                chunks.push(requiredCourses.slice(i, i + chunkSize));
            }

            const allResults = await Promise.all(
                chunks.map(chunk =>
                    getDocs(query(inductionRef, where('title', 'in', chunk)))
                )
            );

            coursesData = allResults.flatMap(snapshot =>
                snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            );

            // Sort by requiredCourses order
            coursesData = requiredCourses
                .map(courseName => coursesData.find(c => c.title === courseName))
                .filter(Boolean);

            // Enrich with legacy data (examenUrl)
            coursesData = await enrichWithLegacyData(coursesData, position);
        }
    }

    // Fallback to legacy collection
    if (coursesData.length === 0) {
        coursesData = await loadLegacyCourses(position);
    }

    return coursesData;
}

/**
 * Enriquece cursos con datos legacy (examenUrl).
 */
async function enrichWithLegacyData(coursesData, position) {
    try {
        const cursosRef = collection(db, 'cursos_induccion');
        const legacyQuery = query(
            cursosRef,
            where('puestosAplicables', 'array-contains', position),
            where('activo', '==', true)
        );
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyCourseMap = {};
        legacySnapshot.docs.forEach(doc => {
            legacyCourseMap[doc.data().nombre] = doc.data();
        });

        return coursesData.map(course => {
            const legacyCourse = legacyCourseMap[course.title];
            if (legacyCourse?.examenUrl) {
                return { ...course, examenUrl: legacyCourse.examenUrl };
            }
            return course;
        });
    } catch (error) {
        console.error('Error enriching courses:', error);
        return coursesData;
    }
}

/**
 * Fallback: carga cursos directamente de la colección legacy.
 */
async function loadLegacyCourses(position) {
    const cursosRef = collection(db, 'cursos_induccion');
    const legacyQuery = query(
        cursosRef,
        where('puestosAplicables', 'array-contains', position),
        where('activo', '==', true)
    );
    const legacySnapshot = await getDocs(legacyQuery);
    const coursesData = legacySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    coursesData.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    return coursesData;
}
