import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import { CharCounter } from './Shared';

const TEXTAREA_MAX_CHARS = 400;

function buildRadarSupervisorTemplate() {
    return {
        heading: 'Dinámica: El Radar del Supervisor',
        modality: 'Diagnóstico grupal',
        duration: '20 min',
        participants: { min: 3, max: 20 },
        instructions: 'Pide a cada participante elegir mentalmente a tres personas de su equipo directo (alguien con quien trabajan muy bien, alguien promedio y alguien con areas de oportunidad). Entrega la hoja de trabajo por niveles y da 5 minutos para completarla sin revisar telefonos ni expedientes.',
        scenario: 'La hoja se divide en tres niveles de profundidad para evidenciar cuanto conoce el supervisor a su equipo.',
        materials: [
            { id: makeId(), text: 'Hojas de trabajo impresas', note: '' },
            { id: makeId(), text: 'Boligrafos', note: '' },
            { id: makeId(), text: 'Temporizador de 5 minutos', note: '' },
        ],
        steps: [
            { id: makeId(), text: 'Seleccionar mentalmente 3 colaboradores del equipo directo', note: '1 alto desempeno, 1 promedio, 1 con areas de oportunidad' },
            { id: makeId(), text: 'Completar Nivel 1: nombre completo, puesto exacto, antiguedad', note: 'Nivel superficial' },
            { id: makeId(), text: 'Completar Nivel 2: estado civil, numero de hijos, tiempo de traslado, pasatiempos', note: 'Nivel personal medio' },
            { id: makeId(), text: 'Completar Nivel 3: mayor motivacion, principal frustracion en piso, meta a 5 anos', note: 'Nivel profundo' },
            { id: makeId(), text: 'Comparar resultados por nivel y detectar vacios de informacion', note: '' },
        ],
        commitmentPrompt: 'Compromiso de accion: define una accion unica y medible para la siguiente semana.',
        commitmentPlaceholder: 'Ej. Tomarme un cafe de 5 minutos cada martes con un operador diferente para escucharlo.',
        debriefQuestions: [
            { id: makeId(), text: '¿Que nivel fue mas facil y cual mas dificil de completar?', note: '' },
            { id: makeId(), text: '¿Que informacion clave desconocemos de nuestra gente hoy?', note: '' },
            { id: makeId(), text: '¿Como podemos motivar o exigir compromiso si no sabemos que los impulsa o frustra?', note: 'Pregunta gatillo principal' },
        ],
    };
}

function buildIcebergLineaTemplate() {
    return {
        heading: 'Dinamica: El Iceberg en la Linea',
        modality: 'Reflexion guiada',
        duration: '20 min',
        participants: { min: 4, max: 25 },
        instructions: 'Explica la teoria del iceberg (10% visible y 90% oculto). Pide dibujar un iceberg y completar primero la punta con conductas/metricas que exigen diario; luego llenar la parte sumergida con factores personales reales que hoy impactan al equipo.',
        scenario: 'Conectar resultados operativos y de calidad con factores humanos no visibles en piso.',
        materials: [
            { id: makeId(), text: 'Pizarron o rotafolio', note: '' },
            { id: makeId(), text: 'Hojas para cada participante', note: '' },
            { id: makeId(), text: 'Marcadores', note: '' },
        ],
        steps: [
            { id: makeId(), text: 'Explicar teoria del iceberg (10% visible, 90% oculto)', note: '' },
            { id: makeId(), text: 'Dibujar iceberg individual', note: '2-3 min' },
            { id: makeId(), text: 'Llenar punta visible: puntualidad, cero defectos, EPP, cuotas', note: 'Conducta observable' },
            { id: makeId(), text: 'Llenar parte sumergida: emociones, problemas y creencias que afectan rendimiento', note: 'Ej. transporte, deudas, familiar enfermo, metas personales' },
            { id: makeId(), text: 'Compartir hallazgos en plenaria', note: '' },
        ],
        commitmentPrompt: 'Compromiso de accion: que haras esta semana para conocer mejor la parte sumergida del iceberg de tu equipo.',
        commitmentPlaceholder: 'Ej. Tener una conversacion de 10 minutos con 2 operadores para entender sus motivadores.',
        debriefQuestions: [
            { id: makeId(), text: '¿Que tan llena quedo la parte sumergida del iceberg?', note: '' },
            { id: makeId(), text: '¿Estamos gestionando personas o solo resultados?', note: '' },
            { id: makeId(), text: '¿Que accion concreta podemos tomar para conocer mejor la parte sumergida del equipo?', note: '' },
        ],
    };
}

