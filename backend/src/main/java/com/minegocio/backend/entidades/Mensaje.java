package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa los mensajes entre clientes y administradores
 */
@Entity
@Table(name = "mensajes")
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El asunto es obligatorio")
    @Size(max = 200, message = "El asunto no puede exceder 200 caracteres")
    @Column(nullable = false, length = 200)
    private String asunto;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 2000, message = "El contenido no puede exceder 2000 caracteres")
    @Column(nullable = false, length = 2000)
    private String contenido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMensaje tipo = TipoMensaje.CONSULTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoMensaje estado = EstadoMensaje.PENDIENTE;

    @Column(name = "leido")
    private Boolean leido = false;

    @Column(name = "respuesta", length = 2000)
    private String respuesta;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    // Relación con cliente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    // Relación con empresa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // Relación con producto (opcional, para consultas sobre productos específicos)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    // Usuario que respondió (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respondido_por")
    private Usuario respondidoPor;

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public Mensaje() {}

    public Mensaje(String asunto, String contenido, Cliente cliente, Empresa empresa) {
        this.asunto = asunto;
        this.contenido = contenido;
        this.cliente = cliente;
        this.empresa = empresa;
    }

    // Enums
    public enum TipoMensaje {
        CONSULTA, RECLAMO, SUGERENCIA, SOPORTE
    }

    public enum EstadoMensaje {
        PENDIENTE, RESPONDIDO, CERRADO
    }

    // Métodos de utilidad
    public void responder(String respuesta, Usuario usuario) {
        this.respuesta = respuesta;
        this.respondidoPor = usuario;
        this.fechaRespuesta = LocalDateTime.now();
        this.estado = EstadoMensaje.RESPONDIDO;
        this.leido = true;
    }

    public void marcarComoLeido() {
        this.leido = true;
    }

    public void cerrar() {
        this.estado = EstadoMensaje.CERRADO;
    }

    public boolean estaPendiente() {
        return EstadoMensaje.PENDIENTE.equals(this.estado);
    }

    public boolean estaRespondido() {
        return EstadoMensaje.RESPONDIDO.equals(this.estado);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAsunto() { return asunto; }
    public void setAsunto(String asunto) { this.asunto = asunto; }

    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }

    public TipoMensaje getTipo() { return tipo; }
    public void setTipo(TipoMensaje tipo) { this.tipo = tipo; }

    public EstadoMensaje getEstado() { return estado; }
    public void setEstado(EstadoMensaje estado) { this.estado = estado; }

    public Boolean getLeido() { return leido; }
    public void setLeido(Boolean leido) { this.leido = leido; }

    public String getRespuesta() { return respuesta; }
    public void setRespuesta(String respuesta) { this.respuesta = respuesta; }

    public LocalDateTime getFechaRespuesta() { return fechaRespuesta; }
    public void setFechaRespuesta(LocalDateTime fechaRespuesta) { this.fechaRespuesta = fechaRespuesta; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Usuario getRespondidoPor() { return respondidoPor; }
    public void setRespondidoPor(Usuario respondidoPor) { this.respondidoPor = respondidoPor; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
