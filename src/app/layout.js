import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import { OfflineIndicator, UpdatePrompt } from '@/components/guards/pwa';
import MaintenanceGuard from '@/components/guards/MaintenanceGuard';
import '@/styles/globals.css';
import { Roboto, Montserrat, Roboto_Mono } from 'next/font/google';

/* ─── Fuentes del sistema ──────────────────────────────────────────
   Todas las fuentes se cargan aquí y solo aquí.
   Los módulos CSS usan ÚNICAMENTE var(--font-serif / --font-body / --font-mono).
   Para cambiar una fuente en toda la plataforma: editar solo este archivo.
   ────────────────────────────────────────────────────────────────── */

const roboto = Roboto({
    subsets: ['latin'],
    weight: ['300', '400', '500', '700'],
    variable: '--font-body',
    display: 'swap',
});

const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-serif', // Reusamos el alias var(--font-serif) para los títulos
    display: 'swap',
});

export const viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true, // WCAG 1.4.4 — permite zoom para accesibilidad
};

export const metadata = {
    title: 'Vertx ViñoPlastic',
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
             * Las tres variables CSS quedan disponibles en :root
             * y en TODOS los módulos CSS sin @import adicional.
             */
            className={`${roboto.variable} ${robotoMono.variable} ${montserrat.variable}`}
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