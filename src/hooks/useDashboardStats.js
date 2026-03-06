'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Hook que encapsula toda la lógica de datos del dashboard RH.
 * Carga estadísticas de empleados, contratos, evaluaciones y datos del usuario.
 *
 * @param {object|null} user - Usuario autenticado del AuthContext
 * @returns {{ stats, evaluations, expiringEmployees, userName, userGender, loading }}
 */
export function useDashboardStats(user) {
    const [rawEmployees, setRawEmployees] = useState([]);
    const [userName, setUserName] = useState('');
    const [userGender, setUserGender] = useState(null);
    const [loading, setLoading] = useState(true);

    // ─── Cargar datos del usuario logueado ──────────────────────
    const loadUserData = useCallback(async () => {
        if (!user?.email) return;
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                setUserName(userData.nombre || '');
                setUserGender(userData.gender || userData.genero || null);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }, [user?.email]);

    // ─── Cargar todos los empleados desde Firestore ─────────────
    const loadEmployees = useCallback(async () => {
        try {
            const employeesRef = collection(db, 'employees');
            const snapshot = await getDocs(employeesRef);
            const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRawEmployees(employees);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Disparar carga cuando el usuario cambia ────────────────
    useEffect(() => {
        if (!user) return;
        loadEmployees();
        loadUserData();
    }, [user, loadEmployees, loadUserData]);

    // ─── Calcular estadísticas derivadas con useMemo ────────────
    const stats = useMemo(() => {
        if (rawEmployees.length === 0) {
            return { totalEmployees: 0, activeContracts: 0, expiringContracts: 0 };
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const totalEmployees = rawEmployees.length;

        const activeContracts = rawEmployees.filter(emp => {
            if (!emp.contractEndDate) return false;
            const endDate = new Date(emp.contractEndDate + 'T00:00:00');
            return endDate >= now;
        }).length;

        const expiringContracts = rawEmployees.filter(emp => {
            if (!emp.contractEndDate) return false;
            const endDate = new Date(emp.contractEndDate + 'T00:00:00');
            const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        }).length;

        return { totalEmployees, activeContracts, expiringContracts };
    }, [rawEmployees]);

    // ─── Lista de empleados con contratos por vencer ────────────
    const expiringEmployees = useMemo(() => {
        if (rawEmployees.length === 0) return [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return rawEmployees
            .filter(emp => {
                if (!emp.contractEndDate) return false;
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            })
            .map(emp => {
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                const now2 = new Date();
                now2.setHours(0, 0, 0, 0);
                const daysUntilExpiry = Math.ceil((endDate - now2) / (1000 * 60 * 60 * 24));
                return { ...emp, daysUntilExpiry };
            })
            .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }, [rawEmployees]);

    // ─── Evaluaciones próximas y vencidas ───────────────────────
    const evaluations = useMemo(() => {
        if (rawEmployees.length === 0) return { upcoming: [], overdue: [] };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = [];
        const overdue = [];

        rawEmployees.forEach(emp => {
            const evalDates = [
                { num: 1, date: emp.eval1Date, score: emp.eval1Score },
                { num: 2, date: emp.eval2Date, score: emp.eval2Score },
                { num: 3, date: emp.eval3Date, score: emp.eval3Score }
            ];

            evalDates.forEach(evalItem => {
                if (!evalItem.date) return;

                const evalDate = new Date(evalItem.date + 'T00:00:00');
                const daysUntil = Math.ceil((evalDate - now) / (1000 * 60 * 60 * 24));
                const hasScore = evalItem.score !== '' && evalItem.score !== null && evalItem.score !== undefined;

                const baseInfo = {
                    employeeId: emp.employeeId,
                    employeeName: emp.name,
                    position: emp.position,
                    area: emp.area,
                    department: emp.department,
                    shift: emp.shift,
                    evalNum: evalItem.num,
                    date: evalItem.date,
                    evaluationType: `Evaluación ${evalItem.num}`,
                };

                if (daysUntil >= 0 && daysUntil <= 3 && !hasScore) {
                    upcoming.push({
                        ...baseInfo,
                        daysUntil,
                        scheduledDate: evalItem.date,
                    });
                }

                if (daysUntil < 0 && !hasScore) {
                    overdue.push({
                        ...baseInfo,
                        daysOverdue: Math.abs(daysUntil),
                        dueDate: evalItem.date,
                    });
                }
            });
        });

        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
        overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

        return { upcoming, overdue };
    }, [rawEmployees]);

    // ─── Planes de Formación (RG-REC-048) próximos y vencidos ──────────────
    const trainingPlans = useMemo(() => {
        if (rawEmployees.length === 0) return { upcoming: [], overdue: [] };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = [];
        const overdue = [];

        // Importación de lógica estática equivalente a useEmployeeDates para el hook
        const TRAINING_PLAN_CONFIG = [
            { DEPARTAMENTO: "ALMACÉN", ÁREA: "ALMACÉN", DIAS: 60 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 1ER TURNO", DIAS: 7 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 2DO TURNO", DIAS: 7 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "METROLOGÍA", DIAS: 7 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "CALIDAD ADMTVO", DIAS: 7 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "SGI", DIAS: 60 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "RESIDENTES DE CALIDAD", DIAS: 7 },
            { DEPARTAMENTO: "COMERCIAL", ÁREA: "VENTAS", DIAS: 60 },
            { DEPARTAMENTO: "GERENCIA DE PLANTA", ÁREA: "GERENCIA", DIAS: 60 },
            { DEPARTAMENTO: "LOGISTICA", ÁREA: "LOGISTICA", DIAS: 60 },
            { DEPARTAMENTO: "MANTENIMIENTO", ÁREA: "MANTENIMIENTO", DIAS: 90 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN ADMTVO", DIAS: 60 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN MONTAJE", DIAS: 60 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 1ER TURNO", DIAS: 60 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 2DO TURNO", DIAS: 60 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 3ER TURNO", DIAS: 60 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 4TO TURNO", DIAS: 60 },
            { DEPARTAMENTO: "PROYECTOS", ÁREA: "PROYECTOS", DIAS: 60 },
            { DEPARTAMENTO: "RECURSOS HUMANOS", ÁREA: "RECURSOS HUMANOS", DIAS: 60 },
            { DEPARTAMENTO: "SISTEMAS", ÁREA: "SISTEMAS", DIAS: 60 },
            { DEPARTAMENTO: "TALLER DE MOLDES", ÁREA: "MOLDES", DIAS: 60 }
        ];

        rawEmployees.forEach(emp => {
            // Solo evaluamos si no se ha entregado el plan
            if (emp.trainingPlanDelivered) return;
            if (!emp.startDate || !emp.department) return;

            const config = TRAINING_PLAN_CONFIG.find(
                c => c.DEPARTAMENTO.toUpperCase() === emp.department.toUpperCase() &&
                    (c.ÁREA.toUpperCase() === (emp.area || '').toUpperCase())
            ) || TRAINING_PLAN_CONFIG.find(
                c => c.DEPARTAMENTO.toUpperCase() === emp.department.toUpperCase()
            );

            const daysAllowed = config?.DIAS || 60;
            const startDate = new Date(emp.startDate + 'T00:00:00');
            const deliveryDate = new Date(startDate);
            deliveryDate.setDate(deliveryDate.getDate() + daysAllowed);

            const daysUntil = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));

            const baseInfo = {
                employeeId: emp.employeeId,
                employeeName: emp.name,
                dueDate: deliveryDate.toISOString().split('T')[0],
                department: emp.department,
            };

            // Vencido
            if (daysUntil < 0) {
                overdue.push({
                    ...baseInfo,
                    daysOverdue: Math.abs(daysUntil)
                });
            }
            // Próximo a vencer (0 a 7 días)
            else if (daysUntil >= 0 && daysUntil <= 7) {
                upcoming.push({
                    ...baseInfo,
                    daysUntil
                });
            }
        });

        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
        overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

        return { upcoming, overdue };
    }, [rawEmployees]);

    return {
        stats,
        evaluations,
        expiringEmployees,
        trainingPlans,
        userName,
        userGender,
        loading,
    };
}
