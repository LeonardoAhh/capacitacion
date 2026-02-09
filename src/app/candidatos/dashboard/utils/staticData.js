/**
 * Static Data for Dashboard
 * Extracted from main component to avoid recreation on each render
 */

import { Smile, BookOpen, MapPin, Clock, UserCheck, User, FileText, Shield } from 'lucide-react';
import React from 'react';

// Roadmap steps for first day orientation
export const ROADMAP_STEPS = [
    {
        id: 1,
        title: 'Bienvenida RH',
        iconName: 'Smile',
        details: ['Prueba de Antidoping', 'Firma de contratos', 'Entrega de EPP']
    },
    {
        id: 2,
        title: 'Capacitación',
        iconName: 'BookOpen',
        details: ['Dudas', 'Información general']
    },
    {
        id: 3,
        title: 'Recorrido Planta',
        iconName: 'MapPin',
        details: ['Conoce las instalaciones y salidas de emergencia']
    },
    {
        id: 4,
        title: 'Horario de Comida',
        iconName: 'Clock',
        details: ['Consumo de alimentos']
    },
    {
        id: 5,
        title: 'Incorporación al área',
        iconName: 'UserCheck',
        details: ['Presentación con tu jefe inmediato y equipo']
    }
];

// Icon mapping for dynamic rendering
export const ICON_MAP = {
    Smile,
    BookOpen,
    MapPin,
    Clock,
    UserCheck,
    User,
    FileText,
    Shield
};

// Get icon component by name
export const getIcon = (iconName, size = 20) => {
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
};

// Data center information items
export const DATA_CENTER_ITEMS = [
    {
        id: 'dresscode',
        title: 'Código de Vestimenta',
        iconName: 'User',
        desc: 'Normas sobre el uso del uniforme y calzado de seguridad.',
        contentType: 'dresscode'
    },
    {
        id: 'rules',
        title: 'Reglamento Interior',
        iconName: 'FileText',
        desc: 'Políticas internas y normas de convivencia.',
        contentType: 'rules'
    }
];

// Content templates for data center items
export const DATA_CENTER_CONTENT = {
    dresscode: (
        <div style={{ textAlign: 'left' }}>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '4px' }}>Porta tu uniforme con orgullo, limpio y completo.</li>
                <li style={{ marginBottom: '4px' }}>Es obligatorio usar calzado industrial.</li>
                <li style={{ marginBottom: '4px' }}>Porta siempre tu gafete de manera visible.</li>
            </ul>
        </div>
    ),
    rules: (
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
};

// Get content for data center item
export const getDataCenterContent = (contentType) => {
    return DATA_CENTER_CONTENT[contentType] || null;
};
