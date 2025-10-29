import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { API_CONFIG } from '../../config/api';
import BarcodeScanner from '../../components/BarcodeScanner';

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

interface DetalleConteo {
  id: number;
  producto: Producto;
  stockSistema: number;
  cantidadConteo1?: number;
  cantidadConteo2?: number;
  cantidadFinal?: number;
  cantidadContada?: number; // Campo para la cantidad contada por el usuario actual
  diferenciaSistema?: number;
  diferenciaEntreConteos?: number;
  todosLosDetallesDelProducto?: Array<{
    id: number;
    fechaCreacion: string;
    cantidadConteo1?: number;
    cantidadConteo2?: number;
    formulaCalculo1?: string;
    formulaCalculo2?: string;
    estado: string;
  }>;
  formulaCalculo1?: string;
  formulaCalculo2?: string;
  formulaCalculo?: string; // Campo para la fórmula de cálculo
  estado: string;
}

interface ConteoSectorInfo {
  id: number;
  sectorId: number;
  sectorNombre: string;
  sectorDescripcion?: string;
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  usuario1Id?: number;
  usuario1Nombre?: string;
  usuario2Id?: number;
  usuario2Nombre?: string;
  // Nuevos campos específicos por usuario
  estadoUsuario1?: string;
  estadoUsuario2?: string;
  fechaInicioUsuario1?: string;
  fechaInicioUsuario2?: string;
  productosContadosUsuario1?: number;
  productosContadosUsuario2?: number;
  inventarioCompleto: {
    id: number;
    empresaId: number;
  };
}

