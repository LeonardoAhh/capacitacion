'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
} from 'firebase/firestore';

const DEFAULT_ITEMS_PER_PAGE = 10;
const MAX_SEARCH_RESULTS = 100;

export function useEmployeePagination(itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalCount, setTotalCount] = useState(null);

    const lastVisibleRef = useRef(null);
    const firstVisibleRef = useRef(null);
    const cursorsStackRef = useRef([]);
    const abortControllerRef = useRef(null);
    const itemsPerPageRef = useRef(itemsPerPage);

    useEffect(() => {
        itemsPerPageRef.current = itemsPerPage;
    }, [itemsPerPage]);

    const loadEmployees = useCallback(async (direction = 'initial', searchTerm = '') => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        const currentItemsPerPage = itemsPerPageRef.current;

        setLoading(true);
        setError(null);

        try {
            const employeesRef = collection(db, 'employees');
            const baseConstraints = [orderBy('employeeId', 'asc')];
            let q;

            if (searchTerm) {
                const searchUpper = searchTerm.toUpperCase().trim();

                if (!searchUpper) {
                    loadEmployees('initial', '');
                    return;
                }

                q = query(
                    employeesRef,
                    orderBy('name'),
                    limit(MAX_SEARCH_RESULTS)
                );

                const snapshot = await getDocs(q);

                if (signal.aborted) return;

                if (!snapshot.empty) {
                    const allEmployees = snapshot.docs.map(d => ({
                        id: d.id,
                        ...d.data(),
                    }));

                    const filtered = allEmployees.filter(emp => {
                        const name = (emp.name || '').toUpperCase();
                        const empId = (emp.employeeId || '').toString().toUpperCase();
                        const position = (emp.position || '').toUpperCase();
                        const department = (emp.department || '').toUpperCase();
                        const curp = (emp.curp || '').toUpperCase();

                        return (
                            name.includes(searchUpper) ||
                            empId.includes(searchUpper) ||
                            position.includes(searchUpper) ||
                            department.includes(searchUpper) ||
                            curp.includes(searchUpper)
                        );
                    });

                    setEmployees(filtered.slice(0, currentItemsPerPage));
                    setHasMore(filtered.length > currentItemsPerPage);
                    setHasPrevious(false);
                    setPage(1);
                    setTotalCount(filtered.length);
                    cursorsStackRef.current = [];
                    lastVisibleRef.current = null;
                    firstVisibleRef.current = null;
                } else {
                    setEmployees([]);
                    setHasMore(false);
                    setHasPrevious(false);
                    setPage(1);
                    setTotalCount(0);
                }

                setLoading(false);
                return;
            }

            switch (direction) {
                case 'next':
                    if (!lastVisibleRef.current) {
                        q = query(employeesRef, ...baseConstraints, limit(currentItemsPerPage));
                    } else {
                        q = query(
                            employeesRef,
                            ...baseConstraints,
                            startAfter(lastVisibleRef.current),
                            limit(currentItemsPerPage)
                        );
                    }
                    break;

                case 'prev':
                    if (cursorsStackRef.current.length > 1) {
                        cursorsStackRef.current.pop();
                        const previousCursor = cursorsStackRef.current[cursorsStackRef.current.length - 1];

                        if (previousCursor) {
                            q = query(
                                employeesRef,
                                ...baseConstraints,
                                startAfter(previousCursor),
                                limit(currentItemsPerPage)
                            );
                        } else {
                            q = query(employeesRef, ...baseConstraints, limit(currentItemsPerPage));
                        }
                    } else {
                        q = query(employeesRef, ...baseConstraints, limit(currentItemsPerPage));
                    }
                    break;

                default:
                    q = query(employeesRef, ...baseConstraints, limit(currentItemsPerPage));
                    cursorsStackRef.current = [];
                    setPage(1);
            }

            const snapshot = await getDocs(q);

            if (signal.aborted) return;

            if (snapshot.empty) {
                if (direction === 'initial') {
                    setEmployees([]);
                    setHasMore(false);
                    setHasPrevious(false);
                    setTotalCount(0);
                } else if (direction === 'next') {
                    setHasMore(false);
                }
                setLoading(false);
                return;
            }

            const firstDoc = snapshot.docs[0];
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            if (direction === 'next') {
                cursorsStackRef.current.push(firstDoc);
            }

            lastVisibleRef.current = lastDoc;
            firstVisibleRef.current = firstDoc;

            const hasMoreData = snapshot.docs.length === currentItemsPerPage;
            setHasMore(hasMoreData);
            setHasPrevious(cursorsStackRef.current.length > 0);

            const employeesList = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
            }));

            setEmployees(employeesList);

            if (direction === 'next') {
                setPage(p => p + 1);
            } else if (direction === 'prev') {
                setPage(p => Math.max(1, p - 1));
            }

        } catch (err) {
            if (signal.aborted) return;

            console.error('Error loading employees:', err);
            setError(err.message || 'Error al cargar empleados');
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const nextPage = useCallback(() => {
        if (hasMore && !loading) {
            loadEmployees('next');
        }
    }, [hasMore, loading, loadEmployees]);

    const prevPage = useCallback(() => {
        if (!loading) {
            loadEmployees('prev');
        }
    }, [loading, loadEmployees]);

    const goToPage = useCallback((pageNumber) => {
        if (pageNumber < 1 || loading) return;

        if (pageNumber === 1) {
            cursorsStackRef.current = [];
            lastVisibleRef.current = null;
            loadEmployees('initial');
        } else {
            setPage(pageNumber);
            loadEmployees('next');
        }
    }, [loading, loadEmployees]);

    const refresh = useCallback(() => {
        cursorsStackRef.current = [];
        lastVisibleRef.current = null;
        firstVisibleRef.current = null;
        loadEmployees('initial');
    }, [loadEmployees]);

    useEffect(() => {
        cursorsStackRef.current = [];
        lastVisibleRef.current = null;
        firstVisibleRef.current = null;
        loadEmployees('initial');
    }, [itemsPerPage, loadEmployees]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const paginationState = useMemo(() => ({
        canGoNext: hasMore && !loading,
        canGoPrev: cursorsStackRef.current.length > 0 && !loading,
        isFirstPage: cursorsStackRef.current.length === 0,
        isLastPage: !hasMore,
    }), [hasMore, loading]);

    return {
        employees,
        setEmployees,
        loading,
        error,
        page,
        hasMore,
        hasPrevious,
        totalCount,
        nextPage,
        prevPage,
        goToPage,
        refresh,
        loadEmployees,
        ...paginationState,
    };
}
