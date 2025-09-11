package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
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

/**
 * Servicio para importar inventario desde Excel de la empresa
 * Basado en la pestaña "Stock" del Excel con columnas: Producto, Descripción, Movimiento, etc.
 */
@Service
public class ImportacionInventarioService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    /**
     * Procesa un archivo Excel de inventario de la empresa
     * Busca la pestaña "Stock" y actualiza/crea productos basándose en el código personalizado
     */
    @Transactional(readOnly = true)
    public Map<String, Object> procesarArchivoInventario(MultipartFile archivo, Long empresaId) {
        List<Map<String, Object>> resultados = new ArrayList<>();
        List<Map<String, Object>> errores = new ArrayList<>();
        int totalRegistros = 0;
        int productosActualizados = 0;
        int productosCreados = 0;

        Workbook workbook = null;
        try (InputStream inputStream = archivo.getInputStream()) {
            workbook = new XSSFWorkbook(inputStream);
            
            // Buscar la pestaña "Stock"
            Sheet sheetStock = null;
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                String nombreHoja = workbook.getSheetName(i);
                if (nombreHoja != null && nombreHoja.toLowerCase().contains("stock")) {
                    sheetStock = workbook.getSheetAt(i);
                    break;
                }
            }

            if (sheetStock == null) {
                return Map.of(
                    "exito", false,
                    "mensaje", "No se encontró la pestaña 'Stock' en el archivo Excel",
                    "totalRegistros", 0,
                    "productosActualizados", 0,
                    "productosCreados", 0,
                    "errores", Arrays.asList(Map.of("error", "Pestaña 'Stock' no encontrada"))
                );
            }

            // Buscar la fila de encabezados
            int headerRowIndex = encontrarFilaEncabezados(sheetStock);
            if (headerRowIndex == -1) {
                return Map.of(
                    "exito", false,
                    "mensaje", "No se encontraron los encabezados esperados en la pestaña 'Stock'",
                    "totalRegistros", 0,
                    "productosActualizados", 0,
                    "productosCreados", 0,
                    "errores", Arrays.asList(Map.of("error", "Encabezados no encontrados"))
                );
            }

            // Validar encabezados
            Row headerRow = sheetStock.getRow(headerRowIndex);
            Map<String, Integer> columnas = mapearColumnas(headerRow);
            if (!columnas.containsKey("producto")) {
                return Map.of(
                    "exito", false,
                    "mensaje", "Falta columna requerida: 'Producto'",
                    "totalRegistros", 0,
                    "productosActualizados", 0,
                    "productosCreados", 0,
                    "errores", Arrays.asList(Map.of("error", "Columna 'Producto' no encontrada"))
                );
            }
            
            // Debug: mostrar columnas detectadas
            System.out.println("🔍 [INVENTARIO] Columnas detectadas: " + columnas);
            
            // Determinar qué columna usar para la cantidad
            String columnaCantidad = "movimiento";
            if (!columnas.containsKey("movimiento") && columnas.containsKey("stock")) {
                columnaCantidad = "stock";
                System.out.println("🔍 [INVENTARIO] Usando columna 'Stock' para cantidad");
            } else if (columnas.containsKey("movimiento")) {
                System.out.println("🔍 [INVENTARIO] Usando columna 'Movimiento' para cantidad");
            } else if (!columnas.containsKey("movimiento") && !columnas.containsKey("stock")) {
                return Map.of(
                    "exito", false,
                    "mensaje", "No se encontró columna de cantidad. Se necesita 'Movimiento' o 'Stock'",
                    "totalRegistros", 0,
                    "productosActualizados", 0,
                    "productosCreados", 0,
                    "errores", Arrays.asList(Map.of("error", "Columna de cantidad no encontrada"))
                );
            }

            // Procesar cada fila de datos
            int filasVaciasConsecutivas = 0;
            for (int i = headerRowIndex + 1; i <= sheetStock.getLastRowNum(); i++) {
                Row row = sheetStock.getRow(i);
                if (row == null) {
                    filasVaciasConsecutivas++;
                    // Si encontramos 5 filas vacías consecutivas, asumimos que terminó la tabla
                    if (filasVaciasConsecutivas >= 5) {
                        System.out.println("🔍 [INVENTARIO] Detectadas " + filasVaciasConsecutivas + " filas vacías consecutivas. Deteniendo procesamiento en fila " + (i + 1));
                        break;
                    }
                    continue;
                }

                // Verificar si la fila está completamente vacía
                boolean filaVacia = true;
                for (int j = 0; j < 5; j++) { // Verificar las primeras 5 columnas
                    Cell cell = row.getCell(j);
                    if (cell != null) {
                        String valor = obtenerValorCelda(cell);
                        if (valor != null && !valor.trim().isEmpty()) {
                            filaVacia = false;
                            break;
                        }
                    }
                }

                if (filaVacia) {
                    filasVaciasConsecutivas++;
                    // Si encontramos 5 filas vacías consecutivas, asumimos que terminó la tabla
                    if (filasVaciasConsecutivas >= 5) {
                        System.out.println("🔍 [INVENTARIO] Detectadas " + filasVaciasConsecutivas + " filas vacías consecutivas. Deteniendo procesamiento en fila " + (i + 1));
                        break;
                    }
                    continue;
                } else {
                    filasVaciasConsecutivas = 0; // Resetear contador si encontramos datos
                }

                totalRegistros++;
                Map<String, Object> resultado = procesarFilaInventario(row, i + 1, columnas, empresaId, columnaCantidad);
                
                if (resultado.containsKey("error")) {
                    errores.add(resultado);
                } else {
                    resultados.add(resultado);
                    if ((Boolean) resultado.get("actualizado")) {
                        productosActualizados++;
                    } else {
                        productosCreados++;
                    }
                }
            }

        } catch (IOException e) {
            return Map.of(
                "exito", false,
                "mensaje", "Error al leer el archivo: " + e.getMessage(),
                "totalRegistros", 0,
                "productosActualizados", 0,
                "productosCreados", 0,
                "errores", Arrays.asList(Map.of("error", "Error de lectura: " + e.getMessage()))
            );
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (IOException e) {
                    System.err.println("Error al cerrar workbook: " + e.getMessage());
                }
            }
        }

        String mensaje = String.format("Procesamiento completado. %d productos actualizados, %d productos creados, %d errores", 
            productosActualizados, productosCreados, errores.size());

        return Map.of(
            "exito", true,
            "mensaje", mensaje,
            "totalRegistros", totalRegistros,
            "productosActualizados", productosActualizados,
            "productosCreados", productosCreados,
            "errores", errores,
            "resultados", resultados
        );
    }

    /**
     * Importa los productos procesados a la base de datos
     */
    @Transactional
    public Map<String, Object> importarInventario(List<Map<String, Object>> productos, Long empresaId) {
        List<Map<String, Object>> errores = new ArrayList<>();
        int productosActualizados = 0;
        int productosCreados = 0;

        try {
            Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

            for (Map<String, Object> productoData : productos) {
                try {
                    String codigoPersonalizado = (String) productoData.get("codigoPersonalizado");
                    String descripcion = (String) productoData.get("descripcion");
                    Integer cantidad = (Integer) productoData.get("cantidad");

                    // Buscar producto existente por código personalizado
                    List<Producto> productosExistentes = productoRepository.findAll().stream()
                        .filter(p -> p.getCodigoPersonalizado() != null && 
                                   p.getCodigoPersonalizado().equals(codigoPersonalizado) &&
                                   p.getEmpresa().getId().equals(empresaId) &&
                                   p.getActivo())
                        .toList();
                    Optional<Producto> productoExistente = productosExistentes.isEmpty() ? 
                        Optional.empty() : Optional.of(productosExistentes.get(0));

                    if (productoExistente.isPresent()) {
                        // Actualizar producto existente
                        Producto producto = productoExistente.get();
                        producto.setStock(cantidad);
                        productoRepository.save(producto);
                        productosActualizados++;
                    } else {
                        // Crear nuevo producto
                        Producto nuevoProducto = new Producto();
                        nuevoProducto.setNombre(descripcion != null ? descripcion : "Producto " + codigoPersonalizado);
                        nuevoProducto.setDescripcion(descripcion);
                        nuevoProducto.setCodigoPersonalizado(codigoPersonalizado);
                        nuevoProducto.setStock(cantidad);
                        nuevoProducto.setPrecio(BigDecimal.ZERO);
                        nuevoProducto.setStockMinimo(0);
                        nuevoProducto.setActivo(true);
                        nuevoProducto.setEmpresa(empresa);
                        productoRepository.save(nuevoProducto);
                        productosCreados++;
                    }
                } catch (Exception e) {
                    errores.add(Map.of(
                        "codigoPersonalizado", productoData.get("codigoPersonalizado"),
                        "error", "Error al procesar: " + e.getMessage()
                    ));
                }
            }

            String mensaje = String.format("Importación completada. %d productos actualizados, %d productos creados", 
                productosActualizados, productosCreados);

            return Map.of(
                "exito", true,
                "mensaje", mensaje,
                "productosActualizados", productosActualizados,
                "productosCreados", productosCreados,
                "errores", errores
            );

        } catch (Exception e) {
            return Map.of(
                "exito", false,
                "mensaje", "Error durante la importación: " + e.getMessage(),
                "productosActualizados", 0,
                "productosCreados", 0,
                "errores", Arrays.asList(Map.of("error", e.getMessage()))
            );
        }
    }

    /**
     * Encuentra la fila que contiene los encabezados
     */
    private int encontrarFilaEncabezados(Sheet sheet) {
        for (int i = 0; i <= Math.min(10, sheet.getLastRowNum()); i++) {
            Row row = sheet.getRow(i);
            if (row != null) {
                for (int j = 0; j < row.getLastCellNum(); j++) {
                    Cell cell = row.getCell(j);
                    if (cell != null && cell.getCellType() == CellType.STRING) {
                        String valor = cell.getStringCellValue().toLowerCase().trim();
                        if (valor.contains("producto") || valor.contains("movimiento")) {
                            return i;
                        }
                    }
                }
            }
        }
        return -1;
    }

    /**
     * Mapea las columnas del Excel a índices
     */
    private Map<String, Integer> mapearColumnas(Row headerRow) {
        Map<String, Integer> columnas = new HashMap<>();
        
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null && cell.getCellType() == CellType.STRING) {
                String valor = cell.getStringCellValue().toLowerCase().trim();
                
                // Mapear columna de producto
                if (valor.contains("producto") && !columnas.containsKey("producto")) {
                    columnas.put("producto", i);
                } 
                // Mapear columna de descripción
                else if ((valor.contains("descripcion") || valor.contains("descripción")) && !columnas.containsKey("descripcion")) {
                    columnas.put("descripcion", i);
                } 
                // Mapear columna de movimiento (prioridad alta)
                else if (valor.contains("movimiento") && !columnas.containsKey("movimiento")) {
                    columnas.put("movimiento", i);
                } 
                // Mapear columna de stock (prioridad baja)
                else if (valor.contains("stock") && !columnas.containsKey("stock")) {
                    columnas.put("stock", i);
                }
            }
        }
        
        return columnas;
    }

    /**
     * Procesa una fila del inventario
     */
    private Map<String, Object> procesarFilaInventario(Row row, int numeroFila, Map<String, Integer> columnas, Long empresaId, String columnaCantidad) {
        try {
            // Obtener código personalizado (columna Producto)
            Cell cellProducto = row.getCell(columnas.get("producto"));
            if (cellProducto == null) {
                return Map.of("fila", numeroFila, "error", "Código de producto vacío");
            }
            
            String codigoPersonalizado = obtenerValorCelda(cellProducto);
            if (codigoPersonalizado == null || codigoPersonalizado.trim().isEmpty()) {
                return Map.of("fila", numeroFila, "error", "Código de producto vacío");
            }

            // Obtener descripción
            String descripcion = "";
            if (columnas.containsKey("descripcion")) {
                Cell cellDescripcion = row.getCell(columnas.get("descripcion"));
                if (cellDescripcion != null) {
                    descripcion = obtenerValorCelda(cellDescripcion);
                }
            }

            // Obtener cantidad (columna Movimiento o Stock)
            Cell cellCantidad = row.getCell(columnas.get(columnaCantidad));
            if (cellCantidad == null) {
                return Map.of("fila", numeroFila, "error", "Cantidad (" + columnaCantidad + ") vacía");
            }
            
            // Debug: mostrar valores leídos para las primeras 5 filas
            if (numeroFila <= 5) {
                System.out.println("=== DEBUG FILA " + numeroFila + " ===");
                System.out.println("Código: '" + codigoPersonalizado + "'");
                System.out.println("Descripción: '" + descripcion + "'");
                System.out.println("Tipo de celda cantidad: " + cellCantidad.getCellType());
                System.out.println("Valor raw cantidad: " + cellCantidad.getNumericCellValue());
                System.out.println("========================");
            }
            
            Integer cantidad = obtenerValorNumerico(cellCantidad);
            if (cantidad == null || cantidad < 0) {
                return Map.of("fila", numeroFila, "error", "Cantidad inválida: debe ser un número mayor o igual a 0");
            }

            return Map.of(
                "fila", numeroFila,
                "codigoPersonalizado", codigoPersonalizado.trim(),
                "descripcion", descripcion != null ? descripcion.trim() : "",
                "cantidad", cantidad,
                "actualizado", false // Se determinará durante la importación
            );

        } catch (Exception e) {
            return Map.of("fila", numeroFila, "error", "Error al procesar fila: " + e.getMessage());
        }
    }

    /**
     * Obtiene el valor de una celda como string
     */
    private String obtenerValorCelda(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Convertir número a string sin decimales si es entero
                    double valor = cell.getNumericCellValue();
                    if (valor == (long) valor) {
                        return String.valueOf((long) valor);
                    } else {
                        return String.valueOf(valor);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    /**
     * Obtiene el valor numérico de una celda
     */
    private Integer obtenerValorNumerico(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case NUMERIC:
                double valorNumeric = cell.getNumericCellValue();
                // Verificar si el valor es válido y no es NaN o infinito
                if (Double.isNaN(valorNumeric) || Double.isInfinite(valorNumeric)) {
                    return null;
                }
                // Redondear al entero más cercano
                return (int) Math.round(valorNumeric);
            case STRING:
                try {
                    String valorStr = cell.getStringCellValue().trim();
                    // Remover caracteres no numéricos excepto punto y coma
                    valorStr = valorStr.replaceAll("[^0-9.,]", "");
                    // Reemplazar coma por punto para decimales
                    valorStr = valorStr.replace(",", ".");
                    if (valorStr.isEmpty()) return null;
                    // Convertir a double primero y luego a int
                    double valorDouble = Double.parseDouble(valorStr);
                    return (int) Math.round(valorDouble);
                } catch (NumberFormatException e) {
                    return null;
                }
            case FORMULA:
                try {
                    // Para fórmulas, intentar evaluar el resultado
                    double valorFormula = cell.getNumericCellValue();
                    if (Double.isNaN(valorFormula) || Double.isInfinite(valorFormula)) {
                        return null;
                    }
                    return (int) Math.round(valorFormula);
                } catch (Exception e) {
                    return null;
                }
            default:
                return null;
        }
    }
}
