import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, X } from 'lucide-react';

/**
 * ANNAPURNA — Mobile Cart Mini-Bar
 *
 * A premium floating cart summary shown ONLY on mobile/tablet (< 768px),
 * sitting just above the fixed bottom navigation. It is purely presentational
 * and reads the existing cart state (single source of truth from useCart):
 *   • totalItems  → sum of product quantities
 *   • subtotal    → current cart total (existing calculation)
 *   • clearCart   → existing cart-clearing function
 *
 * Behaviour:
 *   • Appears only when the cart has at least one item.
 *   • Scroll-aware: hides on scroll-down, reveals on scroll-up (with a
 *     dead-zone threshold to avoid flicker), and is forced visible at the
 *     top of the page. Animated via transform/opacity (never display:none).
 *   • "Checkout →" navigates to the EXISTING /checkout route.
 *   • "×" opens a branded confirmation dialog before clearing the cart.
 *
 * Desktop is untouched: the bar is display:none above the mobile breakpoint,
 * and the bottom navigation is never affected by this component.
 */

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// Scroll dead-zone: ignore tiny movements to prevent show/hide flicker.
const SCROLL_THRESHOLD = 10;
// Anything at/below this scroll position counts as "top of page".
const TOP_OF_PAGE = 8;

export default function CartMiniBar({ cart }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const accumulated = useRef(0);
  const ticking = useRef(false);

  const totalItems = cart?.totalItems ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const hasItems = totalItems > 0;

  // Scroll-aware visibility with a dead-zone threshold.
  useEffect(() => {
    if (!hasItems) return undefined;

    const evaluate = () => {
      const currentY = window.scrollY;

      // Force visible at the very top of the page.
      if (currentY <= TOP_OF_PAGE) {
        accumulated.current = 0;
        lastScrollY.current = currentY;
        setVisible(true);
        ticking.current = false;
        return;
      }

      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // Reset the accumulator when scroll direction flips.
      if ((delta > 0 && accumulated.current < 0) || (delta < 0 && accumulated.current > 0)) {
        accumulated.current = 0;
      }
      accumulated.current += delta;

      if (accumulated.current > SCROLL_THRESHOLD) {
        setVisible(false); // scrolling down → slide away
        accumulated.current = 0;
      } else if (accumulated.current < -SCROLL_THRESHOLD) {
        setVisible(true); // scrolling up → slide back in
        accumulated.current = 0;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(evaluate);
      }
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasItems]);

  // Keep the bar in a sensible state when items are (re)added.
  useEffect(() => {
    if (hasItems && window.scrollY <= TOP_OF_PAGE) {
      setVisible(true);
    }
  }, [hasItems]);

  const handleCheckout = useCallback(() => {
    navigate('/checkout'); // existing route; ProtectedRoute handles auth
  }, [navigate]);

  const handleConfirmClear = useCallback(() => {
    cart?.clearCart?.(); // reuse existing cart-clearing logic
    setConfirmOpen(false);
  }, [cart]);

  if (!hasItems) return null;

  const itemLabel = `${totalItems} item${totalItems === 1 ? '' : 's'}`;

  return (
    <>
      <div
        className="ann-cart-minibar"
        role="region"
        aria-label="Cart summary"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
          zIndex: 999,
          width: 'calc(100% - 16px)',
          maxWidth: '480px',
          boxSizing: 'border-box',
          transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(160%)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition:
            'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.24s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF3EA 100%)',
            border: '1px solid rgba(178, 34, 34, 0.16)',
            borderRadius: '18px',
            boxShadow:
              '0 10px 30px rgba(93, 64, 55, 0.18), 0 2px 8px rgba(93, 64, 55, 0.08)',
          }}
        >
          {/* LEFT — attractive cart icon with quantity badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #B22222 0%, #8B1A1A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(178, 34, 34, 0.32)',
              }}
            >
              <ShoppingCart size={21} color="#FFFFFF" strokeWidth={2.2} />
            </div>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                minWidth: '20px',
                height: '20px',
                padding: '0 5px',
                boxSizing: 'border-box',
                borderRadius: '10px',
                background: '#FFC300',
                color: '#5D2A00',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                lineHeight: '20px',
                textAlign: 'center',
                border: '2px solid #FFF3EA',
              }}
            >
              {totalItems}
            </span>
          </div>

          {/* CENTER — item count · total, with supporting label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: '#1C1007',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {itemLabel} <span style={{ color: '#B22222' }}>· {formatPrice(subtotal)}</span>
            </div>
            <div
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: '#7A5C4A',
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              Total in cart
            </div>
          </div>

          {/* RIGHT — dominant checkout CTA + subtle clear button */}
          <button
            type="button"
            onClick={handleCheckout}
            aria-label={`Checkout, ${itemLabel}, total ${formatPrice(subtotal)}`}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '11px 16px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #B22222 0%, #8B1A1A 100%)',
              color: '#FFFFFF',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 14px rgba(178, 34, 34, 0.34)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            Checkout
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Clear cart"
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              border: '1px solid rgba(93, 64, 55, 0.16)',
              background: 'rgba(93, 64, 55, 0.05)',
              color: '#7A5C4A',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <ClearCartDialog
        open={confirmOpen}
        onKeep={() => setConfirmOpen(false)}
        onClear={handleConfirmClear}
      />

      {/* Mobile-only visibility — desktop is completely untouched. */}
      <style>{`
        .ann-cart-minibar { display: none; }
        @media (max-width: 767px) {
          .ann-cart-minibar { display: block; }
        }
      `}</style>
    </>
  );
}

