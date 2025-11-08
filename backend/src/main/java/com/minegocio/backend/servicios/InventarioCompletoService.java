package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ConteoSectorDTO;
import com.minegocio.backend.entidades.ConteoSector;
import com.minegocio.backend.entidades.DetalleConteo;
import com.minegocio.backend.entidades.InventarioCompleto;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.RegistroInventario;
import com.minegocio.backend.entidades.DetalleRegistroInventario;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.repositorios.ConteoSectorRepository;
import com.minegocio.backend.repositorios.DetalleConteoRepository;
import com.minegocio.backend.repositorios.InventarioCompletoRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import com.minegocio.backend.repositorios.RegistroInventarioRepository;
import com.minegocio.backend.repositorios.DetalleRegistroInventarioRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventarioCompletoService {

    @Autowired
    private InventarioCompletoRepository inventarioCompletoRepository;

    @Autowired
    private ConteoSectorRepository conteoSectorRepository;

    @Autowired
    private DetalleConteoRepository detalleConteoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InventarioCompletoServiceSimple inventarioCompletoServiceSimple;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private SectorRepository sectorRepository;

    @Autowired
    private RegistroInventarioRepository registroInventarioRepository;

    @Autowired
    private DetalleRegistroInventarioRepository detalleRegistroInventarioRepository;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    // Variable para almacenar el ID del inventario actual durante la actualización
    private Long inventarioActualId;

    /**
     * Obtener un conteo sector por ID
     */
    public ConteoSector obtenerConteoSectorPorId(Long conteoSectorId) {
        System.out.println("🔍 Buscando conteo sector con ID: " + conteoSectorId);
        Optional<ConteoSector> conteoSector = conteoSectorRepository.findById(conteoSectorId);
        if (conteoSector.isPresent()) {
            System.out.println("✅ Conteo sector encontrado: " + conteoSector.get().getSector().getNombre());
            return conteoSector.get();
        } else {
            System.out.println("❌ Conteo sector no encontrado con ID: " + conteoSectorId);
            return null;
        }
    }

    /**
     * Obtener detalles de conteo consolidados para todos los usuarios
     */
    public List<DetalleConteo> obtenerDetallesConteoConsolidados(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo detalles consolidados para sector: " + conteoSectorId);
        
        // ✅ USAR LA MISMA LÓGICA QUE obtenerDetalleFinalSectorCompletado
        // Esto asegura consistencia en los valores mostrados
        return obtenerDetalleFinalSectorCompletado(conteoSectorId);
    }
    
    /**
     * Obtener detalles solo del usuario actual (modo conteo normal)
     */
    private List<DetalleConteo> obtenerDetallesSoloUsuarioActual(ConteoSector conteoSector, Long usuarioId, boolean esUsuario1, boolean esUsuario2) {
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ Todos los detalles encontrados (SIN eliminados): " + todosLosDetalles.size());
        
        List<DetalleConteo> detallesDelUsuario = new ArrayList<>();
        
        for (DetalleConteo detalle : todosLosDetalles) {
            boolean esDelUsuarioActual = false;
            
            // Verificar si este detalle pertenece al usuario actual
            if (esUsuario1 && detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                esDelUsuarioActual = true;
            }
            if (esUsuario2 && detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                esDelUsuarioActual = true;
            }
            
            if (esDelUsuarioActual) {
                detallesDelUsuario.add(detalle);
                System.out.println("✅ CONTEO NORMAL: Incluyendo producto " + detalle.getProducto().getNombre() + 
                                 " para usuario " + usuarioId + 
                                 " - Cantidad1: " + detalle.getCantidadConteo1() + 
                                 ", Cantidad2: " + detalle.getCantidadConteo2());
            }
        }
        
        System.out.println("✅ Detalles del usuario " + usuarioId + ": " + detallesDelUsuario.size());
        return detallesDelUsuario;
    }

    /**
     * Verificar si todos los sectores están completados y actualizar estado del inventario
     */
    public boolean verificarYFinalizarInventarioCompleto(Long inventarioId) {
        return verificarYFinalizarInventarioCompleto(inventarioId, false);
    }

    /**
     * Verificar si todos los sectores están completados y actualizar estado del inventario
     * @param inventarioId ID del inventario
     * @param forzarFinalizacion true si debe finalizar automáticamente (cuando se actualiza stock), false si solo debe verificar
     */
    public boolean verificarYFinalizarInventarioCompleto(Long inventarioId, boolean forzarFinalizacion) {
        System.out.println("🔍 Verificando si el inventario completo está listo para finalizar: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId).orElse(null);
        if (inventario == null) {
            System.out.println("❌ Inventario completo no encontrado con ID: " + inventarioId);
            return false;
        }
        
        // Obtener todos los sectores del inventario
        List<ConteoSector> sectores = conteoSectorRepository.findByInventarioCompleto(inventario);
        System.out.println("🔍 Total de sectores en el inventario: " + sectores.size());
        
        // Debug: mostrar estado de cada sector
        for (int i = 0; i < sectores.size(); i++) {
            ConteoSector sector = sectores.get(i);
            System.out.println("🔍 Sector " + (i + 1) + ": ID=" + sector.getId() + 
                             ", Nombre=" + sector.getNombreSector() + 
                             ", Estado=" + sector.getEstado());
        }
        
        // Verificar si todos los sectores están completados (incluyendo los completados sin conteo)
        long sectoresCompletados = sectores.stream()
            .filter(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO || 
                            sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO)
            .count();
        
        System.out.println("🔍 Sectores completados: " + sectoresCompletados + " de " + sectores.size());
        
        // ✅ DEBUG: Mostrar detalle de cada sector
        for (ConteoSector sector : sectores) {
            boolean esCompletado = sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO || 
                                  sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO;
            System.out.println("🔍 DEBUG Sector " + sector.getId() + " (" + sector.getNombreSector() + "): " + 
                             "Estado=" + sector.getEstado() + ", EsCompletado=" + esCompletado);
        }
        
        // SIEMPRE actualizar el progreso del inventario
        inventario.setSectoresCompletados((int) sectoresCompletados);
        inventario.setSectoresEnProgreso((int) sectores.stream().filter(s -> s.getEstado() == ConteoSector.EstadoConteo.EN_PROGRESO).count());
        inventario.setSectoresPendientes((int) sectores.stream().filter(s -> s.getEstado() == ConteoSector.EstadoConteo.PENDIENTE).count());
        inventario.setPorcentajeCompletado(sectores.size() > 0 ? (sectoresCompletados * 100.0 / sectores.size()) : 0.0);
        
        System.out.println("🔍 Progreso actualizado:");
        System.out.println("  - Sectores completados: " + inventario.getSectoresCompletados());
        System.out.println("  - Sectores en progreso: " + inventario.getSectoresEnProgreso());
        System.out.println("  - Sectores pendientes: " + inventario.getSectoresPendientes());
        System.out.println("  - Porcentaje completado: " + inventario.getPorcentajeCompletado());
        
        // Lógica de finalización basada en el parámetro forzarFinalizacion
        if (sectoresCompletados == sectores.size() && sectores.size() > 0) {
            if (forzarFinalizacion) {
                // ✅ FINALIZAR: Cuando se actualiza el stock del sistema
                System.out.println("✅ Todos los sectores están completados. Finalizando inventario por actualización de stock...");
                
                inventario.setEstado(InventarioCompleto.EstadoInventario.COMPLETADO);
                inventario.setFechaFinalizacion(LocalDateTime.now());
                
                inventarioCompletoRepository.save(inventario);
                System.out.println("✅ Inventario completo finalizado exitosamente por actualización de stock");
                return true;
            } else {
                // ✅ NO FINALIZAR: Cuando solo se completan los sectores
                System.out.println("✅ Todos los sectores están completados. Inventario listo para consolidación manual...");
                System.out.println("🔍 Manteniendo inventario EN_PROGRESO para permitir consolidación y actualización de stock");
                
                // NO cambiar el estado del inventario - mantenerlo EN_PROGRESO
                // El inventario solo se finaliza cuando se actualiza el stock del sistema
                inventarioCompletoRepository.save(inventario);
                System.out.println("✅ Inventario listo para consolidación - NO finalizado automáticamente");
                return false; // NO finalizar automáticamente
            }
        } else {
            System.out.println("⏳ Aún hay sectores pendientes o en progreso");
            // Guardar el progreso actualizado
            inventarioCompletoRepository.save(inventario);
            return false;
        }
    }

    /**
     * Actualizar stock del sistema y generar registro del inventario
     */
    @Transactional
    public Map<String, Object> actualizarStockYGenerarRegistro(Long inventarioId, List<Map<String, Object>> productosEditados, String observaciones, Long usuarioId) {
        System.out.println("🔄 Iniciando actualización de stock y generación de registro para inventario: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario completo no encontrado"));
        
        // Establecer el ID del inventario actual para usar en obtenerDistribucionRealPorSectores
        this.inventarioActualId = inventarioId;
        
        // Verificar que todos los sectores estén completados (incluyendo los completados sin conteo)
        List<ConteoSector> sectoresVerificacion = conteoSectorRepository.findByInventarioCompleto(inventario);
        boolean todosSectoresCompletados = sectoresVerificacion.stream()
            .allMatch(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO || 
                              sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO);
        
        if (!todosSectoresCompletados) {
            throw new RuntimeException("Todos los sectores deben estar completados para actualizar el stock");
        }
        
        // PASO CRÍTICO: Verificar y corregir stock de sectores "completado sin conteo"
        System.out.println("🔄 === VERIFICANDO STOCK DE SECTORES SIN CONTEO ===");
        verificarYCorregirStockSectoresSinConteo(inventario);
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Crear registro del inventario
        Map<String, Object> registroInventario = new HashMap<>();
        registroInventario.put("inventarioId", inventarioId);
        registroInventario.put("nombreInventario", inventario.getNombre());
        registroInventario.put("fechaRealizacion", inventario.getFechaFinalizacion());
        registroInventario.put("usuarioResponsable", usuario.getNombre() + " " + usuario.getApellidos());
        registroInventario.put("observaciones", observaciones);
        registroInventario.put("fechaGeneracion", LocalDateTime.now());
        
        // Obtener información de sectores antes de procesar productos
        List<ConteoSector> sectores = conteoSectorRepository.findByInventarioCompleto(inventario);
        
        // Procesar cada producto editado
        List<Map<String, Object>> productosActualizados = new ArrayList<>();
        int productosConDiferencias = 0;
        int productosSinDiferencias = 0;
        
        for (Map<String, Object> productoEditado : productosEditados) {
            Long productoId = Long.valueOf(productoEditado.get("productoId").toString());
            Integer cantidadFinal = Integer.valueOf(productoEditado.get("cantidadFinal").toString());
            String observacionesProducto = (String) productoEditado.get("observaciones");
            Boolean fueContado = (Boolean) productoEditado.get("fueContado");
            String accionSeleccionada = (String) productoEditado.get("accionSeleccionada");
            
            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));
            
            Integer stockAnterior = producto.getStock();
            Integer diferenciaStock = cantidadFinal - stockAnterior;
            
            // MANEJO DE PRODUCTOS NO CONTADOS
            if (fueContado != null && !fueContado) {
                System.out.println("⚠️ Procesando producto NO CONTADO: " + producto.getNombre());
                System.out.println("⚠️ Acción seleccionada: " + accionSeleccionada);
                
                if ("DAR_POR_0".equals(accionSeleccionada)) {
                    // Dar por 0 - actualizar stock a 0
                    cantidadFinal = 0;
                    diferenciaStock = cantidadFinal - stockAnterior;
                    System.out.println("⚠️ Producto NO CONTADO - Dado por 0: " + producto.getNombre());
                } else if ("EDITADO".equals(accionSeleccionada)) {
                    // EDITADO - usar el valor editado manualmente por el usuario
                    // La cantidadFinal ya viene del frontend con el valor editado
                    diferenciaStock = cantidadFinal - stockAnterior;
                    System.out.println("⚠️ Producto NO CONTADO - Editado manualmente: " + producto.getNombre() + 
                                     " - Cantidad editada: " + cantidadFinal);
                } else {
                    // OMITIR - conservar valor actual (no hacer nada)
                    cantidadFinal = stockAnterior;
                    diferenciaStock = 0;
                    System.out.println("⚠️ Producto NO CONTADO - Omitido (conserva valor): " + producto.getNombre());
                }
            }
            
            // Actualizar sector del producto basado en el inventario
            // Solo actualizar sector si el producto fue contado
            if (fueContado == null || fueContado) {
                // Buscar el sector más frecuente para este producto en el inventario
                List<ConteoSector> sectoresDelProducto = sectores.stream()
                    .filter(sector -> {
                        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(sector, producto);
                        return !detalles.isEmpty();
                    })
                    .collect(Collectors.toList());
                
                if (!sectoresDelProducto.isEmpty()) {
                    // Usar el sector con más conteos para este producto
                    ConteoSector sectorMasFrecuente = sectoresDelProducto.stream()
                        .max(Comparator.comparing(sector -> 
                            detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(sector, producto).size()))
                        .orElse(sectoresDelProducto.get(0));
                    
                    producto.setSectorAlmacenamiento(sectorMasFrecuente.getSector().getNombre());
                    System.out.println("✅ Sector actualizado para " + producto.getNombre() + 
                                     " - Nuevo sector: " + sectorMasFrecuente.getSector().getNombre());
                }
            }
            
            productoRepository.save(producto);
            
            // Actualizar stock por sector y sincronizar
            actualizarStockPorSector(producto, cantidadFinal);
            
            // Crear registro del producto
            Map<String, Object> registroProducto = new HashMap<>();
            registroProducto.put("productoId", productoId);
            registroProducto.put("nombreProducto", producto.getNombre());
            registroProducto.put("codigoProducto", producto.getCodigoPersonalizado());
            registroProducto.put("stockAnterior", stockAnterior);
            registroProducto.put("stockNuevo", cantidadFinal);
            registroProducto.put("diferenciaStock", diferenciaStock);
            registroProducto.put("observaciones", observacionesProducto);
            
            productosActualizados.add(registroProducto);
            
            if (diferenciaStock != 0) {
                productosConDiferencias++;
            } else {
                productosSinDiferencias++;
            }
            
            System.out.println("✅ Producto actualizado: " + producto.getNombre() + 
                             " - Stock anterior: " + stockAnterior + 
                             " - Stock nuevo: " + cantidadFinal + 
                             " - Diferencia: " + diferenciaStock);
        }
        
        // Crear información de sectores
        List<Map<String, Object>> sectoresInfo = new ArrayList<>();
        
        for (ConteoSector sector : sectores) {
            Map<String, Object> sectorInfo = new HashMap<>();
            sectorInfo.put("sectorId", sector.getSector().getId());
            sectorInfo.put("nombreSector", sector.getSector().getNombre());
            sectorInfo.put("productosContados", sector.getProductosContados());
            sectorInfo.put("productosConDiferencias", sector.getProductosConDiferencias());
            sectorInfo.put("fechaInicio", sector.getFechaCreacion());
            sectorInfo.put("fechaFinalizacion", sector.getFechaFinalizacion());
            sectorInfo.put("estado", sector.getEstado().toString());
            
            sectoresInfo.add(sectorInfo);
        }
        
        // Crear y guardar el registro del inventario en la base de datos
        RegistroInventario registroInventarioEntity = new RegistroInventario();
        registroInventarioEntity.setInventarioCompleto(inventario);
        registroInventarioEntity.setEmpresa(inventario.getEmpresa());
        registroInventarioEntity.setUsuarioResponsable(usuario);
        registroInventarioEntity.setNombreInventario(inventario.getNombre());
        registroInventarioEntity.setFechaRealizacion(inventario.getFechaFinalizacion() != null ? inventario.getFechaFinalizacion() : LocalDateTime.now());
        registroInventarioEntity.setObservaciones(observaciones);
        registroInventarioEntity.setFechaGeneracion(LocalDateTime.now());
        registroInventarioEntity.setTotalProductos(productosActualizados.size());
        registroInventarioEntity.setProductosConDiferencias(productosConDiferencias);
        registroInventarioEntity.setProductosSinDiferencias(productosSinDiferencias);
        registroInventarioEntity.setTotalSectores(sectores.size());
        
        // Guardar el registro principal
        registroInventarioEntity = registroInventarioRepository.save(registroInventarioEntity);
        System.out.println("✅ RegistroInventario guardado con ID: " + registroInventarioEntity.getId());
        
        // Crear y guardar los detalles del registro
        List<DetalleRegistroInventario> detallesRegistro = new ArrayList<>();
        for (Map<String, Object> productoActualizado : productosActualizados) {
            DetalleRegistroInventario detalle = new DetalleRegistroInventario();
            detalle.setRegistroInventario(registroInventarioEntity);
            
            Long productoId = Long.valueOf(productoActualizado.get("productoId").toString());
            Producto producto = productoRepository.findById(productoId).orElse(null);
            detalle.setProducto(producto);
            
            detalle.setNombreProducto((String) productoActualizado.get("nombreProducto"));
            detalle.setCodigoProducto((String) productoActualizado.get("codigoProducto"));
            detalle.setStockAnterior((Integer) productoActualizado.get("stockAnterior"));
            detalle.setStockNuevo((Integer) productoActualizado.get("stockNuevo"));
            detalle.setDiferenciaStock((Integer) productoActualizado.get("diferenciaStock"));
            detalle.setObservaciones((String) productoActualizado.get("observaciones"));
            detalle.setFechaActualizacion(LocalDateTime.now());
            
            detallesRegistro.add(detalle);
        }
        
        // Guardar todos los detalles
        detalleRegistroInventarioRepository.saveAll(detallesRegistro);
        System.out.println("✅ " + detallesRegistro.size() + " detalles de registro guardados");
        
        // Marcar inventario como completado y stock actualizado
        inventario.setEstado(InventarioCompleto.EstadoInventario.COMPLETADO);
        inventario.setFechaFinalizacion(LocalDateTime.now());
        inventario.setObservaciones("STOCK_ACTUALIZADO - Stock actualizado y registro generado el " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        inventarioCompletoRepository.save(inventario);
        
        System.out.println("✅ Inventario marcado como COMPLETADO con stock actualizado");
        
        // SINCRONIZAR STOCK AUTOMÁTICAMENTE - Ejecutar sincronización masiva
        sincronizarStockCompleto(inventario.getEmpresa().getId());
        
        // Crear respuesta completa
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("success", true);
        resultado.put("mensaje", "Stock actualizado y registro generado exitosamente");
        resultado.put("registroInventario", registroInventario);
        resultado.put("productosActualizados", productosActualizados);
        resultado.put("sectoresInfo", sectoresInfo);
        resultado.put("estadisticas", Map.of(
            "totalProductos", productosActualizados.size(),
            "productosConDiferencias", productosConDiferencias,
            "productosSinDiferencias", productosSinDiferencias,
            "totalSectores", sectores.size()
        ));
        
        System.out.println("✅ Registro generado y guardado exitosamente:");
        System.out.println("  - ID del registro: " + registroInventarioEntity.getId());
        System.out.println("  - Total productos: " + productosActualizados.size());
        System.out.println("  - Con diferencias: " + productosConDiferencias);
        System.out.println("  - Sin diferencias: " + productosSinDiferencias);
        System.out.println("  - Total sectores: " + sectores.size());
        
        return resultado;
    }

    /**
     * Obtener todos los productos consolidados de todos los sectores del inventario
     */
    public List<Map<String, Object>> obtenerProductosConsolidadosInventarioCompleto(Long inventarioId) {
        System.out.println("🔍 Obteniendo productos consolidados del inventario completo: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId).orElse(null);
        if (inventario == null) {
            System.out.println("❌ Inventario completo no encontrado con ID: " + inventarioId);
            return new ArrayList<>();
        }
        
        // Verificar que el inventario tenga sectores completados
        if (inventario.getSectoresCompletados() == null || inventario.getSectoresCompletados() == 0) {
            System.out.println("⚠️ No hay sectores completados en el inventario");
            return new ArrayList<>();
        }
        
        System.out.println("✅ Inventario con " + inventario.getSectoresCompletados() + " sectores completados. Estado: " + inventario.getEstado());
        
        // Obtener todos los sectores del inventario
        List<ConteoSector> sectores = conteoSectorRepository.findByInventarioCompleto(inventario);
        System.out.println("🔍 Procesando " + sectores.size() + " sectores para consolidación");
        
        // Filtrar sectores completados (incluyendo los completados sin conteo)
        List<ConteoSector> sectoresCompletados = sectores.stream()
            .filter(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO || 
                            sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO)
            .collect(Collectors.toList());
        
        // Separar sectores contados de los completados sin conteo
        List<ConteoSector> sectoresContados = sectores.stream()
            .filter(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO)
            .collect(Collectors.toList());
            
        List<ConteoSector> sectoresSinConteo = sectores.stream()
            .filter(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO)
            .collect(Collectors.toList());
        
        System.out.println("✅ Sectores completados encontrados: " + sectoresCompletados.size() + " de " + sectores.size());
        System.out.println("  - Sectores contados: " + sectoresContados.size());
        System.out.println("  - Sectores completados sin conteo: " + sectoresSinConteo.size());
        
        // Map para consolidar productos por ID (productoId -> datos consolidados)
        Map<Long, Map<String, Object>> productosConsolidados = new HashMap<>();
        
        // Procesar sectores que fueron realmente contados
        for (ConteoSector sector : sectoresContados) {
            System.out.println("🔍 Procesando sector: " + sector.getNombreSector() + " (ID: " + sector.getId() + ")");
            
            // Obtener detalles consolidados del sector
            List<DetalleConteo> detallesSector = obtenerDetallesConteoConsolidados(sector.getId());
            System.out.println("🔍 Detalles consolidados en sector: " + detallesSector.size());
            
            for (DetalleConteo detalle : detallesSector) {
                Long productoId = detalle.getProducto().getId();
                
                if (productosConsolidados.containsKey(productoId)) {
                    // Producto ya existe, actualizar datos
                    Map<String, Object> productoExistente = productosConsolidados.get(productoId);
                    
                    // Sumar cantidades
                    Integer cantidadActual1 = (Integer) productoExistente.get("cantidadConteo1");
                    Integer cantidadActual2 = (Integer) productoExistente.get("cantidadConteo2");
                    
                    Integer nuevaCantidad1 = (cantidadActual1 != null ? cantidadActual1 : 0) + 
                                           (detalle.getCantidadConteo1() != null ? detalle.getCantidadConteo1() : 0);
                    Integer nuevaCantidad2 = (cantidadActual2 != null ? cantidadActual2 : 0) + 
                                           (detalle.getCantidadConteo2() != null ? detalle.getCantidadConteo2() : 0);
                    
                    productoExistente.put("cantidadConteo1", nuevaCantidad1);
                    productoExistente.put("cantidadConteo2", nuevaCantidad2);
                    
                    // Concatenar fórmulas
                    String formulaActual1 = (String) productoExistente.get("formulaCalculo1");
                    String formulaActual2 = (String) productoExistente.get("formulaCalculo2");
                    
                    String nuevaFormula1 = formulaActual1 != null && !formulaActual1.isEmpty() ? 
                                         formulaActual1 + ", " + (detalle.getFormulaCalculo1() != null ? detalle.getFormulaCalculo1() : "") :
                                         (detalle.getFormulaCalculo1() != null ? detalle.getFormulaCalculo1() : "");
                    String nuevaFormula2 = formulaActual2 != null && !formulaActual2.isEmpty() ? 
                                         formulaActual2 + ", " + (detalle.getFormulaCalculo2() != null ? detalle.getFormulaCalculo2() : "") :
                                         (detalle.getFormulaCalculo2() != null ? detalle.getFormulaCalculo2() : "");
                    
                    productoExistente.put("formulaCalculo1", nuevaFormula1);
                    productoExistente.put("formulaCalculo2", nuevaFormula2);
                    
                    // Agregar sector a la lista
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> sectoresDelProducto = (List<Map<String, Object>>) productoExistente.get("sectores");
                    if (sectoresDelProducto == null) {
                        sectoresDelProducto = new ArrayList<>();
                        productoExistente.put("sectores", sectoresDelProducto);
                    }
                    
                    Map<String, Object> sectorInfo = new HashMap<>();
                    sectorInfo.put("sectorId", sector.getId());
                    sectorInfo.put("nombreSector", sector.getNombreSector());
                    sectorInfo.put("cantidadConteo1", detalle.getCantidadConteo1());
                    sectorInfo.put("cantidadConteo2", detalle.getCantidadConteo2());
                    sectorInfo.put("formulaCalculo1", detalle.getFormulaCalculo1());
                    sectorInfo.put("formulaCalculo2", detalle.getFormulaCalculo2());
                    sectoresDelProducto.add(sectorInfo);
                    
                    System.out.println("  ➕ Producto existente actualizado: " + detalle.getProducto().getNombre() + 
                                     " - Total Usuario1: " + nuevaCantidad1 + ", Total Usuario2: " + nuevaCantidad2);
                } else {
                    // Nuevo producto
                    Map<String, Object> nuevoProducto = new HashMap<>();
                    nuevoProducto.put("productoId", productoId);
                    nuevoProducto.put("nombreProducto", detalle.getProducto().getNombre());
                    nuevoProducto.put("codigoProducto", detalle.getProducto().getCodigoPersonalizado());
                    nuevoProducto.put("stockSistema", detalle.getStockSistema());
                    nuevoProducto.put("cantidadConteo1", detalle.getCantidadConteo1());
                    nuevoProducto.put("cantidadConteo2", detalle.getCantidadConteo2());
                    nuevoProducto.put("formulaCalculo1", detalle.getFormulaCalculo1());
                    nuevoProducto.put("formulaCalculo2", detalle.getFormulaCalculo2());
                    nuevoProducto.put("diferenciaSistema", detalle.getDiferenciaSistema());
                    nuevoProducto.put("diferenciaEntreConteos", detalle.getDiferenciaEntreConteos());
                    
                    // Lista de sectores para este producto
                    List<Map<String, Object>> sectoresDelProducto = new ArrayList<>();
                    Map<String, Object> sectorInfo = new HashMap<>();
                    sectorInfo.put("sectorId", sector.getId());
                    sectorInfo.put("nombreSector", sector.getNombreSector());
                    sectorInfo.put("cantidadConteo1", detalle.getCantidadConteo1());
                    sectorInfo.put("cantidadConteo2", detalle.getCantidadConteo2());
                    sectorInfo.put("formulaCalculo1", detalle.getFormulaCalculo1());
                    sectorInfo.put("formulaCalculo2", detalle.getFormulaCalculo2());
                    sectoresDelProducto.add(sectorInfo);
                    nuevoProducto.put("sectores", sectoresDelProducto);
                    
                    productosConsolidados.put(productoId, nuevoProducto);
                    
                    System.out.println("  ➕ Nuevo producto agregado: " + detalle.getProducto().getNombre() + 
                                     " - Usuario1: " + detalle.getCantidadConteo1() + ", Usuario2: " + detalle.getCantidadConteo2());
                }
            }
        }
        
        // Calcular stock ajustado para productos contados (descontando sectores completados sin conteo)
        System.out.println("🔍 Calculando stock ajustado para productos contados...");
        for (Map<String, Object> producto : productosConsolidados.values()) {
            Long productoId = (Long) producto.get("productoId");
            Integer stockOriginal = (Integer) producto.get("stockSistema");
            
            // Calcular stock ajustado descontando sectores completados sin conteo
            Integer stockAjustado = calcularStockAjustado(productoId, stockOriginal, sectoresSinConteo);
            producto.put("stockSistema", stockAjustado);
            
            // Recalcular diferencias con el stock ajustado
            Integer cantidadConteo1 = (Integer) producto.get("cantidadConteo1");
            Integer cantidadConteo2 = (Integer) producto.get("cantidadConteo2");
            Integer cantidadFinal = Math.max(cantidadConteo1 != null ? cantidadConteo1 : 0, cantidadConteo2 != null ? cantidadConteo2 : 0);
            
            // ✅ AGREGAR cantidadFinal al producto para que se muestre correctamente en el frontend
            producto.put("cantidadFinal", cantidadFinal);
            producto.put("diferenciaSistema", cantidadFinal - stockAjustado);
            
            System.out.println("  📊 Producto: " + producto.get("nombreProducto") + 
                             " - Stock original: " + stockOriginal + 
                             " - Stock ajustado: " + stockAjustado + 
                             " - Cantidad final: " + cantidadFinal);
        }
        
        // AGREGAR PRODUCTOS NO CONTADOS - Solo productos que NO están en sectores contados NI en sectores sin conteo
        // (Los productos de sectores sin conteo NO aparecen en la lista, pero se descuentan del stock)
        System.out.println("🔍 Buscando productos realmente no contados...");
        List<Producto> todosLosProductos = productoRepository.findByEmpresaId(inventario.getEmpresa().getId());
        System.out.println("🔍 Total de productos en el sistema: " + todosLosProductos.size());
        
        // Obtener IDs de productos que están en sectores completados sin conteo
        Set<Long> productosEnSectoresSinConteo = new HashSet<>();
        for (ConteoSector sector : sectoresSinConteo) {
            List<StockPorSector> stockEnSector = stockPorSectorRepository.findBySectorId(sector.getSector().getId());
            for (StockPorSector stockPorSector : stockEnSector) {
                productosEnSectoresSinConteo.add(stockPorSector.getProducto().getId());
            }
        }
        System.out.println("🔍 Productos en sectores sin conteo: " + productosEnSectoresSinConteo.size());
        
        int productosNoContados = 0;
        for (Producto producto : todosLosProductos) {
            if (!productosConsolidados.containsKey(producto.getId()) && 
                !productosEnSectoresSinConteo.contains(producto.getId())) {
                // Producto realmente no fue contado (no está en sectores contados ni en sectores sin conteo)
                Integer stockAjustado = calcularStockAjustado(producto.getId(), producto.getStock(), sectoresSinConteo);
                
                Map<String, Object> productoNoContado = new HashMap<>();
                productoNoContado.put("productoId", producto.getId());
                productoNoContado.put("nombreProducto", producto.getNombre());
                productoNoContado.put("codigoProducto", producto.getCodigoPersonalizado());
                productoNoContado.put("stockSistema", stockAjustado); // Usar stock ajustado
                productoNoContado.put("cantidadConteo1", 0);
                productoNoContado.put("cantidadConteo2", 0);
                productoNoContado.put("formulaCalculo1", "");
                productoNoContado.put("formulaCalculo2", "");
                productoNoContado.put("diferenciaSistema", -stockAjustado); // Negativo porque no fue contado
                productoNoContado.put("diferenciaEntreConteos", 0);
                productoNoContado.put("fueContado", false); // Marcar que no fue contado
                productoNoContado.put("accionRecomendada", "OMITIR"); // Acción por defecto: omitir
                productoNoContado.put("cantidadFinal", stockAjustado); // Valor por defecto: stock ajustado
                
                // Lista vacía de sectores (no fue contado en ningún sector)
                productoNoContado.put("sectores", new ArrayList<>());
                
                productosConsolidados.put(producto.getId(), productoNoContado);
                productosNoContados++;
                
                System.out.println("  ⚠️ Producto realmente no contado agregado: " + producto.getNombre() + 
                                 " - Stock original: " + producto.getStock() + 
                                 " - Stock ajustado: " + stockAjustado);
            } else if (productosConsolidados.containsKey(producto.getId())) {
                // Marcar productos contados (ya procesados anteriormente)
                productosConsolidados.get(producto.getId()).put("fueContado", true);
                productosConsolidados.get(producto.getId()).put("accionRecomendada", "ACTUALIZAR");
            } else {
                // Producto está en sector sin conteo - NO agregarlo a la lista
                System.out.println("  ✅ Producto en sector sin conteo (NO agregado a lista): " + producto.getNombre());
            }
        }
        
        System.out.println("📊 Resumen de productos:");
        System.out.println("  - Total en sistema: " + todosLosProductos.size());
        System.out.println("  - Contados: " + (todosLosProductos.size() - productosNoContados));
        System.out.println("  - No contados: " + productosNoContados);
        
        List<Map<String, Object>> resultado = new ArrayList<>(productosConsolidados.values());
        
        // Ordenar: productos contados primero, luego no contados
        resultado.sort((a, b) -> {
            Boolean fueContadoA = (Boolean) a.get("fueContado");
            Boolean fueContadoB = (Boolean) b.get("fueContado");
            
            if (fueContadoA && !fueContadoB) return -1;
            if (!fueContadoA && fueContadoB) return 1;
            return 0; // Mismo tipo, mantener orden original
        });
        
        System.out.println("✅ Productos consolidados del inventario completo: " + resultado.size());
        return resultado;
    }

    /**
     * Obtener registros de inventarios completados para una empresa
     */
    public List<Map<String, Object>> obtenerRegistrosInventariosCompletados(Long empresaId) {
        System.out.println("🔍 Obteniendo registros de inventarios completados para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
        if (empresa == null) {
            System.out.println("❌ Empresa no encontrada con ID: " + empresaId);
            return new ArrayList<>();
        }
        
        // Obtener registros de inventarios desde la tabla RegistroInventario
        List<RegistroInventario> registrosInventarios = registroInventarioRepository.findByEmpresaOrderByFechaGeneracionDesc(empresa);
        
        System.out.println("✅ Registros de inventarios encontrados: " + registrosInventarios.size());
        
        List<Map<String, Object>> registros = new ArrayList<>();
        
        for (RegistroInventario registroInventario : registrosInventarios) {
            Map<String, Object> registro = new HashMap<>();
            registro.put("inventarioId", registroInventario.getInventarioCompleto().getId());
            registro.put("nombreInventario", registroInventario.getNombreInventario());
            registro.put("fechaRealizacion", registroInventario.getFechaRealizacion());
            registro.put("observaciones", registroInventario.getObservaciones());
            
            // Obtener información de sectores del inventario original
            List<ConteoSector> sectores = conteoSectorRepository.findByInventarioCompleto(registroInventario.getInventarioCompleto());
            List<Map<String, Object>> sectoresInfo = new ArrayList<>();
            
            for (ConteoSector sector : sectores) {
                Map<String, Object> sectorInfo = new HashMap<>();
                sectorInfo.put("sectorId", sector.getSector().getId());
                sectorInfo.put("nombreSector", sector.getSector().getNombre());
                sectorInfo.put("productosContados", sector.getProductosContados());
                sectorInfo.put("productosConDiferencias", sector.getProductosConDiferencias());
                sectorInfo.put("estado", sector.getEstado().toString());
                
                sectoresInfo.add(sectorInfo);
            }
            
            registro.put("sectoresInfo", sectoresInfo);
            registro.put("estadisticas", Map.of(
                "totalSectores", registroInventario.getTotalSectores(),
                "totalProductos", registroInventario.getTotalProductos(),
                "productosConDiferencias", registroInventario.getProductosConDiferencias()
            ));
            
            // Obtener información del usuario responsable
            if (registroInventario.getUsuarioResponsable() != null) {
                registro.put("usuarioResponsable", 
                    registroInventario.getUsuarioResponsable().getNombre() + " " + 
                    registroInventario.getUsuarioResponsable().getApellidos());
            }
            
            registros.add(registro);
            
            System.out.println("✅ Registro agregado: " + registroInventario.getNombreInventario() + 
                             " - Fecha: " + registroInventario.getFechaRealizacion());
        }
        
        System.out.println("✅ Total registros generados: " + registros.size());
        return registros;
    }

    /**
     * Obtener detalles de productos actualizados para un inventario específico
     */
    public List<Map<String, Object>> obtenerProductosActualizadosInventario(Long inventarioId) {
        System.out.println("🔍 Obteniendo productos actualizados para inventario: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario completo no encontrado"));
        
        // Buscar el registro de inventario correspondiente
        List<RegistroInventario> registrosInventarios = registroInventarioRepository.findByEmpresaOrderByFechaGeneracionDesc(inventario.getEmpresa());
        RegistroInventario registroInventario = registrosInventarios.stream()
            .filter(registro -> registro.getInventarioCompleto().getId().equals(inventarioId))
            .findFirst()
            .orElse(null);
        
        if (registroInventario == null) {
            System.out.println("❌ No se encontró registro de inventario para el inventario: " + inventarioId);
            return new ArrayList<>();
        }
        
        // Obtener los detalles del registro
        List<DetalleRegistroInventario> detallesRegistro = detalleRegistroInventarioRepository.findByRegistroInventario(registroInventario);
        
        System.out.println("✅ Detalles de registro encontrados: " + detallesRegistro.size());
        
        List<Map<String, Object>> productosActualizados = new ArrayList<>();
        
        for (DetalleRegistroInventario detalle : detallesRegistro) {
            Map<String, Object> producto = new HashMap<>();
            producto.put("productoId", detalle.getProducto().getId());
            producto.put("nombreProducto", detalle.getNombreProducto());
            producto.put("codigoProducto", detalle.getCodigoProducto());
            producto.put("stockAnterior", detalle.getStockAnterior());
            producto.put("stockNuevo", detalle.getStockNuevo());
            producto.put("diferenciaStock", detalle.getDiferenciaStock());
            producto.put("observaciones", detalle.getObservaciones());
            
            productosActualizados.add(producto);
            
            System.out.println("✅ Producto cargado: " + detalle.getNombreProducto() + 
                             " - Stock anterior: " + detalle.getStockAnterior() + 
                             " - Stock nuevo: " + detalle.getStockNuevo() + 
                             " - Diferencia: " + detalle.getDiferenciaStock());
        }
        
        System.out.println("✅ Productos actualizados obtenidos: " + productosActualizados.size());
        return productosActualizados;
    }

    /**
     * Obtener detalles de conteo por usuario
     */
    public List<DetalleConteo> obtenerDetallesConteoPorUsuario(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Obteniendo detalles de conteo para usuario: " + usuarioId + " en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        // Verificar si estamos en modo reconteo (estado CON_DIFERENCIAS)
        boolean esModoReconteo = conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS;
        System.out.println("🔍 Modo reconteo: " + esModoReconteo + " (Estado: " + conteoSector.getEstado() + ")");
        
        // Determinar qué usuario es
        boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                           conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                           conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        
        System.out.println("🔍 Usuario " + usuarioId + " - EsUsuario1: " + esUsuario1 + ", EsUsuario2: " + esUsuario2);
        
        if (esModoReconteo) {
            // En modo reconteo: usar lógica consolidada
            return obtenerDetallesConsolidadosParaReconteo(conteoSector, esUsuario1, esUsuario2);
        } else {
            // En modo conteo normal: devolver solo detalles del usuario actual
            return obtenerDetallesSoloUsuarioActual(conteoSector, usuarioId, esUsuario1, esUsuario2);
        }
    }
    
    /**
     * Obtener detalles consolidados para reconteo
     */
    private List<DetalleConteo> obtenerDetallesConsolidadosParaReconteo(ConteoSector conteoSector, boolean esUsuario1, boolean esUsuario2) {
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ Todos los detalles encontrados (SIN eliminados): " + todosLosDetalles.size());
        
        // Agrupar por producto para consolidar múltiples entradas
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : todosLosDetalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Crear detalles consolidados con la información más reciente de cada usuario
        Map<Long, DetalleConteo> detallesConsolidados = new HashMap<>();
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Crear un detalle consolidado
            DetalleConteo detalleConsolidado = new DetalleConteo();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // Copiar información básica
            detalleConsolidado.setId(primerDetalle.getId());
            detalleConsolidado.setConteoSector(primerDetalle.getConteoSector());
            detalleConsolidado.setProducto(primerDetalle.getProducto());
            detalleConsolidado.setStockSistema(primerDetalle.getStockSistema());
            
            // ✅ NUEVA LÓGICA: SUMAR TODAS LAS ENTRADAS de cada usuario (no solo la más reciente)
            int totalUsuario1 = 0;
            int totalUsuario2 = 0;
            List<String> formulasUsuario1 = new ArrayList<>();
            List<String> formulasUsuario2 = new ArrayList<>();
            LocalDateTime fechaMasReciente = null;
            
            for (DetalleConteo detalle : detallesDelProducto) {
                // Sumar todas las entradas del Usuario 1
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    totalUsuario1 += detalle.getCantidadConteo1();
                    if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                        formulasUsuario1.add(detalle.getFormulaCalculo1());
                    }
                    System.out.println("  ➕ RECONTEO - Sumando Usuario1: " + detalle.getCantidadConteo1() + " (Total: " + totalUsuario1 + ")");
                }
                
                // Sumar todas las entradas del Usuario 2
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    totalUsuario2 += detalle.getCantidadConteo2();
                    if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                        formulasUsuario2.add(detalle.getFormulaCalculo2());
                    }
                    System.out.println("  ➕ RECONTEO - Sumando Usuario2: " + detalle.getCantidadConteo2() + " (Total: " + totalUsuario2 + ")");
                }
                
                // Mantener la fecha más reciente
                if (fechaMasReciente == null || 
                    (detalle.getFechaActualizacion() != null && detalle.getFechaActualizacion().isAfter(fechaMasReciente))) {
                    fechaMasReciente = detalle.getFechaActualizacion();
                }
            }
            
            // Asignar los totales consolidados
                detalleConsolidado.setCantidadConteo1(totalUsuario1 != null ? totalUsuario1 : 0);
                detalleConsolidado.setFormulaCalculo1(formulasUsuario1.isEmpty() ? null : String.join(", ", formulasUsuario1));
                detalleConsolidado.setCantidadConteo2(totalUsuario2 != null ? totalUsuario2 : 0);
                detalleConsolidado.setFormulaCalculo2(formulasUsuario2.isEmpty() ? null : String.join(", ", formulasUsuario2));
            
            // Usar la fecha más reciente
            detalleConsolidado.setFechaActualizacion(fechaMasReciente);
            
            detallesConsolidados.put(productoId, detalleConsolidado);
            
            System.out.println("🔧 RECONTEO - Detalle consolidado para " + primerDetalle.getProducto().getNombre() + 
                             " - Usuario1: " + totalUsuario1 + " (" + String.join(", ", formulasUsuario1) + ")" +
                             " - Usuario2: " + totalUsuario2 + " (" + String.join(", ", formulasUsuario2) + ")" +
                             " - Total entradas: " + detallesDelProducto.size());
        }
        
        List<DetalleConteo> detallesFiltrados = new ArrayList<>();
        
        for (DetalleConteo detalle : detallesConsolidados.values()) {
            // ✅ LÓGICA CORREGIDA: Solo incluir productos que tienen diferencias entre los conteos
            boolean tieneDiferencias = false;
            
            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo2() != null) {
                // Ambos usuarios contaron: verificar si hay diferencia
                tieneDiferencias = !detalle.getCantidadConteo1().equals(detalle.getCantidadConteo2());
            } else if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                // Solo usuario 1 contó: hay diferencia
                tieneDiferencias = true;
            } else if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                // Solo usuario 2 contó: hay diferencia
                tieneDiferencias = true;
            }
            
            if (tieneDiferencias) {
                detallesFiltrados.add(detalle);
                System.out.println("✅ RECONTEO: Incluyendo producto " + detalle.getProducto().getNombre() + 
                                 " - Usuario1: " + detalle.getCantidadConteo1() + 
                                 ", Usuario2: " + detalle.getCantidadConteo2());
            }
        }
        
        System.out.println("✅ Detalles filtrados para reconteo: " + detallesFiltrados.size());
        return detallesFiltrados;
    }


    /**
     * Obtener detalles de conteo para reconteo (consolidados)
     * CORREGIDO: Mostrar solo conteos iniciales durante reconteo en proceso
     */
    public List<DetalleConteo> obtenerDetallesConteoParaReconteo(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo detalles consolidados para reconteo en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles encontrados para reconteo (SIN eliminados): " + todosLosDetalles.size());
        
        // Verificar si estamos en reconteo y determinar fecha de inicio
        boolean esReconteo = conteoSector.getObservaciones() != null && 
                            conteoSector.getObservaciones().startsWith("Reconteo_");
        
        // Parsear fecha de inicio del reconteo
        LocalDateTime fechaInicioReconteo = null;
        if (esReconteo) {
            try {
                String fechaStr = conteoSector.getObservaciones().split("_")[1];
                fechaInicioReconteo = LocalDateTime.parse(fechaStr);
            } catch (Exception e) {
                System.out.println("⚠️ No se pudo parsear fecha de reconteo: " + conteoSector.getObservaciones());
                fechaInicioReconteo = null;
            }
        }
        
        // Crear variable final para usar en streams
        final LocalDateTime fechaInicioFinal = fechaInicioReconteo;
        
        // ✅ NUEVA LÓGICA: Determinar qué serie de reconteo estamos
        int numeroSerieReconteo = 1; // Por defecto, primera serie
        if (esReconteo && fechaInicioReconteo != null) {
            // Contar cuántos reconteos han ocurrido desde la fecha de inicio
            List<DetalleConteo> reconteosDesdeInicio = todosLosDetalles.stream()
                .filter(detalle -> detalle.getFechaActualizacion() != null && 
                                 detalle.getFechaActualizacion().isAfter(fechaInicioFinal))
                .collect(java.util.stream.Collectors.toList());
            
            // ✅ LÓGICA CORREGIDA: Contar series completas (cuando ambos usuarios han recuentado)
            // Agrupar por producto para verificar si ambos usuarios han recuentado
            Map<Long, List<DetalleConteo>> reconteosPorProducto = reconteosDesdeInicio.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    detalle -> detalle.getProducto().getId()
                ));
            
            int seriesCompletas = 0;
            for (List<DetalleConteo> reconteosDelProducto : reconteosPorProducto.values()) {
                boolean usuario1HaRecontado = reconteosDelProducto.stream()
                    .anyMatch(detalle -> detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0);
                boolean usuario2HaRecontado = reconteosDelProducto.stream()
                    .anyMatch(detalle -> detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0);
                
                // Si ambos usuarios han recuentado, es una serie completa
                if (usuario1HaRecontado && usuario2HaRecontado) {
                    seriesCompletas++;
                }
            }
            
            // Si hay series completas, la próxima es serie + 1
            // Si no hay series completas, estamos en la primera serie
            numeroSerieReconteo = seriesCompletas > 0 ? seriesCompletas + 1 : 1;
            
            System.out.println("🔍 RECONTEO: Detectada serie #" + numeroSerieReconteo + " de reconteo");
            System.out.println("🔍 RECONTEO: Series completas detectadas: " + seriesCompletas);
        }
        
        // Agrupar por producto para consolidar múltiples entradas
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : todosLosDetalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Crear detalles consolidados
        List<DetalleConteo> detallesConsolidados = new ArrayList<>();
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Crear un detalle consolidado
            DetalleConteo detalleConsolidado = new DetalleConteo();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // Copiar información básica
            detalleConsolidado.setId(primerDetalle.getId());
            detalleConsolidado.setConteoSector(primerDetalle.getConteoSector());
            detalleConsolidado.setProducto(primerDetalle.getProducto());
            detalleConsolidado.setStockSistema(primerDetalle.getStockSistema());
            
            // ✅ LÓGICA CORREGIDA: Mostrar referencia correcta según serie de reconteo
            if (esReconteo && fechaInicioReconteo != null) {
                if (numeroSerieReconteo == 1) {
                    // PRIMERA SERIE: Mostrar solo conteos iniciales como referencia
                    System.out.println("🔄 PRIMERA SERIE RECONTEO: Mostrando conteos iniciales como referencia");
                    
                    // ✅ CRÍTICO: Filtrar solo conteos INICIALES (antes de fechaInicioReconteo)
                    // NO incluir reconteos para no mezclar valores
                    List<DetalleConteo> conteosIniciales = detallesDelProducto.stream()
                        .filter(detalle -> {
                            // Si no hay fecha de inicio, incluir todos (fallback)
                            if (fechaInicioFinal == null) return true;
                            // Incluir solo los que son ANTES del inicio del reconteo
                            return detalle.getFechaActualizacion() == null || 
                                   detalle.getFechaActualizacion().isBefore(fechaInicioFinal);
                        })
                        .collect(java.util.stream.Collectors.toList());
                    
                    System.out.println("🔍 DEBUG - Detalles iniciales (sin reconteos): " + conteosIniciales.size() + " de " + detallesDelProducto.size());
                    
                    // ✅ SUMAR TODAS LAS ENTRADAS de cada usuario en conteos INICIALES
                    int totalUsuario1 = 0;
                    int totalUsuario2 = 0;
                    List<String> formulasUsuario1 = new ArrayList<>();
                    List<String> formulasUsuario2 = new ArrayList<>();
                    
                    for (DetalleConteo detalle : conteosIniciales) {
                        // Sumar todas las entradas del Usuario 1
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            totalUsuario1 += detalle.getCantidadConteo1();
                            if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                                formulasUsuario1.add(detalle.getFormulaCalculo1());
                            }
                            System.out.println("  ➕ PRIMERA SERIE - Sumando Usuario1: " + detalle.getCantidadConteo1() + " (Total: " + totalUsuario1 + ")");
                        }
                        
                        // Sumar todas las entradas del Usuario 2
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            totalUsuario2 += detalle.getCantidadConteo2();
                            if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                                formulasUsuario2.add(detalle.getFormulaCalculo2());
                            }
                            System.out.println("  ➕ PRIMERA SERIE - Sumando Usuario2: " + detalle.getCantidadConteo2() + " (Total: " + totalUsuario2 + ")");
                        }
                    }
                    
                    // Asignar los totales consolidados
                    detalleConsolidado.setCantidadConteo1(totalUsuario1 > 0 ? totalUsuario1 : null);
                    detalleConsolidado.setFormulaCalculo1(formulasUsuario1.isEmpty() ? null : String.join(", ", formulasUsuario1));
                    detalleConsolidado.setCantidadConteo2(totalUsuario2 > 0 ? totalUsuario2 : null);
                    detalleConsolidado.setFormulaCalculo2(formulasUsuario2.isEmpty() ? null : String.join(", ", formulasUsuario2));
                    
                    System.out.println("🔧 PRIMERA SERIE: Conteos iniciales como referencia para " + primerDetalle.getProducto().getNombre() + 
                                     " - Usuario1: " + detalleConsolidado.getCantidadConteo1() + " (" + detalleConsolidado.getFormulaCalculo1() + ")" +
                                     " - Usuario2: " + detalleConsolidado.getCantidadConteo2() + " (" + detalleConsolidado.getFormulaCalculo2() + ")");
                
                } else {
                    // SEGUNDA SERIE O POSTERIOR: Mostrar solo el reconteo anterior como referencia
                    System.out.println("🔄 SERIE #" + numeroSerieReconteo + " RECONTEO: Mostrando reconteo anterior como referencia");
                    
                    // Filtrar solo reconteos (después del inicio del reconteo)
                    List<DetalleConteo> reconteos = detallesDelProducto.stream()
                        .filter(detalle -> detalle.getFechaActualizacion() != null && detalle.getFechaActualizacion().isAfter(fechaInicioFinal))
                        .collect(java.util.stream.Collectors.toList());
                    
                    // ✅ CORRECCIÓN: Para segunda serie, encontrar el valor más reciente de cada usuario independientemente
                    // Ordenar por fecha descendente (más reciente primero)
                    reconteos.sort((d1, d2) -> {
                        if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
                        if (d1.getFechaActualizacion() == null) return 1;
                        if (d2.getFechaActualizacion() == null) return -1;
                        return d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion());
                    });
                    
                    // Buscar el valor más reciente de Usuario1
                    Integer valorMasRecienteUsuario1 = null;
                    String formulaMasRecienteUsuario1 = null;
                    for (DetalleConteo detalle : reconteos) {
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            valorMasRecienteUsuario1 = detalle.getCantidadConteo1();
                            formulaMasRecienteUsuario1 = detalle.getFormulaCalculo1();
                            System.out.println("✅ SERIE #" + numeroSerieReconteo + " - Usuario1 más reciente: " + valorMasRecienteUsuario1);
                            break;
                        }
                    }
                    
                    // Buscar el valor más reciente de Usuario2
                    Integer valorMasRecienteUsuario2 = null;
                    String formulaMasRecienteUsuario2 = null;
                    for (DetalleConteo detalle : reconteos) {
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            valorMasRecienteUsuario2 = detalle.getCantidadConteo2();
                            formulaMasRecienteUsuario2 = detalle.getFormulaCalculo2();
                            System.out.println("✅ SERIE #" + numeroSerieReconteo + " - Usuario2 más reciente: " + valorMasRecienteUsuario2);
                            break;
                        }
                    }
                    
                    // Asignar los valores encontrados
                    detalleConsolidado.setCantidadConteo1(valorMasRecienteUsuario1);
                    detalleConsolidado.setFormulaCalculo1(formulaMasRecienteUsuario1);
                    detalleConsolidado.setCantidadConteo2(valorMasRecienteUsuario2);
                    detalleConsolidado.setFormulaCalculo2(formulaMasRecienteUsuario2);
                    
                    System.out.println("🔧 SERIE #" + numeroSerieReconteo + ": Reconteo anterior como referencia para " + primerDetalle.getProducto().getNombre() + 
                                     " - Usuario1: " + detalleConsolidado.getCantidadConteo1() + " (" + detalleConsolidado.getFormulaCalculo1() + ")" +
                                     " - Usuario2: " + detalleConsolidado.getCantidadConteo2() + " (" + detalleConsolidado.getFormulaCalculo2() + ")");
                }
                
            } else {
                // ✅ MODO NORMAL: Mostrar cantidades más recientes (lógica original)
            Integer cantidadMasRecienteUsuario1 = null;
            String formulaMasRecienteUsuario1 = null;
            LocalDateTime fechaMasRecienteUsuario1 = null;
            
            Integer cantidadMasRecienteUsuario2 = null;
            String formulaMasRecienteUsuario2 = null;
            LocalDateTime fechaMasRecienteUsuario2 = null;
            
            for (DetalleConteo detalle : detallesDelProducto) {
                // Para usuario 1
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    if (fechaMasRecienteUsuario1 == null || 
                        (detalle.getFechaActualizacion() != null && detalle.getFechaActualizacion().isAfter(fechaMasRecienteUsuario1))) {
                        cantidadMasRecienteUsuario1 = detalle.getCantidadConteo1();
                        formulaMasRecienteUsuario1 = detalle.getFormulaCalculo1();
                        fechaMasRecienteUsuario1 = detalle.getFechaActualizacion();
                    }
                }
                
                // Para usuario 2
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    if (fechaMasRecienteUsuario2 == null || 
                        (detalle.getFechaActualizacion() != null && detalle.getFechaActualizacion().isAfter(fechaMasRecienteUsuario2))) {
                        cantidadMasRecienteUsuario2 = detalle.getCantidadConteo2();
                        formulaMasRecienteUsuario2 = detalle.getFormulaCalculo2();
                        fechaMasRecienteUsuario2 = detalle.getFechaActualizacion();
                    }
                }
            }
            
            // Asignar las cantidades y fórmulas más recientes
            detalleConsolidado.setCantidadConteo1(cantidadMasRecienteUsuario1);
            detalleConsolidado.setFormulaCalculo1(formulaMasRecienteUsuario1);
            detalleConsolidado.setCantidadConteo2(cantidadMasRecienteUsuario2);
            detalleConsolidado.setFormulaCalculo2(formulaMasRecienteUsuario2);
            }
            
            // ✅ LÓGICA CORREGIDA: Solo incluir productos que tienen diferencias entre los conteos
            boolean tieneDiferencias = false;
            
            if (detalleConsolidado.getCantidadConteo1() != null && detalleConsolidado.getCantidadConteo2() != null) {
                // Ambos usuarios contaron: verificar si hay diferencia
                tieneDiferencias = !detalleConsolidado.getCantidadConteo1().equals(detalleConsolidado.getCantidadConteo2());
            } else if (detalleConsolidado.getCantidadConteo1() != null && detalleConsolidado.getCantidadConteo1() > 0) {
                // Solo usuario 1 contó: hay diferencia
                tieneDiferencias = true;
            } else if (detalleConsolidado.getCantidadConteo2() != null && detalleConsolidado.getCantidadConteo2() > 0) {
                // Solo usuario 2 contó: hay diferencia
                tieneDiferencias = true;
            }
            
            if (tieneDiferencias) {
                detallesConsolidados.add(detalleConsolidado);
                System.out.println("✅ RECONTEO: Incluyendo producto " + detalleConsolidado.getProducto().getNombre() + 
                                 " - Usuario1: " + detalleConsolidado.getCantidadConteo1() + 
                                 ", Usuario2: " + detalleConsolidado.getCantidadConteo2());
            }
        }
        
        System.out.println("✅ Detalles consolidados para reconteo: " + detallesConsolidados.size());
        
        return detallesConsolidados;
    }

    /**
     * Obtener detalles consolidados para reconteo (SOLO productos con diferencias)
     * ✅ NUEVA LÓGICA SIMPLE: Usa el servicio simple para obtener detalles
     */
    public List<Map<String, Object>> obtenerDetallesParaReconteo(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 [SIMPLE] Obteniendo detalles para RECONTEO usando lógica simple - Sector: " + conteoSectorId);
        System.out.println("🔍 [SIMPLE] Usuario solicitando reconteo: " + usuarioId);
        
        // ✅ NUEVA LÓGICA SIMPLE: Delegar al método simple
        return obtenerDetallesParaReconteoSimple(conteoSectorId, usuarioId);
    }

    /**
     * ✅ NUEVO MÉTODO: Obtener detalle final del sector completado
     * Muestra TODOS los productos con sus valores finales correctos (sin diferencias)
     */
    public List<DetalleConteo> obtenerDetalleFinalSectorCompletado(Long conteoSectorId) {
        System.out.println("🔍 [FINAL] Obteniendo detalle final del sector completado: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            System.out.println("❌ [FINAL] ConteoSector no encontrado para ID: " + conteoSectorId);
            return new ArrayList<>();
        }
        
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ [FINAL] Detalles encontrados (SIN eliminados): " + todosLosDetalles.size());
        
        // Verificar si hubo reconteo
        boolean huboReconteo = conteoSector.getObservaciones() != null && 
                              conteoSector.getObservaciones().startsWith("Reconteo");
        
        System.out.println("🔍 [FINAL] ¿Hubo reconteo? " + huboReconteo);
        
        // Agrupar por producto para consolidar múltiples entradas
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : todosLosDetalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Crear detalles finales consolidados
        List<DetalleConteo> detallesFinales = new ArrayList<>();
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Crear un detalle final consolidado
            DetalleConteo detalleFinal = new DetalleConteo();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // Copiar información básica
            detalleFinal.setId(primerDetalle.getId());
            detalleFinal.setConteoSector(primerDetalle.getConteoSector());
            detalleFinal.setProducto(primerDetalle.getProducto());
            detalleFinal.setStockSistema(primerDetalle.getStockSistema());
            
            if (huboReconteo) {
                // ✅ HUBO RECONTEO: Usar la lógica simple que ya funciona correctamente
                System.out.println("🔄 [FINAL] Producto con reconteo: " + primerDetalle.getProducto().getNombre());
                
                // ✅ USAR LA LÓGICA SIMPLE: Obtener valores de referencia y actuales del reconteo
                String referenciaJson = conteoSector.getReferenciaActual();
                Map<String, Object> valoresReferencia = parsearValoresReferencia(referenciaJson, primerDetalle.getProducto().getId());
                
                if (valoresReferencia != null) {
                    // ✅ VALORES FINALES: Usar los valores del reconteo completado (sin diferencias)
                    // En un sector completado, los valores de referencia son los del reconteo anterior
                    // y los valores actuales son los del reconteo final (sin diferencias)
                    
                    Integer cantidadFinalUsuario1 = (Integer) valoresReferencia.get("usuario1");
                    Integer cantidadFinalUsuario2 = (Integer) valoresReferencia.get("usuario2");
                    String formulasFinales1 = (String) valoresReferencia.get("formulas1");
                    String formulasFinales2 = (String) valoresReferencia.get("formulas2");
                    
                    // ✅ ASIGNAR VALORES FINALES CORRECTOS (valores acordados sin diferencias)
                    detalleFinal.setCantidadConteo1(cantidadFinalUsuario1);
                    detalleFinal.setFormulaCalculo1(formulasFinales1);
                    detalleFinal.setCantidadConteo2(cantidadFinalUsuario2);
                    detalleFinal.setFormulaCalculo2(formulasFinales2);
                    
                    // ✅ CANTIDAD FINAL: Usar el valor acordado (sin diferencias)
                    if (cantidadFinalUsuario1 != null && cantidadFinalUsuario2 != null) {
                        if (cantidadFinalUsuario1.equals(cantidadFinalUsuario2)) {
                            detalleFinal.setCantidadFinal(cantidadFinalUsuario1);
                        } else {
                            // Si hay diferencia, usar el promedio (esto no debería pasar si el sector está completado)
                            detalleFinal.setCantidadFinal((cantidadFinalUsuario1 + cantidadFinalUsuario2) / 2);
                        }
                    } else if (cantidadFinalUsuario1 != null) {
                        detalleFinal.setCantidadFinal(cantidadFinalUsuario1);
                    } else if (cantidadFinalUsuario2 != null) {
                        detalleFinal.setCantidadFinal(cantidadFinalUsuario2);
                    }
                    
                    // ✅ CALCULAR DIFERENCIA CON EL SISTEMA
                    if (detalleFinal.getCantidadFinal() != null && detalleFinal.getStockSistema() != null) {
                        detalleFinal.setDiferenciaSistema(detalleFinal.getCantidadFinal() - detalleFinal.getStockSistema());
                    }
                    
                    System.out.println("✅ [FINAL] Valores finales del reconteo para " + primerDetalle.getProducto().getNombre() + 
                                     " - Usuario1: " + detalleFinal.getCantidadConteo1() + 
                                     ", Usuario2: " + detalleFinal.getCantidadConteo2() + 
                                     ", Final: " + detalleFinal.getCantidadFinal() + 
                                     ", Stock Sistema: " + detalleFinal.getStockSistema() + 
                                     ", Diferencia: " + detalleFinal.getDiferenciaSistema());
                } else {
                    // ✅ FALLBACK: Si no hay referencia, usar el detalle más reciente
                    System.out.println("⚠️ [FINAL] No se encontró referencia, usando detalle más reciente");
                    
                    detallesDelProducto.sort((d1, d2) -> {
                        if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
                        if (d1.getFechaActualizacion() == null) return 1;
                        if (d2.getFechaActualizacion() == null) return -1;
                        return d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion());
                    });
                    
                    DetalleConteo detalleMasReciente = detallesDelProducto.get(0);
                    
                    int totalUsuario1 = 0;
                    int totalUsuario2 = 0;
                    
                    if (detalleMasReciente.getCantidadConteo1() != null && detalleMasReciente.getCantidadConteo1() > 0) {
                        totalUsuario1 = detalleMasReciente.getCantidadConteo1();
                    }
                    if (detalleMasReciente.getCantidadConteo2() != null && detalleMasReciente.getCantidadConteo2() > 0) {
                        totalUsuario2 = detalleMasReciente.getCantidadConteo2();
                    }
                    
                    detalleFinal.setCantidadConteo1(totalUsuario1 > 0 ? totalUsuario1 : null);
                    detalleFinal.setFormulaCalculo1(detalleMasReciente.getFormulaCalculo1());
                    detalleFinal.setCantidadConteo2(totalUsuario2 > 0 ? totalUsuario2 : null);
                    detalleFinal.setFormulaCalculo2(detalleMasReciente.getFormulaCalculo2());
                    
                    if (totalUsuario1 > 0 && totalUsuario2 > 0) {
                        if (totalUsuario1 == totalUsuario2) {
                            detalleFinal.setCantidadFinal(totalUsuario1);
                        } else {
                            detalleFinal.setCantidadFinal((totalUsuario1 + totalUsuario2) / 2);
                        }
                    } else if (totalUsuario1 > 0) {
                        detalleFinal.setCantidadFinal(totalUsuario1);
                    } else if (totalUsuario2 > 0) {
                        detalleFinal.setCantidadFinal(totalUsuario2);
                    }
                    
                    // ✅ CALCULAR DIFERENCIA CON EL SISTEMA
                    if (detalleFinal.getCantidadFinal() != null && detalleFinal.getStockSistema() != null) {
                        detalleFinal.setDiferenciaSistema(detalleFinal.getCantidadFinal() - detalleFinal.getStockSistema());
                    }
                    
                    System.out.println("✅ [FINAL] Valores del detalle más reciente para " + primerDetalle.getProducto().getNombre() + 
                                     " - Usuario1: " + detalleFinal.getCantidadConteo1() + 
                                     ", Usuario2: " + detalleFinal.getCantidadConteo2() + 
                                     ", Final: " + detalleFinal.getCantidadFinal() + 
                                     ", Stock Sistema: " + detalleFinal.getStockSistema() + 
                                     ", Diferencia: " + detalleFinal.getDiferenciaSistema());
                }
                
            } else {
                // ✅ NO HUBO RECONTEO: Mostrar los valores del conteo inicial
                System.out.println("📋 [FINAL] Producto sin reconteo: " + primerDetalle.getProducto().getNombre());
                
                // Sumar todas las cantidades del conteo inicial
                int totalUsuario1 = 0;
                int totalUsuario2 = 0;
                List<String> formulasUsuario1 = new ArrayList<>();
                List<String> formulasUsuario2 = new ArrayList<>();
                
                for (DetalleConteo detalle : detallesDelProducto) {
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        totalUsuario1 += detalle.getCantidadConteo1();
                        if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                            formulasUsuario1.add(detalle.getFormulaCalculo1());
                        }
                    }
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        totalUsuario2 += detalle.getCantidadConteo2();
                        if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                            formulasUsuario2.add(detalle.getFormulaCalculo2());
                        }
                    }
                }
                
                // Asignar los totales consolidados
                detalleFinal.setCantidadConteo1(totalUsuario1 > 0 ? totalUsuario1 : null);
                detalleFinal.setFormulaCalculo1(formulasUsuario1.isEmpty() ? null : String.join(", ", formulasUsuario1));
                detalleFinal.setCantidadConteo2(totalUsuario2 > 0 ? totalUsuario2 : null);
                detalleFinal.setFormulaCalculo2(formulasUsuario2.isEmpty() ? null : String.join(", ", formulasUsuario2));
                
                // Calcular cantidad final
                if (detalleFinal.getCantidadConteo1() != null && detalleFinal.getCantidadConteo2() != null) {
                    if (detalleFinal.getCantidadConteo1().equals(detalleFinal.getCantidadConteo2())) {
                        detalleFinal.setCantidadFinal(detalleFinal.getCantidadConteo1());
                    } else {
                        detalleFinal.setCantidadFinal((detalleFinal.getCantidadConteo1() + detalleFinal.getCantidadConteo2()) / 2);
                    }
                } else if (detalleFinal.getCantidadConteo1() != null) {
                    detalleFinal.setCantidadFinal(detalleFinal.getCantidadConteo1());
                } else if (detalleFinal.getCantidadConteo2() != null) {
                    detalleFinal.setCantidadFinal(detalleFinal.getCantidadConteo2());
                }
                
                // ✅ CALCULAR DIFERENCIA CON EL SISTEMA
                if (detalleFinal.getCantidadFinal() != null && detalleFinal.getStockSistema() != null) {
                    detalleFinal.setDiferenciaSistema(detalleFinal.getCantidadFinal() - detalleFinal.getStockSistema());
                }
                
                System.out.println("✅ [FINAL] Valores del conteo inicial para " + primerDetalle.getProducto().getNombre() + 
                                 " - Usuario1: " + detalleFinal.getCantidadConteo1() + 
                                 ", Usuario2: " + detalleFinal.getCantidadConteo2() + 
                                 ", Final: " + detalleFinal.getCantidadFinal() + 
                                 ", Stock Sistema: " + detalleFinal.getStockSistema() + 
                                 ", Diferencia: " + detalleFinal.getDiferenciaSistema());
            }
            
            // ✅ INCLUIR TODOS LOS PRODUCTOS (con y sin diferencias)
            detallesFinales.add(detalleFinal);
            System.out.println("✅ [FINAL] Incluyendo producto: " + detalleFinal.getProducto().getNombre());
        }
        
        System.out.println("✅ [FINAL] Detalles finales consolidados: " + detallesFinales.size());
        return detallesFinales;
    }

    /**
     * MÉTODO LEGACY: Mantener para compatibilidad (método anterior complejo)
     */
    @Deprecated
    public List<Map<String, Object>> obtenerDetallesParaReconteoLegacy(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 [LEGACY] Obteniendo detalles consolidados para RECONTEO en sector: " + conteoSectorId);
        System.out.println("🔍 [LEGACY] Usuario solicitando reconteo: " + usuarioId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            System.out.println("❌ [LEGACY] ConteoSector no encontrado para ID: " + conteoSectorId);
            return new ArrayList<>();
        }
        
        System.out.println("🔍 [LEGACY] Estado del ConteoSector: " + conteoSector.getEstado());
        System.out.println("🔍 [LEGACY] Observaciones del ConteoSector: " + conteoSector.getObservaciones());

        // Obtener detalles SIN eliminados
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ [LEGACY] Detalles encontrados para RECONTEO (SIN eliminados): " + detalles.size());
        
        // Agrupar por producto y consolidar
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            detallesPorProducto.computeIfAbsent(detalle.getProducto().getId(), k -> new ArrayList<>()).add(detalle);
        }
        
        List<Map<String, Object>> productosConsolidados = new ArrayList<>();
        
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // ✅ LÓGICA RECONTEO: Usar la misma estrategia que el método de comparación
            int totalUsuario1 = 0;
            int totalUsuario2 = 0;
            List<String> formulasUsuario1 = new ArrayList<>();
            List<String> formulasUsuario2 = new ArrayList<>();
            
            // Verificar si estamos en modo reconteo
            boolean esReconteo = conteoSector.getObservaciones() != null && 
                                conteoSector.getObservaciones().startsWith("Reconteo_");
            
            // Determinar si ambos usuarios ya han recontado al menos una vez
            boolean ambosUsuariosRecontaron = false;
            if (esReconteo && conteoSector.getObservaciones() != null) {
                ambosUsuariosRecontaron = conteoSector.getObservaciones().contains("Usuario1_Finalizado") && 
                                         conteoSector.getObservaciones().contains("Usuario2_Finalizado");
            }
            
            System.out.println("🔍 RECONTEO - Modo reconteo: " + esReconteo + 
                             " (Estado: " + conteoSector.getEstado() + 
                             ", Observaciones: " + conteoSector.getObservaciones() + 
                             ", Ambos recontaron: " + ambosUsuariosRecontaron + ")");
            
            // ✅ LÓGICA ESPECÍFICA POR USUARIO: Determinar qué datos mostrar según el usuario
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
            System.out.println("🔍 RECONTEO: Usuario solicitando reconteo - esUsuario1: " + esUsuario1 + ", esUsuario2: " + esUsuario2);
            System.out.println("🔍 DEBUG - Total detalles del producto: " + detallesDelProducto.size());
            
            // ✅ DETERMINAR SI ES SEGUNDO RECONTEO (ambos usuarios ya recontaron)
            boolean esSegundoReconteo = ambosUsuariosRecontaron;
            System.out.println("🔍 RECONTEO: Es segundo reconteo: " + esSegundoReconteo);
            
            if (esUsuario1 || esUsuario2) {
                if (esSegundoReconteo) {
                    // ✅ SEGUNDO RECONTEO: Mostrar conteo inicial del usuario actual y reconteo del otro usuario
                    System.out.println("🔍 SEGUNDO RECONTEO: Mostrando conteo inicial del usuario actual y reconteo del otro");
                    
                    // Ordenar por fecha de actualización (más reciente primero)
                    detallesDelProducto.sort((d1, d2) -> d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion()));
                    
                    // Para el usuario que entra: mostrar su conteo inicial completo
                    // Para el usuario que ya recontó: mostrar solo su último reconteo
                    
                    // Primero, obtener el conteo inicial del usuario que entra
                    if (esUsuario1) {
                        // Usuario1 entra: mostrar su conteo inicial completo (solo los más antiguos)
                        System.out.println("🔍 Usuario1 entra al segundo reconteo - mostrando su conteo inicial");
                        
                        // Ordenar por fecha de creación (más antiguo primero) para obtener conteos iniciales
                        List<DetalleConteo> detallesOrdenadosPorCreacion = new ArrayList<>(detallesDelProducto);
                        detallesOrdenadosPorCreacion.sort((d1, d2) -> d1.getFechaCreacion().compareTo(d2.getFechaCreacion()));
                        
                        for (DetalleConteo detalle : detallesOrdenadosPorCreacion) {
                            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                                totalUsuario1 += detalle.getCantidadConteo1();
                                if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                                    formulasUsuario1.add(detalle.getFormulaCalculo1());
                                }
                                System.out.println("  ✅ Usuario1 (conteo inicial): " + detalle.getCantidadConteo1() + " (Total: " + totalUsuario1 + ")");
                            }
                        }
                        
                        // Para Usuario2: mostrar solo su último reconteo (el más reciente)
                        System.out.println("🔍 Mostrando último reconteo de Usuario2");
                        for (DetalleConteo detalle : detallesDelProducto) {
                            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                                // Solo tomar el primer valor (más reciente) para evitar duplicados
                                if (totalUsuario2 == 0) {
                                    totalUsuario2 = detalle.getCantidadConteo2();
                                    if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                                        formulasUsuario2.add(detalle.getFormulaCalculo2());
                                    }
                                    System.out.println("  ✅ Usuario2 (último reconteo): " + detalle.getCantidadConteo2() + " (Total: " + totalUsuario2 + ")");
                                    break; // Solo tomar el primer (más reciente)
                                }
                            }
                        }
                    } else if (esUsuario2) {
                        // Usuario2 entra: mostrar su conteo inicial completo
                        System.out.println("🔍 Usuario2 entra al segundo reconteo - mostrando su conteo inicial");
                        for (DetalleConteo detalle : detallesDelProducto) {
                            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                                totalUsuario2 += detalle.getCantidadConteo2();
                                if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                                    formulasUsuario2.add(detalle.getFormulaCalculo2());
                                }
                                System.out.println("  ✅ Usuario2 (conteo inicial): " + detalle.getCantidadConteo2() + " (Total: " + totalUsuario2 + ")");
                            }
                        }
                        
                        // Para Usuario1: mostrar solo su último reconteo (el más reciente)
                        System.out.println("🔍 Mostrando último reconteo de Usuario1");
                        for (DetalleConteo detalle : detallesDelProducto) {
                            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                                // Solo tomar el primer valor (más reciente) para evitar duplicados
                                if (totalUsuario1 == 0) {
                                    totalUsuario1 = detalle.getCantidadConteo1();
                                    if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                                        formulasUsuario1.add(detalle.getFormulaCalculo1());
                                    }
                                    System.out.println("  ✅ Usuario1 (último reconteo): " + detalle.getCantidadConteo1() + " (Total: " + totalUsuario1 + ")");
                                    break; // Solo tomar el primer (más reciente)
                                }
                            }
                        }
                    }
                } else {
                    // ✅ PRIMER RECONTEO: Mostrar todos los valores originales del conteo inicial
                    System.out.println("🔍 PRIMER RECONTEO: Mostrando todos los valores originales del conteo inicial");
                    detallesDelProducto.sort((d1, d2) -> d1.getFechaCreacion().compareTo(d2.getFechaCreacion()));
                    
                    for (DetalleConteo detalle : detallesDelProducto) {
                        System.out.println("🔍 DEBUG - Analizando detalle: ID=" + detalle.getId() + 
                                         ", Usuario1=" + detalle.getCantidadConteo1() + 
                                         ", Usuario2=" + detalle.getCantidadConteo2() +
                                         ", FechaCreacion=" + detalle.getFechaCreacion());
                        
                        // Usuario1: sumar todos los valores originales y recopilar todas las fórmulas
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            totalUsuario1 += detalle.getCantidadConteo1();
                            if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                                formulasUsuario1.add(detalle.getFormulaCalculo1());
                            }
                            System.out.println("  ➕ Usuario1: Sumando " + detalle.getCantidadConteo1() + " (Total: " + totalUsuario1 + ") - Fórmula: " + detalle.getFormulaCalculo1());
                        }
                        // Usuario2: sumar todos los valores originales y recopilar todas las fórmulas
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            totalUsuario2 += detalle.getCantidadConteo2();
                            if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                                formulasUsuario2.add(detalle.getFormulaCalculo2());
                            }
                            System.out.println("  ➕ Usuario2: Sumando " + detalle.getCantidadConteo2() + " (Total: " + totalUsuario2 + ") - Fórmula: " + detalle.getFormulaCalculo2());
                        }
                    }
                }
            } else {
                // ✅ USUARIO NO RECONOCIDO: Usar lógica por defecto
                System.out.println("🔍 USUARIO NO RECONOCIDO: Usando lógica por defecto");
                for (DetalleConteo detalle : detallesDelProducto) {
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        totalUsuario1 += detalle.getCantidadConteo1();
                        if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                            formulasUsuario1.add(detalle.getFormulaCalculo1());
                        }
                    }
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        totalUsuario2 += detalle.getCantidadConteo2();
                        if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                            formulasUsuario2.add(detalle.getFormulaCalculo2());
                        }
                    }
                }
            }
            
            // ✅ IMPORTANTE: Solo ejecutar lógica adicional si NO es reconteo o si es usuario no reconocido
            if (!esReconteo || (!esUsuario1 && !esUsuario2)) {
                if (!esReconteo) {
                    // ✅ MODO CONTEO NORMAL: Mostrar todos los valores
                    System.out.println("🔍 MODO CONTEO NORMAL: Mostrando todos los valores");
                } else {
                    // ✅ USUARIO NO RECONOCIDO: Ya procesado arriba
                    System.out.println("🔍 USUARIO NO RECONOCIDO: Ya procesado arriba");
                }
            } else {
                System.out.println("🔍 RECONTEO: Ya procesado por usuario específico, saltando lógica adicional");
            }
            
            int diferencia = totalUsuario1 - totalUsuario2;
            
            // ✅ LÓGICA RECONTEO CORREGIDA: Si el sector está en CON_DIFERENCIAS, 
            // significa que tuvo diferencias en el conteo original, por lo que debe incluirse en reconteo
            boolean tieneDiferencias = false;
            
            System.out.println("🔍 Analizando producto " + primerDetalle.getProducto().getNombre() + 
                             " - Estado sector: " + conteoSector.getEstado() + 
                             " - Usuario1: " + totalUsuario1 + ", Usuario2: " + totalUsuario2 +
                             " - esSegundoReconteo: " + esSegundoReconteo +
                             " - esUsuario1: " + esUsuario1 + ", esUsuario2: " + esUsuario2);
            
            // Si el sector está en estado CON_DIFERENCIAS o ESPERANDO_VERIFICACION, incluir todos los productos contados
            if (conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS || 
                conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
                // Verificar si el producto fue contado por al menos un usuario
                if (totalUsuario1 > 0 || totalUsuario2 > 0) {
                    tieneDiferencias = true;
                    System.out.println("✅ RECONTEO: Sector en " + conteoSector.getEstado() + " - Incluyendo producto " + primerDetalle.getProducto().getNombre() + 
                                     " - Usuario1: " + totalUsuario1 + ", Usuario2: " + totalUsuario2);
                } else {
                    System.out.println("⚠️ RECONTEO: Sector en " + conteoSector.getEstado() + " pero producto no contado - " + primerDetalle.getProducto().getNombre());
                }
            } else {
                System.out.println("🔍 Sector NO está en CON_DIFERENCIAS ni ESPERANDO_VERIFICACION, estado actual: " + conteoSector.getEstado());
                // Si no está en estados de reconteo, verificar diferencias actuales
                if (totalUsuario1 > 0 && totalUsuario2 > 0) {
                    // Ambos usuarios contaron: verificar si hay diferencia
                    tieneDiferencias = totalUsuario1 != totalUsuario2;
                    System.out.println("🔍 Ambos usuarios contaron - Diferencia: " + tieneDiferencias);
                } else if (totalUsuario1 > 0 || totalUsuario2 > 0) {
                    // Al menos uno contó: hay diferencia
                    tieneDiferencias = true;
                    System.out.println("🔍 Solo un usuario contó - Diferencia: " + tieneDiferencias);
                }
            }
            
            // Solo procesar si hay diferencias
            if (!tieneDiferencias) {
                System.out.println("✅ RECONTEO: Excluyendo producto " + primerDetalle.getProducto().getNombre() + 
                                 " - Usuario1: " + totalUsuario1 + ", Usuario2: " + totalUsuario2 + " (sin diferencias)");
                continue; // Saltar este producto
            }
            
            System.out.println("✅ RECONTEO: Incluyendo producto " + primerDetalle.getProducto().getNombre() + 
                             " - Usuario1: " + totalUsuario1 + ", Usuario2: " + totalUsuario2 + " (tienen diferencias)");
            
            Map<String, Object> productoConsolidado = new HashMap<>();
            productoConsolidado.put("id", primerDetalle.getId());
            productoConsolidado.put("productoId", primerDetalle.getProducto().getId());
            productoConsolidado.put("nombreProducto", primerDetalle.getProducto().getNombre());
            productoConsolidado.put("codigoProducto", primerDetalle.getProducto().getCodigoPersonalizado());
            productoConsolidado.put("stockSistema", primerDetalle.getStockSistema());
            productoConsolidado.put("cantidadConteo1", totalUsuario1);
            productoConsolidado.put("cantidadConteo2", totalUsuario2);
            productoConsolidado.put("diferenciaEntreConteos", diferencia);
            productoConsolidado.put("diferenciaSistema", primerDetalle.getStockSistema() - Math.max(totalUsuario1, totalUsuario2));
            
            // Agregar información de los usuarios para el frontend
            try {
                if (conteoSector.getUsuarioAsignado1() != null) {
                    productoConsolidado.put("usuario1Id", conteoSector.getUsuarioAsignado1().getId());
                    productoConsolidado.put("usuario1Nombre", conteoSector.getUsuarioAsignado1().getNombre() + " " + conteoSector.getUsuarioAsignado1().getApellidos());
                }
                if (conteoSector.getUsuarioAsignado2() != null) {
                    productoConsolidado.put("usuario2Id", conteoSector.getUsuarioAsignado2().getId());
                    productoConsolidado.put("usuario2Nombre", conteoSector.getUsuarioAsignado2().getNombre() + " " + conteoSector.getUsuarioAsignado2().getApellidos());
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error accediendo a datos de usuarios (posible proxy lazy): " + e.getMessage());
                productoConsolidado.put("usuario1Id", null);
                productoConsolidado.put("usuario1Nombre", "Usuario 1");
                productoConsolidado.put("usuario2Id", null);
                productoConsolidado.put("usuario2Nombre", "Usuario 2");
            }
            
            // Concatenar todas las fórmulas de cada usuario
            String historialCompletoUsuario1 = String.join(" | ", formulasUsuario1);
            String historialCompletoUsuario2 = String.join(" | ", formulasUsuario2);
            
            productoConsolidado.put("formulaCalculo1", historialCompletoUsuario1);
            productoConsolidado.put("formulaCalculo2", historialCompletoUsuario2);
            
            productosConsolidados.add(productoConsolidado);
        }
        
        System.out.println("✅ Productos consolidados para RECONTEO: " + productosConsolidados.size());
        
        // Debug: mostrar cada producto que se devuelve
        for (int i = 0; i < productosConsolidados.size(); i++) {
            Map<String, Object> producto = productosConsolidados.get(i);
            System.out.println("🔍 Producto " + (i+1) + " devuelto: " + producto.get("nombreProducto") + 
                             " - Usuario1: " + producto.get("cantidadConteo1") + 
                             " - Usuario2: " + producto.get("cantidadConteo2"));
        }
        
        return productosConsolidados;
    }

    /**
     * Obtener detalles consolidados para comparación de conteos (TODOS los productos)
     */
    public List<Map<String, Object>> obtenerDetallesParaComparacion(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Obteniendo detalles consolidados para comparación en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        // DEBUG: Obtener TODOS los detalles (incluyendo eliminados) para comparar
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        System.out.println("🔍 DEBUG - Total detalles (INCLUYENDO eliminados): " + todosLosDetalles.size());
        
        // DEBUG: Verificar el estado de eliminado de TODOS los detalles
        System.out.println("🔍 DEBUG - Estado de TODOS los detalles:");
        for (DetalleConteo detalle : todosLosDetalles) {
            System.out.println("  - Detalle ID: " + detalle.getId() + 
                             ", Producto: " + detalle.getProducto().getNombre() + 
                             ", Eliminado: " + detalle.getEliminado() + 
                             ", Tipo: " + (detalle.getEliminado() != null ? detalle.getEliminado().getClass().getSimpleName() : "NULL"));
        }
        
        // Obtener detalles SIN eliminados usando el filtro correcto
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles encontrados para comparación (SIN eliminados): " + detalles.size());
        
        // DEBUG: Verificar el estado de eliminado de cada detalle filtrado
        System.out.println("🔍 DEBUG - Verificando estado de eliminado de cada detalle filtrado:");
        for (DetalleConteo detalle : detalles) {
            System.out.println("  - Detalle ID: " + detalle.getId() + 
                             ", Producto: " + detalle.getProducto().getNombre() + 
                             ", Eliminado: " + detalle.getEliminado() + 
                             ", Tipo: " + (detalle.getEliminado() != null ? detalle.getEliminado().getClass().getSimpleName() : "NULL"));
        }
        
        // Agrupar por producto y consolidar (ya filtrados sin eliminados)
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            String nombreProducto = detalle.getProducto().getNombre();
            System.out.println("🔍 DEBUG Agrupación - Detalle ID: " + detalle.getId() + 
                             ", Producto ID: " + productoId + ", Nombre: " + nombreProducto +
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2() +
                             ", Eliminado: " + detalle.getEliminado());
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        System.out.println("🔍 DEBUG - Total productos únicos: " + detallesPorProducto.size());
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            System.out.println("  - Producto ID: " + entry.getKey() + ", Detalles: " + entry.getValue().size());
        }

        List<Map<String, Object>> productosConsolidados = new ArrayList<>();
        
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            System.out.println("🔍 DEBUG CONSOLIDACIÓN - Producto: " + primerDetalle.getProducto().getNombre() + 
                             " - Total detalles encontrados: " + detallesDelProducto.size());
            
            // DEBUG: Mostrar todos los detalles del producto
            for (int i = 0; i < detallesDelProducto.size(); i++) {
                DetalleConteo detalle = detallesDelProducto.get(i);
                System.out.println("  📋 Detalle " + (i+1) + " - ID: " + detalle.getId() + 
                                 ", Usuario1: " + detalle.getCantidadConteo1() + 
                                 ", Usuario2: " + detalle.getCantidadConteo2() +
                                 ", Fecha: " + detalle.getFechaActualizacion() +
                                 ", Estado: " + detalle.getEstado());
            }
            
            // ✅ NUEVA LÓGICA: Diferentes estrategias según el estado del sector
            int totalUsuario1 = 0;
            int totalUsuario2 = 0;
            LocalDateTime fechaMasRecienteUsuario1 = null;
            LocalDateTime fechaMasRecienteUsuario2 = null;
            
            // Listas para acumular todas las fórmulas de cada usuario
            List<String> formulasUsuario1 = new ArrayList<>();
            List<String> formulasUsuario2 = new ArrayList<>();
            
            // Verificar si estamos en modo reconteo
            // Un reconteo se identifica por tener observaciones que empiecen con "Reconteo_"
            // ✅ NUEVA LÓGICA: Determinar qué datos mostrar según el estado del reconteo
            boolean esReconteo = conteoSector.getObservaciones() != null && 
                                conteoSector.getObservaciones().startsWith("Reconteo_");
            
            // Determinar si ambos usuarios ya han recontado al menos una vez
            boolean ambosUsuariosRecontaron = false;
            if (esReconteo && conteoSector.getObservaciones() != null) {
                ambosUsuariosRecontaron = conteoSector.getObservaciones().contains("Usuario1_Finalizado") && 
                                         conteoSector.getObservaciones().contains("Usuario2_Finalizado");
            }
            
            System.out.println("🔍 DEBUG Consolidación - Modo reconteo: " + esReconteo + 
                             " (Estado: " + conteoSector.getEstado() + 
                             ", Observaciones: " + conteoSector.getObservaciones() + 
                             ", Ambos recontaron: " + ambosUsuariosRecontaron + ")");
            
            if (esReconteo) {
                // ✅ MODO RECONTEO: Lógica corregida según el flujo correcto
                
                if (!ambosUsuariosRecontaron) {
                    // ✅ PRIMERA SERIE DE RECONTEO: Mostrar conteos iniciales (valores >= 100)
                    System.out.println("🔍 PRIMERA SERIE RECONTEO: Mostrando conteos iniciales como referencia");
                    
                    boolean hayConteosIniciales = false;
                    DetalleConteo conteoInicialUsuario1 = null;
                    DetalleConteo conteoInicialUsuario2 = null;
                    
                    // Buscar el conteo inicial más reciente de cada usuario
                    for (DetalleConteo detalle : detallesDelProducto) {
                        // Buscar conteo inicial del Usuario 1 (valores >= 100)
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() >= 100) {
                            if (conteoInicialUsuario1 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 (conteoInicialUsuario1.getFechaActualizacion() == null || 
                                  detalle.getFechaActualizacion().isAfter(conteoInicialUsuario1.getFechaActualizacion())))) {
                                conteoInicialUsuario1 = detalle;
                            }
                            hayConteosIniciales = true;
                        }
                        
                        // Buscar conteo inicial del Usuario 2 (valores >= 100)
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() >= 100) {
                            if (conteoInicialUsuario2 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 (conteoInicialUsuario2.getFechaActualizacion() == null || 
                                  detalle.getFechaActualizacion().isAfter(conteoInicialUsuario2.getFechaActualizacion())))) {
                                conteoInicialUsuario2 = detalle;
                            }
                            hayConteosIniciales = true;
                        }
                    }
                    
                    // ✅ SUMAR TODAS LAS ENTRADAS de cada usuario (no solo la más reciente)
                    for (DetalleConteo detalle : detallesDelProducto) {
                        // Sumar todas las entradas del Usuario 1 (valores >= 100)
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() >= 100) {
                            totalUsuario1 += detalle.getCantidadConteo1();
                            if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                                formulasUsuario1.add(detalle.getFormulaCalculo1());
                            }
                            System.out.println("  ➕ Sumando entrada Usuario1: " + detalle.getCantidadConteo1() + " (Total acumulado: " + totalUsuario1 + ")");
                        }
                        
                        // Sumar todas las entradas del Usuario 2 (valores >= 100)
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() >= 100) {
                            totalUsuario2 += detalle.getCantidadConteo2();
                            if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                                formulasUsuario2.add(detalle.getFormulaCalculo2());
                            }
                            System.out.println("  ➕ Sumando entrada Usuario2: " + detalle.getCantidadConteo2() + " (Total acumulado: " + totalUsuario2 + ")");
                        }
                    }
                    
                    System.out.println("  ✅ Total consolidado Usuario1: " + totalUsuario1 + " (Fórmulas: " + formulasUsuario1 + ")");
                    System.out.println("  ✅ Total consolidado Usuario2: " + totalUsuario2 + " (Fórmulas: " + formulasUsuario2 + ")");
                    
                    // Si no hay conteos iniciales (valores >= 100), mostrar reconteos anteriores como referencia
                    if (!hayConteosIniciales) {
                        System.out.println("⚠️ No se encontraron conteos iniciales (>= 100), mostrando reconteos anteriores");
                        DetalleConteo reconteoAnteriorUsuario1 = null;
                        DetalleConteo reconteoAnteriorUsuario2 = null;
                        
                        // Buscar el reconteo anterior más reciente de cada usuario
                        for (DetalleConteo detalle : detallesDelProducto) {
                            // Buscar reconteo anterior del Usuario 1 (valores < 100)
                            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0 && detalle.getCantidadConteo1() < 100) {
                                if (reconteoAnteriorUsuario1 == null || 
                                    (detalle.getFechaActualizacion() != null && 
                                     (reconteoAnteriorUsuario1.getFechaActualizacion() == null || 
                                      detalle.getFechaActualizacion().isAfter(reconteoAnteriorUsuario1.getFechaActualizacion())))) {
                                    reconteoAnteriorUsuario1 = detalle;
                                }
                            }
                            
                            // Buscar reconteo anterior del Usuario 2 (valores < 100)
                            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0 && detalle.getCantidadConteo2() < 100) {
                                if (reconteoAnteriorUsuario2 == null || 
                                    (detalle.getFechaActualizacion() != null && 
                                     (reconteoAnteriorUsuario2.getFechaActualizacion() == null || 
                                      detalle.getFechaActualizacion().isAfter(reconteoAnteriorUsuario2.getFechaActualizacion())))) {
                                    reconteoAnteriorUsuario2 = detalle;
                                }
                            }
                        }
                        
                        // Usar solo el reconteo anterior más reciente de cada usuario
                        if (reconteoAnteriorUsuario1 != null) {
                            totalUsuario1 = reconteoAnteriorUsuario1.getCantidadConteo1();
                            if (reconteoAnteriorUsuario1.getFormulaCalculo1() != null && !reconteoAnteriorUsuario1.getFormulaCalculo1().isEmpty()) {
                                formulasUsuario1.add(reconteoAnteriorUsuario1.getFormulaCalculo1());
                            }
                            System.out.println("  ✅ Reconteo anterior Usuario1 (más reciente): " + totalUsuario1);
                        }
                        
                        if (reconteoAnteriorUsuario2 != null) {
                            totalUsuario2 = reconteoAnteriorUsuario2.getCantidadConteo2();
                            if (reconteoAnteriorUsuario2.getFormulaCalculo2() != null && !reconteoAnteriorUsuario2.getFormulaCalculo2().isEmpty()) {
                                formulasUsuario2.add(reconteoAnteriorUsuario2.getFormulaCalculo2());
                            }
                            System.out.println("  ✅ Reconteo anterior Usuario2 (más reciente): " + totalUsuario2);
                        }
                    }
                } else {
                    // ✅ SEGUNDA SERIE O POSTERIOR: Mostrar reconteos anteriores (valores < 100)
                    System.out.println("🔍 SERIE POSTERIOR RECONTEO: Mostrando reconteos anteriores como referencia");
                    
                    DetalleConteo reconteoAnteriorUsuario1 = null;
                    DetalleConteo reconteoAnteriorUsuario2 = null;
                    
                    // Buscar el reconteo anterior más reciente de cada usuario
                    for (DetalleConteo detalle : detallesDelProducto) {
                        // Buscar reconteo anterior del Usuario 1 (valores < 100)
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() < 100) {
                            if (reconteoAnteriorUsuario1 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 (reconteoAnteriorUsuario1.getFechaActualizacion() == null || 
                                  detalle.getFechaActualizacion().isAfter(reconteoAnteriorUsuario1.getFechaActualizacion())))) {
                                reconteoAnteriorUsuario1 = detalle;
                            }
                        }
                        
                        // Buscar reconteo anterior del Usuario 2 (valores < 100)
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() < 100) {
                            if (reconteoAnteriorUsuario2 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 (reconteoAnteriorUsuario2.getFechaActualizacion() == null || 
                                  detalle.getFechaActualizacion().isAfter(reconteoAnteriorUsuario2.getFechaActualizacion())))) {
                                reconteoAnteriorUsuario2 = detalle;
                            }
                        }
                    }
                    
                    // Usar solo el reconteo anterior más reciente de cada usuario
                    if (reconteoAnteriorUsuario1 != null) {
                        totalUsuario1 = reconteoAnteriorUsuario1.getCantidadConteo1();
                        if (reconteoAnteriorUsuario1.getFormulaCalculo1() != null && !reconteoAnteriorUsuario1.getFormulaCalculo1().isEmpty()) {
                            formulasUsuario1.add(reconteoAnteriorUsuario1.getFormulaCalculo1());
                        }
                        System.out.println("  ✅ Reconteo anterior Usuario1 (más reciente): " + totalUsuario1);
                    }
                    
                    if (reconteoAnteriorUsuario2 != null) {
                        totalUsuario2 = reconteoAnteriorUsuario2.getCantidadConteo2();
                        if (reconteoAnteriorUsuario2.getFormulaCalculo2() != null && !reconteoAnteriorUsuario2.getFormulaCalculo2().isEmpty()) {
                            formulasUsuario2.add(reconteoAnteriorUsuario2.getFormulaCalculo2());
                        }
                        System.out.println("  ✅ Reconteo anterior Usuario2 (más reciente): " + totalUsuario2);
                    }
                }
                
                System.out.println("✅ LÓGICA RECONTEO SIMPLIFICADA APLICADA");
            } else {
                // ✅ MODO CONTEO INICIAL: Sumar TODAS las cantidades (múltiples conteos del mismo producto)
                for (DetalleConteo detalle : detallesDelProducto) {
                    System.out.println("🔍 DEBUG Conteo Inicial - Detalle ID: " + detalle.getId() + 
                                     ", Usuario1: " + detalle.getCantidadConteo1() + 
                                     ", Usuario2: " + detalle.getCantidadConteo2() + 
                                     ", Fecha Actualización: " + detalle.getFechaActualizacion());
                    
                    // Para Usuario 1: sumar todas las cantidades
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        totalUsuario1 += detalle.getCantidadConteo1();
                        if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                            formulasUsuario1.add(detalle.getFormulaCalculo1());
                        }
                        // Actualizar fecha más reciente
                        if (fechaMasRecienteUsuario1 == null || 
                            detalle.getFechaActualizacion().isAfter(fechaMasRecienteUsuario1)) {
                            fechaMasRecienteUsuario1 = detalle.getFechaActualizacion();
                        }
                        System.out.println("✅ Usuario1 - Sumando: " + detalle.getCantidadConteo1() + 
                                         ", Total acumulado: " + totalUsuario1);
                    }
                    
                    // Para Usuario 2: sumar todas las cantidades
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        totalUsuario2 += detalle.getCantidadConteo2();
                        if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                            formulasUsuario2.add(detalle.getFormulaCalculo2());
                        }
                        // Actualizar fecha más reciente
                        if (fechaMasRecienteUsuario2 == null || 
                            detalle.getFechaActualizacion().isAfter(fechaMasRecienteUsuario2)) {
                            fechaMasRecienteUsuario2 = detalle.getFechaActualizacion();
                        }
                        System.out.println("✅ Usuario2 - Sumando: " + detalle.getCantidadConteo2() + 
                                         ", Total acumulado: " + totalUsuario2);
                    }
                }
            }
            
            System.out.println("🔍 DEBUG Consolidación - Producto: " + primerDetalle.getProducto().getNombre() + 
                             " - Total Usuario1: " + totalUsuario1 + ", Total Usuario2: " + totalUsuario2);
            
            int diferencia = totalUsuario1 - totalUsuario2;
            
            // Incluir TODOS los productos para comparación (detalle de conteo)
            Map<String, Object> productoConsolidado = new HashMap<>();
            productoConsolidado.put("id", primerDetalle.getId());
            productoConsolidado.put("productoId", primerDetalle.getProducto().getId());
            productoConsolidado.put("nombreProducto", primerDetalle.getProducto().getNombre());
            productoConsolidado.put("codigoProducto", primerDetalle.getProducto().getCodigoPersonalizado());
            productoConsolidado.put("stockSistema", primerDetalle.getStockSistema());
            productoConsolidado.put("cantidadConteo1", totalUsuario1);
            productoConsolidado.put("cantidadConteo2", totalUsuario2);
            productoConsolidado.put("diferenciaEntreConteos", diferencia);
            productoConsolidado.put("diferenciaSistema", primerDetalle.getStockSistema() - Math.max(totalUsuario1, totalUsuario2));
            
            // Agregar información de los usuarios para el frontend
            try {
                if (conteoSector.getUsuarioAsignado1() != null) {
                    productoConsolidado.put("usuario1Id", conteoSector.getUsuarioAsignado1().getId());
                    productoConsolidado.put("usuario1Nombre", conteoSector.getUsuarioAsignado1().getNombre() + " " + conteoSector.getUsuarioAsignado1().getApellidos());
                }
                if (conteoSector.getUsuarioAsignado2() != null) {
                    productoConsolidado.put("usuario2Id", conteoSector.getUsuarioAsignado2().getId());
                    productoConsolidado.put("usuario2Nombre", conteoSector.getUsuarioAsignado2().getNombre() + " " + conteoSector.getUsuarioAsignado2().getApellidos());
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error accediendo a datos de usuarios (posible proxy lazy): " + e.getMessage());
                productoConsolidado.put("usuario1Id", null);
                productoConsolidado.put("usuario1Nombre", "Usuario 1");
                productoConsolidado.put("usuario2Id", null);
                productoConsolidado.put("usuario2Nombre", "Usuario 2");
            }
            
            // ✅ NUEVA LÓGICA: Concatenar todas las fórmulas de cada usuario
            String historialCompletoUsuario1 = String.join(" | ", formulasUsuario1);
            String historialCompletoUsuario2 = String.join(" | ", formulasUsuario2);
            
            System.out.println("✅ Usuario1 - Historial completo: " + historialCompletoUsuario1);
            System.out.println("✅ Usuario2 - Historial completo: " + historialCompletoUsuario2);
            
            // Consolidar fórmulas con detalles de cada conteo individual (para debug)
            List<Map<String, Object>> conteosUsuario1 = new ArrayList<>();
            List<Map<String, Object>> conteosUsuario2 = new ArrayList<>();
            
            for (DetalleConteo detalle : detallesDelProducto) {
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo1());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo1() != null ? detalle.getFormulaCalculo1() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaActualizacion());
                    conteosUsuario1.add(conteoIndividual);
                    
                    System.out.println("✅ Agregado conteo Usuario1: " + detalle.getCantidadConteo1() + " (" + detalle.getFormulaCalculo1() + ")");
                }
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo2());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo2() != null ? detalle.getFormulaCalculo2() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaActualizacion());
                    conteosUsuario2.add(conteoIndividual);
                    
                    System.out.println("✅ Agregado conteo Usuario2: " + detalle.getCantidadConteo2() + " (" + detalle.getFormulaCalculo2() + ")");
                }
            }
            
            System.out.println("📊 Resumen final - Usuario1: " + conteosUsuario1.size() + " conteos, Usuario2: " + conteosUsuario2.size() + " conteos");
            
            // ✅ NUEVA LÓGICA: Enviar solo las fórmulas puras (sin total)
            String resumenFormulasUsuario1 = totalUsuario1 > 0 ? 
                historialCompletoUsuario1 : "Sin conteos";
            String resumenFormulasUsuario2 = totalUsuario2 > 0 ? 
                historialCompletoUsuario2 : "Sin conteos";
            
            // También crear un resumen histórico completo (solo para debug)
            String resumenHistoricoUsuario1 = conteosUsuario1.stream()
                .map(c -> c.get("cantidad") + " (" + c.get("formula") + ")")
                .collect(java.util.stream.Collectors.joining(", "));
            
            String resumenHistoricoUsuario2 = conteosUsuario2.stream()
                .map(c -> c.get("cantidad") + " (" + c.get("formula") + ")")
                .collect(java.util.stream.Collectors.joining(", "));
            
            // ✅ MOSTRAR HISTORIAL COMPLETO en el frontend
            productoConsolidado.put("formulaCalculo1", resumenFormulasUsuario1);
            productoConsolidado.put("formulaCalculo2", resumenFormulasUsuario2);
            
            // Guardar el histórico solo para debug (no para mostrar en frontend)
            productoConsolidado.put("formulaCalculo1Historico", resumenHistoricoUsuario1.isEmpty() ? "Sin conteos" : resumenHistoricoUsuario1);
            productoConsolidado.put("formulaCalculo2Historico", resumenHistoricoUsuario2.isEmpty() ? "Sin conteos" : resumenHistoricoUsuario2);
            productoConsolidado.put("estado", diferencia == 0 ? "COINCIDE" : "DIFERENCIA");
            
            // Incluir todos los conteos individuales para análisis detallado
            productoConsolidado.put("conteosUsuario1", conteosUsuario1);
            productoConsolidado.put("conteosUsuario2", conteosUsuario2);
            
            // También incluir el resumen simple para compatibilidad
            List<Map<String, Object>> resumenDetalles = new ArrayList<>();
            for (DetalleConteo detalle : detallesDelProducto) {
                Map<String, Object> resumenDetalle = new HashMap<>();
                resumenDetalle.put("id", detalle.getId());
                resumenDetalle.put("cantidadConteo1", detalle.getCantidadConteo1());
                resumenDetalle.put("cantidadConteo2", detalle.getCantidadConteo2());
                resumenDetalle.put("formulaCalculo1", detalle.getFormulaCalculo1());
                resumenDetalle.put("formulaCalculo2", detalle.getFormulaCalculo2());
                resumenDetalle.put("fechaCreacion", detalle.getFechaCreacion());
                resumenDetalle.put("fechaActualizacion", detalle.getFechaActualizacion());
                resumenDetalles.add(resumenDetalle);
            }
            productoConsolidado.put("todosLosDetallesDelProducto", resumenDetalles);
            
            productosConsolidados.add(productoConsolidado);
        }
        
        System.out.println("✅ Productos consolidados para comparación: " + productosConsolidados.size());
        return productosConsolidados;
    }

    /**
     * Obtener productos con diferencias para reconteo
     */
    public List<Map<String, Object>> obtenerProductosConDiferencias(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo productos con diferencias para reconteo en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        // ✅ CORRECCIÓN: Filtrar por eliminados también en este método
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles encontrados para análisis de diferencias (SIN eliminados): " + detalles.size());
        
        // Agrupar por producto y consolidar (SOLO detalles no eliminados)
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            // ✅ FILTRO ADICIONAL: Verificar que no esté eliminado
            if (detalle.getEliminado() == null || !detalle.getEliminado()) {
                Long productoId = detalle.getProducto().getId();
                System.out.println("🔍 DEBUG Agrupación - Detalle ID: " + detalle.getId() + 
                                 ", Producto: " + detalle.getProducto().getNombre() +
                                 ", Eliminado: " + detalle.getEliminado());
                detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
            } else {
                System.out.println("🔍 DEBUG Agrupación - EXCLUIDO (eliminado) - Detalle ID: " + detalle.getId());
            }
        }

        List<Map<String, Object>> productosConsolidados = new ArrayList<>();
        
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // Calcular totales
            int totalUsuario1 = detallesDelProducto.stream()
                .mapToInt(d -> d.getCantidadConteo1() != null ? d.getCantidadConteo1() : 0)
                .sum();
            
            int totalUsuario2 = detallesDelProducto.stream()
                .mapToInt(d -> d.getCantidadConteo2() != null ? d.getCantidadConteo2() : 0)
                .sum();
            
            int diferencia = totalUsuario1 - totalUsuario2;
            
            // Solo incluir si hay diferencias
            if (diferencia != 0) {
                Map<String, Object> productoConsolidado = new HashMap<>();
                productoConsolidado.put("id", primerDetalle.getId());
                productoConsolidado.put("productoId", primerDetalle.getProducto().getId());
                productoConsolidado.put("nombreProducto", primerDetalle.getProducto().getNombre());
                productoConsolidado.put("codigoProducto", primerDetalle.getProducto().getCodigoPersonalizado());
                productoConsolidado.put("categoria", primerDetalle.getProducto().getCategoria());
                productoConsolidado.put("marca", primerDetalle.getProducto().getMarca());
                productoConsolidado.put("stockSistema", primerDetalle.getStockSistema());
                productoConsolidado.put("precioUnitario", primerDetalle.getPrecioUnitario());
                productoConsolidado.put("totalUsuario1", totalUsuario1);
                productoConsolidado.put("totalUsuario2", totalUsuario2);
                productoConsolidado.put("diferenciaEntreConteos", diferencia);
                
                // Consolidar fórmulas
                List<String> formulasUsuario1 = new ArrayList<>();
                List<String> formulasUsuario2 = new ArrayList<>();
                
                for (DetalleConteo detalle : detallesDelProducto) {
                    if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                        formulasUsuario1.add(detalle.getFormulaCalculo1());
                    }
                    if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                        formulasUsuario2.add(detalle.getFormulaCalculo2());
                    }
                }
                
                productoConsolidado.put("formulaTotalUsuario1", String.join(" + ", formulasUsuario1));
                productoConsolidado.put("formulaTotalUsuario2", String.join(" + ", formulasUsuario2));
                
                // Agregar subcantidades
                List<Map<String, Object>> subcantidades = new ArrayList<>();
                for (DetalleConteo detalle : detallesDelProducto) {
                    Map<String, Object> subcantidad = new HashMap<>();
                    subcantidad.put("id", detalle.getId());
                    subcantidad.put("cantidadConteo1", detalle.getCantidadConteo1());
                    subcantidad.put("cantidadConteo2", detalle.getCantidadConteo2());
                    subcantidad.put("formulaCalculo1", detalle.getFormulaCalculo1());
                    subcantidad.put("formulaCalculo2", detalle.getFormulaCalculo2());
                    subcantidad.put("fechaCreacion", detalle.getFechaCreacion());
                    subcantidades.add(subcantidad);
                }
                productoConsolidado.put("subcantidades", subcantidades);
                
                productosConsolidados.add(productoConsolidado);
            }
        }
        
        System.out.println("✅ Productos con diferencias encontrados: " + productosConsolidados.size());
        return productosConsolidados;
    }

    /**
     * Eliminar un detalle de conteo
     */
    @Transactional
    public boolean crearDetalleEliminado(Long conteoSectorId, Map<String, Object> requestBody, Long usuarioId) {
        try {
            System.out.println("🗑️ Creando detalle eliminado para conteo sector: " + conteoSectorId);
            
            // Obtener el conteo sector
            ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
            if (conteoSector == null) {
                System.out.println("❌ Conteo sector no encontrado: " + conteoSectorId);
                return false;
            }
            
            // Verificar que el usuario tiene permisos
            boolean esUsuarioAsignado = false;
            if (conteoSector.getUsuarioAsignado1() != null && conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                esUsuarioAsignado = true;
            }
            if (conteoSector.getUsuarioAsignado2() != null && conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
                esUsuarioAsignado = true;
            }
            
            if (!esUsuarioAsignado) {
                System.out.println("❌ Usuario " + usuarioId + " no tiene permisos para este conteo");
                return false;
            }
            
            // Extraer datos del request
            Long productoId = Long.valueOf(requestBody.get("productoId").toString());
            Integer cantidadConteo1 = requestBody.get("cantidadConteo1") != null ? 
                Integer.valueOf(requestBody.get("cantidadConteo1").toString()) : null;
            Integer cantidadConteo2 = requestBody.get("cantidadConteo2") != null ? 
                Integer.valueOf(requestBody.get("cantidadConteo2").toString()) : null;
            String formulaCalculo1 = requestBody.get("formulaCalculo1") != null ? 
                requestBody.get("formulaCalculo1").toString() : null;
            String formulaCalculo2 = requestBody.get("formulaCalculo2") != null ? 
                requestBody.get("formulaCalculo2").toString() : null;
            
            // Obtener el producto
            Optional<Producto> productoOpt = productoRepository.findById(productoId);
            if (!productoOpt.isPresent()) {
                System.out.println("❌ Producto no encontrado: " + productoId);
                return false;
            }
            
            Producto producto = productoOpt.get();
            
            // Buscar el detalle existente para este producto y usuario
            List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
            DetalleConteo detalleExistente = null;
            
            // Buscar el detalle que corresponde al usuario actual
            for (DetalleConteo detalle : detallesExistentes) {
                if (detalle.getProducto().getId().equals(productoId) && !detalle.getEliminado()) {
                    // Verificar si es del usuario correcto basándose en las cantidades
                    boolean esDelUsuario = false;
                    if (usuarioId.equals(conteoSector.getUsuarioAsignado1().getId())) {
                        // Es usuario 1 - verificar si tiene cantidadConteo1
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            esDelUsuario = true;
                        }
                    } else if (usuarioId.equals(conteoSector.getUsuarioAsignado2().getId())) {
                        // Es usuario 2 - verificar si tiene cantidadConteo2
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            esDelUsuario = true;
                        }
                    }
                    
                    if (esDelUsuario) {
                        detalleExistente = detalle;
                        break;
                    }
                }
            }
            
            if (detalleExistente != null) {
                // Marcar el detalle existente como eliminado
                System.out.println("🔍 Marcando detalle existente como eliminado - ID: " + detalleExistente.getId() + 
                                 ", Producto: " + detalleExistente.getProducto().getNombre());
                detalleExistente.setEliminado(true);
                detalleConteoRepository.save(detalleExistente);
                System.out.println("✅ Detalle existente marcado como eliminado exitosamente para producto: " + producto.getNombre());
            } else {
                System.out.println("⚠️ No se encontró detalle existente para marcar como eliminado, creando uno nuevo");
                // Si no se encuentra un detalle existente, crear uno nuevo (caso excepcional)
                DetalleConteo detalleEliminado = new DetalleConteo();
                detalleEliminado.setConteoSector(conteoSector);
                detalleEliminado.setProducto(producto);
                detalleEliminado.setNombreProducto(producto.getNombre());
                detalleEliminado.setCodigoProducto(producto.getCodigoPersonalizado());
                detalleEliminado.setCantidadConteo1(cantidadConteo1);
                detalleEliminado.setCantidadConteo2(cantidadConteo2);
                detalleEliminado.setFormulaCalculo1(formulaCalculo1);
                detalleEliminado.setFormulaCalculo2(formulaCalculo2);
                detalleEliminado.setEliminado(true);
                detalleEliminado.setStockSistema(producto.getStock());
                
                detalleConteoRepository.save(detalleEliminado);
                System.out.println("✅ Detalle eliminado creado exitosamente para producto: " + producto.getNombre());
            }
            
            // Recalcular el progreso del conteo sector
            calcularProgresoReal(conteoSector);
            conteoSectorRepository.save(conteoSector);
            
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Error creando detalle eliminado: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean eliminarDetalleConteo(Long detalleId, Long conteoSectorId, Long usuarioId) {
        try {
            System.out.println("🗑️ Eliminando detalle de conteo: " + detalleId + " del sector: " + conteoSectorId);
            
            // Verificar que el detalle existe y pertenece al conteo sector
            Optional<DetalleConteo> detalleOpt = detalleConteoRepository.findById(detalleId);
            if (!detalleOpt.isPresent()) {
                System.out.println("❌ Detalle no encontrado: " + detalleId);
                return false;
            }
            
            DetalleConteo detalle = detalleOpt.get();
            if (!detalle.getConteoSector().getId().equals(conteoSectorId)) {
                System.out.println("❌ El detalle no pertenece al conteo sector: " + conteoSectorId);
                return false;
            }
            
            // Verificar que el usuario tiene permisos (es uno de los usuarios asignados)
            ConteoSector conteoSector = detalle.getConteoSector();
            boolean esUsuarioAsignado = false;
            
            if (conteoSector.getUsuarioAsignado1() != null && conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                esUsuarioAsignado = true;
            }
            if (conteoSector.getUsuarioAsignado2() != null && conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
                esUsuarioAsignado = true;
            }
            
            if (!esUsuarioAsignado) {
                System.out.println("❌ Usuario " + usuarioId + " no tiene permisos para eliminar detalles de este conteo");
                return false;
            }
            
            // Marcar el detalle como eliminado (soft delete)
            System.out.println("🔍 DEBUG - Estado ANTES de marcar como eliminado: " + detalle.getEliminado());
            detalle.setEliminado(true);
            System.out.println("🔍 DEBUG - Estado DESPUÉS de setEliminado(true): " + detalle.getEliminado());
            DetalleConteo detalleGuardado = detalleConteoRepository.save(detalle);
            System.out.println("🔍 DEBUG - Estado DESPUÉS de guardar en BD: " + detalleGuardado.getEliminado());
            System.out.println("✅ Detalle marcado como eliminado exitosamente: " + detalleId);
            
            // Recalcular el progreso del conteo sector
            calcularProgresoReal(conteoSector);
            conteoSectorRepository.save(conteoSector);
            
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Error eliminando detalle: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Obtener inventario activo por empresa
     */
    public Optional<InventarioCompleto> obtenerInventarioActivo(Long empresaId) {
        System.out.println("🔍 Obteniendo inventario activo para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        // Debug: Listar todos los inventarios de la empresa
        List<InventarioCompleto> todosLosInventarios = inventarioCompletoRepository.findByEmpresaOrderByFechaInicioDesc(empresa);
        System.out.println("🔍 DEBUG - Total inventarios en empresa: " + todosLosInventarios.size());
        for (InventarioCompleto inv : todosLosInventarios) {
            System.out.println("  - Inventario ID: " + inv.getId() + ", Estado: " + inv.getEstado() + ", Fecha: " + inv.getFechaInicio());
        }
        
        // Obtener todos los inventarios activos (PENDIENTE, EN_PROGRESO)
        List<InventarioCompleto> inventariosActivos = inventarioCompletoRepository.findInventariosActivosByEmpresa(empresa);
        System.out.println("🔍 DEBUG - Inventarios activos encontrados: " + inventariosActivos.size());
        
        // Si no hay inventarios activos, buscar el inventario COMPLETADO más reciente
        // PERO solo si NO tiene el stock actualizado Y es RECIENTE (últimas 24 horas)
        if (inventariosActivos.isEmpty()) {
            System.out.println("🔍 No hay inventarios activos, buscando inventario COMPLETADO más reciente...");
            List<InventarioCompleto> inventariosCompletados = inventarioCompletoRepository.findByEmpresaAndEstadoOrderByFechaInicioDesc(empresa, InventarioCompleto.EstadoInventario.COMPLETADO);
            
            LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);
            System.out.println("🔍 Solo considerando inventarios completados después de: " + hace24Horas);
            
            for (InventarioCompleto inventario : inventariosCompletados) {
                // Solo devolver inventarios completados que:
                // 1. NO tengan el stock actualizado
                // 2. Sean recientes (últimas 24 horas)
                boolean tieneStockActualizado = inventario.getObservaciones() != null && inventario.getObservaciones().contains("STOCK_ACTUALIZADO");
                boolean esReciente = inventario.getFechaInicio().isAfter(hace24Horas);
                
                if (!tieneStockActualizado && esReciente) {
                    System.out.println("🔍 Inventario COMPLETADO reciente encontrado (sin stock actualizado): " + inventario.getId() + " - Fecha: " + inventario.getFechaInicio());
                    return Optional.of(inventario);
                } else {
                    if (tieneStockActualizado) {
                        System.out.println("🔍 Inventario " + inventario.getId() + " ya tiene stock actualizado, saltando...");
                    } else if (!esReciente) {
                        System.out.println("🔍 Inventario " + inventario.getId() + " es muy viejo (" + inventario.getFechaInicio() + "), saltando...");
                    }
                }
            }
            
            System.out.println("🔍 No se encontraron inventarios completados recientes sin stock actualizado - Mostrando botón 'Crear Inventario'");
        }
        
        Optional<InventarioCompleto> inventarioActivo = Optional.empty();
        
        if (inventariosActivos.isEmpty()) {
            System.out.println("🔍 No hay inventarios activos");
        } else if (inventariosActivos.size() == 1) {
            inventarioActivo = Optional.of(inventariosActivos.get(0));
            System.out.println("🔍 Inventario activo único encontrado: " + inventarioActivo.get().getId());
        } else {
            // Hay múltiples inventarios activos - cancelar los más antiguos y mantener el más reciente
            System.out.println("⚠️ Múltiples inventarios activos encontrados (" + inventariosActivos.size() + "). Cancelando los más antiguos...");
            
            // Ordenar por fecha de inicio descendente (más reciente primero)
            inventariosActivos.sort((a, b) -> b.getFechaInicio().compareTo(a.getFechaInicio()));
            
            // Mantener el más reciente
            InventarioCompleto inventarioMasReciente = inventariosActivos.get(0);
            inventarioActivo = Optional.of(inventarioMasReciente);
            
            // Cancelar los más antiguos
            for (int i = 1; i < inventariosActivos.size(); i++) {
                InventarioCompleto inventarioAntiguo = inventariosActivos.get(i);
                System.out.println("🗑️ Cancelando inventario antiguo: " + inventarioAntiguo.getId());
                inventarioAntiguo.setEstado(InventarioCompleto.EstadoInventario.CANCELADO);
                inventarioAntiguo.setFechaFinalizacion(LocalDateTime.now());
                inventarioCompletoRepository.save(inventarioAntiguo);
            }
            
            System.out.println("✅ Inventario activo final: " + inventarioActivo.get().getId());
        }
        
        if (inventarioActivo.isPresent()) {
            InventarioCompleto inventario = inventarioActivo.get();
            System.out.println("  - ID: " + inventario.getId() + ", Estado: " + inventario.getEstado());
            
            // ✅ CORRECCIÓN: Crear copia de la lista para evitar ConcurrentModificationException
            List<ConteoSector> sectores = new ArrayList<>(inventario.getConteosSectores());
            
            // Actualizar el progreso real de todos los sectores
            for (ConteoSector conteoSector : sectores) {
                calcularProgresoReal(conteoSector);
            }
            
            // Calcular estadísticas actualizadas
            inventario.calcularEstadisticas();
            
            // Guardar las estadísticas actualizadas
            inventarioCompletoRepository.save(inventario);
        }
        
        return inventarioActivo;
    }

    /**
     * Crear un nuevo inventario completo
     */
    public InventarioCompleto crearInventarioCompleto(Long empresaId, Long usuarioAdminId) {
        System.out.println("🔍 Creando inventario completo para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Usuario usuarioAdmin = usuarioRepository.findById(usuarioAdminId)
            .orElseThrow(() -> new RuntimeException("Usuario administrador no encontrado"));
        
        // Verificar si hay inventarios activos y limpiarlos automáticamente
        List<InventarioCompleto> inventariosActivos = inventarioCompletoRepository.findInventariosActivosByEmpresa(empresa);
        if (!inventariosActivos.isEmpty()) {
            System.out.println("⚠️ Encontrados " + inventariosActivos.size() + " inventarios activos. Cancelando todos...");
            for (InventarioCompleto inventarioActivo : inventariosActivos) {
                System.out.println("🗑️ Cancelando inventario activo: " + inventarioActivo.getId());
                inventarioActivo.setEstado(InventarioCompleto.EstadoInventario.CANCELADO);
                inventarioActivo.setFechaFinalizacion(LocalDateTime.now());
                inventarioCompletoRepository.save(inventarioActivo);
            }
        }
        
        // Crear inventario completo
        String nombreInventario = "Inventario Completo " + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        InventarioCompleto inventario = new InventarioCompleto(nombreInventario, empresa, usuarioAdmin);
        inventario.setEstado(InventarioCompleto.EstadoInventario.PENDIENTE);
        
        // Obtener sectores activos de la empresa
        List<Sector> sectores = sectorRepository.findByEmpresaIdAndActivoOrderByNombre(empresaId, true);
        inventario.setTotalSectores(sectores.size());
        
        inventario = inventarioCompletoRepository.save(inventario);
        
        // Crear conteos de sector para cada sector
        for (Sector sector : sectores) {
            ConteoSector conteoSector = new ConteoSector(inventario, sector);
            conteoSectorRepository.save(conteoSector);
        }
        
        System.out.println("✅ Inventario completo creado: " + inventario.getId());
        return inventario;
    }

    /**
     * Obtener inventarios completos por empresa
     */
    public List<InventarioCompleto> obtenerInventariosCompletosPorEmpresa(Long empresaId) {
        System.out.println("🔍 Obteniendo inventarios completos para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        return inventarioCompletoRepository.findByEmpresaOrderByFechaInicioDesc(empresa);
    }

    /**
     * Obtener inventario completo por ID
     */
    public Optional<InventarioCompleto> obtenerInventarioCompleto(Long inventarioId) {
        System.out.println("🔍 Obteniendo inventario completo: " + inventarioId);
        return inventarioCompletoRepository.findById(inventarioId);
    }

    /**
     * Obtener conteo sector por ID (wrapper para Optional)
     */
    public Optional<ConteoSector> obtenerConteoSector(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo conteo sector: " + conteoSectorId);
        return conteoSectorRepository.findById(conteoSectorId);
    }

    /**
     * Obtener conteos de sector por inventario
     */
    public List<ConteoSectorDTO> obtenerConteosSector(Long inventarioId) {
        System.out.println("🔍 Obteniendo conteos de sector para inventario: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
            .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
        
        List<ConteoSector> conteosSector = conteoSectorRepository.findByInventarioCompletoOrderBySectorNombre(inventario);
        
        // Convertir a DTOs con estados por usuario actualizados
        List<ConteoSectorDTO> conteosSectorDTO = new ArrayList<>();
        for (ConteoSector conteoSector : conteosSector) {
            ConteoSectorDTO dto = new ConteoSectorDTO(conteoSector);
            
            // Actualizar estados por usuario si hay usuarios asignados
            if (conteoSector.getUsuarioAsignado1() != null && conteoSector.getUsuarioAsignado2() != null) {
                String estadoUsuario1 = determinarEstadoUsuario(conteoSector, conteoSector.getUsuarioAsignado1().getId()).name();
                String estadoUsuario2 = determinarEstadoUsuario(conteoSector, conteoSector.getUsuarioAsignado2().getId()).name();
                dto.actualizarEstadosUsuario(estadoUsuario1, estadoUsuario2);
            }
            
            conteosSectorDTO.add(dto);
        }
        
        return conteosSectorDTO;
    }

    /**
     * Asignar usuarios a un sector por sector ID
     */
    public ConteoSector asignarUsuariosASectorPorSectorId(Long inventarioId, Long sectorId, Long usuario1Id, Long usuario2Id) {
        System.out.println("🔍 Asignando usuarios a sector por sector ID - inventario: " + inventarioId + ", sector: " + sectorId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
            .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
        
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        Usuario usuario1 = usuarioRepository.findById(usuario1Id)
            .orElseThrow(() -> new RuntimeException("Usuario 1 no encontrado"));
        
        Usuario usuario2 = usuarioRepository.findById(usuario2Id)
            .orElseThrow(() -> new RuntimeException("Usuario 2 no encontrado"));
        
        // Buscar el conteo de sector, si no existe, crearlo
        Optional<ConteoSector> conteoSectorOpt = conteoSectorRepository.findByInventarioCompletoAndSector(inventario, sector);
        ConteoSector conteoSector;
        
        if (conteoSectorOpt.isPresent()) {
            conteoSector = conteoSectorOpt.get();
            System.out.println("✅ Conteo de sector encontrado: " + conteoSector.getId());
        } else {
            System.out.println("⚠️ Conteo de sector no encontrado, creando nuevo...");
            conteoSector = new ConteoSector(inventario, sector);
            conteoSector = conteoSectorRepository.save(conteoSector);
            System.out.println("✅ Nuevo conteo de sector creado: " + conteoSector.getId());
        }
        
        conteoSector.setUsuarioAsignado1(usuario1);
        conteoSector.setUsuarioAsignado2(usuario2);
        conteoSector.setEstado(ConteoSector.EstadoConteo.PENDIENTE);
        
        return conteoSectorRepository.save(conteoSector);
    }

    /**
     * Asignar usuarios a un sector por conteo sector ID
     */
    public ConteoSector asignarUsuariosASector(Long conteoSectorId, Long usuario1Id, Long usuario2Id) {
        System.out.println("🔍 Asignando usuarios a sector por conteo ID: " + conteoSectorId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        Usuario usuario1 = usuarioRepository.findById(usuario1Id)
            .orElseThrow(() -> new RuntimeException("Usuario 1 no encontrado"));
        
        Usuario usuario2 = usuarioRepository.findById(usuario2Id)
            .orElseThrow(() -> new RuntimeException("Usuario 2 no encontrado"));
        
        conteoSector.setUsuarioAsignado1(usuario1);
        conteoSector.setUsuarioAsignado2(usuario2);
        conteoSector.setEstado(ConteoSector.EstadoConteo.PENDIENTE);
        
        return conteoSectorRepository.save(conteoSector);
    }

    /**
     * Iniciar conteo de sector
     */
    public ConteoSector iniciarConteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Iniciando conteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Solo cambiar el estado si no está ya en progreso
        if (conteoSector.getEstado() != ConteoSector.EstadoConteo.EN_PROGRESO) {
            conteoSector.setEstado(ConteoSector.EstadoConteo.EN_PROGRESO);
            System.out.println("✅ Estado cambiado a EN_PROGRESO para sector: " + conteoSectorId);
        } else {
            System.out.println("ℹ️ El conteo ya está en progreso para sector: " + conteoSectorId);
        }
        
        ConteoSector conteoSectorGuardado = conteoSectorRepository.save(conteoSector);
        
        // Actualizar estadísticas del inventario
        InventarioCompleto inventario = conteoSector.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        return conteoSectorGuardado;
    }

    /**
     * Agregar producto al conteo
     */
    public DetalleConteo agregarProductoAlConteo(Long conteoSectorId, Long productoId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔍 === AGREGANDO PRODUCTO AL CONTEO ===");
        System.out.println("🔍 ConteoSector ID: " + conteoSectorId);
        System.out.println("🔍 Producto ID: " + productoId);
        System.out.println("🔍 Cantidad: " + cantidad);
        System.out.println("🔍 Usuario ID: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        System.out.println("🔍 ConteoSector encontrado:");
        System.out.println("  - ID: " + conteoSector.getId());
        System.out.println("  - Sector ID: " + conteoSector.getSector().getId());
        System.out.println("  - Sector Nombre: " + conteoSector.getSector().getNombre());
        System.out.println("  - Estado: " + conteoSector.getEstado());
        
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        System.out.println("🔍 Producto encontrado:");
        System.out.println("  - ID: " + producto.getId());
        System.out.println("  - Nombre: " + producto.getNombre());
        System.out.println("  - Sector Almacenamiento: " + producto.getSectorAlmacenamiento());
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Verificar si es reconteo (basándose en el estado del sector)
        boolean esReconteo = conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS;
        
        DetalleConteo detalle;
        
        if (esReconteo) {
            System.out.println("🔄 RECONTEO: Creando nueva entrada de reconteo");
            
            // En reconteo, siempre crear una nueva entrada para mantener historial
            detalle = new DetalleConteo();
            detalle.setConteoSector(conteoSector);
            detalle.setProducto(producto);
            detalle.setCodigoProducto(producto.getCodigoPersonalizado());
            detalle.setNombreProducto(producto.getNombre());
            detalle.setStockSistema(producto.getStock());
            detalle.setPrecioUnitario(producto.getPrecio());
            
            // ✅ CORRECCIÓN: Buscar TODAS las entradas del producto para consolidar valores del otro usuario
            List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(conteoSector, producto);
            
            if (!detallesExistentes.isEmpty()) {
                System.out.println("✅ RECONTEO: Consolidando valores del otro usuario de " + detallesExistentes.size() + " entradas existentes");
                
                // ✅ CRÍTICO: Determinar fecha de inicio del reconteo para filtrar solo detalles de reconteo
                LocalDateTime fechaInicioReconteo = null;
                if (conteoSector.getObservaciones() != null && conteoSector.getObservaciones().startsWith("Reconteo_")) {
                    try {
                        String fechaStr = conteoSector.getObservaciones().split("_")[1];
                        fechaInicioReconteo = LocalDateTime.parse(fechaStr);
                        System.out.println("✅ RECONTEO: Fecha de inicio del reconteo: " + fechaInicioReconteo);
                    } catch (Exception e) {
                        System.out.println("⚠️ No se pudo parsear fecha de reconteo, usando todos los detalles");
                    }
                }
                
                final LocalDateTime fechaInicioFinal = fechaInicioReconteo;
                
                // ✅ CORRECCIÓN: Filtrar solo detalles de reconteo (después de fechaInicioReconteo) o todos si no hay fecha
                List<DetalleConteo> detallesReconteo = detallesExistentes.stream()
                    .filter(det -> {
                        if (fechaInicioFinal == null) return true; // Si no hay fecha, usar todos
                        return det.getFechaActualizacion() != null && 
                               det.getFechaActualizacion().isAfter(fechaInicioFinal);
                    })
                    .collect(java.util.stream.Collectors.toList());
                
                System.out.println("✅ RECONTEO: Detalles de reconteo filtrados: " + detallesReconteo.size() + " de " + detallesExistentes.size());
                
                // ✅ CORRECCIÓN: NO sumar, sino encontrar el valor MÁS RECIENTE del otro usuario EN RECONTEO
                // Ordenar por fecha descendente (más reciente primero)
                detallesReconteo.sort((d1, d2) -> {
                    if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
                    if (d1.getFechaActualizacion() == null) return 1;
                    if (d2.getFechaActualizacion() == null) return -1;
                    return d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion());
                });
                
                if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                    // Usuario 1 haciendo reconteo - buscar el valor más reciente del usuario 2 EN RECONTEO
                    for (DetalleConteo det : detallesReconteo) {
                        if (det.getCantidadConteo2() != null && det.getCantidadConteo2() > 0) {
                            detalle.setCantidadConteo2(det.getCantidadConteo2());
                            detalle.setFormulaCalculo2(det.getFormulaCalculo2());
                            System.out.println("✅ RECONTEO: Usuario2 más reciente (de reconteo): " + det.getCantidadConteo2() + " (" + det.getFormulaCalculo2() + ")");
                            break;
                        }
                    }
                    // Si no se encontró en reconteo, usar el conteo inicial como referencia
                    if (detalle.getCantidadConteo2() == null) {
                        System.out.println("⚠️ RECONTEO: No se encontró reconteo de Usuario2, buscando en conteo inicial");
                        for (DetalleConteo det : detallesExistentes) {
                            if (det.getCantidadConteo2() != null && det.getCantidadConteo2() > 0) {
                                detalle.setCantidadConteo2(det.getCantidadConteo2());
                                detalle.setFormulaCalculo2(det.getFormulaCalculo2());
                                System.out.println("✅ RECONTEO: Usuario2 del conteo inicial (referencia): " + det.getCantidadConteo2());
                                break;
                            }
                        }
                    }
                } else {
                    // Usuario 2 haciendo reconteo - buscar el valor más reciente del usuario 1 EN RECONTEO
                    for (DetalleConteo det : detallesReconteo) {
                        if (det.getCantidadConteo1() != null && det.getCantidadConteo1() > 0) {
                            detalle.setCantidadConteo1(det.getCantidadConteo1());
                            detalle.setFormulaCalculo1(det.getFormulaCalculo1());
                            System.out.println("✅ RECONTEO: Usuario1 más reciente (de reconteo): " + det.getCantidadConteo1() + " (" + det.getFormulaCalculo1() + ")");
                            break;
                        }
                    }
                    // Si no se encontró en reconteo, usar el conteo inicial como referencia
                    if (detalle.getCantidadConteo1() == null) {
                        System.out.println("⚠️ RECONTEO: No se encontró reconteo de Usuario1, buscando en conteo inicial");
                        for (DetalleConteo det : detallesExistentes) {
                            if (det.getCantidadConteo1() != null && det.getCantidadConteo1() > 0) {
                                detalle.setCantidadConteo1(det.getCantidadConteo1());
                                detalle.setFormulaCalculo1(det.getFormulaCalculo1());
                                System.out.println("✅ RECONTEO: Usuario1 del conteo inicial (referencia): " + det.getCantidadConteo1());
                                break;
                            }
                        }
                    }
                }
            }
        } else {
            System.out.println("🆕 CONTEO INICIAL: Creando nueva entrada");
            System.out.println("🔍 DEBUG CONTEO INICIAL:");
            System.out.println("  - ConteoSector ID: " + conteoSector.getId());
            System.out.println("  - Producto ID: " + producto.getId());
            System.out.println("  - Producto Nombre: " + producto.getNombre());
            System.out.println("  - Usuario ID: " + usuarioId);
            System.out.println("  - Cantidad: " + cantidad);
            System.out.println("  - Fórmula: " + formulaCalculo);
            
            // Verificar si ya existen detalles para este producto en este sector
            List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(conteoSector, producto);
            System.out.println("🔍 DETALLES EXISTENTES para este producto: " + detallesExistentes.size());
            for (DetalleConteo det : detallesExistentes) {
                System.out.println("  - Detalle ID: " + det.getId() + ", Usuario1: " + det.getCantidadConteo1() + ", Usuario2: " + det.getCantidadConteo2() + ", Eliminado: " + det.getEliminado());
            }
            
            // Crear nuevo detalle para conteo inicial (permite múltiples conteos del mismo producto)
            detalle = new DetalleConteo();
            detalle.setConteoSector(conteoSector);
            detalle.setProducto(producto);
            detalle.setCodigoProducto(producto.getCodigoPersonalizado());
            detalle.setNombreProducto(producto.getNombre());
            detalle.setStockSistema(producto.getStock());
            detalle.setPrecioUnitario(producto.getPrecio());
            
            System.out.println("✅ NUEVA ENTRADA CREADA (antes de guardar)");
        }
        
        // Asignar cantidad según el usuario
        if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
            detalle.setCantidadConteo1(cantidad);
            detalle.setFormulaCalculo1(formulaCalculo);
            // Para conteo inicial, limpiar valores del otro usuario
            if (!esReconteo) {
                detalle.setCantidadConteo2(null);
                detalle.setFormulaCalculo2(null);
            }
            // Para reconteo, mantener los valores del otro usuario (ya copiados arriba)
        } else {
            // Para conteo inicial, limpiar valores del otro usuario
            if (!esReconteo) {
                detalle.setCantidadConteo1(null);
                detalle.setFormulaCalculo1(null);
            }
            // Para reconteo, mantener los valores del otro usuario (ya copiados arriba)
            detalle.setCantidadConteo2(cantidad);
            detalle.setFormulaCalculo2(formulaCalculo);
        }
        
        // Guardar el detalle
        System.out.println("🔍 GUARDANDO detalle - ID antes: " + detalle.getId());
        detalle = detalleConteoRepository.save(detalle);
        System.out.println("✅ DETALLE GUARDADO - ID después: " + detalle.getId());
        System.out.println("✅ DETALLE GUARDADO - Producto: " + detalle.getProducto().getNombre());
        System.out.println("✅ DETALLE GUARDADO - Usuario1: " + detalle.getCantidadConteo1());
        System.out.println("✅ DETALLE GUARDADO - Usuario2: " + detalle.getCantidadConteo2());
        System.out.println("✅ DETALLE GUARDADO - Estado: " + detalle.getEstado());
        
        // Verificar cuántos detalles existen ahora para este producto
        List<DetalleConteo> detallesDespues = detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(conteoSector, producto);
        System.out.println("🔍 TOTAL DETALLES después de guardar para este producto: " + detallesDespues.size());
        for (DetalleConteo det : detallesDespues) {
            System.out.println("  - Detalle ID: " + det.getId() + ", Usuario1: " + det.getCantidadConteo1() + ", Usuario2: " + det.getCantidadConteo2() + ", Eliminado: " + det.getEliminado());
        }
        
        // Actualizar el progreso real del sector
        calcularProgresoReal(conteoSector);
        conteoSectorRepository.save(conteoSector);
        
        // NO cambiar el estado general del conteo sector
        // El estado se mantiene como PENDIENTE hasta que se finalice el conteo
        // Los estados por usuario se determinan individualmente basándose en los DetalleConteo
        
        System.out.println("🔍 === DETALLE GUARDADO ===");
        System.out.println("🔍 Detalle ID: " + detalle.getId());
        System.out.println("🔍 Producto: " + detalle.getProducto().getNombre());
        System.out.println("🔍 Sector: " + detalle.getConteoSector().getSector().getNombre());
        System.out.println("🔍 Cantidad Conteo1: " + detalle.getCantidadConteo1());
        System.out.println("🔍 Cantidad Conteo2: " + detalle.getCantidadConteo2());
        System.out.println("🔍 Fórmula1: " + detalle.getFormulaCalculo1());
        System.out.println("🔍 Fórmula2: " + detalle.getFormulaCalculo2());
        
        System.out.println("✅ Producto agregado al conteo por usuario " + usuarioId);
        System.out.println("ℹ️ Estado general del conteo sector se mantiene como: " + conteoSector.getEstado());
        System.out.println("🔍 === FIN AGREGAR PRODUCTO AL CONTEO ===");
        
        return detalle;
    }

    /**
     * Actualizar detalle de conteo existente
     */
    public DetalleConteo actualizarDetalleConteo(Long conteoSectorId, Long detalleId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔄 ACTUALIZAR DETALLE: Actualizando detalle - sector: " + conteoSectorId + ", detalle: " + detalleId + ", cantidad: " + cantidad);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        System.out.println("🔍 ACTUALIZAR DEBUG: ConteoSector encontrado - ID: " + conteoSector.getId() + 
                         ", Usuario1: " + (conteoSector.getUsuarioAsignado1() != null ? conteoSector.getUsuarioAsignado1().getId() : "null") +
                         ", Usuario2: " + (conteoSector.getUsuarioAsignado2() != null ? conteoSector.getUsuarioAsignado2().getId() : "null"));
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Buscar el detalle específico
        DetalleConteo detalle = detalleConteoRepository.findById(detalleId)
            .orElseThrow(() -> new RuntimeException("Detalle de conteo no encontrado"));
        
        // Verificar que el detalle pertenece al sector correcto
        if (!detalle.getConteoSector().getId().equals(conteoSectorId)) {
            throw new RuntimeException("El detalle no pertenece a este sector");
        }
        
        System.out.println("🔍 ACTUALIZAR DEBUG: Detalle encontrado - ID: " + detalle.getId() + 
                         ", Producto: " + detalle.getProducto().getNombre() + 
                         ", Cantidad1 ANTES: " + detalle.getCantidadConteo1() + 
                         ", Cantidad2 ANTES: " + detalle.getCantidadConteo2() +
                         ", Formula1 ANTES: " + detalle.getFormulaCalculo1() +
                         ", Formula2 ANTES: " + detalle.getFormulaCalculo2());
        
        // Actualizar la cantidad según el usuario
        if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
            System.out.println("🔄 ACTUALIZAR DEBUG: Usuario 1 - Actualizando cantidad de " + detalle.getCantidadConteo1() + " a " + cantidad);
            detalle.setCantidadConteo1(cantidad);
            detalle.setFormulaCalculo1(formulaCalculo);
            detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_1);
        } else {
            System.out.println("🔄 ACTUALIZAR DEBUG: Usuario 2 - Actualizando cantidad de " + detalle.getCantidadConteo2() + " a " + cantidad);
            detalle.setCantidadConteo2(cantidad);
            detalle.setFormulaCalculo2(formulaCalculo);
            detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_2);
        }
        
        // Recalcular diferencias
        calcularDiferencias(detalle);
        
        DetalleConteo resultado = detalleConteoRepository.save(detalle);
        System.out.println("✅ ACTUALIZAR DEBUG: Detalle actualizado - Cantidad1 DESPUÉS: " + resultado.getCantidadConteo1() + 
                         ", Cantidad2 DESPUÉS: " + resultado.getCantidadConteo2() +
                         ", Formula1 DESPUÉS: " + resultado.getFormulaCalculo1() +
                         ", Formula2 DESPUÉS: " + resultado.getFormulaCalculo2() +
                         ", Estado: " + resultado.getEstado());
        
        // Actualizar el progreso real del sector
        calcularProgresoReal(conteoSector);
        conteoSectorRepository.save(conteoSector);
        
        return resultado;
    }

    /**
     * Agregar producto al reconteo
     * NOTA: En reconteo siempre se debe crear una nueva entrada para mantener historial
     * Por lo tanto, delegamos a agregarProductoAlConteo que ya maneja esto correctamente
     */
    public DetalleConteo agregarProductoAlReconteo(Long conteoSectorId, Long productoId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔄 RECONTEO: Agregando producto - sector: " + conteoSectorId + ", producto: " + productoId + ", cantidad: " + cantidad);
        
        // ✅ CORRECCIÓN: En reconteo, delegar a agregarProductoAlConteo que ya maneja correctamente
        // la creación de nuevas entradas y copia de valores del otro usuario
        return agregarProductoAlConteo(conteoSectorId, productoId, cantidad, formulaCalculo, usuarioId);
    }

    /**
     * Cancelar inventario completo
     */
    @Transactional
    public InventarioCompleto cancelarInventarioCompleto(Long inventarioId) {
        System.out.println("🔍 Cancelando inventario completo: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
            .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
        
        System.out.println("🔍 Inventario encontrado: " + inventario.getId() + ", estado actual: " + inventario.getEstado());
        
        inventario.setEstado(InventarioCompleto.EstadoInventario.CANCELADO);
        inventario.setFechaFinalizacion(LocalDateTime.now());
        
        System.out.println("🔍 Estado cambiado a CANCELADO, guardando...");
        
        InventarioCompleto inventarioGuardado = inventarioCompletoRepository.save(inventario);
        
        System.out.println("✅ Inventario cancelado exitosamente: " + inventarioGuardado.getId());
        
        return inventarioGuardado;
    }

    /**
     * Finalizar inventario completo
     */
    public InventarioCompleto finalizarInventarioCompleto(Long inventarioId) {
        System.out.println("🔍 Finalizando inventario completo: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
            .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
        
        inventario.setEstado(InventarioCompleto.EstadoInventario.COMPLETADO);
        inventario.setFechaFinalizacion(LocalDateTime.now());
        
        return inventarioCompletoRepository.save(inventario);
    }

    /**
     * Finalizar conteo de sector
     */
    @Transactional
    public ConteoSector finalizarConteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Finalizando conteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        boolean esUsuario1 = false;
        boolean esUsuario2 = false;
        
        if (conteoSector.getUsuarioAsignado1() != null) {
            esUsuario1 = conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        }
        
        if (conteoSector.getUsuarioAsignado2() != null) {
            esUsuario2 = conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        }
        
        if (!esUsuario1 && !esUsuario2) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        System.out.println("🔍 [FINALIZAR] Estado actual del sector: " + conteoSector.getEstado());
        System.out.println("🔍 [FINALIZAR] ¿Es usuario 1? " + esUsuario1);
        System.out.println("🔍 [FINALIZAR] ¿Es usuario 2? " + esUsuario2);
        
        // Verificar si ya está en ESPERANDO_VERIFICACION (segundo usuario finalizando)
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("🔍 [FINALIZAR] Segundo usuario finalizando, verificando diferencias...");
            
            // Comparar conteos de ambos usuarios
            boolean hayDiferencias = verificarDiferenciasEnConteo(conteoSector);
            System.out.println("🔍 [FINALIZAR] ¿Hay diferencias? " + hayDiferencias);
            
            if (hayDiferencias) {
                conteoSector.setEstado(ConteoSector.EstadoConteo.CON_DIFERENCIAS);
                // ✅ CORRECCIÓN: Marcar el inicio del reconteo con fecha para poder filtrar correctamente
                String fechaReconteo = LocalDateTime.now().toString();
                conteoSector.setObservaciones("Reconteo_" + fechaReconteo);
                System.out.println("⚠️ [FINALIZAR] Diferencias encontradas, estado cambiado a CON_DIFERENCIAS");
                System.out.println("⚠️ [FINALIZAR] Inicio de reconteo marcado: Reconteo_" + fechaReconteo);
            } else {
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                System.out.println("✅ [FINALIZAR] Sin diferencias, estado cambiado a COMPLETADO");
            }
        } else {
            // Primer usuario finalizando
            System.out.println("🔍 [FINALIZAR] Primer usuario finalizando...");
            
            // ✅ CRÍTICO: Si ya estamos en reconteo (CON_DIFERENCIAS), NO sobrescribir las observaciones
            // porque contienen la fecha de inicio del reconteo que necesitamos para filtrar correctamente
            boolean yaEstaEnReconteo = conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS ||
                                     (conteoSector.getObservaciones() != null && conteoSector.getObservaciones().startsWith("Reconteo_"));
            
            if (!yaEstaEnReconteo) {
                // Solo establecer ESPERANDO_VERIFICACION si NO está en reconteo
                conteoSector.setEstado(ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION);
                
                // Marcar qué usuario finalizó en las observaciones (temporal)
                if (esUsuario1) {
                    conteoSector.setObservaciones("Usuario1_Finalizado");
                    System.out.println("🔍 [FINALIZAR] Marcado como Usuario1_Finalizado");
                } else if (esUsuario2) {
                    conteoSector.setObservaciones("Usuario2_Finalizado");
                    System.out.println("🔍 [FINALIZAR] Marcado como Usuario2_Finalizado");
                }
                System.out.println("⏳ [FINALIZAR] Primer usuario finalizado, estado cambiado a ESPERANDO_VERIFICACION");
            } else {
                // Ya está en reconteo, no cambiar nada, solo verificar diferencias
                System.out.println("⚠️ [FINALIZAR] Ya está en reconteo, manteniendo observaciones y verificando diferencias...");
                boolean hayDiferencias = verificarDiferenciasEnConteo(conteoSector);
                System.out.println("🔍 [FINALIZAR] ¿Hay diferencias? " + hayDiferencias);
                
                if (!hayDiferencias) {
                    conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                    System.out.println("✅ [FINALIZAR] Sin diferencias, estado cambiado a COMPLETADO");
                }
            }
        }
        
        System.out.println("🔍 [FINALIZAR] Guardando sector con estado: " + conteoSector.getEstado());
        ConteoSector conteoSectorGuardado = conteoSectorRepository.save(conteoSector);
        System.out.println("🔍 [FINALIZAR] Sector guardado con ID: " + conteoSectorGuardado.getId() + " y estado: " + conteoSectorGuardado.getEstado());
        
        // ✅ RECALCULAR PROGRESO DEL SECTOR después de cambiar el estado
        System.out.println("🔄 Recalculando progreso del sector después de finalizar...");
        calcularProgresoReal(conteoSectorGuardado);
        conteoSectorGuardado = conteoSectorRepository.save(conteoSectorGuardado);
        System.out.println("🔍 [FINALIZAR] Progreso recalculado, estado final: " + conteoSectorGuardado.getEstado());
        
        // Actualizar estadísticas del inventario
        InventarioCompleto inventario = conteoSectorGuardado.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        // ✅ ACTUALIZAR PROGRESO DEL INVENTARIO COMPLETO
        System.out.println("🔄 Actualizando progreso del inventario completo después de finalizar sector...");
        try {
            verificarYFinalizarInventarioCompleto(inventario.getId());
        } catch (Exception e) {
            System.err.println("⚠️ Error actualizando progreso del inventario: " + e.getMessage());
            // No lanzar la excepción para no interrumpir el flujo principal
        }
        
        System.out.println("✅ Estado final del sector: " + conteoSectorGuardado.getEstado());
        return conteoSectorGuardado;
    }

    /**
     * Verificar si hay diferencias entre los conteos de ambos usuarios
     */
    private boolean verificarDiferenciasEnConteo(ConteoSector conteoSector) {
        System.out.println("🔍 [VERIFICAR DIFERENCIAS] Iniciando verificación para sector: " + conteoSector.getId());
        System.out.println("🔍 [VERIFICAR DIFERENCIAS] Estado actual del sector: " + conteoSector.getEstado());
        System.out.println("🔍 [VERIFICAR DIFERENCIAS] Observaciones del sector: " + conteoSector.getObservaciones());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("🔍 Total detalles encontrados para verificación: " + detalles.size());
        
        // ✅ NUEVA LÓGICA: Detectar si estamos en reconteo
        boolean estaEnReconteo = conteoSector.getObservaciones() != null && 
                                conteoSector.getObservaciones().startsWith("Reconteo");
        
        System.out.println("🔍 [VERIFICAR] ¿Está en reconteo? " + estaEnReconteo);
        
        // Agrupar por producto
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        Map<Long, String> nombresProductos = new HashMap<>();
        
        for (DetalleConteo detalle : detalles) {
            // Verificar que el producto no sea nulo
            if (detalle.getProducto() == null) {
                System.err.println("⚠️ DetalleConteo con ID " + detalle.getId() + " tiene producto nulo, saltando...");
                continue;
            }
            
            Long productoId = detalle.getProducto().getId();
            String nombreProducto = detalle.getProducto().getNombre();
            nombresProductos.put(productoId, nombreProducto);
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Consolidar conteos por producto
        Map<Long, Integer> totalesUsuario1 = new HashMap<>();
        Map<Long, Integer> totalesUsuario2 = new HashMap<>();
        
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            String nombreProducto = nombresProductos.get(productoId);
            
            if (estaEnReconteo) {
                // ✅ CORRECCIÓN: EN RECONTEO, encontrar el valor más reciente de cada usuario independientemente
                // Esto permite que funcione sin importar el orden de quién recuenta primero
                System.out.println("🔍 [VERIFICAR] Modo reconteo - Consolidando valores por usuario");
                
                // Ordenar todos los detalles por fecha descendente (más reciente primero)
                List<DetalleConteo> todosDetallesOrdenados = new ArrayList<>(detallesDelProducto);
                todosDetallesOrdenados.sort((d1, d2) -> {
                    if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
                    if (d1.getFechaActualizacion() == null) return 1;
                    if (d2.getFechaActualizacion() == null) return -1;
                    return d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion());
                });
                
                // Buscar el valor más reciente de Usuario1
                Integer valorMasRecienteUsuario1 = null;
                for (DetalleConteo detalle : todosDetallesOrdenados) {
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        valorMasRecienteUsuario1 = detalle.getCantidadConteo1();
                        System.out.println("✅ [VERIFICAR] Usuario1 más reciente: " + valorMasRecienteUsuario1 + " (Detalle ID: " + detalle.getId() + ")");
                        break;
                    }
                }
                
                // Buscar el valor más reciente de Usuario2
                Integer valorMasRecienteUsuario2 = null;
                for (DetalleConteo detalle : todosDetallesOrdenados) {
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        valorMasRecienteUsuario2 = detalle.getCantidadConteo2();
                        System.out.println("✅ [VERIFICAR] Usuario2 más reciente: " + valorMasRecienteUsuario2 + " (Detalle ID: " + detalle.getId() + ")");
                        break;
                    }
                }
                
                // Asignar los valores encontrados
                if (valorMasRecienteUsuario1 != null) {
                    totalesUsuario1.put(productoId, valorMasRecienteUsuario1);
                }
                if (valorMasRecienteUsuario2 != null) {
                    totalesUsuario2.put(productoId, valorMasRecienteUsuario2);
                }
                
                System.out.println("✅ [VERIFICAR] Valores consolidados - Usuario1: " + valorMasRecienteUsuario1 + ", Usuario2: " + valorMasRecienteUsuario2);
            } else {
                // ✅ CONTEO NORMAL: Sumar todas las cantidades (permitir conteos múltiples)
                for (DetalleConteo detalle : detallesDelProducto) {
            System.out.println("🔍 Procesando detalle ID: " + detalle.getId() + 
                             ", Producto: " + nombreProducto + 
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2() + 
                             ", Eliminado: " + detalle.getEliminado());
            
            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                totalesUsuario1.put(productoId, totalesUsuario1.getOrDefault(productoId, 0) + detalle.getCantidadConteo1());
                System.out.println("🔍 CONTEO NORMAL - Producto " + nombreProducto + " - Usuario 1: +" + detalle.getCantidadConteo1() + 
                                 " (total: " + totalesUsuario1.get(productoId) + ")");
            }
            
            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                totalesUsuario2.put(productoId, totalesUsuario2.getOrDefault(productoId, 0) + detalle.getCantidadConteo2());
                System.out.println("🔍 CONTEO NORMAL - Producto " + nombreProducto + " - Usuario 2: +" + detalle.getCantidadConteo2() + 
                                 " (total: " + totalesUsuario2.get(productoId) + ")");
                    }
                }
            }
        }
        
        // Comparar totales por producto
        Set<Long> todosLosProductos = new HashSet<>();
        todosLosProductos.addAll(totalesUsuario1.keySet());
        todosLosProductos.addAll(totalesUsuario2.keySet());
        
        for (Long productoId : todosLosProductos) {
            String nombreProducto = nombresProductos.get(productoId);
            Integer total1 = totalesUsuario1.getOrDefault(productoId, 0);
            Integer total2 = totalesUsuario2.getOrDefault(productoId, 0);
            
            System.out.println("🔍 Comparando producto " + nombreProducto + ": Usuario 1=" + total1 + ", Usuario 2=" + total2);
            
            // Si ambos usuarios contaron el producto, comparar totales
            if (total1 > 0 && total2 > 0) {
                if (!total1.equals(total2)) {
                    System.out.println("⚠️ Diferencia encontrada en CONTEO NORMAL - producto: " + nombreProducto + 
                                     " - Usuario 1: " + total1 + ", Usuario 2: " + total2);
                    return true;
                }
            }
            
            // Si solo uno de los usuarios contó el producto, también es una diferencia
            if ((total1 > 0 && total2 == 0) || (total2 > 0 && total1 == 0)) {
                System.out.println("⚠️ Diferencia encontrada en CONTEO NORMAL: solo un usuario contó " + nombreProducto + 
                                 " (Usuario 1: " + total1 + ", Usuario 2: " + total2 + ")");
                return true;
            }
        }
        
        System.out.println("✅ No se encontraron diferencias entre los conteos");
        return false;
    }

    /**
     * Verificar si hay diferencias entre los reconteos de ambos usuarios
     * Este método es específico para reconteos y compara solo los valores de reconteo
     */
    private boolean verificarDiferenciasEnReconteo(ConteoSector conteoSector) {
        System.out.println("🔍 [RECONTEO] Verificando diferencias en reconteo sector: " + conteoSector.getId());
        System.out.println("🔍 [RECONTEO] Estado actual del sector: " + conteoSector.getEstado());
        System.out.println("🔍 [RECONTEO] Observaciones del sector: " + conteoSector.getObservaciones());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("🔍 [RECONTEO] Total detalles encontrados para verificación: " + detalles.size());
        
        // Consolidar reconteos por producto
        Map<Long, Integer> reconteosUsuario1 = new HashMap<>();
        Map<Long, Integer> reconteosUsuario2 = new HashMap<>();
        Map<Long, String> nombresProductos = new HashMap<>();
        
        // Determinar fecha de inicio del reconteo (cuando se cambió a CON_DIFERENCIAS)
        LocalDateTime fechaInicioReconteo = conteoSector.getFechaCreacion(); // Por defecto, usar fecha de creación
        
        // Buscar la fecha más reciente de actualización como referencia para reconteo
        for (DetalleConteo detalle : detalles) {
            if (detalle.getFechaActualizacion() != null && 
                detalle.getFechaActualizacion().isAfter(fechaInicioReconteo)) {
                fechaInicioReconteo = detalle.getFechaActualizacion().minusMinutes(1); // Un minuto antes
                System.out.println("🔍 [RECONTEO] Nueva fecha de inicio del reconteo: " + fechaInicioReconteo);
                break;
            }
        }
        
        // Debug: Mostrar todas las fechas de actualización
        System.out.println("🔍 [RECONTEO] Fechas de actualización de todos los detalles:");
        for (DetalleConteo detalle : detalles) {
            System.out.println("  - Detalle ID: " + detalle.getId() + 
                             ", Fecha creación: " + detalle.getFechaCreacion() + 
                             ", Fecha actualización: " + detalle.getFechaActualizacion() +
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2());
        }
        
        System.out.println("🔍 [RECONTEO] Fecha de inicio del reconteo: " + fechaInicioReconteo);
        
        for (DetalleConteo detalle : detalles) {
            // Verificar que el producto no sea nulo
            if (detalle.getProducto() == null) {
                System.err.println("⚠️ [RECONTEO] DetalleConteo con ID " + detalle.getId() + " tiene producto nulo, saltando...");
                continue;
            }
            
            Long productoId = detalle.getProducto().getId();
            String nombreProducto = detalle.getProducto().getNombre();
            nombresProductos.put(productoId, nombreProducto);
            
            // Solo procesar valores que son del reconteo (más recientes que la fecha de inicio)
            boolean esValorReconteo = detalle.getFechaActualizacion() != null && 
                                    detalle.getFechaActualizacion().isAfter(fechaInicioReconteo);
            
            System.out.println("🔍 [RECONTEO] Procesando detalle ID: " + detalle.getId() + 
                             ", Producto: " + nombreProducto + 
                             ", Fecha actualización: " + detalle.getFechaActualizacion() + 
                             ", Es reconteo: " + esValorReconteo + 
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2() + 
                             ", Eliminado: " + detalle.getEliminado());
            
            // Solo usar valores del reconteo (más recientes que la fecha de inicio)
            if (esValorReconteo) {
            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                reconteosUsuario1.put(productoId, detalle.getCantidadConteo1());
                System.out.println("🔍 [RECONTEO] Producto " + nombreProducto + " - Usuario 1 reconteo: " + detalle.getCantidadConteo1());
            }
            
            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                reconteosUsuario2.put(productoId, detalle.getCantidadConteo2());
                System.out.println("🔍 [RECONTEO] Producto " + nombreProducto + " - Usuario 2 reconteo: " + detalle.getCantidadConteo2());
                }
            }
        }
        
        // Comparar reconteos por producto
        Set<Long> todosLosProductos = new HashSet<>();
        todosLosProductos.addAll(reconteosUsuario1.keySet());
        todosLosProductos.addAll(reconteosUsuario2.keySet());
        
        for (Long productoId : todosLosProductos) {
            String nombreProducto = nombresProductos.get(productoId);
            Integer reconteo1 = reconteosUsuario1.getOrDefault(productoId, 0);
            Integer reconteo2 = reconteosUsuario2.getOrDefault(productoId, 0);
            
            System.out.println("🔍 [RECONTEO] Comparando producto " + nombreProducto + ": Usuario 1=" + reconteo1 + ", Usuario 2=" + reconteo2);
            
            // Si ambos usuarios recontaron el producto, comparar reconteos
            if (reconteo1 > 0 && reconteo2 > 0) {
                System.out.println("🔍 [RECONTEO] Ambos usuarios recontaron " + nombreProducto + 
                                 " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                System.out.println("🔍 [RECONTEO] ¿Son iguales? " + reconteo1.equals(reconteo2));
                
                if (!reconteo1.equals(reconteo2)) {
                    System.out.println("⚠️ [RECONTEO] Diferencia encontrada en reconteo - producto: " + nombreProducto + 
                                     " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                    return true;
                } else {
                    System.out.println("✅ [RECONTEO] Sin diferencias en reconteo - producto: " + nombreProducto + 
                                     " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                }
            }
            
            // Si solo uno de los usuarios recontó el producto, también es una diferencia
            if ((reconteo1 > 0 && reconteo2 == 0) || (reconteo2 > 0 && reconteo1 == 0)) {
                System.out.println("⚠️ [RECONTEO] Diferencia encontrada: solo un usuario recontó " + nombreProducto + 
                                 " (Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2 + ")");
                return true;
            }
        }
        
        System.out.println("✅ [RECONTEO] No se encontraron diferencias entre los reconteos");
        return false;
    }

    /**
     * Resetear estado de conteo (método de debug)
     */
    public ConteoSector resetearEstadoConteo(Long conteoSectorId) {
        System.out.println("🔧 DEBUG: Reseteando estado del conteo: " + conteoSectorId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        conteoSector.setEstado(ConteoSector.EstadoConteo.PENDIENTE);
        // Ya no tenemos fechaInicio ni fechaFin
        
        return conteoSectorRepository.save(conteoSector);
    }

    /**
     * Actualizar reconteo existente
     */
    public DetalleConteo actualizarReconteo(Long conteoSectorId, Long productoId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔄 ACTUALIZAR RECONTEO: Actualizando reconteo - sector: " + conteoSectorId + ", producto: " + productoId + ", cantidad: " + cantidad);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        System.out.println("🔍 ACTUALIZAR RECONTEO DEBUG: ConteoSector encontrado - ID: " + conteoSector.getId());
        
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Buscar el detalle existente para este producto
        List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        DetalleConteo detalleExistente = null;
        
        for (DetalleConteo detalle : detallesExistentes) {
            if (detalle.getProducto().getId().equals(productoId) && !detalle.getEliminado()) {
                // Verificar si es del usuario correcto
                boolean esDelUsuario = false;
                if (usuarioId.equals(conteoSector.getUsuarioAsignado1().getId())) {
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        esDelUsuario = true;
                    }
                } else if (usuarioId.equals(conteoSector.getUsuarioAsignado2().getId())) {
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        esDelUsuario = true;
                    }
                }
                
                if (esDelUsuario) {
                    detalleExistente = detalle;
                    break;
                }
            }
        }
        
        if (detalleExistente == null) {
            throw new RuntimeException("No se encontró el detalle de reconteo para actualizar");
        }
        
        System.out.println("🔍 ACTUALIZAR RECONTEO DEBUG: Detalle encontrado - ID: " + detalleExistente.getId());
        
        // Actualizar el detalle según el usuario
        if (usuarioId.equals(conteoSector.getUsuarioAsignado1().getId())) {
            System.out.println("🔄 ACTUALIZAR RECONTEO DEBUG: Usuario 1 - Actualizando cantidad de " + detalleExistente.getCantidadConteo1() + " a " + cantidad);
            detalleExistente.setCantidadConteo1(cantidad);
            detalleExistente.setFormulaCalculo1(formulaCalculo);
            detalleExistente.setEstado(DetalleConteo.EstadoDetalle.CONTADO_1);
        } else {
            System.out.println("🔄 ACTUALIZAR RECONTEO DEBUG: Usuario 2 - Actualizando cantidad de " + detalleExistente.getCantidadConteo2() + " a " + cantidad);
            detalleExistente.setCantidadConteo2(cantidad);
            detalleExistente.setFormulaCalculo2(formulaCalculo);
            detalleExistente.setEstado(DetalleConteo.EstadoDetalle.CONTADO_2);
        }
        
        // Recalcular diferencias
        calcularDiferencias(detalleExistente);
        
        DetalleConteo resultado = detalleConteoRepository.save(detalleExistente);
        
        System.out.println("✅ ACTUALIZAR RECONTEO DEBUG: Reconteo actualizado exitosamente - ID: " + resultado.getId());
        
        // Recalcular progreso del sector
        calcularProgresoReal(conteoSector);
        conteoSectorRepository.save(conteoSector);
        
        return resultado;
    }

    /**
     * Finalizar reconteo de sector (para el flujo de reconteo)
     */
    @Transactional
    public ConteoSector finalizarReconteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 [LEGACY] Delegando finalizarReconteoSector al servicio simple...");
        
        // ✅ NUEVA LÓGICA SIMPLE: Delegar al servicio simple
        ConteoSector conteoSectorGuardado = inventarioCompletoServiceSimple.finalizarReconteoSector(conteoSectorId, usuarioId);
        
        // ✅ RECALCULAR PROGRESO DEL SECTOR después de cambiar el estado
        System.out.println("🔄 Recalculando progreso del sector después de finalizar reconteo...");
        calcularProgresoReal(conteoSectorGuardado);
        conteoSectorGuardado = conteoSectorRepository.save(conteoSectorGuardado);
        
        // Actualizar estadísticas del inventario completo
        InventarioCompleto inventario = conteoSectorGuardado.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        // ✅ CORRECCIÓN: NO llamar automáticamente a verificarYFinalizarInventarioCompleto
        // El inventario debe mantenerse EN_PROGRESO hasta que se haga la consolidación manual
        System.out.println("✅ [LEGACY] Sector completado - Inventario mantenido en EN_PROGRESO para consolidación manual");
        
        System.out.println("✅ [LEGACY] Estado final del sector (reconteo): " + conteoSectorGuardado.getEstado());
        return conteoSectorGuardado;
    }

    /**
     * Determinar fecha de inicio del reconteo de manera alternativa
     * cuando no se puede parsear desde las observaciones
     */
    private LocalDateTime determinarFechaInicioReconteoAlternativa(ConteoSector conteoSector) {
        System.out.println("🔍 Buscando fecha de inicio de reconteo de manera alternativa...");
        
        // Obtener todos los detalles del sector ordenados por fecha
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        if (todosLosDetalles.isEmpty()) {
            System.out.println("⚠️ No hay detalles para determinar fecha de reconteo");
            return null;
        }
        
        // Ordenar por fecha de actualización
        todosLosDetalles.sort((d1, d2) -> {
            if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
            if (d1.getFechaActualizacion() == null) return 1;
            if (d2.getFechaActualizacion() == null) return -1;
            return d1.getFechaActualizacion().compareTo(d2.getFechaActualizacion());
        });
        
        // Buscar el punto donde empiezan los reconteos
        // (cuando hay un salto significativo en las fechas o cuando se repite un conteo)
        LocalDateTime fechaInicioReconteo = null;
        
        for (int i = 1; i < todosLosDetalles.size(); i++) {
            DetalleConteo anterior = todosLosDetalles.get(i - 1);
            DetalleConteo actual = todosLosDetalles.get(i);
            
            // Si es el mismo producto y hay una diferencia significativa en el tiempo (más de 30 minutos)
            if (anterior.getProducto().getId().equals(actual.getProducto().getId()) &&
                anterior.getFechaActualizacion() != null && actual.getFechaActualizacion() != null) {
                
                long minutosDiferencia = java.time.Duration.between(
                    anterior.getFechaActualizacion(), 
                    actual.getFechaActualizacion()
                ).toMinutes();
                
                if (minutosDiferencia > 30) { // Salto significativo de tiempo
                    fechaInicioReconteo = actual.getFechaActualizacion();
                    System.out.println("✅ Fecha de reconteo determinada por salto temporal: " + fechaInicioReconteo);
                    break;
                }
            }
        }
        
        if (fechaInicioReconteo == null) {
            // Si no encontramos un salto temporal, usar la fecha del primer detalle más reciente
            fechaInicioReconteo = todosLosDetalles.get(todosLosDetalles.size() - 1).getFechaActualizacion();
            System.out.println("✅ Fecha de reconteo determinada por último detalle: " + fechaInicioReconteo);
        }
        
        return fechaInicioReconteo;
    }

    /**
     * Reemplazar conteos iniciales con reconteos cuando ambos usuarios han recontado
     * CORREGIDO: Manejo más robusto de fechas y consolidación
     */
    private void reemplazarConteosInicialesConReconteos(ConteoSector conteoSector) {
        System.out.println("🔄 RECONTEO: Iniciando reemplazo de conteos iniciales con reconteos...");
        
        // Obtener fecha de inicio del reconteo actual con manejo mejorado
        LocalDateTime fechaInicioReconteo = null;
        if (conteoSector.getObservaciones() != null && conteoSector.getObservaciones().contains("_")) {
            try {
                String fechaStr = conteoSector.getObservaciones().split("_")[1];
                fechaInicioReconteo = LocalDateTime.parse(fechaStr);
                System.out.println("✅ Fecha de reconteo parseada correctamente: " + fechaInicioReconteo);
            } catch (Exception e) {
                System.out.println("⚠️ No se pudo parsear fecha de reconteo: " + conteoSector.getObservaciones());
                // CORRECCIÓN: En lugar de retornar, intentar determinar la fecha de otra manera
                fechaInicioReconteo = determinarFechaInicioReconteoAlternativa(conteoSector);
            }
        }
        
        if (fechaInicioReconteo == null) {
            System.out.println("⚠️ No se pudo determinar fecha de inicio del reconteo, usando fecha actual");
            fechaInicioReconteo = LocalDateTime.now().minusHours(1); // Usar 1 hora atrás como fallback
        }
        
        // Obtener todos los detalles del sector
        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        // Agrupar por producto
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : todosLosDetalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Para cada producto, reemplazar conteos iniciales con reconteos
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Separar conteos iniciales de reconteos
            List<DetalleConteo> conteosIniciales = new ArrayList<>();
            List<DetalleConteo> reconteos = new ArrayList<>();
            
            for (DetalleConteo detalle : detallesDelProducto) {
                if (detalle.getFechaActualizacion().isBefore(fechaInicioReconteo)) {
                    conteosIniciales.add(detalle);
                } else {
                    reconteos.add(detalle);
                }
            }
            
            // Si hay reconteos, reemplazar los conteos iniciales
            if (!reconteos.isEmpty()) {
                System.out.println("🔄 RECONTEO: Reemplazando conteos del producto ID: " + productoId);
                
                // Encontrar el detalle base (primer detalle del producto)
                DetalleConteo detalleBase = detallesDelProducto.get(0);
                
                // CORRECCIÓN: Consolidar reconteos de manera más robusta
                // Buscar el reconteo más reciente de cada usuario
                DetalleConteo reconteoMasRecienteUsuario1 = null;
                DetalleConteo reconteoMasRecienteUsuario2 = null;
                
                for (DetalleConteo reconteo : reconteos) {
                    // Para usuario 1
                    if (reconteo.getCantidadConteo1() != null && reconteo.getCantidadConteo1() > 0) {
                        if (reconteoMasRecienteUsuario1 == null || 
                            (reconteo.getFechaActualizacion() != null && 
                             reconteoMasRecienteUsuario1.getFechaActualizacion() != null &&
                             reconteo.getFechaActualizacion().isAfter(reconteoMasRecienteUsuario1.getFechaActualizacion()))) {
                            reconteoMasRecienteUsuario1 = reconteo;
                        }
                    }
                    
                    // Para usuario 2
                    if (reconteo.getCantidadConteo2() != null && reconteo.getCantidadConteo2() > 0) {
                        if (reconteoMasRecienteUsuario2 == null || 
                            (reconteo.getFechaActualizacion() != null && 
                             reconteoMasRecienteUsuario2.getFechaActualizacion() != null &&
                             reconteo.getFechaActualizacion().isAfter(reconteoMasRecienteUsuario2.getFechaActualizacion()))) {
                            reconteoMasRecienteUsuario2 = reconteo;
                        }
                    }
                }
                
                // Reemplazar en el detalle base con los reconteos más recientes
                if (reconteoMasRecienteUsuario1 != null) {
                    detalleBase.setCantidadConteo1(reconteoMasRecienteUsuario1.getCantidadConteo1());
                    detalleBase.setFormulaCalculo1(reconteoMasRecienteUsuario1.getFormulaCalculo1());
                    System.out.println("  - Usuario1: " + reconteoMasRecienteUsuario1.getCantidadConteo1() + 
                                     " (" + reconteoMasRecienteUsuario1.getFormulaCalculo1() + ")");
                }
                
                if (reconteoMasRecienteUsuario2 != null) {
                    detalleBase.setCantidadConteo2(reconteoMasRecienteUsuario2.getCantidadConteo2());
                    detalleBase.setFormulaCalculo2(reconteoMasRecienteUsuario2.getFormulaCalculo2());
                    System.out.println("  - Usuario2: " + reconteoMasRecienteUsuario2.getCantidadConteo2() + 
                                     " (" + reconteoMasRecienteUsuario2.getFormulaCalculo2() + ")");
                }
                
                // Eliminar los conteos iniciales (mantener solo el detalle base con los reconteos)
                for (DetalleConteo conteoInicial : conteosIniciales) {
                    if (!conteoInicial.getId().equals(detalleBase.getId())) {
                        detalleConteoRepository.delete(conteoInicial);
                        System.out.println("  - Eliminado conteo inicial ID: " + conteoInicial.getId());
                    }
                }
                
                // CORRECCIÓN: Eliminar solo los registros de reconteo que no son los más recientes
                for (DetalleConteo reconteo : reconteos) {
                    if (!reconteo.getId().equals(detalleBase.getId()) &&
                        !reconteo.getId().equals(reconteoMasRecienteUsuario1 != null ? reconteoMasRecienteUsuario1.getId() : null) &&
                        !reconteo.getId().equals(reconteoMasRecienteUsuario2 != null ? reconteoMasRecienteUsuario2.getId() : null)) {
                        detalleConteoRepository.delete(reconteo);
                        System.out.println("  - Eliminado reconteo duplicado ID: " + reconteo.getId());
                    }
                }
                
                // Guardar el detalle base actualizado
                detalleConteoRepository.save(detalleBase);
                System.out.println("  - Guardado detalle base ID: " + detalleBase.getId() + " con reconteos consolidados");
            }
        }
        
        System.out.println("✅ RECONTEO: Reemplazo completado - conteos iniciales reemplazados con reconteos");
    }

    /**
     * Calcular el progreso real de un conteo de sector
     */
    public void calcularProgresoReal(ConteoSector conteoSector) {
        System.out.println("📊 Calculando progreso real para sector: " + conteoSector.getId());
        System.out.println("📊 STACK TRACE - Llamada desde: " + Thread.currentThread().getStackTrace()[2].getMethodName());
        
        // Obtener todos los detalles de conteo para este sector
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("📊 DEBUG - Detalles encontrados (SIN eliminados): " + detalles.size());
        
        // Contar productos únicos que aparecen en DetalleConteo (estos son los productos que se están contando)
        Set<Long> productosUnicos = new HashSet<>();
        Set<Long> productosContados = new HashSet<>();
        int productosConDiferencias = 0;
        
        // Agrupar por producto para calcular totales consolidados
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            productosUnicos.add(productoId);
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // ✅ NUEVA LÓGICA: Detectar si estamos en reconteo
        boolean estaEnReconteo = conteoSector.getObservaciones() != null && 
                                conteoSector.getObservaciones().startsWith("Reconteo");
        
        System.out.println("🔍 [PROGRESO] ¿Está en reconteo? " + estaEnReconteo);
        if (estaEnReconteo) {
            System.out.println("🔍 [PROGRESO] Observaciones del sector: " + conteoSector.getObservaciones());
        }
        
        // Calcular totales consolidados y detectar diferencias por producto
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Sumar todas las cantidades de cada usuario para este producto
            int totalUsuario1 = 0;
            int totalUsuario2 = 0;
            boolean usuario1Conto = false;
            boolean usuario2Conto = false;
            
            if (estaEnReconteo) {
                // ✅ EN RECONTEO: Solo usar los valores de reconteo (no del conteo inicial)
                // Filtrar solo los detalles de reconteo (excluir los del conteo inicial)
                List<DetalleConteo> detallesReconteo = new ArrayList<>();
                for (DetalleConteo detalle : detallesDelProducto) {
                    // Un detalle es de reconteo si:
                    // 1. Tiene valores de ambos usuarios Y
                    // 2. Ambos valores son mayores que 0 (no son del conteo inicial)
                    boolean tieneValoresAmbosUsuarios = detalle.getCantidadConteo1() != null && detalle.getCantidadConteo2() != null;
                    boolean ambosValoresPositivos = (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) && 
                                                   (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0);
                    
                    if (tieneValoresAmbosUsuarios && ambosValoresPositivos) {
                        detallesReconteo.add(detalle);
                        System.out.println("🔍 [PROGRESO] Detalle de reconteo encontrado - ID: " + detalle.getId() + 
                                         ", Usuario1: " + detalle.getCantidadConteo1() + 
                                         ", Usuario2: " + detalle.getCantidadConteo2());
                    } else {
                        System.out.println("🔍 [PROGRESO] Detalle de conteo inicial ignorado - ID: " + detalle.getId() + 
                                         ", Usuario1: " + detalle.getCantidadConteo1() + 
                                         ", Usuario2: " + detalle.getCantidadConteo2());
                    }
                }
                
                System.out.println("🔍 [PROGRESO] Producto " + productoId + " - Detalles de reconteo encontrados: " + detallesReconteo.size());
                
                if (!detallesReconteo.isEmpty()) {
                    // Ordenar por fecha de actualización descendente para obtener el más reciente
                    detallesReconteo.sort((d1, d2) -> {
                        if (d1.getFechaActualizacion() == null && d2.getFechaActualizacion() == null) return 0;
                        if (d1.getFechaActualizacion() == null) return 1;
                        if (d2.getFechaActualizacion() == null) return -1;
                        return d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion());
                    });
                    
                    // Tomar solo el primer detalle de reconteo (el más reciente)
                    DetalleConteo detalleReconteo = detallesReconteo.get(0);
                    System.out.println("🔍 [PROGRESO] Producto " + productoId + " - Usando detalle de reconteo ID: " + detalleReconteo.getId() + 
                                     ", Fecha: " + detalleReconteo.getFechaActualizacion() + 
                                     ", Usuario1: " + detalleReconteo.getCantidadConteo1() + 
                                     ", Usuario2: " + detalleReconteo.getCantidadConteo2());
                    
                    // ✅ CORRECCIÓN: Solo usar valores si ambos usuarios tienen valores válidos en el mismo detalle
                    if (detalleReconteo.getCantidadConteo1() != null && detalleReconteo.getCantidadConteo1() > 0 &&
                        detalleReconteo.getCantidadConteo2() != null && detalleReconteo.getCantidadConteo2() > 0) {
                        
                        totalUsuario1 = detalleReconteo.getCantidadConteo1();
                        totalUsuario2 = detalleReconteo.getCantidadConteo2();
                        usuario1Conto = true;
                        usuario2Conto = true;
                        
                        System.out.println("✅ [PROGRESO] Valores de reconteo válidos - Usuario1: " + totalUsuario1 + ", Usuario2: " + totalUsuario2);
                    } else {
                        System.out.println("⚠️ [PROGRESO] Detalle de reconteo no tiene valores válidos de ambos usuarios");
                    }
                } else {
                    System.out.println("⚠️ [PROGRESO] Producto " + productoId + " - No se encontraron detalles de reconteo");
                }
            } else {
                // ✅ CONTEO NORMAL: Sumar todas las cantidades
            for (DetalleConteo detalle : detallesDelProducto) {
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    totalUsuario1 += detalle.getCantidadConteo1();
                    usuario1Conto = true;
                }
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    totalUsuario2 += detalle.getCantidadConteo2();
                    usuario2Conto = true;
                    }
                }
            }
            
            if (usuario1Conto || usuario2Conto) {
                productosContados.add(productoId);
                
                // Verificar si hay diferencias entre usuarios usando totales consolidados
                if (usuario1Conto && usuario2Conto) {
                    if (totalUsuario1 != totalUsuario2) {
                        productosConDiferencias++;
                        System.out.println("🔍 DIFERENCIA detectada en producto " + productoId + 
                                         ": Usuario1=" + totalUsuario1 + ", Usuario2=" + totalUsuario2);
                    }
                }
            }
        }
        
        int totalProductos = productosUnicos.size(); // Total basado en productos únicos en DetalleConteo
        
        // Calcular porcentaje
        double porcentaje = 0.0;
        if (totalProductos > 0) {
            porcentaje = (productosContados.size() * 100.0) / totalProductos;
        }
        
        // Actualizar los valores
        conteoSector.setTotalProductos(totalProductos);
        conteoSector.setProductosContados(productosContados.size());
        conteoSector.setProductosConDiferencias(productosConDiferencias);
        conteoSector.setPorcentajeCompletado(porcentaje);
        
        // ✅ NUEVA LÓGICA: Verificar si ya no hay diferencias y completar automáticamente
        // ⚠️ IMPORTANTE: Solo ejecutar si NO estamos en medio de un reconteo
        // (ya tenemos la variable estaEnReconteo definida arriba)
        
        // ✅ NO CAMBIAR ESTADO si ya está ESPERANDO_VERIFICACION (pero SÍ si está COMPLETADO en reconteo)
        boolean estadoEsperandoVerificacion = conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION;
        
        // ✅ CORREGIDO: Solo completar automáticamente en casos muy específicos
        // 1. Durante reconteo cuando no hay diferencias y ambos usuarios ya recontaron
        // 2. NO completar automáticamente durante el conteo normal inicial
        // ✅ CRÍTICO: Removido !estadoEsperandoVerificacion para permitir completar automáticamente durante reconteo
        // cuando ambos usuarios ya recontaron (cuando el segundo termina)
        if (estaEnReconteo && 
            productosConDiferencias == 0 && 
            productosContados.size() == totalProductos &&
            !estadoEsperandoVerificacion) {
            
            // 🔍 VERIFICACIÓN CORREGIDA: Usar el método correcto para verificar diferencias en cantidades
            boolean hayDiferenciasEnCantidades = verificarDiferenciasEnConteo(conteoSector);
            
            if (!hayDiferenciasEnCantidades) {
                System.out.println("🎉 ¡Reconteo completado sin diferencias! Completando automáticamente el sector: " + conteoSector.getId());
                
                // Cambiar estado a COMPLETADO
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                conteoSector.setFechaFinalizacion(LocalDateTime.now());
                
                // Limpiar observaciones de reconteo
                if (conteoSector.getObservaciones() != null && 
                    conteoSector.getObservaciones().startsWith("Reconteo")) {
                    conteoSector.setObservaciones("Reconteo completado automáticamente - Sin diferencias");
                }
                
                System.out.println("✅ Sector completado automáticamente - Estado: " + conteoSector.getEstado());
                
                // ✅ GUARDAR EL CAMBIO EN LA BASE DE DATOS
                conteoSectorRepository.save(conteoSector);
                System.out.println("✅ Cambio guardado en la base de datos");
                
                // ✅ ACTUALIZAR PROGRESO DEL INVENTARIO COMPLETO
                System.out.println("🔄 Actualizando progreso del inventario completo después de completar sector automáticamente...");
                try {
                    verificarYFinalizarInventarioCompleto(conteoSector.getInventarioCompleto().getId());
                } catch (Exception e) {
                    System.err.println("⚠️ Error actualizando progreso del inventario: " + e.getMessage());
                    // No lanzar la excepción para no interrumpir el flujo principal
                }
            } else {
                System.out.println("⚠️ Hay diferencias en el reconteo, manteniendo estado CON_DIFERENCIAS");
            }
        } else if (estaEnReconteo) {
            System.out.println("⚠️ Sector en reconteo - Verificando si se puede completar automáticamente...");
        } else if (estadoEsperandoVerificacion) {
            System.out.println("⚠️ Estado esperando verificación (" + conteoSector.getEstado() + "), NO modificando estado automáticamente");
        }
        
        System.out.println("📊 Progreso calculado - Total productos únicos: " + totalProductos + 
                         ", Contados: " + productosContados.size() + 
                         ", Con diferencias: " + productosConDiferencias + 
                         ", Porcentaje: " + String.format("%.1f", porcentaje) + "%" +
                         ", Estado: " + conteoSector.getEstado());
    }

    /**
     * Determinar el estado específico de un usuario basándose en los DetalleConteo
     */
    @Transactional(readOnly = true)
    public ConteoSector.EstadoConteo determinarEstadoUsuario(ConteoSector conteoSector, Long usuarioId) {
        System.out.println("🔍 Determinando estado para usuario: " + usuarioId + " en sector: " + conteoSector.getId());
        System.out.println("🔍 Estado general del sector: " + conteoSector.getEstado());
        System.out.println("🔍 Observaciones del sector: " + conteoSector.getObservaciones());
        
        // Si el conteo está en estados finales, retornar el estado general
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO) {
            return conteoSector.getEstado();
        }
        
        // Si está en CON_DIFERENCIAS, verificar si es reconteo para determinar el estado específico del usuario
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS) {
            String observaciones = conteoSector.getObservaciones();
            boolean esReconteo = observaciones != null && observaciones.startsWith("Reconteo_");
            
            System.out.println("🔍 Estado CON_DIFERENCIAS - esReconteo: " + esReconteo);
            
            if (esReconteo) {
                // En reconteo, determinar qué usuario debe hacer reconteo
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
                System.out.println("🔍 Usuario " + usuarioId + " - esUsuario1: " + esUsuario1 + ", esUsuario2: " + esUsuario2);
                System.out.println("🔍 UsuarioAsignado1 ID: " + (conteoSector.getUsuarioAsignado1() != null ? conteoSector.getUsuarioAsignado1().getId() : "null"));
                System.out.println("🔍 UsuarioAsignado2 ID: " + (conteoSector.getUsuarioAsignado2() != null ? conteoSector.getUsuarioAsignado2().getId() : "null"));
            
                if (esUsuario1 || esUsuario2) {
                    // Verificar si este usuario ya finalizó el reconteo
                    boolean esElUsuarioQueFinalizo = false;
                    if (esUsuario1 && "Reconteo_Usuario1_Finalizado".equals(observaciones)) {
                esElUsuarioQueFinalizo = true;
                    } else if (esUsuario2 && "Reconteo_Usuario2_Finalizado".equals(observaciones)) {
                esElUsuarioQueFinalizo = true;
            }
            
            if (esElUsuarioQueFinalizo) {
                        System.out.println("⏳ Usuario " + usuarioId + " ya finalizó reconteo, esperando verificación");
                        return ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION;
            } else {
                        System.out.println("🔄 Usuario " + usuarioId + " debe hacer reconteo, estado: CON_DIFERENCIAS");
                return ConteoSector.EstadoConteo.CON_DIFERENCIAS;
                    }
                }
            }
            
            // Si no es reconteo o no es usuario asignado, retornar estado general
            return conteoSector.getEstado();
        }
        
        // Si está esperando verificación, determinar el estado específico del usuario
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("🔍 Estado ESPERANDO_VERIFICACION detectado");
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
            System.out.println("🔍 Usuario " + usuarioId + " - esUsuario1: " + esUsuario1 + ", esUsuario2: " + esUsuario2);
            System.out.println("🔍 UsuarioAsignado1 ID: " + (conteoSector.getUsuarioAsignado1() != null ? conteoSector.getUsuarioAsignado1().getId() : "null"));
            System.out.println("🔍 UsuarioAsignado2 ID: " + (conteoSector.getUsuarioAsignado2() != null ? conteoSector.getUsuarioAsignado2().getId() : "null"));
            System.out.println("🔍 Observaciones en ESPERANDO_VERIFICACION: " + conteoSector.getObservaciones());
            
            if (esUsuario1 || esUsuario2) {
                // Verificar qué usuario finalizó basándose en las observaciones
                String observaciones = conteoSector.getObservaciones();
                boolean esElUsuarioQueFinalizo = false;
                boolean esReconteo = false;
                
                System.out.println("🔍 Observaciones: " + observaciones);
                
                // Verificar si es reconteo o conteo inicial
                if (esUsuario1 && ("Usuario1_Finalizado".equals(observaciones) || "Reconteo_Usuario1_Finalizado".equals(observaciones))) {
                    esElUsuarioQueFinalizo = true;
                    esReconteo = observaciones.startsWith("Reconteo_");
                    System.out.println("🔍 Usuario1 finalizó - esReconteo: " + esReconteo);
                } else if (esUsuario2 && ("Usuario2_Finalizado".equals(observaciones) || "Reconteo_Usuario2_Finalizado".equals(observaciones))) {
                    esElUsuarioQueFinalizo = true;
                    esReconteo = observaciones.startsWith("Reconteo_");
                    System.out.println("🔍 Usuario2 finalizó - esReconteo: " + esReconteo);
                } else {
                    // Si no es el usuario que finalizó, determinar si es reconteo basándose en las observaciones
                    esReconteo = observaciones != null && observaciones.startsWith("Reconteo_");
                    System.out.println("🔍 Usuario no finalizó - esReconteo: " + esReconteo);
                }
                
                System.out.println("🔍 esElUsuarioQueFinalizo: " + esElUsuarioQueFinalizo + ", esReconteo: " + esReconteo);
                
                if (esElUsuarioQueFinalizo) {
                    // El usuario que finalizó está esperando verificación
                    System.out.println("⏳ Usuario " + usuarioId + " finalizó " + (esReconteo ? "reconteo" : "conteo") + ", esperando verificación");
                    return ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION;
                } else {
                    // El usuario que no ha finalizado
                    if (esReconteo) {
                        // En reconteo, el segundo usuario SIEMPRE debe ver CON_DIFERENCIAS para poder hacer reconteo
                        System.out.println("🔄 Usuario " + usuarioId + " debe hacer reconteo, estado: CON_DIFERENCIAS");
                        return ConteoSector.EstadoConteo.CON_DIFERENCIAS;
                    } else {
                        // Para conteo inicial, determinar si ha contado algo
                        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
                        boolean tieneProductosContados = false;
                        
                        for (DetalleConteo detalle : detalles) {
                            if (esUsuario1 && detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                                tieneProductosContados = true;
                                break;
                            }
                            if (esUsuario2 && detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                                tieneProductosContados = true;
                                break;
                            }
                        }
                        
                        if (tieneProductosContados) {
                            System.out.println("✅ Usuario " + usuarioId + " ha contado productos, estado: EN_PROGRESO");
                        return ConteoSector.EstadoConteo.EN_PROGRESO;
                        } else {
                            System.out.println("ℹ️ Usuario " + usuarioId + " no ha contado productos, estado: PENDIENTE");
                            return ConteoSector.EstadoConteo.PENDIENTE;
                        }
                    }
                }
            }
        }
        
        // Si el conteo está en progreso, determinar estado específico del usuario
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.EN_PROGRESO) {
            // Verificar si el usuario está asignado
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
            if (!esUsuario1 && !esUsuario2) {
                return conteoSector.getEstado();
            }
            
            // Obtener todos los detalles de conteo para este sector
            List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
            
            // Verificar si hay productos contados por este usuario específico
            boolean tieneProductosContados = false;
            
            for (DetalleConteo detalle : detalles) {
                if (esUsuario1 && detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    tieneProductosContados = true;
                    break;
                }
                if (esUsuario2 && detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    tieneProductosContados = true;
                    break;
                }
            }
            
            // Si el usuario tiene productos contados, está en progreso
            if (tieneProductosContados) {
                System.out.println("✅ Usuario " + usuarioId + " tiene productos contados, estado: EN_PROGRESO");
                return ConteoSector.EstadoConteo.EN_PROGRESO;
            } else {
                System.out.println("ℹ️ Usuario " + usuarioId + " no tiene productos contados, estado: PENDIENTE");
                return ConteoSector.EstadoConteo.PENDIENTE;
            }
        }
        
        // Si el estado general es PENDIENTE, verificar si el usuario específico ha contado productos
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.PENDIENTE) {
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
            if (esUsuario1 || esUsuario2) {
                // Obtener todos los detalles de conteo para este sector
                List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
                
                // Verificar si hay productos contados por este usuario específico
                boolean tieneProductosContados = false;
                
                for (DetalleConteo detalle : detalles) {
                    if (esUsuario1 && detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        tieneProductosContados = true;
                        break;
                    }
                    if (esUsuario2 && detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        tieneProductosContados = true;
                        break;
                    }
                }
                
                // Si el usuario tiene productos contados, está en progreso
                if (tieneProductosContados) {
                    System.out.println("✅ Usuario " + usuarioId + " tiene productos contados, estado: EN_PROGRESO");
                    return ConteoSector.EstadoConteo.EN_PROGRESO;
                } else {
                    System.out.println("ℹ️ Usuario " + usuarioId + " no tiene productos contados, estado: PENDIENTE");
                    return ConteoSector.EstadoConteo.PENDIENTE;
                }
            }
        }
        
        // Para otros estados, retornar el estado general
        return conteoSector.getEstado();
    }

    /**
     * Calcular diferencias para un detalle de conteo
     */
    private void calcularDiferencias(DetalleConteo detalle) {
        if (detalle == null) return;
        
        System.out.println("🔍 Calculando diferencias para detalle ID: " + detalle.getId());
        
        // Calcular diferencia entre conteos de usuarios
        Integer cantidad1 = detalle.getCantidadConteo1();
        Integer cantidad2 = detalle.getCantidadConteo2();
        
        if (cantidad1 != null && cantidad2 != null) {
            int diferencia = cantidad1 - cantidad2;
            detalle.setDiferenciaEntreConteos(diferencia);
            System.out.println("🔍 Diferencia entre conteos: " + cantidad1 + " - " + cantidad2 + " = " + diferencia);
        } else if (cantidad1 != null) {
            detalle.setDiferenciaEntreConteos(cantidad1);
            System.out.println("🔍 Solo usuario 1 contó: " + cantidad1);
        } else if (cantidad2 != null) {
            detalle.setDiferenciaEntreConteos(-cantidad2);
            System.out.println("🔍 Solo usuario 2 contó: " + cantidad2);
        } else {
            detalle.setDiferenciaEntreConteos(0);
            System.out.println("🔍 Ningún usuario contó");
        }
        
        // Calcular diferencia con sistema
        Integer stockSistema = detalle.getStockSistema();
        if (stockSistema != null) {
            Integer cantidadFinal = Math.max(
                cantidad1 != null ? cantidad1 : 0,
                cantidad2 != null ? cantidad2 : 0
            );
            int diferenciaSistema = stockSistema - cantidadFinal;
            detalle.setDiferenciaSistema(diferenciaSistema);
            System.out.println("🔍 Diferencia con sistema: " + stockSistema + " - " + cantidadFinal + " = " + diferenciaSistema);
        }
        
        // Calcular valor de diferencia (precio unitario * diferencia)
        if (detalle.getPrecioUnitario() != null && detalle.getDiferenciaEntreConteos() != null) {
            java.math.BigDecimal precioUnitario = detalle.getPrecioUnitario();
            java.math.BigDecimal diferencia = java.math.BigDecimal.valueOf(detalle.getDiferenciaEntreConteos());
            java.math.BigDecimal valorDiferencia = precioUnitario.multiply(diferencia);
            detalle.setValorDiferencia(valorDiferencia);
            System.out.println("🔍 Valor diferencia: " + precioUnitario + " * " + diferencia + " = " + valorDiferencia);
        }
        
        System.out.println("✅ Diferencias calculadas para detalle ID: " + detalle.getId());
    }

    /**
     * Verificar si ambos usuarios contaron exactamente los mismos productos
     */
    private boolean verificarAmbosUsuariosContaronMismosProductos(ConteoSector conteoSector) {
        System.out.println("🔍 Verificando si ambos usuarios contaron los mismos productos en sector: " + conteoSector.getId());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        // Obtener productos contados por cada usuario
        Set<Long> productosUsuario1 = new HashSet<>();
        Set<Long> productosUsuario2 = new HashSet<>();
        
        for (DetalleConteo detalle : detalles) {
            if (detalle.getProducto() == null) continue;
            
            Long productoId = detalle.getProducto().getId();
            
            // Verificar si el usuario 1 contó este producto
            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                productosUsuario1.add(productoId);
            }
            
            // Verificar si el usuario 2 contó este producto
            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                productosUsuario2.add(productoId);
            }
        }
        
        System.out.println("🔍 Productos contados por Usuario 1: " + productosUsuario1.size() + " productos");
        System.out.println("🔍 Productos contados por Usuario 2: " + productosUsuario2.size() + " productos");
        
        // Verificar si ambos usuarios contaron exactamente los mismos productos
        boolean mismosProductos = productosUsuario1.equals(productosUsuario2);
        
        if (mismosProductos) {
            System.out.println("✅ Ambos usuarios contaron exactamente los mismos productos");
        } else {
            System.out.println("⚠️ Los usuarios NO contaron los mismos productos:");
            System.out.println("  - Solo Usuario 1 contó: " + productosUsuario1.size() + " productos");
            System.out.println("  - Solo Usuario 2 contó: " + productosUsuario2.size() + " productos");
            
            // Mostrar productos únicos de cada usuario
            Set<Long> soloUsuario1 = new HashSet<>(productosUsuario1);
            soloUsuario1.removeAll(productosUsuario2);
            
            Set<Long> soloUsuario2 = new HashSet<>(productosUsuario2);
            soloUsuario2.removeAll(productosUsuario1);
            
            if (!soloUsuario1.isEmpty()) {
                System.out.println("  - Productos solo del Usuario 1: " + soloUsuario1);
            }
            if (!soloUsuario2.isEmpty()) {
                System.out.println("  - Productos solo del Usuario 2: " + soloUsuario2);
            }
        }
        
        return mismosProductos;
    }
    
    /**
     * Actualizar stock por sector para un producto
     */
    private void actualizarStockPorSector(Producto producto, Integer cantidadFinal) {
        try {
            System.out.println("🔄 === INICIANDO ACTUALIZACIÓN STOCK POR SECTOR ===");
            System.out.println("🔄 Producto: " + producto.getNombre() + " (ID: " + producto.getId() + ")");
            System.out.println("🔄 Cantidad final solicitada: " + cantidadFinal);
            System.out.println("🔄 Stock actual del producto: " + producto.getStock());
            
            // PASO 1: Obtener la distribución real del inventario por sectores
            Map<Long, Integer> distribucionPorSectores = obtenerDistribucionRealPorSectores(producto.getId());
            
            System.out.println("🔄 Distribución obtenida: " + distribucionPorSectores);
            
            if (distribucionPorSectores.isEmpty()) {
                System.out.println("⚠️ No se encontró distribución por sectores para producto: " + producto.getNombre());
                // Fallback: usar el sector principal
                actualizarStockSectorPrincipal(producto, cantidadFinal);
                return;
            }
            
            // PASO 2: Separar sectores contados de sectores sin conteo
            Map<Long, Integer> sectoresContados = new HashMap<>();
            Map<Long, Integer> sectoresSinConteo = new HashMap<>();
            
            // Obtener información de sectores del inventario para clasificar
            InventarioCompleto inventario = inventarioCompletoRepository.findById(this.inventarioActualId).orElse(null);
            if (inventario != null) {
                List<ConteoSector> todosLosSectores = conteoSectorRepository.findByInventarioCompleto(inventario);
                Map<Long, ConteoSector.EstadoConteo> estadosSectores = todosLosSectores.stream()
                    .collect(Collectors.toMap(
                        sector -> sector.getSector().getId(),
                        ConteoSector::getEstado
                    ));
                
                for (Map.Entry<Long, Integer> entry : distribucionPorSectores.entrySet()) {
                    Long sectorId = entry.getKey();
                    Integer cantidad = entry.getValue();
                    ConteoSector.EstadoConteo estado = estadosSectores.get(sectorId);
                    
                    if (estado == ConteoSector.EstadoConteo.COMPLETADO) {
                        sectoresContados.put(sectorId, cantidad);
                    } else if (estado == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO) {
                        sectoresSinConteo.put(sectorId, cantidad);
                    }
                }
            }
            
            System.out.println("🔍 Distribución original: " + distribucionPorSectores);
            System.out.println("🔍 Sectores contados: " + sectoresContados);
            System.out.println("🔍 Sectores sin conteo: " + sectoresSinConteo);
            System.out.println("🔍 Cantidad final solicitada: " + cantidadFinal);
            
            // PASO 3: Calcular distribución final
            // - Sectores contados: usar cantidades del inventario
            // - Sectores sin conteo: mantener stock original
            // - Si hay diferencia, ajustar solo en sectores contados
            Integer totalSectoresContados = sectoresContados.values().stream().mapToInt(Integer::intValue).sum();
            Integer totalSectoresSinConteo = sectoresSinConteo.values().stream().mapToInt(Integer::intValue).sum();
            Integer totalActual = totalSectoresContados + totalSectoresSinConteo;
            
            System.out.println("🔍 === ANÁLISIS DETALLADO ===");
            System.out.println("🔍 Producto: " + producto.getNombre());
            System.out.println("🔍 Cantidad final solicitada: " + cantidadFinal);
            System.out.println("🔍 Stock actual del producto: " + producto.getStock());
            System.out.println("🔍 Total sectores contados: " + totalSectoresContados);
            System.out.println("🔍 Total sectores sin conteo: " + totalSectoresSinConteo);
            System.out.println("🔍 Total actual (contados + sin conteo): " + totalActual);
            System.out.println("🔍 ¿Coinciden cantidad final y total actual? " + cantidadFinal.equals(totalActual));
            
            System.out.println("🔍 Total sectores contados: " + totalSectoresContados);
            System.out.println("🔍 Total sectores sin conteo: " + totalSectoresSinConteo);
            System.out.println("🔍 Total actual: " + totalActual);
            
            // CORRECCIÓN: La cantidad final debe incluir TODOS los sectores (contados + sin conteo)
            // La cantidad final que llega aquí solo incluye sectores contados, necesitamos sumar los sin conteo
            Integer cantidadFinalCompleta = cantidadFinal + totalSectoresSinConteo;
            
            System.out.println("🔍 === CÁLCULO DE AJUSTE CORREGIDO ===");
            System.out.println("🔍 Cantidad final solicitada (solo contados): " + cantidadFinal);
            System.out.println("🔍 Total sectores sin conteo: " + totalSectoresSinConteo);
            System.out.println("🔍 Total sectores contados: " + totalSectoresContados);
            System.out.println("🔍 Total actual (contados + sin conteo): " + totalActual);
            System.out.println("🔍 Cantidad final completa (contados + sin conteo): " + cantidadFinalCompleta);
            System.out.println("🔍 ¿Necesita ajuste? " + (!totalActual.equals(cantidadFinalCompleta)));
            
            // CORRECCIÓN: NO hacer ajustes proporcionales cuando hay sectores sin conteo
            // Cada sector debe mantener su cantidad original
            boolean necesitaAjuste = false;
            Integer cantidadFinalSectoresContados = totalSectoresContados;
            
            // Solo hacer ajuste si NO hay sectores sin conteo
            if (totalSectoresSinConteo == 0) {
                necesitaAjuste = !totalActual.equals(cantidadFinalCompleta);
                if (necesitaAjuste) {
                    Integer diferencia = cantidadFinalCompleta - totalActual;
                    cantidadFinalSectoresContados = totalSectoresContados + diferencia;
                    System.out.println("🔍 Diferencia a distribuir (solo sectores contados): " + diferencia);
                    System.out.println("🔍 Cantidad final para sectores contados: " + cantidadFinalSectoresContados);
                }
            } else {
                System.out.println("🔍 NO SE HACE AJUSTE - Hay sectores sin conteo, cada sector mantiene su cantidad original");
                System.out.println("🔍 Sectores contados mantienen: " + totalSectoresContados);
                System.out.println("🔍 Sectores sin conteo mantienen: " + totalSectoresSinConteo);
            }
            
            // PASO 4: Actualizar o crear registros con la distribución
            for (Map.Entry<Long, Integer> entry : distribucionPorSectores.entrySet()) {
                Long sectorId = entry.getKey();
                Integer cantidadOriginal = entry.getValue();
                
                // Calcular cantidad final para este sector
                Integer cantidadFinalSector;
                
                if (sectoresContados.containsKey(sectorId)) {
                    // Sector contado: mantener cantidad original cuando hay sectores sin conteo
                    System.out.println("🔍 === PROCESANDO SECTOR CONTADO ===");
                    System.out.println("🔍 Sector ID: " + sectorId);
                    System.out.println("🔍 Cantidad original: " + cantidadOriginal);
                    System.out.println("🔍 Total sectores contados: " + totalSectoresContados);
                    System.out.println("🔍 Total sectores sin conteo: " + totalSectoresSinConteo);
                    System.out.println("🔍 ¿Necesita ajuste? " + necesitaAjuste);
                    
                    if (necesitaAjuste && totalSectoresContados > 0) {
                        double factorAjuste = cantidadFinalSectoresContados.doubleValue() / totalSectoresContados.doubleValue();
                        cantidadFinalSector = (int) Math.round(cantidadOriginal * factorAjuste);
                        System.out.println("🔍 AJUSTE APLICADO - Factor: " + factorAjuste);
                        System.out.println("🔍 Cálculo: " + cantidadOriginal + " * " + factorAjuste + " = " + cantidadFinalSector);
                        System.out.println("🔍 Sector contado ajustado: " + sectorId + " - Original: " + cantidadOriginal + " -> Final: " + cantidadFinalSector);
                    } else {
                        cantidadFinalSector = cantidadOriginal;
                        System.out.println("🔍 SIN AJUSTE - Manteniendo cantidad original");
                        System.out.println("🔍 Sector contado sin ajuste: " + sectorId + " - Cantidad: " + cantidadFinalSector);
                    }
                } else if (sectoresSinConteo.containsKey(sectorId)) {
                    // Sector sin conteo: mantener cantidad original
                    cantidadFinalSector = cantidadOriginal;
                    System.out.println("🔍 Sector sin conteo mantenido: " + sectorId + " - Cantidad: " + cantidadFinalSector);
                } else {
                    // No debería pasar, pero por seguridad
                    cantidadFinalSector = cantidadOriginal;
                    System.out.println("⚠️ Sector no clasificado: " + sectorId + " - Cantidad: " + cantidadFinalSector);
                }
                
                // Solo procesar si la cantidad es mayor a 0
                if (cantidadFinalSector > 0) {
                    Sector sector = sectorRepository.findById(sectorId).orElse(null);
                    if (sector != null) {
                        // Buscar si ya existe un registro para este producto y sector
                        Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(producto.getId(), sectorId);
                        
                        if (stockExistente.isPresent()) {
                            // Actualizar el registro existente
                            StockPorSector stock = stockExistente.get();
                            stock.setCantidad(cantidadFinalSector);
                            stock.setFechaActualizacion(LocalDateTime.now());
                            stockPorSectorRepository.save(stock);
                            System.out.println("✅ Stock actualizado: " + producto.getNombre() + " en " + sector.getNombre() + " = " + cantidadFinalSector + " (original: " + cantidadOriginal + ")");
                        } else {
                            // Crear nuevo registro
                            StockPorSector nuevoStock = new StockPorSector(producto, sector, cantidadFinalSector);
                            stockPorSectorRepository.save(nuevoStock);
                            System.out.println("✅ Stock creado: " + producto.getNombre() + " en " + sector.getNombre() + " = " + cantidadFinalSector + " (original: " + cantidadOriginal + ")");
                        }
                    }
                }
            }
            
            // PASO 5: Eliminar registros de sectores que no están en la distribución
            List<StockPorSector> todosLosStocks = stockPorSectorRepository.findByProductoId(producto.getId());
            System.out.println("🔍 === VERIFICANDO STOCKS EXISTENTES ===");
            System.out.println("🔍 Total stocks existentes para " + producto.getNombre() + ": " + todosLosStocks.size());
            for (StockPorSector stock : todosLosStocks) {
                System.out.println("🔍 Stock existente: " + producto.getNombre() + " en " + stock.getSector().getNombre() + " = " + stock.getCantidad());
            }
            System.out.println("🔍 Distribución a mantener: " + distribucionPorSectores);
            
            for (StockPorSector stock : todosLosStocks) {
                Long sectorId = stock.getSector().getId();
                if (!distribucionPorSectores.containsKey(sectorId)) {
                    // Este sector no está en la distribución, eliminar el registro
                    stockPorSectorRepository.delete(stock);
                    System.out.println("🗑️ Stock eliminado: " + producto.getNombre() + " en " + stock.getSector().getNombre() + " (no está en distribución)");
                } else {
                    System.out.println("✅ Stock mantenido: " + producto.getNombre() + " en " + stock.getSector().getNombre() + " = " + stock.getCantidad());
                }
            }
            
                // PASO 5: SINCRONIZAR: Actualizar el stock total del producto
                if (!producto.getStock().equals(cantidadFinalCompleta)) {
                    producto.setStock(cantidadFinalCompleta);
                    productoRepository.save(producto);
                    System.out.println("🔄 Stock del producto sincronizado: " + producto.getNombre() + " = " + cantidadFinalCompleta);
                }
            
            // PASO 6: VERIFICACIÓN FINAL - Mostrar el estado final
            System.out.println("🔄 === VERIFICACIÓN FINAL ===");
            List<StockPorSector> stockFinal = stockPorSectorRepository.findByProductoId(producto.getId());
            for (StockPorSector stock : stockFinal) {
                System.out.println("🔄 Stock final - Producto: " + producto.getNombre() + 
                                 " - Sector: " + stock.getSector().getNombre() + 
                                 " - Cantidad: " + stock.getCantidad());
            }
            System.out.println("🔄 === FIN ACTUALIZACIÓN STOCK POR SECTOR ===");
            
        } catch (Exception e) {
            System.err.println("❌ Error actualizando stock por sector para producto " + producto.getNombre() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Obtener la distribución real por sectores basada en el inventario realizado
     */
    private Map<Long, Integer> obtenerDistribucionRealPorSectores(Long productoId) {
        Map<Long, Integer> distribucion = new HashMap<>();
        
        try {
            Producto producto = productoRepository.findById(productoId).orElse(null);
            if (producto == null) {
                System.out.println("⚠️ Producto no encontrado con ID: " + productoId);
                return distribucion;
            }
            
            System.out.println("🔍 === OBTENIENDO DISTRIBUCIÓN PARA PRODUCTO: " + producto.getNombre() + " ===");
            
            // PASO 1: Obtener todos los sectores del inventario actual
            InventarioCompleto inventario = inventarioCompletoRepository.findById(this.inventarioActualId).orElse(null);
            if (inventario == null) {
                System.out.println("⚠️ Inventario no encontrado con ID: " + this.inventarioActualId);
                return distribucion;
            }
            
            List<ConteoSector> todosLosSectores = conteoSectorRepository.findByInventarioCompleto(inventario);
            System.out.println("🔍 Total de sectores en el inventario: " + todosLosSectores.size());
            
            // PASO 2: Procesar cada sector del inventario
            for (ConteoSector conteoSector : todosLosSectores) {
                // Solo procesar sectores completados
                if (conteoSector.getEstado() != ConteoSector.EstadoConteo.COMPLETADO && 
                    conteoSector.getEstado() != ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO) {
                    System.out.println("  ⏭️ Saltando sector " + conteoSector.getSector().getNombre() + " - Estado: " + conteoSector.getEstado());
                    continue;
                }
                
                Long sectorId = conteoSector.getSector().getId();
                Integer cantidadSector = 0;
                
                if (conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO) {
                    // PASO 2A: Sector contado - buscar en DetalleConteo
                    List<DetalleConteo> detallesDelProducto = detalleConteoRepository.findByConteoSectorAndProductoAndEliminadoFalse(conteoSector, producto);
                    
                    if (!detallesDelProducto.isEmpty()) {
                        // Consolidar cantidades de múltiples conteos del mismo producto
                        int totalConteo1 = 0;
                        int totalConteo2 = 0;
                        
                        for (DetalleConteo detalle : detallesDelProducto) {
                            if (detalle.getCantidadConteo1() != null) {
                                totalConteo1 += detalle.getCantidadConteo1();
                            }
                            if (detalle.getCantidadConteo2() != null) {
                                totalConteo2 += detalle.getCantidadConteo2();
                            }
                        }
                        
                        cantidadSector = Math.max(totalConteo1, totalConteo2);
                        
                        System.out.println("  🔍 SECTOR CONTADO - Producto: " + producto.getNombre() + 
                                         " - Sector: " + conteoSector.getSector().getNombre() + 
                                         " - Total Conteo1: " + totalConteo1 + 
                                         " - Total Conteo2: " + totalConteo2 + 
                                         " - Cantidad final: " + cantidadSector);
                    } else {
                        System.out.println("  ⚠️ SECTOR CONTADO SIN DETALLES - Producto: " + producto.getNombre() + 
                                         " - Sector: " + conteoSector.getSector().getNombre());
                    }
                } else {
                    // PASO 2B: Sector completado sin conteo - buscar en StockPorSector
                    Optional<StockPorSector> stockActual = stockPorSectorRepository.findByProductoIdAndSectorId(producto.getId(), sectorId);
                    cantidadSector = stockActual.map(StockPorSector::getCantidad).orElse(0);
                    
                    System.out.println("  🔍 SECTOR SIN CONTEO - Producto: " + producto.getNombre() + 
                                     " - Sector: " + conteoSector.getSector().getNombre() + 
                                     " - Stock actual mantenido: " + cantidadSector);
                }
                
                // PASO 3: Agregar a la distribución si hay cantidad
                if (cantidadSector > 0) {
                    distribucion.put(sectorId, cantidadSector);
                    System.out.println("  ✅ Agregado a distribución - Sector: " + conteoSector.getSector().getNombre() + 
                                     " (ID: " + sectorId + "): " + cantidadSector);
                } else {
                    System.out.println("  ⚠️ Sin cantidad - Sector: " + conteoSector.getSector().getNombre() + 
                                     " (ID: " + sectorId + "): " + cantidadSector);
                }
            }
            
            System.out.println("🔍 === DISTRIBUCIÓN FINAL PARA " + producto.getNombre() + " ===");
            for (Map.Entry<Long, Integer> entry : distribucion.entrySet()) {
                Long sectorId = entry.getKey();
                Integer cantidad = entry.getValue();
                Sector sector = sectorRepository.findById(sectorId).orElse(null);
                String nombreSector = sector != null ? sector.getNombre() : "Sector ID " + sectorId;
                System.out.println("  📊 " + nombreSector + ": " + cantidad);
            }
            System.out.println("🔍 === FIN DISTRIBUCIÓN ===");
            
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo distribución por sectores: " + e.getMessage());
            e.printStackTrace();
        }
        
        return distribucion;
    }
    
    /**
     * Fallback: actualizar solo el sector principal cuando no hay distribución disponible
     */
    private void actualizarStockSectorPrincipal(Producto producto, Integer cantidadFinal) {
        Sector sector = sectorRepository.findByNombreAndEmpresaId(producto.getSectorAlmacenamiento(), producto.getEmpresa().getId())
            .orElse(null);
        
        if (sector == null) {
            System.out.println("⚠️ No se encontró sector principal para producto: " + producto.getNombre());
            return;
        }
        
        // Buscar si ya existe un registro de stock por sector para este producto y sector
        Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(producto.getId(), sector.getId());
        
        if (stockExistente.isPresent()) {
            // Actualizar el stock existente
            StockPorSector stock = stockExistente.get();
            stock.setCantidad(cantidadFinal);
            stock.setFechaActualizacion(LocalDateTime.now());
            stockPorSectorRepository.save(stock);
            System.out.println("✅ Stock por sector actualizado (fallback): " + producto.getNombre() + " en " + sector.getNombre() + " = " + cantidadFinal);
        } else {
            // Crear nuevo registro de stock por sector
            StockPorSector nuevoStock = new StockPorSector(producto, sector, cantidadFinal);
            stockPorSectorRepository.save(nuevoStock);
            System.out.println("✅ Nuevo stock por sector creado (fallback): " + producto.getNombre() + " en " + sector.getNombre() + " = " + cantidadFinal);
        }
        
        // SINCRONIZAR: Actualizar el stock total del producto
        if (!producto.getStock().equals(cantidadFinal)) {
            producto.setStock(cantidadFinal);
            productoRepository.save(producto);
            System.out.println("🔄 Stock del producto sincronizado (fallback): " + producto.getNombre() + " = " + cantidadFinal);
        }
    }
    
    /**
     * Sincroniza el stock de todos los productos después de completar el inventario
     */
    private void sincronizarStockCompleto(Long empresaId) {
        try {
            System.out.println("🔄 SINCRONIZACIÓN AUTOMÁTICA - Iniciando sincronización masiva para empresa: " + empresaId);
            
            // Obtener todos los productos de la empresa
            List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
            int productosSincronizados = 0;
            int productosConInconsistencias = 0;
            
            for (Producto producto : productos) {
                try {
                    // Obtener stock actual en sectores
                    List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoId(producto.getId());
                    Integer stockTotalEnSectores = stockEnSectores.stream()
                            .mapToInt(StockPorSector::getCantidad)
                            .sum();
                    
                    Integer diferencia = producto.getStock() - stockTotalEnSectores;
                    
                    if (diferencia != 0) {
                        productosConInconsistencias++;
                        
                        // Sincronizar el stock - actualizar stock_por_sector con el valor del producto
                        if (!stockEnSectores.isEmpty()) {
                            // Si hay sectores, actualizar el primer sector (o el sector principal)
                            StockPorSector sectorPrincipal = stockEnSectores.get(0);
                            sectorPrincipal.setCantidad(producto.getStock());
                            sectorPrincipal.setFechaActualizacion(LocalDateTime.now());
                            stockPorSectorRepository.save(sectorPrincipal);
                        } else {
                            // Si no hay sectores, crear uno con el sector de almacenamiento del producto
                            if (producto.getSectorAlmacenamiento() != null && !producto.getSectorAlmacenamiento().trim().isEmpty()) {
                                Sector sector = sectorRepository.findByNombreAndEmpresaId(producto.getSectorAlmacenamiento(), empresaId).orElse(null);
                                if (sector != null) {
                                    StockPorSector nuevoStock = new StockPorSector(producto, sector, producto.getStock());
                                    stockPorSectorRepository.save(nuevoStock);
                                }
                            }
                        }
                        
                        productosSincronizados++;
                        System.out.println("✅ Stock sincronizado: " + producto.getNombre() + " - Diferencia: " + diferencia);
                    }
                } catch (Exception e) {
                    System.err.println("❌ Error sincronizando producto " + producto.getNombre() + ": " + e.getMessage());
                }
            }
            
            System.out.println("🔄 SINCRONIZACIÓN AUTOMÁTICA - Completada:");
            System.out.println("  - Total productos: " + productos.size());
            System.out.println("  - Productos con inconsistencias: " + productosConInconsistencias);
            System.out.println("  - Productos sincronizados: " + productosSincronizados);
            
        } catch (Exception e) {
            System.err.println("❌ Error en sincronización automática: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Marcar un sector como completado sin conteo
     */
    public void marcarSectorCompletadoSinConteo(Long inventarioId, Long sectorId, String sectorNombre, Usuario usuario) {
        try {
            System.out.println("🔄 === MARCAR SECTOR COMPLETADO SIN CONTEO ===");
            System.out.println("🔍 Inventario ID: " + inventarioId);
            System.out.println("🔍 Sector ID: " + sectorId);
            System.out.println("🔍 Sector Nombre: " + sectorNombre);
            
            // Obtener el inventario completo
            InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
            
            // Obtener el sector
            Sector sector = sectorRepository.findById(sectorId)
                .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
            
            // Verificar si ya existe un conteo para este sector
            Optional<ConteoSector> conteoExistente = conteoSectorRepository.findByInventarioCompletoAndSector(inventario, sector);
            
            if (conteoExistente.isPresent()) {
                // Si ya existe, actualizar el estado
                ConteoSector conteo = conteoExistente.get();
                conteo.setEstado(ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO);
                conteo.setFechaFinalizacion(LocalDateTime.now());
                conteo.setObservaciones("Sector marcado como completado sin conteo por " + usuario.getNombre() + " " + usuario.getApellidos());
                conteoSectorRepository.save(conteo);
                
                System.out.println("✅ Conteo existente actualizado a COMPLETADO_SIN_CONTEO");
                System.out.println("🔍 DEBUG - Estado guardado: " + conteo.getEstado());
                System.out.println("🔍 DEBUG - Sector ID: " + conteo.getSector().getId());
                System.out.println("🔍 DEBUG - Sector Nombre: " + conteo.getSector().getNombre());
            } else {
                // Si no existe, crear un nuevo conteo marcado como completado sin conteo
                ConteoSector nuevoConteo = new ConteoSector();
                nuevoConteo.setInventarioCompleto(inventario);
                nuevoConteo.setSector(sector);
                nuevoConteo.setEstado(ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO);
                nuevoConteo.setFechaCreacion(LocalDateTime.now());
                nuevoConteo.setFechaFinalizacion(LocalDateTime.now());
                nuevoConteo.setObservaciones("Sector marcado como completado sin conteo por " + usuario.getNombre() + " " + usuario.getApellidos());
                nuevoConteo.setTotalProductos(0);
                nuevoConteo.setProductosContados(0);
                nuevoConteo.setProductosConDiferencias(0);
                nuevoConteo.setPorcentajeCompletado(100.0);
                
                conteoSectorRepository.save(nuevoConteo);
                
                System.out.println("✅ Nuevo conteo creado como COMPLETADO_SIN_CONTEO");
                System.out.println("🔍 DEBUG - Estado guardado: " + nuevoConteo.getEstado());
                System.out.println("🔍 DEBUG - Sector ID: " + nuevoConteo.getSector().getId());
                System.out.println("🔍 DEBUG - Sector Nombre: " + nuevoConteo.getSector().getNombre());
            }
            
            // PASO CRÍTICO: Preservar el stock original de todos los productos en este sector
            System.out.println("🔄 === PRESERVANDO STOCK ORIGINAL DEL SECTOR ===");
            List<Producto> productosEmpresa = productoRepository.findByEmpresaId(inventario.getEmpresa().getId());
            int productosPreservados = 0;
            
            for (Producto producto : productosEmpresa) {
                // Verificar si el producto tiene stock en este sector
                Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(producto.getId(), sectorId);
                
                if (stockExistente.isPresent()) {
                    // El producto ya tiene stock en este sector, mantenerlo
                    StockPorSector stock = stockExistente.get();
                    System.out.println("✅ Stock preservado: " + producto.getNombre() + " en " + sector.getNombre() + " = " + stock.getCantidad());
                    productosPreservados++;
                } else {
                    // El producto no tiene stock en este sector, pero podría tenerlo según su sector de almacenamiento
                    if (producto.getSectorAlmacenamiento() != null && producto.getSectorAlmacenamiento().equals(sector.getNombre())) {
                        // Crear registro de stock para preservar el stock original
                        StockPorSector nuevoStock = new StockPorSector(producto, sector, producto.getStock());
                        stockPorSectorRepository.save(nuevoStock);
                        System.out.println("✅ Stock creado para preservar: " + producto.getNombre() + " en " + sector.getNombre() + " = " + producto.getStock());
                        productosPreservados++;
                    }
                }
            }
            
            System.out.println("🔄 === STOCK PRESERVADO ===");
            System.out.println("  - Total productos en empresa: " + productosEmpresa.size());
            System.out.println("  - Productos con stock preservado: " + productosPreservados);
            
            // Actualizar el progreso del inventario completo
            System.out.println("🔄 === ANTES DE LLAMAR A verificarYFinalizarInventarioCompleto ===");
            System.out.println("🔄 Inventario ID: " + inventario.getId());
            System.out.println("🔄 Estado actual del inventario: " + inventario.getEstado());
            System.out.println("🔄 Sectores completados actual: " + inventario.getSectoresCompletados());
            System.out.println("🔄 Total sectores actual: " + inventario.getTotalSectores());
            
            boolean finalizado = verificarYFinalizarInventarioCompleto(inventario.getId());
            System.out.println("🔄 Resultado de verificarYFinalizarInventarioCompleto: " + finalizado);
            
            // Recargar el inventario para obtener los datos actualizados
            inventario = inventarioCompletoRepository.findById(inventarioId).orElse(null);
            if (inventario != null) {
                System.out.println("🔍 Estado final del inventario:");
                System.out.println("  - ID: " + inventario.getId());
                System.out.println("  - Estado: " + inventario.getEstado());
                System.out.println("  - Sectores completados: " + inventario.getSectoresCompletados());
                System.out.println("  - Total sectores: " + inventario.getTotalSectores());
                System.out.println("  - Porcentaje completado: " + inventario.getPorcentajeCompletado());
                System.out.println("  - Finalizado: " + finalizado);
            }
            
            System.out.println("✅ Sector marcado como completado sin conteo exitosamente");
            
        } catch (Exception e) {
            System.err.println("❌ Error marcando sector como completado sin conteo: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Cancelar un sector completado sin conteo (volver a estado pendiente)
     */
    public void cancelarSectorCompletadoSinConteo(Long inventarioId, Long sectorId, String sectorNombre, Usuario usuario) {
        try {
            System.out.println("🔄 === CANCELAR SECTOR COMPLETADO SIN CONTEO ===");
            System.out.println("🔍 Inventario ID: " + inventarioId);
            System.out.println("🔍 Sector ID: " + sectorId);
            System.out.println("🔍 Sector Nombre: " + sectorNombre);
            
            // Obtener el inventario completo
            InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
            
            // Obtener el sector
            Sector sector = sectorRepository.findById(sectorId)
                .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
            
            // Verificar si existe un conteo para este sector
            Optional<ConteoSector> conteoExistente = conteoSectorRepository.findByInventarioCompletoAndSector(inventario, sector);
            
            if (conteoExistente.isPresent()) {
                ConteoSector conteo = conteoExistente.get();
                
                // Verificar que el sector esté en estado COMPLETADO_SIN_CONTEO
                if (conteo.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO) {
                    // Cambiar el estado a PENDIENTE
                    conteo.setEstado(ConteoSector.EstadoConteo.PENDIENTE);
                    conteo.setFechaFinalizacion(null); // Limpiar fecha de finalización
                    conteo.setObservaciones("Sector cancelado de completado sin conteo por " + usuario.getNombre() + " " + usuario.getApellidos());
                    conteo.setTotalProductos(0);
                    conteo.setProductosContados(0);
                    conteo.setProductosConDiferencias(0);
                    conteo.setPorcentajeCompletado(0.0);
                    
                    conteoSectorRepository.save(conteo);
                    
                    System.out.println("✅ Conteo actualizado de COMPLETADO_SIN_CONTEO a PENDIENTE");
                    System.out.println("🔍 DEBUG - Estado guardado: " + conteo.getEstado());
                    System.out.println("🔍 DEBUG - Sector ID: " + conteo.getSector().getId());
                    System.out.println("🔍 DEBUG - Sector Nombre: " + conteo.getSector().getNombre());
                } else {
                    throw new RuntimeException("El sector no está en estado COMPLETADO_SIN_CONTEO");
                }
            } else {
                throw new RuntimeException("No se encontró un conteo para este sector");
            }
            
            // Actualizar el progreso del inventario completo
            System.out.println("🔄 === ACTUALIZANDO PROGRESO DEL INVENTARIO ===");
            boolean finalizado = verificarYFinalizarInventarioCompleto(inventario.getId(), true); // forzarFinalizacion = true para actualización de stock
            System.out.println("🔄 Resultado de verificarYFinalizarInventarioCompleto: " + finalizado);
            
            // Recargar el inventario para obtener los datos actualizados
            inventario = inventarioCompletoRepository.findById(inventarioId).orElse(null);
            if (inventario != null) {
                System.out.println("🔍 Estado final del inventario:");
                System.out.println("  - ID: " + inventario.getId());
                System.out.println("  - Estado: " + inventario.getEstado());
                System.out.println("  - Sectores completados: " + inventario.getSectoresCompletados());
                System.out.println("  - Total sectores: " + inventario.getTotalSectores());
                System.out.println("  - Porcentaje completado: " + inventario.getPorcentajeCompletado());
                System.out.println("  - Finalizado: " + finalizado);
            }
            
            System.out.println("✅ Sector cancelado de completado sin conteo exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error cancelando sector completado sin conteo: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Marcar un sector como completado vacío (descontar stock de productos)
     * Si el sector tenía productos, los pone en 0 y descuenta del stock total
     */
    @Transactional
    public void marcarSectorCompletadoVacio(Long inventarioId, Long sectorId, String sectorNombre, Usuario usuario) {
        try {
            System.out.println("🔄 === MARCAR SECTOR COMPLETADO VACÍO ===");
            System.out.println("🔍 Inventario ID: " + inventarioId);
            System.out.println("🔍 Sector ID: " + sectorId);
            System.out.println("🔍 Sector Nombre: " + sectorNombre);
            
            // Obtener el inventario completo
            InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
            
            // Obtener el sector
            Sector sector = sectorRepository.findById(sectorId)
                .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
            
            // Verificar si ya existe un conteo para este sector
            Optional<ConteoSector> conteoExistente = conteoSectorRepository.findByInventarioCompletoAndSector(inventario, sector);
            
            ConteoSector conteo;
            if (conteoExistente.isPresent()) {
                // Si ya existe, actualizar el estado
                conteo = conteoExistente.get();
                conteo.setEstado(ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO);
                conteo.setFechaFinalizacion(LocalDateTime.now());
                conteo.setObservaciones("Sector marcado como VACÍO por " + usuario.getNombre() + " " + usuario.getApellidos() + 
                    " - Todos los productos fueron descontados");
            } else {
                // Si no existe, crear un nuevo conteo
                conteo = new ConteoSector();
                conteo.setInventarioCompleto(inventario);
                conteo.setSector(sector);
                conteo.setEstado(ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO);
                conteo.setFechaCreacion(LocalDateTime.now());
                conteo.setFechaFinalizacion(LocalDateTime.now());
                conteo.setObservaciones("Sector marcado como VACÍO por " + usuario.getNombre() + " " + usuario.getApellidos() + 
                    " - Todos los productos fueron descontados");
                conteo.setTotalProductos(0);
                conteo.setProductosContados(0);
                conteo.setProductosConDiferencias(0);
                conteo.setPorcentajeCompletado(100.0);
            }
            
            // PASO CRÍTICO: Obtener todos los productos con stock en este sector
            System.out.println("🔄 === OBTENIENDO PRODUCTOS CON STOCK EN EL SECTOR ===");
            List<StockPorSector> stocksEnSector = stockPorSectorRepository.findBySectorId(sectorId);
            System.out.println("🔍 Productos encontrados en el sector: " + stocksEnSector.size());
            
            int productosDescontados = 0;
            int cantidadTotalDescontada = 0;
            
            for (StockPorSector stock : stocksEnSector) {
                if (stock.getCantidad() == null || stock.getCantidad() <= 0) {
                    continue; // Saltar productos sin stock
                }
                
                Producto producto = stock.getProducto();
                Integer cantidadEnSector = stock.getCantidad();
                
                System.out.println("🔄 Procesando producto: " + producto.getNombre() + 
                    " - Cantidad en sector: " + cantidadEnSector);
                
                // Crear DetalleConteo con cantidad 0 para ambos usuarios (sector vacío)
                DetalleConteo detalleConteo;
                Optional<DetalleConteo> detalleExistente = detalleConteoRepository
                    .findByConteoSectorAndProducto(conteo, producto);
                
                if (detalleExistente.isPresent()) {
                    detalleConteo = detalleExistente.get();
                } else {
                    detalleConteo = new DetalleConteo(conteo, producto);
                }
                
                // Guardar el stock del sistema en este sector antes de descontarlo
                Integer stockSistemaEnSector = cantidadEnSector;
                
                // Marcar ambos conteos en 0 (sector vacío)
                detalleConteo.setCantidadConteo1(0);
                detalleConteo.setCantidadConteo2(0);
                detalleConteo.setCantidadFinal(0);
                detalleConteo.setStockSistema(stockSistemaEnSector); // Guardar el stock que había en el sector
                detalleConteo.setDiferenciaSistema(0 - stockSistemaEnSector); // Diferencia: 0 contado - stock que había en este sector
                detalleConteo.setDiferenciaEntreConteos(0); // No hay diferencia entre conteos (ambos son 0)
                detalleConteo.setEstado(DetalleConteo.EstadoDetalle.FINALIZADO);
                detalleConteo.setObservaciones("Sector marcado como vacío - Stock descontado del sector: " + cantidadEnSector);
                
                // Calcular valor de la diferencia
                if (producto.getPrecio() != null && cantidadEnSector > 0) {
                    BigDecimal valorDiferencia = producto.getPrecio().multiply(BigDecimal.valueOf(-cantidadEnSector));
                    detalleConteo.setValorDiferencia(valorDiferencia);
                }
                
                detalleConteoRepository.save(detalleConteo);
                
                // Actualizar StockPorSector a 0 (solo del sector que se está vaciando)
                stock.setCantidad(0);
                stockPorSectorRepository.save(stock);
                
                // Recalcular el stock total del producto sumando todos los StockPorSector
                // Esto asegura que solo se descuente lo del sector específico, no afecta otros sectores
                List<StockPorSector> todosLosStocksDelProducto = stockPorSectorRepository.findByProductoId(producto.getId());
                Integer stockTotalRecalculado = todosLosStocksDelProducto.stream()
                    .mapToInt(s -> s.getCantidad() != null ? s.getCantidad() : 0)
                    .sum();
                
                Integer stockAnterior = producto.getStock();
                producto.setStock(stockTotalRecalculado);
                productoRepository.save(producto);
                
                System.out.println("✅ Producto procesado:");
                System.out.println("  - Producto: " + producto.getNombre());
                System.out.println("  - Cantidad descontada del sector: " + cantidadEnSector);
                System.out.println("  - Stock anterior total: " + stockAnterior);
                System.out.println("  - Stock nuevo total (recalculado): " + stockTotalRecalculado);
                System.out.println("  - Diferencia: " + (stockTotalRecalculado - stockAnterior));
                
                productosDescontados++;
                cantidadTotalDescontada += cantidadEnSector;
            }
            
            // Actualizar estadísticas del conteo
            conteo.setProductosContados(productosDescontados);
            conteo.setTotalProductos(productosDescontados);
            conteo.setProductosConDiferencias(0);
            conteo.setPorcentajeCompletado(100.0);
            conteoSectorRepository.save(conteo);
            
            System.out.println("🔄 === RESUMEN DE DESCUENTO ===");
            System.out.println("  - Productos procesados: " + productosDescontados);
            System.out.println("  - Cantidad total descontada: " + cantidadTotalDescontada);
            
            // Actualizar el progreso del inventario completo
            System.out.println("🔄 === ACTUALIZANDO PROGRESO DEL INVENTARIO ===");
            boolean finalizado = verificarYFinalizarInventarioCompleto(inventario.getId());
            System.out.println("🔄 Resultado de verificarYFinalizarInventarioCompleto: " + finalizado);
            
            // Recargar el inventario para obtener los datos actualizados
            inventario = inventarioCompletoRepository.findById(inventarioId).orElse(null);
            if (inventario != null) {
                System.out.println("🔍 Estado final del inventario:");
                System.out.println("  - ID: " + inventario.getId());
                System.out.println("  - Estado: " + inventario.getEstado());
                System.out.println("  - Sectores completados: " + inventario.getSectoresCompletados());
                System.out.println("  - Total sectores: " + inventario.getTotalSectores());
                System.out.println("  - Porcentaje completado: " + inventario.getPorcentajeCompletado());
                System.out.println("  - Finalizado: " + finalizado);
            }
            
            System.out.println("✅ Sector marcado como completado vacío exitosamente");
            
        } catch (Exception e) {
            System.err.println("❌ Error marcando sector como completado vacío: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Verificar y corregir stock de sectores "completado sin conteo"
     */
    private void verificarYCorregirStockSectoresSinConteo(InventarioCompleto inventario) {
        try {
            System.out.println("🔄 === VERIFICANDO STOCK DE SECTORES SIN CONTEO ===");
            
            // Obtener todos los sectores "completado sin conteo"
            List<ConteoSector> sectoresSinConteo = conteoSectorRepository.findByInventarioCompleto(inventario).stream()
                .filter(sector -> sector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO_SIN_CONTEO)
                .collect(Collectors.toList());
            
            System.out.println("🔍 Sectores sin conteo encontrados: " + sectoresSinConteo.size());
            
            for (ConteoSector conteoSector : sectoresSinConteo) {
                Sector sector = conteoSector.getSector();
                System.out.println("🔍 Verificando sector: " + sector.getNombre() + " (ID: " + sector.getId() + ")");
                
                // Obtener todos los productos de la empresa
                List<Producto> productosEmpresa = productoRepository.findByEmpresaId(inventario.getEmpresa().getId());
                
                for (Producto producto : productosEmpresa) {
                    // Verificar si el producto tiene stock en este sector
                    Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(producto.getId(), sector.getId());
                    
                    if (!stockExistente.isPresent()) {
                        // El producto no tiene stock en este sector, pero podría tenerlo según su sector de almacenamiento
                        if (producto.getSectorAlmacenamiento() != null && producto.getSectorAlmacenamiento().equals(sector.getNombre())) {
                            // Crear registro de stock para preservar el stock original
                            StockPorSector nuevoStock = new StockPorSector(producto, sector, producto.getStock());
                            stockPorSectorRepository.save(nuevoStock);
                            System.out.println("✅ Stock creado para preservar: " + producto.getNombre() + " en " + sector.getNombre() + " = " + producto.getStock());
                        }
                    } else {
                        // El producto ya tiene stock en este sector
                        StockPorSector stock = stockExistente.get();
                        System.out.println("✅ Stock ya existe: " + producto.getNombre() + " en " + sector.getNombre() + " = " + stock.getCantidad());
                    }
                }
            }
            
            System.out.println("🔄 === VERIFICACIÓN COMPLETADA ===");
            
        } catch (Exception e) {
            System.err.println("❌ Error verificando stock de sectores sin conteo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Calcular stock ajustado descontando sectores completados sin conteo
     */
    private Integer calcularStockAjustado(Long productoId, Integer stockOriginal, List<ConteoSector> sectoresSinConteo) {
        try {
            if (sectoresSinConteo.isEmpty()) {
                return stockOriginal; // No hay sectores sin conteo, usar stock original
            }
            
            // Obtener el stock por sector para este producto
            List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByProductoId(productoId);
            
            if (stockPorSectores.isEmpty()) {
                return stockOriginal; // No hay distribución por sectores, usar stock original
            }
            
            // Calcular el stock total en sectores completados sin conteo
            Integer stockEnSectoresSinConteo = 0;
            for (ConteoSector sectorSinConteo : sectoresSinConteo) {
                for (StockPorSector stockPorSector : stockPorSectores) {
                    if (stockPorSector.getSector().getId().equals(sectorSinConteo.getSector().getId())) {
                        stockEnSectoresSinConteo += stockPorSector.getCantidad();
                        System.out.println("    📦 Descontando stock del sector " + sectorSinConteo.getSector().getNombre() + 
                                         ": " + stockPorSector.getCantidad());
                    }
                }
            }
            
            Integer stockAjustado = stockOriginal - stockEnSectoresSinConteo;
            
            System.out.println("    📊 Stock ajustado para producto ID " + productoId + ":");
            System.out.println("      - Stock original: " + stockOriginal);
            System.out.println("      - Stock en sectores sin conteo: " + stockEnSectoresSinConteo);
            System.out.println("      - Stock ajustado: " + stockAjustado);
            
            return Math.max(0, stockAjustado); // No permitir stock negativo
            
        } catch (Exception e) {
            System.err.println("❌ Error calculando stock ajustado para producto " + productoId + ": " + e.getMessage());
            return stockOriginal; // En caso de error, usar stock original
        }
    }

    // ========================================
    // ✅ MÉTODOS AUXILIARES PARA NUEVA LÓGICA SIMPLE
    // ========================================

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Establece la referencia inicial usando el servicio simple
     */
    public void establecerReferenciaInicialSimple(ConteoSector conteoSector) {
        System.out.println("🔍 [SIMPLE] Estableciendo referencia inicial para sector: " + conteoSector.getId());
        System.out.println("🔍 [SIMPLE] Estado del sector antes: " + conteoSector.getEstado());
        System.out.println("🔍 [SIMPLE] Referencia antes: " + conteoSector.getReferenciaActual());
        
        inventarioCompletoServiceSimple.establecerReferenciaInicial(conteoSector);
        
        System.out.println("🔍 [SIMPLE] Referencia después del servicio simple: " + conteoSector.getReferenciaActual());
        
        // Guardar el sector con la referencia actualizada
        ConteoSector sectorGuardado = conteoSectorRepository.save(conteoSector);
        System.out.println("✅ [SIMPLE] Referencia inicial guardada en base de datos");
        System.out.println("✅ [SIMPLE] Referencia en sector guardado: " + sectorGuardado.getReferenciaActual());
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Actualiza la referencia actual usando el servicio simple
     */
    public void actualizarReferenciaActualSimple(ConteoSector conteoSector) {
        System.out.println("🔍 [SIMPLE] Actualizando referencia actual para sector: " + conteoSector.getId());
        inventarioCompletoServiceSimple.actualizarReferenciaActual(conteoSector);
        
        // Guardar el sector con la referencia actualizada
        conteoSectorRepository.save(conteoSector);
        System.out.println("✅ [SIMPLE] Referencia actual guardada en base de datos");
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Obtiene los detalles para reconteo usando la referencia actual
     */
    public List<Map<String, Object>> obtenerDetallesParaReconteoSimple(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 [SIMPLE] Obteniendo detalles para reconteo (lógica simple) - Sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            System.out.println("❌ [SIMPLE] ConteoSector no encontrado para ID: " + conteoSectorId);
            return new ArrayList<>();
        }

        // Verificar que tiene referencia actual
        System.out.println("🔍 [SIMPLE] Verificando referencia actual:");
        System.out.println("  - Referencia actual es null: " + (conteoSector.getReferenciaActual() == null));
        System.out.println("  - Referencia actual está vacía: " + (conteoSector.getReferenciaActual() != null && conteoSector.getReferenciaActual().trim().isEmpty()));
        System.out.println("  - Referencia actual: " + conteoSector.getReferenciaActual());
        
        if (conteoSector.getReferenciaActual() == null || conteoSector.getReferenciaActual().trim().isEmpty()) {
            System.out.println("⚠️ [SIMPLE] No hay referencia actual, estableciendo referencia inicial...");
            establecerReferenciaInicialSimple(conteoSector);
            
            // Recargar el conteoSector después de establecer la referencia
            conteoSector = obtenerConteoSectorPorId(conteoSectorId);
            System.out.println("🔍 [SIMPLE] Referencia actual después de establecer: " + conteoSector.getReferenciaActual());
        }

        List<Map<String, Object>> detallesReconteo = new ArrayList<>();
        
        try {
            // Parsear la referencia actual (JSON simple)
            String referenciaJson = conteoSector.getReferenciaActual();
            System.out.println("🔍 [SIMPLE] Referencia actual: " + referenciaJson);
            
            // ✅ CORRECCIÓN: Obtener detalles actuales del sector
            List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
            
            // Agrupar por producto
            Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
            for (DetalleConteo detalle : detalles) {
                detallesPorProducto.computeIfAbsent(detalle.getProducto().getId(), k -> new ArrayList<>()).add(detalle);
            }
            
            // ✅ FILTRO CRÍTICO: Solo procesar productos que TIENEN DIFERENCIAS
            System.out.println("🔍 [SIMPLE] Filtrando productos con diferencias...");
            int totalProductos = detallesPorProducto.size();
            int productosConDiferencias = 0;
            
            // Para cada producto, crear el detalle para reconteo SOLO SI TIENE DIFERENCIAS
            for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
                Long productoId = entry.getKey();
                List<DetalleConteo> detallesDelProducto = entry.getValue();
                DetalleConteo primerDetalle = detallesDelProducto.get(0);
                
                // ✅ VERIFICAR SI EL PRODUCTO TIENE DIFERENCIAS
                boolean tieneDiferencias = false;
                
                // Verificar diferencias en los valores de referencia
                Map<String, Object> valoresReferencia = parsearValoresReferencia(referenciaJson, productoId);
                if (valoresReferencia != null) {
                    Object usuario1Ref = valoresReferencia.get("usuario1");
                    Object usuario2Ref = valoresReferencia.get("usuario2");
                    
                    if (usuario1Ref != null && usuario2Ref != null) {
                        try {
                            int cantidadUsuario1 = Integer.parseInt(usuario1Ref.toString());
                            int cantidadUsuario2 = Integer.parseInt(usuario2Ref.toString());
                            tieneDiferencias = cantidadUsuario1 != cantidadUsuario2;
                            
                            System.out.println("🔍 [SIMPLE] Producto " + productoId + " (" + primerDetalle.getProducto().getNombre() + "):");
                            System.out.println("  - Usuario1: " + cantidadUsuario1 + ", Usuario2: " + cantidadUsuario2);
                            System.out.println("  - Tiene diferencias: " + tieneDiferencias);
                        } catch (NumberFormatException e) {
                            System.out.println("⚠️ [SIMPLE] Error parseando cantidades para producto " + productoId);
                            tieneDiferencias = false;
                        }
                    }
                }
                
                // ✅ SOLO PROCESAR PRODUCTOS CON DIFERENCIAS
                if (tieneDiferencias) {
                    productosConDiferencias++;
                    System.out.println("✅ [SIMPLE] Incluyendo producto " + productoId + " en reconteo (tiene diferencias)");
                    Map<String, Object> detalleReconteo = new HashMap<>();
                    detalleReconteo.put("productoId", productoId);
                    detalleReconteo.put("nombreProducto", primerDetalle.getProducto().getNombre());
                    detalleReconteo.put("codigoProducto", primerDetalle.getProducto().getCodigoPersonalizado());
                    detalleReconteo.put("unidad", primerDetalle.getProducto().getUnidad());
                    detalleReconteo.put("stockSistema", primerDetalle.getProducto().getStock());
                    
                    // ✅ LÓGICA CORRECTA PARA RECONTEO:
                    // Los valores de referencia son los del conteo inicial (para mostrar al usuario)
                    // Los valores actuales son los del reconteo (empiezan en 0 hasta que el usuario ingrese valores)
                    
                    // 1. VALORES DE REFERENCIA (del conteo inicial) - estos se muestran al usuario como referencia
                    detalleReconteo.put("cantidadConteo1Referencia", valoresReferencia.get("usuario1"));
                    detalleReconteo.put("cantidadConteo2Referencia", valoresReferencia.get("usuario2"));
                    detalleReconteo.put("formulaCalculo1Referencia", valoresReferencia.get("formulas1"));
                    detalleReconteo.put("formulaCalculo2Referencia", valoresReferencia.get("formulas2"));
                    
                    // 2. VALORES ACTUALES (del reconteo) - NUNCA mostrar hasta que ambos usuarios hayan terminado
                    // ✅ LÓGICA CORRECTA: Los usuarios NUNCA ven los valores del reconteo hasta que ambos terminen
                    // Solo ven la referencia (conteo inicial o reconteo anterior completado)
                    
                    int cantidadActual1 = 0;
                    int cantidadActual2 = 0;
                    List<String> formulasActual1List = new ArrayList<>();
                    List<String> formulasActual2List = new ArrayList<>();
                    
                    // Determinar si ambos usuarios ya han terminado el reconteo actual
                    String observaciones = conteoSector.getObservaciones();
                    boolean ambosUsuariosTerminaron = false;
                    
                    if (observaciones != null) {
                        // Verificar si ambos usuarios han terminado el reconteo
                        ambosUsuariosTerminaron = observaciones.contains("Usuario1_Finalizado") && 
                                               observaciones.contains("Usuario2_Finalizado");
                    }
                    
                    // Solo mostrar valores del reconteo si ambos usuarios ya han terminado
                    if (ambosUsuariosTerminaron) {
                        // Ordenar por fecha de actualización (más reciente primero)
                        detallesDelProducto.sort((d1, d2) -> d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion()));
                        
                        // Determinar fecha de inicio del reconteo actual
                        LocalDateTime fechaInicioReconteoActual = conteoSector.getFechaCreacion(); // Por defecto, usar fecha de creación
                        
                        // Buscar la fecha más reciente de actualización como referencia para reconteo
                        for (DetalleConteo detalle : detallesDelProducto) {
                            if (detalle.getFechaActualizacion() != null && 
                                detalle.getFechaActualizacion().isAfter(fechaInicioReconteoActual)) {
                                fechaInicioReconteoActual = detalle.getFechaActualizacion().minusMinutes(1); // Un minuto antes
                                break;
                            }
                        }
                        
                        // Sumar solo los valores del reconteo completado (más recientes que la fecha de inicio)
                        for (DetalleConteo detalle : detallesDelProducto) {
                            boolean esValorReconteoCompletado = detalle.getFechaActualizacion() != null && 
                                                               detalle.getFechaActualizacion().isAfter(fechaInicioReconteoActual);
                            
                            if (esValorReconteoCompletado) {
                                // Sumar cantidades del reconteo completado para usuario 1
                                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                                    cantidadActual1 += detalle.getCantidadConteo1();
                                    if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                                        formulasActual1List.add(detalle.getFormulaCalculo1());
                                    }
                                }
                                
                                // Sumar cantidades del reconteo completado para usuario 2
                                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                                    cantidadActual2 += detalle.getCantidadConteo2();
                                    if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                                        formulasActual2List.add(detalle.getFormulaCalculo2());
                                    }
                                }
                            }
                        }
                    }
                    
                    // Convertir listas de fórmulas a strings separados por " | "
                    String formulasActual1 = String.join(" | ", formulasActual1List);
                    String formulasActual2 = String.join(" | ", formulasActual2List);
                    
                    // Debug: Mostrar valores calculados
                    System.out.println("🔍 [SIMPLE] Producto " + productoId + " - Reconteo:");
                    System.out.println("  - Estado del sector: " + conteoSector.getEstado());
                    System.out.println("  - Observaciones: " + observaciones);
                    System.out.println("  - Ambos usuarios terminaron: " + ambosUsuariosTerminaron);
                    System.out.println("  - Referencia Usuario1: " + valoresReferencia.get("usuario1") + " (fórmulas: " + valoresReferencia.get("formulas1") + ")");
                    System.out.println("  - Referencia Usuario2: " + valoresReferencia.get("usuario2") + " (fórmulas: " + valoresReferencia.get("formulas2") + ")");
                    System.out.println("  - Reconteo Usuario1: " + cantidadActual1 + " (fórmulas: " + formulasActual1 + ")");
                    System.out.println("  - Reconteo Usuario2: " + cantidadActual2 + " (fórmulas: " + formulasActual2 + ")");
                    
                    // 3. VALORES ACTUALES DEL RECONTEO (para que el usuario vea lo que ya ingresó)
                    detalleReconteo.put("cantidadConteo1", cantidadActual1);
                    detalleReconteo.put("cantidadConteo2", cantidadActual2);
                    detalleReconteo.put("formulaCalculo1", formulasActual1);
                    detalleReconteo.put("formulaCalculo2", formulasActual2);
                    
                    // ✅ CORRECCIÓN: Calcular diferencia entre los valores de REFERENCIA (conteo original)
                    Object usuario1Ref = valoresReferencia.get("usuario1");
                    Object usuario2Ref = valoresReferencia.get("usuario2");
                    
                    int diferenciaEntreUsuariosReferencia = 0;
                    if (usuario1Ref != null && usuario2Ref != null) {
                        try {
                            int cantidadUsuario1Ref = Integer.parseInt(usuario1Ref.toString());
                            int cantidadUsuario2Ref = Integer.parseInt(usuario2Ref.toString());
                            diferenciaEntreUsuariosReferencia = Math.abs(cantidadUsuario1Ref - cantidadUsuario2Ref);
                        } catch (NumberFormatException e) {
                            System.out.println("⚠️ [SIMPLE] Error parseando cantidades de referencia para diferencia");
                        }
                    }
                    
                    detalleReconteo.put("diferenciaEntreConteos", diferenciaEntreUsuariosReferencia);
                    
                    // Marcar si hay diferencias entre los usuarios del reconteo
                    boolean hayDiferencias = diferenciaEntreUsuariosReferencia > 0;
                    detalleReconteo.put("hayDiferencias", hayDiferencias);
                    
                    // Debug: Mostrar diferencias
                    System.out.println("  - Diferencia entre usuarios (REFERENCIA): " + diferenciaEntreUsuariosReferencia + " (hayDiferencias: " + hayDiferencias + ")");
                    System.out.println("  - Valores referencia - Usuario1: " + usuario1Ref + ", Usuario2: " + usuario2Ref);
                    
                    detallesReconteo.add(detalleReconteo);
                } else {
                    System.out.println("⏭️ [SIMPLE] Saltando producto " + productoId + " - NO tiene diferencias");
                }
            }
            
            System.out.println("✅ [SIMPLE] FILTRADO COMPLETADO:");
            System.out.println("  - Total productos en sector: " + totalProductos);
            System.out.println("  - Productos con diferencias: " + productosConDiferencias);
            System.out.println("  - Productos incluidos en reconteo: " + detallesReconteo.size());
            
        } catch (Exception e) {
            System.err.println("❌ [SIMPLE] Error obteniendo detalles para reconteo: " + e.getMessage());
            e.printStackTrace();
        }
        
        return detallesReconteo;
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Parsea los valores de referencia para un producto específico
     */
    private Map<String, Object> parsearValoresReferencia(String referenciaJson, Long productoId) {
        try {
            // Parseo simple del JSON (sin usar librerías externas)
            String productoIdStr = productoId.toString();
            
            // Buscar la sección del producto en el JSON
            int inicioProducto = referenciaJson.indexOf("\"" + productoIdStr + "\":{");
            if (inicioProducto == -1) {
                System.out.println("⚠️ [SIMPLE] Producto " + productoId + " no encontrado en referencia");
                return null;
            }
            
            // Encontrar el final de la sección del producto
            int inicioLlave = referenciaJson.indexOf("{", inicioProducto);
            int finLlave = encontrarFinLlave(referenciaJson, inicioLlave);
            
            if (inicioLlave == -1 || finLlave == -1) {
                System.out.println("⚠️ [SIMPLE] Error parseando JSON para producto " + productoId);
                return null;
            }
            
            String productoJson = referenciaJson.substring(inicioLlave + 1, finLlave);
            
            // Extraer valores individuales
            Map<String, Object> valores = new HashMap<>();
            
            // Extraer nombre
            String nombre = extraerValorJson(productoJson, "nombre");
            valores.put("nombre", nombre != null ? nombre : "");
            
            // Extraer usuario1
            String usuario1Str = extraerValorJson(productoJson, "usuario1");
            valores.put("usuario1", usuario1Str != null ? Integer.parseInt(usuario1Str) : 0);
            
            // Extraer usuario2
            String usuario2Str = extraerValorJson(productoJson, "usuario2");
            valores.put("usuario2", usuario2Str != null ? Integer.parseInt(usuario2Str) : 0);
            
            // Extraer formulas1
            String formulas1 = extraerValorJson(productoJson, "formulas1");
            valores.put("formulas1", formulas1 != null ? formulas1 : "");
            
            // Extraer formulas2
            String formulas2 = extraerValorJson(productoJson, "formulas2");
            valores.put("formulas2", formulas2 != null ? formulas2 : "");
            
            return valores;
            
        } catch (Exception e) {
            System.err.println("❌ [SIMPLE] Error parseando valores de referencia para producto " + productoId + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Encuentra el final de una llave en JSON
     */
    private int encontrarFinLlave(String json, int inicioLlave) {
        int contadorLlaves = 1;
        int i = inicioLlave + 1;
        
        while (i < json.length() && contadorLlaves > 0) {
            if (json.charAt(i) == '{') {
                contadorLlaves++;
            } else if (json.charAt(i) == '}') {
                contadorLlaves--;
            }
            i++;
        }
        
        return contadorLlaves == 0 ? i - 1 : -1;
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Extrae un valor de un JSON simple
     */
    private String extraerValorJson(String json, String clave) {
        try {
            String patron = "\"" + clave + "\":";
            int inicio = json.indexOf(patron);
            if (inicio == -1) return null;
            
            inicio += patron.length();
            
            // Buscar el valor (puede ser string o número)
            if (json.charAt(inicio) == '"') {
                // Es un string
                inicio++; // Saltar la comilla inicial
                int fin = json.indexOf("\"", inicio);
                if (fin == -1) return null;
                return json.substring(inicio, fin);
            } else {
                // Es un número
                int fin = inicio;
                while (fin < json.length() && (Character.isDigit(json.charAt(fin)) || json.charAt(fin) == '.')) {
                    fin++;
                }
                return json.substring(inicio, fin);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SIMPLE] Error extrayendo valor JSON para clave " + clave + ": " + e.getMessage());
            return null;
        }
    }
}