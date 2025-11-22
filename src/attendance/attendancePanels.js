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
            // Placeholder for daily attendance panel
            // Will be implemented when needed
            console.log("Daily attendance panel setup");
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);
