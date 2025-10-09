import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { API_CONFIG } from '../../config/api';

interface Producto {
  id: number;
  nombre: string;
  codigoBarras?: string;
  codigoPersonalizado?: string;
  categoria?: string;
  marca?: string;
  stock: number;
  precio?: number;
}

interface ConteoIndividual {
  cantidad: number;
  formula: string;
  fecha: string;
}

interface DetalleConteo {
  id: number;
  producto: Producto;
  stockSistema: number;
  cantidadConteo1?: number;
  cantidadConteo2?: number;
  cantidadFinal?: number;
  diferenciaSistema?: number;
  diferenciaEntreConteos?: number;
  formulaCalculo1?: string;
  formulaCalculo2?: string;
  estado: string;
  conteosUsuario1?: ConteoIndividual[];
  conteosUsuario2?: ConteoIndividual[];
}

interface ConteoInfo {
  id: number;
  inventarioId?: number;
  sector?: {
    id: number;
    nombre: string;
  };
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  // Usuarios asignados (formato del DTO)
  usuario1Id?: number;
  usuario1Nombre?: string;
  usuario2Id?: number;
  usuario2Nombre?: string;
  // Estados por usuario
  estadoUsuario1?: string;
  estadoUsuario2?: string;
}

export default function ReconteoSector() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [conteoInfo, setConteoInfo] = useState<ConteoInfo | null>(null);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reconteos, setReconteos] = useState<{[key: number]: string}>({});
  const [reconteosSolidificados, setReconteosSolidificados] = useState<{[key: number]: string}>({});
  const [productoActual, setProductoActual] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarBotonFinalizar, setMostrarBotonFinalizar] = useState(false);
  const [sectorCompletado, setSectorCompletado] = useState(false);

  // ✅ NUEVOS ESTADOS PARA LA INTERFAZ MEJORADA
  const [formulasMarcadas, setFormulasMarcadas] = useState<{[productoId: number]: Set<string>}>({});
  const [camposReconteo, setCamposReconteo] = useState<{[productoId: number]: string}>({});
  const [resultadosReconteo, setResultadosReconteo] = useState<{[productoId: number]: number}>({});

  useEffect(() => {
    if (id && datosUsuario?.empresaId) {
      cargarDatos();
    }
  }, [id, datosUsuario]);

  // Establecer el primer producto como activo cuando se cargan los datos
  useEffect(() => {
    console.log('🔍 useEffect detallesConteo:', {
      detallesConteoLength: detallesConteo.length,
      productoActual,
      primerProducto: detallesConteo[0]?.producto?.id
    });
    
    // Ya no necesitamos establecer un producto activo específico
    // Todos los productos están habilitados para reconteo
  }, [detallesConteo, productoActual, mostrarBotonFinalizar]);

  // Mostrar botón de finalizar cuando haya al menos un reconteo completado
  useEffect(() => {
    const tieneReconteosCompletados = Object.keys(reconteosSolidificados).length > 0;
    // ✅ CORRECCIÓN: Solo mostrar botón si hay reconteos completados
    // Si no hay reconteos, NO mostrar el mensaje de "completado"
    setMostrarBotonFinalizar(tieneReconteosCompletados);
    console.log('🔍 [DEBUG] useEffect reconteosSolidificados:', {
      reconteosSolidificados,
      keys: Object.keys(reconteosSolidificados),
      length: Object.keys(reconteosSolidificados).length,
      tieneReconteosCompletados,
      mostrarBotonFinalizar: tieneReconteosCompletados
    });
  }, [reconteosSolidificados]);

  // ✅ ELIMINADO: Ya no necesitamos este useEffect porque actualizamos directamente en toggleFormula

  // ✅ NUEVO: Recalcular resultados cuando cambien los campos de reconteo
  useEffect(() => {
    console.log('🔍 DEBUG useEffect camposReconteo:', camposReconteo);
    Object.keys(camposReconteo).forEach(productoId => {
      const campo = camposReconteo[parseInt(productoId)];
      if (campo) {
        const resultado = calcularFormula(campo);
        console.log('🔍 DEBUG calculando resultado:', {
          productoId,
          campo,
          resultado
        });
        setResultadosReconteo(prev => ({ ...prev, [parseInt(productoId)]: resultado }));
      }
    });
  }, [camposReconteo]);

  // Función para calcular el resultado de una fórmula
  const calcularFormula = (formula: string): number => {
    try {
      // Si contiene identificadores únicos [formula=valor], extraer solo los valores
      if (formula.includes('[') && formula.includes('=')) {
        const valores = formula.match(/\[[^\]]+=(\d+)\]/g);
        if (valores) {
          return valores.reduce((total, match) => {
            const valor = parseInt(match.match(/\[[^\]]+=(\d+)\]/)?.[1] || '0');
            return total + valor;
          }, 0);
        }
      }
      
      // Reemplazar caracteres problemáticos y evaluar
      const formulaLimpia = formula.replace(/[^0-9+\-*/().]/g, '');
      return eval(formulaLimpia) || 0;
    } catch (error) {
      console.error('Error calculando fórmula:', formula, error);
      return 0;
    }
  };

  // ✅ NUEVAS FUNCIONES PARA LA INTERFAZ MEJORADA
  
  // ✅ NUEVA FUNCIÓN: Descomponer fórmulas solo por sumas (ej: "2*5+3*4" → ["2*5", "3*4"])
  const descomponerFormulaUnificada = (formula: string): string[] => {
    try {
      // Solo descomponer por el operador de suma (+)
      // Mantener multiplicaciones (*), divisiones (/) y restas (-) intactas
      if (formula.includes('+')) {
        // Dividir solo por el operador +
        return formula.split(/\s*\+\s*/).filter(f => f.trim() !== '');
      }
      // Si no contiene sumas, devolver como está (puede tener *, /, - pero se mantienen juntos)
      return [formula];
    } catch (error) {
      console.error('Error descomponiendo fórmula:', formula, error);
      return [formula];
    }
  };
  
  // Función para marcar/desmarcar una fórmula
  const toggleFormula = (productoId: number, formula: string, usuarioId: number, index: number) => {
    const clave = `${productoId}_${usuarioId}_${index}_${formula}`;
    
    // ✅ CORREGIDO: Verificar el estado actual ANTES de cambiarlo
    const marcadasActuales = formulasMarcadas[productoId] || new Set();
    const estaMarcadaActual = marcadasActuales.has(clave);
    
    console.log('🔍 DEBUG toggleFormula ANTES:', {
      clave,
      estaMarcadaActual,
      marcadasActuales: Array.from(marcadasActuales)
    });
    
    setFormulasMarcadas(prev => {
      const nuevasMarcadas = { ...prev };
      if (!nuevasMarcadas[productoId]) {
        nuevasMarcadas[productoId] = new Set();
      }
      
      const marcadas = new Set(nuevasMarcadas[productoId]);
      if (marcadas.has(clave)) {
        marcadas.delete(clave);
      } else {
        marcadas.add(clave);
      }
      
      nuevasMarcadas[productoId] = marcadas;
      return nuevasMarcadas;
    });
    
    // ✅ CORREGIDO: Usar el estado actual para determinar la acción
    actualizarCampoReconteoIndividualConEstado(productoId, formula, usuarioId, index, !estaMarcadaActual);
  };

  // ✅ NUEVA FUNCIÓN: Actualizar campo con fórmula individual usando estado explícito
  const actualizarCampoReconteoIndividualConEstado = (productoId: number, formula: string, usuarioId: number, index: number, debeAgregar: boolean) => {
    const valorFormula = calcularFormula(formula);
    const identificadorUnico = `[${formula}=${valorFormula}]`; // Para tracking interno
    const valorParaCampo = formula; // ✅ MOSTRAR LA FÓRMULA COMPLETA (ej: "2*5") en lugar del resultado
    
    console.log('🔍 DEBUG actualizarCampoReconteoIndividualConEstado:', {
      productoId,
      formula,
      usuarioId,
      index,
      valorFormula,
      identificadorUnico,
      valorParaCampo,
      debeAgregar
    });
    
    setCamposReconteo(prev => {
      const campoActual = prev[productoId] || '';
      
      if (debeAgregar) {
        // Agregar la fórmula completa al campo (ej: "2*5" en lugar de "10")
        const nuevoCampo = campoActual ? `${campoActual} + ${valorParaCampo}` : valorParaCampo;
        
        console.log('🔍 DEBUG agregando:', {
          campoActual,
          valorFormula,
          valorParaCampo,
          nuevoCampo
        });
        
        return { ...prev, [productoId]: nuevoCampo };
      } else {
        // Quitar la fórmula del campo (escapar caracteres especiales de regex)
        const formulaEscapada = valorParaCampo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nuevoCampo = campoActual
          .replace(new RegExp(`\\+\\s*${formulaEscapada}`, 'g'), '') // Quitar " + formula"
          .replace(new RegExp(`${formulaEscapada}\\s*\\+`, 'g'), '') // Quitar "formula + "
          .replace(new RegExp(`^${formulaEscapada}$`, 'g'), '') // Quitar solo "formula"
          .replace(/\s*\+\s*$/, '') // Quitar "+" al final
          .replace(/^\s*\+\s*/, '') // Quitar "+" al inicio
          .trim();
        
        console.log('🔍 DEBUG quitando:', {
          campoActual,
          valorFormula,
          valorParaCampo,
          nuevoCampo
        });
        
        return { ...prev, [productoId]: nuevoCampo };
      }
    });
  };

  // Función para actualizar el campo de reconteo basado en fórmulas marcadas
  const actualizarCampoReconteo = (productoId: number) => {
    const marcadas = formulasMarcadas[productoId] || new Set();
    const formulasArray = Array.from(marcadas);
    
    if (formulasArray.length === 0) {
      setCamposReconteo(prev => ({ ...prev, [productoId]: '' }));
      setResultadosReconteo(prev => ({ ...prev, [productoId]: 0 }));
      return;
    }
    
    // ✅ CAMBIO: Extraer las fórmulas completas (no solo los valores calculados)
    const formulas = formulasArray.map(clave => {
      const partes = clave.split('_');
      return partes[2]; // La fórmula está en la tercera parte (ej: "2*5", "10", etc.)
    });
    
    // Mostrar las fórmulas unidas con +
    const campoTexto = formulas.join(' + ');
    
    // Calcular el resultado total sumando los valores de cada fórmula
    const resultado = formulas.reduce((total, formula) => {
      return total + calcularFormula(formula);
    }, 0);
    
    setCamposReconteo(prev => ({ ...prev, [productoId]: campoTexto }));
    setResultadosReconteo(prev => ({ ...prev, [productoId]: resultado }));
  };

  // Función para editar manualmente el campo de reconteo
  const editarCampoReconteo = (productoId: number, nuevoTexto: string) => {
    setCamposReconteo(prev => ({ ...prev, [productoId]: nuevoTexto }));
    
    // Calcular resultado del nuevo texto
    const resultado = calcularFormula(nuevoTexto);
    setResultadosReconteo(prev => ({ ...prev, [productoId]: resultado }));
  };

  // Función para verificar si una fórmula está marcada
  const isFormulaMarcada = (productoId: number, formula: string, usuarioId: number, index: number): boolean => {
    const clave = `${productoId}_${usuarioId}_${index}_${formula}`;
    return formulasMarcadas[productoId]?.has(clave) || false;
  };

  // ✅ NUEVA FUNCIÓN: Solidificar reconteo usando el campo dinámico
  const solidificarReconteo = (productoId: number) => {
    const campoActual = camposReconteo[productoId] || '';
    const resultado = resultadosReconteo[productoId] || 0;
    
    console.log('🔍 solidificarReconteo llamado:', { productoId, campoActual, resultado });
    
    if (!campoActual.trim()) {
      console.log('⚠️ Campo vacío, no se solidifica');
      toast.error('Debe ingresar un valor para el reconteo');
      return;
    }

    // Solidificar el valor (quedará visible en el campo)
    setReconteosSolidificados(prev => {
      const nuevo = { ...prev, [productoId]: campoActual };
      console.log('✅ Reconteo solidificado:', nuevo);
      console.log('🔍 [DEBUG] Total reconteos solidificados:', Object.keys(nuevo).length);
      console.log('🔍 [DEBUG] mostrarBotonFinalizar será:', Object.keys(nuevo).length > 0);
      return nuevo;
    });
    
    console.log('✅ Reconteo completado para producto:', productoId);
    toast.success(`Reconteo completado: ${campoActual} = ${resultado}`);
  };

  // Función para guardar todos los reconteos solidificados
  const guardarTodosLosReconteos = async () => {
    console.log('🔍 [DEBUG] guardarTodosLosReconteos INICIADO');
    console.log('🔍 [DEBUG] datosUsuario?.id:', datosUsuario?.id);
    console.log('🔍 [DEBUG] guardando:', guardando);
    
    if (!datosUsuario?.id || guardando) {
      console.log('🔍 [DEBUG] SALIENDO - datosUsuario?.id:', datosUsuario?.id, 'guardando:', guardando);
      return;
    }

    console.log('🔍 [DEBUG] Iniciando proceso de guardado...');
    setGuardando(true);

    try {
      const token = localStorage.getItem('token');
      console.log('🔍 [DEBUG] Token obtenido:', token ? 'presente' : 'ausente');
      
      const reconteosParaGuardar = Object.entries(reconteosSolidificados)
        .filter(([productoId, formula]) => {
          const id = parseInt(productoId);
          const isValidId = !isNaN(id) && id > 0;
          const hasFormula = formula.trim();
          
          if (!isValidId) {
            console.error('❌ ProductoId inválido:', productoId, 'parseado como:', id);
          }
          if (!hasFormula) {
            console.log('⚠️ Fórmula vacía para producto:', productoId);
          }
          
          return isValidId && hasFormula;
        })
        .map(([productoId, formula]) => {
          const id = parseInt(productoId);
          const cantidad = calcularFormula(formula);
          
          console.log('🔍 Preparando reconteo:', {
            productoId: id,
            formula,
            cantidad,
            isValidId: !isNaN(id) && id > 0
          });
          
          return {
            productoId: id,
            cantidad: cantidad,
            formulaCalculo: formula
          };
        });

      console.log('🔍 [DEBUG] Reconteos preparados para guardar:', {
        reconteosSolidificados,
        reconteosParaGuardar,
        usuarioId: datosUsuario.id,
        empresaId: datosUsuario.empresaId,
        conteoSectorId: id
      });

      if (reconteosParaGuardar.length === 0) {
        toast('No hay reconteos para guardar');
        return;
      }

      // Guardar cada reconteo
      for (const reconteo of reconteosParaGuardar) {
        console.log('🔍 Enviando reconteo:', {
          url: `/api/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo?.inventarioId}/conteos-sector/${id}/agregar-producto-reconteo`,
          reconteo: reconteo,
          token: token ? 'presente' : 'ausente'
        });

        const baseUrl = API_CONFIG.getBaseUrl();
        const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo?.inventarioId}/conteos-sector/${id}/agregar-producto-reconteo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reconteo)
        });

        console.log('🔍 Respuesta del servidor:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error(`Error guardando reconteo para producto ${reconteo.productoId}: ${response.status} ${errorText}`);
        }
      }

      // Finalizar el reconteo llamando al endpoint específico
      console.log('🔍 Finalizando reconteo...');
      const baseUrl = API_CONFIG.getBaseUrl();
      const finalizarResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo?.inventarioId}/conteos-sector/${id}/finalizar-reconteo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuarioId: datosUsuario.id })
      });

      if (!finalizarResponse.ok) {
        const errorText = await finalizarResponse.text();
        console.error('❌ Error finalizando reconteo:', errorText);
        throw new Error(`Error finalizando reconteo: ${finalizarResponse.status} ${errorText}`);
      }

      const finalizarData = await finalizarResponse.json();
      console.log('✅ Reconteo finalizado:', finalizarData);

      // Limpiar reconteos solidificados
      setReconteosSolidificados({});
      
      // ✅ FLUJO SIMPLIFICADO: Manejar estados del reconteo
      console.log('🔄 [RECONTEO] Estado recibido:', finalizarData.estado);
      console.log('🔄 [RECONTEO] Observaciones:', finalizarData.observaciones);
      
      switch (finalizarData.estado) {
        case 'ESPERANDO_SEGUNDO_RECONTEO':
          // Primer usuario finalizó, puede salir
          setMostrarBotonFinalizar(false);
          toast.success(`${reconteosParaGuardar.length} reconteos guardados. Esperando que el segundo usuario complete su reconteo.`);
          // Navegar de vuelta al inventario completo
          setTimeout(() => {
            navigate('/admin/inventario-completo');
          }, 2000);
          break;
          
        case 'COMPARANDO_RECONTEO':
          // Segundo usuario finalizó, sistema comparando
          setMostrarBotonFinalizar(false);
          toast.success(`${reconteosParaGuardar.length} reconteos guardados. Comparando reconteos...`);
          // Navegar de vuelta al inventario completo
          setTimeout(() => {
            navigate('/admin/inventario-completo');
          }, 2000);
          break;
          
        case 'COMPLETADO':
          // Reconteo completado exitosamente
          setMostrarBotonFinalizar(false);
          setSectorCompletado(true);
          toast.success('¡Reconteo completado! El sector ya no tiene diferencias.');
          // Navegar de vuelta al inventario completo
          setTimeout(() => {
            navigate('/admin/inventario-completo');
          }, 2000);
          break;
          
        case 'CON_DIFERENCIAS':
          // Hay diferencias, volver a reconteo
          setMostrarBotonFinalizar(false);
          toast('Reconteo guardado. Aún hay diferencias entre usuarios. Ambos usuarios deben hacer el reconteo para resolver las diferencias.');
          // Navegar de vuelta al inventario completo
          setTimeout(() => {
            navigate('/admin/inventario-completo');
          }, 2000);
          break;
          
        default:
          // Estado inesperado
          setMostrarBotonFinalizar(false);
          toast.success(`${reconteosParaGuardar.length} reconteos guardados. Estado: ${finalizarData.estado}`);
          // Navegar de vuelta al inventario completo
          setTimeout(() => {
            navigate('/admin/inventario-completo');
          }, 2000);
          break;
      }
    } catch (error) {
      console.error('Error guardando reconteos:', error);
      toast.error('Error al guardar los reconteos');
      // No navegar en caso de error, mantener al usuario en la página
    } finally {
      setGuardando(false);
    }
  };

  // Función para manejar Enter en el input
  const manejarEnter = (productoId: number) => {
    console.log('🔍 manejarEnter llamado:', { productoId });
    solidificarReconteo(productoId);
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      console.log('🔍 Debugging datos:', {
        id: id,
        empresaId: datosUsuario?.empresaId,
        datosUsuario: datosUsuario
      });
      
      if (!datosUsuario?.empresaId || !id) {
        console.error('❌ Datos faltantes:', {
          empresaId: datosUsuario?.empresaId,
          id: id,
          datosUsuario: datosUsuario
        });
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('🔍 Cargando datos del reconteo:', id);

      // Primero obtener el inventario activo
      const baseUrl = API_CONFIG.getBaseUrl();
      const inventarioResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
        headers
      });

      if (!inventarioResponse.ok) {
        console.error('❌ Error cargando inventario activo:', inventarioResponse.status);
        toast.error('No hay inventario activo');
        return;
      }

      const inventarioData = await inventarioResponse.json();
      console.log('✅ Inventario activo cargado:', inventarioData);

      // Luego obtener los conteos de sector para encontrar el conteo específico
      const conteosResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventarioData.id}/conteos-sector`, {
        headers
      });

      if (!conteosResponse.ok) {
        console.error('❌ Error cargando conteos de sector:', conteosResponse.status);
        toast.error('Error al cargar los conteos de sector');
        return;
      }

      const conteosData = await conteosResponse.json();
      console.log('✅ Conteos de sector cargados:', conteosData);

      // Buscar el conteo específico por ID
      const conteoEspecifico = conteosData.find((conteo: any) => conteo.id === parseInt(id));
      
      if (!conteoEspecifico) {
        console.error('❌ Conteo de sector no encontrado:', id);
        toast.error('Conteo de sector no encontrado');
        return;
      }

      console.log('✅ Conteo específico encontrado:', conteoEspecifico);
      console.log('🔍 Usuarios asignados:', {
        usuario1Id: conteoEspecifico.usuario1Id,
        usuario1Nombre: conteoEspecifico.usuario1Nombre,
        usuario2Id: conteoEspecifico.usuario2Id,
        usuario2Nombre: conteoEspecifico.usuario2Nombre
      });
      
      // Agregar el inventarioId al conteoInfo
      const conteoInfoCompleto = {
        ...conteoEspecifico,
        inventarioId: inventarioData.id
      };
      
      console.log('🔍 ConteoInfo completo con inventarioId:', conteoInfoCompleto);
      setConteoInfo(conteoInfoCompleto);

      // ✅ NUEVA ARQUITECTURA: Cargar datos de referencia para reconteo
      console.log('🔍 [NUEVA ARQUITECTURA] Cargando datos de referencia para reconteo ID:', id);
      console.log('🔍 [NUEVA ARQUITECTURA] URL de datos de referencia:', `${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/datos-referencia-reconteo`);
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/datos-referencia-reconteo`, {
        headers
      });

      console.log('🔍 Respuesta de detalles reconteo:', {
        status: detallesResponse.status,
        ok: detallesResponse.ok,
        url: detallesResponse.url
      });

      if (detallesResponse.ok) {
        const responseData = await detallesResponse.json();
        console.log('✅ [RECONTEO] Datos de referencia cargados:', responseData);
        
        // El endpoint devuelve un array directo de productos
        const datosReferencia = Array.isArray(responseData) ? responseData : (responseData.datosReferencia || []);
        console.log('✅ [RECONTEO] Datos de referencia extraídos:', datosReferencia.length, 'productos');
        
        if (Array.isArray(datosReferencia) && datosReferencia.length > 0) {
          console.log('🔍 [RECONTEO] Primer producto de referencia:', datosReferencia[0]);
          
          // Procesar datos de referencia
          const productosParaReconteo = datosReferencia.map((productoRef: any) => {
            // Crear objeto producto a partir de los datos de referencia
            const productoObj = {
              id: productoRef.productoId,
              nombre: productoRef.nombreProducto || 'Producto sin nombre',
              codigoPersonalizado: productoRef.codigoProducto || 'N/A',
              stock: productoRef.stockSistema || 0
            };
            
            return {
              id: productoRef.productoId, // Usar productoId como ID único
              producto: productoObj,
              stockSistema: productoRef.stockSistema || 0,
              // Usar datos del conteo original como referencia
              cantidadConteo1: productoRef.cantidadConteo1Referencia || 0,
              cantidadConteo2: productoRef.cantidadConteo2Referencia || 0,
              formulaCalculo1: productoRef.formulaCalculo1Referencia || 'Sin fórmula',
              formulaCalculo2: productoRef.formulaCalculo2Referencia || 'Sin fórmula',
              diferenciaSistema: productoRef.diferenciaSistema || 0,
              diferenciaEntreConteos: productoRef.diferenciaEntreConteos || 0, // Diferencia del conteo original
              estado: productoRef.estado || 'DIFERENCIA',
              conteosUsuario1: productoRef.conteosUsuario1 || [],
              conteosUsuario2: productoRef.conteosUsuario2 || []
              // ✅ ELIMINADO: todosLosDetallesDelProducto ya no se usa
            };
          });
          
          console.log('✅ [RECONTEO] Productos procesados para reconteo:', productosParaReconteo.length);
          console.log('🔍 [RECONTEO] Ejemplo de producto procesado:', productosParaReconteo[0]);
          setDetallesConteo(productosParaReconteo);
        } else {
          console.log('⚠️ [RECONTEO] No se encontraron productos para reconteo');
          toast('No hay productos con diferencias para recontear');
          setDetallesConteo([]);
        }
      } else {
        console.error('❌ [RECONTEO] Error cargando datos de referencia:', detallesResponse.status);
        const errorText = await detallesResponse.text();
        console.error('❌ [RECONTEO] Error details:', errorText);
        toast.error('Error al cargar los datos del reconteo');
        setDetallesConteo([]);
      }
    } catch (error) {
      console.error('Error cargando datos de reconteo:', error);
      toast.error('Error al cargar los datos del reconteo');
    } finally {
      setCargando(false);
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'ESPERANDO_VERIFICACION':
        return 'Esperando Segundo Usuario';
      case 'CON_DIFERENCIAS':
        return 'Requiere Reconteo';
      case 'ESPERANDO_SEGUNDO_RECONTEO':
        return 'Esperando Segundo Reconteo';
      case 'COMPARANDO_RECONTEO':
        return 'Comparando Reconteos';
      case 'COMPLETADO':
        return 'Completado';
      default:
        return estado;
    }
  };

  // Mostrar carga si no hay datos del usuario o si está cargando
  if (cargando || !datosUsuario) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {!datosUsuario ? 'Cargando datos del usuario...' : 'Cargando reconteo...'}
          </p>
        </div>
      </div>
    );
  }

  if (!conteoInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>Error al cargar el reconteo</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No se pudo cargar la información del reconteo.</p>
          <button
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Volver al Inventario Completo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NavbarAdmin />
      
      <div style={{
        padding: isMobile ? '0.5rem' : '2rem',
        paddingTop: isMobile ? '140px' : '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '2rem',
          marginBottom: isMobile ? '1rem' : '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          {/* Estado flotante arriba derecha (móvil) */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#dc2626',
              color: 'white',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              ⚠️ Diferencias
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: isMobile ? '0.75rem' : '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ flex: 1, paddingRight: isMobile ? '3.5rem' : '0' }}>
              <h1 style={{
                fontSize: isMobile ? '1.1rem' : '2rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 0.25rem 0'
              }}>
                🔍 Reconteo - {conteoInfo.sector?.nombre || 'Sector'}
              </h1>
              {!isMobile && (
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>
                  {conteoInfo.estado === 'ESPERANDO_VERIFICACION' 
                    ? 'Esperando que el segundo usuario complete su reconteo'
                    : 'Ambos usuarios deben hacer el reconteo para resolver las diferencias'
                  }
                </p>
              )}
            </div>
            
            {!isMobile && (
              <button
                onClick={() => navigate('/admin/inventario-completo')}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ← Volver
              </button>
            )}
          </div>

          {/* Información del reconteo */}
          {isMobile ? (
            /* Vista móvil compacta */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Productos con diferencias */}
              <div style={{
                background: '#fef2f2',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.15rem' }}>Productos con Diferencias</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                  {detallesConteo.length}
                </div>
              </div>

              {/* Usuarios horizontales */}
              <div style={{
                background: '#f3f4f6',
                borderRadius: '0.5rem',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>👥</div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  flex: 1,
                  justifyContent: 'flex-end',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  <div style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.375rem'
                  }}>
                    {conteoInfo.usuario1Nombre?.split(' ')[0] || 'U1'}
                  </div>
                  <div style={{ color: '#94a3b8' }}>vs</div>
                  <div style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.375rem'
                  }}>
                    {conteoInfo.usuario2Nombre?.split(' ')[0] || 'U2'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista desktop - Original */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 0.5rem 0'
                }}>
                  Estado
                </h3>
                <p style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  margin: 0
                }}>
                  {obtenerTextoEstado(conteoInfo.estado)}
                </p>
              </div>

              <div style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 0.5rem 0'
                }}>
                  Usuarios Asignados
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Usuario 1:</strong> {conteoInfo.usuario1Nombre || 'No asignado'}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Usuario 2:</strong> {conteoInfo.usuario2Nombre || 'No asignado'}
                  </p>
                </div>
              </div>

              <div style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 0.5rem 0'
                }}>
                  Productos con Diferencias
                </h3>
                <p style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  margin: 0
                }}>
                  {detallesConteo.length}
                </p>
              </div>
            </div>
          )}


        </div>

        
        {detallesConteo.length > 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Productos con Diferencias
            </h2>
            
            {/* Información del proceso de reconteo */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>ℹ️</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e' }}>
                  Proceso de Reconteo
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {conteoInfo.estado === 'ESPERANDO_VERIFICACION' 
                  ? 'El primer usuario ya completó su reconteo. Ahora el segundo usuario debe hacer su reconteo para comparar y resolver las diferencias.'
                  : 'Ambos usuarios deben hacer el reconteo de los productos con diferencias. El sistema comparará los resultados para determinar las cantidades finales.'
                }
              </p>
            </div>
            
            {/* Indicador de progreso */}
            <div style={{
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Progreso del Reconteo
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {Object.keys(reconteosSolidificados).length} / {detallesConteo.length}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '0.5rem',
                background: '#e5e7eb',
                borderRadius: '0.25rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(Object.keys(reconteosSolidificados).length / detallesConteo.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              {productoActual && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  textAlign: 'center'
                }}>
                  Producto actual: {detallesConteo.find(d => d.producto.id === productoActual)?.producto.nombre}
                </div>
              )}
              
              {/* Botón de debug temporal */}
              <button
                onClick={() => {
                  console.log('🔍 DEBUG ESTADOS:', {
                    productoActual,
                    reconteosSolidificados,
                    reconteos,
                    detallesConteo: detallesConteo.map(d => ({ id: d.producto.id, nombre: d.producto.nombre }))
                  });
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                🔍 Debug Estados
              </button>
            </div>

            <div style={{
              display: 'grid',
              gap: isMobile ? '1rem' : '0.5rem'
            }}>
              {detallesConteo
                .filter(detalle => detalle.producto) // Filtrar detalles sin producto
                .map((detalle) => (
                <div
                  key={detalle.id}
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '0.75rem',
                    padding: isMobile ? '1.25rem' : '1rem',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {isMobile ? (
                    /* VISTA MÓVIL */
                    <>
                      {/* Fila 1: Nombre + Detalles del producto + Diferencia */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem',
                        gap: '1rem'
                      }}>
                        {/* Información del producto */}
                        <div style={{ flex: 1 }}>
                          {/* Código destacado */}
                          {detalle.producto?.codigoPersonalizado && (
                            <div style={{ 
                              fontSize: '0.95rem',
                              fontWeight: '700',
                              color: '#7c3aed',
                              background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '0.5rem',
                              display: 'inline-block',
                              marginBottom: '0.5rem',
                              border: '2px solid #c4b5fd',
                              letterSpacing: '0.025em'
                            }}>
                              {detalle.producto.codigoPersonalizado}
                            </div>
                          )}
                          <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 0.5rem 0',
                            lineHeight: '1.3'
                          }}>
                            {detalle.producto?.nombre || 'Producto no encontrado'}
                          </h3>
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            📦 Stock: {detalle.stockSistema || 0}
                          </div>
                        </div>

                        {/* Diferencia */}
                        <div style={{
                          background: detalle.diferenciaEntreConteos === 0 ? '#f0fdf4' : '#fef2f2',
                          border: `2px solid ${detalle.diferenciaEntreConteos === 0 ? '#bbf7d0' : '#fecaca'}`,
                          borderRadius: '0.625rem',
                          padding: '0.75rem',
                          textAlign: 'center',
                          minWidth: '85px'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626',
                            marginBottom: '0.25rem'
                          }}>
                            Diferencia
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626'
                          }}>
                            {Math.abs(detalle.diferenciaEntreConteos || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Fila 2: Cards de Usuario 1 y Usuario 2 lado a lado */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        {/* Usuario 1 */}
                        <div style={{
                          background: '#eff6ff',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '2px solid #dbeafe'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#1e40af',
                            marginBottom: '0.4rem'
                          }}>
                            👤 {conteoInfo?.usuario1Nombre || 'Usuario 1'}
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1e40af',
                            marginBottom: '0.4rem'
                          }}>
                            {detalle.cantidadConteo1 || 0}
                          </div>
                          {detalle.formulaCalculo1 && detalle.formulaCalculo1 !== 'Sin fórmula' && (
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#4b5563',
                              background: 'white',
                              padding: '0.4rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #dbeafe',
                              maxHeight: '100px',
                              overflowY: 'auto'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                Fórmulas {datosUsuario?.id === conteoInfo?.usuario1Id ? '(tap)' : ''}:
                              </div>
                              {(() => {
                                const formulasOriginales = detalle.formulaCalculo1.split(' | ');
                                const formulasDescompuestas = formulasOriginales.flatMap(formula => 
                                  descomponerFormulaUnificada(formula)
                                );
                                
                                return formulasDescompuestas.map((formula, index) => {
                                  const isMarcada = isFormulaMarcada(detalle.producto.id, formula, 1, index);
                                  const esUsuarioActual = datosUsuario?.id === conteoInfo?.usuario1Id;
                                  return (
                                    <div 
                                      key={index} 
                                      onClick={esUsuarioActual ? () => toggleFormula(detalle.producto.id, formula, 1, index) : undefined}
                                      style={{ 
                                        marginBottom: '0.25rem',
                                        padding: '0.35rem 0.5rem',
                                        background: isMarcada ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.7rem',
                                        cursor: esUsuarioActual ? 'pointer' : 'default',
                                        border: isMarcada ? '1.5px solid #22c55e' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        opacity: esUsuarioActual ? 1 : 0.7,
                                        fontWeight: '500'
                                      }}
                                    >
                                      {formula}
                                      {isMarcada && (
                                        <span style={{ 
                                          position: 'absolute', 
                                          right: '4px', 
                                          top: '4px', 
                                          color: '#22c55e',
                                          fontSize: '0.65rem'
                                        }}>✓</span>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Usuario 2 */}
                        <div style={{
                          background: '#f0fdf4',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '2px solid #bbf7d0'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#059669',
                            marginBottom: '0.4rem'
                          }}>
                            👤 {conteoInfo?.usuario2Nombre || 'Usuario 2'}
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#059669',
                            marginBottom: '0.4rem'
                          }}>
                            {detalle.cantidadConteo2 || 0}
                          </div>
                          {detalle.formulaCalculo2 && detalle.formulaCalculo2 !== 'Sin fórmula' && (
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#4b5563',
                              background: 'white',
                              padding: '0.4rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #bbf7d0',
                              maxHeight: '100px',
                              overflowY: 'auto'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                Fórmulas {datosUsuario?.id === conteoInfo?.usuario2Id ? '(tap)' : ''}:
                              </div>
                              {(() => {
                                const formulasOriginales = detalle.formulaCalculo2.split(' | ');
                                const formulasDescompuestas = formulasOriginales.flatMap(formula => 
                                  descomponerFormulaUnificada(formula)
                                );
                                
                                return formulasDescompuestas.map((formula, index) => {
                                  const isMarcada = isFormulaMarcada(detalle.producto.id, formula, 2, index);
                                  const esUsuarioActual = datosUsuario?.id === conteoInfo?.usuario2Id;
                                  return (
                                    <div 
                                      key={index} 
                                      onClick={esUsuarioActual ? () => toggleFormula(detalle.producto.id, formula, 2, index) : undefined}
                                      style={{ 
                                        marginBottom: '0.25rem',
                                        padding: '0.35rem 0.5rem',
                                        background: isMarcada ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.7rem',
                                        cursor: esUsuarioActual ? 'pointer' : 'default',
                                        border: isMarcada ? '1.5px solid #22c55e' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        opacity: esUsuarioActual ? 1 : 0.7,
                                        fontWeight: '500'
                                      }}
                                    >
                                      {formula}
                                      {isMarcada && (
                                        <span style={{ 
                                          position: 'absolute', 
                                          right: '4px', 
                                          top: '4px', 
                                          color: '#22c55e',
                                          fontSize: '0.65rem'
                                        }}>✓</span>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* VISTA DESKTOP - Layout original */
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      {/* Información del producto */}
                      <div>
                        <h3 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {detalle.producto?.nombre || 'Producto no encontrado'}
                        </h3>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          <div><strong>Código:</strong> {detalle.producto?.codigoPersonalizado || 'N/A'}</div>
                          <div><strong>Stock:</strong> {detalle.stockSistema || 0}</div>
                        </div>
                      </div>

                      {/* Usuario 1 */}
                    <div style={{
                      background: '#eff6ff',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #dbeafe',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '0.25rem'
                      }}>
                        👤 {conteoInfo?.usuario1Nombre || 'Usuario 1'}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '0.25rem'
                      }}>
                        {detalle.cantidadConteo1 || 0}
                      </div>
                      {detalle.formulaCalculo1 && detalle.formulaCalculo1 !== 'Sin fórmula' && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#4b5563',
                          background: 'white',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #dbeafe'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.125rem' }}>
                            Fórmulas {datosUsuario?.id === conteoInfo?.usuario1Id ? '(clic para usar)' : '(solo lectura)'}:
                          </div>
                          {(() => {
                            // ✅ NUEVO: Descomponer fórmulas unificadas del usuario 1 también
                            const formulasOriginales = detalle.formulaCalculo1.split(' | ');
                            const formulasDescompuestas = formulasOriginales.flatMap(formula => 
                              descomponerFormulaUnificada(formula)
                            );
                            
                            console.log('🔍 DEBUG fórmulas usuario 1:', {
                              formulasOriginales,
                              formulasDescompuestas
                            });
                            
                            return formulasDescompuestas.map((formula, index) => {
                              const isMarcada = isFormulaMarcada(detalle.producto.id, formula, 1, index);
                              const esUsuarioActual = datosUsuario?.id === conteoInfo?.usuario1Id;
                              return (
                                <div 
                                  key={index} 
                                  onClick={esUsuarioActual ? () => toggleFormula(detalle.producto.id, formula, 1, index) : undefined}
                                  style={{ 
                                    marginBottom: '0.125rem',
                                    padding: '0.125rem 0.25rem',
                                    background: isMarcada ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.6rem',
                                    cursor: esUsuarioActual ? 'pointer' : 'default',
                                    border: isMarcada ? '1px solid #22c55e' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    opacity: esUsuarioActual ? 1 : 0.7
                                  }}
                                >
                                  {formula}
                                  {isMarcada && (
                                    <span style={{ 
                                      position: 'absolute', 
                                      right: '2px', 
                                      top: '2px', 
                                      color: '#22c55e',
                                      fontSize: '0.5rem'
                                    }}>✓</span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Usuario 2 */}
                    <div style={{
                      background: '#f0fdf4',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #bbf7d0',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#059669',
                        marginBottom: '0.25rem'
                      }}>
                        👤 {conteoInfo?.usuario2Nombre || 'Usuario 2'}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#059669',
                        marginBottom: '0.25rem'
                      }}>
                        {detalle.cantidadConteo2 || 0}
                      </div>
                      {detalle.formulaCalculo2 && detalle.formulaCalculo2 !== 'Sin fórmula' && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#4b5563',
                          background: 'white',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.125rem' }}>
                            Fórmulas {datosUsuario?.id === conteoInfo?.usuario2Id ? '(clic para usar)' : '(solo lectura)'}:
                          </div>
                          {(() => {
                            // ✅ NUEVO: Descomponer fórmulas unificadas del usuario 2
                            const formulasOriginales = detalle.formulaCalculo2.split(' | ');
                            const formulasDescompuestas = formulasOriginales.flatMap(formula => 
                              descomponerFormulaUnificada(formula)
                            );
                            
                            console.log('🔍 DEBUG fórmulas usuario 2:', {
                              formulasOriginales,
                              formulasDescompuestas
                            });
                            
                            return formulasDescompuestas.map((formula, index) => {
                              const isMarcada = isFormulaMarcada(detalle.producto.id, formula, 2, index);
                              const esUsuarioActual = datosUsuario?.id === conteoInfo?.usuario2Id;
                              return (
                                <div 
                                  key={index} 
                                  onClick={esUsuarioActual ? () => toggleFormula(detalle.producto.id, formula, 2, index) : undefined}
                                  style={{ 
                                    marginBottom: '0.125rem',
                                    padding: '0.125rem 0.25rem',
                                    background: isMarcada ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.6rem',
                                    cursor: esUsuarioActual ? 'pointer' : 'default',
                                    border: isMarcada ? '1px solid #22c55e' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    opacity: esUsuarioActual ? 1 : 0.7
                                  }}
                                >
                                  {formula}
                                  {isMarcada && (
                                    <span style={{ 
                                      position: 'absolute', 
                                      right: '2px', 
                                      top: '2px', 
                                      color: '#22c55e',
                                      fontSize: '0.5rem'
                                    }}>✓</span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Diferencia */}
                    <div style={{
                      background: detalle.diferenciaEntreConteos === 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${detalle.diferenciaEntreConteos === 0 ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626',
                        marginBottom: '0.25rem'
                      }}>
                        Diferencia
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626'
                      }}>
                        {Math.abs(detalle.diferenciaEntreConteos || 0)}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Fila 3: Campo de reconteo abajo */}
                  <div style={{
                    background: '#f8fafc',
                    padding: isMobile ? '1rem' : '0.75rem',
                    borderRadius: isMobile ? '0.5rem' : '0.375rem',
                    border: isMobile ? '2px solid #e2e8f0' : '1px solid #e2e8f0'
                  }}>
                    {reconteosSolidificados[detalle.producto.id] && (
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        ✅ Reconteo Completado
                      </label>
                    )}
                    
                    {(() => {
                      const esSolidificado = reconteosSolidificados[detalle.producto.id];
                      const esActivo = true; // Todos los productos están habilitados para reconteo
                      
                      if (esSolidificado) {
                          // Campo solidificado (solo lectura) con opción de editar
                          return (
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                width: '100%',
                                padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                                border: '2px solid #10b981',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                background: '#f0fdf4',
                                color: '#065f46',
                                fontWeight: '600',
                                textAlign: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                // Volver a modo editable
                                setReconteos(prev => ({ 
                                  ...prev, 
                                  [detalle.producto.id]: reconteosSolidificados[detalle.producto.id] 
                                }));
                                setReconteosSolidificados(prev => {
                                  const nuevo = { ...prev };
                                  delete nuevo[detalle.producto.id];
                                  return nuevo;
                                });
                                setProductoActual(detalle.producto.id);
                              }}
                              >
                                ✅ {reconteosSolidificados[detalle.producto.id]} = {calcularFormula(reconteosSolidificados[detalle.producto.id])}
                              </div>
                              <div style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#10b981',
                                fontSize: '1rem',
                                pointerEvents: 'none'
                              }}>
                                ✏️
                              </div>
                            </div>
                          );
                        } else {
                          // ✅ NUEVA INTERFAZ: Campo dinámico con fórmulas marcadas
                          return (
                            <div style={{
                              width: '100%',
                              background: '#f8fafc',
                              border: '2px solid #3b82f6',
                              borderRadius: '0.5rem',
                              padding: '0.75rem'
                            }}>
                              {/* Campo de reconteo dinámico */}
                              <input
                                type="text"
                                placeholder={isMobile ? "Toca fórmulas o escribe..." : "Clic en fórmulas arriba o escriba manualmente..."}
                                value={camposReconteo[detalle.producto.id] || ''}
                                onChange={(e) => editarCampoReconteo(detalle.producto.id, e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    solidificarReconteo(detalle.producto.id);
                                  }
                                }}
                                disabled={guardando}
                                style={{
                                  width: '100%',
                                  padding: isMobile ? '0.85rem' : '0.5rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.375rem',
                                  fontSize: isMobile ? '1.1rem' : '0.875rem',
                                  background: 'white',
                                  marginBottom: '0.5rem'
                                }}
                              />
                              
                              {/* Resultado en tiempo real */}
                              {resultadosReconteo[detalle.producto.id] > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  padding: isMobile ? '0.75rem' : '0.5rem',
                                  borderRadius: '0.375rem',
                                  fontSize: isMobile ? '1rem' : '0.875rem'
                                }}>
                                  <span style={{ fontWeight: '600', color: '#1e40af' }}>
                                    Resultado:
                                  </span>
                                  <span style={{ 
                                    fontWeight: '700', 
                                    color: '#1d4ed8',
                                    fontSize: isMobile ? '1.4rem' : '1rem'
                                  }}>
                                    {resultadosReconteo[detalle.producto.id]}
                                  </span>
                                </div>
                              )}
                              
                              {/* Botón de confirmar */}
                              {(camposReconteo[detalle.producto.id] || '').trim() && (
                                <button
                                  onClick={() => solidificarReconteo(detalle.producto.id)}
                                  disabled={guardando}
                                  style={{
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    padding: isMobile ? '0.85rem' : '0.5rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: isMobile ? '1.05rem' : '0.875rem',
                                    fontWeight: '600',
                                    cursor: guardando ? 'not-allowed' : 'pointer',
                                    opacity: guardando ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  ✓ Confirmar Reconteo
                                </button>
                              )}
                            </div>
                          );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón de Finalizar Reconteo */}
            {mostrarBotonFinalizar && (
              <div style={{
                marginTop: '2rem',
                textAlign: 'center'
              }}>
                <button
                  onClick={guardarTodosLosReconteos}
                  disabled={guardando}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      guardarTodosLosReconteos();
                    }
                  }}
                  autoFocus
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)',
                    transition: 'all 0.2s ease',
                    opacity: guardando ? 0.6 : 1,
                    outline: 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!guardando) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(5, 150, 105, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!guardando) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.3)';
                    }
                  }}
                >
                  {guardando ? '⏳ Guardando...' : '✅ Guardar Reconteos Completados'}
                </button>
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  Guarda todos los reconteos completados y finaliza el proceso
                </div>
              </div>
            )}
          </div>
        ) : sectorCompletado ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#059669',
              marginBottom: '1rem'
            }}>
              ¡Sector Completado!
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Todos los productos han sido reconciliados exitosamente. No hay diferencias entre los conteos.
            </p>
            <button
              onClick={() => navigate('/admin/inventario-completo')}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(5, 150, 105, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.3)';
              }}
            >
              🔍 Ver Detalle Final del Sector
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Iniciando Reconteo
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Comienza a hacer el reconteo de los productos con diferencias. Ingresa las cantidades y presiona Enter para continuar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
