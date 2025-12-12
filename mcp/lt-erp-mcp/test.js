#!/usr/bin/env node

/**
 * Script de prueba para verificar que el servidor MCP funciona correctamente
 */

const path = require('path');
const {
    loadFormats,
    extractPublicApi,
    loadBundleSources,
    runBundleBuild
} = require('./server.js');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

console.log('🧪 Iniciando tests del MCP LT_ERP...\n');

// Test 1: Cargar formatos
console.log('📋 Test 1: Cargar formatos desde Format.js');
try {
    const formats = loadFormats();
    console.log(`✓ Formatos cargados: ${formats.availableFormats.length} formatos disponibles`);
    console.log(`  Ejemplos: ${formats.availableFormats.slice(0, 3).map(f => f.id).join(', ')}`);
} catch (err) {
    console.error(`✗ Error al cargar formatos: ${err.message}`);
}

console.log('');

// Test 2: Extraer API pública
console.log('🔌 Test 2: Extraer API pública de Main.js');
try {
    const api = extractPublicApi();
    console.log(`✓ API extraída: ${api.functions.length} funciones encontradas`);
    console.log(`  Ejemplos: ${api.functions.slice(0, 3).map(f => f.name).join(', ')}`);
} catch (err) {
    console.error(`✗ Error al extraer API: ${err.message}`);
}

console.log('');

// Test 3: Cargar orden del bundle
console.log('📦 Test 3: Cargar orden del bundle');
try {
    const bundle = loadBundleSources();
    console.log(`✓ Bundle analizado: ${bundle.order.length} archivos en el bundle`);
    if (bundle.missing.length > 0) {
        console.warn(`  ⚠ Archivos faltantes: ${bundle.missing.join(', ')}`);
    }
    bundle.targets.forEach(t => {
        console.log(`  ${t.exists ? '✓' : '✗'} ${t.path}`);
    });
} catch (err) {
    console.error(`✗ Error al cargar bundle: ${err.message}`);
}

console.log('');

// Test 4: Verificar estructura de directorios
console.log('📁 Test 4: Verificar estructura del proyecto');
try {
    const fs = require('fs');
    const requiredDirs = ['controllers', 'src', 'utils', 'mcp'];
    const requiredFiles = ['Main.js', 'DatabaseService.js', 'Format.js'];

    let allGood = true;

    requiredDirs.forEach(dir => {
        const exists = fs.existsSync(path.join(PROJECT_ROOT, dir));
        console.log(`  ${exists ? '✓' : '✗'} Directorio: ${dir}`);
        if (!exists) allGood = false;
    });

    requiredFiles.forEach(file => {
        const exists = fs.existsSync(path.join(PROJECT_ROOT, file));
        console.log(`  ${exists ? '✓' : '✗'} Archivo: ${file}`);
        if (!exists) allGood = false;
    });

    if (allGood) {
        console.log('✓ Estructura del proyecto verificada');
    } else {
        console.warn('⚠ Algunos archivos o directorios no se encontraron');
    }
} catch (err) {
    console.error(`✗ Error al verificar estructura: ${err.message}`);
}

console.log('');

// Test 5: Verificar configuración
console.log('⚙️  Test 5: Verificar archivos de configuración');
try {
    const fs = require('fs');
    const configs = ['appsscript.json', '.clasp.json'];

    configs.forEach(config => {
        const configPath = path.join(PROJECT_ROOT, config);
        if (fs.existsSync(configPath)) {
            try {
                const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                console.log(`  ✓ ${config} - válido`);
            } catch (err) {
                console.error(`  ✗ ${config} - JSON inválido: ${err.message}`);
            }
        } else {
            console.warn(`  ⚠ ${config} - no encontrado`);
        }
    });
} catch (err) {
    console.error(`✗ Error al verificar configuración: ${err.message}`);
}

console.log('');
console.log('✅ Tests completados!\n');

// Información adicional
console.log('📊 Información del MCP:');
console.log(`  Nombre: lt-erp-mcp`);
console.log(`  Versión: 0.1.0`);
console.log(`  Raíz del proyecto: ${PROJECT_ROOT}`);
console.log('');
console.log('💡 Para usar el MCP, asegúrate de que esté configurado en tu archivo de configuración de Codex.');
console.log('   Ver README.md para más detalles.');
