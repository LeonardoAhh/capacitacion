'use client';

import DemoGuard from '@/components/DemoGuard/DemoGuard';

export default function CapacitacionLayout({ children }) {
    return (
        <DemoGuard>
            {children}
        </DemoGuard>
    );
}
