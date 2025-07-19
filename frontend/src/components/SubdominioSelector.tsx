import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const SubdominioSelector: React.FC = () => {
  const [subdominio, setSubdominio] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const verificarSubdominio = async () => {
    if (!subdominio.trim()) {
      setError('Por favor ingresa un subdominio');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // Verificar si la empresa existe
      const response = await apiService.obtenerEmpresaPorSubdominio(subdominio);
      
      if (response.data) {
        // Guardar el subdominio en localStorage para simular
        localStorage.setItem('subdominio-desarrollo', subdominio);
        
        // Redirigir a la tienda
        navigate(`/tienda/${subdominio}`);
      } else {
        setError('Empresa no encontrada');
      }
    } catch (err) {
      setError('Error al verificar el subdominio');
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="subdominio-selector">
      <div className="contenedor">
        <div className="tarjeta">
          <h2>🌐 Acceder a Tienda</h2>
          <p>Ingresa el subdominio de la empresa para acceder a su tienda:</p>
          
          <div className="formulario">
            <div className="campo">
              <label htmlFor="subdominio">Subdominio:</label>
              <div className="input-grupo">
                <input
                  type="text"
                  id="subdominio"
                  value={subdominio}
                  onChange={(e) => setSubdominio(e.target.value)}
                  placeholder="ejemplo: mitienda"
                  className="input-texto"
                />
                <span className="sufijo">.minegocio.com</span>
              </div>
            </div>
            
            {error && (
              <div className="error">
                ❌ {error}
              </div>
            )}
            
            <button
              onClick={verificarSubdominio}
              disabled={cargando}
              className="boton-primario"
            >
              {cargando ? 'Verificando...' : 'Acceder a Tienda'}
            </button>
          </div>
          
          <div className="ejemplos">
            <h4>Ejemplos de subdominios:</h4>
            <ul>
              <li><code>mitienda</code> → mitienda.minegocio.com</li>
              <li><code>ropa</code> → ropa.minegocio.com</li>
              <li><code>electronicos</code> → electronicos.minegocio.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubdominioSelector; 