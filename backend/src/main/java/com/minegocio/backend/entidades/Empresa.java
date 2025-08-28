package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad que representa una empresa en el sistema multi-tenant
 */
@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "El subdominio es obligatorio")
    @Size(max = 50, message = "El subdominio no puede exceder 50 caracteres")
    @Column(unique = true, nullable = false, length = 50)
    private String subdominio;

    @Email(message = "Debe proporcionar un email válido")
    @NotBlank(message = "El email es obligatorio")
    @Column(unique = true, nullable = false)
    private String email;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;

    @Size(max = 200, message = "La dirección no puede exceder 200 caracteres")
    @Column(length = 200)
    private String direccion;

    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    @Column(length = 100)
    private String ciudad;

    @Size(max = 20, message = "El código postal no puede exceder 20 caracteres")
    @Column(length = 20)
    private String codigoPostal;

    @Size(max = 100, message = "El país no puede exceder 100 caracteres")
    @Column(length = 100)
    private String pais;

    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    @Column(length = 500)
    private String descripcion;

    @Size(max = 200, message = "El texto de bienvenida no puede exceder 200 caracteres")
    @Column(name = "texto_bienvenida", length = 200, nullable = true, columnDefinition = "VARCHAR(200)")
    private String textoBienvenida;

    // Personalización visual
    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "color_primario", length = 7)
    private String colorPrimario = "#3B82F6"; // Azul por defecto

    @Column(name = "color_secundario", length = 7)  
    private String colorSecundario = "#1F2937"; // Gris oscuro por defecto

    @Column(name = "color_acento", length = 7)
    private String colorAcento = "#F59E0B"; // Naranja por defecto

    @Column(name = "color_fondo", length = 7)
    private String colorFondo = "#FFFFFF"; // Blanco por defecto

    @Column(name = "color_texto", length = 7)
    private String colorTexto = "#1F2937"; // Gris oscuro por defecto

    @Column(name = "color_titulo_principal", length = 7)
    private String colorTituloPrincipal = "#1F2937"; // Gris oscuro por defecto

    @Column(name = "color_card_filtros", length = 7)
    private String colorCardFiltros = "#FFFFFF"; // Blanco por defecto

    @Column(name = "imagen_fondo_url")
    private String imagenFondoUrl;

    @Column(name = "moneda", length = 10)
    private String moneda = "USD"; // Moneda por defecto

    // Redes sociales
    @Column(name = "instagram_url", length = 255)
    private String instagramUrl;

    @Column(name = "facebook_url", length = 255)
    private String facebookUrl;

    // Métodos de pago - Transferencia bancaria
    @Column(name = "transferencia_bancaria_habilitada")
    private Boolean transferenciaBancariaHabilitada = false;

    @Column(name = "banco", length = 100)
    private String banco;

    @Column(name = "tipo_cuenta", length = 50)
    private String tipoCuenta;

    @Column(name = "numero_cuenta", length = 50)
    private String numeroCuenta;

    @Column(name = "cbu", length = 22)
    private String cbu;

    @Column(name = "alias", length = 50)
    private String alias;

    @Column(name = "titular", length = 100)
    private String titular;

    // Configuración del catálogo
    @Column(name = "mostrar_stock")
    private Boolean mostrarStock = true;

    @Column(name = "mostrar_categorias")
    private Boolean mostrarCategorias = true;

    @Column(name = "mostrar_precios")
    private Boolean mostrarPrecios = true;

    // Estado de la suscripción
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_suscripcion")
    private EstadoSuscripcion estadoSuscripcion = EstadoSuscripcion.PRUEBA;

    @Column(name = "fecha_fin_prueba")
    private LocalDateTime fechaFinPrueba;

    @Column(name = "activa")
    private Boolean activa = true;

    @Column(name = "fecha_baja")
    private LocalDateTime fechaBaja;

    @Column(name = "motivo_baja", length = 500)
    private String motivoBaja;

    @Column(name = "baja_permanente")
    private Boolean bajaPermanente = false;

    // Relaciones
    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Usuario> usuarios = new HashSet<>();

    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Producto> productos = new HashSet<>();

    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Cliente> clientes = new HashSet<>();

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    // Constructores
    public Empresa() {}

    public Empresa(String nombre, String subdominio, String email) {
        this.nombre = nombre;
        this.subdominio = subdominio;
        this.email = email;
        this.fechaFinPrueba = LocalDateTime.now().plusMonths(1); // 1 mes de prueba
    }

    // Enum para estados de suscripción
    public enum EstadoSuscripcion {
        PRUEBA, ACTIVA, SUSPENDIDA, CANCELADA
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getSubdominio() { return subdominio; }
    public void setSubdominio(String subdominio) { this.subdominio = subdominio; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTextoBienvenida() { return textoBienvenida; }
    public void setTextoBienvenida(String textoBienvenida) { this.textoBienvenida = textoBienvenida; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getColorPrimario() { return colorPrimario; }
    public void setColorPrimario(String colorPrimario) { this.colorPrimario = colorPrimario; }

    public String getColorSecundario() { return colorSecundario; }
    public void setColorSecundario(String colorSecundario) { this.colorSecundario = colorSecundario; }

    public String getColorAcento() { return colorAcento; }
    public void setColorAcento(String colorAcento) { this.colorAcento = colorAcento; }

    public String getColorFondo() { return colorFondo; }
    public void setColorFondo(String colorFondo) { this.colorFondo = colorFondo; }

    public String getColorTexto() { return colorTexto; }
    public void setColorTexto(String colorTexto) { this.colorTexto = colorTexto; }

    public String getColorTituloPrincipal() { return colorTituloPrincipal; }
    public void setColorTituloPrincipal(String colorTituloPrincipal) { this.colorTituloPrincipal = colorTituloPrincipal; }

    public String getColorCardFiltros() { return colorCardFiltros; }
    public void setColorCardFiltros(String colorCardFiltros) { this.colorCardFiltros = colorCardFiltros; }

    public String getImagenFondoUrl() { return imagenFondoUrl; }
    public void setImagenFondoUrl(String imagenFondoUrl) { this.imagenFondoUrl = imagenFondoUrl; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public String getInstagramUrl() { return instagramUrl; }
    public void setInstagramUrl(String instagramUrl) { this.instagramUrl = instagramUrl; }

    public String getFacebookUrl() { return facebookUrl; }
    public void setFacebookUrl(String facebookUrl) { this.facebookUrl = facebookUrl; }

    // Métodos de pago - Transferencia bancaria
    public Boolean getTransferenciaBancariaHabilitada() { return transferenciaBancariaHabilitada; }

    public void setTransferenciaBancariaHabilitada(Boolean transferenciaBancariaHabilitada) { 
        this.transferenciaBancariaHabilitada = transferenciaBancariaHabilitada; 
    }

    public String getBanco() { return banco; }

    public void setBanco(String banco) { this.banco = banco; }

    public String getTipoCuenta() { return tipoCuenta; }

    public void setTipoCuenta(String tipoCuenta) { this.tipoCuenta = tipoCuenta; }

    public String getNumeroCuenta() { return numeroCuenta; }

    public void setNumeroCuenta(String numeroCuenta) { this.numeroCuenta = numeroCuenta; }

    public String getCbu() { return cbu; }

    public void setCbu(String cbu) { this.cbu = cbu; }

    public String getAlias() { return alias; }

    public void setAlias(String alias) { this.alias = alias; }

    public String getTitular() { return titular; }

    public void setTitular(String titular) { this.titular = titular; }

    // Configuración del catálogo
    public Boolean getMostrarStock() { return mostrarStock; }

    public void setMostrarStock(Boolean mostrarStock) { this.mostrarStock = mostrarStock; }

    public Boolean getMostrarCategorias() { return mostrarCategorias; }

    public void setMostrarCategorias(Boolean mostrarCategorias) { this.mostrarCategorias = mostrarCategorias; }

    public Boolean getMostrarPrecios() { return mostrarPrecios; }

    public void setMostrarPrecios(Boolean mostrarPrecios) { this.mostrarPrecios = mostrarPrecios; }

    public EstadoSuscripcion getEstadoSuscripcion() { return estadoSuscripcion; }
    public void setEstadoSuscripcion(EstadoSuscripcion estadoSuscripcion) { this.estadoSuscripcion = estadoSuscripcion; }

    public LocalDateTime getFechaFinPrueba() { return fechaFinPrueba; }
    public void setFechaFinPrueba(LocalDateTime fechaFinPrueba) { this.fechaFinPrueba = fechaFinPrueba; }

    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }

    public Set<Usuario> getUsuarios() { return usuarios; }
    public void setUsuarios(Set<Usuario> usuarios) { this.usuarios = usuarios; }

    public Set<Producto> getProductos() { return productos; }
    public void setProductos(Set<Producto> productos) { this.productos = productos; }

    public Set<Cliente> getClientes() { return clientes; }
    public void setClientes(Set<Cliente> clientes) { this.clientes = clientes; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }

    // Métodos para baja de cuenta
    public LocalDateTime getFechaBaja() { return fechaBaja; }
    public void setFechaBaja(LocalDateTime fechaBaja) { this.fechaBaja = fechaBaja; }

    public String getMotivoBaja() { return motivoBaja; }
    public void setMotivoBaja(String motivoBaja) { this.motivoBaja = motivoBaja; }

    public Boolean getBajaPermanente() { return bajaPermanente; }
    public void setBajaPermanente(Boolean bajaPermanente) { this.bajaPermanente = bajaPermanente; }

    // Métodos de utilidad para baja
    public boolean estaDadaDeBaja() {
        return !activa && fechaBaja != null;
    }

    public void darDeBaja(String motivo, boolean permanente) {
        this.activa = false;
        this.fechaBaja = LocalDateTime.now();
        this.motivoBaja = motivo;
        this.bajaPermanente = permanente;
    }

    public void reactivar() {
        this.activa = true;
        this.fechaBaja = null;
        this.motivoBaja = null;
        this.bajaPermanente = false;
    }
}
