/**
 * Controlador de Registros (CRUD genérico)
 * Maneja operaciones CRUD para todos los formatos del sistema
 */

const RecordController = (function () {

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

        if (lastRow < 2 || lastCol === 0) return [];

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
     */
    function saveRecord(tipoFormato, record) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
        const template = Formats.getFormatTemplate(tipoFormato);
        if (!template) {
            throw new Error('Formato no encontrado: ' + tipoFormato);
        }

        const headers = template.headers || [];
        if (!headers.length) {
            throw new Error('El formato no tiene headers definidos: ' + tipoFormato);
        }

        // Generate new ID
        const newId = DatabaseService.getNextId(sheet);
        record['ID'] = newId;

        const row = buildRowValues(headers, record);
        sheet.appendRow(row);

        // Log de cambios en valor de hora para CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const clienteNombre = record['NOMBRE'] || record['RAZON SOCIAL'] || '';
            const valorHora = record['VALOR DE HORA'];
            if (clienteNombre && valorHora !== undefined && valorHora !== '') {
                DatabaseService.appendHoraLogCliente(clienteNombre, valorHora);
            }
        }

        // Log de cambios en valor de hora para EMPLEADOS
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

        // Obtener valores actuales para comparación
        const currentRowValues = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
        const currentRecord = {};
        headerRow.forEach(function (h, idx) {
            currentRecord[h] = currentRowValues[idx];
        });

        // Preserve ID
        newRecord['ID'] = id;

        // Actualizar la fila
        const newRowValues = buildRowValues(headers, newRecord);
        sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRowValues]);

        // Log de cambios en valor de hora para CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const oldValor = currentRecord['VALOR DE HORA'];
            const newValor = newRecord['VALOR DE HORA'];
            const clienteNombre = newRecord['NOMBRE'] || newRecord['RAZON SOCIAL'] || '';
            if (clienteNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogCliente(clienteNombre, newValor);
            }
        }

        // Log de cambios en valor de hora para EMPLEADOS
        if (tipoFormato === 'EMPLEADOS') {
            const oldValor = currentRecord['VALOR DE HORA'];
            const newValor = newRecord['VALOR DE HORA'];
            const empleadoNombre = newRecord['EMPLEADO'] || '';
            if (empleadoNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogEmpleado(empleadoNombre, newValor);
            }
        }
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
        getReferenceData: getReferenceData
    };
})();
