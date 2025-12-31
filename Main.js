/**
 * Main.js - Reduced version
 * Este archivo solo contiene las funciones API públ icas que exponen los controladores
 * 
 * Dependencias (cargadas en este orden por clasp):
 * - utils/dataUtils.js
 * - utils/dateUtils.js
 * - DatabaseService.js
 * - Format.js
 * - controllers/RecordController.js
 * - controllers/AttendanceController/planVsReal.js
 * - controllers/AttendanceController/dailyAttendance.js
 * - controllers/AttendanceController/coverage.js
 * - controllers/AttendanceController/weeklyPlan.js
 * - controllers/AttendanceController/index.js
 */

// ===================== API pública (google.script.run) =====================

/**
 * Obtiene la lista de formatos disponibles
 */
function getAvailableFormats() {
  return RecordController.getAvailableFormats();
}

/**
 * Busca registros en un formato
 */
function searchRecords(tipoFormato, query) {
  return RecordController.searchRecords(tipoFormato, query);
}

/**
 * Guarda un nuevo registro
 */
function saveFormRecord(tipoFormato, record) {
  return RecordController.saveRecord(tipoFormato, record);
}

/**
 * Actualiza un registro existente
 */
function updateRecord(tipoFormato, id, newRecord) {
  return RecordController.updateRecord(tipoFormato, id, newRecord);
}

/**
 * Elimina un registro
 */
function deleteRecord(tipoFormato, id) {
  return RecordController.deleteRecord(tipoFormato, id);
}

/**
 * Obtiene datos de referencia (clientes y empleados activos)
 */
function getReferenceData() {
  return RecordController.getReferenceData();
}

// ===================== Media Clientes (Drive) =====================

function getClientMedia(clientId) {
  // Compat: devuelve el listado completo (fachada/llave arrays)
  return ClientMediaController.listClientMedia(clientId);
}

function listClientMedia(clientId) {
  return ClientMediaController.listClientMedia(clientId);
}

function getClientMediaImage(fileId, maxSizePx) {
  return ClientMediaController.getClientMediaImage(fileId, maxSizePx);
}

function uploadClientMedia(payload) {
  return ClientMediaController.uploadClientMedia(payload);
}

function deleteClientMedia(clientId, kind) {
  return ClientMediaController.deleteClientMedia(clientId, kind);
}

function deleteClientMediaFile(fileId) {
  return ClientMediaController.deleteClientMediaFile(fileId);
}

// Helper para autorizar scopes nuevos (Drive) desde el editor de Apps Script.
function authorizeDriveScopes() {
  DriveApp.getRootFolder().getName();
  return { ok: true };
}

/**
 * Obtiene la comparación entre plan y asistencia real
 */
function getPlanVsAsistencia(fechaStr, cliente, idCliente) {
  return AttendancePlanVsReal.getPlanVsAsistencia(fechaStr, cliente, idCliente);
}

/**
 * Guarda la asistencia real basada en el plan
 */
function saveAsistenciaFromPlan(fechaStr, cliente, items, idCliente) {
  return AttendancePlanVsReal.saveAsistenciaFromPlan(fechaStr, cliente, items, idCliente);
}

/**
 * Obtiene el plan de asistencia diaria
 */
function getDailyAttendancePlan(fechaStr) {
  return AttendanceDailyAttendance.getDailyAttendancePlan(fechaStr);
}

/**
 * Guarda la asistencia diaria
 */
function saveDailyAttendance(fechaStr, rows) {
  return AttendanceDailyAttendance.saveDailyAttendance(fechaStr, rows);
}

/**
 * Calcula la cobertura de horas para un cliente en un día
 */
function getClientDayCoverage(clienteLabel, dayName) {
  return AttendanceCoverage.getClientDayCoverage(clienteLabel, dayName);
}

/**
 * Construye un template semanal desde las horas contratadas del cliente
 */
function buildWeeklyTemplateFromClient(cliente, idCliente) {
  return AttendanceWeeklyPlan.buildWeeklyTemplateFromClient(cliente, idCliente);
}

/**
 * Obtiene las horas semanales contratadas para un cliente
 */
function getClientWeeklyRequestedHours(clienteLabel) {
  return AttendanceCoverage.getClientWeeklyRequestedHours(clienteLabel);
}

/**
 * Obtiene el plan semanal completo para un cliente
 */
function getWeeklyPlanForClient(cliente, idCliente) {
  return AttendanceWeeklyPlan.getWeeklyPlanForClient(cliente, idCliente);
}

/**
 * Guarda el plan semanal completo para un cliente
 */
function saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente) {
  return AttendanceWeeklyPlan.saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente);
}

/**
 * Aplica valores masivos (empleados/clientes/presentismo)
 */
function applyMassValues(payload) {
  return BulkValuesController.applyMassValues(payload);
}

/**
 * Devuelve configuración general (CONFIG_DB)
 */
function getConfig() {
  return DatabaseService.getConfig ? DatabaseService.getConfig() : {};
}

