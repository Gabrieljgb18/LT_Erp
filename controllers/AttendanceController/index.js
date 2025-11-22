/**
 * AttendanceController - Main Index
 * Módulo central que expone todas las funciones de asistencia
 * 
 * Depende de:
 * - AttendancePlanVsReal
 * - AttendanceDailyAttendance
 * - AttendanceCoverage
 * - AttendanceWeeklyPlan
 */

const AttendanceController = (function () {

    return {
        // Plan vs Real
        getPlanVsAsistencia: AttendancePlanVsReal.getPlanVsAsistencia,
        saveAsistenciaFromPlan: AttendancePlanVsReal.saveAsistenciaFromPlan,

        // Daily Attendance
        getDailyAttendancePlan: AttendanceDailyAttendance.getDailyAttendancePlan,
        saveDailyAttendance: AttendanceDailyAttendance.saveDailyAttendance,

        // Coverage
        getClientDayCoverage: AttendanceCoverage.getClientDayCoverage,
        getClientWeeklyRequestedHours: AttendanceCoverage.getClientWeeklyRequestedHours,

        // Weekly Plan
        buildWeeklyTemplateFromClient: AttendanceWeeklyPlan.buildWeeklyTemplateFromClient,
        getWeeklyPlanForClient: AttendanceWeeklyPlan.getWeeklyPlanForClient,
        saveWeeklyPlanForClient: AttendanceWeeklyPlan.saveWeeklyPlanForClient
    };
})();
