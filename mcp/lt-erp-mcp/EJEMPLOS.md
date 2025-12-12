# Ejemplos Prácticos de Uso del MCP

## 🎯 Escenarios Reales

### Escenario 1: Agregar un nuevo módulo de "Proveedores"

**Paso 1: Explorar la estructura existente**
```
Usuario: "Muéstrame la estructura del proyecto y los controladores disponibles"
```

**Paso 2: Ver cómo están implementados módulos similares**
```
Usuario: "Muéstrame el controlador de clientes y sus funciones"
```

**Paso 3: Verificar los formatos disponibles**
```
Usuario: "Muéstrame los formatos definidos en Format.js"
```

**Paso 4: Después de crear el código**
```
Usuario: "Valida la sintaxis de controllers/ProveedoresController.js"
```

**Paso 5: Build y deploy**
```
Usuario: "Regenera el bundle y sube los cambios a Apps Script"
```

---

### Escenario 2: Debuggear un problema en el módulo de horas

**Paso 1: Ver el controlador**
```
Usuario: "Muéstrame el controlador de horas y todas sus funciones"
```

**Paso 2: Ver los datos actuales**
```
Usuario: "Lee los datos de HORAS desde Sheets"
```

**Paso 3: Ver la API pública relacionada**
```
Usuario: "Muéstrame las funciones públicas de Main.js relacionadas con horas"
```

**Paso 4: Después de hacer cambios**
```
Usuario: "Valida la sintaxis de controllers/HoursController.js y src/hours/hoursPanel.js"
```

---

### Escenario 3: Refactorizar el código del bundle

**Paso 1: Ver el orden actual**
```
Usuario: "Muéstrame el orden de archivos en el bundle"
```

**Paso 2: Después de reorganizar**
```
Usuario: "Regenera el bundle y muéstrame si hay errores"
```

**Paso 3: Validar todo**
```
Usuario: "Valida la sintaxis de todos los archivos principales"
```

**Paso 4: Deploy**
```
Usuario: "Sube los cambios a Apps Script con force"
```

---

### Escenario 4: Crear un nuevo reporte

**Paso 1: Explorar reportes existentes**
```
Usuario: "Muéstrame la estructura del directorio src y los controladores de reportes"
```

**Paso 2: Ver formatos de datos disponibles**
```
Usuario: "Muéstrame los formatos definidos"
```

**Paso 3: Ver la API disponible**
```
Usuario: "Muéstrame las funciones públicas de Main.js"
```

**Paso 4: Después de implementar**
```
Usuario: "Valida la sintaxis, regenera el bundle y sube los cambios"
```

---

### Escenario 5: Actualizar la configuración del proyecto

**Paso 1: Ver configuración actual**
```
Usuario: "Muéstrame la configuración del proyecto"
```

**Paso 2: Después de modificar appsscript.json**
```
Usuario: "Muéstrame la configuración del proyecto para verificar los cambios"
```

**Paso 3: Deploy**
```
Usuario: "Sube los cambios a Apps Script"
```

---

### Escenario 6: Preparar un release

**Checklist completo:**
```
Usuario: "Ejecuta este checklist:
1. Muéstrame la estructura del proyecto
2. Valida la sintaxis de todos los archivos
3. Muéstrame el orden del bundle
4. Regenera el bundle
5. Muéstrame la configuración del proyecto
6. Si todo está bien, sube los cambios a Apps Script"
```

---

### Escenario 7: Onboarding de un nuevo desarrollador

**Tour del proyecto:**
```
Usuario: "Dame un tour completo del proyecto:
1. Muéstrame la estructura del proyecto
2. Muéstrame todos los controladores disponibles
3. Muéstrame las funciones públicas de la API
4. Muéstrame los formatos de datos
5. Muéstrame la configuración"
```

---

### Escenario 8: Investigar un bug reportado

**Paso 1: Contexto completo**
```
Usuario: "El módulo de asistencia tiene un bug. Muéstrame:
- El controlador de asistencia
- Las funciones públicas relacionadas
- Los datos actuales de ASISTENCIA"
```

**Paso 2: Después de identificar el problema**
```
Usuario: "Valida la sintaxis de los archivos modificados"
```

**Paso 3: Testing**
```
Usuario: "Lee los datos de ASISTENCIA para verificar que el bug está resuelto"
```

---

### Escenario 9: Optimizar el bundle

**Paso 1: Análisis**
```
Usuario: "Muéstrame el orden del bundle y la estructura del directorio src"
```

**Paso 2: Después de optimizar**
```
Usuario: "Regenera el bundle y compara el tamaño con el anterior"
```

