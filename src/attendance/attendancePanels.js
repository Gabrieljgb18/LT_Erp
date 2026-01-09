/**
 * Attendance Panels - Consolidated
 * Wrapper para todos los paneles de asistencia
 */

(function (global) {
    const AttendancePanels = (() => {
        const render = global.AttendancePanelsRender;
        const handlers = global.AttendancePanelsHandlers;

        function setupWeeklyPlanPanel() {
            // Delegar la creación del panel semanal al módulo centralizado WeeklyPlanPanel
            if (typeof WeeklyPlanPanel !== 'undefined' && WeeklyPlanPanel.setup) {
                WeeklyPlanPanel.setup();
            } else {
                console.error('WeeklyPlanPanel no está disponible');
                if (typeof Alerts !== 'undefined' && Alerts) {
                    if (Alerts.notifyError) {
                        Alerts.notifyError('Error al cargar el plan semanal', new Error('WeeklyPlanPanel no está disponible'));
                    } else if (Alerts.showError) {
                        Alerts.showError('Error al cargar el plan semanal', new Error('WeeklyPlanPanel no está disponible'));
                    } else {
                        Alerts.showAlert('Error al cargar el plan semanal.', 'danger');
                    }
                }
            }
        }

        function setupDailyPanel() {
            // Contenedor donde se mostrará la grilla de asistencia diaria
            const container = document.getElementById('daily-attendance-panel');
            if (!container) return;

            if (render && typeof render.renderDailyPanel === "function") {
                render.renderDailyPanel(container);
            }

            const loadAttendance = handlers && typeof handlers.createDailyLoader === "function"
                ? handlers.createDailyLoader("ASISTENCIA")
                : function () { };

            loadAttendance();

            const dateInput = document.getElementById("field-fecha");
            if (handlers && typeof handlers.bindDateChange === "function") {
                handlers.bindDateChange(dateInput, loadAttendance);
            }
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);
