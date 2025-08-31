package com.minegocio.backend.configuracion;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.BufferedReader;
import java.io.IOException;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("POST".equals(request.getMethod()) && request.getRequestURI().contains("/api/remitos-ingreso")) {
            System.out.println("=== DEBUG REQUEST INTERCEPTOR ===");
            System.out.println("URL: " + request.getRequestURI());
            System.out.println("Method: " + request.getMethod());
            System.out.println("Content-Type: " + request.getContentType());
            System.out.println("Content-Length: " + request.getContentLength());
            
            // Leer el body de la request
            try {
                BufferedReader reader = request.getReader();
                StringBuilder body = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
                System.out.println("Request Body: " + body.toString());
            } catch (IOException e) {
                System.err.println("Error leyendo request body: " + e.getMessage());
            }
            
            System.out.println("=== FIN DEBUG REQUEST INTERCEPTOR ===");
        }
        return true;
    }
}
