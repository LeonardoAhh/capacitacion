import { useState, useCallback, useRef } from 'react';
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
    where
} from 'firebase/firestore';

const ITEMS_PER_PAGE = 10;

export const useEmployees = () => {
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
                // NOTE: Firestore doesn't support simple full-text search. 
                // We implements a basic prefix search on 'name'.
                // For production with thousands of records, use Algolia/Elasticsearch.
                // Assuming 'name' is stored uppercase as in the form.
                const searchUpper = searchTerm.toUpperCase();
                q = query(
                    employeesRef,
                    orderBy('name'),
                    where('name', '>=', searchUpper),
                    where('name', '<=', searchUpper + '\uf8ff'),
                    limit(ITEMS_PER_PAGE)
                );
                // When searching, we keep it simple: no complex pagination for now or reset page
                setPage(1);
                cursorsStackRef.current = [];
            } else {
                // Pagination Logic
                if (direction === 'next' && lastVisibleRef.current) {
                    q = query(employeesRef, ...baseConstraints, startAfter(lastVisibleRef.current), limit(ITEMS_PER_PAGE));
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
                        q = query(employeesRef, ...baseConstraints, startAfter(previousCursor), limit(ITEMS_PER_PAGE));
                    } else {
                        q = query(employeesRef, ...baseConstraints, limit(ITEMS_PER_PAGE));
                    }

                } else {
                    // Initial load
                    q = query(employeesRef, ...baseConstraints, limit(ITEMS_PER_PAGE));
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
    }, []);

    // Helper wrapper to manage the stack correctly
    const nextPage = () => {
        if (!hasMore) return;
        cursorsStackRef.current.push(lastVisibleRef.current);
        loadEmployees('next');
    };

    const prevPage = () => {
        if (page <= 1) return;
        loadEmployees('prev');
    };

    const searchEmployees = (term) => {
        loadEmployees('initial', term);
    };

    const refresh = () => {
        loadEmployees('initial');
    };

    const createEmployee = async (employeeData) => {
        try {
            const docRef = await addDoc(collection(db, 'employees'), {
                ...employeeData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            refresh(); // Reload to initial to show new data at top
            return { success: true, id: docRef.id };
        } catch (err) {
            console.error('Error creating employee:', err);
            return { success: false, error: err.message };
        }
    };

    const updateEmployee = async (id, employeeData) => {
        try {
            await updateDoc(doc(db, 'employees', id), {
                ...employeeData,
                updatedAt: new Date().toISOString()
            });
            // Don't full reload, just local update if possible or reload current page
            // For pagination consistency, easiest ensures data is correct:
            // loadEmployees('initial'); // Or keep current page?
            // Keeping current page is hard without refetching it specifically.
            // Let's reload current page context if simple, or just refresh to be safe.
            refresh();
            return { success: true };
        } catch (err) {
            console.error('Error updating employee:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteEmployee = async (id) => {
        try {
            await deleteDoc(doc(db, 'employees', id));
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            // Recalculate if page is empty? 
            // If page becomes empty, we should fetch prev?
            if (employees.length === 1 && page > 1) {
                prevPage();
            }
            return { success: true };
        } catch (err) {
            console.error('Error deleting employee:', err);
            refresh();
            return { success: false, error: err.message };
        }
    };

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
