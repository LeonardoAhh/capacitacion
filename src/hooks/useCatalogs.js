'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCatalogs() {
    const [catalogs, setCatalogs] = useState({
        positions: [],
        departments: [],
        areas: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        let mounted = true;

        const fetchCatalogs = async () => {
            try {
                const [posDoc, deptDoc, areaDoc] = await Promise.all([
                    getDoc(doc(db, 'datos', 'positions')),
                    getDoc(doc(db, 'datos', 'departments')),
                    getDoc(doc(db, 'datos', 'areas'))
                ]);

                if (mounted) {
                    setCatalogs({
                        positions: posDoc.exists() ? posDoc.data().items || [] : [],
                        departments: deptDoc.exists() ? deptDoc.data().items || [] : [],
                        areas: areaDoc.exists() ? areaDoc.data().items || [] : [],
                        loading: false,
                        error: null
                    });
                }
            } catch (err) {
                console.error("Error fetching catalogs:", err);
                if (mounted) {
                    setCatalogs(prev => ({ ...prev, loading: false, error: err }));
                }
            }
        };

        fetchCatalogs();

        return () => {
            mounted = false;
        };
    }, []);

    return catalogs;
}
