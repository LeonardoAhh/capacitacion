'use client';

import { useState } from 'react';
import styles from './Tabs.module.css';
import { cn } from '@/lib/utils';

/**
 * Tabs container component
 */
export function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    children,
    className,
    ...props
}) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const handleValueChange = (newValue) => {
        if (controlledValue === undefined) {
            setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
    };

    return (
        <div className={cn(styles.tabs, className)} {...props}>
            {typeof children === 'function'
                ? children({ value, onValueChange: handleValueChange })
                : children
            }
        </div>
    );
}

/**
 * Tabs list (contains triggers)
 */
export function TabsList({ children, className, ...props }) {
    return (
        <div className={cn(styles.tabsList, className)} role="tablist" {...props}>
            {children}
        </div>
    );
}

/**
 * Tab trigger button
 */
export function TabsTrigger({
    value,
    children,
    isActive,
    onClick,
    className,
    ...props
}) {
    return (
        <button
            role="tab"
            className={cn(
                styles.tabsTrigger,
                isActive && styles.active,
                className
            )}
            onClick={() => onClick?.(value)}
            aria-selected={isActive}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Tab content panel
 */
export function TabsContent({
    value,
    activeValue,
    children,
    className,
    ...props
}) {
    if (value !== activeValue) return null;

    return (
        <div
            role="tabpanel"
            className={cn(styles.tabsContent, className)}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Complete Tabs component with built-in state management
 */
export function TabsComplete({
    tabs = [],
    defaultValue,
    className,
    ...props
}) {
    const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

    return (
        <div className={cn(styles.tabs, className)} {...props}>
            <div className={styles.tabsList} role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        role="tab"
                        className={cn(
                            styles.tabsTrigger,
                            activeTab === tab.value && styles.active
                        )}
                        onClick={() => setActiveTab(tab.value)}
                        aria-selected={activeTab === tab.value}
                    >
                        {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
            {tabs.map((tab) => (
                activeTab === tab.value && (
                    <div
                        key={tab.value}
                        role="tabpanel"
                        className={styles.tabsContent}
                    >
                        {tab.content}
                    </div>
                )
            ))}
        </div>
    );
}

export default Tabs;
