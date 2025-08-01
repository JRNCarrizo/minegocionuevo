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
    
    @Autowired
    private NotificacionService notificacionService;
    
    @Autowired
    private EmailService emailService;

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
     * Obtiene un cliente por email sin importar su estado de activación
     */
    public Optional<ClienteDTO> obtenerClientePorEmailCualquierEstado(Long empresaId, String email) {
        System.out.println("=== CLIENTE SERVICE - BUSCANDO CLIENTE ===");
        System.out.println("Email: " + email);
        System.out.println("Empresa ID: " + empresaId);
        
        Optional<Cliente> cliente = clienteRepository.findByEmailAndEmpresaId(email, empresaId);
        System.out.println("Cliente encontrado en BD: " + cliente.isPresent());
        
        if (cliente.isPresent()) {
            Cliente c = cliente.get();
            System.out.println("Cliente en BD - ID: " + c.getId() + ", Email: " + c.getEmail() + ", Activo: " + c.getActivo() + ", Verificado: " + c.getEmailVerificado());
        }
        
        Optional<ClienteDTO> resultado = cliente.map(this::convertirADTOConEstadisticas);
        System.out.println("Resultado DTO: " + resultado.isPresent());
        System.out.println("==========================================");
        
        return resultado;
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
        
        // Establecer estado de activación y verificación según el DTO
        cliente.setActivo(clienteDTO.getActivo() != null ? clienteDTO.getActivo() : true);
        cliente.setEmailVerificado(clienteDTO.getEmailVerificado() != null ? clienteDTO.getEmailVerificado() : false);
        cliente.setTokenVerificacion(clienteDTO.getTokenVerificacion());
        
        cliente.setEmpresa(empresa);
        
        System.out.println("Entidad Cliente antes de guardar:");
        System.out.println("  Nombre: '" + cliente.getNombre() + "'");
        System.out.println("  Apellidos: '" + cliente.getApellidos() + "'");
        System.out.println("  Email: '" + cliente.getEmail() + "'");

        Cliente clienteGuardado = clienteRepository.save(cliente);
        
        // Crear notificación de nuevo cliente
        notificacionService.crearNotificacionClienteNuevo(empresaId, clienteDTO.getNombre(), clienteDTO.getEmail());
        
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
        dto.setEmailVerificado(cliente.getEmailVerificado());
        dto.setTokenVerificacion(cliente.getTokenVerificacion());
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
        
        // Manejar cliente (puede ser null para pedidos públicos)
        if (pedido.getCliente() != null) {
            dto.setClienteId(pedido.getCliente().getId());
            dto.setClienteNombre(pedido.getCliente().getNombre() + " " + pedido.getCliente().getApellidos());
            dto.setClienteEmail(pedido.getCliente().getEmail());
            
            // Convertir cliente
            ClienteDTO clienteDTO = convertirADTO(pedido.getCliente());
            dto.setCliente(clienteDTO);
        } else {
            // Para pedidos públicos sin cliente registrado
            dto.setClienteId(null);
            dto.setClienteNombre("Cliente Público");
            dto.setClienteEmail(pedido.getClienteEmail());
            
            // Crear cliente DTO por defecto
            ClienteDTO clienteDTO = new ClienteDTO();
            clienteDTO.setId(null);
            clienteDTO.setNombre("Cliente");
            clienteDTO.setApellidos("Público");
            clienteDTO.setEmail(pedido.getClienteEmail());
            clienteDTO.setTelefono("");
            clienteDTO.setActivo(true);
            clienteDTO.setEmpresaId(pedido.getEmpresa().getId());
            clienteDTO.setEmpresaNombre(pedido.getEmpresa().getNombre());
            dto.setCliente(clienteDTO);
        }
        
        // Convertir detalles (simplificado)
        dto.setDetalles(new java.util.ArrayList<>());
        
        return dto;
    }

    /**
     * Verifica el email de un cliente usando el token de verificación
     */
    public boolean verificarEmailCliente(String tokenVerificacion) {
        Optional<Cliente> clienteOpt = clienteRepository.findByTokenVerificacion(tokenVerificacion);
        
        if (clienteOpt.isEmpty()) {
            return false;
        }
        
        Cliente cliente = clienteOpt.get();
        
        // Verificar que el token no haya expirado (24 horas)
        if (cliente.getFechaCreacion().plusHours(24).isBefore(java.time.LocalDateTime.now())) {
            return false;
        }
        
        // Activar el cliente y marcar email como verificado
        cliente.setActivo(true);
        cliente.setEmailVerificado(true);
        cliente.setTokenVerificacion(null); // Limpiar token usado
        
        clienteRepository.save(cliente);
        
        return true;
    }

    /**
     * Reenvía el email de verificación para un cliente
     */
    public boolean reenviarEmailVerificacionCliente(String email, String subdominio) {
        // Buscar cliente por email en la empresa específica
        Optional<Empresa> empresaOpt = empresaRepository.findBySubdominio(subdominio);
        if (empresaOpt.isEmpty()) {
            return false;
        }
        
        Optional<Cliente> clienteOpt = clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(email, empresaOpt.get().getId());
        if (clienteOpt.isEmpty()) {
            return false;
        }
        
        Cliente cliente = clienteOpt.get();
        
        // Solo reenviar si el email no está verificado
        if (cliente.getEmailVerificado()) {
            return false;
        }
        
        // Generar nuevo token si no tiene uno
        if (cliente.getTokenVerificacion() == null) {
            cliente.setTokenVerificacion(java.util.UUID.randomUUID().toString());
            clienteRepository.save(cliente);
        }
        
        // Enviar email de verificación
        try {
            emailService.enviarEmailVerificacionCliente(
                cliente.getEmail(),
                cliente.getNombre(),
                cliente.getTokenVerificacion(),
                subdominio
            );
            return true;
        } catch (Exception e) {
            System.err.println("Error reenviando email de verificación de cliente: " + e.getMessage());
            return false;
        }
    }

    /**
     * Marca un cliente como verificado (usado para Google login)
     */
    public ClienteDTO marcarClienteComoVerificado(Long empresaId, Long clienteId) {
        Cliente cliente = clienteRepository.findByIdAndEmpresaIdAndActivoTrue(clienteId, empresaId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        // Marcar como verificado y limpiar token
        cliente.setEmailVerificado(true);
        cliente.setTokenVerificacion(null);
        
        clienteRepository.save(cliente);
        
        return convertirADTOConEstadisticas(cliente);
    }
}
