'use client';

import DemoGuard from '@/components/guards/DemoGuard/DemoGuard';

export default function CapacitacionLayout({ children }) {
    return (
        <DemoGuard>
            {children}
        </DemoGuard>
    );
}
