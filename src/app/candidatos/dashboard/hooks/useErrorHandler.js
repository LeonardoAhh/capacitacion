'use client';

import { useCallback } from 'react';
import { useToast } from '../components';

/**
 * Custom hook for centralized error handling
 * Provides consistent error handling across the dashboard with toast notifications
 * 
 * @returns {Object} Error handling utilities
 */
export function useErrorHandler() {
    const toast = useToast();

    /**
     * Handle async operations with error handling
     * @param {Function} asyncFn - Async function to execute
     * @param {Object} options - Options for error handling
     * @returns {Promise<any>} Result of async function or null on error
     */
    const handleAsync = useCallback(async (asyncFn, options = {}) => {
        const {
            errorMessage = 'Ocurrió un error inesperado',
            showToast = true,
            onError = null,
            rethrow = false
        } = options;

        try {
            return await asyncFn();
        } catch (error) {
            console.error('Error:', error);

            if (showToast) {
                toast.error(errorMessage);
            }

            if (onError) {
                onError(error);
            }

            if (rethrow) {
                throw error;
            }

            return null;
        }
    }, [toast]);

    /**
     * Handle course loading errors
     */
    const handleCourseError = useCallback((error) => {
        console.error('Error loading courses:', error);
        toast.error('No se pudieron cargar los cursos. Intenta recargar la página.');
    }, [toast]);

    /**
     * Handle save/update errors
     */
    const handleSaveError = useCallback((error, context = 'datos') => {
        console.error(`Error saving ${context}:`, error);
        toast.error(`Error al guardar ${context}. Los cambios no se guardaron.`);
    }, [toast]);

    /**
     * Handle exam submission errors
     */
    const handleExamError = useCallback((error) => {
        console.error('Error submitting exam:', error);
        toast.error('Error al enviar el examen. Por favor intenta de nuevo.');
    }, [toast]);

    /**
     * Show success messages
     */
    const showSuccess = useCallback((message) => {
        toast.success(message);
    }, [toast]);

    /**
     * Show warning messages
     */
    const showWarning = useCallback((message) => {
        toast.warning(message);
    }, [toast]);

    /**
     * Show info messages
     */
    const showInfo = useCallback((message) => {
        toast.info(message);
    }, [toast]);

    return {
        handleAsync,
        handleCourseError,
        handleSaveError,
        handleExamError,
        showSuccess,
        showWarning,
        showInfo,
        toast
    };
}

export default useErrorHandler;
