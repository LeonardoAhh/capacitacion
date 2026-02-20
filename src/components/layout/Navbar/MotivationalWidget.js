'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './MotivationalWidget.module.css';

const QUOTES = [
    "La excelencia no es un acto, sino un hábito.",
    "El liderazgo es la capacidad de traducir la visión en realidad.",
    "Calidad es hacer lo correcto cuando nadie está mirando.",
    "La seguridad es primero, tu familia te espera.",
    "Un gran líder inspira la grandeza en otros.",
    "La innovación distingue a los líderes de los seguidores.",
    "Hoy es un día perfecto para hacer historia.",
    "Tu equipo es tu mayor activo, cuídalo.",
    "La mejora continua es el camino a la perfección.",
    "El único modo de hacer un gran trabajo es amar lo que haces.",
    "No busques errores, busca soluciones.",
    "El éxito depende del esfuerzo.",
    "Cree que puedes y casi lo habrás logrado.",
    "La calidad empieza por uno mismo.",
    "Trabajar duro te llevará a la cima, disfrutar el camino te llevará más lejos.",
    "La actitud es una pequeña cosa que marca una gran diferencia.",
    "Si no te retas, no cambias.",
    "El talento gana partidos, pero el trabajo en equipo gana campeonatos.",
    "Seguridad, Calidad y Productividad: nuestro compromiso.",
    "Cada pieza cuenta, cada esfuerzo suma.",
    "Hazlo bien a la primera.",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "La prevención de accidentes es responsabilidad de todos.",
    "Un lugar ordenado es un lugar seguro."
];

const MotivationalWidget = () => {
    const { user } = useAuth();
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // Seleccionar frase aleatoria al montar
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(randomQuote);

        // Cambiar frase cada 15 segundos
        const interval = setInterval(() => {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    if (!user) return null;

    // Solo mostrar para admins y super_admins
    const canSee = ['admin', 'super_admin'].includes(user.rol);
    if (!canSee) return null;

    return (
        <div className={styles.widgetContainer}>
            <div className={styles.icon}>✨</div>
            <div className={styles.quoteText}>
                &quot;{quote}&quot;
            </div>
        </div>
    );
};

export default MotivationalWidget;
