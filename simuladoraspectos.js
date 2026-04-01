import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Factory, Droplets, Wind, Trash2, Zap, ArrowRight, RefreshCw } from 'lucide-react';

export default function App() {
    const [score, setScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
    const [completed, setCompleted] = useState(false);

    // Base de datos de escenarios de una planta de inyección
    const scenarios = [
        {
            id: 1,
            activity: "Purgado de inyectora (Material degradado)",
            aspect: "Generación de residuos sólidos no peligrosos (Plástico de purga)",
            impact: "Contaminación del suelo / Agotamiento de recursos",
            icon: <Trash2 className="w-8 h-8 text-orange-500" />
        },
        {
            id: 2,
            activity: "Operación de bombas hidráulicas de la inyectora",
            aspect: "Consumo de energía eléctrica",
            impact: "Agotamiento de recursos naturales / Emisiones indirectas de GEI",
            icon: <Zap className="w-8 h-8 text-yellow-500" />
        },
        {
            id: 3,
            activity: "Mantenimiento preventivo (Cambio de aceite hidráulico)",
            aspect: "Generación de residuos peligrosos (Aceite gastado y estopas)",
            impact: "Contaminación de suelo y cuerpos de agua subterránea",
            icon: <Droplets className="w-8 h-8 text-blue-600" />
        },
        {
            id: 4,
            activity: "Procesamiento de resinas con aditivos (Ej. PVC, POM)",
            aspect: "Emisión de gases de combustión / vapores tóxicos",
            impact: "Contaminación del aire / Efecto en salud respiratoria",
            icon: <Wind className="w-8 h-8 text-gray-500" />
        }
    ];

    // Estado del juego
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [shuffledAspects, setShuffledAspects] = useState([]);
    const [shuffledImpacts, setShuffledImpacts] = useState([]);

    // Selecciones del usuario
    const [selectedAspect, setSelectedAspect] = useState(null);
    const [selectedImpact, setSelectedImpact] = useState(null);

    // Inicializar el nivel
    useEffect(() => {
        if (currentScenarioIndex < scenarios.length) {
            const allAspects = scenarios.map(s => s.aspect);
            const allImpacts = scenarios.map(s => s.impact);

            // Mezclar opciones para que no siempre estén en el mismo orden
            setShuffledAspects([...allAspects].sort(() => Math.random() - 0.5));
            setShuffledImpacts([...allImpacts].sort(() => Math.random() - 0.5));

            setSelectedAspect(null);
            setSelectedImpact(null);
            setShowFeedback(false);
        } else {
            setCompleted(true);
        }
    }, [currentScenarioIndex]);

    const handleVerify = () => {
        if (!selectedAspect || !selectedImpact) {
            setFeedbackMsg({ text: 'Por favor, selecciona un Aspecto y un Impacto.', type: 'warning' });
            setShowFeedback(true);
            return;
        }

        const currentScenario = scenarios[currentScenarioIndex];
        const isAspectCorrect = selectedAspect === currentScenario.aspect;
        const isImpactCorrect = selectedImpact === currentScenario.impact;

        if (isAspectCorrect && isImpactCorrect) {
            setScore(prev => prev + 100);
            setFeedbackMsg({ text: '¡Excelente! Has identificado correctamente la causa y el efecto.', type: 'success' });
            setShowFeedback(true);

            setTimeout(() => {
                setCurrentScenarioIndex(prev => prev + 1);
            }, 2000);
        } else {
            let msg = 'Incorrecto. ';
            if (!isAspectCorrect) msg += 'El Aspecto Ambiental (la causa) no es correcto. ';
            if (!isImpactCorrect) msg += 'El Impacto Ambiental (la consecuencia) no es correcto.';

            setScore(prev => Math.max(0, prev - 20)); // Penalización ligera
            setFeedbackMsg({ text: msg, type: 'error' });
            setShowFeedback(true);
        }
    };

    const restartSim = () => {
        setScore(0);
        setCurrentScenarioIndex(0);
        setCompleted(false);
    };

    if (completed) {
        return (
            <div className="min-h-[600px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Simulación Completada!</h2>
                    <p className="text-gray-600 mb-6">Has demostrado tu capacidad para identificar Aspectos e Impactos Ambientales en el área de moldeo.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-blue-800 font-semibold">Puntuación Final: {score} pts</p>
                    </div>
                    <button
                        onClick={restartSim}
                        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" /> Reintentar Simulación
                    </button>
                </div>
            </div>
        );
    }

    const currentScenario = scenarios[currentScenarioIndex];

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden font-sans">

            {/* Header */}
            <div className="bg-green-700 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Factory className="w-6 h-6" />
                    <h1 className="text-xl font-bold">Simulador: Matriz Causa-Efecto Ambiental</h1>
                </div>
                <div className="flex gap-4 text-sm font-medium bg-green-800 px-4 py-2 rounded-full">
                    <span>Escenario: {currentScenarioIndex + 1}/{scenarios.length}</span>
                    <span>Puntos: {score}</span>
                </div>
            </div>

            <div className="p-6 bg-gray-50">
                <p className="text-center text-gray-600 mb-6 text-sm max-w-3xl mx-auto">
                    Instrucciones: Analiza la <strong className="text-gray-800">Actividad</strong> de la planta. Luego, selecciona de la lista el <strong className="text-blue-600">Aspecto Ambiental</strong> (cómo interactúa con el medio ambiente) y el <strong className="text-red-600">Impacto Ambiental</strong> (el daño que causa).
                </p>

                {/* Zona Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Columna 1: La Actividad */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col">
                        <div className="bg-gray-100 text-gray-700 text-xs font-bold uppercase px-3 py-1 rounded-full w-fit mb-4">
                            Paso 1: La Actividad
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            {currentScenario.icon}
                            <h3 className="mt-4 text-lg font-bold text-gray-800">{currentScenario.activity}</h3>
                            <p className="mt-2 text-xs text-gray-500">Lo que hacemos en planta.</p>
                        </div>
                    </div>

                    {/* Flecha conectora (visible en desktop) */}
                    <div className="hidden lg:flex items-center justify-center -mx-4 z-10">
                        <ArrowRight className="w-10 h-10 text-gray-300" />
                    </div>

                    {/* Columna 2: Aspecto */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-200 flex flex-col">
                        <div className="bg-blue-100 text-blue-800 text-xs font-bold uppercase px-3 py-1 rounded-full w-fit mb-4">
                            Paso 2: Aspecto Ambiental (Causa)
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            {shuffledAspects.map((aspect, idx) => (
                                <button
                                    key={`aspect-${idx}`}
                                    onClick={() => setSelectedAspect(aspect)}
                                    className={`text-left p-3 text-sm rounded-md transition-all border ${selectedAspect === aspect
                                            ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {aspect}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Flecha conectora (visible en desktop) */}
                    <div className="hidden lg:flex items-center justify-center -mx-4 z-10">
                        <ArrowRight className="w-10 h-10 text-gray-300" />
                    </div>

                    {/* Columna 3: Impacto */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-red-200 flex flex-col">
                        <div className="bg-red-100 text-red-800 text-xs font-bold uppercase px-3 py-1 rounded-full w-fit mb-4">
                            Paso 3: Impacto Ambiental (Efecto)
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            {shuffledImpacts.map((impact, idx) => (
                                <button
                                    key={`impact-${idx}`}
                                    onClick={() => setSelectedImpact(impact)}
                                    className={`text-left p-3 text-sm rounded-md transition-all border ${selectedImpact === impact
                                            ? 'bg-red-50 border-red-500 shadow-sm ring-1 ring-red-500'
                                            : 'bg-white border-gray-200 hover:border-red-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {impact}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Feedback Section */}
                {showFeedback && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${feedbackMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                            feedbackMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                'bg-yellow-50 border-yellow-200 text-yellow-800'
                        }`}>
                        {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                        <p className="text-sm font-medium">{feedbackMsg.text}</p>
                    </div>
                )}

                {/* Action Button */}
                <div className="flex justify-center border-t border-gray-200 pt-6">
                    <button
                        onClick={handleVerify}
                        className={`px-8 py-3 rounded-md font-bold text-white transition-all shadow-md ${(!selectedAspect || !selectedImpact)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        Verificar Conexión
                    </button>
                </div>

            </div>
        </div>
    );
}