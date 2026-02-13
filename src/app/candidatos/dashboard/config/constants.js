/**
 * Constants and Configuration for Candidate Dashboard
 */

import { Smile, BookOpen, MapPin, Clock, UserCheck, User, FileText, Calendar } from 'lucide-react';

// Roadmap Steps Configuration
export const ROADMAP_STEPS = [
    {
        id: 1,
        title: 'Bienvenida RH',
        icon: <Smile size={20} />,
        details: ['Prueba de Antidoping', 'Firma de contratos', 'Entrega de EPP']
    },
    {
        id: 2,
        title: 'Capacitación',
        icon: <BookOpen size={20} />,
        details: ['Dudas', 'Información general']
    },
    {
        id: 3,
        title: 'Recorrido Planta',
        icon: <MapPin size={20} />,
        details: ['Conoce las instalaciones y salidas de emergencia']
    },
    {
        id: 4,
        title: 'Horario de Comida',
        icon: <Clock size={20} />,
        details: ['Consumo de alimentos']
    },
    {
        id: 5,
        title: 'Incorporación al área',
        icon: <UserCheck size={20} />,
        details: ['Presentación con tu jefe inmediato y equipo']
    }
];

// Data Center Items Configuration
export const DATA_CENTER_ITEMS = [
    {
        id: 'dresscode',
        title: 'Código de Vestimenta',
        icon: <User size={24} />,
        desc: 'Normas sobre el uso del uniforme y calzado de seguridad.',
        content: (
            <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>DEBES PORTAR EL EQUIPO DE PROTECCIÓN PERSONAL</p>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                    <li style={{ marginBottom: '4px' }}>USO DE COFIA</li>
                    <li style={{ marginBottom: '4px' }}>USO DE PLAYERA / CHALECO</li>
                    <li style={{ marginBottom: '4px' }}>PANTALON DE MEZCLILLA (NO ROTOS NO RAZGADOS)</li>
                    <li style={{ marginBottom: '4px' }}>ZAPATOS/TENIS DE SEGURIDAD (CON CASQUILLO)</li>
                </ul>
            </div>
        )
    },
    {
        id: 'rules',
        title: 'Reglamento De Seguridad y Calidad',
        icon: <FileText size={24} />,
        desc: 'Políticas internas y normas de convivencia.',
        content: (
            <div style={{ textAlign: 'left' }}>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                    <li style={{ marginBottom: '4px' }}>PROHIBIDO EL USO DE JOYERÍA EN LAS ESTACIONES DE TRABAJO</li>
                    <li style={{ marginBottom: '4px' }}>NO INGERIR NINGÚN TIPO DE ALIMENTO O LÍQUIDO EN EL ÁREA DE TRABAJO</li>
                    <li style={{ marginBottom: '4px' }}>PROHIBIDO EL USO DE TODO EQUIPO ELECTRONICO EN LAS ÁREA OPERATIVAS</li>
                    <li style={{ marginBottom: '4px' }}>USO DE MAQUILLAJE</li>
                    <li style={{ marginBottom: '4px' }}>QUEDA PROHIBIDO HACER VENTAS O NEGOCIOS DENTRO DE LAS INSTALACIONES</li>
                    <li style={{ marginBottom: '4px' }}>QUEDA PROHIBIDO DORMIRSE DURANTE LA JORNADA LABORAL</li>
                </ul>
            </div>
        )
    },
];

// HR Contact Information
export const HR_CONTACT_INFO = [
    {
        id: 'mixed_shift',
        title: 'Turno Mixto',
        icon: <Calendar size={20} color="#007aff" />,
        schedule: [
            'Lunes a Viernes: 8:00 - 18:00',
            'Sábados: 8:00 - 11:00'
        ],
        phones: ['55 1406 3167', '55 1525 4782', '442 509 5534', '55 6326 5881']
    },
    {
        id: 'third_shift',
        title: 'Tercer Turno',
        icon: <Calendar size={20} color="#5856d6" />,
        schedule: [
            'Lunes a Viernes: 22:00 - 6:00'
        ],
        phones: []
    }
];

// Exam Configuration
export const EXAM_CONFIG = {
    PASSING_SCORE: 70,
    INDUCTION_COURSE_NAME: 'INDUCCIÓN A LA EMPRESA'
};

// Session Configuration,
export const SESSION_CONFIG = {
    TIMEOUT_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours
    ONE_MINUTE_MS: 60 * 1000,
    FIVE_MINUTES_MS: 5 * 60 * 1000,
    TIMER_COLORS: {
        DANGER: 'text-red-500 font-bold animate-pulse',
        WARNING: 'text-yellow-500 font-semibold',
        DEFAULT: 'text-gray-600 dark:text-gray-300'
    },
    SESSION_KEYS: {
        CANDIDATE_SESSION: 'candidate_session',
        SESSION_EXPIRY: 'candidate_session_expiry'
    },
    ROUTES: {
        HOME: '/',
        CANDIDATES_LOGIN: '/candidatos'
    }
};
