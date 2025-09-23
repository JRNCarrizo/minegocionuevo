package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetalleVentaRapida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleVentaRapidaRepository extends JpaRepository<DetalleVentaRapida, Long> {
}
