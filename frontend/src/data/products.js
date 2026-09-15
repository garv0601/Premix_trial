// ================================================================
// ANNAPURNA — Mock Product Data
// Isolated dataset: replace with MongoDB API calls in production
// ================================================================

export const featuredProducts = [
  {
    id: 'dal-makhani',
    name: 'Dal Makhani Premix',
    slug: 'dal-makhani-premix',
    shortDescription: 'Rich, slow-cooked black lentil curry. Restaurant quality at home.',
    description:
      'Experience the rich, creamy and deeply comforting taste of authentic Dal Makhani, just like Maa makes it. Our premix uses slow-roasted spices and premium black lentils to bring you that slow-cooked flavour without the wait.\n\nPerfect for a quick weekday dinner or a lazy Sunday lunch. Just add water, simmer, and serve with love.',
    packSize: '200g (serves 3–4)',
    price: 149,
    mrp: 199,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Bestseller',
    badges: ['Ready in 15 Mins', 'Preservative-Free'],
    category: 'Lentils & Dals',
    preparationTime: '15 minutes',
    servings: '3–4',
    maaTip: 'Garnish with a dollop of fresh cream and serve hot with buttery naan or jeera rice for the ultimate comfort meal.',
  },
  {
    id: 'paneer-butter-masala',
    name: 'Paneer Butter Masala Premix',
    slug: 'paneer-butter-masala-premix',
    shortDescription: 'Velvety tomato-butter gravy with aromatic spices.',
    description:
      'A classic North Indian favourite — rich, mildly spiced and deeply comforting. Just add paneer and a touch of cream.\n\nOur premix captures the authentic restaurant-style flavour with carefully blended tomato, butter and aromatic spice notes.',
    packSize: '180g (serves 2–3)',
    price: 139,
    mrp: 179,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Popular',
    badges: ['100% Vegetarian', 'Ready in 20 Mins'],
    category: 'Gravies',
    preparationTime: '20 minutes',
    servings: '2–3',
    maaTip: 'Add a pinch of kasuri methi (dried fenugreek leaves) while simmering for that authentic dhaba-style aroma.',
  },
  {
    id: 'veg-biryani',
    name: 'Veg Biryani Premix',
    slug: 'veg-biryani-premix',
    shortDescription: 'Aromatic basmati rice layered with saffron-spiced vegetables.',
    description:
      'Bring the celebration home. Our Veg Biryani Premix delivers fragrant layers of spiced rice without hours of preparation.\n\nBlended with whole spices, saffron notes and a touch of ghee flavouring for a biryani that smells and tastes like a festive feast.',
    packSize: '250g (serves 3–4)',
    price: 159,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80&auto=format&fit=crop',
    ],
    badge: null,
    badges: ['Serves 3–4', 'Preservative-Free'],
    category: 'Rice',
    preparationTime: '25 minutes',
    servings: '3–4',
    maaTip: 'Layer the rice with fried onions and fresh mint before the final dum for extra flavour and aroma.',
  },
  {
    id: 'moong-dal-tadka',
    name: 'Moong Dal Tadka Premix',
    slug: 'moong-dal-tadka-premix',
    shortDescription: 'The ultimate everyday comfort food — light, nourishing and homely.',
    description:
      'Simple, wholesome and deeply satisfying. Our Moong Dal Tadka Premix brings that familiar homemade flavour to busy weeknight dinners.\n\nJust cook, temper with ghee and cumin, and serve over steaming rice for a meal that feels like home.',
    packSize: '175g (serves 2–3)',
    price: 119,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'New',
    badges: ['Ready in 12 Mins', '100% Vegetarian'],
    category: 'Lentils & Dals',
    preparationTime: '12 minutes',
    servings: '2–3',
    maaTip: 'For the perfect tadka, heat ghee until it shimmers, then add cumin seeds, dried red chillies and a pinch of hing.',
  },
];

// ================================================================
// ALL PRODUCTS — Full catalogue for the Shop page
// Categories: Snacks, Breakfast, Lunch, Dinner
// ================================================================

