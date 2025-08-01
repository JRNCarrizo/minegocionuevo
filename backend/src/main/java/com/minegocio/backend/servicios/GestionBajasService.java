package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.BajaCuentaDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para gestionar las bajas de cuentas
 */
@Service
@Transactional
public class GestionBajasService {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Da de baja una empresa y todos sus usuarios
     */
    public boolean darDeBajaEmpresa(Long empresaId, BajaCuentaDTO bajaDTO, String adminEmail) {
        try {
            Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
            if (empresaOpt.isEmpty()) {
                throw new RuntimeException("Empresa no encontrada");
            }

            Empresa empresa = empresaOpt.get();
            
            // Verificar que la empresa no esté ya dada de baja
            if (empresa.estaDadaDeBaja()) {
                throw new RuntimeException("La empresa ya está dada de baja");
            }

            // Dar de baja la empresa
            String motivoCompleto = bajaDTO.getMotivo();
            if (bajaDTO.getComentariosAdicionales() != null && !bajaDTO.getComentariosAdicionales().trim().isEmpty()) {
                motivoCompleto += " - " + bajaDTO.getComentariosAdicionales();
            }
            
            empresa.darDeBaja(motivoCompleto, bajaDTO.getBajaPermanente());
            empresaRepository.save(empresa);

            // Dar de baja todos los usuarios de la empresa
            List<Usuario> usuarios = usuarioRepository.findByEmpresaId(empresaId);
            for (Usuario usuario : usuarios) {
                usuario.setActivo(false);
                usuarioRepository.save(usuario);
            }

            // Enviar email de confirmación
            enviarEmailConfirmacionBaja(empresa, adminEmail, motivoCompleto);

            // Si es baja permanente, programar eliminación completa después de 30 días
            if (bajaDTO.getBajaPermanente()) {
                // Aquí podrías implementar un job programado para eliminar después de 30 días
                // Por ahora solo se marca como permanente
            }

            return true;

        } catch (Exception e) {
            throw new RuntimeException("Error al dar de baja la empresa: " + e.getMessage());
        }
    }

    /**
     * Reactiva una empresa dada de baja
     */
    public boolean reactivarEmpresa(Long empresaId, String adminEmail) {
        try {
            Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
            if (empresaOpt.isEmpty()) {
                throw new RuntimeException("Empresa no encontrada");
            }

            Empresa empresa = empresaOpt.get();
            
            if (!empresa.estaDadaDeBaja()) {
                throw new RuntimeException("La empresa no está dada de baja");
            }

            // Reactivar la empresa
            empresa.reactivar();
            empresaRepository.save(empresa);

            // Reactivar todos los usuarios de la empresa
            List<Usuario> usuarios = usuarioRepository.findByEmpresaId(empresaId);
            for (Usuario usuario : usuarios) {
                usuario.setActivo(true);
                usuarioRepository.save(usuario);
            }

            // Enviar email de confirmación de reactivación
            enviarEmailConfirmacionReactivacion(empresa, adminEmail);

            return true;

        } catch (Exception e) {
            throw new RuntimeException("Error al reactivar la empresa: " + e.getMessage());
        }
    }

    /**
     * Obtiene el historial de bajas
     */
    public List<Empresa> obtenerEmpresasDadasDeBaja() {
        return empresaRepository.findByActivaFalseAndFechaBajaIsNotNull();
    }

    /**
     * Obtiene estadísticas de bajas
     */
    public Object obtenerEstadisticasBajas() {
        long totalEmpresas = empresaRepository.count();
        long empresasActivas = empresaRepository.countByActivaTrue();
        long empresasDadasDeBaja = empresaRepository.countByActivaFalseAndFechaBajaIsNotNull();
        long bajasPermanentes = empresaRepository.countByBajaPermanenteTrue();

        return Map.of(
            "totalEmpresas", totalEmpresas,
            "empresasActivas", empresasActivas,
            "empresasDadasDeBaja", empresasDadasDeBaja,
            "bajasPermanentes", bajasPermanentes,
            "porcentajeBajas", totalEmpresas > 0 ? (double) empresasDadasDeBaja / totalEmpresas * 100 : 0
        );
    }

    /**
     * Envía email de confirmación de baja
     */
    private void enviarEmailConfirmacionBaja(Empresa empresa, String adminEmail, String motivo) {
        try {
            String asunto = "Confirmación de Baja de Cuenta - " + empresa.getNombre();
            String contenido = String.format("""
                <h2>Confirmación de Baja de Cuenta</h2>
                <p><strong>Empresa:</strong> %s</p>
                <p><strong>Subdominio:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                <p><strong>Fecha de Baja:</strong> %s</p>
                <p><strong>Motivo:</strong> %s</p>
                <p><strong>Baja Permanente:</strong> %s</p>
                <br>
                <p>La cuenta ha sido dada de baja exitosamente.</p>
                """,
                empresa.getNombre(),
                empresa.getSubdominio(),
                empresa.getEmail(),
                empresa.getFechaBaja().toString(),
                motivo,
                empresa.getBajaPermanente() ? "Sí" : "No"
            );

            emailService.enviarEmail(adminEmail, asunto, contenido);
        } catch (Exception e) {
            // Log del error pero no fallar el proceso
            System.err.println("Error enviando email de confirmación de baja: " + e.getMessage());
        }
    }

    /**
     * Envía email de confirmación de reactivación
     */
    private void enviarEmailConfirmacionReactivacion(Empresa empresa, String adminEmail) {
        try {
            String asunto = "Confirmación de Reactivación de Cuenta - " + empresa.getNombre();
            String contenido = String.format("""
                <h2>Confirmación de Reactivación de Cuenta</h2>
                <p><strong>Empresa:</strong> %s</p>
                <p><strong>Subdominio:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                <p><strong>Fecha de Reactivación:</strong> %s</p>
                <br>
                <p>La cuenta ha sido reactivada exitosamente.</p>
                """,
                empresa.getNombre(),
                empresa.getSubdominio(),
                empresa.getEmail(),
                LocalDateTime.now().toString()
            );

            emailService.enviarEmail(adminEmail, asunto, contenido);
        } catch (Exception e) {
            // Log del error pero no fallar el proceso
            System.err.println("Error enviando email de confirmación de reactivación: " + e.getMessage());
        }
    }
} 