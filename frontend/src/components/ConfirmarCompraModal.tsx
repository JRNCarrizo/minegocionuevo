import React, { useState } from "react";

interface ConfirmarCompraProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (datos: { nombre: string; email: string; direccion: string }) => void;
  usuario?: { nombre: string; email: string } | null;
}

const ConfirmarCompraModal: React.FC<ConfirmarCompraProps> = ({ open, onClose, onConfirm, usuario }) => {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [direccion, setDireccion] = useState("");

  if (!open) return null;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Confirmar compra</h2>
        <form onSubmit={e => { e.preventDefault(); onConfirm({ nombre, email, direccion }); }}>
          <div>
            <label>Nombre:</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Dirección:</label>
            <input value={direccion} onChange={e => setDireccion(e.target.value)} required />
          </div>
          <button type="submit" className="boton boton-primario" style={{ marginTop: 16 }}>Confirmar compra</button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmarCompraModal;
