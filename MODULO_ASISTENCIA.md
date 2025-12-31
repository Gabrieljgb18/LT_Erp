# Módulo de Asistencia - Plan de Implementación

## Resumen
Crear un módulo de asistencia completo con:
1. ✅ Reorganización del sidebar con submenú expandible
2. ✅ Vista calendario por empleado (vista semanal)
3. ✅ Generación de PDF "Hoja de Ruta" para empleados

## Archivos Creados

### Frontend (src/)
- ✅ `src/attendance/employeeCalendarPanel.js` - Vista calendario del empleado

### Backend (controllers/)
- ✅ `controllers/AttendanceController/employeeSchedule.js` - Lógica de agenda por empleado

## Archivos Modificados

- ✅ `FrontedErp.html` - Nuevo sidebar con submenú, nuevas vistas
- ✅ `src/ui/sidebar.js` - Soporte para submenús expandibles
- ✅ `src/main.js` - Event handlers para nuevas vistas
- ✅ `controllers/PdfController.js` - Nueva función para PDF de empleado
- ✅ `Main.js` - Exponer nuevas funciones API
- ✅ `frontend_css.html` - Estilos para calendario y submenú
- ✅ `generate_bundle_html.js` - Agregar nuevos archivos al bundle
- ✅ `bundle.js` y `bundle_js.html` - Regenerados

## Estructura del Sidebar

```
LT ERP
├── 📋 Formularios (data-target="registro")
├── 📅 Asistencia (expandible) ← NUEVO
│   ├── Plan Semanal (data-target="asistencia-plan")
│   ├── Tomar Asistencia (data-target="asistencia-diaria")
│   └── Calendario Empleado (data-target="asistencia-calendario") ← NUEVO
├── 👥 Reporte Empleados (data-target="reportes")
├── 🏢 Reporte Clientes (data-target="reportes-clientes")
├── 📄 Facturación (data-target="facturacion")
└── ⚙️ Configuración (data-target="configuracion")
```

## API Backend Disponible

### getEmployeeWeeklySchedule(empleado, idEmpleado, weekStartDate)
Devuelve el plan semanal del empleado con datos del cliente.

### getEmpleadosConId()
Devuelve lista de empleados activos con sus IDs.

### generateEmployeeSchedulePdf(empleado, idEmpleado, weekStartDate)
Genera PDF con la hoja de ruta semanal incluyendo direcciones, teléfonos y observaciones.

## Próximos Pasos

1. Ejecutar `npx clasp push` para desplegar a Google Apps Script
2. Probar el nuevo sidebar con submenú
3. Probar la vista de calendario del empleado
4. Probar la generación de PDF de hoja de ruta
5. (Opcional) Agregar fotos de fachada/llave al PDF

## Notas

- Las fotos del cliente (fachada/llave) se muestran en el modal de detalles pero no en el PDF
- El PDF se genera con el mismo estilo profesional que los otros reportes
