/**
 * Animation variants compartidos para login pages.
 *
 * Filosofía: GPU-friendly (transform + opacity) en lugar de filter: blur,
 * que en iOS Safari y Android low-end es CPU-bound y produce stutter.
 * El blur se conserva muy ligero (2px) sólo en CARD_ENTER para preservar
 * la sensación de "premium" sin penalizar dispositivos móviles.
 */

/**
 * Cubic-bezier ease-out (easeOutQuart) usado por las animaciones JS de login.
 * Nota: NO es el mismo curve que el token CSS `--ease-out` en globals.css
 * (`cubic-bezier(0.16, 1, 0.3, 1)`, que es easeOutExpo). El de aquí es más
 * suave en el final del recorrido y ya estaba en el código original; se
 * mantiene para no alterar el feel visual de la entrada del login.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1];

/** Delay total entre LOGIN_SUCCESS y la navegación a /induccion (en ms).
 *  Coincide con el countdown bar visual: 1.1s delay + 3.9s duration ≈ 5s. */
export const SUCCESS_REDIRECT_DELAY_MS = 5000;

/** Fade-up — para elementos individuales con delay custom (stagger). */
export const FADE_UP_LOGIN = {
    hidden: { opacity: 0, y: 16 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            delay: 0.15 + i * 0.08,
            ease: EASE_OUT,
        },
    }),
};

/** Card entrance — escala + ligera atenuación. Único variant que conserva un
 *  blur muy sutil (2px) en desktop; en mobile se vuelve un upgrade barato. */
export const CARD_ENTER = {
    hidden: { opacity: 0, scale: 0.97, filter: 'blur(2px)' },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.45,
            ease: EASE_OUT,
            staggerChildren: 0.08,
            delayChildren: 0.15,
        },
    },
};

/** Error message — slide-down GPU-friendly (sin filter blur). */
export const ERROR_VARIANTS = {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: {
        opacity: 1,
        y: 0,
        height: 'auto',
        transition: { duration: 0.25, ease: EASE_OUT },
    },
    exit: {
        opacity: 0,
        y: -6,
        height: 0,
        transition: { duration: 0.18, ease: EASE_OUT },
    },
};
