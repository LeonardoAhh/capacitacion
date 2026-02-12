'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { Card, CardContent } from '@/components/ui/Card/Card';
import QuestionManager from '@/components/QuestionManager/QuestionManager'; // [NEW]
import styles from './page.module.css';

export default function ExamenPage() {
    const { toast } = useToast();
    const [showQuestionManager, setShowQuestionManager] = useState(false); // [NEW]

    // Config State
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [category, setCategory] = useState('D_C'); // D_C, C_B, B_A
    const [loading, setLoading] = useState(false);

    // Exam State
    const [examData, setExamData] = useState(null);

    // Load simple employee list for autocomplete
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const q = query(collection(db, 'training_records'), orderBy('name'));
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({
                    id: d.id,
                    name: d.data().name,
                    department: d.data().department,
                    position: d.data().position,
                    employeeId: d.data().employeeId || d.id
                }));
                setEmployees(data);
            } catch (error) {
                console.error("Error loading employees", error);
                toast.error("Error", "No se pudieron cargar los empleados.");
            }
        };
        loadEmployees();
    }, [toast]);

    // Filter employees for autocomplete
    const filteredEmployees = searchTerm.trim()
        ? employees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.employeeId && e.employeeId.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 10)
        : [];

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setSearchTerm(emp.name);
    };

    const handleGenerate = async () => {
        if (!selectedEmployee) {
            toast.error("Falta información", "Selecciona un empleado.");
            return;
        }

        setLoading(true);
        try {
            // 1. Determine question count
            let count = 20;
            if (category === 'C_B') count = 30;
            if (category === 'B_A') count = 40;

            // 2. Fetch ALL questions (optimized: we only have ~260, so this is cheap)
            // Ideally we'd cache this or use a more clever random query, but for <500 docs, reading all is fine.
            const qSnap = await getDocs(collection(db, 'exam_questions'));
            const allQuestions = qSnap.docs.map(d => d.data());

            if (allQuestions.length === 0) {
                toast.error("Error", "No hay preguntas en la base de datos.");
                setLoading(false);
                return;
            }

            // 3. Randomize and Slice
            const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
            const selectedQuestions = shuffled.slice(0, count);

            // 4. Set Exam Data
            setExamData({
                employee: selectedEmployee,
                date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                categoryLabel: getCategoryLabel(category),
                questions: selectedQuestions
            });

            toast.success("Éxito", "Examen generado correctamente.");

        } catch (error) {
            console.error("Error generating exam", error);
            toast.error("Error", "Falló la generación del examen.");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (cat) => {
        switch (cat) {
            case 'D_C': return 'Categoría D a C';
            case 'C_B': return 'Categoría C a B';
            case 'B_A': return 'Categoría B a A';
            default: return cat;
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleReset = () => {
        setExamData(null);
        setSelectedEmployee(null);
        setSearchTerm('');
        setCategory('D_C');
    };

    if (examData) {
        return (
            <div className={styles.printContainer}>
                {/* Print Control Bar (Hidden when printing) */}
                <div className={styles.noPrintControl}>
                    <Button variant="outline" onClick={handleReset}>←</Button>
                    <Button onClick={handlePrint}>🖨️ Imprimir</Button>
                </div>

                {/* Printable Exam Sheet */}
                <div className={styles.examSheet}>
                    <div className={styles.examHeader}>
                        <div className={styles.logoArea}>
                            {/* Placeholder for Logo if exists, or text */}
                            <h2>VIÑOPLASTIC</h2>
                            <p>Ingeniería en Plásticos</p>
                        </div>
                        <div className={styles.examInfo}>
                            <h1>EXAMEN DE CONOCIMIENTOS</h1>
                            <p><strong>Fecha:</strong> {examData.date}</p>
                        </div>
                    </div>

                    <div className={styles.employeeInfoBox}>
                        <div className={styles.infoRow}>
                            <span><strong>Nombre:</strong> {examData.employee.name}</span>
                            <span><strong>No. Empleado:</strong> {examData.employee.employeeId}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span><strong>Departamento:</strong> {examData.employee.department}</span>
                            <span><strong>Puesto:</strong> {examData.employee.position}</span>
                        </div>
                    </div>

                    <div className={styles.instructions}>
                        <p><strong>Instrucciones:</strong> Lea cuidadosamente cada pregunta y seleccione la respuesta correcta. Tienes un tiempo límite de 30 minutos.</p>
                    </div>

                    <div className={styles.questionsList}>
                        {examData.questions.map((q, idx) => (
                            <div key={q.id} className={styles.questionItem}>
                                <div className={styles.questionText}>
                                    <strong>{idx + 1}. {q.question}</strong>
                                </div>
                                <div className={styles.optionsGrid}>
                                    {q.type === 'Múltiple' ? (
                                        <>
                                            <div className={styles.option}>
                                                <span className={styles.checkbox}></span>
                                                <span>A) {q.options.a}</span>
                                            </div>
                                            <div className={styles.option}>
                                                <span className={styles.checkbox}></span>
                                                <span>B) {q.options.b}</span>
                                            </div>
                                            <div className={styles.option}>
                                                <span className={styles.checkbox}></span>
                                                <span>C) {q.options.c}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.openAnswerLine}>
                                            __________________________________________________________________________________________
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.signatures}>
                        <div className={styles.signatureBox}>
                            <div className={styles.signLine}></div>
                            <p>Firma del Empleado</p>
                        </div>
                        <div className={styles.signatureBox}>
                            <div className={styles.signLine}></div>
                            <p>Firma del Evaluador</p>
                        </div>
                        <div className={styles.scoreBox}>
                            <p>Calificación: ________ / 100</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/capacitacion" className={styles.backBtn}>
                    ← Volver
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Generador de Exámenes</h1>
                    <Button variant="outline" size="sm" onClick={() => setShowQuestionManager(true)}>
                        Gestionar Preguntas
                    </Button>
                </div>
            </div>

            <QuestionManager
                isOpen={showQuestionManager}
                onClose={() => setShowQuestionManager(false)}
            />

            <Card className={styles.configCard}>
                <CardContent>
                    <div className={styles.formGroup}>
                        <label>1. Seleccionar Empleado</label>
                        <div className={styles.autocompleteWrapper}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                className={styles.input}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (selectedEmployee) setSelectedEmployee(null); // Reset selection on edit
                                }}
                            />
                            {searchTerm && !selectedEmployee && filteredEmployees.length > 0 && (
                                <ul className={styles.suggestionsList}>
                                    {filteredEmployees.map(emp => (
                                        <li key={emp.id} onClick={() => handleSelectEmployee(emp)}>
                                            <strong>{emp.name}</strong> - {emp.position}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {selectedEmployee && (
                            <div className={styles.selectedBadge}>
                                ✓ Seleccionado: {selectedEmployee.name} ({selectedEmployee.department})
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>2. Tipo de Promoción (Categoría)</label>
                        <select
                            className={styles.select}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="D_C">Categoría D a C (20 Preguntas)</option>
                            <option value="C_B">Categoría C a B (30 Preguntas)</option>
                            <option value="B_A">Categoría B a A (40 Preguntas)</option>
                        </select>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !selectedEmployee}
                        className={styles.generateBtn}
                    >
                        {loading ? 'Generando...' : 'Generar Examen'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
