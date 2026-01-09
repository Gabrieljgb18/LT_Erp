/**
 * Utilidades para manejo y normalización de datos
 */

var DataUtils = (function () {
    /**
     * Normaliza el valor de una celda para búsqueda
     * Convierte fechas a strings y maneja valores nulos
     * @param {*} cell - Valor de la celda
     * @returns {string} Valor normalizado
     */
    function isTimeHeader(header) {
        const key = String(header || "").trim().toUpperCase();
        if (!key || key.indexOf("HORA") === -1) return false;
        if (key.indexOf("HORAS") !== -1) return false;
        if (key.indexOf("VALOR") !== -1) return false;
        return true;
    }

    function formatTimeValue_(cell) {
        if (cell instanceof Date && !isNaN(cell)) {
            return Utilities.formatDate(
                cell,
                Session.getScriptTimeZone(),
                'HH:mm'
            );
        }
        if (typeof cell === "number" && isFinite(cell)) {
            const totalMinutes = Math.round(cell * 24 * 60);
            const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
            const mm = String(totalMinutes % 60).padStart(2, "0");
            return hh + ":" + mm;
        }
        return String(cell);
    }

    function normalizeCellForSearch(cell, header) {
        if (cell === null || cell === '') return '';

        if (cell instanceof Date) {
            if (isTimeHeader(header)) {
                return formatTimeValue_(cell);
            }
            return Utilities.formatDate(
                cell,
                Session.getScriptTimeZone(),
                'yyyy-MM-dd'
            );
        }

        if (isTimeHeader(header)) {
            return formatTimeValue_(cell);
        }

        return String(cell);
    }

    /**
     * Verifica si un valor se considera "verdadero" según las convenciones del sistema
     * @param {*} value - Valor a verificar
     * @returns {boolean} True si el valor es truthy según nuestras reglas
     */
    function isTruthy(value) {
        return (
            value === true ||
            value === 'TRUE' ||
            value === 'true' ||
            value === 1 ||
            value === '1' ||
            value === 'Activo' ||
            value === 'SI' ||
            value === 'Si' ||
            value === 'Asistió'
        );
    }

    return {
        normalizeCellForSearch: normalizeCellForSearch,
        isTruthy: isTruthy
    };
})();
