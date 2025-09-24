package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ConteoSectorDTO;
import com.minegocio.backend.entidades.ConteoSector;
import com.minegocio.backend.entidades.DetalleConteo;
import com.minegocio.backend.entidades.InventarioCompleto;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.repositorios.ConteoSectorRepository;
import com.minegocio.backend.repositorios.DetalleConteoRepository;
import com.minegocio.backend.repositorios.InventarioCompletoRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

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
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private SectorRepository sectorRepository;

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
     * Obtener detalles de conteo por usuario
     */
    public List<DetalleConteo> obtenerDetallesConteoPorUsuario(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Obteniendo detalles de conteo para usuario: " + usuarioId + " en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        System.out.println("✅ Todos los detalles encontrados: " + todosLosDetalles.size());
        
        // Filtrar detalles para mostrar solo los productos contados por este usuario específico
        List<DetalleConteo> detallesFiltrados = new ArrayList<>();
        boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                           conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                           conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        
        for (DetalleConteo detalle : todosLosDetalles) {
            // Solo incluir el detalle si el usuario específico ha contado este producto
            boolean usuarioHaContado = false;
            
            if (esUsuario1 && detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                usuarioHaContado = true;
            }
            if (esUsuario2 && detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                usuarioHaContado = true;
            }
            
            if (usuarioHaContado) {
                detallesFiltrados.add(detalle);
            }
        }
        
        System.out.println("✅ Detalles filtrados para usuario " + usuarioId + ": " + detallesFiltrados.size());
        return detallesFiltrados;
    }

    /**
     * Obtener detalles de conteo para reconteo (consolidados)
     */
    public List<DetalleConteo> obtenerDetallesConteoParaReconteo(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo detalles consolidados para reconteo en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles consolidados encontrados: " + detalles.size());
        
        // Forzar la carga de las entidades Producto para evitar lazy loading
        for (DetalleConteo detalle : detalles) {
            if (detalle.getProducto() != null) {
                // Acceder a las propiedades para forzar la carga
                detalle.getProducto().getNombre();
                detalle.getProducto().getCodigoPersonalizado();
                detalle.getProducto().getStock();
                detalle.getProducto().getPrecio();
            }
        }
        
        return detalles;
    }

    /**
     * Obtener detalles consolidados para comparación de conteos
     */
    public List<Map<String, Object>> obtenerDetallesParaComparacion(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo detalles consolidados para comparación en sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles encontrados para comparación: " + detalles.size());
        
        // Agrupar por producto y consolidar
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }

        List<Map<String, Object>> productosConsolidados = new ArrayList<>();
        
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            DetalleConteo primerDetalle = detallesDelProducto.get(0);
            
            // Calcular totales consolidados
            int totalUsuario1 = detallesDelProducto.stream()
                .mapToInt(d -> d.getCantidadConteo1() != null ? d.getCantidadConteo1() : 0)
                .sum();
            
            int totalUsuario2 = detallesDelProducto.stream()
                .mapToInt(d -> d.getCantidadConteo2() != null ? d.getCantidadConteo2() : 0)
                .sum();
            
            int diferencia = totalUsuario1 - totalUsuario2;
            
            // Incluir TODOS los productos, no solo los que tienen diferencias
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
            
            // Consolidar fórmulas con detalles de cada conteo individual
            List<Map<String, Object>> conteosUsuario1 = new ArrayList<>();
            List<Map<String, Object>> conteosUsuario2 = new ArrayList<>();
            
            for (DetalleConteo detalle : detallesDelProducto) {
                System.out.println("🔍 Procesando detalle ID: " + detalle.getId() + 
                                 " - Usuario1: " + detalle.getCantidadConteo1() + " (" + detalle.getFormulaCalculo1() + ")" +
                                 " - Usuario2: " + detalle.getCantidadConteo2() + " (" + detalle.getFormulaCalculo2() + ")");
                
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo1());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo1() != null ? detalle.getFormulaCalculo1() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaCreacion());
                    conteosUsuario1.add(conteoIndividual);
                    System.out.println("✅ Agregado conteo Usuario1: " + detalle.getCantidadConteo1() + " (" + detalle.getFormulaCalculo1() + ")");
                }
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo2());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo2() != null ? detalle.getFormulaCalculo2() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaCreacion());
                    conteosUsuario2.add(conteoIndividual);
                    System.out.println("✅ Agregado conteo Usuario2: " + detalle.getCantidadConteo2() + " (" + detalle.getFormulaCalculo2() + ")");
                }
            }
            
            System.out.println("📊 Resumen final - Usuario1: " + conteosUsuario1.size() + " conteos, Usuario2: " + conteosUsuario2.size() + " conteos");
            
            // Crear resumen de fórmulas para mostrar en el frontend
            String resumenFormulasUsuario1 = conteosUsuario1.stream()
                .map(c -> c.get("cantidad") + " (" + c.get("formula") + ")")
                .collect(java.util.stream.Collectors.joining(", "));
            
            String resumenFormulasUsuario2 = conteosUsuario2.stream()
                .map(c -> c.get("cantidad") + " (" + c.get("formula") + ")")
                .collect(java.util.stream.Collectors.joining(", "));
            
            productoConsolidado.put("formulaCalculo1", resumenFormulasUsuario1.isEmpty() ? "Sin conteos" : resumenFormulasUsuario1);
            productoConsolidado.put("formulaCalculo2", resumenFormulasUsuario2.isEmpty() ? "Sin conteos" : resumenFormulasUsuario2);
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

        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        System.out.println("✅ Detalles encontrados para análisis de diferencias: " + detalles.size());
        
        // Agrupar por producto y consolidar
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
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
        
        Optional<InventarioCompleto> inventarioActivo = inventarioCompletoRepository.findInventarioActivoByEmpresa(empresa);
        System.out.println("🔍 DEBUG - Inventario activo encontrado: " + inventarioActivo.isPresent());
        if (inventarioActivo.isPresent()) {
            InventarioCompleto inventario = inventarioActivo.get();
            System.out.println("  - ID: " + inventario.getId() + ", Estado: " + inventario.getEstado());
            
            // Actualizar el progreso real de todos los sectores
            for (ConteoSector conteoSector : inventario.getConteosSectores()) {
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
        
        // Verificar que no hay inventario activo
        Optional<InventarioCompleto> inventarioActivo = obtenerInventarioActivo(empresaId);
        if (inventarioActivo.isPresent()) {
            throw new RuntimeException("Ya existe un inventario activo para esta empresa");
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
        System.out.println("🔍 Agregando producto al conteo - sector: " + conteoSectorId + ", producto: " + productoId + ", cantidad: " + cantidad);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Verificar si es reconteo (basándose en el estado del sector)
        boolean esReconteo = conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS;
        
        DetalleConteo detalle;
        
        if (esReconteo) {
            System.out.println("🔄 RECONTEO: Buscando entrada existente para actualizar");
            
            // Buscar entrada existente del usuario para este producto
            List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
            
            // Encontrar la entrada original del conteo inicial para este producto
            DetalleConteo entradaExistente = null;
            for (DetalleConteo det : detallesExistentes) {
                if (det.getProducto().getId().equals(productoId)) {
                    if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                        // Buscar entrada donde el usuario 1 contó originalmente
                        if (det.getCantidadConteo1() != null && det.getCantidadConteo1() > 0) {
                            entradaExistente = det;
                            break; // Usar la primera entrada encontrada del usuario 1
                        }
                    } else {
                        // Buscar entrada donde el usuario 2 contó originalmente
                        if (det.getCantidadConteo2() != null && det.getCantidadConteo2() > 0) {
                            entradaExistente = det;
                            break; // Usar la primera entrada encontrada del usuario 2
                        }
                    }
                }
            }
            
            if (entradaExistente != null) {
                System.out.println("✅ RECONTEO: Actualizando entrada existente ID: " + entradaExistente.getId());
                detalle = entradaExistente;
            } else {
                System.out.println("⚠️ RECONTEO: No se encontró entrada existente, creando nueva");
                detalle = new DetalleConteo();
                detalle.setConteoSector(conteoSector);
                detalle.setProducto(producto);
                detalle.setCodigoProducto(producto.getCodigoPersonalizado());
                detalle.setNombreProducto(producto.getNombre());
                detalle.setStockSistema(producto.getStock());
                detalle.setPrecioUnitario(producto.getPrecio());
            }
        } else {
            System.out.println("🆕 CONTEO INICIAL: Creando nueva entrada");
            // Crear nuevo detalle para conteo inicial (permite múltiples conteos del mismo producto)
            detalle = new DetalleConteo();
            detalle.setConteoSector(conteoSector);
            detalle.setProducto(producto);
            detalle.setCodigoProducto(producto.getCodigoPersonalizado());
            detalle.setNombreProducto(producto.getNombre());
            detalle.setStockSistema(producto.getStock());
            detalle.setPrecioUnitario(producto.getPrecio());
        }
        
        // Asignar cantidad según el usuario
        if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
            detalle.setCantidadConteo1(cantidad);
            detalle.setFormulaCalculo1(formulaCalculo);
            // Para reconteo, mantener los valores del otro usuario
            if (!esReconteo) {
                detalle.setCantidadConteo2(null);
                detalle.setFormulaCalculo2(null);
            }
        } else {
            // Para reconteo, mantener los valores del otro usuario
            if (!esReconteo) {
                detalle.setCantidadConteo1(null);
                detalle.setFormulaCalculo1(null);
            }
            detalle.setCantidadConteo2(cantidad);
            detalle.setFormulaCalculo2(formulaCalculo);
        }
        
        // Guardar el detalle
        detalle = detalleConteoRepository.save(detalle);
        
        // Actualizar el progreso real del sector
        calcularProgresoReal(conteoSector);
        conteoSectorRepository.save(conteoSector);
        
        // NO cambiar el estado general del conteo sector
        // El estado se mantiene como PENDIENTE hasta que se finalice el conteo
        // Los estados por usuario se determinan individualmente basándose en los DetalleConteo
        
        System.out.println("✅ Producto agregado al conteo por usuario " + usuarioId);
        System.out.println("ℹ️ Estado general del conteo sector se mantiene como: " + conteoSector.getEstado());
        
        return detalle;
    }

    /**
     * Agregar producto al reconteo (reemplaza cantidad existente)
     */
    public DetalleConteo agregarProductoAlReconteo(Long conteoSectorId, Long productoId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔄 RECONTEO: Agregando producto - sector: " + conteoSectorId + ", producto: " + productoId + ", cantidad: " + cantidad);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Buscar entrada existente del usuario para este producto
        List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        
        System.out.println("🔍 RECONTEO DEBUG: Total detalles existentes: " + detallesExistentes.size());
        System.out.println("🔍 RECONTEO DEBUG: Buscando producto ID: " + productoId + " para usuario: " + usuarioId);
        
        // Encontrar la entrada original del conteo inicial para este producto
        DetalleConteo entradaExistente = null;
        for (DetalleConteo det : detallesExistentes) {
            System.out.println("🔍 RECONTEO DEBUG: Revisando detalle ID: " + det.getId() + 
                             ", Producto ID: " + det.getProducto().getId() + 
                             ", Cantidad1: " + det.getCantidadConteo1() + 
                             ", Cantidad2: " + det.getCantidadConteo2());
            
            if (det.getProducto().getId().equals(productoId)) {
                if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                    // Buscar entrada donde el usuario 1 contó originalmente
                    if (det.getCantidadConteo1() != null && det.getCantidadConteo1() > 0) {
                        entradaExistente = det;
                        System.out.println("✅ RECONTEO DEBUG: Encontrada entrada para Usuario 1 - ID: " + det.getId());
                        break; // Usar la primera entrada encontrada del usuario 1
                    }
                } else {
                    // Buscar entrada donde el usuario 2 contó originalmente
                    if (det.getCantidadConteo2() != null && det.getCantidadConteo2() > 0) {
                        entradaExistente = det;
                        System.out.println("✅ RECONTEO DEBUG: Encontrada entrada para Usuario 2 - ID: " + det.getId());
                        break; // Usar la primera entrada encontrada del usuario 2
                    }
                }
            }
        }
        
        if (entradaExistente != null) {
            System.out.println("✅ RECONTEO: Actualizando entrada existente ID: " + entradaExistente.getId());
            System.out.println("🔍 RECONTEO DEBUG: ANTES de reemplazar - Cantidad1: " + entradaExistente.getCantidadConteo1() + ", Cantidad2: " + entradaExistente.getCantidadConteo2());
            
            // REEMPLAZAR la cantidad (no sumar)
            if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
                System.out.println("🔄 RECONTEO DEBUG: Usuario 1 - Reemplazando cantidad de " + entradaExistente.getCantidadConteo1() + " a " + cantidad);
                entradaExistente.setCantidadConteo1(cantidad);
                entradaExistente.setFormulaCalculo1(formulaCalculo);
                System.out.println("🔄 RECONTEO: Usuario 1 - Cantidad reemplazada: " + cantidad);
            } else {
                System.out.println("🔄 RECONTEO DEBUG: Usuario 2 - Reemplazando cantidad de " + entradaExistente.getCantidadConteo2() + " a " + cantidad);
                entradaExistente.setCantidadConteo2(cantidad);
                entradaExistente.setFormulaCalculo2(formulaCalculo);
                System.out.println("🔄 RECONTEO: Usuario 2 - Cantidad reemplazada: " + cantidad);
            }
            
            System.out.println("🔍 RECONTEO DEBUG: DESPUÉS de reemplazar - Cantidad1: " + entradaExistente.getCantidadConteo1() + ", Cantidad2: " + entradaExistente.getCantidadConteo2());
            
            DetalleConteo resultado = detalleConteoRepository.save(entradaExistente);
            System.out.println("🔍 RECONTEO DEBUG: DESPUÉS de guardar - Cantidad1: " + resultado.getCantidadConteo1() + ", Cantidad2: " + resultado.getCantidadConteo2());
            
            // Actualizar el progreso real del sector
            calcularProgresoReal(conteoSector);
            conteoSectorRepository.save(conteoSector);
            
            return resultado;
        } else {
            System.out.println("❌ RECONTEO DEBUG: No se encontró entrada existente para producto ID: " + productoId + " y usuario: " + usuarioId);
            throw new RuntimeException("No se encontró entrada existente para recontear este producto");
        }
    }

    /**
     * Cancelar inventario completo
     */
    public InventarioCompleto cancelarInventarioCompleto(Long inventarioId) {
        System.out.println("🔍 Cancelando inventario completo: " + inventarioId);
        
        InventarioCompleto inventario = inventarioCompletoRepository.findById(inventarioId)
            .orElseThrow(() -> new RuntimeException("Inventario no encontrado"));
        
        inventario.setEstado(InventarioCompleto.EstadoInventario.CANCELADO);
        inventario.setFechaFinalizacion(LocalDateTime.now());
        
        return inventarioCompletoRepository.save(inventario);
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
        
        // Verificar si ya está en ESPERANDO_VERIFICACION (segundo usuario finalizando)
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("🔍 Segundo usuario finalizando, verificando diferencias...");
            
            // Comparar conteos de ambos usuarios
            boolean hayDiferencias = verificarDiferenciasEnConteo(conteoSector);
            
            if (hayDiferencias) {
                conteoSector.setEstado(ConteoSector.EstadoConteo.CON_DIFERENCIAS);
                System.out.println("⚠️ Diferencias encontradas, estado cambiado a CON_DIFERENCIAS");
            } else {
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                System.out.println("✅ Sin diferencias, estado cambiado a COMPLETADO");
            }
        } else {
            // Primer usuario finalizando
            conteoSector.setEstado(ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION);
            
            // Marcar qué usuario finalizó en las observaciones (temporal)
            if (esUsuario1) {
                conteoSector.setObservaciones("Usuario1_Finalizado");
            } else if (esUsuario2) {
                conteoSector.setObservaciones("Usuario2_Finalizado");
            }
            
            System.out.println("⏳ Primer usuario finalizado, estado cambiado a ESPERANDO_VERIFICACION");
        }
        
        ConteoSector conteoSectorGuardado = conteoSectorRepository.save(conteoSector);
        
        // Actualizar estadísticas del inventario
        InventarioCompleto inventario = conteoSector.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        return conteoSectorGuardado;
    }

    /**
     * Verificar si hay diferencias entre los conteos de ambos usuarios
     */
    private boolean verificarDiferenciasEnConteo(ConteoSector conteoSector) {
        System.out.println("🔍 Verificando diferencias en conteo sector: " + conteoSector.getId());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        
        // Consolidar conteos por producto
        Map<Long, Integer> totalesUsuario1 = new HashMap<>();
        Map<Long, Integer> totalesUsuario2 = new HashMap<>();
        Map<Long, String> nombresProductos = new HashMap<>();
        
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            String nombreProducto = detalle.getProducto().getNombre();
            nombresProductos.put(productoId, nombreProducto);
            
            // Sumar cantidades por usuario
            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                totalesUsuario1.put(productoId, totalesUsuario1.getOrDefault(productoId, 0) + detalle.getCantidadConteo1());
                System.out.println("🔍 Producto " + nombreProducto + " - Usuario 1: +" + detalle.getCantidadConteo1() + 
                                 " (total: " + totalesUsuario1.get(productoId) + ")");
            }
            
            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                totalesUsuario2.put(productoId, totalesUsuario2.getOrDefault(productoId, 0) + detalle.getCantidadConteo2());
                System.out.println("🔍 Producto " + nombreProducto + " - Usuario 2: +" + detalle.getCantidadConteo2() + 
                                 " (total: " + totalesUsuario2.get(productoId) + ")");
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
                    System.out.println("⚠️ Diferencia encontrada en producto: " + nombreProducto + 
                                     " - Usuario 1: " + total1 + ", Usuario 2: " + total2);
                    return true;
                }
            }
            
            // Si solo uno de los usuarios contó el producto, también es una diferencia
            if ((total1 > 0 && total2 == 0) || (total2 > 0 && total1 == 0)) {
                System.out.println("⚠️ Diferencia encontrada: solo un usuario contó " + nombreProducto + 
                                 " (Usuario 1: " + total1 + ", Usuario 2: " + total2 + ")");
                return true;
            }
        }
        
        System.out.println("✅ No se encontraron diferencias entre los conteos");
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
     * Finalizar reconteo de sector (para el flujo de reconteo)
     */
    public ConteoSector finalizarReconteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Finalizando reconteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        boolean esUsuario1 = conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        boolean esUsuario2 = conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        
        if (!esUsuario1 && !esUsuario2) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Verificar que estamos en un estado válido para reconteo
        // Permitir reconteo en CON_DIFERENCIAS o ESPERANDO_VERIFICACION (si ya hay reconteo en progreso)
        if (conteoSector.getEstado() != ConteoSector.EstadoConteo.CON_DIFERENCIAS && 
            conteoSector.getEstado() != ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("⚠️ Estado actual del sector: " + conteoSector.getEstado() + 
                             ", observaciones: " + conteoSector.getObservaciones());
            throw new RuntimeException("El sector no está en estado de reconteo. Estado actual: " + conteoSector.getEstado());
        }
        
        // Determinar si es reconteo o conteo inicial basándose en las observaciones
        String observaciones = conteoSector.getObservaciones();
        boolean esReconteo = observaciones != null && observaciones.startsWith("Reconteo_");
        
        // Verificar si ya está en ESPERANDO_VERIFICACION (segundo usuario finalizando)
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("🔍 Segundo usuario finalizando " + (esReconteo ? "reconteo" : "conteo") + ", verificando diferencias...");
            
            // Comparar conteos de ambos usuarios
            boolean hayDiferencias = verificarDiferenciasEnConteo(conteoSector);
            
            if (hayDiferencias) {
                // Hay diferencias, ir a estado CON_DIFERENCIAS
                conteoSector.setEstado(ConteoSector.EstadoConteo.CON_DIFERENCIAS);
                if (esReconteo) {
                    conteoSector.setObservaciones("Reconteo_Necesario"); // Resetear para nuevo reconteo
                    System.out.println("⚠️ Diferencias persisten después del reconteo, volviendo a CON_DIFERENCIAS");
                } else {
                    conteoSector.setObservaciones("Diferencias_Encontradas");
                    System.out.println("⚠️ Diferencias encontradas en conteo inicial, estado cambiado a CON_DIFERENCIAS");
                }
            } else {
                // No hay diferencias, sector completado
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                if (esReconteo) {
                    conteoSector.setObservaciones("Reconteo_Completado");
                    System.out.println("✅ Sin diferencias después del reconteo, estado cambiado a COMPLETADO");
                } else {
                    conteoSector.setObservaciones("Conteo_Completado");
                    System.out.println("✅ Sin diferencias en conteo inicial, estado cambiado a COMPLETADO");
                }
            }
        } else if (conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS) {
            // Primer usuario finalizando reconteo
            conteoSector.setEstado(ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION);
            
            // Marcar qué usuario finalizó el reconteo en las observaciones
            if (esUsuario1) {
                conteoSector.setObservaciones("Reconteo_Usuario1_Finalizado");
            } else if (esUsuario2) {
                conteoSector.setObservaciones("Reconteo_Usuario2_Finalizado");
            }
            
            System.out.println("⏳ Primer usuario finalizó reconteo, estado cambiado a ESPERANDO_VERIFICACION");
        }
        
        return conteoSectorRepository.save(conteoSector);
    }

    /**
     * Calcular el progreso real de un conteo de sector
     */
    public void calcularProgresoReal(ConteoSector conteoSector) {
        System.out.println("📊 Calculando progreso real para sector: " + conteoSector.getId());
        
        // Obtener todos los detalles de conteo para este sector
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        
        // Contar productos únicos que aparecen en DetalleConteo (estos son los productos que se están contando)
        Set<Long> productosUnicos = new HashSet<>();
        Set<Long> productosContados = new HashSet<>();
        int productosConDiferencias = 0;
        
        for (DetalleConteo detalle : detalles) {
            Long productoId = detalle.getProducto().getId();
            productosUnicos.add(productoId); // Todos los productos que aparecen en DetalleConteo
            
            boolean usuario1Conto = detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0;
            boolean usuario2Conto = detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0;
            
            if (usuario1Conto || usuario2Conto) {
                productosContados.add(productoId);
                
                // Verificar si hay diferencias entre usuarios
                if (usuario1Conto && usuario2Conto) {
                    if (!detalle.getCantidadConteo1().equals(detalle.getCantidadConteo2())) {
                        productosConDiferencias++;
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
        
        System.out.println("📊 Progreso calculado - Total productos únicos: " + totalProductos + 
                         ", Contados: " + productosContados.size() + 
                         ", Con diferencias: " + productosConDiferencias + 
                         ", Porcentaje: " + String.format("%.1f", porcentaje) + "%");
    }

    /**
     * Determinar el estado específico de un usuario basándose en los DetalleConteo
     */
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
                        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
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
            List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
            
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
                List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
                
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
}