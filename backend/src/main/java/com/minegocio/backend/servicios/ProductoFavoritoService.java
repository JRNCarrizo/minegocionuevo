package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ProductoFavoritoDTO;
import com.minegocio.backend.entidades.ProductoFavorito;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.repositorios.ProductoFavoritoRepository;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductoFavoritoService {

    @Autowired
    private ProductoFavoritoRepository productoFavoritoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    /**
     * Agregar un producto a favoritos
     */
    public ProductoFavoritoDTO agregarFavorito(Long clienteId, Long productoId, Long empresaId) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Verificar si ya es favorito
        Optional<ProductoFavorito> favoritoExistente = productoFavoritoRepository
                .findByClienteAndProductoAndEmpresa(cliente, producto, empresa);
        
        if (favoritoExistente.isPresent()) {
            throw new RuntimeException("El producto ya está en favoritos");
        }

        // Crear nuevo favorito
        ProductoFavorito nuevoFavorito = new ProductoFavorito(cliente, producto, empresa);
        ProductoFavorito favoritoGuardado = productoFavoritoRepository.save(nuevoFavorito);

        return new ProductoFavoritoDTO(favoritoGuardado);
    }

    /**
     * Remover un producto de favoritos
     */
    public void removerFavorito(Long clienteId, Long productoId, Long empresaId) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Buscar y eliminar el favorito
        Optional<ProductoFavorito> favorito = productoFavoritoRepository
                .findByClienteAndProductoAndEmpresa(cliente, producto, empresa);
        
        if (favorito.isEmpty()) {
            throw new RuntimeException("El producto no está en favoritos");
        }

        productoFavoritoRepository.delete(favorito.get());
    }

    /**
     * Obtener todos los productos favoritos de un cliente
     */
    public List<ProductoFavoritoDTO> obtenerFavoritos(Long clienteId, Long empresaId) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Obtener favoritos con información del producto
        List<ProductoFavorito> favoritos = productoFavoritoRepository.findFavoritosConProducto(cliente, empresa);

        return favoritos.stream()
                .map(ProductoFavoritoDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Verificar si un producto es favorito
     */
    public boolean esFavorito(Long clienteId, Long productoId, Long empresaId) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return productoFavoritoRepository.findByClienteAndProductoAndEmpresa(cliente, producto, empresa).isPresent();
    }

    /**
     * Contar productos favoritos de un cliente
     */
    public long contarFavoritos(Long clienteId, Long empresaId) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return productoFavoritoRepository.countByClienteAndEmpresa(cliente, empresa);
    }
} 