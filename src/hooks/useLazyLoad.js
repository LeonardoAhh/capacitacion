'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLazyLoad(options = {}) {
    const {
        rootMargin = '200px',
        threshold = 0.1,
        triggerOnce = true,
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);
    const ref = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            setIsIntersecting(true);
            setHasIntersected(true);
            return;
        }

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);

                if (entry.isIntersecting) {
                    setHasIntersected(true);

                    if (triggerOnce && ref.current) {
                        observerRef.current?.unobserve(ref.current);
                    }
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        if (ref.current) {
            observerRef.current.observe(ref.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [rootMargin, threshold, triggerOnce]);

    const shouldRender = triggerOnce ? hasIntersected : isIntersecting;

    return {
        ref,
        isIntersecting,
        hasIntersected,
        shouldRender,
    };
}

export function useLazyComponent(importFn, options = {}) {
    const { delay = 0, retryCount = 3, retryDelay = 1000 } = options;

    const [Component, setComponent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const attemptsRef = useRef(0);

    const loadComponent = useCallback(async () => {
        if (Component) return;

        setLoading(true);
        setError(null);

        try {
            const importedModule = await importFn();
            setComponent(() => importedModule.default);
            setLoading(false);
        } catch (err) {
            attemptsRef.current += 1;

            if (attemptsRef.current < retryCount) {
                setTimeout(loadComponent, retryDelay);
            } else {
                setError(err);
                setLoading(false);
            }
        }
    }, [importFn, Component, retryCount, retryDelay]);

    const retry = useCallback(() => {
        attemptsRef.current = 0;
        loadComponent();
    }, [loadComponent]);

    return {
        Component,
        loading,
        error,
        load: loadComponent,
        retry,
    };
}

export function useInfiniteScroll(callback, options = {}) {
    const {
        threshold = 200,
        rootMargin = '200px',
        enabled = true,
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || !enabled) return;

        setIsLoading(true);

        try {
            const result = await callback();
            setHasMore(result !== false);
        } catch (error) {
            console.error('Infinite scroll error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [callback, isLoading, hasMore, enabled]);

    useEffect(() => {
        if (!enabled || typeof IntersectionObserver === 'undefined') return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isLoading && hasMore) {
                    loadMore();
                }
            },
            { rootMargin }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [enabled, isLoading, hasMore, loadMore, rootMargin]);

    return {
        loadMoreRef,
        isLoading,
        hasMore,
        setHasMore,
        loadMore,
    };
}
