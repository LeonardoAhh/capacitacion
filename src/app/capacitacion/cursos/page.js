'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from './page.module.css';

export default function CursosPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const coursesRef = collection(db, 'courses');
                const snapshot = await getDocs(coursesRef);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort alphabetically
                data.sort((a, b) => a.name.localeCompare(b.name));
                setCourses(data);
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
    }, []);

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/capacitacion" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Catálogo de Cursos</h1>
                        </div>
                        <div className={styles.stats}>
                            <span className={styles.count}>{courses.length}</span>
                            <span className={styles.label}>Cursos Registrados</span>
                        </div>
                    </div>

                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="spinner"></div>
                    ) : filteredCourses.length === 0 ? (
                        <div className={styles.emptyState}>
                            No se encontraron cursos.
                        </div>
                    ) : (
                        <div className={styles.listContainer}>
                            {filteredCourses.map(course => (
                                <div key={course.id} className={styles.courseItem}>
                                    <div className={styles.courseIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                        </svg>
                                    </div>
                                    <div className={styles.courseInfo}>
                                        <h3>{course.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
