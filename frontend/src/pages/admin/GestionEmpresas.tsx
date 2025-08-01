import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaStore, FaBox, FaShoppingCart, FaEye, FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaBuilding } from 'react-icons/fa';
import { MdBusiness, MdEmail, MdPhone, MdCalendarToday, MdWarning, MdCheckCircle, MdBlock } from 'react-icons/md';
import { superAdminService } from '../../services/superAdminService';

interface Empresa {
  id: number;
  nombre: string;
  subdominio: string;
  email: string;
  telefono: string;
  logoUrl: string;
  estadoSuscripcion: string;
  fechaCreacion: string;
  totalProductos: number;
  totalClientes: number;
  totalPedidos: number;
  descripcion: string;
  colorPrimario: string;
  moneda: string;
  activa: boolean;
}

const GestionEmpresas: React.FC = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Iniciando carga de empresas...');
      const response = await superAdminService.obtenerEmpresas(0, 100);
      console.log('🔍 Respuesta del backend:', response);
      console.log('🔍 Datos de empresas:', response.data);
      console.log('🔍 Cantidad de empresas:', response.data?.length || 0);
      setEmpresas(response.data || []);
    } catch (err) {
      console.error('Error al cargar empresas:', err);
      setError('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const empresasFiltradas = empresas
    .filter(empresa => {
      const matchesSearch = empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           empresa.subdominio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           empresa.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterEstado === 'TODOS' || empresa.estadoSuscripcion === filterEstado;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Empresa];
      let bValue: any = b[sortBy as keyof Empresa];
      
      if (sortBy === 'fechaCreacion') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return '#10B981';
      case 'PRUEBA': return '#F59E0B';
      case 'SUSPENDIDA': return '#EF4444';
      case 'CANCELADA': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return <MdCheckCircle />;
      case 'PRUEBA': return <MdWarning />;
      case 'SUSPENDIDA': return <MdBlock />;
      case 'CANCELADA': return <MdBlock />;
      default: return <MdWarning />;
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--color-fondo)',
    fontFamily: 'var(--fuente-principal)',
    color: 'var(--color-texto)',
    padding: '20px'
  };

  const headerStyle: React.CSSProperties = {
    background: 'var(--gradiente-primario)',
    borderRadius: 'var(--border-radius)',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    alignItems: 'center'
  };

  const searchInputStyle: React.CSSProperties = {
    padding: '12px 15px',
    border: '1px solid var(--color-borde)',
    borderRadius: 'var(--border-radius)',
    fontSize: '1rem',
    minWidth: '300px',
    backgroundColor: 'white'
  };

  const selectStyle: React.CSSProperties = {
    padding: '12px 15px',
    border: '1px solid var(--color-borde)',
    borderRadius: 'var(--border-radius)',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer'
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '20px',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--color-borde)',
    textAlign: 'center'
  };

  const empresasGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  };

  const empresaCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '25px',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--color-borde)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  };

  const empresaCardHoverStyle: React.CSSProperties = {
    ...empresaCardStyle,
    transform: 'translateY(-5px)',
    boxShadow: 'var(--sombra-hover)'
  };

  const logoStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--color-borde)',
    marginBottom: '15px'
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: 'var(--sombra-hover)'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--color-texto-secundario)' }}>
            Cargando empresas...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '15px' }}>⚠️</div>
            <div style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '10px' }}>Error</div>
            <div style={{ color: 'var(--color-texto-secundario)' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 
            style={{ 
              ...titleStyle, 
              cursor: 'pointer',
              transition: 'opacity 0.3s ease'
            }}
            onClick={() => navigate('/dashboard-super-admin')}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            ← Gestión de Empresas
          </h1>
          <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem' }}>
            Administra todas las empresas registradas en la plataforma
          </p>
        </div>
        <div style={{ color: 'white', textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{empresas.length}</div>
          <div style={{ fontSize: '1rem' }}>Empresas Totales</div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={{ marginBottom: '10px' }}>
            <FaStore color="#10B981" size={32} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-texto)' }}>
            {empresas.filter(e => e.estadoSuscripcion === 'ACTIVA').length}
          </div>
          <div style={{ color: 'var(--color-texto-secundario)' }}>Empresas Activas</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '10px' }}>
            <MdWarning color="#F59E0B" size={32} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-texto)' }}>
            {empresas.filter(e => e.estadoSuscripcion === 'PRUEBA').length}
          </div>
          <div style={{ color: 'var(--color-texto-secundario)' }}>En Prueba</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '10px' }}>
            <FaUsers color="#3B82F6" size={32} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-texto)' }}>
            {empresas.reduce((total, e) => total + (e.totalClientes || 0), 0).toLocaleString()}
          </div>
          <div style={{ color: 'var(--color-texto-secundario)' }}>Total Clientes</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '10px' }}>
            <FaBox color="#8B5CF6" size={32} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-texto)' }}>
            {empresas.reduce((total, e) => total + (e.totalProductos || 0), 0).toLocaleString()}
          </div>
          <div style={{ color: 'var(--color-texto-secundario)' }}>Total Productos</div>
        </div>
      </div>

      {/* Controles de Filtrado */}
      <div style={controlsStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaSearch color="var(--color-texto-secundario)" />
          <input
            type="text"
            placeholder="Buscar por nombre, subdominio o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFilter color="var(--color-texto-secundario)" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            style={selectStyle}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVA">Activas</option>
            <option value="PRUEBA">En Prueba</option>
            <option value="SUSPENDIDA">Suspendidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaSort color="var(--color-texto-secundario)" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectStyle}
          >
            <option value="nombre">Ordenar por Nombre</option>
            <option value="fechaCreacion">Ordenar por Fecha</option>
            <option value="totalClientes">Ordenar por Clientes</option>
            <option value="totalProductos">Ordenar por Productos</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-borde)',
              borderRadius: 'var(--border-radius)',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Lista de Empresas */}
      <div style={empresasGridStyle}>
        {empresasFiltradas.map((empresa) => (
          <div
            key={empresa.id}
            style={empresaCardStyle}
            onClick={() => {
              setSelectedEmpresa(empresa);
              setShowModal(true);
            }}
          >
            {/* Header de la Empresa */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              {empresa.logoUrl ? (
                <img
                  src={empresa.logoUrl}
                  alt={`Logo de ${empresa.nombre}`}
                  style={logoStyle}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="logo-fallback"
                style={{
                  ...logoStyle,
                  display: empresa.logoUrl ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-primario)',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {empresa.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, marginLeft: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {empresa.nombre}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    color: getEstadoColor(empresa.estadoSuscripcion),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {getEstadoIcon(empresa.estadoSuscripcion)}
                    {empresa.estadoSuscripcion}
                  </span>
                  {!empresa.activa && (
                    <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>INACTIVA</span>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <MdBusiness color="var(--color-texto-secundario)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
                  {empresa.subdominio}.minegocio.com
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <MdEmail color="var(--color-texto-secundario)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
                  {empresa.email}
                </span>
              </div>
              {empresa.telefono && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdPhone color="var(--color-texto-secundario)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
                    {empresa.telefono}
                  </span>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primario)' }}>
                  {(empresa.totalClientes || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Clientes</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primario)' }}>
                  {(empresa.totalProductos || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Productos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primario)' }}>
                  {(empresa.totalPedidos || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>Pedidos</div>
              </div>
            </div>

            {/* Fecha de Registro */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
              <MdCalendarToday color="var(--color-texto-secundario)" />
              <span>Registrada: {new Date(empresa.fechaCreacion).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedEmpresa && (
        <div style={modalStyle} onClick={() => setShowModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: 'var(--color-texto)' }}>
              Detalles de {selectedEmpresa.nombre}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              {selectedEmpresa.logoUrl ? (
                <img
                  src={selectedEmpresa.logoUrl}
                  alt={`Logo de ${selectedEmpresa.nombre}`}
                  style={{ ...logoStyle, width: '80px', height: '80px' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.modal-logo-fallback') as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="modal-logo-fallback"
                style={{
                  ...logoStyle,
                  width: '80px',
                  height: '80px',
                  display: selectedEmpresa.logoUrl ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-primario)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}
              >
                {selectedEmpresa.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{ marginLeft: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{selectedEmpresa.nombre}</h3>
                <p style={{ margin: '0', color: 'var(--color-texto-secundario)' }}>
                  {selectedEmpresa.descripcion || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ marginBottom: '10px' }}>Información de Contacto</h4>
                <p><strong>Subdominio:</strong> {selectedEmpresa.subdominio}.minegocio.com</p>
                <p><strong>Email:</strong> {selectedEmpresa.email}</p>
                <p><strong>Teléfono:</strong> {selectedEmpresa.telefono || 'No especificado'}</p>
                <p><strong>Moneda:</strong> {selectedEmpresa.moneda}</p>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '10px' }}>Estadísticas</h4>
                <p><strong>Clientes:</strong> {(selectedEmpresa.totalClientes || 0).toLocaleString()}</p>
                <p><strong>Productos:</strong> {(selectedEmpresa.totalProductos || 0).toLocaleString()}</p>
                <p><strong>Pedidos:</strong> {(selectedEmpresa.totalPedidos || 0).toLocaleString()}</p>
                <p><strong>Estado:</strong> {selectedEmpresa.estadoSuscripcion}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid var(--color-borde)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--color-primario)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Editar Empresa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEmpresas; 