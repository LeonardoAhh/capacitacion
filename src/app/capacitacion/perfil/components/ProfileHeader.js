import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({ employee, onBack, employeeGroups = [] }) {
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

                <h1 className={styles.pageTitle}>{employee.name}</h1>

                <div className={styles.idBadge}>
                    ID: {employee.employeeId || employee.id}
                </div>

                {employeeGroups.length > 0 && (
                    <div className={styles.groupsWrap}>
                        {employeeGroups.map(group => (
                            <span
                                key={group.id}
                                className={styles.groupBadge}
                                data-color={group.color ?? 'blue'}
                                title={group.description || group.name}
                            >
                                <Shield size={12} strokeWidth={2.5} />
                                {group.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
