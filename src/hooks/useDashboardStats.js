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

    // ─── Helper: parseo seguro de fechas (Firestore Timestamp, ISO string o YYYY-MM-DD) ──
    const parseDateToLocal = (value) => {
        if (!value) return null;
        // Firestore Timestamp
        if (value?.toDate) return value.toDate();
        // String con hora (ISO): recortar a fecha local pura
        if (typeof value === 'string') {
            const dateOnly = value.split('T')[0];
            const [y, m, d] = dateOnly.split('-').map(Number);
            if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        }
        return null;
    };

    // ─── Calcular estadísticas derivadas con useMemo ────────────
    const stats = useMemo(() => {
        if (rawEmployees.length === 0) {
            return { totalEmployees: 0, activeContracts: 0, expiringContracts: 0 };
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const totalEmployees = rawEmployees.length;

        const activeContracts = rawEmployees.filter(emp => {
            const endDate = parseDateToLocal(emp.contractEndDate);
            if (!endDate) return false;
            return endDate >= now;
        }).length;

        const expiringContracts = rawEmployees.filter(emp => {
            const endDate = parseDateToLocal(emp.contractEndDate);
            if (!endDate) return false;
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
                const endDate = parseDateToLocal(emp.contractEndDate);
                if (!endDate) return false;
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            })
            .map(emp => {
                const endDate = parseDateToLocal(emp.contractEndDate);
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                // Normalizar contractEndDate a string YYYY-MM-DD para el widget de display
                const contractEndDate = endDate.toISOString().split('T')[0];
                return { ...emp, contractEndDate, daysUntilExpiry };
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

                const evalDate = parseDateToLocal(evalItem.date);
                if (!evalDate) return; // fecha inválida, ignorar
                const daysUntil = Math.ceil((evalDate - now) / (1000 * 60 * 60 * 24));
                const hasScore = evalItem.score !== '' && evalItem.score !== null && evalItem.score !== undefined;
                // Normalizar la fecha a string YYYY-MM-DD para el display
                const dateStr = evalDate.toISOString().split('T')[0];

                const baseInfo = {
                    employeeId: emp.employeeId,
                    employeeName: emp.name,
                    position: emp.position,
                    area: emp.area,
                    department: emp.department,
                    shift: emp.shift,
                    evalNum: evalItem.num,
                    date: dateStr,
                    evaluationType: `Evaluación ${evalItem.num}`,
                };

                if (daysUntil >= 0 && daysUntil <= 3 && !hasScore) {
                    upcoming.push({
                        ...baseInfo,
                        daysUntil,
                        scheduledDate: dateStr,
                    });
                }

                if (daysUntil < 0 && !hasScore) {
                    overdue.push({
                        ...baseInfo,
                        daysOverdue: Math.abs(daysUntil),
                        dueDate: dateStr,
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
            { DEPARTAMENTO: "CALIDAD", ÁREA: "CALIDAD ADMINISTRATIVO", DIAS: 7 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "SGI", DIAS: 60 },
            { DEPARTAMENTO: "CALIDAD", ÁREA: "RESIDENTES DE CALIDAD", DIAS: 7 },
            { DEPARTAMENTO: "COMERCIAL", ÁREA: "VENTAS", DIAS: 60 },
            { DEPARTAMENTO: "GERENCIA DE PLANTA", ÁREA: "GERENCIA", DIAS: 60 },
            { DEPARTAMENTO: "LOGISTICA", ÁREA: "LOGISTICA", DIAS: 60 },
            { DEPARTAMENTO: "MANTENIMIENTO", ÁREA: "MANTENIMIENTO", DIAS: 90 },
            { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN ADMINISTRATIVO", DIAS: 60 },
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

            // Parseo seguro: soporta Firestore Timestamp, ISO string o YYYY-MM-DD
            let rawStartStr;
            if (emp.startDate?.toDate) {
                // Firestore Timestamp
                rawStartStr = emp.startDate.toDate().toISOString().split('T')[0];
            } else if (typeof emp.startDate === 'string') {
                rawStartStr = emp.startDate.split('T')[0];
            } else {
                return; // formato desconocido, ignorar
            }

            const startDate = new Date(rawStartStr + 'T00:00:00');
            if (isNaN(startDate.getTime())) return; // fecha inválida, ignorar

            const config = TRAINING_PLAN_CONFIG.find(
                c => c.DEPARTAMENTO.toUpperCase() === emp.department.toUpperCase() &&
                    (c.ÁREA.toUpperCase() === (emp.area || '').toUpperCase())
            ) || TRAINING_PLAN_CONFIG.find(
                c => c.DEPARTAMENTO.toUpperCase() === emp.department.toUpperCase()
            );

            const daysAllowed = config?.DIAS || 60;
            const deliveryDate = new Date(startDate);
            deliveryDate.setDate(deliveryDate.getDate() + daysAllowed);

            const daysUntil = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));

            const baseInfo = {
                employeeId: emp.employeeId,
                employeeName: emp.name,
                dueDate: deliveryDate.toISOString().split('T')[0],
                department: emp.department,
                shift: emp.shift || null,
                // Guardamos el doc ID de Firestore para poder actualizarlo desde el modal
                firestoreId: emp.id,
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