/**
 * Branded "Clear your cart?" confirmation dialog.
 * Warm ivory surface, ANN PURNA colours, accessible dialog semantics.
 */
function ClearCartDialog({ open, onKeep, onClear }) {
  const keepBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onKeep();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    // Move focus to the safe default action.
    const t = window.setTimeout(() => keepBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, onKeep]);

  if (!open) return null;

  return (
    <div
      onClick={onKeep}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(28, 16, 7, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'annMiniFade 0.18s ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-clear-cart-title"
        aria-describedby="ann-clear-cart-desc"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '340px',
          background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF3EA 100%)',
          border: '1px solid rgba(178, 34, 34, 0.14)',
          borderRadius: '22px',
          boxShadow: '0 24px 60px rgba(28, 16, 7, 0.28)',
          padding: '26px 22px 22px',
          textAlign: 'center',
          animation: 'annMiniPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 16px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #B22222 0%, #8B1A1A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(178, 34, 34, 0.3)',
          }}
        >
          <ShoppingCart size={26} color="#FFFFFF" strokeWidth={2.2} />
        </div>

        <h2
          id="ann-clear-cart-title"
          style={{
            fontFamily: "'Literata', Georgia, serif",
            fontSize: '20px',
            fontWeight: 600,
            color: '#1C1007',
            margin: '0 0 8px',
          }}
        >
          Clear your cart?
        </h2>
        <p
          id="ann-clear-cart-desc"
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: '14px',
            fontWeight: 400,
            color: '#7A5C4A',
            lineHeight: 1.5,
            margin: '0 0 22px',
          }}
        >
          Are you sure you want to remove all items from your cart?
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            ref={keepBtnRef}
            type="button"
            onClick={onKeep}
            style={{
              flex: 1,
              padding: '12px 10px',
              borderRadius: '13px',
              border: '1px solid rgba(93, 64, 55, 0.2)',
              background: '#FFFFFF',
              color: '#3D2B1F',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            No, Keep Cart
          </button>
          <button
            type="button"
            onClick={onClear}
            style={{
              flex: 1,
              padding: '12px 10px',
              borderRadius: '13px',
              border: 'none',
              background: 'linear-gradient(135deg, #B22222 0%, #8B1A1A 100%)',
              color: '#FFFFFF',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(178, 34, 34, 0.32)',
            }}
          >
            Yes, Clear
          </button>
        </div>
      </div>

      <style>{`
        @keyframes annMiniFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes annMiniPop {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
