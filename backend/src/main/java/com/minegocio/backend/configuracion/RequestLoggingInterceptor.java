package com.minegocio.backend.configuracion;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

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
            
            // NO leer el body aquí para evitar consumir el stream
            // Solo loggear los headers y metadata
            System.out.println("Request headers:");
            java.util.Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);
                System.out.println("  " + headerName + ": " + headerValue);
            }
            
            System.out.println("=== FIN DEBUG REQUEST INTERCEPTOR ===");
        }
        return true;
    }
}
