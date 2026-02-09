'use client';

import { Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from './SwitchButton.module.css';

export default function SwitchButton({
    className,
    showLabel = true,
    ...props
}) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            className={`${styles.button} ${className || ''}`}
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            {...props}
        >
            <div className={styles.iconWrapper}>
                <Sun className={styles.sunIcon} />

                {showLabel && (
                    <div className={styles.labelContainer}>
                        <span className={`${styles.labelText} ${styles.lightText}`}>
                            Light
                        </span>
                        <span className={`${styles.labelText} ${styles.darkText}`}>
                            Dark
                        </span>
                    </div>
                )}
            </div>

            <div className={styles.shine} aria-hidden="true" />
            <div className={styles.glare} aria-hidden="true" />
        </button>
    );
}
