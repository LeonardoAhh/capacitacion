/**
 * Servicio para cargar cursos del candidato desde Firestore.
 * Extraído del Candidatos Dashboard para separar capa de datos.
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Carga cursos requeridos para un puesto dado.
 *
 * Estrategia dual (en paralelo):
 * 1. Nueva arquitectura — colección `cursos` filtrada por `puestosAplicables`
 *    Incluye tanto cursos interactivos como tipo 'link'.
 * 2. Path legado — colección `positions` → `induction_courses` + enriquecimiento.
 *
 * Los resultados se mergean; los cursos de `cursos` tienen preferencia.
 * Si ambos paths están vacíos se retorna [].
 *
 * @param {string} position - Nombre del puesto
 * @returns {Promise<Array>} Lista de cursos
 */
export async function loadCoursesForPosition(position) {
    const cursosRef = collection(db, 'cursos');
    const positionsRef = collection(db, 'positions');

    const [cursosSnapshot, positionSnapshot] = await Promise.all([
        getDocs(query(cursosRef, where('puestosAplicables', 'array-contains', position))),
        getDocs(query(positionsRef, where('name', '==', position))),
    ]);

    // ── 1. Cursos de la colección principal ──
    let cursosData = cursosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.tipo === 'link' ? c.activo !== false : c.published !== false);
    cursosData.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    // ── 2. Path legado positions → induction_courses ──
    let legacyData = [];
    if (!positionSnapshot.empty) {
        const requiredCourses = positionSnapshot.docs[0].data().requiredCourses || [];
        if (requiredCourses.length > 0) {
            const inductionRef = collection(db, 'induction_courses');
            const chunkSize = 30;
            const chunks = [];
            for (let i = 0; i < requiredCourses.length; i += chunkSize) {
                chunks.push(requiredCourses.slice(i, i + chunkSize));
            }
            const allResults = await Promise.all(
                chunks.map(chunk => getDocs(query(inductionRef, where('title', 'in', chunk))))
            );
            let fetched = allResults.flatMap(s => s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            fetched = requiredCourses.map(name => fetched.find(c => c.title === name)).filter(Boolean);
            legacyData = await enrichWithLegacyData(fetched, position);
        }
    }

    // ── 3. Merge: cursos tiene preferencia; evitar duplicados por id o título ──
    const seenIds = new Set(cursosData.map(c => c.id));
    const seenTitles = new Set(cursosData.map(c => (c.title || c.nombre || '').toLowerCase()));
    const uniqueLegacy = legacyData.filter(c =>
        !seenIds.has(c.id) &&
        !seenTitles.has((c.title || c.nombre || '').toLowerCase())
    );

    return [...cursosData, ...uniqueLegacy];
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
            if (legacyCourse) {
                return {
                    ...course,
                    ...(legacyCourse.examenUrl && { examenUrl: legacyCourse.examenUrl }),
                    ...(legacyCourse.nativeCourseId && { nativeCourseId: legacyCourse.nativeCourseId }),
                    ...(legacyCourse.tipo && { tipo: legacyCourse.tipo }),
                };
            }
            return course;
        });
    } catch (error) {
        console.error('Error enriching courses:', error);
        return coursesData;
    }
}

