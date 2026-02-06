import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import ParticlesBackground from '@/components/ParticlesBackground/ParticlesBackground';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Vertx ViñoPlastic',
    description: 'Plataforma de capacitación Viñoplastic.',
    icons: {
        icon: '/icon.svg',
    },
};

export const viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
                            {/* Particles background - visible en todas las páginas */}
                            <ParticlesBackground />
                            {children}
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
