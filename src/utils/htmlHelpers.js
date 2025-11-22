/**
 * HTML Helpers
 * Utilidades para generación de HTML y escape de strings
 */

(function (global) {
    const HtmlHelpers = (() => {

        /**
         * Escapa caracteres HTML para prevenir XSS
         * @param {string} str - String a escapar
         * @returns {string} String escapado
         */
        function escapeHtml(str) {
            return String(str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        /**
         * Genera opciones HTML para select de empleados
         * @param {string} selected - Empleado seleccionado
         * @param {Array} empleados - Lista de empleados
         * @returns {string} HTML de opciones
         */
        function getEmpleadoOptionsHtml(selected, empleados = []) {
            const opts = ['<option value="">Seleccionar...</option>'];
            empleados.forEach(emp => {
                const sel = emp === selected ? " selected" : "";
                opts.push('<option value="' + escapeHtml(emp) + '"' + sel + ">" +
                    escapeHtml(emp) + "</option>");
            });
            return opts.join("");
        }

        /**
         * Genera opciones HTML para select de días de la semana
         * @param {string} selected - Día seleccionado
         * @returns {string} HTML de opciones
         */
        function getDiaOptionsHtml(selected) {
            const days = [
                "LUNES",
                "MARTES",
                "MIERCOLES",
                "JUEVES",
                "VIERNES",
                "SABADO",
                "DOMINGO",
            ];
            const opts = ['<option value="">Día...</option>'];
            days.forEach(d => {
                const sel = d === selected ? " selected" : "";
                opts.push('<option value="' + d + '"' + sel + ">" + d + "</option>");
            });
            return opts.join("");
        }

        /**
         * Formatea hora de entrada para input type="time"
         * @param {Date|string} horaEntrada - Hora a formatear
         * @returns {string} Hora en formato HH:MM
         */
        function formatHoraEntradaForInput(horaEntrada) {
            if (!horaEntrada) return "";

            // Si viene como Date desde Apps Script
            if (Object.prototype.toString.call(horaEntrada) === "[object Date]" && !isNaN(horaEntrada)) {
                const hh = String(horaEntrada.getHours()).padStart(2, "0");
                const mm = String(horaEntrada.getMinutes()).padStart(2, "0");
                return `${hh}:${mm}`;
            }

            // Si viene como string, tratamos de rescatar hh:mm
            const s = String(horaEntrada).trim();
            const match = s.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                const hh = match[1].padStart(2, "0");
                const mm = match[2];
                return `${hh}:${mm}`;
            }

            return "";
        }

        return {
            escapeHtml,
            getEmpleadoOptionsHtml,
            getDiaOptionsHtml,
            formatHoraEntradaForInput
        };
    })();

    global.HtmlHelpers = HtmlHelpers;
})(typeof window !== "undefined" ? window : this);
