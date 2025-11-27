/**
 * Controlador para actualizar valores masivos (empleados/clientes/presentismo)
 */
var BulkValuesController = (function () {

    /**
     * Aplica valores masivos a hojas de Empleados y Clientes y guarda presentismo.
     * @param {Object} payload
     * @param {number|string} payload.valorHoraEmpleado
     * @param {number|string} payload.valorHoraCliente
     * @param {number|string} payload.viaticos
     * @param {number|string} payload.presentismoMedia
     * @param {number|string} payload.presentismoCompleta
     */
    function applyMassValues(payload) {
        payload = payload || {};
        const vEmp = sanitizeNumber(payload.valorHoraEmpleado);
        const vCli = sanitizeNumber(payload.valorHoraCliente);
        const vVia = sanitizeNumber(payload.viaticos);
        const vPresMedia = sanitizeNumber(payload.presentismoMedia);
        const vPresFull = sanitizeNumber(payload.presentismoCompleta);

        if (vEmp != null) {
            updateColumn('EMPLEADOS', 'VALOR DE HORA', vEmp);
        }
        if (vVia != null) {
            updateColumn('EMPLEADOS', 'VIATICOS', vVia);
        }
        if (vCli != null) {
            updateColumn('CLIENTES', 'VALOR HORA', vCli);
        }

        // Guardar presentismo en CONFIG_DB
        const configEntries = {};
        if (vPresMedia != null) configEntries['PRESENTISMO_MEDIA'] = vPresMedia;
        if (vPresFull != null) configEntries['PRESENTISMO_COMPLETA'] = vPresFull;
        if (Object.keys(configEntries).length) {
            DatabaseService.upsertConfig(configEntries);
        }

        return { ok: true };
    }

    function sanitizeNumber(value) {
        if (value === undefined || value === null || value === '') return null;
        const n = Number(value);
        return isNaN(n) ? null : n;
    }

    function updateColumn(formatId, columnName, value) {
        const sheet = DatabaseService.getDbSheetForFormat(formatId);
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idx = headers.indexOf(columnName);
        if (idx === -1) return;

        const range = sheet.getRange(2, idx + 1, lastRow - 1, 1);
        const values = range.getValues().map(() => [value]);
        range.setValues(values);
    }

    return {
        applyMassValues: applyMassValues
    };
})();
