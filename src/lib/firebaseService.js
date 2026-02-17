import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizeObject, sanitizeString } from '@/utils/sanitize';

const COLLECTIONS = {
    EMPLOYEES: 'employees',
    USERS: 'users',
    COURSES: 'courses',
    CATALOGS: 'catalogs',
};

export class FirebaseService {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
    }

    async getById(id) {
        try {
            const docRef = doc(db, this.collectionName, id);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                return { success: false, error: 'NOT_FOUND', data: null };
            }

            return {
                success: true,
                data: { id: snapshot.id, ...snapshot.data() },
            };
        } catch (error) {
            console.error(`Error getting document ${id}:`, error);
            return { success: false, error: error.message, data: null };
        }
    }

    async getAll(options = {}) {
        const { orderBy: orderField, orderDirection = 'asc', limitCount, filters = [] } = options;

        try {
            let q = query(this.collectionRef);

            filters.forEach(({ field, operator, value }) => {
                q = query(q, where(field, operator, value));
            });

            if (orderField) {
                q = query(q, orderBy(orderField, orderDirection));
            }

            if (limitCount) {
                q = query(q, limit(limitCount));
            }

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            return { success: true, data };
        } catch (error) {
            console.error('Error getting all documents:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async create(data) {
        try {
            const sanitizedData = sanitizeObject(data);
            const docRef = await addDoc(this.collectionRef, {
                ...sanitizedData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return {
                success: true,
                data: { id: docRef.id, ...sanitizedData },
            };
        } catch (error) {
            console.error('Error creating document:', error);
            return { success: false, error: error.message, data: null };
        }
    }

    async update(id, data) {
        try {
            const sanitizedData = sanitizeObject(data);
            const docRef = doc(db, this.collectionName, id);

            await updateDoc(docRef, {
                ...sanitizedData,
                updatedAt: serverTimestamp(),
            });

            return { success: true, data: { id, ...sanitizedData } };
        } catch (error) {
            console.error(`Error updating document ${id}:`, error);
            return { success: false, error: error.message, data: null };
        }
    }

    async delete(id) {
        try {
            const docRef = doc(db, this.collectionName, id);
            await deleteDoc(docRef);

            return { success: true };
        } catch (error) {
            console.error(`Error deleting document ${id}:`, error);
            return { success: false, error: error.message };
        }
    }

    async query(conditions = []) {
        try {
            let q = query(this.collectionRef);

            conditions.forEach(({ field, operator, value }) => {
                q = query(q, where(field, operator, value));
            });

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            return { success: true, data };
        } catch (error) {
            console.error('Error in query:', error);
            return { success: false, error: error.message, data: [] };
        }
    }
}

export const employeesService = new FirebaseService(COLLECTIONS.EMPLOYEES);
export const usersService = new FirebaseService(COLLECTIONS.USERS);
export const coursesService = new FirebaseService(COLLECTIONS.COURSES);

export async function checkEmployeeIdExists(employeeId) {
    try {
        const employeesRef = collection(db, COLLECTIONS.EMPLOYEES);
        const q = query(employeesRef, where('employeeId', '==', sanitizeString(employeeId)));
        const snapshot = await getDocs(q);

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking employee ID:', error);
        return false;
    }
}

export async function getEmployeeByField(field, value) {
    try {
        const employeesRef = collection(db, COLLECTIONS.EMPLOYEES);
        const q = query(employeesRef, where(field, '==', value), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'NOT_FOUND', data: null };
        }

        const doc = snapshot.docs[0];
        return {
            success: true,
            data: { id: doc.id, ...doc.data() },
        };
    } catch (error) {
        console.error(`Error getting employee by ${field}:`, error);
        return { success: false, error: error.message, data: null };
    }
}
