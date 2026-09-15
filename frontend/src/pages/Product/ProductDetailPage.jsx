import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, ArrowLeft, Clock, Package, Users, Lightbulb, CheckCircle2 } from 'lucide-react';
import { findProductBySlug } from '../../data/products';
import { fadeUp } from '../../utils/animations';

// ── Badge colour mapping ──
const badgeColorMap = {
  'Bestseller':        { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Popular':           { bg: '#FDECEA', color: '#B22222', border: '#E09090' },
  'New':               { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  'Ready in 15 Mins':  { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Ready in 20 Mins':  { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Ready in 12 Mins':  { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Ready in 10 Mins':  { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Ready in 18 Mins':  { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Preservative-Free': { bg: '#FDECEA', color: '#B22222', border: '#E09090' },
  '100% Vegetarian':   { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  '100% Vegan':        { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  'No Oil Added':      { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  'Mildly Spiced':     { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  'Serves 3–4':        { bg: '#E8F0FE', color: '#1A56B0', border: '#90B4E0' },
};

const defaultBadgeColor = { bg: '#F5F0EB', color: '#5D4037', border: '#D4C4B5' };

// ================================================================
// PRODUCT GALLERY
// ================================================================
function ProductGallery({ images, productName }) {
  const shouldReduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryImages = images && images.length > 0 ? images : [];
  const showThumbnails = galleryImages.length > 1;

  if (galleryImages.length === 0) {
    return (
      <div style={{
        background: '#FEF4EC',
        borderRadius: '14px',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A8816A',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '14px',
      }}>
        No image available
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#FEF4EC',
          aspectRatio: '1',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={galleryImages[activeIndex]}
            alt={`${productName} — image ${activeIndex + 1}`}
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '14px',
            flexWrap: 'wrap',
          }}
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {galleryImages.map((img, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: i === activeIndex
                  ? '2.5px solid #B22222'
                  : '2px solid rgba(93, 64, 55, 0.15)',
                cursor: 'pointer',
                padding: 0,
                background: '#FEF4EC',
                transition: 'border-color 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (i !== activeIndex) e.currentTarget.style.borderColor = 'rgba(178, 34, 34, 0.5)';
              }}
              onMouseLeave={(e) => {
                if (i !== activeIndex) e.currentTarget.style.borderColor = 'rgba(93, 64, 55, 0.15)';
              }}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${i + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// PRODUCT BADGES ROW
// ================================================================
function ProductBadges({ badges }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
      {badges.map((badge) => {
        const colors = badgeColorMap[badge] || defaultBadgeColor;
        return (
          <span
            key={badge}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: colors.color,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              padding: '4px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        );
      })}
    </div>
  );
}

// ================================================================
// QUANTITY SELECTOR — reads/writes global cart state
// ================================================================
function QuantitySelector({ quantity, onDecrement, onIncrement }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <span style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '20px',
        color: '#7A5C4A',
        fontWeight: 500,
      }}>
        Quantity:
      </span>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1.5px solid rgba(93, 64, 55, 0.2)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <button
          onClick={onDecrement}
          aria-label="Decrease quantity"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: '#5D4037',
            cursor: 'pointer',
            transition: 'background 0.14s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(93, 64, 55, 0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>

        <span style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '15px',
          fontWeight: 700,
          color: '#1C1007',
          minWidth: '32px',
          textAlign: 'center',
          userSelect: 'none',
          borderLeft: '1px solid rgba(93, 64, 55, 0.12)',
          borderRight: '1px solid rgba(93, 64, 55, 0.12)',
          padding: '0 4px',
          lineHeight: '36px',
        }}>
          {quantity}
        </span>

        <button
          onClick={onIncrement}
          aria-label="Increase quantity"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: '#B22222',
            cursor: 'pointer',
            transition: 'background 0.14s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(93, 64, 55, 0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ================================================================
// PRODUCT META — pack size, servings, prep time, category
// ================================================================
function ProductMeta({ product }) {
  const items = [
    { icon: Package, label: 'Pack Size', value: product.packSize },
    { icon: Users, label: 'Servings', value: product.servings },
    { icon: Clock, label: 'Prep Time', value: product.preparationTime },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginTop: '20px',
      padding: '18px',
      background: '#FEF4EC',
      borderRadius: '12px',
    }}>
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={16} color="#B22222" />
          </div>
          <div>
            <div style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#A8816A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#3D2B1F',
            }}>
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// MAA'S TIP
// ================================================================
function MaaTipSection({ tip }) {
  if (!tip) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      aria-label="Maa's cooking tip"
      style={{
        background: '#FFC300',
        borderRadius: '14px',
        padding: 'clamp(24px, 3vw, 32px) clamp(20px, 3vw, 32px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'clamp(14px, 2vw, 20px)',
        marginTop: 'clamp(32px, 4vw, 48px)',
      }}
    >
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <Lightbulb size={20} color="#B22222" />
      </div>
      <div>
        <h3 style={{
          fontFamily: "'Literata', Georgia, serif",
          fontSize: '17px',
          fontWeight: 600,
          color: '#1C1007',
          marginBottom: '6px',
          lineHeight: 1.3,
        }}>
          Maa's Tip
        </h3>
        <p style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 'clamp(13px, 1.4vw, 15px)',
          color: '#3D2B1F',
          lineHeight: 1.65,
          maxWidth: '560px',
        }}>
          {tip}
        </p>
      </div>
    </motion.section>
  );
}

// ================================================================
// PRODUCT NOT FOUND
// ================================================================
function ProductNotFound() {
  return (
    <div style={{
      paddingTop: 'clamp(100px, 12vw, 140px)',
      paddingBottom: '80px',
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '8px',
      }}>
        🍲
      </div>
      <h1 style={{
        fontFamily: "'Literata', Georgia, serif",
        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        fontWeight: 500,
        color: '#1C1007',
      }}>
        Premix not found
      </h1>
      <p style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '15px',
        color: '#7A5C4A',
        maxWidth: '360px',
        lineHeight: 1.6,
      }}>
        Looks like this one has gone missing from the kitchen.
      </p>
      <Link
        to="/shop"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          color: '#fff',
          background: '#B22222',
          textDecoration: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          marginTop: '8px',
          transition: 'background 0.18s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#8B1A1A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#B22222')}
      >
        <ArrowLeft size={16} />
        Back to Shop
      </Link>
    </div>
  );
}

