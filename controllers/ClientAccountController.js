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
        const resumen = HoursController.getMonthlySummaryByClient(year, month) || [];
        const cobros = getCobrosCliForMonth(year, month);

        const cobrosMap = aggregateByCliente(cobros);

        return resumen.map(item => {
            const cli = item.cliente;
            const cobro = cobrosMap.get(cli) || 0;
            const debe = Number(item.totalFacturacion || 0);
            const haber = cobro;
            const saldo = debe - haber;
            return {
                cliente: cli,
                debe: debe,
                haber: haber,
                saldo: saldo
            };
        });
    }

    /**
     * Registra cobro de cliente (PAGOS_CLIENTE)
     */
    function recordClientPayment(fecha, cliente, concepto, monto, obs) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTE');
        if (!sheet) throw new Error('Sheet PAGOS_CLIENTE no encontrado');

        const lastRow = sheet.getLastRow();
        const newId = lastRow >= 2 ? (Number(sheet.getRange(lastRow, 1).getValue()) + 1) : 1;
        sheet.appendRow([newId, fecha ? new Date(fecha) : new Date(), cliente, concepto, Number(monto) || 0, obs || '']);
        return { ok: true, id: newId };
    }

    function getCobrosCliForMonth(year, month) {
        const sheet = DatabaseService.getDbSheetForFormat('PAGOS_CLIENTE');
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol === 0) return [];

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const idxFecha = headers.indexOf('FECHA');
        const idxCli = headers.indexOf('CLIENTE');
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
                    monto: Number(row[idxMonto]) || 0
                };
            })
            .filter(Boolean);
    }

    function aggregateByCliente(items) {
        const map = new Map();
        items.forEach(i => {
            const key = i.cliente;
            const prev = map.get(key) || 0;
            map.set(key, prev + (i.monto || 0));
        });
        return map;
    }

    return {
        getClientAccountStatement: getClientAccountStatement,
        recordClientPayment: recordClientPayment
    };
})();
