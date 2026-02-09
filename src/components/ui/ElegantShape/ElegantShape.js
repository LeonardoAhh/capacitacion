"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

// ==================== ANIMATION CONFIG ====================
const ANIMATION_CONFIG = {
    enter: {
        duration: 2.4,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacityDuration: 1.2,
    },
    float: {
        duration: 12,
        ease: "easeInOut",
    }
};

/**
 * ElegantShape - Shared decorative animated shape component
 * Used across Hero, CandidateLogin, and Dashboard for consistent visual language
 * 
 * @param {Object} props
 * @param {string} props.className - CSS class for positioning
 * @param {number} props.delay - Animation delay in seconds
 * @param {number} props.width - Shape width in pixels
 * @param {number} props.height - Shape height in pixels
 * @param {number} props.rotate - Rotation angle in degrees
 * @param {string} props.color - Base color for gradient
 * @param {number} props.borderRadius - Border radius in pixels
 */
function ElegantShapeComponent({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    color,
    borderRadius = 16
}) {
    // Memoize the style objects to prevent recreation
    const containerStyle = useMemo(() => ({
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
    }), [width, height]);

    const innerStyle = useMemo(() => ({
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        borderRadius: `${borderRadius}px`,
        backdropFilter: 'blur(1px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 2px 16px -2px rgba(255, 255, 255, 0.04)',
    }), [color, borderRadius]);

    return (
        <motion.div
            animate={{ opacity: 1, y: 0, rotate }}
            initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
            transition={{
                duration: ANIMATION_CONFIG.enter.duration,
                delay,
                ease: ANIMATION_CONFIG.enter.ease,
                opacity: { duration: ANIMATION_CONFIG.enter.opacityDuration },
            }}
            className={className}
            style={containerStyle}
            aria-hidden="true"
        >
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                    duration: ANIMATION_CONFIG.float.duration,
                    repeat: Infinity,
                    ease: ANIMATION_CONFIG.float.ease,
                }}
                style={innerStyle}
            />
        </motion.div>
    );
}

// Memoize to prevent unnecessary re-renders
export const ElegantShape = memo(ElegantShapeComponent);

export default ElegantShape;
