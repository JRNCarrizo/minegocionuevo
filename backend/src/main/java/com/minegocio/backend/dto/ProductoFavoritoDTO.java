package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.ProductoFavorito;
import com.minegocio.backend.entidades.Producto;
import java.time.LocalDateTime;

public class ProductoFavoritoDTO {
    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private ProductoDTO producto;
    private Long empresaId;
    private String empresaNombre;
    private LocalDateTime fechaAgregado;
    
    // Constructores
    public ProductoFavoritoDTO() {}
    
    public ProductoFavoritoDTO(ProductoFavorito productoFavorito) {
        this.id = productoFavorito.getId();
        
        // Manejar cliente (puede ser null)
        if (productoFavorito.getCliente() != null) {
            this.clienteId = productoFavorito.getCliente().getId();
            this.clienteNombre = productoFavorito.getCliente().getNombre() + " " + 
                               (productoFavorito.getCliente().getApellidos() != null ? productoFavorito.getCliente().getApellidos() : "");
        } else {
            this.clienteId = null;
            this.clienteNombre = "Cliente Público";
        }
        
        this.producto = convertirProductoADTO(productoFavorito.getProducto());
        this.empresaId = productoFavorito.getEmpresa().getId();
        this.empresaNombre = productoFavorito.getEmpresa().getNombre();
        this.fechaAgregado = productoFavorito.getFechaAgregado();
    }
    
    // Constructor para crear desde Producto
    public ProductoFavoritoDTO(Long clienteId, String clienteNombre, Producto producto, Long empresaId, String empresaNombre) {
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.producto = convertirProductoADTO(producto);
        this.empresaId = empresaId;
        this.empresaNombre = empresaNombre;
        this.fechaAgregado = LocalDateTime.now();
    }
    
    // Método auxiliar para convertir Producto a ProductoDTO
    private ProductoDTO convertirProductoADTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setStock(producto.getStock());
        dto.setStockMinimo(producto.getStockMinimo());
        dto.setImagenUrl(producto.getImagenPrincipal()); // Usar getImagenPrincipal() en lugar de getImagenUrl()
        dto.setImagenes(producto.getImagenes());
        dto.setCategoria(producto.getCategoria());
        dto.setMarca(producto.getMarca());
        dto.setUnidad(producto.getUnidad());
        dto.setSectorAlmacenamiento(producto.getSectorAlmacenamiento());
        dto.setCodigoPersonalizado(producto.getCodigoPersonalizado());
        dto.setCodigoBarras(producto.getCodigoBarras());
        dto.setActivo(producto.getActivo());
        dto.setDestacado(producto.getDestacado());
        dto.setEmpresaId(producto.getEmpresa().getId());
        dto.setEmpresaNombre(producto.getEmpresa().getNombre());
        dto.setFechaCreacion(producto.getFechaCreacion());
        dto.setFechaActualizacion(producto.getFechaActualizacion());
        return dto;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getClienteId() {
        return clienteId;
    }
    
    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }
    
    public String getClienteNombre() {
        return clienteNombre;
    }
    
    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }
    
    public ProductoDTO getProducto() {
        return producto;
    }
    
    public void setProducto(ProductoDTO producto) {
        this.producto = producto;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public String getEmpresaNombre() {
        return empresaNombre;
    }
    
    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }
    
    public LocalDateTime getFechaAgregado() {
        return fechaAgregado;
    }
    
    public void setFechaAgregado(LocalDateTime fechaAgregado) {
        this.fechaAgregado = fechaAgregado;
    }
} 