import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { useActiveProducts } from '../../hooks/useActiveProducts';
import { staggerContainer, fadeUp, viewportOnce } from '../../utils/animations';

// ── Badge colour mapping ──
const badgeColors = {
  Bestseller:     { bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
  Popular:        { bg: '#FDECEA', color: '#B22222', border: '#E09090' },
  New:            { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  Quick:          { bg: '#E8F0FE', color: '#1A56B0', border: '#90B4E0' },
  '100% Vegan':   { bg: '#E8F5EE', color: '#1E6B3E', border: '#87C9A4' },
  'Mildly Spiced':{ bg: '#FFF0CC', color: '#8B6914', border: '#F0D060' },
};

// ================================================================
// QUANTITY STEPPER — exact same pattern as FeaturedProducts.jsx
// ================================================================
function QuantityStepper({ qty, onDecrement, onIncrement }) {
  return (
    <motion.div
      key="stepper"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        borderRadius: '7px',
        border: '1.5px solid #B22222',
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDecrement(); }}
        aria-label="Decrease quantity"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#B22222',
          width: '32px',
          height: '36px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '16px',
          transition: 'background 0.14s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(178,34,34,0.07)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Minus size={13} strokeWidth={2.5} />
      </button>

      <span
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          color: '#1C1007',
          minWidth: '20px',
          textAlign: 'center',
          lineHeight: 1,
          padding: '0 2px',
          userSelect: 'none',
        }}
      >
        {qty}
      </span>

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIncrement(); }}
        aria-label="Increase quantity"
        style={{
          background: '#B22222',
          border: 'none',
          color: '#fff',
          width: '32px',
          height: '36px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.14s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#8B1A1A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#B22222')}
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

