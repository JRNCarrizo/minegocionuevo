const fs = require('fs');
const path = require('path');

const filePath = 'frontend/src/pages/admin/GestionProductos.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Buscando ocurrencias de toFixed...');

// Buscar todas las ocurrencias
const matches = content.match(/\$\{producto\.precio\.toFixed\(2\)\}/g);
console.log('Ocurrencias encontradas:', matches ? matches.length : 0);

// Reemplazar todas las ocurrencias de producto.precio.toFixed(2) sin validación
const newContent = content.replace(/\$\{producto\.precio\.toFixed\(2\)\}/g, '{producto.precio ? `$${producto.precio.toFixed(2)}` : \'No especificado\'}');

// Verificar si hubo cambios
if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Archivo corregido exitosamente');
} else {
    console.log('No se encontraron ocurrencias para corregir');
}
