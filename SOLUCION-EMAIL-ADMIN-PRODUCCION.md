# 📧 Solución: Emails de Verificación de Admin en Producción

## 🎯 Problema
Los usuarios administradores se registran correctamente y se guardan en la base de datos, pero **no reciben el email de verificación** en producción.

## 🔍 Diagnóstico

### ✅ PASO 1: Verificar Configuración de Email

Accede a este endpoint desde tu navegador o Postman:

```
https://tu-backend.railway.app/api/publico/email-debug/verificar-configuracion
```

**Esto te mostrará:**
- ✓ Si el `mailSender` está configurado
- ✓ Si las variables de entorno existen
- ✓ Si el email FROM está configurado
- ✓ El perfil activo (debe ser `railway` o `prod`)
- ✓ Si los emails se enviarán realmente

**Ejemplo de respuesta correcta:**
```json
{
  "fromEmail": "tu-email@gmail.com",
  "frontendUrl": "https://negocio360.org",
  "appNombre": "Negocio360",
  "mailSenderConfigurado": true,
  "variablesEntorno": {
    "MAIL_USERNAME_existe": true,
    "MAIL_PASSWORD_existe": true,
    "MAIL_FROM_existe": true,
    "MAIL_USERNAME_preview": "tue***",
    "MAIL_FROM_valor": "tu-email@gmail.com"
  },
  "perfilesActivos": "railway",
  "modoDesarrollo": false,
  "configuracionCompleta": true,
  "emailsSeEnviaran": true,
  "diagnostico": "Configuración completa - emails se enviarán correctamente"
}
```

### ✅ PASO 2: Enviar Email de Prueba

Usa este endpoint para enviar un email de prueba:

**Endpoint:** `POST https://tu-backend.railway.app/api/publico/email-debug/enviar-prueba`

**Body (JSON):**
```json
{
  "email": "tu-email-personal@gmail.com",
  "nombre": "Tu Nombre"
}
```

**Con curl:**
```bash
curl -X POST https://tu-backend.railway.app/api/publico/email-debug/enviar-prueba \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@gmail.com","nombre":"Test"}'
```

### ✅ PASO 3: Revisar Logs de Railway

1. Ve a tu proyecto en Railway
2. Selecciona el servicio backend
3. Haz clic en **"Deployments"** → **"View Logs"**
4. Busca estos mensajes:

**Al iniciar la aplicación:**
```
=== EMAIL SERVICE INIT ===
Frontend URL: https://negocio360.org
From Email: tu-email@gmail.com
JavaMailSender: Configurado
Modo desarrollo: NO
```

**Al registrar un admin:**
```
📧 Email destino: admin@example.com
👤 Usuario: Juan
🔑 Token: xxxxx-xxxx-xxxx

📧 Preparando email para envío real...
From Email: tu-email@gmail.com
To Email: admin@example.com
MailSender configurado: true
📤 Intentando enviar email...
✅ Email enviado exitosamente a: admin@example.com
```

**Si hay error, verás:**
```
❌ ERROR DETALLADO AL ENVIAR EMAIL:
   Tipo de error: ...
   Mensaje: ...
   Causa: ...
```

## 🛠️ Soluciones Según el Problema

### ❌ Problema 1: `mailSender` es NULL

**Causa:** Las variables de entorno de email no están configuradas correctamente.

**Solución:**
1. Ve a Railway → Tu Proyecto → Backend → **Variables**
2. Verifica que tengas estas 3 variables:
   ```
   MAIL_USERNAME = tu-email@gmail.com
   MAIL_PASSWORD = tu-contraseña-aplicacion-gmail
   MAIL_FROM = tu-email@gmail.com
   ```
3. **Redeploy** el backend después de agregar/modificar las variables

### ❌ Problema 2: Error "Authentication failed"

**Causa:** La contraseña de Gmail es incorrecta o no es una "Contraseña de aplicación".

**Solución - Generar Contraseña de Aplicación de Gmail:**

