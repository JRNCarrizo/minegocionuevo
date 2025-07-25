import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSubdominio } from './hooks/useSubdominio';
import { CartProvider } from './hooks/useCart';
import PaginaRegistro from './pages/PaginaRegistro';
import PaginaPrincipal from './pages/PaginaPrincipal';
import LoginAdministrador from './pages/LoginAdministrador';
import DashboardAdministrador from './pages/DashboardAdministrador';
import NuevoProducto from './pages/admin/NuevoProducto';
import GestionProductos from './pages/admin/GestionProductos';
import DetalleProducto from './pages/admin/DetalleProducto';
import EditarProducto from './pages/admin/EditarProducto';
import GestionPedidos from './pages/admin/GestionPedidos';
import GestionClientes from './pages/admin/GestionClientes';
import ConfiguracionEmpresa from './pages/admin/ConfiguracionEmpresa';
import CajaRapida from './pages/admin/CajaRapida';
import HistorialVentasRapidas from './pages/admin/HistorialVentasRapidas';
import ControlInventario from './pages/admin/ControlInventario';
import HistorialCargaProductos from './pages/admin/HistorialCargaProductos';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';
import GestionEmpresas from './pages/admin/GestionEmpresas';
import GestionSuscripciones from './pages/admin/GestionSuscripciones';
import CatalogoPublico from './pages/CatalogoPublico';
import ProductoPublico from './pages/ProductoPublico';
import LoginCliente from './pages/LoginCliente';
import RegistroCliente from './pages/RegistroCliente';
import AreaPersonalCliente from './pages/AreaPersonalCliente';

function AppContent() {
  const { esSubdominioPrincipal, cargando } = useSubdominio();

  if (cargando) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <Routes>
      {esSubdominioPrincipal ? (
        // Rutas para el dominio principal (registro de empresas)
        <>
          <Route path="/" element={<PaginaPrincipal />} />
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<LoginAdministrador />} />
          <Route path="/admin/dashboard" element={<DashboardAdministrador />} />
          <Route path="/admin/productos" element={<GestionProductos />} />
          <Route path="/admin/productos/nuevo" element={<NuevoProducto />} />
          <Route path="/admin/productos/editar/:id" element={<EditarProducto />} />
          <Route path="/admin/productos/:id" element={<DetalleProducto />} />
          <Route path="/admin/pedidos" element={<GestionPedidos />} />
          <Route path="/admin/clientes" element={<GestionClientes />} />
          <Route path="/admin/configuracion" element={<ConfiguracionEmpresa />} />
          <Route path="/admin/caja-rapida" element={<CajaRapida />} />
          <Route path="/admin/historial-ventas" element={<HistorialVentasRapidas />} />
          <Route path="/admin/control-inventario" element={<ControlInventario />} />
          <Route path="/admin/historial-carga-productos" element={<HistorialCargaProductos />} />
          <Route path="/dashboard-super-admin" element={<DashboardSuperAdmin />} />
          <Route path="/super-admin/empresas" element={<GestionEmpresas />} />
          <Route path="/super-admin/suscripciones" element={<GestionSuscripciones />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        // Rutas para subdominios (tiendas de clientes)
        <>
          <Route path="/" element={<CatalogoPublico />} />
          <Route path="/producto/:id" element={<ProductoPublico />} />
          <Route path="/login" element={<LoginCliente />} />
          <Route path="/registro" element={<RegistroCliente />} />
          <Route path="/cuenta" element={<AreaPersonalCliente />} />
          <Route path="/carrito" element={<div>Carrito de compras (por implementar)</div>} />
          <Route path="/checkout" element={<div>Proceso de compra (por implementar)</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <AppContent />
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
