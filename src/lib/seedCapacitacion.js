import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDoc } from 'firebase/firestore';
import matrizData from '@/data/matriz.json';
import positionsData from '@/data/positions.json';

export const seedCapacitacionData = async () => {
    try {
        console.log('Starting seed...');
        const batch = writeBatch(db);
        let operationCount = 0;
        const BATCH_LIMIT = 450; // Firestore limit is 500

        // 1. Process Positions & Courses relations
        const positionsMap = new Map();
        const uniqueCourses = new Set();

        // Group courses by position
        matrizData.forEach(item => {
            if (!item.position) return;

            const posName = item.position.trim();
            const course = item.requiredCourses?.trim();

            if (!positionsMap.has(posName)) {
                positionsMap.set(posName, {
                    name: posName,
                    courses: new Set(),
                    department: 'Sin Asignar'
                });
            }

            if (course) {
                positionsMap.get(posName).courses.add(course);
                uniqueCourses.add(course);
            }
        });

        // Add department info
        positionsData.forEach(item => {
            if (!item.positions) return;
            const posName = item.positions.trim();
            const dept = item.deparment || item.department; // Handle potential typo in source

            if (positionsMap.has(posName)) {
                positionsMap.get(posName).department = dept;
            } else {
                // If position exists in positions.json but not matriz.json, add it anyway?
                // User asked to analyze matriz.json mainly, but let's be comprehensive.
                positionsMap.set(posName, {
                    name: posName,
                    courses: new Set(),
                    department: dept
                });
            }
        });

        // 2. Write Courses
        const coursesRef = collection(db, 'courses');
        for (const courseName of uniqueCourses) {
            // Use course name as ID for simplicity and uniqueness dedupe
            // Sanitize ID: replace / with -
            const safeId = courseName.replace(/\//g, '-').replace(/\./g, '_');
            const docRef = doc(coursesRef, safeId);
            batch.set(docRef, { name: courseName }, { merge: true });
            operationCount++;

            if (operationCount >= BATCH_LIMIT) {
                await batch.commit();
                operationCount = 0;
            }
        }

        // 3. Write Positions
        const positionsRef = collection(db, 'positions');
        for (const [name, data] of positionsMap) {
            const safeId = name.replace(/\//g, '-').replace(/\./g, '_');
            const docRef = doc(positionsRef, safeId);

            batch.set(docRef, {
                name: data.name,
                department: data.department,
                requiredCourses: Array.from(data.courses),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            operationCount++;

            if (operationCount >= BATCH_LIMIT) {
                await batch.commit();
                operationCount = 0; // Reset batch
                // Re-instantiate batch is not needed if we await commit? 
                // Wait, writeBatch object cannot be reused after commit.
                // We need a wrapper to handle new batches.
            }
        }

        // Handle remaining (This simple logic is flawed if we commit inside loop without re-creating batch)
        // Let's refactor the batch logic to be robust.
    } catch (error) {
        console.error('Error seeding data:', error);
        throw error;
    }
};

// Robust batch handler
const commitBatch = async (batch) => {
    await batch.commit();
    return writeBatch(db);
};

export const seedCapacitacionDataRobust = async () => {
    let batch = writeBatch(db);
    let operationCount = 0;
    const BATCH_LIMIT = 450;

    const positionsMap = new Map();
    const uniqueCourses = new Set();

    // 1. Parse Data
    matrizData.forEach(item => {
        if (!item.position) return;
        const posName = item.position.trim();
        const course = item.requiredCourses?.trim();

        if (!positionsMap.has(posName)) {
            positionsMap.set(posName, {
                name: posName,
                courses: new Set(),
                department: 'Sin Asignar'
            });
        }
        if (course) {
            positionsMap.get(posName).courses.add(course);
            uniqueCourses.add(course);
        }
    });

    positionsData.forEach(item => {
        if (!item.positions) return;
        const posName = item.positions.trim();
        const dept = item.deparment || 'Sin Asignar';

        if (positionsMap.has(posName)) {
            positionsMap.get(posName).department = dept;
        } else {
            positionsMap.set(posName, {
                name: posName,
                courses: new Set(),
                department: dept
            });
        }
    });

    try {
        // 2. Queue Courses
        for (const courseName of uniqueCourses) {
            // Encode ID to be URL safe-ish and valid document key
            // Using a simple hash or just replacement helps. 
            // For readability we keep name but fix slashes.
            const safeId = courseName.replace(/\//g, ' ').trim();
            // Ensure ID is not empty
            if (!safeId) continue;

            const docRef = doc(collection(db, 'courses'), safeId);
            batch.set(docRef, { name: courseName }, { merge: true });
            operationCount++;

            if (operationCount >= BATCH_LIMIT) {
                batch = await commitBatch(batch);
                operationCount = 0;
            }
        }

        // 3. Queue Positions
        for (const [name, data] of positionsMap) {
            const safeId = name.replace(/\//g, ' ').trim();
            if (!safeId) continue;

            const docRef = doc(collection(db, 'positions'), safeId);
            batch.set(docRef, {
                name: data.name,
                department: data.department,
                requiredCourses: Array.from(data.courses).sort(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            operationCount++;

            if (operationCount >= BATCH_LIMIT) {
                batch = await commitBatch(batch);
                operationCount = 0;
            }
        }

        // Final Commit
        if (operationCount > 0) {
            await batch.commit();
        }

        return { success: true, message: `Processed ${positionsMap.size} positions and ${uniqueCourses.size} courses.` };

    } catch (error) {
        console.error("Seeding Error:", error);
        return { success: false, error: error.message };
    }
};
