'use client';

import { useState, useEffect } from 'react';
import BackButton from '@/components/ui/BackButton/BackButton';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { Card, CardContent } from '@/components/ui/Card/Card';
import QuestionManager from '@/components/features/QuestionManager/QuestionManager'; // [NEW]
import Link from 'next/link';
import styles from './page.module.css';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ExamenPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [showQuestionManager, setShowQuestionManager] = useState(false); // [NEW]

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Config State
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [category, setCategory] = useState('D_C'); // D_C, C_B, B_A
    const [department, setDepartment] = useState('Producción');
    const [loading, setLoading] = useState(false);

    // Auto-update category when department changes
    useEffect(() => {
        if (department === 'Moldes') setCategory('E_D');
        else if (department === 'Recursos Humanos') setCategory('RH_ALL');
        else setCategory('D_C');
    }, [department]);

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

            // 2. Fetch ALL questions (optimized)
            const qSnap = await getDocs(collection(db, 'exam_questions'));
            const allQuestions = qSnap.docs.map(d => ({ ...d.data(), id: d.id }));

            if (allQuestions.length === 0) {
                toast.error("Error", "No hay preguntas en la base de datos.");
                setLoading(false);
                return;
            }



            // FILTER BY DEPARTMENT
            // Normalize department check for questions that might be missing it (older ones default to Produccion)
            const deptQuestions = allQuestions.filter(q => (q.department || 'Producción') === department);
            console.log(`[DEBUG] Department: ${department}, Questions Found: ${deptQuestions.length}`);

            // MOLDES LOGIC
            if (department === 'Moldes') {
                let targetLevel = '';
                let strictFilter = (q) => false;

                // Define strategies
                // E -> D: Target D. Strict: Has D, no E.
                // D -> C: Target C. Strict: Has C, no D, no E.
                // C -> B: Target B. Strict: Has B, no C, no D, no E.

                if (category === 'E_D') {
                    count = 20;
                    targetLevel = 'D';
                    strictFilter = q => q.levels?.includes('D') && !q.levels?.includes('E');
                } else if (category === 'D_C') {
                    count = 20;
                    targetLevel = 'C';
                    strictFilter = q => q.levels?.includes('C') && !q.levels?.includes('D') && !q.levels?.includes('E');
                } else if (category === 'C_B') {
                    count = 20;
                    targetLevel = 'B';
                    strictFilter = q => q.levels?.includes('B') && !q.levels?.includes('C') && !q.levels?.includes('D') && !q.levels?.includes('E');
                } else if (category === 'B_A') {
                    count = 9999;
                    targetLevel = 'A';
                    strictFilter = q => q.levels?.includes('A');
                } else {
                    // Fallback
                    strictFilter = () => true;
                }

                // 1. Get Strict Questions
                let selectedQuestions = deptQuestions.filter(strictFilter);

                // 2. If not enough, fill with looser filter (Just includes target level, excluding already selected)
                if (selectedQuestions.length < count && category !== 'B_A') {
                    const needed = count - selectedQuestions.length;
                    const usedIds = new Set(selectedQuestions.map(q => q.id));

                    const pool = deptQuestions.filter(q =>
                        q.levels?.includes(targetLevel) && !usedIds.has(q.id)
                    );

                    // Shuffle pool and take needed
                    const shuffledPool = pool.sort(() => 0.5 - Math.random());
                    const extra = shuffledPool.slice(0, needed);

                    selectedQuestions = [...selectedQuestions, ...extra];
                }

                if (selectedQuestions.length === 0) {
                    toast.error("Error", `No hay preguntas para el nivel seleccionado en Moldes.`);
                    setLoading(false);
                    return;
                }

                // Shuffle final result
                const finalQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, count);

                setExamData({
                    employee: selectedEmployee,
                    date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                    categoryLabel: `${getCategoryLabel(category, 'Moldes')}`,
                    questions: finalQuestions,
                    isMoldes: true
                });

                toast.success("Éxito", "Examen Moldes generado correctamente.");
                setLoading(false);
                return;
            }

            // RECURSOS HUMANOS LOGIC — todas las preguntas cargadas
            if (department === 'Recursos Humanos') {
                if (deptQuestions.length === 0) {
                    toast.error("Error", `No se encontraron preguntas de RH. ¿Se importaron correctamente?`);
                    setLoading(false);
                    return;
                }

                // Shuffle all RH questions
                const finalQuestions = [...deptQuestions].sort(() => 0.5 - Math.random());

                setExamData({
                    employee: selectedEmployee,
                    date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                    categoryLabel: 'Recursos Humanos — Examen Completo',
                    questions: finalQuestions,
                    isRH: true
                });

                toast.success("Éxito", `Examen RH generado con ${finalQuestions.length} preguntas.`);
                setLoading(false);
                return;
            }

            // STANDARD LOGIC (Produccion, Calidad)
            if (deptQuestions.length === 0) {
                toast.error("Error", `No hay preguntas para el departamento: ${department}`);
                setLoading(false);
                return;
            }

            // 3. Separate Fixed vs Pool
            const fixedQuestions = deptQuestions.filter(q => q.isFixed === true);
            const otherQuestions = deptQuestions.filter(q => q.isFixed !== true);

            // 4. Calculate slots
            const neededRandom = Math.max(0, count - fixedQuestions.length);

            // 5. Randomize Pool and Slice
            const shuffledPool = [...otherQuestions].sort(() => 0.5 - Math.random());
            const selectedRandom = shuffledPool.slice(0, neededRandom);

            // 6. Combine and Shuffle Final Set
            // We shuffle again so fixed questions aren't always at the top
            const combinedQuestions = [...fixedQuestions, ...selectedRandom];
            const finalQuestions = combinedQuestions.sort(() => 0.5 - Math.random());

            // 7. Set Exam Data
            setExamData({
                employee: selectedEmployee,
                date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                categoryLabel: `${getCategoryLabel(category)} - ${department}`,
                questions: finalQuestions
            });

            toast.success("Éxito", "Examen generado correctamente.");

        } catch (error) {
            console.error("Error generating exam", error);
            toast.error("Error", "Falló la generación del examen.");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (cat, dept) => {
        if (dept === 'Moldes') {
            switch (cat) {
                case 'E_D': return 'Categoría E a D (Básico)';
                case 'D_C': return 'Categoría D a C (Intermedio)';
                case 'C_B': return 'Categoría C a B (Avanzado)';
                case 'B_A': return 'Categoría B a A (Experto)';
                default: return cat;
            }
        }
        if (dept === 'Recursos Humanos') {
            return 'Examen Completo';
        }
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



    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

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

                    {/* Pagination Styles for Moldes B->A if needed */}
                    <style jsx global>{`
                        @media print {
                            .page-break { page-break-after: always; }
                        }
                    `}</style>

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
                <div className={styles.titleRow}>
                    <BackButton href="/capacitacion" />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Button variant="outline" size="sm" onClick={() => setShowQuestionManager(true)}>
                            Gestionar Preguntas
                        </Button>
                        <Link href="/capacitacion/examen/respuestas">
                            <Button variant="outline" size="sm">
                                📋 Ver Respuestas
                            </Button>
                        </Link>
                    </div>
                </div>
                <h1 style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-primary)' }}>Generador de Exámenes</h1>
            </div>

            <QuestionManager
                isOpen={showQuestionManager}
                onClose={() => setShowQuestionManager(false)}
            />

            <div className={styles.configCard}>
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
                    <label>2. Departamento del Examen</label>
                    <select
                        className={styles.select}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    >
                        <option value="Producción">Producción</option>
                        <option value="Calidad">Calidad</option>
                        <option value="Moldes">Moldes</option>
                        <option value="Recursos Humanos">Recursos Humanos</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>3. Tipo de Promoción (Categoría)</label>
                    <select
                        className={styles.select}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {department === 'Moldes' ? (
                            <>
                                <option value="E_D">Categoría E a D (20 preguntas)</option>
                                <option value="D_C">Categoría D a C (20 preguntas)</option>
                                <option value="C_B">Categoría C a B (20 preguntas)</option>
                                <option value="B_A">Categoría B a A (Todas)</option>
                            </>
                        ) : department === 'Recursos Humanos' ? (
                            <>
                                <option value="RH_ALL">Examen Completo (Todas las preguntas)</option>
                            </>
                        ) : (
                            <>
                                <option value="D_C">Categoría D a C (20 Preguntas)</option>
                                <option value="C_B">Categoría C a B (30 Preguntas)</option>
                                <option value="B_A">Categoría B a A (40 Preguntas)</option>
                            </>
                        )}
                    </select>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={loading || !selectedEmployee}
                    className={styles.generateBtn}
                >
                    {loading ? 'Generando...' : 'Generar Examen'}
                </Button>
            </div>
        </div>
    );
}
