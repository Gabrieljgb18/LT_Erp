/**
 * Formatters
 * Utilidades para formateo consistente en la UI.
 */

(function (global) {
  const Formatters = (() => {
    function formatCurrency(value, locale, currency) {
      const num = Number(value) || 0;
      const loc = locale || "es-AR";
      const curr = currency || "ARS";
      return num.toLocaleString(loc, { style: "currency", currency: curr });
    }

    function formatNumber(value, decimals, locale) {
      const num = Number(value) || 0;
      const loc = locale || "es-AR";
      if (typeof decimals === "number") {
        return num.toLocaleString(loc, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }
      return num.toLocaleString(loc);
    }

    function formatHours(value, locale) {
      const num = Number(value) || 0;
      const loc = locale || "es-AR";
      return num.toLocaleString(loc, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + " hs";
    }

    function formatDateDisplay(value, locale) {
      if (!value) return "";
      if (typeof value === "string") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) return `${match[3]}/${match[2]}/${match[1]}`;
      }
      const d = value instanceof Date ? value : new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(locale || "es-AR");
      }
      return String(value);
    }

    return {
      formatCurrency,
      formatNumber,
      formatHours,
      formatDateDisplay
    };
  })();

  global.Formatters = Formatters;
})(typeof window !== "undefined" ? window : this);
