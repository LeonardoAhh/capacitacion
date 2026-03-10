import { useState } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────
const EXAM_TEMPLATE = {
    id: "RG-GER-015",
    rev: "Rev. 2",
    title: "Alerta de calidad y catálogo de fallas",
    passingScore: 7,
    questions: [
        {
            id: 1, type: "single", points: 1.43,
            text: "Menciona, ¿Para qué sirve una alerta de calidad?",
            options: [
                { id: "a", text: "Documento que describe un problema relacionado con la calidad del producto, su principal función es notificar y prevenir el defecto." },
                { id: "b", text: "Método para identificar defectos." },
                { id: "c", text: "Documento cuya función es llevar un histórico de todos los defectos de la pieza." },
            ],
            correct: "a",
        },
        {
            id: 2, type: "single", points: 1.43,
            text: "Indica, ¿A qué áreas es notificado cuando llega un reclamo?",
            options: [
                { id: "a", text: "Producción, calidad, almacén, proyectos, inspección recibo, GP12, metrología, taller de moldes y las demás áreas internas." },
                { id: "b", text: "Producción, calidad, almacén, inspección y metrología." },
                { id: "c", text: "Sólo producción, calidad y almacén." },
            ],
            correct: "a",
        },
        {
            id: 3, type: "single", points: 1.43,
            text: "Indica, ¿A qué se refiere la marca de punto limpio?",
            options: [
                { id: "a", text: "Leyenda que se coloca en el producto rechazado para indicar que ya fue revisado." },
                { id: "b", text: "Material que debe ser revisado antes de su uso." },
                { id: "c", text: "Es una etiqueta que nos garantiza que el material ya fue revisado y que el material es aceptable, no lleva ningún defecto." },
            ],
            correct: "c",
        },
        {
            id: 4, type: "single", points: 1.43,
            text: "¿Qué imágenes muestra una alerta de calidad?",
            options: [
                { id: "a", text: "Una pieza con el defecto de calidad." },
                { id: "b", text: "Una pieza no aceptable y una aceptable." },
                { id: "c", text: "Dos piezas defectuosas de distintos tipos." },
            ],
            correct: "b",
        },
        {
            id: 5, type: "single", points: 1.43,
            text: "¿Cuál es la vigencia de una alerta de calidad?",
            options: [
                { id: "a", text: "5 lotes máximo a menos que haya recurrencia." },
                { id: "b", text: "6 lotes como mínimo." },
                { id: "c", text: "5 lotes máximo, sin importar si hay recurrencia." },
            ],
            correct: "a",
        },
        {
            id: 6, type: "single", points: 1.43,
            text: "¿Cuál es la diferencia entre catálogo de fallas y alerta de calidad?",
            options: [
                { id: "a", text: "Una alerta de calidad notifica un defecto de calidad cuando se identifica un problema en el producto, mientras que el catálogo de fallas lleva el historial de las fallas en un producto." },
                { id: "b", text: "La alerta de calidad lleva el historial de defectos en un producto, mientras que el catálogo de fallas notifica los defectos de manera inmediata." },
                { id: "c", text: "Ambas respuestas son incorrectas." },
            ],
            correct: "a",
        },
        {
            id: 7, type: "truefalse", points: 1.43,
            text: "Sobre el catálogo de fallas, selecciona las 3 afirmaciones correctas marcando con una 'V' de verdadero y una 'F' de falso.",
            statements: [
                { id: "s1", text: "Es un documento que lleva el historial de todas las fallas en un producto.", correct: true },
                { id: "s2", text: "Sirve para prevenir defectos, identificarlos y reducir costos de la no calidad.", correct: true },
                { id: "s3", text: "Solo se usa cuando hay un problema de calidad en producción.", correct: false },
                { id: "s4", text: "Se consulta en la estación de trabajo o en carpetas de calidad.", correct: true },
                { id: "s5", text: "Reemplaza la alerta de calidad, ya que ambas cumplen la misma función.", correct: false },
            ],
        },
    ],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const today = () => new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

function gradeExam(questions, answers) {
    let total = 0;
    const breakdown = questions.map((q) => {
        if (q.type === "single") {
            const correct = answers[q.id] === q.correct;
            const pts = correct ? q.points : 0;
            total += pts;
            return { id: q.id, correct, points: pts, max: q.points };
        } else {
            // truefalse: all statements must match
            const allCorrect = q.statements.every((s) => answers[`${q.id}_${s.id}`] === s.correct);
            const pts = allCorrect ? q.points : 0;
            total += pts;
            return { id: q.id, correct: allCorrect, points: pts, max: q.points };
        }
    });
    return { total: +total.toFixed(2), breakdown };
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Logo() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                width: 56, height: 46, background: "#1a3a6b", borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", padding: 4,
            }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, fontFamily: "serif", letterSpacing: 1 }}>ViÑO</span>
                <div style={{ width: "100%", height: 3, background: "#e03030", margin: "2px 0" }} />
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: 2 }}>PLASTIC</span>
            </div>
        </div>
    );
}

