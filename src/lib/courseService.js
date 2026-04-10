import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    addDoc,
    increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COURSES_COLLECTION = 'cursos';
const SLIDES_SUBCOLLECTION = 'slides';

/**
 * Importa un curso completo desde un objeto JSON (estructura metodologia.json)
 * Crea el documento del curso y sus slides como subcolección.
 * @param {Object} jsonData - Objeto parseado del JSON del curso
 * @param {string} userId - UID del usuario que importa
 * @returns {Object} { success, courseId, error }
 */
export async function importCourseFromJSON(jsonData, userId) {
    try {
        const { course, slides } = jsonData;

        if (!course || !slides || !Array.isArray(slides)) {
            return { success: false, error: 'Formato JSON inválido. Se requiere "course" y "slides".' };
        }

        const courseId = course.id || `course-${Date.now()}`;
        const courseRef = doc(db, COURSES_COLLECTION, courseId);

        // Datos del curso (sin los slides)
        const courseData = {
            title: course.title || 'Sin título',
            description: course.description || '',
            category: course.category || 'General',
            duration: course.duration || '',
            instructor: course.instructor || '',
            instructorRole: course.instructorRole || '',
            company: course.company || '',
            year: course.year || new Date().getFullYear().toString(),
            published: course.published ?? false,
            slideCount: slides.length,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Batch write: curso + todos los slides
        const batch = writeBatch(db);
        batch.set(courseRef, courseData);

        slides.forEach((slide) => {
            const slideId = slide.id || `slide-${String(slide.order).padStart(2, '0')}`;
            const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, slideId);
            batch.set(slideRef, {
                order: slide.order,
                type: slide.type,
                data: slide.data,
            });
        });

        await batch.commit();

        return { success: true, courseId };
    } catch (error) {
        console.error('Error importando curso:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Crea un curso vacío desde cero (sin JSON).
 * El admin puede luego agregar slides desde el editor.
 * @param {string} title - Título inicial del curso
 * @param {string} userId - UID del usuario que lo crea
 * @returns {Object} { success, courseId, error }
 */
export async function createEmptyCourse(title, userId) {
    try {
        const coursesRef = collection(db, COURSES_COLLECTION);
        const courseData = {
            title: title || 'Nuevo Curso',
            description: '',
            category: 'General',
            duration: '',
            instructor: '',
            instructorRole: '',
            company: '',
            year: new Date().getFullYear().toString(),
            published: false,
            slideCount: 0,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(coursesRef, courseData);
        return { success: true, courseId: docRef.id };
    } catch (error) {
        console.error('Error creando curso vacío:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Crea un curso interactivo a través del Wizard, insertando un slide inicial de plantilla.
 * @param {Object} courseData - { title, category }
 * @param {string} firstSlideType - Tipo del primer slide ('title', 'content', 'objective', 'quiz', 'benefits')
 * @param {string} userId - UID del creador
 * @returns {Object} { success, courseId, error }
 */
export async function createCourseFromWizard(courseData, firstSlideType, userId) {
    try {
        // Generar ID legible a partir del título
        const slug = (courseData.title || 'nuevo-curso')
            .toLowerCase()
            .normalize('NFD').replace(/[-]/g, '') // quitar acentos
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 40);
        const courseId = `${slug}-${Date.now()}`;
        const courseRef = doc(db, COURSES_COLLECTION, courseId);

        const newCourse = {
            title: courseData.title || 'Nuevo Curso',
            description: '',
            category: courseData.category || 'General',
            duration: '',
            instructor: '',
            instructorRole: '',
            company: '',
            year: new Date().getFullYear().toString(),
            published: false,
            slideCount: 1, // Arranca con 1 slide pre-creado
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const batch = writeBatch(db);
        batch.set(courseRef, newCourse);

        // Configurar pre-poblado rápido según el slide
        let initialData = {};
        if (firstSlideType === 'title') {
            initialData = { heading: courseData.title, subheading: 'Escribe aquí un subtitulo descriptivo.' };
        } else if (firstSlideType === 'objective') {
            initialData = { heading: 'Objetivo del Curso', body: 'Al finalizar este curso, el colaborador logrará...' };
        } else if (firstSlideType === 'quiz') {
            initialData = {
                heading: 'Verificación de Conocimiento',
                body: 'Selecciona la respuesta correcta a la siguiente pregunta.',
                options: [
                    { text: 'Opción 1', isCorrect: true, explanation: '' },
                    { text: 'Opción 2', isCorrect: false, explanation: '' }
                ]
            };
        } else if (firstSlideType === 'benefits') {
            initialData = { heading: 'Lista de Temas', items: ['Tema 1', 'Tema 2', 'Tema 3'] };
        } else {
            // First Slide Content (Default)
            initialData = { heading: 'Título de la Lección', body: 'Contenido principal...' };
        }

        const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, 'slide-01');
        batch.set(slideRef, {
            order: 1,
            type: firstSlideType,
            data: initialData
        });

        await batch.commit();

        return { success: true, courseId };
    } catch (error) {
        console.error('Error creando curso desde Wizard:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene un curso con todos sus slides ordenados por `order`.
 * @param {string} courseId
 * @returns {Object} { success, data: { course, slides }, error }
 */
export async function getCourseWithSlides(courseId) {
    try {
        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            return { success: false, error: 'Curso no encontrado', data: null };
        }

        const slidesRef = collection(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION);
        const slidesQuery = query(slidesRef, orderBy('order', 'asc'));
        const slidesSnap = await getDocs(slidesQuery);

        const slides = slidesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return {
            success: true,
            data: {
                course: { id: courseSnap.id, ...courseSnap.data() },
                slides,
            },
        };
    } catch (error) {
        console.error('Error obteniendo curso:', error);
        return { success: false, error: error.message, data: null };
    }
}

/**
 * Lista todos los cursos (sin slides).
 * @returns {Object} { success, data: Course[], error }
 */
export async function getAllCourses() {
    try {
        const coursesRef = collection(db, COURSES_COLLECTION);
        const q = query(coursesRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, data };
    } catch (error) {
        console.error('Error listando cursos:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Toggle publicar/despublicar un curso.
 * @param {string} courseId
 * @param {boolean} published
 */
export async function togglePublish(courseId, published) {
    try {
        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseRef, { published, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando publicación:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Elimina un curso y todos sus slides.
 * @param {string} courseId
 */
export async function deleteCourse(courseId) {
    try {
        const slidesRef = collection(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION);
        const slidesSnap = await getDocs(slidesRef);

        const batch = writeBatch(db);

        slidesSnap.docs.forEach((slideDoc) => {
            batch.delete(slideDoc.ref);
        });

        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        batch.delete(courseRef);

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Error eliminando curso:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Renombra un curso nativo.
 * @param {string} courseId
 * @param {string} newTitle
 */
export async function renameCourse(courseId, newTitle) {
    try {
        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseRef, { title: newTitle.trim(), updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error renombrando curso:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Crea un recurso tipo URL / PDF (sin slides) en la colección cursos.
 * Estos recursos se muestran en el dashboard del candidato filtrados por puesto.
 * @param {Object} params
 * @returns {Object} { success, courseId, error }
 */
/**
 * Sincroniza puestosAplicables en cursos interactivos leyendo la colección `positions`.
 *
 * - Sin parámetros: sincroniza TODOS los cursos interactivos (bulk, una sola vez).
 * - Con courseId: sincroniza solo ese curso (llamado al publicar).
 *
 * Lógica: para cada position.requiredCourses[], busca el curso en `cursos`
 * cuyo title coincida y escribe puestosAplicables con las posiciones que lo requieren.
 *
 * @param {string|null} courseId - ID del curso a sincronizar, o null para todos
 * @returns {Promise<{success: boolean, updatedCount: number, error?: string}>}
 */
export async function syncCoursePuestosFromPositions(courseId = null) {
    try {
        // 1. Leer todas las posiciones y construir mapa: title.lower → [positionNames]
        const positionsSnapshot = await getDocs(collection(db, 'positions'));
        const coursePositionsMap = {};
        positionsSnapshot.docs.forEach(posDoc => {
            const { name: posName, requiredCourses = [] } = posDoc.data();
            if (!posName) return;
            requiredCourses.forEach(courseTitle => {
                const key = courseTitle.toLowerCase().trim();
                if (!coursePositionsMap[key]) coursePositionsMap[key] = [];
                if (!coursePositionsMap[key].includes(posName)) {
                    coursePositionsMap[key].push(posName);
                }
            });
        });

        // 2. Obtener cursos a sincronizar
        let coursesToSync = [];
        if (courseId) {
            const snap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
            if (snap.exists()) coursesToSync = [{ id: snap.id, ...snap.data() }];
        } else {
            const snap = await getDocs(collection(db, COURSES_COLLECTION));
            coursesToSync = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(c => !c.tipo || c.tipo !== 'link');
        }

        // 3. Batch update puestosAplicables donde haya coincidencia
        const batch = writeBatch(db);
        let updatedCount = 0;
        coursesToSync.forEach(course => {
            const key = (course.title || '').toLowerCase().trim();
            const positions = coursePositionsMap[key];
            if (positions?.length > 0) {
                batch.update(doc(db, COURSES_COLLECTION, course.id), {
                    puestosAplicables: positions,
                    updatedAt: serverTimestamp(),
                });
                updatedCount++;
            }
        });

        await batch.commit();
        return { success: true, updatedCount };
    } catch (error) {
        console.error('Error syncing course positions:', error);
        return { success: false, updatedCount: 0, error: error.message };
    }
}

export async function createLinkCourse({ title, contenidoUrl, puestosAplicables, duracionEstimada, orden, userId }) {
    try {
        const coursesRef = collection(db, COURSES_COLLECTION);
        const courseData = {
            title: title.trim(),
            tipo: 'link',
            contenidoUrl: contenidoUrl.trim(),
            puestosAplicables: puestosAplicables || [],
            duracionEstimada: Number(duracionEstimada) || 30,
            orden: Number(orden) || 1,
            activo: true,
            published: true,
            slideCount: 0,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(coursesRef, courseData);
        return { success: true, courseId: docRef.id };
    } catch (error) {
        console.error('Error creando recurso URL/PDF:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza los campos de metadatos de un curso (title, category, description, etc.)
 * Sin tocar los slides.
 * @param {string} courseId
 * @param {Object} fields - campos a actualizar
 */
export async function updateCourseFields(courseId, fields) {
    try {
        const courseRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseRef, { ...fields, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando curso:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza el orden (order) de los slides en modo Batch para reordenamiento (Drag & Drop)
 * @param {string} courseId
 * @param {Array} orderedSlides - Lista de slides con su propiedad `order` ya asignada
 */
export async function updateSlidesOrder(courseId, orderedSlides) {
    try {
        const batch = writeBatch(db);

        orderedSlides.forEach((slide) => {
            const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, slide.id);
            batch.update(slideRef, {
                order: slide.order,
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error('Error reordenando slides en bloque:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Duplica un slide existente, insertándolo justo después del original.
 * Los slides que vienen después se re-numeran automáticamente.
 * @param {string} courseId
 * @param {Object} slide     - Objeto del slide a duplicar (id, type, data, order)
 * @param {Array}  allSlides - Lista completa de slides del curso (para recalcular orders)
 * @returns {Object} { success, newSlide: { id, type, data, order }, error }
 */
export async function duplicateSlide(courseId, slide, allSlides) {
    try {
        const slidesRef = collection(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION);

        // Calcular el order del nuevo slide (inmediatamente después del original)
        const insertAt = (slide.order ?? allSlides.length) + 1;

        // Creamos el nuevo slide (copia profunda de la data)
        const newSlideData = {
            type: slide.type,
            data: structuredClone(slide.data ?? {}),
            order: insertAt,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const batch = writeBatch(db);

        // Incrementar order de todos los slides que van después del insertAt
        const slidesToShift = allSlides.filter(s => s.id !== slide.id && (s.order ?? 0) >= insertAt);
        slidesToShift.forEach(s => {
            const ref = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, s.id);
            batch.update(ref, { order: (s.order ?? 0) + 1, updatedAt: serverTimestamp() });
        });

        // Crear el nuevo documento con un ID automático
        const newRef = doc(slidesRef);
        batch.set(newRef, newSlideData);

        await batch.commit();

        return {
            success: true,
            newSlide: { id: newRef.id, ...newSlideData },
        };
    } catch (error) {
        console.error('Error duplicando slide:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza el data de un slide individual.
 * @param {string} courseId
 * @param {string} slideId
 * @param {Object} slideData - campos a actualizar en el slide
 */
export async function updateSlide(courseId, slideId, slideData) {
    try {
        const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, slideId);
        await updateDoc(slideRef, { ...slideData, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando slide:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Agrega un nuevo slide al curso.
 * @param {string} courseId
 * @param {Object} slideData - { type, data, order }
 */
export async function addSlide(courseId, slideData) {
    try {
        const slidesRef = collection(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION);

        // Si no viene order, buscamos el último
        let order = slideData.order;
        if (!order) {
            const q = query(slidesRef, orderBy('order', 'desc'));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const lastSlide = snap.docs[0].data();
                order = (lastSlide.order || 0) + 1;
            } else {
                order = 1;
            }
        }

        const newSlideData = {
            ...slideData,
            order,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(slidesRef, newSlideData);
        return { success: true, id: docRef.id, ...newSlideData };
    } catch (error) {
        console.error('Error agregando slide:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Elimina un slide específico de un curso.
 * @param {string} courseId 
 * @param {string} slideId 
 */
export async function deleteSlide(courseId, slideId) {
    try {
        const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, slideId);
        await deleteDoc(slideRef);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando slide:', error);
        return { success: false, error: error.message };
    }
}

// ──────────────────────────────────────────────
//  PROGRESO DEL USUARIO
// ──────────────────────────────────────────────

/**
 * Guarda el progreso del usuario en un curso (slide actual).
 * Ruta: users/{userId}/progress/{courseId}
 * @param {string} courseId     - ID del curso
 * @param {string} userId       - UID del usuario autenticado
 * @param {number} slideIndex   - Índice del slide actual (base 0)
 * @param {number} [quizScore]  - Score del quiz si ya fue respondido (0-100)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveUserProgress(courseId, userId, slideIndex, quizScore = null) {
    if (!courseId || !userId) return { success: false, error: 'Parámetros inválidos' };
    try {
        const progressRef = doc(db, 'users', userId, 'progress', courseId);
        const data = {
            courseId,
            slideIndex,
            updatedAt: serverTimestamp(),
        };
        if (quizScore !== null) data.quizScore = quizScore;
        await setDoc(progressRef, data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error guardando progreso:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lee el progreso guardado del usuario para un curso.
 * Ruta: users/{userId}/progress/{courseId}
 * @param {string} courseId - ID del curso
 * @param {string} userId   - UID del usuario autenticado
 * @returns {Promise<{slideIndex: number, quizScore: number|null} | null>}
 */
export async function getUserProgress(courseId, userId) {
    if (!courseId || !userId) return null;
    try {
        const progressRef = doc(db, 'users', userId, 'progress', courseId);
        const snap = await getDoc(progressRef);
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            slideIndex: data.slideIndex ?? 0,
            quizScore: data.quizScore ?? null,
        };
    } catch (error) {
        console.error('Error leyendo progreso:', error);
        return null;
    }
}

// ──────────────────────────────────────────────
//  NOTAS POR SLIDE (alumno)
// ──────────────────────────────────────────────

/**
 * Guarda o actualiza la nota de un slide para un usuario.
 * Ruta: users/{userId}/notes/{courseId}  →  mapa { [slideId]: string }
 */
export async function saveSlideNote(courseId, userId, slideId, text) {
    if (!courseId || !userId || !slideId) return { success: false, error: 'Parámetros inválidos' };
    try {
        const ref = doc(db, 'users', userId, 'notes', courseId);
        await setDoc(ref, { [slideId]: text, updatedAt: serverTimestamp() }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error guardando nota:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lee todas las notas de un curso para un usuario.
 * @returns {Promise<Record<string, string>>}  mapa { [slideId]: text }
 */
export async function getCourseNotes(courseId, userId) {
    if (!courseId || !userId) return {};
    try {
        const ref = doc(db, 'users', userId, 'notes', courseId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return {};
        // eslint-disable-next-line no-unused-vars
        const { updatedAt, ...notes } = snap.data();
        return notes;
    } catch (error) {
        console.error('Error leyendo notas:', error);
        return {};
    }
}

// ──────────────────────────────────────────────
//  CALIFICACIÓN DEL CURSO (rating)
// ──────────────────────────────────────────────

/**
 * Guarda la calificación (1-5 estrellas) de un usuario para un curso.
 * Ruta: cursos/{courseId}/ratings/{userId}
 */
export async function saveCourseRating(courseId, userId, rating) {
    if (!courseId || !userId || rating < 1 || rating > 5) return { success: false, error: 'Parámetros inválidos' };
    try {
        const ref = doc(db, COURSES_COLLECTION, courseId, 'ratings', userId);
        await setDoc(ref, { rating, createdAt: serverTimestamp() }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error guardando rating:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lee si el usuario ya calificó el curso.
 * @returns {Promise<number|null>} rating (1-5) o null si no ha calificado
 */
export async function getUserCourseRating(courseId, userId) {
    if (!courseId || !userId) return null;
    try {
        const ref = doc(db, COURSES_COLLECTION, courseId, 'ratings', userId);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data().rating ?? null) : null;
    } catch {
        return null;
    }
}

// ──────────────────────────────────────────────
//  ANALYTICS: TIEMPO POR SLIDE
// ──────────────────────────────────────────────

/**
 * Acumula el tiempo (ms) que un usuario pasó en un slide.
 * Ruta: users/{userId}/slideTime/{courseId}  →  { [slideId]: { totalMs, views } }
 */
export async function trackSlideTime(courseId, userId, slideId, ms) {
    if (!courseId || !userId || !slideId || !(ms > 0)) return;
    try {
        const ref = doc(db, 'users', userId, 'slideTime', courseId);
        await setDoc(ref, {
            [`${slideId}.totalMs`]: increment(ms),
            [`${slideId}.views`]:   increment(1),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Error registrando tiempo de slide:', error);
    }
}

/**
 * Lee las estadísticas de tiempo por slide de todos los usuarios para un curso.
 * Agrega totalMs y views de todos los usuarios. Solo para uso en vistas admin.
 * @returns {Promise<Record<string, {totalMs: number, views: number}>>}
 */
export async function getCourseSlideStats(courseId) {
    if (!courseId) return {};
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const aggregated = {};

        await Promise.all(usersSnap.docs.map(async (userDoc) => {
            try {
                const ref = doc(db, 'users', userDoc.id, 'slideTime', courseId);
                const snap = await getDoc(ref);
                if (!snap.exists()) return;
                const data = snap.data();
                Object.entries(data).forEach(([key, val]) => {
                    if (key === 'updatedAt' || typeof val !== 'object') return;
                    if (!aggregated[key]) aggregated[key] = { totalMs: 0, views: 0 };
                    aggregated[key].totalMs += val.totalMs || 0;
                    aggregated[key].views   += val.views   || 0;
                });
            } catch { /* skip usuarios sin datos */ }
        }));

        return aggregated;
    } catch (error) {
        console.error('Error leyendo stats de slides:', error);
        return {};
    }
}

