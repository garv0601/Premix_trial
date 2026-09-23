import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';

/**
 * RefreshContext
 *
 * A tiny, page-agnostic registry that powers the mobile pull-to-refresh gesture.
 *
 * Any component/hook that owns server data can register its existing refetch
 * function via `useRegisterRefresh(refetch)`. When the user pulls to refresh,
 * `triggerRefresh()` runs every currently-registered handler and resolves once
 * they all settle — so the gesture reuses each page's own data-fetching logic
 * and never touches cart / auth / checkout state.
 */
const RefreshContext = createContext(null);

export function RefreshProvider({ children }) {
  const handlersRef = useRef(new Set());

  const registerRefreshHandler = useCallback((handler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const triggerRefresh = useCallback(async () => {
    const handlers = Array.from(handlersRef.current);

    // Pages with no dynamic data (static/legal pages) still animate smoothly.
    if (handlers.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return;
    }

    await Promise.allSettled(
      handlers.map((fn) => {
        try {
          return Promise.resolve(fn());
        } catch {
          return Promise.resolve();
        }
      })
    );
  }, []);

  return (
    <RefreshContext.Provider value={{ registerRefreshHandler, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefreshContext() {
  return useContext(RefreshContext);
}

/**
 * Register a refetch function to be invoked on pull-to-refresh.
 *
 * The handler is stored behind a ref so the latest closure is always used
 * without re-subscribing on every render. Safe to call even when no provider
 * is mounted (it becomes a no-op).
 */
export function useRegisterRefresh(handler) {
  const ctx = useContext(RefreshContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return undefined;
    const stableHandler = () => handlerRef.current?.();
    return ctx.registerRefreshHandler(stableHandler);
  }, [ctx]);
}

export default RefreshContext;
