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

/**
 * Obtiene la comparación entre plan y asistencia real
 */
function getPlanVsAsistencia(fechaStr, cliente) {
  return AttendancePlanVsReal.getPlanVsAsistencia(fechaStr, cliente);
}

/**
 * Guarda la asistencia real basada en el plan
 */
function saveAsistenciaFromPlan(fechaStr, cliente, items) {
  return AttendancePlanVsReal.saveAsistenciaFromPlan(fechaStr, cliente, items);
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
function buildWeeklyTemplateFromClient(cliente) {
  return AttendanceWeeklyPlan.buildWeeklyTemplateFromClient(cliente);
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
function getWeeklyPlanForClient(cliente) {
  return AttendanceWeeklyPlan.getWeeklyPlanForClient(cliente);
}

/**
 * Guarda el plan semanal completo para un cliente
 */
function saveWeeklyPlanForClient(cliente, items, originalVigencia) {
  return AttendanceWeeklyPlan.saveWeeklyPlanForClient(cliente, items, originalVigencia);
}

/**
 * Aplica valores masivos (empleados/clientes/presentismo)
 */
function applyMassValues(payload) {
  return BulkValuesController.applyMassValues(payload);
}
/**
 * Obtiene el detalle de horas filtrado
 */
function getHoursDetail(startDate, endDate, client) {
  return HoursController.getHoursDetail(startDate, endDate, client);
}

/**
 * Obtiene horas por cliente (con resumen)
 */
function getHoursByClient(startDate, endDate, client) {
  return HoursController.getHoursByClient(startDate, endDate, client);
}

/**
 * Obtiene el detalle de horas filtrado por empleado
 */
function getHoursByEmployee(startDate, endDate, employee) {
  return HoursController.getHoursByEmployee(startDate, endDate, employee);
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
function getClientAccountStatement(clientName, startDate, endDate) {
  return AccountController.getClientAccountStatement(clientName, startDate, endDate);
}

/**
 * Registra un cobro de cliente
 */
function recordClientPayment(fecha, cliente, monto, obs) {
  return AccountController.recordClientPayment(fecha, cliente, monto, obs);
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
function getClientAccountStatement(year, month) {
  return ClientAccountController.getClientAccountStatement(year, month);
}

/**
 * Registrar cobro de cliente
 */
function recordClientPayment(fecha, cliente, concepto, monto, obs) {
  return ClientAccountController.recordClientPayment(fecha, cliente, concepto, monto, obs);
}
