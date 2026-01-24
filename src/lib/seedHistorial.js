import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import historyData from '@/data/historial.json';

// Normalize string helpers
const normalize = (str) => str?.trim().toUpperCase() || '';

export const seedHistoryData = async () => {
    try {
        console.log('Starting History Seed...');

        // 1. Fetch Dependencies (Courses & Positions)
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const validCourses = new Set(coursesSnap.docs.map(d => normalize(d.data().name)));

        const positionsSnap = await getDocs(collection(db, 'positions'));
        // Only need requirements from Positions collection now
        const requirementsMap = new Map();
        positionsSnap.docs.forEach(d => {
            const data = d.data();
            requirementsMap.set(normalize(data.name), data.requiredCourses.map(normalize));
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
            const positionReqs = requirementsMap.get(data.position) || [];

            const approvedCourses = new Set(
                data.history
                    .filter(h => h.status === 'approved')
                    .map(h => h.courseName)
            );

            // Compliance Logic
            const missing = positionReqs.filter(req => !approvedCourses.has(req));
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
