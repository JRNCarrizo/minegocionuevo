package com.minegocio.backend.dto;

import java.util.List;

/**
 * DTO que representa las dependencias de un producto
 */
public class DependenciasProductoDTO {
    
    private boolean tienePedidos;
    private boolean tieneIngresos;
    private boolean tieneDevoluciones;
    private boolean tieneStockEnSectores;
    private boolean tieneRoturas;
    private boolean tieneHistorial;
    private boolean tieneVentas;
    private boolean tieneFavoritos;
    private boolean tieneInventariosFisicos;
    private boolean tieneCierresDia;
    private boolean tieneMensajes;
    
    private boolean puedeEliminarFisicamente;
    private boolean puedeDesactivar;
    private String tipoEliminacion; // "SEGURA", "ADVERTENCIA", "BLOQUEADA"
    private List<String> razonesBloqueo;
    private List<String> dependenciasEncontradas;
    
    // Contadores específicos
    private int cantidadPedidos;
    private int cantidadIngresos;
    private int cantidadDevoluciones;
    private int cantidadSectoresConStock;
    private int cantidadRoturas;
    private int cantidadVentas;
    private int cantidadFavoritos;
    private int cantidadInventariosFisicos;
    private int cantidadCierresDia;
    private int cantidadMensajes;
    
    // Constructores
    public DependenciasProductoDTO() {}
    
    public DependenciasProductoDTO(boolean tienePedidos, boolean tieneIngresos, boolean tieneDevoluciones,
                                 boolean tieneStockEnSectores, boolean tieneRoturas, boolean tieneHistorial,
                                 boolean tieneVentas, boolean tieneFavoritos, boolean tieneInventariosFisicos,
                                 boolean tieneCierresDia, boolean tieneMensajes) {
        this.tienePedidos = tienePedidos;
        this.tieneIngresos = tieneIngresos;
        this.tieneDevoluciones = tieneDevoluciones;
        this.tieneStockEnSectores = tieneStockEnSectores;
        this.tieneRoturas = tieneRoturas;
        this.tieneHistorial = tieneHistorial;
        this.tieneVentas = tieneVentas;
        this.tieneFavoritos = tieneFavoritos;
        this.tieneInventariosFisicos = tieneInventariosFisicos;
        this.tieneCierresDia = tieneCierresDia;
        this.tieneMensajes = tieneMensajes;
    }
    
    // Getters y Setters
    public boolean isTienePedidos() { return tienePedidos; }
    public void setTienePedidos(boolean tienePedidos) { this.tienePedidos = tienePedidos; }
    
    public boolean isTieneIngresos() { return tieneIngresos; }
    public void setTieneIngresos(boolean tieneIngresos) { this.tieneIngresos = tieneIngresos; }
    
    public boolean isTieneDevoluciones() { return tieneDevoluciones; }
    public void setTieneDevoluciones(boolean tieneDevoluciones) { this.tieneDevoluciones = tieneDevoluciones; }
    
    public boolean isTieneStockEnSectores() { return tieneStockEnSectores; }
    public void setTieneStockEnSectores(boolean tieneStockEnSectores) { this.tieneStockEnSectores = tieneStockEnSectores; }
    
    public boolean isTieneRoturas() { return tieneRoturas; }
    public void setTieneRoturas(boolean tieneRoturas) { this.tieneRoturas = tieneRoturas; }
    
    public boolean isTieneHistorial() { return tieneHistorial; }
    public void setTieneHistorial(boolean tieneHistorial) { this.tieneHistorial = tieneHistorial; }
    
    public boolean isTieneVentas() { return tieneVentas; }
    public void setTieneVentas(boolean tieneVentas) { this.tieneVentas = tieneVentas; }
    
    public boolean isTieneFavoritos() { return tieneFavoritos; }
    public void setTieneFavoritos(boolean tieneFavoritos) { this.tieneFavoritos = tieneFavoritos; }
    
    public boolean isTieneInventariosFisicos() { return tieneInventariosFisicos; }
    public void setTieneInventariosFisicos(boolean tieneInventariosFisicos) { this.tieneInventariosFisicos = tieneInventariosFisicos; }
    
    public boolean isTieneCierresDia() { return tieneCierresDia; }
    public void setTieneCierresDia(boolean tieneCierresDia) { this.tieneCierresDia = tieneCierresDia; }
    
    public boolean isTieneMensajes() { return tieneMensajes; }
    public void setTieneMensajes(boolean tieneMensajes) { this.tieneMensajes = tieneMensajes; }
    
    public boolean isPuedeEliminarFisicamente() { return puedeEliminarFisicamente; }
    public void setPuedeEliminarFisicamente(boolean puedeEliminarFisicamente) { this.puedeEliminarFisicamente = puedeEliminarFisicamente; }
    
    public boolean isPuedeDesactivar() { return puedeDesactivar; }
    public void setPuedeDesactivar(boolean puedeDesactivar) { this.puedeDesactivar = puedeDesactivar; }
    
    public String getTipoEliminacion() { return tipoEliminacion; }
    public void setTipoEliminacion(String tipoEliminacion) { this.tipoEliminacion = tipoEliminacion; }
    
    public List<String> getRazonesBloqueo() { return razonesBloqueo; }
    public void setRazonesBloqueo(List<String> razonesBloqueo) { this.razonesBloqueo = razonesBloqueo; }
    
    public List<String> getDependenciasEncontradas() { return dependenciasEncontradas; }
    public void setDependenciasEncontradas(List<String> dependenciasEncontradas) { this.dependenciasEncontradas = dependenciasEncontradas; }
    
    public int getCantidadPedidos() { return cantidadPedidos; }
    public void setCantidadPedidos(int cantidadPedidos) { this.cantidadPedidos = cantidadPedidos; }
    
    public int getCantidadIngresos() { return cantidadIngresos; }
    public void setCantidadIngresos(int cantidadIngresos) { this.cantidadIngresos = cantidadIngresos; }
    
    public int getCantidadDevoluciones() { return cantidadDevoluciones; }
    public void setCantidadDevoluciones(int cantidadDevoluciones) { this.cantidadDevoluciones = cantidadDevoluciones; }
    
    public int getCantidadSectoresConStock() { return cantidadSectoresConStock; }
    public void setCantidadSectoresConStock(int cantidadSectoresConStock) { this.cantidadSectoresConStock = cantidadSectoresConStock; }
    
    public int getCantidadRoturas() { return cantidadRoturas; }
    public void setCantidadRoturas(int cantidadRoturas) { this.cantidadRoturas = cantidadRoturas; }
    
    public int getCantidadVentas() { return cantidadVentas; }
    public void setCantidadVentas(int cantidadVentas) { this.cantidadVentas = cantidadVentas; }
    
    public int getCantidadFavoritos() { return cantidadFavoritos; }
    public void setCantidadFavoritos(int cantidadFavoritos) { this.cantidadFavoritos = cantidadFavoritos; }
    
    public int getCantidadInventariosFisicos() { return cantidadInventariosFisicos; }
    public void setCantidadInventariosFisicos(int cantidadInventariosFisicos) { this.cantidadInventariosFisicos = cantidadInventariosFisicos; }
    
    public int getCantidadCierresDia() { return cantidadCierresDia; }
    public void setCantidadCierresDia(int cantidadCierresDia) { this.cantidadCierresDia = cantidadCierresDia; }
    
    public int getCantidadMensajes() { return cantidadMensajes; }
    public void setCantidadMensajes(int cantidadMensajes) { this.cantidadMensajes = cantidadMensajes; }
}
