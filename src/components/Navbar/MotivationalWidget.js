'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './MotivationalWidget.module.css';

const QUOTES = [
    "La excelencia no es un acto, sino un hábito.",
    "Te amo con todo el corazón.",
    "El liderazgo es la capacidad de traducir la visión en realidad.",
    "Calidad es hacer lo correcto cuando nadie está mirando.",
    "Llegar juntos es el principio; mantenerse juntos es el progreso; trabajar juntos es el éxito.",
    "La seguridad es primero.",
    "Un gran líder inspira la grandeza en otros.",
    "La innovación distingue a los líderes de los seguidores.",
    "Hoy es un día perfecto para hacer historia.",
    "Tu equipo es tu mayor activo, cuídalo.",
    "La mejora continua es el camino a la perfección."
];

const MotivationalWidget = () => {
    const { user } = useAuth();
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // Seleccionar frase aleatoria al montar
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(randomQuote);

        // Opcional: Cambiar frase cada X minutos
        const interval = setInterval(() => {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }, 60000 * 5); // 5 min

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
                "{quote}"
            </div>
        </div>
    );
};

export default MotivationalWidget;
