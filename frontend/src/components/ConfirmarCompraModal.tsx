import React, { useState } from "react";

interface ConfirmarCompraProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (datos: { nombre: string; email: string; direccion: string; acordarConVendedor?: boolean }) => void;
  usuario?: { nombre: string; email: string } | null;
  loading?: boolean;
}

const ConfirmarCompraModal: React.FC<ConfirmarCompraProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  usuario, 
  loading = false 
}) => {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [direccion, setDireccion] = useState("");
  const [acordarConVendedor, setAcordarConVendedor] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El email no es válido';
    }
    
    // La dirección solo es requerida si no se selecciona "acordar con vendedor"
    if (!acordarConVendedor) {
      if (!direccion.trim()) {
        newErrors.direccion = 'La dirección es requerida';
      } else if (direccion.trim().length < 10) {
        newErrors.direccion = 'La dirección debe tener al menos 10 caracteres';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm({ 
        nombre: nombre.trim(), 
        email: email.trim(), 
        direccion: acordarConVendedor ? "Acordar con vendedor" : direccion.trim(),
        acordarConVendedor 
      });
    }
  };

  if (!open) return null;

  return (
    <div 
      className="confirmar-compra-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="confirmar-compra-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '0',
          width: '90vw',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'slideIn 0.4s ease-out',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '24px 32px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              💳 Confirmar Compra
            </h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Completa tus datos para finalizar el pedido
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', maxHeight: 'calc(85vh - 140px)', overflow: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Información personal */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                👤 Información Personal
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Nombre */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => {
                      setNombre(e.target.value);
                      if (errors.nombre) {
                        setErrors(prev => ({ ...prev, nombre: '' }));
                      }
                    }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.nombre ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.nombre ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Ingresa tu nombre completo"
                  />
                  {errors.nombre && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}>
                      {errors.nombre}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                📍 Dirección de Envío
              </h3>
              
              {/* Opción de acordar con vendedor */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '12px',
                  background: acordarConVendedor ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 'white',
                  border: `2px solid ${acordarConVendedor ? '#3b82f6' : '#e2e8f0'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={acordarConVendedor}
                    onChange={(e) => {
                      setAcordarConVendedor(e.target.checked);
                      if (e.target.checked) {
                        setDireccion('');
                        setErrors(prev => ({ ...prev, direccion: '' }));
                      }
                    }}
                    disabled={loading}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      🤝 Acordar con el vendedor
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      Coordinar entrega directamente con el vendedor
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Campo de dirección (solo si no se selecciona acordar con vendedor) */}
              {!acordarConVendedor && (
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Dirección completa *
                  </label>
                  <textarea
                    value={direccion}
                    onChange={e => {
                      setDireccion(e.target.value);
                      if (errors.direccion) {
                        setErrors(prev => ({ ...prev, direccion: '' }));
                      }
                    }}
                    disabled={loading}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.direccion ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.direccion ? '#ef4444' : '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Ingresa tu dirección completa para el envío..."
                  />
                  {errors.direccion && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}>
                      {errors.direccion}
                    </p>
                  )}
                </div>
              )}
              
              {/* Mensaje informativo cuando se selecciona acordar con vendedor */}
              {acordarConVendedor && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #f59e0b',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>💡</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                      Información importante
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#92400e',
                    lineHeight: '1.5'
                  }}>
                    Al seleccionar esta opción, el vendedor se pondrá en contacto contigo para coordinar la entrega. 
                    No es necesario proporcionar una dirección ahora.
                  </p>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid #93c5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                  Información importante
                </h4>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '14px',
                color: '#1e40af',
                lineHeight: '1.5'
              }}>
                <li>Tu pedido será procesado una vez confirmado</li>
                <li>Recibirás una confirmación por email</li>
                <li>Puedes hacer seguimiento desde "Mi Cuenta"</li>
                <li>El stock se descuenta automáticamente al confirmar</li>
                {acordarConVendedor && (
                  <li style={{ fontWeight: '600', color: '#dc2626' }}>
                    ⚠️ Al seleccionar "Acordar con vendedor", el vendedor se pondrá en contacto contigo para coordinar la entrega
                  </li>
                )}
              </ul>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  minWidth: '140px',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#64748b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  flex: 2,
                  minWidth: '200px',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Procesando...
                  </span>
                ) : (
                  acordarConVendedor ? '🤝 Confirmar y Acordar Entrega' : '💳 Confirmar Compra'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmarCompraModal;
