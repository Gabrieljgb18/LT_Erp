/**
 * Controlador de Registros (CRUD genérico)
 * Maneja operaciones CRUD para todos los formatos del sistema
 */

var RecordController = (function () {

    /**
     * Obtiene la lista de formatos disponibles
     * @returns {Array} Lista de formatos con id y nombre
     */
    function getAvailableFormats() {
        return Formats.getAvailableFormats();
    }

    /**
     * Busca registros en un formato específico
     * @param {string} tipoFormato - Tipo de formato a buscar
     * @param {string} query - Término de búsqueda
     * @returns {Array} Array de registros que coinciden con la búsqueda
     */
    function searchRecords(tipoFormato, query) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        if (lastRow < 2 || lastCol === 0) {
            return [];
        }

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        const q = (query || '').toString().toLowerCase().trim();
        const results = [];

        data.forEach(function (row, index) {
            const rowStrings = row.map(DataUtils.normalizeCellForSearch);
            const rowText = rowStrings.join(' ').toLowerCase();

            if (!q || rowText.indexOf(q) !== -1) {
                const record = {};
                headers.forEach(function (h, colIdx) {
                    // Use normalized strings - this handles Dates correctly
                    record[h] = rowStrings[colIdx];
                });

                results.push({
                    id: row[0], // First column is ID
                    rowNumber: index + 2,
                    record: record
                });
            }
        });

        return results;
    }

    /**
     * Construye un array de valores en el orden de los headers
     * @param {Array} headers - Array de nombres de columnas
     * @param {Object} record - Objeto con los datos del registro
     * @returns {Array} Array de valores ordenados según headers
     */
    function buildRowValues(headers, record) {
        return headers.map(function (h) {
            return record[h] != null ? record[h] : '';
        });
    }

    /**
     * Guarda un nuevo registro
     * @param {string} tipoFormato - Tipo de formato
     * @param {Object} record - Datos del registro
     * @returns {number} ID del nuevo registro
     */
    function saveRecord(tipoFormato, record) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
        const template = Formats.getFormatTemplate(tipoFormato);
        const headers = template.headers || [];

        // Si la hoja está vacía, agregar headers
        if (sheet.getLastRow() === 0 && headers.length > 0) {
            sheet.appendRow(headers);
        }

        // Generate new ID
        const newId = DatabaseService.getNextId(sheet);
        record['ID'] = newId;

        const row = buildRowValues(headers, record);

        // Ensure ID is in first position
        if (row[0] != newId) {
            row[0] = newId;
        }

        sheet.appendRow(row);

        // Log value changes for CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const clienteNombre = record['NOMBRE'] || record['RAZON SOCIAL'] || '';
            const valorHora = record['VALOR HORA'];
            if (clienteNombre && valorHora !== undefined && valorHora !== '') {
                DatabaseService.appendHoraLogCliente(clienteNombre, valorHora);
            }
        }

        // Log value changes for EMPLEADOS
        if (tipoFormato === 'EMPLEADOS') {
            const empleadoNombre = record['EMPLEADO'] || '';
            const valorHora = record['VALOR DE HORA'];
            if (empleadoNombre && valorHora !== undefined && valorHora !== '') {
                DatabaseService.appendHoraLogEmpleado(empleadoNombre, valorHora);
            }
        }

        return newId;
    }

    /**
     * Actualiza un registro existente
     * @param {string} tipoFormato - Tipo de formato
     * @param {number} id - ID del registro a actualizar
     * @param {Object} newRecord - Nuevos datos del registro
     * @returns {boolean} true si se actualizó correctamente
     */
    function updateRecord(tipoFormato, id, newRecord) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
        const template = Formats.getFormatTemplate(tipoFormato);

        if (!template) {
            throw new Error('Formato no encontrado: ' + tipoFormato);
        }

        const headers = template.headers || [];
        if (!headers.length) {
            throw new Error('El formato no tiene headers definidos: ' + tipoFormato);
        }

        // Find row by ID
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) {
            throw new Error('Registro con ID ' + id + ' no encontrado');
        }

        const lastCol = sheet.getLastColumn();
        const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        // Get current values for comparison
        const currentRowValues = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
        const currentRecord = {};
        headerRow.forEach(function (h, idx) {
            currentRecord[h] = currentRowValues[idx];
        });

        // Ensure ID is set (frontend doesn't send ID field)
        newRecord['ID'] = id;

        // Build new row values with ID in correct position
        const newRowValues = buildRowValues(headers, newRecord);

        // Verify ID is in first position (safety check)
        if (newRowValues[0] != id) {
            newRowValues[0] = id;
        }

        sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRowValues]);

        // Log value changes for CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const oldValor = currentRecord['VALOR HORA'];
            const newValor = newRecord['VALOR HORA'];
            const clienteNombre = newRecord['NOMBRE'] || newRecord['RAZON SOCIAL'] || '';
            if (clienteNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogCliente(clienteNombre, newValor);
            }
        }

        // Log value changes for EMPLEADOS
        if (tipoFormato === 'EMPLEADOS') {
            const oldValor = currentRecord['VALOR DE HORA'];
            const newValor = newRecord['VALOR DE HORA'];
            const empleadoNombre = newRecord['EMPLEADO'] || '';
            if (empleadoNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogEmpleado(empleadoNombre, newValor);
            }
        }

        return true;
    }

    /**
     * Elimina un registro
     * @param {string} tipoFormato - Tipo de formato
     * @param {number} id - ID del registro a eliminar
     */
    function deleteRecord(tipoFormato, id) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);

        // Find row by ID
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) {
            throw new Error('Registro con ID ' + id + ' no encontrado');
        }

        sheet.deleteRow(rowNumber);
    }

    /**
     * Guarda un pago de empleado en PAGOS_EMP_DB
     */
    function recordEmployeePayment(fechaStr, empleado, concepto, monto, obs) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_EMP');
        const templateHeaders = ['ID', 'FECHA', 'EMPLEADO', 'CONCEPTO', 'MONTO', 'OBSERVACIONES'];
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(templateHeaders);
        }
        const id = DatabaseService.getNextId(sheet);
        const fecha = fechaStr ? new Date(fechaStr) : new Date();
        const row = [
            id,
            fecha,
            empleado || '',
            concepto || '',
            Number(monto) || 0,
            obs || ''
        ];
        sheet.appendRow(row);
        return id;
    }

    /**
     * Obtiene datos de referencia (clientes y empleados activos)
     * @returns {Object} Objeto con arrays de clientes y empleados
     */
    function getReferenceData() {
        return DatabaseService.getReferenceData();
    }

    return {
        getAvailableFormats: getAvailableFormats,
        searchRecords: searchRecords,
        saveRecord: saveRecord,
        updateRecord: updateRecord,
        deleteRecord: deleteRecord,
        getReferenceData: getReferenceData,
        recordEmployeePayment: recordEmployeePayment
    };
})();