export const allProducts = [
  // ── Snacks ──
  {
    id: 'khasta-kachori',
    name: 'Khasta Kachori Mix',
    slug: 'khasta-kachori-mix',
    shortDescription: 'Authentic crisp and flaky kachoris, perfectly spiced for your evening tea.',
    description:
      'Golden, layered kachoris with a spiced moong dal filling. Our premix gives you that street-side crunch without the guesswork.\n\nPerfect for festive snacking, chai-time treats or gifting. Just add water, shape and fry.',
    packSize: '250g (makes 12–15 pcs)',
    price: 149,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Bestseller',
    badges: ['Ready in 15 Mins', '100% Vegetarian'],
    category: 'Snacks',
    preparationTime: '15 minutes',
    servings: '12–15 pieces',
    maaTip: 'For extra crispy kachoris, fry on a medium-low flame and let them puff up slowly. Patience makes all the difference!',
  },
  {
    id: 'masala-mathri',
    name: 'Masala Mathri Mix',
    slug: 'masala-mathri-mix',
    shortDescription: 'Traditional flaky biscuits spiced with carom seeds and black pepper.',
    description:
      'Perfectly seasoned mathris — crispy, savoury and just the right amount of spice. Great with chai or as a gift-box staple.\n\nOur premix ensures consistent taste and crunch every time.',
    packSize: '200g (makes 20–25 pcs)',
    price: 99,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80&auto=format&fit=crop',
    ],
    badge: null,
    badges: ['100% Vegetarian'],
    category: 'Snacks',
    preparationTime: '20 minutes',
    servings: '20–25 pieces',
    maaTip: 'For extra crispy Mathris, try frying them on a medium-low flame. Patience is the secret ingredient! Serve warm with a strong cup of adrak wali chai.',
  },
  {
    id: 'roasted-namkeen',
    name: 'Roasted Namkeen Mix',
    slug: 'roasted-namkeen-mix',
    shortDescription: 'A guilt-free crunchy mix of roasted lentils, peanuts, and mild spice.',
    description:
      'Light, crunchy and completely oil-free. Our Roasted Namkeen Mix is perfect for health-conscious snacking without compromising on taste.\n\nA wholesome blend of roasted chana dal, peanuts, curry leaves and mild spices.',
    packSize: '180g',
    price: 110,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80&auto=format&fit=crop',
    ],
    badge: '100% Vegan',
    badges: ['100% Vegan', 'No Oil Added'],
    category: 'Snacks',
    preparationTime: '5 minutes',
    servings: '4–6 servings',
    maaTip: null,
  },

  // ── Breakfast ──
  {
    id: 'methi-thepla',
    name: 'Methi Thepla Mix',
    slug: 'methi-thepla-mix',
    shortDescription: 'Soft, flavourful theplas packed with fenugreek goodness. Perfect for travel.',
    description:
      'A Gujarati staple loved across India. Our Methi Thepla Mix gives you soft, aromatic flatbreads in minutes — ideal for breakfast, lunch boxes or travel.\n\nMade with real dried fenugreek leaves and a gentle spice blend.',
    packSize: '300g (makes 10–12 theplas)',
    price: 129,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Mildly Spiced',
    badges: ['Mildly Spiced', '100% Vegetarian'],
    category: 'Breakfast',
    preparationTime: '15 minutes',
    servings: '10–12 theplas',
    maaTip: 'Add a tablespoon of curd to the dough for softer theplas. They stay fresh longer this way — perfect for travel!',
  },
  {
    id: 'poha-mix',
    name: 'Indori Poha Premix',
    slug: 'indori-poha-premix',
    shortDescription: 'Classic Indori-style flattened rice with peanuts and a hint of lime.',
    description:
      'Start your morning the Indori way. Fluffy poha with the right balance of turmeric, curry leaves and crunchy sev — ready in under 10 minutes.\n\nA light, satisfying breakfast that the whole family loves.',
    packSize: '200g (serves 2–3)',
    price: 99,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Quick',
    badges: ['Ready in 10 Mins', '100% Vegetarian'],
    category: 'Breakfast',
    preparationTime: '10 minutes',
    servings: '2–3',
    maaTip: 'Squeeze a little fresh lime juice and top with sev just before serving for the authentic Indori taste.',
  },
  {
    id: 'upma-mix',
    name: 'Rava Upma Premix',
    slug: 'rava-upma-premix',
    shortDescription: 'Wholesome South Indian semolina breakfast, tempered with mustard and curry leaves.',
    description:
      'Light, fluffy and perfectly seasoned. Our Rava Upma Premix brings the comfort of a South Indian breakfast to your table with zero prep time.\n\nSimply add boiling water, stir, and enjoy.',
    packSize: '200g (serves 2–3)',
    price: 89,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80&auto=format&fit=crop',
    ],
    badge: null,
    badges: ['100% Vegetarian'],
    category: 'Breakfast',
    preparationTime: '8 minutes',
    servings: '2–3',
    maaTip: null,
  },

  // ── Lunch ──
  {
    id: 'rajma-masala',
    name: 'Rajma Masala Premix',
    slug: 'rajma-masala-premix',
    shortDescription: 'Hearty kidney bean curry in a rich tomato-onion gravy. A Punjabi classic.',
    description:
      'Thick, comforting and packed with flavour. Our Rajma Masala Premix delivers that slow-cooked taste in a fraction of the time.\n\nA Sunday lunch staple that pairs perfectly with steamed rice.',
    packSize: '200g (serves 3–4)',
    price: 139,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Popular',
    badges: ['Ready in 20 Mins', 'Preservative-Free'],
    category: 'Lunch',
    preparationTime: '20 minutes',
    servings: '3–4',
    maaTip: 'Soak the rajma overnight for the creamiest texture. Mash a few beans while cooking for a thicker gravy.',
  },
  {
    id: 'chole-masala',
    name: 'Chole Masala Premix',
    slug: 'chole-masala-premix',
    shortDescription: 'Spiced chickpea curry with the unmistakable aroma of amchur and cinnamon.',
    description:
      'Our Chole Masala Premix captures the bold, tangy flavours of street-side chole. Just add boiled chickpeas and you\'re done.\n\nPerfect with hot bhature, puri or simple roti.',
    packSize: '180g (serves 2–3)',
    price: 129,
    mrp: 159,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Bestseller',
    badges: ['Bestseller', '100% Vegetarian'],
    category: 'Lunch',
    preparationTime: '18 minutes',
    servings: '2–3',
    maaTip: 'Add a used tea bag while boiling the chickpeas for that dark, rich colour you see at street stalls.',
  },
  {
    id: 'veg-pulao',
    name: 'Veg Pulao Premix',
    slug: 'veg-pulao-premix',
    shortDescription: 'Fragrant one-pot rice with whole spices and seasonal vegetables.',
    description:
      'A quick and satisfying one-pot meal. Our Veg Pulao Premix has the perfect blend of whole spices for aromatic, fluffy rice every time.\n\nIdeal for weekday lunches when time is short but flavour can\'t be compromised.',
    packSize: '250g (serves 3–4)',
    price: 149,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
    ],
    badge: null,
    badges: ['Preservative-Free'],
    category: 'Lunch',
    preparationTime: '20 minutes',
    servings: '3–4',
    maaTip: null,
  },

  // ── Dinner ──
  {
    id: 'dal-makhani-dinner',
    name: 'Dal Makhani Premix',
    slug: 'dal-makhani-premix-dinner',
    shortDescription: 'Rich, slow-cooked black lentil curry. Restaurant quality at home.',
    description:
      'Our Dal Makhani Premix brings together carefully balanced spices and creamy lentil base for a bowl that tastes like hours of cooking — in minutes.\n\nA dinner-time favourite that pairs beautifully with naan, roti or steamed rice.',
    packSize: '200g (serves 3–4)',
    price: 149,
    mrp: 199,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Bestseller',
    badges: ['Ready in 15 Mins', 'Preservative-Free'],
    category: 'Dinner',
    preparationTime: '15 minutes',
    servings: '3–4',
    maaTip: 'Finish with a generous knob of butter on top — it makes all the difference between good and unforgettable.',
  },
  {
    id: 'paneer-butter-masala-dinner',
    name: 'Paneer Butter Masala Premix',
    slug: 'paneer-butter-masala-premix-dinner',
    shortDescription: 'Velvety tomato-butter gravy with aromatic spices.',
    description:
      'A classic North Indian favourite — rich, mildly spiced and deeply comforting. Just add paneer and a touch of cream.\n\nPerfect for a special dinner or when guests drop by unexpectedly.',
    packSize: '180g (serves 2–3)',
    price: 139,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'Popular',
    badges: ['100% Vegetarian', 'Ready in 20 Mins'],
    category: 'Dinner',
    preparationTime: '20 minutes',
    servings: '2–3',
    maaTip: 'Soak paneer cubes in warm salted water for 10 minutes before adding to the gravy — they\'ll be softer and juicier.',
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer Premix',
    slug: 'palak-paneer-premix',
    shortDescription: 'Creamy spinach curry with aromatic spices. A nourishing dinner favourite.',
    description:
      'Smooth, vibrant and packed with iron-rich goodness. Our Palak Paneer Premix delivers restaurant-style results with homemade warmth.\n\nA nutritious dinner option the whole family will enjoy.',
    packSize: '180g (serves 2–3)',
    price: 135,
    mrp: null,
    currency: '₹',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80&auto=format&fit=crop',
    ],
    badge: 'New',
    badges: ['New', '100% Vegetarian'],
    category: 'Dinner',
    preparationTime: '18 minutes',
    servings: '2–3',
    maaTip: 'Blanch spinach in boiling water for just 2 minutes, then dunk in ice water. This keeps the colour bright green!',
  },
];

// Categories for the Shop page filter
export const shopCategories = ['All', 'Snacks', 'Breakfast', 'Lunch', 'Dinner'];

// ================================================================
// HELPER: Find a product by slug across all datasets
// ================================================================
export function findProductBySlug(slug) {
  // Search featured products first (homepage products)
  const fromFeatured = featuredProducts.find((p) => p.slug === slug);
  if (fromFeatured) return fromFeatured;

  // Then search the full shop catalogue
  const fromAll = allProducts.find((p) => p.slug === slug);
  if (fromAll) return fromAll;

  return null;
}
