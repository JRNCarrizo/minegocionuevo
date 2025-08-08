package com.minegocio.backend.config;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

/**
 * Inicializador de datos de prueba para desarrollo
 * DESHABILITADO - Los datos se crean manualmente
 */
@Component
@Profile("dev-persistent")
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 Configuración de desarrollo persistente activada");
        System.out.println("✅ Los datos se mantendrán entre reinicios");
        System.out.println("📝 Crea tus datos manualmente desde la aplicación");
        System.out.println("🗄️ Base de datos: ./data/dev-database.mv.db");
        System.out.println("🔍 Consola H2: http://localhost:8080/h2-console");
        
        // NO se crean datos automáticos - el usuario los crea manualmente
        System.out.println("✅ Inicialización completada - Listo para crear datos manualmente");
    }

    // Métodos comentados - no se ejecutan automáticamente
    /*
    private void crearSuperAdmin() {
        // Código comentado
    }

    private void crearPlanesPrueba() {
        // Código comentado
    }

    private void crearEmpresasPrueba() {
        // Código comentado
    }

    private void crearUsuariosEmpresa(Empresa empresa, String email, String nombre) {
        // Código comentado
    }
    */
} 