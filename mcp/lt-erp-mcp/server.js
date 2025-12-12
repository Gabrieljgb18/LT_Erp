/**
 * MCP server específico para LT_ERP.
 * Expone recursos útiles y una herramienta segura para regenerar el bundle.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');
const z = require('zod');

const sdkCjsRoot = path.dirname(require.resolve('@modelcontextprotocol/sdk/package.json'));
const { McpServer } = require(path.join(sdkCjsRoot, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(sdkCjsRoot, 'server/stdio.js'));

const API_URL = process.env.LT_ERP_API_URL;
const API_KEY = process.env.LT_ERP_API_KEY;

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MAIN_FILE = path.join(PROJECT_ROOT, 'Main.js');
const FORMAT_FILE = path.join(PROJECT_ROOT, 'Format.js');
const BUNDLE_SCRIPT = path.join(PROJECT_ROOT, 'generate_bundle_html.js');

const server = new McpServer({
  name: 'lt-erp-mcp',
  version: '0.1.0',
  description: 'Recursos y herramientas para trabajar con LT_ERP (Apps Script + Sheets).'
});

function readFileSafe(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractDocComment(source, fnStartIndex) {
  const commentEnd = source.lastIndexOf('*/', fnStartIndex);
  if (commentEnd === -1) return undefined;

  const commentStart = source.lastIndexOf('/**', commentEnd);
  if (commentStart === -1) return undefined;

  const between = source.slice(commentEnd + 2, fnStartIndex);
  if (!/^[\s;]*$/.test(between)) return undefined;

  const raw = source.slice(commentStart + 3, commentEnd);
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean);

  return lines.join(' ');
}

function extractPublicApi() {
  const source = readFileSafe(MAIN_FILE);
  const functions = [];
  const regex = /function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
  let match;

  while ((match = regex.exec(source))) {
    const [, name, rawParams] = match;
    const params = rawParams
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const line = source.slice(0, match.index).split('\n').length;
    const description = extractDocComment(source, match.index);

    functions.push({
      name,
      params,
      description,
      line
    });
  }

  return {
    file: path.relative(PROJECT_ROOT, MAIN_FILE),
    functions
  };
}

function loadFormats() {
  const code = readFileSafe(FORMAT_FILE);
  const sandbox = { Formats: undefined, console };

  vm.runInNewContext(code, sandbox, { filename: 'Format.js' });
  const Formats = sandbox.Formats;

  if (!Formats || typeof Formats.getAvailableFormats !== 'function') {
    throw new Error('No se pudo cargar Formats desde Format.js');
  }

  const available = Formats.getAvailableFormats();
  const templates = {};

  available.forEach((f) => {
    const tpl = Formats.getFormatTemplate(f.id);
    if (tpl) {
      templates[f.id] = JSON.parse(JSON.stringify(tpl));
    }
  });

  return {
    availableFormats: available,
    templates
  };
}

function loadBundleSources() {
  const code = readFileSafe(BUNDLE_SCRIPT);
  const match = code.match(/const\s+sources\s*=\s*\[([\s\S]*?)\];/m);

  if (!match) {
    throw new Error('No se encontró el array de sources en generate_bundle_html.js');
  }

  const arrayCode = `[${match[1]}]`;
  const sandbox = { path, root: path.dirname(BUNDLE_SCRIPT) };
  const sourcesAbs = vm.runInNewContext(arrayCode, sandbox, { filename: 'bundle-sources.js' });

  const order = sourcesAbs.map((abs) => path.relative(PROJECT_ROOT, abs));
  const missing = order.filter((p) => !fs.existsSync(path.join(PROJECT_ROOT, p)));
  const targets = ['bundle.js', 'bundle_js.html'].map((p) => ({
    path: p,
    exists: fs.existsSync(path.join(PROJECT_ROOT, p))
  }));

  return { order, missing, targets };
}

async function runBundleBuild() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['generate_bundle_html.js'], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject(new Error(stderr || stdout || `Proceso finalizó con código ${code}`));
      }
    });
  });
}

