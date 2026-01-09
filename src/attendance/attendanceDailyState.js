/**
 * AttendanceDailyState
 * Estado compartido para asistencia diaria.
 */
(function (global) {
  const AttendanceDailyState = {
    fecha: "",
    rows: [],
    loading: false,
    reference: { clientes: [], empleados: [] },
    rootEl: null,
    pendingFecha: null,
    pendingFocus: null,
    eventsController: null,
    rowEventsController: null,
    summaryEventsController: null,
    collapseEventsController: null
  };

  AttendanceDailyState.getTodayIso = function () {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  AttendanceDailyState.reset = function (fecha) {
    AttendanceDailyState.fecha = fecha || AttendanceDailyState.getTodayIso();
    AttendanceDailyState.rows = [];
    AttendanceDailyState.loading = false;
  };

  AttendanceDailyState.setRoot = function (el) {
    AttendanceDailyState.rootEl = el || null;
  };

  AttendanceDailyState.setReference = function (refs) {
    AttendanceDailyState.reference = refs || { clientes: [], empleados: [] };
  };

  AttendanceDailyState.setRows = function (rows) {
    AttendanceDailyState.rows = Array.isArray(rows) ? rows : [];
  };

  AttendanceDailyState.setFecha = function (fecha) {
    AttendanceDailyState.fecha = fecha || AttendanceDailyState.getTodayIso();
  };

  AttendanceDailyState.setLoading = function (isLoading) {
    AttendanceDailyState.loading = !!isLoading;
  };

  AttendanceDailyState.setPendingFecha = function (fecha) {
    AttendanceDailyState.pendingFecha = fecha || null;
  };

  AttendanceDailyState.consumePendingFecha = function () {
    const value = AttendanceDailyState.pendingFecha;
    AttendanceDailyState.pendingFecha = null;
    return value;
  };

  AttendanceDailyState.setPendingFocus = function (focus) {
    AttendanceDailyState.pendingFocus = focus || null;
  };

  AttendanceDailyState.consumePendingFocus = function () {
    const value = AttendanceDailyState.pendingFocus;
    AttendanceDailyState.pendingFocus = null;
    return value;
  };

  AttendanceDailyState.normalizeRow = function (row, extra, idx) {
    return {
      uid: (extra ? "extra-" : "plan-") + (idx != null ? idx : Date.now()),
      cliente: row && row.cliente ? String(row.cliente) : "",
      idCliente: row && row.idCliente ? row.idCliente : "",
      empleado: row && row.empleado ? String(row.empleado) : "",
      idEmpleado: row && row.idEmpleado ? row.idEmpleado : "",
      horaPlan: row && row.horaPlan ? String(row.horaPlan) : "",
      horasPlan: row && row.horasPlan !== undefined && row.horasPlan !== null ? row.horasPlan : "",
      asistencia: row && row.asistencia ? true : false,
      horasReales: row && row.horasReales !== undefined && row.horasReales !== null ? row.horasReales : "",
      observaciones: row && row.observaciones ? String(row.observaciones) : "",
      asistenciaRowNumber: row && row.asistenciaRowNumber ? row.asistenciaRowNumber : null,
      idAsistencia: row && (row.idAsistencia != null && row.idAsistencia !== "") ? row.idAsistencia : null,
      fueraDePlan: !!extra || !!(row && row.fueraDePlan)
    };
  };

  global.AttendanceDailyState = AttendanceDailyState;
})(typeof window !== "undefined" ? window : this);
