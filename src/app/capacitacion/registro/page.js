'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, addDoc, getDoc, where, limit } from 'firebase/firestore';
import { parseImportFile, validateImportRecords, generateExcelTemplate } from '@/utils/importUtils';
import styles from './page.module.css';
import multiStyles from './multi-styles.module.css';

export default function RegistroPage() {
    const { canWrite } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [employees, setEmployees] = useState([]); // {id, name}
    const [courses, setCourses] = useState([]); // names array

    // Selection State
    const [selectedEmps, setSelectedEmps] = useState([]); // Array of IDs
    const [selectedCourses, setSelectedCourses] = useState([]); // Array of Course Names

    // Filters
    const [empSearch, setEmpSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');

    // New Course
    const [isNewCourse, setIsNewCourse] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');

    // Common Data
    const [qualification, setQualification] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // File Import State
    const [importMode, setImportMode] = useState('manual'); // 'manual' | 'file'
    const [importFile, setImportFile] = useState(null);
    const [importPreview, setImportPreview] = useState(null); // { valid, invalid }
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            setEmployees(empSnap.docs.map(d => ({
                id: d.id,
                name: d.data().name,
                employeeId: d.data().employeeId || d.id // Handle cases where employeeId might be missing
            })));

            const courseSnap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
            setCourses(courseSnap.docs.map(d => d.data().name));
        } catch (error) {
            console.error(error);
            toast.error("Error", "No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleEmp = (id) => {
        setSelectedEmps(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleCourse = (name) => {
        setSelectedCourses(prev =>
            prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
        );
    };

    const selectAllFilteredEmps = () => {
        const filteredIds = filteredEmployees.map(e => e.id);

        // Add only ones not already selected
        const newSelection = [...new Set([...selectedEmps, ...filteredIds])];
        setSelectedEmps(newSelection);
    };

    const selectAllFilteredCourses = () => {
        const filteredNames = filteredCourses;
        const newSelection = [...new Set([...selectedCourses, ...filteredNames])];
        setSelectedCourses(newSelection);
    };

    const clearCourseSelection = () => {
        setSelectedCourses([]);
    };

    const clearSelection = () => {
        setSelectedEmps([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (selectedEmps.length === 0) {
            toast.error("Atención", "Selecciona al menos un empleado.");
            return;
        }

        let finalCourses = [...selectedCourses];

        // Handle New Course
        if (isNewCourse) {
            if (!newCourseName.trim()) {
                toast.error("Error", "Ingresa el nombre del nuevo curso.");
                return;
            }
            finalCourses = [newCourseName.trim().toUpperCase()];
        } else if (finalCourses.length === 0) {
            toast.error("Atención", "Selecciona al menos un curso.");
            return;
        }

        if (!qualification || !date) {
            toast.error("Atención", "Faltan datos de calificación o fecha.");
            return;
        }

        // Validación de calificación
        const score = parseFloat(qualification);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error("Error", "La calificación debe ser un número entre 0 y 100.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create New Course if needed
            if (isNewCourse) {
                const cName = finalCourses[0];
                if (!courses.includes(cName)) {
                    await addDoc(collection(db, 'courses'), {
                        name: cName,
                        category: 'GENERAL',
                        createdAt: new Date()
                    });
                    setCourses(prev => [...prev, cName].sort());
                }
            }

            // 2. Prepare common data
            const status = score >= 70 ? 'approved' : 'failed';
            const [y, m, d] = date.split('-');
            const formattedDate = `${d}/${m}/${y}`; // DD/MM/YYYY

            // 3. Process employees in parallel
            const processEmployee = async (empId) => {
                const empRef = doc(db, 'training_records', empId);
                const empSnap = await getDoc(empRef);
                if (!empSnap.exists()) return null;

                const empData = empSnap.data();
                let currentMatrix = empData.matrix || { requiredCount: 0, completedCount: 0, requiredCourses: [] };
                let currentHistory = [...(empData.history || [])]; // Clone for modification

                // Self-Healing: If matrix is empty, try to fetch it
                if ((!currentMatrix.requiredCourses || currentMatrix.requiredCourses.length === 0) && empData.position) {
                    try {
                        const posName = empData.position;
                        const posColl = collection(db, 'positions');
                        let matrixDoc = null;

                        // 1. Exact Match
                        let q = query(posColl, where('name', '==', posName), limit(1));
                        let snap = await getDocs(q);

                        if (!snap.empty) {
                            matrixDoc = snap.docs[0].data();
                        } else {
                            // 2. Normalized Match (No Accents) & Client Scan
                            const allPosSnap = await getDocs(query(posColl));
                            const targetNorm = posName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

                            const found = allPosSnap.docs.find(d => {
                                const dName = d.data().name.toUpperCase().trim();
                                const dNorm = dName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                return dName === posName.toUpperCase().trim() || dNorm === targetNorm;
                            });

                            if (found) {
                                matrixDoc = found.data();
                            }
                        }

                        if (matrixDoc) {
                            currentMatrix.requiredCourses = matrixDoc.requiredCourses || [];
                            currentMatrix.requiredCount = currentMatrix.requiredCourses.length;
                        }
                    } catch (err) {
                        console.error("Error healing matrix:", err);
                    }
                }

                // Updates container
                let updates = {};

                // For each course selected
                for (const cName of finalCourses) {
                    // Check if course already exists in history
                    const existingIndex = currentHistory.findIndex(h => h.courseName === cName);

                    if (existingIndex >= 0) {
                        // UPDATE existing entry (only date and score)
                        currentHistory[existingIndex] = {
                            ...currentHistory[existingIndex],
                            date: formattedDate,
                            score: score,
                            status: status
                        };
                    } else {
                        // ADD new entry
                        currentHistory.push({
                            courseName: cName,
                            date: formattedDate,
                            score: score,
                            status: status
                        });
                    }
                }

                // Set entire history array
                updates.history = currentHistory;

                // Recalculate matrix if we have required courses
                if (currentMatrix.requiredCount > 0) {
                    // Normalize function for comparison
                    const normalizeForMatch = (str) => (str || '')
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .toUpperCase().trim();

                    // Get approved courses using normalized comparison
                    const approvedNormalized = new Set(
                        currentHistory
                            .filter(h => h.status === 'approved')
                            .map(h => normalizeForMatch(h.courseName))
                    );

                    // Calculate missing courses
                    const missing = currentMatrix.requiredCourses.filter(req => {
                        const reqNormalized = normalizeForMatch(req);
                        return !approvedNormalized.has(reqNormalized);
                    });

                    // Separate failed vs pending
                    const historyNormalized = new Set(
                        currentHistory.map(h => normalizeForMatch(h.courseName))
                    );

                    const failedCourses = [];
                    const pendingCourses = [];

                    missing.forEach(req => {
                        const reqNormalized = normalizeForMatch(req);
                        if (historyNormalized.has(reqNormalized)) {
                            failedCourses.push(req);
                        } else {
                            pendingCourses.push(req);
                        }
                    });

                    const completedCount = currentMatrix.requiredCourses.length - missing.length;
                    const compliancePercentage = currentMatrix.requiredCount > 0
                        ? Math.round((completedCount / currentMatrix.requiredCount) * 100)
                        : 0;

                    updates.matrix = {
                        requiredCount: currentMatrix.requiredCount,
                        requiredCourses: currentMatrix.requiredCourses,
                        completedCount: completedCount,
                        missingCourses: missing,
                        failedCourses: failedCourses,
                        pendingCourses: pendingCourses,
                        compliancePercentage: compliancePercentage
                    };
                }

                updates.updatedAt = new Date().toISOString();
                return updateDoc(empRef, updates);
            };

            // Execute all updates in parallel
            await Promise.all(selectedEmps.map(processEmployee));

            const totalRecs = selectedEmps.length * finalCourses.length;
            toast.success("Éxito", `Se registraron ${totalRecs} capacitaciones.`);

            // Reset partial
            setSelectedEmps([]);
            if (isNewCourse) {
                setIsNewCourse(false);
                setNewCourseName('');
                setSelectedCourses([]); // Clear selection as we used new course
            } else {
                setSelectedCourses([]);
            }
            setQualification('');

        } catch (error) {
            console.error(error);
            toast.error("Error", "Falló la carga masiva.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(e => {
        const term = empSearch.toLowerCase();
        return e.name.toLowerCase().includes(term) ||
            (e.employeeId && e.employeeId.toLowerCase().includes(term));
    });

    const filteredCourses = courses.filter(c =>
        c.toLowerCase().includes(courseSearch.toLowerCase())
    );

    // File Import Handlers
    const handleFileSelect = async (file) => {
        setImportFile(file);
        try {
            const records = await parseImportFile(file);
            const result = validateImportRecords(records, employees);
            setImportPreview(result);
        } catch (error) {
            toast.error("Error", error.message);
            setImportFile(null);
        }
    };

    const handleImportConfirm = async () => {
        if (!importPreview?.valid.length) return;

        setImporting(true);
        try {
            let successCount = 0;

            for (const record of importPreview.valid) {
                const empRef = doc(db, 'training_records', record.docId);
                const empSnap = await getDoc(empRef);

                if (empSnap.exists()) {
                    const currentData = empSnap.data();
                    const currentHistory = currentData.history || [];
                    const currentMatrix = currentData.matrix || {};

                    // Date is already in DD/MM/YYYY format from normalizeRecord
                    const formattedDate = record.date;
                    const status = record.score >= 70 ? 'approved' : 'failed';

                    // Check if course already in history
                    const existingIdx = currentHistory.findIndex(h => h.courseName === record.courseName);

                    if (existingIdx >= 0) {
                        currentHistory[existingIdx] = {
                            ...currentHistory[existingIdx],
                            date: formattedDate,
                            score: record.score,
                            status
                        };
                    } else {
                        currentHistory.push({
                            courseName: record.courseName,
                            date: formattedDate,
                            score: record.score,
                            status
                        });
                    }

                    // Update matrix if applicable
                    let updates = { history: currentHistory, updatedAt: new Date().toISOString() };

                    if (currentMatrix.requiredCount > 0) {
                        // Normalize function for comparison
                        const normalizeForMatch = (str) => (str || '')
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                            .toUpperCase().trim();

                        // Get approved courses using normalized comparison
                        const approvedNormalized = new Set(
                            currentHistory
                                .filter(h => h.status === 'approved')
                                .map(h => normalizeForMatch(h.courseName))
                        );

                        // Calculate missing courses
                        const missing = (currentMatrix.requiredCourses || []).filter(req => {
                            const reqNormalized = normalizeForMatch(req);
                            return !approvedNormalized.has(reqNormalized);
                        });

                        // Separate failed vs pending
                        const historyNormalized = new Set(
                            currentHistory.map(h => normalizeForMatch(h.courseName))
                        );

                        const failedCourses = [];
                        const pendingCourses = [];

                        missing.forEach(req => {
                            const reqNormalized = normalizeForMatch(req);
                            if (historyNormalized.has(reqNormalized)) {
                                failedCourses.push(req);
                            } else {
                                pendingCourses.push(req);
                            }
                        });

                        const completedCount = (currentMatrix.requiredCourses || []).length - missing.length;
                        const compliancePercentage = currentMatrix.requiredCount > 0
                            ? Math.round((completedCount / currentMatrix.requiredCount) * 100)
                            : 0;

                        updates.matrix = {
                            ...currentMatrix,
                            completedCount: completedCount,
                            missingCourses: missing,
                            failedCourses: failedCourses,
                            pendingCourses: pendingCourses,
                            compliancePercentage: compliancePercentage
                        };
                    }

                    await updateDoc(empRef, updates);
                    successCount++;
                }
            }

            toast.success("Importación Exitosa", `Se importaron ${successCount} registros correctamente`);
            setImportPreview(null);
            setImportFile(null);
            loadData(); // Refresh data

        } catch (error) {
            console.error(error);
            toast.error("Error", "Falló la importación de datos");
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <h1>Carga Masiva de Capacitación</h1>
                        <p>Registra uno o varios cursos para múltiples empleados simultáneamente.</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className={styles.modeToggle}>
                        <button
                            type="button"
                            className={`${styles.modeBtn} ${importMode === 'manual' ? styles.active : ''}`}
                            onClick={() => setImportMode('manual')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Registro Manual
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeBtn} ${importMode === 'file' ? styles.active : ''}`}
                            onClick={() => setImportMode('file')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Importar Archivo
                        </button>
                    </div>

                    <Card>
                        <CardContent>
                            {loading ? <div className="spinner"></div> : importMode === 'file' ? (
                                /* FILE IMPORT MODE */
                                <div className={styles.importSection}>
                                    {/* Download Templates */}
                                    <div className={styles.templateDownloads}>
                                        <h3>1. Descargar Plantilla</h3>
                                        <div className={styles.templateBtns}>
                                            <button
                                                type="button"
                                                className={styles.templateBtn}
                                                onClick={generateExcelTemplate}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Excel (.xlsx)
                                            </button>
                                            <a
                                                href="/templates/plantilla_capacitaciones.json"
                                                download
                                                className={styles.templateBtn}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                JSON (.json)
                                            </a>
                                        </div>
                                    </div>

                                    {/* Drop Zone */}
                                    <div className={styles.dropZoneSection}>
                                        <h3>2. Subir Archivo</h3>
                                        <div
                                            className={styles.dropZone}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add(styles.dragOver); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove(styles.dragOver); }}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove(styles.dragOver);
                                                const file = e.dataTransfer.files[0];
                                                if (file) await handleFileSelect(file);
                                            }}
                                        >
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                                            <span>Formatos: .xlsx, .json</span>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls,.json"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) await handleFileSelect(file);
                                            }}
                                        />
                                    </div>

                                    {/* Preview */}
                                    {importPreview && (
                                        <div className={styles.previewSection}>
                                            <h3>3. Vista Previa</h3>
                                            <div className={styles.previewStats}>
                                                <div className={styles.previewStat}>
                                                    <span className={styles.statNum}>{importPreview.valid.length}</span>
                                                    <span className={styles.statLabel}>Válidos</span>
                                                </div>
                                                <div className={`${styles.previewStat} ${styles.error}`}>
                                                    <span className={styles.statNum}>{importPreview.invalid.length}</span>
                                                    <span className={styles.statLabel}>Con errores</span>
                                                </div>
                                            </div>

                                            {importPreview.invalid.length > 0 && (
                                                <div className={styles.errorList}>
                                                    <h4>Registros con errores:</h4>
                                                    {importPreview.invalid.slice(0, 5).map((rec, i) => (
                                                        <div key={i} className={styles.errorItem}>
                                                            <strong>Fila {rec.row}:</strong> {rec.issues.join(', ')}
                                                        </div>
                                                    ))}
                                                    {importPreview.invalid.length > 5 && (
                                                        <p className={styles.moreErrors}>...y {importPreview.invalid.length - 5} más</p>
                                                    )}
                                                </div>
                                            )}

                                            {importPreview.valid.length > 0 && (
                                                <div className={styles.validPreview}>
                                                    <h4>Primeros registros válidos:</h4>
                                                    <table className={styles.previewTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Empleado</th>
                                                                <th>Curso</th>
                                                                <th>Fecha</th>
                                                                <th>Cal.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {importPreview.valid.slice(0, 5).map((rec, i) => (
                                                                <tr key={i}>
                                                                    <td>{rec.employeeName || rec.employeeId}</td>
                                                                    <td>{rec.courseName}</td>
                                                                    <td>{rec.date}</td>
                                                                    <td>{rec.score}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            <div className={styles.importActions}>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => { setImportPreview(null); setImportFile(null); }}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={handleImportConfirm}
                                                    disabled={importing || importPreview.valid.length === 0}
                                                >
                                                    {importing ? 'Importando...' : `Importar ${importPreview.valid.length} registros`}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form}>

                                    <div className={styles.gridTwoCols}>
                                        {/* Col 1: Empleados */}
                                        <div className={styles.formGroup}>
                                            <label>1. Seleccionar Empleados ({selectedEmps.length})</label>
                                            <div className={multiStyles.multiSelectContainer}>
                                                <div className={multiStyles.searchHeader}>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por Nombre o ID..."
                                                        className={multiStyles.searchInput}
                                                        value={empSearch}
                                                        onChange={(e) => setEmpSearch(e.target.value)}
                                                    />
                                                </div>
                                                <div className={multiStyles.listBody}>
                                                    {filteredEmployees.map(emp => (
                                                        <label key={emp.id} className={multiStyles.checkboxItem}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmps.includes(emp.id)}
                                                                onChange={() => toggleEmp(emp.id)}
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                                <span>{emp.name}</span>
                                                                <small style={{ opacity: 0.7, fontSize: '0.75em' }}>{emp.employeeId}</small>
                                                            </div>
                                                        </label>
                                                    ))}
                                                    {filteredEmployees.length === 0 && <p className="text-muted p-2">Sin resultados.</p>}
                                                </div>
                                                <div className={multiStyles.selectionSummary}>
                                                    <span>{selectedEmps.length} seleccionados</span>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button type="button" onClick={selectAllFilteredEmps} className={multiStyles.selectAllBtn}>Todo Visible</button>
                                                        <button type="button" onClick={clearSelection} className={multiStyles.selectAllBtn}>Limpiar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 2: Cursos */}
                                        <div className={styles.formGroup}>
                                            <label>2. Seleccionar Cursos ({isNewCourse ? '1 Nuevo' : selectedCourses.length})</label>

                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <button type="button" className={styles.toggleBtn} onClick={() => setIsNewCourse(!isNewCourse)}>
                                                    {isNewCourse ? '← Volver a Lista' : '+ Crear Nuevo Curso'}
                                                </button>
                                            </div>

                                            {isNewCourse ? (
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del Nuevo Curso"
                                                    className={styles.input}
                                                    value={newCourseName}
                                                    onChange={e => setNewCourseName(e.target.value)}
                                                />
                                            ) : (
                                                <div className={multiStyles.multiSelectContainer}>
                                                    <div className={multiStyles.searchHeader}>
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar curso..."
                                                            className={multiStyles.searchInput}
                                                            value={courseSearch}
                                                            onChange={(e) => setCourseSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={multiStyles.listBody}>
                                                        {filteredCourses.map(c => (
                                                            <label key={c} className={multiStyles.checkboxItem}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCourses.includes(c)}
                                                                    onChange={() => toggleCourse(c)}
                                                                />
                                                                {c}
                                                            </label>
                                                        ))}
                                                        {filteredCourses.length === 0 && <p className="text-muted p-2">Sin resultados.</p>}
                                                    </div>
                                                    <div className={multiStyles.selectionSummary}>
                                                        <span>{selectedCourses.length} seleccionados</span>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button type="button" onClick={selectAllFilteredCourses} className={multiStyles.selectAllBtn}>Todo Visible</button>
                                                            <button type="button" onClick={clearCourseSelection} className={multiStyles.selectAllBtn}>Limpiar</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Datos Comunes */}
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Calificación (0-100)</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={qualification}
                                                onChange={(e) => setQualification(e.target.value)}
                                                className={styles.input}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Fecha de Aplicación</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className={styles.input}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.infoBox}>
                                        <p>Se crearán <strong>{selectedEmps.length * (isNewCourse ? 1 : selectedCourses.length)}</strong> registros en total.</p>
                                    </div>

                                    <div className={styles.actions}>
                                        {canWrite() ? (
                                            <Button type="submit" disabled={submitting || selectedEmps.length === 0}>
                                                {submitting ? 'Procesando...' : 'Confirmar Carga Masiva'}
                                            </Button>
                                        ) : (
                                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                Solo lectura - No tienes permisos para registrar capacitaciones
                                            </p>
                                        )}
                                    </div>

                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
