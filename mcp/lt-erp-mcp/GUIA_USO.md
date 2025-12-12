# Guía de Uso del MCP LT_ERP

Esta guía te ayudará a aprovechar al máximo el servidor MCP para desarrollo y testing del proyecto LT_ERP.

## 🚀 Inicio Rápido

### 1. Verificar que el MCP está corriendo

El MCP debería estar configurado en tu archivo de configuración de Codex. Verifica que puedes acceder a los recursos:

```
Pídeme: "Lista los recursos disponibles del servidor lt-erp"
```

### 2. Explorar la estructura del proyecto

```
Pídeme: "Muéstrame la estructura del proyecto LT_ERP"
```

Esto te dará un mapa completo de directorios y archivos.

## 📚 Casos de Uso Comunes

### Desarrollo de nuevas funcionalidades

**1. Ver la API pública disponible:**
```
"Muéstrame las funciones públicas de Main.js"
```

**2. Ver los controladores disponibles:**
```
"Muéstrame todos los controladores y sus funciones"
```

**3. Ver los formatos de datos:**
```
"Muéstrame los formatos definidos en Format.js"
```

### Testing y Validación

**1. Validar sintaxis antes de deploy:**
```
"Valida la sintaxis de todos los archivos principales"
```

**2. Validar archivos específicos:**
```
"Valida la sintaxis de controllers/AccountController.js y controllers/HoursController.js"
```

**3. Verificar el orden del bundle:**
```
"Muéstrame el orden de archivos en el bundle"
```

### Build y Deploy

**1. Regenerar el bundle:**
```
"Regenera el bundle.js"
```

**2. Hacer push a Google Apps Script:**
```
"Sube los cambios a Apps Script con clasp"
```

**3. Forzar push (sobrescribir cambios remotos):**
```
"Sube los cambios a Apps Script con force"
```

### Acceso a Datos

**1. Leer todos los datos de Sheets:**
```
"Lee todos los datos de la base de datos"
```

**2. Leer un formato específico:**
```
"Lee los datos de CLIENTES desde Sheets"
```

**3. Ver configuración del proyecto:**
```
"Muéstrame la configuración del proyecto"
```

## 🔧 Workflow de Desarrollo Recomendado

### Al empezar a trabajar en una nueva funcionalidad:

1. **Explorar el contexto:**
   - "Muéstrame la estructura del proyecto"
   - "Muéstrame los controladores relacionados con [módulo]"
   - "Muéstrame las funciones públicas disponibles"

2. **Desarrollar:**
   - Escribe tu código
   - "Valida la sintaxis de [archivo]"

3. **Integrar:**
   - "Regenera el bundle.js"
   - "Valida la sintaxis de todos los archivos principales"

4. **Deploy:**
   - "Sube los cambios a Apps Script"

### Al debuggear:

1. **Verificar datos:**
   - "Lee los datos de [FORMATO] desde Sheets"
   - "Muéstrame los formatos definidos"

2. **Verificar estructura:**
   - "Muéstrame las funciones del controlador [nombre]"
   - "Muéstrame el orden del bundle"

3. **Validar:**
   - "Valida la sintaxis de [archivo problemático]"

## 💡 Tips y Trucos

### Combinar recursos para análisis completo

```
"Muéstrame la estructura del proyecto, los controladores disponibles y las funciones públicas de Main.js"
```

### Validación antes de commit

```
"Valida la sintaxis de todos los archivos, regenera el bundle y muéstrame si hay errores"
```

### Exploración rápida de módulos

```
"Muéstrame todos los controladores relacionados con horas y asistencia"
```

## 🔐 Configuración de Variables de Entorno

Para usar la herramienta `db-fetch`, necesitas configurar:

```bash
export LT_ERP_API_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
export LT_ERP_API_KEY="tu-api-key-secreta"
```

Agrega estas líneas a tu `~/.bashrc` o `~/.zshrc` para que persistan.

## 📝 Ejemplos de Prompts Efectivos

### Para desarrollo:
- "Necesito crear un nuevo controlador para [funcionalidad]. Muéstrame la estructura de los controladores existentes y las funciones públicas disponibles."
- "Voy a modificar [archivo]. Primero muéstrame su contenido actual y valida su sintaxis."

### Para debugging:
- "Hay un error en [módulo]. Muéstrame el controlador correspondiente, las funciones públicas relacionadas y los datos actuales de [FORMATO]."

### Para deploy:
- "Estoy listo para deploy. Valida la sintaxis, regenera el bundle y sube los cambios a Apps Script."

## 🎯 Recursos Disponibles

| Recurso | URI | Descripción |
|---------|-----|-------------|
| Formatos | `lt-erp://formats` | Estructuras de datos definidas |
| API Pública | `lt-erp://public-api` | Funciones expuestas al frontend |
| Bundle Order | `lt-erp://bundle-order` | Orden de compilación |
| Estructura | `lt-erp://project-structure` | Mapa de directorios |
| Controladores | `lt-erp://controllers` | Lista de controladores backend |
| Configuración | `lt-erp://config` | Archivos de configuración |

## 🛠️ Herramientas Disponibles

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `bundle-build` | Regenera bundle.js | Ninguno |
| `clasp-push` | Deploy a Apps Script | `force` (opcional) |
| `validate-syntax` | Valida sintaxis JS | `files` (opcional) |
| `db-fetch` | Lee datos de Sheets | `format` (opcional) |

---

**¡Ahora puedes desarrollar y testear de forma más eficiente! 🚀**
