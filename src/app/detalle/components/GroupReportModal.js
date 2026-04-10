'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Users, Download, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast/Toast';
import { generateTrainingReportHTML, generateFullReportHTML } from '@/utils/pdfGenerator';
import { Select } from '@/components/ui/Select/Select';
import styles from './GroupReportModal.module.css';

const PASSING_SCORE = 80;

export default function GroupReportModal({ isOpen, onClose }) {
    const { toast } = useToast();
    
    const [loadingData, setLoadingData] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    
    // Data states
    const [areas, setAreas] = useState([]);
    const [positionsByArea, setPositionsByArea] = useState({});
    
    // Selection states
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedPositions, setSelectedPositions] = useState([]);

    // Load available areas and positions on mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            if (!isOpen) return;
            setLoadingData(true);
            try {
                // Fetch all unique areas and positions from the training records
                // Since this might be large, we'll fetch from positions collection instead 
                // to populate the filters, which is smaller.
                const positionsSnap = await getDocs(collection(db, 'positions'));
                
                const areaMap = new Set();
                const posAreaMap = {};

                positionsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.department) {
                        const areaName = data.department.trim().toUpperCase();
                        areaMap.add(areaName);
                        
                        if (!posAreaMap[areaName]) {
                            posAreaMap[areaName] = [];
                        }
                        posAreaMap[areaName].push({
                            name: data.name,
                            requiredCourses: data.requiredCourses || []
                        });
                    }
                });

                setAreas(Array.from(areaMap).sort());
                setPositionsByArea(posAreaMap);
                
            } catch (error) {
                console.error("Error loading filters data:", error);
                toast.error("Error", "No se pudieron cargar los filtros de áreas y puestos.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchFiltersData();
    }, [isOpen, toast]);

    const availablePositions = useMemo(() => {
        if (!selectedArea || !positionsByArea[selectedArea]) return [];
        return positionsByArea[selectedArea].sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedArea, positionsByArea]);

    // Handle Area change
    const handleAreaChange = (value) => {
        setSelectedArea(value);
        setSelectedPositions([]); // Reset positions when area changes
    };

    // Handle Position Selection
    const togglePosition = (posName) => {
        setSelectedPositions(prev => {
            if (prev.includes(posName)) {
                return prev.filter(p => p !== posName);
            } else {
                return [...prev, posName];
            }
        });
    };

    const selectAllPositions = () => {
        if (selectedPositions.length === availablePositions.length) {
            setSelectedPositions([]);
        } else {
            setSelectedPositions(availablePositions.map(p => p.name));
        }
    };

    // Calculate individual training stats
    const analyzeTraining = (employee, requiredCourses) => {
        const history = employee.history || [];
        
        const approved = [];
        const failed = [];

        history.forEach(record => {
            const courseName = record.courseName || record.course;
            const score = parseFloat(record.score) || parseFloat(record.qualification) || 0;
            const isApproved = record.status === 'approved' || (record.status === undefined && score >= PASSING_SCORE);

            if (isApproved) {
                approved.push({ name: courseName, date: record.date, score });
            } else {
                failed.push({ name: courseName, date: record.date, score });
            }
        });

        const normalizeForMatch = (str) => (str || '')
            .normalize("NFD").replace(/[-]/g, "")
            .toUpperCase().trim();

        const passedNames = approved.map(c => normalizeForMatch(c.name));
        const pending = requiredCourses.filter(c =>
            !passedNames.includes(normalizeForMatch(c))
        );

        let matrixCompliance = 0;
        if (requiredCourses.length > 0) {
            const completedCount = requiredCourses.length - pending.length;
            matrixCompliance = Math.round((completedCount / requiredCourses.length) * 100);
        }

        return { approved, failed, pending, all: history, matrixCompliance };
    };

    // Generate Report Workflow
    const handleGenerateReport = async () => {
        if (!selectedArea || selectedPositions.length === 0) {
            toast.warning("Faltan datos", "Selecciona una área y al menos un puesto.");
            return;
        }

        setGeneratingPdf(true);
        
        try {
            // 1. Fetch employees matching area and positions
            // Since Area/Departamento strings might not perfectly match between positions/training_records 
            // and Firebase doesn't support case-insensitive 'in' queries:
            // Let's query everyone by area OR department locally.
            // In a small-mid scale system, fetching the collection and filtering locally is safer.
            const allRecordsSnap = await getDocs(collection(db, 'training_records'));
            let allEmployees = [];
            
            const targetArea = selectedArea.trim().toUpperCase();
            const targetPositions = selectedPositions.map(p => p.trim().toUpperCase());

            allRecordsSnap.forEach(doc => {
                const data = doc.data();
                
                // Allow matches on 'area' or 'department'
                const empAreaRaw = data.area || data.department || '';
                const empPosRaw = data.position || '';
                const empArea = empAreaRaw.trim().toUpperCase();
                const empPos = empPosRaw.trim().toUpperCase();

                // Detailed Log for Debugging
                // console.log(`Checking Employee ID: ${doc.id} - ${data.name}`);
                // console.log(`  Raw Area/Dept: "${empAreaRaw}", Normalized: "${empArea}" (Target: "${targetArea}")`);
                // console.log(`  Raw Position: "${empPosRaw}", Normalized: "${empPos}"`);

                // Check if the area string includes the target area (e.g., "A. CALIDAD 1ER TURNO" includes "CALIDAD")
                const areaMatches = empArea.includes(targetArea);

                if (areaMatches && targetPositions.includes(empPos)) {
                    // console.log(`  >>> MATCH FOUND: ${data.name}`);
                    allEmployees.push({ id: doc.id, ...data });
                }
            });

            if (allEmployees.length === 0) {
                toast.warning("Sin resultados", "No se encontraron empleados con los filtros seleccionados.");
                setGeneratingPdf(false);
                return;
            }

            toast.success("Empleados encontrados", `Generando reporte para ${allEmployees.length} empleados...`);

            // 2. Generate HTML pages per employee
            const reportPages = [];

            for (const emp of allEmployees) {
                // Find required courses for this employee's position
                const posData = availablePositions.find(p => p.name === emp.position);
                const requiredCourses = posData ? posData.requiredCourses : [];
                
                const stats = analyzeTraining(emp, requiredCourses);
                
                const htmlPage = generateTrainingReportHTML(emp, stats, stats.matrixCompliance);
                reportPages.push(htmlPage);
            }

            // 3. Combine and print
            const combinedHtml = reportPages.join('\n');
            const fullHtmlDocument = generateFullReportHTML(combinedHtml);

            const win = window.open('', '_blank', 'width=900,height=700');
            if (win) {
                win.document.write(fullHtmlDocument);
                win.document.close();
                win.focus();
                setTimeout(() => win.print(), 800);
            } else {
                toast.error("Error", "Permite las ventanas emergentes (pop-ups) para ver el reporte.");
            }
            
            onClose(); // Close modal on success

        } catch (error) {
            console.error("Error generating group report:", error);
            toast.error("Error", "Hubo un problema al generar el reporte grupal.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={styles.modalOverlay}>
                <motion.div
                    className={styles.modalContent}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    <div className={styles.modalHeader}>
                        <div className={styles.headerTitle}>
                            <Users size={20} className={styles.headerTitleIcon} />
                            <h3>Reporte Grupal de Capacitación</h3>
                        </div>
                        <button onClick={onClose} className={styles.closeBtn} disabled={generatingPdf}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        {loadingData ? (
                            <div className={styles.loadingState}>
                                <div className={styles.spinner}></div>
                                <p>Cargando filtros...</p>
                            </div>
                        ) : (
                            <div className={styles.filtersContainer}>
                                <div className={styles.filterGroup}>
                                    <label>1. Seleccionar Área / Departamento</label>
                                    <Select
                                        value={selectedArea}
                                        onChange={handleAreaChange}
                                        options={areas.map(area => ({ value: area, label: area }))}
                                        placeholder="-- Elige un área --"
                                        disabled={generatingPdf}
                                    />
                                </div>

                                <div className={styles.filterGroup}>
                                    <div className={styles.positionHeader}>
                                        <label>2. Seleccionar Puestos</label>
                                        {selectedArea && availablePositions.length > 0 && (
                                            <button 
                                                type="button" 
                                                onClick={selectAllPositions}
                                                className={styles.selectAllBtn}
                                                disabled={generatingPdf}
                                            >
                                                {selectedPositions.length === availablePositions.length 
                                                    ? 'Deseleccionar todos' 
                                                    : 'Seleccionar todos'
                                                }
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className={styles.positionsList}>
                                        {!selectedArea ? (
                                            <div className={styles.emptyMsg}>
                                                <Filter size={16} />
                                                <span>Selecciona un área primero para ver los puestos.</span>
                                            </div>
                                        ) : availablePositions.length === 0 ? (
                                            <div className={styles.emptyMsg}>
                                                <AlertCircle size={16} />
                                                <span>No hay puestos registrados para esta área.</span>
                                            </div>
                                        ) : (
                                            availablePositions.map(pos => {
                                                const isSelected = selectedPositions.includes(pos.name);
                                                return (
                                                    <label 
                                                        key={pos.name} 
                                                        className={`${styles.positionItem} ${isSelected ? styles.selected : ''}`}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected}
                                                            onChange={() => togglePosition(pos.name)}
                                                            className={styles.srOnly}
                                                            disabled={generatingPdf}
                                                        />
                                                        {isSelected ? (
                                                            <CheckSquare size={18} className={styles.checkIconActive} />
                                                        ) : (
                                                            <Square size={18} className={styles.checkIconInactive} />
                                                        )}
                                                        <span>{pos.name}</span>
                                                    </label>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button 
                            className={styles.cancelBtn} 
                            onClick={onClose}
                            disabled={generatingPdf}
                        >
                            Cancelar
                        </button>
                        <button 
                            className={styles.generateBtn} 
                            onClick={handleGenerateReport}
                            disabled={
                                generatingPdf || 
                                loadingData || 
                                !selectedArea || 
                                selectedPositions.length === 0
                            }
                        >
                            {generatingPdf ? (
                                <>
                                    <div className={styles.spinnerSmall}></div>
                                    Generando PDFs...
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Generar Reportes
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
