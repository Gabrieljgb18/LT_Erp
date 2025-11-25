/**
 * Controlador para el detalle de horas
 */
var HoursController = (function () {

    /**
     * Obtiene el detalle de horas filtrado por fecha y cliente
     * @param {string} startDateStr - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDateStr - Fecha fin (YYYY-MM-DD)
     * @param {string} clientName - Nombre del cliente
     * @returns {Array} Lista de registros filtrados
     */
    function getHoursDetail(startDateStr, endDateStr, clientName) {
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();

        // Headers are in row 1 (index 0)
        const headers = data[0];
        const rows = data.slice(1); // Skip headers

        // Find column indices
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxObs = headers.indexOf('OBSERVACIONES');

        if (idxFecha === -1 || idxCliente === -1) {
            console.error("Columnas requeridas no encontradas en ASISTENCIA");
            return [];
        }

        // Parse filter dates
        // Assuming input dates are YYYY-MM-DD
        const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
        const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

        // Normalize client name for comparison
        const targetClient = clientName ? clientName.toLowerCase().trim() : '';

        const results = [];

        rows.forEach(function (row) {
            const rowClient = String(row[idxCliente] || '').toLowerCase().trim();
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);

            // Filter by Client
            if (targetClient && rowClient !== targetClient) {
                return;
            }

            // Filter by Date Range
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            // Add to results
            results.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]), // Return as string for frontend
                cliente: row[idxCliente], // Include client name
                empleado: row[idxEmpleado],
                horas: row[idxHoras],
                observaciones: row[idxObs],
                // Keep original row index if needed for updates, though ID is better
                originalRow: row
            });
        });

        // Sort by date descending
        return results.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });
    }

    /**
     * Obtiene el detalle de horas filtrado por fecha y empleado
     * @param {string} startDateStr - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDateStr - Fecha fin (YYYY-MM-DD)
     * @param {string} employeeName - Nombre del empleado
     * @returns {Array} Lista de registros filtrados
     */
    function getHoursByEmployee(startDateStr, endDateStr, employeeName) {
        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA');
        const data = sheet.getDataRange().getValues();

        // Headers are in row 1 (index 0)
        const headers = data[0];
        const rows = data.slice(1); // Skip headers

        // Find column indices
        const idxId = headers.indexOf('ID');
        const idxFecha = headers.indexOf('FECHA');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxHoras = headers.indexOf('HORAS');
        const idxObs = headers.indexOf('OBSERVACIONES');

        if (idxFecha === -1 || idxEmpleado === -1) {
            console.error("Columnas requeridas no encontradas en ASISTENCIA");
            return [];
        }

        // Parse filter dates
        const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
        const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

        // Normalize employee name for comparison
        const targetEmployee = employeeName ? employeeName.toLowerCase().trim() : '';

        const results = [];

        rows.forEach(function (row) {
            const rowEmployee = String(row[idxEmpleado] || '').toLowerCase().trim();
            const rowDate = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);

            // Filter by Employee
            if (targetEmployee && rowEmployee !== targetEmployee) {
                return;
            }

            // Filter by Date Range
            if (start && rowDate < start) return;
            if (end && rowDate > end) return;

            // Add to results
            results.push({
                id: row[idxId],
                fecha: DataUtils.normalizeCellForSearch(row[idxFecha]),
                cliente: row[idxCliente],
                empleado: row[idxEmpleado],
                horas: row[idxHoras],
                observaciones: row[idxObs],
                originalRow: row
            });
        });

        // Sort by date descending
        return results.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });
    }

    return {
        getHoursDetail: getHoursDetail,
        getHoursByEmployee: getHoursByEmployee
    };

})();
