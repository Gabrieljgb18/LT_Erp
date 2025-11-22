/**
 * Utilidades para manejo y normalización de datos
 */

const DataUtils = (function () {
    /**
     * Normaliza el valor de una celda para búsqueda
     * Convierte fechas a strings y maneja valores nulos
     * @param {*} cell - Valor de la celda
     * @returns {string} Valor normalizado
     */
    function normalizeCellForSearch(cell) {
        if (cell === null || cell === '') return '';

        if (cell instanceof Date) {
            return Utilities.formatDate(
                cell,
                Session.getScriptTimeZone(),
                'yyyy-MM-dd'
            );
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
