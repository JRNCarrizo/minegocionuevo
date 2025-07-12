import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isOpen]); // Removed initializeScanner from dependencies to prevent infinite loops

  // Cleanup effect when component unmounts or isOpen changes to false
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  const initializeScanner = () => {
    // Prevent multiple scanner instances
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }

    try {
      setError(null);
      setIsScanning(true);

      // Clear any existing content in the scanner div
      const scannerElement = document.getElementById("barcode-scanner");
      if (scannerElement) {
        scannerElement.innerHTML = '';
      }

      scannerRef.current = new Html5QrcodeScanner(
        "barcode-scanner",
        {
          fps: 5, // Reducir FPS para mejor estabilidad
          qrbox: { width: 300, height: 150 }, // Rectángulo más ancho para códigos de barras
          aspectRatio: 2.0, // Aspecto más ancho para códigos de barras
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA
          ],
          formatsToSupport: [
            // Solo códigos de barras, NO códigos QR
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8, 
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF
          ],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true
        },
        false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          // Código escaneado exitosamente
          console.log("✅ Código escaneado:", decodedText);
          onScan(decodedText);
          closeScanner();
        },
        (errorMessage: string) => {
          // Solo mostrar errores que no sean de "no encontrado" para evitar spam
          if (!errorMessage.includes("NotFoundException") && 
              !errorMessage.includes("No MultiFormat Readers") &&
              !errorMessage.includes("QR code parse error") &&
              !errorMessage.includes("QR code not found")) {
            console.log("⚠️ Error de escaneo:", errorMessage);
          }
        }
      );

    } catch (err) {
      console.error("Error al inicializar el escáner:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      setIsScanning(false);
    }
  };

  const closeScanner = () => {
    console.log("🔒 Cerrando escáner...");
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.log("⚠️ Error al limpiar escáner:", err);
      }
      scannerRef.current = null;
    }
    
    // Clear the scanner div content
    const scannerElement = document.getElementById("barcode-scanner");
    if (scannerElement) {
      scannerElement.innerHTML = '';
    }
    
    setIsScanning(false);
    onClose();
  };

  const handleManualInput = () => {
    const manualCode = prompt("Ingresa el código de barras manualmente:");
    if (manualCode && manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            📷 Escáner de Código de Barras
          </h3>
          <button
            onClick={closeScanner}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div style={{
          background: '#f8fafc',
          border: '2px dashed #cbd5e1',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <div id="barcode-scanner"></div>
          
          {!isScanning && !error && (
            <div style={{ color: '#64748b', marginTop: '16px' }}>
              <p>🔍 Apunta la cámara hacia el código de barras</p>
              <p style={{ fontSize: '14px' }}>
                Soporta: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, y más
              </p>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleManualInput}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ✏️ Ingresar Manualmente
          </button>
          
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
              }
              initializeScanner();
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Reiniciar Escáner
          </button>
          
          <button
            onClick={closeScanner}
            style={{
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ❌ Cancelar
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>💡 Opciones de Escaneo:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li><strong>📷 Cámara del dispositivo:</strong> Usa el escáner de arriba</li>
            <li><strong>🔗 Escáner físico (USB/Bluetooth):</strong> Haz clic en el campo de texto y escanea directamente</li>
            <li><strong>✏️ Manual:</strong> Escribe el código a mano</li>
          </ul>
          <div style={{ marginTop: '12px', padding: '8px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px' }}>
            <strong>🔗 Para escáneres físicos (USB/Bluetooth):</strong> 
            <br />• Cierra esta ventana
            <br />• Haz clic en el campo "Código de barras, código personalizado o nombre..."
            <br />• Escanea directamente con tu dispositivo físico
            <br />• ¡Es más rápido y confiable!
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 