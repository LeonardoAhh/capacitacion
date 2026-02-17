import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

const DEFAULT_ITEMS_PER_PAGE = 4;

/**
 * Hook de paginación para empleados con cursores de Firestore.
 * Maneja navegación next/prev con stack de cursores.
 *
 * @param {number} itemsPerPage - Items por página
 * @returns {object} Estado de paginación y funciones de navegación
 */
export function useEmployeePagination(itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Cursors to track pagination
    const lastVisibleRef = useRef(null);
    const firstVisibleRef = useRef(null);
    const cursorsStackRef = useRef([]);

    const loadEmployees = useCallback(async (direction = 'initial', searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const employeesRef = collection(db, 'employees');
            const baseConstraints = [orderBy('employeeId', 'asc')];
            let q;

            if (searchTerm) {
                // Search: load more records and filter locally
                const searchUpper = searchTerm.toUpperCase().trim();
                const allDocsQuery = query(
                    employeesRef,
                    orderBy('employeeId', 'asc'),
                    limit(200)
                );

                const allSnapshot = await getDocs(allDocsQuery);

                if (!allSnapshot.empty) {
                    const allEmployees = allSnapshot.docs.map(d => ({
                        id: d.id,
                        ...d.data()
                    }));

                    const filtered = allEmployees.filter(emp => {
                        const name = (emp.name || '').toUpperCase();
                        const empId = (emp.employeeId || '').toString().toUpperCase();
                        const position = (emp.position || '').toUpperCase();
                        const department = (emp.department || '').toUpperCase();

                        return name.includes(searchUpper) ||
                            empId.includes(searchUpper) ||
                            position.includes(searchUpper) ||
                            department.includes(searchUpper);
                    });

                    setEmployees(filtered.slice(0, itemsPerPage));
                    setHasMore(filtered.length > itemsPerPage);
                    setPage(1);
                    cursorsStackRef.current = [];
                } else {
                    setEmployees([]);
                    setHasMore(false);
                    setPage(1);
                }
                setLoading(false);
                return;
            }

            // Pagination Logic
            if (direction === 'next' && lastVisibleRef.current) {
                q = query(employeesRef, ...baseConstraints, startAfter(lastVisibleRef.current), limit(itemsPerPage));
            } else if (direction === 'prev' && cursorsStackRef.current.length > 1) {
                cursorsStackRef.current.pop();
                cursorsStackRef.current.pop();

                const previousCursor = cursorsStackRef.current[cursorsStackRef.current.length - 1];

                if (previousCursor) {
                    q = query(employeesRef, ...baseConstraints, startAfter(previousCursor), limit(itemsPerPage));
                } else {
                    q = query(employeesRef, ...baseConstraints, limit(itemsPerPage));
                }
            } else {
                // Initial load
                q = query(employeesRef, ...baseConstraints, limit(itemsPerPage));
                cursorsStackRef.current = [];
                setPage(1);
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                if (direction === 'initial' || direction === 'search') {
                    setEmployees([]);
                    setHasMore(false);
                } else {
                    setHasMore(false);
                }
                setLoading(false);
                return;
            }

            const firstDoc = snapshot.docs[0];
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            lastVisibleRef.current = lastDoc;
            firstVisibleRef.current = firstDoc;

            setHasMore(snapshot.docs.length === itemsPerPage);

            const employeesList = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            setEmployees(employeesList);

            if (direction === 'next') setPage(p => p + 1);
            if (direction === 'prev') setPage(p => Math.max(1, p - 1));

        } catch (err) {
            console.error('Error loading employees:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    const nextPage = useCallback(() => {
        if (!hasMore) return;
        cursorsStackRef.current.push(lastVisibleRef.current);
        loadEmployees('next');
    }, [hasMore, loadEmployees]);

    const prevPage = useCallback(() => {
        if (page <= 1) return;
        loadEmployees('prev');
    }, [page, loadEmployees]);

    const refresh = useCallback(() => {
        loadEmployees('initial');
    }, [loadEmployees]);

    // Reset pagination when itemsPerPage changes
    useEffect(() => {
        setPage(1);
        lastVisibleRef.current = null;
        firstVisibleRef.current = null;
        cursorsStackRef.current = [];
        loadEmployees('initial');
    }, [itemsPerPage, loadEmployees]);

    return {
        employees,
        setEmployees,
        loading,
        error,
        page,
        hasMore,
        nextPage,
        prevPage,
        refresh,
        loadEmployees,
    };
}