function Header({ exam, candidate, department, score, mode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <Logo />
                <div>
                    <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>{exam.id} · {exam.rev}</div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a3a6b" }}>Evaluación</h1>
                    <h2 style={{ margin: 0, fontSize: 15, fontStyle: "italic", color: "#e03030", fontWeight: 700 }}>{exam.title}</h2>
                </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #ccc" }}>
                <tbody>
                    <tr>
                        <td style={tdStyle}>NOMBRE:</td>
                        <td style={{ ...tdStyle, fontWeight: 700, width: "35%" }}>{candidate || "—"}</td>
                        <td style={tdStyle}>CALIFICACIÓN:</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: score !== null ? (score >= exam.passingScore ? "#15803d" : "#dc2626") : "#333", width: "15%" }}>
                            {score !== null ? `${score} / 10` : (mode === "print" ? "___" : "")}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdStyle}>DEPARTAMENTO:</td>
                        <td style={tdStyle}>{department || "—"}</td>
                        <td style={tdStyle}>FECHA:</td>
                        <td style={tdStyle}>{today()}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

const tdStyle = { border: "1px solid #ccc", padding: "5px 10px", fontSize: 13 };

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = ["📋 Examen", "✏️ Editor", "🖨️ Imprimir"];

export default function ExamModule() {
    const [tab, setTab] = useState(0);
    const [exam, setExam] = useState(EXAM_TEMPLATE);
    const [candidate, setCandidate] = useState("");
    const [department, setDepartment] = useState("");
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = () => {
        const r = gradeExam(exam.questions, answers);
        // Scale to 10
        const maxPoints = exam.questions.reduce((s, q) => s + q.points, 0);
        const scaled = +((r.total / maxPoints) * 10).toFixed(2);
        setResult({ ...r, scaled });
        setSubmitted(true);
        setTab(2);
    };

    const reset = () => {
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setTab(0);
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f5f6fa", minHeight: "100vh", padding: 0 }}>
            {/* Tab bar */}
            <div style={{ display: "flex", background: "#1a3a6b", padding: "0 24px" }}>
                {TABS.map((t, i) => (
                    <button key={i} onClick={() => setTab(i)} style={{
                        background: tab === i ? "#fff" : "transparent",
                        color: tab === i ? "#1a3a6b" : "#a8c0e8",
                        border: "none", padding: "12px 20px", fontWeight: 700,
                        fontSize: 13, cursor: "pointer", borderRadius: "6px 6px 0 0",
                        transition: "all .15s",
                    }}>{t}</button>
                ))}
                {submitted && <span style={{ marginLeft: "auto", color: "#7dc87d", alignSelf: "center", fontSize: 13, fontWeight: 700 }}>
                    ✓ Examen completado — Calificación: {result?.scaled} / 10
                </span>}
            </div>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
                {tab === 0 && <ExamView exam={exam} candidate={candidate} setCandidate={setCandidate}
                    department={department} setDepartment={setDepartment}
                    answers={answers} setAnswers={setAnswers} submitted={submitted}
                    result={result} onSubmit={handleSubmit} onReset={reset} />}
                {tab === 1 && <EditorView exam={exam} setExam={setExam} />}
                {tab === 2 && <PrintView exam={exam} candidate={candidate} department={department} result={result} answers={answers} />}
            </div>
        </div>
    );
}

