import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById } from '../../services/orderService';
import { useRegisterRefresh } from '../../context/RefreshContext';
import AccountSidebar from '../../components/account/AccountSidebar';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderItem from '../../components/orders/OrderItem';
import OrderSummary from '../../components/orders/OrderSummary';
import { ChevronLeft, ShoppingBag, MapPin, PackageX } from 'lucide-react';

export default function OrderDetails({ onAddToCartRaw }) {
  const { orderId } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reorderStatus, setReorderStatus] = useState(null); // { type: 'success' | 'partial', message: '' }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(false);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Order not found or fetch error", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const refreshOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Order refresh failed", err);
    }
  }, [orderId]);
  useRegisterRefresh(refreshOrder);

  const handleReorder = async () => {
    if (!order) return;
    
    let addedCount = 0;
    let unavailableCount = 0;

    for (const item of order.items) {
      // Check availability in existing product catalog
      const productData = findProductBySlug(item.productId);
      if (productData) {
        onAddToCartRaw(productData, item.quantity);
        addedCount++;
      } else {
        unavailableCount++;
      }
    }

    if (addedCount > 0 && unavailableCount === 0) {
      setReorderStatus({ type: 'success', message: 'All available items have been added to your cart.' });
    } else if (addedCount > 0 && unavailableCount > 0) {
      setReorderStatus({ type: 'partial', message: 'Available items were added to your cart. Some items are currently unavailable.' });
    } else if (addedCount === 0 && unavailableCount > 0) {
      setReorderStatus({ type: 'error', message: 'All items from this order are currently unavailable.' });
    }
    
    setTimeout(() => setReorderStatus(null), 4000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  // -------------------------------------------------------------
  // NOT FOUND STATE
  // -------------------------------------------------------------
  if (error) {
    return (
      <div className="account-page-root" style={{ minHeight: '100vh', background: '#FFF8F4', paddingTop: '64px' }}>
        <div id="account-layout" data-has-sidebar="true" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', minHeight: 'calc(100vh - 64px)' }}>
          {!isMobile && (
            <motion.div initial={shouldReduce ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
              <AccountSidebar user={user} onSignOut={signOut} />
            </motion.div>
          )}
          <div className="account-content-area" style={{ padding: isMobile ? '16px' : 'clamp(24px, 4vw, 40px)', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
            {isMobile && <div style={{ marginBottom: '32px' }}><AccountSidebar user={user} onSignOut={signOut} isMobile={true} /></div>}
            
            <div style={{ background: '#FFF', borderRadius: '12px', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <PackageX size={48} color="#A8816A" strokeWidth={1.5} />
              <h3 style={{ fontFamily: "'Literata', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#1C1007', margin: 0 }}>Order not found</h3>
              <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '15px', color: '#5D4037', margin: 0 }}>We couldn't find the order you're looking for.</p>
              <button onClick={() => navigate('/orders')} style={{ padding: '12px 24px', background: '#B22222', color: '#FFF', border: 'none', borderRadius: '24px', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', marginTop: '8px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'} onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}>
                Back to My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------------
  if (isLoading || !order) {
    return (
      <div className="account-page-root" style={{ minHeight: '100vh', background: '#FFF8F4', paddingTop: '64px' }}>
        <div id="account-layout" data-has-sidebar="true" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', minHeight: 'calc(100vh - 64px)' }}>
          {!isMobile && (
            <motion.div initial={shouldReduce ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
              <AccountSidebar user={user} onSignOut={signOut} />
            </motion.div>
          )}
          <div className="account-content-area" style={{ padding: isMobile ? '16px' : 'clamp(24px, 4vw, 40px)', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
            {isMobile && <div style={{ marginBottom: '32px' }}><AccountSidebar user={user} onSignOut={signOut} isMobile={true} /></div>}
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#5D4037', fontFamily: "'Be Vietnam Pro', sans-serif" }}>Loading details...</div>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="account-page-root" style={{
      minHeight: '100vh',
      background: '#FFF8F4',
      paddingTop: '64px',
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
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => navigate('/orders')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#5D4037',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '24px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#B22222'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5D4037'}
              >
                <ChevronLeft size={16} />
                Back to Orders
              </button>
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
                <ShoppingBag size={16} />
                {reorderStatus.message}
              </motion.div>
            )}

            <motion.div variants={itemVariants} style={{
              background: '#FFF',
              borderRadius: '12px',
              border: '1px solid rgba(93, 64, 55, 0.1)',
              overflow: 'hidden'
            }}>
              
              {/* Header */}
              <div style={{
                background: '#FFFDF5',
                padding: isMobile ? 'clamp(16px, 4vw, 24px)' : '32px 24px',
                borderBottom: '1px solid rgba(93, 64, 55, 0.1)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '16px'
              }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{
                    fontFamily: "'Literata', Georgia, serif",
                    fontSize: 'clamp(20px, 3vw, 24px)',
                    fontWeight: 700,
                    color: '#1C1007',
                    margin: '0 0 12px 0'
                  }}>
                    Order #{order.id}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <OrderStatusBadge status={order.status} />
                    <span style={{ color: 'rgba(93, 64, 55, 0.4)' }}>•</span>
                    <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#5D4037' }}>
                      Placed on {formattedDate}
                    </span>
                    {order.expectedDelivery && (
                      <>
                        <span style={{ color: 'rgba(93, 64, 55, 0.4)' }}>•</span>
                        <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: '#5D4037' }}>
                          {order.expectedDelivery}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="order-detail-header-actions">
                  <button
                    onClick={() => navigate(`/account/orders/${order.id}/track`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      color: '#1C1007',
                      border: '1px solid #5D4037',
                      padding: '12px 20px',
                      borderRadius: '24px',
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(93, 64, 55, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={16} />
                    Track Order
                  </button>
                  {order.status === 'delivered' && (
                    <button
                      onClick={handleReorder}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#B22222',
                        color: '#FFF',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '24px',
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}
                    >
                      <ShoppingBag size={16} />
                      Reorder
                    </button>
                  )}
                  {order.status === 'in-transit' && (
                    <>
                      <button
                        onClick={handleReorder}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#B22222',
                          color: '#FFF',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '24px',
                          fontFamily: "'Be Vietnam Pro', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#8B1A1A'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#B22222'}
                      >
                        <ShoppingBag size={16} />
                        Reorder
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: isMobile ? 'clamp(16px, 4vw, 24px)' : '24px' }}>
                <h2 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1C1007',
                  marginBottom: '16px',
                  marginTop: 0
                }}>
                  Items
                </h2>

                <div>
                  {order.items.map((item, index) => (
                    <OrderItem key={index} item={item} />
                  ))}
                </div>

                <OrderSummary order={order} />
              </div>
              
              {/* Delivery Info Section */}
              <div style={{ padding: isMobile ? '0 clamp(16px, 4vw, 24px) clamp(24px, 4vw, 32px)' : '0 24px 32px 24px' }}>
                <h2 style={{
                  fontFamily: "'Literata', Georgia, serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1C1007',
                  marginBottom: '16px',
                  marginTop: '16px'
                }}>
                  Delivery Information
                </h2>
                
                <div style={{
                  background: 'rgba(93, 64, 55, 0.03)',
                  padding: 'clamp(16px, 3vw, 20px)',
                  borderRadius: '8px',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: '14px',
                  color: '#5D4037',
                  lineHeight: 1.6
                }}>
                  {order.deliveryAddress ? (
                    <>
                      <div style={{ fontWeight: 600, color: '#1C1007', marginBottom: '4px' }}>{order.deliveryAddress.name}</div>
                      <div>{order.deliveryAddress.address}</div>
                      <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pin}</div>
                      <div style={{ marginTop: '8px' }}>Phone: {order.deliveryAddress.phone}</div>
                    </>
                  ) : (
                    <div>Delivery information will be available here.</div>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
