/**
 * Animation variants compartidos para todas las login pages.
 * Utiliza framer-motion con blur filter para transiciones premium.
 */

/** Fade-up con blur — para elementos individuales con delay custom */
export const FADE_UP_LOGIN = {
    hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.55,
            delay: 0.15 + i * 0.1,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
};

/** Card entrance — escala + blur */
export const CARD_ENTER = {
    hidden: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

/** Error message — slide-down con AnimatePresence */
export const ERROR_VARIANTS = {
    initial: { opacity: 0, y: -12, filter: 'blur(3px)', height: 0 },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        height: 'auto',
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0,
        y: -8,
        filter: 'blur(2px)',
        height: 0,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
};

/** Success state — fade in suave */
export const SUCCESS_ENTER = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};
