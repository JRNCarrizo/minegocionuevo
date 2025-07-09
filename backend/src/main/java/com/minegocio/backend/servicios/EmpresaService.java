package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.RegistroEmpresaDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio para la gestión de empresas
 */
@Service
@Transactional
public class EmpresaService {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Registra una nueva empresa con su administrador
     */
    public EmpresaDTO registrarEmpresa(RegistroEmpresaDTO registroDTO) {
        // Validar que no exista el subdominio
        if (empresaRepository.existsBySubdominio(registroDTO.getSubdominio())) {
            throw new RuntimeException("El subdominio ya está en uso");
        }

        // Validar que no exista el email de la empresa
        if (empresaRepository.existsByEmail(registroDTO.getEmailEmpresa())) {
            throw new RuntimeException("El email de la empresa ya está registrado");
        }

        // Validar que no exista el email del administrador
        if (usuarioRepository.existsByEmail(registroDTO.getEmailAdministrador())) {
            throw new RuntimeException("El email del administrador ya está registrado");
        }

        // Crear la empresa
        Empresa empresa = new Empresa();
        empresa.setNombre(registroDTO.getNombreEmpresa());
        empresa.setSubdominio(registroDTO.getSubdominio().toLowerCase());
        empresa.setEmail(registroDTO.getEmailEmpresa());
        empresa.setTelefono(registroDTO.getTelefonoEmpresa());
        empresa.setDescripcion(registroDTO.getDescripcionEmpresa());
        empresa.setFechaFinPrueba(LocalDateTime.now().plusMonths(1)); // 1 mes de prueba

        empresa = empresaRepository.save(empresa);

        // Crear el usuario administrador
        Usuario administrador = new Usuario();
        administrador.setNombre(registroDTO.getNombreAdministrador());
        administrador.setApellidos(registroDTO.getApellidosAdministrador());
        administrador.setEmail(registroDTO.getEmailAdministrador());
        administrador.setPassword(passwordEncoder.encode(registroDTO.getPasswordAdministrador()));
        administrador.setTelefono(registroDTO.getTelefonoAdministrador());
        administrador.setRol(Usuario.RolUsuario.ADMINISTRADOR);
        administrador.setEmpresa(empresa);
        administrador.setTokenVerificacion(UUID.randomUUID().toString());

        usuarioRepository.save(administrador);

        return new EmpresaDTO(empresa);
    }

    /**
     * Busca una empresa por su subdominio
     */
    public Optional<EmpresaDTO> buscarPorSubdominio(String subdominio) {
        return empresaRepository.findBySubdominio(subdominio)
                .map(EmpresaDTO::new);
    }

    /**
     * Verifica si un subdominio está disponible
     */
    public boolean verificarDisponibilidadSubdominio(String subdominio) {
        return !empresaRepository.existsBySubdominio(subdominio.toLowerCase());
    }

    /**
     * Actualiza la personalización de una empresa
     */
    public EmpresaDTO actualizarPersonalizacion(Long empresaId, String logoUrl, String colorPrimario, String colorSecundario) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (logoUrl != null) {
            empresa.setLogoUrl(logoUrl);
        }
        if (colorPrimario != null) {
            empresa.setColorPrimario(colorPrimario);
        }
        if (colorSecundario != null) {
            empresa.setColorSecundario(colorSecundario);
        }

        empresa = empresaRepository.save(empresa);
        return new EmpresaDTO(empresa);
    }

    /**
     * Obtiene información de una empresa por ID
     */
    public Optional<EmpresaDTO> obtenerPorId(Long id) {
        return empresaRepository.findById(id)
                .map(EmpresaDTO::new);
    }

    /**
     * Obtiene una empresa por su subdominio
     */
    public Optional<Empresa> obtenerPorSubdominio(String subdominio) {
        return empresaRepository.findBySubdominio(subdominio);
    }

    /**
     * Obtiene todas las empresas (para debug)
     */
    public List<Empresa> obtenerTodasLasEmpresas() {
        return empresaRepository.findAll();
    }

    /**
     * Guarda una empresa
     */
    public Empresa guardar(Empresa empresa) {
        return empresaRepository.save(empresa);
    }

    /**
     * Verifica si una empresa está activa y dentro del período de prueba/suscripción
     */
    public boolean verificarEstadoEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            return false;
        }

        Empresa empresa = empresaOpt.get();
        
        // Verificar si está activa
        if (!empresa.getActiva()) {
            return false;
        }

        // Verificar estado de suscripción
        switch (empresa.getEstadoSuscripcion()) {
            case ACTIVA:
                return true;
            case PRUEBA:
                return empresa.getFechaFinPrueba().isAfter(LocalDateTime.now());
            case SUSPENDIDA:
            case CANCELADA:
            default:
                return false;
        }
    }
}
