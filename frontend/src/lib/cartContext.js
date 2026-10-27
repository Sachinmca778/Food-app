'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('directdine_cart');
      const savedRest = localStorage.getItem('directdine_rest');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedRest) setRestaurant(JSON.parse(savedRest));
    } catch (e) {
      console.error('Error loading cart from storage', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('directdine_cart', JSON.stringify(cart));
      if (restaurant) {
        localStorage.setItem('directdine_rest', JSON.stringify(restaurant));
      }
    } catch (e) {}
  }, [cart, restaurant]);

  const setRestaurantInfo = (rest) => {
    // If switching restaurant, clear cart
    if (restaurant && rest && restaurant.id !== rest.id) {
      setCart([]);
    }
    setRestaurant(rest);
  };

  const addItem = (item, variant = null, selectedAddons = [], notes = '') => {
    // Create unique key based on item, variant, addons
    const addonIds = selectedAddons.map(a => a.id).sort().join('-');
    const cartKey = `${item.id}_${variant ? variant.id : 'base'}_${addonIds}`;

    const basePrice = variant ? variant.price_paise : item.base_price_paise;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + (a.price_paise || 0), 0);
    const unitPricePaise = basePrice + addonsPrice;

    setCart(prev => {
      const existingIndex = prev.findIndex(ci => ci.cartKey === cartKey);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1
        };
        return next;
      }

      return [
        ...prev,
        {
          cartKey,
          itemId: item.id,
          name: item.name,
          veg_type: item.veg_type,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          addons: selectedAddons,
          unitPricePaise,
          quantity: 1,
          notes
        }
      ];
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartKey === cartKey) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeItem = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('directdine_cart');
  };

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotalPaise = cart.reduce((sum, i) => sum + (i.unitPricePaise * i.quantity), 0);

  return (
    <CartContext.Provider value={{
      cart,
      restaurant,
      setRestaurantInfo,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      cartSubtotalPaise
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
