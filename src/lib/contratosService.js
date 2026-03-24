/**
 * contratosService.js
 * Servicio Firebase para la colección "contratos"
 * Incluye helpers de fechas para evaluaciones de desempeño
 */
import { db } from './firebase';
import {
    collection, doc, addDoc, setDoc,
    updateDoc, deleteDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

const COL = 'contratos';

// ── Helpers de fecha ──────────────────────────────────────────────────────────

/**
 * Parsea una fecha en formato DD/MM/YYYY a Date.
 * @param {string} str
 * @returns {Date|null}
 */
export const parseDate = (str) => {
    if (!str || str === '-' || str.trim() === '') return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
};

/**
 * Agrega días a una Date.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

/**
 * Formatea un Date a DD/MM/YYYY.
 * @param {Date|null} date
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

/**
 * Calcula las 3 fechas de evaluación a partir de la fecha de ingreso.
 * 1ª: ingreso + 30d, 2ª: ingreso + 60d, 3ª: ingreso + 80d
 * @param {string} entryDate  formato DD/MM/YYYY
 * @returns {{ first: Date|null, second: Date|null, third: Date|null }}
 */
export const getEvalDates = (entryDate) => {
    const base = parseDate(entryDate);
    if (!base) return { first: null, second: null, third: null };
    return {
        first:  addDays(base, 30),
        second: addDays(base, 60),
        third:  addDays(base, 80),
    };
};

// ── Lógica de Plan de Formación ───────────────────────────────────────────────

const TRAINING_DELIVERY_DAYS = {
    'CALIDAD': 7,
    'METROLOGÍA': 7,
    // El resto es 60 días
};

/**
 * Determina el estado del Plan de Formación basado en el departamento y la fecha de ingreso.
 * @param {string} entryDate formato DD/MM/YYYY
 * @param {string} department
 * @param {string} currentValue 'entregado' | 'pendiente' | '-'
 * @returns {{ isDelivered: boolean, isOverdue: boolean, dueDate: Date|null, daysLimit: number }}
 */
export const getTrainingPlanStatus = (entryDate, department, currentValue) => {
    const isDelivered = currentValue === 'entregado';
    const baseDate = parseDate(entryDate);
    if (!baseDate) return { isDelivered, isOverdue: false, dueDate: null, daysLimit: 60 };

    const deptUpper = (department || '').toUpperCase();
    const daysLimit = TRAINING_DELIVERY_DAYS[deptUpper] || 60; // default 60
    
    const dueDate = addDays(baseDate, daysLimit);
    
    // Solo está vencido si NO está entregado y la fecha de vencimiento ya pasó hoy a las 00:00
    let isOverdue = false;
    if (!isDelivered) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isOverdue = dueDate.getTime() < today.getTime();
    }

    return { isDelivered, isOverdue, dueDate, daysLimit };
};

/**
 * Determina el estado de una evaluación.
 * @param {Date|null} evalDate
 * @param {string}   score      valor almacenado
 * @param {Date}     today
 * @returns {{ status: string, label: string }}
 *   status: 'na' | 'approved' | 'failed' | 'overdue' | 'upcoming' | 'pending'
 */
export const getEvalStatus = (evalDate, score, today = new Date()) => {
    if (!evalDate) return { status: 'na', label: 'N/A' };

    const hasScore = score !== undefined && score !== null && score !== '' && score !== '-';
    if (hasScore) {
        // Lógica de calificación (>= 80 es aprobado)
        const numScore = parseFloat(score);
        let isApproved = false;
        
        if (!isNaN(numScore)) {
            isApproved = numScore >= 80;
        } else {
            // Manejo por si escriben "APROBADO", "Aprobado", etc.
            isApproved = String(score).toUpperCase().includes('APROBADO');
        }

        return { 
            status: isApproved ? 'approved' : 'failed', 
            label: String(score) 
        };
    }

    const msDay = 86_400_000;
    const diff = evalDate.getTime() - today.setHours(0, 0, 0, 0);

    if (diff < 0)          return { status: 'overdue',  label: 'Vencida'  };
    if (diff <= 7 * msDay) return { status: 'upcoming', label: 'Próxima'  };
    return                        { status: 'pending',  label: 'Pendiente' };
};

/**
 * Determina el estado del contrato por su fecha de vencimiento.
 * @param {string} contractEndDate DD/MM/YYYY
 * @param {Date}   today
 * @returns {'active'|'expiring'|'expired'}
 */
export const getContractStatus = (contractEndDate, today = new Date()) => {
    const end = parseDate(contractEndDate);
    if (!end) return 'active';
    const diff = end.getTime() - today.setHours(0, 0, 0, 0);
    const msDay = 86_400_000;
    if (diff < 0)           return 'expired';
    if (diff <= 30 * msDay) return 'expiring';
    return 'active';
};

// ── Firebase CRUD ─────────────────────────────────────────────────────────────

/**
 * Suscripción en tiempo real a la colección "contratos".
 * @param {(items: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export const subscribeContratos = (callback) =>
    onSnapshot(collection(db, COL), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });

/**
 * Crea un nuevo contrato.
 * @param {Object} data
 */
export const createContrato = (data) =>
    addDoc(collection(db, COL), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

/**
 * Actualiza un contrato existente.
 * @param {string} id
 * @param {Object} data
 */
export const updateContrato = (id, data) =>
    updateDoc(doc(db, COL, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });

/**
 * Elimina un contrato.
 * @param {string} id
 */
export const deleteContrato = (id) => deleteDoc(doc(db, COL, id));

/**
 * Importación masiva desde un array JSON.
 * Usa el employeeId como ID de documento (upsert).
 * @param {Array} jsonArray
 */
export const bulkImportContratos = (jsonArray) => {
    const promises = jsonArray.map((item) => {
        // Normaliza claves con espacios del formato exportado
        const clean = {
            employeeId:      item.employeeId      || '',
            name:            item.name            || '',
            position:        item.position        || '',
            department:      item.department      || '',
            area:            item.area            || '',
            shift:           item.shift           || item.turno || '',
            entryDate:       item.entryDate       || '',
            contractEndDate: item.contractEndDate || '',
            trainingPlan:    item['training plan'] || item.trainingPlan || 'pendiente',
            evaluations: {
                first:  { score: '', notes: '' },
                second: { score: '', notes: '' },
                third:  { score: '', notes: '' },
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docId = clean.employeeId || `import_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        return setDoc(doc(db, COL, docId), clean, { merge: true });
    });

    return Promise.all(promises);
};

/** Estructura vacía para nuevo formulario */
export const EMPTY_FORM = {
    employeeId:      '',
    name:            '',
    position:        '',
    department:      '',
    area:            '',
    shift:           '',
    entryDate:       '',
    contractEndDate: '',
    trainingPlan:    'pendiente',
    evaluations: {
        first:  { score: '', notes: '' },
        second: { score: '', notes: '' },
        third:  { score: '', notes: '' },
    },
};
