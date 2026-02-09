'use client';

import { ToastProvider } from './components';

export default function CandidateDashboardLayout({ children }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
