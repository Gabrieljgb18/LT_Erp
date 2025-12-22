/**
 * Cuenta corriente de clientes (facturación menos cobros)
 */
var ClientAccountController = (function () {

    /**
     * Devuelve la cuenta corriente mensual por cliente
     * @param {number} year
     * @param {number} month - 1-12
     */
    function getClientAccountStatement(year, month) {
        year = Number(year);
        month = Number(month);
        if (!year || !month) return [];

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const debitos = getDebitosFacturacionForMonth_(start, end);
        const cobros = getCobrosCliForMonth(year, month);

        const debeMap = aggregateByClienteId_(debitos, 'idCliente', 'monto');
        const haberMap = aggregateByClienteId_(cobros, 'idCliente', 'monto');

        const keys = new Set();
        debitos.forEach(d => keys.add(d.key));
        cobros.forEach(c => keys.add(c.key));

        const result = [];
        keys.forEach(key => {
            const label = key.label || '';
            const idCliente = key.idCliente || '';
            const debe = debeMap.get(key.k) || 0;
            const haber = haberMap.get(key.k) || 0;
            result.push({ cliente: label, idCliente: idCliente, debe: debe, haber: haber, saldo: debe - haber });
        });

        result.sort((a, b) => (b.saldo || 0) - (a.saldo || 0));
        return result;
    }

    /**
     * Registra cobro de cliente (PAGOS_CLIENTE)
     */
    function recordClientPayment(fecha, cliente, concepto, monto, obs) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        if (!sheet) throw new Error('Sheet PAGOS_CLIENTES no encontrado');

        if (sheet.getLastRow() === 0) {
            sheet.appendRow([
                'ID',
                'ID_CLIENTE',
                'FECHA',
                'RAZÓN SOCIAL',
                'CUIT',
                'DETALLE',
                'N° COMPROBANTE',
                'MEDIO DE PAGO',
                'MONTO',
                'ID_FACTURA',
                'FACTURA_NUMERO'
            ]);
        }

        const id = DatabaseService.getNextId(sheet);
        sheet.appendRow([
            id,
            '', // idCliente legacy no disponible en esta API
            fecha ? new Date(fecha) : new Date(),
            cliente || '',
            '',
            concepto || '',
            '',
            '',
            Number(monto) || 0,
            '',
            ''
        ]);
        return { ok: true, id: id };
    }

    function getCobrosCliForMonth(year, month) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTES');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim().toUpperCase());
        const idxFecha = headers.indexOf('FECHA');
        const idxCli = headers.indexOf('RAZÓN SOCIAL') > -1 ? headers.indexOf('RAZÓN SOCIAL') : headers.indexOf('RAZON SOCIAL');
        const idxIdCli = headers.indexOf('ID_CLIENTE');
        const idxMonto = headers.indexOf('MONTO');
        if (idxFecha === -1 || idxCli === -1 || idxMonto === -1) return [];

        const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        return data
            .map(row => {
                const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
                if (fecha < start || fecha > end) return null;
                return {
                    cliente: row[idxCli],
                    idCliente: idxIdCli > -1 ? String(row[idxIdCli] || '').trim() : '',
                    monto: Number(row[idxMonto]) || 0,
                    key: buildKey_(idxIdCli > -1 ? String(row[idxIdCli] || '').trim() : '', row[idxCli])
                };
            })
            .filter(Boolean);
    }

    function buildKey_(idCliente, label) {
        const id = idCliente ? String(idCliente) : '';
        const l = String(label || '');
        // Normalización consistente con remoción de acentos
        const normLabel = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const k = id ? ('id:' + id) : ('name:' + normLabel);
        return { k: k, idCliente: id, label: l };
    }

    function aggregateByClienteId_(items, idField, amountField) {
        const map = new Map();
        (items || []).forEach(i => {
            if (!i) return;
            const keyObj = i.key || buildKey_(i[idField], i.cliente || i.label);
            const key = keyObj.k;
            const prev = map.get(key) || 0;
            map.set(key, prev + (Number(i[amountField]) || 0));
        });
        return map;
    }

    function getDebitosFacturacionForMonth_(start, end) {
        const sheet = DatabaseService.getDbSheetForFormat('FACTURACION');
        const data = sheet.getDataRange().getValues();
        if (!data || data.length < 2) return [];
        const headers = data[0].map(h => String(h || '').trim().toUpperCase());
        const rows = data.slice(1);

        const idxFecha = headers.indexOf('FECHA');
        const idxIdCli = headers.indexOf('ID_CLIENTE');
        const idxCli = headers.indexOf('RAZÓN SOCIAL') > -1 ? headers.indexOf('RAZÓN SOCIAL') : headers.indexOf('RAZON SOCIAL');
        const idxTotal = headers.indexOf('TOTAL');
        const idxEstado = headers.indexOf('ESTADO');
        if (idxFecha === -1) return [];

        return rows.map(row => {
            const fecha = row[idxFecha] instanceof Date ? row[idxFecha] : new Date(row[idxFecha]);
            if (isNaN(fecha.getTime()) || fecha < start || fecha > end) return null;
            const estado = idxEstado > -1 ? String(row[idxEstado] || '').toLowerCase().trim() : '';
            if (estado === 'anulada') return null;
            const idCliente = idxIdCli > -1 ? String(row[idxIdCli] || '').trim() : '';
            const cli = idxCli > -1 ? row[idxCli] : '';
            return {
                cliente: cli,
                idCliente: idCliente,
                monto: idxTotal > -1 ? Number(row[idxTotal]) || 0 : 0,
                key: buildKey_(idCliente, cli)
            };
        }).filter(Boolean);
    }

    return {
        getClientAccountStatement: getClientAccountStatement,
        recordClientPayment: recordClientPayment
    };
})();
