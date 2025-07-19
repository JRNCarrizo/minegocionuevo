# 🌐 Configuración de Subdominios en Render.com

## 🎯 **Opción 1: Dominio Personalizado (RECOMENDADO)**

### **Ventajas:**
- ✅ **Subdominios reales** funcionando
- ✅ **URLs profesionales** (ej: `mitienda.minegocio.com`)
- ✅ **SSL automático** para todos los subdominios
- ✅ **Mejor SEO** y confianza

### **Pasos:**

1. **Comprar dominio** (ej: `minegocio.com`)
   - GoDaddy, Namecheap, Google Domains, etc.
   - Costo: ~$10-15/año

2. **Configurar DNS en Render:**
   ```
   Tipo: CNAME
   Nombre: @
   Valor: tu-app.onrender.com
   ```

3. **Configurar subdominios wildcard:**
   ```
   Tipo: CNAME
   Nombre: *
   Valor: tu-app.onrender.com
   ```

4. **En Render Dashboard:**
   - Ir a tu servicio web
   - "Settings" → "Custom Domains"
   - Agregar: `minegocio.com`
   - Agregar: `*.minegocio.com`

### **Resultado:**
- **Dominio principal:** `minegocio.com`
- **Subdominios:** `empresa1.minegocio.com`, `tienda2.minegocio.com`, etc.

## 🚀 **Opción 2: Render Subdomain (Gratuito)**

### **Configuración:**
Tu aplicación estará en: `tu-app.onrender.com`

### **Para probar subdominios:**
1. **Crear empresas** con subdominios como:
   - `empresa1`
   - `mitienda`
   - `negocio123`

2. **Acceder vía URL directa:**
   - `https://tu-app.onrender.com/api/publico/empresa1/empresa`
   - `https://tu-app.onrender.com/api/publico/mitienda/empresa`

### **Limitación:**
- Los subdominios no serán URLs reales
- Pero la funcionalidad multi-tenant funcionará perfectamente

## 🔧 **Configuración del Backend**

### **Actualizar CORS en producción:**
```java
@CrossOrigin(origins = {
    "https://tu-app.onrender.com",
    "https://*.tu-app.onrender.com",
    "https://minegocio.com",
    "https://*.minegocio.com"
}, allowedHeaders = "*")
```

### **Variables de entorno en Render:**
```
SPRING_PROFILES_ACTIVE=prod
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-frontend.netlify.app
```

## 🌐 **Configuración del Frontend**

### **Actualizar detección de subdominios:**
```typescript
// En useSubdominio.ts
const dominiosPrincipales = [
  'localhost',
  '127.0.0.1',
  'tu-app.onrender.com', // Tu dominio de Render
  'minegocio.com', // Tu dominio personalizado
  'app.minegocio.com'
];
```

### **Variables de entorno:**
```
VITE_API_URL=https://tu-app.onrender.com/api
```

## 🧪 **Pruebas del Sistema Multi-Tenant**

### **1. Crear Empresas de Prueba:**
```sql
-- Empresa 1
INSERT INTO empresas (nombre, subdominio, email, activa) 
VALUES ('Tienda de Ropa', 'ropa', 'ropa@test.com', true);

-- Empresa 2  
INSERT INTO empresas (nombre, subdominio, email, activa)
VALUES ('Electrónicos XYZ', 'electronicos', 'elec@test.com', true);
```

### **2. Probar Acceso:**
```bash
# Verificar empresa 1
curl https://tu-app.onrender.com/api/publico/ropa/empresa

# Verificar empresa 2
curl https://tu-app.onrender.com/api/publico/electronicos/empresa
```

### **3. Probar Productos:**
```bash
# Productos de empresa 1
curl https://tu-app.onrender.com/api/publico/ropa/productos

# Productos de empresa 2
curl https://tu-app.onrender.com/api/publico/electronicos/productos
```

## 🎨 **Personalización por Empresa**

### **Cada empresa puede configurar:**
- **Logo personalizado**
- **Colores de marca:**
  - Color primario
  - Color secundario  
  - Color de acento
  - Color de fondo
  - Color de texto
- **Imagen de fondo**
- **Redes sociales**

### **Ejemplo de configuración:**
```json
{
  "nombre": "Mi Tienda",
  "subdominio": "mitienda",
  "colorPrimario": "#FF6B6B",
  "colorSecundario": "#4ECDC4",
  "colorAcento": "#45B7D1",
  "logoUrl": "https://storage.com/logo.png"
}
```

## 🔐 **Seguridad Multi-Tenant**

### **Aislamiento de datos:**
- ✅ **Cada empresa** ve solo sus datos
- ✅ **Productos aislados** por empresa
- ✅ **Clientes aislados** por empresa
- ✅ **Pedidos aislados** por empresa

### **Autenticación:**
- ✅ **JWT tokens** específicos por empresa
- ✅ **Roles separados** (admin/cliente)
- ✅ **Sesiones independientes**

## 📱 **Experiencia del Usuario**

### **Para Administradores:**
1. **Registro:** `minegocio.com/registro`
2. **Login:** `minegocio.com/admin/login`
3. **Dashboard:** `minegocio.com/admin/dashboard`
4. **Gestión:** Productos, clientes, pedidos

### **Para Clientes:**
1. **Acceso:** `mitienda.minegocio.com`
2. **Catálogo:** Productos de esa empresa
3. **Compra:** Carrito y checkout
4. **Historial:** Pedidos anteriores

## 🚀 **Deployment Checklist**

### **Backend (Render):**
- [ ] Configurar variables de entorno
- [ ] Actualizar CORS para dominios de producción
- [ ] Configurar base de datos PostgreSQL
- [ ] Ejecutar migraciones iniciales

### **Frontend (Netlify/Vercel):**
- [ ] Configurar variables de entorno
- [ ] Actualizar detección de subdominios
- [ ] Configurar dominio personalizado (opcional)

### **Dominio (Opcional):**
- [ ] Comprar dominio personalizado
- [ ] Configurar DNS en Render
- [ ] Configurar SSL automático

## 🎯 **Resultado Final**

Con esta configuración tendrás:
- ✅ **Sistema multi-tenant** completamente funcional
- ✅ **Subdominios reales** (con dominio personalizado)
- ✅ **Personalización** por empresa
- ✅ **Aislamiento total** de datos
- ✅ **Experiencia profesional** para usuarios

**¡Tu sistema funcionará exactamente como lo diseñaste!** 