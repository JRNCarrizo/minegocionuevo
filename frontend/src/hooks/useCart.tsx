import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, cantidad: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) {
        return prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + item.cantidad } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, cantidad: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Retornar un contexto vacío para evitar romper la app si se usa fuera del provider
    // Puedes cambiar esto por un error si prefieres el comportamiento estricto
    return {
      items: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      total: 0,
    };
  }
  return context;
};
