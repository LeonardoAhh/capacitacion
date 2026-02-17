'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_STORAGE_KEY = 'csrf_token';

export function useCsrf() {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    const fetchCsrfToken = useCallback(async () => {
        try {
            const response = await fetch('/api/csrf', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok && isMounted.current) {
                const csrfToken = response.headers.get('X-CSRF-Token');
                if (csrfToken) {
                    setToken(csrfToken);
                    sessionStorage.setItem(CSRF_STORAGE_KEY, csrfToken);
                }
            }
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchCsrfToken();

        return () => {
            isMounted.current = false;
        };
    }, [fetchCsrfToken]);

    const getHeaders = useCallback((headers = {}) => {
        const currentToken = token || sessionStorage.getItem(CSRF_STORAGE_KEY);

        return {
            ...headers,
            [CSRF_HEADER]: currentToken || '',
            'Content-Type': 'application/json',
        };
    }, [token]);

    const fetchWithCsrf = useCallback(async (url, options = {}) => {
        const currentToken = token || sessionStorage.getItem(CSRF_STORAGE_KEY);

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                [CSRF_HEADER]: currentToken || '',
            },
            credentials: 'include',
        });

        const newToken = response.headers.get('X-CSRF-Token');
        if (newToken) {
            setToken(newToken);
            sessionStorage.setItem(CSRF_STORAGE_KEY, newToken);
        }

        return response;
    }, [token]);

    return {
        token,
        isLoading,
        getHeaders,
        fetchWithCsrf,
        refreshToken: fetchCsrfToken,
    };
}
