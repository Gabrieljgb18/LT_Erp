(function (global) {
    const WEEKLY_CACHE_TTL_MS = 5 * 60 * 1000;
    const weeklyCache = { data: null, ts: 0, inFlight: null };

    const AttendancePanelsData = {
        fetchDailyAttendance: function (tipoFormato, fecha) {
            if (!global.AttendanceDailyData || typeof global.AttendanceDailyData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            return global.AttendanceDailyData.searchRecords(tipoFormato, fecha);
        },
        searchWeeklyPlans: function (query, options) {
            if (!global.RecordsData || typeof global.RecordsData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            const q = query || "";
            const force = options && options.force;
            if (!q && !force && weeklyCache.data && (Date.now() - weeklyCache.ts) < WEEKLY_CACHE_TTL_MS) {
                return Promise.resolve(weeklyCache.data);
            }
            if (!q && !force && weeklyCache.inFlight) {
                return weeklyCache.inFlight;
            }
            const request = global.RecordsData.searchRecords("ASISTENCIA_PLAN", q)
                .then(function (records) {
                    if (records && records.ignored) return records;
                    if (!q) {
                        weeklyCache.data = records || [];
                        weeklyCache.ts = Date.now();
                    }
                    weeklyCache.inFlight = null;
                    return records;
                })
                .catch(function (err) {
                    weeklyCache.inFlight = null;
                    throw err;
                });
            if (!q) {
                weeklyCache.inFlight = request;
            }
            return request;
        },
        prefetchWeeklyPlans: function () {
            return AttendancePanelsData.searchWeeklyPlans("", { force: true })
                .catch(function () {
                    return null;
                });
        }
    };

    global.AttendancePanelsData = AttendancePanelsData;
})(typeof window !== "undefined" ? window : this);