function buildDetrasGafeteTemplate() {
    return {
        heading: 'Dinamica: Detras del Gafete',
        modality: 'Plenaria de empatia',
        duration: '25 min',
        participants: { min: 5, max: 30 },
        instructions: 'Presenta una lista mezclada de talentos y datos curiosos del personal operativo. Lee cada dato en voz alta y pide al grupo adivinar a quien pertenece. Solo quien envio el dato confirma la respuesta.',
        scenario: 'Romper sesgos y mostrar que cada persona tiene una historia y capacidades fuera del rol operativo.',
        materials: [
            { id: makeId(), text: 'Post-its o tarjetas', note: '' },
            { id: makeId(), text: 'Pizarron o proyeccion de lista', note: '' },
            { id: makeId(), text: 'Lista previa de datos curiosos con nombre real', note: 'Preparacion antes del curso' },
        ],
        steps: [
            { id: makeId(), text: 'Recolectar previamente 2 datos curiosos por supervisor', note: 'Previo a la sesion' },
            { id: makeId(), text: 'Crear lista general con datos mezclados', note: '' },
            { id: makeId(), text: 'Leer cada dato y abrir ronda de adivinanza', note: 'Plenaria' },
            { id: makeId(), text: 'Confirmar respuestas y compartir contexto breve de cada caso', note: '' },
            { id: makeId(), text: 'Cerrar con compromiso individual medible para la semana', note: 'Accion concreta de escucha' },
        ],
        commitmentPrompt: 'Compromiso de accion: escribe un compromiso unico y medible para interesarte genuinamente en la vida de tu gente.',
        commitmentPlaceholder: 'Ej. Conversar 5 minutos cada miercoles con un colaborador distinto para conocer algo de su vida fuera del trabajo.',
        debriefQuestions: [
            { id: makeId(), text: '¿Que sesgo personal se rompio hoy al conocer estos datos?', note: '' },
            { id: makeId(), text: '¿Como cambia tu forma de liderar al conocer mejor a tu gente?', note: '' },
            { id: makeId(), text: '¿Que compromiso unico y medible aplicaras esta semana para escuchar mejor a tu equipo?', note: '' },
        ],
    };
}

const DYNAMIC_TEMPLATE_OPTIONS = [
    { id: 'radar_supervisor', label: 'Aplicar plantilla: El Radar del Supervisor', build: buildRadarSupervisorTemplate },
    { id: 'iceberg_linea', label: 'Aplicar plantilla: El Iceberg en la Linea', build: buildIcebergLineaTemplate },
    { id: 'detras_gafete', label: 'Aplicar plantilla: Detras del Gafete', build: buildDetrasGafeteTemplate },
];

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

function RepeatableListEditor({ title, items, onChange, styles, textPlaceholder, notePlaceholder }) {
    const safeItems = Array.isArray(items) ? items : [];

    const updateItem = (idx, patch) => {
        const next = safeItems.map((item, i) => (i === idx ? { ...item, ...patch } : item));
        onChange(next);
    };

    const addItem = () => {
        onChange([...safeItems, { id: makeId(), text: '', note: '' }]);
    };

    const removeItem = (idx) => {
        onChange(safeItems.filter((_, i) => i !== idx));
    };

    return (
        <div className={styles.formGroup}>
            <label className={styles.label}>{title} ({safeItems.length}/8)</label>
            <div className={styles.itemsList}>
                {safeItems.map((item, idx) => (
                    <div key={item.id || idx} className={styles.itemRow}>
                        <input
                            className={styles.input}
                            value={item.text || ''}
                            onChange={e => updateItem(idx, { text: e.target.value })}
                            placeholder={textPlaceholder}
                            maxLength={160}
                        />
                        <input
                            className={styles.input}
                            value={item.note || ''}
                            onChange={e => updateItem(idx, { note: e.target.value })}
                            placeholder={notePlaceholder}
                            maxLength={120}
                        />
                        <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(idx)}
                            title="Eliminar"
                            type="button"
                        >
                            <IconTrash2 size={14} />
                        </button>
                    </div>
                ))}
                {safeItems.length < 8 && (
                    <button className={styles.addItemBtn} onClick={addItem} type="button">
                        <IconPlus size={14} /> Agregar
                    </button>
                )}
            </div>
        </div>
    );
}

