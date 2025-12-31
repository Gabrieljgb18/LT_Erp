/**
 * AttendanceController - Employee Schedule
 * Funciones para obtener la agenda semanal de un empleado
 * con datos completos de clientes para la "Hoja de Ruta".
 */

const AttendanceEmployeeSchedule = (function () {
    const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const DIAS_DISPLAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const ORDEN_DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

    function normalizeDayName_(value) {
        return String(value || '')
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function toDate_(value) {
        if (!value) return null;
        if (value instanceof Date && !isNaN(value)) return new Date(value);
        const parsed = new Date(value);
        if (isNaN(parsed)) return null;
        return parsed;
    }

    function isDateWithinRange_(date, from, to) {
        if (!date) return false;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        if (from) {
            const f = toDate_(from);
            if (f) {
                f.setHours(0, 0, 0, 0);
                if (d < f) return false;
            }
        }

        if (to) {
            const t = toDate_(to);
            if (t) {
                t.setHours(23, 59, 59, 999);
                if (d > t) return false;
            }
        }

        return true;
    }

    /**
     * Obtiene el lunes de la semana para una fecha dada
     */
    function getMondayOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    /**
     * Formatea fecha a YYYY-MM-DD
     */
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formatea fecha a DD/MM
     */
    function formatDateShort(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    function buildWeekDays_(weekStart) {
        const map = {};
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(weekStart);
            fecha.setDate(weekStart.getDate() + i);
            const diaNombre = DIAS_SEMANA[fecha.getDay()];
            const diaDisplay = DIAS_DISPLAY[fecha.getDay()];
            map[diaNombre] = {
                dateObj: new Date(fecha),
                fecha: formatDate(fecha),
                fechaDisplay: formatDateShort(fecha),
                diaSemana: diaNombre,
                diaDisplay: diaDisplay,
                clientes: []
            };
        }
        return map;
    }

    function sanitizeDays_(diasMap) {
        return ORDEN_DIAS.map(dia => {
            const entry = diasMap[dia];
            return {
                fecha: entry ? entry.fecha : '',
                fechaDisplay: entry ? entry.fechaDisplay : '',
                diaSemana: entry ? entry.diaSemana : dia,
                diaDisplay: entry ? entry.diaDisplay : '',
                clientes: entry && Array.isArray(entry.clientes) ? entry.clientes : [],
                empleados: entry && Array.isArray(entry.empleados) ? entry.empleados : []
            };
        });
    }

    function formatHoraEntrada_(value) {
        if (!value) return '';
        if (value instanceof Date && !isNaN(value)) {
            return value.toTimeString().slice(0, 5);
        }
        const match = String(value).match(/(\d{1,2}):(\d{2})/);
        if (match) {
            return match[1].padStart(2, '0') + ':' + match[2];
        }
        return '';
    }

    /**
     * Obtiene los datos completos de un cliente (por ID)
     */
    function getClienteData(idCliente, nombreCliente) {
        const cleanId = idCliente != null ? String(idCliente).trim() : '';
        let cliente = null;

        if (cleanId) {
            cliente = DatabaseService.findClienteById(cleanId);
        }

        if (!cliente && nombreCliente) {
            cliente = DatabaseService.findClienteByNombreORazon(nombreCliente);
        }

        if (!cliente) {
            return {
                id: cleanId,
                nombre: nombreCliente || '',
                razonSocial: '',
                direccion: '',
                telefono: '',
                encargado: '',
                correoAdministracion: '',
                valorHora: 0
            };
        }

        const sheet = DatabaseService.getDbSheetForFormat('CLIENTES');
        const rowNumber = cliente.rowNumber;

        if (!rowNumber) {
            return {
                id: cliente.id || cleanId,
                nombre: cliente.nombre || nombreCliente || '',
                razonSocial: cliente.razonSocial || '',
                direccion: '',
                telefono: '',
                encargado: '',
                correoAdministracion: '',
                valorHora: 0
            };
        }

        const lastCol = sheet.getLastColumn();
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
            .map(h => String(h || '').trim().toUpperCase());
        const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

        const getVal = (headerName) => {
            const idx = headers.indexOf(headerName);
            return idx > -1 ? row[idx] : '';
        };

        return {
            id: getVal('ID') || cliente.id || cleanId,
            nombre: getVal('NOMBRE') || cliente.nombre || nombreCliente || '',
            razonSocial: getVal('RAZON SOCIAL') || cliente.razonSocial || '',
            direccion: getVal('DIRECCION') || '',
            telefono: getVal('TELEFONO') || '',
            encargado: getVal('ENCARGADO') || '',
            correoAdministracion: getVal('CORREO ADMINISTRACION') || '',
            valorHora: Number(getVal('VALOR HORA')) || 0
        };
    }

    function resolveEmpleadoIdFromName_(nombre) {
        if (!nombre) return '';
        if (!DatabaseService || !DatabaseService.findEmpleadoByNombre) return '';
        const found = DatabaseService.findEmpleadoByNombre(nombre);
        return found && found.id ? String(found.id).trim() : '';
    }

    function resolveClienteIdFromName_(nombre) {
        if (!nombre) return '';
        if (!DatabaseService || !DatabaseService.findClienteByNombreORazon) return '';
        const found = DatabaseService.findClienteByNombreORazon(nombre);
        return found && found.id ? String(found.id).trim() : '';
    }

    /**
     * Obtiene la agenda semanal de un empleado con datos completos de clientes
     * @param {string} empleado - Nombre del empleado
     * @param {string|number} idEmpleado - ID del empleado (opcional)
     * @param {string} weekStartStr - Fecha de inicio de semana (YYYY-MM-DD) opcional
     * @returns {Object} Agenda semanal con datos de clientes
     */
    function getEmployeeWeeklySchedule(empleado, idEmpleado, weekStartStr) {
        // Normalizar parámetros si viene como objeto
        if (empleado && typeof empleado === 'object' && !Array.isArray(empleado)) {
            idEmpleado = empleado.idEmpleado || empleado.ID_EMPLEADO || idEmpleado;
            weekStartStr = empleado.weekStartDate || empleado.weekStart || weekStartStr;
            empleado = empleado.empleado || empleado.nombre || empleado.label || '';
        }

        if (!empleado && !idEmpleado) {
            return { error: 'Falta el empleado para consultar la agenda.' };
        }

        // Calcular rango de la semana
        const weekStart = weekStartStr ? getMondayOfWeek(new Date(weekStartStr + 'T00:00:00')) : getMondayOfWeek(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const diasMap = buildWeekDays_(weekStart);

        // Leer plan de asistencia
        const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const dataPlan = sheetPlan.getDataRange().getValues();

        if (dataPlan.length < 2) {
            const diasOut = sanitizeDays_(diasMap);
            return {
                empleado: empleado,
                idEmpleado: idEmpleado,
                semana: {
                    start: formatDate(weekStart),
                    end: formatDate(weekEnd),
                    label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
                },
                dias: diasOut,
                resumen: { totalHoras: 0, totalClientes: 0, diasTrabajo: 0 }
            };
        }

        const headers = dataPlan[0].map(h => String(h || '').trim().toUpperCase());
        const rows = dataPlan.slice(1);

        const idxId = headers.indexOf('ID');
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxDiaSemana = headers.indexOf('DIA SEMANA');
        const idxHoraEntrada = headers.indexOf('HORA ENTRADA');
        const idxHorasPlan = headers.indexOf('HORAS PLAN');
        const idxVigDesde = headers.indexOf('VIGENTE DESDE');
        const idxVigHasta = headers.indexOf('VIGENTE HASTA');
        const idxObs = headers.indexOf('OBSERVACIONES');

        const targetEmpleado = String(empleado || '').trim().toLowerCase();
        const targetIdEmpleado = idEmpleado != null && idEmpleado !== '' ? String(idEmpleado).trim() : '';

        let totalHoras = 0;
        const clientesSet = new Set();

        rows.forEach(row => {
            const rowEmpleadoRaw = idxEmpleado > -1 ? String(row[idxEmpleado] || '').trim() : '';
            const rowEmpleado = rowEmpleadoRaw.toLowerCase();
            const rowIdEmpleado = idxIdEmpleado > -1 ? String(row[idxIdEmpleado] || '').trim() : '';

            if (targetIdEmpleado) {
                if (rowIdEmpleado) {
                    if (rowIdEmpleado !== targetIdEmpleado) return;
                } else {
                    const resolvedId = resolveEmpleadoIdFromName_(rowEmpleadoRaw);
                    if (!resolvedId || resolvedId !== targetIdEmpleado) return;
                }
            } else if (!targetEmpleado || rowEmpleado !== targetEmpleado) {
                return;
            }

            const diaSemana = normalizeDayName_(row[idxDiaSemana]);
            const dayEntry = diasMap[diaSemana];
            if (!dayEntry) return;

            const fechaDia = dayEntry.dateObj;
            if (!isDateWithinRange_(fechaDia, row[idxVigDesde], row[idxVigHasta])) return;

            const idCliente = idxIdCliente > -1 ? row[idxIdCliente] : '';
            const nombreCliente = row[idxCliente] || '';
            const clienteData = getClienteData(idCliente, nombreCliente);

            const horaEntrada = formatHoraEntrada_(row[idxHoraEntrada]);
            const horas = Number(row[idxHorasPlan]) || 0;
            totalHoras += horas;
            clientesSet.add(clienteData.id || nombreCliente || '');

            dayEntry.clientes.push({
                idPlan: idxId > -1 ? row[idxId] : '',
                cliente: clienteData.nombre || nombreCliente,
                idCliente: clienteData.id || idCliente,
                razonSocial: clienteData.razonSocial,
                horaEntrada: horaEntrada,
                horasPlan: horas,
                direccion: clienteData.direccion,
                telefono: clienteData.telefono,
                encargado: clienteData.encargado,
                correo: clienteData.correoAdministracion,
                observaciones: row[idxObs] || ''
            });
        });

        const diasArray = ORDEN_DIAS.map(dia => diasMap[dia]);
        const diasOut = sanitizeDays_(diasMap);
        const diasTrabajo = diasArray.filter(d => d.clientes.length > 0).length;

        return {
            empleado: empleado,
            idEmpleado: targetIdEmpleado || '',
            semana: {
                start: formatDate(weekStart),
                end: formatDate(weekEnd),
                label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
            },
            dias: diasOut,
            resumen: {
                totalHoras: totalHoras,
                totalClientes: clientesSet.size,
                diasTrabajo: diasTrabajo
            }
        };
    }

    /**
     * Vista semanal por cliente (para calendario general)
     */
    function getWeeklyClientOverview(weekStartStr, clientId) {
        if (weekStartStr && typeof weekStartStr === 'object' && !Array.isArray(weekStartStr)) {
            clientId = weekStartStr.clientId || weekStartStr.idCliente || clientId;
            weekStartStr = weekStartStr.weekStartDate || weekStartStr.weekStart || '';
        }

        const weekStart = weekStartStr ? getMondayOfWeek(new Date(weekStartStr + 'T00:00:00')) : getMondayOfWeek(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const diasMap = buildWeekDays_(weekStart);

        const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const dataPlan = sheetPlan.getDataRange().getValues();
        if (dataPlan.length < 2) {
            const diasOut = sanitizeDays_(diasMap);
            return {
                semana: {
                    start: formatDate(weekStart),
                    end: formatDate(weekEnd),
                    label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
                },
                dias: diasOut,
                resumen: { totalHoras: 0, totalClientes: 0, diasTrabajo: 0 }
            };
        }

        const headers = dataPlan[0].map(h => String(h || '').trim().toUpperCase());
        const rows = dataPlan.slice(1);

        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxDiaSemana = headers.indexOf('DIA SEMANA');
        const idxHoraEntrada = headers.indexOf('HORA ENTRADA');
        const idxHorasPlan = headers.indexOf('HORAS PLAN');
        const idxVigDesde = headers.indexOf('VIGENTE DESDE');
        const idxVigHasta = headers.indexOf('VIGENTE HASTA');
        const idxObs = headers.indexOf('OBSERVACIONES');

        const targetClientId = clientId != null && clientId !== '' ? String(clientId).trim() : '';

        let totalHoras = 0;
        const clientesSet = new Set();

        rows.forEach(row => {
            const diaSemana = normalizeDayName_(row[idxDiaSemana]);
            const dayEntry = diasMap[diaSemana];
            if (!dayEntry) return;

            const fechaDia = dayEntry.dateObj;
            if (!isDateWithinRange_(fechaDia, row[idxVigDesde], row[idxVigHasta])) return;

            const idCliente = idxIdCliente > -1 ? row[idxIdCliente] : '';
            const nombreCliente = row[idxCliente] || '';
            const cleanId = idCliente != null ? String(idCliente).trim() : '';
            let matchClient = true;
            if (targetClientId) {
                if (cleanId) {
                    matchClient = cleanId === targetClientId;
                } else {
                    const resolvedId = resolveClienteIdFromName_(nombreCliente);
                    matchClient = resolvedId && resolvedId === targetClientId;
                }
            }
            if (!matchClient) return;

            const clienteData = getClienteData(cleanId, nombreCliente);
            const horaEntrada = formatHoraEntrada_(row[idxHoraEntrada]);
            const horas = Number(row[idxHorasPlan]) || 0;

            const key = clienteData.id ? `id:${clienteData.id}` : `name:${clienteData.nombre || nombreCliente}`;
            if (!dayEntry._clientesMap) dayEntry._clientesMap = {};
            if (!dayEntry._clientesMap[key]) {
                dayEntry._clientesMap[key] = {
                    idCliente: clienteData.id || cleanId,
                    cliente: clienteData.nombre || nombreCliente,
                    razonSocial: clienteData.razonSocial || '',
                    direccion: clienteData.direccion || '',
                    telefono: clienteData.telefono || '',
                    encargado: clienteData.encargado || '',
                    correo: clienteData.correoAdministracion || '',
                    observaciones: row[idxObs] || '',
                    totalHoras: 0,
                    asignaciones: []
                };
            }

            dayEntry._clientesMap[key].totalHoras += horas;
            dayEntry._clientesMap[key].asignaciones.push({
                empleado: row[idxEmpleado] || '',
                idEmpleado: idxIdEmpleado > -1 ? row[idxIdEmpleado] : '',
                horaEntrada: horaEntrada,
                horasPlan: horas
            });

            totalHoras += horas;
            clientesSet.add(clienteData.id || clienteData.nombre || nombreCliente || '');
        });

        ORDEN_DIAS.forEach(dia => {
            const dayEntry = diasMap[dia];
            if (dayEntry && dayEntry._clientesMap) {
                dayEntry.clientes = Object.values(dayEntry._clientesMap)
                    .sort((a, b) => String(a.cliente || '').localeCompare(String(b.cliente || '')));
                delete dayEntry._clientesMap;
            }
        });

        const diasArray = ORDEN_DIAS.map(dia => diasMap[dia]);
        const diasOut = sanitizeDays_(diasMap);
        const diasTrabajo = diasArray.filter(d => d.clientes.length > 0).length;

        return {
            semana: {
                start: formatDate(weekStart),
                end: formatDate(weekEnd),
                label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
            },
            dias: diasOut,
            resumen: {
                totalHoras: totalHoras,
                totalClientes: clientesSet.size,
                diasTrabajo: diasTrabajo
            }
        };
    }

    /**
     * Vista semanal por empleado (para calendario general)
     */
    function getWeeklyEmployeeOverview(weekStartStr, employeeId) {
        if (weekStartStr && typeof weekStartStr === 'object' && !Array.isArray(weekStartStr)) {
            employeeId = weekStartStr.employeeId || weekStartStr.idEmpleado || employeeId;
            weekStartStr = weekStartStr.weekStartDate || weekStartStr.weekStart || '';
        }

        const weekStart = weekStartStr ? getMondayOfWeek(new Date(weekStartStr + 'T00:00:00')) : getMondayOfWeek(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const diasMap = buildWeekDays_(weekStart);

        const sheetPlan = DatabaseService.getDbSheetForFormat('ASISTENCIA_PLAN');
        const dataPlan = sheetPlan.getDataRange().getValues();
        if (dataPlan.length < 2) {
            const diasOut = sanitizeDays_(diasMap);
            return {
                semana: {
                    start: formatDate(weekStart),
                    end: formatDate(weekEnd),
                    label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
                },
                dias: diasOut,
                resumen: { totalHoras: 0, totalEmpleados: 0, diasTrabajo: 0 }
            };
        }

        const headers = dataPlan[0].map(h => String(h || '').trim().toUpperCase());
        const rows = dataPlan.slice(1);

        const idxIdEmpleado = headers.indexOf('ID_EMPLEADO');
        const idxEmpleado = headers.indexOf('EMPLEADO');
        const idxIdCliente = headers.indexOf('ID_CLIENTE');
        const idxCliente = headers.indexOf('CLIENTE');
        const idxDiaSemana = headers.indexOf('DIA SEMANA');
        const idxHoraEntrada = headers.indexOf('HORA ENTRADA');
        const idxHorasPlan = headers.indexOf('HORAS PLAN');
        const idxVigDesde = headers.indexOf('VIGENTE DESDE');
        const idxVigHasta = headers.indexOf('VIGENTE HASTA');
        const idxObs = headers.indexOf('OBSERVACIONES');

        const targetEmployeeId = employeeId != null && employeeId !== '' ? String(employeeId).trim() : '';

        let totalHoras = 0;
        const empleadosSet = new Set();

        rows.forEach(row => {
            const diaSemana = normalizeDayName_(row[idxDiaSemana]);
            const dayEntry = diasMap[diaSemana];
            if (!dayEntry) return;

            const fechaDia = dayEntry.dateObj;
            if (!isDateWithinRange_(fechaDia, row[idxVigDesde], row[idxVigHasta])) return;

            const rowEmpleadoRaw = idxEmpleado > -1 ? String(row[idxEmpleado] || '').trim() : '';
            const rowIdEmpleado = idxIdEmpleado > -1 ? String(row[idxIdEmpleado] || '').trim() : '';

            if (targetEmployeeId) {
                if (rowIdEmpleado) {
                    if (rowIdEmpleado !== targetEmployeeId) return;
                } else {
                    const resolvedId = resolveEmpleadoIdFromName_(rowEmpleadoRaw);
                    if (!resolvedId || resolvedId !== targetEmployeeId) return;
                }
            }

            const empleadoId = rowIdEmpleado || resolveEmpleadoIdFromName_(rowEmpleadoRaw) || '';
            const empleadoNombre = rowEmpleadoRaw || 'Sin asignar';
            const key = empleadoId ? `id:${empleadoId}` : `name:${empleadoNombre}`;

            if (!dayEntry._empleadosMap) dayEntry._empleadosMap = {};
            if (!dayEntry._empleadosMap[key]) {
                dayEntry._empleadosMap[key] = {
                    idEmpleado: empleadoId,
                    empleado: empleadoNombre,
                    totalHoras: 0,
                    clientes: []
                };
            }

            const idCliente = idxIdCliente > -1 ? row[idxIdCliente] : '';
            const nombreCliente = row[idxCliente] || '';
            const clienteData = getClienteData(idCliente, nombreCliente);
            const horaEntrada = formatHoraEntrada_(row[idxHoraEntrada]);
            const horas = Number(row[idxHorasPlan]) || 0;

            dayEntry._empleadosMap[key].totalHoras += horas;
            dayEntry._empleadosMap[key].clientes.push({
                idCliente: clienteData.id || idCliente,
                cliente: clienteData.nombre || nombreCliente,
                razonSocial: clienteData.razonSocial || '',
                horaEntrada: horaEntrada,
                horasPlan: horas,
                direccion: clienteData.direccion || '',
                observaciones: row[idxObs] || ''
            });

            totalHoras += horas;
            empleadosSet.add(empleadoId || empleadoNombre);
        });

        ORDEN_DIAS.forEach(dia => {
            const dayEntry = diasMap[dia];
            if (dayEntry && dayEntry._empleadosMap) {
                dayEntry.empleados = Object.values(dayEntry._empleadosMap)
                    .sort((a, b) => String(a.empleado || '').localeCompare(String(b.empleado || '')));
                delete dayEntry._empleadosMap;
            } else if (dayEntry) {
                dayEntry.empleados = [];
            }
        });

        const diasArray = ORDEN_DIAS.map(dia => diasMap[dia]);
        const diasOut = sanitizeDays_(diasMap);
        const diasTrabajo = diasArray.filter(d => d.empleados && d.empleados.length > 0).length;

        return {
            semana: {
                start: formatDate(weekStart),
                end: formatDate(weekEnd),
                label: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`
            },
            dias: diasOut,
            resumen: {
                totalHoras: totalHoras,
                totalEmpleados: empleadosSet.size,
                diasTrabajo: diasTrabajo
            }
        };
    }

    /**
     * Obtiene la lista de empleados activos con sus IDs
     */
    function getEmpleadosConId() {
        const sheet = DatabaseService.getDbSheetForFormat('EMPLEADOS');
        const data = sheet.getDataRange().getValues();

        if (data.length < 2) return [];

        const headers = data[0].map(h => String(h || '').trim().toUpperCase());
        const rows = data.slice(1);

        const idxId = headers.indexOf('ID');
        const idxNombre = headers.indexOf('EMPLEADO');
        const idxEstado = headers.indexOf('ESTADO');

        const result = [];

        rows.forEach(row => {
            const estado = idxEstado > -1 ? row[idxEstado] : true;
            const esActivo = DataUtils ? DataUtils.isTruthy(estado) : !!estado;

            if (esActivo) {
                result.push({
                    id: idxId > -1 ? row[idxId] : '',
                    nombre: idxNombre > -1 ? row[idxNombre] : ''
                });
            }
        });

        return result;
    }

    return {
        getEmployeeWeeklySchedule: getEmployeeWeeklySchedule,
        getWeeklyClientOverview: getWeeklyClientOverview,
        getWeeklyEmployeeOverview: getWeeklyEmployeeOverview,
        getEmpleadosConId: getEmpleadosConId
    };

})();
