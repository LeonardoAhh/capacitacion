"use client";

import { useEffect, useState, memo } from "react";

/**
 * Animación de contador numérico con easing cúbico.
 * Se usa en las tarjetas de estadísticas del dashboard.
 */
const CounterAnimation = memo(function CounterAnimation({ start = 0, end, duration = 2000 }) {
    const [count, setCount] = useState(start);

    useEffect(() => {
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        let currentFrame = 0;

        const counter = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const easedProgress = 1 - (1 - progress) ** 3;
            const current = start + (end - start) * easedProgress;

            setCount(Math.min(current, end));

            if (currentFrame === totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [start, end, duration]);

    return Math.round(count);
});

export default CounterAnimation;
