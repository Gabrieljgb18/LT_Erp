(function (global) {
    const state = global.AttendancePanelsState;

    function bindDateChange(dateInput, loadFn) {
        if (!dateInput || typeof loadFn !== "function") return;
        if (state && state.dailyController) {
            state.dailyController.abort();
        }
        if (state) {
            state.dailyController = new AbortController();
            dateInput.addEventListener("change", loadFn, { signal: state.dailyController.signal });
        } else {
            dateInput.addEventListener("change", loadFn);
        }
    }

    function createDailyLoader(tipoFormato) {
        const data = global.AttendancePanelsData;
        return function loadAttendance() {
            const dateInput = document.getElementById("field-fecha");
            const fecha = dateInput ? dateInput.value : "";
            if (!data || typeof data.fetchDailyAttendance !== "function") {
                if (global.GridManager) {
                    global.GridManager.renderGrid(tipoFormato, []);
                }
                return;
            }
            data.fetchDailyAttendance(tipoFormato, fecha)
                .then(function (records) {
                    if (global.GridManager) {
                        global.GridManager.renderGrid(tipoFormato, records || []);
                    }
                })
                .catch(function (err) {
                    if (global.Alerts && typeof global.Alerts.showError === "function") {
                        global.Alerts.showError("Error cargando asistencia", err);
                    } else {
                        console.error("Error cargando asistencia:", err);
                    }
                    if (global.GridManager) {
                        global.GridManager.renderGrid(tipoFormato, []);
                    }
                });
        };
    }

    global.AttendancePanelsHandlers = {
        bindDateChange: bindDateChange,
        createDailyLoader: createDailyLoader
    };
})(typeof window !== "undefined" ? window : this);