server.registerResource(
  'lt-erp-formats',
  'lt-erp://formats',
  {
    title: 'Formatos definidos',
    description: 'Estructuras (headers y metadatos) del ERP desde Format.js',
    mimeType: 'application/json'
  },
  async () => {
    const payload = loadFormats();
    return {
      contents: [
        {
          uri: 'lt-erp://formats',
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
);

server.registerResource(
  'lt-erp-public-api',
  'lt-erp://public-api',
  {
    title: 'API pública (Main.js)',
    description: 'Funciones expuestas al frontend y sus parámetros',
    mimeType: 'application/json'
  },
  async () => {
    const payload = extractPublicApi();
    return {
      contents: [
        {
          uri: 'lt-erp://public-api',
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
);

server.registerResource(
  'lt-erp-bundle-order',
  'lt-erp://bundle-order',
  {
    title: 'Orden de build del bundle',
    description: 'Lista de archivos incluidos en bundle.js según generate_bundle_html.js',
    mimeType: 'application/json'
  },
  async () => {
    const payload = loadBundleSources();
    return {
      contents: [
        {
          uri: 'lt-erp://bundle-order',
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  'bundle-build',
  {
    title: 'Generar bundle.js',
    description: 'Ejecuta node generate_bundle_html.js en la raíz del proyecto.',
    inputSchema: z.object({})
  },
  async () => {
    const result = await runBundleBuild();
    return {
      content: [
        {
          type: 'text',
          text: `bundle.js regenerado.\nstdout:\n${result.stdout}${result.stderr ? `\nstderr:\n${result.stderr}` : ''}`
        }
      ],
      structuredContent: result
    };
  }
);

// Recurso: Estructura del proyecto
server.registerResource(
  'lt-erp-project-structure',
  'lt-erp://project-structure',
  {
    title: 'Estructura del proyecto',
    description: 'Mapa de directorios y archivos principales del proyecto LT_ERP',
    mimeType: 'application/json'
  },
  async () => {
    function scanDirectory(dirPath, maxDepth = 2, currentDepth = 0) {
      if (currentDepth >= maxDepth) return null;

      const items = fs.readdirSync(dirPath);
      const structure = {};

      items.forEach(item => {
        if (item.startsWith('.') || item === 'node_modules') return;

        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          structure[item] = {
            type: 'directory',
            children: scanDirectory(fullPath, maxDepth, currentDepth + 1)
          };
        } else {
          structure[item] = {
            type: 'file',
            size: stats.size,
            extension: path.extname(item)
          };
        }
      });

      return structure;
    }

    const structure = {
      root: PROJECT_ROOT,
      structure: scanDirectory(PROJECT_ROOT, 3),
      keyDirectories: {
        controllers: 'Backend controllers para diferentes módulos',
        src: 'Código fuente del frontend',
        utils: 'Utilidades compartidas',
        mcp: 'Servidor MCP para desarrollo'
      }
    };

    return {
      contents: [
        {
          uri: 'lt-erp://project-structure',
          text: JSON.stringify(structure, null, 2)
        }
      ]
    };
  }
);

// Recurso: Controladores disponibles
server.registerResource(
  'lt-erp-controllers',
  'lt-erp://controllers',
  {
    title: 'Controladores del sistema',
    description: 'Lista de controladores backend con sus funciones exportadas',
    mimeType: 'application/json'
  },
  async () => {
    const controllersDir = path.join(PROJECT_ROOT, 'controllers');
    const controllers = {};

    function extractFunctions(filePath) {
      const source = fs.readFileSync(filePath, 'utf8');
      const functions = [];
      const regex = /(?:function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)|const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>)/g;
      let match;

      while ((match = regex.exec(source))) {
        const name = match[1] || match[3];
        const params = (match[2] || match[4] || '')
          .split(',')
          .map(p => p.trim())
          .filter(Boolean);

        const description = extractDocComment(source, match.index);

        functions.push({
          name,
          params,
          description: description || 'Sin descripción'
        });
      }

      return functions;
    }

    function scanControllers(dir) {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          scanControllers(fullPath);
        } else if (item.endsWith('.js')) {
          const relativePath = path.relative(PROJECT_ROOT, fullPath);
          controllers[relativePath] = {
            path: relativePath,
            functions: extractFunctions(fullPath)
          };
        }
      });
    }

    scanControllers(controllersDir);

    return {
      contents: [
        {
          uri: 'lt-erp://controllers',
          text: JSON.stringify(controllers, null, 2)
        }
      ]
    };
  }
);

// Recurso: Configuración del proyecto
server.registerResource(
  'lt-erp-config',
  'lt-erp://config',
  {
    title: 'Configuración del proyecto',
    description: 'Archivos de configuración (appsscript.json, .clasp.json, package.json)',
    mimeType: 'application/json'
  },
  async () => {
    const configs = {};

    const configFiles = [
      'appsscript.json',
      '.clasp.json',
      'package.json'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        try {
          configs[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
          configs[file] = { error: `No se pudo parsear: ${err.message}` };
        }
      }
    });

    return {
      contents: [
        {
          uri: 'lt-erp://config',
          text: JSON.stringify(configs, null, 2)
        }
      ]
    };
  }
);

// Herramienta: Deploy con clasp
server.registerTool(
  'clasp-push',
  {
    title: 'Deploy con clasp',
    description: 'Ejecuta clasp push para subir cambios a Google Apps Script',
    inputSchema: z.object({
      force: z.boolean().describe('Usar --force para sobrescribir cambios remotos').optional()
    })
  },
  async ({ force }) => {
    return new Promise((resolve, reject) => {
      const args = ['push'];
      if (force) args.push('--force');

      const proc = spawn('clasp', args, {
        cwd: PROJECT_ROOT,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => (stdout += d.toString()));
      proc.stderr.on('data', (d) => (stderr += d.toString()));

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: `✓ clasp push completado\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `✗ clasp push falló (código ${code})\n${stderr || stdout}`
              }
            ],
            isError: true
          });
        }
      });
    });
  }
);

// Herramienta: Validar sintaxis
server.registerTool(
  'validate-syntax',
  {
    title: 'Validar sintaxis JavaScript',
    description: 'Valida la sintaxis de archivos JavaScript del proyecto',
    inputSchema: z.object({
      files: z.array(z.string()).describe('Archivos a validar (rutas relativas)').optional()
    })
  },
  async ({ files }) => {
    const filesToCheck = files || [
      'Main.js',
      'DatabaseService.js',
      'Format.js',
      'WebApp.gs.js'
    ];

    const results = [];

    for (const file of filesToCheck) {
      const filePath = path.join(PROJECT_ROOT, file);

      if (!fs.existsSync(filePath)) {
        results.push({
          file,
          status: 'not_found',
          message: 'Archivo no encontrado'
        });
        continue;
      }

      try {
        const code = fs.readFileSync(filePath, 'utf8');
        // Intentar parsear con vm
        new vm.Script(code, { filename: file });
        results.push({
          file,
          status: 'valid',
          message: '✓ Sintaxis válida'
        });
      } catch (err) {
        results.push({
          file,
          status: 'error',
          message: err.message,
          stack: err.stack
        });
      }
    }

    const hasErrors = results.some(r => r.status === 'error');

    return {
      content: [
        {
          type: 'text',
          text: hasErrors
            ? '✗ Se encontraron errores de sintaxis'
            : '✓ Todos los archivos tienen sintaxis válida'
        }
      ],
      // Devuelve un objeto para cumplir con el esquema esperado por el cliente MCP
      structuredContent: { results },
      isError: hasErrors
    };
  }
);

server.registerTool(
  'db-fetch',
  {
    title: 'Leer Sheets vía WebApp',
    description: 'Lee datos JSON desde la WebApp (api=db) usando LT_ERP_API_URL y LT_ERP_API_KEY.',
    inputSchema: z.object({
      format: z.string().describe('ID del formato a leer (ej: CLIENTES, EMPLEADOS)').optional()
    })
  },
  async ({ format }) => {
    if (!API_URL || !API_KEY) {
      return {
        content: [
          {
            type: 'text',
            text: 'Configura LT_ERP_API_URL y LT_ERP_API_KEY en el entorno antes de usar db-fetch.'
          }
        ],
        isError: true
      };
    }

    const url = new URL(API_URL);
    url.searchParams.set('api', 'db');
    url.searchParams.set('apiKey', API_KEY);
    if (format) {
      url.searchParams.set('format', format.toUpperCase());
    }

    try {
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: `No se pudo parsear JSON (${res.status}): ${text}`
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Leído ${format ? format : 'all'} (${res.status})`
          }
        ],
        structuredContent: json
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error al llamar API: ${err.message || err}`
          }
        ],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Print to stderr to avoid corrupting MCP protocol messages on stdout.
  console.error('lt-erp-mcp listo (stdio)');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error al iniciar lt-erp-mcp:', err);
    process.exit(1);
  });
}

module.exports = {
  loadFormats,
  extractPublicApi,
  loadBundleSources,
  runBundleBuild
};
