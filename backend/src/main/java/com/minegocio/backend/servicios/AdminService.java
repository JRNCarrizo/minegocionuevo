package com.minegocio.backend.servicios;

import com.minegocio.backend.repositorios.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminService {
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private SectorRepository sectorRepository;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    @Autowired
    private PlanillaPedidoRepository planillaPedidoRepository;
    
    @Autowired
    private DetallePlanillaPedidoRepository detallePlanillaPedidoRepository;
    
    @Autowired
    private PlanillaDevolucionRepository planillaDevolucionRepository;
    
    @Autowired
    private DetallePlanillaDevolucionRepository detallePlanillaDevolucionRepository;
    
    @Autowired
    private RemitoIngresoRepository remitoIngresoRepository;
    
    @Autowired
    private DetalleRemitoIngresoRepository detalleRemitoIngresoRepository;
    
    @Autowired
    private RoturaPerdidaRepository roturaPerdidaRepository;
    
    @Autowired
    private TransportistaRepository transportistaRepository;
    
    @Autowired
    private VehiculoRepository vehiculoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private ConteoSectorRepository conteoSectorRepository;
    
    @Autowired
    private MensajeRepository mensajeRepository;
    
    @Autowired
    private ProductoFavoritoRepository productoFavoritoRepository;
    
    @Autowired
    private HistorialCargaProductosRepository historialCargaProductosRepository;
    
    @Autowired
    private HistorialInventarioRepository historialInventarioRepository;
    
    @Autowired
    private InventarioPorSectorRepository inventarioPorSectorRepository;
    
    @Autowired
    private InventarioFisicoRepository inventarioFisicoRepository;
    
    @Autowired
    private InventarioCompletoRepository inventarioCompletoRepository;
    
    @Autowired
    private DetalleConteoRepository detalleConteoRepository;
    
    /**
     * Ejecutar Hard Reset - Limpiar todos los datos excepto usuarios y empresa
     */
    @Transactional
    public void ejecutarHardReset() {
        System.out.println("🔴 [HARD RESET] Iniciando limpieza completa del sistema...");
        
        try {
            // 1. Limpiar datos de conteos de sectores primero (para evitar restricciones FK)
            System.out.println("🧹 Limpiando conteos de sectores...");
            long conteosAntes = conteoSectorRepository.count();
            System.out.println("📊 Conteos antes: " + conteosAntes);
            conteoSectorRepository.deleteAll();
            long conteosDespues = conteoSectorRepository.count();
            System.out.println("📊 Conteos después: " + conteosDespues);
            
            // 2. Limpiar datos de stock y sectores
            System.out.println("🧹 Limpiando stock por sectores...");
            long stockAntes = stockPorSectorRepository.count();
            System.out.println("📊 Stock antes: " + stockAntes);
            stockPorSectorRepository.deleteAll();
            long stockDespues = stockPorSectorRepository.count();
            System.out.println("📊 Stock después: " + stockDespues);
            
            System.out.println("🧹 Limpiando sectores...");
            long sectoresAntes = sectorRepository.count();
            System.out.println("📊 Sectores antes: " + sectoresAntes);
            sectorRepository.deleteAll();
            long sectoresDespues = sectorRepository.count();
            System.out.println("📊 Sectores después: " + sectoresDespues);
            
            // 2. Limpiar datos de planillas
            System.out.println("🧹 Limpiando detalles de planillas de pedido...");
            detallePlanillaPedidoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando planillas de pedido...");
            planillaPedidoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando detalles de planillas de devolución...");
            detallePlanillaDevolucionRepository.deleteAll();
            
            System.out.println("🧹 Limpiando planillas de devolución...");
            planillaDevolucionRepository.deleteAll();
            
            // 3. Limpiar datos de remitos
            System.out.println("🧹 Limpiando detalles de remitos de ingreso...");
            detalleRemitoIngresoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando remitos de ingreso...");
            remitoIngresoRepository.deleteAll();
            
            // 4. Limpiar roturas y pérdidas
            System.out.println("🧹 Limpiando roturas y pérdidas...");
            roturaPerdidaRepository.deleteAll();
            
            // 5. Limpiar transportistas y vehículos
            System.out.println("🧹 Limpiando vehículos...");
            vehiculoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando transportistas...");
            transportistaRepository.deleteAll();
            
            // 6. Limpiar tablas que dependen de productos y sectores
            System.out.println("🧹 Limpiando detalles de conteo...");
            detalleConteoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando inventarios por sector...");
            inventarioPorSectorRepository.deleteAll();
            
            System.out.println("🧹 Limpiando inventarios físicos...");
            inventarioFisicoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando inventarios completos...");
            inventarioCompletoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando historial de inventario...");
            historialInventarioRepository.deleteAll();
            
            System.out.println("🧹 Limpiando historial de carga de productos...");
            historialCargaProductosRepository.deleteAll();
            
            System.out.println("🧹 Limpiando productos favoritos...");
            productoFavoritoRepository.deleteAll();
            
            System.out.println("🧹 Limpiando mensajes...");
            long mensajesAntes = mensajeRepository.count();
            System.out.println("📊 Mensajes antes: " + mensajesAntes);
            mensajeRepository.deleteAll();
            long mensajesDespues = mensajeRepository.count();
            System.out.println("📊 Mensajes después: " + mensajesDespues);
            
            // 7. Limpiar productos (ahora sin dependencias)
            System.out.println("🧹 Limpiando productos...");
            long productosAntes = productoRepository.count();
            System.out.println("📊 Productos antes: " + productosAntes);
            productoRepository.deleteAll();
            long productosDespues = productoRepository.count();
            System.out.println("📊 Productos después: " + productosDespues);
            
            System.out.println("✅ [HARD RESET] Limpieza completada exitosamente");
            System.out.println("📊 [HARD RESET] Sistema listo para producción");
            
        } catch (Exception e) {
            System.err.println("❌ [HARD RESET] Error durante la limpieza: " + e.getMessage());
            throw new RuntimeException("Error durante el hard reset: " + e.getMessage(), e);
        }
    }
    
    /**
     * Verificar estado del sistema después del reset
     */
    public Map<String, Object> verificarEstadoSistema() {
        Map<String, Object> estado = new HashMap<>();
        
        try {
            estado.put("productos", productoRepository.count());
            estado.put("sectores", sectorRepository.count());
            estado.put("conteosSector", conteoSectorRepository.count());
            estado.put("detallesConteo", detalleConteoRepository.count());
            estado.put("stockPorSector", stockPorSectorRepository.count());
            estado.put("inventariosPorSector", inventarioPorSectorRepository.count());
            estado.put("inventariosFisicos", inventarioFisicoRepository.count());
            estado.put("inventariosCompletos", inventarioCompletoRepository.count());
            estado.put("historialInventario", historialInventarioRepository.count());
            estado.put("historialCargaProductos", historialCargaProductosRepository.count());
            estado.put("productosFavoritos", productoFavoritoRepository.count());
            estado.put("mensajes", mensajeRepository.count());
            estado.put("planillasPedido", planillaPedidoRepository.count());
            estado.put("planillasDevolucion", planillaDevolucionRepository.count());
            estado.put("remitosIngreso", remitoIngresoRepository.count());
            estado.put("roturasPerdidas", roturaPerdidaRepository.count());
            estado.put("transportistas", transportistaRepository.count());
            estado.put("vehiculos", vehiculoRepository.count());
            estado.put("usuarios", usuarioRepository.count());
            estado.put("empresas", empresaRepository.count());
            
            estado.put("fechaVerificacion", LocalDateTime.now());
            estado.put("estado", "Sistema limpio y listo para producción");
            
            return estado;
            
        } catch (Exception e) {
            estado.put("error", "Error al verificar estado del sistema: " + e.getMessage());
            return estado;
        }
    }
}
