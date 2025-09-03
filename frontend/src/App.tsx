import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './estilos/principal.css';
import { useSubdominio } from './hooks/useSubdominio';
import { CartProvider } from './hooks/useCart';
import { UsuarioProvider } from './contexts/UsuarioContext';
import PaginaRegistro from './pages/PaginaRegistro.tsx';
import PaginaPrincipal from './pages/PaginaPrincipal.tsx';
import LoginAdministrador from './pages/LoginAdministrador.tsx';
import RecuperarPassword from './pages/RecuperarPassword.tsx';
import NuevaPassword from './pages/NuevaPassword.tsx';
import DashboardAdministrador from './pages/DashboardAdministrador.tsx';
import NuevoProducto from './pages/admin/NuevoProducto.tsx';
import GestionProductos from './pages/admin/GestionProductos.tsx';
import DetalleProducto from './pages/admin/DetalleProducto.tsx';
import EditarProducto from './pages/admin/EditarProducto.tsx';
import GestionPedidos from './pages/admin/GestionPedidos.tsx';
import GestionClientes from './pages/admin/GestionClientes.tsx';
import ConfiguracionEmpresa from './pages/admin/ConfiguracionEmpresa.tsx';
import CajaRapida from './pages/admin/CajaRapida.tsx';
import HistorialVentasRapidas from './pages/admin/HistorialVentasRapidas.tsx';
import ControlInventario from './pages/admin/ControlInventario.tsx';
import HistorialCargaProductos from './pages/admin/HistorialCargaProductos.tsx';
import Estadisticas from './pages/admin/Estadisticas.tsx';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin.tsx';
import GestionEmpresas from './pages/admin/GestionEmpresas.tsx';
import GestionSuscripciones from './pages/admin/GestionSuscripciones.tsx';
import DashboardSuscripcion from './pages/admin/DashboardSuscripcion.tsx';
import ConsumoYSuscripciones from './pages/admin/ConsumoYSuscripciones.tsx';
import CatalogoPublico from './pages/CatalogoPublico.tsx';
import ProductoPublico from './pages/ProductoPublico.tsx';
import LoginCliente from './pages/LoginCliente.tsx';
import RegistroCliente from './pages/RegistroCliente.tsx';
import AreaPersonalCliente from './pages/AreaPersonalCliente.tsx';
import ResetPasswordCliente from './pages/ResetPasswordCliente.tsx';
import RecuperarPasswordCliente from './pages/RecuperarPasswordCliente.tsx';
import GoogleLogin from './pages/GoogleLogin.tsx';
import VerificarEmail from './pages/VerificarEmail.tsx';
import VerificarEmailCliente from './pages/VerificarEmailCliente.tsx';
import ConfirmacionRegistro from './pages/ConfirmacionRegistro.tsx';
import ConfirmacionRegistroAdmin from './pages/ConfirmacionRegistroAdmin.tsx';
import RegistroEmpresaEtapa1 from './pages/RegistroEmpresaEtapa1.tsx';
import ConfigurarEmpresa from './pages/ConfigurarEmpresa.tsx';
import VerificarEmailAdmin from './pages/VerificarEmailAdmin.tsx';
import GestionAdministradores from './pages/admin/GestionAdministradores.tsx';
import GestionEmpresa from './pages/admin/GestionEmpresa.tsx';
import CargaPedidos from './pages/admin/CargaPedidos.tsx';
import CrearPlanilla from './pages/admin/CrearPlanilla.tsx';
import RoturasPerdidas from './pages/admin/RoturasPerdidas.tsx';
import Ingresos from './pages/admin/Ingresos.tsx';
import CrearIngreso from './pages/admin/CrearIngreso.tsx';
import DescargaDevoluciones from './pages/admin/DescargaDevoluciones.tsx';
import CrearDevolucion from './pages/admin/CrearDevolucion.tsx';
import MovimientosDia from './pages/admin/MovimientosDia.tsx';
import LoginDocumento from './pages/LoginDocumento.tsx';
import GestionSectores from './pages/admin/GestionSectores.tsx';
import StockGeneral from './pages/admin/StockGeneral.tsx';
import GestionTransportistas from './pages/admin/GestionTransportistas.tsx';
import RecibirProductos from './pages/admin/RecibirProductos.tsx';


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
          <Route path="/registro" element={<RegistroEmpresaEtapa1 />} />
          <Route path="/configurar-empresa" element={<ConfigurarEmpresa />} />
          <Route path="/confirmacion-registro-admin" element={<ConfirmacionRegistroAdmin />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/recuperar" element={<RecuperarPassword />} />
          <Route path="/reset" element={<NuevaPassword />} />
                     <Route path="/recuperar-contraseña" element={<NuevaPassword />} />
                     <Route path="/google-login" element={<GoogleLogin />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/verificar-email-admin" element={<VerificarEmailAdmin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<LoginAdministrador />} />
          <Route path="/admin/login-documento" element={<LoginDocumento />} />
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
          <Route path="/admin/estadisticas" element={<Estadisticas />} />
          <Route path="/admin/suscripcion" element={<DashboardSuscripcion />} />
          <Route path="/admin/consumo-suscripciones" element={<ConsumoYSuscripciones />} />
          <Route path="/admin/administradores" element={<GestionAdministradores />} />
          <Route path="/admin/gestion-empresa" element={<GestionEmpresa />} />
          <Route path="/admin/carga-pedidos" element={<CargaPedidos />} />
          <Route path="/admin/crear-planilla" element={<CrearPlanilla />} />
          <Route path="/admin/roturas-perdidas" element={<RoturasPerdidas />} />
          <Route path="/admin/ingresos" element={<Ingresos />} />
          <Route path="/admin/crear-ingreso" element={<CrearIngreso />} />
          <Route path="/admin/descarga-devoluciones" element={<DescargaDevoluciones />} />
          <Route path="/admin/crear-devolucion" element={<CrearDevolucion />} />
          <Route path="/admin/movimientos-dia" element={<MovimientosDia />} />
          <Route path="/admin/sectores" element={<GestionSectores />} />
          <Route path="/admin/sectores/:sectorId/recibir-productos" element={<RecibirProductos />} />
          <Route path="/admin/stock-general" element={<StockGeneral />} />
          <Route path="/admin/transportistas" element={<GestionTransportistas />} />
  
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
          <Route path="/confirmacion-registro" element={<ConfirmacionRegistro />} />
          <Route path="/reset-password" element={<ResetPasswordCliente />} />
          <Route path="/recuperar-password" element={<RecuperarPasswordCliente />} />
          <Route path="/verificar-email" element={<VerificarEmailCliente />} />
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
          
          <UsuarioProvider>
            <AppContent />
          </UsuarioProvider>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
