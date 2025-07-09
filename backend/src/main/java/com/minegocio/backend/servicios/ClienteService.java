package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.dto.PedidoDTO;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Pedido;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private PedidoRepository pedidoRepository;

    public List<ClienteDTO> obtenerTodosLosClientes(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Cliente> clientes = clienteRepository.findByEmpresaAndActivoTrue(empresa);
        return clientes.stream()
                .map(this::convertirADTOConEstadisticas)
                .collect(Collectors.toList());
    }

    public Page<ClienteDTO> obtenerClientesPaginados(Long empresaId, Pageable pageable) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Page<Cliente> clientes = clienteRepository.findByEmpresaAndActivoTrue(empresa, pageable);
        return clientes.map(this::convertirADTOConEstadisticas);
    }

    public List<ClienteDTO> buscarClientes(Long empresaId, String termino) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Cliente> clientes = clienteRepository.buscarClientesPorTermino(empresa, termino);
        return clientes.stream()
                .map(this::convertirADTOConEstadisticas)
                .collect(Collectors.toList());
    }

    public Optional<ClienteDTO> obtenerClientePorId(Long empresaId, Long id) {
        Optional<Cliente> cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId);
        return cliente.map(this::convertirADTOConEstadisticas);
    }

    public Optional<ClienteDTO> obtenerClientePorEmail(Long empresaId, String email) {
        Optional<Cliente> cliente = clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(email, empresaId);
        return cliente.map(this::convertirADTOConEstadisticas);
    }
    
    /**
     * Obtiene un cliente con su historial completo de pedidos
     */
    public Optional<ClienteDTO> obtenerClienteConHistorial(Long empresaId, Long id) {
        Optional<Cliente> cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId);
        return cliente.map(this::convertirADTOConEstadisticas);
    }
    
    /**
     * Obtiene el historial de pedidos de un cliente
     */
    public List<PedidoDTO> obtenerHistorialPedidosCliente(Long empresaId, Long clienteId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        List<Pedido> pedidos = pedidoRepository.findPedidosCompletosPorCliente(cliente, empresa);
        
        return pedidos.stream()
                .map(this::convertirPedidoADTO)
                .collect(Collectors.toList());
    }

    public ClienteDTO crearCliente(Long empresaId, ClienteDTO clienteDTO) {
        System.out.println("=== DEBUG ClienteService.crearCliente ===");
        System.out.println("EmpresaId: " + empresaId);
        System.out.println("ClienteDTO recibido:");
        System.out.println("  Nombre: '" + clienteDTO.getNombre() + "'");
        System.out.println("  Apellidos: '" + clienteDTO.getApellidos() + "'");
        System.out.println("  Email: '" + clienteDTO.getEmail() + "'");
        System.out.println("  Password: '" + (clienteDTO.getPassword() != null ? "[PRESENTE - " + clienteDTO.getPassword().length() + " chars]" : "[NULL]") + "'");
        System.out.println("  Telefono: '" + clienteDTO.getTelefono() + "'");
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Verificar que no existe otro cliente con el mismo email en la empresa
        if (clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(clienteDTO.getEmail(), empresaId).isPresent()) {
            throw new RuntimeException("Ya existe un cliente con este email");
        }

        Cliente cliente = new Cliente();
        cliente.setNombre(clienteDTO.getNombre());
        cliente.setApellidos(clienteDTO.getApellidos()); // Corregido: usar getApellidos()
        cliente.setEmail(clienteDTO.getEmail());
        cliente.setTelefono(clienteDTO.getTelefono());
        cliente.setPassword(clienteDTO.getPassword()); // Agregar la contraseña
        cliente.setDireccion(clienteDTO.getDireccion());
        cliente.setCiudad(clienteDTO.getCiudad());
        cliente.setPais(clienteDTO.getPais());
        cliente.setCodigoPostal(clienteDTO.getCodigoPostal());
        cliente.setActivo(true);
        cliente.setEmpresa(empresa);
        
        System.out.println("Entidad Cliente antes de guardar:");
        System.out.println("  Nombre: '" + cliente.getNombre() + "'");
        System.out.println("  Apellidos: '" + cliente.getApellidos() + "'");
        System.out.println("  Email: '" + cliente.getEmail() + "'");

        Cliente clienteGuardado = clienteRepository.save(cliente);
        return convertirADTOConEstadisticas(clienteGuardado);
    }

    public ClienteDTO actualizarCliente(Long empresaId, Long id, ClienteDTO clienteDTO) {
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Verificar que no existe otro cliente con el mismo email (excepto el actual)
        Optional<Cliente> clienteExistente = clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(clienteDTO.getEmail(), empresaId);
        if (clienteExistente.isPresent() && !clienteExistente.get().getId().equals(id)) {
            throw new RuntimeException("Ya existe otro cliente con este email");
        }

        cliente.setNombre(clienteDTO.getNombre());
        cliente.setApellidos(clienteDTO.getApellidos()); // Usar apellidos en lugar de apellido
        cliente.setEmail(clienteDTO.getEmail());
        cliente.setTelefono(clienteDTO.getTelefono());
        cliente.setDireccion(clienteDTO.getDireccion());
        cliente.setCiudad(clienteDTO.getCiudad());
        cliente.setPais(clienteDTO.getPais());
        cliente.setCodigoPostal(clienteDTO.getCodigoPostal());
        
        // Actualizar contraseña solo si se proporciona
        if (clienteDTO.getPassword() != null && !clienteDTO.getPassword().isEmpty()) {
            cliente.setPassword(clienteDTO.getPassword());
        }

        Cliente clienteActualizado = clienteRepository.save(cliente);
        return convertirADTOConEstadisticas(clienteActualizado);
    }

    public void eliminarCliente(Long empresaId, Long id) {
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    public long contarClientesActivos(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        return clienteRepository.countByEmpresaAndActivoTrue(empresa);
    }

    private ClienteDTO convertirADTO(Cliente cliente) {
        ClienteDTO dto = new ClienteDTO();
        dto.setId(cliente.getId());
        dto.setNombre(cliente.getNombre());
        dto.setApellidos(cliente.getApellidos());
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setDireccion(cliente.getDireccion());
        dto.setCiudad(cliente.getCiudad());
        dto.setPais(cliente.getPais());
        dto.setCodigoPostal(cliente.getCodigoPostal());
        dto.setActivo(cliente.getActivo());
        dto.setEmpresaId(cliente.getEmpresa().getId());
        dto.setEmpresaNombre(cliente.getEmpresa().getNombre());
        dto.setPassword(cliente.getPassword()); // ¡IMPORTANTE! Incluir la contraseña
        dto.setFechaCreacion(cliente.getFechaCreacion());
        dto.setFechaActualizacion(cliente.getFechaActualizacion());
        return dto;
    }
    
    private ClienteDTO convertirADTOConEstadisticas(Cliente cliente) {
        ClienteDTO dto = convertirADTO(cliente);
        
        // Calcular estadísticas de pedidos
        Long totalPedidos = pedidoRepository.contarPedidosPorCliente(cliente, cliente.getEmpresa());
        Double totalCompras = pedidoRepository.sumaTotalComprasPorCliente(cliente, cliente.getEmpresa());
        
        dto.setTotalPedidos(totalPedidos != null ? totalPedidos.intValue() : 0);
        dto.setTotalCompras(totalCompras != null ? totalCompras : 0.0);
        
        return dto;
    }
    
    private PedidoDTO convertirPedidoADTO(Pedido pedido) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(pedido.getId());
        dto.setNumeroPedido(pedido.getNumeroPedido());
        dto.setEstado(pedido.getEstado());
        dto.setTotal(pedido.getTotal());
        dto.setNotas(pedido.getObservaciones());
        dto.setDireccionEntrega(pedido.getDireccionEntrega());
        dto.setFechaCreacion(pedido.getFechaCreacion());
        dto.setEmpresaId(pedido.getEmpresa().getId());
        dto.setEmpresaNombre(pedido.getEmpresa().getNombre());
        dto.setClienteId(pedido.getCliente().getId());
        dto.setClienteNombre(pedido.getCliente().getNombre() + " " + pedido.getCliente().getApellidos());
        dto.setClienteEmail(pedido.getCliente().getEmail());
        
        // Convertir cliente
        ClienteDTO clienteDTO = convertirADTO(pedido.getCliente());
        dto.setCliente(clienteDTO);
        
        // Convertir detalles (simplificado)
        dto.setDetalles(new java.util.ArrayList<>());
        
        return dto;
    }
}
