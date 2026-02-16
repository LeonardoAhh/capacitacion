'use client';

import { useState, useEffect } from 'react';

/**
 * Hook reutilizable para detectar si el viewport es móvil.
 * Usa matchMedia para escuchar cambios en tiempo real.
 * @param {number} breakpoint - Ancho máximo en px (default: 1024)
 * @returns {{ isMobile: boolean }}
 */
export default function useIsMobile(breakpoint = 1024) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);

        // Set initial value
        setIsMobile(mql.matches);

        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);

        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);

    return { isMobile };
}