// ================================================================
// ADD BUTTON — exact same pattern as FeaturedProducts.jsx
// ================================================================
function AddButton({ onClick, productName }) {
  return (
    <motion.button
      key="add"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={`Add ${productName} to cart`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: '#B22222',
        color: '#fff',
        border: 'none',
        borderRadius: '7px',
        padding: '8px 16px',
        height: '36px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        cursor: 'pointer',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      whileHover={{ background: '#8B1A1A', scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <Plus size={13} strokeWidth={2.5} />
      Add
    </motion.button>
  );
}

// ================================================================
// SHOP PRODUCT CARD
// ================================================================
function ShopProductCard({ product, cartQty, onAdd, onIncrement, onDecrement }) {
  const badge    = badgeColors[product.badge];
  const inCart   = cartQty > 0;
  const soldOut  = (product.stock_quantity ?? 0) <= 1;

  // ── Sold-out card ──────────────────────────────────────────────
  if (soldOut) {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        aria-label={`${product.name} — Sold out`}
        style={{
          background: '#F7F4F1',
          border: '1px solid rgba(93, 64, 55, 0.08)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: 0.7,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {/* Image — NOT a link */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '4/3',
            background: '#EDE9E4',
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              filter: 'grayscale(55%) brightness(0.92)',
            }}
          />
          {/* SOLD OUT badge overlay */}
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(60, 50, 45, 0.82)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              borderRadius: '20px',
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            Sold Out
          </span>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'clamp(12px, 3vw, 18px) clamp(12px, 3vw, 18px) 16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#B0A090',
                marginBottom: '4px',
              }}
            >
              {product.category}
            </p>
            <h3
              style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(14px, 2vw, 16px)',
                fontWeight: 500,
                color: '#9A8878',
                lineHeight: 1.3,
                marginBottom: '6px',
              }}
            >
              {product.name}
            </h3>
            <p
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '13px',
                color: '#B0A090',
                lineHeight: 1.55,
              }}
            >
              {product.shortDescription}
            </p>
          </div>

          {/* Price + Sold Out pill */}
          <div
            className="product-card-bottom"
            style={{
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid rgba(93, 64, 55, 0.06)',
            }}
          >
            <div className="price-pack-container">
              <div
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#B0A090',
                  lineHeight: 1,
                }}
              >
                {product.currency}{product.price}
              </div>
              <div
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '12px',
                  color: '#C0B0A0',
                  marginTop: '4px',
                  lineHeight: 1.3,
                }}
              >
                {product.packSize}
              </div>
            </div>

            {/* Sold Out pill replaces Add/Stepper */}
            <div className="product-action-container">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(93, 64, 55, 0.08)',
                  color: '#9A8878',
                  border: '1.5px solid rgba(93, 64, 55, 0.15)',
                  borderRadius: '7px',
                  padding: '8px 14px',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                Sold Out
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  // ── Normal (in-stock) card — unchanged ─────────────────────────
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: '#FFFBF7',
        border: '1px solid rgba(93, 64, 55, 0.1)',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(93, 64, 55, 0.14)' }}
    >
      {/* Clickable image area → product detail */}
      <Link
        to={`/product/${product.slug}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
        aria-label={`View ${product.name} details`}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '4/3',
            background: '#FEF4EC',
          }}
        >
          <motion.img
            src={product.image}
            alt={`${product.name} — ${product.shortDescription}`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
          {product.badge && badge && (
            <span
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '20px',
                fontFamily: "'Be Vietnam Pro', sans-serif",
              }}
            >
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div
        style={{
          padding: 'clamp(12px, 3vw, 18px) clamp(12px, 3vw, 18px) 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: 0,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#A8816A',
              marginBottom: '4px',
            }}
          >
            {product.category}
          </p>
          <Link
            to={`/product/${product.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3
              style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(14px, 2vw, 16px)',
                fontWeight: 500,
                color: '#1C1007',
                lineHeight: 1.3,
                marginBottom: '6px',
                cursor: 'pointer',
              }}
            >
              {product.name}
            </h3>
          </Link>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '13px',
              color: '#7A5C4A',
              lineHeight: 1.55,
            }}
          >
            {product.shortDescription}
          </p>
        </div>

        {/* Price + Cart Action */}
        <div
          className="product-card-bottom"
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid rgba(93, 64, 55, 0.08)',
          }}
        >
          <div className="price-pack-container">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#B22222',
                  lineHeight: 1,
                }}
              >
                {product.currency}{product.price}
              </div>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <span
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#A8816A',
                    textDecoration: 'line-through',
                    textDecorationThickness: '1px',
                    opacity: 0.8,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {product.currency}{product.compareAtPrice}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '12px',
                color: '#A8816A',
                marginTop: '4px',
                lineHeight: 1.3,
              }}
            >
              {product.packSize}
            </div>
          </div>

          {/* Animated toggle: Add button ↔ Quantity stepper */}
          <div className="product-action-container">
            <AnimatePresence mode="wait" initial={false}>
              {inCart ? (
                <QuantityStepper
                  key="stepper"
                  qty={cartQty}
                  onDecrement={onDecrement}
                  onIncrement={onIncrement}
                />
              ) : (
                <AddButton
                  key="add"
                  productName={product.name}
                  onClick={onAdd}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ================================================================
// CATEGORY FILTER PILLS
// ================================================================
function CategoryFilters({ categories, activeCategory, onSelect }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginTop: '28px',
      }}
      role="tablist"
      aria-label="Filter products by category"
    >
      {categories.map((cat, i) => {
        const isActive = cat === activeCategory;
        return (
          <motion.button
            key={cat}
            variants={fadeUp}
            role="tab"
            aria-selected={isActive}
            aria-controls="shop-products-grid"
            onClick={() => onSelect(cat)}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#1C1007' : '#5D4037',
              background: isActive ? '#FFC300' : 'transparent',
              border: isActive ? '1.5px solid #FFC300' : '1.5px solid rgba(93, 64, 55, 0.25)',
              borderRadius: '24px',
              padding: '8px 22px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            whileHover={!isActive ? { background: 'rgba(255, 195, 0, 0.12)', borderColor: 'rgba(255, 195, 0, 0.5)' } : {}}
            whileTap={{ scale: 0.96 }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 195, 0, 0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {cat}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ================================================================
// MAA'S TIP SECTION
// ================================================================
function MaasTip() {
  return (
    <section
      aria-label="Maa's cooking tip"
      style={{ marginTop: 'clamp(48px, 6vw, 72px)' }}
    >
      {/* Dotted pattern decoration */}
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '16px',
          backgroundImage: 'radial-gradient(circle, #D4A574 1.5px, transparent 1.5px)',
          backgroundSize: '18px 18px',
          backgroundPosition: 'center',
          opacity: 0.35,
          marginBottom: '0',
        }}
      />

      <div
        style={{
          background: '#FFC300',
          borderRadius: '14px',
          padding: 'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 40px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(16px, 2.5vw, 24px)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Sparkles size={22} color="#B22222" />
        </div>

        <div>
          <h3
            style={{
              fontFamily: "'Literata', Georgia, serif",
              fontSize: 'clamp(16px, 2vw, 20px)',
              fontWeight: 600,
              color: '#1C1007',
              marginBottom: '8px',
              lineHeight: 1.3,
            }}
          >
            Maa's Tip
          </h3>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              color: '#3D2B1F',
              lineHeight: 1.65,
              maxWidth: '600px',
            }}
          >
            For extra crispy Mathris, try frying them on a medium-low flame. Patience is the secret ingredient! Serve warm with a strong cup of adrak wali chai.
          </p>
        </div>
      </div>
    </section>
  );
}

// ================================================================
// EMPTY STATE
// ================================================================
function EmptyState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        textAlign: 'center',
        padding: 'clamp(48px, 6vw, 80px) 20px',
        gridColumn: '1 / -1',
      }}
    >
      <p
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '16px',
          color: '#7A5C4A',
          marginBottom: '20px',
        }}
      >
        No premixes found in this category.
      </p>
      <button
        onClick={onReset}
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          color: '#B22222',
          background: 'transparent',
          border: '1.5px solid #B22222',
          borderRadius: '8px',
          padding: '10px 24px',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#B22222';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#B22222';
        }}
      >
        View all premixes
      </button>
    </motion.div>
  );
}

