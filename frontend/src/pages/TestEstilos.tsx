export default function TestEstilos() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-8">
      {/* Test básico de gradientes */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header de prueba */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            Prueba de Estilos
          </h1>
          <p className="text-gray-600 text-center mt-4">
            Si puedes ver este texto con estilos, Tailwind está funcionando correctamente
          </p>
        </div>

        {/* Cards de prueba */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gradientes</h3>
            <p className="text-gray-600">
              Prueba de gradientes y efectos modernos
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100 transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Animaciones</h3>
            <p className="text-gray-600">
              Hover effects y transiciones suaves
            </p>
          </div>
        </div>

        {/* Botón de prueba */}
        <div className="text-center">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
            Botón de Prueba
          </button>
        </div>

        {/* Formulario de prueba */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Formulario de Prueba</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campo de prueba
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Escribe algo aquí..."
              />
            </div>
          </div>
        </div>

        {/* Estado de verificación */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h4 className="text-green-800 font-medium">¡Estilos funcionando!</h4>
              <p className="text-green-600 text-sm">Si puedes ver esta tarjeta con colores y efectos, todo está correcto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
