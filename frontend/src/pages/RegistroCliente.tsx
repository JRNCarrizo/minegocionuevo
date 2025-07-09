import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

// Esquema de validación con Yup
const esquemaValidacion = yup.object({
  nombre: yup.string().required('El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: yup.string().required('Los apellidos son requeridos').min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  email: yup.string().required('El email es requerido').email('Ingrese un email válido'),
  telefono: yup.string().required('El teléfono es requerido').min(8, 'El teléfono debe tener al menos 8 caracteres'),
  contraseña: yup.string().required('La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmarContraseña: yup.string()
    .required('Confirme la contraseña')
    .oneOf([yup.ref('contraseña')], 'Las contraseñas no coinciden')
});

interface FormularioRegistro {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  contraseña: string;
  confirmarContraseña: string;
}

const RegistroCliente: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { subdominio } = useSubdominio();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormularioRegistro>({
    resolver: yupResolver(esquemaValidacion)
  });

  const enviarFormulario = async (datos: FormularioRegistro) => {
    setCargando(true);
    
    try {
      // Validar que tenemos un subdominio válido
      if (!subdominio) {
        toast.error('Error: No se pudo determinar la tienda');
        return;
      }

      // Crear el cliente usando el método del servicio
      const datosCliente = {
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        password: datos.contraseña
      };
      
      await api.registrarCliente(subdominio, datosCliente);

      toast.success('¡Cuenta creada exitosamente!');
      reset();
      
      // Redirigir al login después de registro exitoso
      navigate('/login');
      
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Únete a nuestra tienda online
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(enviarFormulario)}>
            {/* Campo Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <div className="mt-1">
                <input
                  id="nombre"
                  type="text"
                  autoComplete="given-name"
                  {...register('nombre')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.nombre ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Ingrese su nombre"
                />
                {errors.nombre && (
                  <p className="mt-2 text-sm text-red-600">{errors.nombre.message}</p>
                )}
              </div>
            </div>

            {/* Campo Apellidos */}
            <div>
              <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">
                Apellidos
              </label>
              <div className="mt-1">
                <input
                  id="apellidos"
                  type="text"
                  autoComplete="family-name"
                  {...register('apellidos')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.apellidos ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Ingrese sus apellidos"
                />
                {errors.apellidos && (
                  <p className="mt-2 text-sm text-red-600">{errors.apellidos.message}</p>
                )}
              </div>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Campo Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="mt-1">
                <input
                  id="telefono"
                  type="tel"
                  autoComplete="tel"
                  {...register('telefono')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.telefono ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="1234567890"
                />
                {errors.telefono && (
                  <p className="mt-2 text-sm text-red-600">{errors.telefono.message}</p>
                )}
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="contraseña"
                  type="password"
                  autoComplete="new-password"
                  {...register('contraseña')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.contraseña ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.contraseña && (
                  <p className="mt-2 text-sm text-red-600">{errors.contraseña.message}</p>
                )}
              </div>
            </div>

            {/* Campo Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmarContraseña" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmarContraseña"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmarContraseña')}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmarContraseña ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Repita la contraseña"
                />
                {errors.confirmarContraseña && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmarContraseña.message}</p>
                )}
              </div>
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={cargando}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  cargando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors duration-200`}
              >
                {cargando ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </div>

            {/* Enlaces adicionales */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroCliente;