// ================================================================
// SHOP PAGE
// ================================================================
export default function ShopPage({ cartItems = [], onAddToCartRaw, onUpdateQuantity }) {
  const shouldReduce = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState('All');

  // ── Fetch only is_active = true products from Supabase ──
  const { products: dbProducts, loading, error } = useActiveProducts();

  // ── Derive category list from live data ──
  const shopCategories = useMemo(() => {
    const cats = new Set(dbProducts.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [dbProducts]);

  // ── Filter products by selected category ──
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return dbProducts;
    return dbProducts.filter((p) => p.category === activeCategory);
  }, [dbProducts, activeCategory]);

  // Look up cart quantity for a product by ID
  const getQty = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <>
      {/* Top spacing to clear fixed navbar */}
      <div style={{ paddingTop: 'clamp(80px, 10vw, 100px)' }} />

      <section
        id="shop-page"
        aria-label="Shop all premixes"
        style={{
          background: '#FFF8F4',
          padding: '0 0 clamp(60px, 8vw, 100px)',
        }}
      >
        <div className="container">

          {/* ── Shop Introduction ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto',
              paddingTop: 'clamp(24px, 4vw, 40px)',
              paddingBottom: 'clamp(8px, 2vw, 16px)',
            }}
          >
            <motion.h1
              variants={fadeUp}
              style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                fontWeight: 500,
                color: '#1C1007',
                lineHeight: 1.2,
                marginBottom: '14px',
              }}
            >
              Explore Our Premixes
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 'clamp(14px, 1.6vw, 16px)',
                color: '#7A5C4A',
                lineHeight: 1.65,
              }}
            >
              Bring the authentic taste of Maa's kitchen to your home in minutes.
              Browse our selection of handcrafted, preservative-free mixes.
            </motion.p>
          </motion.div>

          {/* ── Category Filters ── */}
          <CategoryFilters
            categories={shopCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          {/* ── Loading / Error / Product Grid ── */}
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '240px',
                flexDirection: 'column',
                gap: '12px',
                color: '#7A5C4A',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(178, 34, 34, 0.15)',
                  borderTopColor: '#B22222',
                  borderRadius: '50%',
                  animation: 'shop-spin 0.7s linear infinite',
                }}
              />
              Loading products…
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'clamp(32px, 5vw, 60px) 20px',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                color: '#B22222',
                fontSize: '14px',
              }}
            >
              Unable to load products. Please refresh the page.
            </div>
          ) : (
            <div
              id="shop-products-grid"
              role="tabpanel"
              aria-label={`${activeCategory} products`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                gap: 'clamp(14px, 2.5vw, 26px)',
                marginTop: 'clamp(32px, 5vw, 48px)',
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const qty = getQty(product.id);
                    return (
                      <ShopProductCard
                        key={product.id}
                        product={product}
                        cartQty={qty}
                        onAdd={() => onAddToCartRaw && onAddToCartRaw(product)}
                        onIncrement={() => onUpdateQuantity && onUpdateQuantity(product.id, qty + 1)}
                        onDecrement={() => onUpdateQuantity && onUpdateQuantity(product.id, qty - 1)}
                      />
                    );
                  })
                ) : (
                  <EmptyState key="empty" onReset={() => setActiveCategory('All')} />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Maa's Tip ── */}
          <MaasTip />
        </div>
      </section>

      {/* Responsive grid styles */}
      <style>{`
        @keyframes shop-spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 900px) {
          #shop-products-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 414px) {
          #shop-products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 350px) {
          #shop-products-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Responsive product card bottom layout */
        .product-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .price-pack-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
        }
        .product-action-container {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
        }
        
        @media (max-width: 767px) {
          .product-card-bottom {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            gap: 12px;
          }
          .product-action-container {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
