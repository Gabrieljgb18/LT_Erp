/**
 * Attendance Panels - Consolidated
 * Wrapper para todos los paneles de asistencia
 */

(function (global) {
    const AttendancePanels = (() => {

        function setupWeeklyPlanPanel() {
            if (global.WeeklyPlanPanel) {
                global.WeeklyPlanPanel.setup();
            }
        }

        function setupDailyPanel() {
            const container = document.getElementById('daily-attendance-panel');
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);
