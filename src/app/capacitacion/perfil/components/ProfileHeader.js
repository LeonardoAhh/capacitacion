import { motion } from 'framer-motion';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({ employee, onBack }) {
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <motion.div
            className={styles.headerCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.avatarSection}>
                <motion.div
                    className={styles.avatarContainer}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    {employee.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={employee.photoUrl}
                            alt={employee.name}
                            className={styles.avatar}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className={styles.initials}>
                            {getInitials(employee.name)}
                        </div>
                    )}
                </motion.div>

                <h1 className={styles.name}>{employee.name}</h1>

                <div className={styles.idBadge}>
                    ID: {employee.employeeId || employee.id}
                </div>
            </div>
        </motion.div>
    );
}
