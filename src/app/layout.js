import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import { OfflineIndicator, UpdatePrompt } from '@/components/guards/pwa';
import MaintenanceGuard from '@/components/guards/MaintenanceGuard';
import '@/styles/globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Fraunces } from 'next/font/google';

/* ─── Fuentes del sistema (design.md → Cursor System) ─────────────
   Sustitutos libres de las fuentes propietarias de Cursor:
     CursorGothic → Geist Sans   (display + UI, tracking compresivo)
     jjannon      → Fraunces     (serif body, OpenType "swsh" + "ss01")
     berkeleyMono → Geist Mono   (code + technical labels)

   Variables expuestas (usar SIEMPRE, nunca hardcodear):
     - var(--font-display) → Geist Sans  (headings, buttons, UI)
     - var(--font-body)    → Geist Sans  (sans body, sistema)
     - var(--font-serif)   → Fraunces    (editorial body, párrafos)
     - var(--font-mono)    → Geist Mono  (code, labels técnicos)

   Para cambiar una fuente en toda la plataforma: editar solo este archivo.
   ────────────────────────────────────────────────────────────────── */

const fraunces = Fraunces({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600'],
    style: ['normal', 'italic'],
    variable: '--font-fraunces',
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
             *   font-family: var(--font-display) → Geist Sans (headings/UI)
             *   font-family: var(--font-body)    → Geist Sans (sans body)
             *   font-family: var(--font-serif)   → Fraunces   (editorial body)
             *   font-family: var(--font-mono)    → Geist Mono (code)
             */
            className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
            style={{
                '--font-body':    'var(--font-geist-sans)',
                '--font-display': 'var(--font-geist-sans)',
                '--font-serif':   'var(--font-fraunces)',
                '--font-mono':    'var(--font-geist-mono)',
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