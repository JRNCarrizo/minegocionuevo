// Script para limpiar duplicaciones de stock por sector
// Ejecutar después de que el backend esté iniciado

const limpiarDuplicaciones = async () => {
  try {
    console.log('🔍 Iniciando limpieza de duplicaciones...');
    
    // Obtener el token del localStorage (si estás en el navegador)
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No se encontró token de autenticación');
      return;
    }
    
    // Obtener el ID de la empresa del localStorage
    const datosUsuario = JSON.parse(localStorage.getItem('datosUsuario') || '{}');
    const empresaId = datosUsuario.empresaId;
    
    if (!empresaId) {
      console.error('❌ No se encontró ID de empresa');
      return;
    }
    
    console.log('🔍 Empresa ID:', empresaId);
    
    // Ejecutar la limpieza
    const response = await fetch(`/api/empresas/${empresaId}/sectores/limpiar-duplicaciones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Limpieza completada:', data);
      alert('✅ Duplicaciones limpiadas exitosamente');
    } else {
      const errorData = await response.json();
      console.error('❌ Error en la limpieza:', errorData);
      alert('❌ Error al limpiar duplicaciones: ' + errorData.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error de conexión: ' + error.message);
  }
};

// Ejecutar la limpieza
limpiarDuplicaciones();
