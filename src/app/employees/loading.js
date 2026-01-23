import styles from './page.module.css';

export default function Loading() {
    return (
        <div className={styles.loadingContainer}>
            <div className="spinner"></div>
        </div>
    );
}
