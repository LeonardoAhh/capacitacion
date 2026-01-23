import styles from './EmployeeFilters.module.css';

export default function EmployeeFilters({ searchTerm, onSearchChange }) {
    return (
        <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input
                type="text"
                placeholder="Buscar por nombre, ID o departamento..."
                className="input-field"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    );
}
