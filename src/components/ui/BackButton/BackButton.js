import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './BackButton.module.css';

/**
 * Componente reutilizable de botón "Volver".
 * - Si recibe `href`, renderiza un `<Link>`.
 * - Si recibe `onClick`, renderiza un `<button>`.
 *
 * @param {string}   [href]      - Ruta destino (usa Link internamente)
 * @param {function} [onClick]   - Callback alternativo (usa button internamente)
 * @param {string}   [label]     - Texto del botón (default: "Volver")
 * @param {string}   [className] - Clase CSS adicional
 */
export default function BackButton({ href, onClick, label = "Volver", className }) {
    const combinedClassName = className
        ? `${styles.backButton} ${className}`
        : styles.backButton;

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                <ArrowLeft size={18} />
                <span>{label}</span>
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={combinedClassName}>
            <ArrowLeft size={18} />
            <span>{label}</span>
        </button>
    );
}
