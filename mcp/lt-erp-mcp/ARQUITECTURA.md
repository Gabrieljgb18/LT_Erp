# Arquitectura del MCP LT_ERP

```
┌─────────────────────────────────────────────────────────────────┐
│                         CODEX / AI ASSISTANT                     │
│                    (Interactúa con el MCP)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MCP Protocol (stdio)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      LT_ERP MCP SERVER                           │
│                     (mcp/lt-erp-mcp/)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    RECURSOS                               │  │
│  │                                                            │  │
│  │  • lt-erp://formats           → Format.js                 │  │
│  │  • lt-erp://public-api        → Main.js                   │  │
│  │  • lt-erp://bundle-order      → generate_bundle_html.js   │  │
│  │  • lt-erp://project-structure → File system scan          │  │
│  │  • lt-erp://controllers       → controllers/*             │  │
│  │  • lt-erp://config            → *.json configs            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  HERRAMIENTAS                             │  │
│  │                                                            │  │
│  │  • bundle-build      → node generate_bundle_html.js       │  │
│  │  • clasp-push        → clasp push [--force]               │  │
│  │  • validate-syntax   → VM syntax validation               │  │
│  │  • db-fetch          → WebApp API call                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Accede a:
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    PROYECTO LT_ERP                               │
│                                                                  │
│  ├── Main.js                  (API pública)                     │
│  ├── Format.js                (Definiciones de formatos)        │
│  ├── DatabaseService.js       (Servicio de base de datos)       │
│  ├── WebApp.gs.js             (Web App endpoint)                │
│  ├── generate_bundle_html.js  (Script de build)                 │
│  │                                                               │
│  ├── controllers/             (Controladores backend)           │
│  │   ├── AccountController.js                                   │
│  │   ├── HoursController.js                                     │
│  │   └── ...                                                     │
│  │                                                               │
│  ├── src/                     (Frontend)                        │
│  │   ├── main.js                                                │
│  │   ├── attendance/                                            │
│  │   ├── hours/                                                 │
│  │   └── ...                                                     │
│  │                                                               │
│  └── utils/                   (Utilidades)                      │
└──────────────────────────────────────────────────────────────────┘
                             │
                             │ Deploy con clasp
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   GOOGLE APPS SCRIPT                             │
│                                                                  │
│  • Sheets Database                                              │
│  • WebApp API                                                   │
│  • Backend Logic                                                │
└──────────────────────────────────────────────────────────────────┘
```

## Flujo de Trabajo

### 1. Desarrollo
```
Developer → AI Assistant → MCP Resources
                ↓
         Código generado/modificado
                ↓
         validate-syntax (MCP Tool)
                ↓
         bundle-build (MCP Tool)
```

### 2. Testing
```
AI Assistant → db-fetch (MCP Tool)
      ↓
Google Sheets ← WebApp API
      ↓
Datos de prueba
```

### 3. Deploy
```
Código validado → bundle-build → clasp-push
                                      ↓
                              Google Apps Script
```

## Componentes Principales

### server.js
- **Propósito**: Servidor MCP principal
- **Funciones**:
  - Registra recursos
  - Registra herramientas
  - Maneja comunicación stdio
  - Ejecuta validaciones

### test.js
- **Propósito**: Suite de tests
- **Funciones**:
  - Verifica recursos
  - Valida estructura
  - Comprueba configuración

### Archivos de Documentación
- **README.md**: Documentación técnica completa
- **GUIA_USO.md**: Guía de uso con ejemplos
- **REFERENCIA_RAPIDA.md**: Comandos rápidos
- **ARQUITECTURA.md**: Este archivo

## Ventajas del MCP

1. **Contexto Rico**: El AI tiene acceso a toda la estructura del proyecto
2. **Validación Automática**: Puede validar sintaxis antes de deploy
3. **Build Automatizado**: Regenera bundles sin intervención manual
4. **Deploy Simplificado**: Push a Apps Script con un comando
5. **Acceso a Datos**: Lee datos de Sheets para testing
6. **Exploración Eficiente**: Navega la estructura del proyecto fácilmente

## Seguridad

- ✅ Solo lee archivos locales
- ✅ No modifica código directamente (solo ejecuta scripts de build)
- ✅ No expone credenciales (usa variables de entorno)
- ✅ Validación de sintaxis antes de deploy
- ✅ No toca Google Apps Script directamente (usa clasp)

## Extensibilidad

Para agregar nuevos recursos:
```javascript
server.registerResource(
  'nombre-recurso',
  'lt-erp://nombre-recurso',
  { title: '...', description: '...', mimeType: '...' },
  async () => { /* lógica */ }
);
```

Para agregar nuevas herramientas:
```javascript
server.registerTool(
  'nombre-tool',
  { title: '...', description: '...', inputSchema: z.object({...}) },
  async (params) => { /* lógica */ }
);
```
