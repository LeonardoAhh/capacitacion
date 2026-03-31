import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getSemesterPeriod, normalizePromotionRule } from '@/lib/promotionUtils';
import { seedHistoryData } from '@/lib/seedHistorial';

export function usePromotionsData(user, showConfirm, toast) {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [promotionRules, setPromotionRules] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [reprocessing, setReprocessing] = useState(false);

    const seedPromotionRules = useCallback(async (forceReload = false) => {
        try {
            if (forceReload) {
                const existingRules = await getDocs(collection(db, 'promotion_rules'));
                for (const ruleDoc of existingRules.docs) {
                    await deleteDoc(doc(db, 'promotion_rules', ruleDoc.id));
                }
            }

            let rawRules = [];
            try {
                // If the local JSON exists, we'd use it here.
                // Currently returning empty to handle missing file gracefully.
                if (false) {
                    rawRules = [];
                } else {
                    console.warn("promociones.json deleted from repo - skipping seed");
                }
            } catch (e) {
                console.warn("Could not load promociones.json");
            }

            if (!rawRules || rawRules.length === 0) {
                toast.error('Info', 'Archivo de reglas (promociones.json) no disponible.');
                return;
            }

            const rules = rawRules.default || rawRules;

            const normalized = rules.map((r, i) => ({
                ...normalizePromotionRule(r),
                id: `rule_${i}`
            }));

            for (const rule of normalized) {
                await setDoc(doc(db, 'promotion_rules', rule.id), rule);
            }

            setPromotionRules(normalized);
            toast.success('Reglas Cargadas', `Se cargaron ${normalized.length} reglas de promoción`);
        } catch (err) {
            console.error('Error seeding rules:', err);
            toast.error('Error', 'No se pudieron cargar las reglas');
        }
    }, [toast]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            const empData = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEmployees(empData);

            const depts = new Set(empData.map(e => e.department).filter(Boolean));
            setDepartments(Array.from(depts).sort());

            const rulesSnap = await getDocs(collection(db, 'promotion_rules'));
            if (rulesSnap.empty) {
                await seedPromotionRules();
            } else {
                setPromotionRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error', 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [toast, seedPromotionRules]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    const reloadRulesFromJSON = async () => {
        if (!await showConfirm('¿Eliminar todas las reglas existentes y recargar desde el archivo JSON?', { title: 'Recargar Reglas', confirmLabel: 'Recargar', danger: true })) return;
        setLoading(true);
        await seedPromotionRules(true);
        setLoading(false);
    };

    const handleReprocessCompliance = async () => {
        if (!await showConfirm('¿Recalcular el cumplimiento de matriz para todos los empleados? Esto puede tomar unos segundos.', { title: 'Recalcular Cumplimiento', confirmLabel: 'Recalcular' })) return;

        setReprocessing(true);
        try {
            const result = await seedHistoryData();
            if (result.success) {
                toast.success('Reprocesado', `Se actualizaron ${result.processed} empleados.`);
                await loadData();
            } else {
                toast.error('Error', result.error || 'No se pudo reprocesar');
            }
        } catch (err) {
            console.error('Error reprocessing:', err);
            toast.error('Error', 'Error al reprocesar cumplimiento');
        } finally {
            setReprocessing(false);
        }
    };

    const importPromotionData = async () => {
        if (!await showConfirm('¿Importar datos de evaluación de desempeño y temporalidad desde ultimosc.json? Esto actualizará los empleados existentes.', { title: 'Importar Evaluación', confirmLabel: 'Importar' })) return;

        setLoading(true);
        try {
            let rawData = [];
            try {
                throw new Error("File deleted");
            } catch (e) {
                toast.error("Error", "El archivo ultimosc.json ha sido eliminado.");
                setLoading(false);
                return; // Early return prevents execution of the rest of the function
            }
        } catch (err) {
            console.error('Error importing promotion data:', err);
            toast.error('Error', 'No se pudieron importar los datos');
        } finally {
            setLoading(false);
        }
    };

    const importExamData = async () => {
        if (!await showConfirm('¿Importar datos de exámenes desde examens.json? Esto sobrescribirá los intentos de examen existentes.', { title: 'Importar Exámenes', confirmLabel: 'Importar' })) return;

        setLoading(true);
        try {
            const rawData = await import('@/data/examens.json');
            const examDataArray = rawData.default || rawData;

            const examsByEmployee = {};
            for (const exam of examDataArray) {
                const empId = exam.employeeId;
                if (!examsByEmployee[empId]) {
                    examsByEmployee[empId] = [];
                }

                const score = parseInt(exam['calificación obtenida']) || 0;
                const minPassScore = 80;

                examsByEmployee[empId].push({
                    date: exam['fecha ultimo exámen'] || '',
                    score: score,
                    passed: score >= minPassScore
                });
            }

            for (const empId in examsByEmployee) {
                examsByEmployee[empId].sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            let updated = 0;
            let notFound = 0;

            // O(1) lookup map instead of O(n) find per iteration
            const empById = new Map(employees.map(e => [e.employeeId, e]));
            let batch = writeBatch(db);
            let opCount = 0;

            for (const empId in examsByEmployee) {
                const employee = empById.get(empId);
                if (employee?.id) {
                    batch.update(doc(db, 'training_records', employee.id), {
                        promotionData: {
                            ...(employee.promotionData || {}),
                            examAttempts: examsByEmployee[empId]
                        }
                    });
                    opCount++;
                    updated++;
                    // Firestore batch limit: 500 ops
                    if (opCount === 500) {
                        await batch.commit();
                        batch = writeBatch(db);
                        opCount = 0;
                    }
                } else {
                    console.log(`Employee not found for exams: ${empId}`);
                    notFound++;
                }
            }
            if (opCount > 0) await batch.commit();

            const totalExams = examDataArray.length;
            toast.success('Exámenes Importados', `Se actualizaron ${updated} empleados con ${totalExams} exámenes. ${notFound > 0 ? `${notFound} no encontrados.` : ''}`);

            await loadData();
        } catch (err) {
            console.error('Error importing exam data:', err);
            toast.error('Error', 'No se pudieron importar los exámenes');
        } finally {
            setLoading(false);
        }
    };

    const importShiftData = async () => {
        if (!await showConfirm('¿Importar datos de turnos desde turnos.json? Esto actualizará los empleados existentes.', { title: 'Importar Turnos', confirmLabel: 'Importar' })) return;

        setLoading(true);
        try {
            const rawData = await import('@/data/turnos.json');
            const shiftDataArray = rawData.default || rawData;

            let updated = 0;
            let notFound = 0;

            const empById = new Map(employees.map(e => [e.employeeId, e]));
            let batch = writeBatch(db);
            let opCount = 0;

            for (const data of shiftDataArray) {
                const employee = empById.get(data.employeeId);
                if (employee?.id) {
                    batch.update(doc(db, 'training_records', employee.id), { shift: data.turno });
                    opCount++;
                    updated++;
                    if (opCount === 500) {
                        await batch.commit();
                        batch = writeBatch(db);
                        opCount = 0;
                    }
                } else {
                    notFound++;
                }
            }
            if (opCount > 0) await batch.commit();

            toast.success('Turnos Importados', `Se actualizaron ${updated} empleados. ${notFound > 0 ? `${notFound} no encontrados.` : ''}`);
            await loadData();
        } catch (err) {
            console.error('Error importing shift data:', err);
            toast.error('Error', 'No se pudieron importar los turnos');
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteEmployee = async (employee, newPosition, effectiveDate) => {
        try {
            const empRef = doc(db, 'training_records', employee.id);
            const existingPromoData = employee.promotionData || {};

            // Update Firebase document
            await updateDoc(empRef, {
                position: newPosition,
                promotionData: {
                    ...existingPromoData,
                    positionStartDate: effectiveDate,
                    examAttempts: [], // Reset exams for the new position
                    scheduledExam: false
                },
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEmployees(prev => prev.map(e =>
                e.id === employee.id
                    ? {
                        ...e,
                        position: newPosition,
                        promotionData: {
                            ...existingPromoData,
                            positionStartDate: effectiveDate,
                            examAttempts: [],
                            scheduledExam: false
                        }
                    }
                    : e
            ));

            toast.success('¡Empleado Promovido!', `${employee.name} ha sido promovido a ${newPosition}`);
        } catch (error) {
            console.error('Error promoting employee:', error);
            toast.error('Error', 'No se pudo promover al empleado');
            throw error; // Let the modal know it failed
        }
    };

    return {
        loading,
        employees,
        setEmployees,
        promotionRules,
        setPromotionRules,
        departments,
        reprocessing,
        loadData,
        reloadRulesFromJSON,
        handleReprocessCompliance,
        importPromotionData,
        importExamData,
        importShiftData,
        handlePromoteEmployee
    };
}