// ================================================================
// PRODUCT DETAIL PAGE
// ================================================================
export default function ProductDetailPage({ cartItems = [], onAddToCartRaw, onUpdateQuantity }) {
  const { slug } = useParams();
  const shouldReduce = useReducedMotion();
  const [showAdded, setShowAdded] = useState(false);
  const [localQty, setLocalQty] = useState(0);

  const product = useMemo(() => findProductBySlug(slug), [slug]);

  // Look up cart quantity for this product
  const cartQty = useMemo(() => {
    if (!product) return 0;
    const item = cartItems.find((i) => i.id === product.id);
    return item ? item.quantity : 0;
  }, [cartItems, product]);

  // Track whether this product is already in the cart
  const isInCart = cartQty > 0;

  // The displayed quantity: cart quantity if in cart, otherwise local state
  const displayQty = isInCart ? cartQty : localQty;

  // Set dynamic page title
  useEffect(() => {
    if (product) {
      document.title = `ANNAPURNA | ${product.name}`;
    } else {
      document.title = 'ANNAPURNA | Product Not Found';
    }
    return () => { document.title = 'ANNAPURNA'; };
  }, [product]);

  // Handlers
  const handleDecrement = () => {
    if (isInCart) {
      onUpdateQuantity && onUpdateQuantity(product.id, cartQty - 1);
    } else {
      setLocalQty((q) => Math.max(0, q - 1));
    }
  };

  const handleIncrement = () => {
    if (isInCart) {
      onUpdateQuantity && onUpdateQuantity(product.id, cartQty + 1);
    } else {
      setLocalQty((q) => q + 1);
    }
  };

  const handleAddToCart = () => {
    if (!product || !onAddToCartRaw) return;

    if (isInCart) {
      // If already in cart, increase by localQty amount (or just +1 if qty selector shows cart qty)
      onUpdateQuantity && onUpdateQuantity(product.id, cartQty + 1);
    } else {
      onAddToCartRaw(product);
      setLocalQty(1);
    }

    // Show success feedback
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  if (!product) return <ProductNotFound />;

  return (
    <>
      {/* Navbar spacer */}
      <div style={{ paddingTop: 'clamp(80px, 10vw, 100px)' }} />

      <section
        style={{
          background: '#FFF8F4',
          padding: '0 0 clamp(48px, 6vw, 80px)',
        }}
      >
        <div className="container">

          {/* Back link */}
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ paddingTop: 'clamp(20px, 3vw, 32px)', marginBottom: '24px' }}
          >
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#7A5C4A',
                textDecoration: 'none',
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B22222')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7A5C4A')}
            >
              <ArrowLeft size={16} />
              Back to Shop
            </Link>
          </motion.div>

          {/* Main product layout — 55/45 split */}
          <div id="product-detail-layout" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'clamp(28px, 4vw, 48px)',
            alignItems: 'start',
          }}>

            {/* LEFT — Gallery */}
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <ProductGallery
                images={product.images}
                productName={product.name}
              />
            </motion.div>

            {/* RIGHT — Product Info */}
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
              {/* Badges */}
              <ProductBadges badges={product.badges} />

              {/* Title */}
              <h1 style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                fontWeight: 500,
                color: '#1C1007',
                lineHeight: 1.25,
                marginBottom: '10px',
              }}>
                {product.name}
              </h1>

              {/* Short description */}
              <p style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 'clamp(14px, 1.6vw, 16px)',
                color: '#7A5C4A',
                lineHeight: 1.6,
                marginBottom: '20px',
                fontStyle: 'italic',
              }}>
                {product.shortDescription}
              </p>

              {/* Price */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                marginBottom: '24px',
              }}>
                <span style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: '#B22222',
                  lineHeight: 1,
                }}>
                  {product.currency}{product.price}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <span style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '16px',
                    color: '#A8816A',
                    textDecoration: 'line-through',
                  }}>
                    {product.currency}{product.mrp}
                  </span>
                )}
              </div>

              {/* Quantity selector — only visible when product is in cart */}
              {isInCart && (
                <div style={{ marginBottom: '32px' }}>
                  <QuantitySelector
                    quantity={displayQty}
                    onDecrement={handleDecrement}
                    onIncrement={handleIncrement}
                  />
                </div>
              )}

              {/* Add to Cart — only visible when product is NOT in cart */}
              {!isInCart && (
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: showAdded ? '#2F8B57' : '#B22222',
                    color: '#fff',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    padding: '14px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.25s ease',
                    marginBottom: '32px',
                  }}
                  onMouseEnter={(e) => {
                    if (!showAdded) e.currentTarget.style.background = '#8B1A1A';
                  }}
                  onMouseLeave={(e) => {
                    if (!showAdded) e.currentTarget.style.background = '#B22222';
                  }}
                >
                  <AnimatePresence mode="wait">
                    {showAdded ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <CheckCircle2 size={18} />
                        Added to Cart
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <ShoppingBag size={18} />
                        Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Detailed Description */}
              {product.description && (
                <div style={{ marginBottom: '8px' }}>
                  {product.description.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: '15px',
                        color: '#3D2B1F',
                        lineHeight: 1.7,
                        marginBottom: '14px',
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Product Meta */}
              <ProductMeta product={product} />

              {/* Maa's Tip */}
              <MaaTipSection tip={product.maaTip} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsive layout */}
      <style>{`
        @media (min-width: 768px) {
          #product-detail-layout {
            grid-template-columns: 55fr 45fr !important;
          }
        }
      `}</style>
    </>
  );
}
