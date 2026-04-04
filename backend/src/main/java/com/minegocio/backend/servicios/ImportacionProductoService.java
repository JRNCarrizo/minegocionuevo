package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ImportacionProductoDTO;
import com.minegocio.backend.dto.ResultadoImportacionDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ImportacionProductoService {

    /** Orden de columnas en Excel (debe coincidir con PlantillaCargaMasivaService) */
    private static final String[] ENCABEZADOS_IMPORTACION = {
        "Código Personalizado",
        "Nombre*",
        "Marca",
        "Descripción",
        "Categoría",
        "Sector de almacenamiento",
        "Stock Actual*",
        "Precio",
        "Código de Barras"
    };

    private static final int NUM_COLUMNAS_IMPORTACION = ENCABEZADOS_IMPORTACION.length;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private LimiteService limiteService;

    @Autowired
    private SectorRepository sectorRepository;

    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;

    /**
     * Valida y procesa un archivo Excel para importación de productos
     */
    @Transactional(readOnly = true)
    public ResultadoImportacionDTO validarArchivoExcel(MultipartFile archivo, Long empresaId) {
        List<ImportacionProductoDTO> productos = new ArrayList<>();
        List<Map<String, Object>> errores = new ArrayList<>();
        int totalRegistros = 0;

        try (InputStream inputStream = archivo.getInputStream()) {
            Workbook workbook = new XSSFWorkbook(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            // Buscar la fila de encabezados (puede estar en diferentes posiciones)
            int headerRowIndex = encontrarFilaEncabezados(sheet);
            if (headerRowIndex == -1) {
                return new ResultadoImportacionDTO(0, 0, 1,
                    Arrays.asList(Map.of("fila", 1, "error", "Formato de archivo incorrecto. Encabezados esperados (en este orden): " + String.join(", ", ENCABEZADOS_IMPORTACION))),
                    new ArrayList<>(), "Formato de archivo incorrecto");
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            if (headerRow == null || !validarEncabezados(headerRow)) {
                return new ResultadoImportacionDTO(0, 0, 1,
                    Arrays.asList(Map.of("fila", headerRowIndex + 1, "error", "Formato de archivo incorrecto. Encabezados esperados (en este orden): " + String.join(", ", ENCABEZADOS_IMPORTACION))),
                    new ArrayList<>(), "Formato de archivo incorrecto");
            }

            // Procesar cada fila de datos (empezar después de los encabezados)
            for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalRegistros++;
                Map<String, Object> errorFila = validarFila(row, i + 1, empresaId);
                
                if (errorFila != null) {
                    errores.add(errorFila);
                } else {
                    ImportacionProductoDTO producto = convertirFilaAProducto(row);
                    productos.add(producto);
                }
            }

            workbook.close();
        } catch (IOException e) {
            return new ResultadoImportacionDTO(0, 0, 1, 
                Arrays.asList(Map.of("fila", 0, "error", "Error al leer el archivo: " + e.getMessage())),
                new ArrayList<>(), "Error al procesar el archivo");
        }

        String mensaje = String.format("Archivo procesado. %d registros válidos, %d con errores", 
            productos.size(), errores.size());

        return new ResultadoImportacionDTO(totalRegistros, productos.size(), errores.size(), 
            errores, productos, mensaje);
    }

    /**
     * Importa los productos validados a la base de datos con distribución por sectores
     */
    @Transactional
    public ResultadoImportacionDTO importarProductos(List<ImportacionProductoDTO> productos, Long empresaId) {
        List<Map<String, Object>> errores = new ArrayList<>();
        int registrosExitosos = 0;

        System.out.println("🔍 Buscando empresa con ID: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> {
                System.err.println("❌ Empresa no encontrada con ID: " + empresaId);
                return new RuntimeException("Empresa no encontrada con ID: " + empresaId);
            });
        
        System.out.println("✅ Empresa encontrada: " + empresa.getNombre());

        // Log de todos los productos antes de agrupar
        System.out.println("📋 PRODUCTOS ANTES DE AGRUPAR:");
        for (int i = 0; i < productos.size(); i++) {
            ImportacionProductoDTO p = productos.get(i);
            System.out.println("  📦 Producto " + (i+1) + ": Nombre='" + p.getNombre() + "', Stock=" + p.getStock() + ", Sector=" + p.getSectorAlmacenamiento());
        }

        // Agrupar productos por nombre normalizado para sumar stocks y distribuir por sectores
        Map<String, List<ImportacionProductoDTO>> productosAgrupados = productos.stream()
            .collect(Collectors.groupingBy(p -> normalizarNombreProducto(p.getNombre())));

        System.out.println("📊 Productos agrupados: " + productosAgrupados.size() + " grupos únicos");
        System.out.println("📋 Total de productos en Excel: " + productos.size());
        
        // Log detallado de la agrupación
        for (Map.Entry<String, List<ImportacionProductoDTO>> entry : productosAgrupados.entrySet()) {
            String nombreProducto = entry.getKey();
            List<ImportacionProductoDTO> productosDelGrupo = entry.getValue();
            System.out.println("🔍 Grupo: '" + nombreProducto + "' - " + productosDelGrupo.size() + " registros");
            for (int i = 0; i < productosDelGrupo.size(); i++) {
                ImportacionProductoDTO p = productosDelGrupo.get(i);
                System.out.println("  📦 Registro " + (i+1) + ": Nombre='" + p.getNombre() + "', Stock=" + p.getStock() + ", Sector=" + p.getSectorAlmacenamiento());
            }
        }

        for (Map.Entry<String, List<ImportacionProductoDTO>> entry : productosAgrupados.entrySet()) {
            String nombreProducto = entry.getKey();
            List<ImportacionProductoDTO> productosDelGrupo = entry.getValue();
            
            try {
                // Verificar límites de la suscripción
                if (!limiteService.puedeCrearProducto(empresaId)) {
                    errores.add(Map.of(
                        "producto", nombreProducto,
                        "error", "Límite de productos alcanzado en su suscripción"
                    ));
                    continue;
                }

                // Tomar el primer producto del grupo como base (todos tienen el mismo nombre)
                ImportacionProductoDTO productoBase = productosDelGrupo.get(0);
                
                // Verificar si el producto ya existe en la base de datos por código personalizado
                if (verificarProductoExistenteEnBD(productoBase, empresaId)) {
                    errores.add(Map.of(
                        "producto", nombreProducto,
                        "error", "Producto ya existe en la base de datos con el mismo código personalizado: " + 
                                (productoBase.getCodigoPersonalizado() != null ? productoBase.getCodigoPersonalizado() : "Sin código personalizado") +
                                " (Nombre: " + productoBase.getNombre() + ")"
                    ));
                    continue;
                }

                // Calcular stock total sumando todos los registros del mismo producto
                int stockTotal = productosDelGrupo.stream()
                    .mapToInt(p -> p.getStock() != null ? p.getStock() : 0)
                    .sum();

                System.out.println("📦 Producto: " + nombreProducto + " - Stock total: " + stockTotal);

                // Crear el producto principal con stock total
                Producto producto = new Producto();
                producto.setNombre(productoBase.getNombre());
                producto.setDescripcion(productoBase.getDescripcion());
                producto.setPrecio(productoBase.getPrecio() != null ? productoBase.getPrecio() : BigDecimal.ZERO);
                producto.setStock(stockTotal); // Stock total sumado
                producto.setStockMinimo(productoBase.getStockMinimo() != null ? productoBase.getStockMinimo() : 0);
                producto.setCategoria(productoBase.getCategoria());
                producto.setMarca(productoBase.getMarca());
                producto.setSectorAlmacenamiento(null); // No asignar sector específico al producto principal
                producto.setCodigoBarras(productoBase.getCodigoBarras());
                producto.setCodigoPersonalizado(productoBase.getCodigoPersonalizado());
                producto.setEmpresa(empresa);
                producto.setActivo(true);

                // Guardar el producto principal
                Producto productoSaved = productoRepository.save(producto);
                System.out.println("✅ Producto principal creado: " + productoSaved.getId());

                // Distribuir stock por sectores
                System.out.println("🔄 Distribuyendo stock por sectores para: " + nombreProducto);
                for (ImportacionProductoDTO productoDelGrupo : productosDelGrupo) {
                    System.out.println("  📦 Procesando registro: Stock=" + productoDelGrupo.getStock() + 
                                     ", Sector='" + productoDelGrupo.getSectorAlmacenamiento() + "'");
                    
                    if (productoDelGrupo.getSectorAlmacenamiento() != null && 
                        !productoDelGrupo.getSectorAlmacenamiento().trim().isEmpty() &&
                        productoDelGrupo.getStock() != null && productoDelGrupo.getStock() > 0) {
                        
                        System.out.println("  ✅ Asignando " + productoDelGrupo.getStock() + " unidades al sector: " + 
                                         productoDelGrupo.getSectorAlmacenamiento());
                        asignarStockASector(productoSaved, productoDelGrupo.getSectorAlmacenamiento(), 
                                          productoDelGrupo.getStock(), empresaId);
                    } else {
                        System.out.println("  ⚠️ Saltando registro: Sector vacío o stock <= 0");
                    }
                }

                registrosExitosos++;

            } catch (Exception e) {
                System.err.println("Error al importar producto " + nombreProducto + ": " + e.getMessage());
                e.printStackTrace();
                errores.add(Map.of(
                    "producto", nombreProducto,
                    "error", "Error al crear producto: " + e.getMessage()
                ));
            }
        }

        String mensaje = String.format("Importación completada. %d productos creados, %d errores", 
            registrosExitosos, errores.size());

        return new ResultadoImportacionDTO(productos.size(), registrosExitosos, errores.size(), 
            errores, new ArrayList<>(), mensaje);
    }

    /**
     * Asigna stock de un producto a un sector específico
     */
    private void asignarStockASector(Producto producto, String nombreSector, Integer cantidad, Long empresaId) {
        try {
            // Buscar o crear el sector
            Sector sector = buscarOCrearSector(nombreSector, empresaId);
            if (sector == null) {
                System.err.println("❌ No se pudo crear/encontrar el sector: " + nombreSector);
                return;
            }

            // Buscar si ya existe stock de este producto en este sector
            Optional<StockPorSector> stockExistente = stockPorSectorRepository
                .findByProductoIdAndSectorId(producto.getId(), sector.getId());

            if (stockExistente.isPresent()) {
                // Actualizar stock existente
                StockPorSector stock = stockExistente.get();
                stock.setCantidad(stock.getCantidad() + cantidad);
                stockPorSectorRepository.save(stock);
                System.out.println("📦 Stock actualizado en sector " + nombreSector + ": +" + cantidad + 
                                 " (Total: " + stock.getCantidad() + ")");
            } else {
                // Crear nuevo registro de stock
                StockPorSector nuevoStock = new StockPorSector(producto, sector, cantidad);
                stockPorSectorRepository.save(nuevoStock);
                System.out.println("📦 Nuevo stock creado en sector " + nombreSector + ": " + cantidad);
            }

        } catch (Exception e) {
            System.err.println("❌ Error al asignar stock al sector " + nombreSector + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Normaliza el nombre del producto para agrupación
     */
    private String normalizarNombreProducto(String nombre) {
        if (nombre == null) return "";
        
        return nombre.trim()
            .toLowerCase()
            .replaceAll("\\s+", " ") // Reemplazar múltiples espacios por uno solo
            .replaceAll("[^a-zA-Z0-9\\s]", ""); // Remover caracteres especiales
    }

    /**
     * Busca un sector por nombre o lo crea si no existe
     */
    private Sector buscarOCrearSector(String nombreSector, Long empresaId) {
        try {
            // Buscar sector existente
            Optional<Sector> sectorExistente = sectorRepository.findByNombreAndEmpresaId(nombreSector, empresaId);
            
            if (sectorExistente.isPresent()) {
                System.out.println("✅ Sector encontrado: " + nombreSector);
                return sectorExistente.get();
            }

            // Crear nuevo sector
            Sector nuevoSector = new Sector();
            nuevoSector.setNombre(nombreSector);
            nuevoSector.setDescripcion("Sector creado automáticamente durante importación");
            nuevoSector.setActivo(true);
            nuevoSector.setEmpresa(empresaRepository.findById(empresaId).orElse(null));
            
            Sector sectorCreado = sectorRepository.save(nuevoSector);
            System.out.println("✅ Nuevo sector creado: " + nombreSector + " (ID: " + sectorCreado.getId() + ")");
            
            return sectorCreado;

        } catch (Exception e) {
            System.err.println("❌ Error al buscar/crear sector " + nombreSector + ": " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Busca la fila que contiene los encabezados esperados
     */
    private int encontrarFilaEncabezados(Sheet sheet) {
        System.out.println("🔍 Buscando encabezados en las primeras filas del archivo...");
        System.out.println("📋 Encabezados esperados: " + String.join(", ", ENCABEZADOS_IMPORTACION));
        
        // Buscar en las primeras 15 filas (cubre plantilla con título e instrucciones)
        for (int rowIndex = 0; rowIndex <= Math.min(15, sheet.getLastRowNum()); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                String encabezadosFila = obtenerEncabezadosFila(row);
                System.out.println("🔍 Fila " + rowIndex + ": " + encabezadosFila);
                
                if (row.getLastCellNum() >= NUM_COLUMNAS_IMPORTACION) {
                    if (validarEncabezados(row)) {
                        System.out.println("✅ Encontrados encabezados válidos en fila " + rowIndex);
                        return rowIndex;
                    }
                } else {
                    System.out.println("⚠️ Fila " + rowIndex + " no tiene suficientes columnas (" + row.getLastCellNum() + ")");
                }
            } else {
                System.out.println("⚠️ Fila " + rowIndex + " está vacía");
            }
        }
        
        System.out.println("❌ No se encontraron encabezados válidos en ninguna fila");
        System.out.println("📊 Total de filas revisadas: " + Math.min(15, sheet.getLastRowNum() + 1));
        return -1; // No se encontró
    }
    
    /**
     * Obtiene los encabezados de una fila para debugging
     */
    private String obtenerEncabezadosFila(Row row) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < NUM_COLUMNAS_IMPORTACION; i++) {
            Cell cell = row.getCell(i);
            if (cell != null) {
                String valor = obtenerValorCelda(cell);
                sb.append("[").append(valor != null ? valor : "null").append("] ");
            } else {
                sb.append("[null] ");
            }
        }
        return sb.toString();
    }

    /**
     * Valida que los encabezados del archivo coincidan con la plantilla actual
     */
    private boolean validarEncabezados(Row headerRow) {
        System.out.println("🔍 Validando encabezados de la fila...");
        
        for (int i = 0; i < ENCABEZADOS_IMPORTACION.length; i++) {
            Cell cell = headerRow.getCell(i);
            String valorCelda = obtenerValorCelda(cell);
            
            if (cell == null) {
                System.out.println("❌ Columna " + i + " está vacía, esperado: '" + ENCABEZADOS_IMPORTACION[i] + "'");
                return false;
            }
            
            if (!ENCABEZADOS_IMPORTACION[i].equals(valorCelda)) {
                System.out.println("❌ Encabezado no coincide en columna " + i + ": esperado='" + ENCABEZADOS_IMPORTACION[i] + "', encontrado='" + valorCelda + "'");
                return false;
            }
            
            System.out.println("✅ Columna " + i + ": '" + valorCelda + "' coincide");
        }
        
        System.out.println("✅ Todos los encabezados coinciden perfectamente");
        return true;
    }

    /**
     * Valida una fila de datos (orden: código personalizado, nombre, marca, …)
     */
    private Map<String, Object> validarFila(Row row, int numeroFila, Long empresaId) {
        String codigoPersonalizado = obtenerValorCelda(row.getCell(0));
        if (codigoPersonalizado != null && codigoPersonalizado.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código personalizado no puede exceder 50 caracteres");
        }

        String nombre = obtenerValorCelda(row.getCell(1));
        if (nombre == null || nombre.trim().isEmpty()) {
            return Map.of("fila", numeroFila, "error", "El nombre es obligatorio");
        }
        if (nombre.length() > 200) {
            return Map.of("fila", numeroFila, "error", "El nombre no puede exceder 200 caracteres");
        }

        String marca = obtenerValorCelda(row.getCell(2));
        if (marca != null && marca.length() > 100) {
            return Map.of("fila", numeroFila, "error", "La marca no puede exceder 100 caracteres");
        }

        String descripcion = obtenerValorCelda(row.getCell(3));
        if (descripcion != null && descripcion.length() > 1000) {
            return Map.of("fila", numeroFila, "error", "La descripción no puede exceder 1000 caracteres");
        }

        String categoria = obtenerValorCelda(row.getCell(4));
        if (categoria != null && categoria.length() > 100) {
            return Map.of("fila", numeroFila, "error", "La categoría no puede exceder 100 caracteres");
        }

        String sectorAlmacenamiento = obtenerValorCelda(row.getCell(5));
        if (sectorAlmacenamiento != null && sectorAlmacenamiento.length() > 100) {
            return Map.of("fila", numeroFila, "error", "El sector de almacenamiento no puede exceder 100 caracteres");
        }

        Integer stock = obtenerValorEntero(row.getCell(6));
        if (stock == null || stock < 0) {
            return Map.of("fila", numeroFila, "error", "El stock actual debe ser un número mayor o igual a 0");
        }

        BigDecimal precio = obtenerValorDecimal(row.getCell(7));
        if (precio != null && precio.compareTo(BigDecimal.ZERO) <= 0) {
            return Map.of("fila", numeroFila, "error", "El precio debe ser mayor a 0 si se especifica");
        }

        String codigoBarras = obtenerValorCelda(row.getCell(8));
        if (codigoBarras != null && codigoBarras.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código de barras no puede exceder 50 caracteres");
        }

        return null;
    }

    /**
     * Convierte una fila de Excel a DTO (siempre Activo; stock mínimo 0 si no viene en Excel)
     */
    private ImportacionProductoDTO convertirFilaAProducto(Row row) {
        return new ImportacionProductoDTO(
            obtenerValorCelda(row.getCell(1)), // nombre
            obtenerValorCelda(row.getCell(3)), // descripcion
            obtenerValorDecimal(row.getCell(7)), // precio
            obtenerValorEntero(row.getCell(6)), // stock
            0, // stockMinimo no está en plantilla
            obtenerValorCelda(row.getCell(4)), // categoria
            obtenerValorCelda(row.getCell(2)), // marca
            obtenerValorCelda(row.getCell(5)), // sectorAlmacenamiento
            obtenerValorCelda(row.getCell(8)), // codigoBarras
            obtenerValorCelda(row.getCell(0)), // codigoPersonalizado
            "Activo"
        );
    }

    /**
     * Verifica si un producto ya existe en la base de datos basándose únicamente en código personalizado
     * Permite productos con el mismo nombre o código de barras, ya que pueden ser productos diferentes
     */
    private boolean verificarProductoExistenteEnBD(ImportacionProductoDTO productoDTO, Long empresaId) {
        // Solo verificar por código personalizado (si existe)
        if (productoDTO.getCodigoPersonalizado() != null && !productoDTO.getCodigoPersonalizado().trim().isEmpty()) {
            if (productoRepository.existsByEmpresaIdAndCodigoPersonalizado(empresaId, productoDTO.getCodigoPersonalizado().trim())) {
                System.out.println("❌ Producto duplicado por código personalizado: " + productoDTO.getCodigoPersonalizado());
                return true;
            }
        }

        // No verificar por nombre ni código de barras para permitir productos similares
        System.out.println("✅ Producto permitido - Código personalizado único: " + 
            (productoDTO.getCodigoPersonalizado() != null ? productoDTO.getCodigoPersonalizado() : "Sin código personalizado"));
        
        return false;
    }

    /**
     * Obtiene el valor de una celda como String
     */
    private String obtenerValorCelda(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // Para números, convertir a string sin decimales si es entero
                double numericValue = cell.getNumericCellValue();
                if (numericValue == (int) numericValue) {
                    return String.valueOf((int) numericValue);
                } else {
                    return String.valueOf(numericValue);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }

    /**
     * Obtiene el valor de una celda como Integer
     */
    private Integer obtenerValorEntero(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case NUMERIC:
                return (int) cell.getNumericCellValue();
            case STRING:
                try {
                    String valor = cell.getStringCellValue().trim();
                    // Manejar formato de números con separadores de miles
                    valor = valor.replace(".", "").replace(",", "");
                    return Integer.parseInt(valor);
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }

    /**
     * Obtiene el valor de una celda como BigDecimal
     */
    private BigDecimal obtenerValorDecimal(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case NUMERIC:
                return BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING:
                try {
                    String valor = cell.getStringCellValue().trim();
                    // Manejar formato de moneda argentina: "$8.000,00" -> 8000.00
                    if (valor.startsWith("$")) {
                        valor = valor.substring(1); // Remover el símbolo $
                    }
                    // Reemplazar punto por nada (separador de miles) y coma por punto (separador decimal)
                    valor = valor.replace(".", "").replace(",", ".");
                    return new BigDecimal(valor);
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }
}
