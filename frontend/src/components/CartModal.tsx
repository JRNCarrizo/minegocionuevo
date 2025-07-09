import React, { useState } from "react";
import { useCart } from "../hooks/useCart";
import ConfirmarCompraModal from "./ConfirmarCompraModal";
import apiService from "../services/api";
import { useSubdominio } from "../hooks/useSubdominio";
import toast from "react-hot-toast";
import "../styles/cart-modal.css";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

const getClienteInfo = () => {
  const cliente = localStorage.getItem("clienteInfo");
  if (cliente) {
    try {
      return JSON.parse(cliente);
    } catch {
      return null;
    }
  }
  return null;
};

const CartModal: React.FC<CartModalProps> = ({ open, onClose }) => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [compraRealizada, setCompraRealizada] = useState(false);
  const usuario = getClienteInfo();
  const { empresa } = useSubdominio();

  const handleConfirmarCompra = async (datos: { nombre: string; email: string; direccion: string }) => {
    if (!usuario || !items.length || !empresa?.id) {
      alert('Faltan datos del usuario, empresa o carrito vacío.');
      return;
    }
    // Validar que todos los productos tengan cantidad > 0
    if (items.some(item => item.cantidad <= 0)) {
      alert('Todos los productos deben tener cantidad mayor a 0.');
      return;
    }
    // Validar que todos los productos tengan id y nombre
    if (items.some(item => !item.id || !item.nombre)) {
      alert('Hay productos con datos incompletos en el carrito.');
      return;
    }
    // Validar que todos los productos tengan precio > 0
    if (items.some(item => typeof item.precio !== 'number' || isNaN(item.precio) || item.precio <= 0)) {
      alert('Hay productos en el carrito con precio inválido o menor o igual a 0. Corrige antes de comprar.');
      return;
    }
    if (!datos.direccion || datos.direccion.length < 5) {
      alert('Debes ingresar una dirección de envío válida.');
      return;
    }
    try {
      // Validar que usuario.id sea un número válido
      const clienteId = usuario && typeof usuario.id === 'number' && !isNaN(usuario.id) ? usuario.id : undefined;
      if (!clienteId) {
        alert('No se pudo obtener el ID del cliente. Por favor, vuelve a iniciar sesión.');
        return;
      }
      await apiService.crearPedido(Number(empresa.id), {
        clienteId: usuario.id, // <--- AGREGADO
        clienteNombre: datos.nombre,
        clienteEmail: datos.email,
        direccionEnvio: datos.direccion,
        detalles: items.map(item => ({
          productoId: item.id,
          productoNombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precio)
        })),
        total: Number(total)
      });
      setCompraRealizada(true);
      clearCart();
      toast.success('¡Pedido creado exitosamente! Revisa tu historial en "Mi Cuenta".');
      setTimeout(() => {
        setShowConfirm(false);
        setCompraRealizada(false);
        onClose();
      }, 2000);
    } catch (e) {
      let mensaje = 'Error al guardar el pedido. Intenta de nuevo.';
      // e puede ser unknown, intentamos castear a AxiosError si es posible
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { data?: any } };
        if (err.response && typeof err.response.data === 'string') {
          mensaje = err.response.data;
        } else if (err.response && err.response.data && err.response.data.error) {
          mensaje = err.response.data.error;
        }
      }
      alert(mensaje);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="cart-modal-overlay" onClick={onClose}>
        <div className="cart-modal" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>Carrito de compras</h2>
          {items.length === 0 ? (
            <div>El carrito está vacío.</div>
          ) : (
            <>
              <table className="cart-table">
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
                          onChange={e => updateQuantity(item.id, Number(e.target.value))}
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
              <button className="boton boton-primario" style={{ marginLeft: 8 }} onClick={() => setShowConfirm(true)}>
                Efectuar compra
              </button>
              {compraRealizada && <div style={{ color: 'green', marginTop: 10 }}>¡Compra realizada con éxito!</div>}
            </>
          )}
        </div>
      </div>
      <ConfirmarCompraModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmarCompra}
        usuario={usuario}
      />
    </>
  );
};

export default CartModal;
