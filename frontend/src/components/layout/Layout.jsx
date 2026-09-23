import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton/WhatsAppButton';
import BottomNav from './BottomNav';
import CartDrawer from '../common/CartDrawer';

export const Layout = ({ children, cartProps, navbarProps }) => {
  const { pathname } = useLocation();
  const isCheckoutPage = pathname.startsWith('/checkout');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        cartCount={navbarProps?.cartCount ?? 0}
        onOpenCart={navbarProps?.onOpenCart}
      />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <WhatsAppButton hideTooltipOnMobile={isCheckoutPage} />
      {!isCheckoutPage && <BottomNav />}
      <CartDrawer
        isOpen={cartProps?.isCartOpen}
        onClose={cartProps?.onCloseCart}
        cart={cartProps?.cart}
      />
    </div>
  );
};

export default Layout;
