import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { normalizePromotionRule } from '@/lib/promotionUtils';

export function usePromotionsData(user, showConfirm, toast) {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [promotionRules, setPromotionRules] = useState([]);
    const [departments, setDepartments] = useState([]);

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
        loadData,
        handlePromoteEmployee
    };
}
