# 🔧 Fix: Problema JWT Secret Variable

## 🚨 **Problema**
Error en `JwtUtils.getSigningKey()` línea 33 - Variable JWT no se lee correctamente.

## 🎯 **Causa Raíz**
Inconsistencia en el nombre de la variable:
- **Variable de entorno:** `MINE_NEGOCIO_APP_JWT_SECRET`
- **Código buscaba:** `minegocio.app.jwtSecret`

## ✅ **Solución Aplicada**

### **Cambio en JwtUtils.java**
```java
// ANTES
@Value("${minegocio.app.jwtSecret:miNegocioSecretKeyParaJWT2024}")

// DESPUÉS  
@Value("${MINE_NEGOCIO_APP_JWT_SECRET:miNegocioSecretKeyParaJWT2024}")
```

## 🚀 **Beneficios**
- ✅ Variable JWT se lee correctamente
- ✅ Login funcionará correctamente
- ✅ Tokens JWT se generarán sin errores

## 📝 **Próximos Pasos**
1. Deploy automático en Railway
2. Probar login nuevamente
3. Verificar que se genere el token JWT correctamente
