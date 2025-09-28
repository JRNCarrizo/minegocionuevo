package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.ReconteoDetalleRepository;
import com.minegocio.backend.repositorios.ConteoSectorRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.DetalleConteoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ReconteoService {

    @Autowired
    private ReconteoDetalleRepository reconteoDetalleRepository;

    @Autowired
    private ConteoSectorRepository conteoSectorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private DetalleConteoRepository detalleConteoRepository;

    /**
     * Guardar reconteo de un usuario para un producto específico
     */
    @Transactional
    public ReconteoDetalle guardarReconteo(Long conteoSectorId, Long usuarioId, Long productoId, 
                                          Integer cantidad, String formulaCalculo) {
        
        System.out.println("🔄 [RECONTEO] Guardando reconteo:");
        System.out.println("  - ConteoSectorId: " + conteoSectorId);
        System.out.println("  - UsuarioId: " + usuarioId);
        System.out.println("  - ProductoId: " + productoId);
        System.out.println("  - Cantidad: " + cantidad);
        System.out.println("  - Formula: " + formulaCalculo);

        // Obtener entidades
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
                .orElseThrow(() -> new RuntimeException("Conteo sector no encontrado"));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Producto producto = new Producto();
        producto.setId(productoId);

        // Determinar número de reconteo actual
        Integer numeroReconteo = obtenerNumeroReconteoActual(conteoSectorId);
        System.out.println("  - Número reconteo: " + numeroReconteo);

        // Buscar reconteo existente
        Optional<ReconteoDetalle> reconteoExistente = reconteoDetalleRepository
                .findByUsuarioIdAndConteoSectorIdAndProductoIdAndNumeroReconteoAndEliminadoFalse(
                        usuarioId, conteoSectorId, productoId, numeroReconteo);

        ReconteoDetalle reconteo;
        if (reconteoExistente.isPresent()) {
            // Actualizar reconteo existente
            reconteo = reconteoExistente.get();
            reconteo.setCantidadReconteo(cantidad);
            reconteo.setFormulaCalculo(formulaCalculo);
            System.out.println("  - Actualizando reconteo existente ID: " + reconteo.getId());
        } else {
            // Crear nuevo reconteo
            reconteo = new ReconteoDetalle(conteoSector, producto, usuario, numeroReconteo);
            reconteo.setCantidadReconteo(cantidad);
            reconteo.setFormulaCalculo(formulaCalculo);
            System.out.println("  - Creando nuevo reconteo");
        }

        ReconteoDetalle reconteoGuardado = reconteoDetalleRepository.save(reconteo);
        System.out.println("✅ [RECONTEO] Reconteo guardado con ID: " + reconteoGuardado.getId());
        
        return reconteoGuardado;
    }

    /**
     * Obtener el número de reconteo actual para un sector
     */
    public Integer obtenerNumeroReconteoActual(Long conteoSectorId) {
        Integer maxReconteo = reconteoDetalleRepository.findMaxNumeroReconteoByConteoSectorId(conteoSectorId);
        return maxReconteo + 1;
    }

    /**
     * Obtener reconteos para comparación
     */
    public List<Map<String, Object>> obtenerReconteosParaComparacion(Long conteoSectorId, Integer numeroReconteo) {
        System.out.println("🔍 [RECONTEO] Obteniendo reconteos para comparación:");
        System.out.println("  - ConteoSectorId: " + conteoSectorId);
        System.out.println("  - Número reconteo: " + numeroReconteo);

        List<ReconteoDetalle> reconteos = reconteoDetalleRepository
                .findByConteoSectorIdAndNumeroReconteoAndEliminadoFalse(conteoSectorId, numeroReconteo);

        System.out.println("  - Reconteos encontrados: " + reconteos.size());

        // Agrupar por producto
        Map<Long, Map<String, Object>> productosReconteo = new HashMap<>();

        for (ReconteoDetalle reconteo : reconteos) {
            Long productoId = reconteo.getProducto().getId();
            
            if (!productosReconteo.containsKey(productoId)) {
                Map<String, Object> productoData = new HashMap<>();
                productoData.put("productoId", productoId);
                
                // ✅ CORRECCIÓN: Crear DTO simple en lugar de devolver entidad Hibernate
                Producto producto = reconteo.getProducto();
                Map<String, Object> productoDto = new HashMap<>();
                productoDto.put("id", producto.getId());
                productoDto.put("nombre", producto.getNombre());
                productoDto.put("codigoPersonalizado", producto.getCodigoPersonalizado());
                productoDto.put("stock", producto.getStock());
                productoDto.put("categoria", producto.getCategoria());
                productoDto.put("marca", producto.getMarca());
                productoDto.put("precio", producto.getPrecio());
                
                productoData.put("producto", productoDto);
                productosReconteo.put(productoId, productoData);
            }

            Map<String, Object> productoData = productosReconteo.get(productoId);
            
            // Determinar si es usuario 1 o 2 basado en el ID del usuario
            ConteoSector conteoSector = reconteo.getConteoSector();
            if (conteoSector.getUsuarioAsignado1() != null && 
                reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado1().getId())) {
                productoData.put("cantidadReconteo1", reconteo.getCantidadReconteo());
                productoData.put("formulaReconteo1", reconteo.getFormulaCalculo());
                productoData.put("fechaReconteo1", reconteo.getFechaActualizacion());
            } else if (conteoSector.getUsuarioAsignado2() != null && 
                       reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado2().getId())) {
                productoData.put("cantidadReconteo2", reconteo.getCantidadReconteo());
                productoData.put("formulaReconteo2", reconteo.getFormulaCalculo());
                productoData.put("fechaReconteo2", reconteo.getFechaActualizacion());
            }
        }

        // Calcular diferencias
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map<String, Object> productoData : productosReconteo.values()) {
            Integer cantidad1 = (Integer) productoData.get("cantidadReconteo1");
            Integer cantidad2 = (Integer) productoData.get("cantidadReconteo2");
            
            if (cantidad1 != null && cantidad2 != null) {
                int diferencia = cantidad2 - cantidad1;
                productoData.put("diferenciaReconteo", diferencia);
                System.out.println("  - Producto " + productoData.get("productoId") + 
                                 ": Usuario1=" + cantidad1 + ", Usuario2=" + cantidad2 + 
                                 ", Diferencia=" + diferencia);
            }
            
            resultado.add(productoData);
        }

        System.out.println("✅ [RECONTEO] Productos procesados: " + resultado.size());
        return resultado;
    }

    /**
     * Verificar si ambos usuarios han completado el reconteo
     */
    public boolean ambosUsuariosCompletaronReconteo(Long conteoSectorId, Integer numeroReconteo) {
        Long usuariosCompletados = reconteoDetalleRepository
                .countUsuariosReconteoBySectorAndNumero(conteoSectorId, numeroReconteo);
        
        System.out.println("🔍 [RECONTEO] Usuarios que completaron reconteo " + numeroReconteo + ": " + usuariosCompletados);
        return usuariosCompletados >= 2;
    }

    /**
     * Obtener datos de referencia para mostrar durante reconteo
     */
    public List<Map<String, Object>> obtenerDatosReferenciaReconteo(Long conteoSectorId) {
        System.out.println("📋 [RECONTEO] Obteniendo datos de referencia para reconteo");
        System.out.println("  - ConteoSectorId recibido: " + conteoSectorId);
        
        // Verificar que el conteo sector existe
        if (!conteoSectorRepository.existsById(conteoSectorId)) {
            System.out.println("❌ [RECONTEO] Conteo sector no encontrado: " + conteoSectorId);
            throw new RuntimeException("Conteo sector no encontrado");
        }
        System.out.println("✅ [RECONTEO] Conteo sector existe: " + conteoSectorId);
        
        // ✅ CORRECCIÓN: Siempre obtener datos del conteo original con diferencias
        // El reconteo siempre se basa en los productos que tuvieron diferencias en el conteo original
        System.out.println("  - Obteniendo productos con diferencias del conteo original");
        List<Map<String, Object>> datosReferencia = obtenerProductosConDiferencias(conteoSectorId);
        System.out.println("  - Productos con diferencias encontrados: " + datosReferencia.size());
        
        System.out.println("✅ [RECONTEO] Datos de referencia obtenidos: " + datosReferencia.size() + " productos");
        return datosReferencia;
    }
    
    /**
     * Obtener productos con diferencias del conteo original (simplificado)
     */
    private List<Map<String, Object>> obtenerProductosConDiferencias(Long conteoSectorId) {
        System.out.println("📋 [RECONTEO] Obteniendo productos con diferencias del conteo original");
        
        // Obtener el conteo sector
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
                .orElseThrow(() -> new RuntimeException("Conteo sector no encontrado"));
        
        // Obtener todos los detalles del conteo original (solo no eliminados)
        List<DetalleConteo> detallesOriginales = detalleConteoRepository
                .findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        System.out.println("  - Detalles originales encontrados: " + detallesOriginales.size());
        
        // Filtrar solo productos con diferencias
        List<Map<String, Object>> productosConDiferencias = new ArrayList<>();
        
        for (DetalleConteo detalle : detallesOriginales) {
            // Verificar si hay diferencias entre los conteos de los dos usuarios
            Integer cantidad1 = detalle.getCantidadConteo1();
            Integer cantidad2 = detalle.getCantidadConteo2();
            
            if (cantidad1 != null && cantidad2 != null && !cantidad1.equals(cantidad2)) {
                // Hay diferencias, agregar a la lista
                Map<String, Object> productoData = new HashMap<>();
                productoData.put("productoId", detalle.getProducto().getId());
                
                // Crear DTO del producto
                Producto producto = detalle.getProducto();
                Map<String, Object> productoDto = new HashMap<>();
                productoDto.put("id", producto.getId());
                productoDto.put("nombre", producto.getNombre());
                productoDto.put("codigoPersonalizado", producto.getCodigoPersonalizado());
                productoDto.put("stock", producto.getStock());
                productoDto.put("categoria", producto.getCategoria());
                productoDto.put("marca", producto.getMarca());
                productoDto.put("precio", producto.getPrecio());
                
                productoData.put("producto", productoDto);
                productoData.put("cantidadConteo1", cantidad1);
                productoData.put("cantidadConteo2", cantidad2);
                productoData.put("formulaConteo1", detalle.getFormulaCalculo1());
                productoData.put("formulaConteo2", detalle.getFormulaCalculo2());
                productoData.put("diferenciaConteo", cantidad2 - cantidad1);
                
                productosConDiferencias.add(productoData);
                
                System.out.println("  - Producto con diferencias: " + producto.getNombre() + 
                                 " - Usuario1: " + cantidad1 + ", Usuario2: " + cantidad2 + 
                                 ", Diferencia: " + (cantidad2 - cantidad1));
            }
        }
        
        System.out.println("✅ [RECONTEO] Productos con diferencias encontrados: " + productosConDiferencias.size());
        return productosConDiferencias;
    }
    
    /**
     * Obtener reconteos en formato de referencia (para mostrar como referencia en el siguiente reconteo)
     */
    private List<Map<String, Object>> obtenerReconteosComoReferencia(Long conteoSectorId, Integer numeroReconteo) {
        System.out.println("📋 [RECONTEO] Obteniendo reconteos como referencia:");
        System.out.println("  - ConteoSectorId: " + conteoSectorId);
        System.out.println("  - Número reconteo: " + numeroReconteo);
        
        // Obtener reconteos del número especificado
        List<ReconteoDetalle> reconteos = reconteoDetalleRepository
                .findByConteoSectorIdAndNumeroReconteoAndEliminadoFalse(conteoSectorId, numeroReconteo);

        System.out.println("  - Reconteos encontrados: " + reconteos.size());
        
        // Debug: mostrar cada reconteo encontrado
        for (int i = 0; i < reconteos.size(); i++) {
            ReconteoDetalle reconteo = reconteos.get(i);
            System.out.println("    Reconteo " + (i+1) + ": Producto=" + reconteo.getProducto().getId() + 
                             ", Usuario=" + reconteo.getUsuario().getId() + 
                             ", Cantidad=" + reconteo.getCantidadReconteo() + 
                             ", Número=" + reconteo.getNumeroReconteo());
        }

        // Agrupar por producto
        Map<Long, Map<String, Object>> productosReconteo = new HashMap<>();

        for (ReconteoDetalle reconteo : reconteos) {
            Long productoId = reconteo.getProducto().getId();
            
            if (!productosReconteo.containsKey(productoId)) {
                Map<String, Object> productoData = new HashMap<>();
                productoData.put("productoId", productoId);
                
                // ✅ CORRECCIÓN: Crear DTO simple en lugar de devolver entidad Hibernate
                Producto producto = reconteo.getProducto();
                Map<String, Object> productoDto = new HashMap<>();
                productoDto.put("id", producto.getId());
                productoDto.put("nombre", producto.getNombre());
                productoDto.put("codigoPersonalizado", producto.getCodigoPersonalizado());
                productoDto.put("stock", producto.getStock());
                productoDto.put("categoria", producto.getCategoria());
                productoDto.put("marca", producto.getMarca());
                productoDto.put("precio", producto.getPrecio());
                
                productoData.put("producto", productoDto);
                productosReconteo.put(productoId, productoData);
            }

            Map<String, Object> productoData = productosReconteo.get(productoId);
            
            // Determinar si es usuario 1 o 2 basado en el ID del usuario
            ConteoSector conteoSector = reconteo.getConteoSector();
            if (conteoSector.getUsuarioAsignado1() != null && 
                reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado1().getId())) {
                // ✅ CORRECCIÓN: Usar nombres de campos compatibles con el frontend
                productoData.put("cantidadConteo1", reconteo.getCantidadReconteo());
                productoData.put("formulaConteo1", reconteo.getFormulaCalculo());
                productoData.put("fechaConteo1", reconteo.getFechaActualizacion());
            } else if (conteoSector.getUsuarioAsignado2() != null && 
                       reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado2().getId())) {
                // ✅ CORRECCIÓN: Usar nombres de campos compatibles con el frontend
                productoData.put("cantidadConteo2", reconteo.getCantidadReconteo());
                productoData.put("formulaConteo2", reconteo.getFormulaCalculo());
                productoData.put("fechaConteo2", reconteo.getFechaActualizacion());
            }
        }

        // Calcular diferencias y crear resultado
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map<String, Object> productoData : productosReconteo.values()) {
            Integer cantidad1 = (Integer) productoData.get("cantidadConteo1");
            Integer cantidad2 = (Integer) productoData.get("cantidadConteo2");
            
            if (cantidad1 != null && cantidad2 != null) {
                int diferencia = cantidad2 - cantidad1;
                // ✅ CORRECCIÓN: Usar nombre de campo compatible con el frontend
                productoData.put("diferenciaConteo", diferencia);
                System.out.println("  - Producto " + productoData.get("productoId") + 
                                 ": Usuario1=" + cantidad1 + ", Usuario2=" + cantidad2 + 
                                 ", Diferencia=" + diferencia);
            }
            
            resultado.add(productoData);
        }

        System.out.println("✅ [RECONTEO] Reconteos como referencia procesados: " + resultado.size());
        return resultado;
    }
    
    /**
     * Combinar datos del conteo original con datos del último reconteo
     */
    private List<Map<String, Object>> combinarDatosReferencia(
            List<Map<String, Object>> datosOriginales, 
            List<Map<String, Object>> datosUltimoReconteo) {
        
        System.out.println("🔗 [RECONTEO] Combinando datos de referencia:");
        System.out.println("  - Datos originales: " + datosOriginales.size() + " productos");
        System.out.println("  - Datos último reconteo: " + datosUltimoReconteo.size() + " productos");
        
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        // Crear un mapa de los datos del último reconteo por productoId para facilitar la búsqueda
        Map<Long, Map<String, Object>> reconteoPorProducto = new HashMap<>();
        for (Map<String, Object> reconteo : datosUltimoReconteo) {
            Long productoId = (Long) reconteo.get("productoId");
            reconteoPorProducto.put(productoId, reconteo);
        }
        
        // Combinar datos originales con datos del último reconteo
        for (Map<String, Object> original : datosOriginales) {
            Long productoId = (Long) original.get("productoId");
            
            // Crear un nuevo mapa combinado
            Map<String, Object> combinado = new HashMap<>();
            
            // Copiar datos del conteo original
            combinado.put("productoId", productoId);
            combinado.put("producto", original.get("producto"));
            combinado.put("cantidadConteo1", original.get("cantidadConteo1"));
            combinado.put("cantidadConteo2", original.get("cantidadConteo2"));
            combinado.put("formulaConteo1", original.get("formulaConteo1"));
            combinado.put("formulaConteo2", original.get("formulaConteo2"));
            combinado.put("fechaConteo1", original.get("fechaConteo1"));
            combinado.put("fechaConteo2", original.get("fechaConteo2"));
            combinado.put("diferenciaConteo", original.get("diferenciaConteo"));
            
            // Agregar datos del último reconteo si existen
            Map<String, Object> ultimoReconteo = reconteoPorProducto.get(productoId);
            if (ultimoReconteo != null) {
                combinado.put("cantidadReconteo1", ultimoReconteo.get("cantidadReconteo1"));
                combinado.put("cantidadReconteo2", ultimoReconteo.get("cantidadReconteo2"));
                combinado.put("formulaReconteo1", ultimoReconteo.get("formulaReconteo1"));
                combinado.put("formulaReconteo2", ultimoReconteo.get("formulaReconteo2"));
                combinado.put("fechaReconteo1", ultimoReconteo.get("fechaReconteo1"));
                combinado.put("fechaReconteo2", ultimoReconteo.get("fechaReconteo2"));
                combinado.put("diferenciaReconteo", ultimoReconteo.get("diferenciaReconteo"));
                
                System.out.println("  - Producto " + productoId + ": Original(" + 
                                 original.get("cantidadConteo1") + "," + original.get("cantidadConteo2") + 
                                 ") + Reconteo(" + ultimoReconteo.get("cantidadReconteo1") + "," + 
                                 ultimoReconteo.get("cantidadReconteo2") + ")");
            } else {
                System.out.println("  - Producto " + productoId + ": Solo datos originales");
            }
            
            resultado.add(combinado);
        }
        
        System.out.println("✅ [RECONTEO] Datos combinados: " + resultado.size() + " productos");
        return resultado;
    }
    
    /**
     * Obtener datos del conteo original para mostrar como referencia
     */
    private List<Map<String, Object>> obtenerDatosConteoOriginal(Long conteoSectorId) {
        System.out.println("📋 [RECONTEO] Obteniendo datos del conteo original");
        System.out.println("  - ConteoSectorId: " + conteoSectorId);
        
        // Obtener el conteo sector
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
                .orElseThrow(() -> new RuntimeException("Conteo sector no encontrado"));
        
        System.out.println("  - ConteoSector encontrado: " + conteoSector.getId() + " - " + conteoSector.getNombreSector());
        System.out.println("  - Estado del conteo: " + conteoSector.getEstado());
        System.out.println("  - Usuario1: " + (conteoSector.getUsuarioAsignado1() != null ? conteoSector.getUsuarioAsignado1().getId() : "null"));
        System.out.println("  - Usuario2: " + (conteoSector.getUsuarioAsignado2() != null ? conteoSector.getUsuarioAsignado2().getId() : "null"));
        
        // Obtener todos los detalles del conteo original
        List<DetalleConteo> detallesOriginales = detalleConteoRepository
                .findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        
        System.out.println("  - Detalles originales encontrados: " + detallesOriginales.size());
        
        // Debug: mostrar cada detalle encontrado
        for (int i = 0; i < detallesOriginales.size(); i++) {
            DetalleConteo detalle = detallesOriginales.get(i);
            System.out.println("    Detalle " + (i+1) + ": Producto=" + detalle.getProducto().getId() + 
                             ", Usuario1=" + detalle.getCantidadConteo1() + 
                             ", Usuario2=" + detalle.getCantidadConteo2() + 
                             ", Diferencia=" + detalle.getDiferenciaEntreConteos());
        }
        
        // Agrupar por producto y consolidar
        Map<Long, Map<String, Object>> productosConsolidados = new HashMap<>();
        
        for (DetalleConteo detalle : detallesOriginales) {
            Long productoId = detalle.getProducto().getId();
            
            if (!productosConsolidados.containsKey(productoId)) {
                Map<String, Object> productoData = new HashMap<>();
                productoData.put("productoId", productoId);
                
                // ✅ CORRECCIÓN: Crear DTO simple en lugar de devolver entidad Hibernate
                Producto producto = detalle.getProducto();
                System.out.println("  - DEBUG: Producto cargado - ID: " + producto.getId() + 
                                 ", Nombre: " + producto.getNombre() + 
                                 ", Código: " + producto.getCodigoPersonalizado());
                
                Map<String, Object> productoDto = new HashMap<>();
                productoDto.put("id", producto.getId());
                productoDto.put("nombre", producto.getNombre());
                productoDto.put("codigoPersonalizado", producto.getCodigoPersonalizado());
                productoDto.put("stock", producto.getStock());
                productoDto.put("categoria", producto.getCategoria());
                productoDto.put("marca", producto.getMarca());
                productoDto.put("precio", producto.getPrecio());
                
                System.out.println("  - DEBUG: DTO creado - " + productoDto);
                
                productoData.put("producto", productoDto);
                productosConsolidados.put(productoId, productoData);
            }
            
            Map<String, Object> productoData = productosConsolidados.get(productoId);
            
            // Determinar si es usuario 1 o 2 basado en el ID del usuario
            if (conteoSector.getUsuarioAsignado1() != null && 
                detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                productoData.put("cantidadConteo1", detalle.getCantidadConteo1());
                productoData.put("formulaConteo1", detalle.getFormulaCalculo1());
                productoData.put("fechaConteo1", detalle.getFechaActualizacion());
            }
            
            if (conteoSector.getUsuarioAsignado2() != null && 
                detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                productoData.put("cantidadConteo2", detalle.getCantidadConteo2());
                productoData.put("formulaConteo2", detalle.getFormulaCalculo2());
                productoData.put("fechaConteo2", detalle.getFechaActualizacion());
            }
        }
        
        // Calcular diferencias y incluir TODOS los productos contados (no solo los con diferencias)
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map<String, Object> productoData : productosConsolidados.values()) {
            Integer cantidad1 = (Integer) productoData.get("cantidadConteo1");
            Integer cantidad2 = (Integer) productoData.get("cantidadConteo2");
            
            if (cantidad1 != null && cantidad2 != null) {
                int diferencia = cantidad2 - cantidad1;
                productoData.put("diferenciaConteo", diferencia);
                
                // ✅ CORRECCIÓN: Incluir TODOS los productos contados, no solo los con diferencias
                // Durante el reconteo, el usuario necesita ver todos los productos como referencia
                System.out.println("  - Producto " + productoData.get("productoId") + 
                                 ": Usuario1=" + cantidad1 + ", Usuario2=" + cantidad2 + 
                                 ", Diferencia=" + diferencia);
                resultado.add(productoData);
            }
        }
        
        System.out.println("✅ [RECONTEO] Productos del conteo original para reconteo: " + resultado.size());
        return resultado;
    }
    
    /**
     * Verificar si hay diferencias en el reconteo actual
     */
    public boolean verificarDiferenciasEnReconteo(Long conteoSectorId) {
        System.out.println("🔍 [RECONTEO] Verificando diferencias en reconteo para sector: " + conteoSectorId);
        
        // Obtener el número de reconteo actual
        Integer numeroReconteoActual = obtenerNumeroReconteoActual(conteoSectorId);
        System.out.println("  - Número reconteo actual: " + numeroReconteoActual);
        
        // Si no hay reconteos aún, no hay diferencias
        if (numeroReconteoActual <= 1) {
            System.out.println("  - No hay reconteos aún, no hay diferencias");
            return false;
        }
        
        // Obtener reconteos del último número completado
        Integer numeroReconteoCompletado = numeroReconteoActual - 1;
        List<ReconteoDetalle> reconteos = reconteoDetalleRepository
                .findByConteoSectorIdAndNumeroReconteoAndEliminadoFalse(conteoSectorId, numeroReconteoCompletado);
        
        System.out.println("  - Reconteos encontrados para número " + numeroReconteoCompletado + ": " + reconteos.size());
        
        // Verificar que ambos usuarios completaron el reconteo
        if (reconteos.size() < 2) {
            System.out.println("  - No hay suficientes reconteos para comparar");
            return false;
        }
        
        // Agrupar por producto
        Map<Long, Map<String, Integer>> productosReconteo = new HashMap<>();
        
        for (ReconteoDetalle reconteo : reconteos) {
            Long productoId = reconteo.getProducto().getId();
            
            if (!productosReconteo.containsKey(productoId)) {
                Map<String, Integer> productoData = new HashMap<>();
                productosReconteo.put(productoId, productoData);
            }
            
            Map<String, Integer> productoData = productosReconteo.get(productoId);
            
            // Determinar si es usuario 1 o 2 basado en el ID del usuario
            ConteoSector conteoSector = reconteo.getConteoSector();
            if (conteoSector.getUsuarioAsignado1() != null && 
                reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado1().getId())) {
                productoData.put("cantidadUsuario1", reconteo.getCantidadReconteo());
            } else if (conteoSector.getUsuarioAsignado2() != null && 
                       reconteo.getUsuario().getId().equals(conteoSector.getUsuarioAsignado2().getId())) {
                productoData.put("cantidadUsuario2", reconteo.getCantidadReconteo());
            }
        }
        
        // Verificar diferencias
        boolean hayDiferencias = false;
        for (Map.Entry<Long, Map<String, Integer>> entry : productosReconteo.entrySet()) {
            Long productoId = entry.getKey();
            Map<String, Integer> productoData = entry.getValue();
            
            Integer cantidad1 = productoData.get("cantidadUsuario1");
            Integer cantidad2 = productoData.get("cantidadUsuario2");
            
            if (cantidad1 != null && cantidad2 != null) {
                int diferencia = Math.abs(cantidad2 - cantidad1);
                System.out.println("  - Producto " + productoId + ": Usuario1=" + cantidad1 + 
                                 ", Usuario2=" + cantidad2 + ", Diferencia=" + diferencia);
                
                if (diferencia > 0) {
                    hayDiferencias = true;
                    System.out.println("    ⚠️ DIFERENCIA DETECTADA en producto " + productoId);
                }
            }
        }
        
        System.out.println("✅ [RECONTEO] Verificación completada - Hay diferencias: " + hayDiferencias);
        return hayDiferencias;
    }
    
    /**
     * Obtener reconteos por número específico
     */
    public List<ReconteoDetalle> obtenerReconteosPorNumero(Long conteoSectorId, Integer numeroReconteo) {
        System.out.println("🔍 [RECONTEO] Obteniendo reconteos por número:");
        System.out.println("  - ConteoSectorId: " + conteoSectorId);
        System.out.println("  - Número reconteo: " + numeroReconteo);
        
        List<ReconteoDetalle> reconteos = reconteoDetalleRepository
                .findByConteoSectorIdAndNumeroReconteoAndEliminadoFalse(conteoSectorId, numeroReconteo);
        
        System.out.println("  - Reconteos encontrados: " + reconteos.size());
        return reconteos;
    }
}
