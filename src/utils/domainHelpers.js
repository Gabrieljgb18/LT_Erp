/**
 * DomainHelpers
 * Utilidades de dominio (clientes, empleados, fechas, periodos).
 */
(function (global) {
  const DomainHelpers = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function parseDate(value) {
      if (!value) return null;
      if (value instanceof Date && !isNaN(value.getTime())) return value;
      const str = toStr(value).trim();
      if (!str) return null;

      // YYYY-MM-DD
      const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) {
        const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        return isNaN(d.getTime()) ? null : d;
      }

      // DD/MM/YYYY
      const dmySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmySlash) {
        const d = new Date(Number(dmySlash[3]), Number(dmySlash[2]) - 1, Number(dmySlash[1]));
        return isNaN(d.getTime()) ? null : d;
      }

      // DD-MM-YYYY
      const dmyDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dmyDash) {
        const d = new Date(Number(dmyDash[3]), Number(dmyDash[2]) - 1, Number(dmyDash[1]));
        return isNaN(d.getTime()) ? null : d;
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }

    function formatDateISO(value) {
      const d = parseDate(value);
      if (!d) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    function formatDateInput(value) {
      return formatDateISO(value);
    }

    function formatPeriodLabel(period) {
      if (!period) return "";
      const str = toStr(period).trim();
      let year, month;
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        year = str.slice(0, 4);
        month = str.slice(5, 7);
      } else if (/^\d{4}-\d{2}$/.test(str)) {
        year = str.slice(0, 4);
        month = str.slice(5, 7);
      } else {
        return str;
      }
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const mIdx = Number(month) - 1;
      return `${months[mIdx] || month} ${year}`;
    }

    function formatPeriodRange(period) {
      const str = toStr(period).trim();
      if (!str) return { start: "", end: "" };
      const y = Number(str.slice(0, 4));
      const m = Number(str.slice(5, 7));
      if (!y || !m) return { start: "", end: "" };
      const start = `${str.slice(0, 7)}-01`;
      const endDate = new Date(y, m, 0);
      const end = `${str.slice(0, 7)}-${String(endDate.getDate()).padStart(2, "0")}`;
      return { start, end };
    }

    function getClientDisplayName(cliente, options) {
      if (global.HtmlHelpers && typeof global.HtmlHelpers.getClientDisplayName === "function") {
        return global.HtmlHelpers.getClientDisplayName(cliente, options);
      }
      if (!cliente) return "";
      if (typeof cliente === "string") return cliente;
      const opts = options || {};
      const nombre = toStr(cliente.nombre || cliente["NOMBRE"] || "").trim();
      const razon = toStr(cliente.razonSocial || cliente["RAZÓN SOCIAL"] || cliente["RAZON SOCIAL"] || "").trim();
      if (opts.preferRazon) return razon || nombre;
      return nombre || razon;
    }

    function getClientLabel(cliente, options) {
      if (global.HtmlHelpers && typeof global.HtmlHelpers.formatClientLabel === "function") {
        return global.HtmlHelpers.formatClientLabel(cliente, options);
      }
      if (!cliente) return "";
      if (typeof cliente === "string") return cliente;
      const opts = options || {};
      const base = getClientDisplayName(cliente, { preferRazon: !!opts.preferRazon });
      const id = cliente.id != null ? toStr(cliente.id).trim() : "";
      const docType = toStr(cliente.docType || cliente["TIPO DOCUMENTO"] || "").trim();
      const rawDoc = cliente.docNumber || cliente["NUMERO DOCUMENTO"] || cliente.cuit || "";
      const docLabel = rawDoc && global.InputUtils && typeof global.InputUtils.formatDocLabel === "function"
        ? global.InputUtils.formatDocLabel(docType || (cliente.cuit ? "CUIT" : ""), rawDoc)
        : "";
      const meta = [];
      if (id) meta.push(`ID: ${id}`);
      if (docLabel) meta.push(docLabel);
      const metaSuffix = meta.length ? ` (${meta.join(" | ")})` : "";
      return (base + metaSuffix).trim();
    }

    function getEmployeeLabel(emp) {
      if (!emp) return "";
      if (typeof emp === "string") return emp;
      const nombre = toStr(emp.nombre || emp.displayName || emp.empleado || emp.label || "").trim();
      const id = emp.id || emp.ID || emp.ID_EMPLEADO;
      const idStr = id != null ? toStr(id).trim() : "";
      if (nombre && idStr) return `${nombre} (#${idStr})`;
      return nombre || idStr;
    }

    function extractIdFromLabel(label) {
      const str = toStr(label);
      const match = str.match(/ID\\s*:\\s*([^|)]+)/i);
      if (match) return match[1].trim();
      const hashMatch = str.match(/#\\s*([A-Za-z0-9_-]+)/);
      if (hashMatch) return hashMatch[1].trim();
      const plain = str.trim();
      if (/^\\d+$/.test(plain)) return plain;
      return "";
    }

    return {
      parseDate,
      formatDateISO,
      formatDateInput,
      formatPeriodLabel,
      formatPeriodRange,
      getClientDisplayName,
      getClientLabel,
      getEmployeeLabel,
      extractIdFromLabel
    };
  })();

  global.DomainHelpers = DomainHelpers;
})(typeof window !== "undefined" ? window : this);
