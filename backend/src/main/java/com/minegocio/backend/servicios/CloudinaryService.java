package com.minegocio.backend.servicios;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Servicio para gestionar imágenes en Cloudinary
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Sube una imagen a Cloudinary
     * @param archivo Archivo de imagen a subir
     * @param empresaId ID de la empresa para organizar las imágenes
     * @return URL pública de la imagen subida
     * @throws IOException Si hay error en la subida
     */
    public String subirImagen(MultipartFile archivo, Long empresaId) throws IOException {
        // Crear carpeta específica para la empresa
        String carpeta = "mi-negocio/empresa-" + empresaId + "/productos";
        
        // Configurar opciones de subida
        @SuppressWarnings("unchecked")
        Map<String, Object> opciones = ObjectUtils.asMap(
            "folder", carpeta,
            "use_filename", true,
            "unique_filename", true,
            "resource_type", "image",
            "quality", "auto",
            "fetch_format", "auto",
            "width", 500,
            "height", 500,
            "crop", "limit"
        );

        // Subir imagen
        @SuppressWarnings("unchecked")
        Map<String, Object> resultado = cloudinary.uploader().upload(archivo.getBytes(), opciones);
        
        // Retornar URL segura
        return (String) resultado.get("secure_url");
    }

    /**
     * Elimina una imagen de Cloudinary
     * @param urlImagen URL de la imagen a eliminar
     * @return true si se eliminó correctamente
     */
    public boolean eliminarImagen(String urlImagen) {
        try {
            // Extraer public_id de la URL
            String publicId = extraerPublicId(urlImagen);
            if (publicId != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> resultado = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                return "ok".equals(resultado.get("result"));
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrae el public_id de una URL de Cloudinary
     * @param url URL de Cloudinary
     * @return public_id extraído
     */
    private String extraerPublicId(String url) {
        try {
            if (url == null || !url.contains("cloudinary.com")) {
                return null;
            }
            
            // Buscar la parte después de /upload/
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                return null;
            }
            
            // Obtener la parte después de /upload/v[version]/
            String despuesUpload = url.substring(uploadIndex + 8);
            int versionIndex = despuesUpload.indexOf("/");
            if (versionIndex != -1) {
                despuesUpload = despuesUpload.substring(versionIndex + 1);
            }
            
            // Remover la extensión del archivo
            int puntoIndex = despuesUpload.lastIndexOf(".");
            if (puntoIndex != -1) {
                despuesUpload = despuesUpload.substring(0, puntoIndex);
            }
            
            return despuesUpload;
        } catch (Exception e) {
            return null;
        }
    }
}