export default function ConteoSectorInventarioCompleto() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const [conteoInfo, setConteoInfo] = useState<ConteoSectorInfo | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);
  const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [mostrarCampoCantidad, setMostrarCampoCantidad] = useState(false);
  const [productosEliminados, setProductosEliminados] = useState<Set<number>>(new Set());
  const [cantidadTemporal, setCantidadTemporal] = useState(0);
  const [cantidadTemporalTexto, setCantidadTemporalTexto] = useState<string>('');
  const [productoSeleccionadoTemporal, setProductoSeleccionadoTemporal] = useState<Producto | null>(null);
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [esModoReconteo, setEsModoReconteo] = useState(false);
  const [filtroProductosContados, setFiltroProductosContados] = useState('');
  const [vieneConAutoStart, setVieneConAutoStart] = useState(false);
  const [nuevasCantidades, setNuevasCantidades] = useState<{[key: number]: {cantidad: string, resultado: number | null}}>({});
  const [progresoCargadoMostrado, setProgresoCargadoMostrado] = useState(false);
  
  // ✅ NUEVO: Estado para ocultar navbar al hacer scroll (solo móvil)
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [ultimoScroll, setUltimoScroll] = useState(0);

  // Refs para el manejo de teclas y auto scroll
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const cantidadTemporalRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaProductosContadosRef = useRef<HTMLDivElement>(null);

  // ✅ NUEVO: Ocultar/mostrar navbar al hacer scroll (solo en móvil)
  useEffect(() => {
    console.log('🔍 DEBUG Navbar Scroll - isMobile:', isMobile);
    
    if (!isMobile) {
      console.log('⏭️ No es móvil, navbar siempre visible');
      return; // Solo aplicar en móvil
    }

    const handleScroll = () => {
      const scrollActual = window.pageYOffset;
      
      console.log('📜 Scroll actual:', scrollActual, 'Último:', ultimoScroll, 'Navbar visible:', navbarVisible);
      
      // Solo ocultar si hemos scrolleado más de 50px
      if (scrollActual < 50) {
        setNavbarVisible(true);
        return;
      }
      
      // Ocultar al bajar, mostrar al subir
      if (scrollActual > ultimoScroll) {
        console.log('⬇️ Ocultando navbar (scroll hacia abajo)');
        setNavbarVisible(false); // Scrolleando hacia abajo
      } else {
        console.log('⬆️ Mostrando navbar (scroll hacia arriba)');
        setNavbarVisible(true); // Scrolleando hacia arriba
      }
      
      setUltimoScroll(scrollActual);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ultimoScroll, isMobile]);

  // Manejador global de teclas para auto-scroll al buscador
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enter: Enfocar buscador y hacer scroll
      if (event.key === 'Enter' && !inputBusqueda.trim()) {
        event.preventDefault();
        event.stopPropagation();
        if (inputBusquedaRef.current) {
          inputBusquedaRef.current.focus();
          // Scroll suave hacia el buscador después de un pequeño delay
          setTimeout(() => {
            // Calcular la posición del buscador y la altura del navbar
            const navbar = document.querySelector('.navbar-admin') as HTMLElement;
            const navbarHeight = navbar ? navbar.offsetHeight : 80; // altura por defecto si no encuentra el navbar
            
            // Obtener la posición del buscador
            const buscadorRect = inputBusquedaRef.current!.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const buscadorTop = buscadorRect.top + scrollTop;
            
            // Scroll para posicionar el buscador justo debajo del navbar
            window.scrollTo({
              top: buscadorTop - navbarHeight - 100, // 30px de margen adicional
              behavior: 'smooth'
            });
          }, 100);
        }
        return;
      }
    };

    // Agregar el event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputBusqueda]);

  useEffect(() => {
    console.log('🚀 ConteoSectorInventarioCompleto - useEffect ejecutado:', {
      id,
      empresaId: datosUsuario?.empresaId,
      datosUsuario: datosUsuario,
      esModoReconteo: esModoReconteo
    });
    
    if (id && datosUsuario?.empresaId) {
      cargarDatos();
      cargarProgresoGuardado();
    }
  }, [id, datosUsuario, esModoReconteo]);

  // Debug del estado del conteo
  useEffect(() => {
    if (conteoInfo) {
      console.log('🔍 DEBUG estado del conteo:', {
        vieneConAutoStart,
        estado: conteoInfo.estado,
        mostrarInterfaz: vieneConAutoStart || conteoInfo.estado === 'EN_PROGRESO' || conteoInfo.estado === 'COMPLETADO' || conteoInfo.estado === 'REVISION'
      });
    }
  }, [conteoInfo, vieneConAutoStart]);


  const cargarProgresoGuardado = () => {
    try {
      const progresoGuardado = localStorage.getItem(`conteo-progreso-${id}`);
      if (progresoGuardado) {
        const progreso = JSON.parse(progresoGuardado);
        const tiempoTranscurrido = Date.now() - progreso.timestamp;
        const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);
        
        // Solo cargar si tiene menos de 24 horas
        if (horasTranscurridas < 24) {
          console.log('Cargando progreso guardado...');
          // Cargar los detalles de conteo guardados
          if (progreso.detallesConteo && Array.isArray(progreso.detallesConteo)) {
            setDetallesConteo(progreso.detallesConteo);
            // Solo mostrar el toast si no se ha mostrado antes
            if (!progresoCargadoMostrado) {
            toast.success(`Progreso cargado: ${progreso.detallesConteo.length} productos contados`);
              setProgresoCargadoMostrado(true);
            }
          }
          
          // Cargar productos eliminados si existen
          if (progreso.productosEliminados && Array.isArray(progreso.productosEliminados)) {
            setProductosEliminados(new Set(progreso.productosEliminados));
          }
        } else {
          // Limpiar progreso antiguo
          localStorage.removeItem(`conteo-progreso-${id}`);
          console.log('Progreso guardado expirado, limpiado');
        }
      }
    } catch (error) {
      console.error('Error cargando progreso guardado:', error);
    }
  };

  const limpiarProgresoGuardado = () => {
    try {
      localStorage.removeItem(`conteo-progreso-${id}`);
      console.log('Progreso guardado limpiado manualmente');
    } catch (error) {
      console.error('Error limpiando progreso guardado:', error);
    }
  };

  // Guardar progreso automáticamente cuando cambien los detalles
  useEffect(() => {
    if (detallesConteo.length > 0 && conteoInfo && id) {
      localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify({
        conteoInfo,
        detallesConteo,
        productosEliminados: Array.from(productosEliminados),
        timestamp: Date.now()
      }));
    }
  }, [detallesConteo, conteoInfo, id, productosEliminados]);

  // Auto-scroll para mantener visible el elemento seleccionado en la lista de productos
  useEffect(() => {
    if (productoSeleccionado >= 0 && listaProductosRef.current) {
      const listaElement = listaProductosRef.current;
      const elementos = listaElement.children;
      
      if (elementos[productoSeleccionado]) {
        const elementoSeleccionado = elementos[productoSeleccionado] as HTMLElement;
        const elementoRect = elementoSeleccionado.getBoundingClientRect();
        const listaRect = listaElement.getBoundingClientRect();
        
        // Verificar si el elemento está fuera del área visible
        if (elementoRect.top < listaRect.top) {
          // Elemento está arriba del área visible, hacer scroll hacia arriba
          elementoSeleccionado.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (elementoRect.bottom > listaRect.bottom) {
          // Elemento está abajo del área visible, hacer scroll hacia abajo
          elementoSeleccionado.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [productoSeleccionado]);

  // Efecto para enfocar el campo de cantidad cuando se activa
  useEffect(() => {
    if (mostrarCampoCantidad && cantidadTemporalRef.current) {
      cantidadTemporalRef.current.focus();
      cantidadTemporalRef.current.select();
    }
  }, [mostrarCampoCantidad]);

  // Auto-scroll para mantener visible el último producto agregado al conteo
  useEffect(() => {
    // Solo hacer scroll si hay productos en la lista y no estamos en modo cantidad
    if (detallesConteo.length > 0 && !mostrarCampoCantidad) {
      // Solo hacer scroll si hay más de 3 productos (para evitar scroll en los primeros productos)
      if (detallesConteo.length > 3) {
        // Delay para asegurar que el DOM se haya actualizado completamente
        const timeoutId = setTimeout(() => {
          scrollToLastProduct();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [detallesConteo.length, mostrarCampoCantidad]);

  const calcularFormula = (valor: string): number | null => {
    if (!valor) return null;
    
    try {
      // Reemplazar 'x' por '*' para multiplicación
      const formula = valor.replace(/x/g, '*');
      const resultado = eval(formula);
      return !isNaN(resultado) ? resultado : null;
    } catch (error) {
      return null;
    }
  };

  const manejarCambioCantidad = (detalleId: number, valor: string) => {
    const resultado = calcularFormula(valor);
    setNuevasCantidades(prev => ({
      ...prev,
      [detalleId]: { cantidad: valor, resultado }
    }));
  };

  const cargarProductosConDiferencias = async () => {
    if (!datosUsuario?.empresaId || !id) {
      console.error('❌ Faltan datos necesarios para cargar productos con diferencias');
      return;
    }

    try {
      console.log('🔍 Cargando productos con diferencias para reconteo...');
      console.log('🔍 empresaId:', datosUsuario.empresaId);
      console.log('🔍 conteoSectorId:', id);
      
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/productos-diferencias`, {
        headers
      });

      console.log('🔍 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const productosConDiferencias = await response.json();
        console.log('✅ Productos con diferencias cargados:', productosConDiferencias);
        console.log('✅ Cantidad de productos:', productosConDiferencias.length);
        setDetallesConteo(productosConDiferencias);
        setEsModoReconteo(true); // Activar modo reconteo
        console.log('✅ Modo reconteo activado: esModoReconteo = true');
        toast.success(`Productos con diferencias cargados: ${productosConDiferencias.length} productos para reconteo`);
      } else {
        console.error('❌ Error cargando productos con diferencias:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        toast.error('Error al cargar productos con diferencias');
      }
    } catch (error) {
      console.error('❌ Error cargando productos con diferencias:', error);
      toast.error('Error al cargar productos con diferencias');
    }
  };

  const cargarDatos = async () => {
    try {
      console.log('🔄 ConteoSectorInventarioCompleto - cargarDatos iniciado');
      setCargando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        console.error('❌ No se pudo obtener la información necesaria:', {
          empresaId: datosUsuario?.empresaId,
          id: id
        });
        toast.error('No se pudo obtener la información necesaria');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar información del conteo de sector
      const baseUrl = API_CONFIG.getBaseUrl();
      const conteoResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}`, {
        headers
      });

      if (!conteoResponse.ok) {
        throw new Error('Error al cargar información del conteo');
      }

      const conteoData = await conteoResponse.json();
      setConteoInfo(conteoData);

      // Verificar que el usuario está asignado a este conteo
      const esUsuarioAsignado = conteoData.usuario1Id === datosUsuario.id || 
                               conteoData.usuario2Id === datosUsuario.id;

      if (!esUsuarioAsignado) {
        toast.error('No tienes permisos para acceder a este conteo');
        navigate('/admin/inventario-completo');
        return;
      }

      // Si viene con autoStart, marcarlo para iniciarlo después de cargar todos los datos
      const autoStart = searchParams.get('autoStart') === 'true';
      const modoReconteo = searchParams.get('modoReconteo') === 'true';
      console.log('🔍 DEBUG autoStart:', { autoStart, modoReconteo, estado: conteoData.estado });
      
      if (autoStart) {
        setVieneConAutoStart(true);
        // Limpiar el parámetro de la URL primero para evitar bucles
        navigate(`/admin/conteo-sector/${id}`, { replace: true });
      }

      // Si viene con modoReconteo=true, activar modo reconteo automáticamente
      if (modoReconteo) {
        console.log('🔍 Modo reconteo detectado desde URL - activando modo reconteo automáticamente');
        setVieneConAutoStart(true); // Esto activará la lógica de detección automática
        setEsModoReconteo(true); // Activar modo reconteo directamente
      }

      // Si el estado es CON_DIFERENCIAS, activar modo reconteo automáticamente
      if (conteoData.estado === 'CON_DIFERENCIAS') {
        console.log('🔄 Estado CON_DIFERENCIAS detectado - activando modo reconteo automáticamente');
        setVieneConAutoStart(true); // Esto activará la lógica de detección automática
      }

      // Cargar TODOS los productos de la empresa (como en CrearIngreso)
      const productosResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/productos`, {
        headers
      });

      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        console.log('✅ Productos cargados:', productosData);
        console.log('🔍 DEBUG - Total productos:', productosData.data ? productosData.data.length : productosData.length);
        const productosLista = productosData.data || productosData;
        setProductos(productosLista); // Manejar diferentes formatos de respuesta
        
        // 🔧 GUARDAR PRODUCTOS EN LOCALSTORAGE para uso posterior
        localStorage.setItem(`productos-empresa-${datosUsuario.empresaId}`, JSON.stringify(productosLista));
        console.log('💾 Productos guardados en localStorage para corrección posterior');
      } else {
        console.error('❌ Error cargando productos:', productosResponse.status, productosResponse.statusText);
        toast.error('Error al cargar los productos');
      }

      // Cargar detalles de conteo existentes
      console.log('🔍 Intentando cargar detalles de conteo para ID:', id);
      const modoReconteoParam = esModoReconteo ? '?modoReconteo=true' : '';
      const detallesUrl = `${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles${modoReconteoParam}`;
      console.log('🔍 DEBUG URL de detalles:', detallesUrl);
      console.log('🔍 DEBUG esModoReconteo:', esModoReconteo);
      console.log('🔍 DEBUG datosUsuario:', datosUsuario);
      console.log('🔍 DEBUG empresaId:', datosUsuario.empresaId);
      const detallesResponse = await fetch(detallesUrl, {
        headers
      });

      console.log('🔍 Respuesta de detalles:', {
        status: detallesResponse.status,
        ok: detallesResponse.ok,
        statusText: detallesResponse.statusText
      });

      if (detallesResponse.ok) {
        const detallesData = await detallesResponse.json();
        console.log('✅ Detalles de conteo cargados:', detallesData);
        
        // 🔧 CORRECCIÓN: Verificar y corregir productos sin nombre
        const detallesCorregidos = detallesData.map((detalle: any) => {
          if (!detalle.producto || !detalle.producto.nombre) {
            console.warn('⚠️ Producto sin nombre detectado:', {
              detalleId: detalle.id,
              productoId: detalle.productoId,
              nombreProducto: detalle.nombreProducto,
              detalleCompleto: detalle
            });
            
            // Buscar el producto en la lista cargada
            let productoEncontrado = productos.find((p: any) => p.id === detalle.productoId);
            
            // 🔧 RESPALDO: Si no se encuentra, buscar en localStorage
            if (!productoEncontrado) {
              console.log('🔍 Producto no encontrado en estado, buscando en localStorage...');
              try {
                const productosRespaldo = localStorage.getItem(`productos-empresa-${datosUsuario?.empresaId}`);
                if (productosRespaldo) {
                  const productosLista = JSON.parse(productosRespaldo);
                  productoEncontrado = productosLista.find((p: any) => p.id === detalle.productoId);
                  if (productoEncontrado) {
                    console.log('✅ Producto encontrado en localStorage:', productoEncontrado.nombre);
                  }
                }
              } catch (error) {
                console.error('❌ Error leyendo productos desde localStorage:', error);
              }
            }
            
            if (productoEncontrado) {
              console.log('✅ Producto encontrado y corregido:', {
                productoId: detalle.productoId,
                nombre: productoEncontrado.nombre,
                productoCompleto: productoEncontrado
              });
              return {
                ...detalle,
                producto: productoEncontrado
              };
            } else {
              console.error('❌ No se pudo encontrar el producto con ID:', {
                productoId: detalle.productoId,
                productosDisponibles: productos.map((p: any) => ({ id: p.id, nombre: p.nombre })),
                detalleCompleto: detalle
              });
              
              // Crear un producto temporal con la información disponible
              const productoTemporal = {
                id: detalle.productoId,
                nombre: detalle.nombreProducto || `Producto ID ${detalle.productoId}`,
                stock: detalle.stockSistema || 0,
                precio: detalle.precioUnitario || 0,
                codigoPersonalizado: detalle.codigoProducto || '',
                categoria: detalle.categoria || '',
                marca: detalle.marca || ''
              };
              
              console.log('🔧 Creando producto temporal:', productoTemporal);
              return {
                ...detalle,
                producto: productoTemporal
              };
            }
          }
          return detalle;
        });
        
        console.log('🔧 Detalles corregidos:', detallesCorregidos);
        
        // Debug específico para modo reconteo
        if (esModoReconteo) {
          console.log('🔍 DEBUG MODO RECONTEO - Datos recibidos:');
          detallesCorregidos.forEach((detalle: any, index: number) => {
            console.log(`  Producto ${index + 1}:`, {
              nombre: detalle.producto?.nombre,
              cantidadConteo1: detalle.cantidadConteo1,
              cantidadConteo2: detalle.cantidadConteo2,
              formulaCalculo1: detalle.formulaCalculo1,
              formulaCalculo2: detalle.formulaCalculo2,
              diferencia: detalle.cantidadConteo1 && detalle.cantidadConteo2 ? 
                         (detalle.cantidadConteo2 - detalle.cantidadConteo1) : 'No calculable'
            });
          });
        }
        
        // Ordenar por fecha de creación para mantener el orden de agregado
        console.log('🔍 Fechas de creación recibidas:', detallesCorregidos.map((d: any) => ({
          id: d.id,
          nombre: d.producto?.nombre,
          fechaCreacion: d.fechaCreacion
        })));
        
        const detallesOrdenados = detallesCorregidos.sort((a: any, b: any) => {
          const fechaA = new Date(a.fechaCreacion || 0).getTime();
          const fechaB = new Date(b.fechaCreacion || 0).getTime();
          console.log(`🔄 Comparando: ${a.producto?.nombre} (${fechaA}) vs ${b.producto?.nombre} (${fechaB})`);
          return fechaA - fechaB; // Orden ascendente (más antiguos primero)
        });
        
        console.log('🔄 Detalles ordenados por fecha de creación:', detallesOrdenados);
        setDetallesConteo(detallesOrdenados);
        
        // 🔧 SISTEMA DE RESPALDO: Guardar progreso en localStorage como respaldo
        const progresoRespaldo = {
          timestamp: Date.now(),
          detalles: detallesOrdenados,
          conteoInfo: conteoData
        };
        localStorage.setItem(`conteo-respaldo-${id}`, JSON.stringify(progresoRespaldo));
        console.log('💾 Progreso guardado como respaldo en localStorage');
        
        // Si no hay detalles en el backend pero hay progreso guardado, limpiar el localStorage
        if (detallesCorregidos.length === 0) {
          const progresoGuardado = localStorage.getItem(`conteo-progreso-${id}`);
          if (progresoGuardado) {
            console.log('🧹 Limpiando progreso guardado obsoleto (no hay datos en backend)');
            limpiarProgresoGuardado();
          }
        }
      } else {
        console.error('❌ Error cargando detalles de conteo:', detallesResponse.status, detallesResponse.statusText);
        
        // 🔧 RECUPERACIÓN AUTOMÁTICA: Intentar recuperar desde respaldo
        const respaldo = localStorage.getItem(`conteo-respaldo-${id}`);
        if (respaldo) {
          try {
            const datosRespaldo = JSON.parse(respaldo);
            const tiempoTranscurrido = Date.now() - datosRespaldo.timestamp;
            const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);
            
            console.log('🔄 Intentando recuperar desde respaldo...');
            console.log('⏰ Tiempo transcurrido:', horasTranscurridas.toFixed(2), 'horas');
            
            if (horasTranscurridas < 24) { // Solo recuperar si es menor a 24 horas
              console.log('✅ Recuperando datos desde respaldo');
              setDetallesConteo(datosRespaldo.detalles || []);
              setConteoInfo(datosRespaldo.conteoInfo || conteoData);
              toast.success('⚠️ Datos recuperados desde respaldo local');
            } else {
              console.log('⚠️ Respaldo muy antiguo, no se recupera');
              setDetallesConteo([]);
            }
          } catch (error) {
            console.error('❌ Error recuperando respaldo:', error);
            setDetallesConteo([]);
          }
        } else {
          console.log('ℹ️ No hay respaldo disponible');
          setDetallesConteo([]);
        }
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos del conteo');
    } finally {
      setCargando(false);
      
      // Si viene con autoStart, verificar si el usuario puede iniciar su conteo
      if (vieneConAutoStart) {
        console.log('🔍 DEBUG conteoInfo completo:', conteoInfo);
        console.log('🔍 DEBUG detallesConteo cargados:', detallesConteo);
        console.log('🔍 DEBUG productos contados Usuario 1:', conteoInfo?.productosContadosUsuario1);
        console.log('🔍 DEBUG productos contados Usuario 2:', conteoInfo?.productosContadosUsuario2);
        
        const esUsuario1 = conteoInfo?.usuario1Id === datosUsuario?.id;
        const esUsuario2 = conteoInfo?.usuario2Id === datosUsuario?.id;
        const estadoUsuarioActual = esUsuario1 ? conteoInfo?.estadoUsuario1 : conteoInfo?.estadoUsuario2;
        
        console.log('🔍 DEBUG autoStart check:', {
          vieneConAutoStart,
          esUsuario1,
          esUsuario2,
          estadoUsuarioActual,
          estadoConteo: conteoInfo?.estado,
          usuario1Id: conteoInfo?.usuario1Id,
          usuario2Id: conteoInfo?.usuario2Id,
          datosUsuarioId: datosUsuario?.id
        });
        
        if (estadoUsuarioActual === 'PENDIENTE') {
          console.log('🚀 Iniciando conteo automáticamente después de cargar datos...');
          await iniciarConteoAutomaticamente();
        } else if (estadoUsuarioActual === 'CON_DIFERENCIAS' || conteoInfo?.estado === 'CON_DIFERENCIAS') {
          // Si el usuario está en CON_DIFERENCIAS o el estado general es CON_DIFERENCIAS, cargar productos con diferencias
          console.log('🔄 Estado CON_DIFERENCIAS detectado - cargando productos con diferencias...');
          console.log('🔄 estadoUsuarioActual:', estadoUsuarioActual);
          console.log('🔄 conteoInfo.estado:', conteoInfo?.estado);
          console.log('🔄 conteoInfo completo:', conteoInfo);
          await cargarProductosConDiferencias();
        } else if (estadoUsuarioActual === 'EN_PROGRESO') {
          console.log('ℹ️ Usuario en EN_PROGRESO - continuando conteo normal');
        } else {
          console.log('ℹ️ No se puede iniciar conteo automáticamente. Estado del usuario:', estadoUsuarioActual);
        }
      }
    }
  };

  const iniciarConteoAutomaticamente = async () => {
    try {
        console.log('🔍 DEBUG iniciarConteoAutomaticamente:', {
          empresaId: datosUsuario?.empresaId,
          id,
          inventarioId: conteoInfo?.inventarioCompleto?.id,
          usuarioId: datosUsuario?.id,
          estadoUsuario1: conteoInfo?.estadoUsuario1,
          estadoUsuario2: conteoInfo?.estadoUsuario2,
          esUsuario1: conteoInfo?.usuario1Id === datosUsuario?.id,
          esUsuario2: conteoInfo?.usuario2Id === datosUsuario?.id,
          productosContadosUsuario1: conteoInfo?.productosContadosUsuario1,
          productosContadosUsuario2: conteoInfo?.productosContadosUsuario2,
          detallesConteoLength: detallesConteo.length
        });
      
      if (!datosUsuario?.empresaId || !id || !conteoInfo?.inventarioCompleto?.id) {
        console.error('❌ Faltan datos necesarios para iniciar conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const url = `/api/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo.inventarioCompleto.id}/conteos-sector/${id}/iniciar`;
      console.log('🌐 Llamando a:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Conteo iniciado automáticamente:', responseData);
        toast.success('Conteo iniciado automáticamente');
        // Recargar datos para obtener el estado actualizado del servidor
        await cargarDatos();
      } else {
        const errorData = await response.json();
        console.error('❌ Error iniciando conteo automáticamente:', errorData);
        console.error('❌ Status:', response.status);
        console.error('❌ Status Text:', response.statusText);
        toast.error(`Error al iniciar el conteo: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error iniciando conteo automáticamente:', error);
    }
  };

  const iniciarConteo = async () => {
    try {
      setIniciando(true);
      
      if (!datosUsuario?.empresaId || !id || !conteoInfo?.inventarioCompleto?.id) {
        toast.error('No se pudo obtener la información necesaria');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo.inventarioCompleto.id}/conteos-sector/${id}/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Conteo iniciado exitosamente');
        await cargarDatos(); // Recargar datos para actualizar el estado
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al iniciar el conteo');
      }
    } catch (error) {
      console.error('Error iniciando conteo:', error);
      toast.error('Error al iniciar el conteo');
    } finally {
      setIniciando(false);
    }
  };

  const agregarProductoAlConteo = async (producto: Producto, cantidad: number, formulaCalculo?: string) => {
    console.log('🔄 Agregando producto al conteo:', {
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: cantidad,
      formulaCalculo: formulaCalculo,
      conteoId: id,
      empresaId: datosUsuario?.empresaId
    });
    
    // ✅ PERMITIR MÚLTIPLES ENTRADAS DEL MISMO PRODUCTO
    // Ya no validamos si el producto existe, permitimos múltiples conteos del mismo producto
    console.log('🔍 DEBUG MÚLTIPLES ENTRADAS:', {
      productoId: producto.id,
      productoNombre: producto.nombre,
      totalDetalles: detallesConteo.length,
      entradasExistentesDelProducto: detallesConteo.filter(d => d.producto?.id === producto.id).length,
      detallesExistentes: detallesConteo.map(d => ({
        id: d.id,
        productoId: d.producto?.id,
        productoNombre: d.producto?.nombre,
        cantidadConteo1: d.cantidadConteo1,
        cantidadConteo2: d.cantidadConteo2
      }))
    });
    
    console.log('✅ PERMITIENDO múltiples entradas del mismo producto para mayor precisión');
      
      // Crear el detalle de conteo local con timestamp único
      const timestamp = Date.now();
    
    // Determinar si es usuario 1 o 2 para usar el campo correcto
    const esUsuario1 = conteoInfo?.usuario1Id === datosUsuario?.id;
    const esUsuario2 = conteoInfo?.usuario2Id === datosUsuario?.id;
    
    const ahora = new Date().toISOString();
    
        const nuevoDetalle: DetalleConteo = {
          id: timestamp, // ID temporal único
          producto: producto,
          stockSistema: producto.stock,
      cantidadContada: cantidad, // Mantener para compatibilidad
          formulaCalculo: formulaCalculo || null,
      estado: 'PENDIENTE',
      fechaCreacion: ahora, // Fecha de creación para ordenamiento
      fechaActualizacion: ahora,
      // Agregar campos específicos según el usuario
      ...(esUsuario1 && {
        cantidadConteo1: cantidad,
        formulaCalculo1: formulaCalculo || null
      }),
      ...(esUsuario2 && {
        cantidadConteo2: cantidad,
        formulaCalculo2: formulaCalculo || null
      })
        } as DetalleConteo;

    // Agregar a la lista local INMEDIATAMENTE (sin bloqueo)
      setDetallesConteo(prev => {
        const nuevaLista = [...prev, nuevoDetalle];
      
      console.log('🔄 Agregando producto a la lista:', {
        productoNombre: producto.nombre,
        cantidad: cantidad,
        listaAnterior: prev.length,
        listaNueva: nuevaLista.length,
        nuevoDetalle: nuevoDetalle
      });
        
        // Guardar en localStorage inmediatamente
        const progreso = {
          conteoInfo,
          detallesConteo: nuevaLista,
          timestamp: Date.now()
        };
        localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));
        
        return nuevaLista;
      });

    // 🔄 SINCRONIZACIÓN AUTOMÁTICA: Sincronizar inmediatamente con el servidor
    setTimeout(async () => {
      try {
        console.log('🔄 SINCRONIZACIÓN AUTOMÁTICA: Enviando producto al servidor');
        const token = localStorage.getItem('token');
        const baseUrl = API_CONFIG.getBaseUrl();
        
        console.log('🔍 DEBUG FRONTEND - Datos del request:', {
          url: `${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/${conteoInfo?.inventarioCompleto?.id}/conteos-sector/${id}/agregar-producto`,
          conteoSectorId: id,
          inventarioCompletoId: conteoInfo?.inventarioCompleto?.id,
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad: cantidad,
          usuarioId: datosUsuario?.id,
          sectorNombre: conteoInfo?.sectorNombre
        });

        const response = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/${conteoInfo?.inventarioCompleto?.id}/conteos-sector/${id}/agregar-producto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productoId: producto.id,
            cantidad: cantidad,
            formulaCalculo: formulaCalculo || null,
            usuarioId: datosUsuario?.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Producto sincronizado automáticamente:', result);
          
          // Actualizar el ID del detalle local con el ID real del servidor
          setDetallesConteo(prev => prev.map(detalle => 
            detalle.id === timestamp ? { ...detalle, id: result.detalleId || timestamp } : detalle
          ));
        } else {
          console.error('❌ Error en sincronización automática:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error en sincronización automática:', error);
      }
    }, 1000); // Delay de 1 segundo para asegurar que el estado se haya actualizado
      
    // Mostrar toast de éxito inmediatamente
    toast.success('✅ Producto agregado');

    // ✅ CORRECCIÓN: No sincronizar en segundo plano porque el producto ya se agregó exitosamente
    // La sincronización redundante estaba causando registros duplicados
    console.log('✅ Producto agregado exitosamente - no se requiere sincronización adicional');
  };

  // ✅ NUEVA FUNCIÓN: Editar producto existente
  const editarProductoExistente = async (detalleExistente: DetalleConteo, cantidad: number, formulaCalculo?: string) => {
    console.log('🔄 Editando producto existente:', {
      detalleId: detalleExistente.id,
      productoId: detalleExistente.producto?.id,
      cantidadAnterior: detalleExistente.cantidadConteo1 || detalleExistente.cantidadConteo2,
      cantidadNueva: cantidad
    });

    // Determinar si es usuario 1 o 2
    const esUsuario1 = conteoInfo?.usuario1Id === datosUsuario?.id;
    const esUsuario2 = conteoInfo?.usuario2Id === datosUsuario?.id;

    // Actualizar el estado local inmediatamente
    setDetallesConteo(prev => {
      const nuevaLista = prev.map(detalle => {
        if (detalle.id === detalleExistente.id) {
          const detalleActualizado = { ...detalle };
          
          if (esUsuario1) {
            detalleActualizado.cantidadConteo1 = cantidad;
            detalleActualizado.formulaCalculo1 = formulaCalculo || undefined;
          } else if (esUsuario2) {
            detalleActualizado.cantidadConteo2 = cantidad;
            detalleActualizado.formulaCalculo2 = formulaCalculo || undefined;
          }
          return detalleActualizado;
        }
        return detalle;
      });

      // Guardar en localStorage
      const progreso = {
        conteoInfo,
        detallesConteo: nuevaLista,
        timestamp: Date.now()
      };
      localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));

      return nuevaLista;
    });

    // Sincronizar con el backend usando el flujo de actualización
    try {
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      
      // Buscar el detalle real en el backend usando el producto ID
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (detallesResponse.ok) {
        const detallesBackend = await detallesResponse.json();
        const detalleReal = detallesBackend.find((d: any) => d.productoId === detalleExistente.producto?.id);
        
        if (detalleReal) {
          console.log('🔍 Detalle real encontrado para edición:', {
            detalleId: detalleReal.id,
            productoId: detalleReal.productoId
          });
          
          // Actualizar el detalle real en el backend
          const updateResponse = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleReal.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              cantidad: cantidad,
              formula: formulaCalculo || null
            })
          });
          
          if (updateResponse.ok) {
            console.log('✅ Producto editado y sincronizado con backend exitosamente');
            toast.success('Producto actualizado exitosamente');
            
            // ✅ ACTUALIZAR SOLO EL DETALLE ESPECÍFICO en lugar de recargar toda la pantalla
            const detalleActualizado = await updateResponse.json();
            setDetallesConteo(prev => prev.map(detalle => {
              if (detalle.id === detalleExistente.id) {
                return {
                  ...detalle,
                  cantidadConteo1: detalleActualizado.cantidadConteo1 || detalle.cantidadConteo1,
                  cantidadConteo2: detalleActualizado.cantidadConteo2 || detalle.cantidadConteo2,
                  formulaCalculo1: detalleActualizado.formulaCalculo1 || detalle.formulaCalculo1,
                  formulaCalculo2: detalleActualizado.formulaCalculo2 || detalle.formulaCalculo2,
                  estado: detalleActualizado.estado || detalle.estado
                };
              }
              return detalle;
            }));
            
            // Actualizar localStorage
            const progreso = {
              conteoInfo,
              detallesConteo: detallesConteo.map(detalle => {
                if (detalle.id === detalleExistente.id) {
                  return {
                    ...detalle,
                    cantidadConteo1: detalleActualizado.cantidadConteo1 || detalle.cantidadConteo1,
                    cantidadConteo2: detalleActualizado.cantidadConteo2 || detalle.cantidadConteo2,
                    formulaCalculo1: detalleActualizado.formulaCalculo1 || detalle.formulaCalculo1,
                    formulaCalculo2: detalleActualizado.formulaCalculo2 || detalle.formulaCalculo2,
                    estado: detalleActualizado.estado || detalle.estado
                  };
                }
                return detalle;
              }),
              timestamp: Date.now()
            };
            localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));
            
          } else {
            const errorData = await updateResponse.json();
            console.error('❌ Error actualizando producto en backend:', errorData);
            toast.error('Error al actualizar en el servidor');
          }
        } else {
          console.error('❌ No se encontró el detalle real en el backend');
          toast.error('Error: No se encontró el detalle en el servidor');
        }
      } else {
        console.error('❌ Error obteniendo detalles del backend');
        toast.error('Error al obtener datos del servidor');
      }
    } catch (error) {
      console.error('❌ Error en edición de producto:', error);
      toast.error('Error al sincronizar con el servidor');
    }
  };

  const buscarProductos = (valor: string) => {
    setInputBusqueda(valor);
    setProductoSeleccionado(-1);
    
    if (!valor.trim()) {
      setProductosFiltrados([]);
      setMostrarProductos(false);
      return;
    }

    const valorLower = valor.toLowerCase();
    const valorExacto = valor.trim();

    // Filtrar productos y asignar prioridad
    const productosConPrioridad = productos.map(producto => {
      let prioridad = 999; // Prioridad por defecto (baja)
      
      // 1. Prioridad más alta: Código personalizado exacto
      if (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase() === valorLower) {
        prioridad = 1;
      }
      // 2. Segunda prioridad: Código personalizado que contiene el valor
      else if (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(valorLower)) {
        prioridad = 2;
      }
      // 3. Tercera prioridad: Código de barras exacto
      else if (producto.codigoBarras && producto.codigoBarras === valorExacto) {
        prioridad = 3;
      }
      // 4. Cuarta prioridad: Código de barras que contiene el valor
      else if (producto.codigoBarras && producto.codigoBarras.includes(valorExacto)) {
        prioridad = 4;
      }
      // 5. Quinta prioridad: Nombre exacto
      else if (producto.nombre.toLowerCase() === valorLower) {
        prioridad = 5;
      }
      // 6. Prioridad más baja: Nombre que contiene el valor
      else if (producto.nombre.toLowerCase().includes(valorLower)) {
        prioridad = 6;
      }

      return { producto, prioridad };
    });

    // Filtrar solo los productos que coinciden y ordenar por prioridad
    const filtrados = productosConPrioridad
      .filter(item => item.prioridad < 999)
      .sort((a, b) => a.prioridad - b.prioridad)
      .map(item => item.producto);

    setProductosFiltrados(filtrados);
    setMostrarProductos(filtrados.length > 0);
  };

  const manejarTeclas = (e: React.KeyboardEvent) => {
    if (!mostrarProductos || productosFiltrados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setProductoSeleccionado(prev => 
          prev < productosFiltrados.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setProductoSeleccionado(prev => 
          prev > 0 ? prev - 1 : productosFiltrados.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (productoSeleccionado >= 0 && productoSeleccionado < productosFiltrados.length) {
          agregarProducto(productosFiltrados[productoSeleccionado]);
        }
        break;
      case 'Escape':
        setMostrarProductos(false);
        setProductoSeleccionado(-1);
        break;
    }
  };

  const evaluarFormula = (formula: string): number | null => {
    try {
      // Limpiar la fórmula y convertir 'x' a '*'
      const formulaLimpia = formula.replace(/x/g, '*').replace(/[^0-9+\-*/().]/g, '');
      
      if (!formulaLimpia.trim()) {
        setErrorCalculo('Fórmula vacía');
        setResultadoCalculo(null);
        return null;
      }

      // Evaluar fórmula matemática simple
      const resultado = eval(formulaLimpia);
      
      if (isNaN(resultado) || !isFinite(resultado)) {
        setErrorCalculo('Fórmula inválida');
        setResultadoCalculo(null);
        return null;
      } else {
        const resultadoFinal = Math.floor(resultado); // Redondear hacia abajo
        setResultadoCalculo(resultadoFinal);
        setErrorCalculo(null);
        return resultadoFinal;
      }
    } catch (error) {
      setErrorCalculo('Error en la fórmula');
      setResultadoCalculo(null);
      return null;
    }
  };

  const agregarProducto = (producto: Producto) => {
    // Guardar el producto seleccionado y mostrar el campo de cantidad
    setProductoSeleccionadoTemporal(producto);
    setCantidadTemporal(0);
    setCantidadTemporalTexto('');
    setResultadoCalculo(null);
    setErrorCalculo(null);
    setMostrarCampoCantidad(true);
    setInputBusqueda('');
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    
    // Hacer focus en el campo de cantidad temporal
    setTimeout(() => {
      if (cantidadTemporalRef.current) {
        cantidadTemporalRef.current.focus();
        cantidadTemporalRef.current.select();
      }
    }, 100);
  };

  const confirmarCantidad = () => {
    if (!productoSeleccionadoTemporal) {
      toast.error('Por favor seleccione un producto');
      return;
    }

    // Determinar la cantidad final
    let cantidadFinal: number;
    
    // Si hay texto en el campo de cantidad, evaluar la expresión
    if (cantidadTemporalTexto.trim()) {
      // Verificar si la cantidad contiene operadores matemáticos
      if (/[+\-*/x()]/.test(cantidadTemporalTexto)) {
        // Es una expresión matemática, evaluarla
        const resultadoEvaluacion = evaluarFormula(cantidadTemporalTexto);
        if (resultadoEvaluacion !== null && resultadoEvaluacion > 0) {
          cantidadFinal = resultadoEvaluacion;
        } else {
          toast.error('Error en la fórmula de cálculo o cantidad inválida');
          return;
        }
      } else {
        // Es un número simple
        const numero = parseInt(cantidadTemporalTexto);
        if (isNaN(numero) || numero <= 0) {
          toast.error('Por favor ingresa una cantidad válida mayor a 0');
          return;
        }
        cantidadFinal = numero;
      }
    } else {
      // Usar el valor numérico
      if (cantidadTemporal <= 0) {
        toast.error('Por favor ingresa una cantidad válida mayor a 0');
        return;
      }
      cantidadFinal = cantidadTemporal;
    }

    // Guardar la posición actual del scroll antes de agregar el producto (solo en móvil)
    const scrollPosition = isMobile ? window.pageYOffset : 0;
    
    // Agregar el producto con la cantidad calculada
    agregarProductoAlConteo(productoSeleccionadoTemporal, cantidadFinal, cantidadTemporalTexto.trim() || undefined);
    
    // Limpiar el estado
    setMostrarCampoCantidad(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(0);
    setCantidadTemporalTexto('');
    setResultadoCalculo(null);
    setErrorCalculo(null);
    
    // Restaurar la posición del scroll y volver el focus al buscador (solo en móvil)
    setTimeout(() => {
      if (isMobile) {
        // Restaurar la posición del scroll para mantener el buscador en su lugar
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant' // Cambio instantáneo para evitar animación
        });
      }
      
      // Volver el focus al buscador
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
      }
    }, 150); // Aumentar el delay para móvil
  };

  const cancelarCantidad = () => {
    // Guardar la posición actual del scroll antes de cancelar (solo en móvil)
    const scrollPosition = isMobile ? window.pageYOffset : 0;
    
    setMostrarCampoCantidad(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(0);
    setCantidadTemporalTexto('');
    setResultadoCalculo(null);
    setErrorCalculo(null);
    
    // Restaurar la posición del scroll y enfocar el buscador después de cancelar (solo en móvil)
    setTimeout(() => {
      if (isMobile) {
        // Restaurar la posición del scroll para mantener el buscador en su lugar
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant' // Cambio instantáneo para evitar animación
        });
      }
      
      // Enfocar el buscador
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
      }
    }, 150); // Aumentar el delay para móvil
  };

  const manejarScan = (codigo: string) => {
    setInputBusqueda(codigo);
    buscarProductos(codigo);
  };

  // Función para hacer scroll automático al último producto agregado
  const scrollToLastProduct = () => {
    if (listaProductosContadosRef.current && detallesConteo.length > 0) {
      const container = listaProductosContadosRef.current;
      const lastProductIndex = detallesConteo.length - 1;
      
      // Buscar el último elemento de producto en la lista
      const productElements = container.querySelectorAll('[data-product-index]');
      const lastProductElement = productElements[lastProductIndex] as HTMLElement;
      
      if (lastProductElement) {
        // Verificar si el contenedor tiene scroll disponible
        const hasScroll = container.scrollHeight > container.clientHeight;
        
        if (hasScroll) {
          // Calcular la posición del último elemento dentro del contenedor
          const containerHeight = container.clientHeight;
          const elementOffsetTop = lastProductElement.offsetTop;
          const elementHeight = lastProductElement.offsetHeight;
          const currentScrollTop = container.scrollTop;
          
          // Calcular si el elemento está visible en el área visible del contenedor
          const elementTop = elementOffsetTop - currentScrollTop;
          const elementBottom = elementTop + elementHeight;
          
          // Verificar si el elemento está completamente visible
          const isFullyVisible = elementTop >= 0 && elementBottom <= containerHeight;
          
          if (!isFullyVisible) {
            // Calcular la posición de scroll para que el último elemento quede visible
            const targetScrollTop = elementOffsetTop + elementHeight - containerHeight + 20; // 20px de margen
            
            // Hacer scroll solo dentro del contenedor, sin afectar la página
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          }
        }
      }
    }
  };

  const manejarEnterCantidadTemporal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmarCantidad();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelarCantidad();
    } else if (e.key === 'Backspace') {
      // ✅ NUEVO: Si el campo está vacío y presionan backspace, volver al buscador
      const inputElement = e.target as HTMLInputElement;
      if (!inputElement.value || inputElement.value.trim() === '') {
        e.preventDefault();
        cancelarCantidad();
        // Enfocar el buscador después de un pequeño delay
        setTimeout(() => {
          inputBusquedaRef.current?.focus();
        }, 100);
      }
    }
  };

  const iniciarEdicion = (detalle: DetalleConteo) => {
    setEditandoDetalle(detalle.id);
    
    // Si tiene fórmula, mostrar la fórmula; si no, mostrar el número
    if (detalle.formulaCalculo) {
      setNuevaCantidad(detalle.formulaCalculo);
    } else {
      setNuevaCantidad((detalle.cantidadConteo1 || detalle.cantidadConteo2 || detalle.cantidadContada)?.toString() || '');
    }
    
  };

  const cancelarEdicion = () => {
    setEditandoDetalle(null);
    setNuevaCantidad('');
  };

  const guardarEdicion = async () => {
    if (!editandoDetalle) return;

    // Determinar la cantidad final y la fórmula
    let cantidadFinal: number;
    let formulaFinal: string | null = null;
    
    if (nuevaCantidad.trim()) {
      // Verificar si la cantidad contiene operadores matemáticos
      if (/[+\-*/x()]/.test(nuevaCantidad)) {
        // Es una expresión matemática, evaluarla
        const resultadoEvaluacion = evaluarFormula(nuevaCantidad);
        if (resultadoEvaluacion !== null && resultadoEvaluacion > 0) {
          cantidadFinal = resultadoEvaluacion;
          formulaFinal = nuevaCantidad.trim(); // Guardar la fórmula original
        } else {
          toast.error('Error en la fórmula de cálculo o cantidad inválida');
          return;
        }
      } else {
        // Es un número simple
        const numero = parseInt(nuevaCantidad);
        if (isNaN(numero) || numero <= 0) {
          toast.error('Por favor ingresa una cantidad válida mayor a 0');
          return;
        }
        cantidadFinal = numero;
        
        // Cuando el usuario ingresa un número simple, usar ese número como fórmula
        // Esto permite cambiar de una fórmula compleja (3*2) a una simple (2)
        formulaFinal = nuevaCantidad.trim();
      }
    } else {
      toast.error('Por favor ingresa una cantidad válida');
      return;
    }

    // Actualizar el detalle
    setDetallesConteo(prev => {
      const nuevaLista = prev.map(detalle => {
        if (detalle.id === editandoDetalle) {
          // Determinar si es usuario 1 o 2 para actualizar el campo correcto
          const esUsuario1 = conteoInfo?.usuario1Id === datosUsuario?.id;
          const esUsuario2 = conteoInfo?.usuario2Id === datosUsuario?.id;
          
          if (esUsuario1) {
            return {
              ...detalle,
              cantidadConteo1: cantidadFinal,
              formulaCalculo1: formulaFinal
            } as DetalleConteo;
          } else if (esUsuario2) {
            return {
              ...detalle,
              cantidadConteo2: cantidadFinal,
              formulaCalculo2: formulaFinal
            } as DetalleConteo;
          } else {
            // Fallback al campo genérico
            return {
              ...detalle,
              cantidadConteo1: cantidadFinal,
              formulaCalculo: formulaFinal
            } as DetalleConteo;
          }
        }
        return detalle;
      });

      // Guardar en localStorage
      const progreso = {
        conteoInfo,
        detallesConteo: nuevaLista,
        timestamp: Date.now()
      };
      localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));

      return nuevaLista;
    });

    // ✅ SOLUCIÓN: Enviar cambios al backend usando el producto ID
    const detalleEditado = detallesConteo.find(d => d.id === editandoDetalle);
    if (detalleEditado && detalleEditado.producto?.id) {
      try {
        const token = localStorage.getItem('token');
        const baseUrl = API_CONFIG.getBaseUrl();
        
        console.log('🔄 Enviando cambios al backend usando producto ID:', {
          productoId: detalleEditado.producto.id,
          cantidadFinal: cantidadFinal,
          formulaFinal: formulaFinal,
          conteoSectorId: id
        });
        
        // Buscar el detalle real en el backend usando el producto ID
        const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (detallesResponse.ok) {
          const detallesBackend = await detallesResponse.json();
          const detalleReal = detallesBackend.find((d: any) => d.productoId === detalleEditado.producto.id);
          
          if (detalleReal) {
            console.log('🔍 Detalle real encontrado en backend:', {
              detalleId: detalleReal.id,
              productoId: detalleReal.productoId
            });
            
            // Actualizar el detalle real en el backend
            const updateResponse = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleReal.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                cantidad: cantidadFinal,
                formula: formulaFinal
              })
            });
            
            if (updateResponse.ok) {
              console.log('✅ Cambios enviados al backend exitosamente');
              
              // ✅ ACTUALIZAR SOLO EL DETALLE ESPECÍFICO en lugar de recargar toda la pantalla
              const detalleActualizado = await updateResponse.json();
              setDetallesConteo(prev => prev.map(detalle => {
                if (detalle.id === editandoDetalle) {
                  return {
                    ...detalle,
                    cantidadConteo1: detalleActualizado.cantidadConteo1 || detalle.cantidadConteo1,
                    cantidadConteo2: detalleActualizado.cantidadConteo2 || detalle.cantidadConteo2,
                    formulaCalculo1: detalleActualizado.formulaCalculo1 || detalle.formulaCalculo1,
                    formulaCalculo2: detalleActualizado.formulaCalculo2 || detalle.formulaCalculo2,
                    estado: detalleActualizado.estado || detalle.estado
                  };
                }
                return detalle;
              }));
              
              // Actualizar localStorage
              const progreso = {
                conteoInfo,
                detallesConteo: detallesConteo.map(detalle => {
                  if (detalle.id === editandoDetalle) {
                    return {
                      ...detalle,
                      cantidadConteo1: detalleActualizado.cantidadConteo1 || detalle.cantidadConteo1,
                      cantidadConteo2: detalleActualizado.cantidadConteo2 || detalle.cantidadConteo2,
                      formulaCalculo1: detalleActualizado.formulaCalculo1 || detalle.formulaCalculo1,
                      formulaCalculo2: detalleActualizado.formulaCalculo2 || detalle.formulaCalculo2,
                      estado: detalleActualizado.estado || detalle.estado
                    };
                  }
                  return detalle;
                }),
                timestamp: Date.now()
              };
              localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));
              
              toast.success('Entrada actualizada exitosamente');
            } else {
              const errorData = await updateResponse.json();
              console.error('❌ Error actualizando en backend:', errorData);
              toast.error('Error al actualizar en el servidor');
            }
          } else {
            console.error('❌ No se encontró el detalle real en el backend');
            toast.error('Error: No se encontró el detalle en el servidor');
          }
        } else {
          console.error('❌ Error obteniendo detalles del backend');
          toast.error('Error al obtener datos del servidor');
        }
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
        toast.error('Error al sincronizar con el servidor');
      }
    } else {
      console.error('❌ No se pudo encontrar el detalle editado o el producto ID');
      toast.error('Error: No se pudo encontrar el detalle');
    }
    
    cancelarEdicion();
  };

  const borrarDetalle = async (detalleId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      // Verificar si es un ID temporal (generado con Date.now()) o un ID real de base de datos
      const esIdTemporal = detalleId > 1000000000000; // Los timestamps de Date.now() son muy grandes
      
      console.log('🗑️ DEBUG BORRAR DETALLE:');
      console.log('  - DetalleId: ' + detalleId);
      console.log('  - EsIdTemporal: ' + esIdTemporal);
      console.log('  - Tipo: ' + (esIdTemporal ? 'TEMPORAL' : 'REAL DE BASE DE DATOS'));
      
      if (esIdTemporal) {
        // Es un detalle temporal, crear registro eliminado en la base de datos
        const detalleAEliminar = detallesConteo.find(d => d.id === detalleId);
        if (detalleAEliminar?.producto?.id) {
          try {
            // 🔧 SOLUCIÓN: Crear un registro eliminado en la base de datos
            const headers = {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            };

            const baseUrl = API_CONFIG.getBaseUrl();
            console.log('🚀 LLAMANDO AL ENDPOINT marcar-eliminado:');
            console.log('  - URL: ' + `${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles/marcar-eliminado`);
            console.log('  - Method: POST');
            console.log('  - Body: ' + JSON.stringify({
                productoId: detalleAEliminar.producto.id,
                cantidadConteo1: detalleAEliminar.cantidadConteo1,
                cantidadConteo2: detalleAEliminar.cantidadConteo2,
                formulaCalculo1: detalleAEliminar.formulaCalculo1,
                formulaCalculo2: detalleAEliminar.formulaCalculo2
              }));

            const response = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles/marcar-eliminado`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                productoId: detalleAEliminar.producto.id,
                cantidadConteo1: detalleAEliminar.cantidadConteo1,
                cantidadConteo2: detalleAEliminar.cantidadConteo2,
                formulaCalculo1: detalleAEliminar.formulaCalculo1,
                formulaCalculo2: detalleAEliminar.formulaCalculo2
              })
            });

            console.log('📡 RESPUESTA DEL ENDPOINT:');
            console.log('  - Status: ' + response.status);
            console.log('  - OK: ' + response.ok);
            console.log('  - URL: ' + response.url);

            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Detalle temporal marcado como eliminado en la base de datos');
              console.log('  - Response data: ' + JSON.stringify(responseData));
            } else {
              const errorData = await response.text();
              console.warn('⚠️ No se pudo marcar como eliminado en la base de datos, pero se elimina localmente');
              console.warn('  - Error: ' + errorData);
            }
          } catch (error) {
            console.error('❌ Error marcando detalle temporal como eliminado:', error);
          }

          // Marcar el producto como eliminado localmente
          const nuevoProductosEliminados = new Set([...productosEliminados, detalleAEliminar.producto.id]);
          setProductosEliminados(nuevoProductosEliminados);
          
          setDetallesConteo(prev => {
            const nuevaLista = prev.filter(detalle => detalle.id !== detalleId);

            // Guardar en localStorage
            const progreso = {
              conteoInfo,
              detallesConteo: nuevaLista,
              productosEliminados: Array.from(nuevoProductosEliminados),
              timestamp: Date.now()
            };
            localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));

            return nuevaLista;
          });
        } else {
          setDetallesConteo(prev => {
            const nuevaLista = prev.filter(detalle => detalle.id !== detalleId);

            // Guardar en localStorage
            const progreso = {
              conteoInfo,
              detallesConteo: nuevaLista,
              productosEliminados: Array.from(productosEliminados),
              timestamp: Date.now()
            };
            localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));

            return nuevaLista;
          });
        }

        toast.success('Entrada eliminada exitosamente');
        
        // ✅ NO RECARGAR: El estado local ya se actualizó correctamente
        console.log('✅ Detalle temporal eliminado del estado local, sin necesidad de recargar');
      } else {
        // Es un detalle real de base de datos, llamar al backend
        try {
          const headers = {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          };

          const baseUrl = API_CONFIG.getBaseUrl();
          const response = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleId}`, {
            method: 'DELETE',
            headers
          });

          if (response.ok) {
            // Eliminar del estado local
            setDetallesConteo(prev => {
              const nuevaLista = prev.filter(detalle => detalle.id !== detalleId);

              // Guardar en localStorage
              const progreso = {
                conteoInfo,
                detallesConteo: nuevaLista,
                productosEliminados: Array.from(productosEliminados),
                timestamp: Date.now()
              };
              localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify(progreso));

            return nuevaLista;
          });

            toast.success('Entrada eliminada exitosamente');
            
            // ✅ NO RECARGAR: El estado local ya se actualizó correctamente
            console.log('✅ Detalle real eliminado del estado local, sin necesidad de recargar');
          } else {
            const errorData = await response.json();
            toast.error(`Error al eliminar: ${errorData.error || 'Error desconocido'}`);
          }
        } catch (error) {
          console.error('Error eliminando detalle:', error);
          toast.error('Error al eliminar la entrada');
        }
      }
    }
  };

  const filtrarProductosContados = (filtro: string) => {
    setFiltroProductosContados(filtro);
  };

  const productosContadosFiltrados = detallesConteo.filter(detalle => {
    if (!filtroProductosContados.trim()) return true;
    
    const filtro = filtroProductosContados.toLowerCase();
    
    // Adaptar para la nueva estructura de DTOs del backend
    const nombreProducto = detalle.producto?.nombre || '';
    const codigoProducto = detalle.producto?.codigoPersonalizado || '';
    const codigoBarras = (detalle.producto && detalle.producto.codigoBarras) || '';
    const formulaCalculo = detalle.formulaCalculo1 || detalle.formulaCalculo2 || detalle.formulaCalculo || '';
    const cantidad = detalle.cantidadConteo1 || detalle.cantidadConteo2 || detalle.cantidadContada || 0;
    
    return (
      nombreProducto.toLowerCase().includes(filtro) ||
      (codigoProducto && codigoProducto.toLowerCase().includes(filtro)) ||
      (codigoBarras && codigoBarras.includes(filtro)) ||
      (formulaCalculo && formulaCalculo.toLowerCase().includes(filtro)) ||
      cantidad.toString().includes(filtro)
    );
  });


  const esUsuario1 = conteoInfo?.usuario1Id === datosUsuario?.id;
  const usuarioActual = esUsuario1 ? 
    { nombre: conteoInfo?.usuario1Nombre?.split(' ')[0] || '', apellidos: conteoInfo?.usuario1Nombre?.split(' ').slice(1).join(' ') || '' } :
    { nombre: conteoInfo?.usuario2Nombre?.split(' ')[0] || '', apellidos: conteoInfo?.usuario2Nombre?.split(' ').slice(1).join(' ') || '' };

  if (cargando) {
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
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando conteo de sector...</p>
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
          <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Conteo no encontrado</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>El conteo de sector solicitado no existe o no tienes permisos para acceder.</p>
          <button
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Volver a Inventario Completo
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Patrón de fondo sutil y profesional */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }}></div>
        {/* ✅ NUEVO: Navbar con animación de ocultamiento en móvil */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transform: isMobile ? (navbarVisible ? 'translateY(0)' : 'translateY(-100%)') : 'translateY(0)',
          transition: 'transform 0.3s ease-in-out'
        }}>
          <NavbarAdmin
            onCerrarSesion={cerrarSesion}
            empresaNombre={datosUsuario?.empresaNombre}
            nombreAdministrador={datosUsuario?.nombre}
          />
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: isMobile ? '8rem' : '9rem',
          paddingBottom: isMobile ? '1rem' : '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: isMobile ? '1.8rem' : '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}>
              {esModoReconteo ? '🔍 Reconteo de Productos con Diferencias' : `📊 Conteo de Sector - ${conteoInfo.sectorNombre}`}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: isMobile ? '1rem' : '1.2rem',
              margin: 0,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {esModoReconteo ? 'Revisa y corrige las cantidades de los productos que tuvieron diferencias' : 
               `Inventario Completo - Usuario: ${usuarioActual?.nombre} ${usuarioActual?.apellidos}`}
            </p>
          </div>

          {/* Información del conteo */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1e293b',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                Sector: {conteoInfo.sectorNombre}
              </h2>
              <span style={{
                background: conteoInfo.estado === 'EN_PROGRESO' ? '#3b82f6' : 
                           conteoInfo.estado === 'COMPLETADO' ? '#10b981' : '#f59e0b',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '1rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {conteoInfo.estado === 'EN_PROGRESO' ? 'En Progreso' :
                 conteoInfo.estado === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
              </span>
            </div>

            {/* Estadísticas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '0.25rem'
                }}>
                  {conteoInfo.totalProductos}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  Total Productos
                </div>
              </div>
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                  marginBottom: '0.25rem'
                }}>
                  {conteoInfo.productosContados}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  Productos Contados
                </div>
              </div>
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#7c3aed',
                  marginBottom: '0.25rem'
                }}>
                  {conteoInfo.porcentajeCompletado.toFixed(1)}%
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  Progreso
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '0.5rem',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                height: '100%',
                width: `${conteoInfo.porcentajeCompletado}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>

            {/* Usuarios asignados - Diseño compacto en una sola fila */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.5rem',
              padding: isMobile ? '0.75rem' : '1rem',
              border: '1px solid #e2e8f0',
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#64748b',
                fontWeight: '600'
              }}>
                👥 Usuarios:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: isMobile ? '1 1 100%' : '0 1 auto'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '0.375rem',
                  padding: '0.4rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {conteoInfo.usuario1Nombre || 'Usuario 1: No asignado'}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.75rem'
                }}>
                  •
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '0.375rem',
                  padding: '0.4rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {conteoInfo.usuario2Nombre || 'Usuario 2: No asignado'}
                </div>
              </div>
            </div>

            {/* Botón para iniciar conteo - solo si aún está pendiente y no viene con autoStart */}
            {conteoInfo.estado === 'PENDIENTE' && !vieneConAutoStart && (
              <div style={{
                marginTop: '1.5rem',
                textAlign: 'center'
              }}>
                <button
                  onClick={iniciarConteo}
                  disabled={iniciando}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: iniciando ? 'not-allowed' : 'pointer',
                    opacity: iniciando ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {iniciando ? 'Iniciando...' : '🚀 Iniciar Conteo'}
                </button>
              </div>
            )}
          </div>

          {/* Contenido principal - Interfaz condicional */}
          {(() => {
            console.log('🔍 RENDER - esModoReconteo:', esModoReconteo);
            console.log('🔍 RENDER - conteoInfo.estado:', conteoInfo?.estado);
            console.log('🔍 RENDER - detallesConteo.length:', detallesConteo.length);
            return null;
          })()}
          {esModoReconteo ? (
            /* Interfaz de Reconteo */
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1.5rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔍 Productos con Diferencias ({detallesConteo.length})
              </h2>
              
              {/* Filtro de productos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: isMobile ? '0.75rem' : '0.5rem'
                }}>
                  🔍 Filtrar Productos
                </label>
                <input
                  type="text"
                  value={filtroProductosContados}
                  onChange={(e) => setFiltroProductosContados(e.target.value)}
                  placeholder="Buscar por nombre, código o cantidad..."
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                />
              </div>

              {/* Lista de productos con diferencias */}
              <div style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                backgroundColor: '#f8fafc'
              }}>
                {detallesConteo
                  .filter(detalle => {
                    const filtro = filtroProductosContados.toLowerCase();
                    const nombreProducto = detalle.producto?.nombre?.toLowerCase() || '';
                    const codigoProducto = detalle.producto?.codigoPersonalizado?.toLowerCase() || '';
                    const totalUsuario1 = detalle.cantidadConteo1?.toString() || '';
                    const totalUsuario2 = detalle.cantidadConteo2?.toString() || '';
                    const diferencia = detalle.diferenciaEntreConteos?.toString() || '';
                    
                    return (
                      nombreProducto.includes(filtro) ||
                      codigoProducto.includes(filtro) ||
                      totalUsuario1.includes(filtro) ||
                      totalUsuario2.includes(filtro) ||
                      diferencia.includes(filtro)
                    );
                  })
                  .map((detalle, index) => (
                    <div
                      key={detalle.id}
                      style={{
                        padding: isMobile ? '1rem' : '0.75rem',
                        borderBottom: index < detallesConteo.length - 1 ? '1px solid #e2e8f0' : 'none',
                        backgroundColor: 'white',
                        margin: '0.25rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            {detalle.producto?.nombre}
                          </h3>
                          <p style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: isMobile ? '0.875rem' : '0.75rem',
                            color: '#64748b'
                          }}>
                            Código: {detalle.producto?.codigoPersonalizado || 'N/A'}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: isMobile ? '0.875rem' : '0.75rem',
                            color: '#64748b'
                          }}>
                            Stock Sistema: {detalle.stockSistema?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>

                      {/* Comparación de conteos en una sola fila */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        {/* Conteo Usuario 1 */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.625rem',
                            color: '#64748b',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            Usuario 1
                          </div>
                          <div style={{
                            fontSize: isMobile ? '1.25rem' : '1rem',
                            fontWeight: 'bold',
                            color: '#3b82f6',
                            marginBottom: '0.25rem'
                          }}>
                            {detalle.cantidadConteo1?.toLocaleString() || 0}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.625rem' : '0.5rem',
                            color: '#6b7280',
                            fontStyle: 'italic',
                            backgroundColor: '#e5e7eb',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            marginTop: '0.125rem',
                            textAlign: 'center'
                          }}>
                            {detalle.formulaCalculo1 || 'Sin fórmula'}
                          </div>
                        </div>

                        {/* Conteo Usuario 2 */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.625rem',
                            color: '#64748b',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            Usuario 2
                          </div>
                          <div style={{
                            fontSize: isMobile ? '1.25rem' : '1rem',
                            fontWeight: 'bold',
                            color: '#10b981',
                            marginBottom: '0.25rem'
                          }}>
                            {detalle.cantidadConteo2?.toLocaleString() || 0}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.625rem' : '0.5rem',
                            color: '#6b7280',
                            fontStyle: 'italic',
                            backgroundColor: '#e5e7eb',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            marginTop: '0.125rem',
                            textAlign: 'center'
                          }}>
                            {detalle.formulaCalculo2 || 'Sin fórmula'}
                          </div>
                        </div>

                        {/* Diferencia */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.625rem',
                            color: '#dc2626',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            Diferencia
                          </div>
                          <div style={{
                            fontSize: isMobile ? '1.25rem' : '1rem',
                            fontWeight: 'bold',
                            color: '#dc2626',
                            marginBottom: '0.25rem'
                          }}>
                            {detalle.diferenciaEntreConteos || 0}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.625rem' : '0.5rem',
                            color: '#dc2626',
                            fontStyle: 'italic',
                            backgroundColor: '#fef2f2',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            marginTop: '0.125rem',
                            border: '1px solid #fecaca'
                          }}>
                            ⚠️ Revisar
                          </div>
                        </div>
                      </div>

                      {/* Detalle de conteos individuales */}
                      {detalle.todosLosDetallesDelProducto && detalle.todosLosDetallesDelProducto.length > 1 && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '0.5rem',
                          border: '1px solid #cbd5e1'
                        }}>
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.625rem',
                            color: '#475569',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            textAlign: 'center'
                          }}>
                            📋 Historial de Conteos Individuales
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem'
                          }}>
                            {/* Conteos Usuario 1 */}
                            <div>
                              <div style={{
                                fontSize: isMobile ? '0.625rem' : '0.5rem',
                                color: '#3b82f6',
                                fontWeight: '600',
                                marginBottom: '0.25rem',
                                textAlign: 'center'
                              }}>
                                Usuario 1
                              </div>
                              {detalle.todosLosDetallesDelProducto
                                .filter(d => d.cantidadConteo1 != null)
                                .map((conteo, index) => (
                                <div key={conteo.id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#dbeafe',
                                  borderRadius: '0.25rem',
                                  marginBottom: '0.25rem',
                                  fontSize: isMobile ? '0.625rem' : '0.5rem'
                                }}>
                                  <span style={{ fontWeight: 'bold', color: '#1e40af' }}>
                                    #{index + 1}
                                  </span>
                                  <span style={{ color: '#1e40af' }}>
                                    {conteo.cantidadConteo1}
                                  </span>
                                  {conteo.formulaCalculo1 && (
                                    <span style={{ 
                                      color: '#6b7280', 
                                      fontStyle: 'italic',
                                      fontSize: isMobile ? '0.5rem' : '0.4rem'
                                    }}>
                                      ({conteo.formulaCalculo1})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Conteos Usuario 2 */}
                            <div>
                              <div style={{
                                fontSize: isMobile ? '0.625rem' : '0.5rem',
                                color: '#10b981',
                                fontWeight: '600',
                                marginBottom: '0.25rem',
                                textAlign: 'center'
                              }}>
                                Usuario 2
                              </div>
                              {detalle.todosLosDetallesDelProducto
                                .filter(d => d.cantidadConteo2 != null)
                                .map((conteo, index) => (
                                <div key={conteo.id} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#d1fae5',
                                  borderRadius: '0.25rem',
                                  marginBottom: '0.25rem',
                                  fontSize: isMobile ? '0.625rem' : '0.5rem'
                                }}>
                                  <span style={{ fontWeight: 'bold', color: '#047857' }}>
                                    #{index + 1}
                                  </span>
                                  <span style={{ color: '#047857' }}>
                                    {conteo.cantidadConteo2}
                                  </span>
                                  {conteo.formulaCalculo2 && (
                                    <span style={{ 
                                      color: '#6b7280', 
                                      fontStyle: 'italic',
                                      fontSize: isMobile ? '0.5rem' : '0.4rem'
                                    }}>
                                      ({conteo.formulaCalculo2})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Campo para nueva cantidad/fórmula */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: isMobile ? '0.875rem' : '0.75rem',
                          fontWeight: '600',
                          color: '#64748b',
                          marginBottom: '0.25rem'
                        }}>
                          Nueva Cantidad o Fórmula
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: 25 o 5*5 o 10+15"
                          value={nuevasCantidades[detalle.id]?.cantidad || ''}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            backgroundColor: '#f8fafc',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.backgroundColor = 'white';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.backgroundColor = '#f8fafc';
                          }}
                          onChange={(e) => {
                            manejarCambioCantidad(detalle.id, e.target.value);
                          }}
                        />
                        {nuevasCantidades[detalle.id]?.resultado !== null && nuevasCantidades[detalle.id]?.cantidad && (
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.625rem',
                            color: '#10b981',
                            marginTop: '0.25rem',
                            fontWeight: '600',
                            backgroundColor: '#f0fdf4',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #bbf7d0'
                          }}>
                            ✅ Resultado: {nuevasCantidades[detalle.id]?.resultado?.toLocaleString()} unidades
                          </div>
                        )}
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.625rem',
                          color: '#64748b',
                          marginTop: '0.25rem',
                          fontStyle: 'italic'
                        }}>
                          💡 Puedes usar: +, -, *, /, x, paréntesis. Ej: 5*5, 10+15, (20-5)*2
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Botones de acción */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setEsModoReconteo(false);
                    navigate('/admin/inventario-completo');
                  }}
                  style={{
                    padding: isMobile ? '0.875rem 1.5rem' : '0.75rem 1.25rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                  }}
                >
                  ← Volver
                </button>
                <button
                  style={{
                    padding: isMobile ? '0.875rem 1.5rem' : '0.75rem 1.25rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                >
                  ✅ Finalizar Reconteo
                </button>
              </div>
            </div>
          ) : (
            /* Interfaz Normal de Conteo */
            (vieneConAutoStart || conteoInfo.estado === 'EN_PROGRESO' || conteoInfo.estado === 'COMPLETADO' || conteoInfo.estado === 'REVISION') && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '0.8fr 1.4fr 0.8fr',
              gap: '2rem'
            }}>
              {/* Panel izquierdo - Búsqueda y creación de productos */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: 'fit-content',
                backdropFilter: 'blur(10px)'
              }}>
                {/* Búsqueda de productos - Sin título redundante */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: isMobile ? '0.75rem' : '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {mostrarCampoCantidad ? '📊 Cantidad' : '🛒 Agregar Productos'}
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '0.5rem',
                    alignItems: 'end'
                  }}>
                    {!mostrarCampoCantidad && (
                      <div style={{ position: 'relative' }}>
                        <input
                          ref={inputBusquedaRef}
                          type="text"
                          placeholder="Buscar por nombre, código de barras o código personalizado..."
                          value={inputBusqueda}
                          onChange={(e) => buscarProductos(e.target.value)}
                          onKeyDown={manejarTeclas}
                          style={{
                            width: '100%',
                            padding: isMobile ? '1rem' : '0.75rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            minHeight: isMobile ? '48px' : 'auto'
                          }}
                        />
                  
                      {/* Lista de productos filtrados */}
                      {mostrarProductos && productosFiltrados.length > 0 && (
                        <div
                          ref={listaProductosRef}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            maxHeight: '320px',
                            overflow: 'auto',
                            paddingTop: '0.5rem',
                            paddingBottom: '0.5rem'
                          }}>
                          {productosFiltrados.map((producto, index) => {
                              const detallesExistentes = detallesConteo.filter(d => d.producto?.id === producto.id);
                              const cantidadTotal = detallesExistentes.reduce((sum, d) => sum + (d.cantidadConteo1 || d.cantidadConteo2 || d.cantidadContada || 0), 0);
                              
                              return (
                                <div
                                  key={producto.id}
                                  onClick={() => agregarProducto(producto)}
                                  style={{
                                    padding: isMobile ? '0.75rem' : '0.5rem',
                                    cursor: 'pointer',
                                    borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    background: index === productoSeleccionado ? '#3b82f6' : 
                                               detallesExistentes.length > 0 ? '#f0fdf4' : 'white',
                                    color: index === productoSeleccionado ? 'white' : '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '1rem' : '0.75rem',
                                    borderRadius: index === productoSeleccionado ? '0.375rem' : '0',
                                    boxShadow: index === productoSeleccionado ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                                    minHeight: isMobile ? '60px' : 'auto'
                                  }}
                                  onMouseEnter={() => setProductoSeleccionado(index)}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      fontWeight: '600',
                                      color: index === productoSeleccionado ? 'white' : '#1e293b',
                                      fontSize: isMobile ? '0.95rem' : '0.8rem',
                                      lineHeight: '1.3'
                                    }}>
                                      {producto.codigoPersonalizado ? (
                                        <>
                                          <span style={{ 
                                            color: index === productoSeleccionado ? '#bfdbfe' : '#3b82f6', 
                                            fontWeight: '700' 
                                          }}>
                                            {producto.codigoPersonalizado}
                                          </span>
                                          <br />
                                          {producto.nombre}
                                        </>
                                      ) : (
                                        producto.nombre
                                      )}
                                    </div>
                                    <div style={{
                                      color: index === productoSeleccionado ? '#e2e8f0' : '#64748b',
                                      fontSize: isMobile ? '0.8rem' : '0.7rem',
                                      marginTop: '0.25rem'
                                    }}>
                                      Stock disponible: {producto.stock}
                                      {detallesExistentes.length > 0 && (
                                        <span style={{ 
                                          color: index === productoSeleccionado ? '#e2e8f0' : '#059669',
                                          fontWeight: '600',
                                          marginLeft: '0.5rem'
                                        }}>
                                          • Total contado: {cantidadTotal}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                      </div>
                    )}

                    {/* Campo de cantidad temporal */}
                    {mostrarCampoCantidad && (
                      <div style={{ position: 'relative' }}>
                        {/* Botón de cancelar (solo móvil) */}
                        {isMobile && (
                          <button
                            onClick={cancelarCantidad}
                            style={{
                              position: 'absolute',
                              right: '0.5rem',
                              top: '0.5rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                              transition: 'all 0.2s ease'
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.transform = 'scale(0.9)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            ✕
                          </button>
                        )}
                        
                        <input
                          ref={cantidadTemporalRef}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9+\-*/.x() ]*"
                          value={cantidadTemporalTexto || cantidadTemporal || ''}
                          onChange={(e) => {
                            const valor = e.target.value;
                            setCantidadTemporalTexto(valor);
                            // También actualizar el valor numérico si es un número simple
                            const numero = parseInt(valor);
                            if (!isNaN(numero) && !/[+\-*/x()]/.test(valor)) {
                              setCantidadTemporal(numero);
                            } else if (valor === '') {
                              setCantidadTemporal(0);
                            }
                            
                            // Evaluar fórmula en tiempo real
                            if (valor.trim() && /[+\-*/x()]/.test(valor)) {
                              evaluarFormula(valor);
                            } else {
                              setResultadoCalculo(null);
                              setErrorCalculo(null);
                            }
                          }}
                          onKeyDown={manejarEnterCantidadTemporal}
                          placeholder="Ej: 336, 3*112, 3x60..."
                          style={{
                            width: '100%',
                            padding: isMobile ? '1rem' : '0.75rem',
                            paddingRight: isMobile ? '3rem' : '0.75rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: isMobile ? '1.2rem' : '0.875rem',
                            minHeight: isMobile ? '48px' : 'auto'
                          }}
                        />
                      
                      {/* Botones rápidos para operadores matemáticos (solo móvil) */}
                      {isMobile && (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          justifyContent: 'center'
                        }}>
                          {['+', '-', '*', 'x', '(', ')'].map(op => (
                            <button
                              key={op}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Evita que el botón quite el foco
                              }}
                              onClick={() => {
                                const nuevoValor = (cantidadTemporalTexto || '') + op;
                                setCantidadTemporalTexto(nuevoValor);
                                // Evaluar si ya es una fórmula
                                if (/[+\-*/x()]/.test(nuevoValor)) {
                                  evaluarFormula(nuevoValor);
                                }
                                // Mantener el foco en el input después de hacer clic
                                setTimeout(() => {
                                  if (inputCantidadRef.current) {
                                    inputCantidadRef.current.focus();
                                  }
                                }, 10);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                minWidth: '40px',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.2s ease'
                              }}
                              onTouchStart={(e) => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                              }}
                              onTouchEnd={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Mostrar resultado del cálculo en tiempo real */}
                      {resultadoCalculo !== null && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#10b981',
                          marginTop: '0.25rem',
                          fontWeight: '600',
                          background: '#f0fdf4',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0'
                        }}>
                          ✅ Resultado: {resultadoCalculo.toLocaleString()} unidades
                        </div>
                      )}
                      
                      {errorCalculo && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#ef4444',
                          marginTop: '0.25rem',
                          fontWeight: '600',
                          background: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          ❌ {errorCalculo}
                        </div>
                      )}
                      
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          marginTop: '0.25rem',
                          lineHeight: '1.2'
                        }}>
                          💡 Puedes usar: +, -, *, /, x, paréntesis
                        </div>
                      </div>
                    )}
                </div>

                {/* Vista previa del producto seleccionado */}
                {mostrarCampoCantidad && productoSeleccionadoTemporal && (
                  <div 
                    onClick={isMobile ? confirmarCantidad : undefined}
                    style={{
                      background: isMobile ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                      borderRadius: '0.5rem',
                      padding: isMobile ? '1rem' : '0.75rem',
                      border: isMobile ? 'none' : '2px solid #3b82f6',
                      marginTop: '0.5rem',
                      fontSize: isMobile ? '0.875rem' : '0.75rem',
                      cursor: isMobile ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600', 
                      color: isMobile ? 'white' : '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {productoSeleccionadoTemporal.nombre}
                    </div>
                    <div style={{ 
                      color: isMobile ? '#e2e8f0' : '#64748b',
                      fontSize: isMobile ? '0.75rem' : '0.7rem'
                    }}>
                      {productoSeleccionadoTemporal.codigoPersonalizado && `Código: ${productoSeleccionadoTemporal.codigoPersonalizado}`}
                      {productoSeleccionadoTemporal.codigoBarras && ` • Barras: ${productoSeleccionadoTemporal.codigoBarras}`}
                      {` • Stock: ${productoSeleccionadoTemporal.stock}`}
                    </div>
                    {isMobile && (
                      <div style={{
                        color: '#e2e8f0',
                        fontSize: '0.7rem',
                        marginTop: '0.25rem',
                        textAlign: 'center'
                      }}>
                        Toca para confirmar
                      </div>
                    )}
                  </div>
                    )}

                  {/* Scanner de códigos de barras */}
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => setMostrarScanner(true)}
                      style={{
                        width: '100%',
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      📷 Escanear Código de Barras
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel central - Lista de productos contados */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                {/* Campo de filtrado - Sin título redundante */}
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder={`🔍 Filtrar lista (${productosContadosFiltrados.length}${filtroProductosContados ? ` de ${detallesConteo.length}` : ''})...`}
                    value={filtroProductosContados}
                    onChange={(e) => filtrarProductosContados(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: '#f8fafc',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {filtroProductosContados && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>🔍</span>
                      <span>Mostrando {productosContadosFiltrados.length} de {detallesConteo.length} productos</span>
                      <button
                        onClick={() => filtrarProductosContados('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ✕ Limpiar
                      </button>
                    </div>
                  )}
                </div>
                
                {productosContadosFiltrados.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6b7280',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <p>{filtroProductosContados ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos contados aún'}</p>
                    <p style={{ fontSize: '0.875rem' }}>Busca y agrega productos en el panel izquierdo</p>
                  </div>
                ) : (
                  <div 
                    ref={listaProductosContadosRef}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '0.75rem',
                      border: '2px solid #e2e8f0',
                      overflow: 'hidden',
                      height: isMobile ? '450px' : '350px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '0.5rem',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                    }}>
                    {productosContadosFiltrados.map((detalle, index) => {
                      const estaEditando = editandoDetalle === detalle.id;
                      
                      return (
                        <div
                          key={detalle.id}
                          data-product-index={index}
                          style={{
                            padding: isMobile ? '1rem' : '1rem',
                            borderBottom: 'none',
                            background: estaEditando ? '#fef3c7' : (index % 2 === 0 ? '#ffffff' : '#f8fafc'),
                            border: estaEditando ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            marginBottom: '0.75rem',
                            boxShadow: estaEditando ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            if (!estaEditando) {
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!estaEditando) {
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {estaEditando ? (
                            // Modo edición simplificado
                            <div>
                              <div style={{ 
                                fontWeight: '600', 
                                color: '#1e293b',
                                fontSize: isMobile ? '1rem' : '0.875rem',
                                marginBottom: '0.75rem'
                              }}>
                                ✏️ Editando: {detalle.producto.nombre}
                              </div>
                              
                              <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{
                                  display: 'block',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: '#374151',
                                  marginBottom: '0.25rem'
                                }}>
                                  Cantidad / Cálculo
                                </label>
                                <input
                                  type="text"
                                  value={nuevaCantidad}
                                  onChange={(e) => {
                                    setNuevaCantidad(e.target.value);
                                    // Evaluar fórmula en tiempo real
                                    if (e.target.value.trim() && /[+\-*/x()]/.test(e.target.value)) {
                                      evaluarFormula(e.target.value);
                                    } else {
                                      setResultadoCalculo(null);
                                      setErrorCalculo(null);
                                    }
                                  }}
                                  placeholder="Ej: 336, 3*112, 3x60..."
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                                
                                {resultadoCalculo !== null && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#10b981',
                                    marginTop: '0.25rem',
                                    fontWeight: '600'
                                  }}>
                                    ✅ Resultado: {resultadoCalculo.toLocaleString()} unidades
                                  </div>
                                )}
                                
                                {errorCalculo && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#ef4444',
                                    marginTop: '0.25rem',
                                    fontWeight: '600'
                                  }}>
                                    ❌ {errorCalculo}
                                  </div>
                                )}
                              </div>

                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'flex-end'
                              }}>
                                <button
                                  onClick={cancelarEdicion}
                                  style={{
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={guardarEdicion}
                                  style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Modo visualización - Diseño compacto para móvil
                            <div>
                              {/* Primera fila: Nombre + Cantidad */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{ flex: 1 }}>
                                  {/* Código personalizado arriba - MÁS DESTACADO */}
                                  {detalle.producto?.codigoPersonalizado && (
                                    <div style={{ 
                                      fontSize: isMobile ? '0.85rem' : '0.75rem',
                                      fontWeight: '700',
                                      color: '#7c3aed',
                                      background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      display: 'inline-block',
                                      marginBottom: '0.35rem',
                                      border: '1.5px solid #c4b5fd',
                                      letterSpacing: '0.025em',
                                      boxShadow: '0 1px 2px rgba(124, 58, 237, 0.1)'
                                    }}>
                                      {detalle.producto?.codigoPersonalizado}
                                    </div>
                                  )}
                                  <div style={{ 
                                    fontWeight: '600', 
                                    color: '#1e293b',
                                    fontSize: isMobile ? '0.9rem' : '0.875rem',
                                    lineHeight: '1.3'
                                  }}>
                                    {detalle.producto?.nombre || 'Producto sin nombre'}
                                  </div>
                                </div>
                                
                                {/* Cantidad a la derecha del nombre */}
                                <div style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  padding: isMobile ? '0.4rem 0.75rem' : '0.5rem',
                                  borderRadius: '0.5rem',
                                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                                  fontWeight: '700',
                                  minWidth: isMobile ? '50px' : '60px',
                                  textAlign: 'center',
                                  flexShrink: 0
                                }}>
                                  {detalle.cantidadConteo1 || detalle.cantidadConteo2 || detalle.cantidadContada || 0}
                                </div>
                              </div>
                              
                              {/* Segunda fila: Fórmula (si existe) */}
                              {(detalle.formulaCalculo1 || detalle.formulaCalculo2 || detalle.formulaCalculo) && (
                                <div style={{ 
                                  fontSize: isMobile ? '0.75rem' : '0.7rem', 
                                  color: '#059669',
                                  background: '#ecfdf5',
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #bbf7d0',
                                  marginBottom: '0.5rem'
                                }}>
                                  📐 {detalle.formulaCalculo1 || detalle.formulaCalculo2 || detalle.formulaCalculo}
                                </div>
                              )}
                              
                              {/* Tercera fila: Botones en horizontal */}
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem'
                              }}>
                                <button
                                  onClick={() => iniciarEdicion(detalle)}
                                  style={{
                                    flex: 1,
                                    background: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    padding: isMobile ? '0.6rem' : '0.5rem',
                                    fontSize: isMobile ? '0.85rem' : '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                    minHeight: isMobile ? '36px' : '32px'
                                  }}
                                  title="Editar entrada"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => borrarDetalle(detalle.id)}
                                  style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    padding: isMobile ? '0.6rem' : '0.5rem',
                                    fontSize: isMobile ? '0.85rem' : '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                    minHeight: isMobile ? '36px' : '32px'
                                  }}
                                  title="Borrar entrada"
                                >
                                  🗑️ Borrar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Panel derecho - Información y acciones */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: 'fit-content',
                backdropFilter: 'blur(10px)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 Resumen del Conteo
                </h2>

                {/* Estadísticas del conteo */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Registros cargados
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                      {detallesConteo.length}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Total del sector
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                      {conteoInfo.totalProductos}
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Progreso
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#3b82f6' }}>
                      {conteoInfo.porcentajeCompletado}%
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${conteoInfo.porcentajeCompletado}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'row' : 'column', 
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  gap: isMobile ? '0.75rem' : '0.75rem',
                  justifyContent: isMobile ? 'space-between' : 'stretch'
                }}>
                  {/* Botón Finalizar Conteo */}
                  <button
                    onClick={async () => {
                      if (window.confirm('¿Estás seguro de que quieres finalizar este conteo? Una vez finalizado, no podrás agregar más productos.')) {
                        try {
                          setGuardando(true);
                          const token = localStorage.getItem('token');
                          const baseUrl = API_CONFIG.getBaseUrl();
                          
                          // Primero sincronizar todos los productos con el servidor
                          let sincronizados = 0;
                          let errores = 0;

                          console.log('🔍 DEBUG sincronización:');
                          console.log('  - Total detalles:', detallesConteo.length);
                          console.log('  - Productos eliminados:', Array.from(productosEliminados));
                          console.log('  - Detalles a sincronizar:');

                          for (const detalle of detallesConteo) {
                            const esTemporal = detalle.id > 1000000000000;
                            const tieneProducto = detalle.producto?.id;
                            const noEliminado = !productosEliminados.has(detalle.producto?.id || 0);
                            
                            console.log(`    - Producto ${detalle.producto?.id} (${detalle.producto?.nombre}):`, {
                              esTemporal,
                              tieneProducto,
                              noEliminado,
                              sincronizar: esTemporal && tieneProducto && noEliminado
                            });

                            // ✅ ELIMINADO: Esta sincronización duplicada ya no es necesaria
                            // La sincronización automática (línea 813) ya maneja esto
                          }

                          // ✅ ELIMINADO: Esta sincronización de productos eliminados ya no es necesaria
                          // Los productos eliminados se marcan automáticamente cuando el usuario los elimina
                          console.log('ℹ️ Los productos eliminados ya se marcan automáticamente al eliminarlos');

                          if (errores > 0) {
                            toast.error(`${errores} productos no pudieron sincronizarse. No se puede finalizar el conteo.`);
                            return;
                          }

                          if (sincronizados > 0) {
                            toast.success(`${sincronizados} productos sincronizados con el servidor`);
                          }
                          
                          // Ahora finalizar el conteo
                          const response = await fetch(`${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/${conteoInfo?.inventarioCompleto?.id}/conteos-sector/${id}/finalizar`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              usuarioId: datosUsuario?.id
                            })
                          });

                          if (response.ok) {
                            toast.success('Conteo finalizado exitosamente');
                            // Limpiar progreso guardado
                            localStorage.removeItem(`conteo-progreso-${id}`);
                            // Limpiar productos eliminados
                            setProductosEliminados(new Set());
                            // Redirigir a la página de inventario completo
                            navigate('/admin/inventario-completo');
                          } else {
                            const errorData = await response.json();
                            toast.error(errorData.mensaje || 'Error al finalizar el conteo');
                          }
                        } catch (error) {
                          console.error('Error finalizando conteo:', error);
                          toast.error('Error al finalizar el conteo');
                        } finally {
                          setGuardando(false);
                        }
                      }
                    }}
                    disabled={guardando || detallesConteo.length === 0}
                    style={{
                      width: isMobile ? '48%' : '100%',
                      padding: isMobile ? '1rem 0.75rem' : '0.75rem',
                      background: (guardando || detallesConteo.length === 0) ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '0.9rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: (guardando || detallesConteo.length === 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minHeight: isMobile ? '48px' : 'auto'
                    }}
                  >
                    {guardando ? '⏳ Finalizando...' : '🏁 Finalizar Conteo'}
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        // Intentar sincronizar todos los productos con el servidor
                        const token = localStorage.getItem('token');
                        let sincronizados = 0;
                        let errores = 0;

                        // ✅ ELIMINADO: Esta sincronización duplicada ya no es necesaria
                        // La sincronización automática (línea 813) ya maneja esto
                        console.log('ℹ️ Sincronización automática ya maneja los productos agregados');

                        // ✅ ELIMINADO: Esta sincronización de productos eliminados ya no es necesaria
                        // Los productos eliminados se marcan automáticamente cuando el usuario los elimina
                        console.log('ℹ️ Los productos eliminados ya se marcan automáticamente al eliminarlos');

                        if (sincronizados > 0) {
                          toast.success(`${sincronizados} productos sincronizados con el servidor`);
                        }
                        if (errores > 0) {
                          toast.error(`${errores} productos no pudieron sincronizarse`);
                        }
                        
                        // Recargar datos del servidor para reflejar los cambios
                        await cargarDatos();
                        
                        // Limpiar productos eliminados después de sincronizar
                        setProductosEliminados(new Set());
                      } catch (error) {
                        toast.error('Error al sincronizar con el servidor');
                      }
                    }}
                    style={{
                      width: isMobile ? '48%' : '100%',
                      padding: isMobile ? '1rem 0.75rem' : '0.75rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '0.9rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minHeight: isMobile ? '48px' : 'auto'
                    }}
                  >
                    🔄 Sincronizar con Servidor
                  </button>

                  <button
                    onClick={() => {
                      localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify({
                        conteoInfo,
                        detallesConteo,
                        timestamp: Date.now()
                      }));
                      toast.success('Progreso guardado localmente');
                    }}
                    style={{
                      width: isMobile ? '48%' : '100%',
                      padding: isMobile ? '1rem 0.75rem' : '0.75rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '0.9rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minHeight: isMobile ? '48px' : 'auto'
                    }}
                  >
                    💾 Guardar Localmente
                  </button>

                  <button
                    onClick={() => navigate('/admin/inventario-completo')}
                    style={{
                      width: isMobile ? '48%' : '100%',
                      padding: isMobile ? '1rem 0.75rem' : '0.75rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: isMobile ? '0.9rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      minHeight: isMobile ? '48px' : 'auto'
                    }}
                  >
                    ← Volver a Inventario Completo
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {/* Botones de navegación - Solo mostrar si no está en el layout de 3 columnas */}
          {!(conteoInfo.estado === 'EN_PROGRESO' || conteoInfo.estado === 'COMPLETADO') && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => navigate('/admin/inventario-completo')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ← Volver a Inventario Completo
              </button>
              
              {(conteoInfo.estado === 'EN_PROGRESO' || conteoInfo.estado === 'COMPLETADO') && (
                <button
                  onClick={() => {
                    localStorage.setItem(`conteo-progreso-${id}`, JSON.stringify({
                      conteoInfo,
                      detallesConteo,
                      timestamp: Date.now()
                    }));
                    toast.success('Progreso guardado localmente');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  💾 Guardar Progreso
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scanner de código de barras */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={manejarScan}
        onClose={() => setMostrarScanner(false)}
      />
    </>
  );
}