**Paso 3: Validación**
```
Usuario: "Valida la sintaxis de todos los archivos y sube los cambios"
```

---

### Escenario 10: Migrar a una nueva versión de la API

**Paso 1: Inventario**
```
Usuario: "Muéstrame todas las funciones públicas de Main.js y todos los controladores"
```

**Paso 2: Después de actualizar**
```
Usuario: "Valida la sintaxis de Main.js y todos los controladores"
```

**Paso 3: Testing**
```
Usuario: "Lee datos de todos los formatos para verificar compatibilidad"
```

---

## 💡 Tips para Prompts Efectivos

### ✅ Buenos Prompts

```
"Muéstrame la estructura del proyecto y los controladores"
→ Combina múltiples recursos para obtener contexto completo

"Valida la sintaxis de controllers/AccountController.js y src/main.js"
→ Específico sobre qué archivos validar

"Regenera el bundle, valida la sintaxis y sube los cambios"
→ Workflow completo en un solo comando

"Muéstrame el controlador de horas y lee los datos de HORAS"
→ Combina código y datos para debugging
```

### ❌ Prompts Menos Efectivos

```
"Muéstrame todo"
→ Demasiado amplio, mejor ser específico

"Valida"
→ Falta especificar qué validar

"Deploy"
→ Falta contexto, mejor especificar el workflow completo
```

---

## 🎓 Patrones de Uso Comunes

### Patrón: Exploración → Desarrollo → Validación → Deploy

```
1. "Muéstrame [contexto necesario]"
2. [Desarrollar código]
3. "Valida la sintaxis de [archivos modificados]"
4. "Regenera el bundle"
5. "Sube los cambios a Apps Script"
```

### Patrón: Debugging → Fix → Verificación

```
1. "Muéstrame [código problemático] y lee [datos relacionados]"
2. [Identificar y corregir el problema]
3. "Valida la sintaxis de [archivos modificados]"
4. "Lee [datos] para verificar el fix"
```

### Patrón: Refactoring → Testing → Deploy

```
1. "Muéstrame [código a refactorizar]"
2. [Refactorizar]
3. "Valida la sintaxis de todos los archivos"
4. "Regenera el bundle"
5. "Lee [datos] para testing"
6. "Sube los cambios a Apps Script"
```

---

## 🚀 Workflows Avanzados

### Workflow: Desarrollo de Feature Completa

```bash
# 1. Exploración
"Muéstrame la estructura, controladores y API pública"

# 2. Diseño
[Planificar la implementación basándose en el contexto]

# 3. Implementación
[Escribir código]

# 4. Validación Local
"Valida la sintaxis de todos los archivos modificados"

# 5. Build
"Regenera el bundle y muéstrame si hay errores"

# 6. Testing
"Lee los datos de [FORMATO] para testing"

# 7. Deploy
"Sube los cambios a Apps Script"

# 8. Verificación Post-Deploy
"Lee los datos de [FORMATO] para verificar el deploy"
```

### Workflow: Hotfix Rápido

```bash
# 1. Identificar
"Muéstrame [controlador/archivo problemático]"

# 2. Fix
[Corregir el bug]

# 3. Validar
"Valida la sintaxis de [archivo]"

# 4. Deploy Rápido
"Regenera el bundle y sube los cambios a Apps Script con force"
```

### Workflow: Code Review

```bash
# 1. Contexto
"Muéstrame la estructura del proyecto y la configuración"

# 2. Análisis de Controladores
"Muéstrame todos los controladores y sus funciones"

# 3. Análisis de API
"Muéstrame las funciones públicas de Main.js"

# 4. Validación
"Valida la sintaxis de todos los archivos principales"

# 5. Verificación de Build
"Muéstrame el orden del bundle y regenera el bundle"
```

---

## 📊 Métricas de Productividad

### Tiempo Estimado de Tareas

| Tarea | Sin MCP | Con MCP | Ahorro |
|-------|---------|---------|--------|
| Explorar estructura del proyecto | 10 min | 30 seg | 95% |
| Encontrar funciones en controladores | 5 min | 10 seg | 97% |
| Validar sintaxis de archivos | 3 min | 10 seg | 94% |
| Regenerar bundle | 1 min | 10 seg | 83% |
| Deploy a Apps Script | 2 min | 15 seg | 87% |
| Leer datos de Sheets para testing | 5 min | 20 seg | 93% |

**Ahorro promedio: ~91%**

---

¡Usa estos ejemplos como referencia para aprovechar al máximo el MCP! 🎉
