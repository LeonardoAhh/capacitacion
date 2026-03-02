"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from './Drawer.module.css';

const DrawerContext = React.createContext({
    open: false,
    setOpen: () => { },
});

export function Drawer({ children, open: controlledOpen, onOpenChange }) {
    const [internalOpen, setInternalOpen] = React.useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    return (
        <DrawerContext.Provider value={{ open, setOpen }}>
            {children}
        </DrawerContext.Provider>
    );
}

export function DrawerTrigger({ children, asChild }) {
    const { setOpen } = React.useContext(DrawerContext);

    const handleClick = () => setOpen(true);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: handleClick,
        });
    }

    return <button onClick={handleClick}>{children}</button>;
}

export function DrawerContent({ children, className = "" }) {
    const { open, setOpen } = React.useContext(DrawerContext);

    React.useEffect(() => {
        if (open) {
            // Contador global para soportar múltiples Drawers apilados
            window.__drawerCount = (window.__drawerCount || 0) + 1;
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden'; // PWA / standalone
        }
        return () => {
            if (open) {
                window.__drawerCount = Math.max(0, (window.__drawerCount || 1) - 1);
                if (window.__drawerCount === 0) {
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                }
            }
        };
    }, [open]);


    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        className={`${styles.drawer} ${className}`}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            mass: 0.8,
                        }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function DrawerHeader({ children, className = "" }) {
    return <div className={`${styles.drawerHeader} ${className}`}>{children}</div>;
}

export function DrawerTitle({ children, className = "" }) {
    return <h2 className={`${styles.drawerTitle} ${className}`}>{children}</h2>;
}

export function DrawerDescription({ children, className = "" }) {
    return <p className={`${styles.drawerDescription} ${className}`}>{children}</p>;
}

export function DrawerFooter({ children, className = "" }) {
    return <div className={`${styles.drawerFooter} ${className}`}>{children}</div>;
}

export function DrawerClose({ children, asChild }) {
    const { setOpen } = React.useContext(DrawerContext);

    const handleClick = () => setOpen(false);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: handleClick,
        });
    }

    return (
        <button onClick={handleClick} className={styles.closeButton}>
            {children || <X className={styles.closeIcon} />}
        </button>
    );
}
