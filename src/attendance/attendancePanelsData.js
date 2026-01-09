(function (global) {
    const AttendancePanelsData = {
        fetchDailyAttendance: function (tipoFormato, fecha) {
            if (!global.AttendanceDailyData || typeof global.AttendanceDailyData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            return global.AttendanceDailyData.searchRecords(tipoFormato, fecha);
        },
        searchWeeklyPlans: function (query) {
            if (!global.RecordsData || typeof global.RecordsData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            return global.RecordsData.searchRecords("ASISTENCIA_PLAN", query || "");
        }
    };

    global.AttendancePanelsData = AttendancePanelsData;
})(typeof window !== "undefined" ? window : this);