1. Ve a tu [Cuenta de Google](https://myaccount.google.com)
2. Selecciona **"Seguridad"** en el menú lateral
3. Activa la **"Verificación en dos pasos"** (si no está activa)
4. Busca **"Contraseñas de aplicaciones"**
5. Genera una nueva contraseña para "Otra (nombre personalizado)"
6. Pon nombre: `Negocio360 Railway`
7. **COPIA** la contraseña de 16 caracteres generada
8. En Railway, actualiza la variable `MAIL_PASSWORD` con esta contraseña
9. **Redeploy** el backend

### ❌ Problema 3: `fromEmail` es NULL o vacío

**Causa:** La variable `MAIL_FROM` no está configurada.

**Solución:**
1. En Railway → Variables, agrega:
   ```
   MAIL_FROM = tu-email@gmail.com
   ```
   (debe ser el mismo email que `MAIL_USERNAME`)
2. **Redeploy** el backend

### ❌ Problema 4: Modo Desarrollo Activo

**Causa:** El perfil activo es `dev` o `dev-persistent`.

**Solución:**
1. En Railway → Variables, verifica:
   ```
   SPRING_PROFILES_ACTIVE = railway
   ```
2. Si no existe, agrégala
3. **Redeploy** el backend

### ❌ Problema 5: Error "Connection timeout"

**Causa:** Railway puede estar bloqueando conexiones SMTP salientes.

**Solución:**
Railway normalmente permite el puerto 465 (SSL). Verifica que tu configuración use:
- Puerto: **465**
- SSL: **true**

Esto ya está configurado en `application-railway.properties`.

## ✅ Verificación Final

Una vez que hayas corregido los problemas:

1. **Verifica la configuración:**
   ```
   GET https://tu-backend.railway.app/api/publico/email-debug/verificar-configuracion
   ```
   Debe decir: `"emailsSeEnviaran": true`

2. **Envía un email de prueba:**
   ```bash
   curl -X POST https://tu-backend.railway.app/api/publico/email-debug/enviar-prueba \
     -H "Content-Type: application/json" \
     -d '{"email":"tu-email@gmail.com","nombre":"Test"}'
   ```

3. **Revisa tu bandeja de entrada** (y spam)

4. **Registra un nuevo admin de prueba** y verifica que reciba el email

## 📋 Checklist Rápido

- [ ] Variables `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` configuradas en Railway
- [ ] `MAIL_PASSWORD` es una **contraseña de aplicación** de Gmail (16 caracteres)
- [ ] Variable `SPRING_PROFILES_ACTIVE=railway` configurada
- [ ] Backend redeployado después de cambiar variables
- [ ] Endpoint `/api/publico/email-debug/verificar-configuracion` retorna OK
- [ ] Email de prueba se recibe correctamente
- [ ] Registro de admin envía email de verificación

## 🆘 Si Nada Funciona

1. **Revisa los logs completos en Railway** buscando errores específicos
2. **Prueba con otro servicio de email** como SendGrid (100 emails gratis/día)
3. **Contacta con soporte de Railway** para verificar si hay restricciones en tu cuenta

## 🔗 Enlaces Útiles

- [Contraseñas de aplicación de Google](https://myaccount.google.com/apppasswords)
- [Railway Docs - Environment Variables](https://docs.railway.app/develop/variables)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## 📝 Notas Adicionales

### Alternativas a Gmail

Si Gmail no funciona, puedes usar **SendGrid** (gratuito):

1. Crea cuenta en [SendGrid](https://sendgrid.com/)
2. Genera una API Key
3. En Railway, cambia las variables:
   ```
   MAIL_HOST = smtp.sendgrid.net
   MAIL_PORT = 587
   MAIL_USERNAME = apikey
   MAIL_PASSWORD = tu-sendgrid-api-key
   MAIL_FROM = tu-email-verificado@tudominio.com
   ```

### Formato de MAIL_PASSWORD

- ✅ Correcto: `abcd efgh ijkl mnop` (16 caracteres, espacios entre grupos)
- ❌ Incorrecto: Tu contraseña normal de Gmail
- ❌ Incorrecto: Una contraseña con caracteres especiales inventada

La contraseña **DEBE** ser generada desde la configuración de Google.

