import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/HomePage';
import ShopPage from './pages/Shop/ShopPage';
import ProductDetailPage from './pages/Product/ProductDetailPage';
import OurStoryPage from './pages/Story/OurStoryPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderSuccessPage from './pages/Checkout/OrderSuccessPage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import AccountPage from './pages/Account/AccountPage';
import EditProfile from './pages/Account/EditProfile';
import SavedAddresses from './pages/Account/SavedAddresses';
import PaymentMethods from './pages/Account/PaymentMethods';
import WishlistPage from './pages/Account/WishlistPage';
import MyOrders from './pages/Orders/MyOrders';
import OrderDetails from './pages/Orders/OrderDetails';
import OrderTracking from './pages/Orders/OrderTracking';
import ContactPage from './pages/Contact/ContactPage';
import AboutPage from './pages/About/AboutPage';
import PrivacyPolicyPage from './pages/Legal/PrivacyPolicyPage';
import TermsPage from './pages/Legal/TermsPage';
import CartPage from './pages/Cart/CartPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import ProductDetailModal from './components/product/ProductDetailModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useCart } from './hooks/useCart';
import { useCoupon } from './hooks/useCoupon';

/**
 * ANNAPURNA App root.
 * Cart persists via localStorage through authentication redirects.
 * Auth state is managed by AuthProvider / AuthContext.
 */

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const navigate = useNavigate();

  const cart = useCart();
  const coupon = useCoupon();

  // Shared cart handler — adds to cart without opening drawer.
  // Guards against sold-out products: stock_quantity must be > 0.
  const handleAddToCartRaw = (product, qty = 1) => {
    // Safety check: do not add if product is out of stock
    const stock = product.stock_quantity ?? 0;
    if (stock <= 0) {
      console.warn('[Cart] Blocked add-to-cart: product is out of stock', product.name);
      return;
    }
    cart.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      currency: product.currency,
      stock_quantity: product.stock_quantity,
    }, qty);
  };

  // Shared quantity handler
  const handleUpdateQuantity = (productId, qty) => {
    cart.updateQuantity(productId, qty);
  };

  return (
    <AuthProvider>
      <Layout
        navbarProps={{
          cartCount: cart.totalItems,
          onOpenCart: () => navigate('/cart'),
        }}
        cartProps={{
          isCartOpen,
          onCloseCart: () => setIsCartOpen(false),
          cart,
        }}
      >
        <ScrollToTop />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                cartItems={cart.cartItems}
                onAddToCartRaw={handleAddToCartRaw}
                onUpdateQuantity={handleUpdateQuantity}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                cartItems={cart.cartItems}
                onAddToCartRaw={handleAddToCartRaw}
                onUpdateQuantity={handleUpdateQuantity}
              />
            }
          />
          <Route
            path="/product/:slug"
            element={
              <ProductDetailPage
                cartItems={cart.cartItems}
                onAddToCartRaw={handleAddToCartRaw}
                onUpdateQuantity={handleUpdateQuantity}
              />
            }
          />
          <Route path="/story" element={<OurStoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cart" element={<CartPage cart={cart} coupon={coupon} />} />

          {/* ── Auth routes ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Protected checkout ── */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage
                  cartItems={cart.cartItems}
                  subtotal={cart.subtotal}
                  updateQuantity={cart.updateQuantity}
                  clearCart={cart.clearCart}
                  coupon={coupon}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout-preview"
            element={
              <CheckoutPage
                cartItems={[
                  { id: '1', name: 'Besan Laddoo Premix', quantity: 2, price: 299, image: '' },
                  { id: '2', name: 'Gulab Jamun Premix', quantity: 1, price: 249, image: '' },
                ]}
                subtotal={847}
                updateQuantity={() => {}}
                clearCart={() => {}}
                coupon={coupon}
              />
            }
          />
          <Route
            path="/order-success/:orderId"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          {/* ── Protected account ── */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders onAddToCartRaw={handleAddToCartRaw} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetails onAddToCartRaw={handleAddToCartRaw} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders/:orderId/track"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route path="/account/addresses" element={<ProtectedRoute><SavedAddresses /></ProtectedRoute>} />
          <Route path="/account/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

          {/* ── Catch-all: unmatched/broken routes → animated 404 ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* ProductDetailModal preserved for future use */}
        <ProductDetailModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(product) => cart.addToCart(product)}
        />
      </Layout>
    </AuthProvider>
  );
}

export default App;
