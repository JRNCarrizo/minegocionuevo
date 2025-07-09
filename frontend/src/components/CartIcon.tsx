import React from "react";
import { useCart } from "../hooks/useCart";
import "../styles/cart.css";

const CartIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { items } = useCart();
  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
  
  // Debug: mostrar información del carrito en consola
  React.useEffect(() => {
    console.log('=== CARRITO ACTUAL ===');
    console.log('Total de items:', totalItems);
    console.log('Items en carrito:', items);
  }, [items, totalItems]);
  
  return (
    <div className="cart-icon" onClick={onClick} style={{ cursor: "pointer", position: "relative" }}>
      🛒
      {totalItems > 0 && (
        <span className="cart-badge">{totalItems}</span>
      )}
    </div>
  );
};

export default CartIcon;
