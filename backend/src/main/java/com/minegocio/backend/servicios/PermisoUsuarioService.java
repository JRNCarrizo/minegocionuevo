package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.PermisoUsuario;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.PermisoUsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio para la gestión de permisos de usuario
 */
@Service
public class PermisoUsuarioService {

    @Autowired
    private PermisoUsuarioRepository permisoUsuarioRepository;

    /**
     * Asigna permisos a un usuario
     */
    @Transactional
    public void asignarPermisos(Usuario usuario, Map<String, Boolean> permisos) {
        try {
            System.out.println("🔍 [PERMISOS] Asignando permisos para usuario: " + usuario.getId());
            System.out.println("🔍 [PERMISOS] Permisos a asignar: " + permisos);
            
            // Obtener permisos existentes
            List<PermisoUsuario> permisosExistentes = permisoUsuarioRepository.findByUsuario(usuario);
            System.out.println("🔍 [PERMISOS] Permisos existentes: " + permisosExistentes.size());
            
            // Crear un mapa de permisos existentes para acceso rápido
            Map<String, PermisoUsuario> permisosExistentesMap = new HashMap<>();
            for (PermisoUsuario permiso : permisosExistentes) {
                permisosExistentesMap.put(permiso.getFuncionalidad(), permiso);
            }
            
            // Procesar cada permiso solicitado
            for (Map.Entry<String, Boolean> entry : permisos.entrySet()) {
                String funcionalidad = entry.getKey();
                Boolean permitido = entry.getValue();
                
                if (permisosExistentesMap.containsKey(funcionalidad)) {
                    // Actualizar permiso existente
                    PermisoUsuario permisoExistente = permisosExistentesMap.get(funcionalidad);
                    permisoExistente.setPermitido(permitido);
                    permisoUsuarioRepository.save(permisoExistente);
                    System.out.println("🔍 [PERMISOS] Permiso actualizado: " + funcionalidad + " = " + permitido);
                } else {
                    // Verificar nuevamente si el permiso existe antes de crear uno nuevo
                    // Esto previene problemas de concurrencia
                    Optional<PermisoUsuario> permisoExistente = permisoUsuarioRepository.findByUsuarioAndFuncionalidad(usuario, funcionalidad);
                    if (permisoExistente.isPresent()) {
                        // Si existe, actualizarlo
                        PermisoUsuario permiso = permisoExistente.get();
                        permiso.setPermitido(permitido);
                        permisoUsuarioRepository.save(permiso);
                        System.out.println("🔍 [PERMISOS] Permiso encontrado y actualizado: " + funcionalidad + " = " + permitido);
                    } else {
                        // Crear nuevo permiso solo si realmente no existe
                        PermisoUsuario nuevoPermiso = new PermisoUsuario(usuario, funcionalidad, permitido);
                        try {
                            permisoUsuarioRepository.save(nuevoPermiso);
                            System.out.println("🔍 [PERMISOS] Permiso creado: " + funcionalidad + " = " + permitido);
                        } catch (Exception e) {
                            // Si falla por restricción de unicidad, intentar actualizar el existente
                            System.out.println("⚠️ [PERMISOS] Error al crear permiso, intentando actualizar existente: " + e.getMessage());
                            Optional<PermisoUsuario> permisoDuplicado = permisoUsuarioRepository.findByUsuarioAndFuncionalidad(usuario, funcionalidad);
                            if (permisoDuplicado.isPresent()) {
                                PermisoUsuario permiso = permisoDuplicado.get();
                                permiso.setPermitido(permitido);
                                permisoUsuarioRepository.save(permiso);
                                System.out.println("🔍 [PERMISOS] Permiso duplicado actualizado: " + funcionalidad + " = " + permitido);
                            } else {
                                throw e; // Re-lanzar si no se puede resolver
                            }
                        }
                    }
                }
            }
            
            // Eliminar permisos que ya no están en la lista
            for (PermisoUsuario permisoExistente : permisosExistentes) {
                if (!permisos.containsKey(permisoExistente.getFuncionalidad())) {
                    permisoUsuarioRepository.delete(permisoExistente);
                    System.out.println("🔍 [PERMISOS] Permiso eliminado: " + permisoExistente.getFuncionalidad());
                }
            }
            
            System.out.println("✅ [PERMISOS] Permisos asignados exitosamente");
            
        } catch (Exception e) {
            System.err.println("❌ [PERMISOS] Error asignando permisos: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Verifica si un usuario tiene un permiso específico
     */
    @Transactional(readOnly = true)
    public boolean tienePermiso(Usuario usuario, String funcionalidad) {
        // Los administradores tienen todos los permisos
        if (usuario.getRol() == Usuario.RolUsuario.ADMINISTRADOR) {
            return true;
        }

        // Los super admins tienen todos los permisos
        if (usuario.getRol() == Usuario.RolUsuario.SUPER_ADMIN) {
            return true;
        }

        // Para usuarios ASIGNADO, verificar en la base de datos
        Optional<Boolean> permiso = permisoUsuarioRepository.tienePermiso(usuario, funcionalidad);
        return permiso.orElse(false); // Si no existe el permiso, se considera denegado
    }

    /**
     * Obtiene todos los permisos de un usuario
     */
    @Transactional(readOnly = true)
    public Map<String, Boolean> obtenerPermisos(Usuario usuario) {
        Map<String, Boolean> permisos = new HashMap<>();

        // Si es administrador o super admin, tiene todos los permisos
        if (usuario.getRol() == Usuario.RolUsuario.ADMINISTRADOR || 
            usuario.getRol() == Usuario.RolUsuario.SUPER_ADMIN) {
            
            for (PermisoUsuario.Funcionalidad func : PermisoUsuario.Funcionalidad.values()) {
                permisos.put(func.name(), true);
            }
            return permisos;
        }

        // Para usuarios ASIGNADO, inicializar todos los permisos como false
        for (PermisoUsuario.Funcionalidad func : PermisoUsuario.Funcionalidad.values()) {
            permisos.put(func.name(), false);
        }

        // Luego obtener los permisos reales de la base de datos
        List<PermisoUsuario> permisosUsuario = permisoUsuarioRepository.findByUsuario(usuario);
        
        for (PermisoUsuario permiso : permisosUsuario) {
            permisos.put(permiso.getFuncionalidad(), permiso.getPermitido());
        }

        return permisos;
    }

    /**
     * Obtiene las funcionalidades permitidas para un usuario
     */
    @Transactional(readOnly = true)
    public List<String> obtenerFuncionalidadesPermitidas(Usuario usuario) {
        // Si es administrador o super admin, tiene acceso a todo
        if (usuario.getRol() == Usuario.RolUsuario.ADMINISTRADOR || 
            usuario.getRol() == Usuario.RolUsuario.SUPER_ADMIN) {
            
            return List.of(PermisoUsuario.Funcionalidad.values())
                    .stream()
                    .map(Enum::name)
                    .toList();
        }

        // Para usuarios ASIGNADO, obtener de la base de datos
        return permisoUsuarioRepository.obtenerFuncionalidadesPermitidas(usuario);
    }

    /**
     * Crea permisos por defecto para un nuevo usuario ASIGNADO
     */
    @Transactional
    public void crearPermisosPorDefecto(Usuario usuario) {
        if (usuario.getRol() != Usuario.RolUsuario.ASIGNADO) {
            return; // Solo para usuarios ASIGNADO
        }

        Map<String, Boolean> permisosPorDefecto = new HashMap<>();
        
        // Permisos básicos por defecto (todos denegados inicialmente)
        for (PermisoUsuario.Funcionalidad func : PermisoUsuario.Funcionalidad.values()) {
            permisosPorDefecto.put(func.name(), false);
        }

        // Asignar permisos por defecto
        asignarPermisos(usuario, permisosPorDefecto);
    }
}
