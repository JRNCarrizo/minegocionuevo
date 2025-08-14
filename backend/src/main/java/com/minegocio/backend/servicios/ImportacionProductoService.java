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

                    // Validar que el archivo tenga el formato correcto
        Row headerRow = sheet.getRow(0);
        if (headerRow == null || !validarEncabezados(headerRow)) {
            return new ResultadoImportacionDTO(0, 0, 1,
                Arrays.asList(Map.of("fila", 1, "error", "Formato de archivo incorrecto. Verifique que tenga las columnas: Nombre, Marca, Descripción, Precio, Stock, Categoría, Sector_Almacenamiento, Código_Barras, Código_Personalizado")),
                new ArrayList<>(), "Formato de archivo incorrecto");
        }

            // Procesar cada fila de datos
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
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

        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

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
                producto.setCategoria(productoDTO.getCategoria());
                producto.setMarca(productoDTO.getMarca());
                producto.setSectorAlmacenamiento(productoDTO.getSectorAlmacenamiento());
                producto.setCodigoBarras(productoDTO.getCodigoBarras());
                producto.setCodigoPersonalizado(productoDTO.getCodigoPersonalizado());
                producto.setEmpresa(empresa);
                producto.setActivo(true);

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
     * Genera una plantilla Excel para descargar
     */
    public byte[] generarPlantillaExcel() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Productos");

            // Crear estilo para encabezados
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Crear encabezados
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Nombre*", "Marca", "Descripción", "Precio", "Stock*", "Categoría", "Sector_Almacenamiento", "Código_Barras", "Código_Personalizado"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Crear fila de ejemplo
            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("Producto Ejemplo");
            exampleRow.createCell(1).setCellValue("Samsung");
            exampleRow.createCell(2).setCellValue("Descripción del producto");
            exampleRow.createCell(3).setCellValue(100.50);
            exampleRow.createCell(4).setCellValue(50);
            exampleRow.createCell(5).setCellValue("Electrónicos");
            exampleRow.createCell(6).setCellValue("Depósito A");
            exampleRow.createCell(7).setCellValue("1234567890123");
            exampleRow.createCell(8).setCellValue("PROD-001");

            // Ajustar ancho de columnas
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Convertir a bytes con manejo de errores
            try (java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream()) {
                workbook.write(outputStream);
                outputStream.flush();
                byte[] result = outputStream.toByteArray();
                
                if (result == null || result.length == 0) {
                    throw new IOException("Error: El archivo generado está vacío");
                }
                
                return result;
            } catch (Exception e) {
                throw new IOException("Error al generar el archivo Excel: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            throw new IOException("Error al crear el workbook Excel: " + e.getMessage(), e);
        }
    }

    /**
     * Valida que los encabezados del archivo sean correctos
     */
    private boolean validarEncabezados(Row headerRow) {
        String[] headersEsperados = {"Nombre*", "Marca", "Descripción", "Precio", "Stock*", "Categoría", "Sector_Almacenamiento", "Código_Barras", "Código_Personalizado"};
        
        for (int i = 0; i < headersEsperados.length; i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null || !headersEsperados[i].equals(cell.getStringCellValue())) {
                return false;
            }
        }
        return true;
    }

    /**
     * Valida una fila de datos
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

        // Validar precio (opcional pero debe ser positivo si existe)
        BigDecimal precio = obtenerValorDecimal(row.getCell(3));
        if (precio != null && precio.compareTo(BigDecimal.ZERO) <= 0) {
            return Map.of("fila", numeroFila, "error", "El precio debe ser mayor a 0");
        }

        // Validar stock (obligatorio)
        Integer stock = obtenerValorEntero(row.getCell(4));
        if (stock == null || stock < 0) {
            return Map.of("fila", numeroFila, "error", "El stock debe ser un número mayor o igual a 0");
        }

        // Validar categoría (opcional pero con límite)
        String categoria = obtenerValorCelda(row.getCell(5));
        if (categoria != null && categoria.length() > 100) {
            return Map.of("fila", numeroFila, "error", "La categoría no puede exceder 100 caracteres");
        }

        // Validar sector de almacenamiento (opcional pero con límite)
        String sectorAlmacenamiento = obtenerValorCelda(row.getCell(6));
        if (sectorAlmacenamiento != null && sectorAlmacenamiento.length() > 100) {
            return Map.of("fila", numeroFila, "error", "El sector de almacenamiento no puede exceder 100 caracteres");
        }

        // Validar código de barras (opcional pero con límite)
        String codigoBarras = obtenerValorCelda(row.getCell(7));
        if (codigoBarras != null && codigoBarras.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código de barras no puede exceder 50 caracteres");
        }

        // Validar código personalizado (opcional pero con límite)
        String codigoPersonalizado = obtenerValorCelda(row.getCell(8));
        if (codigoPersonalizado != null && codigoPersonalizado.length() > 50) {
            return Map.of("fila", numeroFila, "error", "El código personalizado no puede exceder 50 caracteres");
        }

        return null; // Sin errores
    }

    /**
     * Convierte una fila de Excel a DTO de producto
     */
    private ImportacionProductoDTO convertirFilaAProducto(Row row) {
        return new ImportacionProductoDTO(
            obtenerValorCelda(row.getCell(0)), // nombre
            obtenerValorCelda(row.getCell(2)), // descripcion
            obtenerValorDecimal(row.getCell(3)), // precio
            obtenerValorEntero(row.getCell(4)), // stock
            obtenerValorCelda(row.getCell(5)), // categoria
            obtenerValorCelda(row.getCell(1)), // marca
            obtenerValorCelda(row.getCell(6)), // sectorAlmacenamiento
            obtenerValorCelda(row.getCell(7)), // codigoBarras
            obtenerValorCelda(row.getCell(8))  // codigoPersonalizado
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
                return String.valueOf((int) cell.getNumericCellValue());
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
                    return Integer.parseInt(cell.getStringCellValue().trim());
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
                    return new BigDecimal(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }
}
