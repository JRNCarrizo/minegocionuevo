import React, { useState, useEffect } from "react";
import { useSubdominio } from "../hooks/useSubdominio";
import { useResponsive } from "../hooks/useResponsive";
import { API_CONFIG } from "../config/api";

interface ConfirmarCompraProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (datos: { nombre: string; email: string; direccion: string; acordarConVendedor?: boolean }) => void;
  usuario?: { nombre: string; email: string } | null;
  loading?: boolean;
}

interface DatosBancarios {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  cbu: string;
  alias: string;
  titular: string;
  empresaNombre: string;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  letterSpacing: "0.02em",
};

const inputStyle = (error: boolean, disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${error ? "#f87171" : "#e2e8f0"}`,
  borderRadius: 8,
  fontSize: 14,
  background: disabled ? "#f8fafc" : "#fff",
  color: "#0f172a",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
});

const ConfirmarCompraModal: React.FC<ConfirmarCompraProps> = ({
  open,
  onClose,
  onConfirm,
  usuario,
  loading = false,
}) => {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [direccion, setDireccion] = useState("");
  const [acordarConVendedor, setAcordarConVendedor] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [datosBancarios, setDatosBancarios] = useState<DatosBancarios | null>(null);
  const [cargandoBancarios, setCargandoBancarios] = useState(false);
  const { subdominio, empresa } = useSubdominio();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (open) {
      setNombre(usuario?.nombre || "");
      setEmail(usuario?.email || "");
    }
  }, [open, usuario]);

  useEffect(() => {
    const fetchDatosBancarios = async () => {
      if (!subdominio) return;
      setCargandoBancarios(true);
      try {
        const response = await fetch(
          `${API_CONFIG.getBaseUrl().replace("/api", "")}/publico/${subdominio}/datos-bancarios`
        );
        if (response.ok) {
          const data = await response.json();
          setDatosBancarios(data.data);
        }
      } catch {
        /* ignore */
      } finally {
        setCargandoBancarios(false);
      }
    };

    if (open && subdominio) {
      fetchDatosBancarios();
    }
  }, [open, subdominio]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nombre.trim()) newErrors.nombre = "Requerido";
    if (!email.trim()) {
      newErrors.email = "Requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    if (!acordarConVendedor) {
      if (!direccion.trim()) {
        newErrors.direccion = "Requerida";
      } else if (direccion.trim().length < 10) {
        newErrors.direccion = "Mínimo 10 caracteres";
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
        acordarConVendedor,
      });
    }
  };

  if (!open) return null;

  const headerGradient = empresa?.colorPrimario
    ? `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)`
    : "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)";

  const chip = (k: string, v: string) => (
    <div
      style={{
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {k}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#422006", marginTop: 4, wordBreak: "break-all", fontVariantNumeric: "tabular-nums" }}>
        {v}
      </div>
    </div>
  );

  return (
    <div
      className="confirmar-compra-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(10px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 12 : 20,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="confirmar-compra-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: isMobile ? 440 : 760,
          maxHeight: "min(92vh, 880px)",
          height: isMobile ? "auto" : "min(88vh, 820px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15,23,42,0.06)",
          animation: "slideIn 0.25s ease-out",
        }}
      >
        <div
          style={{
            background: headerGradient,
            color: "#fff",
            padding: isMobile ? "14px 16px" : "16px 22px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 17 : 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Confirmar pedido
            </h2>
            <p style={{ margin: "4px 0 0 0", opacity: 0.92, fontSize: 12 }}>
              Datos de envío y contacto
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              color: "#fff",
              fontSize: 20,
              cursor: loading ? "not-allowed" : "pointer",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "16px 16px 12px" : "20px 24px 12px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#64748b",
                }}
              >
                Contacto
              </div>
              <div style={{ padding: 14, display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                <div>
                  <label style={labelStyle}>Nombre completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (errors.nombre) setErrors((p) => ({ ...p, nombre: "" }));
                    }}
                    disabled={loading}
                    style={inputStyle(!!errors.nombre, loading)}
                    placeholder="Nombre y apellido"
                  />
                  {errors.nombre && (
                    <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#dc2626" }}>{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                    }}
                    disabled={loading}
                    style={inputStyle(!!errors.email, loading)}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && (
                    <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#dc2626" }}>{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#64748b",
                }}
              >
                Entrega
              </div>
              <div style={{ padding: 14 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: loading ? "default" : "pointer",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${acordarConVendedor ? "#38bdf8" : "#e2e8f0"}`,
                    background: acordarConVendedor ? "#f0f9ff" : "#fff",
                    marginBottom: !acordarConVendedor ? 12 : 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acordarConVendedor}
                    onChange={(e) => {
                      setAcordarConVendedor(e.target.checked);
                      if (e.target.checked) {
                        setDireccion("");
                        setErrors((p) => ({ ...p, direccion: "" }));
                      }
                    }}
                    disabled={loading}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: "#0ea5e9", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Acordar entrega con el vendedor</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>
                      Sin dirección ahora; coordinás por contacto.
                    </div>
                  </div>
                </label>

                {!acordarConVendedor && (
                  <div>
                    <label style={labelStyle}>Dirección de envío</label>
                    <textarea
                      value={direccion}
                      onChange={(e) => {
                        setDireccion(e.target.value);
                        if (errors.direccion) setErrors((p) => ({ ...p, direccion: "" }));
                      }}
                      disabled={loading}
                      rows={3}
                      style={{
                        ...inputStyle(!!errors.direccion, loading),
                        resize: "vertical",
                        minHeight: 72,
                        fontFamily: "inherit",
                        lineHeight: 1.45,
                      }}
                      placeholder="Calle, número, ciudad, referencias…"
                    />
                    {errors.direccion && (
                      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#dc2626" }}>{errors.direccion}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {cargandoBancarios ? (
              <div
                style={{
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #e2e8f0",
                    borderTopColor: "#ca8a04",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Cargando datos para transferencia…
              </div>
            ) : (
              datosBancarios && (
                <div
                  style={{
                    border: "1px solid #fde68a",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                    background: "#fffbeb",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #fde68a",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#a16207",
                    }}
                  >
                    Pago por transferencia
                  </div>
                  <div style={{ padding: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 8 }}>
                    {datosBancarios.banco && chip("Banco", datosBancarios.banco)}
                    {datosBancarios.tipoCuenta && chip("Tipo", datosBancarios.tipoCuenta)}
                    {datosBancarios.numeroCuenta && chip("Cuenta", datosBancarios.numeroCuenta)}
                    {datosBancarios.cbu && chip("CBU", datosBancarios.cbu)}
                    {datosBancarios.alias && chip("Alias", datosBancarios.alias)}
                    {datosBancarios.titular && chip("Titular", datosBancarios.titular)}
                  </div>
                  <p style={{ margin: 0, padding: "0 14px 12px", fontSize: 11, color: "#854d0e", lineHeight: 1.45 }}>
                    Enviá el comprobante al vendedor para acelerar la confirmación del pedido.
                  </p>
                </div>
              )
            )}

            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.45 }}>
              Recibirás confirmación por email. Seguimiento en &quot;Mi cuenta&quot;.
            </p>
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? "12px 16px 16px" : "14px 24px 18px",
              borderTop: "1px solid #e2e8f0",
              background: "#fafafa",
              display: "flex",
              flexDirection: isMobile ? "column-reverse" : "row",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#475569",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                background: empresa?.colorPrimario
                  ? `linear-gradient(180deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)`
                  : "linear-gradient(180deg, #0d9488 0%, #0f766e 100%)",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                width: isMobile ? "100%" : "auto",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              {loading ? "Procesando…" : acordarConVendedor ? "Confirmar y coordinar" : "Confirmar pedido"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmarCompraModal;