/**
 * Obtiene el detalle de horas filtrado
 */
function getHoursDetail(startDate, endDate, client, idCliente) {
  return HoursController.getHoursDetail(startDate, endDate, client, idCliente);
}

/**
 * Obtiene horas por cliente (con resumen)
 */
function getHoursByClient(startDate, endDate, client, idCliente) {
  return HoursController.getHoursByClient(startDate, endDate, client, idCliente);
}

/**
 * Obtiene el detalle de horas filtrado por empleado
 */
function getHoursByEmployee(startDate, endDate, employee, idEmpleado) {
  return HoursController.getHoursByEmployee(startDate, endDate, employee, idEmpleado);
}

/**
 * Resumen mensual por empleado
 */
function getMonthlySummary(year, month) {
  return HoursController.getMonthlySummary(year, month);
}

/**
 * Obtiene la cuenta corriente de un cliente
 */
function getClientAccountStatement(clientName, startDate, endDate, idCliente) {
  return AccountController.getClientAccountStatement(clientName, startDate, endDate, idCliente);
}

/**
 * Lista facturas de un cliente
 */
function getClientInvoices(clientName, idCliente) {
  return AccountController.getClientInvoices(clientName, idCliente);
}

/**
 * Lista facturas pendientes de cobro (para registrar pago)
 */
function getClientInvoicesForPayment(clientName, idCliente) {
  return AccountController.getClientInvoicesForPayment(clientName, idCliente);
}

/**
 * Registra un cobro de cliente
 */
function recordClientPayment(payload) {
  return AccountController.recordClientPayment(payload);
}

/**
 * Genera PDF de horas por empleado
 */
function generateHoursPdf(startDateStr, endDateStr, employeeName) {
  return PdfController.generateHoursPdf(startDateStr, endDateStr, employeeName);
}

/**
 * Genera PDF de horas por cliente
 */
function generateClientHoursPdf(startDateStr, endDateStr, clientName) {
  return PdfController.generateClientHoursPdf(startDateStr, endDateStr, clientName);
}

/**
 * Resumen mensual por cliente
 */
function getMonthlySummaryByClient(year, month) {
  return HoursController.getMonthlySummaryByClient(year, month);
}

/**
 * Guarda pago de empleado
 */
function recordEmployeePayment(fecha, empleado, concepto, monto, obs) {
  return RecordController.recordEmployeePayment(fecha, empleado, concepto, monto, obs);
}

/**
 * Cuenta corriente mensual por empleado
 */
function getEmployeeAccountStatement(year, month) {
  return AccountController.getEmployeeAccountStatement(year, month);
}

/**
 * Cuenta corriente mensual por cliente
 */
function getClientMonthlyAccountStatement(year, month) {
  return ClientAccountController.getClientAccountStatement(year, month);
}

/**
 * Registrar cobro de cliente
 */
function recordClientMonthlyPayment(fecha, cliente, concepto, monto, obs) {
  return ClientAccountController.recordClientPayment(fecha, cliente, concepto, monto, obs);
}


// ===================== FACTURACIÓN API =====================

function getInvoices(filters) {
  return InvoiceController.getInvoices(filters);
}

function getInvoiceById(id) {
  return InvoiceController.getInvoiceById(id);
}

function createInvoice(data) {
  return InvoiceController.createInvoice(data);
}

/**
 * Crea factura a partir de asistencia (cliente + rango)
 */
function createInvoiceFromAttendance(cliente, fechaDesde, fechaHasta, extra, idCliente) {
  return InvoiceController.createInvoiceFromAttendance(cliente, fechaDesde, fechaHasta, extra, idCliente);
}

/**
 * Control de facturación mensual: horas por cliente y si fue facturado.
 * @param {string} period yyyy-MM
 * @param {object=} opts
 */
function getInvoicingCoverage(period, opts) {
  return InvoiceController.getInvoicingCoverage(period, opts);
}

function updateInvoice(id, data) {
  return InvoiceController.updateInvoice(id, data);
}

function deleteInvoice(id) {
  return InvoiceController.deleteInvoice(id);
}

function generateInvoicePdf(id) {
  return InvoiceController.generateInvoicePdf(id);
}

// ===================== ASISTENCIA API =====================

function getEmployeeWeeklySchedule(empleado, idEmpleado, weekStartDate) {
  return AttendanceEmployeeSchedule.getEmployeeWeeklySchedule(empleado, idEmpleado, weekStartDate);
}

function getEmpleadosConId() {
  return AttendanceEmployeeSchedule.getEmpleadosConId();
}

function getWeeklyClientOverview(weekStartDate, clientId) {
  return AttendanceEmployeeSchedule.getWeeklyClientOverview(weekStartDate, clientId);
}

function generateEmployeeSchedulePdf(empleado, idEmpleado, weekStartDate) {
  return PdfController.generateEmployeeSchedulePdf(empleado, idEmpleado, weekStartDate);
}
