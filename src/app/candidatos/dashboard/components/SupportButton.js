'use client';

import { MessageCircle } from 'lucide-react'; // Using MessageCircle as generic chat icon, or we can use a custom SVG for WhatsApp
import styles from './SupportButton.module.css';

export default function SupportButton() {
    // Replace with actual support number
    const phoneNumber = '+524211265940'; // Example number, user should update this
    const message = 'Hola, necesito ayuda con la plataforma de inducción.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.floatingButton}
            aria-label="Contactar Soporte"
        >
            <MessageCircle className={styles.icon} />
        </a>
    );
}
