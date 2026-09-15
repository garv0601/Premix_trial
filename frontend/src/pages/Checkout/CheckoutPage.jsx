import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Plus, MapPin, Truck, CreditCard, CheckCircle, Package, Zap, Lightbulb, Wallet, Banknote } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAddresses, addAddress } from '../../services/addressService';
import { getPaymentMethods } from '../../services/paymentService';
import { placeOrder, createRazorpayOrder } from '../../services/orderService';
import AddressForm from '../../components/addresses/AddressForm';
import supabase from '../../lib/supabase';
import { calculateShippingCharge, calculateOrderTotal } from '../../utils/pricing';
import './CheckoutPage.css';

const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/* Track which steps the user has reached (so they can go back but not skip ahead) */

/* ── Animation variants ─────────────────────────────────────────────── */
const stepContentVariants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: [0.55, 0.06, 0.68, 0.19] } },
};

const collapsedVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function CheckoutPage({ cartItems = [], subtotal = 0, updateQuantity, clearCart, coupon }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  /* ── Refs for each step section ── */
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const stepRefs = { 1: step1Ref, 2: step2Ref, 3: step3Ref };

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
      const newAddress = await addAddress(user.id, formData);
      
      // If the new address is set as default, we might need to update others, 
      // but for this task we just refetch the list
      await fetchAddresses(); 
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      setError(null);
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Failed to save address. Please try again.');
    }
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
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load payment gateway. Please check your internet connection.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
      return;
    }

    // Create Razorpay order on the backend (server calculates the real amount)
    let rzpOrderData;
    try {
      const rzpResult = await createRazorpayOrder(total);
      rzpOrderData = rzpResult.order;
    } catch (err) {
      console.error('[Checkout] Razorpay order creation failed:', err);
      setError(err.message || 'Could not initiate payment. Please try again.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
      return;
    }

    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    const options = {
      key:      rzpKey,
      amount:   rzpOrderData.amount,      // amount in paise (set by server)
      currency: rzpOrderData.currency || 'INR',
      order_id: rzpOrderData.id,          // Razorpay order ID
      name:     'ANNAPURNA',
      description: `Order for ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`,
      image:    '/logo.png',
      prefill: {
        name:    selectedAddress?.fullName || user?.user_metadata?.full_name || '',
        email:   user?.email || '',
        contact: selectedAddress?.phone || '',
      },
      theme: {
        color:          '#B22222',
        backdrop_color: 'rgba(28, 16, 7, 0.5)',
      },
      modal: {
        ondismiss: async () => {
          console.log('[Checkout] Razorpay modal closed — releasing reservation...');
          await releaseReservation(sessionId);
          setIsProcessingPayment(false);
        },
      },
      handler: async (response) => {
        // Payment succeeded in Razorpay — now confirm with backend
        // Backend will verify the Razorpay signature before creating the order
        console.log('[Checkout] Razorpay payment received — confirming with backend...');
        try {
          const result = await placeOrder({
            ...baseOrderPayload,
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
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
            'Reference: ' + response.razorpay_payment_id
          );
          setIsProcessingPayment(false);
        }
      },
      method: paymentMethod === 'upi'
        ? { upi: true, card: false, netbanking: false, wallet: false }
        : { card: true, upi: false, netbanking: false, wallet: false },
    };

    // Mock flow when Razorpay key is a placeholder
    if (rzpKey === 'rzp_test_placeholder' || rzpOrderData.mock) {
      console.log('[Checkout] Mock payment flow — confirming directly with backend...');
      try {
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substr(2, 12);
        const result = await placeOrder({
          ...baseOrderPayload,
          razorpayPaymentId: mockPaymentId,
        });

        // Order confirmed (mock gateway) — safe to clear the cart now.
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
        console.error('[Checkout] Mock order failed:', err);
        setError(err.message || 'Order placement failed. Please try again.');
        await releaseReservation(sessionId);
        setIsProcessingPayment(false);
      }
      return;
    }

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('[Checkout] Razorpay error:', err);
      setError('Payment could not be initiated. Please try again.');
      await releaseReservation(sessionId);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="checkout-container">
      {/* HEADER */}
      <header className="checkout-header">
        <div className="checkout-header-inner">
          <Link to="/" className="checkout-brand">ANNAPURNA</Link>
          <div className="checkout-secure-badge">
            <Lock size={14} /> Secure Checkout
          </div>
        </div>
      </header>

      {/* CHECKOUT SUBTITLE */}
      <div className="checkout-subtitle-area">
        <h1 className="checkout-page-title">Checkout</h1>
        <p className="checkout-page-subtitle">Almost there! Just a few more details to get Maa's love to your doorstep.</p>
        
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#FFF4F4',
            borderLeft: '4px solid #B22222',
            borderRadius: '6px',
            color: '#B22222',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'pre-wrap'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="checkout-main">
        
        {/* LEFT COLUMN: STEPS */}
        <div className="checkout-left">
          
          {/* ═══════════ STEP 1: SHIPPING ADDRESS ═══════════ */}
          <div
            ref={step1Ref}
            className={`checkout-step ${currentStep === 1 ? 'active-step' : currentStep > 1 ? 'completed-step' : 'disabled-step'}`}
          >
            <div
              className={`step-header ${currentStep !== 1 && highestStep >= 1 ? 'clickable-header' : ''}`}
              onClick={() => currentStep !== 1 && goToStep(1)}
            >
              {currentStep > 1 ? (
                <div className="step-number completed-number">
                  <CheckCircle size={18} />
                </div>
              ) : (
                <div className={`step-number ${currentStep === 1 ? 'active-number' : ''}`}>1</div>
              )}
              <h2 className="step-title">
                {currentStep > 1 ? '1. ' : ''}Shipping Address
              </h2>
              {currentStep > 1 && (
                <span className="step-edit-btn">Edit</span>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1-full"
                  className="step-content"
                  variants={stepContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {isLoadingAddresses ? (
                    <div className="loading-state">Loading addresses...</div>
                  ) : showAddressForm ? (
                    <div className="address-form-wrapper">
                      <AddressForm 
                        onSave={handleSaveAddress} 
                        onCancel={() => setShowAddressForm(false)} 
                      />
                    </div>
                  ) : (
                    <>
                      {addresses.length === 0 ? (
                        <div className="empty-address-state">
                          <p>No saved addresses yet.</p>
                          <p>Add an address to continue.</p>
                          <button 
                            className="add-address-btn"
                            onClick={() => setShowAddressForm(true)}
                          >
                            <Plus size={16} /> Add New Address
                          </button>
                        </div>
                      ) : (
                        <div className="address-list">
                          {addresses.map(address => (
                            <div 
                              key={address.id} 
                              className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedAddressId(address.id);
                                setError(null);
                              }}
                            >
                              {selectedAddressId === address.id && (
                                <div className="address-check">
                                  <CheckCircle size={18} />
                                </div>
                              )}
                              <div className="address-label-badge">{address.label || 'Home'}</div>
                              <div className="address-name">{address.fullName}</div>
                              <div className="address-phone">{address.phone}</div>
                              <div className="address-line">{address.addressLine1}</div>
                              {address.addressLine2 && <div className="address-line">{address.addressLine2}</div>}
                              <div className="address-line">{address.city}, {address.state} {address.postalCode}</div>
                            </div>
                          ))}
                          
                          <button 
                            className="add-address-btn secondary"
                            onClick={() => setShowAddressForm(true)}
                          >
                            <Plus size={16} /> Add New Address
                          </button>
                        </div>
                      )}

                      {error && <div className="checkout-error-msg">{error}</div>}

                      <button 
                        className="continue-btn"
                        onClick={handleContinueToDelivery}
                        disabled={addresses.length === 0}
                      >
                        Continue to Delivery →
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Collapsed address summary when past step 1 */}
              {currentStep > 1 && selectedAddress && (
                <motion.div
                  key="step1-collapsed"
                  className="step-content"
                  variants={collapsedVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="collapsed-address-summary">
                    <MapPin size={16} className="collapsed-address-icon" />
                    <div>
                      <div className="collapsed-address-name">{selectedAddress.fullName}</div>
                      <div className="collapsed-address-detail">
                        {selectedAddress.addressLine1}
                        {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}
                      </div>
                      <div className="collapsed-address-detail">
                        {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.postalCode}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════ STEP 2: DELIVERY METHOD ═══════════ */}
          <div
            ref={step2Ref}
            className={`checkout-step ${currentStep === 2 ? 'active-step' : currentStep > 2 ? 'completed-step' : 'disabled-step'}`}
          >
            <div className="step-connector"></div>
            <div
              className={`step-header ${currentStep !== 2 && highestStep >= 2 ? 'clickable-header' : ''}`}
              onClick={() => currentStep !== 2 && highestStep >= 2 && goToStep(2)}
            >
              {currentStep > 2 ? (
                <div className="step-number completed-number">
                  <CheckCircle size={18} />
                </div>
              ) : (
                <div className={`step-number ${currentStep === 2 ? 'active-number delivery-active' : ''}`}>
                  {currentStep === 2 ? <Truck size={16} /> : '2'}
                </div>
              )}
              <h2 className="step-title">
                {currentStep >= 2 ? '2. ' : ''}Delivery Method
              </h2>
              {currentStep > 2 && (
                <span className="step-edit-btn">Edit</span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 2 && (
                <motion.div
                  key="step2-content"
                  className="step-content"
                  variants={stepContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="delivery-options">
                    {/* Standard Delivery */}
                    <label
                      className={`delivery-option ${deliveryMethod === 'standard' ? 'selected' : ''}`}
                      htmlFor="delivery-standard"
                    >
                      <div className="delivery-option-radio">
                        <input
                          type="radio"
                          id="delivery-standard"
                          name="deliveryMethod"
                          value="standard"
                          checked={deliveryMethod === 'standard'}
                          onChange={() => setDeliveryMethod('standard')}
                        />
                        <span className="custom-radio"></span>
                      </div>
                      <div className="delivery-option-info">
                        <span className="delivery-option-name">Standard Delivery</span>
                        <span className="delivery-option-eta">Estimated arrival: 3–5 business days</span>
                      </div>
                      <span className={`delivery-option-price ${standardDeliveryCost === 0 ? 'free' : ''}`}>
                        {standardDeliveryCost === 0 ? 'Free' : formatPrice(standardDeliveryCost)}
                      </span>
                    </label>

                    {/* Express Delivery */}
                    <label
                      className={`delivery-option ${deliveryMethod === 'express' ? 'selected' : ''}`}
                      htmlFor="delivery-express"
                    >
                      <div className="delivery-option-radio">
                        <input
                          type="radio"
                          id="delivery-express"
                          name="deliveryMethod"
                          value="express"
                          checked={deliveryMethod === 'express'}
                          onChange={() => setDeliveryMethod('express')}
                        />
                        <span className="custom-radio"></span>
                      </div>
                      <div className="delivery-option-info">
                        <span className="delivery-option-name">Express Delivery</span>
                        <span className="delivery-option-eta">Estimated arrival: 1–2 business days</span>
                      </div>
                      <span className="delivery-option-price">₹50</span>
                    </label>
                  </div>

                  {/* Maa's Tip */}
                  <div className="maas-tip-card">
                    <div className="maas-tip-icon">💡</div>
                    <div className="maas-tip-content">
                      <span className="maas-tip-title">Maa's Tip:</span>
                      <span className="maas-tip-text">
                        For delicate items like our Besan Laddoos, choosing Express Delivery ensures they arrive perfectly fresh and intact, just like they came out of the kitchen!
                      </span>
                    </div>
                  </div>

                  {/* Continue to Payment Button */}
                  <div className="delivery-continue-wrap">
                    <button
                      className="continue-btn delivery-continue-btn"
                      onClick={handleContinueToPayment}
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Collapsed delivery summary when past step 2 */}
              {currentStep > 2 && (
                <motion.div
                  key="step2-collapsed"
                  className="step-content"
                  variants={collapsedVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="collapsed-address-summary">
                    <Truck size={16} className="collapsed-address-icon" />
                    <div>
                      <div className="collapsed-address-name">
                        {deliveryMethod === 'standard' ? 'Standard Delivery' : 'Express Delivery'}
                      </div>
                      <div className="collapsed-address-detail">
                        {deliveryMethod === 'standard'
                          ? `Estimated arrival: 3–5 business days · ${standardDeliveryCost === 0 ? 'Free' : formatPrice(standardDeliveryCost)}`
                          : `Estimated arrival: 1–2 business days · ${formatPrice(deliveryCost)}`}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════ STEP 3: PAYMENT METHOD ═══════════ */}
          <div
            ref={step3Ref}
            className={`checkout-step ${currentStep === 3 ? 'active-step' : 'disabled-step'}`}
          >
            <div className="step-connector"></div>
            <div
              className={`step-header ${currentStep !== 3 && highestStep >= 3 ? 'clickable-header' : ''}`}
              onClick={() => currentStep !== 3 && highestStep >= 3 && goToStep(3)}
            >
              <div className={`step-number ${currentStep === 3 ? 'active-number' : ''}`}>
                {currentStep === 3 ? <CreditCard size={16} /> : <CreditCard size={14} />}
              </div>
              <h2 className="step-title">
                {currentStep >= 3 ? '3. ' : ''}Payment Method
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 3 && (
                <motion.div
                  key="step3-content"
                  className="step-content"
                  variants={stepContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="payment-methods-wrap">

                    {/* ── SAVED CREDIT CARD ── */}
                    <div
                      className={`payment-method-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="payment-method-header">
                        <div className="payment-method-radio">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                            id="pm-card"
                          />
                          <span className="custom-radio"></span>
                        </div>
                        <span className="payment-method-label">Saved Credit Card</span>
                      </div>

                      {paymentMethod === 'card' && (
                        <motion.div
                          className="payment-method-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {savedCards.length > 0 ? (
                            savedCards.map(card => (
                              <div
                                key={card.id}
                                className={`saved-card-row ${selectedCardId === card.id ? 'selected' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedCardId(card.id); }}
                              >
                                <div className="saved-card-radio">
                                  <input
                                    type="radio"
                                    name="selectedCard"
                                    checked={selectedCardId === card.id}
                                    onChange={() => setSelectedCardId(card.id)}
                                  />
                                  <span className="custom-radio small"></span>
                                </div>
                                <div className="saved-card-info">
                                  <span className="saved-card-name">
                                    {card.brand === 'mastercard' ? 'SBI' : 'HDFC Bank'} {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} **** **** **** {card.last4}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-saved-cards">
                              <p>No saved cards. Razorpay will securely collect your card details.</p>
                            </div>
                          )}

                          {/* CVV Input */}
                          {savedCards.length > 0 && selectedCardId && (
                            <div className="cvv-input-row">
                              <input
                                type="password"
                                maxLength="4"
                                placeholder="CVV"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                className="cvv-input"
                              />
                              <span className="cvv-hint">
                                <Lock size={12} /> 3 digits on back of card
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* ── UPI ── */}
                    <div
                      className={`payment-method-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <div className="payment-method-header">
                        <div className="payment-method-radio">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="upi"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                            id="pm-upi"
                          />
                          <span className="custom-radio"></span>
                        </div>
                        <span className="payment-method-label">UPI (Google Pay, PhonePe, Paytm)</span>
                      </div>

                      {paymentMethod === 'upi' && (
                        <motion.div
                          className="payment-method-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="payment-body-hint">Pay instantly via your UPI app.</p>
                        </motion.div>
                      )}
                    </div>

                    {/* ── CASH ON DELIVERY ── */}
                    <div
                      className={`payment-method-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="payment-method-header">
                        <div className="payment-method-radio">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            id="pm-cod"
                          />
                          <span className="custom-radio"></span>
                        </div>
                        <span className="payment-method-label">Cash on Delivery</span>
                      </div>

                      {paymentMethod === 'cod' && (
                        <motion.div
                          className="payment-method-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="payment-body-hint">Pay with cash when your order arrives.</p>
                          <p className="payment-body-sub-hint">(Additional ₹40 convenience fee applies)</p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Billing matches delivery checkbox */}
                  <label className="billing-checkbox-row">
                    <input
                      type="checkbox"
                      checked={billingMatchesDelivery}
                      onChange={(e) => setBillingMatchesDelivery(e.target.checked)}
                    />
                    <span>My billing address is the same as my delivery address.</span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="checkout-right">
          <div className="order-summary-card">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-items">
              {cartItems.length === 0 ? (
                <p className="empty-cart-msg">Your cart is empty.</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-image-wrap">
                      <img src={item.image} alt={item.name} />
                      <span className="summary-item-qty">{item.quantity}</span>
                    </div>
                    <div className="summary-item-details">
                      <div className="summary-item-name">{item.name}</div>
                      {item.weight && <div className="summary-item-meta">{item.weight} · Qty: {item.quantity}</div>}
                    </div>
                    <div className="summary-item-price">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <motion.div
                  className="summary-row"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </motion.div>
              )}
              <div className="summary-row">
                <span>Delivery {currentStep >= 2 ? `(${deliveryMethod === 'standard' ? 'Standard' : 'Express'})` : ''}</span>
                <span className={deliveryCost === 0 ? 'delivery-free-text' : ''}>
                  {deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}
                </span>
              </div>
              {codFee > 0 && (
                <motion.div
                  className="summary-row"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <span>COD Fee</span>
                  <span>{formatPrice(codFee)}</span>
                </motion.div>
              )}
              <div className="summary-total-row">
                <span className="total-label">Total</span>
                <span className="total-value">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              className={`pay-btn ${currentStep < 3 ? 'disabled' : ''}`}
              disabled={currentStep < 3 || isProcessingPayment}
              onClick={handlePayAndPlaceOrder}
            >
              {isProcessingPayment ? (
                <span className="pay-btn-loading">Processing…</span>
              ) : (
                `Pay ${formatPrice(total)} & Place Order`
              )}
            </button>
            
            <div className="secure-checkout-note">
              <Lock size={12} /> Secure 256-bit SSL Encryption
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="checkout-footer">
        <div className="checkout-footer-inner">
          <span className="checkout-footer-brand">ANNAPURNA</span>
          <span className="checkout-footer-copy">© {new Date().getFullYear()} Annapurna Premix. Homemade with love.</span>
        </div>
      </footer>
    </div>
  );
}
