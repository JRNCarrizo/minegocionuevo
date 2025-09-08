import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';
import toast from 'react-hot-toast';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem, empresaId?: number, subdominio?: string) => Promise<boolean>;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, cantidad: number, empresaId?: number, subdominio?: string) => Promise<boolean>;
  clearCart: () => void;
  total: number;
  validateStock: (productId: number, cantidad: number, empresaId?: number, subdominio?: string) => Promise<boolean>;
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

  // Escuchar cambios en localStorage desde otros componentes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('cart');
      if (stored) {
        const newItems = JSON.parse(stored);


        setItems(newItems);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const validateStock = useCallback(async (productId: number, cantidad: number, empresaId?: number, subdominio?: string): Promise<boolean> => {
    console.log(`=== VALIDANDO STOCK ===`);
    console.log(`ProductoId: ${productId}`);
    console.log(`Cantidad solicitada: ${cantidad}`);
    console.log(`EmpresaId: ${empresaId}`);
    console.log(`Subdominio: ${subdominio}`);
    
    if (!empresaId && !subdominio) {
      console.warn('No se proporcionó empresaId ni subdominio para validar stock');
      return true; // Permitir si no hay datos (fallback)
    }

    try {
      let response;
      
      if (empresaId) {
        console.log('Usando endpoint privado para validar stock');
        // Usar endpoint privado (para admin)
        response = await ApiService.validarStock(empresaId, productId, cantidad);
      } else if (subdominio) {
        console.log('Usando endpoint público para validar stock');
        // Usar endpoint público (para frontend público)
        response = await ApiService.validarStockPublico(subdominio, productId, cantidad);
      } else {
        return true;
      }
      
      console.log('Respuesta de validación de stock:', response);
      
      if (response.data && !response.data.stockSuficiente) {
        console.log(`Stock insuficiente: ${response.data.stockDisponible} disponibles, ${cantidad} solicitadas`);
        toast.error(`Stock insuficiente. Solo hay ${response.data.stockDisponible} unidades disponibles de "${response.data.productoNombre}"`);
        return false;
      }
      
      console.log('Stock válido, se puede agregar al carrito');
      return true;
    } catch (error) {
      console.error('Error al validar stock:', error);
      toast.error('Error al verificar el stock disponible');
      return false;
    }
  }, []);

  const addToCart = useCallback(async (item: CartItem, empresaId?: number, subdominio?: string) => {
    try {
      console.log(`=== AGREGANDO AL CARRITO ===`);
      console.log(`Producto: ${item.nombre} (ID: ${item.id})`);
      console.log(`Cantidad: ${item.cantidad}`);
      console.log(`EmpresaId: ${empresaId}`);
      console.log(`Subdominio: ${subdominio}`);
      console.log(`Estado actual del carrito:`, items);
      
      // Validar que la cantidad sea positiva
      if (item.cantidad <= 0) {
        console.log('Cantidad inválida, debe ser mayor a 0');
        toast.error('La cantidad debe ser mayor a 0');
        return false;
      }

      // Obtener el estado actual del carrito de forma síncrona
      const currentItems = [...items];
      const found = currentItems.find(i => i.id === item.id);
      const nuevaCantidad = found ? found.cantidad + item.cantidad : item.cantidad;
      
      console.log(`Cantidad actual en carrito: ${found ? found.cantidad : 0}`);
      console.log(`Nueva cantidad total: ${nuevaCantidad}`);
      
      // Validar stock para la cantidad total ANTES de actualizar el estado
      console.log('Iniciando validación de stock...');
      const stockValido = await validateStock(item.id, nuevaCantidad, empresaId, subdominio);
      console.log('Resultado de validación de stock:', stockValido);
      
      if (!stockValido) {
        console.log('Stock insuficiente, no se agrega al carrito');
        return false;
      }
      
      // Solo actualizar el estado si la validación fue exitosa
      console.log('Actualizando estado del carrito...');
      setItems(prev => {
        console.log('Estado anterior del carrito:', prev);
        const existe = prev.find(i => i.id === item.id);
        if (existe) {
          console.log(`Actualizando cantidad de ${item.nombre} de ${existe.cantidad} a ${nuevaCantidad}`);
          const nuevoEstado = prev.map(i => i.id === item.id ? { ...i, cantidad: nuevaCantidad } : i);
          console.log('Nuevo estado del carrito:', nuevoEstado);
          return nuevoEstado;
        } else {
          console.log(`Agregando nuevo producto ${item.nombre} con cantidad ${item.cantidad}`);
          const nuevoEstado = [...prev, item];
          console.log('Nuevo estado del carrito:', nuevoEstado);
          return nuevoEstado;
        }
      });
      
      console.log('Producto agregado al carrito exitosamente');
      return true;
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      toast.error('Error al agregar el producto al carrito');
      return false;
    }
  }, [items, validateStock]);

  const removeFromCart = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = async (id: number, cantidad: number, empresaId?: number, subdominio?: string) => {
    try {
      console.log(`=== ACTUALIZANDO CANTIDAD ===`);
      console.log(`ProductoId: ${id}`);
      console.log(`Nueva cantidad: ${cantidad}`);
      console.log(`EmpresaId: ${empresaId}`);
      console.log(`Subdominio: ${subdominio}`);
      
      if (cantidad <= 0) {
        console.log('Cantidad <= 0, removiendo del carrito');
        removeFromCart(id);
        return true;
      }

      // Para cambios de cantidad, no validar stock (solo validar al agregar)
      console.log('Actualizando cantidad sin validar stock...');
      setItems(prev => {
        const nuevoEstado = prev.map(i => i.id === id ? { ...i, cantidad } : i);
        console.log('Nuevo estado del carrito:', nuevoEstado);
        return nuevoEstado;
      });
      
      console.log('Cantidad actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      return false;
    }
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  // Método para obtener el total de items en el carrito (solo para validación local)
  const getTotalItems = useCallback(() => {
    return items.reduce((sum, i) => sum + i.cantidad, 0);
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, validateStock }}>
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
      addToCart: async () => true,
      removeFromCart: () => {},
      updateQuantity: async () => true,
      clearCart: () => {},
      total: 0,
      validateStock: async () => true,
    };
  }
  return context;
};
