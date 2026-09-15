import React, { useRef } from 'react';
import Hero from '../../components/home/Hero/Hero';
import PremixExplanation from '../../components/home/PremixExplanation/PremixExplanation';
import FeaturedProducts from '../../components/home/FeaturedProducts/FeaturedProducts';
import WhyAnnapurna from '../../components/home/WhyAnnapurna/WhyAnnapurna';
import HowItWorks from '../../components/home/HowItWorks/HowItWorks';
import ReviewsPreview from '../../components/home/ReviewsPreview/ReviewsPreview';
import StoryPreview from '../../components/home/StoryPreview/StoryPreview';
import ShopCTA from '../../components/home/ShopCTA/ShopCTA';

/**
 * ANNAPURNA Homepage
 * Composes all homepage sections in storytelling order.
 * Business logic and data sourcing remain in App.jsx / custom hooks.
 *
 * Section order (as specified):
 * 1. Hero
 * 2. Premix Explanation
 * 3. Featured Products
 * 4. Why Annapurna
 * 5. How It Works
 * 6. Customer Reviews
 * 7. Our Story Preview
 * 8. CTA to Shop
 * (Navbar, Footer, WhatsApp are in Layout)
 */
export default function HomePage({ onAddToCartRaw, onUpdateQuantity, cartItems }) {
  const shopRef = useRef(null);

  const scrollToShop = () => {
    shopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* 1. Hero */}
      <Hero onExploreClick={scrollToShop} />

      {/* 2. Premix Explanation */}
      <PremixExplanation />

      {/* 3. Featured Products */}
      <div ref={shopRef}>
        <FeaturedProducts
          cartItems={cartItems}
          onAddToCartRaw={onAddToCartRaw}
          onUpdateQuantity={onUpdateQuantity}
        />
      </div>

      {/* 4. Why Annapurna */}
      <WhyAnnapurna />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Customer Reviews */}
      <ReviewsPreview />

      {/* 7. Our Story Preview */}
      <StoryPreview />

      {/* 8. CTA to Shop */}
      <ShopCTA />
    </>
  );
}
