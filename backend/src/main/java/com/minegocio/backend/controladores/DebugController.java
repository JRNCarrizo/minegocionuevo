package com.minegocio.backend.controladores;

import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.TokenRecuperacionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador temporal para debugging y limpieza de datos
 * SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
 */
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DebugController {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenRecuperacionRepository tokenRepository;


}
