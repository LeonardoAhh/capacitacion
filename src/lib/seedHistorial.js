import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { normalize, normalizeForMatch, calculateEmployeeCompliance } from '@/lib/compliance';

// History data removed from repo for privacy
const historyData = [];

export const seedHistoryData = async () => {
    try {
        console.log('Starting History Seed...');

        // 1. Fetch Dependencies (Courses & Positions)
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const validCourses = new Set(coursesSnap.docs.map(d => normalize(d.data().name)));

        const positionsSnap = await getDocs(collection(db, 'positions'));
        // Store both exact and normalized versions for matching
        const requirementsMap = new Map();
        const requirementsMapNormalized = new Map();
        positionsSnap.docs.forEach(d => {
            const data = d.data();
            const exactKey = normalize(data.name);
            const normalizedKey = normalizeForMatch(data.name);
            const courses = (data.requiredCourses || []).map(normalize);
            requirementsMap.set(exactKey, courses);
            requirementsMapNormalized.set(normalizedKey, courses);
        });

        // 2. Process History Data
        const employeeRecords = new Map(); // Id -> { ...data, history: [] }
        const inconsistencies = new Set();

        historyData.forEach(record => {
            const empId = record.employeeId;
            const courseName = normalize(record["course taken"]);
            const score = parseFloat(record.qualification || 0);

            // Check consistency
            if (!validCourses.has(courseName)) {
                inconsistencies.add(courseName);
            }

            if (!employeeRecords.has(empId)) {
                // HERE IS THE FIX: Read department from JSON
                employeeRecords.set(empId, {
                    id: empId,
                    name: record.name,
                    position: normalize(record.position),
                    department: normalize(record.deparment || record.department),
                    history: []
                });
            }

            // Prevent duplicate history entries
            const existing = employeeRecords.get(empId).history.find(h =>
                h.courseName === courseName && h.date === record["application date"]
            );

            if (!existing) {
                employeeRecords.get(empId).history.push({
                    courseName,
                    date: record["application date"],
                    score,
                    status: score >= 70 ? 'approved' : 'failed'
                });
            }
        });

        console.warn('Found Potential Course Inconsistencies:', Array.from(inconsistencies));

        // 3. Calculate Compliance & Prepare Batches
        const batchSize = 450;
        let batch = writeBatch(db);
        let opCount = 0;

        // Stats Aggregation for Puestos Page
        const positionStats = {};

        for (const [empId, data] of employeeRecords) {
            // Try exact match first, then fallback to normalized match
            let positionReqs = requirementsMap.get(data.position);
            if (!positionReqs || positionReqs.length === 0) {
                const normalizedPosition = normalizeForMatch(data.position);
                positionReqs = requirementsMapNormalized.get(normalizedPosition) || [];
            }

            // Use Centralized Compliance Utility
            const matrix = calculateEmployeeCompliance(data.history, positionReqs);

            // Aggregation for Stats
            const posName = data.position || 'Sin Puesto';
            if (!positionStats[posName]) {
                positionStats[posName] = {
                    name: posName,
                    department: data.department || 'Sin Asignar', // Use JSON Dept
                    headcount: 0,
                    sumCompliance: 0,
                    approved: 0,
                    failed: 0,
                    pending: 0
                };
            }

            const stat = positionStats[posName];
            stat.headcount++;
            stat.sumCompliance += matrix.compliancePercentage;
            stat.approved += matrix.completedCount;
            stat.failed += matrix.failedCourses.length;
            stat.pending += matrix.pendingCourses.length;

            // Construct Record Document
            const trainingDoc = {
                employeeId: empId,
                name: data.name,
                position: data.position,
                department: data.department,
                history: data.history,
                matrix: matrix, // Use calculated matrix object
                updatedAt: new Date().toISOString()
            };

            const docRef = doc(collection(db, 'training_records'), empId);
            batch.set(docRef, trainingDoc, { merge: true });
            opCount++;

            if (opCount >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }
        }

        // Commit remaining training records
        if (opCount > 0) {
            await batch.commit();
        }

        // 4. Save Aggregated Stats (Analytics)
        console.log('Saving Position Analytics...');
        const statsBatch = writeBatch(db);
        Object.values(positionStats).forEach(stat => {
            const avgCompliance = stat.headcount > 0 ? (stat.sumCompliance / stat.headcount).toFixed(1) : 0;
            const statDoc = {
                name: stat.name,
                department: stat.department,
                headcount: stat.headcount,
                avgCompliance: parseFloat(avgCompliance),
                stats: {
                    approved: stat.approved,
                    failed: stat.failed,
                    pending: stat.pending
                },
                updatedAt: new Date().toISOString()
            };
            const ref = doc(collection(db, 'analytics_puestos'), stat.name.replace(/\//g, '-'));
            statsBatch.set(ref, statDoc);
        });
        await statsBatch.commit();

        return {
            success: true,
            processed: employeeRecords.size,
            inconsistencies: Array.from(inconsistencies)
        };

    } catch (error) {
        console.error('History Seed Error:', error);
        return { success: false, error: error.message };
    }
};

// NEW: Recalculate compliance from existing Firestore data ONLY (no JSON)
export const recalculateComplianceFromFirestore = async () => {
    try {
        console.log('Starting Compliance Recalculation from Firestore...');

        // 1. Fetch positions (required courses)
        const positionsSnap = await getDocs(collection(db, 'positions'));
        const requirementsMap = new Map();
        const requirementsMapNormalized = new Map();

        positionsSnap.docs.forEach(d => {
            const data = d.data();
            const exactKey = normalize(data.name);
            const normalizedKey = normalizeForMatch(data.name);
            // Store courses as-is (normalized for display)
            const courses = (data.requiredCourses || []).map(c => normalize(c));
            requirementsMap.set(exactKey, courses);
            requirementsMapNormalized.set(normalizedKey, courses);
        });

        console.log(`Loaded ${requirementsMap.size} positions from Firestore`);

        // 2. Fetch existing training_records from Firestore
        const recordsSnap = await getDocs(collection(db, 'training_records'));

        const batchSize = 450;
        let batch = writeBatch(db);
        let opCount = 0;
        let processed = 0;

        for (const recordDoc of recordsSnap.docs) {
            const data = recordDoc.data();
            const empPosition = normalize(data.position || '');

            // Get required courses for this position
            let positionReqs = requirementsMap.get(empPosition);
            if (!positionReqs || positionReqs.length === 0) {
                const normalizedPosition = normalizeForMatch(empPosition);
                positionReqs = requirementsMapNormalized.get(normalizedPosition) || [];
            }

            // Use Centralized Compliance Utility
            const matrix = calculateEmployeeCompliance(data.history, positionReqs);

            // Update ONLY the matrix field, preserving all other data
            const docRef = doc(db, 'training_records', recordDoc.id);
            batch.update(docRef, {
                matrix: matrix,
                updatedAt: new Date().toISOString()
            });

            opCount++;
            processed++;

            if (opCount >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }
        }

        // Commit remaining
        if (opCount > 0) {
            await batch.commit();
        }

        console.log(`Recalculated compliance for ${processed} employees`);

        return {
            success: true,
            processed: processed
        };

    } catch (error) {
        console.error('Compliance Recalculation Error:', error);
        return { success: false, error: error.message };
    }
};
