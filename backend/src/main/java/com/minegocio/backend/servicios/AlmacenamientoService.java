package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.ArchivoEmpresa;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.repositorios.ArchivoEmpresaRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para gestionar el almacenamiento de archivos de empresas
 */
@Service
@Transactional
public class AlmacenamientoService {

    @Autowired
    private ArchivoEmpresaRepository archivoEmpresaRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Registra un nuevo archivo subido
     */
    public ArchivoEmpresa registrarArchivo(Long empresaId, String urlArchivo, String publicId, String tipoArchivo, MultipartFile archivo) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Calcular tamaño del archivo
        Long tamañoBytes = archivo.getSize();
        
        // Crear registro de archivo
        ArchivoEmpresa archivoEmpresa = new ArchivoEmpresa(
            empresa,
            urlArchivo,
            publicId,
            tipoArchivo,
            tamañoBytes,
            archivo.getOriginalFilename(),
            archivo.getContentType()
        );

        return archivoEmpresaRepository.save(archivoEmpresa);
    }

    /**
     * Registra un archivo con información específica
     */
    public ArchivoEmpresa registrarArchivo(Long empresaId, String urlArchivo, String publicId, String tipoArchivo, Long tamañoBytes, String nombreOriginal, String tipoMime) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        ArchivoEmpresa archivoEmpresa = new ArchivoEmpresa(
            empresa,
            urlArchivo,
            publicId,
            tipoArchivo,
            tamañoBytes,
            nombreOriginal,
            tipoMime
        );

        return archivoEmpresaRepository.save(archivoEmpresa);
    }

    /**
     * Marca un archivo como eliminado
     */
    public boolean eliminarArchivo(String urlArchivo) {
        Optional<ArchivoEmpresa> archivoOpt = archivoEmpresaRepository.findByUrlArchivo(urlArchivo);
        if (archivoOpt.isPresent()) {
            ArchivoEmpresa archivo = archivoOpt.get();
            archivo.setActivo(false);
            archivoEmpresaRepository.save(archivo);
            return true;
        }
        return false;
    }

    /**
     * Marca un archivo como eliminado por public_id
     */
    public boolean eliminarArchivoPorPublicId(String publicId) {
        Optional<ArchivoEmpresa> archivoOpt = archivoEmpresaRepository.findByPublicId(publicId);
        if (archivoOpt.isPresent()) {
            ArchivoEmpresa archivo = archivoOpt.get();
            archivo.setActivo(false);
            archivoEmpresaRepository.save(archivo);
            return true;
        }
        return false;
    }

    /**
     * Obtiene el almacenamiento total usado por una empresa (en bytes)
     */
    public Long obtenerAlmacenamientoBytes(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        System.out.println("🔍 DEBUG ALMACENAMIENTO: Verificando archivos para empresa ID: " + empresaId);
        
        // Verificar si hay archivos registrados
        Long totalArchivos = archivoEmpresaRepository.countByEmpresaAndActivoTrue(empresa);
        System.out.println("🔍 DEBUG ALMACENAMIENTO: Total archivos activos: " + totalArchivos);
        
        // Obtener algunos archivos para debug
        List<ArchivoEmpresa> archivos = archivoEmpresaRepository.findByEmpresaAndActivoTrue(empresa);
        System.out.println("🔍 DEBUG ALMACENAMIENTO: Archivos encontrados: " + archivos.size());
        
        for (ArchivoEmpresa archivo : archivos) {
            System.out.println("🔍 DEBUG ALMACENAMIENTO: Archivo - ID: " + archivo.getId() + 
                             ", Tipo: " + archivo.getTipoArchivo() + 
                             ", Tamaño: " + archivo.getTamañoBytes() + " bytes");
        }
        
        Long totalBytes = archivoEmpresaRepository.sumTamañoBytesByEmpresaAndActivoTrue(empresa);
        System.out.println("🔍 DEBUG ALMACENAMIENTO: Total bytes calculado: " + totalBytes);
        
        return totalBytes;
    }

    /**
     * Obtiene el almacenamiento total usado por una empresa (en MB)
     */
    public Double obtenerAlmacenamientoMB(Long empresaId) {
        Long bytes = obtenerAlmacenamientoBytes(empresaId);
        return bytes / (1024.0 * 1024.0);
    }

    /**
     * Obtiene el almacenamiento total usado por una empresa (en GB)
     */
    public Double obtenerAlmacenamientoGB(Long empresaId) {
        Long bytes = obtenerAlmacenamientoBytes(empresaId);
        return bytes / (1024.0 * 1024.0 * 1024.0);
    }

    /**
     * Obtiene estadísticas detalladas de almacenamiento por empresa
     */
    public Map<String, Object> obtenerEstadisticasAlmacenamiento(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Object[] stats = archivoEmpresaRepository.getEstadisticasAlmacenamiento(empresa);
        
        // Manejar caso cuando no hay archivos de manera más robusta
        Long totalArchivos = 0L;
        Long tamañoTotalBytes = 0L;
        Double tamañoTotalMB = 0.0;
        
        if (stats != null && stats.length >= 3) {
            totalArchivos = stats[0] != null ? ((Number) stats[0]).longValue() : 0L;
            tamañoTotalBytes = stats[1] != null ? ((Number) stats[1]).longValue() : 0L;
            tamañoTotalMB = stats[2] != null ? ((Number) stats[2]).doubleValue() : 0.0;
        }
        
        Map<String, Object> estadisticas = new HashMap<>();
        estadisticas.put("totalArchivos", totalArchivos);
        estadisticas.put("tamañoTotalBytes", tamañoTotalBytes);
        estadisticas.put("tamañoTotalMB", tamañoTotalMB);
        estadisticas.put("tamañoTotalGB", tamañoTotalBytes / (1024.0 * 1024.0 * 1024.0));

        // Estadísticas por tipo
        Map<String, Object> porTipo = new HashMap<>();
        
        // Productos
        Object[] statsProductos = archivoEmpresaRepository.getEstadisticasAlmacenamientoPorTipo(empresa, "producto");
        Long productosArchivos = 0L;
        Long productosBytes = 0L;
        Double productosMB = 0.0;
        if (statsProductos != null && statsProductos.length >= 3) {
            productosArchivos = statsProductos[0] != null ? ((Number) statsProductos[0]).longValue() : 0L;
            productosBytes = statsProductos[1] != null ? ((Number) statsProductos[1]).longValue() : 0L;
            productosMB = statsProductos[2] != null ? ((Number) statsProductos[2]).doubleValue() : 0.0;
        }
        porTipo.put("productos", Map.of(
            "totalArchivos", productosArchivos,
            "tamañoBytes", productosBytes,
            "tamañoMB", productosMB
        ));

        // Logos
        Object[] statsLogos = archivoEmpresaRepository.getEstadisticasAlmacenamientoPorTipo(empresa, "logo");
        Long logosArchivos = 0L;
        Long logosBytes = 0L;
        Double logosMB = 0.0;
        if (statsLogos != null && statsLogos.length >= 3) {
            logosArchivos = statsLogos[0] != null ? ((Number) statsLogos[0]).longValue() : 0L;
            logosBytes = statsLogos[1] != null ? ((Number) statsLogos[1]).longValue() : 0L;
            logosMB = statsLogos[2] != null ? ((Number) statsLogos[2]).doubleValue() : 0.0;
        }
        porTipo.put("logos", Map.of(
            "totalArchivos", logosArchivos,
            "tamañoBytes", logosBytes,
            "tamañoMB", logosMB
        ));

        // Fondos
        Object[] statsFondos = archivoEmpresaRepository.getEstadisticasAlmacenamientoPorTipo(empresa, "fondo");
        Long fondosArchivos = 0L;
        Long fondosBytes = 0L;
        Double fondosMB = 0.0;
        if (statsFondos != null && statsFondos.length >= 3) {
            fondosArchivos = statsFondos[0] != null ? ((Number) statsFondos[0]).longValue() : 0L;
            fondosBytes = statsFondos[1] != null ? ((Number) statsFondos[1]).longValue() : 0L;
            fondosMB = statsFondos[2] != null ? ((Number) statsFondos[2]).doubleValue() : 0.0;
        }
        porTipo.put("fondos", Map.of(
            "totalArchivos", fondosArchivos,
            "tamañoBytes", fondosBytes,
            "tamañoMB", fondosMB
        ));

        estadisticas.put("porTipo", porTipo);

        return estadisticas;
    }

    /**
     * Verifica si una empresa puede subir más archivos según su límite de almacenamiento
     */
    public boolean puedeSubirArchivo(Long empresaId, Long tamañoArchivoBytes, Integer maxAlmacenamientoGB) {
        if (maxAlmacenamientoGB == null || maxAlmacenamientoGB == -1) {
            return true; // Sin límite
        }

        Long almacenamientoActual = obtenerAlmacenamientoBytes(empresaId);
        Long maxAlmacenamientoBytes = (long) maxAlmacenamientoGB * 1024 * 1024 * 1024;
        
        return (almacenamientoActual + tamañoArchivoBytes) <= maxAlmacenamientoBytes;
    }

    /**
     * Obtiene el porcentaje de uso de almacenamiento
     */
    public double obtenerPorcentajeUso(Long empresaId, Integer maxAlmacenamientoGB) {
        if (maxAlmacenamientoGB == null || maxAlmacenamientoGB <= 0) {
            return 0.0;
        }

        Double almacenamientoActualGB = obtenerAlmacenamientoGB(empresaId);
        return (almacenamientoActualGB / maxAlmacenamientoGB) * 100.0;
    }

    /**
     * Limpia archivos eliminados (marca como inactivos)
     */
    public void limpiarArchivosEliminados(Long empresaId) {
        // Este método podría implementarse para limpiar archivos que ya no existen en Cloudinary
        // Por ahora solo marca como inactivos los que se eliminan
    }

    /**
     * Calcula el tamaño aproximado de la base de datos para una empresa
     * Basado en estimaciones realistas de tamaño por entidad
     */
    public long calcularTamañoBaseDatos(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        long tamañoTotal = 0;

        // Productos: ~500 bytes cada uno (nombre, descripción, precio, stock, etc.)
        long productos = productoRepository.countByEmpresaId(empresaId);
        tamañoTotal += productos * 500;

        // Clientes: ~300 bytes cada uno (nombre, email, teléfono, dirección)
        long clientes = clienteRepository.countByEmpresaId(empresaId);
        tamañoTotal += clientes * 300;

        // Pedidos: ~800 bytes cada uno (fecha, total, estado, detalles)
        long pedidos = pedidoRepository.countByEmpresaId(empresaId);
        tamañoTotal += pedidos * 800;

        // Usuarios: ~400 bytes cada uno (nombre, email, rol, configuración)
        long usuarios = usuarioRepository.countByEmpresa(empresa);
        tamañoTotal += usuarios * 400;

        // Detalles de pedidos: ~200 bytes cada uno (producto, cantidad, precio)
        // Estimamos 3 detalles por pedido en promedio
        long detallesPedidos = pedidos * 3;
        tamañoTotal += detallesPedidos * 200;

        // Historiales y logs: ~100 bytes por registro
        // Estimamos 10 registros de historial por empresa
        tamañoTotal += 10 * 100;

        return tamañoTotal;
    }

    /**
     * Obtiene el almacenamiento total (archivos + base de datos) en bytes
     */
    public long obtenerAlmacenamientoTotalBytes(Long empresaId) {
        System.out.println("🔍 DEBUG ALMACENAMIENTO TOTAL: Calculando para empresa ID: " + empresaId);
        
        long archivosBytes = obtenerAlmacenamientoBytes(empresaId);
        System.out.println("🔍 DEBUG ALMACENAMIENTO TOTAL: Archivos bytes: " + archivosBytes);
        
        long baseDatosBytes = calcularTamañoBaseDatos(empresaId);
        System.out.println("🔍 DEBUG ALMACENAMIENTO TOTAL: Base de datos bytes: " + baseDatosBytes);
        
        long total = archivosBytes + baseDatosBytes;
        System.out.println("🔍 DEBUG ALMACENAMIENTO TOTAL: Total bytes: " + total);
        
        return total;
    }

    /**
     * Obtiene el almacenamiento total (archivos + base de datos) en MB
     */
    public Double obtenerAlmacenamientoTotalMB(Long empresaId) {
        long bytes = obtenerAlmacenamientoTotalBytes(empresaId);
        return bytes / (1024.0 * 1024.0);
    }

    /**
     * Obtiene el almacenamiento total (archivos + base de datos) en GB
     */
    public Double obtenerAlmacenamientoTotalGB(Long empresaId) {
        long bytes = obtenerAlmacenamientoTotalBytes(empresaId);
        return bytes / (1024.0 * 1024.0 * 1024.0);
    }

    /**
     * Obtiene estadísticas detalladas de almacenamiento total por empresa
     */
    public Map<String, Object> obtenerEstadisticasAlmacenamientoTotal(Long empresaId) {
        Map<String, Object> estadisticasArchivos = obtenerEstadisticasAlmacenamiento(empresaId);
        
        // Calcular tamaños de base de datos
        long baseDatosBytes = calcularTamañoBaseDatos(empresaId);
        double baseDatosMB = baseDatosBytes / (1024.0 * 1024.0);
        double baseDatosGB = baseDatosBytes / (1024.0 * 1024.0 * 1024.0);

        // Agregar información de base de datos
        estadisticasArchivos.put("baseDatos", Map.of(
            "tamañoBytes", baseDatosBytes,
            "tamañoMB", baseDatosMB,
            "tamañoGB", baseDatosGB
        ));

        // Calcular totales
        long totalBytes = (Long) estadisticasArchivos.get("tamañoTotalBytes") + baseDatosBytes;
        double totalMB = (Double) estadisticasArchivos.get("tamañoTotalMB") + baseDatosMB;
        double totalGB = (Double) estadisticasArchivos.get("tamañoTotalGB") + baseDatosGB;

        estadisticasArchivos.put("total", Map.of(
            "tamañoBytes", totalBytes,
            "tamañoMB", totalMB,
            "tamañoGB", totalGB
        ));

        return estadisticasArchivos;
    }
}
