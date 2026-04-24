import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import { OfflineIndicator, UpdatePrompt } from '@/components/guards/pwa';
import MaintenanceGuard from '@/components/guards/MaintenanceGuard';
import '@/styles/globals.css';
import { Montserrat, Poppins } from 'next/font/google';

/* ─── Fuentes del sistema ─────────────────────────────────────────
   Stack tipográfico (self-hosted en build por next/font):
     Montserrat → display + editorial serif (headings, hero, score)
     Poppins    → UI body (párrafos, labels, botones)
     ui-monospace (system) → código / labels técnicos

   Variables expuestas (usar SIEMPRE, nunca hardcodear):
     - var(--font-display) → Montserrat (headings, buttons, UI)
     - var(--font-body)    → Poppins    (body, párrafos)
     - var(--font-serif)   → Montserrat (editorial display / score)
     - var(--font-mono)    → ui-monospace + fallbacks

   Para cambiar una fuente en toda la plataforma: editar solo este archivo.
   ────────────────────────────────────────────────────────────────── */

const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
    variable: '--font-montserrat',
});

const poppins = Poppins({
    subsets: ['latin'],
    display: 'swap',
    weight: ['300', '400', '500', '600', '700'],
    style: ['normal', 'italic'],
    variable: '--font-poppins',
});

export const viewport = {
    themeColor: '#f2f1ed',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true, // WCAG 1.4.4 — permite zoom para accesibilidad
};

export const metadata = {
    title: {
        template: '%s | ViñoPlastic',
        default: 'ViñoPlastic',
    },
    description: 'Plataforma de capacitación Viñoplastic.',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Viñoplastic',
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
    applicationName: 'Viñoplastic Training',
    formatDetection: {
        telephone: false,
    },
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="es"
            suppressHydrationWarning
            /*
             * Variables CSS expuestas para todos los módulos:
             *   font-family: var(--font-display) → Montserrat (headings/UI)
             *   font-family: var(--font-body)    → Poppins    (body)
             *   font-family: var(--font-serif)   → Montserrat (display editorial)
             *   font-family: var(--font-mono)    → ui-monospace (system)
             */
            className={`${montserrat.variable} ${poppins.variable}`}
            style={{
                '--font-body':    'var(--font-poppins)',
                '--font-display': 'var(--font-montserrat)',
                '--font-serif':   'var(--font-montserrat)',
                '--font-mono':    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
        >
            <body>
                {/* Skip Link — navegación por teclado (WCAG 2.4.1) */}
                <a href="#main-content" className="skip-link">
                    Saltar al contenido principal
                </a>

                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <OfflineIndicator />
                            <UpdatePrompt />
                            <MaintenanceGuard>
                                <div style={{ position: 'relative', zIndex: 10 }}>
                                    {children}
                                </div>
                            </MaintenanceGuard>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
