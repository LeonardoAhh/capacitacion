"use client";

/**
 * @author: @kokonutui
 * @description: AI Text Loading
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

export default function AILoadingState({
    texts = [
        "Thinking...",
        "Processing...",
        "Analyzing...",
        "Computing...",
        "Almost...",
    ],
    className,
    interval = 1500,
    onComplete,
}) {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const hasCalledComplete = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTextIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % texts.length;
                // Si volvemos al inicio, significa que ya mostramos todos los textos
                if (nextIndex === 0 && onComplete && !hasCalledComplete.current) {
                    hasCalledComplete.current = true;
                    // Dar tiempo al último texto para ser visible antes de navegar
                    setTimeout(() => onComplete(), interval);
                    clearInterval(timer);
                    return prevIndex; // Mantener el último texto visible
                }
                return nextIndex;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [interval, texts.length, onComplete]);

    return (
        <div className="flex items-center justify-center p-8">
            <motion.div
                className="relative px-4 py-2 w-full flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTextIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            backgroundPosition: ["-200% center", "200% center"],
                        }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                            opacity: { duration: 0.2 },
                            y: { duration: 0.2 },
                            backgroundPosition: {
                                duration: 2,
                                ease: "linear",
                                repeat: Infinity,
                            },
                        }}
                        style={{
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                            backgroundImage: "linear-gradient(90deg, #171717 0%, #a3a3a3 50%, #171717 100%)",
                            backgroundSize: "200% 100%"
                        }}
                        className={cn(
                            "text-5xl font-black whitespace-nowrap dark:bg-none",
                            className
                        )}
                    >
                        {texts[currentTextIndex]}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