// ── EXAM VIEW ─────────────────────────────────────────────────────────────────
function ExamView({ exam, candidate, setCandidate, department, setDepartment, answers, setAnswers, submitted, result, onSubmit, onReset }) {
    const setAnswer = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

    const answeredCount = exam.questions.filter(q => {
        if (q.type === "single") return answers[q.id] !== undefined;
        return q.statements.every(s => answers[`${q.id}_${s.id}`] !== undefined);
    }).length;

    return (
        <div>
            <div style={{ background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 2px 12px #0001", marginBottom: 20 }}>
                <Header exam={exam} candidate={candidate} department={department}
                    score={result ? result.scaled : null} mode="exam" />
                <p style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Contesta las siguientes preguntas:</p>

                {/* Candidate info inputs (only before submit) */}
                {!submitted && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={labelStyle}>Nombre del empleado</label>
                            <input value={candidate} onChange={e => setCandidate(e.target.value)}
                                placeholder="Nombre completo" style={inputStyle} />
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={labelStyle}>Departamento</label>
                            <input value={department} onChange={e => setDepartment(e.target.value)}
                                placeholder="Departamento" style={inputStyle} />
                        </div>
                    </div>
                )}

                {exam.questions.map((q, qi) => {
                    const breakdown = result?.breakdown.find(b => b.id === q.id);
                    return (
                        <div key={q.id} style={{
                            marginBottom: 22, padding: 16, borderRadius: 8,
                            background: submitted ? (breakdown?.correct ? "#f0fdf4" : "#fef2f2") : "#fafafa",
                            border: submitted ? `1.5px solid ${breakdown?.correct ? "#86efac" : "#fca5a5"}` : "1.5px solid #e5e7eb",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14, flex: 1 }}>
                                    {qi + 1}. {q.text}
                                </p>
                                <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", marginLeft: 8 }}>
                                    {submitted ? `${breakdown?.points}/${q.points} pts` : `${q.points} pts`}
                                </span>
                            </div>

                            {q.type === "single" && q.options.map(opt => {
                                const selected = answers[q.id] === opt.id;
                                const isCorrect = opt.id === q.correct;
                                let bg = selected ? "#e0e7ff" : "transparent";
                                let border = selected ? "#6366f1" : "#d1d5db";
                                if (submitted) {
                                    if (isCorrect) { bg = "#dcfce7"; border = "#22c55e"; }
                                    else if (selected && !isCorrect) { bg = "#fee2e2"; border = "#ef4444"; }
                                }
                                return (
                                    <label key={opt.id} style={{
                                        display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px",
                                        marginBottom: 6, borderRadius: 6, background: bg, border: `1.5px solid ${border}`,
                                        cursor: submitted ? "default" : "pointer", fontSize: 13,
                                    }}>
                                        <input type="radio" name={`q${q.id}`} value={opt.id}
                                            checked={selected} disabled={submitted}
                                            onChange={() => setAnswer(q.id, opt.id)}
                                            style={{ marginTop: 2, accentColor: "#1a3a6b" }} />
                                        <span><strong>{opt.id})</strong> {opt.text}</span>
                                    </label>
                                );
                            })}

                            {q.type === "truefalse" && q.statements.map(s => {
                                const val = answers[`${q.id}_${s.id}`];
                                return (
                                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
                                        <button onClick={() => !submitted && setAnswer(`${q.id}_${s.id}`, true)}
                                            style={tfBtn(val === true, submitted && s.correct ? "#22c55e" : "#6366f1", submitted)}>V</button>
                                        <button onClick={() => !submitted && setAnswer(`${q.id}_${s.id}`, false)}
                                            style={tfBtn(val === false, submitted && !s.correct ? "#22c55e" : "#ef4444", submitted)}>F</button>
                                        <span style={{ flex: 1 }}>{s.text}</span>
                                        {submitted && <span style={{ fontSize: 11, color: answers[`${q.id}_${s.id}`] === s.correct ? "#15803d" : "#dc2626" }}>
                                            {answers[`${q.id}_${s.id}`] === s.correct ? "✓" : "✗ Resp: " + (s.correct ? "V" : "F")}
                                        </span>}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {!submitted ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 13, color: "#666" }}>{answeredCount} / {exam.questions.length} preguntas contestadas</span>
                        <button onClick={onSubmit} disabled={answeredCount < exam.questions.length || !candidate}
                            style={{
                                background: answeredCount === exam.questions.length && candidate ? "#1a3a6b" : "#ccc",
                                color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8,
                                fontWeight: 700, fontSize: 14, cursor: answeredCount === exam.questions.length && candidate ? "pointer" : "not-allowed",
                            }}>
                            Enviar examen →
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", paddingTop: 8 }}>
                        <div style={{
                            display: "inline-block", padding: "12px 28px", borderRadius: 10, marginBottom: 12,
                            background: result.scaled >= exam.passingScore ? "#dcfce7" : "#fee2e2",
                            border: `2px solid ${result.scaled >= exam.passingScore ? "#22c55e" : "#ef4444"}`,
                        }}>
                            <span style={{ fontSize: 22, fontWeight: 900, color: result.scaled >= exam.passingScore ? "#15803d" : "#dc2626" }}>
                                {result.scaled} / 10
                            </span>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555" }}>
                                {result.scaled >= exam.passingScore ? "✓ APROBADO" : "✗ NO APROBADO"}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button onClick={onReset} style={{ background: "#f1f5f9", color: "#1a3a6b", border: "1.5px solid #1a3a6b", padding: "8px 20px", borderRadius: 7, fontWeight: 700, cursor: "pointer" }}>
                                Nuevo intento
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function tfBtn(active, activeColor, disabled) {
    return {
        width: 32, height: 32, borderRadius: 6, fontWeight: 800, fontSize: 13,
        background: active ? activeColor : "#e5e7eb", color: active ? "#fff" : "#555",
        border: "none", cursor: disabled ? "default" : "pointer", flexShrink: 0,
    };
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1.5px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" };

// ── EDITOR VIEW ───────────────────────────────────────────────────────────────
function EditorView({ exam, setExam }) {
    const updateMeta = (field, val) => setExam(e => ({ ...e, [field]: val }));
    const updateQuestion = (qi, field, val) => setExam(e => {
        const qs = [...e.questions]; qs[qi] = { ...qs[qi], [field]: val }; return { ...e, questions: qs };
    });
    const updateOption = (qi, oi, field, val) => setExam(e => {
        const qs = [...e.questions];
        const opts = [...qs[qi].options]; opts[oi] = { ...opts[oi], [field]: val };
        qs[qi] = { ...qs[qi], options: opts }; return { ...e, questions: qs };
    });
    const updateStatement = (qi, si, field, val) => setExam(e => {
        const qs = [...e.questions];
        const stmts = [...qs[qi].statements]; stmts[si] = { ...stmts[si], [field]: val };
        qs[qi] = { ...qs[qi], statements: stmts }; return { ...e, questions: qs };
    });

    return (
        <div style={{ background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 2px 12px #0001" }}>
            <h2 style={{ marginTop: 0, color: "#1a3a6b", fontSize: 18 }}>✏️ Editor de Examen</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                {[["ID del documento", "id"], ["Revisión", "rev"], ["Título del examen", "title"]].map(([label, field]) => (
                    <div key={field} style={{ flex: field === "title" ? 3 : 1, minWidth: 120 }}>
                        <label style={labelStyle}>{label}</label>
                        <input value={exam[field]} onChange={e => updateMeta(field, e.target.value)} style={inputStyle} />
                    </div>
                ))}
                <div style={{ width: 140 }}>
                    <label style={labelStyle}>Puntaje mínimo (/ 10)</label>
                    <input type="number" min={1} max={10} value={exam.passingScore}
                        onChange={e => updateMeta("passingScore", +e.target.value)} style={inputStyle} />
                </div>
            </div>

            {exam.questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 18, padding: 14, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fafafa" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 800, color: "#1a3a6b", minWidth: 22, paddingTop: 8 }}>{qi + 1}.</span>
                        <textarea value={q.text} onChange={e => updateQuestion(qi, "text", e.target.value)}
                            style={{ ...inputStyle, flex: 1, resize: "vertical", minHeight: 50 }} />
                        <div style={{ minWidth: 80 }}>
                            <label style={labelStyle}>Puntos</label>
                            <input type="number" step="0.01" value={q.points}
                                onChange={e => updateQuestion(qi, "points", +e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    {q.type === "single" && (
                        <div style={{ paddingLeft: 32 }}>
                            <div style={{ marginBottom: 6 }}>
                                <label style={labelStyle}>Respuesta correcta</label>
                                <select value={q.correct} onChange={e => updateQuestion(qi, "correct", e.target.value)} style={{ ...inputStyle, width: 80 }}>
                                    {q.options.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                </select>
                            </div>
                            {q.options.map((opt, oi) => (
                                <div key={opt.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: "#666", width: 20 }}>{opt.id})</span>
                                    <input value={opt.text} onChange={e => updateOption(qi, oi, "text", e.target.value)} style={inputStyle} />
                                </div>
                            ))}
                        </div>
                    )}

                    {q.type === "truefalse" && (
                        <div style={{ paddingLeft: 32 }}>
                            {q.statements.map((s, si) => (
                                <div key={s.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                                    <input value={s.text} onChange={e => updateStatement(qi, si, "text", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                                        <input type="checkbox" checked={s.correct} onChange={e => updateStatement(qi, si, "correct", e.target.checked)} />
                                        Es verdadero
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <p style={{ fontSize: 12, color: "#888", marginTop: 0 }}>💡 Los cambios se aplican en tiempo real al examen y al formato de impresión.</p>
        </div>
    );
}

// ── PRINT VIEW ────────────────────────────────────────────────────────────────
function PrintView({ exam, candidate, department, result, answers }) {
    const handlePrint = () => window.print();

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 10 }} className="no-print">
                <button onClick={handlePrint} style={{
                    background: "#1a3a6b", color: "#fff", border: "none", padding: "10px 24px",
                    borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14,
                }}>🖨️ Imprimir / Guardar PDF</button>
            </div>

            <div id="print-area" style={{ background: "#fff", borderRadius: 10, padding: 28, boxShadow: "0 2px 12px #0001" }}>
                <Header exam={exam} candidate={candidate || "N.N."} department={department || "—"}
                    score={result ? result.scaled : null} mode="print" />

                <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 13 }}>Contesta las siguientes preguntas:</p>

                {exam.questions.map((q, qi) => {
                    const breakdown = result?.breakdown.find(b => b.id === q.id);
                    return (
                        <div key={q.id} style={{ marginBottom: 16 }}>
                            <p style={{ fontWeight: 700, margin: "0 0 6px", fontSize: 13 }}>
                                {qi + 1}. {q.text}
                                <span style={{ fontWeight: 400, color: "#888", fontSize: 11, marginLeft: 6 }}>({q.points} puntos)</span>
                                {result && <span style={{ marginLeft: 8, color: breakdown?.correct ? "#15803d" : "#dc2626", fontSize: 11, fontWeight: 700 }}>
                                    [{breakdown?.points}/{q.points}]
                                </span>}
                            </p>

                            {q.type === "single" && q.options.map(opt => {
                                const selected = answers[q.id] === opt.id;
                                const isCorrect = result && opt.id === q.correct;
                                return (
                                    <div key={opt.id} style={{
                                        display: "flex", alignItems: "flex-start", gap: 8,
                                        padding: "3px 0", fontSize: 13,
                                        color: result ? (isCorrect ? "#15803d" : selected && !isCorrect ? "#dc2626" : "#555") : "#333",
                                        fontWeight: result && (isCorrect || (selected && !isCorrect)) ? 700 : 400,
                                    }}>
                                        <span style={{
                                            width: 16, height: 16, border: "1.5px solid #999", borderRadius: "50%",
                                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 9, flexShrink: 0, marginTop: 1,
                                            background: selected ? "#1a3a6b" : "transparent", color: selected ? "#fff" : "transparent",
                                        }}>●</span>
                                        <span><strong>{opt.id})</strong> {opt.text}</span>
                                    </div>
                                );
                            })}

                            {q.type === "truefalse" && q.statements.map(s => {
                                const val = answers[`${q.id}_${s.id}`];
                                return (
                                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 13 }}>
                                        <span style={{
                                            width: 22, height: 22, border: "1.5px solid #bbb", borderRadius: 4, display: "inline-flex",
                                            alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                                            background: val === true ? "#1a3a6b" : "transparent", color: val === true ? "#fff" : "#bbb",
                                        }}>V</span>
                                        <span style={{
                                            width: 22, height: 22, border: "1.5px solid #bbb", borderRadius: 4, display: "inline-flex",
                                            alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                                            background: val === false ? "#dc2626" : "transparent", color: val === false ? "#fff" : "#bbb",
                                        }}>F</span>
                                        <span style={{ flex: 1 }}>{s.text}</span>
                                        {result && <span style={{ fontSize: 11, color: val === s.correct ? "#15803d" : "#dc2626", fontWeight: 700 }}>
                                            {val === s.correct ? "✓" : `✗ (${s.correct ? "V" : "F"})`}
                                        </span>}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {result && (
                    <div style={{ marginTop: 20, padding: 14, borderRadius: 8, border: "2px solid #1a3a6b", background: "#f0f4ff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a3a6b" }}>Resultado Final</div>
                                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                                    Correctas: {result.breakdown.filter(b => b.correct).length} / {exam.questions.length} preguntas
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: result.scaled >= exam.passingScore ? "#15803d" : "#dc2626" }}>
                                    {result.scaled} / 10
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: result.scaled >= exam.passingScore ? "#15803d" : "#dc2626" }}>
                                    {result.scaled >= exam.passingScore ? "✓ APROBADO" : "✗ NO APROBADO"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa" }}>
                    <span>{exam.id}</span>
                    <span>{exam.rev}</span>
                </div>
            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #print-area { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
        </div>
    );
}