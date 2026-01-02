/**
 * AttendanceController - Weekly Plan
 * Funciones para gestión de planificación semanal
 */

const AttendanceWeeklyPlan = (function () {

    /**
     * Construye un template semanal basado en las horas contratadas del cliente
     * @param {string} cliente - Nombre del cliente
     * @returns {Array} Template con días y horas
     */
    function buildWeeklyTemplateFromClient(cliente, idCliente) {
        if (cliente && typeof cliente === 'object' && !Array.isArray(cliente)) {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.clientName || cliente.label || '';
        }
        const sheetClientes = DatabaseService.getDbSheetForFormat('CLIENTES');
        const dataCli = sheetClientes.getDataRange().getValues();
        if (dataCli.length < 2) {
            return [];
        }

        const header = dataCli[0];
        const rows = dataCli.slice(1);

        const idxId = header.indexOf('ID');
        const idxNombre = header.indexOf('NOMBRE');
        const idxRazon = header.indexOf('RAZON SOCIAL');
        const idxLunes = header.indexOf('LUNES HS');
        const idxMartes = header.indexOf('MARTES HS');
        const idxMiercoles = header.indexOf('MIERCOLES HS');
        const idxJueves = header.indexOf('JUEVES HS');
        const idxViernes = header.indexOf('VIERNES HS');
        const idxSabado = header.indexOf('SABADO HS');
        const idxDomingo = header.indexOf('DOMINGO HS');

        if (
            idxNombre === -1 || idxRazon === -1 ||
            idxLunes === -1 || idxMartes === -1 ||
            idxMiercoles === -1 || idxJueves === -1 ||
            idxViernes === -1 || idxSabado === -1 ||
            idxDomingo === -1
        ) {
            throw new Error('Faltan columnas de horas (LUNES HS, etc.) en CLIENTES_DB.');
        }

        const targetId = idCliente != null && idCliente !== '' ? String(idCliente).trim() : '';
        if (!targetId) {
            return [];
        }
        let rowCliente = null;
        rows.forEach(function (row) {
            const rowId = idxId > -1 ? String(row[idxId] || '').trim() : '';
            const nombre = row[idxNombre];
            const razon = row[idxRazon];
            if (rowId && rowId === targetId) {
                rowCliente = row;
            }
        });

        if (!rowCliente) {
            return [];
        }

        const dias = [
            { label: 'LUNES', idx: idxLunes },
            { label: 'MARTES', idx: idxMartes },
            { label: 'MIERCOLES', idx: idxMiercoles },
            { label: 'JUEVES', idx: idxJueves },
            { label: 'VIERNES', idx: idxViernes },
            { label: 'SABADO', idx: idxSabado },
            { label: 'DOMINGO', idx: idxDomingo }
        ];

        const result = [];

        dias.forEach(function (d) {
            const val = rowCliente[d.idx];
            const horas = Number(val) || 0;
            if (horas > 0) {
                result.push({
                    cliente: (rowCliente[idxRazon] || rowCliente[idxNombre] || cliente || ''),
                    idCliente: targetId,
                    empleado: '',
                    diaSemana: d.label,
                    horaEntrada: '',
                    horasPlan: horas,
                    activo: true,
                    observaciones: ''
                });
            }
        });

        return result;
    }

    /**
     * Obtiene el plan semanal completo para un cliente
     * @param {string} cliente - Nombre del cliente
     * @returns {Array} Plan semanal actual
     */
    function getWeeklyPlanForClient(cliente, idCliente) {
        if (cliente && typeof cliente === 'object' && !Array.isArray(cliente)) {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.clientName || cliente.label || '';
        }
        if (!idCliente) return [];

        const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const dataPlan = sheetPlan.getDataRange().getValues();
        if (dataPlan.length < 2) {
            return [];
        }

        const headerPlan = dataPlan[0];
        const headerNorm = headerPlan.map(h => String(h || '').trim());
        const rowsPlan = dataPlan.slice(1);

        const idxId = headerNorm.indexOf('ID');
        const idxCliente = headerNorm.indexOf('CLIENTE');
        const idxIdCliente = headerNorm.indexOf('ID_CLIENTE');
        const idxEmpleado = headerNorm.indexOf('EMPLEADO');
        const idxIdEmpleado = headerNorm.indexOf('ID_EMPLEADO');
        const idxDiaSemana = headerNorm.indexOf('DIA SEMANA');
        const idxHoraEntrada = headerNorm.indexOf('HORA ENTRADA');
        const idxHorasPlan = headerNorm.indexOf('HORAS PLAN');
        const idxVigDesde = headerNorm.indexOf('VIGENTE DESDE');
        const idxVigHasta = headerNorm.indexOf('VIGENTE HASTA');
        const idxObs = headerNorm.indexOf('OBSERVACIONES');

        if (
            idxCliente === -1 ||
            idxEmpleado === -1 ||
            idxDiaSemana === -1 ||
            idxHoraEntrada === -1 ||
            idxHorasPlan === -1 ||
            idxObs === -1
        ) {
            throw new Error('Faltan columnas en ASISTENCIA_PLAN_DB. Revisar encabezados.');
        }

        const targetId = idCliente != null && idCliente !== '' ? String(idCliente).trim() : '';
        if (!targetId) return [];
        const result = [];

        rowsPlan.forEach(function (row) {
            const cli = row[idxCliente];
            const cliNorm = String(cli || '').trim().toLowerCase();
            const rowIdCli = idxIdCliente > -1 ? String(row[idxIdCliente] || '').trim() : '';
            if (!rowIdCli || rowIdCli !== targetId) return;

            result.push({
                id: idxId > -1 ? row[idxId] : '',
                cliente: String(cli || ''),
                idCliente: rowIdCli,
                empleado: row[idxEmpleado] || '',
                idEmpleado: idxIdEmpleado > -1 ? row[idxIdEmpleado] : '',
                diaSemana: row[idxDiaSemana] || '',
                horaEntrada: row[idxHoraEntrada] || '',
                horasPlan: row[idxHorasPlan] || '',
                vigDesde: idxVigDesde > -1 ? row[idxVigDesde] : '',
                vigHasta: idxVigHasta > -1 ? row[idxVigHasta] : '',
                observaciones: row[idxObs] || ''
            });
        });

        return JSON.parse(JSON.stringify(result));
    }

    /**
     * Guarda el plan semanal para un cliente, permitiendo gestionar vigencias múltiples.
     * @param {string} cliente - Nombre del cliente
     * @param {Array} items - Array de items del plan
     * @param {Object} originalVigencia - { desde: string, hasta: string } para identificar qué plan reemplazar
     */
    function saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente) {
        if (cliente && typeof cliente === 'object' && !Array.isArray(cliente)) {
            idCliente = cliente.idCliente || cliente.ID_CLIENTE || idCliente;
            cliente = cliente.cliente || cliente.clientName || cliente.label || '';
        }
        const idClienteStr = idCliente != null ? String(idCliente).trim() : '';
        if (!idClienteStr) throw new Error('Falta el ID del cliente para guardar el plan.');
        if (!cliente && DatabaseService.findClienteById) {
            const cli = DatabaseService.findClienteById(idClienteStr);
            if (cli && (cli.razonSocial || cli.nombre)) {
                cliente = cli.razonSocial || cli.nombre;
            }
        }
        console.log("Iniciando saveWeeklyPlanForClient para:", cliente || idClienteStr);

        items = items || [];

        const sheet = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        if (!sheet) {
            throw new Error('No se encontró la hoja para ASISTENCIA_PLAN.');
        }

        // 1. Leer estado actual
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        let currentHeaders = [];
        let existingData = [];

        if (lastCol > 0) {
            currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
            if (lastRow > 1) {
                existingData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
            }
        }

        // 2. Definir esquema deseado (Standard Schema)
        const standardHeaders = [
            'ID', 'ID_CLIENTE', 'CLIENTE', 'ID_EMPLEADO', 'EMPLEADO',
            'DIA SEMANA', 'HORA ENTRADA', 'HORAS PLAN',
            'OBSERVACIONES', 'VIGENTE DESDE', 'VIGENTE HASTA'
        ];

        // 3. Mapear índices actuales
        const idxMap = {};
        currentHeaders.forEach((h, i) => {
            idxMap[h] = i;
        });

        // Identificar columnas extra para preservarlas
        const extraHeaders = currentHeaders.filter(h => !standardHeaders.includes(h) && h !== '');
        const finalHeaders = [...standardHeaders, ...extraHeaders];

        // 4. Procesar datos existentes (KEPT)
        const idxCliente = idxMap['CLIENTE'];
        const idxIdCliente = idxMap['ID_CLIENTE'];
        const idxIdEmpleado = idxMap['ID_EMPLEADO'];
        const idxVigDesde = idxMap['VIGENTE DESDE'];
        const idxVigHasta = idxMap['VIGENTE HASTA'];

        const defaultIdCliente = idClienteStr;

        // Helper para comparar fechas (strings YYYY-MM-DD o Date objects)
        const areDatesEqual = (d1, d2) => {
            if (!d1 && !d2) return true;
            if (!d1 || !d2) return false;
            const t1 = new Date(d1).setHours(0, 0, 0, 0);
            const t2 = new Date(d2).setHours(0, 0, 0, 0);
            return t1 === t2;
        };

        const keptRows = existingData.filter(row => {
            // Si no hay columna cliente, asumimos que no es de este cliente
            if (idxCliente === undefined) return false;

            const rowCliente = String(row[idxCliente] || '');
            const rowIdCli = idxIdCliente > -1 ? String(row[idxIdCliente] || '').trim() : '';
            const isSameClient = defaultIdCliente && rowIdCli
                ? rowIdCli === String(defaultIdCliente)
                : false;
            if (!isSameClient) return true; // Mantener otros clientes

            // Es el mismo cliente. Verificamos si corresponde al plan que estamos editando.
            // Si se pasó originalVigencia, borramos SOLO lo que coincida con esa vigencia.
            if (originalVigencia) {
                const rowDesde = row[idxVigDesde];
                const rowHasta = row[idxVigHasta];

                const matchDesde = areDatesEqual(rowDesde, originalVigencia.desde);
                const matchHasta = areDatesEqual(rowHasta, originalVigencia.hasta);

                if (matchDesde && matchHasta) {
                    return false; // Es del plan que estamos reemplazando, NO mantener (borrar)
                }
                return true; // Es de otro plan del mismo cliente, MANTENER.
            } else {
                // Comportamiento legacy/default: Si no se especifica vigencia original,
                // asumimos que es un "Nuevo Plan" que NO reemplaza a los anteriores,
                // O que el usuario quiere reemplazar TODO?
                // Según requerimiento: "gravaria un nuevo plan... por mas de que tenga 2 planes".
                // Entonces, si no hay originalVigencia (es nuevo), NO borramos nada del cliente.
                return true;
            }
        });

        // Mapear keptRows al nuevo formato
        const mappedKeptRows = keptRows.map(oldRow => {
            const newRow = new Array(finalHeaders.length).fill('');
            finalHeaders.forEach((header, newIdx) => {
                const oldIdx = idxMap[header];
                if (oldIdx !== undefined && oldIdx < oldRow.length) {
                    newRow[newIdx] = oldRow[oldIdx];
                }
            });
            return newRow;
        });

        // 5. Procesar nuevos items
        let nextId = 1;
        // Calcular nextId basado en mappedKeptRows
        const idxId = finalHeaders.indexOf('ID');
        if (idxId > -1) {
            mappedKeptRows.forEach(r => {
                const id = Number(r[idxId]);
                if (!isNaN(id) && id >= nextId) nextId = id + 1;
            });
        }

        const missingEmp = items.find(it => (it && (it.empleado || it.idEmpleado || it.id_empleado)) && !(it.idEmpleado || it.id_empleado));
        if (missingEmp) {
            throw new Error('Falta ID_EMPLEADO en uno o más registros del plan.');
        }

        const newRows = items.map(it => {
            const row = new Array(finalHeaders.length).fill('');

            // Helper para setear valor
            const setVal = (header, val) => {
                const idx = finalHeaders.indexOf(header);
                if (idx > -1) {
                    // Asegurar que no sea undefined
                    if (val === undefined || val === null) val = '';
                    row[idx] = val;
                }
            };

            setVal('ID', it.id || nextId++);
            setVal('ID_CLIENTE', it.idCliente || it.id_cliente || defaultIdCliente || '');
            setVal('CLIENTE', cliente);
            setVal('ID_EMPLEADO', it.idEmpleado || it.id_empleado || '');
            setVal('EMPLEADO', it.empleado || '');
            setVal('DIA SEMANA', it.diaSemana || '');
            setVal('HORA ENTRADA', it.horaEntrada || '');

            let horas = '';
            if (it.horasPlan !== '' && it.horasPlan != null) {
                horas = Number(it.horasPlan);
                if (isNaN(horas)) horas = 0;
            }
            setVal('HORAS PLAN', horas);

            setVal('OBSERVACIONES', it.observaciones || '');
            setVal('VIGENTE DESDE', parseDateInput(it.vigDesde));
            setVal('VIGENTE HASTA', parseDateInput(it.vigHasta));

            return row;
        });

        // 6. Combinar y Guardar
        const allRows = [...mappedKeptRows, ...newRows];

        console.log("Guardando " + allRows.length + " filas. (Kept: " + mappedKeptRows.length + ", New: " + newRows.length + ")");

        // Escribir Headers
        sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);

        // Limpiar contenido anterior
        const maxRows = Math.max(lastRow, allRows.length + 1);
        const maxCols = Math.max(lastCol, finalHeaders.length);

        if (maxRows > 1) {
            // Limpiar todo el rango de datos posible
            sheet.getRange(2, 1, maxRows - 1, maxCols).clearContent();
        }

        // Escribir nuevos datos
        if (allRows.length > 0) {
            sheet.getRange(2, 1, allRows.length, finalHeaders.length).setValues(allRows);
        }
    }

    function parseDateInput(value) {
        if (!value) return '';
        if (value instanceof Date && !isNaN(value)) return value;
        // Esperamos strings tipo YYYY-MM-DD
        const d = new Date(value + 'T00:00:00');
        return isNaN(d) ? '' : d;
    }

    return {
        buildWeeklyTemplateFromClient: buildWeeklyTemplateFromClient,
        getWeeklyPlanForClient: getWeeklyPlanForClient,
        saveWeeklyPlanForClient: saveWeeklyPlanForClient
    };
})();
