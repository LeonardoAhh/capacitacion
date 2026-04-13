/**
 * slideConstants.js
 * Punto único de verdad para metadatos y datos por defecto de cada tipo de slide.
 * Importar desde aquí en page.js, SlideEditorPanel, SlideList, etc.
 */

// ── Etiquetas legibles por tipo ───────────────────────────────────────────────
export const SLIDE_TYPE_LABELS = {
    title:         'Portada',
    content:       'Contenido',
    objective:     'Objetivo',
    definition:    'Definición',
    benefits:      'Beneficios',
    icon_grid:     'Íconos',
    comparison:    'Comparación',
    steps:         'Paso a Paso',
    quiz:          'Quiz',
    group_quiz:    'Quiz',
    dynamic:       'Dinámica',
    group_dynamic: 'Dinámica',
    // Nuevos tipos
    thermal_sim:   'Simulador Térmico',
    env_sim:        'Simulador Ambiental',
    video:         'Video',
    flashcard:     'Tarjetas',
    fill_blank:    'Completa la Frase',
    checklist:     'Checklist',
};

// ── Helper para IDs estables en listas ───────────────────────────────────────
function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

/**
 * Fábricas de datos por defecto para cada tipo de slide.
 * Cada entrada es una función que devuelve un objeto fresco (evita referencias compartidas).
 * IDs estables incluidos en arrays de ítems para uso como React keys.
 */
const SLIDE_DEFAULT_DATA_FACTORIES = {
    title:      () => ({ title: 'Nuevo Slide', subtitle: '' }),
    content:    () => ({ heading: 'Nuevo Slide', body: '<p>Contenido inicial...</p>' }),
    objective:  () => ({ heading: 'Objetivo del Curso', body: '<p>Al finalizar, el usuario será capaz de...</p>' }),
    definition: () => ({ heading: 'Concepto Clave', body: '<p>Define el término o concepto aquí...</p>' }),
    benefits:   () => ({
        heading: 'Beneficios',
        items: [
            { id: makeId(), text: 'Beneficio 1' },
            { id: makeId(), text: 'Beneficio 2' },
        ],
    }),
    icon_grid:  () => ({
        heading: 'Puntos Clave',
        items: [
            { id: makeId(), icon: 'IconStar', label: 'Punto 1', description: '' },
        ],
    }),
    // Formato correcto: left/right con title e items[] (igual que ComparisonSlideEditor)
    comparison: () => ({
        heading: 'Comparativa',
        left:  { title: 'Antes',   items: ['Item A'] },
        right: { title: 'Después', items: ['Item B'] },
    }),
    steps:      () => ({
        heading: 'Cómo hacerlo',
        steps: [
            { id: makeId(), title: 'Paso 1', desc: 'Describe el primer paso aquí...', image: '' },
            { id: makeId(), title: 'Paso 2', desc: 'Describe el segundo paso aquí...', image: '' },
        ],
    }),
    quiz:       () => ({
        heading: 'Evaluación Final',
        questions: [
            { id: makeId(), q: 'Escribe tu pregunta aquí...', options: ['Opción 1', 'Opción 2', 'Opción 3'], correct: 0, explanation: '' },
        ],
        passingScore: 70,
    }),
    dynamic:    () => ({
        heading: 'Dinámica de Equipo',
        instructions: '',
        modality: 'Roleplay',
        duration: '15 min',
        participants: { min: 3, max: 6 },
        scenario: '',
        materials: [
            { id: makeId(), text: 'Tarjetas de apoyo', note: '' },
        ],
        steps: [
            { id: makeId(), text: 'Presentar el objetivo de la dinámica', note: '' },
            { id: makeId(), text: 'Ejecutar actividad en equipos', note: '' },
        ],
        commitmentPrompt: 'Define un compromiso unico y medible para la siguiente semana.',
        commitmentPlaceholder: 'Ej. Hablar 5 minutos con un operador diferente cada martes para escucharle.',
        debriefQuestions: [
            { id: makeId(), text: '¿Qué aprendimos y cómo lo aplicamos en planta?', note: '' },
        ],
    }),
    // Nuevos tipos
    thermal_sim: () => ({
        heading: 'Seguridad LOTO: Disipación Térmica',
        subtitle: 'Componente a temperatura segura para mantenimiento.',
        safeTemp: 50,
    }),
    env_sim: () => ({
        heading: 'Simulador: Matriz Causa-Efecto Ambiental',
        subtitle: 'Identifica el Aspecto e Impacto ambiental de cada actividad de planta.',
        scenarios: [], // vacío = usa los 4 escenarios por defecto del componente
    }),
    video:      () => ({
        heading: '',
        videoUrl: '',
        caption: '',
        autoplay: false,
    }),
    flashcard:  () => ({
        heading: 'Tarjetas de Vocabulario',
        cards: [
            { id: makeId(), front: 'Término 1', back: 'Definición del término 1' },
            { id: makeId(), front: 'Término 2', back: 'Definición del término 2' },
        ],
    }),
    fill_blank: () => ({
        sentence: 'Completa la siguiente frase: el proceso inicia con ___',
        answers: [],
        explanation: '',
    }),
    checklist:  () => ({
        heading: 'Lista de Verificación',
        items: [
            { id: makeId(), text: 'Primer requisito o tarea' },
            { id: makeId(), text: 'Segundo requisito o tarea' },
        ],
        requireAll: false,
    }),
};

/**
 * Devuelve una copia profunda fresca de los datos por defecto para el tipo dado.
 * @param {string} type - Tipo de slide (ej. 'quiz', 'content')
 * @returns {Object} datos por defecto listos para usar
 */
export function getDefaultSlideData(type) {
    const factory = SLIDE_DEFAULT_DATA_FACTORIES[type];
    return factory ? factory() : { heading: 'Nuevo Slide', body: '' };
}
