# 🚀 MiNegocio - Desarrollo Móvil

Este documento te explica cómo configurar tu proyecto para probarlo en tu celular.

## 📱 Opciones para probar en el celular

### Opción 1: Usando la IP de tu computadora (Recomendado)

#### Requisitos previos:
- Tu celular y computadora deben estar en la misma red WiFi
- El firewall de Windows debe permitir conexiones en los puertos 5173 y 8080

#### Pasos:

1. **Ejecuta el script automático:**
   ```bash
   # En Windows, haz doble clic en:
   start-mobile-simple.bat
   ```

2. **O ejecuta manualmente:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   mvn spring-boot:run

   # Terminal 2 - Frontend (espera 10 segundos)
   cd frontend
   npm run dev:mobile
   ```

3. **Obtén tu IP:**
   ```bash
   # En Windows
   ipconfig | findstr "IPv4"
   
   # En Mac/Linux
   ifconfig | grep "inet "
   ```

4. **Accede desde tu celular:**
   - Abre el navegador de tu celular
   - Ve a: `http://TU_IP:5173`
   - Ejemplo: `http://192.168.1.100:5173`

### Opción 2: Usando ngrok (Para acceso desde cualquier lugar)

#### Instalación de ngrok:
1. Ve a [ngrok.com](https://ngrok.com) y crea una cuenta gratuita
2. Descarga ngrok para Windows
3. Extrae el archivo y colócalo en una carpeta (ej: `C:\ngrok`)
4. Agrega la carpeta al PATH de Windows o usa la ruta completa

#### Configuración:
1. **Obtén tu authtoken:**
   - Ve a [dashboard.ngrok.com](https://dashboard.ngrok.com)
   - Copia tu authtoken

2. **Configura ngrok:**
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

3. **Inicia tu proyecto:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   mvn spring-boot:run

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Crea el túnel:**
   ```bash
   # Terminal 3 - ngrok para frontend
   ngrok http 5173

   # Terminal 4 - ngrok para backend (opcional)
   ngrok http 8080
   ```

5. **Accede desde tu celular:**
   - Usa la URL que te da ngrok (ej: `https://abc123.ngrok.io`)
   - Esta URL funciona desde cualquier lugar con internet

### Opción 3: Usando Expo Go (Solo para React Native)

Si en el futuro quieres convertir tu app a React Native:
1. Instala Expo Go en tu celular
2. Usa `expo start` en lugar de `npm run dev`
3. Escanea el código QR con Expo Go

## 🔧 Configuración del Firewall (Windows)

Si tienes problemas de conexión:

1. **Abre el Firewall de Windows:**
   - Busca "Firewall de Windows Defender" en el menú inicio

2. **Permite las aplicaciones:**
   - Ve a "Permitir una aplicación o característica"
   - Busca "Java" y "Node.js" y marca "Privado"

3. **O abre los puertos manualmente:**
   ```bash
   # Abrir puerto 5173 (Frontend)
   netsh advfirewall firewall add rule name="Frontend Dev" dir=in action=allow protocol=TCP localport=5173

   # Abrir puerto 8080 (Backend)
   netsh advfirewall firewall add rule name="Backend Dev" dir=in action=allow protocol=TCP localport=8080
   ```

## 📋 Troubleshooting

### Problema: No puedo acceder desde el celular
**Solución:**
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Desactiva temporalmente el firewall de Windows
3. Usa `ipconfig` para verificar la IP correcta
4. Prueba con `localhost` en la PC para verificar que funciona

### Problema: La app se ve mal en el celular
**Solución:**
1. Verifica que tengas el viewport meta tag en tu HTML
2. Usa las herramientas de desarrollador del navegador para simular móvil
3. Asegúrate de que tu CSS sea responsive

### Problema: Las imágenes no cargan
**Solución:**
1. Verifica que las rutas de las imágenes sean relativas
2. Asegúrate de que el backend esté sirviendo las imágenes correctamente
3. Usa rutas absolutas si es necesario

## 🎯 Consejos adicionales

1. **Herramientas de desarrollo:**
   - Usa Chrome DevTools para simular dispositivos móviles
   - Instala la extensión "Mobile/Responsive Web Design Tester"

2. **Optimización:**
   - Comprime las imágenes para cargas más rápidas
   - Usa lazy loading para componentes pesados
   - Considera usar Service Workers para cache

3. **Testing:**
   - Prueba en diferentes navegadores móviles (Chrome, Safari, Firefox)
   - Verifica en diferentes tamaños de pantalla
   - Prueba la funcionalidad offline

## 📞 Soporte

Si tienes problemas:
1. Verifica que todos los servicios estén corriendo
2. Revisa los logs de la consola del navegador
3. Verifica los logs del backend
4. Asegúrate de que las dependencias estén instaladas

¡Disfruta probando tu aplicación en el celular! 📱✨ 