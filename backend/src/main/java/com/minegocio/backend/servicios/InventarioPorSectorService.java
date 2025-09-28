package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventarioPorSectorService {

    @Autowired
    private InventarioPorSectorRepository inventarioPorSectorRepository;

    @Autowired
    private DetalleConteoRepository detalleConteoRepository;

    @Autowired
    private SectorRepository sectorRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    /**
     * Crear un nuevo inventario por sector
     */
    @Transactional
    public InventarioPorSector crearInventarioPorSector(Long empresaId, Long sectorId, Long usuarioAdminId) {
        System.out.println("🔍 InventarioPorSectorService.crearInventarioPorSector - Iniciando...");
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Sector sector = sectorRepository.findById(sectorId)
                .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        Usuario usuarioAdmin = usuarioRepository.findById(usuarioAdminId)
                .orElseThrow(() -> new RuntimeException("Usuario administrador no encontrado"));

        // Verificar que no existe un inventario activo para este sector
        Optional<InventarioPorSector> inventarioActivo = inventarioPorSectorRepository
                .findInventarioActivoByEmpresaAndSector(empresa, sector);
        
        if (inventarioActivo.isPresent()) {
            throw new RuntimeException("Ya existe un inventario en progreso para este sector");
        }

        // Crear el inventario por sector
        InventarioPorSector inventario = new InventarioPorSector(empresa, sector, usuarioAdmin);
        inventario.setEstado(InventarioPorSector.EstadoInventario.EN_PROGRESO);
        
        // Contar productos en el sector
        List<Producto> productosEnSector = productoRepository.findByEmpresaIdAndSectorAlmacenamientoAndActivo(
                empresaId, sector.getNombre(), true);
        inventario.setTotalProductos(productosEnSector.size());
        inventario.setProductosContados(0);
        inventario.setProductosConDiferencias(0);
        inventario.setIntentosReconteo(0);
        inventario.setPorcentajeCompletado(0.0);

        InventarioPorSector inventarioGuardado = inventarioPorSectorRepository.save(inventario);
        System.out.println("✅ Inventario por sector creado con ID: " + inventarioGuardado.getId());

        return inventarioGuardado;
    }

    /**
     * Asignar usuarios a un inventario por sector
     */
    @Transactional
    public InventarioPorSector asignarUsuariosAInventario(Long inventarioId, Long usuario1Id, Long usuario2Id) {
        System.out.println("🔍 Asignando usuarios al inventario por sector: " + inventarioId);
        
        InventarioPorSector inventario = inventarioPorSectorRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario por sector no encontrado"));

        Usuario usuario1 = usuarioRepository.findById(usuario1Id)
                .orElseThrow(() -> new RuntimeException("Usuario 1 no encontrado"));
        
        Usuario usuario2 = usuarioRepository.findById(usuario2Id)
                .orElseThrow(() -> new RuntimeException("Usuario 2 no encontrado"));

        // Verificar que los usuarios son de tipo ASIGNADO
        if (usuario1.getRol() != Usuario.RolUsuario.ASIGNADO) {
            throw new RuntimeException("El usuario 1 debe ser de tipo ASIGNADO");
        }
        
        if (usuario2.getRol() != Usuario.RolUsuario.ASIGNADO) {
            throw new RuntimeException("El usuario 2 debe ser de tipo ASIGNADO");
        }

        // Verificar que pertenecen a la misma empresa
        if (!usuario1.getEmpresa().getId().equals(usuario2.getEmpresa().getId()) ||
            !usuario1.getEmpresa().getId().equals(inventario.getEmpresa().getId())) {
            throw new RuntimeException("Los usuarios deben pertenecer a la misma empresa del inventario");
        }

        inventario.setUsuarioAsignado1(usuario1);
        inventario.setUsuarioAsignado2(usuario2);
        inventario.setEstado(InventarioPorSector.EstadoInventario.PENDIENTE);

        return inventarioPorSectorRepository.save(inventario);
    }

    /**
     * Iniciar conteo de un inventario por sector
     */
    @Transactional
    public InventarioPorSector iniciarConteoInventario(Long inventarioId, Long usuarioId) {
        System.out.println("🔍 Iniciando conteo de inventario por sector: " + inventarioId + " por usuario: " + usuarioId);
        
        InventarioPorSector inventario = inventarioPorSectorRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario por sector no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario está asignado a este inventario
        if (!inventario.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !inventario.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este inventario");
        }

        if (inventario.getEstado() != InventarioPorSector.EstadoInventario.PENDIENTE) {
            throw new RuntimeException("El inventario no está en estado PENDIENTE");
        }

        inventario.setEstado(InventarioPorSector.EstadoInventario.EN_PROGRESO);
        inventario.setFechaActualizacion(LocalDateTime.now());

        return inventarioPorSectorRepository.save(inventario);
    }

    /**
     * Agregar producto al conteo
     */
    @Transactional
    public DetalleConteo agregarProductoAlConteo(Long inventarioId, Long productoId, Integer cantidad, 
                                                String formulaCalculo, Long usuarioId) {
        System.out.println("🔍 Agregando producto al conteo: " + productoId + " cantidad: " + cantidad);
        
        InventarioPorSector inventario = inventarioPorSectorRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario por sector no encontrado"));

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario está asignado a este inventario
        if (!inventario.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !inventario.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este inventario");
        }

        // Buscar si ya existe un detalle para este producto
        Optional<DetalleConteo> detalleExistente = detalleConteoRepository
                .findByInventarioPorSectorAndProducto(inventario, producto);

        DetalleConteo detalle;
        boolean esUsuario1 = inventario.getUsuarioAsignado1().getId().equals(usuarioId);

        if (detalleExistente.isPresent()) {
            detalle = detalleExistente.get();
            
            if (esUsuario1) {
                detalle.setCantidadConteo1(cantidad);
                detalle.setFormulaCalculo1(formulaCalculo);
                detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_1);
            } else {
                detalle.setCantidadConteo2(cantidad);
                detalle.setFormulaCalculo2(formulaCalculo);
                detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_2);
            }
        } else {
            detalle = new DetalleConteo(inventario, producto);
            
            if (esUsuario1) {
                detalle.setCantidadConteo1(cantidad);
                detalle.setFormulaCalculo1(formulaCalculo);
                detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_1);
            } else {
                detalle.setCantidadConteo2(cantidad);
                detalle.setFormulaCalculo2(formulaCalculo);
                detalle.setEstado(DetalleConteo.EstadoDetalle.CONTADO_2);
            }
        }

        // Calcular diferencias
        calcularDiferencias(detalle);

        DetalleConteo detalleGuardado = detalleConteoRepository.save(detalle);
        
        // Actualizar estadísticas del inventario
        actualizarEstadisticasInventario(inventario);

        return detalleGuardado;
    }

    /**
     * Finalizar conteo de un inventario por sector
     */
    @Transactional
    public InventarioPorSector finalizarConteoInventario(Long inventarioId, Long usuarioId) {
        System.out.println("🔍 Finalizando conteo de inventario por sector: " + inventarioId);
        
        InventarioPorSector inventario = inventarioPorSectorRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Inventario por sector no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar que el usuario está asignado a este inventario
        if (!inventario.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !inventario.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este inventario");
        }

        // Verificar que ambos usuarios han completado su conteo (solo no eliminados)
        List<DetalleConteo> detalles = detalleConteoRepository.findByInventarioPorSectorAndEliminadoFalseOrderByProductoNombre(inventario);
        
        boolean usuario1Completo = detalles.stream().allMatch(d -> d.getCantidadConteo1() != null && d.getCantidadConteo1() >= 0);
        boolean usuario2Completo = detalles.stream().allMatch(d -> d.getCantidadConteo2() != null && d.getCantidadConteo2() >= 0);

        if (!usuario1Completo || !usuario2Completo) {
            throw new RuntimeException("Ambos usuarios deben completar su conteo antes de finalizar");
        }

        // Verificar diferencias entre conteos
        List<DetalleConteo> detallesConDiferencias = detalleConteoRepository
                .findDetallesConDiferenciasPorInventario(inventario);

        if (!detallesConDiferencias.isEmpty()) {
            inventario.setEstado(InventarioPorSector.EstadoInventario.CON_DIFERENCIAS);
            inventario.setIntentosReconteo(inventario.getIntentosReconteo() + 1);
            inventario.setProductosConDiferencias(detallesConDiferencias.size());
            
            // Marcar detalles con diferencias para reconteo
            for (DetalleConteo detalle : detallesConDiferencias) {
                detalle.setEstado(DetalleConteo.EstadoDetalle.CON_DIFERENCIAS);
                detalleConteoRepository.save(detalle);
            }
        } else {
            inventario.setEstado(InventarioPorSector.EstadoInventario.COMPLETADO);
            inventario.setFechaFinalizacion(LocalDateTime.now());
            inventario.setProductosConDiferencias(0);
        }

        // Actualizar estadísticas
        actualizarEstadisticasInventario(inventario);

        return inventarioPorSectorRepository.save(inventario);
    }

    /**
     * Obtener inventario por sector por ID
     */
    public Optional<InventarioPorSector> obtenerInventarioPorSector(Long id) {
        return inventarioPorSectorRepository.findById(id);
    }

    /**
     * Obtener inventarios por sector por empresa
     */
    public List<InventarioPorSector> obtenerInventariosPorSectorPorEmpresa(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return inventarioPorSectorRepository.findByEmpresaOrderByFechaInicioDesc(empresa);
    }

    /**
     * Obtener inventarios asignados a un usuario
     */
    public List<InventarioPorSector> obtenerInventariosAsignadosAUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return inventarioPorSectorRepository.findInventariosAsignadosAUsuario(usuario);
    }

    /**
     * Calcular diferencias en un detalle de conteo
     */
    private void calcularDiferencias(DetalleConteo detalle) {
        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo2() != null) {
            // Diferencia entre los dos conteos
            detalle.setDiferenciaEntreConteos(detalle.getCantidadConteo2() - detalle.getCantidadConteo1());
            
            // Cantidad final (promedio o el que tenga menos diferencia con el sistema)
            int dif1 = Math.abs(detalle.getCantidadConteo1() - detalle.getStockSistema());
            int dif2 = Math.abs(detalle.getCantidadConteo2() - detalle.getStockSistema());
            
            if (dif1 <= dif2) {
                detalle.setCantidadFinal(detalle.getCantidadConteo1());
            } else {
                detalle.setCantidadFinal(detalle.getCantidadConteo2());
            }
            
            // Diferencia con el sistema
            detalle.setDiferenciaSistema(detalle.getCantidadFinal() - detalle.getStockSistema());
            
            // Valor de la diferencia
            if (detalle.getPrecioUnitario() != null) {
                detalle.setValorDiferencia(detalle.getPrecioUnitario().multiply(
                    java.math.BigDecimal.valueOf(detalle.getDiferenciaSistema())));
            }
        }
    }

    /**
     * Actualizar estadísticas del inventario
     */
    private void actualizarEstadisticasInventario(InventarioPorSector inventario) {
        // Solo obtener detalles que NO están eliminados
        List<DetalleConteo> detalles = detalleConteoRepository.findByInventarioPorSectorAndEliminadoFalseOrderByProductoNombre(inventario);
        
        int productosContados = (int) detalles.stream()
                .filter(d -> d.getCantidadConteo1() != null && d.getCantidadConteo2() != null)
                .count();
        
        int productosConDiferencias = (int) detalles.stream()
                .filter(d -> d.getDiferenciaEntreConteos() != null && d.getDiferenciaEntreConteos() != 0)
                .count();
        
        inventario.setProductosContados(productosContados);
        inventario.setProductosConDiferencias(productosConDiferencias);
        
        if (inventario.getTotalProductos() > 0) {
            inventario.setPorcentajeCompletado((double) productosContados / inventario.getTotalProductos() * 100);
        }
    }
}
