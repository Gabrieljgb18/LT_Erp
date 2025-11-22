/**
 * Utilidades para manejo de fechas
 */

const DateUtils = (function () {
    /**
     * Convierte una fecha (string o Date) al nombre del día de la semana en español
     * @param {string|Date} fechaStr - Fecha en formato "2025-12-11", "11/12/2025" o Date object
     * @returns {string} Nombre del día (LUNES, MARTES, etc.)
     */
    function getDayNameFromDateString(fechaStr) {
        if (!fechaStr) return '';

        let d;

        if (Object.prototype.toString.call(fechaStr) === '[object Date]') {
            d = fechaStr;
        } else {
            const s = String(fechaStr).trim();

            if (s.indexOf('-') >= 0) {
                const p = s.split('-'); // [yyyy, mm, dd]
                d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
            } else if (s.indexOf('/') >= 0) {
                const p2 = s.split('/'); // [dd, mm, yyyy]
                d = new Date(Number(p2[2]), Number(p2[1]) - 1, Number(p2[0]));
            } else {
                d = new Date(s);
            }
        }

        if (isNaN(d)) return '';

        const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        return dias[d.getDay()];
    }

    /**
     * Retorna la fecha actual en formato ISO (YYYY-MM-DD)
     * @returns {string} Fecha en formato ISO
     */
    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    return {
        getDayNameFromDateString: getDayNameFromDateString,
        todayIso: todayIso
    };
})();
