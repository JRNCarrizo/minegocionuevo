package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.ConteoSector;
import com.minegocio.backend.entidades.DetalleConteo;
import com.minegocio.backend.repositorios.ConteoSectorRepository;
import com.minegocio.backend.repositorios.DetalleConteoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ✅ NUEVA LÓGICA SIMPLE: Servicio auxiliar para manejar reconteos con referencia actual
 */
@Service
public class InventarioCompletoServiceSimple {

    @Autowired
    private DetalleConteoRepository detalleConteoRepository;
    
    @Autowired
    private ConteoSectorRepository conteoSectorRepository;

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Establece la referencia inicial con los valores del conteo inicial
     */
    public void establecerReferenciaInicial(ConteoSector conteoSector) {
        System.out.println("🔍 [SIMPLE] Estableciendo referencia inicial para sector: " + conteoSector.getId());
        
        try {
            // Obtener detalles del conteo inicial
            List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
            
            // Crear JSON simple con los valores de referencia
            StringBuilder referenciaJson = new StringBuilder();
            referenciaJson.append("{");
            
            // Agrupar por producto
            Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
            for (DetalleConteo detalle : detalles) {
                detallesPorProducto.computeIfAbsent(detalle.getProducto().getId(), k -> new ArrayList<>()).add(detalle);
            }
            
            boolean primero = true;
            for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
                if (!primero) referenciaJson.append(",");
                primero = false;
                
                List<DetalleConteo> detallesDelProducto = entry.getValue();
                DetalleConteo primerDetalle = detallesDelProducto.get(0);
                
                int totalUsuario1 = 0;
                int totalUsuario2 = 0;
                List<String> formulasUsuario1 = new ArrayList<>();
                List<String> formulasUsuario2 = new ArrayList<>();
                
                // Sumar todos los valores originales y recopilar TODAS las fórmulas
                for (DetalleConteo detalle : detallesDelProducto) {
                    // Usuario 1 - Recopilar TODAS las fórmulas
                    if (detalle.getCantidadConteo1() != null && detalle.getCantidadConteo1() > 0) {
                        totalUsuario1 += detalle.getCantidadConteo1();
                        if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                            // Agregar cada fórmula individual (solo la fórmula, sin cantidad)
                            formulasUsuario1.add(detalle.getFormulaCalculo1());
                        }
                    }
                    
                    // Usuario 2 - Recopilar TODAS las fórmulas
                    if (detalle.getCantidadConteo2() != null && detalle.getCantidadConteo2() > 0) {
                        totalUsuario2 += detalle.getCantidadConteo2();
                        if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                            // Agregar cada fórmula individual (solo la fórmula, sin cantidad)
                            formulasUsuario2.add(detalle.getFormulaCalculo2());
                        }
                    }
                }
                
                // Debug: Mostrar todas las fórmulas recopiladas
                System.out.println("🔍 [SIMPLE] Fórmulas Usuario1 para producto " + primerDetalle.getProducto().getId() + ": " + formulasUsuario1);
                System.out.println("🔍 [SIMPLE] Fórmulas Usuario2 para producto " + primerDetalle.getProducto().getId() + ": " + formulasUsuario2);
                
