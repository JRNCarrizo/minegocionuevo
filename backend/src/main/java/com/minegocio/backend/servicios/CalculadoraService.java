package com.minegocio.backend.servicios;

import org.springframework.stereotype.Service;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

@Service
public class CalculadoraService {

    private final ScriptEngine scriptEngine;

    public CalculadoraService() {
        ScriptEngineManager manager = new ScriptEngineManager();
        this.scriptEngine = manager.getEngineByName("JavaScript");
        
        // Verificar que el ScriptEngine esté disponible
        if (this.scriptEngine == null) {
            System.err.println("⚠️ JavaScript ScriptEngine no disponible, usando evaluación manual");
        }
    }

    /**
     * Evaluar una expresión matemática y devolver el resultado
     * Ejemplos: "112*4+3", "50+25*2", "100/4+10"
     */
    public ResultadoCalculo evaluarExpresion(String expresion) {
        try {
            // Validar que la expresión solo contenga caracteres seguros
            if (!esExpresionSegura(expresion)) {
                return new ResultadoCalculo(false, 0, "La expresión contiene caracteres no permitidos");
            }

            // Limpiar la expresión
            String expresionLimpia = expresion.trim().replaceAll("\\s+", "");
            
            // Si el ScriptEngine no está disponible, usar evaluación manual
            if (scriptEngine == null) {
                return evaluarExpresionManual(expresionLimpia);
            }
            
            // Evaluar la expresión usando ScriptEngine
            Object resultado = scriptEngine.eval(expresionLimpia);
            
            // Convertir a número entero
            double resultadoDouble = ((Number) resultado).doubleValue();
            int resultadoEntero = (int) Math.round(resultadoDouble);
            
            return new ResultadoCalculo(true, resultadoEntero, null);
            
        } catch (ScriptException e) {
            // Si falla con ScriptEngine, intentar evaluación manual
            try {
                return evaluarExpresionManual(expresion.trim().replaceAll("\\s+", ""));
            } catch (Exception ex) {
                return new ResultadoCalculo(false, 0, "Error en la expresión matemática: " + e.getMessage());
            }
        } catch (Exception e) {
            return new ResultadoCalculo(false, 0, "Error inesperado: " + e.getMessage());
        }
    }
    
    /**
     * Evaluación manual simple para casos donde ScriptEngine no está disponible
     */
    private ResultadoCalculo evaluarExpresionManual(String expresion) {
        try {
            // Reemplazar 'x' por '*' para multiplicación
            expresion = expresion.replace("x", "*").replace("X", "*");
            
            // Evaluación básica usando BigDecimal para mayor precisión
            if (expresion.matches("^[0-9+\\-*/().\\s]+$")) {
                // Para expresiones simples, usar evaluación básica
                double resultado = evaluarExpresionBasica(expresion);
                int resultadoEntero = (int) Math.round(resultado);
                return new ResultadoCalculo(true, resultadoEntero, null);
            } else {
                return new ResultadoCalculo(false, 0, "Expresión no válida");
            }
        } catch (Exception e) {
            return new ResultadoCalculo(false, 0, "Error en evaluación manual: " + e.getMessage());
        }
    }
    
    /**
     * Evaluación básica de expresiones matemáticas simples
     */
    private double evaluarExpresionBasica(String expresion) {
        // Implementación muy básica para casos simples
        // Solo maneja multiplicación y división básica
        expresion = expresion.replaceAll("\\s+", "");
        
        // Buscar multiplicaciones y divisiones
        if (expresion.contains("*")) {
            String[] partes = expresion.split("\\*", 2);
            if (partes.length == 2) {
                return evaluarExpresionBasica(partes[0]) * evaluarExpresionBasica(partes[1]);
            }
        }
        
        if (expresion.contains("/")) {
            String[] partes = expresion.split("/", 2);
            if (partes.length == 2) {
                double divisor = evaluarExpresionBasica(partes[1]);
                if (divisor == 0) {
                    throw new ArithmeticException("División por cero");
                }
                return evaluarExpresionBasica(partes[0]) / divisor;
            }
        }
        
        // Si no hay operadores, intentar parsear como número
        try {
            return Double.parseDouble(expresion);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("No se puede evaluar: " + expresion);
        }
    }

    /**
     * Validar que la expresión solo contenga caracteres seguros
     */
    private boolean esExpresionSegura(String expresion) {
        // Permitir solo números, operadores matemáticos básicos y paréntesis
        return expresion.matches("^[0-9+\\-*/().\\s]+$");
    }

    /**
     * Clase para encapsular el resultado del cálculo
     */
    public static class ResultadoCalculo {
        private final boolean exito;
        private final int resultado;
        private final String error;

        public ResultadoCalculo(boolean exito, int resultado, String error) {
            this.exito = exito;
            this.resultado = resultado;
            this.error = error;
        }

        public boolean isExito() {
            return exito;
        }

        public int getResultado() {
            return resultado;
        }

        public String getError() {
            return error;
        }
    }
}

