import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

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
  const inputFileRef = useRef<HTMLInputElement>(null);

  // Sincronizar las imágenes cuando cambien las imagenesIniciales
  useEffect(() => {
    console.log('=== DEBUG GESTOR IMAGENES ===');
    console.log('imagenesIniciales recibidas:', imagenesIniciales);
    console.log('empresaId:', empresaId);
    setImagenes(imagenesIniciales);
  }, [imagenesIniciales, empresaId]);

  const handleSeleccionarArchivo = () => {
    if (disabled) return;
    inputFileRef.current?.click();
  };

  const handleArchivoSeleccionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

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
      // Limpiar el input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
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

        {/* Botón para agregar nueva imagen */}
        {!disabled && imagenes.length < maxImagenes && (
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
                  <span className="icono-mas">+</span>
                  <span>Agregar Imagen</span>
                </>
              )}
            </button>
          </div>
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
    </div>
  );
}
