package com.minegocio.backend.configuracion;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Cloudinary para la gestión de imágenes
 */
@Configuration
public class CloudinaryConfig {
    
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", "daoo9nvfc",
            "api_key", "444999631333727",
            "api_secret", "nAeLEgNoZgEg1BjgDSG4bceWBC0"
        ));
    }
}
