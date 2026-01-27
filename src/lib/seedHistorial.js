import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import historyData from '@/data/historial.json';

// Normalize string helpers
const normalize = (str) => str?.trim().toUpperCase() || '';
const normalizeForMatch = (str) =>
    normalize(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

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

            // Enhanced: normalize approved courses for matching
            const approvedCoursesSet = new Set(
                data.history
                    .filter(h => h.status === 'approved')
                    .map(h => h.courseName)
            );

            // Also create a fuzzy-match set (remove accents, spaces variations)
            const approvedNormalized = new Set(
                data.history
                    .filter(h => h.status === 'approved')
                    .map(h => h.courseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim())
            );

            // Compliance Logic with fuzzy matching
            const missing = positionReqs.filter(req => {
                // Try exact match first
                if (approvedCoursesSet.has(req)) return false;
                // Try normalized match
                const reqNormalized = req.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();
                if (approvedNormalized.has(reqNormalized)) return false;
                return true; // Not found
            });

            const complianceScore = positionReqs.length > 0
                ? ((positionReqs.length - missing.length) / positionReqs.length) * 100
                : 100;

            // Separate Failed vs Pending
            const historyNames = new Set(data.history.map(h => h.courseName));
            const failedCourses = [];
            const pendingCourses = [];

            missing.forEach(req => {
                if (historyNames.has(req)) {
                    failedCourses.push(req);
                } else {
                    pendingCourses.push(req);
                }
            });

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
            stat.sumCompliance += complianceScore;
            stat.approved += (positionReqs.length - missing.length);
            stat.failed += failedCourses.length;
            stat.pending += pendingCourses.length;

            // Construct Record Document
            const trainingDoc = {
                employeeId: empId,
                name: data.name,
                position: data.position,
                department: data.department, // FIX: Use data.department (from JSON) not posData
                history: data.history,
                matrix: {
                    requiredCount: positionReqs.length,
                    completedCount: positionReqs.length - missing.length,
                    missingCourses: missing,
                    failedCourses: failedCourses,
                    pendingCourses: pendingCourses,
                    compliancePercentage: parseFloat(complianceScore.toFixed(2))
                },
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

            // Get approved courses from existing history
            const history = data.history || [];

            // Create SET of approved courses using normalizeForMatch for comparison
            const approvedNormalized = new Set(
                history
                    .filter(h => h.status === 'approved')
                    .map(h => normalizeForMatch(h.courseName))
            );

            // Calculate missing courses - compare using normalizeForMatch
            const missing = positionReqs.filter(req => {
                const reqNormalized = normalizeForMatch(req);
                return !approvedNormalized.has(reqNormalized);
            });

            const complianceScore = positionReqs.length > 0
                ? ((positionReqs.length - missing.length) / positionReqs.length) * 100
                : 100;

            // Separate failed vs pending using normalizeForMatch
            const historyNormalized = new Set(history.map(h => normalizeForMatch(h.courseName)));

            const failedCourses = [];
            const pendingCourses = [];

            missing.forEach(req => {
                const reqNormalized = normalizeForMatch(req);
                if (historyNormalized.has(reqNormalized)) {
                    failedCourses.push(req);
                } else {
                    pendingCourses.push(req);
                }
            });

            // Update ONLY the matrix field, preserving all other data
            const docRef = doc(db, 'training_records', recordDoc.id);
            batch.update(docRef, {
                matrix: {
                    requiredCount: positionReqs.length,
                    completedCount: positionReqs.length - missing.length,
                    missingCourses: missing,
                    failedCourses: failedCourses,
                    pendingCourses: pendingCourses,
                    compliancePercentage: parseFloat(complianceScore.toFixed(2))
                },
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
