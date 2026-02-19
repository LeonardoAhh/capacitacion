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
 * Actualiza el data de un slide individual.
 * @param {string} courseId
 * @param {string} slideId
 * @param {Object} slideData - campos a actualizar en el slide
 */
export async function updateSlide(courseId, slideId, slideData) {
    try {
        const slideRef = doc(db, COURSES_COLLECTION, courseId, SLIDES_SUBCOLLECTION, slideId);
        await updateDoc(slideRef, slideData);
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
