import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, Circle, PackageX, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById } from '../../services/orderService';
import { useRegisterRefresh } from '../../context/RefreshContext';
import AccountSidebar from '../../components/account/AccountSidebar';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import './OrderTracking.css';

const TRACKING_STAGES = [
  {
    key: 'placed',
    title: 'Order Placed',
    description: 'Your order has been placed successfully.',
  },
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and is being prepared.',
  },
  {
    key: 'shipped',
    title: 'Shipped',
    description: 'Your order has been handed over for delivery.',
  },
  {
    key: 'out-for-delivery',
    title: 'Out for Delivery',
    description: 'Your order is on the way to you.',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Your order has been delivered successfully.',
  },
];

const STATUS_STAGE_INDEX = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  delivered: 4,
};

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function formatOrderRef(id) {
  const code = String(id || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
  return code ? `#ORD-${code}` : '';
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function paymentMethodLabel(method) {
  if (!method) return 'Not available';
  if (method.toLowerCase() === 'cod') return 'Cash on Delivery';
  return method.toUpperCase();
}

function DetailRow({ label, value, strong = false }) {
  return (
    <div className="tracking-detail-row">
      <span>{label}</span>
      <strong className={strong ? 'tracking-detail-total' : ''}>{value}</strong>
    </div>
  );
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrder(showLoading = false) {
      try {
        if (showLoading) {
          setIsLoading(true);
          setError('');
        }
        const fetchedOrder = await getOrderById(orderId);
        if (!cancelled) {
          setOrder(fetchedOrder);
          setError('');
        }
      } catch (loadError) {
        console.error('[OrderTracking] Failed to load order:', loadError);
        if (!cancelled && showLoading) setError('This order could not be found.');
      } finally {
        if (!cancelled && showLoading) setIsLoading(false);
      }
    }

    if (!orderId) return undefined;

    loadOrder(true);
    const refreshInterval = window.setInterval(() => loadOrder(), 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadOrder();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [orderId]);

  const refreshOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const fetchedOrder = await getOrderById(orderId);
      setOrder(fetchedOrder);
    } catch (loadError) {
      console.error('[OrderTracking] refresh failed:', loadError);
    }
  }, [orderId]);
  useRegisterRefresh(refreshOrder);

  const isCancelled = order?.status === 'cancelled';
  const currentStageIndex = STATUS_STAGE_INDEX[order?.status] ?? 0;
  const stages = isCancelled
    ? [
        TRACKING_STAGES[0],
        TRACKING_STAGES[1],
        {
          key: 'cancelled',
          title: 'Cancelled',
          description: 'Your order has been cancelled.',
        },
      ]
    : TRACKING_STAGES;

  const timestampForStage = (stage, index) => {
    if (stage.key === 'placed') return formatDateTime(order.createdAt);
    if (stage.key === 'cancelled') return formatDateTime(order.updatedAt);
    if (index === currentStageIndex && currentStageIndex > 0) {
      return formatDateTime(order.updatedAt);
    }
    return '';
  };

  const stageIsComplete = (index) => isCancelled ? index < 2 : index <= currentStageIndex;

  return (
    <div className="tracking-page">
      <div className="tracking-account-layout" data-has-sidebar="true">
        <div className="tracking-desktop-sidebar">
          <AccountSidebar user={user} onSignOut={signOut} />
        </div>

        <main className="tracking-main">
          <div className="tracking-mobile-sidebar">
            <AccountSidebar user={user} onSignOut={signOut} isMobile />
          </div>

          <button className="tracking-back" onClick={() => navigate('/orders')}>
            <ChevronLeft size={17} /> Back to Orders
          </button>

          {isLoading ? (
            <div className="tracking-state">Loading your order...</div>
          ) : error || !order ? (
            <div className="tracking-state tracking-error-state">
              <PackageX size={44} strokeWidth={1.5} />
              <h1>Order not found</h1>
              <p>{error}</p>
              <button onClick={() => navigate('/orders')}>Back to My Orders</button>
            </div>
          ) : (
            <motion.div
              className="tracking-content"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <header className="tracking-header">
                <div>
                  <p className="tracking-eyebrow">Order tracking</p>
                  <h1>Track Your Order</h1>
                  <p className="tracking-order-ref">{formatOrderRef(order.id)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </header>

              <section className="tracking-meta" aria-label="Order information">
                <DetailRow label="Order ID" value={formatOrderRef(order.id)} />
                <DetailRow label="Order date" value={formatDateTime(order.createdAt)} />
                <DetailRow label="Current status" value={order.status.replace(/-/g, ' ')} />
                <DetailRow label="Payment method" value={paymentMethodLabel(order.paymentMethod)} />
                <DetailRow label="Total amount" value={formatPrice(order.total)} strong />
              </section>

              {isCancelled && (
                <div className="tracking-cancelled-banner">
                  <X size={18} /> Your order has been cancelled.
                </div>
              )}

              <div className="tracking-body-grid">
                <section className="tracking-panel tracking-timeline-panel">
                  <h2>Order Status</h2>
                  <div className="tracking-timeline">
                    {stages.map((stage, index) => {
                      const complete = stageIsComplete(index);
                      const cancelledStage = stage.key === 'cancelled';
                      const timestamp = timestampForStage(stage, index);

                      return (
                        <div
                          className={`tracking-stage${complete ? ' is-complete' : ''}${cancelledStage ? ' is-cancelled' : ''}`}
                          key={stage.key}
                        >
                          <div className="tracking-stage-marker" aria-hidden="true">
                            {cancelledStage ? <X size={17} /> : complete ? <Check size={17} /> : <Circle size={14} />}
                          </div>
                          <div className="tracking-stage-copy">
                            <h3>{stage.title}</h3>
                            <p>{stage.description}</p>
                            {timestamp && <time>{timestamp}</time>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="tracking-details-column">
                  <section className="tracking-panel">
                    <h2>Order Summary</h2>
                    <div className="tracking-items">
                      {order.items.map((item) => (
                        <div className="tracking-item" key={`${item.productId}-${item.name}`}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>Qty: {item.quantity} × {formatPrice(item.price)}</span>
                          </div>
                          <strong>{formatPrice(item.subtotal ?? item.price * item.quantity)}</strong>
                        </div>
                      ))}
                    </div>
                    <DetailRow label="Total" value={formatPrice(order.total)} strong />
                  </section>

                  <section className="tracking-panel">
                    <h2>Delivery Address</h2>
                    {order.deliveryAddress ? (
                      <address className="tracking-address">
                        <strong>{order.deliveryAddress.name}</strong>
                        <span>{order.deliveryAddress.phone}</span>
                        <span>{order.deliveryAddress.address}</span>
                        <span>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pin}</span>
                      </address>
                    ) : (
                      <p className="tracking-muted">Delivery address is not available.</p>
                    )}
                  </section>

                  <section className="tracking-panel">
                    <h2>Payment</h2>
                    <DetailRow label="Method" value={paymentMethodLabel(order.paymentMethod)} />
                    <DetailRow label="Status" value={order.paymentStatus || 'Not available'} />
                    <DetailRow label="Total amount" value={formatPrice(order.total)} strong />
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
