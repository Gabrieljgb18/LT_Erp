# LT_ERP MCP Server

Servidor MCP para exponer recursos útiles del ERP y una herramienta segura de build.

## Instalación y arranque
- Ubicación: `mcp/lt-erp-mcp`
- Instalar dependencias: `npm install`
- Arrancar (stdio): `node server.js` (evita `npm start`, que imprime a stdout y rompe el framing MCP).

### Ejemplo de configuración (Codex CLI)
```json
{
  "mcpServers": {
    "lt-erp": {
      "command": "node",
      "args": ["server.js"],
      "cwd": "./mcp/lt-erp-mcp"
    }
  }
}
```

## Recursos expuestos

### Información del proyecto
- **`lt-erp://formats`** (`application/json`): Headers y metadatos de `Format.js` (templates y `availableFormats`).
- **`lt-erp://public-api`** (`application/json`): Funciones públicas de `Main.js` con parámetros, descripción y número de línea.
- **`lt-erp://bundle-order`** (`application/json`): Orden de archivos que compone `bundle.js` según `generate_bundle_html.js`, con verificación de faltantes y targets.
- **`lt-erp://project-structure`** (`application/json`): Mapa completo de directorios y archivos del proyecto (hasta 3 niveles de profundidad).
- **`lt-erp://controllers`** (`application/json`): Lista de todos los controladores backend con sus funciones exportadas y parámetros.
- **`lt-erp://config`** (`application/json`): Archivos de configuración del proyecto (appsscript.json, .clasp.json, package.json).

## Herramientas

### Build y Deploy
- **`bundle-build`**: Ejecuta `node generate_bundle_html.js` en la raíz del proyecto y regenera `bundle.js` / `bundle_js.html`. Devuelve stdout/stderr.
- **`clasp-push`**: Ejecuta `clasp push` para subir cambios a Google Apps Script. 
  - Parámetros opcionales:
    - `force` (boolean): Usar `--force` para sobrescribir cambios remotos.

### Testing y Validación
- **`validate-syntax`**: Valida la sintaxis de archivos JavaScript del proyecto.
  - Parámetros opcionales:
    - `files` (array): Lista de archivos a validar (rutas relativas). Por defecto valida Main.js, DatabaseService.js, Format.js y WebApp.gs.js.

### Acceso a datos
- **`db-fetch`**: Lee datos JSON de Sheets vía la WebApp (api=db). 
  - Requiere: `LT_ERP_API_URL` y `LT_ERP_API_KEY` configurados en el entorno.
  - Parámetros opcionales:
    - `format` (string): ID del formato a leer (ej: CLIENTES, EMPLEADOS). Sin este parámetro devuelve todos los formatos.

### Configurar acceso a Sheets (db-fetch)
1) En Google Apps Script, define un Script Property `LT_ERP_API_KEY` (por ej. desde Editor > Project Settings > Script properties).  
2) Despliega la webapp (Deploy > New deployment) con acceso apropiado y copia la URL.  
3) En tu entorno local, exporta variables:
   - `LT_ERP_API_URL` = URL del despliegue (añade `?api=db` lo hace la tool).
   - `LT_ERP_API_KEY` = el mismo token del paso 1.
4) Usa la tool `db-fetch`:
   - Sin argumentos: devuelve todos los formatos.
   - Con `format`: devuelve solo ese (ej. `CLIENTES`).

## Notas
- El servidor asume que la raíz del repo es `../../` desde esta carpeta.
- No expone datos sensibles ni toca Google Apps Script; solo lee archivos locales y ejecuta el script de bundle bajo demanda.

## 🚀 Desarrollo con MCP

Este proyecto incluye un servidor MCP (Model Context Protocol) que facilita el desarrollo y testing. El MCP expone recursos y herramientas que permiten a los asistentes de IA trabajar de forma más eficiente con el proyecto.

### Recursos disponibles:
- **Formatos de datos** (`lt-erp://formats`)
- **API pública** (`lt-erp://public-api`)
- **Orden del bundle** (`lt-erp://bundle-order`)
- **Estructura del proyecto** (`lt-erp://project-structure`)
- **Controladores** (`lt-erp://controllers`)
- **Configuración** (`lt-erp://config`)

### Herramientas disponibles:
- **bundle-build**: Regenera el bundle.js
- **clasp-push**: Deploy a Google Apps Script
- **validate-syntax**: Valida sintaxis JavaScript
- **db-fetch**: Lee datos desde Sheets

### Para más información:
- Ver `mcp/lt-erp-mcp/GUIA_USO.md` para guía completa
- Ver `mcp/lt-erp-mcp/REFERENCIA_RAPIDA.md` para comandos rápidos
- Ejecutar `npm test` en `mcp/lt-erp-mcp` para verificar el sistema
