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
     * @param {boolean} [includeInactive=false] - Si es true, incluye registros inactivos (baja lógica)
     * @returns {Array} Array de registros que coinciden con la búsqueda
     */
    function searchRecords(tipoFormato, query, includeInactive) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
        const includeInactiveBool =
            includeInactive === true ||
            includeInactive === 1 ||
            includeInactive === '1' ||
            includeInactive === 'true' ||
            includeInactive === 'TRUE';

        // Reparación automática de datos legacy para ADELANTOS (corrimiento de columnas)
        if (tipoFormato === 'ADELANTOS' && DatabaseService && typeof DatabaseService.repairAdelantosLegacyRows === 'function') {
            try {
                DatabaseService.repairAdelantosLegacyRows();
            } catch (e) {
                // ignore
            }
        }

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        if (lastRow < 2 || lastCol === 0) {
            return [];
        }

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const headerKeys = headers.map(h => String(h || '').trim().toUpperCase());
        const idxId = headerKeys.indexOf('ID');
        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        const q = (query || '').toString().toLowerCase().trim();
        const results = [];

        data.forEach(function (row, index) {
            // Filtro de baja lógica para CLIENTES y EMPLEADOS
            if (!includeInactiveBool && (tipoFormato === 'CLIENTES' || tipoFormato === 'EMPLEADOS')) {
                const idxEstado = headerKeys.indexOf('ESTADO');
                if (idxEstado > -1) {
                    const estadoVal = row[idxEstado];
                    const estadoStr = String(estadoVal == null ? '' : estadoVal).trim();
                    if (estadoStr) {
                        const isActive = DataUtils && typeof DataUtils.isTruthy === 'function'
                            ? DataUtils.isTruthy(estadoVal)
                            : (estadoVal === true || estadoVal === 1);
                        if (!isActive) return;
                    }
                }
            }

            const rowStrings = row.map(function (cell, colIdx) {
                return DataUtils.normalizeCellForSearch(cell, headers[colIdx]);
            });
            const rowText = rowStrings.join(' ').toLowerCase();

            if (!q || rowText.indexOf(q) !== -1) {
                const record = {};
                headers.forEach(function (h, colIdx) {
                    // Use normalized strings - this handles Dates correctly
                    record[h] = rowStrings[colIdx];
                });

                const rowId = idxId > -1 ? row[idxId] : row[0];
                results.push({
                    id: rowId,
                    rowNumber: index + 2,
                    record: record
                });
            }
        });

        return results;
    }

    /**
     * Obtiene un registro por ID en un formato específico
     * @param {string} tipoFormato - Tipo de formato
     * @param {number|string} id - ID del registro
     * @returns {Object|null} Registro encontrado
     */
    function getRecordById(tipoFormato, id) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) return null;

        const lastCol = sheet.getLastColumn();
        if (!lastCol) return null;

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
        const record = {};

        headers.forEach(function (h, colIdx) {
            if (DataUtils && typeof DataUtils.normalizeCellForSearch === 'function') {
                record[h] = DataUtils.normalizeCellForSearch(row[colIdx], h);
            } else {
                record[h] = row[colIdx] == null ? '' : String(row[colIdx]);
            }
        });

        return {
            id: record['ID'] || id,
            rowNumber: rowNumber,
            record: record
        };
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

    function normalizeDocType_(value) {
        const raw = String(value || '').trim().toUpperCase();
        if (raw === 'DNI' || raw === 'CUIL' || raw === 'CUIT') return raw;
        return raw;
    }

    function normalizeDocNumber_(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function ensureUniqueEmployeeDocument_(sheet, headers, record, ignoreId) {
        if (!record || !headers || !headers.length) return;
        const idxDocType = headers.indexOf('TIPO DOCUMENTO');
        const idxDocNumber = headers.indexOf('NUMERO DOCUMENTO');
        if (idxDocNumber === -1) return;
        const docNumber = normalizeDocNumber_(record['NUMERO DOCUMENTO']);
        if (!docNumber) return;
        const docType = normalizeDocType_(record['TIPO DOCUMENTO']);
        const idxId = headers.indexOf('ID');
        const idxNombre = headers.indexOf('EMPLEADO');
        const lastRow = sheet.getLastRow();
        if (lastRow < 2) return;

        const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowId = idxId > -1 ? row[idxId] : row[0];
            if (ignoreId != null && String(rowId) === String(ignoreId)) continue;
            const rowDocNumber = normalizeDocNumber_(idxDocNumber > -1 ? row[idxDocNumber] : '');
            if (!rowDocNumber || rowDocNumber !== docNumber) continue;
            const rowDocType = normalizeDocType_(idxDocType > -1 ? row[idxDocType] : '');
            const typeMatches = docType && rowDocType ? docType === rowDocType : true;
            if (!typeMatches) continue;
            const nombre = idxNombre > -1 ? row[idxNombre] : '';
            const docLabel = (docType ? docType + ' ' : '') + docNumber;
            const suffix = nombre ? ' (' + nombre + ')' : '';
            throw new Error('Documento duplicado: ' + docLabel + '. Ya existe un empleado' + suffix + '.');
        }
    }

    function ensureRequiredIds(tipoFormato, record) {
        const rulesByFormat = {
            ASISTENCIA: [
                { idField: 'ID_CLIENTE', labelField: 'CLIENTE' },
                { idField: 'ID_EMPLEADO', labelField: 'EMPLEADO' }
            ],
            ASISTENCIA_PLAN: [
                { idField: 'ID_CLIENTE', labelField: 'CLIENTE' },
                { idField: 'ID_EMPLEADO', labelField: 'EMPLEADO' }
            ],
            ADELANTOS: [
                { idField: 'ID_EMPLEADO', labelField: 'EMPLEADO' }
            ],
            FACTURACION: [
                { idField: 'ID_CLIENTE', labelField: 'RAZÓN SOCIAL' }
            ],
            PAGOS_CLIENTES: [
                { idField: 'ID_CLIENTE', labelField: 'RAZÓN SOCIAL' }
            ]
        };

        const rules = rulesByFormat[tipoFormato];
        if (!rules || !record) return;

        rules.forEach(rule => {
            const idVal = record[rule.idField];
            const labelVal = rule.labelField ? record[rule.labelField] : '';
            const hasLabel = labelVal != null && String(labelVal).trim() !== '';
            const hasId = idVal != null && String(idVal).trim() !== '';
            if (!hasId && (hasLabel || record.hasOwnProperty(rule.idField))) {
                throw new Error('Falta ' + rule.idField + ' para guardar el registro.');
            }
        });
    }

    function ensureHeaders_(sheet, headers, templateHeaders) {
        if (!templateHeaders || !templateHeaders.length) return headers;
        if (!headers || !headers.length) return templateHeaders;

        const missing = templateHeaders.filter(h => headers.indexOf(h) === -1);
        if (!missing.length) return headers;

        const newHeaders = headers.concat(missing);

        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);

        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            const blanks = [];
            for (let i = 0; i < lastRow - 1; i++) {
                blanks.push(new Array(missing.length).fill(''));
            }
            sheet.getRange(2, headers.length + 1, lastRow - 1, missing.length).setValues(blanks);
        }

        return newHeaders;
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
        const templateHeaders = (template && template.headers) ? template.headers : [];

        // Preferimos usar headers reales de la hoja si ya existen para evitar desalineaciones
        let headers = [];
        const existingLastRow = sheet.getLastRow();
        const existingLastCol = sheet.getLastColumn();
        if (existingLastRow >= 1 && existingLastCol > 0) {
            headers = sheet.getRange(1, 1, 1, existingLastCol).getValues()[0];
            headers = ensureHeaders_(sheet, headers, templateHeaders);
        } else {
            headers = templateHeaders;
        }

        if (typeof ValidationService !== 'undefined' && ValidationService && typeof ValidationService.validateAndNormalizeRecord === 'function') {
            const validation = ValidationService.validateAndNormalizeRecord(tipoFormato, record, 'create', { headers: headers });
            if (!validation.ok) {
                throw new Error('Validacion: ' + validation.errors.join(' '));
            }
            record = validation.record;
        }

        ensureRequiredIds(tipoFormato, record);

        // Si la hoja está vacía, agregar headers
        if (sheet.getLastRow() === 0 && headers.length > 0) {
            sheet.appendRow(headers);
        }

        // Generate new ID y escribir fila con lock para evitar duplicados
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(30000);
        } catch (e) {
            throw new Error('No se pudo obtener lock para guardar. Reintentá.');
        }

        let newId;
        try {
            if (tipoFormato === 'EMPLEADOS') {
                ensureUniqueEmployeeDocument_(sheet, headers, record, null);
            }

            newId = DatabaseService.getNextId(sheet);
            record['ID'] = newId;

            const row = buildRowValues(headers, record);

            // Ensure ID is set in correct position
            const idxId = headers.indexOf('ID');
            if (idxId > -1) {
                row[idxId] = newId;
            } else if (row[0] != newId) {
                row[0] = newId;
            }

            sheet.appendRow(row);
        } finally {
            lock.releaseLock();
        }

        // Log value changes for CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const clienteNombre = record['NOMBRE'] || record['RAZON SOCIAL'] || '';
            const valorHora = record['VALOR HORA'];
            if (clienteNombre && valorHora !== undefined && valorHora !== '') {
                DatabaseService.appendHoraLogCliente(clienteNombre, valorHora);
            }
            if (DatabaseService && typeof DatabaseService.upsertClientTags === 'function') {
                const tags = record['ETIQUETAS'];
                if (tags) DatabaseService.upsertClientTags(tags);
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

        // Find row by ID
        const rowNumber = DatabaseService.findRowById(sheet, id);
        if (!rowNumber) {
            throw new Error('Registro con ID ' + id + ' no encontrado');
        }

        const lastCol = sheet.getLastColumn();
        let headerRow = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
        let headers = headerRow || [];
        if (!headers.length) {
            throw new Error('No se pudieron leer headers de la hoja para: ' + tipoFormato);
        }
        headers = ensureHeaders_(sheet, headers, (template && template.headers) ? template.headers : []);
        headerRow = headers;

        // Get current values for comparison
        const currentRowValues = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
        const currentRecord = {};
        headerRow.forEach(function (h, idx) {
            currentRecord[h] = currentRowValues[idx];
        });

        let incoming = newRecord;
        if (typeof ValidationService !== 'undefined' && ValidationService && typeof ValidationService.validateAndNormalizeRecord === 'function') {
            const validation = ValidationService.validateAndNormalizeRecord(tipoFormato, newRecord, 'update', { headers: headers, partial: true });
            if (!validation.ok) {
                throw new Error('Validacion: ' + validation.errors.join(' '));
            }
            incoming = validation.record;
        }

        // Preserve valores de columnas que el frontend no envía (ej: nuevos IDs)
        headers.forEach(function (h) {
            if (incoming[h] === undefined && currentRecord[h] !== undefined) {
                incoming[h] = currentRecord[h];
            }
        });

        // Ensure ID is set (frontend doesn't send ID field)
        incoming['ID'] = id;

        ensureRequiredIds(tipoFormato, incoming);
        if (tipoFormato === 'EMPLEADOS') {
            ensureUniqueEmployeeDocument_(sheet, headers, incoming, id);
        }

        // Build new row values with ID in correct position
        const newRowValues = buildRowValues(headers, incoming);

        // Verify ID is in correct position (safety check)
        const idxId = headers.indexOf('ID');
        if (idxId > -1) {
            newRowValues[idxId] = id;
        } else if (newRowValues[0] != id) {
            newRowValues[0] = id;
        }

        sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRowValues]);

        // Log value changes for CLIENTES
        if (tipoFormato === 'CLIENTES') {
            const oldValor = currentRecord['VALOR HORA'];
            const newValor = incoming['VALOR HORA'];
            const clienteNombre = incoming['NOMBRE'] || incoming['RAZON SOCIAL'] || '';
            if (clienteNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogCliente(clienteNombre, newValor);
            }
            if (DatabaseService && typeof DatabaseService.upsertClientTags === 'function') {
                const tags = incoming['ETIQUETAS'];
                if (tags) DatabaseService.upsertClientTags(tags);
            }
        }

        // Log value changes for EMPLEADOS
        if (tipoFormato === 'EMPLEADOS') {
            const oldValor = currentRecord['VALOR DE HORA'];
            const newValor = incoming['VALOR DE HORA'];
            const empleadoNombre = incoming['EMPLEADO'] || '';
            if (empleadoNombre && newValor !== undefined && newValor !== '' && newValor !== oldValor) {
                DatabaseService.appendHoraLogEmpleado(empleadoNombre, newValor);
            }
        }

        return true;
    }

    /**
     * Elimina un registro (o realiza baja lógica si corresponde)
     * @param {string} tipoFormato - Tipo de formato
     * @param {number} id - ID del registro a eliminar
     */
    function deleteRecord(tipoFormato, id) {
        const sheet = DatabaseService.getDbSheetForFormat(tipoFormato);

        // Lock para evitar colisiones
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(30000);
        } catch (e) {
            throw new Error('No se pudo obtener lock para eliminar. Reintentá.');
        }

        try {
            let targetId = id;
            let rowNumber = null;
            if (id && typeof id === 'object') {
                if (id.id != null) targetId = id.id;
                if (id.ID != null) targetId = id.ID;
                rowNumber = Number(id.rowNumber) || null;
            }

            const targetStr = targetId == null ? '' : String(targetId).trim();
            const lastRow = sheet.getLastRow();
            const lastCol = sheet.getLastColumn();

            let finalRow = null;

            // 1. Intentar validar usando el rowNumber provisto para optimizar
            if (rowNumber && rowNumber >= 2 && rowNumber <= lastRow) {
                let idCol = 1;
                let headers = [];
                if (lastCol > 0) {
                    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
                        .map(h => String(h || '').trim().toUpperCase());
                    const idxId = headers.indexOf('ID');
                    if (idxId > -1) idCol = idxId + 1;
                }
                const rowIdVal = sheet.getRange(rowNumber, idCol).getValue();
                const rowIdStr = String(rowIdVal || '').trim();
                const rowIdNum = Number(rowIdStr);
                const targetNum = Number(targetStr);

                const matches = targetStr
                    ? (rowIdStr === targetStr || (!isNaN(rowIdNum) && !isNaN(targetNum) && rowIdNum === targetNum))
                    : false;

                if (matches || !targetStr) {
                    finalRow = rowNumber;
                }
            }

            // 2. Si no se encontró por rowNumber, buscar por ID (fallback)
            if (!finalRow) {
                finalRow = DatabaseService.findRowById(sheet, targetId);
            }

            if (!finalRow) {
                throw new Error('Registro con ID ' + targetId + ' no encontrado');
            }

            // 3. Determinar estrategia: Baja Lógica (Soft Delete) vs Baja Física
            // Para CLIENTES y EMPLEADOS usamos baja lógica para mantener integridad referencial
            const softDeleteFormats = ['CLIENTES', 'EMPLEADOS'];

            if (softDeleteFormats.indexOf(tipoFormato) !== -1) {
                // Buscar columna ESTADO
                const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
                    .map(h => String(h || '').trim().toUpperCase());
                const idxEstado = headers.indexOf('ESTADO');

                if (idxEstado > -1) {
                    // Actualizar ESTADO a 0 (Inactivo / Falso)
                    sheet.getRange(finalRow, idxEstado + 1).setValue(0);
                    return;
                }
            }

            // 4. Baja Física (por defecto o si no hay columna ESTADO)
            sheet.deleteRow(finalRow);

        } finally {
            lock.releaseLock();
        }
    }

    /**
     * Guarda un pago de empleado en PAGOS_EMP_DB
     */
    function recordEmployeePayment(fechaStr, empleado, concepto, monto, medioPago, obs) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_EMP');
        const templateHeaders = ['ID', 'FECHA', 'EMPLEADO', 'CONCEPTO', 'MONTO', 'MEDIO DE PAGO', 'OBSERVACIONES'];
        let headers = [];
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(templateHeaders);
            headers = templateHeaders.slice();
        } else {
            const lastCol = sheet.getLastColumn();
            headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
            templateHeaders.forEach((header) => {
                if (headers.indexOf(header) === -1) {
                    sheet.getRange(1, headers.length + 1).setValue(header);
                    headers.push(header);
                }
            });
        }
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(30000);
        } catch (e) {
            throw new Error('No se pudo obtener lock para registrar pago. Reintentá.');
        }
        let id;
        try {
            id = DatabaseService.getNextId(sheet);
            const fecha = fechaStr ? new Date(fechaStr) : new Date();
            const valuesByHeader = {
                'ID': id,
                'FECHA': fecha,
                'EMPLEADO': empleado || '',
                'CONCEPTO': concepto || '',
                'MONTO': Number(monto) || 0,
                'MEDIO DE PAGO': medioPago || '',
                'OBSERVACIONES': obs || ''
            };
            let normalized = valuesByHeader;
            if (typeof ValidationService !== 'undefined' && ValidationService && typeof ValidationService.validateAndNormalizeRecord === 'function') {
                const validation = ValidationService.validateAndNormalizeRecord('PAGOS_EMP', valuesByHeader, 'create', { headers: headers });
                if (!validation.ok) {
                    throw new Error('Validacion: ' + validation.errors.join(' '));
                }
                normalized = validation.record;
            }
            const row = headers.map((header) => {
                return normalized.hasOwnProperty(header) ? normalized[header] : '';
            });
            sheet.appendRow(row);
        } finally {
            lock.releaseLock();
        }
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
        getRecordById: getRecordById,
        saveRecord: saveRecord,
        updateRecord: updateRecord,
        deleteRecord: deleteRecord,
        getReferenceData: getReferenceData,
        recordEmployeePayment: recordEmployeePayment
    };
})();
