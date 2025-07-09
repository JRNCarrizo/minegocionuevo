package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    public List<ProductoDTO> obtenerTodosLosProductos(Long empresaId) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndActivoTrue(empresaId);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<ProductoDTO> obtenerTodosLosProductosIncluirInactivos(Long empresaId) {
        List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public Page<ProductoDTO> obtenerProductosPaginados(Long empresaId, Pageable pageable) {
        Page<Producto> productos = productoRepository.findByEmpresaIdAndActivoTrue(empresaId, pageable);
        return productos.map(this::convertirADTO);
    }

    public List<ProductoDTO> buscarProductos(Long empresaId, String termino) {
        List<Producto> productos = productoRepository.buscarPorNombreOCategoria(empresaId, termino);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public Optional<ProductoDTO> obtenerProductoPorId(Long empresaId, Long id) {
        Optional<Producto> producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId);
        return producto.map(this::convertirADTO);
    }

    /**
     * Obtiene un producto por ID sin filtro de activo (para edición)
     */
    public Optional<ProductoDTO> obtenerProductoPorIdSinFiltro(Long empresaId, Long id) {
        Optional<Producto> producto = productoRepository.findByIdAndEmpresaId(id, empresaId);
        return producto.map(this::convertirADTO);
    }

    public ProductoDTO crearProducto(Long empresaId, ProductoDTO productoDTO) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Producto producto = new Producto();
        producto.setNombre(productoDTO.getNombre());
        producto.setDescripcion(productoDTO.getDescripcion());
        producto.setPrecio(productoDTO.getPrecio());
        producto.setStock(productoDTO.getStock());
        producto.setStockMinimo(productoDTO.getStockMinimo());
        
        // Manejar imágenes
        if (productoDTO.getImagenes() != null && !productoDTO.getImagenes().isEmpty()) {
            producto.setImagenes(new ArrayList<>(productoDTO.getImagenes()));
        } else if (productoDTO.getImagenUrl() != null && !productoDTO.getImagenUrl().isEmpty()) {
            // Compatibilidad hacia atrás
            producto.getImagenes().add(productoDTO.getImagenUrl());
        }
        
        producto.setCategoria(productoDTO.getCategoria());
        producto.setMarca(productoDTO.getMarca());
        producto.setActivo(true);
        producto.setEmpresa(empresa);

        Producto productoGuardado = productoRepository.save(producto);
        return convertirADTO(productoGuardado);
    }

    public ProductoDTO actualizarProducto(Long empresaId, Long id, ProductoDTO productoDTO) {
        // Usar findByIdAndEmpresaId para permitir actualizar productos inactivos
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Solo actualizar campos que no son null
        if (productoDTO.getNombre() != null) {
            producto.setNombre(productoDTO.getNombre());
        }
        
        if (productoDTO.getDescripcion() != null) {
            producto.setDescripcion(productoDTO.getDescripcion());
        }
        
        if (productoDTO.getPrecio() != null) {
            producto.setPrecio(productoDTO.getPrecio());
        }
        
        if (productoDTO.getStock() != null) {
            producto.setStock(productoDTO.getStock());
        }
        
        if (productoDTO.getStockMinimo() != null) {
            producto.setStockMinimo(productoDTO.getStockMinimo());
        }
        
        if (productoDTO.getCategoria() != null) {
            producto.setCategoria(productoDTO.getCategoria());
        }
        
        if (productoDTO.getMarca() != null) {
            producto.setMarca(productoDTO.getMarca());
        }
        
        if (productoDTO.getActivo() != null) {
            producto.setActivo(productoDTO.getActivo());
        }
        
        if (productoDTO.getDestacado() != null) {
            producto.setDestacado(productoDTO.getDestacado());
        }
        
        // Actualizar imágenes si se proporciona
        if (productoDTO.getImagenes() != null) {
            producto.setImagenes(new ArrayList<>(productoDTO.getImagenes()));
        }
        
        // Actualizar imagen principal si se proporciona (para compatibilidad)
        if (productoDTO.getImagenUrl() != null && !productoDTO.getImagenUrl().isEmpty()) {
            if (producto.getImagenes().isEmpty()) {
                producto.getImagenes().add(productoDTO.getImagenUrl());
            } else if (!producto.getImagenes().contains(productoDTO.getImagenUrl())) {
                producto.getImagenes().set(0, productoDTO.getImagenUrl());
            }
        }

        Producto productoActualizado = productoRepository.save(producto);
        return convertirADTO(productoActualizado);
    }

    public void eliminarProducto(Long empresaId, Long id) {
        Producto producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public void actualizarStock(Long empresaId, Long id, Integer nuevoStock) {
        // Usar findByIdAndEmpresaId para permitir actualizar stock de productos inactivos
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
    }

    public List<ProductoDTO> obtenerProductosConStockBajo(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Producto> productos = productoRepository.findProductosConStockBajo(empresa);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<ProductoDTO> obtenerProductosPorCategoria(Long empresaId, String categoria) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCategoriaAndActivoTrue(empresaId, categoria);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos por empresa y estado específico
     */
    public List<ProductoDTO> obtenerProductosPorEstado(Long empresaId, Boolean activo) {
        List<Producto> productos;
        
        if (activo == null) {
            // Si activo es null, obtener todos (activos e inactivos)
            productos = productoRepository.findByEmpresaId(empresaId);
        } else {
            // Filtrar por estado específico
            productos = productoRepository.findByEmpresaIdAndActivo(empresaId, activo);
        }
        
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos paginados por empresa y estado específico
     */
    public Page<ProductoDTO> obtenerProductosPaginadosPorEstado(Long empresaId, Boolean activo, Pageable pageable) {
        Page<Producto> productos;
        
        if (activo == null) {
            // Si activo es null, obtener todos (activos e inactivos)
            productos = productoRepository.findByEmpresaId(empresaId, pageable);
        } else {
            // Filtrar por estado específico
            productos = productoRepository.findByEmpresaIdAndActivo(empresaId, activo, pageable);
        }
        
        return productos.map(this::convertirADTO);
    }

    /**
     * Obtiene todas las categorías únicas de productos activos de una empresa
     */
    public List<String> obtenerCategoriasPorEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            throw new RuntimeException("Empresa no encontrada");
        }
        
        return productoRepository.findCategoriasPorEmpresa(empresaOpt.get());
    }

    private ProductoDTO convertirADTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setStock(producto.getStock());
        dto.setStockMinimo(producto.getStockMinimo());
        dto.setImagenUrl(producto.getImagenPrincipal());
        dto.setImagenes(new ArrayList<>(producto.getImagenes()));
        dto.setCategoria(producto.getCategoria());
        dto.setMarca(producto.getMarca());
        dto.setActivo(producto.getActivo());
        dto.setDestacado(producto.getDestacado());
        dto.setEmpresaId(producto.getEmpresa().getId());
        dto.setEmpresaNombre(producto.getEmpresa().getNombre());
        dto.setFechaCreacion(producto.getFechaCreacion());
        dto.setFechaActualizacion(producto.getFechaActualizacion());
        return dto;
    }
}
