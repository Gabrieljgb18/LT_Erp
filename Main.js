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
function updateRecord(tipoFormato, rowNumber, newRecord) {
  return RecordController.updateRecord(tipoFormato, rowNumber, newRecord);
}

/**
 * Elimina un registro
 */
function deleteRecord(tipoFormato, rowNumber) {
  return RecordController.deleteRecord(tipoFormato, rowNumber);
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
  return AttendanceController.getPlanVsAsistencia(fechaStr, cliente);
}

/**
 * Guarda la asistencia real basada en el plan
 */
function saveAsistenciaFromPlan(fechaStr, cliente, items) {
  return AttendanceController.saveAsistenciaFromPlan(fechaStr, cliente, items);
}

/**
 * Obtiene el plan de asistencia diaria
 */
function getDailyAttendancePlan(fechaStr) {
  return AttendanceController.getDailyAttendancePlan(fechaStr);
}

/**
 * Guarda la asistencia diaria
 */
function saveDailyAttendance(fechaStr, rows) {
  return AttendanceController.saveDailyAttendance(fechaStr, rows);
}

/**
 * Calcula la cobertura de horas para un cliente en un día
 */
function getClientDayCoverage(clienteLabel, dayName) {
  return AttendanceController.getClientDayCoverage(clienteLabel, dayName);
}

/**
 * Construye un template semanal desde las horas contratadas del cliente
 */
function buildWeeklyTemplateFromClient(cliente) {
  return AttendanceController.buildWeeklyTemplateFromClient(cliente);
}

/**
 * Obtiene las horas semanales contratadas para un cliente
 */
function getClientWeeklyRequestedHours(clienteLabel) {
  return AttendanceController.getClientWeeklyRequestedHours(clienteLabel);
}

/**
 * Obtiene el plan semanal completo para un cliente
 */
function getWeeklyPlanForClient(cliente) {
  return AttendanceController.getWeeklyPlanForClient(cliente);
}

/**
 * Guarda el plan semanal completo para un cliente
 */
function saveWeeklyPlanForClient(cliente, items) {
  return AttendanceController.saveWeeklyPlanForClient(cliente, items);
}
