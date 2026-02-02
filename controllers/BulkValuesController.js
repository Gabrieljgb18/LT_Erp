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
        const vIvaPct = sanitizeNumber(payload.ivaPorcentaje);

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
        if (vIvaPct != null) configEntries['IVA_PORCENTAJE'] = vIvaPct;
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

        let normalizedValue = value;
        if (typeof ValidationService !== 'undefined' && ValidationService && typeof ValidationService.validateAndNormalizeRecord === 'function') {
            const payload = {};
            payload[columnName] = value;
            const validation = ValidationService.validateAndNormalizeRecord(formatId, payload, 'update', { headers: [columnName], partial: true });
            if (!validation.ok) {
                throw new Error('Validacion: ' + validation.errors.join(' '));
            }
            if (Object.prototype.hasOwnProperty.call(validation.record, columnName)) {
                normalizedValue = validation.record[columnName];
            }
        }

        const rowCount = lastRow - 1;
        const range = sheet.getRange(2, idx + 1, rowCount, 1);

        const shouldLogClientRate = formatId === 'CLIENTES' && columnName === 'VALOR HORA';
        const shouldLogEmployeeRate = formatId === 'EMPLEADOS' && columnName === 'VALOR DE HORA';
        const shouldLogRate = shouldLogClientRate || shouldLogEmployeeRate;

        const data = shouldLogRate ? sheet.getRange(2, 1, rowCount, lastCol).getValues() : null;
        const values = [];

        let idxId = -1;
        let idxNombre = -1;
        let idxRazon = -1;
        if (shouldLogClientRate) {
            idxId = headers.indexOf('ID');
            idxNombre = headers.indexOf('NOMBRE');
            idxRazon = headers.indexOf('RAZON SOCIAL');
        } else if (shouldLogEmployeeRate) {
            idxId = headers.indexOf('ID');
            idxNombre = headers.indexOf('EMPLEADO');
        }

        for (let i = 0; i < rowCount; i++) {
            values.push([normalizedValue]);
            if (!shouldLogRate) continue;

            const row = data[i];
            const oldVal = row[idx];
            if (valuesEqual_(oldVal, normalizedValue)) continue;

            const idVal = idxId > -1 ? row[idxId] : '';
            let nameVal = idxNombre > -1 ? row[idxNombre] : '';
            if (shouldLogClientRate && !nameVal && idxRazon > -1) {
                nameVal = row[idxRazon] || '';
            }
            if (!nameVal && !idVal) continue;

            if (shouldLogClientRate) {
                DatabaseService.appendHoraLogCliente(idVal, nameVal, normalizedValue);
            } else if (shouldLogEmployeeRate) {
                DatabaseService.appendHoraLogEmpleado(idVal, nameVal, normalizedValue);
            }
        }

        range.setValues(values);
    }

    function valuesEqual_(left, right) {
        if (left == null && right == null) return true;
        const nLeft = Number(left);
        const nRight = Number(right);
        if (!isNaN(nLeft) && !isNaN(nRight)) return nLeft === nRight;
        return String(left == null ? '' : left) === String(right == null ? '' : right);
    }

    return {
        applyMassValues: applyMassValues
    };
})();
