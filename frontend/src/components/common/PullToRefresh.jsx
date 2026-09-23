import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRefreshContext } from '../../context/RefreshContext';

/**
 * PullToRefresh
 *
 * Instagram / Swiggy-style pull-to-refresh for mobile, mounted once globally.
 *
 * Behaviour:
 *  - Only activates on coarse-pointer, phone-width viewports (desktop untouched).
 *  - Only starts when the page is already scrolled to the very top.
 *  - A subtle indicator follows the finger with rubber-band resistance.
 *  - Crossing the threshold triggers the current page's registered refetch
 *    handlers (see RefreshContext) and spins until they settle.
 *  - Releasing below the threshold, or scrolling up, cancels cleanly.
 *
 * It renders a fixed-position indicator only, so it never affects page layout,
 * the bottom navigation, or the cart mini-bar.
 */

const THRESHOLD = 70; // px of pull required to trigger a refresh
const MAX_PULL = 110; // clamp so the indicator never drifts too far
const RESISTANCE = 0.5; // rubber-band damping while dragging
const MIN_SPIN_MS = 650; // keep the spinner visible long enough to feel intentional

function isMobileEnvironment() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    window.matchMedia('(max-width: 767px)').matches &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

function atPageTop() {
  const y =
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    0;
  return y <= 0;
}

export default function PullToRefresh() {
  const ctx = useRefreshContext();

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [blink, setBlink] = useState(false);

  // Mutable gesture state kept in refs to avoid stale closures in native handlers.
  const gesture = useRef({
    active: false,
    pulling: false,
    startX: 0,
    startY: 0,
  });
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const setPullValue = useCallback((value) => {
    pullRef.current = value;
    setPull(value);
  }, []);

  const runRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    setPullValue(THRESHOLD * 0.85); // rest position while the spinner runs

    const start = Date.now();
    try {
      await ctx?.triggerRefresh();
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SPIN_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS - elapsed));
      }
      refreshingRef.current = false;
      setRefreshing(false);
      setPullValue(0);
      // Quick whole-page "blink" so the user clearly sees the refresh happened.
      setBlink(true);
      setTimeout(() => setBlink(false), 340);
    }
  }, [ctx, setPullValue]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (!isMobileEnvironment()) return;
      if (e.touches.length !== 1) return;
      if (!atPageTop()) {
        gesture.current.active = false;
        return;
      }
      gesture.current.active = true;
      gesture.current.pulling = false;
      gesture.current.startX = e.touches[0].clientX;
      gesture.current.startY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      const g = gesture.current;
      if (!g.active || refreshingRef.current) return;

      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;

      // Once committed to a pull, keep following it; otherwise decide intent.
      if (!g.pulling) {
        // Ignore predominantly horizontal gestures (carousels, sliders).
        if (Math.abs(dx) > Math.abs(dy)) {
          g.active = false;
          return;
        }
        // Only begin on a downward drag from the very top.
        if (dy <= 0) return;
        if (!atPageTop()) {
          g.active = false;
          return;
        }
        g.pulling = true;
      }

      // If the user reverses past the top, cancel and hand back to native scroll.
      if (dy <= 0) {
        g.active = false;
        g.pulling = false;
        setPullValue(0);
        return;
      }

      const distance = Math.min(MAX_PULL, dy * RESISTANCE);
      setPullValue(distance);
      // Suppress native overscroll / browser pull-to-refresh while we drive it.
      if (e.cancelable) e.preventDefault();
    };

    const endGesture = () => {
      const g = gesture.current;
      if (!g.active && !g.pulling) return;

      const shouldRefresh =
        g.pulling && pullRef.current >= THRESHOLD && !refreshingRef.current;

      g.active = false;
      g.pulling = false;

      if (shouldRefresh) {
        runRefresh();
      } else if (!refreshingRef.current) {
        setPullValue(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', endGesture, { passive: true });
    window.addEventListener('touchcancel', endGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endGesture);
      window.removeEventListener('touchcancel', endGesture);
    };
  }, [runRefresh, setPullValue]);

  const dragging = gesture.current.active && !refreshing;
  const progress = Math.min(1, pull / THRESHOLD);
  const visible = pull > 0 || refreshing;

  return (
    <>
      {blink && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-page, #FFF8F4)',
            pointerEvents: 'none',
            zIndex: 1190,
            animation: 'ptr-blink 0.34s ease',
          }}
        />
      )}
      <div
        aria-hidden={!visible}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1200,
        }}
      >
        <div
          style={{
            transform: `translateY(${pull - 44}px) scale(${0.6 + progress * 0.4})`,
            opacity: visible ? Math.min(1, 0.3 + progress) : 0,
            transition: dragging
              ? 'none'
              : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease',
            marginTop: 8,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-surface, #FFFBF7)',
            boxShadow: '0 4px 14px rgba(28, 16, 7, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary, #B22222)',
          }}
        >
          <RefreshCw
            size={20}
            strokeWidth={2.4}
            style={{
              transform: refreshing ? 'none' : `rotate(${progress * 270}deg)`,
              transition: dragging ? 'none' : 'transform 0.2s ease',
              animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
            }}
          />
        </div>
        <style>{`
          @keyframes ptr-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes ptr-blink {
            0% { opacity: 0; }
            45% { opacity: 0.8; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    </>
  );
}
