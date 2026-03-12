'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, query, orderBy,
    doc, updateDoc, arrayUnion, addDoc, getDoc, where, limit
} from 'firebase/firestore';
import {
    parseImportFile,
    validateImportRecords,
    validateSingleRecord,
    normalizeRecord,
    generateExcelTemplate
} from '@/utils/importUtils';
import styles from './page.module.css';
import multiStyles from './multi-styles.module.css';

// Convert DD/MM/YYYY â†’ YYYY-MM-DD for <input type="date">
const toInputDate = (str) => {
    if (!str) return '';
    if (str.includes('/')) {
        const [d, m, y] = str.split('/');
        return `${y}-${(m || '').padStart(2, '0')}-${(d || '').padStart(2, '0')}`;
    }
    return str;
};

// Human-readable file size
const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function RegistroPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [employees, setEmployees] = useState([]);
    const [courses, setCourses] = useState([]);

    // Selection State
    const [selectedEmps, setSelectedEmps] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);

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
    const [importMode, setImportMode] = useState('manual');
    const [importFile, setImportFile] = useState(null);
    const [importPreview, setImportPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null); // { current, total }
    const [fileInfo, setFileInfo] = useState(null); // { name, size, ext }

    // Editable preview state
    const [invalidEdits, setInvalidEdits] = useState({}); // rowNum â†’ { employeeId, courseName, date, score }
    const [selectedValidRows, setSelectedValidRows] = useState(null); // Set<row> | null (null = all)
    const [showAllErrors, setShowAllErrors] = useState(false);
    const [showAllValid, setShowAllValid] = useState(false);

    const fileInputRef = useRef(null);

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && (user.rol === 'demo' || user.email?.includes('demo'))) {
            router.push('/induccion');
        }
    }, [user, authLoading, router]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            setEmployees(empSnap.docs.map(d => ({
                id: d.id,
                name: d.data().name,
                employeeId: d.data().employeeId || d.id
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

    // Memoized filtered lists
    const filteredEmployees = useMemo(() =>
        employees.filter(e => {
            const term = empSearch.toLowerCase();
            return e.name.toLowerCase().includes(term) ||
                (e.employeeId && e.employeeId.toLowerCase().includes(term));
        }), [employees, empSearch]);

    const filteredCourses = useMemo(() =>
        courses.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase())),
        [courses, courseSearch]);

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
        setSelectedEmps(prev => [...new Set([...prev, ...filteredIds])]);
    };

    const selectAllFilteredCourses = () => {
        const filteredNames = filteredCourses;
        setSelectedCourses(prev => [...new Set([...prev, ...filteredNames])]);
    };

    const clearCourseSelection = () => setSelectedCourses([]);
    const clearSelection = () => setSelectedEmps([]);

    // ==================== MATRIX RECALCULATION (shared logic) ====================
    const recalcMatrix = (currentMatrix, currentHistory, getRequiredCoursesFn) => {
        const normalizeForMatch = (str) => (str || '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase().trim();

        let requiredCourses = currentMatrix.requiredCourses;
        if (getRequiredCoursesFn && (!requiredCourses || requiredCourses.length === 0)) {
            requiredCourses = getRequiredCoursesFn();
        }

        if (!requiredCourses || requiredCourses.length === 0) return null;

        const approvedNormalized = new Set(
            currentHistory.filter(h => h.status === 'approved').map(h => normalizeForMatch(h.courseName))
        );
        const historyNormalized = new Set(
            currentHistory.map(h => normalizeForMatch(h.courseName))
        );

        const missing = requiredCourses.filter(req => !approvedNormalized.has(normalizeForMatch(req)));
        const failedCourses = [];
        const pendingCourses = [];

        missing.forEach(req => {
            if (historyNormalized.has(normalizeForMatch(req))) {
                failedCourses.push(req);
            } else {
                pendingCourses.push(req);
            }
        });

        const completedCount = requiredCourses.length - missing.length;
        return {
            ...currentMatrix,
            requiredCourses,
            requiredCount: requiredCourses.length,
            completedCount,
            missingCourses: missing,
            failedCourses,
            pendingCourses,
            compliancePercentage: Math.round((completedCount / requiredCourses.length) * 100)
        };
    };

    // ==================== MANUAL SUBMIT ====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedEmps.length === 0) {
            toast.error("Atención", "Selecciona al menos un empleado.");
            return;
        }

        let finalCourses = [...selectedCourses];

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

        const score = parseFloat(qualification);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error("Error", "La calificación debe ser un número entre 0 y 100.");
            return;
        }

        setSubmitting(true);
        try {
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

            const status = score >= 70 ? 'approved' : 'failed';
            const [y, m, d] = date.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            const processEmployee = async (empId) => {
                const empRef = doc(db, 'training_records', empId);
                const empSnap = await getDoc(empRef);
                if (!empSnap.exists()) return null;

                const empData = empSnap.data();
                let currentMatrix = empData.matrix || { requiredCount: 0, completedCount: 0, requiredCourses: [] };
                let currentHistory = [...(empData.history || [])];

                // Self-Healing: fetch matrix from positions if missing
                if ((!currentMatrix.requiredCourses || currentMatrix.requiredCourses.length === 0) && empData.position) {
                    try {
                        const posName = empData.position;
                        const posColl = collection(db, 'positions');
                        let matrixDoc = null;

                        let q = query(posColl, where('name', '==', posName), limit(1));
                        let snap = await getDocs(q);
                        if (!snap.empty) {
                            matrixDoc = snap.docs[0].data();
                        } else {
                            const allPosSnap = await getDocs(query(posColl));
                            const targetNorm = posName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
                            const found = allPosSnap.docs.find(d => {
                                const dName = d.data().name.toUpperCase().trim();
                                const dNorm = dName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                return dName === posName.toUpperCase().trim() || dNorm === targetNorm;
                            });
                            if (found) matrixDoc = found.data();
                        }

                        if (matrixDoc) {
                            currentMatrix.requiredCourses = matrixDoc.requiredCourses || [];
                            currentMatrix.requiredCount = currentMatrix.requiredCourses.length;
                        }
                    } catch (err) {
                        console.error("Error healing matrix:", err);
                    }
                }

                // Update history
                for (const cName of finalCourses) {
                    const existingIndex = currentHistory.findIndex(h => h.courseName === cName);
                    if (existingIndex >= 0) {
                        currentHistory[existingIndex] = {
                            ...currentHistory[existingIndex],
                            date: formattedDate,
                            score,
                            status
                        };
                    } else {
                        currentHistory.push({ courseName: cName, date: formattedDate, score, status });
                    }
                }

                const updates = { history: currentHistory };
                const newMatrix = recalcMatrix(currentMatrix, currentHistory);
                if (newMatrix) updates.matrix = newMatrix;
                updates.updatedAt = new Date().toISOString();

                return updateDoc(empRef, updates);
            };

            await Promise.all(selectedEmps.map(processEmployee));

            const totalRecs = selectedEmps.length * finalCourses.length;
            toast.success("Éxito", `Se registraron ${totalRecs} capacitaciones.`);

            setSelectedEmps([]);
            setSelectedCourses([]);
            if (isNewCourse) {
                setIsNewCourse(false);
                setNewCourseName('');
            }
            setQualification('');

        } catch (error) {
            console.error(error);
            toast.error("Error", "Falló la carga masiva.");
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== FILE IMPORT HANDLERS ====================

    const resetImport = () => {
        setImportPreview(null);
        setImportFile(null);
        setFileInfo(null);
        setInvalidEdits({});
        setSelectedValidRows(null);
        setShowAllErrors(false);
        setShowAllValid(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = async (file) => {
        setFileInfo({
            name: file.name,
            size: formatFileSize(file.size),
            ext: (file.name.split('.').pop() || '').toUpperCase()
        });
        setInvalidEdits({});
        setSelectedValidRows(null);
        setShowAllErrors(false);
        setShowAllValid(false);
        setImportFile(file);
        setImportPreview(null);

        try {
            const records = await parseImportFile(file);
            const result = validateImportRecords(records, employees);
            setImportPreview(result);
        } catch (error) {
            toast.error("Error al leer archivo", error.message);
            setImportFile(null);
            setFileInfo(null);
        }
    };

    // Get current values for an invalid row (edited values take priority)
    const getRowValues = (rec) => ({
        employeeId: invalidEdits[rec.row]?.employeeId ?? rec.employeeId ?? '',
        courseName: invalidEdits[rec.row]?.courseName ?? rec.courseName ?? '',
        date: invalidEdits[rec.row]?.date ?? toInputDate(rec.date) ?? '',
        score: invalidEdits[rec.row]?.score ?? rec.score ?? 0,
    });

    const rowHasEdits = (row) => !!invalidEdits[row];

    const handleInvalidEdit = (row, field, value) => {
        setInvalidEdits(prev => ({
            ...prev,
            [row]: { ...(prev[row] || {}), [field]: value }
        }));
    };

    // Re-normalize + re-validate an edited invalid row
    const applyCorrection = (rec) => {
        const vals = getRowValues(rec);
        const normalized = normalizeRecord({
            employeeId: vals.employeeId,
            courseName: vals.courseName,
            date: vals.date,          // YYYY-MM-DD from <input type="date">
            score: parseFloat(vals.score) || 0,
        });
        const validation = validateSingleRecord(normalized, employees);

        if (validation.valid) {
            setImportPreview(prev => ({
                ...prev,
                invalid: prev.invalid.filter(r => r.row !== rec.row),
                valid: [...prev.valid, {
                    ...normalized,
                    row: rec.row,
                    docId: validation.docId,
                    employeeName: validation.employeeName,
                }].sort((a, b) => a.row - b.row),
            }));
            setInvalidEdits(prev => {
                const next = { ...prev };
                delete next[rec.row];
                return next;
            });
            // Auto-select the newly corrected row
            setSelectedValidRows(prev => {
                if (prev === null) return null;
                const next = new Set(prev);
                next.add(rec.row);
                return next;
            });
            toast.success("Corregido", `Fila ${rec.row} es ahora válida.`);
        } else {
            // Update the base record with normalized data + new issues
            setImportPreview(prev => ({
                ...prev,
                invalid: prev.invalid.map(r =>
                    r.row === rec.row
                        ? { ...normalized, row: rec.row, issues: validation.issues }
                        : r
                ),
            }));
            toast.error("Aún inválido", validation.issues.join(' • '));
        }
    };

    // Derive the effective set of selected valid rows
    const getEffectiveSelectedRows = () => {
        if (!importPreview?.valid) return new Set();
        if (selectedValidRows === null) return new Set(importPreview.valid.map(r => r.row));
        return selectedValidRows;
    };

    const toggleValidRow = (row) => {
        const current = getEffectiveSelectedRows();
        const next = new Set(current);
        if (next.has(row)) next.delete(row);
        else next.add(row);
        setSelectedValidRows(next);
    };

    const toggleAllValidRows = () => {
        if (!importPreview?.valid) return;
        const current = getEffectiveSelectedRows();
        if (current.size === importPreview.valid.length) {
            setSelectedValidRows(new Set()); // deselect all
        } else {
            setSelectedValidRows(null); // select all
        }
    };

    const getRowsToImport = () => {
        if (!importPreview?.valid) return [];
        const selected = getEffectiveSelectedRows();
        return importPreview.valid.filter(r => selected.has(r.row));
    };

    // ==================== IMPORT CONFIRM (with progress) ====================
    const handleImportConfirm = async () => {
        const rowsToImport = getRowsToImport();
        if (!rowsToImport.length) return;

        setImporting(true);
        setImportProgress({ current: 0, total: rowsToImport.length });

        try {
            // Pre-fetch ALL positions once to avoid repeated queries
            const allPosSnap = await getDocs(collection(db, 'positions'));
            const positionsCache = {};
            allPosSnap.docs.forEach(d => {
                const data = d.data();
                const key = (data.name || '').toUpperCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                positionsCache[key] = data.requiredCourses || [];
            });

            const getRequiredCourses = (positionName) => {
                if (!positionName) return [];
                const key = positionName.toUpperCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return positionsCache[key] || [];
            };

            let successCount = 0;

            for (let i = 0; i < rowsToImport.length; i++) {
                const record = rowsToImport[i];
                setImportProgress({ current: i + 1, total: rowsToImport.length });

                const empRef = doc(db, 'training_records', record.docId);
                const empSnap = await getDoc(empRef);
                if (!empSnap.exists()) continue;

                const currentData = empSnap.data();
                const currentHistory = [...(currentData.history || [])];
                const currentMatrix = currentData.matrix || {};
                const status = record.score >= 70 ? 'approved' : 'failed';

                const existingIdx = currentHistory.findIndex(h => h.courseName === record.courseName);
                if (existingIdx >= 0) {
                    currentHistory[existingIdx] = {
                        ...currentHistory[existingIdx],
                        date: record.date,
                        score: record.score,
                        status,
                    };
                } else {
                    currentHistory.push({
                        courseName: record.courseName,
                        date: record.date,
                        score: record.score,
                        status,
                    });
                }

                const updates = { history: currentHistory, updatedAt: new Date().toISOString() };
                const newMatrix = recalcMatrix(
                    currentMatrix,
                    currentHistory,
                    () => getRequiredCourses(currentData.position)
                );
                if (newMatrix) updates.matrix = newMatrix;

                await updateDoc(empRef, updates);
                successCount++;
            }

            toast.success("Importación Exitosa", `Se importaron ${successCount} registros correctamente`);
            resetImport();
            loadData();

        } catch (error) {
            console.error(error);
            toast.error("Error", "Falló la importación de datos");
        } finally {
            setImportProgress(null);
            setImporting(false);
        }
    };

    // ==================== RENDER ====================

    if (authLoading || !user) {
        return (
            <AdminLayout title="Módulo">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    const rowsToImport = importPreview ? getRowsToImport() : [];
    const effectiveSelected = importPreview ? getEffectiveSelectedRows() : new Set();
    const allValidSelected = importPreview?.valid
        ? effectiveSelected.size === importPreview.valid.length
        : false;

    return (
        <AdminLayout title="Registro de Capacitación">
            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.pageTitle}>Registro de Capacitación</h1>
                    </header>

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
                        {importMode === 'manual' && (
                            <button
                                type="button"
                                className={styles.toggleBtn}
                                onClick={() => setIsNewCourse(!isNewCourse)}
                                style={{ marginLeft: '12px', alignSelf: 'center' }}
                            >
                                {isNewCourse ? '← Volver a Lista' : '+ Crear Nuevo Curso'}
                            </button>
                        )}
                    </div>

                    <div className={styles.mainCard}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : importMode === 'file' ? (

                            /* ===== FILE IMPORT MODE ===== */
                            <div className={styles.importSection}>

                                {/* STEP 1: Download Templates */}
                                <div>
                                    <div className={styles.sectionTitle}>
                                        <span className={styles.sectionNumber}>1</span>
                                        Descargar Plantilla
                                    </div>
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

                                {/* STEP 2: Upload File */}
                                <div>
                                    <div className={styles.sectionTitle}>
                                        <span className={styles.sectionNumber}>2</span>
                                        Subir Archivo
                                    </div>

                                    {fileInfo ? (
                                        /* File info card (replaces drop zone after selection) */
                                        <div className={styles.fileInfoCard}>
                                            <div className={styles.fileIconWrap}>
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                            </div>
                                            <div className={styles.fileInfoDetails}>
                                                <span className={styles.fileName}>{fileInfo.name}</span>
                                                <span className={styles.fileMeta}>{fileInfo.ext} · {fileInfo.size}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.fileRemoveBtn}
                                                onClick={resetImport}
                                                aria-label="Quitar archivo seleccionado"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Drop Zone */
                                        <div
                                            className={styles.dropZone}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add(styles.dragOver);
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.classList.remove(styles.dragOver);
                                            }}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove(styles.dragOver);
                                                const file = e.dataTransfer.files[0];
                                                if (file) await handleFileSelect(file);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Zona de carga de archivos"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                                            }}
                                        >
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                                            <span>Formatos soportados: .xlsx · .json</span>
                                        </div>
                                    )}

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

                                {/* STEP 3: Preview + Edit + Select */}
                                {importPreview && (
                                    <div>
                                        <div className={styles.sectionTitle}>
                                            <span className={styles.sectionNumber}>3</span>
                                            Vista Previa y Corrección
                                        </div>

                                        {/* Stats row */}
                                        <div className={styles.previewStats}>
                                            <div className={styles.previewStat}>
                                                <span className={styles.statNum}>{importPreview.valid.length}</span>
                                                <span className={styles.statLabel}>Válidos</span>
                                            </div>
                                            <div className={`${styles.previewStat} ${styles.statError}`}>
                                                <span className={styles.statNum}>{importPreview.invalid.length}</span>
                                                <span className={styles.statLabel}>Con errores</span>
                                            </div>
                                            <div className={`${styles.previewStat} ${styles.statSelected}`}>
                                                <span className={styles.statNum}>{rowsToImport.length}</span>
                                                <span className={styles.statLabel}>Seleccionados</span>
                                            </div>
                                        </div>

                                        {/* â”€â”€ ERROR SECTION (editable) â”€â”€ */}
                                        {importPreview.invalid.length > 0 && (
                                            <div className={styles.errorSection}>
                                                <div className={styles.errorSectionHeader}>
                                                    <span className={styles.errorSectionTitle}>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="8" x2="12" y2="12" />
                                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                                        </svg>
                                                        Registros con errores â€” edita y aplica correcciones
                                                    </span>
                                                </div>

                                                <div className={styles.errorTableWrap}>
                                                    <table className={styles.editTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>ID Empleado</th>
                                                                <th>Nombre Curso</th>
                                                                <th>Fecha</th>
                                                                <th>Cal.</th>
                                                                <th>Error detectado</th>
                                                                <th></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(showAllErrors
                                                                ? importPreview.invalid
                                                                : importPreview.invalid.slice(0, 5)
                                                            ).map((rec) => {
                                                                const vals = getRowValues(rec);
                                                                const hasEdits = rowHasEdits(rec.row);
                                                                return (
                                                                    <tr key={rec.row} className={styles.errorRow}>
                                                                        <td className={styles.rowNum}>{rec.row}</td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className={styles.editInput}
                                                                                value={vals.employeeId}
                                                                                onChange={(e) => handleInvalidEdit(rec.row, 'employeeId', e.target.value)}
                                                                                placeholder="ID Empleado"
                                                                                aria-label={`ID Empleado fila ${rec.row}`}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className={styles.editInput}
                                                                                value={vals.courseName}
                                                                                onChange={(e) => handleInvalidEdit(rec.row, 'courseName', e.target.value)}
                                                                                placeholder="Nombre del Curso"
                                                                                aria-label={`Curso fila ${rec.row}`}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="date"
                                                                                className={styles.editInput}
                                                                                value={vals.date}
                                                                                onChange={(e) => handleInvalidEdit(rec.row, 'date', e.target.value)}
                                                                                aria-label={`Fecha fila ${rec.row}`}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                className={`${styles.editInput} ${styles.scoreInput}`}
                                                                                value={vals.score}
                                                                                min="0"
                                                                                max="100"
                                                                                onChange={(e) => handleInvalidEdit(rec.row, 'score', e.target.value)}
                                                                                aria-label={`Calificación fila ${rec.row}`}
                                                                            />
                                                                        </td>
                                                                        <td className={styles.errorMsgCell}>
                                                                            <span className={styles.errorMsg} title={rec.issues?.join(' • ')}>
                                                                                {rec.issues?.join(' • ')}
                                                                            </span>
                                                                        </td>
                                                                        <td className={styles.applyCell}>
                                                                            {hasEdits && (
                                                                                <button
                                                                                    type="button"
                                                                                    className={styles.applyBtn}
                                                                                    onClick={() => applyCorrection(rec)}
                                                                                    aria-label={`Aplicar corrección fila ${rec.row}`}
                                                                                >
                                                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                    Aplicar
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {importPreview.invalid.length > 5 && (
                                                    <button
                                                        type="button"
                                                        className={styles.showMoreBtn}
                                                        onClick={() => setShowAllErrors(v => !v)}
                                                    >
                                                        {showAllErrors
                                                            ? 'Mostrar menos'
                                                            : `Ver ${importPreview.invalid.length - 5} errores más`
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* â”€â”€ VALID SECTION (selectable) â”€â”€ */}
                                        {importPreview.valid.length > 0 && (
                                            <div className={styles.validSection}>
                                                <div className={styles.validSectionHeader}>
                                                    <span className={styles.validSectionTitle}>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Registros válidos
                                                    </span>
                                                    <span className={styles.validCount}>
                                                        {rowsToImport.length} de {importPreview.valid.length} seleccionados
                                                    </span>
                                                </div>

                                                <div className={styles.validTableWrap}>
                                                    <table className={styles.previewTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>
                                                                    <input
                                                                        type="checkbox"
                                                                        className={styles.headerCheckbox}
                                                                        checked={allValidSelected}
                                                                        onChange={toggleAllValidRows}
                                                                        aria-label="Seleccionar todos los registros válidos"
                                                                    />
                                                                </th>
                                                                <th>#</th>
                                                                <th>Empleado</th>
                                                                <th>Curso</th>
                                                                <th>Fecha</th>
                                                                <th>Cal.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(showAllValid
                                                                ? importPreview.valid
                                                                : importPreview.valid.slice(0, 8)
                                                            ).map((rec) => {
                                                                const isSelected = effectiveSelected.has(rec.row);
                                                                return (
                                                                    <tr
                                                                        key={rec.row}
                                                                        className={`${styles.validRow} ${!isSelected ? styles.unselectedRow : ''}`}
                                                                    >
                                                                        <td>
                                                                            <input
                                                                                type="checkbox"
                                                                                className={styles.rowCheckbox}
                                                                                checked={isSelected}
                                                                                onChange={() => toggleValidRow(rec.row)}
                                                                                aria-label={`Incluir fila ${rec.row}`}
                                                                            />
                                                                        </td>
                                                                        <td className={styles.rowNum}>{rec.row}</td>
                                                                        <td>{rec.employeeName || rec.employeeId}</td>
                                                                        <td className={styles.courseCell} title={rec.courseName}>
                                                                            {rec.courseName}
                                                                        </td>
                                                                        <td>{rec.date}</td>
                                                                        <td>
                                                                            <span className={`${styles.scoreBadge} ${rec.score >= 70 ? styles.scoreGood : styles.scoreBad}`}>
                                                                                {rec.score}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {importPreview.valid.length > 8 && (
                                                    <button
                                                        type="button"
                                                        className={styles.showMoreBtn}
                                                        onClick={() => setShowAllValid(v => !v)}
                                                    >
                                                        {showAllValid
                                                            ? 'Mostrar menos'
                                                            : `Ver ${importPreview.valid.length - 8} registros más`
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        {importProgress && (
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressLabel}>
                                                    Importando registro {importProgress.current} de {importProgress.total}â€¦
                                                </div>
                                                <div className={styles.progressTrack}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className={styles.importActions}>
                                            <Button variant="ghost" onClick={resetImport} disabled={importing}>
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleImportConfirm}
                                                disabled={importing || rowsToImport.length === 0}
                                            >
                                                {importing
                                                    ? `Importando ${importProgress?.current ?? 0}/${importProgress?.total ?? rowsToImport.length}â€¦`
                                                    : `Importar ${rowsToImport.length} registro${rowsToImport.length !== 1 ? 's' : ''}`
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        ) : (

                            /* ===== MANUAL MODE ===== */
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
                                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', alignItems: 'flex-start', textAlign: 'left', flex: 1 }}>
                                                            <small style={{ opacity: 0.7, fontSize: '0.75em' }}>{emp.employeeId}</small>
                                                            <span>{emp.name}</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEmps.includes(emp.id)}
                                                            onChange={() => toggleEmp(emp.id)}
                                                        />
                                                    </label>
                                                ))}
                                                {filteredEmployees.length === 0 && (
                                                    <p className="text-muted p-2">Sin resultados.</p>
                                                )}
                                            </div>
                                            <div className={multiStyles.selectionSummary}>
                                                <span>{selectedEmps.length} seleccionados</span>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="button" onClick={selectAllFilteredEmps} className={multiStyles.selectAllBtn}>
                                                        Todo Visible
                                                    </button>
                                                    <button type="button" onClick={clearSelection} className={multiStyles.selectAllBtn}>
                                                        Limpiar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 2: Cursos */}
                                    <div className={styles.formGroup}>
                                        <label>2. Seleccionar Cursos ({isNewCourse ? '1 Nuevo' : selectedCourses.length})</label>

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
                                                            <span style={{ flex: 1, textAlign: 'left' }}>{c}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCourses.includes(c)}
                                                                onChange={() => toggleCourse(c)}
                                                            />
                                                        </label>
                                                    ))}
                                                    {filteredCourses.length === 0 && (
                                                        <p className="text-muted p-2">Sin resultados.</p>
                                                    )}
                                                </div>
                                                <div className={multiStyles.selectionSummary}>
                                                    <span>{selectedCourses.length} seleccionados</span>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button type="button" onClick={selectAllFilteredCourses} className={multiStyles.selectAllBtn}>
                                                            Todo Visible
                                                        </button>
                                                        <button type="button" onClick={clearCourseSelection} className={multiStyles.selectAllBtn}>
                                                            Limpiar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Common Data & Actions */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: '1.5rem',
                                    marginTop: '1.5rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div className={styles.formGroup} style={{ marginBottom: 0, width: '180px' }}>
                                        <label>Calificación (0-100)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={qualification}
                                            onChange={(e) => setQualification(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup} style={{ marginBottom: 0, width: '200px' }}>
                                        <label>Fecha de Aplicación</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className={styles.input}
                                            required
                                        />
                                    </div>

                                    <div className={styles.infoBox} style={{ margin: 0, padding: '11px 20px', height: 'fit-content' }}>
                                        <p style={{ margin: 0 }}>
                                            Se crearán{' '}
                                            <strong>{selectedEmps.length * (isNewCourse ? 1 : selectedCourses.length)}</strong>
                                            {' '}registros en total.
                                        </p>
                                    </div>

                                    <div className={styles.actions} style={{ marginTop: 0, marginLeft: 'auto' }}>
                                        {canWrite() ? (
                                            <Button
                                                type="submit"
                                                disabled={submitting || selectedEmps.length === 0}
                                            >
                                                {submitting ? 'Procesando...' : 'Confirmar Carga Masiva'}
                                            </Button>
                                        ) : (
                                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                                Solo lectura — No tienes permisos para registrar
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
        </AdminLayout>
    );
}
