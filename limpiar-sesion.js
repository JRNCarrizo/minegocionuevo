// Script para limpiar la sesión y permitir nuevo login
console.log('🧹 Limpiando sesión...');

// Limpiar localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('clienteToken');
localStorage.removeItem('clienteInfo');

console.log('✅ Sesión limpiada. Redirigiendo al login...');

// Redirigir al login
window.location.href = '/admin/login';
