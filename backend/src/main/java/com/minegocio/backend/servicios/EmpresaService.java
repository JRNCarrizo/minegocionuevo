package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.RegistroEmpresaDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import com.minegocio.backend.repositorios.VentaRapidaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;

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
    
    @Autowired
    private ClienteRepository clienteRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    @Autowired
    private VentaRapidaRepository ventaRapidaRepository;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private SuscripcionAutomaticaService suscripcionAutomaticaService;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

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

        // Validar que las contraseñas coincidan
        if (!registroDTO.getPasswordAdministrador().equals(registroDTO.getConfirmarPasswordAdministrador())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        // Crear la empresa
        Empresa empresa = new Empresa();
        empresa.setNombre(registroDTO.getNombreEmpresa());
        empresa.setSubdominio(registroDTO.getSubdominio().toLowerCase());
        empresa.setEmail(registroDTO.getEmailEmpresa());
        empresa.setTelefono(registroDTO.getTelefonoEmpresa());
        empresa.setDireccion(registroDTO.getDireccionEmpresa());
        empresa.setCiudad(registroDTO.getCiudadEmpresa());
        empresa.setCodigoPostal(registroDTO.getCodigoPostalEmpresa());
        empresa.setPais(registroDTO.getPaisEmpresa());
        empresa.setDescripcion(registroDTO.getDescripcionEmpresa());
        empresa.setFechaFinPrueba(LocalDateTime.now().plusMonths(1)); // 1 mes de prueba

        empresa = empresaRepository.save(empresa);

        // Crear el usuario administrador (inicialmente inactivo hasta verificar email)
        Usuario administrador = new Usuario();
        administrador.setNombre(registroDTO.getNombreAdministrador());
        administrador.setApellidos(registroDTO.getApellidosAdministrador());
        administrador.setEmail(registroDTO.getEmailAdministrador());
        administrador.setPassword(passwordEncoder.encode(registroDTO.getPasswordAdministrador()));
        administrador.setTelefono(registroDTO.getTelefonoAdministrador());
        administrador.setRol(Usuario.RolUsuario.ADMINISTRADOR);
        administrador.setEmpresa(empresa);
        administrador.setActivo(false); // Inactivo hasta verificar email
        administrador.setEmailVerificado(false);
        administrador.setTokenVerificacion(UUID.randomUUID().toString());

        administrador = usuarioRepository.save(administrador);

        System.out.println("🎯 === ASIGNACIÓN AUTOMÁTICA DE PLAN POR DEFECTO ===");
        System.out.println("🎯 Empresa creada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
        
        // Crear plan por defecto si no existe
        System.out.println("🎯 Verificando/creando plan por defecto...");
        crearPlanPorDefectoSiNoExiste();

        // Crear suscripción gratuita automática
        try {
            System.out.println("🎯 Creando suscripción gratuita automática...");
            suscripcionAutomaticaService.crearSuscripcionGratuita(empresa);
            System.out.println("✅ Suscripción gratuita creada exitosamente para empresa: " + empresa.getNombre());
            
            // Verificar que la suscripción se creó
            List<Suscripcion> suscripciones = suscripcionRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
            System.out.println("✅ Verificación: Empresa tiene " + suscripciones.size() + " suscripciones");
            
        } catch (Exception e) {
            System.err.println("❌ Error creando suscripción gratuita: " + e.getMessage());
            e.printStackTrace();
            // No lanzar excepción para no fallar el registro
        }
        
        System.out.println("🎯 === FIN ASIGNACIÓN AUTOMÁTICA ===");

        // Enviar email de verificación
        try {
            emailService.enviarEmailVerificacion(
                administrador.getEmail(),
                administrador.getNombre(),
                administrador.getTokenVerificacion()
            );
        } catch (Exception e) {
            System.err.println("Error enviando email de verificación: " + e.getMessage());
            // No lanzar excepción para no fallar el registro
        }

        return new EmpresaDTO(empresa);
    }

    /**
     * Crea un plan por defecto si no existe
     */
    private void crearPlanPorDefectoSiNoExiste() {
        try {
            // Verificar si ya existe un plan por defecto
            Optional<Plan> planExistente = planRepository.findByPlanPorDefectoTrue();
            if (planExistente.isPresent()) {
                System.out.println("✅ Plan por defecto ya existe: " + planExistente.get().getNombre());
                return;
            }

            System.out.println("📋 Creando plan por defecto...");
            
            // Crear plan gratuito por defecto
            Plan planGratuito = new Plan();
            planGratuito.setNombre("Plan Gratuito");
            planGratuito.setDescripcion("Plan gratuito con funcionalidades básicas");
            planGratuito.setPrecio(BigDecimal.ZERO);
            planGratuito.setPeriodo(Plan.PeriodoPlan.MENSUAL);
            planGratuito.setMaxProductos(50);
            planGratuito.setMaxUsuarios(2);
            planGratuito.setMaxClientes(500);
            planGratuito.setMaxAlmacenamientoGB(5);
            planGratuito.setActivo(true);
            planGratuito.setPlanPorDefecto(true);
            planGratuito.setDestacado(false);
            planGratuito.setOrden(1);

            // Características del plan gratuito
            planGratuito.setPersonalizacionCompleta(false);
            planGratuito.setEstadisticasAvanzadas(false);
            planGratuito.setSoportePrioritario(false);
            planGratuito.setIntegracionesAvanzadas(false);
            planGratuito.setBackupAutomatico(false);
            planGratuito.setDominioPersonalizado(false);

            planRepository.save(planGratuito);
            System.out.println("✅ Plan por defecto creado: " + planGratuito.getNombre());
            
        } catch (Exception e) {
            System.err.println("❌ Error creando plan por defecto: " + e.getMessage());
            e.printStackTrace();
        }
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
    public EmpresaDTO actualizarPersonalizacion(Long empresaId, String logoUrl, String descripcion, String textoBienvenida, String colorPrimario, String colorSecundario, 
                                               String colorAcento, String colorFondo, String colorTexto, String colorTituloPrincipal, 
                                               String colorCardFiltros, String imagenFondoUrl, String instagramUrl, String facebookUrl) {
        System.out.println("=== DEBUG SERVICIO PERSONALIZACIÓN ===");
        System.out.println("Empresa ID: " + empresaId);
        System.out.println("Logo URL: " + logoUrl);
        System.out.println("Descripción: " + descripcion);
        System.out.println("Color Primario: " + colorPrimario);
        System.out.println("Color Secundario: " + colorSecundario);
        System.out.println("Color Acento: " + colorAcento);
        System.out.println("Color Fondo: " + colorFondo);
        System.out.println("Color Texto: " + colorTexto);
        System.out.println("Color Título Principal: " + colorTituloPrincipal);
        System.out.println("Color Card Filtros: " + colorCardFiltros);
        System.out.println("Imagen Fondo URL: " + imagenFondoUrl);
        System.out.println("Instagram URL: " + instagramUrl);
        System.out.println("Facebook URL: " + facebookUrl);
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        // Debug: Verificar si los campos se están guardando
        System.out.println("=== DEBUG GUARDADO ===");
        System.out.println("Antes de guardar - Descripción: " + empresa.getDescripcion());
        System.out.println("Antes de guardar - Color Título Principal: " + empresa.getColorTituloPrincipal());
        System.out.println("Antes de guardar - Color Card Filtros: " + empresa.getColorCardFiltros());

        if (logoUrl != null) {
            empresa.setLogoUrl(logoUrl);
        }
        if (descripcion != null) {
            empresa.setDescripcion(descripcion);
            System.out.println("✅ Descripción guardada: " + descripcion);
        } else {
            System.out.println("❌ Descripción es null, no se guarda");
        }
        if (textoBienvenida != null) {
            empresa.setTextoBienvenida(textoBienvenida);
            System.out.println("✅ Texto de bienvenida guardado: " + textoBienvenida);
        } else {
            System.out.println("❌ Texto de bienvenida es null, no se guarda");
        }
        if (colorPrimario != null) {
            empresa.setColorPrimario(colorPrimario);
        }
        if (colorSecundario != null) {
            empresa.setColorSecundario(colorSecundario);
        }
        if (colorAcento != null) {
            empresa.setColorAcento(colorAcento);
        }
        if (colorFondo != null) {
            empresa.setColorFondo(colorFondo);
        }
        if (colorTexto != null) {
            empresa.setColorTexto(colorTexto);
        }
        if (colorTituloPrincipal != null) {
            empresa.setColorTituloPrincipal(colorTituloPrincipal);
        }
        if (colorCardFiltros != null) {
            empresa.setColorCardFiltros(colorCardFiltros);
        }
        if (imagenFondoUrl != null) {
            System.out.println("Guardando imagen de fondo URL: " + imagenFondoUrl);
            empresa.setImagenFondoUrl(imagenFondoUrl);
        }
        if (instagramUrl != null) {
            System.out.println("Guardando Instagram URL: " + instagramUrl);
            empresa.setInstagramUrl(instagramUrl);
        }
        if (facebookUrl != null) {
            System.out.println("Guardando Facebook URL: " + facebookUrl);
            empresa.setFacebookUrl(facebookUrl);
        }

        empresa = empresaRepository.save(empresa);
        System.out.println("Empresa guardada. Descripción final: " + empresa.getDescripcion());
        System.out.println("Empresa guardada. Imagen de fondo final: " + empresa.getImagenFondoUrl());
        System.out.println("Después de guardar - Color Título Principal: " + empresa.getColorTituloPrincipal());
        System.out.println("Después de guardar - Color Card Filtros: " + empresa.getColorCardFiltros());
        System.out.println("=== FIN DEBUG SERVICIO ===");
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
     * Obtiene todas las empresas con estadísticas calculadas
     */
    public List<Map<String, Object>> obtenerTodasLasEmpresasConEstadisticas() {
        List<Empresa> empresas = empresaRepository.findAll();
        return empresas.stream().map(empresa -> {
            Map<String, Object> empresaConStats = new HashMap<>();
            
            // Datos básicos de la empresa
            empresaConStats.put("id", empresa.getId());
            empresaConStats.put("nombre", empresa.getNombre());
            empresaConStats.put("subdominio", empresa.getSubdominio());
            empresaConStats.put("email", empresa.getEmail());
            empresaConStats.put("telefono", empresa.getTelefono());
            empresaConStats.put("logoUrl", empresa.getLogoUrl());
            empresaConStats.put("estadoSuscripcion", empresa.getEstadoSuscripcion().name());
            empresaConStats.put("fechaCreacion", empresa.getFechaCreacion());
            empresaConStats.put("descripcion", empresa.getDescripcion());
            empresaConStats.put("colorPrimario", empresa.getColorPrimario());
            empresaConStats.put("moneda", empresa.getMoneda());
            empresaConStats.put("activa", empresa.getActiva());
            
            // Calcular estadísticas reales
            Long empresaId = empresa.getId();
            
            // Total de clientes
            long totalClientes = clienteRepository.countByEmpresaId(empresaId);
            
            // Total de productos
            long totalProductos = productoRepository.countByEmpresaId(empresaId);
            
            // Total de pedidos
            long totalPedidos = pedidoRepository.countByEmpresaId(empresaId);
            
            // Total de ventas rápidas
            long totalVentasRapidas = ventaRapidaRepository.countByEmpresaId(empresaId);
            
            empresaConStats.put("totalClientes", totalClientes);
            empresaConStats.put("totalProductos", totalProductos);
            empresaConStats.put("totalPedidos", totalPedidos);
            empresaConStats.put("totalVentasRapidas", totalVentasRapidas);
            
            return empresaConStats;
        }).collect(Collectors.toList());
    }

    /**
     * Guarda una empresa
     */
    public Empresa guardar(Empresa empresa) {
        return empresaRepository.save(empresa);
    }

    /**
     * Actualiza la configuración de una empresa con validaciones
     */
    public EmpresaDTO actualizarConfiguracionEmpresa(Long empresaId, EmpresaDTO empresaDTO) {
        System.out.println("=== DEBUG ACTUALIZAR CONFIGURACIÓN ===");
        System.out.println("Empresa ID: " + empresaId);
        System.out.println("Texto de bienvenida recibido: " + empresaDTO.getTextoBienvenida());
        System.out.println("Descripción recibida: " + empresaDTO.getDescripcion());
        System.out.println("Color Título Principal recibido: " + empresaDTO.getColorTituloPrincipal());
        System.out.println("Color Card Filtros recibido: " + empresaDTO.getColorCardFiltros());
        System.out.println("🏦 Datos de transferencia bancaria recibidos:");
        System.out.println("  - Habilitada: " + empresaDTO.getTransferenciaBancariaHabilitada());
        System.out.println("  - Banco: " + empresaDTO.getBanco());
        System.out.println("  - Tipo Cuenta: " + empresaDTO.getTipoCuenta());
        System.out.println("  - Número Cuenta: " + empresaDTO.getNumeroCuenta());
        System.out.println("  - CBU: " + empresaDTO.getCbu());
        System.out.println("  - Alias: " + empresaDTO.getAlias());
        System.out.println("  - Titular: " + empresaDTO.getTitular());
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Validar subdominio si se está cambiando
        if (empresaDTO.getSubdominio() != null && 
            !empresaDTO.getSubdominio().equals(empresa.getSubdominio())) {
            
            String nuevoSubdominio = empresaDTO.getSubdominio().toLowerCase();
            
            // Validar formato del subdominio
            if (!nuevoSubdominio.matches("^[a-z0-9-]+$")) {
                throw new RuntimeException("El subdominio solo puede contener letras minúsculas, números y guiones");
            }
            
            if (nuevoSubdominio.length() < 3 || nuevoSubdominio.length() > 50) {
                throw new RuntimeException("El subdominio debe tener entre 3 y 50 caracteres");
            }
            
            // Verificar disponibilidad
            if (empresaRepository.existsBySubdominio(nuevoSubdominio)) {
                throw new RuntimeException("El subdominio '" + nuevoSubdominio + "' ya está en uso");
            }
            
            empresa.setSubdominio(nuevoSubdominio);
        }

        // Validar email si se está cambiando
        if (empresaDTO.getEmail() != null && 
            !empresaDTO.getEmail().equals(empresa.getEmail())) {
            
            // Verificar que el email no esté en uso por otra empresa
            if (empresaRepository.existsByEmail(empresaDTO.getEmail())) {
                throw new RuntimeException("El email '" + empresaDTO.getEmail() + "' ya está registrado");
            }
            
            empresa.setEmail(empresaDTO.getEmail());
        }

        // Actualizar otros campos
        if (empresaDTO.getNombre() != null) {
            empresa.setNombre(empresaDTO.getNombre());
        }
        if (empresaDTO.getDescripcion() != null) {
            empresa.setDescripcion(empresaDTO.getDescripcion());
        }
        System.out.println("🔍 Verificando texto de bienvenida...");
        System.out.println("  - Valor en DTO: " + empresaDTO.getTextoBienvenida());
        System.out.println("  - Es null?: " + (empresaDTO.getTextoBienvenida() == null));
        System.out.println("  - Está vacío?: " + ("".equals(empresaDTO.getTextoBienvenida())));
        
        if (empresaDTO.getTextoBienvenida() != null) {
            empresa.setTextoBienvenida(empresaDTO.getTextoBienvenida());
            System.out.println("✅ Texto de bienvenida actualizado: " + empresaDTO.getTextoBienvenida());
        } else {
            System.out.println("❌ Texto de bienvenida es null en el DTO");
        }
        if (empresaDTO.getTelefono() != null) {
            empresa.setTelefono(empresaDTO.getTelefono());
        }
        if (empresaDTO.getColorPrimario() != null) {
            empresa.setColorPrimario(empresaDTO.getColorPrimario());
        }
        if (empresaDTO.getColorSecundario() != null) {
            empresa.setColorSecundario(empresaDTO.getColorSecundario());
        }
        if (empresaDTO.getColorAcento() != null) {
            empresa.setColorAcento(empresaDTO.getColorAcento());
        }
        if (empresaDTO.getColorFondo() != null) {
            empresa.setColorFondo(empresaDTO.getColorFondo());
        }
        if (empresaDTO.getColorTexto() != null) {
            empresa.setColorTexto(empresaDTO.getColorTexto());
        }
        if (empresaDTO.getColorTituloPrincipal() != null) {
            empresa.setColorTituloPrincipal(empresaDTO.getColorTituloPrincipal());
        }
        if (empresaDTO.getColorCardFiltros() != null) {
            empresa.setColorCardFiltros(empresaDTO.getColorCardFiltros());
        }
        if (empresaDTO.getMoneda() != null) {
            empresa.setMoneda(empresaDTO.getMoneda());
        }

        // Actualizar redes sociales
        if (empresaDTO.getInstagramUrl() != null) {
            empresa.setInstagramUrl(empresaDTO.getInstagramUrl());
        }
        if (empresaDTO.getFacebookUrl() != null) {
            empresa.setFacebookUrl(empresaDTO.getFacebookUrl());
        }

        // Actualizar métodos de pago - Transferencia bancaria
        if (empresaDTO.getTransferenciaBancariaHabilitada() != null) {
            empresa.setTransferenciaBancariaHabilitada(empresaDTO.getTransferenciaBancariaHabilitada());
        }
        if (empresaDTO.getBanco() != null) {
            empresa.setBanco(empresaDTO.getBanco());
        }
        if (empresaDTO.getTipoCuenta() != null) {
            empresa.setTipoCuenta(empresaDTO.getTipoCuenta());
        }
        if (empresaDTO.getNumeroCuenta() != null) {
            empresa.setNumeroCuenta(empresaDTO.getNumeroCuenta());
        }
        if (empresaDTO.getCbu() != null) {
            empresa.setCbu(empresaDTO.getCbu());
        }
        if (empresaDTO.getAlias() != null) {
            empresa.setAlias(empresaDTO.getAlias());
        }
        if (empresaDTO.getTitular() != null) {
            empresa.setTitular(empresaDTO.getTitular());
        }

        // Configuración del catálogo
        if (empresaDTO.getMostrarStock() != null) {
            empresa.setMostrarStock(empresaDTO.getMostrarStock());
            System.out.println("📊 Mostrar Stock guardado: " + empresaDTO.getMostrarStock());
        }
        if (empresaDTO.getMostrarCategorias() != null) {
            empresa.setMostrarCategorias(empresaDTO.getMostrarCategorias());
            System.out.println("🏷️ Mostrar Categorías guardado: " + empresaDTO.getMostrarCategorias());
        }
        if (empresaDTO.getMostrarPrecios() != null) {
            empresa.setMostrarPrecios(empresaDTO.getMostrarPrecios());
            System.out.println("💰 Mostrar Precios guardado: " + empresaDTO.getMostrarPrecios());
        }
        

        empresa = empresaRepository.save(empresa);
        System.out.println("💾 Después de guardar en BD:");
        System.out.println("  - Texto de Bienvenida: " + empresa.getTextoBienvenida());
        System.out.println("  - Descripción: " + empresa.getDescripcion());
        System.out.println("  - Color Título Principal: " + empresa.getColorTituloPrincipal());
        System.out.println("  - Color Card Filtros: " + empresa.getColorCardFiltros());
        System.out.println("📊 Configuración del catálogo guardada:");
        System.out.println("  - Mostrar Stock: " + empresa.getMostrarStock());
        System.out.println("  - Mostrar Categorías: " + empresa.getMostrarCategorias());
        System.out.println("  - Mostrar Precios: " + empresa.getMostrarPrecios());
        System.out.println("🏦 Datos de transferencia bancaria guardados:");
        System.out.println("  - Habilitada: " + empresa.getTransferenciaBancariaHabilitada());
        System.out.println("  - Banco: " + empresa.getBanco());
        System.out.println("  - Tipo Cuenta: " + empresa.getTipoCuenta());
        System.out.println("  - Número Cuenta: " + empresa.getNumeroCuenta());
        System.out.println("  - CBU: " + empresa.getCbu());
        System.out.println("  - Alias: " + empresa.getAlias());
        System.out.println("  - Titular: " + empresa.getTitular());
        System.out.println("=== FIN DEBUG ACTUALIZAR CONFIGURACIÓN ===");
        return new EmpresaDTO(empresa);
    }

    /**
     * Verifica el email de un usuario usando el token de verificación
     */
    public boolean verificarEmailUsuario(String tokenVerificacion) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByTokenVerificacion(tokenVerificacion);
        
        if (usuarioOpt.isEmpty()) {
            return false;
        }
        
        Usuario usuario = usuarioOpt.get();
        
        // Verificar que el token no haya expirado (24 horas)
        if (usuario.getFechaCreacion().plusHours(24).isBefore(LocalDateTime.now())) {
            return false;
        }
        
        // Activar el usuario y marcar email como verificado
        usuario.setActivo(true);
        usuario.setEmailVerificado(true);
        usuario.setTokenVerificacion(null); // Limpiar token usado
        
        usuarioRepository.save(usuario);
        
        // Enviar email de bienvenida
        try {
            if (usuario.getEmpresa() != null) {
                emailService.enviarEmailBienvenida(
                    usuario.getEmail(),
                    usuario.getNombre(),
                    usuario.getEmpresa().getNombre()
                );
            } else {
                // Usuario sin empresa (flujo de dos etapas)
                emailService.enviarEmailBienvenida(
                    usuario.getEmail(),
                    usuario.getNombre(),
                    "Tu cuenta"
                );
            }
        } catch (Exception e) {
            System.err.println("Error enviando email de bienvenida: " + e.getMessage());
        }
        
        return true;
    }

    /**
     * Reenvía el email de verificación
     */
    public boolean reenviarEmailVerificacion(String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        
        if (usuarioOpt.isEmpty()) {
            return false;
        }
        
        Usuario usuario = usuarioOpt.get();
        
        // Solo reenviar si el email no está verificado
        if (usuario.getEmailVerificado()) {
            return false;
        }
        
        // Generar nuevo token si no tiene uno
        if (usuario.getTokenVerificacion() == null) {
            usuario.setTokenVerificacion(UUID.randomUUID().toString());
            usuarioRepository.save(usuario);
        }
        
        // Enviar email de verificación
        try {
            emailService.enviarEmailVerificacion(
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getTokenVerificacion()
            );
            return true;
        } catch (Exception e) {
            System.err.println("Error reenviando email de verificación: " + e.getMessage());
            return false;
        }
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
