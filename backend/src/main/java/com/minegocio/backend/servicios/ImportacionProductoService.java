package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ImportacionProductoDTO;
import com.minegocio.backend.dto.ResultadoImportacionDTO;
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

@Service
public class ImportacionProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private LimiteService limiteService;

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
                    Arrays.asList(Map.of("fila", 1, "error", "Formato de archivo incorrecto. No se encontraron los encabezados esperados. Verifique que tenga las columnas: Nombre*, Marca, Descripción, Categoría, Sector Almacenamiento, Stock Actual*, Stock Mínimo, Precio, Código de Barras, Código Personalizado, Estado")),
                    new ArrayList<>(), "Formato de archivo incorrecto");
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            if (headerRow == null || !validarEncabezados(headerRow)) {
                return new ResultadoImportacionDTO(0, 0, 1,
                    Arrays.asList(Map.of("fila", headerRowIndex + 1, "error", "Formato de archivo incorrecto. Verifique que tenga las columnas: Nombre*, Marca, Descripción, Categoría, Sector Almacenamiento, Stock Actual*, Stock Mínimo, Precio, Código de Barras, Código Personalizado, Estado")),
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
     * Importa los productos validados a la base de datos
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

        for (int i = 0; i < productos.size(); i++) {
            ImportacionProductoDTO productoDTO = productos.get(i);
            
            try {
                // Verificar límites de la suscripción
                if (!limiteService.puedeCrearProducto(empresaId)) {
                    errores.add(Map.of(
                        "fila", i + 2,
                        "error", "Límite de productos alcanzado en su suscripción"
                    ));
                    continue;
                }

                // Crear el producto
                Producto producto = new Producto();
                producto.setNombre(productoDTO.getNombre());
                producto.setDescripcion(productoDTO.getDescripcion());
                // Manejar precio opcional - si es null, establecer null (no 0)
                producto.setPrecio(productoDTO.getPrecio());
                producto.setStock(productoDTO.getStock());
                producto.setStockMinimo(productoDTO.getStockMinimo());
                producto.setCategoria(productoDTO.getCategoria());
                producto.setMarca(productoDTO.getMarca());
                producto.setSectorAlmacenamiento(productoDTO.getSectorAlmacenamiento());
                producto.setCodigoBarras(productoDTO.getCodigoBarras());
                producto.setCodigoPersonalizado(productoDTO.getCodigoPersonalizado());
                producto.setEmpresa(empresa);
                // Manejar estado - por defecto activo si no se especifica
                producto.setActivo("Activo".equalsIgnoreCase(productoDTO.getEstado()));

                productoRepository.save(producto);
                registrosExitosos++;

            } catch (Exception e) {
                System.err.println("Error al importar producto en fila " + (i + 2) + ": " + e.getMessage());
                e.printStackTrace();
                errores.add(Map.of(
                    "fila", i + 2,
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
     * Busca la fila que contiene los encabezados esperados
     */
    private int encontrarFilaEncabezados(Sheet sheet) {
        String[] headersEsperados = {
            "Nombre*", "Marca", "Descripción", "Categoría", 
            "Sector Almacenamiento", "Stock Actual*", "Stock Mínimo", 
            "Precio", "Código de Barras", "Código Personalizado", "Estado"
        };
        
        System.out.println("🔍 Buscando encabezados en las primeras filas del archivo...");
        System.out.println("📋 Encabezados esperados: " + String.join(", ", headersEsperados));
        
        // Buscar en las primeras 15 filas (cubre reporte de stock y plantilla)
        for (int rowIndex = 0; rowIndex <= Math.min(15, sheet.getLastRowNum()); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                String encabezadosFila = obtenerEncabezadosFila(row);
                System.out.println("🔍 Fila " + rowIndex + ": " + encabezadosFila);
                
                // Verificar si esta fila tiene suficientes celdas
                if (row.getLastCellNum() >= 11) {
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
        for (int i = 0; i < 11; i++) {
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
     * Valida que los encabezados del archivo sean correctos (formato del reporte de stock)
     */
    private boolean validarEncabezados(Row headerRow) {
        String[] headersEsperados = {
            "Nombre*", "Marca", "Descripción", "Categoría", 
            "Sector Almacenamiento", "Stock Actual*", "Stock Mínimo", 
            "Precio", "Código de Barras", "Código Personalizado", "Estado"
        };
        
        System.out.println("🔍 Validando encabezados de la fila...");
        
        for (int i = 0; i < headersEsperados.length; i++) {
            Cell cell = headerRow.getCell(i);
            String valorCelda = obtenerValorCelda(cell);
            
            if (cell == null) {
                System.out.println("❌ Columna " + i + " está vacía, esperado: '" + headersEsperados[i] + "'");
                return false;
            }
            
            if (!headersEsperados[i].equals(valorCelda)) {
                System.out.println("❌ Encabezado no coincide en columna " + i + ": esperado='" + headersEsperados[i] + "', encontrado='" + valorCelda + "'");
                return false;
            }
            
            System.out.println("✅ Columna " + i + ": '" + valorCelda + "' coincide");
        }
        
        System.out.println("✅ Todos los encabezados coinciden perfectamente");
        return true;
    }

    /**
     * Valida una fila de datos (formato del reporte de stock)
     */
    private Map<String, Object> validarFila(Row row, int numeroFila, Long empresaId) {
        // Validar nombre (obligatorio)
        String nombre = obtenerValorCelda(row.getCell(0));
        if (nombre == null || nombre.trim().isEmpty()) {
            return Map.of("fila", numeroFila, "error", "El nombre es obligatorio");
        }
        if (nombre.length() > 200) {
            return Map.of("fila", numeroFila, "error", "El nombre no puede exceder 200 caracteres");
        }

        // Validar marca (opcional pero con límite)
        String marca = obtenerValorCelda(row.getCell(1));
        if (marca != null && marca.length() > 100) {
            return Map.of("fila", numeroFila, "error", "La marca no puede exceder 100 caracteres");
        }

        // Validar descripción (opcional pero con límite)
        String descripcion = obtenerValorCelda(row.getCell(2));
        if (descripcion != null && descripcion.length() > 1000) {
            return Map.of("fila", numeroFila, "error", "La descripción no puede exceder 1000 caracteres");
        }

        // Validar categoría (opcional pero con límite)
        String categoria = obtenerValorCelda(row.getCell(3));
        if (categoria != null && categoria.length() > 100) {
            return Map.of("fila", numeroFila, "error", "La categoría no puede exceder 100 caracteres");
        }

        // Validar sector de almacenamiento (opcional pero con límite)
        String sectorAlmacenamiento = obtenerValorCelda(row.getCell(4));
        if (sectorAlmacenamiento != null && sectorAlmacenamiento.length() > 100) {
            return Map.of("fila", numeroFila, "error", "El sector de almacenamiento no puede exceder 100 caracteres");
        }

        // Validar stock actual (obligatorio)
        Integer stock = obtenerValorEntero(row.getCell(5));
        if (stock == null || stock < 0) {
            return Map.of("fila", numeroFila, "error", "El stock actual debe ser un número mayor o igual a 0");
        }

        // Validar stock mínimo (opcional)
        Integer stockMinimo = obtenerValorEntero(row.getCell(6));
        if (stockMinimo != null && stockMinimo < 0) {
            return Map.of("fila", numeroFila, "error", "El stock mínimo debe ser un número mayor o igual a 0");
        }

        // Validar precio (opcional)
        BigDecimal precio = obtenerValorDecimal(row.getCell(7));
        if (precio != null && precio.compareTo(BigDecimal.ZERO) <= 0) {
            return Map.of("fila", numeroFila, "error", "El precio debe ser mayor a 0 si se especifica");
        }

        // Validar código de barras (opcional pero con límite)
        String codigoBarras = obtenerValorCelda(row.getCell(8));
        if (codigoBarras != null && codigoBarras.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código de barras no puede exceder 50 caracteres");
        }

        // Validar código personalizado (opcional pero con límite)
        String codigoPersonalizado = obtenerValorCelda(row.getCell(9));
        if (codigoPersonalizado != null && codigoPersonalizado.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código personalizado no puede exceder 50 caracteres");
        }

        // Validar estado (opcional)
        String estado = obtenerValorCelda(row.getCell(10));
        if (estado != null && !estado.equalsIgnoreCase("Activo") && !estado.equalsIgnoreCase("Inactivo")) {
            return Map.of("fila", numeroFila, "error", "El estado debe ser 'Activo' o 'Inactivo'");
        }

        return null; // Sin errores
    }

    /**
     * Convierte una fila de Excel a DTO de producto (formato del reporte de stock)
     */
    private ImportacionProductoDTO convertirFilaAProducto(Row row) {
        return new ImportacionProductoDTO(
            obtenerValorCelda(row.getCell(0)), // nombre
            obtenerValorCelda(row.getCell(2)), // descripcion
            obtenerValorDecimal(row.getCell(7)), // precio
            obtenerValorEntero(row.getCell(5)), // stock
            obtenerValorEntero(row.getCell(6)), // stockMinimo
            obtenerValorCelda(row.getCell(3)), // categoria
            obtenerValorCelda(row.getCell(1)), // marca
            obtenerValorCelda(row.getCell(4)), // sectorAlmacenamiento
            obtenerValorCelda(row.getCell(8)), // codigoBarras
            obtenerValorCelda(row.getCell(9)), // codigoPersonalizado
            obtenerValorCelda(row.getCell(10)) // estado
        );
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