export default function DynamicSlideEditor({ formData, handleChange, setFormData, styles }) {
    const participants = formData.participants || { min: '', max: '' };

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Plantillas recomendadas</label>
                <div className={styles.itemsList}>
                    {DYNAMIC_TEMPLATE_OPTIONS.map((tpl) => (
                        <button
                            key={tpl.id}
                            type="button"
                            className={styles.addItemBtn}
                            onClick={() => setFormData(tpl.build())}
                        >
                            {tpl.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Título de la Dinámica</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. El Iceberg en la Linea"
                    maxLength={100}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Instrucciones
                    <CharCounter current={formData.instructions?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Describe como conducir la actividad, tiempos y reglas clave..."
                    value={formData.instructions || ''}
                    onChange={e => handleChange('instructions', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <div className={styles.itemRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label className={styles.label}>Modalidad</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. Reflexion guiada, Roleplay, Debate"
                            value={formData.modality || formData.type || ''}
                            onChange={e => handleChange('modality', e.target.value)}
                            maxLength={60}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label className={styles.label}>Duración</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. 15 min"
                            value={formData.duration || ''}
                            onChange={e => handleChange('duration', e.target.value)}
                            maxLength={30}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.formGroup}>
                <div className={styles.itemRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label className={styles.label}>Participantes minimos</label>
                        <input
                            type="number"
                            min={1}
                            max={99}
                            className={styles.input}
                            value={participants.min ?? ''}
                            onChange={e => handleChange('participants', { ...participants, min: Number(e.target.value || 0) })}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label className={styles.label}>Participantes maximos</label>
                        <input
                            type="number"
                            min={1}
                            max={99}
                            className={styles.input}
                            value={participants.max ?? ''}
                            onChange={e => handleChange('participants', { ...participants, max: Number(e.target.value || 0) })}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Contexto de la actividad (opcional)
                    <CharCounter current={formData.scenario?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Describe la situacion real que enmarca la dinamica..."
                    value={formData.scenario || ''}
                    onChange={e => handleChange('scenario', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>

            <RepeatableListEditor
                title="Materiales"
                items={formData.materials}
                onChange={(next) => handleChange('materials', next)}
                styles={styles}
                textPlaceholder="Material o recurso requerido"
                notePlaceholder="Uso o detalle"
            />

            <RepeatableListEditor
                title="Pasos de la dinámica"
                items={formData.steps}
                onChange={(next) => handleChange('steps', next)}
                styles={styles}
                textPlaceholder="Accion a ejecutar"
                notePlaceholder="Tiempo o criterio"
            />

            <RepeatableListEditor
                title="Preguntas de cierre"
                items={formData.debriefQuestions}
                onChange={(next) => handleChange('debriefQuestions', next)}
                styles={styles}
                textPlaceholder="Pregunta para reflexion grupal"
                notePlaceholder="Objetivo de la pregunta"
            />

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Mensaje de cierre para el compromiso
                    <CharCounter current={formData.commitmentPrompt?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Escribe el mensaje final que guiará el compromiso del participante..."
                    value={formData.commitmentPrompt || ''}
                    onChange={e => handleChange('commitmentPrompt', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Ejemplo sugerido (opcional)</label>
                <input
                    className={styles.input}
                    value={formData.commitmentPlaceholder || ''}
                    onChange={e => handleChange('commitmentPlaceholder', e.target.value)}
                    placeholder="Ej. Hablar 5 minutos con un operador diferente cada semana"
                    maxLength={160}
                />
                <span className={styles.labelHint}>Este texto aparece como guía al momento de escribir el compromiso.</span>
            </div>
        </>
    );
}
