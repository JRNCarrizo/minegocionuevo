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
import java.util.Comparator;

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
     * Obtener detalles de conteo consolidados para todos los usuarios
     */
    public List<DetalleConteo> obtenerDetallesConteoConsolidados(Long conteoSectorId) {
        System.out.println("🔍 Obteniendo detalles consolidados para sector: " + conteoSectorId);
        
        ConteoSector conteoSector = obtenerConteoSectorPorId(conteoSectorId);
        if (conteoSector == null) {
            return new ArrayList<>();
        }

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
            
            // Encontrar las cantidades y fórmulas más recientes para cada usuario
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
            
            // Usar la fecha más reciente de todas
            LocalDateTime fechaMasReciente = fechaMasRecienteUsuario1;
            if (fechaMasRecienteUsuario2 != null && 
                (fechaMasReciente == null || fechaMasRecienteUsuario2.isAfter(fechaMasReciente))) {
                fechaMasReciente = fechaMasRecienteUsuario2;
            }
            detalleConsolidado.setFechaActualizacion(fechaMasReciente);
            
            detallesConsolidados.put(productoId, detalleConsolidado);
            
            System.out.println("🔧 Detalle consolidado para " + primerDetalle.getProducto().getNombre() + 
                             " - Usuario1: " + cantidadMasRecienteUsuario1 + " (" + formulaMasRecienteUsuario1 + ")" +
                             " - Usuario2: " + cantidadMasRecienteUsuario2 + " (" + formulaMasRecienteUsuario2 + ")");
        }
        
        // Retornar todos los detalles consolidados (sin filtrar por usuario)
        List<DetalleConteo> resultado = new ArrayList<>(detallesConsolidados.values());
        resultado.sort(Comparator.comparing(d -> d.getProducto().getNombre()));
        
        System.out.println("✅ Detalles consolidados devueltos: " + resultado.size());
        return resultado;
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
            
            // Encontrar las cantidades y fórmulas más recientes para cada usuario
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
            
            // Usar la fecha más reciente de todas
            LocalDateTime fechaMasReciente = fechaMasRecienteUsuario1;
            if (fechaMasRecienteUsuario2 != null && 
                (fechaMasReciente == null || fechaMasRecienteUsuario2.isAfter(fechaMasReciente))) {
                fechaMasReciente = fechaMasRecienteUsuario2;
            }
            detalleConsolidado.setFechaActualizacion(fechaMasReciente);
            
            detallesConsolidados.put(productoId, detalleConsolidado);
            
            System.out.println("🔧 Detalle consolidado para " + primerDetalle.getProducto().getNombre() + 
                             " - Usuario1: " + cantidadMasRecienteUsuario1 + " (" + formulaMasRecienteUsuario1 + ")" +
                             " - Usuario2: " + cantidadMasRecienteUsuario2 + " (" + formulaMasRecienteUsuario2 + ")");
        }
        
        List<DetalleConteo> detallesFiltrados = new ArrayList<>();
        
        for (DetalleConteo detalle : detallesConsolidados.values()) {
            // En modo reconteo: mostrar TODOS los productos que tienen diferencias
            boolean tieneDiferencias = (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) ||
                                     (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0);
            
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
                    
                    // Filtrar solo conteos iniciales (antes del reconteo)
                    List<DetalleConteo> conteosIniciales = detallesDelProducto.stream()
                        .filter(detalle -> detalle.getFechaActualizacion() != null && detalle.getFechaActualizacion().isBefore(fechaInicioFinal))
                        .collect(java.util.stream.Collectors.toList());
                    
                    // Encontrar el conteo inicial más reciente de cada usuario
                    DetalleConteo conteoInicialMasRecienteUsuario1 = null;
                    DetalleConteo conteoInicialMasRecienteUsuario2 = null;
                    
                    for (DetalleConteo detalle : conteosIniciales) {
                        // Para usuario 1 - encontrar el más reciente
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            if (conteoInicialMasRecienteUsuario1 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 conteoInicialMasRecienteUsuario1.getFechaActualizacion() != null &&
                                 detalle.getFechaActualizacion().isAfter(conteoInicialMasRecienteUsuario1.getFechaActualizacion()))) {
                                conteoInicialMasRecienteUsuario1 = detalle;
                            }
                        }
                        
                        // Para usuario 2 - encontrar el más reciente
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            if (conteoInicialMasRecienteUsuario2 == null || 
                                (detalle.getFechaActualizacion() != null && 
                                 conteoInicialMasRecienteUsuario2.getFechaActualizacion() != null &&
                                 detalle.getFechaActualizacion().isAfter(conteoInicialMasRecienteUsuario2.getFechaActualizacion()))) {
                                conteoInicialMasRecienteUsuario2 = detalle;
                            }
                        }
                    }
                    
                    // Asignar solo los conteos iniciales más recientes
                    if (conteoInicialMasRecienteUsuario1 != null) {
                        detalleConsolidado.setCantidadConteo1(conteoInicialMasRecienteUsuario1.getCantidadConteo1());
                        detalleConsolidado.setFormulaCalculo1(conteoInicialMasRecienteUsuario1.getFormulaCalculo1());
                    }
                    
                    if (conteoInicialMasRecienteUsuario2 != null) {
                        detalleConsolidado.setCantidadConteo2(conteoInicialMasRecienteUsuario2.getCantidadConteo2());
                        detalleConsolidado.setFormulaCalculo2(conteoInicialMasRecienteUsuario2.getFormulaCalculo2());
                    }
                    
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
                    
                    // ✅ LÓGICA CORREGIDA: Para segunda serie, mostrar los valores de la serie anterior
                    // Encontrar los reconteos más recientes de cada usuario (de la serie anterior completa)
                    DetalleConteo reconteoAnteriorMasRecienteUsuario1 = null;
                    DetalleConteo reconteoAnteriorMasRecienteUsuario2 = null;
                    
                    // Ordenar por fecha para procesar desde el más antiguo
                    reconteos.sort(Comparator.comparing(DetalleConteo::getFechaActualizacion));
                    
                    for (DetalleConteo detalle : reconteos) {
                        // Para usuario 1 - encontrar el más reciente de la serie anterior
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                            reconteoAnteriorMasRecienteUsuario1 = detalle;
                        }
                        
                        // Para usuario 2 - encontrar el más reciente de la serie anterior
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                            reconteoAnteriorMasRecienteUsuario2 = detalle;
                        }
                    }
                    
                    // Asignar solo los reconteos anteriores más recientes
                    if (reconteoAnteriorMasRecienteUsuario1 != null) {
                        detalleConsolidado.setCantidadConteo1(reconteoAnteriorMasRecienteUsuario1.getCantidadConteo1());
                        detalleConsolidado.setFormulaCalculo1(reconteoAnteriorMasRecienteUsuario1.getFormulaCalculo1());
                    }
                    
                    if (reconteoAnteriorMasRecienteUsuario2 != null) {
                        detalleConsolidado.setCantidadConteo2(reconteoAnteriorMasRecienteUsuario2.getCantidadConteo2());
                        detalleConsolidado.setFormulaCalculo2(reconteoAnteriorMasRecienteUsuario2.getFormulaCalculo2());
                    }
                    
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
            
            // Solo incluir si tiene conteos (al menos un usuario ha contado)
            if ((detalleConsolidado.getCantidadConteo1() != null && detalleConsolidado.getCantidadConteo1() > 0) ||
                (detalleConsolidado.getCantidadConteo2() != null && detalleConsolidado.getCantidadConteo2() > 0)) {
                detallesConsolidados.add(detalleConsolidado);
            }
        }
        
        System.out.println("✅ Detalles consolidados para reconteo: " + detallesConsolidados.size());
        
        return detallesConsolidados;
    }

    /**
     * Obtener detalles consolidados para comparación de conteos
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
                    for (DetalleConteo detalle : detallesDelProducto) {
                        // Sumar solo conteos iniciales del Usuario 1 (valores >= 100)
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() >= 100) {
                            totalUsuario1 += detalle.getCantidadConteo1();
                            if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                                formulasUsuario1.add(detalle.getFormulaCalculo1());
                            }
                            System.out.println("  ✅ Conteo inicial Usuario1: " + detalle.getCantidadConteo1());
                            hayConteosIniciales = true;
                        }
                        
                        // Sumar solo conteos iniciales del Usuario 2 (valores >= 100)
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() >= 100) {
                            totalUsuario2 += detalle.getCantidadConteo2();
                            if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                                formulasUsuario2.add(detalle.getFormulaCalculo2());
                            }
                            System.out.println("  ✅ Conteo inicial Usuario2: " + detalle.getCantidadConteo2());
                            hayConteosIniciales = true;
                        }
                    }
                    
                    // Si no hay conteos iniciales (valores >= 100), mostrar reconteos anteriores como referencia
                    if (!hayConteosIniciales) {
                        System.out.println("⚠️ No se encontraron conteos iniciales (>= 100), mostrando reconteos anteriores");
                        for (DetalleConteo detalle : detallesDelProducto) {
                            // Sumar reconteos del Usuario 1 (valores < 100)
                            if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0 && detalle.getCantidadConteo1() < 100) {
                                totalUsuario1 += detalle.getCantidadConteo1();
                                if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                                    formulasUsuario1.add(detalle.getFormulaCalculo1());
                                }
                                System.out.println("  ✅ Reconteo anterior Usuario1: " + detalle.getCantidadConteo1());
                            }
                            
                            // Sumar reconteos del Usuario 2 (valores < 100)
                            if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0 && detalle.getCantidadConteo2() < 100) {
                                totalUsuario2 += detalle.getCantidadConteo2();
                                if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                                    formulasUsuario2.add(detalle.getFormulaCalculo2());
                                }
                                System.out.println("  ✅ Reconteo anterior Usuario2: " + detalle.getCantidadConteo2());
                            }
                        }
                    }
                } else {
                    // ✅ SEGUNDA SERIE O POSTERIOR: Mostrar reconteos anteriores (valores < 100)
                    System.out.println("🔍 SERIE POSTERIOR RECONTEO: Mostrando reconteos anteriores como referencia");
                    
                    for (DetalleConteo detalle : detallesDelProducto) {
                        // Sumar solo reconteos del Usuario 1 (valores < 100)
                        if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() < 100) {
                            totalUsuario1 += detalle.getCantidadConteo1();
                            if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().isEmpty()) {
                                formulasUsuario1.add(detalle.getFormulaCalculo1());
                            }
                            System.out.println("  ✅ Reconteo anterior Usuario1: " + detalle.getCantidadConteo1());
                        }
                        
                        // Sumar solo reconteos del Usuario 2 (valores < 100)
                        if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() < 100) {
                            totalUsuario2 += detalle.getCantidadConteo2();
                            if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().isEmpty()) {
                                formulasUsuario2.add(detalle.getFormulaCalculo2());
                            }
                            System.out.println("  ✅ Reconteo anterior Usuario2: " + detalle.getCantidadConteo2());
                        }
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
            List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
            
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
        
        // Asignar cantidad según el usuario (lógica original - el sistema ya permite múltiples conteos)
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
     * Agregar producto al reconteo (reemplaza cantidad existente)
     */
    public DetalleConteo agregarProductoAlReconteo(Long conteoSectorId, Long productoId, Integer cantidad, String formulaCalculo, Long usuarioId) {
        System.out.println("🔄 RECONTEO: Agregando producto - sector: " + conteoSectorId + ", producto: " + productoId + ", cantidad: " + cantidad);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el producto existe
        productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
            !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // Buscar entrada existente del usuario para este producto
        List<DetalleConteo> detallesExistentes = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        System.out.println("🔍 RECONTEO DEBUG: Total detalles existentes: " + detallesExistentes.size());
        System.out.println("🔍 RECONTEO DEBUG: Buscando producto ID: " + productoId + " para usuario: " + usuarioId);
        
        // Encontrar la entrada del producto para reconteo (cualquier entrada existente del producto)
        DetalleConteo entradaExistente = null;
        
        // Debug de usuarios asignados
        System.out.println("🔍 RECONTEO DEBUG: Usuario solicitante ID: " + usuarioId);
        System.out.println("🔍 RECONTEO DEBUG: Usuario Asignado 1 ID: " + (conteoSector.getUsuarioAsignado1() != null ? conteoSector.getUsuarioAsignado1().getId() : "null"));
        System.out.println("🔍 RECONTEO DEBUG: Usuario Asignado 2 ID: " + (conteoSector.getUsuarioAsignado2() != null ? conteoSector.getUsuarioAsignado2().getId() : "null"));
        
        for (DetalleConteo det : detallesExistentes) {
            System.out.println("🔍 RECONTEO DEBUG: Revisando detalle ID: " + det.getId() + 
                             ", Producto ID: " + det.getProducto().getId() + 
                             ", Cantidad1: " + det.getCantidadConteo1() + 
                             ", Cantidad2: " + det.getCantidadConteo2());
            
            if (det.getProducto().getId().equals(productoId)) {
                System.out.println("🔍 RECONTEO DEBUG: Producto coincide, usando esta entrada para reconteo");
                entradaExistente = det;
                System.out.println("✅ RECONTEO DEBUG: Entrada encontrada para reconteo - ID: " + det.getId());
                break; // Usar la primera entrada encontrada del producto
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
        
        // ✅ RECALCULAR PROGRESO DEL SECTOR después de cambiar el estado
        System.out.println("🔄 Recalculando progreso del sector después de finalizar...");
        calcularProgresoReal(conteoSectorGuardado);
        conteoSectorGuardado = conteoSectorRepository.save(conteoSectorGuardado);
        
        // Actualizar estadísticas del inventario
        InventarioCompleto inventario = conteoSectorGuardado.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        System.out.println("✅ Estado final del sector: " + conteoSectorGuardado.getEstado());
        return conteoSectorGuardado;
    }

    /**
     * Verificar si hay diferencias entre los conteos de ambos usuarios
     */
    private boolean verificarDiferenciasEnConteo(ConteoSector conteoSector) {
        System.out.println("🔍 Verificando diferencias en conteo sector: " + conteoSector.getId());
        System.out.println("🔍 Estado actual del sector: " + conteoSector.getEstado());
        System.out.println("🔍 Observaciones del sector: " + conteoSector.getObservaciones());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("🔍 Total detalles encontrados para verificación: " + detalles.size());
        
        // ✅ DETECTAR SI ESTAMOS EN MODO RECONTEO
        boolean esReconteo = conteoSector.getObservaciones() != null && 
                            (conteoSector.getObservaciones().startsWith("Reconteo_") || 
                             conteoSector.getObservaciones().contains("Reconteo_Usuario") ||
                             conteoSector.getObservaciones().contains("Usuario1_Finalizado") ||
                             conteoSector.getObservaciones().contains("Usuario2_Finalizado"));
        
        System.out.println("🔍 Es modo reconteo: " + esReconteo);
        System.out.println("🔍 Observaciones para detección: '" + conteoSector.getObservaciones() + "'");
        
        // Consolidar conteos por producto
        Map<Long, Integer> totalesUsuario1 = new HashMap<>();
        Map<Long, Integer> totalesUsuario2 = new HashMap<>();
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
            
            System.out.println("🔍 Procesando detalle ID: " + detalle.getId() + 
                             ", Producto: " + nombreProducto + 
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2() + 
                             ", Eliminado: " + detalle.getEliminado());
            
            // ✅ LÓGICA CORREGIDA: En reconteo, solo sumar valores del reconteo (< 100)
            if (esReconteo) {
                // Solo sumar reconteos del Usuario 1 (valores < 100)
                if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0 && detalle.getCantidadConteo1() < 100) {
                    totalesUsuario1.put(productoId, totalesUsuario1.getOrDefault(productoId, 0) + detalle.getCantidadConteo1());
                    System.out.println("🔍 RECONTEO - Producto " + nombreProducto + " - Usuario 1 reconteo: +" + detalle.getCantidadConteo1() + 
                                     " (total reconteo: " + totalesUsuario1.get(productoId) + ")");
                }
                
                // Solo sumar reconteos del Usuario 2 (valores < 100)
                if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0 && detalle.getCantidadConteo2() < 100) {
                    totalesUsuario2.put(productoId, totalesUsuario2.getOrDefault(productoId, 0) + detalle.getCantidadConteo2());
                    System.out.println("🔍 RECONTEO - Producto " + nombreProducto + " - Usuario 2 reconteo: +" + detalle.getCantidadConteo2() + 
                                     " (total reconteo: " + totalesUsuario2.get(productoId) + ")");
                }
            } else {
                // ✅ MODO CONTEO NORMAL: Sumar todos los valores
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
                    String modo = esReconteo ? "RECONTEO" : "CONTEO NORMAL";
                    System.out.println("⚠️ Diferencia encontrada en " + modo + " - producto: " + nombreProducto + 
                                     " - Usuario 1: " + total1 + ", Usuario 2: " + total2);
                    return true;
                }
            }
            
            // Si solo uno de los usuarios contó el producto, también es una diferencia
            if ((total1 > 0 && total2 == 0) || (total2 > 0 && total1 == 0)) {
                String modo = esReconteo ? "RECONTEO" : "CONTEO NORMAL";
                System.out.println("⚠️ Diferencia encontrada en " + modo + ": solo un usuario contó " + nombreProducto + 
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
        System.out.println("🔍 Finalizando reconteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
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
            
            // ✅ NUEVA LÓGICA: SIEMPRE reemplazar conteos iniciales con reconteos cuando ambos recontaron
            if (esReconteo) {
                System.out.println("🔄 RECONTEO: Reemplazando conteos iniciales con reconteos...");
                reemplazarConteosInicialesConReconteos(conteoSector);
            }
            
            // Comparar conteos de ambos usuarios (ahora ya son los reconteos)
            boolean hayDiferencias = verificarDiferenciasEnConteo(conteoSector);
                
                if (hayDiferencias) {
                // Hay diferencias, ir a estado CON_DIFERENCIAS para nuevo reconteo
                    conteoSector.setEstado(ConteoSector.EstadoConteo.CON_DIFERENCIAS);
                if (esReconteo) {
                    conteoSector.setObservaciones("Reconteo_" + LocalDateTime.now().toString()); // Marcar nuevo reconteo
                    System.out.println("⚠️ Diferencias persisten después del reconteo, iniciando nuevo reconteo");
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
        
        ConteoSector conteoSectorGuardado = conteoSectorRepository.save(conteoSector);
        
        // ✅ RECALCULAR PROGRESO DEL SECTOR después de cambiar el estado
        System.out.println("🔄 Recalculando progreso del sector después de finalizar reconteo...");
        calcularProgresoReal(conteoSectorGuardado);
        conteoSectorGuardado = conteoSectorRepository.save(conteoSectorGuardado);
        
        // Actualizar estadísticas del inventario completo
        InventarioCompleto inventario = conteoSectorGuardado.getInventarioCompleto();
        inventario.calcularEstadisticas();
        inventarioCompletoRepository.save(inventario);
        
        System.out.println("✅ Estado final del sector (reconteo): " + conteoSectorGuardado.getEstado());
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
        
        // Calcular totales consolidados y detectar diferencias por producto
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetalleConteo> detallesDelProducto = entry.getValue();
            
            // Sumar todas las cantidades de cada usuario para este producto
            int totalUsuario1 = 0;
            int totalUsuario2 = 0;
            boolean usuario1Conto = false;
            boolean usuario2Conto = false;
            
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
        boolean estaEnReconteo = conteoSector.getObservaciones() != null && 
                                (conteoSector.getObservaciones().contains("Usuario1_Finalizado") ||
                                 conteoSector.getObservaciones().contains("Usuario2_Finalizado") ||
                                 conteoSector.getObservaciones().startsWith("Reconteo_"));
        
        // ✅ NO CAMBIAR ESTADO si ya está COMPLETADO o si está ESPERANDO_VERIFICACION
        boolean estadoYaFinalizado = conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO ||
                                    conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION;
        
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS && 
            productosConDiferencias == 0 && 
            productosContados.size() == totalProductos &&
            !estaEnReconteo && 
            !estadoYaFinalizado) { // ✅ NO ejecutar si el estado ya está finalizado
            
            // 🔍 VERIFICACIÓN CORREGIDA: Usar el método correcto para verificar diferencias en cantidades
            boolean hayDiferenciasEnCantidades = verificarDiferenciasEnConteo(conteoSector);
            
            if (!hayDiferenciasEnCantidades) {
                System.out.println("🎉 ¡No hay diferencias en las cantidades! Completando automáticamente el sector: " + conteoSector.getId());
                
                // Cambiar estado a COMPLETADO
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                conteoSector.setFechaFinalizacion(LocalDateTime.now());
                
                // Limpiar observaciones de reconteo
                if (conteoSector.getObservaciones() != null && 
                    conteoSector.getObservaciones().startsWith("Reconteo_")) {
                    conteoSector.setObservaciones("Reconteo completado automáticamente - Sin diferencias");
                }
                
                System.out.println("✅ Sector completado automáticamente - Estado: " + conteoSector.getEstado());
            } else {
                System.out.println("⚠️ Hay diferencias en las cantidades, manteniendo estado CON_DIFERENCIAS");
            }
        } else if (estaEnReconteo) {
            System.out.println("⚠️ Sector en reconteo, NO completando automáticamente hasta que ambos usuarios recontaran");
        } else if (estadoYaFinalizado) {
            System.out.println("⚠️ Estado ya finalizado (" + conteoSector.getEstado() + "), NO modificando estado automáticamente");
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
}