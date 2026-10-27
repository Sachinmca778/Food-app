/**
 * Food Image Library & Smart Fallback Helper
 * Provides high-resolution, delicious food photos for Indian and Global cuisine
 * Handles automatic fallback when custom photos are not yet uploaded.
 */

export const FOOD_PRESETS = [
  {
    name: 'Dum Biryani',
    category: 'Rice & Biryani',
    vegType: 'non_veg',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Veg Biryani / Pulao',
    category: 'Rice & Biryani',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Butter Chicken / Murgh Makhani',
    category: 'Main Course',
    vegType: 'non_veg',
    url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dal Makhani',
    category: 'Main Course',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Crispy Gourmet Burger',
    category: 'Fast Food',
    vegType: 'non_veg',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Woodfired Cheesy Pizza',
    category: 'Fast Food',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Crispy Dosa & Chutney',
    category: 'South Indian',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Steamed Momos / Dumplings',
    category: 'Starters',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Paneer Tikka / Kebab',
    category: 'Starters',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tandoori Chicken',
    category: 'Starters',
    vegType: 'non_veg',
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Butter Naan / Roti',
    category: 'Breads',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cold Shake / Mojito',
    category: 'Beverages',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Gulab Jamun / Desserts',
    category: 'Desserts',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Masala Chai / Coffee',
    category: 'Beverages',
    vegType: 'veg',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_VEG_IMG = 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_NONVEG_IMG = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';

/**
 * Returns the best image URL for a food item.
 * If custom item.image_url exists, returns it.
 * Otherwise analyzes dish name and category to return the most delicious matching food picture!
 */
export function getFoodImageUrl(item) {
  if (item?.image_url && typeof item.image_url === 'string' && item.image_url.trim().length > 5) {
    return item.image_url.trim();
  }

  const name = (item?.name || '').toLowerCase();
  const cat = (item?.category_name || '').toLowerCase();
  const isVeg = item?.veg_type === 'veg';

  // Smart matching rules
  if (name.includes('biryani') || name.includes('pulao') || name.includes('rice')) {
    return isVeg
      ? 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('dosa') || name.includes('idli') || name.includes('uttapam')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('momo') || name.includes('dim sum')) {
    return 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('paneer') || name.includes('tikka') || name.includes('kebab')) {
    return isVeg
      ? 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('dal') || name.includes('daal') || name.includes('makhani') || name.includes('tadka')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('naan') || name.includes('roti') || name.includes('kulcha') || name.includes('paratha') || cat.includes('bread')) {
    return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('chicken') || name.includes('murgh') || name.includes('mutton') || name.includes('kebab')) {
    return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('shake') || name.includes('mojito') || name.includes('juice') || name.includes('lassi') || name.includes('cold drink') || cat.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('tea') || name.includes('chai') || name.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80';
  }

  if (name.includes('sweet') || name.includes('gulab') || name.includes('halwa') || name.includes('dessert') || name.includes('ice cream') || cat.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80';
  }

  return isVeg ? DEFAULT_VEG_IMG : DEFAULT_NONVEG_IMG;
}
