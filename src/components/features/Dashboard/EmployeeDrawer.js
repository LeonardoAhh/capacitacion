"use client";

import { Users, Calendar, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/Drawer/Drawer";
import styles from './EmployeeDrawer.module.css';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
};

export default function EmployeeDrawer({
    children,
    title,
    description,
    items = [],
    type = "warning", // warning, danger, info
    actionLink = "#",
    actionText = "Ver todos",
}) {
    const getIcon = () => {
        switch (type) {
            case "danger":
                return <AlertCircle className={styles.icon} />;
            case "info":
                return <Calendar className={styles.icon} />;
            default:
                return <FileText className={styles.icon} />;
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case "danger":
                return styles.typeDanger;
            case "info":
                return styles.typeInfo;
            default:
                return styles.typeWarning;
        }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent className={styles.drawerContent}>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.07,
                                delayChildren: 0.1,
                            },
                        },
                    }}
                >
                    <DrawerHeader>
                        <motion.div variants={itemVariants} className={styles.headerContent}>
                            <div className={`${styles.iconWrapper} ${getTypeClass()}`}>
                                {getIcon()}
                            </div>
                            <div>
                                <DrawerTitle>{title}</DrawerTitle>
                                <DrawerDescription>{description}</DrawerDescription>
                            </div>
                        </motion.div>
                        <DrawerClose />
                    </DrawerHeader>

                    <div className="drawerBody" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        <div className={styles.content}>
                            {items.length === 0 ? (
                                <motion.div variants={itemVariants} className={styles.emptyState}>
                                    <Users className={styles.emptyIcon} />
                                    <p className={styles.emptyText}>No hay elementos para mostrar</p>
                                </motion.div>
                            ) : (
                                <div className={styles.itemsList}>
                                    {items.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            variants={itemVariants}
                                            className={styles.item}
                                        >
                                            <div className={styles.itemHeader}>
                                                <div className={styles.itemInfo}>
                                                    <h4 className={styles.itemTitle}>{item.name}</h4>
                                                    {item.position && (
                                                        <p className={styles.itemSubtitle}>{item.position}</p>
                                                    )}
                                                </div>
                                                {item.badge && (
                                                    <span className={`${styles.badge} ${getTypeClass()}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {item.details && (
                                                <div className={styles.itemDetails}>
                                                    {item.details.map((detail, idx) => (
                                                        <div key={idx} className={styles.detailRow}>
                                                            <span className={styles.detailLabel}>{detail.label}:</span>
                                                            <span className={styles.detailValue}>{detail.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DrawerFooter>
                        <motion.div variants={itemVariants} className={styles.footerActions}>
                            <Link href={actionLink} className={styles.primaryButton}>
                                <span>{actionText}</span>
                                <ArrowRight className={styles.buttonIcon} />
                            </Link>
                            <DrawerClose asChild>
                                <button className={styles.secondaryButton}>
                                    Cerrar
                                </button>
                            </DrawerClose>
                        </motion.div>
                    </DrawerFooter>
                </motion.div>
            </DrawerContent>
        </Drawer>
    );
}
