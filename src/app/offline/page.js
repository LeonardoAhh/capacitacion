import OfflinePageClient from './OfflinePageClient';

export const metadata = {
    title: 'Sin conexión - Viñoplastic',
    description: 'No tienes conexión a internet',
};

export default function OfflinePage() {
    return <OfflinePageClient />;
}
