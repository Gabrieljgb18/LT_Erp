/**
 * Generación de PDFs con estilo empresarial moderno
 */
var PdfController = (function () {
    function generateHoursPdf(startDateStr, endDateStr, employeeName, idEmpleado) {
        const data = HoursController.getHoursByEmployee(startDateStr, endDateStr, employeeName, idEmpleado);
        if (!data || !data.rows) return null;

        const html = buildHtml(data.rows, data.summary || {}, startDateStr, endDateStr, employeeName);
        const output = HtmlService.createHtmlOutput(html).setTitle('Reporte Horas');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `reporte_horas_${employeeName || 'empleado'}_${startDateStr || ''}_${endDateStr || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    function generateClientHoursPdf(startDateStr, endDateStr, clientName, idCliente) {
        const data = HoursController.getHoursByClient(startDateStr, endDateStr, clientName, idCliente);
        if (!data || !data.rows) return null;

        const html = buildClientHtml(data.rows, data.summary || {}, startDateStr, endDateStr, clientName);
        const output = HtmlService.createHtmlOutput(html).setTitle('Reporte Cliente');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `reporte_cliente_${clientName || 'cliente'}_${startDateStr || ''}_${endDateStr || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    function generateClientAccountStatementPdf(clientName, startDateStr, endDateStr, idCliente) {
        const data = AccountController.getClientAccountStatement(clientName, startDateStr, endDateStr, idCliente);
        const html = buildClientAccountHtml(data || {}, startDateStr, endDateStr, clientName);
        const output = HtmlService.createHtmlOutput(html).setTitle('Cuenta Corriente');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `cuenta_corriente_${clientName || 'cliente'}_${startDateStr || ''}_${endDateStr || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    function buildHtml(rows, summary, start, end, employee) {
        const fmt = (n) => {
            const num = Number(n);
            return isNaN(num) ? '0.00' : num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const style = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                color: #1e293b; 
                margin: 0; 
                padding: 40px; 
                background: #ffffff; 
                font-size: 12px;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                padding-bottom: 20px; 
                border-bottom: 2px solid #f1f5f9; 
                margin-bottom: 30px;
            }
            .brand-section h1 { 
                margin: 0; 
                font-size: 24px; 
                font-weight: 700; 
                color: #0f172a; 
                letter-spacing: -0.5px;
            }
            .brand-section .subtitle { 
                margin-top: 4px; 
                color: #64748b; 
                font-size: 13px; 
            }
            .meta-section { 
                text-align: right; 
            }
            .meta-item { 
                margin-bottom: 4px; 
                color: #475569; 
                font-size: 12px; 
            }
            .meta-item strong { 
                color: #0f172a; 
                font-weight: 600; 
            }
            
            .summary-grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px; 
                margin-bottom: 40px; 
            }
            .summary-card { 
                padding: 16px; 
                background: #f8fafc; 
                border-radius: 8px; 
                border: 1px solid #e2e8f0; 
            }
            .summary-card.highlight { 
                background: #eff6ff; 
                border-color: #bfdbfe; 
            }
            .summary-card.total { 
                background: #0f172a; 
                color: white; 
                border: none; 
            }
            .summary-label { 
                font-size: 11px; 
                text-transform: uppercase; 
                letter-spacing: 0.05em; 
                color: #64748b; 
                margin-bottom: 8px; 
                font-weight: 600;
            }
            .summary-card.total .summary-label { color: #94a3b8; }
            .summary-value { 
                font-size: 20px; 
                font-weight: 700; 
                color: #0f172a; 
            }
            .summary-card.total .summary-value { color: #ffffff; }
            
            table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 12px; 
            }
            th { 
                text-align: left; 
                padding: 12px 16px; 
                background: #f8fafc; 
                color: #475569; 
                font-weight: 600; 
                text-transform: uppercase; 
                font-size: 11px; 
                letter-spacing: 0.05em; 
                border-bottom: 1px solid #e2e8f0; 
            }
            td { 
                padding: 16px; 
                border-bottom: 1px solid #f1f5f9; 
                color: #334155; 
            }
            tr:last-child td { border-bottom: none; }
            .status-badge { 
                display: inline-flex; 
                align-items: center; 
                padding: 4px 8px; 
                border-radius: 9999px; 
                font-size: 11px; 
                font-weight: 500; 
            }
            .status-ok { background: #dcfce7; color: #166534; }
            .status-bad { background: #fee2e2; color: #991b1b; }
            
            .footer { 
                margin-top: 60px; 
                padding-top: 20px; 
                border-top: 1px solid #f1f5f9; 
                color: #94a3b8; 
                font-size: 11px; 
                text-align: center; 
            }
        </style>`;

        const header = `
        <div class="header">
            <div class="brand-section">
                <h1>Reporte de Horas</h1>
                <div class="subtitle">LT ERP System</div>
            </div>
            <div class="meta-section">
                <div class="meta-item">Empleado: <strong>${employee || '-'}</strong></div>
                <div class="meta-item">Período: <strong>${start || '-'} al ${end || '-'}</strong></div>
                <div class="meta-item">Fecha de emisión: <strong>${new Date().toLocaleDateString('es-AR')}</strong></div>
            </div>
        </div>`;

        const summaryGrid = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">Total Horas</div>
                <div class="summary-value">${fmt(summary.totalHoras)} hs</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Valor Hora</div>
                <div class="summary-value">$ ${fmt(summary.valorHora)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Viáticos</div>
                <div class="summary-value">$ ${fmt(summary.viaticos)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Presentismo</div>
                <div class="summary-value">$ ${fmt(summary.presentismo)}</div>
            </div>
            <div class="summary-card highlight">
                <div class="summary-label">Adelantos</div>
                <div class="summary-value" style="color: #ef4444;">- $ ${fmt(summary.adelantos)}</div>
            </div>
            <div class="summary-card total">
                <div class="summary-label">Total Neto</div>
                <div class="summary-value">$ ${fmt(summary.totalNeto)}</div>
            </div>
        </div>`;

        const rowsHtml = rows.map(r => {
            const asist = r.asistencia === false
                ? '<span class="status-badge status-bad">Ausente</span>'
                : '<span class="status-badge status-ok">Presente</span>';
            return `<tr>
                <td style="font-weight: 500;">${r.fecha}</td>
                <td>${r.cliente || '-'}</td>
                <td>${asist}</td>
                <td style="font-family: monospace; font-size: 13px;">${fmt(r.horas)}</td>
                <td style="color: #64748b; font-style: italic;">${r.observaciones || ''}</td>
            </tr>`;
        }).join('');

        const table = `
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Fecha</th>
                    <th style="width: 25%">Cliente</th>
                    <th style="width: 15%">Asistencia</th>
                    <th style="width: 15%">Horas</th>
                    <th style="width: 30%">Observaciones</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;

        const footer = `<div class="footer">Generado automáticamente por LT ERP</div>`;

        return `<html><head>${style}</head><body>${header}${summaryGrid}${table}${footer}</body></html>`;
    }

    function buildClientHtml(rows, summary, start, end, client) {
        const fmt = (n) => {
            const num = Number(n);
            return isNaN(num) ? '0.00' : num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        const fmtInt = (n) => {
            const num = Number(n);
            return isNaN(num) ? '0' : num.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        };
        const fmtMoney = (n) => {
            const num = Number(n);
            return isNaN(num) ? '$ 0,00' : num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
        };

        const style = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                color: #1e293b; 
                margin: 0; 
                padding: 40px; 
                background: #ffffff; 
                font-size: 12px;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                padding-bottom: 20px; 
                border-bottom: 2px solid #f1f5f9; 
                margin-bottom: 30px;
            }
            .brand-section h1 { 
                margin: 0; 
                font-size: 24px; 
                font-weight: 700; 
                color: #0f172a; 
                letter-spacing: -0.5px;
            }
            .brand-section .subtitle { 
                margin-top: 4px; 
                color: #64748b; 
                font-size: 13px; 
            }
            .meta-section { 
                text-align: right; 
            }
            .meta-item { 
                margin-bottom: 4px; 
                color: #475569; 
                font-size: 12px; 
            }
            .meta-item strong { 
                color: #0f172a; 
                font-weight: 600; 
            }
            
            .summary-grid { 
                display: grid; 
                grid-template-columns: repeat(5, 1fr); 
                gap: 16px; 
                margin-bottom: 40px; 
            }
            .summary-card { 
                padding: 16px; 
                background: #f8fafc; 
                border-radius: 8px; 
                border: 1px solid #e2e8f0; 
            }
            .summary-card.total { 
                background: #0f172a; 
                color: white; 
                border: none; 
            }
            .summary-label { 
                font-size: 10px; 
                text-transform: uppercase; 
                letter-spacing: 0.05em; 
                color: #64748b; 
                margin-bottom: 8px; 
                font-weight: 600;
            }
            .summary-card.total .summary-label { color: #94a3b8; }
            .summary-value { 
                font-size: 18px; 
                font-weight: 700; 
                color: #0f172a; 
            }
            .summary-card.total .summary-value { color: #ffffff; }
            
            table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 12px; 
            }
            th { 
                text-align: left; 
                padding: 12px 16px; 
                background: #f8fafc; 
                color: #475569; 
                font-weight: 600; 
                text-transform: uppercase; 
                font-size: 11px; 
                letter-spacing: 0.05em; 
                border-bottom: 1px solid #e2e8f0; 
            }
            td { 
                padding: 16px; 
                border-bottom: 1px solid #f1f5f9; 
                color: #334155; 
            }
            tr:last-child td { border-bottom: none; }
            .status-badge { 
                display: inline-flex; 
                align-items: center; 
                padding: 4px 8px; 
                border-radius: 9999px; 
                font-size: 11px; 
                font-weight: 500; 
            }
            .status-ok { background: #dcfce7; color: #166534; }
            .status-bad { background: #fee2e2; color: #991b1b; }
            
            .footer { 
                margin-top: 60px; 
                padding-top: 20px; 
                border-top: 1px solid #f1f5f9; 
                color: #94a3b8; 
                font-size: 11px; 
                text-align: center; 
            }
        </style>`;

        const header = `
        <div class="header">
            <div class="brand-section">
                <h1>Reporte de Cliente</h1>
                <div class="subtitle">LT ERP System</div>
            </div>
            <div class="meta-section">
                <div class="meta-item">Cliente: <strong>${client || 'No indicado'}</strong></div>
                <div class="meta-item">Período: <strong>${start || '-'} al ${end || '-'}</strong></div>
                <div class="meta-item">Fecha de emisión: <strong>${new Date().toLocaleDateString('es-AR')}</strong></div>
            </div>
        </div>`;

        const summaryGrid = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">Total Horas</div>
                <div class="summary-value">${fmt(summary.totalHoras)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Empleados</div>
                <div class="summary-value">${fmtInt(summary.empleados)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Días</div>
                <div class="summary-value">${fmtInt(summary.dias)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Valor Hora</div>
                <div class="summary-value">${fmtMoney(summary.valorHora)}</div>
            </div>
            <div class="summary-card total">
                <div class="summary-label">Total Facturar</div>
                <div class="summary-value">${fmtMoney(summary.totalFacturacion)}</div>
            </div>
        </div>`;

        const rowsHtml = rows.map(r => {
            const asist = r.asistencia === false
                ? '<span class="status-badge status-bad">No</span>'
                : '<span class="status-badge status-ok">Sí</span>';
            return `<tr>
                <td style="font-weight: 500;">${r.fecha || ''}</td>
                <td>${r.empleado || ''}</td>
                <td style="font-family: monospace; font-size: 13px;">${fmt(r.horas)}</td>
                <td>${asist}</td>
                <td style="color: #64748b; font-style: italic;">${r.observaciones || ''}</td>
            </tr>`;
        }).join('');

        const table = `
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Fecha</th>
                    <th style="width: 30%">Empleado</th>
                    <th style="width: 15%">Horas</th>
                    <th style="width: 10%">Asist.</th>
                    <th style="width: 30%">Observaciones</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;

        const footer = `<div class="footer">Generado automáticamente por LT ERP</div>`;

        return `<html><head>${style}</head><body>${header}${summaryGrid}${table}${footer}</body></html>`;
    }

    function buildClientAccountHtml(data, start, end, client) {
        const fmtMoney = (n) => {
            const num = Number(n);
            return isNaN(num) ? '$ 0,00' : num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
        };
        const formatDate = (value) => {
            if (!value) return '';
            if (typeof value === 'string') {
                const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) return `${m[3]}/${m[2]}/${m[1]}`;
            }
            const d = value instanceof Date ? value : new Date(value);
            return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-AR');
        };

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === 'number' ? data.saldoInicial : 0;
        const totalDebe = rows.reduce((acc, r) => acc + (Number(r.debe) || 0), 0);
        const totalHaber = rows.reduce((acc, r) => acc + (Number(r.haber) || 0), 0);
        let saldoFinal = saldoInicial;
        if (rows.length) {
            const lastSaldo = rows[rows.length - 1].saldo;
            saldoFinal = (lastSaldo !== undefined && lastSaldo !== null) ? Number(lastSaldo) : saldoInicial;
        }
        const saldoClass = saldoFinal > 0 ? 'text-danger' : (saldoFinal < 0 ? 'text-success' : 'text-muted');

        const style = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 40px;
                background: #ffffff;
                font-size: 12px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-bottom: 20px;
                border-bottom: 2px solid #f1f5f9;
                margin-bottom: 30px;
            }
            .brand-section h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                letter-spacing: -0.5px;
            }
            .brand-section .subtitle {
                margin-top: 4px;
                color: #64748b;
                font-size: 13px;
            }
            .meta-section {
                text-align: right;
            }
            .meta-item {
                margin-bottom: 4px;
                color: #475569;
                font-size: 12px;
            }
            .meta-item strong {
                color: #0f172a;
                font-weight: 600;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
                margin-bottom: 32px;
            }
            .summary-card {
                padding: 14px;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .summary-card.total {
                background: #0f172a;
                color: #ffffff;
                border: none;
            }
            .summary-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                margin-bottom: 6px;
                font-weight: 600;
            }
            .summary-card.total .summary-label { color: #cbd5f5; }
            .summary-value {
                font-size: 16px;
                font-weight: 700;
                color: #0f172a;
            }
            .summary-card.total .summary-value { color: #ffffff; }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            th {
                text-align: left;
                padding: 12px 16px;
                background: #f8fafc;
                color: #475569;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.05em;
                border-bottom: 1px solid #e2e8f0;
            }
            td {
                padding: 14px 16px;
                border-bottom: 1px solid #f1f5f9;
                color: #334155;
            }
            tr:last-child td { border-bottom: none; }
            .text-end { text-align: right; }
            .text-danger { color: #dc2626; }
            .text-success { color: #16a34a; }
            .text-muted { color: #64748b; }
            .row-highlight { background: #f8fafc; }
            .footer {
                margin-top: 50px;
                padding-top: 16px;
                border-top: 1px solid #f1f5f9;
                color: #94a3b8;
                font-size: 11px;
                text-align: center;
            }
        </style>`;

        const header = `
        <div class="header">
            <div class="brand-section">
                <h1>Cuenta Corriente</h1>
                <div class="subtitle">LT ERP System</div>
            </div>
            <div class="meta-section">
                <div class="meta-item">Cliente: <strong>${client || 'No indicado'}</strong></div>
                <div class="meta-item">Período: <strong>${start || '-'} al ${end || '-'}</strong></div>
                <div class="meta-item">Fecha de emisión: <strong>${new Date().toLocaleDateString('es-AR')}</strong></div>
            </div>
        </div>`;

        const summaryGrid = `
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">Saldo anterior</div>
                <div class="summary-value">${fmtMoney(saldoInicial)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Facturado</div>
                <div class="summary-value text-danger">${fmtMoney(totalDebe)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Cobrado</div>
                <div class="summary-value text-success">${fmtMoney(totalHaber)}</div>
            </div>
            <div class="summary-card total">
                <div class="summary-label">Saldo final</div>
                <div class="summary-value ${saldoClass}">${fmtMoney(saldoFinal)}</div>
            </div>
        </div>`;

        const initialRow = `
            <tr class="row-highlight">
                <td>Saldo anterior</td>
                <td>-</td>
                <td class="text-end">-</td>
                <td class="text-end">-</td>
                <td class="text-end ${saldoInicial > 0 ? 'text-danger' : (saldoInicial < 0 ? 'text-success' : 'text-muted')}">${fmtMoney(saldoInicial)}</td>
            </tr>
        `;

        const rowsHtml = rows.length ? rows.map(r => {
            const saldoRowClass = r.saldo > 0 ? 'text-danger' : (r.saldo < 0 ? 'text-success' : 'text-muted');
            return `
                <tr>
                    <td>${formatDate(r.fecha)}</td>
                    <td>${r.concepto || ''}</td>
                    <td class="text-end text-danger">${r.debe > 0 ? fmtMoney(r.debe) : '-'}</td>
                    <td class="text-end text-success">${r.haber > 0 ? fmtMoney(r.haber) : '-'}</td>
                    <td class="text-end ${saldoRowClass}">${fmtMoney(r.saldo)}</td>
                </tr>
            `;
        }).join('') : `
            <tr>
                <td colspan="5" class="text-muted">Sin movimientos en este período.</td>
            </tr>
        `;

        const table = `
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th>Concepto</th>
                    <th class="text-end" style="width: 15%;">Debe</th>
                    <th class="text-end" style="width: 15%;">Haber</th>
                    <th class="text-end" style="width: 15%;">Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${initialRow}
                ${rowsHtml}
            </tbody>
        </table>`;

        const footer = `<div class="footer">Generado automáticamente por LT ERP</div>`;

        return `<html><head>${style}</head><body>${header}${summaryGrid}${table}${footer}</body></html>`;
    }

    function generateEmployeeSchedulePdf(empleado, idEmpleado, weekStartStr) {
        if (empleado && typeof empleado === 'object' && !Array.isArray(empleado)) {
            idEmpleado = empleado.idEmpleado || empleado.ID_EMPLEADO || idEmpleado;
            weekStartStr = empleado.weekStartDate || empleado.weekStart || weekStartStr;
            empleado = empleado.empleado || empleado.nombre || empleado.label || '';
        }

        const data = AttendanceEmployeeSchedule.getEmployeeWeeklySchedule(empleado, idEmpleado, weekStartStr);
        if (!data || data.error) {
            return { error: data ? data.error : 'No se pudo generar la hoja de ruta.' };
        }

        const clientIds = new Set();
        (data.dias || []).forEach(dia => {
            (dia.clientes || []).forEach(c => {
                if (c && c.idCliente) clientIds.add(String(c.idCliente));
            });
        });

        const mediaMap = buildClientMediaMap_(Array.from(clientIds));
        const html = buildEmployeeScheduleHtml_(data, mediaMap);
        const output = HtmlService.createHtmlOutput(html).setTitle('Hoja de Ruta');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());

        const empClean = String(empleado || 'empleado').replace(/[^a-zA-Z0-9]/g, '_');
        const label = data.semana && data.semana.label ? data.semana.label.replace(/\s+/g, '') : (weekStartStr || '');
        const filename = `hoja_ruta_${empClean}_${label || 'semana'}.pdf`;

        return { filename: filename, base64: base64 };
    }

    function buildClientMediaMap_(clientIds) {
        const map = {};
        const ids = Array.isArray(clientIds) ? clientIds : [];
        ids.forEach(id => {
            if (!id) return;
            try {
                const media = ClientMediaController.listClientMedia(id);
                map[id] = {
                    fachada: pickMedia_(media && media.fachada ? media.fachada : []),
                    llave: pickMedia_(media && media.llave ? media.llave : [])
                };
            } catch (e) {
                map[id] = { fachada: [], llave: [] };
            }
        });
        return map;
    }

    function pickMedia_(items, limit) {
        const max = Number(limit) || 2;
        return (items || []).slice(0, max).map(it => ({
            src: it && it.thumbnailBase64
                ? `data:${it.mimeType || 'image/jpeg'};base64,${it.thumbnailBase64}`
                : '',
            name: it && it.name ? it.name : ''
        }));
    }

    function escapeHtml_(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatHours_(n) {
        const num = Number(n);
        return isNaN(num) ? '0' : num.toFixed(1).replace('.0', '');
    }

    function buildEmployeeScheduleHtml_(data, mediaMap) {
        const style = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 28px;
                background: #ffffff;
                font-size: 11px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 15px;
                border-bottom: 2px solid #6366f1;
                margin-bottom: 22px;
            }
            .brand h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
            }
            .brand .subtitle {
                margin-top: 4px;
                color: #6366f1;
                font-size: 12px;
                font-weight: 600;
            }
            .meta {
                text-align: right;
                font-size: 11px;
                color: #475569;
            }
            .meta strong { color: #0f172a; }
            .summary {
                display: flex;
                gap: 12px;
                margin-bottom: 18px;
            }
            .summary-card {
                flex: 1;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                text-align: center;
            }
            .summary-card strong {
                display: block;
                font-size: 16px;
                margin-top: 4px;
            }
            .day-section {
                margin-bottom: 16px;
                page-break-inside: avoid;
            }
            .day-header {
                background: #eef2ff;
                color: #1e293b;
                padding: 8px 12px;
                border-radius: 8px 8px 0 0;
                font-weight: 700;
                display: flex;
                justify-content: space-between;
            }
            .visit-card {
                border: 1px solid #e2e8f0;
                border-top: none;
                border-radius: 0 0 8px 8px;
                padding: 12px;
                background: #fff;
            }
            .visit {
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 12px;
                margin-top: 12px;
                page-break-inside: avoid;
                background: #f8fafc;
            }
            .visit-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 10px;
                margin-bottom: 10px;
            }
            .visit-title {
                font-weight: 700;
                font-size: 12px;
                color: #0f172a;
            }
            .visit-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 6px;
            }
            .tag-chip {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                font-size: 9px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 999px;
                background: #fff7ed;
                color: #9a3412;
                border: 1px solid #fed7aa;
                white-space: nowrap;
            }
            .tag-dot {
                width: 6px;
                height: 6px;
                border-radius: 999px;
                background: #fb923c;
                display: inline-block;
            }
            .visit-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }
            .visit-block {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 8px 10px;
            }
            .visit-block__title {
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #64748b;
                margin-bottom: 6px;
                font-weight: 700;
            }
            .visit-row {
                display: flex;
                gap: 6px;
                font-size: 10px;
                color: #334155;
                margin-bottom: 4px;
            }
            .visit-row--stack {
                flex-direction: column;
            }
            .visit-label {
                font-weight: 600;
                color: #475569;
                min-width: 78px;
            }
            .visit-value {
                color: #0f172a;
                word-break: break-word;
            }
            .visit-note {
                margin-top: 8px;
                padding: 8px;
                border-radius: 8px;
                border: 1px dashed #cbd5f5;
                background: #eef2ff;
                font-size: 10px;
                color: #1f2937;
            }
            .visit-obs {
                margin-top: 8px;
                padding: 8px;
                border-radius: 8px;
                border: 1px solid #fde68a;
                background: #fffbeb;
                font-size: 10px;
                color: #92400e;
            }
            .photos {
                display: flex;
                gap: 12px;
                margin-top: 8px;
            }
            .photo-group {
                flex: 1;
            }
            .photo-title {
                font-size: 10px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #475569;
            }
            .photo-row {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            .photo {
                width: 90px;
                height: 70px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                object-fit: cover;
            }
            .photo-empty {
                font-size: 10px;
                color: #94a3b8;
            }
            .day-empty {
                color: #94a3b8;
                padding: 10px 0;
                font-size: 10px;
            }
            .footer {
                margin-top: 20px;
                color: #94a3b8;
                font-size: 10px;
                text-align: center;
            }
        </style>`;

        const header = `
        <div class="header">
            <div class="brand">
                <h1>Hoja de Ruta</h1>
                <div class="subtitle">LT ERP · Asistencia</div>
            </div>
            <div class="meta">
                <div>Empleado: <strong>${escapeHtml_(data.empleado || '')}</strong></div>
                <div>Semana: <strong>${escapeHtml_(data.semana ? data.semana.label : '')}</strong></div>
                <div>Generado: <strong>${new Date().toLocaleDateString('es-AR')}</strong></div>
            </div>
        </div>`;

        const summary = `
        <div class="summary">
            <div class="summary-card">
                Horas programadas
                <strong>${formatHours_(data.resumen ? data.resumen.totalHoras : 0)} hs</strong>
            </div>
            <div class="summary-card">
                Clientes
                <strong>${data.resumen ? data.resumen.totalClientes : 0}</strong>
            </div>
            <div class="summary-card">
                Días con trabajo
                <strong>${data.resumen ? data.resumen.diasTrabajo : 0}</strong>
            </div>
        </div>`;

        const buildPhotoGroup = (label, items) => {
            if (!items || !items.length) {
                return `<div class="photo-group"><div class="photo-title">${label}</div><div class="photo-empty">Sin fotos</div></div>`;
            }
            const photos = items.map(p => p.src ? `<img class="photo" src="${p.src}" alt="${escapeHtml_(label)}">` : '').join('');
            return `<div class="photo-group"><div class="photo-title">${label}</div><div class="photo-row">${photos}</div></div>`;
        };

        const parseTags = (value) => {
            if (!value) return [];
            return String(value).split(',').map(t => t.trim()).filter(Boolean);
        };

        const buildRow = (label, value, stacked) => {
            if (!value) return '';
            const rowClass = stacked ? 'visit-row visit-row--stack' : 'visit-row';
            return `
                <div class="${rowClass}">
                    <div class="visit-label">${escapeHtml_(label)}</div>
                    <div class="visit-value">${escapeHtml_(value)}</div>
                </div>
            `;
        };

        const diasConTrabajo = (data.dias || []).filter(dia => dia && Array.isArray(dia.clientes) && dia.clientes.length > 0);

        const daysHtml = (diasConTrabajo.length ? diasConTrabajo : []).map(dia => {
            const dayHeader = `${escapeHtml_(dia.diaDisplay || '')} · ${escapeHtml_(dia.fechaDisplay || '')}`;

            const visits = dia.clientes.map(c => {
                const media = mediaMap && c.idCliente ? mediaMap[String(c.idCliente)] : null;
                const fachada = media ? media.fachada : [];
                const llave = media ? media.llave : [];
                const title = escapeHtml_(c.cliente || c.nombre || c.razonSocial || '');
                const tags = parseTags(c.tags);
                const tagsHtml = tags.length
                    ? `<div class="visit-tags">${tags.map(tag => `<span class="tag-chip"><span class="tag-dot"></span>${escapeHtml_(tag)}</span>`).join('')}</div>`
                    : '';
                const ingreso = c.horaEntrada ? c.horaEntrada : '';
                const horas = c.horasPlan ? `${formatHours_(c.horasPlan)} hs` : '';
                const contactRows = [
                    buildRow('Encargado', c.encargado || ''),
                    buildRow('Teléfono', c.telefono || '')
                ].filter(Boolean).join('');
                const contactBlock = contactRows
                    ? `<div class="visit-block">
                            <div class="visit-block__title">Contacto en el lugar</div>
                            ${contactRows}
                        </div>`
                    : `<div class="visit-block">
                            <div class="visit-block__title">Contacto en el lugar</div>
                            <div class="visit-row visit-row--stack">
                                <div class="visit-value">Sin contacto asignado.</div>
                            </div>
                        </div>`;

                return `
                    <div class="visit">
                        <div class="visit-header">
                            <div>
                                <div class="visit-title">${title}</div>
                            </div>
                        </div>
                        ${tagsHtml}
                        <div class="visit-grid">
                            <div class="visit-block">
                                <div class="visit-block__title">Datos de la visita</div>
                                ${buildRow('Ingreso', ingreso)}
                                ${buildRow('Horas', horas)}
                                ${buildRow('Dirección', c.direccion || '', true)}
                            </div>
                            ${contactBlock}
                        </div>
                        ${c.descripcion ? `<div class="visit-note"><strong>Notas del cliente:</strong> ${escapeHtml_(c.descripcion)}</div>` : ''}
                        ${c.observaciones ? `<div class="visit-obs"><strong>Obs. del plan:</strong> ${escapeHtml_(c.observaciones)}</div>` : ''}
                        <div class="photos">
                            ${buildPhotoGroup('Fachadas', fachada)}
                            ${buildPhotoGroup('Llaves', llave)}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="day-section">
                    <div class="day-header">${dayHeader}</div>
                    <div class="visit-card">${visits}</div>
                </div>`;
        }).join('');

        const daysOutput = daysHtml || `
            <div class="day-section">
                <div class="visit-card">
                    <div class="day-empty">Sin asignaciones en la semana.</div>
                </div>
            </div>`;

        const footer = `<div class="footer">Generado automáticamente por LT ERP</div>`;

        return `<html><head>${style}</head><body>${header}${summary}${daysOutput}${footer}</body></html>`;
    }

    return {
        generateHoursPdf: generateHoursPdf,
        generateClientHoursPdf: generateClientHoursPdf,
        generateClientAccountStatementPdf: generateClientAccountStatementPdf,
        generateEmployeeSchedulePdf: generateEmployeeSchedulePdf
    };
})();
