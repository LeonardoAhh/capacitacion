import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import { OfflineIndicator, UpdatePrompt } from '@/components/pwa';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // App-like feel
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
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                {/* Skip Link para accesibilidad - navegación por teclado (CSS-only) */}
                <a
                    href="#main-content"
                    className="skip-link"
                >
                    Saltar al contenido principal
                </a>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            {/* PWA Components */}
                            <OfflineIndicator />
                            <UpdatePrompt />

                            <MaintenanceGuard>
                                {/* Main content */}
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
