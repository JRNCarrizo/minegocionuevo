package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa los super administradores del sistema
 */
@Entity
@Table(name = "super_admins")
public class SuperAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Column(nullable = false, length = 100)
    private String apellidos;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolSuperAdmin rol = RolSuperAdmin.ADMIN;

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "email_verificado")
    private Boolean emailVerificado = false;

    @Column(name = "token_verificacion", length = 255)
    private String tokenVerificacion;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @Column(name = "fecha_ultimo_cambio_password")
    private LocalDateTime fechaUltimoCambioPassword;

    @Column(name = "requiere_cambio_password")
    private Boolean requiereCambioPassword = false;

    @Column(name = "intentos_fallidos_login")
    private Integer intentosFallidosLogin = 0;

    @Column(name = "cuenta_bloqueada")
    private Boolean cuentaBloqueada = false;

    @Column(name = "fecha_desbloqueo")
    private LocalDateTime fechaDesbloqueo;

    @Column(length = 500)
    private String observaciones;

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public SuperAdmin() {}

    public SuperAdmin(String nombre, String apellidos, String email, String password) {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.password = password;
    }

    // Enum para roles de super administrador
    public enum RolSuperAdmin {
        SUPER_ADMIN, ADMIN, SUPPORT, READ_ONLY
    }

    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombre + " " + apellidos;
    }

    public boolean puedeAcceder() {
        return activo && !cuentaBloqueada;
    }

    public boolean esSuperAdmin() {
        return RolSuperAdmin.SUPER_ADMIN.equals(this.rol);
    }

    public boolean puedeEditar() {
        return RolSuperAdmin.SUPER_ADMIN.equals(this.rol) || 
               RolSuperAdmin.ADMIN.equals(this.rol);
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

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public RolSuperAdmin getRol() { return rol; }
    public void setRol(RolSuperAdmin rol) { this.rol = rol; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Boolean getEmailVerificado() { return emailVerificado; }
    public void setEmailVerificado(Boolean emailVerificado) { this.emailVerificado = emailVerificado; }

    public String getTokenVerificacion() { return tokenVerificacion; }
    public void setTokenVerificacion(String tokenVerificacion) { this.tokenVerificacion = tokenVerificacion; }

    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }

    public LocalDateTime getFechaUltimoCambioPassword() { return fechaUltimoCambioPassword; }
    public void setFechaUltimoCambioPassword(LocalDateTime fechaUltimoCambioPassword) { this.fechaUltimoCambioPassword = fechaUltimoCambioPassword; }

    public Boolean getRequiereCambioPassword() { return requiereCambioPassword; }
    public void setRequiereCambioPassword(Boolean requiereCambioPassword) { this.requiereCambioPassword = requiereCambioPassword; }

    public Integer getIntentosFallidosLogin() { return intentosFallidosLogin; }
    public void setIntentosFallidosLogin(Integer intentosFallidosLogin) { this.intentosFallidosLogin = intentosFallidosLogin; }

    public Boolean getCuentaBloqueada() { return cuentaBloqueada; }
    public void setCuentaBloqueada(Boolean cuentaBloqueada) { this.cuentaBloqueada = cuentaBloqueada; }

    public LocalDateTime getFechaDesbloqueo() { return fechaDesbloqueo; }
    public void setFechaDesbloqueo(LocalDateTime fechaDesbloqueo) { this.fechaDesbloqueo = fechaDesbloqueo; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
} 