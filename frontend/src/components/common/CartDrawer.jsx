import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

// Use a simple formatter since formatters.js uses USD — ANNAPURNA uses ₹
const formatPrice = (amount, currency = '₹') =>
  `${currency}${Number(amount).toLocaleString('en-IN')}`;

export const CartDrawer = ({ isOpen, onClose, cart }) => {
  const navigate = useNavigate();

  if (!isOpen || !cart) return null;

  const { cartItems = [], removeFromCart, updateQuantity, subtotal = 0, totalItems = 0 } = cart;

  const handleCheckout = () => {
    onClose();          // close the drawer
    navigate('/checkout'); // ProtectedRoute handles auth check
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(28, 16, 7, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          background: '#FFF8F4',
          borderLeft: '1px solid rgba(93, 64, 55, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(28, 16, 7, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(93, 64, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={18} color="#B22222" />
            <h3
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: '#1C1007',
              }}
            >
              Your Cart ({totalItems})
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7A5C4A',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ShoppingBag size={44} color="rgba(93, 64, 55, 0.2)" style={{ margin: '0 auto 14px' }} />
              <p
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '15px',
                  color: '#7A5C4A',
                  marginBottom: '18px',
                }}
              >
                Your cart is empty.
              </p>
              <button
                onClick={onClose}
                style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#B22222',
                  background: 'transparent',
                  border: '1.5px solid #B22222',
                  borderRadius: '7px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                }}
              >
                Browse Premixes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#FFFBF7',
                    border: '1px solid rgba(93, 64, 55, 0.09)',
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1C1007',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </h4>
                    <span
                      style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#B22222',
                      }}
                    >
                      {formatPrice(item.price, item.currency)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        style={{
                          background: 'rgba(93, 64, 55, 0.08)',
                          border: 'none',
                          color: '#5D4037',
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Minus size={11} />
                      </button>
                      <span
                        style={{
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1C1007',
                          minWidth: '14px',
                          textAlign: 'center',
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
                        style={{
                          background: 'rgba(93, 64, 55, 0.08)',
                          border: 'none',
                          color: (item.stock_quantity !== undefined && item.quantity >= item.stock_quantity) ? 'rgba(93, 64, 55, 0.3)' : '#B22222',
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          cursor: (item.stock_quantity !== undefined && item.quantity >= item.stock_quantity) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    {item.stock_quantity !== undefined && item.quantity >= item.stock_quantity && (
                      <div style={{ fontSize: '11px', color: '#B22222', marginTop: '4px' }}>
                        Only {item.stock_quantity} available
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(93, 64, 55, 0.35)',
                      cursor: 'pointer',
                      padding: '4px',
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#B22222')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(93, 64, 55, 0.35)')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '20px 22px',
              borderTop: '1px solid rgba(93, 64, 55, 0.1)',
              background: '#FFFBF7',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#7A5C4A' }}>
                Subtotal
              </span>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#3D2B1F' }}>
                {formatPrice(subtotal)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#7A5C4A' }}>
                Shipping
              </span>
              <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '13px', color: '#2F8B57', fontWeight: 600 }}>
                Calculated at checkout
              </span>
            </div>

            <button
              id="cart-checkout-btn"
              onClick={handleCheckout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#B22222',
                color: '#fff',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                padding: '13px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.18s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#8B1A1A')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#B22222')}
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
