import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOrders } from '../../services/orderService';
import { useRegisterRefresh } from '../../context/RefreshContext';
import AccountSidebar from '../../components/account/AccountSidebar';
import MaaTip from '../../components/account/MaasTip';
import OrderCard from '../../components/orders/OrderCard';
import { PackageOpen } from 'lucide-react';

export default function MyOrders({ onAddToCartRaw }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderStatus, setReorderStatus] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      if (!user?.id) return;
      // getUserOrders reads auth token from Supabase session — no userId arg needed
      const data = await getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useRegisterRefresh(fetchOrders);

  const handleReorder = async (order) => {
    let addedCount = 0;
    let unavailableCount = 0;

    for (const item of order.items) {
      // Real Supabase items have product_name, price, quantity
      // We add them to cart directly using the snapshot data
      if (item && (item.name || item.product_name) && item.quantity > 0) {
        const cartProduct = {
          id:    item.productId || item.product_id,
          name:  item.name     || item.product_name,
          price: item.price    || item.product_price,
          // image may not be stored — use placeholder
          image: item.image || `https://placehold.co/60x60/FFF8F4/B22222?text=${encodeURIComponent((item.name || item.product_name || 'P').slice(0, 2))}`,
        };
        onAddToCartRaw(cartProduct, item.quantity);
        addedCount++;
      } else {
        unavailableCount++;
      }
    }

    if (addedCount > 0 && unavailableCount === 0) {
      setReorderStatus({ type: 'success', message: `All items from Order #${order.id} added to cart.` });
    } else if (addedCount > 0 && unavailableCount > 0) {
      setReorderStatus({ type: 'partial', message: `Available items from Order #${order.id} added to cart. Some items unavailable.` });
    } else if (addedCount === 0 && unavailableCount > 0) {
      setReorderStatus({ type: 'error', message: `All items from Order #${order.id} are currently unavailable.` });
    }
    
    setTimeout(() => setReorderStatus(null), 4000);
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <div className="account-page-root" style={{
      minHeight: '100vh',
      background: '#FFF8F4',
      paddingTop: '64px', // account for global navbar
    }}>
      <div 
        id="account-layout"
        data-has-sidebar="true"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Sidebar */}
        {!isMobile && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <AccountSidebar user={user} onSignOut={signOut} />
          </motion.div>
        )}

        {/* Main Content */}
        <div className="account-content-area" style={{ padding: isMobile ? '16px' : 'clamp(24px, 4vw, 40px)', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Mobile Sidebar Navigation (Compact) */}
          {isMobile && (
            <div style={{ marginBottom: '32px' }}>
              <AccountSidebar user={user} onSignOut={signOut} isMobile={true} />
            </div>
          )}

          <motion.div
            variants={containerVariants}
            initial={shouldReduce ? false : "hidden"}
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontFamily: "'Literata', Georgia, serif",
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 600,
                color: '#1C1007',
                marginBottom: '8px',
                marginTop: 0
              }}>
                My Orders
              </h1>
              <p style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: '15px',
                color: '#5D4037',
                margin: 0
              }}>
                Track, manage, and reorder your favorite home-style meals.
              </p>
            </motion.div>

            {/* Notification */}
            {reorderStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: reorderStatus.type === 'error' ? 'rgba(178, 34, 34, 0.08)' : 'rgba(47, 139, 87, 0.08)',
                  color: reorderStatus.type === 'error' ? '#B22222' : '#2F8B57',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <PackageOpen size={16} />
                {reorderStatus.message}
              </motion.div>
            )}

            {/* Orders List */}
            {isLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#5D4037', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <motion.div variants={itemVariants} style={{
                background: '#FFF',
                border: '1px solid rgba(93, 64, 55, 0.1)',
                borderRadius: '12px',
                padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ color: '#A8816A' }}>
                  <PackageOpen size={48} strokeWidth={1.5} />
                </div>
                <h3 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1C1007',
                  margin: 0
                }}>
                  No orders yet
                </h3>
                <p style={{
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '15px',
                  color: '#5D4037',
                  margin: 0,
                  maxWidth: '300px'
                }}>
                  Your next comforting meal is just a few clicks away.
                </p>
                <button
                  onClick={() => navigate('/shop')}
                  style={{
                    marginTop: '8px',
                    padding: '12px 24px',
                    background: '#B22222',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '24px',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}
                >
                  Shop Premixes
                </button>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order) => (
                  <motion.div key={order.id} variants={itemVariants}>
                    <OrderCard order={order} onReorder={handleReorder} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Maa's Tip */}
            {!isLoading && orders.length > 0 && (
              <motion.div variants={itemVariants} style={{ marginTop: '40px' }}>
                {/* Note: The user requested a specific tip for this page, but also said "If a reusable MaaTip component already exists: REUSE IT. Do not create a duplicate." 
                    Our existing MaaTip does not accept props, it has hardcoded text. 
                    I'll modify MaaTip to accept `children` or `text` prop to reuse it. */}
                <MaaTip>
                  Keep your favorite staples like Dal Makhani and Basmati Rice on regular reorder. It saves time on busy weeknights, ensuring a warm, home-cooked meal is always just a few minutes away.
                </MaaTip>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
