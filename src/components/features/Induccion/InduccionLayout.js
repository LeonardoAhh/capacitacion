'use client';

import styles from './InduccionLayout.module.css';

/**
 * InduccionLayout — Sidebar en PC, Bottom Navigation en móvil.
 *
 * @param {Array}  tabs        — [{ id, label, icon: ReactNode, count? }]
 * @param {string} activeTab   — id del tab activo
 * @param {fn}     onTabChange — callback (tabId) => void
 * @param {ReactNode} children — contenido del tab activo
 */
export default function InduccionLayout({ tabs, activeTab, onTabChange, children }) {
    return (
        <>
            <div className={styles.layoutWrapper}>
                {/* ── Sidebar (PC) ── */}
                <nav className={styles.sidebar} aria-label="Secciones">
                    <span className={styles.sidebarLabel}>Secciones</span>
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.id}
                            className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.sidebarItemActive : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={styles.sidebarBadge}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* ── Contenido principal ── */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>

            {/* ── Bottom Navigation (Móvil) ── */}
            <nav className={styles.bottomNav} aria-label="Navegación inferior">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.bottomNavItem} ${activeTab === tab.id ? styles.bottomNavItemActive : ''}`}
                        onClick={() => onTabChange(tab.id)}
                        aria-label={tab.label}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.count > 0 && (
                            <span className={styles.bottomNavBadge}>{tab.count > 9 ? '9+' : tab.count}</span>
                        )}
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
}
