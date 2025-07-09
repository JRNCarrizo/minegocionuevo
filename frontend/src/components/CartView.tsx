import React from "react";
import { useCart } from "../hooks/useCart";
import "../styles/cart.css";

const CartView: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) return <div>El carrito está vacío.</div>;

  return (
    <div className="cart-view">
      <h2>Carrito de compras</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                {item.imagen && <img src={item.imagen} alt={item.nombre} style={{ width: 40, marginRight: 8 }} />}
                {item.nombre}
              </td>
              <td>${item.precio.toFixed(2)}</td>
                                    <td>
                        <input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={async e => {
                            const nuevaCantidad = Number(e.target.value);
                            await updateQuantity(item.id, nuevaCantidad, undefined, undefined);
                          }}
                          style={{ width: 50 }}
                        />
                      </td>
              <td>${(item.precio * item.cantidad).toFixed(2)}</td>
              <td>
                <button onClick={() => removeFromCart(item.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Total: ${total.toFixed(2)}</h3>
      <button onClick={clearCart}>Vaciar carrito</button>
      {/* Aquí irá el botón de finalizar compra */}
    </div>
  );
};

export default CartView;
