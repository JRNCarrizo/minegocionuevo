package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa los clientes de cada empresa
 */
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres")
    @Column(nullable = false, length = 100)
    private String apellidos;

    @Email(message = "Debe proporcionar un email válido")
    @NotBlank(message = "El email es obligatorio")
    @Column(nullable = false)
    private String email;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;

    @Size(max = 500, message = "La dirección no puede exceder 500 caracteres")
    @Column(length = 500)
    private String direccion;

    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    @Column(length = 100)
    private String ciudad;

    @Size(max = 20, message = "El código postal no puede exceder 20 caracteres")
    @Column(name = "codigo_postal", length = 20)
    private String codigoPostal;

    @Size(max = 100, message = "El país no puede exceder 100 caracteres")
    @Column(length = 100)
    private String pais;

    // Información adicional
    @Column(name = "fecha_nacimiento")
    private LocalDateTime fechaNacimiento;

    @Enumerated(EnumType.STRING)
    private TipoCliente tipo = TipoCliente.REGULAR;

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "acepta_marketing")
    private Boolean aceptaMarketing = false;

    // Contraseña para acceso al portal
    @Column(name = "password")
    private String password;

    @Column(name = "token_verificacion")
    private String tokenVerificacion;

    @Column(name = "email_verificado")
    private Boolean emailVerificado = false;

    // Relación con empresa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // Relación con pedidos
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Pedido> pedidos = new ArrayList<>();

    // Relación con mensajes
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Mensaje> mensajes = new ArrayList<>();

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
    public Cliente() {}

    public Cliente(String nombre, String apellidos, String email, Empresa empresa) {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.empresa = empresa;
    }

    // Enum para tipos de cliente
    public enum TipoCliente {
        REGULAR, PREMIUM, VIP
    }

    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombre + " " + apellidos;
    }

    public int getTotalPedidos() {
        return pedidos.size();
    }

    public boolean esPremium() {
        return TipoCliente.PREMIUM.equals(this.tipo) || TipoCliente.VIP.equals(this.tipo);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

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

    public LocalDateTime getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDateTime fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public TipoCliente getTipo() { return tipo; }
    public void setTipo(TipoCliente tipo) { this.tipo = tipo; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Boolean getAceptaMarketing() { return aceptaMarketing; }
    public void setAceptaMarketing(Boolean aceptaMarketing) { this.aceptaMarketing = aceptaMarketing; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTokenVerificacion() { return tokenVerificacion; }
    public void setTokenVerificacion(String tokenVerificacion) { this.tokenVerificacion = tokenVerificacion; }

    public Boolean getEmailVerificado() { return emailVerificado; }
    public void setEmailVerificado(Boolean emailVerificado) { this.emailVerificado = emailVerificado; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public List<Pedido> getPedidos() { return pedidos; }
    public void setPedidos(List<Pedido> pedidos) { this.pedidos = pedidos; }

    public List<Mensaje> getMensajes() { return mensajes; }
    public void setMensajes(List<Mensaje> mensajes) { this.mensajes = mensajes; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
}
