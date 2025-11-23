# LT_ERP - Sistema de Gestión Empresarial

Sistema de gestión empresarial (ERP) basado en Google Apps Script y Google Sheets, diseñado para gestionar clientes, empleados, facturación, pagos y asistencia.

## 📋 Descripción General

LT_ERP es una aplicación web que funciona sobre la infraestructura de Google. Utiliza Google Sheets como base de datos y Google Apps Script como backend, sirviendo una interfaz web moderna y reactiva al usuario.

### Características Principales
- **Gestión de Registros:** CRUD completo para Clientes, Empleados, Facturación y Pagos.
- **Búsqueda Avanzada:** Buscador en tiempo real con normalización de datos y soporte para fechas.
- **Control de Asistencia:** Módulos para planificación semanal, asistencia diaria y cálculo de cobertura.
- **Interfaz Reactiva:** Frontend modularizado que no requiere recargas de página.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura cliente-servidor clásica adaptada al ecosistema de Google:

### Backend (Google Apps Script)
- **`Main.js`**: Punto de entrada de la API pública. Expone funciones globales (`searchRecords`, `saveFormRecord`, etc.) que el cliente llama mediante `google.script.run`.
- **`WebApp.gs.js`**: Maneja la petición HTTP inicial (`doGet`) y sirve el HTML principal.
- **`DatabaseService.js`**: Capa de acceso a datos. Maneja la lectura/escritura en las hojas de cálculo de Google Sheets.
- **`RecordController.js`**: Lógica de negocio para la gestión de registros (búsqueda, validación, guardado).
- **`Format.js`**: Define la estructura de datos, columnas y tipos para cada módulo (CLIENTES, EMPLEADOS, etc.).

### Frontend (HTML/JS)
El código del cliente está modularizado en `src/` y se compila en un solo archivo durante el despliegue.
- **`src/main.js`**: Punto de entrada del cliente. Inicializa la app y maneja eventos globales.
- **`src/forms/`**: Gestión dinámica de formularios basada en definiciones JSON.
- **`src/search/`**: Lógica de búsqueda, debounce y renderizado de resultados.
- **`src/records/`**: Manejo de carga y edición de registros.
- **`src/apiService.js`**: Wrapper para `google.script.run` con soporte para Promesas y manejo de errores.

---

## 🔄 Flujo de Datos

### 1. Búsqueda de Registros
1. Usuario escribe en el buscador (`src/search/searchManager.js`).
2. Se llama a `RecordController.searchRecords` en el backend.
3. Backend normaliza los datos (especialmente fechas) para asegurar serialización JSON correcta.
4. Resultados se muestran con vista previa inteligente (priorizando ID y Nombre).

### 2. Guardado/Edición
1. Usuario llena el formulario generado dinámicamente por `FormManager`.
2. `RecordManager` recopila los datos.
3. Se envía a `RecordController.saveRecord` o `updateRecord`.
4. `DatabaseService` escribe en la hoja correspondiente y actualiza el ID si es nuevo.

---

## 🛠️ Configuración y Despliegue

El proyecto utiliza `clasp` para gestionar el código en Google Apps Script.

### Comandos Clave
- **Generar Bundle:**
  ```bash
  node generate_bundle_html.js
  ```
  Concatena todos los archivos JS de `src/` en `bundle.js` y `bundle_js.html`.

- **Subir Cambios:**
  ```bash
  npx clasp push
  ```

- **Desplegar Versión:**
  ```bash
  npx clasp deploy --description "Descripción"
  ```

---

## 🚀 Oportunidades de Mejora

A pesar de que el sistema es estable, existen áreas para futura optimización:

1. **Caché de Referencias:**
   - Actualmente `getReferenceData` se llama frecuentemente. Implementar `CacheService` de Apps Script en el backend podría reducir latencia.

2. **Validación de Tipos en Backend:**
   - Aunque el frontend valida tipos, el backend confía en los datos recibidos. Agregar una capa de validación estricta (Schema Validation) en `RecordController` aumentaría la robustez.

3. **Paginación de Resultados:**
   - La búsqueda actual devuelve todos los resultados coincidentes. Para bases de datos muy grandes, implementar paginación mejoraría el rendimiento.

4. **Tests Automatizados:**
   - Implementar un suite de tests unitarios para `DatabaseService` y `RecordController` usando una hoja de cálculo de prueba dedicada.

5. **Manejo de Estados de Carga:**
   - Unificar todos los indicadores de carga (spinners) en un servicio centralizado de UI para una experiencia más consistente.

---

**Versión Estable:** 1.0.0 (v127)
**Última Actualización:** Noviembre 2025
