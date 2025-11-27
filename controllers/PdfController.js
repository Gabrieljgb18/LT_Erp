/**
 * Generación de PDFs con estilo empresarial moderno
 */
var PdfController = (function () {
    function generateHoursPdf(startDateStr, endDateStr, employeeName) {
        const data = HoursController.getHoursByEmployee(startDateStr, endDateStr, employeeName);
        if (!data || !data.rows) return null;

        const html = buildHtml(data.rows, data.summary || {}, startDateStr, endDateStr, employeeName);
        const output = HtmlService.createHtmlOutput(html).setTitle('Reporte Horas');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `reporte_horas_${employeeName || 'empleado'}_${startDateStr || ''}_${endDateStr || ''}.pdf`;
        return { filename: filename, base64: base64 };
    }

    function generateClientHoursPdf(startDateStr, endDateStr, clientName) {
        const data = HoursController.getHoursByClient(startDateStr, endDateStr, clientName);
        if (!data || !data.rows) return null;

        const html = buildClientHtml(data.rows, data.summary || {}, startDateStr, endDateStr, clientName);
        const output = HtmlService.createHtmlOutput(html).setTitle('Reporte Cliente');
        const pdfBlob = output.getAs('application/pdf');
        const base64 = Utilities.base64Encode(pdfBlob.getBytes());
        const filename = `reporte_cliente_${clientName || 'cliente'}_${startDateStr || ''}_${endDateStr || ''}.pdf`;
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

    return {
        generateHoursPdf: generateHoursPdf,
        generateClientHoursPdf: generateClientHoursPdf
    };
})();
