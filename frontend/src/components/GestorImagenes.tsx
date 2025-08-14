import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import LimitService from '../services/limitService';

interface GestorImagenesProps {
  empresaId: number;
  imagenesIniciales?: string[];
  onChange: (imagenes: string[]) => void;
  maxImagenes?: number;
  disabled?: boolean;
}

export default function GestorImagenes({ 
  empresaId, 
  imagenesIniciales = [], 
  onChange, 
  maxImagenes = 5,
  disabled = false 
}: GestorImagenesProps) {
  const [imagenes, setImagenes] = useState<string[]>(imagenesIniciales);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [mostrarModalCamara, setMostrarModalCamara] = useState(false);
  const [streamCamara, setStreamCamara] = useState<MediaStream | null>(null);
  const [capturandoFoto, setCapturandoFoto] = useState(false);
  const [inicializandoCamara, setInicializandoCamara] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sincronizar las imágenes cuando cambien las imagenesIniciales
  useEffect(() => {
    console.log('=== DEBUG GESTOR IMAGENES ===');
    console.log('imagenesIniciales recibidas:', imagenesIniciales);
    console.log('empresaId:', empresaId);
    setImagenes(imagenesIniciales);
  }, [imagenesIniciales, empresaId]);

  // Asignar stream al video cuando esté disponible
  useEffect(() => {
    if (streamCamara && videoRef.current) {
      videoRef.current.srcObject = streamCamara;
      videoRef.current.play().catch(error => {
        console.error('Error al reproducir video:', error);
        toast.error('Error al iniciar la cámara');
      });
    }
  }, [streamCamara]);

  // Limpiar stream de cámara cuando se cierre el modal
  useEffect(() => {
    if (!mostrarModalCamara && streamCamara) {
      streamCamara.getTracks().forEach(track => track.stop());
      setStreamCamara(null);
      setInicializandoCamara(false);
    }
  }, [mostrarModalCamara, streamCamara]);

  const handleSeleccionarArchivo = () => {
    if (disabled) return;
    inputFileRef.current?.click();
  };

  const abrirModalCamara = async () => {
    if (disabled) return;
    
    setInicializandoCamara(true);
    setMostrarModalCamara(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Preferir cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStreamCamara(stream);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
      setMostrarModalCamara(false);
    } finally {
      setInicializandoCamara(false);
    }
  };

  const cerrarModalCamara = () => {
    setMostrarModalCamara(false);
    setCapturandoFoto(false);
  };

  const capturarFoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamCamara) return;
    
    setCapturandoFoto(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setCapturandoFoto(false);
      return;
    }
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir canvas a blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCapturandoFoto(false);
        toast.error('Error al capturar la foto');
        return;
      }
      
      // Crear un archivo File desde el blob
      const archivo = new File([blob], `foto_${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      // Procesar la imagen capturada
      await procesarImagen(archivo);
      
      // Cerrar modal después de procesar
      cerrarModalCamara();
    }, 'image/jpeg', 0.8);
  };

  const procesarImagen = async (archivo: File) => {
    // Validar que no se excedan las imágenes máximas
    if (imagenes.length >= maxImagenes) {
      toast.error(`Solo puedes subir hasta ${maxImagenes} imágenes`);
      return;
    }

    // Validar tipo de archivo
    if (!archivo.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede ser mayor a 5MB');
      return;
    }

    // Verificar límites de almacenamiento antes de subir
    const fileSizeMB = archivo.size / (1024 * 1024);
    console.log('🔍 Verificando límites antes de subir archivo...');
    const canProceed = await LimitService.checkLimitsBeforeAction('uploadFile', fileSizeMB);
    
    if (!canProceed) {
      console.log('❌ Límite de almacenamiento alcanzado');
      return;
    }

    console.log('✅ Límites verificados, procediendo a subir archivo...');

    setSubiendoImagen(true);

    try {
      const response = await ApiService.subirImagenProducto(empresaId, archivo);
      
      if (response.data?.url) {
        const nuevasImagenes = [...imagenes, response.data.url];
        setImagenes(nuevasImagenes);
        onChange(nuevasImagenes);
        toast.success('Imagen subida exitosamente');
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }
    } catch (error: unknown) {
      console.error('Error al subir imagen:', error);
      let mensaje = 'Error al subir la imagen';
      if (error && typeof error === 'object') {
        const errorObj = error as { response?: { data?: { error?: string } }; message?: string };
        mensaje = errorObj.response?.data?.error || errorObj.message || mensaje;
      }
      toast.error(mensaje);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleArchivoSeleccionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    await procesarImagen(archivo);
    
    // Limpiar el input
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  const handleEliminarImagen = async (urlImagen: string, index: number) => {
    if (disabled) return;

    try {
      // Intentar eliminar de Cloudinary solo si la URL parece ser de Cloudinary
      if (urlImagen.includes('cloudinary.com')) {
        await ApiService.eliminarImagenProducto(empresaId, urlImagen);
      }
      
      const nuevasImagenes = imagenes.filter((_, i) => i !== index);
      setImagenes(nuevasImagenes);
      onChange(nuevasImagenes);
      toast.success('Imagen eliminada');
    } catch (error: unknown) {
      console.error('Error al eliminar imagen:', error);
      // Aún así eliminar de la lista local
      const nuevasImagenes = imagenes.filter((_, i) => i !== index);
      setImagenes(nuevasImagenes);
      onChange(nuevasImagenes);
      toast.success('Imagen eliminada de la lista');
    }
  };

  return (
    <div className="gestor-imagenes">
      <label className="form-label">
        Imágenes del Producto ({imagenes.length}/{maxImagenes})
      </label>
      
      {/* Input oculto para seleccionar archivos */}
      <input
        ref={inputFileRef}
        type="file"
        accept="image/*"
        onChange={handleArchivoSeleccionado}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Grid de imágenes */}
      <div className="imagenes-grid">
        {imagenes.map((url, index) => (
          <div key={index} className="imagen-item">
            <div className="imagen-preview">
              <img src={url} alt={`Imagen ${index + 1}`} />
              {!disabled && (
                <button
                  type="button"
                  className="btn-eliminar-imagen"
                  onClick={() => handleEliminarImagen(url, index)}
                  title="Eliminar imagen"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Botones para agregar nueva imagen */}
        {!disabled && imagenes.length < maxImagenes && (
          <>
            <div className="imagen-item agregar">
              <button
                type="button"
                className="btn-agregar-imagen"
                onClick={handleSeleccionarArchivo}
                disabled={subiendoImagen}
              >
                {subiendoImagen ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <span className="icono-galeria">📁</span>
                    <span>Galería</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="imagen-item agregar">
              <button
                type="button"
                className="btn-agregar-imagen btn-camara"
                onClick={abrirModalCamara}
                disabled={subiendoImagen}
              >
                <span className="icono-camara">📷</span>
                <span>Cámara</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="info-imagenes">
        <small className="text-muted">
          • Formatos aceptados: JPG, PNG, GIF<br/>
          • Tamaño máximo: 5MB por imagen<br/>
          • Máximo 5 imágenes por producto<br/>
          • Se redimensionarán automáticamente a 500x500px
        </small>
      </div>

      {/* Modal de cámara */}
      {mostrarModalCamara && (
        <div className="modal-camara-overlay">
          <div className="modal-camara">
            <div className="modal-camara-header">
              <h3>Tomar Foto</h3>
              <button 
                type="button" 
                className="btn-cerrar-modal"
                onClick={cerrarModalCamara}
              >
                ×
              </button>
            </div>
            
            <div className="modal-camara-content">
              {inicializandoCamara ? (
                <div className="cargando-camara">
                  <div className="spinner"></div>
                  <p>Inicializando cámara...</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="video-camara"
                />
              )}
              
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="modal-camara-footer">
              <button
                type="button"
                className="btn-capturar"
                onClick={capturarFoto}
                disabled={capturandoFoto || inicializandoCamara || !streamCamara}
              >
                {capturandoFoto ? 'Capturando...' : '📸 Capturar Foto'}
              </button>
              
              <button
                type="button"
                className="btn-cancelar"
                onClick={cerrarModalCamara}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
