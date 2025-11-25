/**
 * Attendance Panels - Consolidated
 * Wrapper para todos los paneles de asistencia
 */

(function (global) {
    const AttendancePanels = (() => {

        function setupWeeklyPlanPanel() {
            // Delegar la creación del panel semanal al módulo centralizado WeeklyPlanPanel
            if (typeof WeeklyPlanPanel !== 'undefined' && WeeklyPlanPanel.setup) {
                WeeklyPlanPanel.setup();
            } else {
                console.error('WeeklyPlanPanel no está disponible');
                if (typeof Alerts !== 'undefined' && Alerts) {
                    Alerts.showAlert('Error al cargar el plan semanal.', 'danger');
                }
            }
        }

        function setupDailyPanel() {
            // Contenedor donde se mostrará la grilla de asistencia diaria
            const container = document.getElementById('daily-attendance-panel');
            if (!container) return;

            // Limpiar contenido previo
            container.innerHTML = '';

            // Crear estructura de la grilla (tabla) dentro del contenedor
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'card shadow-sm p-3 mb-4'; // Card con sombra y padding
            gridWrapper.innerHTML = `
                <h5 class="card-title mb-3">Asistencia Diaria</h5>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead><tr id="grid-headers"></tr></thead>
                        <tbody id="grid-body"></tbody>
                    </table>
                </div>`;
            container.appendChild(gridWrapper);

            // Función para cargar los registros según la fecha seleccionada
            function loadAttendance() {
                const dateInput = document.getElementById('field-fecha'); // Asumiendo que el campo de fecha tiene este ID
                const fecha = dateInput ? dateInput.value : '';
                const tipoFormato = 'ASISTENCIA';
                ApiService.call('searchRecords', tipoFormato, fecha)
                    .then(function (records) {
                        if (GridManager) {
                            GridManager.renderGrid(tipoFormato, records || []);
                        }
                    })
                    .catch(function (err) {
                        console.error('Error cargando asistencia:', err);
                        if (GridManager) {
                            GridManager.renderGrid('ASISTENCIA', []);
                        }
                    });
            }

            // Cargar datos al iniciar
            loadAttendance();

            // Si el usuario cambia la fecha, recargar la grilla
            const dateInput = document.getElementById('field-fecha');
            if (dateInput) {
                dateInput.addEventListener('change', loadAttendance);
            }
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);
