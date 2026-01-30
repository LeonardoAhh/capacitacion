import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDoc } from 'firebase/firestore';

// Optional import - fails gracefully if file missing
let instructoresData = [];
try {
    instructoresData = require('@/data/instructores.json');
} catch (e) {
    console.log('instructores.json not found for migration');
}

export const migrateInstructorsToFirebase = async () => {
    if (!instructoresData || instructoresData.length === 0) {
        return { success: false, message: 'No instructor data found in JSON to migrate.' };
    }

    try {
        console.log('Starting Instructors Migration...');

        // 1. Group courses by employeeId
        const instructorsMap = {};

        instructoresData.forEach(item => {
            const empId = item.employeeId;
            const course = item['curso que imparte'];

            if (!instructorsMap[empId]) {
                instructorsMap[empId] = {
                    employeeId: empId,
                    courses: new Set()
                };
            }
            if (course) {
                instructorsMap[empId].courses.add(course.trim());
            }
        });

        // 2. Prepare Batch
        const batch = writeBatch(db);
        let count = 0;

        for (const empId in instructorsMap) {
            const data = instructorsMap[empId];

            // Try to find employee name/info from existing training_records if possible
            // This is optional, but helps having names in the collection
            let name = '';
            let position = '';

            try {
                const empDoc = await getDoc(doc(db, 'training_records', empId));
                if (empDoc.exists()) {
                    const empData = empDoc.data();
                    name = empData.name || '';
                    position = empData.position || '';
                }
            } catch (err) {
                console.log(`Could not fetch details for ${empId}`);
            }

            const docRef = doc(collection(db, 'instructors'), empId);
            batch.set(docRef, {
                employeeId: empId,
                courses: Array.from(data.courses), // Convert Set to Array
                name: name, // Might be empty if not found, can be updated later
                position: position,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            count++;
        }

        await batch.commit();
        console.log(`Successfully migrated ${count} instructors to Firebase.`);
        return { success: true, count: count };

    } catch (error) {
        console.error('Migration Error:', error);
        return { success: false, error: error.message };
    }
};
