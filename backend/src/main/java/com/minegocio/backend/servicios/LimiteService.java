package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Servicio para verificar límites de suscripción
 */
@Service
public class LimiteService {

    @Autowired
    private SuscripcionAutomaticaService suscripcionAutomaticaService;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AlmacenamientoService almacenamientoService;

    /**
     * Verifica si una empresa puede crear más productos
     */
    public boolean puedeCrearProducto(Long empresaId) {
        Suscripcion suscripcion = suscripcionAutomaticaService.obtenerSuscripcionActiva(empresaId);
        if (suscripcion == null) return false;

        Plan plan = suscripcion.getPlan();
        if (plan.getMaxProductos() == -1) return true; // Sin límite

        long productosActuales = productoRepository.findByEmpresaIdAndActivoTrue(empresaId).size();
        return productosActuales < plan.getMaxProductos();
    }

    /**
     * Verifica si una empresa puede crear más clientes
     */
    public boolean puedeCrearCliente(Long empresaId) {
        Suscripcion suscripcion = suscripcionAutomaticaService.obtenerSuscripcionActiva(empresaId);
        if (suscripcion == null) return false;

        Plan plan = suscripcion.getPlan();
        if (plan.getMaxClientes() == -1) return true; // Sin límite

        long clientesActuales = clienteRepository.countByEmpresaId(empresaId);
        return clientesActuales < plan.getMaxClientes();
    }

    /**
     * Obtiene información de límites de una empresa
     */
    public LimiteInfo obtenerLimiteInfo(Long empresaId) {
        Suscripcion suscripcion = suscripcionAutomaticaService.obtenerSuscripcionActiva(empresaId);
        if (suscripcion == null) {
            return new LimiteInfo(0, 0, 0, 0, 0, 0, 0, 0, "Sin suscripción");
        }

        Plan plan = suscripcion.getPlan();
        long productosActuales = productoRepository.findByEmpresaIdAndActivoTrue(empresaId).size();
        long clientesActuales = clienteRepository.countByEmpresaId(empresaId);

        // Obtener almacenamiento total (archivos + base de datos)
        long almacenamientoActualBytes = almacenamientoService.obtenerAlmacenamientoTotalBytes(empresaId);
        long almacenamientoActualGB = almacenamientoActualBytes / (1024 * 1024 * 1024);

        return new LimiteInfo(
            productosActuales,
            plan.getMaxProductos(),
            clientesActuales,
            plan.getMaxClientes(),
            0, // TODO: Implementar conteo de usuarios
            plan.getMaxUsuarios(),
            almacenamientoActualGB,
            plan.getMaxAlmacenamientoGB(),
            plan.getNombre()
        );
    }

    /**
     * Clase para representar información de límites
     */
    public static class LimiteInfo {
        private long productosActuales;
        private long maxProductos;
        private long clientesActuales;
        private long maxClientes;
        private long usuariosActuales;
        private long maxUsuarios;
        private long almacenamientoActualGB;
        private long maxAlmacenamientoGB;
        private String planNombre;

        public LimiteInfo(long productosActuales, long maxProductos, 
                         long clientesActuales, long maxClientes,
                         long usuariosActuales, long maxUsuarios,
                         long almacenamientoActualGB, long maxAlmacenamientoGB,
                         String planNombre) {
            this.productosActuales = productosActuales;
            this.maxProductos = maxProductos;
            this.clientesActuales = clientesActuales;
            this.maxClientes = maxClientes;
            this.usuariosActuales = usuariosActuales;
            this.maxUsuarios = maxUsuarios;
            this.almacenamientoActualGB = almacenamientoActualGB;
            this.maxAlmacenamientoGB = maxAlmacenamientoGB;
            this.planNombre = planNombre;
        }

        // Getters
        public long getProductosActuales() { return productosActuales; }
        public long getMaxProductos() { return maxProductos; }
        public long getClientesActuales() { return clientesActuales; }
        public long getMaxClientes() { return maxClientes; }
        public long getUsuariosActuales() { return usuariosActuales; }
        public long getMaxUsuarios() { return maxUsuarios; }
        public long getAlmacenamientoActualGB() { return almacenamientoActualGB; }
        public long getMaxAlmacenamientoGB() { return maxAlmacenamientoGB; }
        public String getPlanNombre() { return planNombre; }

        // Métodos de utilidad
        public double getPorcentajeProductos() {
            return maxProductos > 0 ? (double) productosActuales / maxProductos * 100 : 0;
        }

        public double getPorcentajeClientes() {
            return maxClientes > 0 ? (double) clientesActuales / maxClientes * 100 : 0;
        }

        public double getPorcentajeUsuarios() {
            return maxUsuarios > 0 ? (double) usuariosActuales / maxUsuarios * 100 : 0;
        }

        public double getPorcentajeAlmacenamiento() {
            return maxAlmacenamientoGB > 0 ? (double) almacenamientoActualGB / maxAlmacenamientoGB * 100 : 0;
        }
    }
} 