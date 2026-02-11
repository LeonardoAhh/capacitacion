import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    updateDoc,
    limit,
    startAfter,
    endBefore,
    limitToLast,
    where,
    setDoc
} from 'firebase/firestore';

const ITEMS_PER_PAGE = 4; // Default value

export const useEmployees = (itemsPerPage = ITEMS_PER_PAGE) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalEmployees, setTotalEmployees] = useState(0); // Estimated or tracked

    // Cursors to track pagination
    const lastVisibleRef = useRef(null);
    const firstVisibleRef = useRef(null);
    const cursorsStackRef = useRef([]); // To go back

    const loadEmployees = useCallback(async (direction = 'initial', searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const employeesRef = collection(db, 'employees');
            let q;

            // Basic query constraints
            const baseConstraints = [orderBy('employeeId', 'asc')];

            if (searchTerm) {
                // Search strategy: Firestore doesn't support full-text search.
                // We'll try two approaches:

                const searchUpper = searchTerm.toUpperCase().trim();
                const searchLower = searchTerm.toLowerCase().trim();

                // 1. First try: exact or prefix match on employeeId
                // 2. Second try: prefix match on name
                // 3. Fallback: load all and filter locally (for partial matching)

                // For small datasets, local filtering is acceptable
                // For large datasets, consider Algolia/Elasticsearch

                // Load more records and filter locally for flexibility
                const allDocsQuery = query(
                    employeesRef,
                    orderBy('employeeId', 'asc'),
                    limit(200) // Load more for local filtering
                );

                const allSnapshot = await getDocs(allDocsQuery);

                if (!allSnapshot.empty) {
                    const allEmployees = allSnapshot.docs.map(d => ({
                        id: d.id,
                        ...d.data()
                    }));

                    // Filter locally - search in name, employeeId, position, department
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

                    // Batch state updates to prevent losing focus
                    const newEmployees = filtered.slice(0, itemsPerPage);
                    const newHasMore = filtered.length > itemsPerPage;

                    // Update all states in a single batch
                    setEmployees(newEmployees);
                    setHasMore(newHasMore);
                    setPage(1);
                    cursorsStackRef.current = [];
                    setLoading(false);
                    return;
                } else {
                    setEmployees([]);
                    setHasMore(false);
                    setPage(1);
                    setLoading(false);
                    return;
                }
            } else {
                // Pagination Logic
                if (direction === 'next' && lastVisibleRef.current) {
                    q = query(employeesRef, ...baseConstraints, startAfter(lastVisibleRef.current), limit(itemsPerPage));
                } else if (direction === 'prev' && cursorsStackRef.current.length > 1) {
                    // Pop current page start
                    cursorsStackRef.current.pop();
                    // Get previous page start
                    const prevStart = cursorsStackRef.current[cursorsStackRef.current.length - 1];
                    // We need to query starting after the *previous* page's start (or initial)
                    // Actually, simpler approach for 'prev': 
                    // If we save the "first doc" of each page, we can use startAt or just pop stack.
                    // Let's use the stack of "lastVisible" of previous pages? 
                    // Standard reliable approach: Query fresh using the cursor from stack.

                    // But standard firestore hook pattern:
                    // Stack contains the "lastVisible" of the pages before this one.
                    // Page 1: stack empty.
                    // Page 2: stack has [Page1LastVisible].
                    // Page 3: stack has [Page1LastVisible, Page2LastVisible].

                    const prevCursor = cursorsStackRef.current[cursorsStackRef.current.length - 1]; // This is the cursor FOR the current page we want to load?
                    // Wait, if we are on Page 2, stack has [Page1Last].
                    // We want Page 1. Stack should be empty.

                    // Let's redefine: cursorsStack has the "lastVisible" of all loaded pages.
                    // P1 loaded. lastVisible is D10. P1 pushed to stack? No.

                    // Simpler: 
                    // initial: limit(10).
                    // next: startAfter(lastVisible). push lastVisible to stack.
                    // prev: pop stack. last cursor = stack[len-1]. 
                    // If stack empty, initial.
                    // If stack not empty, startAfter(stack.peek).

                    // Implementing 'prev':
                    cursorsStackRef.current.pop(); // Remove the cursor that got us to CURRENT page.

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
            }

            const snapshot = await getDocs(q);

            // Check if we have results
            if (snapshot.empty) {
                if (direction === 'initial' || direction === 'search') {
                    setEmployees([]);
                    setHasMore(false);
                } else {
                    // reached end?
                    setHasMore(false);
                }
                setLoading(false);
                return;
            }

            // Update Cursors
            const firstDoc = snapshot.docs[0];
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            lastVisibleRef.current = lastDoc;
            firstVisibleRef.current = firstDoc;

            // Check if there are more? 
            // We loaded ITEMS_PER_PAGE. If we got less, end of list. 
            // If we got equal, maybe more.
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

            const employeesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(employeesList);

            // Update Page Number
            if (direction === 'next') setPage(p => p + 1);
            if (direction === 'prev') setPage(p => Math.max(1, p - 1));

            // Update Stack for 'next'
            if (direction === 'next') {
                // We need to push the cursor that WAS used to get here? 
                // No, we use lastVisibleRef to get to NEXT page. 
                // We need to store the cursor that STARTS current page? 
                // Actually the stack should store "End of Page 1", "End of Page 2"...
                // So when on Page 3 (started after End of Page 2), and we click Prev, we use "End of Page 1".

                // So, BEFORE loading this new page, we should have pushed the previous lastVisible?
                // The logic above in 'prev' implies stack has the cursors *to start* pages.
            }

        } catch (err) {
            console.error('Error loading employees:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]); // Added itemsPerPage as dependency


    // Helper wrapper to manage the stack correctly
    const nextPage = useCallback(() => {
        if (!hasMore) return;
        cursorsStackRef.current.push(lastVisibleRef.current);
        loadEmployees('next');
    }, [hasMore, loadEmployees]);

    const prevPage = useCallback(() => {
        if (page <= 1) return;
        loadEmployees('prev');
    }, [page, loadEmployees]);

    const searchEmployees = useCallback((term) => {
        loadEmployees('initial', term);
    }, [loadEmployees]);

    const refresh = useCallback(() => {
        loadEmployees('initial');
    }, [loadEmployees]);

    const createEmployee = useCallback(async (employeeData) => {
        try {
            // Validate unique employeeId
            if (employeeData.employeeId) {
                // Check if document exists directly using ID
                const docRef = doc(db, 'employees', employeeData.employeeId);
                const docSnap = await getDocs(query(collection(db, 'employees'), where('employeeId', '==', employeeData.employeeId), limit(1))); // Keep legacy check for safety if mixed IDs exist, or switch to getDoc(docRef) if fully migrated.

                // Better approach with fully migrated DB:
                // const docSnap = await getDoc(docRef);
                // if (docSnap.exists()) ...

                // But since we might have old docs, let's stick to query OR getDoc depending on migration status.
                // Assuming fully migrated or hybrid, getDoc(docRef) is safest to prevent overwriting by ID key.
                const directDocSnap = await getDocs(query(collection(db, 'employees'), where('__name__', '==', employeeData.employeeId)));

                if (!directDocSnap.empty) {
                    return {
                        success: false,
                        error: 'ID_DUPLICADO',
                        message: `El ID de empleado "${employeeData.employeeId}" ya existe. Por favor usa un ID diferente.`
                    };
                }
            }

            // Create with specific ID
            await setDoc(doc(db, 'employees', employeeData.employeeId), {
                ...employeeData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            refresh(); // Reload to initial to show new data at top
            return { success: true, id: employeeData.employeeId };
        } catch (err) {
            console.error('Error creating employee:', err);
            return { success: false, error: err.message };
        }
    }, [refresh]);

    const updateEmployee = useCallback(async (id, employeeData) => {
        try {
            await updateDoc(doc(db, 'employees', id), {
                ...employeeData,
                updatedAt: new Date().toISOString()
            });
            refresh();
            return { success: true };
        } catch (err) {
            console.error('Error updating employee:', err);
            return { success: false, error: err.message };
        }
    }, [refresh]);

    const deleteEmployee = useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'employees', id));
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            if (employees.length === 1 && page > 1) {
                prevPage();
            }
            return { success: true };
        } catch (err) {
            console.error('Error deleting employee:', err);
            refresh();
            return { success: false, error: err.message };
        }
    }, [employees.length, page, prevPage, refresh]);

    // Initial load effect to ensure data is fetched if no one calls refresh
    // We remove this if we want manual control, but standard hooks usually auto-load
    // However, page.js controls it with `user` check. 
    // If we add it here, we might double load if page.js also calls it.
    // Let's relying on `refresh` being stable now, so page.js logic is safe.

    // Reset pagination when itemsPerPage changes
    useEffect(() => {
        // Reset to page 1 and clear cursors when itemsPerPage changes
        setPage(1);
        lastVisibleRef.current = null;
        firstVisibleRef.current = null;
        cursorsStackRef.current = [];
        // Reload data with new page size
        loadEmployees('initial');
    }, [itemsPerPage, loadEmployees]);

    return {
        employees,
        loading,
        error,
        page,
        hasMore,
        nextPage,
        prevPage,
        searchEmployees,
        refresh,
        createEmployee,
        updateEmployee,
        deleteEmployee
    };
};
