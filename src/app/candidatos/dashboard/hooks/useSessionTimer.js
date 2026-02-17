import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar el temporizador de sesión del candidato.
 * Se auto-expira tras la duración configurada y ejecuta el callback de logout.
 *
 * @param {object} options
 * @param {boolean} options.enabled - Si el timer debe estar activo
 * @param {number} options.duration - Duración total en ms (default: 2h)
 * @param {Function} options.onExpire - Callback cuando expira
 * @returns {{ timeLeft: number }} Tiempo restante en ms
 */
export function useSessionTimer({ enabled = false, duration = 2 * 60 * 60 * 1000, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (!enabled) return;

        let intervalId;

        const startTimer = () => {
            let storedExpiry = sessionStorage.getItem('candidate_session_expiry');
            let expiryTime;

            if (storedExpiry) {
                expiryTime = parseInt(storedExpiry, 10);
            } else {
                expiryTime = Date.now() + duration;
                sessionStorage.setItem('candidate_session_expiry', expiryTime.toString());
            }

            const tick = () => {
                const remaining = expiryTime - Date.now();

                if (remaining <= 0) {
                    clearInterval(intervalId);
                    setTimeLeft(0);
                    onExpire?.();
                    return;
                }
                setTimeLeft(remaining);
            };

            tick();
            intervalId = setInterval(tick, 1000);
        };

        startTimer();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [enabled, duration, onExpire]);

    return { timeLeft };
}
