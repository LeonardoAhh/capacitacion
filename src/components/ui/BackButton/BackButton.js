import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ href = "/", label = "Volver" }) {
    return (
        <Link href={href} style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--card-background)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '50px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }}>
            <ArrowLeft size={18} />
            <span>{label}</span>
        </Link>
    );
}
