import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import courseRenewalData from '@/data/coursees.json';

// Normalize string for comparison
const normalize = (str) => str?.trim().toUpperCase() || '';

/**
 * Convert renewal period string to validityYears number
 * @param {string} renewalPeriod - The renewal period text from JSON
 * @returns {number} - 0 for one-time courses, 2 for courses requiring renewal
 */
const parseRenewalPeriod = (renewalPeriod) => {
    if (!renewalPeriod) return 0;
    const normalized = renewalPeriod.toUpperCase();

    if (normalized.includes('2 AÑOS') || normalized.includes('2 AÑO')) {
        return 2;
    }
    // "CURSO DE 1 SOLA VEZ" or any other = no renewal needed
    return 0;
};

/**
 * Update courses in Firestore with renewal period information from coursees.json
 * @returns {Promise<{success: boolean, updated: number, notFound: string[], message: string}>}
 */
export const updateCourseValidity = async () => {
    try {
        console.log('Starting course validity update...');

        // 1. Build a map from coursees.json
        const renewalMap = new Map();
        courseRenewalData.forEach(item => {
            const normalizedName = normalize(item.course);
            const validityYears = parseRenewalPeriod(item.renewalPeriod);
            renewalMap.set(normalizedName, {
                validityYears,
                renewalPeriod: item.renewalPeriod
            });
        });

        console.log(`Loaded ${renewalMap.size} courses from coursees.json`);

        // 2. Fetch existing courses from Firestore
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const existingCourses = coursesSnap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        console.log(`Found ${existingCourses.length} courses in Firestore`);

        // 3. Match and update
        const batch = writeBatch(db);
        let updateCount = 0;
        const notFound = [];
        const updated = [];

        existingCourses.forEach(course => {
            const normalizedName = normalize(course.name);
            const renewalInfo = renewalMap.get(normalizedName);

            if (renewalInfo) {
                // Update the course document
                const courseRef = doc(db, 'courses', course.id);
                batch.update(courseRef, {
                    validityYears: renewalInfo.validityYears,
                    renewalPeriod: renewalInfo.renewalPeriod,
                    updatedAt: new Date().toISOString()
                });
                updateCount++;
                updated.push(course.name);
            } else {
                // Course exists in Firestore but not in coursees.json
                notFound.push(course.name);
            }
        });

        // 4. Commit the batch
        if (updateCount > 0) {
            await batch.commit();
        }

        console.log(`Updated ${updateCount} courses`);
        if (notFound.length > 0) {
            console.warn('Courses not found in coursees.json:', notFound);
        }

        return {
            success: true,
            updated: updateCount,
            notFound,
            updatedCourses: updated,
            message: `Se actualizaron ${updateCount} cursos con información de vigencia.`
        };

    } catch (error) {
        console.error('Error updating course validity:', error);
        return {
            success: false,
            updated: 0,
            notFound: [],
            message: error.message
        };
    }
};
