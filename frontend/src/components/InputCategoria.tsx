import React, { useState, useEffect, useRef } from 'react';

interface InputCategoriaProps {
  value: string;
  onChange: (value: string) => void;
  categorias: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
}

const InputCategoria: React.FC<InputCategoriaProps> = ({
  value,
  onChange,
  categorias,
  placeholder = "Escribe o selecciona una categoría",
  className = "",
  required = false,
  error
}) => {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([]);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrar sugerencias basadas en el input
  useEffect(() => {
    if (value && categorias.length > 0) {
      const filtradas = categorias.filter(categoria =>
        categoria.toLowerCase().includes(value.toLowerCase()) &&
        categoria.toLowerCase() !== value.toLowerCase()
      );
      setSugerenciasFiltradas(filtradas);
      setMostrarSugerencias(filtradas.length > 0);
    } else {
      setSugerenciasFiltradas([]);
      setMostrarSugerencias(false);
    }
    setIndiceSugerencia(-1);
  }, [value, categorias]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;
    onChange(nuevoValor);
  };

  const handleInputFocus = () => {
    if (value === '' && categorias.length > 0) {
      setSugerenciasFiltradas(categorias);
      setMostrarSugerencias(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
    }, 200);
  };

  const handleSugerenciaClick = (categoria: string) => {
    onChange(categoria);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugerencias || sugerenciasFiltradas.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSugerencia(prev => 
          prev < sugerenciasFiltradas.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSugerencia(prev => 
          prev > 0 ? prev - 1 : sugerenciasFiltradas.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceSugerencia >= 0) {
          handleSugerenciaClick(sugerenciasFiltradas[indiceSugerencia]);
        }
        break;
      case 'Escape':
        setMostrarSugerencias(false);
        setIndiceSugerencia(-1);
        break;
    }
  };

  // Scroll automático para mantener la sugerencia visible
  useEffect(() => {
    if (indiceSugerencia >= 0 && listRef.current) {
      const elemento = listRef.current.children[indiceSugerencia] as HTMLElement;
      if (elemento) {
        elemento.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [indiceSugerencia]);

  return (
    <div className="input-categoria-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`campo ${className} ${error ? 'error' : ''}`}
        required={required}
        autoComplete="off"
      />
      
      {mostrarSugerencias && sugerenciasFiltradas.length > 0 && (
        <ul ref={listRef} className="sugerencias-lista">
          {sugerenciasFiltradas.map((categoria, index) => (
            <li
              key={categoria}
              className={`sugerencia-item ${index === indiceSugerencia ? 'activa' : ''}`}
              onClick={() => handleSugerenciaClick(categoria)}
            >
              {categoria}
            </li>
          ))}
        </ul>
      )}
      
      {error && <div className="mensaje-error">{error}</div>}
    </div>
  );
};

export default InputCategoria;
