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
                    cliente: (rowCliente[idxNombre] || rowCliente[idxRazon] || cliente || ''),
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

        const formatHoraEntrada_ = (value) => {
            if (!value) return '';
            if (value instanceof Date && !isNaN(value)) {
                return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
            }
            const s = String(value || '').trim();
            const match = s.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                return match[1].padStart(2, '0') + ':' + match[2];
            }
            const d = new Date(s);
            if (!isNaN(d)) {
                return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm');
            }
            return '';
        };

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
                horaEntrada: formatHoraEntrada_(row[idxHoraEntrada]),
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
                cliente = cli.nombre || cli.razonSocial;
            }
        }
        console.log("Iniciando saveWeeklyPlanForClient para:", cliente || idClienteStr);

        if (originalVigencia && typeof originalVigencia === "object" && !Array.isArray(originalVigencia)) {
            if (!originalVigencia.desde && !originalVigencia.hasta) {
                const mappedDesde = originalVigencia.vigDesde || originalVigencia["VIGENTE DESDE"] || "";
                const mappedHasta = originalVigencia.vigHasta || originalVigencia["VIGENTE HASTA"] || "";
                if (mappedDesde || mappedHasta) {
                    originalVigencia = { desde: mappedDesde, hasta: mappedHasta };
                }
            }
        }

        const normalizeItem = (item) => {
            const src = item || {};
            const horasPlan = src.horasPlan != null
                ? src.horasPlan
                : (src.HORAS_PLAN != null ? src.HORAS_PLAN : src["HORAS PLAN"]);
            return {
                id: src.id || src.ID || "",
                idCliente: src.idCliente || src.ID_CLIENTE || src["ID CLIENTE"] || "",
                cliente: src.cliente || src.CLIENTE || "",
                idEmpleado: src.idEmpleado || src.id_empleado || src.ID_EMPLEADO || src["ID EMPLEADO"] || "",
                empleado: src.empleado || src.EMPLEADO || "",
                diaSemana: src.diaSemana || src.DIA_SEMANA || src["DIA SEMANA"] || "",
                horaEntrada: src.horaEntrada || src.HORA_ENTRADA || src["HORA ENTRADA"] || "",
                horasPlan: horasPlan,
                observaciones: src.observaciones || src.OBSERVACIONES || "",
                vigDesde: src.vigDesde || src.VIGENTE_DESDE || src["VIGENTE DESDE"] || "",
                vigHasta: src.vigHasta || src.VIGENTE_HASTA || src["VIGENTE HASTA"] || ""
            };
        };

        items = (items || []).map(normalizeItem);

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

        // Helper para comparar fechas (Date, yyyy-mm-dd o dd/mm/yyyy)
        const parseDateValue = (value) => {
            if (!value) return null;
            if (value instanceof Date && !isNaN(value)) {
                return new Date(value.getFullYear(), value.getMonth(), value.getDate());
            }
            const s = String(value || '').trim();
            if (!s) return null;
            if (s.indexOf('/') >= 0) {
                const p = s.split('/');
                if (p.length === 3) {
                    const dd = Number(p[0]);
                    const mm = Number(p[1]);
                    const yyyy = Number(p[2]);
                    const d = new Date(yyyy, mm - 1, dd);
                    if (!isNaN(d)) return d;
                }
            }
            if (s.indexOf('-') >= 0) {
                const p = s.split('-');
                if (p.length === 3) {
                    const a = p[0];
                    const b = p[1];
                    const c = p[2];
                    if (a.length === 4) {
                        const d = new Date(Number(a), Number(b) - 1, Number(c));
                        if (!isNaN(d)) return d;
                    }
                    if (c.length === 4) {
                        const d = new Date(Number(c), Number(b) - 1, Number(a));
                        if (!isNaN(d)) return d;
                    }
                }
            }
            const d = new Date(s);
            if (isNaN(d)) return null;
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        const areDatesEqual = (d1, d2) => {
            const p1 = parseDateValue(d1);
            const p2 = parseDateValue(d2);
            if (!p1 && !p2) return true;
            if (!p1 || !p2) return false;
            return p1.getTime() === p2.getTime();
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

        const missingEmp = items.find(it => (it && (it.empleado || it.idEmpleado)) && !it.idEmpleado);
        if (missingEmp) {
            throw new Error('Falta ID_EMPLEADO en uno o más registros del plan.');
        }

        const newRows = items.map(it => {
            let horas = '';
            if (it.horasPlan !== '' && it.horasPlan != null) {
                horas = Number(it.horasPlan);
                if (isNaN(horas)) horas = 0;
            }

            const record = {
                'ID': it.id || nextId++,
                'ID_CLIENTE': it.idCliente || defaultIdCliente || '',
                'CLIENTE': cliente || it.cliente || '',
                'ID_EMPLEADO': it.idEmpleado || '',
                'EMPLEADO': it.empleado || '',
                'DIA SEMANA': it.diaSemana || '',
                'HORA ENTRADA': it.horaEntrada || '',
                'HORAS PLAN': horas,
                'OBSERVACIONES': it.observaciones || '',
                'VIGENTE DESDE': parseDateInput(it.vigDesde),
                'VIGENTE HASTA': parseDateInput(it.vigHasta)
            };

            let normalized = record;
            if (typeof ValidationService !== 'undefined' && ValidationService && typeof ValidationService.validateAndNormalizeRecord === 'function') {
                const validation = ValidationService.validateAndNormalizeRecord('ASISTENCIA_PLAN', record, 'create', { headers: finalHeaders });
                if (!validation.ok) {
                    throw new Error('Plan semanal invalido: ' + validation.errors.join(' '));
                }
                normalized = validation.record;
            }

            return finalHeaders.map((header) => {
                return Object.prototype.hasOwnProperty.call(normalized, header) ? normalized[header] : '';
            });
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
