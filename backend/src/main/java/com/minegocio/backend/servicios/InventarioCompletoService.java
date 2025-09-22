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
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo1());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo1() != null ? detalle.getFormulaCalculo1() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaCreacion());
                    conteosUsuario1.add(conteoIndividual);
                }
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                    Map<String, Object> conteoIndividual = new HashMap<>();
                    conteoIndividual.put("cantidad", detalle.getCantidadConteo2());
                    conteoIndividual.put("formula", detalle.getFormulaCalculo2() != null ? detalle.getFormulaCalculo2() : "Sin fórmula");
                    conteoIndividual.put("fecha", detalle.getFechaCreacion());
                    conteosUsuario2.add(conteoIndividual);
                }
            }
            
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
            System.out.println("  - ID: " + inventarioActivo.get().getId() + ", Estado: " + inventarioActivo.get().getEstado());
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
        
        // Buscar el conteo de sector
        ConteoSector conteoSector = conteoSectorRepository.findByInventarioCompletoAndSector(inventario, sector)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
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
        
        return conteoSectorRepository.save(conteoSector);
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
        
        // Siempre crear un nuevo detalle para permitir múltiples conteos del mismo producto
        // Esto permite rastrear cada conteo individual con su fórmula
        DetalleConteo detalle = new DetalleConteo();
        detalle.setConteoSector(conteoSector);
        detalle.setProducto(producto);
        detalle.setCodigoProducto(producto.getCodigoPersonalizado());
        detalle.setNombreProducto(producto.getNombre());
        detalle.setStockSistema(producto.getStock());
        detalle.setPrecioUnitario(producto.getPrecio());
        
        // Asignar cantidad según el usuario
        if (conteoSector.getUsuarioAsignado1().getId().equals(usuarioId)) {
            detalle.setCantidadConteo1(cantidad);
            detalle.setFormulaCalculo1(formulaCalculo);
            // Para el usuario 2, dejar en null para este conteo específico
            detalle.setCantidadConteo2(null);
            detalle.setFormulaCalculo2(null);
        } else {
            // Para el usuario 1, dejar en null para este conteo específico
            detalle.setCantidadConteo1(null);
            detalle.setFormulaCalculo1(null);
            detalle.setCantidadConteo2(cantidad);
            detalle.setFormulaCalculo2(formulaCalculo);
        }
        
        // Guardar el detalle
        detalle = detalleConteoRepository.save(detalle);
        
        // NO cambiar el estado general del conteo sector
        // El estado se mantiene como PENDIENTE hasta que se finalice el conteo
        // Los estados por usuario se determinan individualmente basándose en los DetalleConteo
        
        System.out.println("✅ Producto agregado al conteo por usuario " + usuarioId);
        System.out.println("ℹ️ Estado general del conteo sector se mantiene como: " + conteoSector.getEstado());
        
        return detalle;
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
    public ConteoSector finalizarConteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 Finalizando conteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        boolean esUsuario1 = conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        boolean esUsuario2 = conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        
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
        
        return conteoSectorRepository.save(conteoSector);
    }

    /**
     * Verificar si hay diferencias entre los conteos de ambos usuarios
     */
    private boolean verificarDiferenciasEnConteo(ConteoSector conteoSector) {
        System.out.println("🔍 Verificando diferencias en conteo sector: " + conteoSector.getId());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
        
        for (DetalleConteo detalle : detalles) {
            Integer cantidad1 = detalle.getCantidadConteo1();
            Integer cantidad2 = detalle.getCantidadConteo2();
            
            // Si ambos usuarios contaron el mismo producto, comparar cantidades
            if (cantidad1 != null && cantidad2 != null && cantidad1 > 0 && cantidad2 > 0) {
                if (!cantidad1.equals(cantidad2)) {
                    System.out.println("⚠️ Diferencia encontrada en producto: " + detalle.getProducto().getNombre() + 
                                     " - Usuario 1: " + cantidad1 + ", Usuario 2: " + cantidad2);
                    return true;
                }
            }
            
            // Si solo uno de los usuarios contó el producto, también es una diferencia
            if ((cantidad1 != null && cantidad1 > 0 && (cantidad2 == null || cantidad2 == 0)) ||
                (cantidad2 != null && cantidad2 > 0 && (cantidad1 == null || cantidad1 == 0))) {
                System.out.println("⚠️ Diferencia encontrada: solo un usuario contó " + detalle.getProducto().getNombre());
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
     * Determinar el estado específico de un usuario basándose en los DetalleConteo
     */
    public ConteoSector.EstadoConteo determinarEstadoUsuario(ConteoSector conteoSector, Long usuarioId) {
        System.out.println("🔍 Determinando estado para usuario: " + usuarioId + " en sector: " + conteoSector.getId());
        
        // Si el conteo está en estados finales, retornar el estado general
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO ||
            conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS) {
            return conteoSector.getEstado();
        }
        
        // Si está esperando verificación, determinar el estado específico del usuario
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            boolean esUsuario1 = conteoSector.getUsuarioAsignado1() != null && 
                                conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
            boolean esUsuario2 = conteoSector.getUsuarioAsignado2() != null && 
                                conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
            
            if (esUsuario1 || esUsuario2) {
                // Verificar qué usuario finalizó basándose en las observaciones
                String observaciones = conteoSector.getObservaciones();
                boolean esElUsuarioQueFinalizo = false;
                
                if (esUsuario1 && "Usuario1_Finalizado".equals(observaciones)) {
                    esElUsuarioQueFinalizo = true;
                } else if (esUsuario2 && "Usuario2_Finalizado".equals(observaciones)) {
                    esElUsuarioQueFinalizo = true;
                }
                
                if (esElUsuarioQueFinalizo) {
                    // El usuario que finalizó está esperando verificación
                    System.out.println("⏳ Usuario " + usuarioId + " finalizó, esperando verificación");
                    return ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION;
                } else {
                    // El usuario que no ha finalizado, determinar si ha contado algo
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