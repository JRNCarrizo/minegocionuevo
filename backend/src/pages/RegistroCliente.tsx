import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';

interface FormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  password: string;
  confirmarPassword: string;
}

export default function RegistroCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!formData.nombre || !formData.email || !formData.password) {
      setError('Todos los campos obligatorios deben ser completados');
      return;
    }

    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!subdominio) {
      setError('No se pudo identificar la tienda');
      return;
    }

    setLoading(true);

    try {
      console.log('Registrando cliente...');
      
      const response = await fetch(`http://localhost:8080/api/publico/${subdominio}/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Registro exitoso:', result);
        
        // Guardar token en localStorage
        localStorage.setItem('clienteToken', result.token);
        localStorage.setItem('clienteInfo', JSON.stringify(result.cliente));
        
        alert('¡Cuenta creada exitosamente!');
        navigate('/cuenta');
      } else {
        const errorResult = await response.json();
        console.error('Error en registro:', errorResult);
        setError(errorResult.error || 'Error al registrar cuenta');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error al registrar cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (cargandoEmpresa) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Cargando información de la empresa...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Tienda no encontrada</h1>
        <p>No se pudo encontrar la tienda solicitada.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {empresa.logoUrl && (
                <img 
                  src={empresa.logoUrl} 
                  alt={empresa.nombre} 
                  style={{ height: '32px', marginRight: '12px' }}
                />
              )}
              <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {empresa.nombre}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>
                Ver catálogo
              </Link>
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              Crear cuenta
            </h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Regístrate para acceder a ofertas exclusivas y realizar pedidos
            </p>
          </div>

          {error && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#fee2e2', 
              border: '1px solid #fca5a5', 
              color: '#991b1b', 
              borderRadius: '4px' 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Apellidos
              </label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Confirmar contraseña *
              </label>
              <input
                type="password"
                name="confirmarPassword"
                value={formData.confirmarPassword}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                background: loading ? '#9ca3af' : '#3b82f6', 
                color: 'white', 
                padding: '12px 16px', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '16px', 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
