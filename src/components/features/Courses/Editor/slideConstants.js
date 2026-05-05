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
    env_sim:       'Simulador Ambiental',
    iceberg_sim:   'Simulador Iceberg',
    radar_sim:     'Simulador Radar',
    video:         'Video',
    flashcard:     'Tarjetas',
    fill_blank:    'Completa la Frase',
    checklist:     'Checklist',
    org_chart:     'Organigrama',
        // freeform:      'Lienzo Libre', // Desactivado temporal
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
    iceberg_sim: () => ({
        heading: 'Simulador: El Iceberg en la Linea',
        subtitle: 'Clasifica cada situacion segun corresponda a parte visible o parte sumergida.',
        cards: [
            { id: makeId(), text: 'El operador llego tarde tres veces esta semana.', kind: 'visible', hint: 'Indicador observable en piso.' },
            { id: makeId(), text: 'Tiene problemas de transporte y llega estresado al inicio del turno.', kind: 'submerged', hint: 'Factor humano no visible a simple vista.' },
            { id: makeId(), text: 'Incremento de rechazos en su celda de trabajo.', kind: 'visible', hint: 'Resultado operativo medible.' },
            { id: makeId(), text: 'Su principal motivacion es pagar los estudios de su hija.', kind: 'submerged', hint: 'Motivador personal profundo.' },
        ],
    }),
    radar_sim: () => ({
        heading: 'Simulador: El Radar del Supervisor',
        subtitle: 'Evalua que tanto conoces a tu equipo y detecta vacios de informacion.',
        items: [
            { id: makeId(), level: 1, prompt: 'Nombre completo del colaborador' },
            { id: makeId(), level: 1, prompt: 'Puesto exacto y antiguedad' },
            { id: makeId(), level: 1, prompt: 'Turno y area asignada actual' },
            { id: makeId(), level: 2, prompt: 'Tiempo aproximado de traslado a planta' },
            { id: makeId(), level: 2, prompt: 'Situacion familiar relevante' },
            { id: makeId(), level: 2, prompt: 'Pasatiempos o intereses personales' },
            { id: makeId(), level: 3, prompt: 'Principal motivacion personal' },
            { id: makeId(), level: 3, prompt: 'Mayor frustracion en piso de trabajo' },
            { id: makeId(), level: 3, prompt: 'Meta profesional o personal a 5 anos' },
        ],
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
    org_chart: () => ({
        heading: 'Organigrama',
        members: [
            { id: makeId(), position: 'Director General', name: '', photo: '', level: 0 },
            { id: makeId(), position: 'Gerente de Producción', name: '', photo: '', level: 1 },
            { id: makeId(), position: 'Gerente de Calidad', name: '', photo: '', level: 1 },
        ],
    }),
    freeform: () => ({
        background: '',
        elements: [
            { id: makeId(), kind: 'text', x: 10, y: 15, w: 80, h: 18, content: 'Título del Slide', fontSize: 40, fontWeight: 700, align: 'center', color: '' },
            { id: makeId(), kind: 'text', x: 10, y: 40, w: 80, h: 45, content: 'Agrega tu contenido aquí...', fontSize: 18, fontWeight: 400, align: 'left', color: '' },
        ],
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
// ── Convertidor: tipo existente → Lienzo Libre ────────────────────────────────
/**
 * Convierte los datos de cualquier slide tipado a la estructura de un slide freeform.
 * Los elementos resultantes usan coordenadas en % relativas al canvas 16:9.
 */
export function convertSlideToFreeform(slide) {
    const { type, data } = slide;
    const els = [];

    const txt = (id, x, y, w, h, content, fontSize, fontWeight, align = 'left') =>
        ({ id: id || makeId(), kind: 'text', x, y, w, h, content: content || '', fontSize, fontWeight, align, color: '' });

    const img = (src, x, y, w, h) =>
        ({ id: makeId(), kind: 'image', x, y, w, h, src: src || '', fit: 'contain', radius: 8 });

    switch (type) {
        case 'title': {
            if (data.title)    els.push(txt(null, 5, 28, 90, 20, data.title,    44, 700, 'center'));
            if (data.subtitle) els.push(txt(null, 10, 52, 80, 14, data.subtitle, 20, 400, 'center'));
            break;
        }
        case 'content': {
            if (data.heading) els.push(txt(null, 5, 4, 90, 13, data.heading, 30, 700, 'left'));
            const imgs = Array.isArray(data.images) && data.images.length > 0
                ? data.images : data.image ? [data.image] : [];
            const bodyW = imgs.length > 0 ? 50 : 90;
            if (data.body)    els.push(txt(null, 5, 19, bodyW, 73, data.body, 16, 400, 'left'));
            imgs.slice(0, 1).forEach(src => els.push(img(src, 57, 19, 38, 73)));
            break;
        }
        case 'objective':
        case 'definition': {
            if (data.heading) els.push(txt(null, 5, 5, 90, 15, data.heading, 30, 700, 'left'));
            if (data.body)    els.push(txt(null, 5, 23, 90, 67, data.body, 18, 400, 'left'));
            break;
        }
        case 'benefits': {
            if (data.heading) els.push(txt(null, 5, 4, 90, 13, data.heading, 28, 700, 'left'));
            const items = data.items || [];
            items.forEach((item, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                els.push(txt(null, 5 + col * 32, 20 + row * 22, 30, 18,
                    `• ${item.text || item}`, 14, 400, 'left'));
            });
            break;
        }
        case 'steps': {
            if (data.heading) els.push(txt(null, 5, 3, 90, 13, data.heading, 26, 700, 'left'));
            const steps = data.steps || [];
            const colW = steps.length > 0 ? Math.min(Math.floor(88 / steps.length), 28) : 28;
            steps.forEach((step, i) => {
                const x = 5 + i * (colW + 2);
                const content = `${i + 1}. ${step.title || ''}\n${step.desc || ''}`;
                els.push(txt(null, x, 18, colW, 74, content, 13, 400, 'left'));
                if (step.image) els.push(img(step.image, x, 18, colW, 30));
            });
            break;
        }
        case 'comparison': {
            if (data.heading) els.push(txt(null, 5, 3, 90, 13, data.heading, 28, 700, 'left'));
            if (data.left?.title)  els.push(txt(null, 5, 18, 43, 12, data.left.title,  20, 700, 'center'));
            if (data.right?.title) els.push(txt(null, 52, 18, 43, 12, data.right.title, 20, 700, 'center'));
            const leftItems  = data.left?.items  || [];
            const rightItems = data.right?.items || [];
            if (leftItems.length)  els.push(txt(null, 5,  32, 43, 60, leftItems.map(i  => `• ${i}`).join('\n'), 14, 400, 'left'));
            if (rightItems.length) els.push(txt(null, 52, 32, 43, 60, rightItems.map(i => `• ${i}`).join('\n'), 14, 400, 'left'));
            break;
        }
        case 'org_chart': {
            if (data.heading) els.push(txt(null, 5, 3, 90, 13, data.heading, 28, 700, 'center'));
            const members = data.members || [];
            const cols = Math.min(members.length, 4) || 1;
            const cellW = Math.floor(88 / cols);
            members.forEach((m, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const content = `${m.position || ''}\n${m.name || ''}`.trim();
                els.push(txt(null, 6 + col * (cellW + 1), 20 + row * 25, cellW - 1, 22, content, 13, 400, 'center'));
            });
            break;
        }
        case 'icon_grid': {
            if (data.heading) els.push(txt(null, 5, 4, 90, 13, data.heading, 28, 700, 'left'));
            const gridItems = data.items || [];
            const cols = Math.min(gridItems.length, 3) || 1;
            const cellW = Math.floor(88 / cols);
            gridItems.forEach((item, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const content = `${item.label || ''}\n${item.description || ''}`.trim();
                els.push(txt(null, 6 + col * (cellW + 1), 20 + row * 30, cellW - 1, 26, content, 14, 400, 'center'));
            });
            break;
        }
        default: {
            const heading = data.heading || data.title || data.question || '';
            const body    = data.body || data.instructions || data.description || '';
            if (heading) els.push(txt(null, 5, 5, 90, 15, heading, 28, 700, 'left'));
            if (body)    els.push(txt(null, 5, 23, 90, 67,
                typeof body === 'string' ? body : JSON.stringify(body, null, 2), 16, 400, 'left'));
        }
    }

    // Fallback: al menos un elemento vacío
    if (els.length === 0) {
        els.push(txt(null, 10, 30, 80, 40, data.title || data.heading || 'Contenido', 24, 400, 'center'));
    }

    return { background: '', elements: els };
}