                referenciaJson.append("\"").append(primerDetalle.getProducto().getId()).append("\":{");
                referenciaJson.append("\"nombre\":\"").append(primerDetalle.getProducto().getNombre().replace("\"", "\\\"")).append("\",");
                referenciaJson.append("\"usuario1\":").append(totalUsuario1).append(",");
                referenciaJson.append("\"usuario2\":").append(totalUsuario2).append(",");
                referenciaJson.append("\"formulas1\":\"").append(String.join(" | ", formulasUsuario1).replace("\"", "\\\"")).append("\",");
                referenciaJson.append("\"formulas2\":\"").append(String.join(" | ", formulasUsuario2).replace("\"", "\\\"")).append("\"");
                referenciaJson.append("}");
            }
            
            referenciaJson.append("}");
            
            conteoSector.setReferenciaActual(referenciaJson.toString());
            System.out.println("✅ [SIMPLE] Referencia inicial establecida: " + referenciaJson.toString());
            
        } catch (Exception e) {
            System.err.println("❌ [SIMPLE] Error estableciendo referencia inicial: " + e.getMessage());
        }
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Actualiza la referencia actual con los valores del reconteo
     */
    public void actualizarReferenciaActual(ConteoSector conteoSector) {
        System.out.println("🔍 [SIMPLE] Actualizando referencia actual para sector: " + conteoSector.getId());
        
        try {
            // Obtener detalles del reconteo (valores más recientes)
            List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
            
            // Crear JSON simple con los valores de referencia actualizados
            StringBuilder referenciaJson = new StringBuilder();
            referenciaJson.append("{");
            
            // Agrupar por producto
            Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
            for (DetalleConteo detalle : detalles) {
                detallesPorProducto.computeIfAbsent(detalle.getProducto().getId(), k -> new ArrayList<>()).add(detalle);
            }
            
            boolean primero = true;
            for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
                if (!primero) referenciaJson.append(",");
                primero = false;
                
                List<DetalleConteo> detallesDelProducto = entry.getValue();
                DetalleConteo primerDetalle = detallesDelProducto.get(0);
                
                // Ordenar por fecha de actualización (más reciente primero) para obtener reconteos
                detallesDelProducto.sort((d1, d2) -> d2.getFechaActualizacion().compareTo(d1.getFechaActualizacion()));
                
                Integer totalUsuario1 = null;
                Integer totalUsuario2 = null;
                List<String> formulasUsuario1 = new ArrayList<>();
                List<String> formulasUsuario2 = new ArrayList<>();
                
                // Tomar solo el primer valor (más reciente) para cada usuario
                for (DetalleConteo detalle : detallesDelProducto) {
                    if (totalUsuario1 == null && detalle.getCantidadConteo1() != null) {
                        totalUsuario1 = detalle.getCantidadConteo1();
                        if (detalle.getFormulaCalculo1() != null && !detalle.getFormulaCalculo1().trim().isEmpty()) {
                            formulasUsuario1.add(detalle.getFormulaCalculo1());
                        }
                    }
                    if (totalUsuario2 == null && detalle.getCantidadConteo2() != null) {
                        totalUsuario2 = detalle.getCantidadConteo2();
                        if (detalle.getFormulaCalculo2() != null && !detalle.getFormulaCalculo2().trim().isEmpty()) {
                            formulasUsuario2.add(detalle.getFormulaCalculo2());
                        }
                    }
                    
                    // Si ya tenemos ambos valores (incluyendo cero), salir del bucle
                    if (totalUsuario1 != null && totalUsuario2 != null) {
                        break;
                    }
                }
                
                referenciaJson.append("\"").append(primerDetalle.getProducto().getId()).append("\":{");
                referenciaJson.append("\"nombre\":\"").append(primerDetalle.getProducto().getNombre().replace("\"", "\\\"")).append("\",");
                referenciaJson.append("\"usuario1\":").append(totalUsuario1 != null ? totalUsuario1 : 0).append(",");
                referenciaJson.append("\"usuario2\":").append(totalUsuario2 != null ? totalUsuario2 : 0).append(",");
                referenciaJson.append("\"formulas1\":\"").append(String.join(" | ", formulasUsuario1).replace("\"", "\\\"")).append("\",");
                referenciaJson.append("\"formulas2\":\"").append(String.join(" | ", formulasUsuario2).replace("\"", "\\\"")).append("\"");
                referenciaJson.append("}");
            }
            
            referenciaJson.append("}");
            
            conteoSector.setReferenciaActual(referenciaJson.toString());
            System.out.println("✅ [SIMPLE] Referencia actual actualizada: " + referenciaJson.toString());
            
        } catch (Exception e) {
            System.err.println("❌ [SIMPLE] Error actualizando referencia actual: " + e.getMessage());
        }
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Finalizar reconteo de sector
     */
    @Transactional
    public ConteoSector finalizarReconteoSector(Long conteoSectorId, Long usuarioId) {
        System.out.println("🔍 [SIMPLE] Finalizando reconteo de sector: " + conteoSectorId + " por usuario: " + usuarioId);
        
        ConteoSector conteoSector = conteoSectorRepository.findById(conteoSectorId)
            .orElseThrow(() -> new RuntimeException("Conteo de sector no encontrado"));
        
        // Verificar que el usuario está asignado al conteo
        boolean esUsuario1 = false;
        boolean esUsuario2 = false;
        
        if (conteoSector.getUsuarioAsignado1() != null) {
            esUsuario1 = conteoSector.getUsuarioAsignado1().getId().equals(usuarioId);
        }
        
        if (conteoSector.getUsuarioAsignado2() != null) {
            esUsuario2 = conteoSector.getUsuarioAsignado2().getId().equals(usuarioId);
        }
        
        if (!esUsuario1 && !esUsuario2) {
            throw new RuntimeException("El usuario no está asignado a este conteo");
        }
        
        // ✅ CORRECCIÓN: Verificar que estamos en un estado válido para reconteo
        // Permitir COMPLETADO si está en reconteo (se completó automáticamente)
        String observaciones = conteoSector.getObservaciones();
        boolean esReconteo = observaciones != null && 
                            (observaciones.contains("Usuario1_Finalizado") ||
                             observaciones.contains("Usuario2_Finalizado") ||
                             observaciones.contains("Reconteo completado") ||
                             observaciones.startsWith("Reconteo_"));
        
        System.out.println("🔍 [SIMPLE] Validando estado para reconteo:");
        System.out.println("  - Estado actual: " + conteoSector.getEstado());
        System.out.println("  - Observaciones: " + observaciones);
        System.out.println("  - Es reconteo: " + esReconteo);
        
        // ✅ PERMITIR todos los estados válidos para reconteo
        boolean estadoValidoParaReconteo = conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS || 
                                          conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION ||
                                          (conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO && esReconteo);
        
        if (!estadoValidoParaReconteo) {
            System.out.println("❌ [SIMPLE] Estado no válido para reconteo");
            throw new RuntimeException("El sector no está en estado de reconteo. Estado actual: " + conteoSector.getEstado());
        }
        
        // Determinar si es reconteo o conteo inicial basándose en las observaciones
        // esReconteo ya fue declarado arriba, solo usar la lógica específica para observaciones
        boolean esReconteoPorObservaciones = observaciones != null && observaciones.startsWith("Reconteo_");
        
        // Verificar si ya está en ESPERANDO_VERIFICACION (segundo usuario finalizando)
        if (conteoSector.getEstado() == ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION) {
            System.out.println("🔍 [SIMPLE] Segundo usuario finalizando " + (esReconteo ? "reconteo" : "conteo") + ", verificando diferencias...");
            
            // Actualizar referencia actual con los valores del reconteo
            if (esReconteoPorObservaciones) {
                System.out.println("🔄 [SIMPLE] RECONTEO: Actualizando referencia actual con reconteos...");
                actualizarReferenciaActual(conteoSector);
            }
            
            // Comparar reconteos de ambos usuarios
            System.out.println("🔍 [SIMPLE] Llamando a verificarDiferenciasEnReconteo para sector: " + conteoSector.getId());
            boolean hayDiferencias = verificarDiferenciasEnReconteo(conteoSector);
            System.out.println("🔍 [SIMPLE] Resultado de verificarDiferenciasEnReconteo: " + hayDiferencias);
                
            if (hayDiferencias) {
                // Hay diferencias, ir a estado CON_DIFERENCIAS para nuevo reconteo
                conteoSector.setEstado(ConteoSector.EstadoConteo.CON_DIFERENCIAS);
                if (esReconteoPorObservaciones) {
                    conteoSector.setObservaciones("Reconteo_" + LocalDateTime.now().toString()); // Marcar nuevo reconteo
                    System.out.println("⚠️ [SIMPLE] Diferencias persisten después del reconteo, iniciando nuevo reconteo");
                } else {
                    conteoSector.setObservaciones("Diferencias_Encontradas");
                    System.out.println("⚠️ [SIMPLE] Diferencias encontradas en conteo inicial, estado cambiado a CON_DIFERENCIAS");
                }
            } else {
                // No hay diferencias, sector completado
                conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
                if (esReconteoPorObservaciones) {
                    conteoSector.setObservaciones("Reconteo_Completado");
                    System.out.println("✅ [SIMPLE] Sin diferencias después del reconteo, estado cambiado a COMPLETADO");
                } else {
                    conteoSector.setObservaciones("Conteo_Completado");
                    System.out.println("✅ [SIMPLE] Sin diferencias en conteo inicial, estado cambiado a COMPLETADO");
                }
            }
        } else if (conteoSector.getEstado() == ConteoSector.EstadoConteo.CON_DIFERENCIAS) {
            // Primer usuario finalizando reconteo
            conteoSector.setEstado(ConteoSector.EstadoConteo.ESPERANDO_VERIFICACION);
            
            // ✅ CRÍTICO: Si ya tenemos "Reconteo_" con fecha, NO sobrescribir
            // porque necesitamos esa fecha para filtrar correctamente los reconteos
            if (!esReconteoPorObservaciones) {
                // Marcar qué usuario finalizó el reconteo en las observaciones
                if (esUsuario1) {
                    conteoSector.setObservaciones("Reconteo_Usuario1_Finalizado");
                } else if (esUsuario2) {
                    conteoSector.setObservaciones("Reconteo_Usuario2_Finalizado");
                }
            } else {
                System.out.println("✅ [SIMPLE] Manteniendo observaciones con fecha de reconteo: " + conteoSector.getObservaciones());
            }
            
            System.out.println("⏳ [SIMPLE] Primer usuario finalizó reconteo, estado cambiado a ESPERANDO_VERIFICACION");
        } else if (conteoSector.getEstado() == ConteoSector.EstadoConteo.COMPLETADO && esReconteo) {
            // ✅ NUEVO CASO: Sector ya completado automáticamente, pero usuario quiere finalizar manualmente
            System.out.println("✅ [SIMPLE] Sector ya completado automáticamente, confirmando finalización del reconteo");
            
            // Solo actualizar observaciones para confirmar que se finalizó manualmente
            if (conteoSector.getObservaciones() != null && 
                !conteoSector.getObservaciones().contains("Reconteo completado automáticamente")) {
                conteoSector.setObservaciones("Reconteo completado automáticamente - Finalizado manualmente");
            }
        }
        
        ConteoSector conteoSectorGuardado = conteoSectorRepository.save(conteoSector);
        
        System.out.println("✅ [SIMPLE] Estado final del sector (reconteo): " + conteoSectorGuardado.getEstado());
        return conteoSectorGuardado;
    }

    /**
     * ✅ NUEVA LÓGICA SIMPLE: Verificar si hay diferencias entre los reconteos de ambos usuarios
     */
    private boolean verificarDiferenciasEnReconteo(ConteoSector conteoSector) {
        System.out.println("🔍 [SIMPLE] Verificando diferencias en reconteo sector: " + conteoSector.getId());
        System.out.println("🔍 [SIMPLE] Estado actual del sector: " + conteoSector.getEstado());
        System.out.println("🔍 [SIMPLE] Observaciones del sector: " + conteoSector.getObservaciones());
        
        List<DetalleConteo> detalles = detalleConteoRepository.findByConteoSectorAndEliminadoFalseOrderByProductoNombre(conteoSector);
        System.out.println("🔍 [SIMPLE] Total detalles encontrados para verificación: " + detalles.size());
        
        // Consolidar reconteos por producto
        Map<Long, Integer> reconteosUsuario1 = new HashMap<>();
        Map<Long, Integer> reconteosUsuario2 = new HashMap<>();
        Map<Long, String> nombresProductos = new HashMap<>();
        Map<Long, List<DetalleConteo>> detallesPorProducto = new HashMap<>();
        
        // Fecha de inicio del reconteo: solo si el sufijo es un ISO-8601 (Reconteo_2025-03-25T10:00:00).
        // Si es "Reconteo_Usuario1_Finalizado" u otro texto, no usar fechaCreacion del sector (mezcla conteo inicial con reconteo).
        LocalDateTime fechaInicioReconteo = parseFechaInicioReconteoDesdeObservaciones(conteoSector.getObservaciones());
        if (fechaInicioReconteo != null) {
            System.out.println("✅ [SIMPLE] Fecha de inicio del reconteo desde observaciones: " + fechaInicioReconteo);
        } else {
            System.out.println("🔍 [SIMPLE] Sin fecha ISO en observaciones; se usarán los valores más recientes por producto (por fecha de detalle)");
        }
        
        // Debug: Mostrar todas las fechas de actualización
        System.out.println("🔍 [SIMPLE] Fechas de actualización de todos los detalles:");
        for (DetalleConteo detalle : detalles) {
            System.out.println("  - Detalle ID: " + detalle.getId() + 
                             ", Fecha creación: " + detalle.getFechaCreacion() + 
                             ", Fecha actualización: " + detalle.getFechaActualizacion() +
                             ", Usuario1: " + detalle.getCantidadConteo1() + 
                             ", Usuario2: " + detalle.getCantidadConteo2());
        }
        
        // Agrupar por producto
        for (DetalleConteo detalle : detalles) {
            if (detalle.getProducto() == null) {
                System.err.println("⚠️ [SIMPLE] DetalleConteo con ID " + detalle.getId() + " tiene producto nulo, saltando...");
                continue;
            }
            Long productoId = detalle.getProducto().getId();
            nombresProductos.put(productoId, detalle.getProducto().getNombre());
            detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
        }
        
        // Por cada producto: ordenar por fecha descendente y tomar el valor más reciente por usuario (incluye 0).
        // Así no se mezclan líneas viejas del primer conteo con el reconteo por el orden arbitrario del listado.
        for (Map.Entry<Long, List<DetalleConteo>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            String nombreProducto = nombresProductos.get(productoId);
            List<DetalleConteo> lista = new ArrayList<>(entry.getValue());
            lista.sort((d1, d2) -> {
                LocalDateTime f1 = d1.getFechaActualizacion() != null ? d1.getFechaActualizacion() : d1.getFechaCreacion();
                LocalDateTime f2 = d2.getFechaActualizacion() != null ? d2.getFechaActualizacion() : d2.getFechaCreacion();
                if (f1 == null && f2 == null) return 0;
                if (f1 == null) return 1;
                if (f2 == null) return -1;
                return f2.compareTo(f1);
            });
            
            List<DetalleConteo> candidatos = lista;
            if (fechaInicioReconteo != null) {
                List<DetalleConteo> filtrados = lista.stream()
                    .filter(d -> {
                        LocalDateTime fv = d.getFechaActualizacion() != null ? d.getFechaActualizacion() : d.getFechaCreacion();
                        return fv != null && !fv.isBefore(fechaInicioReconteo);
                    })
                    .collect(Collectors.toList());
                if (!filtrados.isEmpty()) {
                    candidatos = filtrados;
                }
            }
            
            Integer u1 = null;
            for (DetalleConteo d : candidatos) {
                if (d.getCantidadConteo1() != null) {
                    u1 = d.getCantidadConteo1();
                    break;
                }
            }
            Integer u2 = null;
            for (DetalleConteo d : candidatos) {
                if (d.getCantidadConteo2() != null) {
                    u2 = d.getCantidadConteo2();
                    break;
                }
            }
            
            System.out.println("🔍 [SIMPLE] Producto " + nombreProducto + " — consolidado reconteo U1=" + u1 + ", U2=" + u2);
            
            if (u1 != null) {
                reconteosUsuario1.put(productoId, u1);
            }
            if (u2 != null) {
                reconteosUsuario2.put(productoId, u2);
            }
        }
        
        // Comparar reconteos por producto
        Set<Long> todosLosProductos = new HashSet<>();
        todosLosProductos.addAll(reconteosUsuario1.keySet());
        todosLosProductos.addAll(reconteosUsuario2.keySet());
        
        for (Long productoId : todosLosProductos) {
            String nombreProducto = nombresProductos.get(productoId);
            boolean usuario1Reconto = reconteosUsuario1.containsKey(productoId);
            boolean usuario2Reconto = reconteosUsuario2.containsKey(productoId);
            Integer reconteo1 = reconteosUsuario1.get(productoId);
            Integer reconteo2 = reconteosUsuario2.get(productoId);
            
            System.out.println("🔍 [SIMPLE] Comparando producto " + nombreProducto + ": Usuario 1=" + reconteo1 + ", Usuario 2=" + reconteo2);
            
            // Si ambos usuarios recontaron el producto, comparar reconteos
            if (usuario1Reconto && usuario2Reconto) {
                System.out.println("🔍 [SIMPLE] Ambos usuarios recontaron " + nombreProducto + 
                                 " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                
                if (!Objects.equals(reconteo1, reconteo2)) {
                    System.out.println("⚠️ [SIMPLE] Diferencia encontrada en reconteo - producto: " + nombreProducto + 
                                     " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                    return true;
                } else {
                    System.out.println("✅ [SIMPLE] Sin diferencias en reconteo - producto: " + nombreProducto + 
                                     " - Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2);
                }
            }
            
            // Si solo uno de los usuarios recontó el producto, también es una diferencia
            if ((usuario1Reconto && !usuario2Reconto) || (!usuario1Reconto && usuario2Reconto)) {
                System.out.println("⚠️ [SIMPLE] Diferencia encontrada: solo un usuario recontó " + nombreProducto + 
                                 " (Usuario 1: " + reconteo1 + ", Usuario 2: " + reconteo2 + ")");
                return true;
            }
        }
        
        // Si llegamos aquí, no hay diferencias. Consolidar reconteos en los detalles
        consolidarReconteoSinDiferencias(detallesPorProducto, reconteosUsuario1, reconteosUsuario2);
        regresarEstadoConteoSinDiferencias(conteoSector, detallesPorProducto);
        
        System.out.println("✅ [SIMPLE] No se encontraron diferencias entre los reconteos");
        return false;
    }

    /**
     * ✅ Consolidar los detalles de conteo cuando no hay diferencias en el reconteo
     */
    private void consolidarReconteoSinDiferencias(
            Map<Long, List<DetalleConteo>> detallesPorProducto,
            Map<Long, Integer> reconteosUsuario1,
            Map<Long, Integer> reconteosUsuario2
    ) {
        detallesPorProducto.forEach((productoId, listaDetalles) -> {
            if (listaDetalles == null || listaDetalles.isEmpty()) {
                return;
            }

            Comparator<DetalleConteo> porFechaDesc = Comparator.comparing(
                (DetalleConteo d) -> d.getFechaActualizacion() != null ? d.getFechaActualizacion() : d.getFechaCreacion(),
                Comparator.nullsFirst(Comparator.naturalOrder())
            ).reversed();

            List<DetalleConteo> ordenados = listaDetalles.stream()
                .sorted(porFechaDesc)
                .collect(Collectors.toList());

            DetalleConteo detallePrincipal = ordenados.get(0);

            Integer valorUsuario1 = ordenados.stream()
                .filter(d -> d.getCantidadConteo1() != null)
                .findFirst()
                .map(DetalleConteo::getCantidadConteo1)
                .orElse(0);

            Integer valorUsuario2 = ordenados.stream()
                .filter(d -> d.getCantidadConteo2() != null)
                .findFirst()
                .map(DetalleConteo::getCantidadConteo2)
                .orElse(0);

            detallePrincipal.setCantidadConteo1(valorUsuario1);
            detallePrincipal.setCantidadConteo2(valorUsuario2);
            detallePrincipal.setEliminado(false);
            detallePrincipal.setEstado(DetalleConteo.EstadoDetalle.FINALIZADO);
            detallePrincipal.setFormulaCalculo1(valorUsuario1 != null && valorUsuario1 != 0 ? detallePrincipal.getFormulaCalculo1() : null);
            detallePrincipal.setFormulaCalculo2(valorUsuario2 != null && valorUsuario2 != 0 ? detallePrincipal.getFormulaCalculo2() : null);

            int diferenciaEntre = valorUsuario1 - valorUsuario2;
            detallePrincipal.setDiferenciaEntreConteos(diferenciaEntre);
            int cantidadFinal = Math.max(valorUsuario1, valorUsuario2);
            detallePrincipal.setCantidadFinal(cantidadFinal);
            if (detallePrincipal.getStockSistema() != null) {
                detallePrincipal.setDiferenciaSistema(detallePrincipal.getStockSistema() - cantidadFinal);
            } else {
                detallePrincipal.setDiferenciaSistema(0);
            }
            String observaciones = detallePrincipal.getObservaciones();
            if (observaciones == null || observaciones.trim().isEmpty()) {
                detallePrincipal.setObservaciones("Reconteo consolidado sin diferencias");
            } else if (!observaciones.contains("Reconteo consolidado")) {
                detallePrincipal.setObservaciones(observaciones + " | Reconteo consolidado sin diferencias");
            }
            detalleConteoRepository.save(detallePrincipal);

            // Marcar el resto como eliminados para que no sigan apareciendo como diferencias
            for (int i = 1; i < ordenados.size(); i++) {
                DetalleConteo detalleAntiguo = ordenados.get(i);
                detalleAntiguo.setEliminado(true);
                detalleAntiguo.setEstado(DetalleConteo.EstadoDetalle.FINALIZADO);
                detalleAntiguo.setCantidadConteo1(null);
                detalleAntiguo.setCantidadConteo2(null);
                detalleAntiguo.setCantidadFinal(null);
                detalleAntiguo.setDiferenciaEntreConteos(null);
                detalleAntiguo.setDiferenciaSistema(null);
                detalleAntiguo.setFormulaCalculo1(null);
                detalleAntiguo.setFormulaCalculo2(null);
                String obsAntiguo = detalleAntiguo.getObservaciones();
                if (obsAntiguo == null || obsAntiguo.trim().isEmpty()) {
                    detalleAntiguo.setObservaciones("Reconteo consolidado, detalle antiguo descartado");
                } else if (!obsAntiguo.contains("Reconteo consolidado")) {
                    detalleAntiguo.setObservaciones(obsAntiguo + " | Reconteo consolidado, detalle antiguo descartado");
                }
                detalleConteoRepository.save(detalleAntiguo);
            }
        });
    }

    /**
     * Fecha de inicio del reconteo solo si las observaciones son "Reconteo_" + ISO-8601 (ej. al pasar a CON_DIFERENCIAS).
     * Cadenas como Reconteo_Usuario1_Finalizado devuelven null (no mezclar con fechaCreacion del sector).
     */
    private LocalDateTime parseFechaInicioReconteoDesdeObservaciones(String observaciones) {
        if (observaciones == null || !observaciones.startsWith("Reconteo_")) {
            return null;
        }
        String rest = observaciones.substring("Reconteo_".length());
        if (rest.isEmpty() || !Character.isDigit(rest.charAt(0))) {
            return null;
        }
        try {
            return LocalDateTime.parse(rest);
        } catch (Exception e) {
            System.out.println("⚠️ [SIMPLE] Sufijo tras Reconteo_ no es ISO-8601: " + rest);
            return null;
        }
    }

    /**
     * ✅ Ajusta el estado del conteo y sus detalles cuando no quedan diferencias
     */
    private void regresarEstadoConteoSinDiferencias(
            ConteoSector conteoSector,
            Map<Long, List<DetalleConteo>> detallesPorProducto
    ) {
        // Ajustar detalles consolidados (limpiar textos y estados solo lectura)
        // Recalcular y actualizar el estado del sector
        conteoSector.setEstado(ConteoSector.EstadoConteo.COMPLETADO);
        conteoSector.setObservaciones("Reconteo_Completado_Sin_Diferencias");
        conteoSectorRepository.save(conteoSector);
    }
}
