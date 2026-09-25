import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Plus, Minus, MapPin, Truck, CreditCard, CheckCircle, Package, Lightbulb, Edit2, Ticket, Gift, ChevronDown, ChevronUp, ChevronRight, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAddresses, addAddress, updateAddress } from '../../services/addressService';
import { getPaymentMethods } from '../../services/paymentService';
import { placeOrder, createRazorpayOrder } from '../../services/orderService';
import { getAvailableCoupons } from '../../services/couponService';
import AddressForm from '../../components/addresses/AddressForm';
import CouponCelebration from '../../components/common/CouponCelebration';
import supabase from '../../lib/supabase';
import { calculateShippingCharge, calculateOrderTotal } from '../../utils/pricing';
import './CheckoutPage.css';

const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/* Track which steps the user has reached (so they can go back but not skip ahead) */

export default function CheckoutPage({ cartItems = [], subtotal = 0, updateQuantity, clearCart, coupon }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [error, setError] = useState(null);

  /* ── Step state (1 = address, 2 = delivery, 3 = payment) ── */
  const [currentStep, setCurrentStep] = useState(1);

  /* ── Highest step reached — user can click back to any step up to this ── */
  const [highestStep, setHighestStep] = useState(1);

  /* ── Delivery state ── */
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  /* ── Payment state ── */
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi' | 'cod'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cvv, setCvv] = useState('');
  const [billingMatchesDelivery, setBillingMatchesDelivery] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  /* ── Coupon / Offers state (checkout-side) ── */
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [availableOffers, setAvailableOffers] = useState([]);
  const [celebration, setCelebration] = useState({ show: false, amount: 0 });

  /* ── Refs for each step section ── */
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const stepRefs = { 1: step1Ref, 2: step2Ref, 3: step3Ref };

  /* ── Cached Razorpay Checkout script loader (loaded lazily, once) ── */
  const razorpayScriptRef = useRef(null);

  // Cart calculations — same shipping rule + total formula as the Cart page,
  // so both pages always show identical numbers for the same cart/coupon state.
  const codFee = paymentMethod === 'cod' ? 40 : 0;
  const standardDeliveryCost = calculateShippingCharge(subtotal, 'standard');
  const deliveryCost = calculateShippingCharge(subtotal, deliveryMethod);
  const appliedCoupon = coupon?.appliedCoupon || null;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = calculateOrderTotal({ subtotal, shipping: deliveryCost, discount: discountAmount, extraFees: codFee });

  // Selected address object
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  // Load real "Available offers" from the coupons table (RLS-gated). If nothing
  // is readable the list stays empty and the offers UI is simply hidden — we
  // never fabricate offers.
  useEffect(() => {
    let active = true;
    getAvailableCoupons()
      .then((offers) => { if (active) setAvailableOffers(offers || []); })
      .catch(() => { if (active) setAvailableOffers([]); });
    return () => { active = false; };
  }, [user]);

  // Revalidate cart against latest DB stock
  useEffect(() => {
    const validateCart = async () => {
      if (!cartItems || cartItems.length === 0) return;
      
      try {
        const productIds = cartItems.map(item => item.id);
        const { data: products, error: fetchErr } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .in('id', productIds);

        if (fetchErr) throw fetchErr;

        let cartChanged = false;
        const messages = [];

        for (const cartItem of cartItems) {
          const dbProduct = products?.find(p => p.id === cartItem.id);
          if (dbProduct) {
            if (cartItem.quantity > dbProduct.stock_quantity) {
              cartChanged = true;
              messages.push(`${cartItem.name} only has ${dbProduct.stock_quantity} available.`);
              if (updateQuantity) {
                updateQuantity(cartItem.id, dbProduct.stock_quantity);
              }
            }
          }
        }

        if (cartChanged) {
          setError(`Your cart has been updated based on available stock:\n${messages.join('\n')}`);
        }
      } catch (err) {
        console.error('Failed to validate cart stock:', err);
      }
    };

    validateCart();
  }, [cartItems.length]); // Intentionally not dependent on cartItems to avoid infinite loops when updating quantities

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const data = await getAddresses(user.id);
      
      setAddresses(data || []);
      
      // Auto-select default address
      if (data && data.length > 0 && !selectedAddressId) {
        const defaultAddr = data.find(a => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else setSelectedAddressId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (formData) => {
    try {
      const savedAddress = editingAddress
        ? await updateAddress(user.id, editingAddress.id, formData)
        : await addAddress(user.id, formData);

      // If the new/updated address is set as default, we might need to update others, 
      // but for this task we just refetch the list
      await fetchAddresses(); 
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);
      setEditingAddress(null);
      setError(null);
    } catch (err) {
      console.error('Error saving address:', err);
      alert(editingAddress ? 'Failed to update address. Please try again.' : 'Failed to save address. Please try again.');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  /* ── Smooth-scroll to a step section once its open/collapse animation has
     settled, keeping the heading clear of the sticky checkout header ── */
  const STICKY_HEADER_OFFSET = 90;
  const STEP_ANIMATION_MS = 480; // matches the longest step transition (0.45s enter / 0.4s collapse)

  const scrollToStep = (step) => {
    const ref = stepRefs[step];
    if (ref?.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - STICKY_HEADER_OFFSET;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  /* ── Navigate to a step (smooth scroll + state) ── */
  const goToStep = (step) => {
    if (step > highestStep) return; // Can't skip ahead
    setCurrentStep(step);
    // Smooth scroll to the target section after animation settles
    setTimeout(() => scrollToStep(step), STEP_ANIMATION_MS);
  };

  const handleContinueToDelivery = () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address to continue.');
      return;
    }
    setError(null);
    const next = 2;
    setCurrentStep(next);
    setHighestStep(prev => Math.max(prev, next));

    // Smooth scroll to delivery section after animation settles
    setTimeout(() => scrollToStep(next), STEP_ANIMATION_MS);
  };

  const handleContinueToPayment = () => {
    const next = 3;
    setCurrentStep(next);
    setHighestStep(prev => Math.max(prev, next));

    // Load saved payment methods
    if (user) {
      getPaymentMethods(user.id).then(data => {
        setSavedCards(data.cards || []);
        if (data.cards?.length > 0) {
          const defaultCard = data.cards.find(c => c.isDefault);
          setSelectedCardId(defaultCard?.id || data.cards[0].id);
        }
      }).catch(err => console.error('Error loading payment methods:', err));
    }

    // Smooth scroll to payment section after animation settles
    setTimeout(() => scrollToStep(next), STEP_ANIMATION_MS);
  };

  /* ── Razorpay Payment Handler ── */
  // Lazily loads (and caches) the Razorpay Checkout script. The script exposes
  // a global `window.Razorpay` constructor. The public Key ID is supplied by
  // the backend create-order response — no secret is ever used in the browser.
  const loadRazorpayCheckout = async () => {
    if (window.Razorpay) return true;
    if (razorpayScriptRef.current) return razorpayScriptRef.current;

    razorpayScriptRef.current = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptRef.current = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
    return razorpayScriptRef.current;
  };

  // Supabase's query builder is thenable but has no .catch(); wrap in try/catch
  // so a release failure never throws an uncaught error out of the caller.
  const releaseReservation = async (sessionId) => {
    try {
      await supabase.rpc('release_checkout_reservations', { p_session_id: sessionId });
    } catch (err) {
      console.error('[Checkout] Failed to release reservation:', err);
    }
  };

  const handlePayAndPlaceOrder = async () => {
    if (currentStep !== 3) return;

    if (!user) {
      setError('Please sign in to complete your order.');
      return;
    }

    // 1. Prepare reservation items from the cart
    const p_items = cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }));
    
    // Unique session ID for this checkout attempt
    const sessionId = 'chk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    setIsProcessingPayment(true);
    setError(null);

    // 2. ATOMIC INVENTORY RESERVATION (Database validates stock)
    // Wrapped in try/catch so an unexpected/network-level throw (not just a
    // Supabase-returned error) can't leave the UI stuck on "Processing" forever.
    let reserveError;
    try {
      const result = await supabase.rpc('reserve_checkout_inventory', {
        p_items,
        p_session_id: sessionId,
        p_customer_id: user.id
      });
      reserveError = result.error;
    } catch (err) {
      reserveError = err;
    }

    if (reserveError) {
      console.error('[Checkout] Reservation failed:', reserveError);
      setError(reserveError.message || 'Insufficient stock for one or more items.');
      setIsProcessingPayment(false);
      return;
    }

    // Cart items for the backend (only product_id + quantity — backend validates prices)
    const backendCartItems = cartItems.map(item => ({
      product_id: item.id,
      quantity:   item.quantity,
    }));

    // Base order payload (backend ignores price/total from frontend)
    const baseOrderPayload = {
      cartItems:       backendCartItems,
      deliveryMethod,
      paymentMethod,
      shippingAddress: selectedAddress,
      sessionId,
      notes:           null,
      couponCode:      appliedCoupon?.code || undefined,
    };

    // ── COD FLOW ─────────────────────────────────────────────────────────────
    if (paymentMethod === 'cod') {
      try {
        const result = await placeOrder(baseOrderPayload);

        // Order confirmed & inventory consumed — safe to clear the cart now.
        clearCart?.();
        coupon?.removeCoupon();
        setIsProcessingPayment(false);
        navigate(`/order-success/${result.order.id}`, {
          state: {
            paymentMethod: 'cod',
            deliveryMethod,
          }
        });
      } catch (err) {
        console.error('[Checkout] COD order failed:', err);
        setError(err.message || 'Order placement failed. Please try again.');
        // Release reservation on failure
        await releaseReservation(sessionId);
        setIsProcessingPayment(false);
      }
      return;
    }

    // ── ONLINE PAYMENT (Razorpay) FLOW ────────────────────────────────────────
    // Create the Razorpay order on the backend (server calculates the real amount)
    let rzpOrderData, rzpKeyId, isMock;
    try {
      const rzpResult = await createRazorpayOrder(total, {
        customerName:  selectedAddress?.fullName || user?.user_metadata?.full_name || undefined,
        customerPhone: selectedAddress?.phone || undefined,
      });
      rzpOrderData = rzpResult.order;
      rzpKeyId     = rzpResult.keyId;
      isMock       = rzpResult.mock;
    } catch (err) {
      console.error('[Checkout] Razorpay order creation failed:', err);
      setError(err.message || 'Could not initiate payment. Please try again.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
      return;
    }

    // Confirms the order with the backend, which independently re-verifies the
    // Razorpay payment signature and status before ever marking anything as paid
    // — a completed checkout handler alone is never trusted as proof of payment.
    const confirmRazorpayOrder = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
      try {
        const result = await placeOrder({
          ...baseOrderPayload,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        });

        // Payment verified & order confirmed — safe to clear the cart now.
        clearCart?.();
        coupon?.removeCoupon();
        setIsProcessingPayment(false);
        navigate(`/order-success/${result.order.id}`, {
          state: {
            paymentMethod,
            deliveryMethod,
          }
        });
      } catch (err) {
        console.error('[Checkout] Order confirmation failed after payment:', err);
        setError(
          "Payment received, but we couldn't complete your order confirmation. " +
          "Please don't make another payment — we're checking your order. " +
          'Reference: ' + razorpayOrderId
        );
        setIsProcessingPayment(false);
      }
    };

    // Mock flow when Razorpay isn't configured on the backend (dev only)
    if (isMock) {
      console.log('[Checkout] Mock payment flow — confirming directly with backend...');
      await confirmRazorpayOrder({ razorpayOrderId: rzpOrderData.id });
      return;
    }

    // Load the Razorpay Checkout script (global window.Razorpay)
    const scriptLoaded = await loadRazorpayCheckout();
    if (!scriptLoaded || !window.Razorpay) {
      setError('Failed to load payment gateway. Please check your internet connection.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
      return;
    }

    try {
      const rzp = new window.Razorpay({
        key:      rzpKeyId,
        order_id: rzpOrderData.id,
        amount:   rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name:     'ANNPURNA',
        prefill: {
          name:    selectedAddress?.fullName || user?.user_metadata?.full_name || undefined,
          email:   user?.email || undefined,
          contact: selectedAddress?.phone || undefined,
        },
        // Payment attempt completed — the backend verifies the real status with
        // Razorpay before confirming the order.
        handler: async (response) => {
          console.log('[Checkout] Razorpay payment completed — confirming with backend...');
          await confirmRazorpayOrder({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          // The customer dismissed the checkout without completing payment.
          ondismiss: async () => {
            console.log('[Checkout] Razorpay checkout closed — releasing reservation...');
            await releaseReservation(sessionId);
            setIsProcessingPayment(false);
          },
        },
      });

      // A payment attempt failed before completion — surface the error and
      // release the reservation so the customer can retry.
      rzp.on('payment.failed', async (response) => {
        console.error('[Checkout] Razorpay payment failed:', response?.error);
        setError(response?.error?.description || 'Payment failed. Please try again.');
        await releaseReservation(sessionId);
        setIsProcessingPayment(false);
      });

      rzp.open();
    } catch (err) {
      console.error('[Checkout] Razorpay checkout error:', err);
      setError('Payment could not be initiated. Please try again.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
    }
  };

  /* ── Coupon handlers (checkout-side) — reuse the shared useCoupon hook so a
     coupon applied here or in the Cart stays in sync (localStorage-backed).
     All validation/discount math is enforced server-side. ── */
  const handleApplyCoupon = async (codeArg) => {
    if (!coupon) return;
    const code = (codeArg ?? couponInput);
    if (!code || !code.trim()) return;
    // Never re-apply the coupon that's already active.
    if (appliedCoupon && appliedCoupon.code?.toUpperCase() === code.trim().toUpperCase()) {
      setCouponInput('');
      return;
    }
    const result = await coupon.applyCoupon(code, subtotal);
    if (result.success) {
      setCouponInput('');
      setCelebration({ show: true, amount: result.result?.discountAmount || 0 });
    }
  };

  const handleRemoveCoupon = () => {
    coupon?.removeCoupon();
    setCouponInput('');
  };

  /* ── Single sticky CTA: drives the progressive flow, then pays.
     It can never trigger payment before the payment step is reached. ── */
  const handleStickyCTA = () => {
    if (cartItems.length === 0) return;
    if (currentStep === 1) return handleContinueToDelivery();
    if (currentStep === 2) return handleContinueToPayment();
    return handlePayAndPlaceOrder();
  };

  const stickyCtaLabel = isProcessingPayment
    ? 'Processing…'
    : currentStep < 3
      ? 'Continue'
      : 'Proceed to Pay';

  const deliveryLabel = deliveryMethod === 'standard' ? 'Standard Delivery' : 'Express Delivery';
  const deliveryEta = deliveryMethod === 'standard' ? '3–5 business days' : '1–2 business days';
  const paymentLabel = paymentMethod === 'card' ? 'Saved Credit Card'
    : paymentMethod === 'upi' ? 'UPI'
    : 'Cash on Delivery';

  const formatOfferLine = (c) => {
    const value = c.discount_type === 'percent' || c.discount_type === 'percentage'
      ? `${Number(c.discount_value)}% off`
      : `${formatPrice(c.discount_value)} off`;
    const min = c.minimum_order_amount ? ` on orders above ${formatPrice(c.minimum_order_amount)}` : '';
    return c.description || `Get ${value}${min}`;
  };

  const expand = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.24, ease: [0.55, 0.06, 0.68, 0.19] } },
  };

  return (
    <div className="apx-checkout">
      <CouponCelebration
        show={celebration.show}
        amount={celebration.amount}
        onDone={() => setCelebration({ show: false, amount: 0 })}
      />

      {/* ── Page header ── */}
      <header className="apx-header">
        <button type="button" className="apx-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="apx-title">Checkout</h1>
        <div className="apx-secure"><Lock size={13} /> Secure</div>
      </header>

      <div className="apx-body">

        {error && <div className="apx-alert" role="alert">{error}</div>}

        {/* ═══════════ DELIVERY ADDRESS ═══════════ */}
        <section
          ref={step1Ref}
          className={`apx-card ${currentStep === 1 ? 'is-active' : ''} ${currentStep > 1 ? 'is-done' : ''}`}
        >
          <div className="apx-card-head">
            <span className="apx-ic">
              {currentStep > 1 ? <CheckCircle size={18} /> : <MapPin size={18} />}
            </span>
            <div className="apx-head-txt">
              <h2 className="apx-card-title">Delivery Address</h2>
              {currentStep > 1 && selectedAddress && (
                <p className="apx-card-sub">
                  {(selectedAddress.label || 'Home')} · {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                </p>
              )}
              {currentStep === 1 && addresses.length === 0 && !showAddressForm && !isLoadingAddresses && (
                <p className="apx-card-sub">Add where we should deliver</p>
              )}
            </div>
            {currentStep > 1 && (
              <button type="button" className="apx-change" onClick={() => goToStep(1)}>
                Change <ChevronDown size={15} />
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {currentStep === 1 && (
              <motion.div
                key="addr-body"
                className="apx-card-body"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {isLoadingAddresses ? (
                  <div className="apx-loading">Loading addresses…</div>
                ) : showAddressForm ? (
                  <div className="apx-addr-form">
                    <AddressForm
                      initialData={editingAddress}
                      onSave={handleSaveAddress}
                      onCancel={handleCancelAddressForm}
                    />
                  </div>
                ) : addresses.length === 0 ? (
                  <button
                    type="button"
                    className="apx-add-address"
                    onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                  >
                    <Plus size={18} /> Add Address
                  </button>
                ) : (
                  <>
                    <div className="apx-addr-list">
                      {addresses.map((address) => {
                        const isSel = selectedAddressId === address.id;
                        return (
                          <div
                            key={address.id}
                            className={`apx-addr ${isSel ? 'selected' : ''}`}
                            onClick={() => { setSelectedAddressId(address.id); setError(null); }}
                          >
                            <span className="apx-addr-radio"><span className="apx-radio-dot" /></span>
                            <div className="apx-addr-info">
                              <div className="apx-addr-toprow">
                                <span className="apx-addr-badge">{address.label || 'Home'}</span>
                                {isSel && (
                                  <button
                                    type="button"
                                    className="apx-addr-edit"
                                    onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}
                                    aria-label="Edit this address"
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                )}
                              </div>
                              <div className="apx-addr-name">{address.fullName}</div>
                              <div className="apx-addr-line">
                                {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}
                              </div>
                              <div className="apx-addr-line">{address.city}, {address.state} {address.postalCode}</div>
                              <div className="apx-addr-phone">{address.phone}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="apx-add-address ghost"
                      onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                    >
                      <Plus size={16} /> Add New Address
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════ DELIVERY METHOD ═══════════ */}
        <section
          ref={step2Ref}
          className={`apx-card ${currentStep === 2 ? 'is-active' : ''} ${currentStep > 2 ? 'is-done' : ''} ${currentStep < 2 ? 'is-upcoming' : ''}`}
        >
          <div className="apx-card-head">
            <span className="apx-ic">
              {currentStep > 2 ? <CheckCircle size={18} /> : <Truck size={18} />}
            </span>
            <div className="apx-head-txt">
              <h2 className="apx-card-title">Delivery Method</h2>
              {currentStep > 2 && (
                <p className="apx-card-sub">{deliveryLabel} · {deliveryEta}</p>
              )}
              {currentStep < 2 && (
                <p className="apx-card-sub">Choose how you'd like it delivered</p>
              )}
            </div>
            {currentStep > 2 && (
              <div className="apx-head-right">
                <button type="button" className="apx-change" onClick={() => goToStep(2)}>
                  Change <ChevronDown size={15} />
                </button>
                <span className={`apx-head-price ${deliveryCost === 0 ? 'free' : ''}`}>
                  {deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}
                </span>
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {currentStep === 2 && (
              <motion.div
                key="delivery-body"
                className="apx-card-body"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="apx-options">
                  <label className={`apx-option ${deliveryMethod === 'standard' ? 'selected' : ''}`} htmlFor="delivery-standard">
                    <span className="apx-option-radio">
                      <input
                        type="radio"
                        id="delivery-standard"
                        name="deliveryMethod"
                        value="standard"
                        checked={deliveryMethod === 'standard'}
                        onChange={() => setDeliveryMethod('standard')}
                      />
                      <span className="apx-radio-dot" />
                    </span>
                    <span className="apx-option-info">
                      <span className="apx-option-name">Standard Delivery</span>
                      <span className="apx-option-eta">Estimated arrival: 3–5 business days</span>
                    </span>
                    <span className={`apx-option-price ${standardDeliveryCost === 0 ? 'free' : ''}`}>
                      {standardDeliveryCost === 0 ? 'Free' : formatPrice(standardDeliveryCost)}
                    </span>
                  </label>

                  <label className={`apx-option ${deliveryMethod === 'express' ? 'selected' : ''}`} htmlFor="delivery-express">
                    <span className="apx-option-radio">
                      <input
                        type="radio"
                        id="delivery-express"
                        name="deliveryMethod"
                        value="express"
                        checked={deliveryMethod === 'express'}
                        onChange={() => setDeliveryMethod('express')}
                      />
                      <span className="apx-radio-dot" />
                    </span>
                    <span className="apx-option-info">
                      <span className="apx-option-name">Express Delivery</span>
                      <span className="apx-option-eta">Estimated arrival: 1–2 business days</span>
                    </span>
                    <span className="apx-option-price">₹50</span>
                  </label>
                </div>

                <div className="apx-tip">
                  <Lightbulb size={16} className="apx-tip-ic" />
                  <p className="apx-tip-txt">
                    <strong>Maa's Tip:</strong> For delicate items like our Besan Laddoos, Express Delivery keeps them perfectly fresh — just like they came out of the kitchen.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════ APPLY COUPON / OFFERS ═══════════ */}
        <section className={`apx-card apx-coupon ${appliedCoupon ? 'is-done' : ''} ${couponExpanded && !appliedCoupon ? 'is-active' : ''}`}>
          <div
            className={`apx-card-head ${!appliedCoupon ? 'clickable' : ''}`}
            onClick={() => { if (!appliedCoupon) setCouponExpanded((v) => !v); }}
          >
            <span className="apx-ic">
              {appliedCoupon ? <CheckCircle size={18} /> : <Ticket size={18} />}
            </span>
            <div className="apx-head-txt">
              <h2 className="apx-card-title">{appliedCoupon ? 'Coupon Applied' : 'Apply Coupon'}</h2>
              <p className="apx-card-sub">
                {appliedCoupon ? `${appliedCoupon.code} applied` : 'Have a coupon?'}
              </p>
            </div>
            {appliedCoupon ? (
              <button
                type="button"
                className="apx-change danger"
                onClick={(e) => { e.stopPropagation(); handleRemoveCoupon(); }}
              >
                Remove
              </button>
            ) : (
              <span className="apx-change as-toggle">
                Apply {couponExpanded ? <ChevronUp size={15} /> : <ChevronRight size={15} />}
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {appliedCoupon ? (
              <motion.div
                key="coupon-applied"
                className="apx-card-body"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="apx-applied">
                  <div className="apx-applied-left">
                    <Gift size={16} />
                    <span className="apx-applied-code">{appliedCoupon.code}</span>
                  </div>
                  <span className="apx-applied-amt">-{formatPrice(discountAmount)}</span>
                </div>
              </motion.div>
            ) : couponExpanded ? (
              <motion.div
                key="coupon-body"
                className="apx-card-body"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="apx-coupon-input-row">
                  <input
                    type="text"
                    className="apx-coupon-input"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                  />
                  <button
                    type="button"
                    className="apx-coupon-apply"
                    onClick={() => handleApplyCoupon()}
                    disabled={coupon?.applying || !couponInput.trim()}
                  >
                    {coupon?.applying ? 'Applying…' : 'Apply'}
                  </button>
                </div>

                {coupon?.error && <p className="apx-coupon-error">{coupon.error}</p>}

                {availableOffers.length > 0 && (
                  <div className="apx-offers">
                    <h3 className="apx-offers-title">Available offers</h3>
                    {availableOffers.map((offer) => (
                      <div className="apx-offer" key={offer.code}>
                        <span className="apx-offer-ic"><Gift size={16} /></span>
                        <div className="apx-offer-info">
                          <span className="apx-offer-code">{offer.code}</span>
                          <span className="apx-offer-desc">{formatOfferLine(offer)}</span>
                        </div>
                        <button
                          type="button"
                          className="apx-offer-apply"
                          onClick={() => handleApplyCoupon(offer.code)}
                          disabled={coupon?.applying}
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        {/* ═══════════ PAYMENT METHOD ═══════════ */}
        <section
          ref={step3Ref}
          className={`apx-card ${currentStep === 3 ? 'is-active' : ''} ${currentStep < 3 ? 'is-upcoming' : ''}`}
        >
          <div className="apx-card-head">
            <span className="apx-ic"><CreditCard size={18} /></span>
            <div className="apx-head-txt">
              <h2 className="apx-card-title">Payment Method</h2>
              <p className="apx-card-sub">
                {currentStep === 3 ? paymentLabel : 'Select your preferred payment method'}
              </p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {currentStep === 3 && (
              <motion.div
                key="payment-body"
                className="apx-card-body"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="apx-options">
                  {/* Saved Card */}
                  <div className={`apx-option column ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                    <div className="apx-option-top">
                      <span className="apx-option-radio">
                        <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} id="pm-card" />
                        <span className="apx-radio-dot" />
                      </span>
                      <span className="apx-option-name">Saved Credit / Debit Card</span>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="apx-option-detail">
                        {savedCards.length > 0 ? (
                          savedCards.map((card) => (
                            <div
                              key={card.id}
                              className={`apx-card-row ${selectedCardId === card.id ? 'selected' : ''}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedCardId(card.id); }}
                            >
                              <span className="apx-option-radio small">
                                <input type="radio" name="selectedCard" checked={selectedCardId === card.id} onChange={() => setSelectedCardId(card.id)} />
                                <span className="apx-radio-dot" />
                              </span>
                              <span className="apx-card-num">
                                {card.brand === 'mastercard' ? 'SBI' : 'HDFC Bank'} {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="apx-hint">No saved cards. Razorpay will securely collect your card details.</p>
                        )}
                        {savedCards.length > 0 && selectedCardId && (
                          <div className="apx-cvv-row">
                            <input
                              type="password"
                              maxLength="4"
                              placeholder="CVV"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                              className="apx-cvv"
                            />
                            <span className="apx-cvv-hint"><Lock size={12} /> 3 digits on back of card</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* UPI */}
                  <div className={`apx-option column ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMethod('upi')}>
                    <div className="apx-option-top">
                      <span className="apx-option-radio">
                        <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} id="pm-upi" />
                        <span className="apx-radio-dot" />
                      </span>
                      <span className="apx-option-name">UPI (Google Pay, PhonePe, Paytm)</span>
                    </div>
                    {paymentMethod === 'upi' && (
                      <div className="apx-option-detail">
                        <p className="apx-hint">Pay instantly via your UPI app.</p>
                      </div>
                    )}
                  </div>

                  {/* COD */}
                  <div className={`apx-option column ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                    <div className="apx-option-top">
                      <span className="apx-option-radio">
                        <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} id="pm-cod" />
                        <span className="apx-radio-dot" />
                      </span>
                      <span className="apx-option-name">Cash on Delivery</span>
                    </div>
                    {paymentMethod === 'cod' && (
                      <div className="apx-option-detail">
                        <p className="apx-hint">Pay with cash when your order arrives. <span className="apx-hint-sub">(₹40 convenience fee applies)</span></p>
                      </div>
                    )}
                  </div>
                </div>

                <label className="apx-billing">
                  <input type="checkbox" checked={billingMatchesDelivery} onChange={(e) => setBillingMatchesDelivery(e.target.checked)} />
                  <span>My billing address is the same as my delivery address.</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════ ORDER SUMMARY ═══════════ */}
        <section className="apx-card apx-summary">
          <div className="apx-card-head static">
            <span className="apx-ic"><FileText size={18} /></span>
            <div className="apx-head-txt">
              <h2 className="apx-card-title">Order Summary</h2>
            </div>
          </div>

          <div className="apx-card-body open">
            {cartItems.length === 0 ? (
              <p className="apx-empty">Your cart is empty.</p>
            ) : (
              <>
                <div className="apx-sum-items">
                  {cartItems.map((item) => {
                    const compareAt = Number(item.compareAtPrice ?? item.compare_at_price ?? item.originalPrice ?? 0);
                    const hasCompare = compareAt > item.price;
                    const pct = hasCompare ? Math.round(((compareAt - item.price) / compareAt) * 100) : 0;
                    return (
                      <div className="apx-sum-item" key={item.id}>
                        <div className="apx-sum-thumb">
                          {item.image ? <img src={item.image} alt={item.name} /> : <span className="apx-sum-thumb-ph"><Package size={18} /></span>}
                        </div>
                        <div className="apx-sum-item-info">
                          <div className="apx-sum-item-name">{item.name}</div>
                          <div className="apx-sum-item-price">
                            {formatPrice(item.price)}
                            {hasCompare && <span className="apx-sum-compare">{formatPrice(compareAt)}</span>}
                            {hasCompare && <span className="apx-sum-off">{pct}% OFF</span>}
                          </div>
                        </div>
                        <div className="apx-qty">
                          <button
                            type="button"
                            className="apx-qty-btn"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity && updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="apx-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="apx-qty-btn"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity && updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="apx-sum-totals">
                  <div className="apx-sum-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="apx-sum-row discount">
                      <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="apx-sum-row">
                    <span>Delivery Charges{currentStep >= 2 ? ` · ${deliveryLabel}` : ''}</span>
                    <span className={deliveryCost === 0 ? 'free' : ''}>{deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}</span>
                  </div>
                  {codFee > 0 && (
                    <div className="apx-sum-row">
                      <span>COD Fee</span>
                      <span>{formatPrice(codFee)}</span>
                    </div>
                  )}
                  <div className="apx-sum-total">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="apx-ssl"><Lock size={12} /> Secure 256-bit SSL encryption</div>
      </div>

      {/* ── Sticky payment CTA ── */}
      <div className="apx-sticky">
        <div className="apx-sticky-inner">
          <div className="apx-sticky-total">
            <span className="apx-sticky-label">Total Amount</span>
            <span className="apx-sticky-amount">{formatPrice(total)}</span>
          </div>
          <button
            type="button"
            className="apx-pay"
            disabled={cartItems.length === 0 || isProcessingPayment}
            onClick={handleStickyCTA}
          >
            {currentStep >= 3 && !isProcessingPayment && <Lock size={16} />}
            <span>{stickyCtaLabel}</span>
            {!isProcessingPayment && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
