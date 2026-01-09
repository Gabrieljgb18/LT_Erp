/**
 * AttendanceService
 * Encapsula llamadas de asistencia y planificacion.
 */
(function (global) {
  const AttendanceService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function toArr(value) {
      return Array.isArray(value) ? value : [];
    }

    function searchRecords(tipoFormato, query) {
      return ApiService.call("searchRecords", toStr(tipoFormato), toStr(query));
    }

    function saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente) {
      return ApiService.call(
        "saveWeeklyPlanForClient",
        cliente || "",
        toArr(items),
        originalVigencia || null,
        toStr(idCliente)
      );
    }

    function getWeeklyClientOverview(payload) {
      return ApiService.call("getWeeklyClientOverview", toObj(payload));
    }

    function saveDailyAttendance(fecha, payload) {
      return ApiService.call("saveDailyAttendance", toStr(fecha), toObj(payload));
    }

    function listClientMedia(clienteId) {
      return ApiService.call("listClientMedia", toStr(clienteId));
    }

    function getClientMediaImage(fileId, size) {
      return ApiService.call("getClientMediaImage", toStr(fileId), size || 1600);
    }

    function getEmpleadosConId() {
      return ApiService.call("getEmpleadosConId");
    }

    function generateEmployeeSchedulePdf(payload) {
      return ApiService.call("generateEmployeeSchedulePdf", toObj(payload));
    }

    function updateAttendanceRecord(id, payload) {
      return ApiService.call("updateRecord", "ASISTENCIA", toStr(id), toObj(payload));
    }

    function deleteAttendanceRecord(id) {
      return ApiService.call("deleteRecord", "ASISTENCIA", toStr(id));
    }

    return {
      searchRecords,
      saveWeeklyPlanForClient,
      getWeeklyClientOverview,
      saveDailyAttendance,
      listClientMedia,
      getClientMediaImage,
      getEmpleadosConId,
      generateEmployeeSchedulePdf,
      updateAttendanceRecord,
      deleteAttendanceRecord
    };
  })();

  global.AttendanceService = AttendanceService;
})(typeof window !== "undefined" ? window : this);
