package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.TransportistaDTO;
import com.minegocio.backend.dto.VehiculoDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Transportista;
import com.minegocio.backend.entidades.Vehiculo;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.TransportistaRepository;
import com.minegocio.backend.repositorios.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransportistaService {

    @Autowired
    private TransportistaRepository transportistaRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    // Obtener todos los transportistas de una empresa
    public List<TransportistaDTO> obtenerTransportistasPorEmpresa(Long empresaId) {
        List<Transportista> transportistas = transportistaRepository.findByEmpresaIdOrderByCodigoInternoAsc(empresaId);
        return transportistas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    // Obtener transportistas activos de una empresa
    public List<TransportistaDTO> obtenerTransportistasActivosPorEmpresa(Long empresaId) {
        List<Transportista> transportistas = transportistaRepository.findByEmpresaIdAndActivoTrueOrderByCodigoInternoAsc(empresaId);
        return transportistas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    // Buscar transportistas por nombre o código
    public List<TransportistaDTO> buscarTransportistas(Long empresaId, String busqueda) {
        List<Transportista> transportistas = transportistaRepository.buscarPorNombreOCodigo(empresaId, busqueda);
        return transportistas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    // Obtener transportista por ID
    public TransportistaDTO obtenerTransportistaPorId(Long transportistaId, Long empresaId) {
        Transportista transportista = transportistaRepository.findById(transportistaId)
                .orElseThrow(() -> new RuntimeException("Transportista no encontrado"));

        // Verificar que pertenece a la empresa
        if (!transportista.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Transportista no pertenece a la empresa");
        }

        return convertirADTO(transportista);
    }

    // Crear transportista
    public TransportistaDTO crearTransportista(TransportistaDTO transportistaDTO, Long empresaId) {
        // Verificar que la empresa existe
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Verificar que el código interno no existe
        if (transportistaRepository.existsByCodigoInternoAndEmpresaId(transportistaDTO.getCodigoInterno(), empresaId)) {
            throw new RuntimeException("Ya existe un transportista con el código '" + transportistaDTO.getCodigoInterno() + "' en esta empresa");
        }

        // Crear transportista
        Transportista transportista = new Transportista();
        transportista.setCodigoInterno(transportistaDTO.getCodigoInterno());
        transportista.setNombreApellido(transportistaDTO.getNombreApellido());
        transportista.setNombreEmpresa(transportistaDTO.getNombreEmpresa());
        transportista.setActivo(true);
        transportista.setEmpresa(empresa);

        transportista = transportistaRepository.save(transportista);

        // Crear vehículos si se proporcionan
        if (transportistaDTO.getVehiculos() != null && !transportistaDTO.getVehiculos().isEmpty()) {
            for (VehiculoDTO vehiculoDTO : transportistaDTO.getVehiculos()) {
                crearVehiculo(vehiculoDTO, transportista.getId());
            }
        }

        return convertirADTO(transportista);
    }

    // Actualizar transportista
    public TransportistaDTO actualizarTransportista(Long transportistaId, TransportistaDTO transportistaDTO, Long empresaId) {
        Transportista transportista = transportistaRepository.findById(transportistaId)
                .orElseThrow(() -> new RuntimeException("Transportista no encontrado"));

        // Verificar que pertenece a la empresa
        if (!transportista.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Transportista no pertenece a la empresa");
        }

        // Verificar que el código interno no existe en otro transportista
        if (!transportista.getCodigoInterno().equals(transportistaDTO.getCodigoInterno()) &&
            transportistaRepository.existsByCodigoInternoAndEmpresaId(transportistaDTO.getCodigoInterno(), empresaId)) {
            throw new RuntimeException("Ya existe un transportista con el código '" + transportistaDTO.getCodigoInterno() + "' en esta empresa");
        }

        // Actualizar datos
        transportista.setCodigoInterno(transportistaDTO.getCodigoInterno());
        transportista.setNombreApellido(transportistaDTO.getNombreApellido());
        transportista.setNombreEmpresa(transportistaDTO.getNombreEmpresa());

        transportista = transportistaRepository.save(transportista);
        return convertirADTO(transportista);
    }

    // Cambiar estado del transportista
    public TransportistaDTO cambiarEstadoTransportista(Long transportistaId, Boolean activo, Long empresaId) {
        Transportista transportista = transportistaRepository.findById(transportistaId)
                .orElseThrow(() -> new RuntimeException("Transportista no encontrado"));

        // Verificar que pertenece a la empresa
        if (!transportista.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Transportista no pertenece a la empresa");
        }

        transportista.setActivo(activo);
        transportista = transportistaRepository.save(transportista);
        return convertirADTO(transportista);
    }

    // Eliminar transportista
    public void eliminarTransportista(Long transportistaId, Long empresaId) {
        Transportista transportista = transportistaRepository.findById(transportistaId)
                .orElseThrow(() -> new RuntimeException("Transportista no encontrado"));

        // Verificar que pertenece a la empresa
        if (!transportista.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Transportista no pertenece a la empresa");
        }

        transportistaRepository.delete(transportista);
    }

    // Crear vehículo
    public VehiculoDTO crearVehiculo(VehiculoDTO vehiculoDTO, Long transportistaId) {
        Transportista transportista = transportistaRepository.findById(transportistaId)
                .orElseThrow(() -> new RuntimeException("Transportista no encontrado"));

        // Verificar que la patente no existe
        if (vehiculoRepository.existsByPatente(vehiculoDTO.getPatente())) {
            throw new RuntimeException("Ya existe un vehículo con la patente '" + vehiculoDTO.getPatente() + "'");
        }

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setMarca(vehiculoDTO.getMarca());
        vehiculo.setModelo(vehiculoDTO.getModelo());
        vehiculo.setPatente(vehiculoDTO.getPatente());
        vehiculo.setActivo(true);
        vehiculo.setTransportista(transportista);

        vehiculo = vehiculoRepository.save(vehiculo);
        return convertirVehiculoADTO(vehiculo);
    }

    // Actualizar vehículo
    public VehiculoDTO actualizarVehiculo(Long vehiculoId, VehiculoDTO vehiculoDTO, Long empresaId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        // Verificar que pertenece a un transportista de la empresa
        if (!vehiculo.getTransportista().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Vehículo no pertenece a la empresa");
        }

        // Verificar que la patente no existe en otro vehículo
        if (!vehiculo.getPatente().equals(vehiculoDTO.getPatente()) &&
            vehiculoRepository.existsByPatente(vehiculoDTO.getPatente())) {
            throw new RuntimeException("Ya existe un vehículo con la patente '" + vehiculoDTO.getPatente() + "'");
        }

        vehiculo.setMarca(vehiculoDTO.getMarca());
        vehiculo.setModelo(vehiculoDTO.getModelo());
        vehiculo.setPatente(vehiculoDTO.getPatente());

        vehiculo = vehiculoRepository.save(vehiculo);
        return convertirVehiculoADTO(vehiculo);
    }

    // Cambiar estado del vehículo
    public VehiculoDTO cambiarEstadoVehiculo(Long vehiculoId, Boolean activo, Long empresaId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        // Verificar que pertenece a un transportista de la empresa
        if (!vehiculo.getTransportista().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Vehículo no pertenece a la empresa");
        }

        vehiculo.setActivo(activo);
        vehiculo = vehiculoRepository.save(vehiculo);
        return convertirVehiculoADTO(vehiculo);
    }

    // Eliminar vehículo
    public void eliminarVehiculo(Long vehiculoId, Long empresaId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        // Verificar que pertenece a un transportista de la empresa
        if (!vehiculo.getTransportista().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Vehículo no pertenece a la empresa");
        }

        vehiculoRepository.delete(vehiculo);
    }

    // Métodos de conversión
    private TransportistaDTO convertirADTO(Transportista transportista) {
        List<VehiculoDTO> vehiculosDTO = transportista.getVehiculos().stream()
                .map(this::convertirVehiculoADTO)
                .collect(Collectors.toList());

        return new TransportistaDTO(
                transportista.getId(),
                transportista.getCodigoInterno(),
                transportista.getNombreApellido(),
                transportista.getNombreEmpresa(),
                transportista.getActivo(),
                transportista.getFechaCreacion(),
                transportista.getFechaActualizacion(),
                transportista.getEmpresa().getId(),
                vehiculosDTO
        );
    }

    private VehiculoDTO convertirVehiculoADTO(Vehiculo vehiculo) {
        return new VehiculoDTO(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getPatente(),
                vehiculo.getActivo(),
                vehiculo.getFechaCreacion(),
                vehiculo.getFechaActualizacion(),
                vehiculo.getTransportista().getId()
        );
    }
}



