# Configuración de Desarrollo - Verificación de Email

## 🚀 Configuración Rápida

### 1. Generar Contraseña de Aplicación en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la **verificación en 2 pasos** si no la tienes activada
3. Ve a **"Seguridad"** → **"Contraseñas de aplicación"**
4. Genera una nueva contraseña para **"MiNegocio"**
5. Copia la contraseña generada (ejemplo: `abcd efgh ijkl mnop`)

### 2. Configurar la Contraseña

Edita el archivo: `backend/src/main/resources/application-dev.properties`

Reemplaza esta línea:
```properties
spring.mail.password=TU_CONTRASEÑA_DE_APLICACION_AQUI
```

Con tu contraseña real:
```properties
spring.mail.password=abcd efgh ijkl mnop
```

### 3. Iniciar el Sistema

#### Opción A: Script Automático
```bash
# En Windows
iniciar-desarrollo.bat

# En Linux/Mac
./iniciar-desarrollo.sh
```

#### Opción B: Manual
```bash
# Terminal 1: Backend
cd backend
mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## 🔧 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Consola H2**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:testdb`
  - Usuario: `sa`
  - Contraseña: (dejar vacío)

## 🧪 Probar el Flujo de Verificación

### 1. Registro de Empresa
1. Ve a http://localhost:5173/registro
2. Completa el formulario de registro
3. Deberías ver: "Revise su email para verificar la cuenta"

### 2. Verificación por Email
1. Revisa tu email (jrncarrizo1987@gmail.com)
2. Busca el email de "Verifica tu cuenta - Negocio360"
3. Haz clic en el enlace de verificación
4. Deberías ver: "Email verificado exitosamente"

### 3. Login
1. Ve a http://localhost:5173/login
2. Inicia sesión con las credenciales registradas
3. Deberías acceder normalmente al panel de administración

## 🔍 Verificar en Base de Datos

1. Ve a http://localhost:8080/h2-console
2. Conecta con:
   - JDBC URL: `jdbc:h2:mem:testdb`
   - Usuario: `sa`
   - Contraseña: (vacío)
3. Ejecuta: `SELECT * FROM USUARIO;`
4. Verifica que el campo `EMAIL_VERIFICADO` sea `true`

## 🐛 Solución de Problemas

### Error: "Authentication failed"
- Verifica que la contraseña de aplicación esté correcta
- Asegúrate de que la verificación en 2 pasos esté activada

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Revisa que el puerto 587 no esté bloqueado

### No llega el email
- Revisa la carpeta de spam
- Verifica los logs del backend para errores de email

### Error en la verificación
- Verifica que el token no haya expirado (24 horas)
- Revisa los logs del backend para más detalles

## 📝 Logs Útiles

El sistema está configurado con logs detallados. Busca estos mensajes:

```
✅ Email de verificación enviado exitosamente
✅ Email verificado exitosamente
❌ Error al enviar email de verificación
```

## 🔄 Reenviar Email de Verificación

Si necesitas reenviar el email de verificación:

```bash
curl -X POST "http://localhost:8080/api/verificacion/reenviar-email" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=tu-email@ejemplo.com"
```

## 🎯 Características del Sistema

- ✅ **Base de datos H2** en memoria (se reinicia cada vez)
- ✅ **Email real** con Gmail
- ✅ **Verificación obligatoria** antes del login
- ✅ **Tokens de 24 horas** de validez
- ✅ **Reenvío de emails** de verificación
- ✅ **Logs detallados** para debugging
- ✅ **No interfiere** con el login de Google

## 🚨 Notas Importantes

1. **La base de datos H2 se reinicia** cada vez que inicias el backend
2. **Los emails son reales** y se envían a tu cuenta de Gmail
3. **El sistema de verificación es obligatorio** para nuevos registros
4. **El login de Google sigue funcionando** normalmente
5. **Los tokens expiran en 24 horas** por seguridad

---

¡Listo para probar! 🎉 