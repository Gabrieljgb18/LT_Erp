# Referencia Rápida - MCP LT_ERP

## 🎯 Comandos Rápidos

### Iniciar el servidor MCP
```bash
cd mcp/lt-erp-mcp
node server.js
```

### Ejecutar tests
```bash
cd mcp/lt-erp-mcp
npm test
```

## 📚 Recursos Disponibles

| URI | Descripción | Ejemplo de uso |
|-----|-------------|----------------|
| `lt-erp://formats` | Formatos de datos | "Muéstrame los formatos definidos" |
| `lt-erp://public-api` | API pública | "Muéstrame las funciones públicas" |
| `lt-erp://bundle-order` | Orden del bundle | "Muéstrame el orden del bundle" |
| `lt-erp://project-structure` | Estructura del proyecto | "Muéstrame la estructura del proyecto" |
| `lt-erp://controllers` | Controladores backend | "Muéstrame los controladores" |
| `lt-erp://config` | Configuración | "Muéstrame la configuración del proyecto" |

## 🛠️ Herramientas

### bundle-build
Regenera el bundle.js

**Uso:**
```
"Regenera el bundle"
```

### clasp-push
Sube cambios a Google Apps Script

**Uso:**
```
"Sube los cambios a Apps Script"
"Sube los cambios a Apps Script con force"
```

**Parámetros:**
- `force` (boolean, opcional): Sobrescribir cambios remotos

### validate-syntax
Valida sintaxis de archivos JavaScript

**Uso:**
```
"Valida la sintaxis de todos los archivos"
"Valida la sintaxis de Main.js y DatabaseService.js"
```

**Parámetros:**
- `files` (array, opcional): Lista de archivos a validar

### db-fetch
Lee datos desde Google Sheets

**Uso:**
```
"Lee todos los datos de Sheets"
"Lee los datos de CLIENTES"
```

**Parámetros:**
- `format` (string, opcional): ID del formato (CLIENTES, EMPLEADOS, etc.)

**Requisitos:**
- `LT_ERP_API_URL` configurado en el entorno
- `LT_ERP_API_KEY` configurado en el entorno

## 🔧 Workflows Comunes

### Desarrollo de nueva funcionalidad
```
1. "Muéstrame la estructura del proyecto"
2. "Muéstrame los controladores relacionados con [módulo]"
3. [Desarrollar código]
4. "Valida la sintaxis de [archivo]"
5. "Regenera el bundle"
6. "Sube los cambios a Apps Script"
```

### Debugging
```
1. "Lee los datos de [FORMATO] desde Sheets"
2. "Muéstrame el controlador [nombre]"
3. "Valida la sintaxis de [archivo]"
```

### Pre-deploy checklist
```
1. "Valida la sintaxis de todos los archivos"
2. "Regenera el bundle"
3. "Muéstrame el orden del bundle"
4. "Sube los cambios a Apps Script"
```

## 💡 Tips

### Combinar múltiples recursos
```
"Muéstrame la estructura del proyecto, los controladores y las funciones públicas"
```

### Validación completa
```
"Valida la sintaxis, regenera el bundle y muéstrame si hay errores"
```

### Exploración específica
```
"Muéstrame todos los controladores relacionados con [tema]"
```

## 🔐 Configuración de Variables de Entorno

Para usar `db-fetch`, agrega a `~/.bashrc` o `~/.zshrc`:

```bash
export LT_ERP_API_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
export LT_ERP_API_KEY="tu-api-key-secreta"
```

Luego ejecuta:
```bash
source ~/.bashrc  # o source ~/.zshrc
```

## 📊 Información del Sistema

- **Nombre:** lt-erp-mcp
- **Versión:** 0.1.0
- **Protocolo:** MCP (Model Context Protocol)
- **Transporte:** stdio

## 🐛 Troubleshooting

### El MCP no responde
1. Verifica que el servidor esté corriendo
2. Revisa la configuración en el archivo de Codex
3. Ejecuta `npm test` para verificar que todo funciona

### Errores de sintaxis
1. Usa `validate-syntax` para identificar problemas
2. Revisa los archivos reportados
3. Corrige y vuelve a validar

### db-fetch no funciona
1. Verifica que las variables de entorno estén configuradas
2. Comprueba que la URL y API key sean correctas
3. Verifica que la WebApp esté desplegada correctamente

---

**Para más detalles, consulta:**
- `README.md` - Documentación completa
- `GUIA_USO.md` - Guía de uso detallada
- `test.js` - Tests del sistema
