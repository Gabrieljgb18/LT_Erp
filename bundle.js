// Archivo generado. Editá los módulos en /src y corré `node generate_bundle_html.js`.
var NumberUtils = (function () {
  function normalizeCandidate_(value) {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    return raw;
  }

  function parseLocalizedNumber(value) {
    const candidate = normalizeCandidate_(value);
    if (candidate === null) return null;

    const cleaned = candidate
      .replace(/\s/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return {
    parseLocalizedNumber
  };
})();


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
                .replace(/[<]/g, "&lt;")
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
        function getEmpleadoOptionsHtml(selectedId, empleados = []) {
            const selected = selectedId != null ? String(selectedId) : '';
            const opts = ['<option value="">Seleccionar...</option>'];
            empleados.forEach(emp => {
                const label = typeof emp === 'string' ? emp : (emp.nombre || emp.empleado || emp.label || '');
                const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id) : '';
                if (!id || !label) return;
                const sel = selected && id === selected ? " selected" : "";
                opts.push('<option value="' + escapeHtml(id) + '" data-name="' + escapeHtml(label) + '"' + sel + ">" +
                    escapeHtml(label) + "</option>");
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

            const numericVal = Number(horaEntrada);
            if (Number.isFinite(numericVal)) {
                const fraction = numericVal >= 1 ? (numericVal % 1) : numericVal;
                if (fraction > 0) {
                    const totalMinutes = Math.round(fraction * 24 * 60);
                    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
                    const mm = String(totalMinutes % 60).padStart(2, "0");
                    return `${hh}:${mm}`;
                }
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

        function getClientDisplayName(cliente, options) {
            if (!cliente) return "";
            if (typeof cliente === "string") return cliente;
            const opts = options || {};
            const nombre = cliente.nombre || cliente.NOMBRE || cliente.cliente || cliente.CLIENTE || "";
            const razon = cliente.razonSocial || cliente["RAZON SOCIAL"] || cliente["RAZÓN SOCIAL"] || "";
            if (opts.preferRazon) {
                return (razon || nombre || "").toString().trim();
            }
            return (nombre || razon || "").toString().trim();
        }

        function getClientDocLabel(cliente) {
            if (!cliente || typeof cliente !== "object") return "";
            const docType = (cliente.docType || cliente["TIPO DOCUMENTO"] || "").toString().trim();
            const rawDoc = cliente.docNumber || cliente["NUMERO DOCUMENTO"] || cliente.cuit || "";
            if (!rawDoc) return "";
            const fallbackType = docType || (cliente.cuit ? "CUIT" : "");
            if (global.InputUtils && typeof global.InputUtils.formatDocLabel === "function") {
                return global.InputUtils.formatDocLabel(fallbackType, rawDoc);
            }
            return (fallbackType ? fallbackType + " " : "") + rawDoc;
        }

        function formatClientLabel(cliente, options) {
            if (!cliente) return "";
            if (typeof cliente === "string") return cliente;
            const opts = options || {};
            const base = getClientDisplayName(cliente, { preferRazon: !!opts.preferRazon });
            const id = cliente.id != null ? String(cliente.id).trim() : "";
            const includeId = opts.includeId !== false;
            const includeDoc = opts.includeDoc !== false;
            const docLabel = includeDoc ? getClientDocLabel(cliente) : "";
            const meta = [];
            if (includeId && id) meta.push(`ID: ${id}`);
            if (docLabel) meta.push(docLabel);
            const metaSuffix = meta.length ? ` (${meta.join(" | ")})` : "";
            return (base + metaSuffix).trim();
        }

        return {
            escapeHtml,
            getEmpleadoOptionsHtml,
            getDiaOptionsHtml,
            formatHoraEntradaForInput,
            getClientDisplayName,
            getClientDocLabel,
            formatClientLabel
        };
    })();

    global.HtmlHelpers = HtmlHelpers;
})(typeof window !== "undefined" ? window : this);


/**
 * DomHelpers
 * Helpers para crear nodos de forma segura.
 */
(function (global) {
  const DomHelpers = (() => {
    function text(value) {
      return document.createTextNode(value == null ? "" : String(value));
    }

    function setAttrs(el, attrs) {
      if (!attrs) return;
      Object.keys(attrs).forEach((key) => {
        const val = attrs[key];
        if (val == null) return;
        if (key === "class" || key === "className") {
          el.className = String(val);
          return;
        }
        if (key === "text") {
          el.textContent = String(val);
          return;
        }
        if (key === "dataset" && typeof val === "object") {
          Object.keys(val).forEach((dataKey) => {
            if (val[dataKey] != null) {
              el.dataset[dataKey] = String(val[dataKey]);
            }
          });
          return;
        }
        if (key === "style" && typeof val === "object") {
          Object.keys(val).forEach((styleKey) => {
            el.style[styleKey] = val[styleKey];
          });
          return;
        }
        if (key.startsWith("on") && typeof val === "function") {
          el.addEventListener(key.slice(2).toLowerCase(), val);
          return;
        }
        el.setAttribute(key, String(val));
      });
    }

    function append(parent, child) {
      if (!parent || child == null) return;
      if (Array.isArray(child)) {
        child.forEach((c) => append(parent, c));
        return;
      }
      if (typeof child === "string" || typeof child === "number") {
        parent.appendChild(text(child));
        return;
      }
      parent.appendChild(child);
    }

    function el(tag, attrs, children) {
      const node = document.createElement(tag);
      setAttrs(node, attrs);
      append(node, children);
      return node;
    }

    function clear(el) {
      if (!el) return;
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }

    return {
      el,
      text,
      clear,
      append
    };
  })();

  global.DomHelpers = DomHelpers;
})(typeof window !== "undefined" ? window : this);


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


(function (global) {
  const InputUtils = (() => {
    function normalizeDocType(type) {
      const raw = String(type || '').trim().toUpperCase();
      if (raw === 'DNI') return 'DNI';
      if (raw === 'CUIL') return 'CUIL';
      if (raw === 'CUIT') return 'CUIT';
      return '';
    }

    function digitsOnly(value) {
      return String(value || '').replace(/\D/g, '');
    }

    function formatDocNumber(value, docType) {
      const type = normalizeDocType(docType);
      const digits = digitsOnly(value);

      if (type === 'DNI') {
        return digits.slice(0, 8);
      }

      if (type === 'CUIL' || type === 'CUIT') {
        const trimmed = digits.slice(0, 11);
        if (trimmed.length <= 2) return trimmed;
        if (trimmed.length <= 10) {
          return trimmed.slice(0, 2) + '-' + trimmed.slice(2);
        }
        return trimmed.slice(0, 2) + '-' + trimmed.slice(2, 10) + '-' + trimmed.slice(10);
      }

      return value;
    }

    function docPlaceholder(docType) {
      const type = normalizeDocType(docType);
      if (type === 'DNI') return '12345678';
      if (type === 'CUIL' || type === 'CUIT') return '00-00000000-0';
      return '';
    }

    function isValidDocNumber(value, docType) {
      if (!value) return true;
      const type = normalizeDocType(docType);
      const digits = digitsOnly(value);

      if (!type) return false;

      if (type === 'DNI') {
        return digits.length === 8;
      }

      if (type === 'CUIL' || type === 'CUIT') {
        return digits.length === 11;
      }

      return false;
    }

    function formatDocLabel(docType, docNumber) {
      const type = normalizeDocType(docType);
      if (!docNumber) return '';
      const formatted = formatDocNumber(docNumber, type || docType);
      if (!formatted) return '';
      return type ? (type + ' ' + formatted) : formatted;
    }

    function sanitizePhone(value) {
      const raw = String(value || '').trim();
      let out = '';
      let hasPlus = false;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === '+' && !hasPlus && out.length === 0) {
          out += '+';
          hasPlus = true;
          continue;
        }
        if (ch >= '0' && ch <= '9') {
          out += ch;
        }
      }
      return out;
    }

    function isValidPhone(value) {
      if (!value) return true;
      const clean = sanitizePhone(value);
      if (!clean) return false;
      const digits = clean.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return false;
      if (clean[0] === '+') {
        return /^\+\d+$/.test(clean);
      }
      return /^\d+$/.test(clean);
    }

    function isValidEmail(value) {
      if (!value) return true;
      const v = String(value).trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    return {
      normalizeDocType,
      digitsOnly,
      formatDocNumber,
      docPlaceholder,
      isValidDocNumber,
      formatDocLabel,
      sanitizePhone,
      isValidPhone,
      isValidEmail
    };
  })();

  global.InputUtils = InputUtils;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Constantes y definiciones de campos para cada formato.
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  const FORM_DEFINITIONS = {
    CLIENTES: {
      title: "Registro de clientes",
      fields: [
        { id: "SECTION_DATOS", label: "Datos del cliente", type: "section", icon: "bi-building" },
        { id: "NOMBRE", label: "Nombre", type: "text", placeholder: "Nombre del cliente" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo", falseLabel: "Inactivo", defaultChecked: true },
        { id: "RAZON SOCIAL", label: "Razón social", type: "text" },
        { id: "TIPO DOCUMENTO", label: "Tipo de documento", type: "docType" },
        { id: "NUMERO DOCUMENTO", label: "Número de documento", type: "docNumber", docTypeField: "TIPO DOCUMENTO", placeholder: "00-00000000-0" },
        {
          id: "TIPO SERVICIO",
          label: "Tipo de servicio",
          type: "select",
          options: ["Oficina", "Edificio", "Casa Particular", "Empresa", "Laboratorio", "Hospital"]
        },
        { id: "DESCRIPCION", label: "Descripción", type: "textarea", rows: 3, placeholder: "Descripción del servicio", full: true },
        { id: "ETIQUETAS", label: "Etiquetas", type: "tags", full: true, placeholder: "Agregar etiqueta..." },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "MAPS PLACE ID", label: "Maps Place ID", type: "text", hidden: true },
        { id: "MAPS LAT", label: "Maps Lat", type: "text", hidden: true },
        { id: "MAPS LNG", label: "Maps Lng", type: "text", hidden: true },
        { id: "SECTION_ADMIN", label: "Administración y facturación", type: "section", icon: "bi-clipboard-check" },
        { id: "NOMBRE ADMINISTRADOR", label: "Administrador", type: "text", placeholder: "Nombre del administrador" },
        { id: "CORREO ADMINISTRACION", label: "Correo administración", type: "email" },
        { id: "TELEFONO ADMINISTRACION", label: "Teléfono administración", type: "phone" },
        { id: "CORREO FACTURACION", label: "Correo facturación", type: "email" },
        {
          id: "TIPO FACTURACION",
          label: "Tipo de facturación",
          type: "select",
          options: ["Recibo X", "Factura A", "Factura B"]
        },
        { id: "FECHA CONTRATO", label: "Fecha contrato", type: "date" },
        { id: "VALOR HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "SECTION_ENCARGADO", label: "Encargado en el lugar", type: "section", icon: "bi-person-badge" },
        {
          id: "TIENE ENCARGADO",
          label: "Tiene encargado",
          type: "boolean",
          trueLabel: "Sí",
          falseLabel: "No",
          defaultChecked: false
        },
        { id: "ENCARGADO", label: "Nombre encargado", type: "text" },
        { id: "TELEFONO", label: "Teléfono encargado", type: "phone" },
        { id: "HORA ENTRADA", label: "Hora de entrada", type: "time" },
        { id: "SECTION_DIAS", label: "Días de servicio", type: "section", icon: "bi-calendar-week" },
        { id: "LUNES HS", label: "Horas lunes", type: "number", step: "0.5" },
        { id: "MARTES HS", label: "Horas martes", type: "number", step: "0.5" },
        { id: "MIERCOLES HS", label: "Horas miércoles", type: "number", step: "0.5" },
        { id: "JUEVES HS", label: "Horas jueves", type: "number", step: "0.5" },
        { id: "VIERNES HS", label: "Horas viernes", type: "number", step: "0.5" },
        { id: "SABADO HS", label: "Horas sábado", type: "number", step: "0.5" },
        { id: "DOMINGO HS", label: "Horas domingo", type: "number", step: "0.5" }
      ]
    },
    EMPLEADOS: {
      title: "Registro de empleados",
      fields: [
        { id: "SECTION_DATOS", label: "Datos del empleado", type: "section", icon: "bi-person-badge" },
        { id: "ESTADO", label: "Estado", type: "boolean", trueLabel: "Activo", falseLabel: "Inactivo", defaultChecked: true },
        { id: "EMPLEADO", label: "Empleado", type: "text", full: true },
        { id: "SECTION_DOC", label: "Documentación", type: "section", icon: "bi-card-text" },
        { id: "TIPO DOCUMENTO", label: "Tipo de documento", type: "docType" },
        { id: "NUMERO DOCUMENTO", label: "Número de documento", type: "docNumber", docTypeField: "TIPO DOCUMENTO", placeholder: "00-00000000-0" },
        { id: "SECTION_CONTACTO", label: "Contacto", type: "section", icon: "bi-telephone" },
        { id: "DIRECCION", label: "Dirección", type: "text", full: true },
        { id: "MAPS PLACE ID", label: "Maps Place ID", type: "text", hidden: true },
        { id: "MAPS LAT", label: "Maps Lat", type: "text", hidden: true },
        { id: "MAPS LNG", label: "Maps Lng", type: "text", hidden: true },
        { id: "TELEFONO", label: "Teléfono", type: "phone" },
        { id: "SECTION_EMERGENCIA", label: "Contacto de emergencia", type: "section", icon: "bi-life-preserver" },
        { id: "CONTACTO EMERGENCIA NOMBRE", label: "Nombre", type: "text", full: true },
        { id: "CONTACTO EMERGENCIA VINCULO", label: "Vínculo", type: "text" },
        { id: "CONTACTO EMERGENCIA TELEFONO", label: "Teléfono", type: "phone" },
        { id: "SECTION_VIVIENDA", label: "Vivienda", type: "section", icon: "bi-house" },
        { id: "DESCRIPCION VIVIENDA", label: "Descripción de vivienda", type: "textarea", rows: 3, full: true },
        { id: "SECTION_PAGO", label: "Pago y condiciones", type: "section", icon: "bi-cash-coin" },
        { id: "CBU - ALIAS", label: "CBU / Alias", type: "text", full: true },
        { id: "VALOR DE HORA", label: "Valor de hora", type: "number", step: "0.01" },
        { id: "VIATICOS", label: "Viáticos", type: "number", step: "0.01" }
      ]
    },
    FACTURACION: {
      title: "Registro de facturación",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "NUMERO", label: "Número", type: "text" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "docNumber", docTypeValue: "CUIT", placeholder: "00-00000000-0" },
        { id: "IMPORTE", label: "Importe", type: "number", step: "0.01" },
        { id: "SUBTOTAL", label: "Subtotal", type: "number", step: "0.01" },
        { id: "TOTAL", label: "Total", type: "number", step: "0.01" }
      ]
    },
    PAGOS_CLIENTES: {
      title: "Pagos de clientes",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "RAZÓN SOCIAL", label: "Razón social", type: "cliente", full: true },
        { id: "CUIT", label: "CUIT", type: "docNumber", docTypeValue: "CUIT", placeholder: "00-00000000-0" },
        { id: "DETALLE", label: "Detalle", type: "text", full: true },
        { id: "N° COMPROBANTE", label: "Nº comprobante", type: "text" },
        {
          id: "MEDIO DE PAGO",
          label: "Medio de pago",
          type: "select",
          options: ["Uala", "Mercado Pago", "Efectivo", "Santander"]
        },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "ID_FACTURA", label: "ID Factura", type: "text", hidden: true },
        { id: "FACTURA_NUMERO", label: "Factura número", type: "text" }
      ]
    },
    GASTOS: {
      title: "Registro de gastos",
      fields: [
        { id: "SECTION_GASTOS", label: "Detalle del gasto", type: "section", icon: "bi-receipt-cutoff" },
        { id: "FECHA", label: "Fecha", type: "date" },
        {
          id: "CATEGORIA",
          label: "Categoría",
          type: "select",
          options: ["Servicios", "Insumos", "Transporte", "Impuestos", "Administración", "Mantenimiento", "Otros"]
        },
        { id: "DETALLE", label: "Detalle", type: "text", full: true, placeholder: "Detalle del gasto" },
        { id: "PROVEEDOR", label: "Proveedor", type: "text" },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        {
          id: "MEDIO DE PAGO",
          label: "Medio de pago",
          type: "select",
          options: ["Uala", "Mercado Pago", "Efectivo", "Santander"]
        },
        { id: "COMPROBANTE", label: "Comprobante", type: "text" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ASISTENCIA_PLAN: {
      title: "Plan de asistencia semanal",
      fields: [
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "DIA SEMANA", label: "Día de la semana", type: "select", options: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] },
        { id: "HORA ENTRADA", label: "Hora de entrada", type: "time" },
        { id: "HORAS PLAN", label: "Horas planificadas", type: "number", step: "0.5" },
        { id: "VIGENTE DESDE", label: "Vigente desde", type: "date" },
        { id: "VIGENTE HASTA", label: "Vigente hasta", type: "date" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ASISTENCIA: {
      title: "Registro de asistencia",
      fields: [
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "ID_CLIENTE", label: "ID Cliente", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "CLIENTE", label: "Cliente", type: "cliente", full: true },
        { id: "ASISTENCIA", label: "Asistencia", type: "boolean", trueLabel: "Presente" },
        { id: "HORAS", label: "Horas trabajadas", type: "number", step: "0.5" },
        { id: "OBSERVACIONES", label: "Observaciones", type: "textarea", full: true }
      ]
    },
    ADELANTOS: {
      title: "Registro de adelantos",
      fields: [
        { id: "ID_EMPLEADO", label: "ID Empleado", type: "text", hidden: true },
        { id: "FECHA", label: "Fecha", type: "date" },
        { id: "EMPLEADO", label: "Empleado", type: "empleado", full: true },
        { id: "MONTO", label: "Monto", type: "number", step: "0.01" },
        { id: "OBSERVACION", label: "Observación", type: "textarea", full: true }
      ]
    }
  };

  global.CACHE_TTL_MS = CACHE_TTL_MS;
  global.FORM_DEFINITIONS = FORM_DEFINITIONS;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Wrappers para llamadas a google.script.run con control de concurrencia.
  const ApiService = (() => {
    const latestTokens = new Map();
    const dataCache = {
      reference: null,
      referenceTs: 0,
      search: new Map() // key: format|query -> {ts, results}
    };

    function call(functionName, ...args) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)[functionName](...args);
      });
    }

    function callLatest(key, functionName, ...args) {
      const token = Date.now() + "-" + Math.random().toString(16).slice(2);
      latestTokens.set(key, token);
      return call(functionName, ...args)
        .then((res) => {
          if (latestTokens.get(key) !== token) {
            return { ignored: true };
          }
          return res;
        })
        .catch((err) => {
          if (latestTokens.get(key) !== token) {
            return { ignored: true };
          }
          throw err;
        });
    }

    return {
      call,
      callLatest,
      dataCache
    };
  })();

  global.ApiService = ApiService;
})(typeof window !== "undefined" ? window : this);


/**
 * InvoiceService
 * Encapsula llamadas de facturacion.
 */
(function (global) {
  const InvoiceService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getInvoicingCoverage(period, filters) {
      return ApiService.call("getInvoicingCoverage", toStr(period), toObj(filters));
    }

    function createInvoiceFromAttendance(cliente, desde, hasta, options, idCliente) {
      return ApiService.call(
        "createInvoiceFromAttendance",
        cliente || "",
        toStr(desde),
        toStr(hasta),
        toObj(options),
        toStr(idCliente)
      );
    }

    function getInvoices(filters) {
      return ApiService.call("getInvoices", toObj(filters));
    }

    function getInvoiceById(id) {
      return ApiService.call("getInvoiceById", toStr(id));
    }

    function createInvoice(data) {
      return ApiService.call("createInvoice", toObj(data));
    }

    function updateInvoice(id, data) {
      return ApiService.call("updateInvoice", toStr(id), toObj(data));
    }

    function deleteInvoice(id) {
      return ApiService.call("deleteInvoice", toStr(id));
    }

    function generateInvoicePdf(id) {
      return ApiService.call("generateInvoicePdf", toStr(id));
    }

    function getHoursByClient(start, end, cliente, idCliente) {
      return ApiService.call("getHoursByClient", toStr(start), toStr(end), cliente || "", toStr(idCliente));
    }

    function getConfig() {
      return ApiService.call("getConfig");
    }

    function getReferenceData() {
      return ApiService.call("getReferenceData");
    }

    return {
      getInvoicingCoverage,
      createInvoiceFromAttendance,
      getInvoices,
      getInvoiceById,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      generateInvoicePdf,
      getHoursByClient,
      getConfig,
      getReferenceData
    };
  })();

  global.InvoiceService = InvoiceService;
})(typeof window !== "undefined" ? window : this);


/**
 * PaymentsService
 * Encapsula llamadas de pagos de clientes.
 */
(function (global) {
  const PaymentsService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getClientInvoicesForPayment(cliente, idCliente) {
      return ApiService.call("getClientInvoicesForPayment", toStr(cliente), toStr(idCliente));
    }

    function getUnappliedClientPayments(cliente, idCliente) {
      return ApiService.call("getUnappliedClientPayments", toStr(cliente), toStr(idCliente));
    }

    function applyClientPayment(paymentId, allocations) {
      return ApiService.call("applyClientPayment", toStr(paymentId), Array.isArray(allocations) ? allocations : []);
    }

    function recordClientPayment(payload) {
      return ApiService.call("recordClientPayment", toObj(payload));
    }

    return {
      getClientInvoicesForPayment,
      getUnappliedClientPayments,
      applyClientPayment,
      recordClientPayment
    };
  })();

  global.PaymentsService = PaymentsService;
})(typeof window !== "undefined" ? window : this);


/**
 * AttendanceService
 * Encapsula llamadas de asistencia y planificacion.
 */
(function (global) {
  const AttendanceService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function toArr(value) {
      return Array.isArray(value) ? value : [];
    }

    function searchRecords(tipoFormato, query) {
      return ApiService.call("searchRecords", toStr(tipoFormato), toStr(query));
    }

    function saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente) {
      return ApiService.call(
        "saveWeeklyPlanForClient",
        cliente || "",
        toArr(items),
        originalVigencia || null,
        toStr(idCliente)
      );
    }

    function getWeeklyClientOverview(payload) {
      return ApiService.call("getWeeklyClientOverview", toObj(payload));
    }

    function saveDailyAttendance(fecha, payload) {
      return ApiService.call("saveDailyAttendance", toStr(fecha), toObj(payload));
    }

    function listClientMedia(clienteId) {
      return ApiService.call("listClientMedia", toStr(clienteId));
    }

    function getClientMediaImage(fileId, size) {
      return ApiService.call("getClientMediaImage", toStr(fileId), size || 1600);
    }

    function getEmpleadosConId() {
      return ApiService.call("getEmpleadosConId");
    }

    function generateEmployeeSchedulePdf(payload) {
      return ApiService.call("generateEmployeeSchedulePdf", toObj(payload));
    }

    function updateAttendanceRecord(id, payload) {
      return ApiService.call("updateRecord", "ASISTENCIA", toStr(id), toObj(payload));
    }

    function deleteAttendanceRecord(id) {
      return ApiService.call("deleteRecord", "ASISTENCIA", toStr(id));
    }

    return {
      searchRecords,
      saveWeeklyPlanForClient,
      getWeeklyClientOverview,
      saveDailyAttendance,
      listClientMedia,
      getClientMediaImage,
      getEmpleadosConId,
      generateEmployeeSchedulePdf,
      updateAttendanceRecord,
      deleteAttendanceRecord
    };
  })();

  global.AttendanceService = AttendanceService;
})(typeof window !== "undefined" ? window : this);


/**
 * MapsService
 * Encapsula llamadas del modulo de mapa.
 */
(function (global) {
  const MapsService = (() => {
    function toStr(value) {
      return value == null ? "" : String(value);
    }

    function toObj(value) {
      return value && typeof value === "object" ? value : {};
    }

    function getWeeklyClientOverview(weekStartDate) {
      return ApiService.call("getWeeklyClientOverview", { weekStartDate: toStr(weekStartDate) });
    }

    function getClientById(id) {
      if (ApiService.callLatest) {
        return ApiService.callLatest("client-detail-" + toStr(id), "getRecordById", "CLIENTES", toStr(id));
      }
      return ApiService.call("getRecordById", "CLIENTES", toStr(id));
    }

    return {
      getWeeklyClientOverview,
      getClientById
    };
  })();

  global.MapsService = MapsService;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Manejo de datos de referencia (clientes/empleados) con cache.
  const ReferenceService = (() => {
    const state = {
      data: { clientes: [], empleados: [] },
      loaded: false
    };
    const listeners = new Set();
    let inFlight = null;
    let notifyOnResolve = false;

    function load(force) {
      const shouldNotify = !!force;
      const now = Date.now();
      if (
        !force &&
        ApiService.dataCache.reference &&
        now - ApiService.dataCache.referenceTs < CACHE_TTL_MS
      ) {
        state.data = ApiService.dataCache.reference;
        state.loaded = true;
        if (shouldNotify) notify(state.data);
        return Promise.resolve(state.data);
      }

      if (shouldNotify) notifyOnResolve = true;
      if (inFlight) return inFlight;

      inFlight = ApiService.call("getReferenceData")
        .then(function (data) {
          if (data && data.ignored) return;
          state.data = data || { clientes: [], empleados: [] };
          ApiService.dataCache.reference = state.data;
          ApiService.dataCache.referenceTs = Date.now();
          if (notifyOnResolve) notify(state.data);
          return state.data;
        })
        .catch(function (err) {
          console.error("Error obteniendo referencia:", err);
          state.data = { clientes: [], empleados: [] };
          if (notifyOnResolve) notify(state.data);
          return state.data;
        })
        .finally(function () {
          state.loaded = true;
          inFlight = null;
          notifyOnResolve = false;
        });

      return inFlight;
    }

    function get() {
      return state.data;
    }

    function isLoaded() {
      return state.loaded;
    }

    function ensureLoaded() {
      if (state.loaded) {
        return Promise.resolve(state.data);
      }
      return load();
    }

    function refresh() {
      return load(true);
    }

    function subscribe(listener) {
      if (typeof listener !== "function") return function () { };
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    }

    function notify(data) {
      listeners.forEach(function (cb) {
        try {
          cb(data);
        } catch (e) {
          console.warn("ReferenceService listener error:", e);
        }
      });
      if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
        document.dispatchEvent(new CustomEvent("reference-data:updated", { detail: data }));
      }
    }

    return {
      load,
      ensureLoaded,
      refresh,
      subscribe,
      get,
      isLoaded
    };
  })();

  global.ReferenceService = ReferenceService;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const ReferenceData = (() => {
    function ensureLoaded() {
      if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
        console.warn("ReferenceService.ensureLoaded no disponible");
        return Promise.reject(new Error("ReferenceService no disponible"));
      }
      return global.ReferenceService.ensureLoaded();
    }

    function get() {
      if (!global.ReferenceService || typeof global.ReferenceService.get !== "function") {
        return null;
      }
      return global.ReferenceService.get();
    }

    function subscribe(handler) {
      if (!global.ReferenceService || typeof global.ReferenceService.subscribe !== "function") {
        return null;
      }
      return global.ReferenceService.subscribe(handler);
    }

    function refresh() {
      if (!global.ReferenceService) return Promise.resolve(null);
      const refreshFn = typeof global.ReferenceService.refresh === "function"
        ? global.ReferenceService.refresh
        : global.ReferenceService.load;
      if (typeof refreshFn !== "function") return Promise.resolve(null);
      return refreshFn().then(() => get());
    }

    return {
      ensureLoaded,
      get,
      subscribe,
      refresh
    };
  })();

  global.ReferenceData = ReferenceData;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  // Metadata y helpers por formato (CLIENTES, EMPLEADOS, etc.)
  const DEFAULTS = {
    entity: "registro",
    label: function (record) {
      return "";
    },
    refreshReference: false
  };

  const META_BY_FORMAT = {
    CLIENTES: {
      entity: "cliente",
      label: function (record) {
        return record["NOMBRE"] || "";
      },
      refreshReference: true
    },
    EMPLEADOS: {
      entity: "empleado",
      label: function (record) {
        return record["EMPLEADO"] || "";
      },
      refreshReference: true
    },
    FACTURACION: {
      entity: "comprobante",
      label: function (record) {
        return (
          record["COMPROBANTE"] ||
          record["NÚMERO"] ||
          record["RAZÓN SOCIAL"] ||
          ""
        );
      }
    },
    PAGOS_CLIENTES: {
      entity: "pago de cliente",
      label: function (record) {
        return record["RAZÓN SOCIAL"] || "";
      }
    },
    GASTOS: {
      entity: "gasto",
      label: function (record) {
        return record["DETALLE"] || record["CATEGORIA"] || "";
      }
    },
    ASISTENCIA: {
      entity: "registro de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    },
    ASISTENCIA_PLAN: {
      entity: "plan de asistencia",
      label: function (record) {
        return record["EMPLEADO"] || record["CLIENTE"] || "";
      }
    }
  };

  function getMeta(format) {
    return META_BY_FORMAT[format] || DEFAULTS;
  }

  global.DomainMeta = {
    getMeta
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const Dom = global.DomHelpers;

  function clearAlerts() {
    const c = document.getElementById("alert-container");
    if (c) Dom.clear(c);
  }

  function showAlert(message, type = "info") {
    const container = document.getElementById("alert-container");
    if (!container) return;
    Dom.clear(container);

    const div = Dom.el("div", {
      className:
        "alert alert-" +
        type +
        " alert-dismissible fade show py-2 px-3 mb-2",
      role: "alert"
    }, [
      Dom.el("div", { className: "small", text: message }),
      Dom.el("button", {
        type: "button",
        className: "btn-close btn-sm",
        "data-bs-dismiss": "alert",
        "aria-label": "Close"
      })
    ]);

    container.appendChild(div);
  }

  function formatError(err, fallback) {
    if (!err) return fallback || "Ocurrió un error.";
    if (typeof err === "string") return err;
    if (err && typeof err.message === "string" && err.message.trim()) {
      return err.message.trim();
    }
    return fallback || "Ocurrió un error.";
  }

  function showError(title, err, fallback) {
    const message = formatError(err, fallback);
    const prefix = title ? String(title).trim() : "";
    const full = prefix ? `${prefix}: ${message}` : message;
    console.error(prefix || "Error", err);
    showAlert(full, "danger");
    return message;
  }

  function notifyError(title, err, options) {
    const opts = options || {};
    const prefix = title ? String(title).trim() : "Ocurrió un error";
    const message = formatError(err, opts.fallback);

    if (opts.silent) {
      console.error(prefix, err);
    } else {
      showError(prefix, err, opts.fallback);
    }

    if (opts.container && global.EmptyState && typeof global.EmptyState.render === "function") {
      global.EmptyState.render(opts.container, {
        variant: "error",
        title: prefix,
        message: message
      });
    }
    if (opts.inline && opts.container && global.EmptyState && typeof global.EmptyState.renderInline === "function") {
      global.EmptyState.renderInline(opts.container, message, "error");
    }
    return message;
  }

  global.Alerts = {
    clearAlerts,
    showAlert,
    formatError,
    showError,
    notifyError
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const Dom = global.DomHelpers;

  function renderMultilineText(container, text) {
    const value = String(text || "");
    const lines = value.split(/\n/);
    lines.forEach((line, idx) => {
      container.appendChild(Dom.el("span", { text: line }));
      if (idx < lines.length - 1) {
        container.appendChild(document.createElement("br"));
      }
    });
  }

  function confirmDialog(options = {}) {
    const title = options.title || "Confirmar";
    const message = options.message || "¿Estás seguro?";
    const confirmText = options.confirmText || "Confirmar";
    const cancelText = options.cancelText || "Cancelar";
    const icon = options.icon || "bi-exclamation-triangle-fill";
    const iconClass = options.iconClass || "text-warning";
    const confirmVariant = options.confirmVariant || "danger";
    const modalSizeClass = options.size === "sm" ? "modal-sm" : options.size === "lg" ? "modal-lg" : "";

    if (!global.document || !global.document.body) {
      return Promise.resolve(global.confirm(`${title}\n\n${message}`));
    }

    if (!global.bootstrap || !global.bootstrap.Modal) {
      return Promise.resolve(global.confirm(`${title}\n\n${message}`));
    }

    const modalId = "lt-erp-confirm-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    const titleId = modalId + "-title";
    const bodyId = modalId + "-body";

    const headerTitle = Dom.el("h5", {
      className: "modal-title d-flex align-items-center gap-2",
      id: titleId
    }, [
      Dom.el("i", { className: "bi " + String(icon) + " " + String(iconClass) }),
      Dom.el("span", { text: title })
    ]);

    const bodyText = Dom.el("div", { className: "text-body-secondary", id: bodyId });
    renderMultilineText(bodyText, message);

    const modalEl = Dom.el("div", {
      className: "modal fade",
      id: modalId,
      tabindex: "-1",
      "aria-labelledby": titleId,
      "aria-describedby": bodyId
    }, [
      Dom.el("div", { className: "modal-dialog modal-dialog-centered " + modalSizeClass }, [
        Dom.el("div", { className: "modal-content border-0 shadow" }, [
          Dom.el("div", { className: "modal-header" }, [
            headerTitle,
            Dom.el("button", {
              type: "button",
              className: "btn-close",
              "data-bs-dismiss": "modal",
              "aria-label": "Cerrar"
            })
          ]),
          Dom.el("div", { className: "modal-body" }, bodyText),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", {
              type: "button",
              className: "btn btn-outline-secondary",
              "data-bs-dismiss": "modal"
            }, cancelText),
            Dom.el("button", {
              type: "button",
              className: "btn btn-" + String(confirmVariant),
              "data-lt-confirm": "1"
            }, confirmText)
          ])
        ])
      ])
    ]);
    document.body.appendChild(modalEl);
    modalEl.style.zIndex = "2600";

    return new Promise((resolve) => {
      let result = false;
      const modal = new global.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true, focus: true });
      const confirmBtn = modalEl.querySelector('[data-lt-confirm="1"]');

      function cleanup() {
        modalEl.removeEventListener("hidden.bs.modal", onHidden);
        modalEl.removeEventListener("shown.bs.modal", onShown);
        if (confirmBtn) confirmBtn.removeEventListener("click", onConfirm);
        modal.dispose();
        modalEl.remove();
      }

      function onConfirm() {
        result = true;
        modal.hide();
      }

      function onHidden() {
        cleanup();
        resolve(result);
      }

      function onShown() {
        const backdrops = document.querySelectorAll(".modal-backdrop");
        const lastBackdrop = backdrops && backdrops.length ? backdrops[backdrops.length - 1] : null;
        if (lastBackdrop) lastBackdrop.style.zIndex = "2590";
      }

      // Single-use modal: listeners adjuntos una sola vez y limpiados en hidden.
      if (confirmBtn) confirmBtn.addEventListener("click", onConfirm, { once: true });
      modalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });
      modalEl.addEventListener("shown.bs.modal", onShown, { once: true });

      modal.show();
    });
  }

  function promptDialog(options = {}) {
    const title = options.title || "Ingresar dato";
    const message = options.message || "Por favor, ingresá el valor:";
    const confirmText = options.confirmText || "Aceptar";
    const cancelText = options.cancelText || "Cancelar";
    const placeholder = options.placeholder || "";
    const defaultValue = options.defaultValue || "";
    const inputType = options.inputType || "text";
    const onAction = typeof options.onAction === "function" ? options.onAction : null;

    if (!global.document || !global.document.body || !global.bootstrap || !global.bootstrap.Modal) {
      const val = global.prompt(`${title}\n\n${message}`, defaultValue);
      return Promise.resolve(val);
    }

    const modalId = "lt-erp-prompt-" + Date.now();
    const inputId = modalId + "-input";

    const modalEl = Dom.el("div", { className: "modal fade", id: modalId, tabindex: "-1", "data-bs-backdrop": "static" }, [
      Dom.el("div", { className: "modal-dialog modal-dialog-centered modal-sm" }, [
        Dom.el("div", { className: "modal-content border-0 shadow" }, [
          Dom.el("div", { className: "modal-header py-2" }, [
            Dom.el("h6", { className: "modal-title fw-bold", text: title }),
            Dom.el("button", { type: "button", className: "btn-close", "data-bs-dismiss": "modal", id: modalId + "-close" })
          ]),
          Dom.el("div", { className: "modal-body", id: modalId + "-body" }, [
            Dom.el("label", { className: "form-label small text-muted fw-bold", text: message }),
            Dom.el("input", {
              type: inputType,
              id: inputId,
              className: "form-control",
              placeholder: placeholder,
              value: defaultValue
            })
          ]),
          Dom.el("div", { className: "modal-footer py-2", id: modalId + "-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-sm btn-link text-muted mx-auto", "data-bs-dismiss": "modal" }, cancelText),
            Dom.el("button", { type: "button", className: "btn btn-sm btn-primary px-4", "data-lt-confirm": "1" }, confirmText)
          ])
        ])
      ])
    ]);

    document.body.appendChild(modalEl);

    return new Promise((resolve) => {
      let resolvedValue = null;
      const modal = new global.bootstrap.Modal(modalEl);
      const input = modalEl.querySelector("input");
      const confirmBtn = modalEl.querySelector('[data-lt-confirm="1"]');
      const body = document.getElementById(modalId + "-body");
      const footer = document.getElementById(modalId + "-footer");
      const closeBtn = document.getElementById(modalId + "-close");

      modalEl.addEventListener("shown.bs.modal", () => {
        if (input) {
          input.focus();
          if (defaultValue) input.select();
        }
      });

      const onConfirm = async () => {
        const val = input ? input.value : "";
        if (onAction) {
          // Modo asíncrono: mostrar spiner y ejecutar
          try {
            if (input) input.disabled = true;
            if (confirmBtn) {
              confirmBtn.disabled = true;
              const ui = global.UIHelpers;
              if (ui && typeof ui.withSpinner === "function") {
                ui.withSpinner(confirmBtn, true, "...");
              } else {
                confirmBtn.textContent = "⌛";
              }
            }

            // Ejecutar la acción asíncrona
            const result = await onAction(val);

            // Si la acción devuelve un objeto con 'success' y 'render', mostramos eso
            if (result && result.success && typeof result.render === "function") {
              if (body) {
                Dom.clear(body);
                result.render(body);
              }
              if (footer) {
                footer.innerHTML = "";
                const doneBtn = Dom.el("button", {
                  className: "btn btn-sm btn-outline-secondary mx-auto",
                  text: "Cerrar",
                  onClick: () => modal.hide()
                });
                footer.appendChild(doneBtn);
              }
            } else {
              // Comportamiento por defecto tras éxito: cerrar
              resolvedValue = val;
              modal.hide();
            }
          } catch (err) {
            console.error("Error en prompt action:", err);
            if (input) input.disabled = false;
            if (confirmBtn) {
              const ui = global.UIHelpers;
              if (ui && typeof ui.withSpinner === "function") {
                ui.withSpinner(confirmBtn, false);
              }
              confirmBtn.textContent = confirmText;
              confirmBtn.disabled = false;
            }
            if (global.Alerts) global.Alerts.showAlert(err.message || "Error al procesar", "danger");
          }
        } else {
          // Modo síncrono: resolver y cerrar
          resolvedValue = val;
          modal.hide();
        }
      };

      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !input.disabled) onConfirm();
        });
      }

      confirmBtn.addEventListener("click", onConfirm);

      modalEl.addEventListener("hidden.bs.modal", () => {
        modal.dispose();
        modalEl.remove();
        resolve(resolvedValue);
      });

      modal.show();
    });
  }

  global.UiDialogs = {
    confirm: confirmDialog,
    prompt: promptDialog
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ModalHelpers
 * Helper para crear modales Bootstrap de forma segura.
 */
(function (global) {
  const Dom = global.DomHelpers;

  function normalizeClass(value) {
    const clean = String(value || "").trim();
    return clean ? " " + clean : "";
  }

  function buildTitleNode(title) {
    if (title == null) {
      return Dom.el("h5", { className: "modal-title", text: "" });
    }
    if (typeof title === "string" || typeof title === "number") {
      return Dom.el("h5", { className: "modal-title", text: String(title) });
    }
    return Dom.el("h5", { className: "modal-title" }, title);
  }

  function create(id, title, body, footer, options = {}) {
    if (!global.document || !global.document.body || !global.bootstrap || !global.bootstrap.Modal) {
      return null;
    }

    const existing = global.document.getElementById(id);
    if (existing) existing.remove();

    const dialogClasses = [
      "modal-dialog",
      options.centered ? "modal-dialog-centered" : "",
      options.scrollable ? "modal-dialog-scrollable" : "",
      options.size ? `modal-${options.size}` : ""
    ].filter(Boolean).join(" ");

    const modalEl = Dom.el("div", {
      className: "modal fade",
      id: id,
      tabindex: "-1",
      "aria-hidden": "true"
    }, [
      Dom.el("div", { className: dialogClasses }, [
        Dom.el("div", { className: "modal-content" + normalizeClass(options.contentClass) }, [
          Dom.el("div", { className: "modal-header" + normalizeClass(options.headerClass) }, [
            buildTitleNode(title),
            options.hideClose
              ? null
              : Dom.el("button", {
                type: "button",
                className: "btn-close" + normalizeClass(options.closeClass),
                "data-bs-dismiss": "modal",
                "aria-label": "Cerrar"
              })
          ]),
          Dom.el("div", { className: "modal-body" + normalizeClass(options.bodyClass) }, body),
          footer
            ? Dom.el("div", { className: "modal-footer" + normalizeClass(options.footerClass) }, footer)
            : null
        ])
      ])
    ]);

    global.document.body.appendChild(modalEl);
    modalEl.addEventListener("hidden.bs.modal", () => {
      const instance = global.bootstrap && global.bootstrap.Modal
        ? global.bootstrap.Modal.getInstance(modalEl)
        : null;
      if (instance && typeof instance.dispose === "function") {
        instance.dispose();
      }
      if (typeof options.onHidden === "function") {
        options.onHidden();
      }
      modalEl.remove();
    });

    return modalEl;
  }

  global.ModalHelpers = {
    create
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const Dom = global.DomHelpers;

  function toggleControls(disabled) {
    // Don't disable search-query so users can keep typing during search
    ["btn-nuevo", "btn-refresh"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !!disabled;
    });
  }

  const UiState = {
    renderLoading: function (componentId, title, message) {
      const c = document.getElementById(componentId);
      if (!c) return;
      Dom.clear(c);
      c.appendChild(
        Dom.el("div", { className: "lt-surface lt-surface--subtle p-3" }, [
          Dom.el("div", { className: "d-flex align-items-center gap-2" }, [
            Dom.el("div", {
              className: "spinner-border spinner-border-sm text-primary",
              role: "status"
            }),
            Dom.el("div", { className: "flex-grow-1" }, [
              Dom.el("div", { className: "small fw-bold mb-0", text: title || "" }),
              Dom.el("div", { className: "small text-muted", text: message || "" })
            ])
          ])
        ])
      );
    },
    setGlobalLoading: function (isLoading, message) {
      const badge = document.getElementById("global-loading");
      const btn = document.getElementById("btn-grabar");
      toggleControls(isLoading);
      if (btn) btn.disabled = !!isLoading;
      if (!badge) return;
      if (isLoading) {
        badge.classList.remove("d-none");
        Dom.clear(badge);
        badge.appendChild(
          Dom.el("span", { className: "lt-chip lt-chip--muted" }, [
            Dom.el("span", {
              className: "spinner-border spinner-border-sm",
              role: "status",
              style: "width:12px;height:12px;"
            }),
            Dom.el("span", { text: message || "Procesando..." })
          ])
        );
      } else {
        badge.classList.add("d-none");
        Dom.clear(badge);
      }
    }
  };

  global.UiState = UiState;
})(typeof window !== "undefined" ? window : this);


/**
 * EmptyState
 * Helper común para estados de loading / empty / error.
 */
(function (global) {
  const Dom = global.DomHelpers || null;
  const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === "function")
    ? global.HtmlHelpers.escapeHtml
    : function (val) {
      return String(val == null ? "" : val)
        .replace(/&/g, "&amp;")
        .replace(/[<]/g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

  function clearContainer(container) {
    if (!container) return;
    if (Dom && typeof Dom.clear === "function") {
      Dom.clear(container);
      return;
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function renderInline(container, message, variant) {
    if (!container) return;
    const text = message || "Sin datos para mostrar.";
    clearContainer(container);
    const className = variant === "error" ? "text-danger small" : "text-muted small";
    if (Dom) {
      container.appendChild(Dom.el("div", { className: className, text: text }));
    } else {
      const div = document.createElement("div");
      div.className = className;
      div.textContent = text;
      container.appendChild(div);
    }
  }

  function render(container, opts) {
    if (!container) return;
    const config = opts || {};
    const variant = config.variant || "empty";
    const title = config.title || (variant === "error" ? "Ocurrió un error" : "Sin datos");
    const message = config.message || "";

    clearContainer(container);
    if (variant === "error") {
      if (Dom) {
        const alert = Dom.el("div", { className: "alert alert-danger" }, [
          Dom.text(title),
          message ? Dom.text(": " + message) : null
        ]);
        container.appendChild(alert);
      } else {
        const alert = document.createElement("div");
        alert.className = "alert alert-danger";
        alert.textContent = title + (message ? ": " + message : "");
        container.appendChild(alert);
      }
      return;
    }
    if (variant === "loading") {
      if (Dom) {
        container.appendChild(
          Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 text-center" }, [
            Dom.el("div", { className: "spinner-border spinner-border-sm text-primary", role: "status" }),
            Dom.el("div", { className: "text-muted small mt-2", text: message || "Cargando..." })
          ])
        );
      } else {
        const wrap = document.createElement("div");
        wrap.className = "lt-surface lt-surface--subtle p-3 text-center";
        const spinner = document.createElement("div");
        spinner.className = "spinner-border spinner-border-sm text-primary";
        spinner.setAttribute("role", "status");
        const msg = document.createElement("div");
        msg.className = "text-muted small mt-2";
        msg.textContent = message || "Cargando...";
        wrap.appendChild(spinner);
        wrap.appendChild(msg);
        container.appendChild(wrap);
      }
      return;
    }

    if (Dom) {
      const body = Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 text-center" });
      body.appendChild(Dom.el("div", { className: "text-muted small fw-semibold", text: title }));
      if (message) {
        body.appendChild(Dom.el("div", { className: "text-muted small mt-1", text: message }));
      }
      container.appendChild(body);
    } else {
      const body = document.createElement("div");
      body.className = "lt-surface lt-surface--subtle p-3 text-center";
      const titleEl = document.createElement("div");
      titleEl.className = "text-muted small fw-semibold";
      titleEl.textContent = title;
      body.appendChild(titleEl);
      if (message) {
        const msgEl = document.createElement("div");
        msgEl.className = "text-muted small mt-1";
        msgEl.textContent = message;
        body.appendChild(msgEl);
      }
      container.appendChild(body);
    }
  }

  global.EmptyState = {
    render,
    renderInline
  };
})(typeof window !== "undefined" ? window : this);


/**
 * UIHelpers
 * Helpers reutilizables para elementos UI.
 */
(function (global) {
  const Dom = global.DomHelpers;

  function badge(text, options) {
    const opts = options || {};
    const variant = opts.variant || "light";
    const pill = Boolean(opts.pill);
    const baseClass =
      opts.className ||
      `badge bg-${variant} ${variant === "light" ? "text-dark border" : ""}`.trim();
    const className = pill ? `${baseClass} rounded-pill` : baseClass;
    return Dom.el("span", { className, text: text == null ? "" : String(text) });
  }

  function chip(content, options) {
    const opts = options || {};
    const variant = opts.variant || "";
    const className = opts.className || `lt-chip${variant ? " lt-chip--" + variant : ""}`;
    return Dom.el("span", { className }, content);
  }

  function card(options) {
    const opts = options || {};
    const className = opts.className || "card shadow-sm border-0";
    const headerClass = opts.headerClassName || "card-header bg-white py-2";
    const bodyClass = opts.bodyClassName || "card-body p-3";
    const footerClass = opts.footerClassName || "card-footer bg-white";

    const node = Dom.el("div", { className });
    if (opts.header || opts.title) {
      const header = Dom.el("div", { className: headerClass });
      if (opts.title) {
        header.appendChild(Dom.el("div", { className: "fw-semibold", text: opts.title }));
      }
      if (opts.header) {
        Dom.append(header, opts.header);
      }
      node.appendChild(header);
    }
    if (opts.body || opts.body === "") {
      const body = Dom.el("div", { className: bodyClass });
      Dom.append(body, opts.body);
      node.appendChild(body);
    }
    if (opts.footer) {
      const footer = Dom.el("div", { className: footerClass });
      Dom.append(footer, opts.footer);
      node.appendChild(footer);
    }
    return node;
  }

  function tableRow(cells, options) {
    const opts = options || {};
    const tr = Dom.el("tr", { className: opts.className || "" });
    (cells || []).forEach((cell) => {
      if (cell == null) return;
      if (cell.nodeType) {
        tr.appendChild(cell);
        return;
      }
      if (typeof cell === "string" || typeof cell === "number") {
        tr.appendChild(Dom.el("td", { text: String(cell) }));
        return;
      }
      const td = Dom.el("td", { className: cell.className || "" });
      if (cell.colSpan) {
        td.setAttribute("colspan", String(cell.colSpan));
      }
      Dom.append(td, cell.content != null ? cell.content : cell.text);
      tr.appendChild(td);
    });
    return tr;
  }

  function pagination(options) {
    const opts = options || {};
    const page = Math.max(1, Number(opts.page || 1));
    const total = Math.max(1, Number(opts.totalPages || 1));
    const onChange = typeof opts.onPageChange === "function" ? opts.onPageChange : null;
    const className =
      opts.className || "d-flex justify-content-between align-items-center gap-2";

    const prevBtn = Dom.el("button", {
      className: "btn btn-outline-secondary btn-sm",
      text: "Anterior"
    });
    const nextBtn = Dom.el("button", {
      className: "btn btn-outline-secondary btn-sm",
      text: "Siguiente"
    });

    if (page <= 1) prevBtn.disabled = true;
    if (page >= total) nextBtn.disabled = true;

    if (onChange) {
      prevBtn.addEventListener("click", () => onChange(page - 1));
      nextBtn.addEventListener("click", () => onChange(page + 1));
    }

    const info = Dom.el("div", {
      className: "text-muted small",
      text: `Página ${page} de ${total}`
    });

    return Dom.el("div", { className }, [prevBtn, info, nextBtn]);
  }

  function renderPagination(container, options) {
    if (!container || !Dom) return;
    Dom.clear(container);
    container.appendChild(pagination(options));
  }

  function renderDatalist(listEl, labels) {
    if (!listEl || !Dom) return;
    Dom.clear(listEl);
    (labels || []).forEach((label) => {
      if (label == null || label === "") return;
      listEl.appendChild(Dom.el("option", { value: String(label) }));
    });
  }

  function renderSelect(selectEl, options, selected, config) {
    if (!selectEl || !Dom) return;
    const opts = Array.isArray(options) ? options : [];
    const sel = selected != null ? String(selected) : "";
    const settings = config || {};

    Dom.clear(selectEl);
    if (settings.includeEmpty) {
      const emptyLabel = settings.emptyLabel || "Seleccionar...";
      selectEl.appendChild(Dom.el("option", { value: "", text: emptyLabel }));
    }

    const normalized = opts.map((opt) => {
      if (opt && typeof opt === "object") return opt;
      return { value: String(opt || ""), label: String(opt || "") };
    });

    const hasSelected = sel && normalized.some((opt) => String(opt.value) === sel);
    if (sel && !hasSelected && settings.ensureSelected !== false) {
      normalized.unshift({ value: sel, label: sel });
    }

    normalized.forEach((opt) => {
      if (!opt) return;
      const value = opt.value != null ? String(opt.value) : "";
      const label = opt.label != null ? String(opt.label) : value;
      const node = Dom.el("option", { value: value, text: label });
      if (opt.dataset) {
        Object.keys(opt.dataset).forEach((key) => {
          if (opt.dataset[key] != null) {
            node.dataset[key] = String(opt.dataset[key]);
          }
        });
      }
      if (opt.disabled) node.disabled = true;
      if (sel && value === sel) node.selected = true;
      selectEl.appendChild(node);
    });
  }

  function renderChunks(container, items, renderItem, options) {
    if (!container || !Dom || !Array.isArray(items) || typeof renderItem !== "function") {
      return Promise.resolve();
    }
    const opts = options || {};
    const chunkSize = Math.max(1, Number(opts.chunkSize || 150));
    const useTimeout = opts.useTimeout === true;
    let index = 0;

    Dom.clear(container);

    return new Promise((resolve) => {
      const step = () => {
        const fragment = document.createDocumentFragment();
        const end = Math.min(index + chunkSize, items.length);
        for (; index < end; index += 1) {
          const node = renderItem(items[index], index);
          if (node) fragment.appendChild(node);
        }
        container.appendChild(fragment);
        if (typeof opts.onProgress === "function") {
          opts.onProgress(index, items.length);
        }
        if (index < items.length) {
          if (useTimeout) {
            setTimeout(step, 0);
          } else if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(step);
          } else {
            setTimeout(step, 16);
          }
          return;
        }
        if (typeof opts.onDone === "function") {
          opts.onDone();
        }
        resolve();
      };
      step();
    });
  }

  function withSpinner(button, isLoading, label) {
    if (!button || !Dom) return;
    const text = label || "Procesando...";
    if (isLoading) {
      if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML || "";
      }
      Dom.clear(button);
      button.appendChild(
        Dom.el("span", {
          className: "spinner-border spinner-border-sm me-2",
          role: "status",
          "aria-hidden": "true"
        })
      );
      button.appendChild(Dom.text(text));
      button.disabled = true;
      return;
    }

    const original = button.dataset.originalContent;
    Dom.clear(button);
    if (original) {
      button.innerHTML = original;
    }
    button.disabled = false;
  }

  const UIHelpers = {
    badge,
    chip,
    card,
    tableRow,
    pagination,
    renderPagination,
    renderDatalist,
    renderSelect,
    renderChunks,
    withSpinner
  };

  global.UIHelpers = UIHelpers;
})(typeof window !== "undefined" ? window : this);


(function (global) {
    function loadOptions() {
        if (!global.ApiService || !global.ApiService.call) {
            return Promise.resolve({});
        }
        return global.ApiService.call("getDropdownOptions");
    }

    function saveOptions(payload) {
        if (!global.ApiService || !global.ApiService.call) {
            return Promise.reject(new Error("ApiService no disponible"));
        }
        return global.ApiService.call("saveDropdownOptions", payload);
    }

    global.DropdownConfigData = {
        loadOptions: loadOptions,
        saveOptions: saveOptions
    };
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const DEFAULT_INVOICE_STATUS = ["Pendiente", "Pagada", "Anulada", "Vencida"];
    const DEFAULT_INVOICE_COMPROBANTE = [
        "Factura A",
        "Factura B",
        "Factura C",
        "Nota de Crédito",
        "Nota de Débito",
        "Recibo"
    ];
    const DEFAULT_PAYMENT_METHODS = ["Uala", "Mercado Pago", "Efectivo", "Santander"];
    const EXCLUDED_KEYS = new Set(["DIA SEMANA", "TIPO DOCUMENTO"]);

    function normalizeKey_(value) {
        return String(value || "").trim().toUpperCase();
    }

    function isExcludedKey_(key) {
        return EXCLUDED_KEYS.has(normalizeKey_(key));
    }

    function normalizeOptionValue_(value) {
        return String(value || "").trim().replace(/\s+/g, " ");
    }

    function uniqueOptions_(options) {
        const out = [];
        const seen = new Set();
        (options || []).forEach((opt) => {
            const clean = normalizeOptionValue_(opt);
            if (!clean) return;
            const key = clean.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(clean);
        });
        return out;
    }

    function cloneOptionsMap_(map) {
        const out = {};
        if (!map || typeof map !== "object") return out;
        Object.keys(map).forEach((key) => {
            out[key] = Array.isArray(map[key]) ? map[key].slice() : [];
        });
        return out;
    }

    const Dom = global.DomHelpers;

    function buildDefaultOptions_() {
        const map = {};
        const defs = global.FORM_DEFINITIONS || {};

        Object.keys(defs).forEach((formatId) => {
            const form = defs[formatId];
            if (!form || !Array.isArray(form.fields)) return;
            form.fields.forEach((field) => {
                if (!field || !field.id) return;
                if (field.type === "select") {
                    if (isExcludedKey_(field.id)) return;
                    if (!map[field.id] && Array.isArray(field.options)) {
                        map[field.id] = field.options.slice();
                    }
                }
            });
        });

        map["INVOICE_ESTADO"] = DEFAULT_INVOICE_STATUS.slice();
        map["INVOICE_COMPROBANTE"] = DEFAULT_INVOICE_COMPROBANTE.slice();
        map["MEDIO DE PAGO"] = DEFAULT_PAYMENT_METHODS.slice();
        return map;
    }

    function mergeOptions_(defaults, custom) {
        const out = {};
        Object.keys(defaults || {}).forEach((key) => {
            const incoming = custom && custom[key];
            const list = Array.isArray(incoming) && incoming.length ? incoming : defaults[key];
            out[key] = uniqueOptions_(list);
        });
        Object.keys(custom || {}).forEach((key) => {
            if (isExcludedKey_(key)) return;
            if (out[key]) return;
            const list = uniqueOptions_(custom[key]);
            if (list.length) out[key] = list;
        });
        return out;
    }

    function buildEntryMeta_() {
        const meta = {};
        const defs = global.FORM_DEFINITIONS || {};
        Object.keys(defs).forEach((formatId) => {
            const form = defs[formatId];
            if (!form || !Array.isArray(form.fields)) return;
            const formLabel = form.title || formatId;
            form.fields.forEach((field) => {
                if (!field || !field.id) return;
                if (field.type !== "select") return;
                if (isExcludedKey_(field.id)) return;
                if (!meta[field.id]) {
                    meta[field.id] = { label: field.label || field.id, sources: [] };
                }
                if (meta[field.id].sources.indexOf(formLabel) === -1) {
                    meta[field.id].sources.push(formLabel);
                }
            });
        });

        meta["INVOICE_ESTADO"] = {
            label: "Facturación · Estado",
            sources: ["Facturación"]
        };
        meta["INVOICE_COMPROBANTE"] = {
            label: "Facturación · Comprobante",
            sources: ["Facturación"]
        };
        meta["MEDIO DE PAGO"] = {
            label: "Pagos · Medio de pago",
            sources: ["Pagos"]
        };

        return meta;
    }

    const DropdownConfig = (() => {
        const defaultOptions = buildDefaultOptions_();
        let optionsMap = mergeOptions_(defaultOptions, {});
        let loaded = false;

        function applyToFormDefinitions_() {
            const defs = global.FORM_DEFINITIONS || {};
            Object.keys(defs).forEach((formatId) => {
                const form = defs[formatId];
                if (!form || !Array.isArray(form.fields)) return;
                form.fields.forEach((field) => {
                    if (!field || !field.id) return;
                    if (field.type !== "select") return;
                    if (isExcludedKey_(field.id)) return;
                    const list = optionsMap[field.id];
                    if (Array.isArray(list) && list.length) {
                        field.options = list.slice();
                    }
                });
            });
        }

        function load() {
            const data = global.DropdownConfigData;
            if (!data || typeof data.loadOptions !== "function") {
                optionsMap = mergeOptions_(defaultOptions, {});
                loaded = true;
                applyToFormDefinitions_();
                return Promise.resolve(optionsMap);
            }
            return data.loadOptions()
                .then((res) => {
                    optionsMap = mergeOptions_(defaultOptions, res || {});
                    loaded = true;
                    applyToFormDefinitions_();
                    return optionsMap;
                })
                .catch((err) => {
                    console.error("Error cargando desplegables:", err);
                    optionsMap = mergeOptions_(defaultOptions, {});
                    loaded = true;
                    applyToFormDefinitions_();
                    return optionsMap;
                });
        }

        function save(map) {
            const data = global.DropdownConfigData;
            if (!data || typeof data.saveOptions !== "function") {
                return Promise.reject(new Error("ApiService no disponible"));
            }
            const payload = mergeOptions_(defaultOptions, map || {});
            return data.saveOptions(payload)
                .then((res) => {
                    optionsMap = mergeOptions_(defaultOptions, res || payload);
                    loaded = true;
                    applyToFormDefinitions_();
                    return optionsMap;
                });
        }

        function getOptions(key, fallback) {
            const list = optionsMap[key];
            if (Array.isArray(list) && list.length) return list.slice();
            if (Array.isArray(fallback)) return fallback.slice();
            const def = defaultOptions[key];
            return Array.isArray(def) ? def.slice() : [];
        }

        function getAll() {
            return cloneOptionsMap_(optionsMap);
        }

        function getDefaults() {
            return cloneOptionsMap_(defaultOptions);
        }

        function getEntries() {
            const meta = buildEntryMeta_();
            const keys = Array.from(new Set(
                Object.keys(defaultOptions).concat(Object.keys(optionsMap))
            )).filter((key) => !isExcludedKey_(key));
            return keys.map((key) => {
                const entry = meta[key] || { label: key, sources: [] };
                return {
                    key: key,
                    label: entry.label || key,
                    sources: entry.sources || [],
                    options: optionsMap[key] || defaultOptions[key] || []
                };
            }).sort((a, b) => a.label.localeCompare(b.label, "es"));
        }

        function isLoaded() {
            return loaded;
        }

        return {
            load,
            save,
            getOptions,
            getAll,
            getDefaults,
            getEntries,
            isLoaded
        };
    })();

    const DropdownConfigPanel = (() => {
        const containerId = "dropdown-config-panel";
        let state = { options: {}, entries: [] };

        function render() {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-1 text-primary">
                            <i class="bi bi-list-check me-2"></i>Desplegables
                        </h5>
                        <small class="text-muted">Gestiona las opciones disponibles en los selectores del sistema.</small>
                    </div>
                    <div class="card-body">
                        <div id="dropdown-config-loading" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status"></div>
                            <div class="small text-muted mt-2">Cargando opciones...</div>
                        </div>
                        <div id="dropdown-config-content" class="d-none">
                            <div class="alert alert-info small mb-3">
                                Agrega o elimina opciones. Al menos una opcion debe quedar en cada desplegable.
                            </div>
                            <div id="dropdown-config-list" class="d-flex flex-column gap-3"></div>
                            <div class="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" class="btn btn-outline-secondary" id="dropdown-config-reset">
                                    Restaurar defaults
                                </button>
                                <button type="button" class="btn btn-primary" id="dropdown-config-save">
                                    Guardar cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            DropdownConfig.load().then(() => {
                state.options = DropdownConfig.getAll();
                state.entries = DropdownConfig.getEntries();
                renderEntries_();
            });
        }

        function renderEntries_() {
            const list = document.getElementById("dropdown-config-list");
            const loading = document.getElementById("dropdown-config-loading");
            const content = document.getElementById("dropdown-config-content");
            if (!list || !loading || !content) return;

            Dom.clear(list);
            const fragment = document.createDocumentFragment();
            state.entries.forEach((entry) => {
                fragment.appendChild(renderEntryCard_(entry));
            });
            list.appendChild(fragment);

            loading.classList.add("d-none");
            content.classList.remove("d-none");

            bindListEvents_();
            bindActionButtons_();
        }

        function renderEntryCard_(entry) {
            const options = Array.isArray(state.options[entry.key])
                ? state.options[entry.key]
                : entry.options || [];
            const sources = entry.sources && entry.sources.length
                ? entry.sources.join(", ")
                : "General";

            const card = Dom.el("div", { class: "lt-surface lt-surface--subtle p-3 rounded-3" });
            const headerRow = Dom.el("div", { class: "d-flex flex-wrap justify-content-between align-items-center gap-3" });
            const titleBlock = Dom.el("div");
            Dom.append(titleBlock, [
                Dom.el("div", { class: "fw-semibold", text: entry.label || entry.key }),
                Dom.el("div", { class: "small text-muted", text: sources })
            ]);

            const inputGroup = Dom.el("div", { class: "input-group input-group-sm dropdown-config-input" });
            const input = Dom.el("input", {
                type: "text",
                class: "form-control",
                placeholder: "Agregar opcion",
                dataset: { role: "option-input", key: entry.key }
            });
            const addBtn = Dom.el("button", {
                type: "button",
                class: "btn btn-outline-primary",
                dataset: { action: "add-option", key: entry.key },
                text: "Agregar"
            });
            Dom.append(inputGroup, [input, addBtn]);
            Dom.append(headerRow, [titleBlock, inputGroup]);

            const chipsRow = Dom.el("div", { class: "d-flex flex-wrap gap-2 mt-3" });
            if (options.length) {
                const chipFragment = document.createDocumentFragment();
                options.forEach((opt) => {
                    chipFragment.appendChild(renderChip_(opt, entry.key));
                });
                chipsRow.appendChild(chipFragment);
            } else {
                chipsRow.appendChild(Dom.el("span", { class: "text-muted small", text: "Sin opciones" }));
            }

            Dom.append(card, [headerRow, chipsRow]);
            return card;
        }

        function renderChip_(value, key) {
            const chip = Dom.el("span", {
                class: "badge rounded-pill bg-light text-dark border d-flex align-items-center gap-2"
            });
            Dom.append(chip, Dom.el("span", { text: value }));
            const removeBtn = Dom.el("button", {
                type: "button",
                class: "btn btn-sm btn-outline-danger lt-btn-icon",
                dataset: { action: "remove-option", key: key, value: value }
            }, Dom.el("i", { class: "bi bi-x" }));
            Dom.append(chip, removeBtn);
            return chip;
        }

        function bindListEvents_() {
            const list = document.getElementById("dropdown-config-list");
            if (!list) return;
            if (list.dataset.bound === "true") return;
            list.dataset.bound = "true";

            list.addEventListener("click", (e) => {
                const actionBtn = e.target.closest("[data-action]");
                if (!actionBtn || !list.contains(actionBtn)) return;
                const action = actionBtn.dataset.action;
                const key = actionBtn.dataset.key || "";

                if (action === "add-option") {
                    const input = list.querySelector(`input[data-role="option-input"][data-key="${key}"]`);
                    const value = input ? input.value : "";
                    handleAddOption_(key, value);
                    if (input) input.value = "";
                    return;
                }

                if (action === "remove-option") {
                    const value = actionBtn.dataset.value || "";
                    handleRemoveOption_(key, value);
                }
            });

            list.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;
                const input = e.target.closest('input[data-role="option-input"]');
                if (!input || !list.contains(input)) return;
                e.preventDefault();
                const key = input.dataset.key || "";
                handleAddOption_(key, input.value);
                input.value = "";
            });
        }

        function bindActionButtons_() {
            const saveBtn = document.getElementById("dropdown-config-save");
            if (saveBtn && saveBtn.dataset.bound !== "true") {
                saveBtn.dataset.bound = "true";
                saveBtn.addEventListener("click", handleSave_);
            }

            const resetBtn = document.getElementById("dropdown-config-reset");
            if (resetBtn && resetBtn.dataset.bound !== "true") {
                resetBtn.dataset.bound = "true";
                resetBtn.addEventListener("click", handleReset_);
            }
        }

        function handleAddOption_(key, value) {
            const clean = normalizeOptionValue_(value);
            if (!clean) {
                Alerts && Alerts.showAlert("Ingresa una opcion valida.", "warning");
                return;
            }
            const list = Array.isArray(state.options[key]) ? state.options[key].slice() : [];
            const exists = list.some((opt) => opt.toLowerCase() === clean.toLowerCase());
            if (exists) {
                Alerts && Alerts.showAlert("La opcion ya existe.", "warning");
                return;
            }
            list.push(clean);
            state.options[key] = list;
            renderEntries_();
        }

        function handleRemoveOption_(key, value) {
            const list = Array.isArray(state.options[key]) ? state.options[key].slice() : [];
            if (list.length <= 1) {
                Alerts && Alerts.showAlert("Debe quedar al menos una opcion.", "warning");
                return;
            }
            const clean = normalizeOptionValue_(value);
            const next = list.filter((opt) => opt.toLowerCase() !== clean.toLowerCase());
            state.options[key] = next.length ? next : list;
            renderEntries_();
        }

        function handleSave_() {
            UiState && UiState.setGlobalLoading(true, "Guardando opciones...");
            DropdownConfig.save(state.options)
                .then((updated) => {
                    state.options = updated;
                    state.entries = DropdownConfig.getEntries();
                    Alerts && Alerts.showAlert("Desplegables actualizados.", "success");
                    renderEntries_();
                    if (global.FormManager && typeof global.FormManager.refreshCurrent === "function") {
                        global.FormManager.refreshCurrent();
                    }
                    const factView = document.getElementById("view-facturacion");
                    if (global.InvoicePanel && factView && !factView.classList.contains("d-none")) {
                        global.InvoicePanel.render();
                    }
                })
                .catch((err) => {
                    Alerts && Alerts.showAlert("Error guardando opciones: " + err.message, "danger");
                })
                .finally(() => {
                    UiState && UiState.setGlobalLoading(false);
                });
        }

        function handleReset_() {
            state.options = DropdownConfig.getDefaults();
            state.entries = DropdownConfig.getEntries();
            renderEntries_();
        }

        return { render };
    })();

    global.DropdownConfig = DropdownConfig;
    global.DropdownConfigPanel = DropdownConfigPanel;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const FormRendererState = {};

  global.FormRendererState = FormRendererState;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  function normalizeToken(val) {
    return String(val || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function preferRazonSocial(field) {
    if (!field) return false;
    const idToken = normalizeToken(field.id);
    const labelToken = normalizeToken(field.label);
    return idToken.indexOf("RAZON") > -1 || labelToken.indexOf("RAZON") > -1;
  }

  function getClientOptions(field, referenceData) {
    const clients = (referenceData && referenceData.clientes) || [];
    const preferRazon = preferRazonSocial(field);
    return clients.map((cli) => {
      const label = (global.DomainHelpers && typeof global.DomainHelpers.getClientDisplayName === "function")
        ? global.DomainHelpers.getClientDisplayName(cli, { preferRazon: preferRazon })
        : (global.HtmlHelpers && typeof global.HtmlHelpers.getClientDisplayName === "function")
          ? global.HtmlHelpers.getClientDisplayName(cli, { preferRazon: preferRazon })
          : (cli.nombre || cli.razonSocial || "");
      return {
        value: label,
        label: label,
        dataset: {
          id: cli.id != null ? String(cli.id) : "",
          cuit: cli.cuit || ""
        }
      };
    });
  }

  function getEmployeeOptions(referenceData) {
    const employees = (referenceData && referenceData.empleados) || [];
    return employees.map((emp) => {
      const label = typeof emp === "string"
        ? emp
        : (emp.nombre || emp.empleado || emp.label || "");
      return {
        value: label,
        label: label,
        dataset: {
          id: emp && typeof emp === "object" && emp.id != null ? String(emp.id) : ""
        }
      };
    });
  }

  function getSelectOptions(field) {
    const defaults = field && Array.isArray(field.options) ? field.options : [];
    if (global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function") {
      return global.DropdownConfig.getOptions(field.id, defaults);
    }
    return defaults;
  }

  function getDocTypeOptions(field) {
    const fallback = field && field.options ? field.options : ["DNI", "CUIL", "CUIT"];
    if (global.DropdownConfig && typeof global.DropdownConfig.getOptions === "function") {
      return global.DropdownConfig.getOptions(field.id, fallback);
    }
    return fallback;
  }

  global.FormRendererData = {
    getClientOptions: getClientOptions,
    getEmployeeOptions: getEmployeeOptions,
    getSelectOptions: getSelectOptions,
    getDocTypeOptions: getDocTypeOptions
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  function bindBooleanToggle(input, labelEl, trueLabel, falseLabel) {
    if (!input || !labelEl) return;
    const onChange = function () {
      labelEl.textContent = input.checked ? trueLabel : falseLabel;
    };
    input.addEventListener("change", onChange);
  }

  global.FormRendererHandlers = {
    bindBooleanToggle: bindBooleanToggle
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const Data = global.FormRendererData || null;
  const Handlers = global.FormRendererHandlers || null;

  function renderBoolean(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const switchDiv = document.createElement("div");
    switchDiv.className = "form-check form-switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-check-input";
    input.id = "field-" + field.id;
    if (typeof field.defaultChecked === "boolean") {
      input.checked = field.defaultChecked;
    } else {
      input.checked = true;
    }

    const switchLabel = document.createElement("label");
    switchLabel.className = "form-check-label small";
    switchLabel.htmlFor = input.id;
    const trueLabel = field.trueLabel || "Activo";
    const falseLabel = field.falseLabel || "Inactivo";
    switchLabel.textContent = input.checked ? trueLabel : falseLabel;

    if (Handlers && typeof Handlers.bindBooleanToggle === "function") {
      Handlers.bindBooleanToggle(input, switchLabel, trueLabel, falseLabel);
    } else {
      input.addEventListener("change", function () {
        switchLabel.textContent = input.checked ? trueLabel : falseLabel;
      });
    }

    switchDiv.appendChild(input);
    switchDiv.appendChild(switchLabel);

    wrapper.appendChild(label);
    wrapper.appendChild(switchDiv);
    return wrapper;
  }

  function renderHidden(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1 d-none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.id = "field-" + field.id;
    input.className = "form-control form-control-sm";
    if (field.placeholder) input.placeholder = field.placeholder;

    wrapper.appendChild(input);
    return wrapper;
  }

  function renderSection(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-section-heading";

    const title = document.createElement("div");
    title.className = "form-section-title";
    if (field.icon) {
      const icon = document.createElement("i");
      icon.className = "bi " + field.icon;
      title.appendChild(icon);
    }
    const label = document.createElement("span");
    label.textContent = field.label || "";
    title.appendChild(label);
    wrapper.appendChild(title);

    if (field.subtitle) {
      const subtitle = document.createElement("div");
      subtitle.className = "form-section-subtitle";
      subtitle.textContent = field.subtitle;
      wrapper.appendChild(subtitle);
    }

    return wrapper;
  }

  function renderDayOfWeek(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("select");
    input.id = "field-" + field.id;
    input.className = "form-select form-select-sm";
    const ui = global.UIHelpers;
    const days = [
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
      "DOMINGO"
    ];
    if (ui && typeof ui.renderSelect === "function") {
      const options = days.map((d) => ({ value: d, label: d }));
      ui.renderSelect(input, options, "", { includeEmpty: true, emptyLabel: "Seleccionar día..." });
    } else {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Seleccionar día...";
      input.appendChild(placeholder);
      days.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        input.appendChild(opt);
      });
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderDeclarativeSelect(field, options) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("select");
    input.id = "field-" + field.id;
    input.className = "form-select form-select-sm";
    const ui = global.UIHelpers;
    if (ui && typeof ui.renderSelect === "function") {
      ui.renderSelect(input, options, "", { includeEmpty: true, emptyLabel: "Seleccionar..." });
    } else {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Seleccionar...";
      input.appendChild(placeholder);
      options.forEach((optItem) => {
        const opt = document.createElement("option");
        opt.value = optItem.value;
        opt.textContent = optItem.label;
        if (optItem.dataset) {
          Object.keys(optItem.dataset).forEach((k) => {
            opt.dataset[k] = optItem.dataset[k];
          });
        }
        input.appendChild(opt);
      });
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderTags(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1 client-tags-field";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "field-" + field.id;

    const chips = document.createElement("div");
    chips.className = "tag-chips";
    chips.dataset.tagsChips = "1";

    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group input-group-sm mt-2";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm";
    input.placeholder = field.placeholder || "Agregar etiqueta...";
    input.setAttribute("data-tags-input", "1");

    const datalist = document.createElement("datalist");
    const listId = "tags-datalist-" + field.id;
    datalist.id = listId;
    datalist.dataset.tagsDatalist = "1";
    input.setAttribute("list", listId);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-outline-primary";
    addBtn.textContent = "Agregar";
    addBtn.setAttribute("data-tags-add", "1");

    inputGroup.appendChild(input);
    inputGroup.appendChild(addBtn);

    wrapper.appendChild(label);
    wrapper.appendChild(chips);
    wrapper.appendChild(inputGroup);
    wrapper.appendChild(hidden);
    wrapper.appendChild(datalist);

    return wrapper;
  }

  function renderInput(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = "field-" + field.id;
    input.className = "form-control form-control-sm";
    input.type =
      field.type === "phone" || field.type === "dni" ? "text" : field.type;
    if (field.step) input.step = field.step;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.type === "phone") {
      input.inputMode = "tel";
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function renderDocType(field) {
    const options = Data && typeof Data.getDocTypeOptions === "function"
      ? Data.getDocTypeOptions(field)
      : (field.options || ["DNI", "CUIL", "CUIT"]);
    return renderDeclarativeSelect(
      Object.assign({}, field, { options: options }),
      options.map(opt => ({ value: opt, label: opt }))
    );
  }

  function renderDocNumber(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-1";

    const label = document.createElement("label");
    label.className = "form-label mb-1";
    label.htmlFor = "field-" + field.id;
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = "field-" + field.id;
    input.className = "form-control form-control-sm";
    input.type = "text";
    input.inputMode = "numeric";
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.docTypeField) input.dataset.docTypeField = field.docTypeField;
    if (field.docTypeValue) input.dataset.docTypeValue = field.docTypeValue;
    input.dataset.docNumber = "1";

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  const FormRendererRender = {
    renderField: function (field, referenceData) {
      if (field && field.hidden) {
        return renderHidden(field);
      }
      switch (field.type) {
        case "boolean":
          return renderBoolean(field);
        case "section":
          return renderSection(field);
        case "dayOfWeek":
          return renderDayOfWeek(field);
        case "cliente": {
          const options = Data && typeof Data.getClientOptions === "function"
            ? Data.getClientOptions(field, referenceData)
            : [];
          return renderDeclarativeSelect(field, options);
        }
        case "empleado": {
          const options = Data && typeof Data.getEmployeeOptions === "function"
            ? Data.getEmployeeOptions(referenceData)
            : [];
          return renderDeclarativeSelect(field, options);
        }
        case "select": {
          const configured = Data && typeof Data.getSelectOptions === "function"
            ? Data.getSelectOptions(field)
            : (field.options || []);
          const options = (configured || []).map(opt => ({
            value: opt,
            label: opt
          }));
          return renderDeclarativeSelect(field, options);
        }
        case "docType":
          return renderDocType(field);
        case "docNumber":
          return renderDocNumber(field);
        case "tags":
          return renderTags(field);
        case "textarea": {
          const wrapper = document.createElement("div");
          wrapper.className = "mb-1";

          const label = document.createElement("label");
          label.className = "form-label mb-1";
          label.htmlFor = "field-" + field.id;
          label.textContent = field.label;

          const textarea = document.createElement("textarea");
          textarea.id = "field-" + field.id;
          textarea.className = "form-control form-control-sm";
          textarea.rows = field.rows || 3;
          if (field.placeholder) textarea.placeholder = field.placeholder;

          wrapper.appendChild(label);
          wrapper.appendChild(textarea);
          return wrapper;
        }
        case "time": {
          const wrapper = document.createElement("div");
          wrapper.className = "mb-1";

          const label = document.createElement("label");
          label.className = "form-label mb-1";
          label.htmlFor = "field-" + field.id;
          label.textContent = field.label;

          const input = document.createElement("input");
          input.id = "field-" + field.id;
          input.className = "form-control form-control-sm";
          input.type = "time";

          wrapper.appendChild(label);
          wrapper.appendChild(input);
          return wrapper;
        }
        default:
          return renderInput(field);
      }
    }
  };

  global.FormRendererRender = FormRendererRender;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  const render = global.FormRendererRender;

  if (!render || typeof render.renderField !== "function") {
    global.FormRenderer = {
      renderField: function () { return document.createElement("div"); }
    };
    return;
  }

  global.FormRenderer = {
    renderField: render.renderField
  };
})(typeof window !== "undefined" ? window : this);


(function (global) {
  if (typeof document === "undefined") return;

  const listeners = [];
  let ready = false;
  let bound = !!global.__mapsLoaderReadyBound;

  function isReady() {
    return !!(global.google && global.google.maps && global.google.maps.places);
  }

  function notifyReady() {
    if (ready || !isReady()) return;
    ready = true;
    while (listeners.length) {
      const cb = listeners.shift();
      try {
        cb();
      } catch (e) {
        console.warn("MapsLoader callback error:", e);
      }
    }
  }

  if (!bound) {
    bound = true;
    global.__mapsLoaderReadyBound = true;
    document.addEventListener("maps:ready", notifyReady);
  }

  const MapsLoader = {
    onReady: function (cb) {
      if (typeof cb !== "function") return;
      if (isReady()) {
        ready = true;
        cb();
        return;
      }
      listeners.push(cb);
    },
    isAvailable: function () {
      return isReady();
    },
    hasKey: function () {
      return !!global.__MAPS_API_KEY__;
    }
  };

  global.MapsLoader = MapsLoader;
})(typeof window !== "undefined" ? window : this);


(function (global) {
  function bindAddressInput(container) {
    if (!container) return;
    const input = container.querySelector("#field-DIRECCION");
    if (!input || input.dataset.mapsBound) return;

    input.dataset.mapsBound = "1";

    const getField = (fieldId) => container.querySelector("[id='field-" + fieldId + "']");
    const placeIdInput = getField("MAPS PLACE ID");
    const latInput = getField("MAPS LAT");
    const lngInput = getField("MAPS LNG");

    function clearPlaceData() {
      if (placeIdInput) placeIdInput.value = "";
      if (latInput) latInput.value = "";
      if (lngInput) lngInput.value = "";
      input.dataset.mapsPlaceSelected = "0";
    }

    input.addEventListener("input", clearPlaceData);

    if (!global.MapsLoader || !global.MapsLoader.hasKey()) {
      return;
    }

    global.MapsLoader.onReady(function () {
      if (!global.google || !global.google.maps || !global.google.maps.places) return;

      const autocomplete = new global.google.maps.places.Autocomplete(input, {
        fields: ["place_id", "formatted_address", "geometry", "name"],
        types: ["geocode"]
      });

      autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place) return;
        if (place.formatted_address) {
          input.value = place.formatted_address;
        }
        if (placeIdInput) {
          placeIdInput.value = place.place_id || "";
        }
        if (place.geometry && place.geometry.location) {
          if (latInput) latInput.value = String(place.geometry.location.lat());
          if (lngInput) lngInput.value = String(place.geometry.location.lng());
        }
        input.dataset.mapsPlaceSelected = "1";
      });
    });
  }

  const MapsAutocomplete = {
    bind: function (container) {
      bindAddressInput(container);
    }
  };

  global.MapsAutocomplete = MapsAutocomplete;
})(typeof window !== "undefined" ? window : this);


/**
 * MapsPanelState
 * Estado y helpers del mapa.
 */
(function (global) {
  const Dom = global.DomHelpers || (function () {
    function text(value) {
      return document.createTextNode(value == null ? "" : String(value));
    }
    function setAttrs(el, attrs) {
      if (!attrs) return;
      Object.keys(attrs).forEach(key => {
        const val = attrs[key];
        if (val == null) return;
        if (key === "class" || key === "className") {
          el.className = String(val);
          return;
        }
        if (key === "text") {
          el.textContent = String(val);
          return;
        }
        if (key === "dataset" && typeof val === "object") {
          Object.keys(val).forEach(dataKey => {
            if (val[dataKey] != null) el.dataset[dataKey] = String(val[dataKey]);
          });
          return;
        }
        if (key === "style" && typeof val === "object") {
          Object.keys(val).forEach(styleKey => {
            el.style[styleKey] = val[styleKey];
          });
          return;
        }
        el.setAttribute(key, String(val));
      });
    }
    function append(parent, child) {
      if (!parent || child == null) return;
      if (Array.isArray(child)) {
        child.forEach(c => append(parent, c));
        return;
      }
      if (typeof child === "string" || typeof child === "number") {
        parent.appendChild(text(child));
        return;
      }
      parent.appendChild(child);
    }
    function el(tag, attrs, children) {
      const node = document.createElement(tag);
      setAttrs(node, attrs);
      append(node, children);
      return node;
    }
    function clear(el) {
      if (!el) return;
      while (el.firstChild) el.removeChild(el.firstChild);
    }
    return { el, text, clear, append };
  })();

  function escapeHtml(value) {
    if (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === 'function') {
      return global.HtmlHelpers.escapeHtml(value);
    }
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/[<]/g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getClientDisplayName(cliente) {
    if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
      return DomainHelpers.getClientDisplayName(cliente);
    }
    if (!cliente) return '';
    if (typeof cliente === 'string') return cliente;
    return cliente.nombre || cliente.cliente || cliente.razonSocial || '';
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function hasCoords(item) {
    return item && typeof item.lat === 'number' && typeof item.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng);
  }

  function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatDateISO(date) {
    if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.formatDateISO === 'function') {
      return DomainHelpers.formatDateISO(date);
    }
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateShort(date) {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  }

  function formatWeekLabel(weekStart) {
    const start = formatDateShort(weekStart);
    const end = formatDateShort(addDays(weekStart, 6));
    return `Semana ${start} - ${end}`;
  }

  function parseTags(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(/\s*,\s*/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function formatDocLabel(docType, docNumber) {
    if (!docType && !docNumber) return '';
    if (!docType) return docNumber;
    if (!docNumber) return docType;
    return `${docType} ${docNumber}`;
  }

  function createPlanIndex() {
    return {
      plannedClientIds: new Set(),
      clientAssignments: new Map(),
      employeeAssignments: new Map()
    };
  }

  const MapsPanelState = {
    map: null,
    markers: [],
    markersByKey: new Map(),
    infoWindow: null,
    cachedReference: { clientes: [], empleados: [] },
    referenceIndex: {
      clientsById: new Map(),
      employeesById: new Map(),
      sortedClients: [],
      sortedEmployees: []
    },
    cachedClientItems: [],
    clientItemsDirty: true,
    selectsDirty: true,
    planData: null,
    planIndex: createPlanIndex(),
    prefetchReference: null,
    prefetchPlanData: null,
    prefetchPlanIndex: null,
    prefetchWeekStart: "",
    prefetchAt: 0,
    currentListItems: [],
    listClickBound: false,
    unsubscribeRef: null,
    planRequestId: 0,
    isPlanLoading: false,
    isRefLoading: false,
    clientDetailCache: new Map(),
    Dom: Dom,
    eventsController: null,
    rootContainer: null,
    selectedClientId: "",
    MAP_ICON_BASE: "https:\/\/maps.google.com/mapfiles/ms/icons/",
    filters: {
      employeeId: "",
      clientId: "",
      query: "",
      employeeScope: "all",
      planFilter: "all",
      weekStart: getMondayOfWeek(new Date())
    },
    escapeHtml: escapeHtml,
    getClientDisplayName: getClientDisplayName,
    normalizeText: normalizeText,
    hasCoords: hasCoords,
    toNumber: toNumber,
    getMondayOfWeek: getMondayOfWeek,
    addDays: addDays,
    formatDateISO: formatDateISO,
    formatDateShort: formatDateShort,
    formatWeekLabel: formatWeekLabel,
    parseTags: parseTags,
    formatDocLabel: formatDocLabel,
    createPlanIndex: createPlanIndex
  };

  MapsPanelState.getEmployeeById = function (id) {
    const key = id != null ? String(id).trim() : '';
    if (!key) return null;
    return MapsPanelState.referenceIndex.employeesById.get(key) || null;
  };

  MapsPanelState.getClientById = function (id) {
    const key = id != null ? String(id).trim() : '';
    if (!key) return null;
    return MapsPanelState.referenceIndex.clientsById.get(key) || null;
  };

  global.MapsPanelState = MapsPanelState;
})(typeof window !== "undefined" ? window : this);


/**
 * MapsPanelData
 * Capa de datos del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }
  const PREFETCH_TTL_MS = 5 * 60 * 1000;

  function buildPlanIndex(data) {
    const index = state.createPlanIndex();
    if (!data || !Array.isArray(data.dias)) return index;

    data.dias.forEach((dia) => {
      const dayLabel = dia.diaDisplay || dia.dia || dia.fechaDisplay || "";
      (dia.clientes || []).forEach((cliente) => {
        const rawId = cliente && cliente.idCliente != null ? cliente.idCliente : "";
        const clientId = String(rawId || "").trim();
        if (!clientId) return;

        index.plannedClientIds.add(clientId);

        let clientEntry = index.clientAssignments.get(clientId);
        if (!clientEntry) {
          clientEntry = { id: clientId, empleados: new Set(), dias: new Set() };
          index.clientAssignments.set(clientId, clientEntry);
        }
        if (dayLabel) clientEntry.dias.add(dayLabel);

        (cliente.asignaciones || []).forEach((asg) => {
          const empId = asg && asg.idEmpleado != null ? String(asg.idEmpleado).trim() : "";
          if (!empId) return;
          const empName = asg && asg.empleado ? String(asg.empleado).trim() : "";
          clientEntry.empleados.add(empName || empId);

          let empEntry = index.employeeAssignments.get(empId);
          if (!empEntry) {
            empEntry = { id: empId, nombre: empName || "", clientes: new Set() };
            index.employeeAssignments.set(empId, empEntry);
          }
          empEntry.clientes.add(clientId);
        });
      });
    });

    return index;
  }

  function buildReferenceIndex() {
    const clients = state.cachedReference.clientes || [];
    const employees = state.cachedReference.empleados || [];
    const clientsById = new Map();
    const employeesById = new Map();

    clients.forEach((cli) => {
      const id = cli && cli.id != null ? String(cli.id).trim() : "";
      if (id) clientsById.set(id, cli);
    });

    employees.forEach((emp) => {
      const id = emp && emp.id != null ? String(emp.id).trim() : "";
      if (id) employeesById.set(id, emp);
    });

    state.referenceIndex = {
      clientsById: clientsById,
      employeesById: employeesById,
      sortedClients: clients.slice().sort((a, b) =>
        state.getClientDisplayName(a).localeCompare(state.getClientDisplayName(b))
      ),
      sortedEmployees: employees.slice().sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""))
      )
    };
  }

  function rebuildClientItems() {
    const clients = state.referenceIndex.sortedClients.length
      ? state.referenceIndex.sortedClients
      : (state.cachedReference.clientes || []);

    state.cachedClientItems = clients
      .map((cli) => {
        const id = cli && cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        const name = state.getClientDisplayName(cli);
        if (!name) return null;
        const assignment = state.planIndex.clientAssignments.get(id);
        const assignedEmployees = assignment ? Array.from(assignment.empleados).filter(Boolean) : [];
        return {
          type: "cliente",
          id: id,
          name: name,
          direccion: cli.direccion || "",
          lat: state.toNumber(cli.lat),
          lng: state.toNumber(cli.lng),
          isPlanned: state.planIndex.plannedClientIds.has(id),
          assignedEmployees: assignedEmployees
        };
      })
      .filter(Boolean);

    state.clientItemsDirty = false;
  }

  function applyFilters(items) {
    const filters = state.filters;
    const query = state.normalizeText(filters.query);
    let filtered = items.slice();

    if (filters.clientId) {
      filtered = filtered.filter((item) => item.id === filters.clientId);
    }

    if (filters.employeeId && filters.employeeScope === "assigned") {
      const entry = state.planIndex.employeeAssignments.get(filters.employeeId);
      const allowed = entry ? entry.clientes : null;
      filtered = allowed ? filtered.filter((item) => allowed.has(item.id)) : [];
    }

    const applyPlanFilter = !(filters.employeeId || filters.clientId);
    if (applyPlanFilter) {
      if (filters.planFilter === "planned") {
        filtered = filtered.filter((item) => item.isPlanned);
      } else if (filters.planFilter === "unplanned") {
        filtered = filtered.filter((item) => !item.isPlanned);
      }
    }

    if (query) {
      filtered = filtered.filter((item) => {
        const haystack = state.normalizeText(`${item.name} ${item.direccion}`);
        return haystack.includes(query);
      });
    }

    return filtered;
  }

  function splitByCoords(items) {
    const withCoords = [];
    const missing = [];
    items.forEach((item) => {
      if (state.hasCoords(item)) {
        withCoords.push(item);
      } else {
        missing.push(item);
      }
    });
    return { withCoords: withCoords, missing: missing };
  }

  function refreshReferenceData(container) {
    if (!global.ReferenceService) return;
    state.isRefLoading = true;
    if (global.MapsPanelRender) {
      global.MapsPanelRender.renderView(container);
    }

    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = global.ReferenceService.ensureLoaded();

    loadPromise
      .then((data) => {
        state.cachedReference = data || { clientes: [], empleados: [] };
        buildReferenceIndex();
        state.clientItemsDirty = true;
        state.selectsDirty = true;
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando referencias", err, { silent: true });
        }
        state.cachedReference = { clientes: [], empleados: [] };
        buildReferenceIndex();
        state.clientItemsDirty = true;
        state.selectsDirty = true;
      })
      .finally(() => {
        state.isRefLoading = false;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
  }

  function subscribeReferenceUpdates(callback) {
    if (!global.ReferenceService || typeof global.ReferenceService.subscribe !== "function") {
      return null;
    }
    return global.ReferenceService.subscribe(callback);
  }

  function refreshPlanData(container) {
    if (!global.MapsService) return;
    const requestId = ++state.planRequestId;
    state.isPlanLoading = true;
    if (global.MapsPanelRender) {
      global.MapsPanelRender.renderView(container);
    }

    const weekStartStr = state.formatDateISO(state.filters.weekStart);
    global.MapsService.getWeeklyClientOverview(weekStartStr)
      .then((data) => {
        if (requestId !== state.planRequestId) return;
        if (data && data.error) throw new Error(data.error);
        state.planData = data || null;
        state.planIndex = buildPlanIndex(state.planData);
        state.clientItemsDirty = true;
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando plan semanal", err, { silent: true });
        }
        if (requestId !== state.planRequestId) return;
        state.planData = null;
        state.planIndex = state.createPlanIndex();
        state.clientItemsDirty = true;
      })
      .finally(() => {
        if (requestId !== state.planRequestId) return;
        state.isPlanLoading = false;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
  }

  function applyPrefetch() {
    if (!state.prefetchAt || (Date.now() - state.prefetchAt) > PREFETCH_TTL_MS) {
      return false;
    }
    let used = false;
    if (state.prefetchReference) {
      state.cachedReference = state.prefetchReference;
      buildReferenceIndex();
      state.clientItemsDirty = true;
      state.selectsDirty = true;
      used = true;
    }
    const currentWeek = state.formatDateISO(state.filters.weekStart);
    const weekMatches = !state.prefetchWeekStart || state.prefetchWeekStart === currentWeek;
    if (state.prefetchPlanData && weekMatches) {
      state.planData = state.prefetchPlanData;
      state.planIndex = state.prefetchPlanIndex || buildPlanIndex(state.prefetchPlanData);
      state.clientItemsDirty = true;
      used = true;
    }
    return used;
  }

  function prefetch() {
    const tasks = [];
    if (global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function") {
      tasks.push(
        global.ReferenceService.ensureLoaded()
          .then(() => {
            const data = global.ReferenceService.get();
            state.prefetchReference = data || { clientes: [], empleados: [] };
            state.prefetchAt = Date.now();
          })
          .catch(() => {
            state.prefetchReference = { clientes: [], empleados: [] };
            state.prefetchAt = Date.now();
          })
      );
    }

    if (global.MapsService && typeof global.MapsService.getWeeklyClientOverview === "function") {
      const weekStart = state.filters && state.filters.weekStart
        ? state.filters.weekStart
        : state.getMondayOfWeek(new Date());
      const weekStartStr = state.formatDateISO(weekStart);
      tasks.push(
        global.MapsService.getWeeklyClientOverview(weekStartStr)
          .then((data) => {
            if (data && data.error) throw new Error(data.error);
            state.prefetchPlanData = data || null;
            state.prefetchPlanIndex = buildPlanIndex(state.prefetchPlanData);
            state.prefetchWeekStart = weekStartStr;
            state.prefetchAt = Date.now();
          })
          .catch(() => {
            state.prefetchPlanData = null;
            state.prefetchPlanIndex = buildPlanIndex(null);
            state.prefetchWeekStart = weekStartStr;
            state.prefetchAt = Date.now();
          })
      );
    }

    if (!tasks.length) return Promise.resolve(null);
    return Promise.allSettled(tasks);
  }

  global.MapsPanelData = {
    buildPlanIndex: buildPlanIndex,
    buildReferenceIndex: buildReferenceIndex,
    rebuildClientItems: rebuildClientItems,
    applyFilters: applyFilters,
    splitByCoords: splitByCoords,
    refreshReferenceData: refreshReferenceData,
    refreshPlanData: refreshPlanData,
    subscribeReferenceUpdates: subscribeReferenceUpdates,
    applyPrefetch: applyPrefetch,
    prefetch: prefetch
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MapsPanelRender
 * Render del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }
  const Dom = state.Dom;

  function buildPanelHtml() {
    return `
      <div class="lt-surface lt-surface--subtle p-3 mb-3">
        <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-between">
          <div>
            <div class="small text-muted">Mapa operativo</div>
            <h5 class="m-0">Planificación semanal</h5>
          </div>
          <div class="map-week-nav">
            <button type="button" class="btn btn-outline-secondary btn-sm" title="Semana anterior" data-map-week-prev>
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="map-week-label" data-map-week-label>Semana</div>
            <button type="button" class="btn btn-outline-secondary btn-sm" title="Semana siguiente" data-map-week-next>
              <i class="bi bi-chevron-right"></i>
            </button>
            <button type="button" class="btn btn-outline-primary btn-sm" title="Ir a hoy" data-map-week-today>
              <i class="bi bi-calendar-check"></i>
            </button>
            <button type="button" class="btn btn-outline-primary btn-sm" title="Actualizar plan" data-map-week-refresh>
              <i class="bi bi-arrow-repeat"></i>
            </button>
          </div>
        </div>
        <div class="map-filters mt-3">
          <div class="map-filter">
            <label class="form-label">Empleado</label>
            <select class="form-select form-select-sm" data-map-employee>
              <option value="">Todos los empleados</option>
            </select>
          </div>
          <div class="map-filter">
            <label class="form-label">Cliente</label>
            <select class="form-select form-select-sm" data-map-client>
              <option value="">Todos los clientes</option>
            </select>
          </div>
          <div class="map-filter">
            <label class="form-label">Clientes del empleado</label>
            <div class="map-status-toggle" data-map-employee-scope>
              <button type="button" class="btn btn-outline-primary btn-sm active" data-map-employee-scope="all">Todos</button>
              <button type="button" class="btn btn-outline-primary btn-sm" data-map-employee-scope="assigned">Asignados</button>
            </div>
          </div>
          <div class="map-filter">
            <label class="form-label">Estado</label>
            <div class="map-status-toggle" data-map-plan-toggle>
              <button type="button" class="btn btn-outline-primary btn-sm active" data-map-plan="all">Todos</button>
              <button type="button" class="btn btn-outline-primary btn-sm" data-map-plan="planned">Planificados</button>
              <button type="button" class="btn btn-outline-primary btn-sm" data-map-plan="unplanned">Sin planificar</button>
            </div>
          </div>
          <div class="map-filter map-filter--wide">
            <label class="form-label">Buscar cliente</label>
            <input type="search" class="form-control form-control-sm" placeholder="Nombre o dirección" data-map-search>
          </div>
        </div>
      </div>
      <div class="row g-3">
        <div class="col-12 col-xl-8">
          <div class="lt-surface map-canvas-wrapper">
            <div id="map-canvas" class="map-canvas"></div>
            <div class="map-canvas-overlay d-none" data-map-overlay></div>
          </div>
        </div>
        <div class="col-12 col-xl-4">
          <div class="lt-surface p-3 map-list">
            <div class="map-summary mb-3" data-map-summary></div>
            <div class="map-employee-card d-none" data-map-employee-card></div>
            <div class="map-items" data-map-items></div>
            <div class="map-missing mt-3" data-map-missing></div>
          </div>
        </div>
      </div>
    `;
  }

  function isAssignedToSelectedEmployee(clientId) {
    if (!state.filters.employeeId || !clientId) return false;
    const entry = state.planIndex.employeeAssignments.get(state.filters.employeeId);
    return !!(entry && entry.clientes && entry.clientes.has(clientId));
  }

  function setActiveClient(container, clientId) {
    state.selectedClientId = clientId || "";
    const root = container || state.rootContainer || document;
    const list = root.querySelector ? root.querySelector("[data-map-items]") : null;
    if (!list) return;
    list.querySelectorAll(".map-item").forEach((el) => {
      const isActive = el.getAttribute("data-map-id") === state.selectedClientId;
      el.classList.toggle("map-item--active", isActive);
    });
    if (state.selectedClientId) {
      const escaped = (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function")
        ? CSS.escape(state.selectedClientId)
        : String(state.selectedClientId).replace(/"/g, '\\"');
      const active = list.querySelector(`[data-map-id="${escaped}"]`);
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  function buildClientDetailContent(ref, record, loading) {
    const data = record && record.record ? record.record : {};
    const nombre = data["NOMBRE"] || (ref && ref.nombre) || "";
    const razon = data["RAZON SOCIAL"] || data["RAZÓN SOCIAL"] || (ref && ref.razonSocial) || "";
    const docType = data["TIPO DOCUMENTO"] || (ref && ref.docType) || "";
    const docNumber = data["NUMERO DOCUMENTO"] || (ref && ref.docNumber) || "";
    const direccion = data["DIRECCION"] || (ref && ref.direccion) || "";
    const tipoServicio = data["TIPO SERVICIO"] || (ref && ref.tipoServicio) || "";
    const descripcion = data["DESCRIPCION"] || "";
    const administrador = data["NOMBRE ADMINISTRADOR"] || "";
    const correoAdmin = data["CORREO ADMINISTRACION"] || "";
    const telAdmin = data["TELEFONO ADMINISTRACION"] || "";
    const correoFact = data["CORREO FACTURACION"] || "";
    const encargado = data["ENCARGADO"] || "";
    const telEncargado = data["TELEFONO"] || "";
    const valorHora = data["VALOR HORA"] || "";
    const fechaContrato = data["FECHA CONTRATO"] || "";
    const tags = state.parseTags(data["ETIQUETAS"] || (ref && ref.tags) || "");
    const docLabel = state.formatDocLabel(docType, docNumber);

    const root = Dom.el("div", { className: "map-client-detail" });
    const header = Dom.el("div", { className: "map-client-detail__header" }, [
      Dom.el("div", { className: "map-client-detail__title", text: nombre || razon || "Cliente" }),
      razon ? Dom.el("div", { className: "map-client-detail__subtitle", text: razon }) : null
    ]);
    root.appendChild(header);

    if (loading) {
      root.appendChild(
        Dom.el("div", { className: "map-client-detail__loading" }, [
          Dom.el("span", { className: "spinner-border spinner-border-sm" }),
          Dom.text("Actualizando datos...")
        ])
      );
    }

    const grid = Dom.el("div", { className: "map-client-detail__grid" });
    const addItem = (label, value) => {
      if (!value) return;
      grid.appendChild(
        Dom.el("div", { className: "map-client-detail__item" }, [
          Dom.el("div", { className: "map-client-detail__label", text: label }),
          Dom.el("div", { className: "map-client-detail__value", text: value })
        ])
      );
    };
    addItem("Documento", docLabel);
    addItem("Dirección", direccion);
    addItem("Tipo de servicio", tipoServicio);
    addItem("Administrador", administrador);
    addItem("Teléfono administración", telAdmin);
    addItem("Correo administración", correoAdmin);
    addItem("Correo facturación", correoFact);
    addItem("Encargado", encargado);
    addItem("Teléfono encargado", telEncargado);
    addItem("Fecha contrato", fechaContrato);
    addItem("Valor hora", valorHora);
    root.appendChild(grid);

    if (descripcion) {
      root.appendChild(Dom.el("div", { className: "map-client-detail__description", text: descripcion }));
    }

    const tagsBlock = Dom.el("div", { className: "map-client-detail__tags-block" });
    tagsBlock.appendChild(Dom.el("div", { className: "map-client-detail__label", text: "Etiquetas" }));
    if (tags.length) {
      const tagsWrap = Dom.el("div", { className: "map-client-detail__tags" });
      tags.forEach((tag) => {
        tagsWrap.appendChild(Dom.el("span", { className: "lt-chip lt-chip--muted", text: tag }));
      });
      tagsBlock.appendChild(tagsWrap);
    } else {
      tagsBlock.appendChild(Dom.el("div", { className: "text-muted small", text: "Sin etiquetas" }));
    }
    root.appendChild(tagsBlock);

    return root;
  }

  function renderClientDetail(detailEl, ref, record, loading) {
    if (!detailEl) return;
    Dom.clear(detailEl);
    Dom.append(detailEl, buildClientDetailContent(ref, record, loading));
  }

  function openClientDetailModal(clientId) {
    if (!clientId || !global.bootstrap || !global.bootstrap.Modal) {
      if (global.Alerts && global.Alerts.showAlert) {
        global.Alerts.showAlert("No se pudo abrir el detalle del cliente.", "warning");
      }
      return;
    }
    if (!global.ModalHelpers) return;

    const ref = state.getClientById(clientId) || {};
    const name = state.getClientDisplayName(ref) || "Cliente";
    const modalId = "map-client-detail-modal";

    const cached = state.clientDetailCache.get(clientId);
    const title = [
      Dom.el("i", { className: "bi bi-building me-2" }),
      Dom.el("span", { text: name })
    ];
    const body = Dom.el("div", {}, [
      Dom.el("div", { dataset: { mapClientDetail: "1" } })
    ]);

    const footer = [];
    if (ref && ref.direccion) {
      footer.push(
        Dom.el("a", {
          className: "btn btn-outline-primary",
          target: "_blank",
          rel: "noopener",
          href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ref.direccion)
        }, [
          Dom.el("i", { className: "bi bi-geo-alt me-1" }),
          Dom.text("Ver en mapa")
        ])
      );
    }
    footer.push(
      Dom.el("button", {
        type: "button",
        className: "btn btn-outline-secondary",
        "data-bs-dismiss": "modal",
        text: "Cerrar"
      })
    );

    const modalEl = global.ModalHelpers.create(
      modalId,
      title,
      body,
      footer,
      {
        size: "lg",
        centered: true,
        scrollable: true,
        headerClass: "bg-primary text-white",
        closeClass: "btn-close-white"
      }
    );
    if (!modalEl) return;

    const detailEl = modalEl.querySelector("[data-map-client-detail]");
    renderClientDetail(detailEl, ref, cached, !cached);
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    if (cached) return;

    if (!global.MapsService) return;

    global.MapsService.getClientById(clientId)
      .then((result) => {
        if (result && result.ignored) return;
        if (!result || !result.record) return;
        state.clientDetailCache.set(clientId, result);
        const detail = modalEl.querySelector("[data-map-client-detail]");
        renderClientDetail(detail, ref, result, false);
      })
      .catch(() => {
        const detail = modalEl.querySelector("[data-map-client-detail]");
        renderClientDetail(detail, ref, null, false);
      });
  }

  function openPlanModal(clientId) {
    if (!clientId || !global.WeeklyPlanPanel || !global.bootstrap || !global.bootstrap.Modal) {
      if (global.Alerts && global.Alerts.showAlert) {
        global.Alerts.showAlert("No se pudo abrir el plan semanal.", "warning");
      }
      return;
    }
    if (!global.ModalHelpers) return;

    const modalId = "map-plan-modal";
    const existingPanel = document.getElementById("plan-semanal-panel");
    if (existingPanel && !existingPanel.closest(`#${modalId}`)) {
      existingPanel.remove();
    }

    const ref = state.getClientById(clientId);
    const name = state.getClientDisplayName(ref) || "Cliente";
    const title = [
      Dom.el("i", { className: "bi bi-calendar-week me-2" }),
      Dom.el("span", { text: `Plan semanal · ${name}` })
    ];
    const body = Dom.el("div", {}, [
      Dom.el("div", { id: "map-plan-panel" })
    ]);

    const modalEl = global.ModalHelpers.create(
      modalId,
      title,
      body,
      null,
      {
        size: "xl",
        centered: true,
        scrollable: true,
        headerClass: "bg-primary text-white",
        closeClass: "btn-close-white"
      }
    );
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const panel = modalEl.querySelector("#map-plan-panel");
    if (!panel) return;

    if (typeof global.WeeklyPlanPanel.init === "function") {
      global.WeeklyPlanPanel.init(state.cachedReference);
    }
    global.WeeklyPlanPanel.render(panel);

    const select = modalEl.querySelector("#field-CLIENTE");
    if (select) {
      select.value = clientId;
      select.dispatchEvent(new Event("change"));
    }
  }

  function buildEmployeeMarker() {
    if (!state.filters.employeeId) return null;
    const emp = state.getEmployeeById(state.filters.employeeId);
    if (!emp) return null;
    const lat = state.toNumber(emp.lat);
    const lng = state.toNumber(emp.lng);
    return {
      type: "empleado",
      id: String(state.filters.employeeId),
      name: emp.nombre || "Empleado",
      direccion: emp.direccion || "",
      lat: lat,
      lng: lng,
      isPlanned: true,
      assignedEmployees: []
    };
  }

  function renderSummary(container, filtered, missing) {
    const summary = container.querySelector("[data-map-summary]");
    if (!summary) return;

    const total = filtered.length;
    const employeeSelected = !!state.filters.employeeId;
    const plannedCount = employeeSelected ? 0 : filtered.filter((item) => item.isPlanned).length;
    const unplannedCount = employeeSelected ? 0 : (filtered.length - plannedCount);
    const assignedCount = employeeSelected
      ? filtered.filter((item) => isAssignedToSelectedEmployee(item.id)).length
      : 0;
    const unassignedCount = employeeSelected ? (filtered.length - assignedCount) : 0;

    Dom.clear(summary);

    const header = Dom.el("div", { className: "d-flex align-items-center justify-content-between mb-2" }, [
      Dom.el("div", { className: "small text-muted", text: "Resumen semanal" }),
      state.isPlanLoading
        ? Dom.el("span", { className: "map-loading-inline" }, [
          Dom.el("span", { className: "spinner-border spinner-border-sm" }),
          Dom.text("Actualizando")
        ])
        : null
    ]);

    const chips = Dom.el("div", { className: "map-summary-chips" }, [
      Dom.el("span", { className: "lt-chip lt-chip--primary", text: `Mostrados: ${total}` }),
      employeeSelected
        ? Dom.el("span", { className: "lt-chip lt-chip--success", text: `Asignados: ${assignedCount}` })
        : Dom.el("span", { className: "lt-chip lt-chip--success", text: `Planificados: ${plannedCount}` }),
      employeeSelected
        ? Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin asignar: ${unassignedCount}` })
        : Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin planificar: ${unplannedCount}` }),
      Dom.el("span", { className: "lt-chip lt-chip--muted", text: `Sin coordenadas: ${missing.length}` })
    ]);

    const legendItems = [
      Dom.el("span", { className: "map-legend__item" }, [
        Dom.el("span", { className: "map-legend__dot map-legend__dot--employee" }),
        Dom.text("Empleados")
      ])
    ];

    if (employeeSelected) {
      legendItems.push(
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--assigned" }),
          Dom.text("Asignados")
        ]),
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--unassigned" }),
          Dom.text("Sin asignar")
        ])
      );
    } else {
      legendItems.push(
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--client" }),
          Dom.text("Clientes")
        ]),
        Dom.el("span", { className: "map-legend__item" }, [
          Dom.el("span", { className: "map-legend__dot map-legend__dot--planned" }),
          Dom.text("Planificados")
        ])
      );
    }

    const legend = Dom.el("div", { className: "map-legend" }, legendItems);

    summary.appendChild(header);
    summary.appendChild(chips);
    summary.appendChild(legend);
  }

  function renderEmployeeCard(container) {
    const card = container.querySelector("[data-map-employee-card]");
    if (!card) return;

    if (!state.filters.employeeId) {
      card.classList.add("d-none");
      Dom.clear(card);
      return;
    }

    const emp = state.getEmployeeById(state.filters.employeeId);
    if (!emp) {
      card.classList.remove("d-none");
      Dom.clear(card);
      card.appendChild(Dom.el("div", { className: "map-employee-card__title", text: "Empleado seleccionado" }));
      card.appendChild(Dom.el("div", { className: "map-employee-card__name", text: "Sin información" }));
      return;
    }

    const entry = state.planIndex.employeeAssignments.get(state.filters.employeeId);
    const assignedCount = entry ? entry.clientes.size : 0;
    const address = emp.direccion || "Sin dirección";

    card.classList.remove("d-none");
    Dom.clear(card);
    card.appendChild(Dom.el("div", { className: "map-employee-card__title", text: "Empleado seleccionado" }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__name", text: emp.nombre || "Empleado" }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__meta", text: `Direccion: ${address}` }));
    card.appendChild(Dom.el("div", { className: "map-employee-card__meta", text: `Clientes esta semana: ${assignedCount}` }));
  }

  function renderList(container, items) {
    const list = container.querySelector("[data-map-items]");
    if (!list) return;

    if (!items.length) {
      if (global.EmptyState) {
        global.EmptyState.render(list, { variant: "empty", title: "Sin clientes", message: "No hay clientes para mostrar." });
      } else {
        Dom.clear(list);
        list.appendChild(Dom.el("div", { className: "text-muted small map-empty", text: "No hay clientes para mostrar." }));
      }
      return;
    }

    Dom.clear(list);
    items.forEach((item) => {
      const isAssigned = isAssignedToSelectedEmployee(item.id);
      const statusLabel = state.filters.employeeId
        ? (isAssigned ? "Asignado" : "Sin asignar")
        : (item.isPlanned ? "Planificado" : "Sin planificar");
      const statusClass = state.filters.employeeId
        ? (isAssigned ? "map-status--assigned" : "map-status--unassigned")
        : (item.isPlanned ? "map-status--planned" : "map-status--unplanned");
      const activeClass = item.id === state.selectedClientId ? " map-item--active" : "";

      const card = Dom.el("div", { className: `map-item${activeClass}`, dataset: { mapId: item.id } });

      const title = Dom.el("div", { className: "map-item__title" });
      const focusBtn = Dom.el("button", {
        type: "button",
        className: "map-item__focus",
        dataset: { mapAction: "focus", mapId: item.id }
      }, item.name || "Cliente");
      const status = Dom.el("span", { className: `map-status ${statusClass}`.trim(), text: statusLabel });
      title.appendChild(focusBtn);
      title.appendChild(status);
      card.appendChild(title);

      card.appendChild(Dom.el("div", { className: "map-item__meta", text: item.direccion || "Sin dirección" }));

      const actions = Dom.el("div", { className: "map-item__actions" });
      const detailBtn = Dom.el("button", {
        type: "button",
        className: "btn btn-light btn-sm",
        dataset: { mapAction: "detail", mapId: item.id }
      }, [
        Dom.el("i", { className: "bi bi-info-circle me-1" }),
        Dom.text("Datos")
      ]);
      const planBtn = Dom.el("button", {
        type: "button",
        className: "btn btn-outline-primary btn-sm",
        dataset: { mapAction: "plan", mapId: item.id }
      }, [
        Dom.el("i", { className: "bi bi-calendar-week me-1" }),
        Dom.text("Plan")
      ]);
      actions.appendChild(detailBtn);
      actions.appendChild(planBtn);
      card.appendChild(actions);

      list.appendChild(card);
    });

    if (global.MapsPanelHandlers) {
      global.MapsPanelHandlers.bindListClick(list);
    }
  }

  function renderMissing(container, missing) {
    const section = container.querySelector("[data-map-missing]");
    if (!section) return;

    if (!missing.length) {
      Dom.clear(section);
      return;
    }

    Dom.clear(section);
    section.appendChild(Dom.el("div", { className: "small text-muted mb-2", text: "Sin coordenadas" }));
    const list = Dom.el("div", { className: "map-missing-list" });
    missing.forEach((item) => {
      const isAssigned = isAssignedToSelectedEmployee(item.id);
      const status = state.filters.employeeId
        ? (isAssigned ? "Asignado" : "Sin asignar")
        : (item.isPlanned ? "Planificado" : "Sin planificar");
      list.appendChild(
        Dom.el("div", { className: "map-missing-item" }, [
          Dom.text(item.name || "Cliente"),
          Dom.el("span", { text: status })
        ])
      );
    });
    section.appendChild(list);
  }

  function ensureMap(container, items) {
    const overlay = container.querySelector("[data-map-overlay]");
    const mapEl = container.querySelector("#map-canvas");
    if (!mapEl) return;

    if (!global.MapsLoader || !global.MapsLoader.hasKey()) {
      if (overlay) {
        overlay.classList.remove("d-none");
        Dom.clear(overlay);
        overlay.appendChild(
          Dom.el("div", { className: "text-center" }, [
            Dom.el("i", { className: "bi bi-exclamation-circle" }),
            Dom.el("div", { className: "mt-2", text: "Configura MAPS_API_KEY para usar el mapa." })
          ])
        );
      }
      return;
    }

    if (!global.MapsLoader.isAvailable()) {
      if (overlay) {
        overlay.classList.remove("d-none");
        Dom.clear(overlay);
        overlay.appendChild(
          Dom.el("div", { className: "text-center" }, [
            Dom.el("div", { className: "spinner-border text-primary" }),
            Dom.el("div", { className: "mt-2", text: "Cargando mapa..." })
          ])
        );
      }
      global.MapsLoader.onReady(function () {
        ensureMap(container, items);
      });
      return;
    }

    if (overlay) overlay.classList.add("d-none");

    if (!state.map) {
      state.map = new google.maps.Map(mapEl, {
        center: { lat: -34.6037, lng: -58.3816 },
        zoom: 11,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
      });
      state.infoWindow = new google.maps.InfoWindow();
    }

    updateMarkers(items);
  }

  function getMarkerKey(item) {
    return `${item.type}-${item.id}`;
  }

  function getMarkerIcon(item) {
    if (item.type === "empleado") return `${state.MAP_ICON_BASE}green-dot.png`;
    if (state.filters.employeeId) {
      return isAssignedToSelectedEmployee(item.id)
        ? `${state.MAP_ICON_BASE}blue-dot.png`
        : `${state.MAP_ICON_BASE}yellow-dot.png`;
    }
    if (item.isPlanned) return `${state.MAP_ICON_BASE}purple-dot.png`;
    return `${state.MAP_ICON_BASE}red-dot.png`;
  }

  function updateMarkers(items) {
    state.markers.forEach((marker) => marker.setMap(null));
    state.markers = [];
    state.markersByKey.clear();

    if (!state.map) return;

    const bounds = new google.maps.LatLngBounds();
    const hasItems = items.length > 0;

    items.forEach((item) => {
      if (!state.hasCoords(item)) return;
      const position = { lat: item.lat, lng: item.lng };
      const marker = new google.maps.Marker({
        position: position,
        map: state.map,
        title: item.name || "",
        icon: getMarkerIcon(item)
      });
      marker.addListener("click", function () {
        openInfo(marker, item);
      });
      state.markers.push(marker);
      state.markersByKey.set(getMarkerKey(item), marker);
      bounds.extend(position);
    });

    if (hasItems) {
      if (items.length === 1) {
        state.map.setCenter(bounds.getCenter());
        state.map.setZoom(15);
      } else {
        state.map.fitBounds(bounds);
      }
    }
  }

  function openInfo(marker, item) {
    if (!state.infoWindow || !marker) return;
    const name = state.escapeHtml(item.name);
    const direccion = state.escapeHtml(item.direccion || "Sin dirección");

    if (item.type === "empleado") {
      const content = `
        <div class="map-info">
          <div class="map-info__title">${name}</div>
          <div class="map-info__meta">Empleado</div>
          <div class="map-info__address">${direccion}</div>
        </div>
      `;
      state.infoWindow.setContent(content);
      state.infoWindow.open({ anchor: marker, map: state.map });
      return;
    }

    const isAssigned = isAssignedToSelectedEmployee(item.id);
    const statusText = state.filters.employeeId
      ? (isAssigned ? "Asignado" : "Sin asignar")
      : (item.isPlanned ? "Planificado" : "Sin planificar");
    const employeeLabel = item.assignedEmployees && item.assignedEmployees.length
      ? item.assignedEmployees.join(", ")
      : "Sin asignaciones";

    if (!Dom) {
      const employees = state.escapeHtml(employeeLabel);
      const content = `
        <div class="map-info">
          <div class="map-info__title">${name}</div>
          <div class="map-info__meta">${statusText}</div>
          <div class="map-info__address">${direccion}</div>
          <div class="map-info__employees">Empleados: ${employees}</div>
        </div>
      `;
      state.infoWindow.setContent(content);
    } else {
      const content = Dom.el("div", { className: "map-info" }, [
        Dom.el("div", { className: "map-info__title", text: item.name || "Cliente" }),
        Dom.el("div", { className: "map-info__meta", text: statusText }),
        Dom.el("div", { className: "map-info__address", text: item.direccion || "Sin dirección" }),
        Dom.el("div", { className: "map-info__employees", text: `Empleados: ${employeeLabel}` })
      ]);
      state.infoWindow.setContent(content);
    }
    state.infoWindow.open({ anchor: marker, map: state.map });
    setActiveClient(state.rootContainer, item.id);
  }

  function focusItem(item) {
    if (!state.map || !item) return;
    const key = getMarkerKey(item);
    const marker = state.markersByKey.get(key);
    if (!marker) return;
    const position = marker.getPosition();
    if (position) {
      state.map.panTo(position);
      state.map.setZoom(15);
    }
    openInfo(marker, item);
  }

  function updateWeekLabel(container) {
    const label = container.querySelector("[data-map-week-label]");
    if (!label) return;
    if (state.planData && state.planData.semana && state.planData.semana.label) {
      label.textContent = `Semana ${state.planData.semana.label}`;
    } else {
      label.textContent = state.formatWeekLabel(state.filters.weekStart);
    }
  }

  function populateSelects(container) {
    const employeeSelect = container.querySelector("[data-map-employee]");
    if (employeeSelect) {
      const current = state.filters.employeeId;
      const empleados = state.referenceIndex.sortedEmployees.length
        ? state.referenceIndex.sortedEmployees
        : (state.cachedReference.empleados || []);
      const options = empleados
        .map((emp) => {
          const id = emp && emp.id != null ? String(emp.id).trim() : "";
          const nombre = emp && emp.nombre ? String(emp.nombre).trim() : "";
          if (!id || !nombre) return null;
          return { value: id, label: nombre };
        })
        .filter(Boolean);
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(employeeSelect, options, current || "", { includeEmpty: true, emptyLabel: "Todos los empleados" });
      } else {
        Dom.clear(employeeSelect);
        employeeSelect.appendChild(Dom.el("option", { value: "", text: "Todos los empleados" }));
        options.forEach((opt) => {
          const node = Dom.el("option", { value: opt.value, text: opt.label });
          if (opt.value === current) node.selected = true;
          employeeSelect.appendChild(node);
        });
      }
      employeeSelect.value = current || "";
    }

    const clientSelect = container.querySelector("[data-map-client]");
    if (clientSelect) {
      const current = state.filters.clientId;
      const clientes = state.referenceIndex.sortedClients.length
        ? state.referenceIndex.sortedClients
        : (state.cachedReference.clientes || []);
      const options = clientes
        .map((cli) => {
          const id = cli && cli.id != null ? String(cli.id).trim() : "";
          const nombre = state.getClientDisplayName(cli);
          if (!id || !nombre) return null;
          return { value: id, label: nombre };
        })
        .filter(Boolean);
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(clientSelect, options, current || "", { includeEmpty: true, emptyLabel: "Todos los clientes" });
      } else {
        Dom.clear(clientSelect);
        clientSelect.appendChild(Dom.el("option", { value: "", text: "Todos los clientes" }));
        options.forEach((opt) => {
          const node = Dom.el("option", { value: opt.value, text: opt.label });
          if (opt.value === current) node.selected = true;
          clientSelect.appendChild(node);
        });
      }
      clientSelect.value = current || "";
    }
  }

  function updatePlanToggleState(container) {
    const buttons = container.querySelectorAll("[data-map-plan]");
    const disabled = !!(state.filters.employeeId || state.filters.clientId);
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-map-plan");
      btn.classList.toggle("active", value === state.filters.planFilter);
      btn.disabled = disabled;
    });
  }

  function updateEmployeeScopeState(container) {
    const buttons = container.querySelectorAll("[data-map-employee-scope]");
    const disabled = !state.filters.employeeId;
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-map-employee-scope") || "all";
      btn.classList.toggle("active", value === state.filters.employeeScope);
      btn.disabled = disabled;
    });
  }

  function renderView(container) {
    if (!container) return;

    updateWeekLabel(container);
    if (state.selectsDirty) {
      populateSelects(container);
      state.selectsDirty = false;
    }
    updatePlanToggleState(container);
    updateEmployeeScopeState(container);

    if (state.isRefLoading && (!state.cachedReference.clientes || !state.cachedReference.clientes.length)) {
      const list = container.querySelector("[data-map-items]");
      if (list && global.EmptyState) {
        global.EmptyState.render(list, { variant: "loading", message: "Cargando datos..." });
      } else if (list) {
        Dom.clear(list);
        list.appendChild(Dom.el("div", { className: "text-muted small map-empty", text: "Cargando datos..." }));
      }
      return;
    }

    if (state.clientItemsDirty && global.MapsPanelData) {
      global.MapsPanelData.rebuildClientItems();
    }
    const clients = state.cachedClientItems;
    const filtered = global.MapsPanelData ? global.MapsPanelData.applyFilters(clients) : clients;
    const split = global.MapsPanelData ? global.MapsPanelData.splitByCoords(filtered) : { withCoords: filtered, missing: [] };

    renderSummary(container, filtered, split.missing);
    renderEmployeeCard(container);
    renderList(container, split.withCoords);
    renderMissing(container, split.missing);

    state.currentListItems = split.withCoords;

    const mapItems = split.withCoords.slice();
    const employeeMarker = buildEmployeeMarker();
    if (employeeMarker && state.hasCoords(employeeMarker)) {
      mapItems.push(employeeMarker);
    }
    ensureMap(container, mapItems);
  }

  global.MapsPanelRender = {
    buildPanelHtml: buildPanelHtml,
    renderView: renderView,
    renderSummary: renderSummary,
    renderEmployeeCard: renderEmployeeCard,
    renderList: renderList,
    renderMissing: renderMissing,
    ensureMap: ensureMap,
    updateMarkers: updateMarkers,
    openInfo: openInfo,
    focusItem: focusItem,
    setActiveClient: setActiveClient,
    updateWeekLabel: updateWeekLabel,
    populateSelects: populateSelects,
    updatePlanToggleState: updatePlanToggleState,
    openClientDetailModal: openClientDetailModal,
    openPlanModal: openPlanModal
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MapsPanelHandlers
 * Eventos y acciones del mapa.
 */
(function (global) {
  const state = global.MapsPanelState;
  if (!state) {
    console.error("MapsPanelState no disponible");
    return;
  }

  function bindListClick(list) {
    if (state.listClickBound || !list) return;
    state.listClickBound = true;
    list.addEventListener("click", function (e) {
      const actionBtn = e.target.closest("[data-map-action]");
      const card = e.target.closest(".map-item");
      if (!card) return;
      const id = (actionBtn && actionBtn.getAttribute("data-map-id")) || card.getAttribute("data-map-id");
      const item = state.currentListItems.find((entry) => entry.id === id);
      if (!item) return;
      if (global.MapsPanelRender && typeof global.MapsPanelRender.setActiveClient === "function") {
        global.MapsPanelRender.setActiveClient(state.rootContainer, item.id);
      }

      if (!actionBtn) {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.focusItem(item);
        }
        return;
      }

      const action = actionBtn.getAttribute("data-map-action");
      if (action === "detail") {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.openClientDetailModal(item.id);
        }
        return;
      }
      if (action === "plan") {
        if (global.MapsPanelRender) {
          global.MapsPanelRender.openPlanModal(item.id);
        }
        return;
      }
      if (global.MapsPanelRender) {
        global.MapsPanelRender.focusItem(item);
      }
    });
  }

  function attachEvents(container) {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal: signal });
    };

    const employeeSelect = container.querySelector("[data-map-employee]");
    if (employeeSelect) {
      on(employeeSelect, "change", function () {
        state.filters.employeeId = employeeSelect.value || "";
        state.filters.employeeScope = "all";
        state.selectedClientId = "";
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    }

    const clientSelect = container.querySelector("[data-map-client]");
    if (clientSelect) {
      on(clientSelect, "change", function () {
        state.filters.clientId = clientSelect.value || "";
        state.selectedClientId = "";
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    }

    const planButtons = container.querySelectorAll("[data-map-plan]");
    planButtons.forEach((btn) => {
      on(btn, "click", function () {
        if (btn.disabled) return;
        const value = btn.getAttribute("data-map-plan") || "all";
        state.filters.planFilter = value;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    });

    const scopeButtons = container.querySelectorAll("[data-map-employee-scope]");
    scopeButtons.forEach((btn) => {
      on(btn, "click", function () {
        if (btn.disabled) return;
        const value = btn.getAttribute("data-map-employee-scope") || "all";
        state.filters.employeeScope = value;
        if (global.MapsPanelRender) {
          global.MapsPanelRender.renderView(container);
        }
      });
    });

    const searchInput = container.querySelector("[data-map-search]");
    if (searchInput) {
      let searchTimer = null;
      on(searchInput, "input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          state.filters.query = searchInput.value || "";
          if (global.MapsPanelRender) {
            global.MapsPanelRender.renderView(container);
          }
        }, 200);
      });
    }

    const prevBtn = container.querySelector("[data-map-week-prev]");
    if (prevBtn) {
      on(prevBtn, "click", function () {
        state.filters.weekStart = state.addDays(state.filters.weekStart, -7);
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const nextBtn = container.querySelector("[data-map-week-next]");
    if (nextBtn) {
      on(nextBtn, "click", function () {
        state.filters.weekStart = state.addDays(state.filters.weekStart, 7);
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const todayBtn = container.querySelector("[data-map-week-today]");
    if (todayBtn) {
      on(todayBtn, "click", function () {
        state.filters.weekStart = state.getMondayOfWeek(new Date());
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }

    const refreshBtn = container.querySelector("[data-map-week-refresh]");
    if (refreshBtn) {
      on(refreshBtn, "click", function () {
        if (global.MapsPanelData) {
          global.MapsPanelData.refreshPlanData(container);
        }
      });
    }
  }

  function isActiveView() {
    const view = document.getElementById("view-mapa");
    return !!(view && !view.classList.contains("d-none"));
  }

  global.MapsPanelHandlers = {
    attachEvents: attachEvents,
    bindListClick: bindListClick,
    isActiveView: isActiveView
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MapPanel
 * Orquestador del modulo de mapa.
 */
(function (global) {
  const MapPanel = (() => {
    function ensureDeps() {
      if (!global.MapsPanelState || !global.MapsPanelRender || !global.MapsPanelData || !global.MapsPanelHandlers) {
        console.error("MapsPanel dependencies no disponibles");
        return false;
      }
      return true;
    }

    function resetState() {
      const state = global.MapsPanelState;
      state.map = null;
      state.markers = [];
      state.markersByKey = new Map();
      state.infoWindow = null;
      state.currentListItems = [];
      state.cachedClientItems = [];
      state.clientItemsDirty = true;
      state.selectsDirty = true;
      state.listClickBound = false;
      state.planData = null;
      state.planIndex = state.createPlanIndex();
      state.planRequestId = 0;
      state.isPlanLoading = false;
      state.isRefLoading = false;
      state.filters.employeeId = "";
      state.filters.clientId = "";
      state.filters.query = "";
      state.filters.employeeScope = "all";
      state.filters.planFilter = "all";
      state.filters.weekStart = state.getMondayOfWeek(new Date());
      state.selectedClientId = "";
    }

    function render(containerId) {
      if (!ensureDeps()) return;
      const state = global.MapsPanelState;
      const container = typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
      if (!container) return;

      // safe static: layout fijo sin datos externos.
      container.innerHTML = global.MapsPanelRender.buildPanelHtml();
      state.rootContainer = container;
      resetState();

      global.MapsPanelHandlers.attachEvents(container);

      const usedPrefetch = global.MapsPanelData && typeof global.MapsPanelData.applyPrefetch === "function"
        ? global.MapsPanelData.applyPrefetch()
        : false;

      if (usedPrefetch && global.MapsPanelRender) {
        global.MapsPanelRender.renderView(container);
      } else {
        global.MapsPanelData.refreshReferenceData(container);
        global.MapsPanelData.refreshPlanData(container);
      }

      if (state.unsubscribeRef) state.unsubscribeRef();
      if (global.MapsPanelData && typeof global.MapsPanelData.subscribeReferenceUpdates === "function") {
        state.unsubscribeRef = global.MapsPanelData.subscribeReferenceUpdates(function () {
          if (global.MapsPanelHandlers.isActiveView()) {
            global.MapsPanelData.refreshReferenceData(container);
          }
        });
      }
    }

    return { render: render };
  })();

  global.MapPanel = MapPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * Footer UI Component
 */
(function (global) {
    const Footer = (function () {
        const footerHtml = `
            <footer class="fixed-bottom bg-white border-top py-2">
                <div class="container d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                        <button id="btn-nuevo" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-plus-lg me-1"></i> Nuevo
                        </button>
                    </div>
                    <button id="btn-grabar" class="btn btn-success rounded-pill px-4" disabled>
                        <i class="bi bi-check-lg me-1"></i> Grabar
                    </button>
                </div>
            </footer>
        `;

        function render() {
            const container = document.getElementById('footer-container');
            if (container) {
                // safe static: HTML fijo sin datos externos.
                container.innerHTML = footerHtml;
                attachEvents();
            }
        }

        function attachEvents() {
            const btnNuevo = document.getElementById('btn-nuevo');
            const btnGrabar = document.getElementById('btn-grabar');

            if (btnNuevo) {
                if (btnNuevo.dataset.bound === "true") return;
                btnNuevo.dataset.bound = "true";
                btnNuevo.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.resetForm();
                    }

                    // Reset buttons
                    btnGrabar.disabled = false;
                    btnNuevo.disabled = true;
                });
            }

            if (btnGrabar) {
                if (btnGrabar.dataset.bound === "true") return;
                btnGrabar.dataset.bound = "true";
                btnGrabar.addEventListener('click', function () {
                    if (global.FormManager) {
                        global.FormManager.submitForm();
                    }
                });
            }
        }

        return {
            render: render
        };
    })();

    global.Footer = Footer;
})(typeof window !== "undefined" ? window : this);


/**
 * Sidebar Component
 * Handles the responsive sidebar navigation logic
 */
(function (global) {
    const Sidebar = (() => {
    // State
    let isOpen = false;
    let isCollapsed = false;
    let activeItem = null;
    const storageKey = 'lt-erp-sidebar-collapsed';
    let initialized = false;

    // DOM Elements
    const elements = {
        sidebar: null,
        overlay: null,
        toggleBtn: null,
        menuItems: []
    };

    /**
     * Initialize the sidebar
     */
    function init() {
        if (initialized) return;
        initialized = true;
        elements.sidebar = document.getElementById('app-sidebar');
        elements.overlay = document.getElementById('sidebar-overlay');
        elements.toggleBtn = document.getElementById('sidebar-toggle');

        if (!elements.sidebar) return;

        hydrateCollapsedState();
        syncResponsiveState();

        if (elements.sidebar.dataset.resizeBound !== "true") {
            window.addEventListener('resize', syncResponsiveState);
            elements.sidebar.dataset.resizeBound = "true";
        }

        // Setup event listeners
        if (elements.toggleBtn && elements.toggleBtn.dataset.bound !== "true") {
            elements.toggleBtn.dataset.bound = "true";
            elements.toggleBtn.addEventListener('click', toggle);
        }

        if (elements.overlay && elements.overlay.dataset.bound !== "true") {
            elements.overlay.dataset.bound = "true";
            elements.overlay.addEventListener('click', close);
        }

        // Setup menu items
        const links = elements.sidebar.querySelectorAll('.nav-link[data-target]');
        links.forEach(link => {
            if (link.dataset.bound === "true") return;
            link.dataset.bound = "true";
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if (targetId) {
                    setActive(targetId);
                    // On mobile, close sidebar after selection
                    if (window.innerWidth < 992) {
                        close();
                    }
                }
            });
            elements.menuItems.push(link);
        });

        // Tooltip labels for collapsed state
        const titledLinks = elements.sidebar.querySelectorAll('.nav-link, .nav-link-parent');
        titledLinks.forEach(link => {
            const label = link.querySelector('span');
            const text = label ? label.textContent.trim() : '';
            if (text && !link.getAttribute('title')) {
                link.setAttribute('title', text);
            }
        });

        // Setup submenu toggles
        const submenuToggles = elements.sidebar.querySelectorAll('[data-toggle-submenu]');
        submenuToggles.forEach(toggle => {
            if (toggle.dataset.bound === "true") return;
            toggle.dataset.bound = "true";
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const submenuId = toggle.getAttribute('data-toggle-submenu');
                const submenu = document.getElementById(submenuId);
                if (!submenu) return;

                const isOpen = submenu.classList.contains('show');
                elements.sidebar.querySelectorAll('.nav-submenu').forEach(sm => sm.classList.remove('show'));
                elements.sidebar.querySelectorAll('.nav-link-parent').forEach(p => p.classList.remove('expanded'));

                if (!isOpen) {
                    submenu.classList.add('show');
                    toggle.classList.add('expanded');
                }
            });
        });
    }

    /**
     * Toggle sidebar state
     */
    function toggle() {
        if (window.innerWidth < 992) {
            isOpen = !isOpen;
            updateState();
            return;
        }
        setCollapsed(!isCollapsed);
    }

    /**
     * Open sidebar
     */
    function open() {
        isOpen = true;
        updateState();
    }

    /**
     * Close sidebar
     */
    function close() {
        isOpen = false;
        updateState();
    }

    /**
     * Update DOM based on state
     */
    function updateState() {
        if (isOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }

    function hydrateCollapsedState() {
        try {
            const saved = localStorage.getItem(storageKey);
            isCollapsed = saved === '1';
        } catch (e) {
            isCollapsed = false;
        }
    }

    function setCollapsed(value) {
        isCollapsed = Boolean(value);
        try {
            localStorage.setItem(storageKey, isCollapsed ? '1' : '0');
        } catch (e) {
            // ignore storage errors
        }
        syncResponsiveState();
    }

    function syncResponsiveState() {
        const isMobile = window.innerWidth < 992;
        if (isMobile) {
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.toggle('sidebar-collapsed', isCollapsed);
            document.body.classList.remove('sidebar-open');
            isOpen = false;
        }
    }

    /**
     * Set active menu item
     * @param {string} targetId - ID of the target view
     */
    function setActive(targetId) {
        activeItem = targetId;

        // Update menu items
        let activeLink = null;
        elements.menuItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
                activeLink = item;
            } else {
                item.classList.remove('active');
            }
        });

        // Reset parent menus
        if (elements.sidebar) {
            elements.sidebar.querySelectorAll('.nav-link-parent').forEach(p => {
                p.classList.remove('active');
            });
        }

        // Expand parent submenu if needed
        if (activeLink) {
            const group = activeLink.closest('.nav-item-group');
            if (group) {
                const parentToggle = group.querySelector('.nav-link-parent');
                const submenu = group.querySelector('.nav-submenu');
                if (parentToggle && submenu) {
                    parentToggle.classList.add('active', 'expanded');
                    submenu.classList.add('show');
                }
            }
        }

        // Trigger custom event for view change
        const event = new CustomEvent('view-change', {
            detail: { view: targetId }
        });
        document.dispatchEvent(event);
    }

        return {
            init,
            toggle,
            open,
            close,
            setActive
        };
    })();

    global.Sidebar = Sidebar;
})(typeof window !== "undefined" ? window : this);


/**
 * Grid Manager
 * Maneja la visualización de datos en formato de grilla/tabla
 */

(function (global) {
    const GridManager = (() => {
        let currentFormat = null;
        let allRecords = [];
        let currentEditingRecord = null;
        let eventsController = null;
        const Dom = global.DomHelpers;
        const RecordsData = global.RecordsData || null;
        const UiHelpers = global.UIHelpers || null;
        let currentPage = 1;
        let currentPageSize = 0;
        let currentTotalPages = 1;
        let currentRelevantFields = [];

        function formatDateForGrid(value) {
            if (!value) return '';

            if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.parseDate === "function") {
                const parsed = DomainHelpers.parseDate(value);
                if (parsed && !isNaN(parsed.getTime())) {
                    return parsed.toLocaleDateString('es-ES');
                }
            }

            if (Object.prototype.toString.call(value) === '[object Date]') {
                const d0 = value;
                if (!isNaN(d0.getTime())) {
                    return d0.toLocaleDateString('es-ES');
                }
            }

            const s = String(value).trim();
            if (!s) return '';

            let d = null;

            // YYYY-MM-DD (evitar corrimiento por timezone interpretándolo como fecha local)
            const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (iso) {
                d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
            } else {
                // DD/MM/YYYY
                const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (dmySlash) {
                    d = new Date(Number(dmySlash[3]), Number(dmySlash[2]) - 1, Number(dmySlash[1]));
                } else {
                    // DD-MM-YYYY
                    const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                    if (dmyDash) {
                        d = new Date(Number(dmyDash[3]), Number(dmyDash[2]) - 1, Number(dmyDash[1]));
                    } else {
                        d = new Date(s);
                    }
                }
            }

            if (!d || isNaN(d.getTime())) return s;
            return d.toLocaleDateString('es-ES');
        }

        function getPageSizeForFormat(tipoFormato) {
            if (tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS") {
                return 15;
            }
            return 0;
        }

        function clampPage(page, totalPages) {
            const total = Math.max(1, Number(totalPages || 1));
            const value = Math.max(1, Number(page || 1));
            return Math.min(value, total);
        }

        function getPaginationContainer() {
            return document.getElementById("grid-pagination");
        }

        function clearPagination() {
            const container = getPaginationContainer();
            if (!container || !Dom) return;
            container.classList.add("d-none");
            Dom.clear(container);
        }

        function updatePaginationState(options) {
            currentPageSize = getPageSizeForFormat(currentFormat);
            currentTotalPages = currentPageSize
                ? Math.max(1, Math.ceil(allRecords.length / currentPageSize))
                : 1;

            if (options && options.resetPage) {
                currentPage = 1;
            }

            currentPage = clampPage(currentPage, currentTotalPages);
        }

        function getPageSlice() {
            if (!currentPageSize) {
                return { records: allRecords, offset: 0 };
            }
            const start = (currentPage - 1) * currentPageSize;
            const end = start + currentPageSize;
            return { records: allRecords.slice(start, end), offset: start };
        }

        function renderPaginationControls() {
            const container = getPaginationContainer();
            if (!container || !Dom) return;

            if (!currentPageSize || allRecords.length <= currentPageSize) {
                clearPagination();
                return;
            }

            container.classList.remove("d-none");
            if (UiHelpers && typeof UiHelpers.renderPagination === "function") {
                UiHelpers.renderPagination(container, {
                    page: currentPage,
                    totalPages: currentTotalPages,
                    onPageChange: function (page) {
                        setPage(page);
                    }
                });
            }
        }

        function setPage(page) {
            const nextPage = clampPage(page, currentTotalPages);
            if (nextPage === currentPage) return;
            currentPage = nextPage;
            renderPage();
        }

        function getCurrentQuery() {
            const input = document.getElementById("search-query");
            return input ? input.value : "";
        }

        function getIncludeInactive() {
            const toggle = document.getElementById("check-ver-inactivos");
            return toggle ? toggle.checked : false;
        }

        function renderHeaders(relevantFields) {
            const headersRow = document.getElementById('grid-headers');
            if (!headersRow) return;

            Dom.clear(headersRow);

            relevantFields.forEach(field => {
                headersRow.appendChild(Dom.el('th', { text: field.label }));
            });

            headersRow.appendChild(Dom.el('th', {
                text: 'Acciones',
                style: 'width: 150px; text-align: center;'
            }));
        }

        function renderEmptyState(relevantFields) {
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;
            const colSpan = (relevantFields.length || 1) + 1;
            tbody.appendChild(Dom.el('tr', null, Dom.el('td', {
                colSpan: colSpan,
                className: 'text-center text-muted py-5',
                text: 'No hay registros para mostrar'
            })));
        }

        function renderRows(records, offset, relevantFields) {
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;

            records.forEach((record, idx) => {
                const tr = document.createElement('tr');

                relevantFields.forEach(field => {
                    const td = document.createElement('td');
                    let value = record[field.id];

                    if (value === undefined || value === null) {
                        value = record[field.label];
                    }

                    if (value === undefined || value === null) {
                        const keys = Object.keys(record);
                        const matchingKey = keys.find(k => k.toUpperCase() === field.id.toUpperCase());
                        if (matchingKey) {
                            value = record[matchingKey];
                        }
                    }

                    if (field.type === 'boolean') {
                        const isTrue = value === true ||
                            value === 'TRUE' ||
                            value === 'true' ||
                            value === 1 ||
                            value === '1' ||
                            value === 'Activo' ||
                            value === 'SI' ||
                            value === 'Si' ||
                            value === 'Asistió';
                        const trueLabel = field.trueLabel || 'Activo';
                        const falseLabel = field.falseLabel || 'Inactivo';
                        value = isTrue ? `✅ ${trueLabel}` : `❌ ${falseLabel}`;
                    } else if (field.type === 'date' && value) {
                        value = formatDateForGrid(value);
                    } else if (field.type === 'number' && value) {
                        value = Number(value).toLocaleString('es-ES');
                    }

                    td.textContent = value || '-';
                    td.style.maxWidth = '200px';
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis';
                    td.style.whiteSpace = 'nowrap';
                    tr.appendChild(td);
                });

                const tdActions = Dom.el('td', {
                    style: 'text-align: center; white-space: nowrap;'
                });

                const btnEdit = Dom.el('button', {
                    className: 'btn btn-sm btn-outline-primary lt-btn-icon me-1',
                    title: 'Editar',
                    dataset: { gridAction: "edit", index: String(offset + idx) }
                }, Dom.el('i', { className: 'bi bi-pencil-fill' }));

                const btnDelete = Dom.el('button', {
                    className: 'btn btn-sm btn-outline-danger lt-btn-icon',
                    title: 'Eliminar',
                    dataset: { gridAction: "delete", index: String(offset + idx) }
                }, Dom.el('i', { className: 'bi bi-trash-fill' }));

                tdActions.appendChild(btnEdit);
                tdActions.appendChild(btnDelete);
                tr.appendChild(tdActions);

                tbody.appendChild(tr);
            });
        }

        function renderPage() {
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;

            Dom.clear(tbody);

            if (!allRecords.length) {
                renderEmptyState(currentRelevantFields);
                renderPaginationControls();
                return;
            }

            const pageSlice = getPageSlice();
            renderRows(pageSlice.records, pageSlice.offset, currentRelevantFields);
            renderPaginationControls();
            bindTableEvents();
        }

        /**
         * Renderiza la grilla con los registros del formato actual
         */
        function renderGrid(tipoFormato, records, options) {
            currentFormat = tipoFormato;

            if (tipoFormato === 'ASISTENCIA' && global.AttendanceDailyUI) {
                clearPagination();
                global.AttendanceDailyUI.renderSummary(records || []);
                return;
            }

            allRecords = (records || []).map(item => {
                if (item.record) {
                    item.record.ID = item.id;
                    item.record._rowNumber = item.rowNumber;
                    return item.record;
                }
                return item;
            });

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) {
                clearPagination();
                return;
            }

            const visibleFields = formDef.fields.filter(field => field.type !== 'section' && !field.hidden);
            currentRelevantFields = visibleFields.slice(0, 5);

            renderHeaders(currentRelevantFields);
            updatePaginationState(options);
            renderPage();
        }

        function renderLoading(tipoFormato, message) {
            const format = tipoFormato || currentFormat;
            if (!format) return;
            const formDef = FORM_DEFINITIONS[format];
            const visibleFields = formDef && Array.isArray(formDef.fields)
                ? formDef.fields.filter(field => field.type !== 'section' && !field.hidden)
                : [];
            const colSpan = (visibleFields.slice(0, 5).length || 1) + 1;
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;
            Dom.clear(tbody);
            clearPagination();
            tbody.appendChild(
                Dom.el('tr', null,
                    Dom.el('td', {
                        className: 'text-center text-muted py-5',
                        colSpan: colSpan
                    }, [
                        Dom.el('div', { className: 'd-flex flex-column align-items-center gap-2' }, [
                            Dom.el('div', { className: 'spinner-border text-primary', role: 'status' }),
                            Dom.el('div', { className: 'small', text: message || 'Actualizando registros...' })
                        ])
                    ])
                )
            );
        }

        function bindTableEvents() {
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
            const signal = eventsController.signal;
            tbody.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-grid-action]');
                if (!actionBtn || !tbody.contains(actionBtn)) return;
                const action = actionBtn.dataset.gridAction;
                const index = Number(actionBtn.dataset.index || -1);
                if (!Number.isInteger(index) || index < 0 || index >= allRecords.length) return;
                const record = allRecords[index];
                if (action === "edit") {
                    editRecord(record);
                    return;
                }
                if (action === "delete") {
                    deleteRecord(record);
                }
            }, { signal });
        }

        /**
         * Abre el modal para editar un registro
         */
        function editRecord(record) {
            currentEditingRecord = record;
            const recordId = record.ID || record.Id || record.id;

            // Abrir modal y renderizar formulario en el callback
            const formDef = FORM_DEFINITIONS[currentFormat];
            const title =
                currentFormat === 'EMPLEADOS'
                    ? 'Editar empleado'
                    : currentFormat === 'CLIENTES'
                        ? 'Editar cliente'
                        : formDef && formDef.title
                            ? 'Editar ' + formDef.title.toLowerCase()
                            : 'Editar registro';

            openModal(title, function () {
                if (FormManager) {
                    FormManager.renderForm(currentFormat);

                    // Esperar un momento adicional para que se rendericen los campos
                    setTimeout(() => {
                        if (RecordManager && recordId) {
                            RecordManager.loadRecordForEdit(recordId, record);
                        } else {
                            loadRecordIntoForm(record);
                        }

                        const btnEliminar = document.getElementById('btn-eliminar-modal');
                        if (btnEliminar) btnEliminar.classList.remove('d-none');
                    }, 100);
                }
            });
        }

        /**
         * Carga los datos del registro en el formulario
         */
        function loadRecordIntoForm(record) {
            const formDef = FORM_DEFINITIONS[currentFormat];
            if (!formDef) return;

            formDef.fields.forEach(field => {
                const input = document.getElementById('field-' + field.id);
                if (!input) return;

                const value = record[field.id];

                if (field.type === 'boolean') {
                    input.checked = !!value;
                    input.dispatchEvent(new Event("change"));
                } else if (field.type === 'date' && value) {
                    // Convertir fecha a formato YYYY-MM-DD
                    const date = new Date(value);
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = value || '';
                }
            });

            if (FormManager && typeof FormManager.applyClientesEncargadoVisibility === "function") {
                FormManager.applyClientesEncargadoVisibility();
            }
            if (ClientTagsField && typeof ClientTagsField.syncFromValue === "function") {
                ClientTagsField.syncFromValue();
            }
            if (FormManager && typeof FormManager.applyInputMasks === "function") {
                FormManager.applyInputMasks();
            }
        }

        /**
         * Elimina un registro
         */
        function deleteRecord(record) {
            if (!record) return;
            const id = record.ID || record.Id || record.id;
            if (!id) {
                Alerts && Alerts.showAlert('ID no encontrado para eliminar.', 'warning');
                return;
            }

            const confirmPromise =
                global.UiDialogs && typeof global.UiDialogs.confirm === 'function'
                    ? global.UiDialogs.confirm({
                        title: 'Eliminar registro',
                        message: '¿Estás seguro de que deseas eliminar este registro?',
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        confirmVariant: 'danger',
                        icon: 'bi-trash3-fill',
                        iconClass: 'text-danger'
                    })
                    : Promise.resolve(confirm('¿Estás seguro de que deseas eliminar este registro?'));

            confirmPromise.then(function (confirmed) {
                if (!confirmed) return;

            UiState && UiState.setGlobalLoading(true, 'Eliminando...');

            if (!RecordsData || typeof RecordsData.deleteRecord !== 'function') {
                Alerts && Alerts.showAlert('No se pudo eliminar el registro.', 'danger');
                UiState && UiState.setGlobalLoading(false);
                return;
            }

            const payload = record._rowNumber
                ? { id: id, rowNumber: record._rowNumber }
                : id;

            RecordsData.deleteRecord(currentFormat, payload)
                .then(function () {
                    Alerts && Alerts.showAlert('✅ Registro eliminado correctamente.', 'success');
                    if (RecordsData && typeof RecordsData.refreshReferenceData === "function") {
                        return RecordsData.refreshReferenceData();
                    }
                    return null;
                })
                .then(function (refData) {
                    if (refData && FormManager) {
                        FormManager.updateReferenceData(refData);
                    }
                    refreshGrid();
                    if (global.location && typeof global.location.reload === "function") {
                        setTimeout(function () {
                            global.location.reload();
                        }, 300);
                    }
                })
                .catch(function (err) {
                    Alerts && Alerts.showAlert('Error al eliminar: ' + err.message, 'danger');
                })
                .finally(function () {
                    UiState && UiState.setGlobalLoading(false);
                });
            });
        }

        /**
         * Abre el modal del formulario
         * @param {string} title - Título del modal
         * @param {function} callback - Función a ejecutar después de abrir el modal
         */
        function openModal(title, callback) {
            const modal = document.getElementById('form-modal');
            const modalTitle = document.getElementById('modal-title');

            if (modal) {
                modal.classList.remove('d-none');
            }

            if (modalTitle) {
                modalTitle.textContent = title || 'Nuevo Registro';
            }

            // Ejecutar callback después de que el modal esté visible
            if (callback && typeof callback === 'function') {
                setTimeout(callback, 50);
            }
        }

        /**
         * Cierra el modal del formulario
         */
        function closeModal() {
            const modal = document.getElementById('form-modal');
            if (modal) {
                modal.classList.add('d-none');
            }

            currentEditingRecord = null;

            // Limpiar formulario
            if (FormManager) {
                FormManager.clearForm();
            }

            // Ocultar botón eliminar
            const btnEliminar = document.getElementById('btn-eliminar-modal');
            if (btnEliminar) {
                btnEliminar.classList.add('d-none');
            }
        }

        /**
         * Obtiene el registro que se está editando actualmente
         */
        function getCurrentEditingRecord() {
            return currentEditingRecord;
        }

        /**
         * Recarga los datos de la grilla
         */
        function refreshGrid() {
            if (!currentFormat) return;

            // Aquí iría la lógica para recargar los datos desde el servidor
            if (RecordsData && typeof RecordsData.searchRecords === 'function') {
                renderLoading(currentFormat, "Actualizando registros...");
                const query = getCurrentQuery();
                const includeInactive = getIncludeInactive();
                RecordsData.searchRecords(currentFormat, query, includeInactive)
                    .then(records => {
                        if (records && records.ignored) return;
                        renderGrid(currentFormat, records);
                    })
                    .catch(err => {
                        console.error('Error al recargar la grilla:', err);
                    });
            }
        }

        return {
            renderGrid,
            renderLoading,
            openModal,
            closeModal,
            getCurrentEditingRecord,
            refreshGrid
        };
    })();

    global.GridManager = GridManager;
})(typeof window !== 'undefined' ? window : this);


/**
 * ClientMediaData
 * Capa de datos para media de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function listClientMedia(clientId) {
    if (!ensureApi()) return Promise.resolve({ fachada: [], llave: [] });
    return global.ApiService.call("listClientMedia", clientId);
  }

  function uploadClientMedia(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("uploadClientMedia", payload);
  }

  function deleteClientMediaFile(fileId) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteClientMediaFile", fileId);
  }

  function getClientMediaImage(fileId, size) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("getClientMediaImage", fileId, size);
  }

  global.ClientMediaData = {
    listClientMedia: listClientMedia,
    uploadClientMedia: uploadClientMedia,
    deleteClientMediaFile: deleteClientMediaFile,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientTagsData
 * Capa de datos para etiquetas de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function getClientTags() {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getClientTags");
  }

  function upsertClientTags(tags) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("upsertClientTags", tags);
  }

  global.ClientTagsData = {
    getClientTags: getClientTags,
    upsertClientTags: upsertClientTags
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Panel de fotos para Clientes (Fachadas / Llaves)
 * - Soporta múltiples fotos por tipo
 * - Se renderiza dentro del modal de edición de CLIENTES
 */
var ClientMediaPanel = (function () {
    const SECTION_ID = 'client-media-section';
    const NOTICE_ID = 'client-media-notice';
    const LOADING_ID = 'client-media-loading';
    const LOADING_TEXT_ID = 'client-media-loading-text';
    const VIEWER_ID = 'client-media-viewer';
    const VIEWER_TITLE_ID = 'client-media-viewer-title';
    const VIEWER_IMG_ID = 'client-media-viewer-img';
    const VIEWER_SPINNER_ID = 'client-media-viewer-spinner';
    const VIEWER_MSG_ID = 'client-media-viewer-msg';
    const VIEWER_DRIVE_ID = 'client-media-viewer-drive';
    const ACCEPT_IMAGE_ANY = 'image/' + '*';
    const Dom = window.DomHelpers;
    const UI = window.UIHelpers;
    const ClientMediaData = window.ClientMediaData || null;

    let state = {
        clientId: '',
        fachada: [],
        llave: [],
        viewerKeyHandlerInstalled: false,
        eventsController: null
    };

    function getEditingClient_() {
        try {
            if (typeof GridManager !== 'undefined' && GridManager && typeof GridManager.getCurrentEditingRecord === 'function') {
                const r = GridManager.getCurrentEditingRecord();
                if (r) return r;
            }
        } catch (e) {
            // ignore
        }
        return null;
    }

    function getClientIdFromRecord_(rec) {
        if (!rec) return '';
        return String(rec.ID || rec.Id || rec.id || '').trim();
    }

    function showNotice_(type, message) {
        const el = document.getElementById(NOTICE_ID);
        if (!el) return;
        Dom.clear(el);
        if (!message) return;
        const safeType = type || 'info';
        const iconClass = safeType === 'danger'
            ? 'bi-exclamation-triangle-fill'
            : safeType === 'success'
                ? 'bi-check-circle-fill'
                : 'bi-info-circle-fill';
        el.appendChild(
            Dom.el('div', {
                className: `alert alert-${safeType} py-2 px-3 mb-0 d-flex align-items-start gap-2`
            }, [
                Dom.el('i', { className: `bi ${iconClass}` }),
                Dom.el('div', { className: 'small', text: message })
            ])
        );
    }

    function setPanelLoading_(isLoading, message) {
        const overlay = document.getElementById(LOADING_ID);
        if (!overlay) return;
        const text = document.getElementById(LOADING_TEXT_ID);
        if (text) text.textContent = message || 'Procesando...';
        overlay.classList.toggle('d-none', !isLoading);
    }

    function ensureViewer_() {
        const existing = document.getElementById(VIEWER_ID);
        if (existing) return existing;

        const overlay = Dom.el('div', {
            id: VIEWER_ID,
            className: 'client-media-viewer d-none'
        });

        const backdrop = Dom.el('div', {
            className: 'client-media-viewer__backdrop',
            'data-cm-viewer-close': '1'
        });

        const titleEl = Dom.el('div', {
            className: 'client-media-viewer__title',
            id: VIEWER_TITLE_ID,
            text: 'Foto'
        });

        const closeBtn = Dom.el('button', {
            type: 'button',
            className: 'btn btn-sm btn-outline-light lt-btn-icon',
            'data-cm-viewer-close': '1',
            'aria-label': 'Cerrar'
        }, Dom.el('i', { className: 'bi bi-x-lg' }));

        const header = Dom.el('div', { className: 'client-media-viewer__header' }, [
            titleEl,
            closeBtn
        ]);

        const spinner = Dom.el('div', {
            className: 'client-media-viewer__spinner',
            id: VIEWER_SPINNER_ID
        }, [
            Dom.el('div', {
                className: 'spinner-border text-light',
                role: 'status',
                'aria-label': 'Cargando'
            }),
            Dom.el('div', {
                className: 'small mt-2 text-light opacity-75',
                id: VIEWER_MSG_ID,
                text: 'Cargando...'
            })
        ]);

        const img = Dom.el('img', {
            id: VIEWER_IMG_ID,
            className: 'd-none',
            alt: ''
        });

        const body = Dom.el('div', { className: 'client-media-viewer__body' }, [
            spinner,
            img
        ]);

        const driveLink = Dom.el('a', {
            id: VIEWER_DRIVE_ID,
            className: 'btn btn-outline-light btn-sm d-none',
            target: '_blank',
            rel: 'noopener'
        }, [
            Dom.el('i', { className: 'bi bi-box-arrow-up-right' }),
            Dom.text(' Abrir en Drive')
        ]);

        const footer = Dom.el('div', { className: 'client-media-viewer__footer' }, [
            driveLink,
            Dom.el('button', {
                type: 'button',
                className: 'btn btn-light btn-sm',
                'data-cm-viewer-close': '1'
            }, 'Cerrar')
        ]);

        const dialog = Dom.el('div', {
            className: 'client-media-viewer__dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': VIEWER_TITLE_ID
        }, [header, body, footer]);

        overlay.appendChild(backdrop);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            const closeTarget = e.target && e.target.closest ? e.target.closest('[data-cm-viewer-close]') : null;
            if (closeTarget) {
                closeViewer_();
            }
        });

        if (!state.viewerKeyHandlerInstalled) {
            state.viewerKeyHandlerInstalled = true;
            document.addEventListener('keydown', function (e) {
                if (e && e.key === 'Escape') closeViewer_();
            });
        }

        return overlay;
    }

    function openViewerLoading_(title, message) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const msg = document.getElementById(VIEWER_MSG_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';
        if (msg) msg.textContent = message || 'Cargando...';
        if (drive) {
            drive.classList.add('d-none');
            drive.removeAttribute('href');
        }
        if (img) {
            img.classList.add('d-none');
            img.removeAttribute('src');
        }
        if (spinner) spinner.classList.remove('d-none');

        overlay.classList.remove('d-none');
    }

    function openViewerImage_(title, imageState) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';

        if (!imageState || !imageState.base64) return;
        const dataUrl = `data:${imageState.mimeType || 'image/jpeg'};base64,${imageState.base64 || ''}`;

        if (spinner) spinner.classList.add('d-none');
        if (img) {
            img.src = dataUrl;
            img.alt = title || 'Foto';
            img.classList.remove('d-none');
        }
        if (drive) {
            if (imageState.url) {
                drive.href = String(imageState.url);
                drive.classList.remove('d-none');
            } else {
                drive.classList.add('d-none');
                drive.removeAttribute('href');
            }
        }
        overlay.classList.remove('d-none');
    }

    function closeViewer_() {
        const overlay = document.getElementById(VIEWER_ID);
        if (!overlay) return;
        overlay.classList.add('d-none');
    }

    function buildKindCardNode_(kind) {
        const key = kind.toLowerCase();
        const meta = kind === 'FACHADA'
            ? { title: 'Fachadas', icon: 'bi-building', iconClass: 'text-primary' }
            : { title: 'Llaves', icon: 'bi-key-fill', iconClass: 'text-warning' };

        const countLabel = Dom.el('div', {
            className: 'small text-muted',
            id: `client-media-${key}-count`,
            text: '0 fotos'
        });

        const addBtn = Dom.el('button', {
            type: 'button',
            className: 'btn btn-sm btn-outline-primary lt-btn-compact d-flex align-items-center gap-1',
            'data-cm-action': 'add',
            'data-cm-kind': kind
        }, [
            Dom.el('i', { className: 'bi bi-plus-lg' }),
            Dom.el('span', { text: 'Agregar' })
        ]);

        const empty = Dom.el('div', {
            className: 'text-center text-muted small py-4 d-none',
            id: `client-media-${key}-empty`
        }, [
            Dom.el('i', { className: 'bi bi-image', style: 'font-size: 1.6rem; opacity: 0.35;' }),
            Dom.el('div', { className: 'mt-1', text: 'Sin fotos' })
        ]);

        const grid = Dom.el('div', { className: 'row g-2', id: `client-media-${key}-grid` });
        const input = Dom.el('input', {
            type: 'file',
            className: 'd-none',
            multiple: 'multiple',
            id: `client-media-${key}-add-input`,
            'data-cm-input-kind': kind
        });

        const surface = Dom.el('div', { className: 'lt-surface p-3 h-100' }, [
            Dom.el('div', { className: 'd-flex align-items-start justify-content-between gap-2' }, [
                Dom.el('div', { className: 'd-flex align-items-center gap-2' }, [
                    Dom.el('i', { className: `bi ${meta.icon} ${meta.iconClass}` }),
                    Dom.el('div', null, [
                        Dom.el('div', { className: 'fw-semibold', text: meta.title }),
                        countLabel
                    ])
                ]),
                addBtn
            ]),
            Dom.el('div', { className: 'mt-3' }, [grid, empty]),
            input
        ]);

        return Dom.el('div', { className: 'col-12 col-md-6' }, surface);
    }

    function render(containerEl) {
        if (!containerEl) return;

        const existing = document.getElementById(SECTION_ID);
        if (existing) existing.remove();

        const rec = getEditingClient_();
        const clientId = getClientIdFromRecord_(rec);

        state = {
            clientId: clientId,
            fachada: [],
            llave: [],
            viewerKeyHandlerInstalled: state.viewerKeyHandlerInstalled,
            eventsController: state.eventsController
        };

        const section = Dom.el('div', { className: 'col-12', id: SECTION_ID });

        const loadingOverlay = Dom.el('div', { className: 'client-media-loading d-none', id: LOADING_ID }, [
            Dom.el('div', { className: 'client-media-loading__backdrop' }),
            Dom.el('div', { className: 'client-media-loading__content' }, [
                Dom.el('div', {
                    className: 'spinner-border text-primary',
                    role: 'status',
                    'aria-label': 'Cargando'
                }),
                Dom.el('div', { className: 'small mt-2', id: LOADING_TEXT_ID, text: 'Procesando...' })
            ])
        ]);

        const headerIcon = Dom.el('div', {
            className: 'rounded-circle d-flex align-items-center justify-content-center',
            style: 'width: 40px; height: 40px; background: rgba(99,102,241,0.12);'
        }, Dom.el('i', { className: 'bi bi-camera-fill text-primary' }));

        const headerText = Dom.el('div', null, [
            Dom.el('div', { className: 'fw-semibold', text: 'Fotos del cliente' }),
            Dom.el('div', { className: 'small text-muted', text: 'Guardá y consultá fotos de fachada y llaves.' })
        ]);

        const chip = UI && typeof UI.chip === 'function'
            ? UI.chip([
                Dom.el('i', { className: 'bi bi-hash' }),
                Dom.el('span', { text: `ID: ${clientId || '—'}` })
            ], { variant: 'muted' })
            : Dom.el('span', { className: 'lt-chip lt-chip--muted' }, [
                Dom.el('i', { className: 'bi bi-hash' }),
                Dom.el('span', { text: `ID: ${clientId || '—'}` })
            ]);

        const header = Dom.el('div', {
            className: 'd-flex align-items-start justify-content-between flex-wrap gap-2 mb-2'
        }, [
            Dom.el('div', { className: 'd-flex align-items-center gap-3' }, [headerIcon, headerText]),
            chip
        ]);

        const notice = Dom.el('div', { id: NOTICE_ID, className: 'mb-2' });

        const row = Dom.el('div', { className: 'row g-2' }, [
            buildKindCardNode_('FACHADA'),
            buildKindCardNode_('LLAVE')
        ]);

        const panel = Dom.el('div', { className: 'lt-surface lt-surface--subtle p-3 client-media-panel' }, [
            loadingOverlay,
            header,
            notice,
            row
        ]);

        section.appendChild(panel);

        containerEl.appendChild(section);

        attachEvents_(section);

        if (clientId) {
            refresh_(clientId);
        } else {
            showNotice_('warning', 'Guardá el cliente para habilitar la carga de fotos.');
        }
    }

    function setKindCount_(kind, count) {
        const key = kind.toLowerCase();
        const el = document.getElementById(`client-media-${key}-count`);
        if (!el) return;
        el.textContent = count === 1 ? '1 foto' : `${count} fotos`;
    }

    function renderKindGrid_(kind, items) {
        const key = kind.toLowerCase();
        const grid = document.getElementById(`client-media-${key}-grid`);
        const empty = document.getElementById(`client-media-${key}-empty`);
        if (!grid || !empty) return;

        const list = Array.isArray(items) ? items : [];
        setKindCount_(kind, list.length);

        Dom.clear(grid);

        if (!list.length) {
            empty.classList.remove('d-none');
            return;
        }
        empty.classList.add('d-none');

        list.forEach((it) => {
            const thumb = it && it.thumbnailBase64 ? it.thumbnailBase64 : '';
            const mime = it && it.mimeType ? it.mimeType : 'image/jpeg';
            const fileId = it && it.fileId ? String(it.fileId) : '';
            const name = it && it.name ? String(it.name) : '';

            const dataUrl = thumb ? `data:${mime};base64,${thumb}` : '';
            const preview = dataUrl
                ? Dom.el('img', {
                    src: dataUrl,
                    alt: name || kind,
                    className: 'client-media-thumb__img',
                    'data-cm-action': 'view',
                    'data-cm-kind': kind,
                    'data-cm-file-id': fileId
                })
                : Dom.el('div', {
                    className: 'd-flex align-items-center justify-content-center text-muted small h-100',
                    text: 'Sin preview'
                });

            const deleteBtn = Dom.el('button', {
                type: 'button',
                className: 'client-media-thumb__delete',
                'data-cm-action': 'delete',
                'data-cm-kind': kind,
                'data-cm-file-id': fileId,
                title: 'Eliminar'
            }, Dom.el('i', { className: 'bi bi-trash3' }));

            const thumbInner = Dom.el('div', { className: 'client-media-thumb__inner' }, [
                preview,
                deleteBtn
            ]);

            const thumbWrap = Dom.el('div', {
                className: 'ratio ratio-4x3 bg-white border rounded-3 overflow-hidden client-media-thumb'
            }, thumbInner);

            const nameLabel = Dom.el('div', {
                className: 'small text-muted text-truncate mt-2',
                title: name
            }, [
                Dom.el('i', { className: 'bi bi-image me-1' }),
                Dom.text(name || '')
            ]);

            const card = Dom.el('div', { className: 'lt-surface p-2 h-100' }, [thumbWrap, nameLabel]);
            const col = Dom.el('div', { className: 'col-6 col-lg-4' }, card);

            grid.appendChild(col);
        });
    }

    function refresh_(clientId) {
        showNotice_('', '');
        setPanelLoading_(true, 'Cargando fotos...');
        if (!ClientMediaData || typeof ClientMediaData.listClientMedia !== 'function') {
            showNotice_('danger', 'No se pudieron cargar las fotos.');
            setPanelLoading_(false);
            return;
        }
        ClientMediaData.listClientMedia(clientId)
            .then((res) => {
                state.fachada = (res && res.fachada) ? res.fachada : [];
                state.llave = (res && res.llave) ? res.llave : [];
                renderKindGrid_('FACHADA', state.fachada);
                renderKindGrid_('LLAVE', state.llave);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'No se pudieron cargar las fotos. ' + (err && err.message ? err.message : err));
            })
            .finally(() => setPanelLoading_(false));
    }

    function attachEvents_(sectionEl) {
        if (!sectionEl) return;
        if (state.eventsController) {
            state.eventsController.abort();
        }
        state.eventsController = new AbortController();
        const signal = state.eventsController.signal;

        // Delegación de clicks
        sectionEl.addEventListener('click', function (e) {
            const target = e.target && e.target.closest ? e.target.closest('[data-cm-action]') : null;
            if (!target) return;

            const action = target.getAttribute('data-cm-action');
            const kind = String(target.getAttribute('data-cm-kind') || '').trim().toUpperCase();
            const fileId = String(target.getAttribute('data-cm-file-id') || '').trim();

            if (!state.clientId) {
                showNotice_('warning', 'Guardá el cliente para habilitar las fotos.');
                return;
            }

            if (action === 'add') {
                const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
                if (input) input.click();
                return;
            }

            if (action === 'view') {
                if (!fileId) return;
                openImageModalFromServer_(fileId);
                return;
            }

            if (action === 'delete') {
                if (!fileId) return;
                confirmDeleteFile_(fileId);
                return;
            }
        }, { signal: signal });

        // Inputs: agregar
        ['FACHADA', 'LLAVE'].forEach((kind) => {
            const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
            if (!input) return;
            input.accept = ACCEPT_IMAGE_ANY;
            input.addEventListener('change', function () {
                const files = this.files ? Array.from(this.files) : [];
                this.value = '';
                if (!files.length) return;
                uploadFiles_(state.clientId, kind, files);
            }, { signal: signal });
        });
    }

    function resizeImageToJpegBase64_(file, maxDimPx = 1600, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('El archivo no parece ser una imagen válida.'));
                img.onload = () => {
                    const w = img.naturalWidth || img.width;
                    const h = img.naturalHeight || img.height;
                    if (!w || !h) return reject(new Error('Dimensiones de imagen inválidas.'));

                    const maxSide = Math.max(w, h);
                    const scale = maxSide > maxDimPx ? (maxDimPx / maxSide) : 1;
                    const nw = Math.max(1, Math.round(w * scale));
                    const nh = Math.max(1, Math.round(h * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = nw;
                    canvas.height = nh;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('No se pudo preparar canvas.'));

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, nw, nh);
                    ctx.drawImage(img, 0, 0, nw, nh);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const base64 = String(dataUrl || '').split(',')[1] || '';
                    if (!base64) return reject(new Error('No se pudo codificar la imagen.'));

                    resolve({ base64: base64, mimeType: 'image/jpeg' });
                };
                img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
        });
    }

    async function uploadFiles_(clientId, kind, files) {
        const list = Array.isArray(files) ? files.filter(Boolean) : [];
        if (!list.length) return;

        showNotice_('', '');

        try {
            setPanelLoading_(true, `Subiendo ${list.length} foto(s)...`);
            UiState && UiState.setGlobalLoading(true, `Subiendo ${list.length} foto(s)...`);
            for (let i = 0; i < list.length; i++) {
                const label = `Subiendo foto ${i + 1}/${list.length}...`;
                setPanelLoading_(true, label);
                UiState && UiState.setGlobalLoading(true, label);
                const { base64, mimeType } = await resizeImageToJpegBase64_(list[i], 1600, 0.85);
                if (!ClientMediaData || typeof ClientMediaData.uploadClientMedia !== 'function') {
                    throw new Error('No se puede subir la foto en este momento.');
                }
                await ClientMediaData.uploadClientMedia({
                    clientId: clientId,
                    kind: kind,
                    base64: base64,
                    mimeType: mimeType,
                    replaceFileId: ''
                });
            }
            showNotice_('success', 'Fotos actualizadas.');
            refresh_(clientId);
        } catch (err) {
            console.error(err);
            showNotice_('danger', 'Error al subir foto: ' + (err && err.message ? err.message : err));
        } finally {
            setPanelLoading_(false);
            UiState && UiState.setGlobalLoading(false);
        }
    }

    function confirmDeleteFile_(fileId) {
        const doDelete = () => {
            setPanelLoading_(true, 'Eliminando foto...');
            UiState && UiState.setGlobalLoading(true, 'Eliminando foto...');
            if (!ClientMediaData || typeof ClientMediaData.deleteClientMediaFile !== 'function') {
                showNotice_('danger', 'No se pudo eliminar la foto.');
                setPanelLoading_(false);
                UiState && UiState.setGlobalLoading(false);
                return;
            }
            ClientMediaData.deleteClientMediaFile(fileId)
                .then(() => {
                    showNotice_('success', 'Foto eliminada.');
                    refresh_(state.clientId);
                })
                .catch((err) => {
                    console.error(err);
                    showNotice_('danger', 'Error al eliminar foto: ' + (err && err.message ? err.message : err));
                })
                .finally(() => {
                    setPanelLoading_(false);
                    UiState && UiState.setGlobalLoading(false);
                });
        };

        if (typeof UiDialogs !== 'undefined' && UiDialogs && typeof UiDialogs.confirm === 'function') {
            UiDialogs.confirm({
                title: 'Eliminar foto',
                message: '¿Seguro que querés eliminar esta foto?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmVariant: 'danger',
                icon: 'bi-trash3-fill',
                iconClass: 'text-danger'
            }).then((ok) => { if (ok) doDelete(); });
            return;
        }

        if (confirm('¿Seguro que querés eliminar esta foto?')) doDelete();
    }

    function openImageModalFromServer_(fileId) {
        openViewerLoading_('Foto', 'Cargando foto...');
        UiState && UiState.setGlobalLoading(true, 'Cargando foto...');
        if (!ClientMediaData || typeof ClientMediaData.getClientMediaImage !== 'function') {
            showNotice_('danger', 'No se pudo cargar la imagen.');
            closeViewer_();
            UiState && UiState.setGlobalLoading(false);
            return;
        }
        ClientMediaData.getClientMediaImage(fileId, 1600)
            .then((res) => {
                if (!res || !res.base64) {
                    showNotice_('warning', 'No se pudo cargar la imagen.');
                    closeViewer_();
                    return;
                }
                openViewerImage_('Foto', res);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'Error al cargar foto: ' + (err && err.message ? err.message : err));
                closeViewer_();
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function openImageModal_(title, state) {
        openViewerImage_(title, state);
    }

    return {
        render: render
    };
})();


(function (global) {
  const ClientTagsField = (() => {
    const FIELD_ID = "ETIQUETAS";
    const Dom = global.DomHelpers;
    const UI = global.UIHelpers;
    const ClientTagsData = global.ClientTagsData || null;

    const state = {
      available: [],
      value: [],
      hidden: null,
      chips: null,
      input: null,
      datalist: null
    };

    function normalizeTag(tag) {
      return String(tag || "").trim().replace(/\s+/g, " ");
    }

    function parseTags(value) {
      if (!value) return [];
      if (Array.isArray(value)) return value;

      const raw = String(value).trim();
      if (!raw) return [];

      if (raw[0] === "[") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // fallback
        }
      }

      return raw.split(",").map(s => s.trim()).filter(Boolean);
    }

    function uniqueTags(tags) {
      const out = [];
      const seen = new Set();
      (tags || []).forEach(t => {
        const clean = normalizeTag(t);
        if (!clean) return;
        const key = clean.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(clean);
      });
      return out;
    }

    function renderChips() {
      if (!state.chips) return;
      Dom.clear(state.chips);

      if (!state.value.length) {
        state.chips.appendChild(
          Dom.el("div", {
            className: "tag-chips__empty text-muted small",
            text: "Sin etiquetas"
          })
        );
        return;
      }

      state.value.forEach(tag => {
        const remove = Dom.el("button", {
          type: "button",
          className: "tag-chip__remove",
          "aria-label": "Quitar etiqueta",
          onclick: () => removeTag(tag)
        }, Dom.el("i", { className: "bi bi-x" }));

        const chipContent = Dom.el("span", { className: "tag-chip__label", text: tag });
        const chip = UI && typeof UI.chip === "function"
          ? UI.chip([chipContent, remove], { className: "tag-chip" })
          : Dom.el("span", { className: "tag-chip" }, [chipContent, remove]);

        state.chips.appendChild(chip);
      });
    }

    function updateHidden() {
      if (state.hidden) state.hidden.value = state.value.join(", ");
    }

    function setValue(tags) {
      state.value = uniqueTags(tags);
      updateHidden();
      renderChips();
    }

    function addTags(tags) {
      const incoming = uniqueTags(tags);
      if (!incoming.length) return;

      const current = state.value.slice();
      const merged = uniqueTags(current.concat(incoming));
      const newOnes = incoming.filter(tag => !current.some(t => t.toLowerCase() === tag.toLowerCase()));

      state.value = merged;
      updateHidden();
      renderChips();

      if (newOnes.length) {
        mergeAvailable(newOnes);
        persistTags(newOnes);
      }
    }

    function removeTag(tag) {
      const key = String(tag || "").toLowerCase();
      state.value = state.value.filter(t => t.toLowerCase() !== key);
      updateHidden();
      renderChips();
    }

    function syncFromValue() {
      if (!state.hidden) return;
      setValue(parseTags(state.hidden.value));
    }

    function reset() {
      setValue([]);
    }

    function handleInputAdd() {
      if (!state.input) return;
      const raw = state.input.value;
      const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
      if (!parts.length) return;
      addTags(parts);
      state.input.value = "";
    }

    function updateDatalist() {
      if (!state.datalist) return;
      Dom.clear(state.datalist);
      state.available.forEach(tag => {
        state.datalist.appendChild(Dom.el("option", { value: tag }));
      });
    }

    function mergeAvailable(tags) {
      state.available = uniqueTags(state.available.concat(tags));
      updateDatalist();
    }

    function loadAvailableTags() {
      if (!ClientTagsData || typeof ClientTagsData.getClientTags !== "function") {
        return;
      }

      ClientTagsData.getClientTags()
        .then(tags => {
          state.available = uniqueTags(parseTags(tags));
          updateDatalist();
        })
        .catch(() => {
          // ignore
        });
    }

    function persistTags(tags) {
      if (!ClientTagsData || typeof ClientTagsData.upsertClientTags !== "function") {
        return;
      }

      ClientTagsData.upsertClientTags(tags)
        .then(res => {
          if (Array.isArray(res)) {
            state.available = uniqueTags(parseTags(res));
            updateDatalist();
          }
        })
        .catch(() => {
          // ignore
        });
    }

    function init(container) {
      if (!container) return;
      const wrapper = container.querySelector(`[data-field-id="${FIELD_ID}"]`);
      if (!wrapper) return;

      state.hidden = wrapper.querySelector(`#field-${FIELD_ID}`);
      state.chips = wrapper.querySelector("[data-tags-chips]");
      state.input = wrapper.querySelector("[data-tags-input]");
      state.datalist = wrapper.querySelector("[data-tags-datalist]");

      if (!state.hidden || !state.chips || !state.input) return;

      const addBtn = wrapper.querySelector("[data-tags-add]");
      if (addBtn && !addBtn.dataset.tagsBound) {
        addBtn.dataset.tagsBound = "1";
        addBtn.addEventListener("click", handleInputAdd);
      }

      if (!state.input.dataset.tagsBound) {
        state.input.dataset.tagsBound = "1";
        state.input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            handleInputAdd();
          }
        });

        state.input.addEventListener("blur", handleInputAdd);
      }

      loadAvailableTags();
      syncFromValue();
    }

    return {
      init,
      syncFromValue,
      reset
    };
  })();

  global.ClientTagsField = ClientTagsField;
})(typeof window !== "undefined" ? window : this);


/**
 * SearchData
 * Capa de datos para búsqueda con cache.
 */
(function (global) {
  const SEARCH_TTL_MS = 60 * 1000;

  function ensureApi() {
    return global.ApiService && typeof global.ApiService.callLatest === "function";
  }

  function getCacheMap() {
    if (!global.ApiService || !global.ApiService.dataCache) return null;
    if (!global.ApiService.dataCache.search) {
      global.ApiService.dataCache.search = new Map();
    }
    return global.ApiService.dataCache.search;
  }

  function getCachedResults(key) {
    const cache = getCacheMap();
    if (!cache) return null;
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > SEARCH_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.results || null;
  }

  function setCachedResults(key, results) {
    const cache = getCacheMap();
    if (!cache) return;
    cache.set(key, { ts: Date.now(), results: results || [] });
  }

  function searchRecords(tipoFormato, query) {
    if (!ensureApi()) return Promise.resolve([]);
    const key = String(tipoFormato || "") + "|" + String(query || "").toLowerCase().trim();
    const cached = getCachedResults(key);
    if (cached) return Promise.resolve(cached);
    return global.ApiService.callLatest("search-" + String(tipoFormato || ""), "searchRecords", tipoFormato, query || "")
      .then((results) => {
        if (results && results.ignored) return results;
        const list = results || [];
        setCachedResults(key, list);
        return list;
      });
  }

  global.SearchData = {
    searchRecords: searchRecords,
    getCachedResults: getCachedResults,
    setCachedResults: setCachedResults
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Search Manager
 * Maneja la búsqueda de registros
 */

(function (global) {
    const SearchManager = (() => {
        let searchDebounce = null;
        let suggestionResults = [];
        let eventsController = null;
        const Dom = global.DomHelpers;
        const SearchData = global.SearchData || null;

        /**
         * Builds a preview string for a search result based on its content
         */
        function buildPreviewParts(record) {
            const parts = [];

            // Always show ID first if available
            if (record.ID) {
                parts.push({ label: "ID", value: record.ID });
            }

            // Format-specific key fields
            if (record.NOMBRE) {
                parts.push({ label: "NOMBRE", value: record.NOMBRE });
            } else if (record.EMPLEADO) {
                parts.push({ label: "EMPLEADO", value: record.EMPLEADO });
            } else if (record.CLIENTE) {
                parts.push({ label: "CLIENTE", value: record.CLIENTE });
            }

            // Additional context field
            if (!record.NOMBRE && !record.CLIENTE && record["RAZON SOCIAL"]) {
                parts.push({ label: "RAZÓN SOCIAL", value: record["RAZON SOCIAL"] });
            } else if (record["TIPO DOCUMENTO"] || record["NUMERO DOCUMENTO"]) {
                const docType = record["TIPO DOCUMENTO"] || "";
                const docNumber = record["NUMERO DOCUMENTO"] || "";
                let docLabel = "";
                if (global.InputUtils && typeof global.InputUtils.formatDocLabel === "function") {
                    docLabel = global.InputUtils.formatDocLabel(docType, docNumber);
                } else {
                    docLabel = (docType ? (docType + " ") : "") + docNumber;
                }
                if (docLabel.trim()) {
                    parts.push({ label: "DOCUMENTO", value: docLabel });
                }
            } else if (record.CUIT) {
                parts.push({ label: "CUIT", value: record.CUIT });
            } else if (record.CUIL) {
                parts.push({ label: "CUIL", value: record.CUIL });
            } else if (record.FECHA) {
                parts.push({ label: "FECHA", value: record.FECHA });
            }

            // If we don't have enough parts, add first non-ID field
            if (parts.length < 2) {
                const keys = Object.keys(record).filter(k => k !== 'ID');
                if (keys.length > 0) {
                    parts.push({ label: keys[0], value: record[keys[0]] });
                }
            }

            return parts;
        }

        function renderPreview(container, parts) {
            const frag = document.createDocumentFragment();
            parts.forEach((part, idx) => {
                if (!part) return;
                const label = String(part.label || "");
                const value = part.value == null ? "" : String(part.value);
                frag.appendChild(Dom.el("strong", { text: label + ":" }));
                frag.appendChild(Dom.text(" " + value));
                if (idx < parts.length - 1) {
                    frag.appendChild(Dom.text(" · "));
                }
            });
            container.appendChild(frag);
        }

        function handleSearch(tipoFormato, query) {
            if (searchDebounce) {
                clearTimeout(searchDebounce);
            }

            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!query || query.length < 2) {
                sugg.classList.add("d-none");
                Dom.clear(sugg);
                UiState.setGlobalLoading(false);
                return;
            }

            searchDebounce = setTimeout(function () {
                const cacheKey = String(tipoFormato || "") + "|" + String(query || "").toLowerCase().trim();
                UiState.setGlobalLoading(true, "Buscando...");
                if (!SearchData || typeof SearchData.searchRecords !== "function") {
                    UiState.setGlobalLoading(false);
                    return;
                }
                SearchData.searchRecords(tipoFormato, query)
                    .then(function (results) {
                        if (results && results.ignored) return;
                        suggestionResults = results || [];
                        renderSearchResults(suggestionResults);
                    })
                    .catch(function (err) {
                        console.error("Error en búsqueda:", err);
                        if (Alerts) Alerts.showAlert("Error al buscar: " + err.message, "danger");
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }, 300);
        }

        function renderSearchResults(results) {
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;

            if (!results.length) {
                sugg.classList.add("d-none");
                Dom.clear(sugg);
                return;
            }

            sugg.classList.remove("d-none");
            const list = Dom.el("ul", { className: "list-group list-group-flush" });

            results.slice(0, 10).forEach(function (item, idx) {
                const li = Dom.el("li", {
                    className: "list-group-item list-group-item-action p-2 cursor-pointer",
                    "data-suggestion-idx": String(idx)
                });

                // Build format-specific preview
                const previewParts = buildPreviewParts(item.record || {});
                const small = Dom.el("small");
                renderPreview(small, previewParts);
                li.appendChild(small);
                list.appendChild(li);
            });

            Dom.clear(sugg);
            sugg.appendChild(list);

            bindSuggestionClick();
        }

        function bindSuggestionClick() {
            const sugg = document.getElementById("search-suggestions");
            if (!sugg) return;
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
            sugg.addEventListener("click", function (e) {
                const li = e.target.closest("[data-suggestion-idx]");
                if (li) {
                    const idx = parseInt(li.getAttribute("data-suggestion-idx"));
                    selectSearchResult(idx);
                }
            }, { signal: eventsController.signal });
        }

        function selectSearchResult(idx) {
            if (!suggestionResults[idx]) return;

            const item = suggestionResults[idx];
            if (global.RecordManager) {
                if (item.record && item.rowNumber) {
                    item.record._rowNumber = item.rowNumber;
                }
                // Pass id instead of rowNumber
                global.RecordManager.loadRecordForEdit(item.id, item.record);
            }

            clearSearch();
        }

        function clearSearch() {
            const searchInput = document.getElementById("search-query");
            const sugg = document.getElementById("search-suggestions");

            if (searchInput) searchInput.value = "";
            if (sugg) {
                sugg.classList.add("d-none");
                Dom.clear(sugg);
            }

            suggestionResults = [];
        }

        return {
            handleSearch,
            clearSearch
        };
    })();

    global.SearchManager = SearchManager;
})(typeof window !== "undefined" ? window : this);


/**
 * Weekly Plan Templates
 */
var WeeklyPlanTemplates = (function (global) {
    const Dom = global.DomHelpers;
    const UI = global.UIHelpers;

    function createIcon(className) {
        return Dom ? Dom.el("i", { className: className }) : null;
    }

    function buildListPanel() {
        const root = Dom ? Dom.el("div") : document.createElement("div");
        if (!Dom) {
            return { root: root, tbody: null };
        }

        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" });
        header.appendChild(Dom.el("h5", { className: "mb-0", text: "Planes de Asistencia Semanal" }));

        const headerActions = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        const switchWrap = Dom.el("div", { className: "form-check form-switch mb-0" });
        const check = Dom.el("input", {
            className: "form-check-input",
            type: "checkbox",
            id: "check-active-plans"
        });
        check.checked = true;
        const checkLabel = Dom.el("label", {
            className: "form-check-label small",
            for: "check-active-plans",
            text: "Solo vigentes"
        });
        switchWrap.appendChild(check);
        switchWrap.appendChild(checkLabel);
        headerActions.appendChild(switchWrap);

        const newBtn = Dom.el("button", {
            className: "btn btn-primary btn-sm",
            id: "btn-nuevo-plan",
            type: "button"
        }, [
            createIcon("bi bi-plus-lg me-1"),
            Dom.text("Nuevo Plan")
        ]);
        headerActions.appendChild(newBtn);
        header.appendChild(headerActions);

        const card = Dom.el("div", { className: "card shadow-sm border-0" });
        const cardBody = Dom.el("div", { className: "card-body p-0" });
        const tableResponsive = Dom.el("div", { className: "table-responsive" });
        const table = Dom.el("table", { className: "table table-hover align-middle mb-0" });
        const thead = Dom.el("thead", { className: "table-light" });
        const headRow = Dom.el("tr");
        headRow.appendChild(Dom.el("th", { text: "Cliente" }));
        headRow.appendChild(Dom.el("th", { text: "Vigencia" }));
        headRow.appendChild(Dom.el("th", { className: "text-center", text: "Horas Semanales" }));
        headRow.appendChild(Dom.el("th", { text: "Días Programados" }));
        headRow.appendChild(Dom.el("th", { className: "text-end", text: "Acciones" }));
        thead.appendChild(headRow);

        const tbody = Dom.el("tbody");

        table.appendChild(thead);
        table.appendChild(tbody);
        tableResponsive.appendChild(table);
        cardBody.appendChild(tableResponsive);
        card.appendChild(cardBody);

        root.appendChild(header);
        root.appendChild(card);

        return { root: root, tbody: tbody };
    }

    function buildEditorWrapperStart(clienteLabel) {
        if (!Dom) return document.createElement("div");
        const wrapper = Dom.el("div", { className: "mt-2 p-3 lt-surface lt-surface--subtle" });
        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" });
        const info = Dom.el("div");
        const title = Dom.el("div", { className: "fw-bold mb-1 text-primary" }, [
            createIcon("bi bi-calendar-week me-1"),
            Dom.text("Plan semanal del cliente")
        ]);
        const small = Dom.el("div", { className: "small mb-2" }, [
            Dom.text("Cliente: "),
            Dom.el("strong", { className: "text-primary-emphasis", text: clienteLabel || "" })
        ]);
        info.appendChild(title);
        info.appendChild(small);
        header.appendChild(info);
        wrapper.appendChild(header);
        return wrapper;
    }

    function buildEditorWrapperEnd() {
        return null;
    }

    function buildEditorTopSection(hoursBlock) {
        if (!Dom) return document.createElement("div");
        const top = Dom.el("div", { className: "d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2" });
        top.appendChild(hoursBlock || Dom.el("div"));
        const addBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-secondary lt-btn-compact text-nowrap",
            "data-action": "add-plan-row"
        }, [
            createIcon("bi bi-plus-lg me-1"),
            Dom.text("Agregar día")
        ]);
        top.appendChild(addBtn);
        return top;
    }

    function buildEmployeeCardStart(data) {
        if (!Dom) return { card: document.createElement("div"), body: null };
        const opts = data || {};
        const card = Dom.el("div", {
            className: "card shadow-sm border-0",
            dataset: { empKey: opts.empKey || "" }
        });
        const header = Dom.el("div", {
            className: "card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 lt-clickable",
            "data-bs-toggle": "collapse",
            "data-bs-target": "#" + opts.collapseId,
            "aria-expanded": String(!!opts.isOpen),
            "aria-controls": opts.collapseId,
            role: "button"
        });

        const left = Dom.el("div", { className: "d-flex flex-wrap gap-2 align-items-center" });
        const name = Dom.el("span", { className: "fw-semibold text-dark" }, [
            createIcon("bi bi-person-circle me-1"),
            Dom.text(opts.empleadoLabel || "")
        ]);
        left.appendChild(name);
        left.appendChild(Dom.el("span", { className: "badge bg-primary bg-opacity-75", text: opts.diasLabel || "" }));
        left.appendChild(Dom.el("span", { className: "badge text-bg-success", text: (opts.totalHoras || "") + " hs totales" }));

        const right = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        right.appendChild(Dom.el("span", { className: "text-muted small", text: (opts.activeDays || 0) + " día(s)" }));
        right.appendChild(Dom.el("span", {
            className: "text-muted fw-semibold",
            dataset: { role: "collapse-arrow" },
            text: opts.arrowLabel || ""
        }));

        header.appendChild(left);
        header.appendChild(right);
        card.appendChild(header);

        const collapse = Dom.el("div", {
            id: opts.collapseId,
            className: "collapse" + (opts.isOpen ? " show" : "")
        });
        const body = Dom.el("div", { className: "card-body pt-2 pb-3 px-3" });
        collapse.appendChild(body);
        card.appendChild(collapse);

        return { card: card, body: body };
    }

    function buildEmployeeCardEnd() {
        return null;
    }

    function buildPlanRowCard(data) {
        if (!Dom) return document.createElement("div");
        const opts = data || {};
        const card = Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 mb-2" });

        const header = Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-2" });
        const left = Dom.el("div", { className: "d-flex gap-2 align-items-center" });
        left.appendChild(Dom.el("span", { className: "badge bg-primary bg-opacity-75 text-white", text: "Plan" }));
        left.appendChild(Dom.el("span", { className: "fw-semibold", text: opts.diaLabel || "" }));
        if (opts.horasLabel) {
            left.appendChild(Dom.el("span", { className: "text-muted", text: opts.horasLabel }));
        }

        const deleteBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-danger lt-btn-icon",
            "data-action": "delete-plan-row",
            "data-idx": opts.originalIdx
        }, [createIcon("bi bi-trash")]);

        header.appendChild(left);
        header.appendChild(deleteBtn);
        card.appendChild(header);

        const formRow = Dom.el("div", { className: "row g-2" });

        const colEmpleado = Dom.el("div", { className: "col-12 col-md-6" });
        colEmpleado.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Empleado" }));
        const empleadoSelect = Dom.el("select", {
            className: "form-select form-select-sm bg-white border",
            id: opts.rowId + "-empleado"
        });
        if (UI && typeof UI.renderSelect === "function") {
            UI.renderSelect(empleadoSelect, opts.empleadoOptions || [], opts.empleadoId || "", {
                includeEmpty: true,
                emptyLabel: "Seleccionar..."
            });
        }
        colEmpleado.appendChild(empleadoSelect);

        const colDia = Dom.el("div", { className: "col-6 col-md-3" });
        colDia.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Día" }));
        const diaSelect = Dom.el("select", {
            className: "form-select form-select-sm text-center bg-white border",
            id: opts.rowId + "-dia"
        });
        if (UI && typeof UI.renderSelect === "function") {
            UI.renderSelect(diaSelect, opts.diaOptions || [], opts.diaSemana || "", {
                includeEmpty: true,
                emptyLabel: "Día..."
            });
        }
        colDia.appendChild(diaSelect);

        const colHora = Dom.el("div", { className: "col-6 col-md-3" });
        colHora.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Hora entrada" }));
        colHora.appendChild(Dom.el("input", {
            type: "time",
            className: "form-control form-control-sm text-center",
            id: opts.rowId + "-horaEntrada",
            value: opts.horaEntrada || "",
            step: "1800"
        }));

        const colHoras = Dom.el("div", { className: "col-6 col-md-3" });
        colHoras.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Horas plan" }));
        colHoras.appendChild(Dom.el("input", {
            type: "number",
            step: "0.5",
            min: "0",
            className: "form-control form-control-sm text-end",
            id: opts.rowId + "-horasPlan",
            value: opts.horasPlan || ""
        }));

        const colObs = Dom.el("div", { className: "col-12 col-md-6" });
        colObs.appendChild(Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Observaciones" }));
        colObs.appendChild(Dom.el("input", {
            type: "text",
            className: "form-control form-control-sm",
            id: opts.rowId + "-obs",
            value: opts.observaciones || ""
        }));

        const hiddenId = Dom.el("input", {
            type: "hidden",
            id: opts.rowId + "-id",
            value: opts.recordId || ""
        });

        formRow.appendChild(colEmpleado);
        formRow.appendChild(colDia);
        formRow.appendChild(colHora);
        formRow.appendChild(colHoras);
        formRow.appendChild(colObs);
        formRow.appendChild(hiddenId);

        card.appendChild(formRow);
        return card;
    }

    function buildEditorFooter() {
        if (!Dom) return document.createElement("div");
        const footer = Dom.el("div", { className: "d-flex justify-content-end align-items-center gap-2 mt-3 pt-3 border-top" });
        const deleteBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-outline-danger lt-btn-compact",
            "data-action": "delete-weekly-plan",
            id: "btn-delete-weekly"
        }, [
            createIcon("bi bi-trash me-1"),
            Dom.text("Eliminar plan")
        ]);
        const btn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm btn-success lt-btn-compact",
            "data-action": "save-weekly-plan",
            id: "btn-save-weekly"
        }, [
            createIcon("bi bi-save2 me-1"),
            Dom.text("Guardar plan del cliente")
        ]);
        footer.appendChild(deleteBtn);
        footer.appendChild(btn);
        return footer;
    }

    return {
        buildListPanel: buildListPanel,
        buildEditorWrapperStart: buildEditorWrapperStart,
        buildEditorWrapperEnd: buildEditorWrapperEnd,
        buildEditorTopSection: buildEditorTopSection,
        buildEmployeeCardStart: buildEmployeeCardStart,
        buildEmployeeCardEnd: buildEmployeeCardEnd,
        buildPlanRowCard: buildPlanRowCard,
        buildEditorFooter: buildEditorFooter
    };
})(typeof window !== "undefined" ? window : this);


/**
 * WeeklyPlanPanelState
 * Estado compartido del panel de plan semanal.
 */
(function (global) {
    const Dom = global.DomHelpers || (function () {
        function text(value) {
            return document.createTextNode(value == null ? "" : String(value));
        }
        function setAttrs(el, attrs) {
            if (!attrs) return;
            Object.keys(attrs).forEach(key => {
                const val = attrs[key];
                if (val == null) return;
                if (key === "class" || key === "className") {
                    el.className = String(val);
                    return;
                }
                if (key === "text") {
                    el.textContent = String(val);
                    return;
                }
                if (key === "dataset" && typeof val === "object") {
                    Object.keys(val).forEach(dataKey => {
                        if (val[dataKey] != null) el.dataset[dataKey] = String(val[dataKey]);
                    });
                    return;
                }
                if (key === "style" && typeof val === "object") {
                    Object.keys(val).forEach(styleKey => {
                        el.style[styleKey] = val[styleKey];
                    });
                    return;
                }
                el.setAttribute(key, String(val));
            });
        }
        function append(parent, child) {
            if (!parent || child == null) return;
            if (Array.isArray(child)) {
                child.forEach(c => append(parent, c));
                return;
            }
            if (typeof child === "string" || typeof child === "number") {
                parent.appendChild(text(child));
                return;
            }
            parent.appendChild(child);
        }
        function el(tag, attrs, children) {
            const node = document.createElement(tag);
            setAttrs(node, attrs);
            append(node, children);
            return node;
        }
        function clear(el) {
            if (!el) return;
            while (el.firstChild) el.removeChild(el.firstChild);
        }
        return { el, text, clear, append };
    })();

    const formatClientLabel = (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientLabel === 'function')
        ? DomainHelpers.getClientLabel
        : function (cli) {
            return cli == null ? '' : String(cli);
        };

    const WeeklyPlanPanelState = {
        referenceData: { clientes: [], empleados: [] },
        currentContainer: null,
        allRecordsCache: [],
        currentOriginalVigencia: null,
        currentClientId: "",
        currentClientLabel: "",
        currentPlanGroups: [],
        currentPlanKey: "",
        forceNewPlan: false,
        lastInfoHoras: null,
        lastInfoHorasClientId: "",
        openGroupKeys: new Set(),
        planGroupsCache: {},
        listEventsController: null,
        detailEventsController: null,
        panelEventsController: null,
        Dom: Dom,
        formatClientLabel: formatClientLabel
    };

    WeeklyPlanPanelState.setReferenceData = function (refData) {
        WeeklyPlanPanelState.referenceData = refData || { clientes: [], empleados: [] };
    };

    WeeklyPlanPanelState.getClientNameById = function (idCliente) {
        const id = idCliente != null ? String(idCliente).trim() : '';
        if (!id) return '';
        const list = WeeklyPlanPanelState.referenceData && WeeklyPlanPanelState.referenceData.clientes
            ? WeeklyPlanPanelState.referenceData.clientes
            : [];
        const match = list.find(cli => cli && String(cli.id || '').trim() === id);
        if (!match) return '';
        if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
            return DomainHelpers.getClientDisplayName(match);
        }
        return match.nombre || match.razonSocial || '';
    };

    WeeklyPlanPanelState.getClientDefaultHoraEntrada = function (idCliente) {
        const id = idCliente != null ? String(idCliente).trim() : '';
        if (!id) return '';
        const list = WeeklyPlanPanelState.referenceData && WeeklyPlanPanelState.referenceData.clientes
            ? WeeklyPlanPanelState.referenceData.clientes
            : [];
        const match = list.find(cli => cli && String(cli.id || '').trim() === id);
        if (!match) return '';
        return match.horaEntrada || match["HORA ENTRADA"] || '';
    };

    WeeklyPlanPanelState.formatDateInput = function (value) {
        if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.formatDateInput === 'function') {
            return DomainHelpers.formatDateInput(value);
        }
        return '';
    };

    WeeklyPlanPanelState.normalizePlanKey = function (value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_');
    };

    global.WeeklyPlanPanelState = WeeklyPlanPanelState;
})(typeof window !== 'undefined' ? window : this);


/**
 * WeeklyPlanPanelData
 * Carga de datos del plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const Dom = state && state.Dom ? state.Dom : global.DomHelpers;

    function buildPlanKey(desde, hasta) {
        return String(desde || "") + "|" + String(hasta || "");
    }

    function buildPlanGroups(planRows) {
        const grouped = {};
        (planRows || []).forEach(function (row) {
            const vigDesde = state.formatDateInput(row["VIGENTE DESDE"] || row.vigDesde);
            const vigHasta = state.formatDateInput(row["VIGENTE HASTA"] || row.vigHasta);
            const key = buildPlanKey(vigDesde, vigHasta);
            if (!grouped[key]) {
                grouped[key] = {
                    key: key,
                    vigDesde: vigDesde,
                    vigHasta: vigHasta,
                    rows: []
                };
            }
            grouped[key].rows.push(row);
        });

        const today = new Date().toISOString().split('T')[0];
        const list = Object.keys(grouped).map(function (key) {
            const group = grouped[key];
            group.isActive = (!group.vigDesde || group.vigDesde <= today) && (!group.vigHasta || group.vigHasta >= today);
            return group;
        });

        list.sort(function (a, b) {
            if (a.isActive !== b.isActive) {
                return a.isActive ? -1 : 1;
            }
            const aDesde = a.vigDesde || "";
            const bDesde = b.vigDesde || "";
            if (aDesde === bDesde) {
                return (a.vigHasta || "").localeCompare(b.vigHasta || "");
            }
            return bDesde.localeCompare(aDesde);
        });

        return list;
    }

    function findDefaultGroup(groups) {
        if (!groups || !groups.length) return null;
        const active = groups.find(function (g) { return g.isActive; });
        return active || groups[0] || null;
    }

    function cloneRowForNewPlan(row) {
        return Object.assign({}, row, {
            ID: "",
            id: "",
            vigDesde: "",
            vigHasta: ""
        });
    }

    function fetchWeeklyPlanForClient() {
        const container = document.getElementById("plan-semanal-cards-container");
        const clienteSelect = document.getElementById("field-CLIENTE");
        const targetId = container ? "plan-semanal-cards-container" : "plan-semanal-panel";

        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const idCliente = clienteSelect.value;
        const cliente = selectedOption ? selectedOption.textContent : '';
        if (!idCliente) {
            if (container) {
                if (Dom && typeof Dom.clear === 'function') {
                    Dom.clear(container);
                } else {
                    container.textContent = '';
                }
            }
            return;
        }

        UiState.renderLoading(
            targetId,
            "",
            "Cargando plan de " + cliente + "..."
        );

        global.ApiService.callLatest('weekly-plan-' + idCliente, 'getWeeklyPlanForClient', '', idCliente)
            .then(function (rows) {
                if (rows && rows.ignored) return;
                const planRows = Array.isArray(rows) ? rows : [];
                const currentClienteEl = document.getElementById("field-CLIENTE");
                const currentOption = currentClienteEl && currentClienteEl.selectedOptions ? currentClienteEl.selectedOptions[0] : null;
                const selectedId = currentClienteEl ? currentClienteEl.value : '';
                const currentCliente = currentOption ? currentOption.textContent : '';
                if (!selectedId || selectedId !== idCliente) return;

                state.currentClientId = selectedId;
                state.currentClientLabel = currentCliente;

                const planGroups = buildPlanGroups(planRows);
                state.currentPlanGroups = planGroups;

                let rowsToRender = [];
                if (!planGroups.length) {
                    state.currentOriginalVigencia = null;
                    state.currentPlanKey = "";
                    state.forceNewPlan = true;
                } else if (state.forceNewPlan) {
                    const baseGroup = findDefaultGroup(planGroups);
                    rowsToRender = baseGroup ? baseGroup.rows.map(cloneRowForNewPlan) : [];
                    state.currentOriginalVigencia = null;
                    state.currentPlanKey = "";
                } else {
                    const keyFromState = state.currentPlanKey ||
                        (state.currentOriginalVigencia ? buildPlanKey(state.currentOriginalVigencia.desde, state.currentOriginalVigencia.hasta) : "");
                    const selectedGroup = planGroups.find(function (g) { return g.key === keyFromState; }) || findDefaultGroup(planGroups);
                    if (selectedGroup) {
                        state.currentPlanKey = selectedGroup.key;
                        state.currentOriginalVigencia = { desde: selectedGroup.vigDesde, hasta: selectedGroup.vigHasta };
                        rowsToRender = selectedGroup.rows;
                    }
                }

                state.lastInfoHorasClientId = idCliente;

                return global.ApiService.callLatest('weekly-hours-' + idCliente, 'getClientWeeklyRequestedHours', currentCliente, idCliente)
                    .then(function (infoHoras) {
                        if (infoHoras && infoHoras.ignored) return;
                        state.lastInfoHoras = infoHoras || null;
                        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === 'function') {
                            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, currentCliente, infoHoras || null);
                        }
                    })
                    .catch(function (err2) {
                        if (Alerts && Alerts.notifyError) {
                            Alerts.notifyError('Error obteniendo info horas', err2, { silent: true });
                        } else {
                            console.warn('Error obteniendo info horas:', err2);
                        }
                        state.lastInfoHoras = null;
                        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === 'function') {
                            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, currentCliente, null);
                        }
                    });
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error cargando plan semanal', err);
                } else if (Alerts && Alerts.showError) {
                    Alerts.showError('Error cargando plan semanal', err);
                } else {
                    console.error('Error cargando plan:', err);
                }
            });
    }

    function normalizePlanRecord(item) {
        const r = item && item.record ? item.record : (item || {});
        const idCliente = r.ID_CLIENTE || r.idCliente || "";
        const idEmpleado = r.ID_EMPLEADO || r.idEmpleado || "";
        if (!idCliente || !idEmpleado) return null;

        let clienteName = state.getClientNameById ? state.getClientNameById(idCliente) : "";
        if (!clienteName) {
            clienteName = r.cliente || r.CLIENTE || r.Cliente || "";
        }
        if (typeof clienteName === "object" && clienteName !== null) {
            if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientDisplayName === "function") {
                clienteName = DomainHelpers.getClientDisplayName(clienteName);
            } else {
                clienteName = clienteName.nombre || clienteName.razonSocial || clienteName.toString();
            }
        }

        const vigDesde = state.formatDateInput(r["VIGENTE DESDE"] || r.vigDesde);
        const vigHasta = state.formatDateInput(r["VIGENTE HASTA"] || r.vigHasta);
        const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
        const horas = parseFloat(horasValue);
        const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

        return {
            id: r.ID || r.id,
            cliente: clienteName || "",
            idCliente: idCliente || "",
            empleado: r.EMPLEADO || r.empleado || r.Empleado,
            idEmpleado: idEmpleado || "",
            diaSemana: dia,
            horaEntrada: r["HORA ENTRADA"] || r.HORA_ENTRADA || r.horaEntrada,
            horasPlan: horas,
            observaciones: r.OBSERVACIONES || r.observaciones,
            vigDesde: vigDesde,
            vigHasta: vigHasta,
            originalRecord: r
        };
    }

    function matchesVigencia(rowDesde, rowHasta, targetDesde, targetHasta) {
        const rowFrom = rowDesde || "";
        const rowTo = rowHasta || "";
        const targetFrom = targetDesde || "";
        const targetTo = targetHasta || "";
        if (!targetFrom && !targetTo) {
            return !rowFrom && !rowTo;
        }
        return rowFrom === targetFrom && rowTo === targetTo;
    }

    function fetchPlanRowsByVigencia(idCliente, originalVigencia) {
        if (!global.AttendanceService || typeof global.AttendanceService.searchRecords !== "function") {
            return Promise.resolve([]);
        }
        const targetId = idCliente != null ? String(idCliente).trim() : "";
        if (!targetId) return Promise.resolve([]);

        const rawDesde = originalVigencia
            ? (originalVigencia.desde || originalVigencia.vigDesde || originalVigencia["VIGENTE DESDE"] || "")
            : "";
        const rawHasta = originalVigencia
            ? (originalVigencia.hasta || originalVigencia.vigHasta || originalVigencia["VIGENTE HASTA"] || "")
            : "";
        const targetDesde = state.formatDateInput(rawDesde);
        const targetHasta = state.formatDateInput(rawHasta);

        return global.AttendanceService.searchRecords("ASISTENCIA_PLAN", "")
            .then(function (records) {
                if (records && records.ignored) return [];
                const list = Array.isArray(records) ? records : [];
                const rows = [];
                list.forEach(function (item) {
                    const normalized = normalizePlanRecord(item);
                    if (!normalized) return;
                    if (String(normalized.idCliente || "").trim() !== targetId) return;
                    const rowDesde = state.formatDateInput(normalized.vigDesde);
                    const rowHasta = state.formatDateInput(normalized.vigHasta);
                    if (!matchesVigencia(rowDesde, rowHasta, targetDesde, targetHasta)) return;
                    rows.push(normalized);
                });
                return rows;
            });
    }

    function fetchWeeklyHours(clienteLabel, idCliente) {
        return global.ApiService.callLatest('weekly-hours-' + idCliente, 'getClientWeeklyRequestedHours', clienteLabel, idCliente);
    }

    function ensureReferenceData() {
        if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== 'function') {
            console.warn('ReferenceService.ensureLoaded no disponible');
            return Promise.resolve(state.referenceData || {});
        }
        return global.ReferenceService.ensureLoaded()
            .then(() => {
                const ref = global.ReferenceService.get();
                if (ref) state.referenceData = ref;
                return ref || {};
            })
            .catch((err) => {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error cargando referencias', err, { silent: true });
                } else {
                    console.warn('Error cargando referencia:', err);
                }
                return state.referenceData || {};
            });
    }

    function reloadList() {
        if (!state.currentContainer) return;
        if (typeof EmptyState !== 'undefined' && EmptyState) {
            EmptyState.render(state.currentContainer, { variant: 'loading', message: 'Actualizando lista...' });
        } else {
            state.currentContainer.textContent = 'Actualizando lista...';
        }
        AttendanceService.searchRecords("ASISTENCIA_PLAN", "")
            .then(function (records) {
                if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.renderList === 'function') {
                    global.WeeklyPlanPanelRender.renderList(state.currentContainer, records || []);
                }
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError('Error al actualizar la lista', err, { container: state.currentContainer });
                } else {
                    console.error("Error recargando lista:", err);
                    if (state.currentContainer) {
                        if (typeof EmptyState !== 'undefined' && EmptyState) {
                            EmptyState.render(state.currentContainer, {
                                variant: 'error',
                                title: 'Error al actualizar',
                                message: 'No se pudo actualizar la lista.'
                            });
                        } else {
                            state.currentContainer.textContent = 'Error al actualizar la lista.';
                        }
                    }
                }
            });
    }

    function saveWeeklyPlan(cliente, items, originalVigencia, idCliente) {
        return AttendanceService.saveWeeklyPlanForClient(cliente, items, originalVigencia, idCliente);
    }

    global.WeeklyPlanPanelData = {
        fetchWeeklyPlanForClient: fetchWeeklyPlanForClient,
        fetchPlanRowsByVigencia: fetchPlanRowsByVigencia,
        fetchWeeklyHours: fetchWeeklyHours,
        ensureReferenceData: ensureReferenceData,
        reloadList: reloadList,
        saveWeeklyPlan: saveWeeklyPlan
    };
})(typeof window !== "undefined" ? window : this);


/**
 * WeeklyPlanPanelRender
 * Render del panel de plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const Dom = state && state.Dom ? state.Dom : null;
    const UI = global.UIHelpers;
    const formatClientLabel = state && state.formatClientLabel ? state.formatClientLabel : (v => v || '');
    const WEEK_DAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

    function buildPlanSelector() {
        if (!Dom) return null;
        const plans = state.currentPlanGroups || [];
        if (!plans.length) return null;

        const wrapper = Dom.el("div", { className: "lt-surface lt-surface--subtle p-3 mb-3" });
        const header = Dom.el("div", { className: "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2" });
        header.appendChild(Dom.el("div", { className: "small text-muted fw-semibold", text: "Planes del cliente" }));

        const newBtn = Dom.el("button", {
            type: "button",
            className: "btn btn-sm " + (state.forceNewPlan ? "btn-primary" : "btn-outline-primary"),
            "data-action": "new-weekly-plan-client"
        }, [
            Dom.el("i", { className: "bi bi-plus-lg me-1" }),
            Dom.text("Nuevo plan")
        ]);
        header.appendChild(newBtn);
        wrapper.appendChild(header);

        const list = Dom.el("div", { className: "d-flex flex-wrap gap-2" });
        const today = new Date().toISOString().split('T')[0];

        plans.forEach(plan => {
            if (!plan) return;
            const label = (plan.vigDesde || "Inicio") + " -> " + (plan.vigHasta || "Fin");
            const isSelected = !state.forceNewPlan && plan.key === state.currentPlanKey;
            const isActive = plan.isActive != null
                ? plan.isActive
                : ((!plan.vigDesde || plan.vigDesde <= today) && (!plan.vigHasta || plan.vigHasta >= today));
            const btn = Dom.el("button", {
                type: "button",
                className: "btn btn-sm " + (isSelected ? "btn-primary" : "btn-outline-primary"),
                title: isActive ? "Plan vigente" : "Plan inactivo",
                dataset: { action: "select-weekly-plan", planKey: plan.key }
            }, Dom.text(label));
            list.appendChild(btn);
        });

        wrapper.appendChild(list);
        return wrapper;
    }

    function buildEmployeeOptions() {
        const opts = [];
        const empleados = state.referenceData && state.referenceData.empleados ? state.referenceData.empleados : [];
        empleados.forEach(emp => {
            if (!emp) return;
            const label = typeof emp === 'string'
                ? String(emp)
                : (emp.nombre || emp.empleado || emp.label || '');
            const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id) : '';
            if (!id || !label) return;
            opts.push({ value: id, label: label, dataset: { name: label } });
        });
        return opts;
    }

    function buildDayOptions() {
        return WEEK_DAYS.map(day => ({ value: day, label: day }));
    }

    function buildHorasBlock(infoHoras) {
        if (!Dom) return document.createElement("div");
        if (!infoHoras) return Dom.el("div");

        const partes = [];
        const pushIfHours = (label, value) => {
            const num = Number(value || 0);
            if (num > 0) {
                partes.push({ label: label, horas: num });
            }
        };

        pushIfHours('Lu', infoHoras.lunes);
        pushIfHours('Ma', infoHoras.martes);
        pushIfHours('Mi', infoHoras.miercoles);
        pushIfHours('Ju', infoHoras.jueves);
        pushIfHours('Vi', infoHoras.viernes);
        pushIfHours('Sa', infoHoras.sabado);
        pushIfHours('Do', infoHoras.domingo);

        if (!partes.length) return Dom.el("div");

        const wrapper = Dom.el("div", {
            className: "lt-surface lt-surface--subtle p-2 flex-grow-1 border-start border-success border-3"
        });
        wrapper.appendChild(Dom.el("div", {
            className: "small fw-semibold text-muted mb-1",
            text: "Horas contratadas por día"
        }));
        const chips = Dom.el("div", { className: "d-flex flex-wrap gap-1" });
        partes.forEach(part => {
            if (UI && typeof UI.chip === "function") {
                chips.appendChild(UI.chip(`${part.label}: ${part.horas} hs`, { variant: "success" }));
            } else {
                chips.appendChild(Dom.el("span", {
                    className: "lt-chip lt-chip--success",
                    text: `${part.label}: ${part.horas} hs`
                }));
            }
        });
        wrapper.appendChild(chips);
        return wrapper;
    }

    function renderList(container, records) {
        state.currentContainer = container;
        state.allRecordsCache = records || [];
        state.planGroupsCache = {};
        state.openGroupKeys = new Set();

        if (!container || !Dom) return;

        const grouped = {};
        state.allRecordsCache.forEach(item => {
            const r = item.record || item;
            const idCliente = r.ID_CLIENTE || r.idCliente || "";
            const idEmpleado = r.ID_EMPLEADO || r.idEmpleado || "";
            if (!idCliente || !idEmpleado) return;

            let clienteName = state.getClientNameById(idCliente) || r.cliente || r.CLIENTE || r.Cliente;
            if (typeof clienteName === 'object' && clienteName !== null) {
                if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
                    clienteName = DomainHelpers.getClientDisplayName(clienteName);
                } else {
                    clienteName = clienteName.nombre || clienteName.razonSocial || clienteName.toString();
                }
            }

            const cliente = clienteName || "Sin asignar";
            const vigDesde = state.formatDateInput(r["VIGENTE DESDE"] || r.vigDesde);
            const vigHasta = state.formatDateInput(r["VIGENTE HASTA"] || r.vigHasta);
            const clienteKey = `id:${idCliente}`;
            const key = `${clienteKey}|${vigDesde}|${vigHasta}`;

            if (!grouped[key]) {
                grouped[key] = {
                    cliente: cliente,
                    idCliente: idCliente || "",
                    vigDesde: vigDesde,
                    vigHasta: vigHasta,
                    horasTotales: 0,
                    diasActivos: 0,
                    dias: new Set(),
                    rows: []
                };
            }

            const horasValue = r["HORAS PLAN"] || r.HORAS_PLAN || r.horasPlan || 0;
            const horas = parseFloat(horasValue);
            const dia = r["DIA SEMANA"] || r.DIA_SEMANA || r.diaSemana || r["DÍA DE LA SEMANA"];

            const normalizedRow = {
                id: r.ID || r.id,
                cliente: cliente,
                idCliente: idCliente || "",
                empleado: r.EMPLEADO || r.empleado || r.Empleado,
                idEmpleado: idEmpleado || "",
                diaSemana: dia,
                horaEntrada: r["HORA ENTRADA"] || r.HORA_ENTRADA || r.horaEntrada,
                horasPlan: horas,
                observaciones: r.OBSERVACIONES || r.observaciones,
                vigDesde: vigDesde,
                vigHasta: vigHasta,
                originalRecord: r
            };

            grouped[key].horasTotales += horas;
            grouped[key].diasActivos++;
            if (dia) grouped[key].dias.add(dia);
            grouped[key].rows.push(normalizedRow);
        });

        const listaClientes = Object.values(grouped);

        if (typeof WeeklyPlanTemplates === "undefined" || !WeeklyPlanTemplates || typeof WeeklyPlanTemplates.buildListPanel !== "function") {
            console.error("WeeklyPlanTemplates no disponible");
            return;
        }

        Dom.clear(container);
        const listPanel = WeeklyPlanTemplates.buildListPanel();
        if (!listPanel || !listPanel.root) return;
        container.appendChild(listPanel.root);
        const tbody = listPanel.tbody;
        if (!tbody) return;
        Dom.clear(tbody);

        if (listaClientes.length === 0) {
            const cell = Dom.el('td', { colSpan: '5', className: 'py-4' });
            const wrapper = Dom.el('div');
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(wrapper, { variant: 'empty', title: 'Sin planes', message: 'No hay planes registrados.' });
            } else {
                wrapper.appendChild(Dom.el('div', { className: 'text-center text-muted', text: 'No hay planes registrados.' }));
            }
            cell.appendChild(wrapper);
            tbody.appendChild(Dom.el('tr', {}, [cell]));
        } else {
            const today = new Date().toISOString().split('T')[0];

            listaClientes.forEach(item => {
                if (!item.idCliente) return;
                const isActive = (!item.vigDesde || item.vigDesde <= today) && (!item.vigHasta || item.vigHasta >= today);
                const diasStr = Array.from(item.dias).join(', ');
                const vigenciaStr = (item.vigDesde || 'Inicio') + ' ➡ ' + (item.vigHasta || 'Fin');
                const badgeClass = isActive ? 'bg-success' : 'bg-secondary';
                const textClass = isActive ? 'fw-semibold' : '';
                const keyBase = `id:${item.idCliente}`;
                const key = `${keyBase}|${item.vigDesde}|${item.vigHasta}`;

                state.planGroupsCache[key] = item.rows;

                const row = Dom.el('tr', {
                    className: 'plan-row',
                    dataset: { active: String(isActive) },
                    style: isActive ? null : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                });

                row.appendChild(Dom.el('td', { className: textClass, text: item.cliente }));
                row.appendChild(Dom.el('td', { className: 'small', text: vigenciaStr }));
                row.appendChild(
                    Dom.el('td', { className: 'text-center' }, [
                        Dom.el('span', {
                            className: `badge ${badgeClass} rounded-pill`,
                            text: `${item.horasTotales.toFixed(1)} hs`
                        })
                    ])
                );
                row.appendChild(Dom.el('td', { className: 'small', text: diasStr || '-' }));

                const actions = Dom.el('td', { className: 'text-end' });
                const editBtn = Dom.el('button', {
                    type: 'button',
                    className: 'btn btn-sm btn-outline-primary me-1 btn-editar-plan',
                    dataset: {
                        key: key,
                        idCliente: item.idCliente,
                        clienteLabel: item.cliente
                    }
                }, [
                    Dom.el('i', { className: 'bi bi-pencil-square me-1' }),
                    Dom.text('Editar')
                ]);
                actions.appendChild(editBtn);
                row.appendChild(actions);
                tbody.appendChild(row);
            });
        }

        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachListEvents === 'function') {
            global.WeeklyPlanPanelHandlers.attachListEvents(container);
        }
    }

    function render(container) {
        state.currentContainer = container;
        if (!container || !Dom) return;
        state.forceNewPlan = false;
        state.openGroupKeys = new Set();

        if ((!state.referenceData.clientes || !state.referenceData.clientes.length)
            && global.WeeklyPlanPanelData
            && typeof global.WeeklyPlanPanelData.ensureReferenceData === 'function') {
            global.WeeklyPlanPanelData.ensureReferenceData().then(() => {
                if (state.currentContainer === container) {
                    render(container);
                }
            });
            return;
        }

        Dom.clear(container);

        const panel = Dom.el("div", { id: "plan-semanal-panel", className: "d-flex flex-column gap-3" });

        const selectorDiv = Dom.el("div", { className: "card shadow-sm p-3" });
        const row = Dom.el("div", { className: "row g-3 align-items-end" });
        const clientCol = Dom.el("div", { className: "col-12 col-md-6" });
        clientCol.appendChild(Dom.el("label", { className: "form-label fw-bold mb-1", text: "Cliente" }));
        const select = Dom.el("select", { id: "field-CLIENTE", className: "form-select" });
        populateClienteOptions(select);
        clientCol.appendChild(select);
        row.appendChild(clientCol);

        const desdeCol = Dom.el("div", { className: "col-6 col-md-3" });
        desdeCol.appendChild(Dom.el("label", { className: "form-label small text-muted fw-semibold mb-1", text: "Vigente desde" }));
        desdeCol.appendChild(Dom.el("input", { type: "date", id: "plan-vig-desde", className: "form-control" }));
        row.appendChild(desdeCol);

        const hastaCol = Dom.el("div", { className: "col-6 col-md-3" });
        hastaCol.appendChild(Dom.el("label", { className: "form-label small text-muted fw-semibold mb-1", text: "Vigente hasta" }));
        hastaCol.appendChild(Dom.el("input", { type: "date", id: "plan-vig-hasta", className: "form-control" }));
        row.appendChild(hastaCol);

        selectorDiv.appendChild(row);
        panel.appendChild(selectorDiv);

        const cardsContainer = Dom.el("div", { id: "plan-semanal-cards-container" });
        panel.appendChild(cardsContainer);

        container.appendChild(panel);

        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachDetailEvents === 'function') {
            global.WeeklyPlanPanelHandlers.attachDetailEvents();
        }
    }

    function populateClienteOptions(select) {
        if (!select || !Dom) return;
        Dom.clear(select);
        select.appendChild(Dom.el("option", { value: "", text: "Seleccioná un cliente..." }));
        state.referenceData.clientes.forEach(c => {
            if (!c || typeof c !== 'object' || c.id == null) return;
            const label = formatClientLabel(c);
            const id = String(c.id);
            if (!label || !id) return;
            select.appendChild(Dom.el("option", { value: id, text: label }));
        });
    }

    function buildWeeklyPlanPanel(rows, cliente, infoHoras) {
        let panel = document.getElementById("plan-semanal-cards-container");
        if (!panel) panel = document.getElementById("plan-semanal-panel");
        if (!panel || !Dom) return;
        if (typeof WeeklyPlanTemplates === "undefined" || !WeeklyPlanTemplates || typeof WeeklyPlanTemplates.buildEditorTopSection !== "function") {
            console.error("WeeklyPlanTemplates no disponible");
            return;
        }

        const modalFooter = document.querySelector('.modal-footer-custom');
        if (modalFooter) modalFooter.style.display = 'none';

        const clienteSelect = document.getElementById("field-CLIENTE");
        const clienteId = clienteSelect ? clienteSelect.value : "";
        const effectiveInfoHoras = infoHoras || (clienteId && clienteId === state.lastInfoHorasClientId ? state.lastInfoHoras : null);
        const defaultHoraEntrada = state.getClientDefaultHoraEntrada
            ? state.getClientDefaultHoraEntrada(clienteId)
            : "";

        const defaultVigDesde = state.forceNewPlan
            ? ""
            : (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigDesdeInputVal
                ? global.WeeklyPlanPanelHandlers.vigDesdeInputVal()
                : "");
        const defaultVigHasta = state.forceNewPlan
            ? ""
            : (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigHastaInputVal
                ? global.WeeklyPlanPanelHandlers.vigHastaInputVal()
                : "");

        if (!rows.length) {
            rows = [{
                empleado: "",
                diaSemana: "",
                horaEntrada: defaultHoraEntrada || "",
                horasPlan: "",
                vigDesde: defaultVigDesde,
                vigHasta: defaultVigHasta,
                id: "",
                observaciones: ""
            }];
        }
        if (defaultHoraEntrada) {
            rows = rows.map(r => {
                if (r && r.horaEntrada) return r;
                return Object.assign({}, r, { horaEntrada: defaultHoraEntrada });
            });
        }
        const vigDesdeVal = state.forceNewPlan
            ? ""
            : state.formatDateInput(rows[0].vigDesde || (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigDesdeInputVal ? global.WeeklyPlanPanelHandlers.vigDesdeInputVal() : ''));
        const vigHastaVal = state.forceNewPlan
            ? ""
            : state.formatDateInput(rows[0].vigHasta || (global.WeeklyPlanPanelHandlers && global.WeeklyPlanPanelHandlers.vigHastaInputVal ? global.WeeklyPlanPanelHandlers.vigHastaInputVal() : ''));

        const groupedByEmpleado = {};
        rows.forEach((r, idx) => {
            const empName = r.empleado || "Sin asignar";
            const empId = r.idEmpleado != null && r.idEmpleado !== '' ? String(r.idEmpleado) : '';
            const key = empId ? `id:${empId}` : 'sin-id';
            if (!groupedByEmpleado[key]) {
                groupedByEmpleado[key] = { label: empName, id: empId, rows: [] };
            }
            groupedByEmpleado[key].rows.push(Object.assign({}, r, { originalIdx: idx }));
        });

        const needsWrapper = panel.id === "plan-semanal-panel";
        Dom.clear(panel);

        const container = needsWrapper
            ? WeeklyPlanTemplates.buildEditorWrapperStart(String(cliente || ""))
            : panel;

        const hoursBlock = buildHorasBlock(effectiveInfoHoras);
        const planSelector = buildPlanSelector();
        if (planSelector) {
            container.appendChild(planSelector);
        }

        const topSection = WeeklyPlanTemplates.buildEditorTopSection(hoursBlock);
        container.appendChild(topSection);

        const cardsContainer = Dom.el("div", { id: "weekly-plan-cards", className: "d-flex flex-column gap-3" });
        container.appendChild(cardsContainer);

        const employeeOptions = buildEmployeeOptions();
        const dayOptions = buildDayOptions();

        Object.keys(groupedByEmpleado).forEach((key) => {
            const group = groupedByEmpleado[key];
            const empleado = group.label;
            const empleadoRows = group.rows;
            const collapseId = "plan-emp-" + state.normalizePlanKey(key);
            const totalHoras = empleadoRows.reduce((sum, r) => sum + (parseFloat(r.horasPlan) || 0), 0);
            const activeDays = empleadoRows.length;

            const diasList = [...new Set(empleadoRows.map(r => r.diaSemana).filter(Boolean))].join(", ");
            const diasLabel = diasList || (empleadoRows.length + ' día' + (empleadoRows.length !== 1 ? 's' : ''));

            const isSinAsignar = empleado === "Sin asignar";
            const hasOpenState = state.openGroupKeys && state.openGroupKeys.size > 0;
            const isOpen = hasOpenState ? state.openGroupKeys.has(key) : isSinAsignar;

            const cardInfo = WeeklyPlanTemplates.buildEmployeeCardStart({
                empKey: key,
                collapseId: collapseId,
                isOpen: isOpen,
                empleadoLabel: empleado,
                diasLabel: diasLabel,
                totalHoras: totalHoras.toFixed(1),
                activeDays: activeDays,
                arrowLabel: isOpen ? '▲' : '▼'
            });

            if (!cardInfo || !cardInfo.card || !cardInfo.body) return;

            empleadoRows.forEach((r) => {
                const rowId = "plan-row-" + r.originalIdx;
                const horaFormatted = HtmlHelpers.formatHoraEntradaForInput(r.horaEntrada);
                const horasValue = r.horasPlan != null && r.horasPlan !== '' ? String(r.horasPlan) : '';
                const horasLabel = horasValue ? `• ${horasValue} hs` : '';
                const rowCard = WeeklyPlanTemplates.buildPlanRowCard({
                    rowId: rowId,
                    diaLabel: r.diaSemana || 'Día no seleccionado',
                    horasLabel: horasLabel,
                    originalIdx: r.originalIdx,
                    empleadoOptions: employeeOptions,
                    diaOptions: dayOptions,
                    empleadoId: r.idEmpleado || '',
                    diaSemana: r.diaSemana || '',
                    horaEntrada: horaFormatted,
                    horasPlan: horasValue,
                    observaciones: r.observaciones || '',
                    recordId: r.id || ''
                });
                cardInfo.body.appendChild(rowCard);
            });

            cardsContainer.appendChild(cardInfo.card);
        });

        container.appendChild(WeeklyPlanTemplates.buildEditorFooter());
        if (needsWrapper) {
            panel.appendChild(container);
        }

        const vigDesdeInput = document.getElementById('plan-vig-desde');
        const vigHastaInput = document.getElementById('plan-vig-hasta');
        if (vigDesdeInput && rows[0]) {
            vigDesdeInput.value = state.forceNewPlan ? "" : state.formatDateInput(rows[0].vigDesde || vigDesdeVal);
        }
        if (vigHastaInput && rows[0]) {
            vigHastaInput.value = state.forceNewPlan ? "" : state.formatDateInput(rows[0].vigHasta || vigHastaVal);
        }

        bindWeeklyPlanCollapseArrows();
        if (global.WeeklyPlanPanelHandlers && typeof global.WeeklyPlanPanelHandlers.attachWeeklyPlanHandlers === 'function') {
            global.WeeklyPlanPanelHandlers.attachWeeklyPlanHandlers(panel);
        }
    }

    function bindWeeklyPlanCollapseArrows() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const collapses = panel.querySelectorAll(".collapse");
        collapses.forEach(function (col) {
            const targetId = col.id;
            const header = panel.querySelector(`[data-bs-target="#${targetId}"]`);
            if (!header) return;
            const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
            if (!arrowEl) return;

            const updateArrow = function () {
                const isShown = col.classList.contains("show");
                arrowEl.textContent = isShown ? "▲" : "▼";
                header.setAttribute("aria-expanded", isShown ? "true" : "false");
            };

            col.addEventListener("shown.bs.collapse", updateArrow);
            col.addEventListener("hidden.bs.collapse", updateArrow);
            updateArrow();
        });
    }

    global.WeeklyPlanPanelRender = {
        renderList: renderList,
        render: render,
        buildWeeklyPlanPanel: buildWeeklyPlanPanel,
        populateClienteOptions: populateClienteOptions
    };
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const state = global.WeeklyPlanPanelState;

    function init(refData) {
        state.referenceData = refData || { clientes: [], empleados: [] };
    }

    function setup() {
        const container = document.getElementById("form-fields");
        if (container && global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }
    }

    function captureOpenGroupKeys() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) {
            state.openGroupKeys = new Set();
            return;
        }
        const open = new Set();
        panel.querySelectorAll("[data-emp-key]").forEach(card => {
            const key = card.getAttribute("data-emp-key") || "";
            const collapse = card.querySelector(".collapse");
            if (collapse && collapse.classList.contains("show")) {
                open.add(key);
            }
        });
        state.openGroupKeys = open;
    }

    function vigDesdeInputVal() {
        const el = document.getElementById("plan-vig-desde");
        return el ? el.value : "";
    }

    function vigHastaInputVal() {
        const el = document.getElementById("plan-vig-hasta");
        return el ? el.value : "";
    }

    function getInfoHorasForClient(clienteId) {
        const id = clienteId != null ? String(clienteId).trim() : "";
        if (!id) return null;
        return id === state.lastInfoHorasClientId ? state.lastInfoHoras : null;
    }

    function resolveInfoHorasForClient(clienteId, infoHoras) {
        const id = clienteId != null ? String(clienteId).trim() : "";
        if (infoHoras != null) {
            state.lastInfoHoras = infoHoras;
            state.lastInfoHorasClientId = id;
            return infoHoras;
        }
        if (id && state.lastInfoHorasClientId === id) {
            return state.lastInfoHoras;
        }
        state.lastInfoHoras = null;
        state.lastInfoHorasClientId = id;
        return null;
    }

    function switchToDetail(clienteId, clienteLabel, preloadedRows, originalVigencia) {
        const container = state.currentContainer;
        if (!container) return;

        state.currentOriginalVigencia = originalVigencia || null;
        if (originalVigencia) {
            const desde = originalVigencia.desde || "";
            const hasta = originalVigencia.hasta || "";
            state.currentPlanKey = String(desde) + "|" + String(hasta);
        } else {
            state.currentPlanKey = "";
        }
        state.currentClientId = String(clienteId || "");
        state.currentClientLabel = String(clienteLabel || "");
        state.forceNewPlan = false;
        state.openGroupKeys = new Set();
        if (state.planGroupsCache && clienteId) {
            const prefix = "id:" + String(clienteId).trim() + "|";
            const cachedGroups = [];
            Object.keys(state.planGroupsCache).forEach(function (key) {
                if (key.indexOf(prefix) !== 0) return;
                const parts = key.split("|");
                cachedGroups.push({
                    key: key,
                    vigDesde: parts[1] || "",
                    vigHasta: parts[2] || "",
                    rows: state.planGroupsCache[key] || []
                });
            });
            state.currentPlanGroups = cachedGroups;
        }

        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }

        const select = document.getElementById("field-CLIENTE");
        if (select) {
            select.value = String(clienteId || "");
        }

        if (preloadedRows && preloadedRows.length) {
            const fallbackRows = Array.isArray(preloadedRows) ? preloadedRows : [];
            const rowsPromise = (global.WeeklyPlanPanelData && typeof global.WeeklyPlanPanelData.fetchPlanRowsByVigencia === "function")
                ? global.WeeklyPlanPanelData.fetchPlanRowsByVigencia(clienteId, originalVigencia)
                    .then(function (rows) {
                        return Array.isArray(rows) ? rows : [];
                    })
                    .catch(function (err) {
                        if (Alerts && Alerts.notifyError) {
                            Alerts.notifyError("Error actualizando plan semanal", err, { silent: true });
                        } else {
                            console.warn("Error actualizando plan semanal:", err);
                        }
                        return null;
                    })
                : Promise.resolve(fallbackRows);

            const horasPromise = global.WeeklyPlanPanelData.fetchWeeklyHours(clienteLabel, clienteId)
                .then(function (infoHoras) {
                    return resolveInfoHorasForClient(clienteId, infoHoras || null);
                })
                .catch(function (err) {
                    if (Alerts && Alerts.notifyError) {
                        Alerts.notifyError("Error obteniendo info horas", err, { silent: true });
                    } else {
                        console.warn("Error obteniendo info horas:", err);
                    }
                    return resolveInfoHorasForClient(clienteId, null);
                });

            Promise.all([rowsPromise, horasPromise])
                .then(function (results) {
                    const rows = results[0];
                    const infoHoras = results[1];
                    const rowsToRender = rows === null ? fallbackRows : rows;
                    if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
                        global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rowsToRender, clienteLabel, infoHoras || null);
                    }
                });
        } else {
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }

        const panel = document.getElementById("plan-semanal-panel");
        insertBackButton(panel);
    }

    function insertBackButton(panel) {
        if (!panel) return;
        if (panel.querySelector('[data-weekly-plan-back]')) return;
        const backBtnDiv = document.createElement("div");
        backBtnDiv.className = "mb-3";
        const backBtn = document.createElement("button");
        backBtn.className = "btn btn-outline-secondary btn-sm";
        backBtn.setAttribute("data-weekly-plan-back", "true");
        const backIcon = document.createElement("i");
        backIcon.className = "bi bi-arrow-left me-1";
        backBtn.appendChild(backIcon);
        backBtn.appendChild(document.createTextNode("Volver al listado"));
        backBtn.addEventListener("click", () => {
            if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.renderList === "function") {
                global.WeeklyPlanPanelRender.renderList(state.currentContainer, state.allRecordsCache);
            }
        });
        backBtnDiv.appendChild(backBtn);
        panel.insertBefore(backBtnDiv, panel.firstChild);
    }

    function openNewPlan() {
        const container = state.currentContainer;
        if (!container) return;
        state.currentOriginalVigencia = null;
        state.currentPlanKey = "";
        state.forceNewPlan = true;
        state.openGroupKeys = new Set();
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.render === "function") {
            global.WeeklyPlanPanelRender.render(container);
        }
        const panel = document.getElementById("plan-semanal-panel");
        insertBackButton(panel);
    }

    function openNewPlanForClient() {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const clienteId = clienteSelect.value;
        if (!clienteId) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : clienteId;
        const defaultHoraEntrada = state.getClientDefaultHoraEntrada
            ? state.getClientDefaultHoraEntrada(clienteId)
            : "";

        state.currentOriginalVigencia = null;
        state.currentPlanKey = "";
        state.currentClientId = String(clienteId || "");
        state.currentClientLabel = String(clienteLabel || "");
        state.forceNewPlan = true;
        state.openGroupKeys = new Set();

        const rows = [{
            empleado: "",
            diaSemana: "",
            horaEntrada: defaultHoraEntrada || "",
            horasPlan: "",
            vigDesde: "",
            vigHasta: "",
            id: "",
            observaciones: ""
        }];

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(rows, clienteLabel, infoHoras);
        }
    }

    function loadPlanByKey(planKey) {
        if (!planKey) return;
        const group = (state.currentPlanGroups || []).find(function (g) { return g && g.key === planKey; });
        if (!group) return;

        const clienteSelect = document.getElementById("field-CLIENTE");
        const clienteId = clienteSelect ? clienteSelect.value : state.currentClientId;
        const selectedOption = clienteSelect && clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : (state.currentClientLabel || clienteId);

        state.currentOriginalVigencia = { desde: group.vigDesde || "", hasta: group.vigHasta || "" };
        state.currentPlanKey = planKey;
        state.currentClientId = String(clienteId || "");
        state.currentClientLabel = String(clienteLabel || "");
        state.forceNewPlan = false;
        state.openGroupKeys = new Set();

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(group.rows || [], clienteLabel, infoHoras);
        }
    }

    function addEmptyPlanRow() {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const clienteId = clienteSelect.value;
        if (!clienteId) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }
        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : clienteId;
        const defaultHoraEntrada = state.getClientDefaultHoraEntrada
            ? state.getClientDefaultHoraEntrada(clienteId)
            : "";

        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        captureOpenGroupKeys();

        const currentRows = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const idx = match[1];
                processedIndices.add(idx);

                const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                const horaInput = document.getElementById(`plan-row-${idx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${idx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${idx}-obs`);
                const idInput = document.getElementById(`plan-row-${idx}-id`);
                const selectedOption = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;

                const row = {
                    id: idInput ? idInput.value : "",
                    empleado: selectedOption ? selectedOption.textContent : "",
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    observaciones: obsInput ? obsInput.value : ""
                };

                if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                    currentRows.push(row);
                }
            }
        });

        currentRows.unshift({
            empleado: "",
            diaSemana: "",
            horaEntrada: defaultHoraEntrada || "",
            horasPlan: "",
            vigDesde: vigDesdeInputVal(),
            vigHasta: vigHastaInputVal(),
            observaciones: ""
        });

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(currentRows, clienteLabel, infoHoras);
        }

        setTimeout(() => {
            const sinAsignarCollapse = document.querySelector('[id*="collapse-Sin asignar"]');
            if (sinAsignarCollapse && !sinAsignarCollapse.classList.contains("show")) {
                new bootstrap.Collapse(sinAsignarCollapse, { show: true });
            }
        }, 100);
    }

    function deletePlanRow(idx) {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const clienteId = clienteSelect.value;
        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const clienteLabel = selectedOption ? selectedOption.textContent : clienteId;
        if (!clienteId) return;

        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        captureOpenGroupKeys();

        const currentRows = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const currentIdx = match[1];
                if (currentIdx === String(idx)) return;

                processedIndices.add(currentIdx);

                const empleadoSelect = document.getElementById(`plan-row-${currentIdx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${currentIdx}-dia`);
                const horaInput = document.getElementById(`plan-row-${currentIdx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${currentIdx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${currentIdx}-obs`);
                const idInput = document.getElementById(`plan-row-${currentIdx}-id`);
                const selectedOption = empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0] : null;

                const row = {
                    id: idInput ? idInput.value : "",
                    empleado: selectedOption ? selectedOption.textContent : "",
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal(),
                    observaciones: obsInput ? obsInput.value : ""
                };

                if (row.empleado || row.diaSemana || row.horaEntrada || row.horasPlan || row.observaciones) {
                    currentRows.push(row);
                }
            }
        });

        const infoHoras = getInfoHorasForClient(clienteId);
        if (global.WeeklyPlanPanelRender && typeof global.WeeklyPlanPanelRender.buildWeeklyPlanPanel === "function") {
            global.WeeklyPlanPanelRender.buildWeeklyPlanPanel(currentRows, clienteLabel, infoHoras);
        }
    }

    function saveWeeklyPlan() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const cliente = selectedOption ? selectedOption.textContent : clienteSelect.value;
        const idCliente = clienteSelect.value;
        if (!idCliente || !cliente) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }

        const items = [];
        const allInputs = panel.querySelectorAll('[id^="plan-row-"]');
        const processedIndices = new Set();

        allInputs.forEach(input => {
            const match = input.id.match(/plan-row-(\d+)-/);
            if (match && !processedIndices.has(match[1])) {
                const idx = match[1];
                processedIndices.add(idx);

                const empleadoSelect = document.getElementById(`plan-row-${idx}-empleado`);
                const diaSelect = document.getElementById(`plan-row-${idx}-dia`);
                const horaInput = document.getElementById(`plan-row-${idx}-horaEntrada`);
                const horasInput = document.getElementById(`plan-row-${idx}-horasPlan`);
                const obsInput = document.getElementById(`plan-row-${idx}-obs`);
                const idInput = document.getElementById(`plan-row-${idx}-id`);

                const item = {
                    id: idInput ? idInput.value : "",
                    idCliente: idCliente,
                    cliente: cliente,
                    idEmpleado: empleadoSelect ? empleadoSelect.value : "",
                    empleado: empleadoSelect && empleadoSelect.selectedOptions ? empleadoSelect.selectedOptions[0].textContent : "",
                    diaSemana: diaSelect ? diaSelect.value : "",
                    horaEntrada: horaInput ? horaInput.value : "",
                    horasPlan: horasInput ? horasInput.value : "",
                    observaciones: obsInput ? obsInput.value : "",
                    vigDesde: vigDesdeInputVal(),
                    vigHasta: vigHastaInputVal()
                };

                items.push(item);
            }
        });

        if (!items.length) {
            if (Alerts) Alerts.showAlert("No hay filas para guardar.", "warning");
            return;
        }

        const originalVigencia = state.forceNewPlan ? null : state.currentOriginalVigencia;
        setSavingState(true);

        global.WeeklyPlanPanelData.saveWeeklyPlan(cliente, items, originalVigencia, idCliente)
            .then(function () {
                Alerts && Alerts.showAlert("Plan guardado correctamente.", "success");
                state.forceNewPlan = false;
                global.WeeklyPlanPanelData.reloadList();
            })
            .catch(function (err) {
                if (Alerts && Alerts.notifyError) {
                    Alerts.notifyError("Error guardando plan", err);
                } else if (Alerts && Alerts.showError) {
                    Alerts.showError("Error guardando plan", err);
                } else {
                    console.error("Error guardando plan:", err);
                }
            })
            .finally(function () {
                setSavingState(false);
            });
    }

    function deleteWeeklyPlan() {
        const panel = document.getElementById("plan-semanal-panel");
        if (!panel) return;

        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;

        const selectedOption = clienteSelect.selectedOptions ? clienteSelect.selectedOptions[0] : null;
        const cliente = selectedOption ? selectedOption.textContent : clienteSelect.value;
        const idCliente = clienteSelect.value;
        if (!idCliente || !cliente) {
            if (Alerts) Alerts.showAlert("Seleccioná un cliente primero.", "warning");
            return;
        }

        const originalVigencia = state.currentOriginalVigencia;
        if (!originalVigencia || (!originalVigencia.desde && !originalVigencia.hasta)) {
            if (Alerts) Alerts.showAlert("No hay un plan vigente seleccionado para eliminar.", "warning");
            return;
        }

        const confirmPromise =
            global.UiDialogs && typeof global.UiDialogs.confirm === "function"
                ? global.UiDialogs.confirm({
                    title: "Eliminar plan",
                    message: "¿Querés eliminar este plan semanal? Esta acción no se puede deshacer.",
                    confirmText: "Eliminar",
                    cancelText: "Cancelar",
                    confirmVariant: "danger",
                    icon: "bi-trash3-fill",
                    iconClass: "text-danger"
                })
                : Promise.resolve(confirm("¿Querés eliminar este plan semanal?"));

        confirmPromise.then(function (confirmed) {
            if (!confirmed) return;
            setSavingState(true);
            global.WeeklyPlanPanelData.saveWeeklyPlan(cliente, [], originalVigencia, idCliente)
                .then(function () {
                    Alerts && Alerts.showAlert("Plan eliminado correctamente.", "success");
                    state.forceNewPlan = false;
                    global.WeeklyPlanPanelData.reloadList();
                })
                .catch(function (err) {
                    if (Alerts && Alerts.notifyError) {
                        Alerts.notifyError("Error eliminando plan", err);
                    } else if (Alerts && Alerts.showError) {
                        Alerts.showError("Error eliminando plan", err);
                    } else {
                        console.error("Error eliminando plan:", err);
                    }
                })
                .finally(function () {
                    setSavingState(false);
                });
        });
    }

    function setSavingState(isSaving) {
        const btn = document.getElementById("btn-save-weekly");
        const deleteBtn = document.getElementById("btn-delete-weekly");
        if (!btn && !deleteBtn) return;
        const ui = global.UIHelpers;
        if (isSaving) {
            if (ui && typeof ui.withSpinner === "function") {
                if (btn) ui.withSpinner(btn, true, "Guardando...");
            } else {
                if (btn) btn.disabled = true;
            }
            if (deleteBtn) deleteBtn.disabled = true;
        } else {
            if (ui && typeof ui.withSpinner === "function") {
                if (btn) ui.withSpinner(btn, false);
            } else {
                if (btn) btn.disabled = false;
            }
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }

    global.WeeklyPlanPanelActions = {
        init: init,
        setup: setup,
        openNewPlan: openNewPlan,
        openNewPlanForClient: openNewPlanForClient,
        switchToDetail: switchToDetail,
        captureOpenGroupKeys: captureOpenGroupKeys,
        loadPlanByKey: loadPlanByKey,
        addEmptyPlanRow: addEmptyPlanRow,
        deletePlanRow: deletePlanRow,
        deleteWeeklyPlan: deleteWeeklyPlan,
        saveWeeklyPlan: saveWeeklyPlan,
        vigDesdeInputVal: vigDesdeInputVal,
        vigHastaInputVal: vigHastaInputVal
    };
})(typeof window !== "undefined" ? window : this);


/**
 * WeeklyPlanPanelHandlers
 * Eventos del plan semanal.
 */
(function (global) {
    const state = global.WeeklyPlanPanelState;
    const actions = global.WeeklyPlanPanelActions;

    function attachListEvents(container) {
        if (state.listEventsController) {
            state.listEventsController.abort();
        }
        state.listEventsController = new AbortController();
        const listSignal = state.listEventsController.signal;
        const onList = (el, evt, handler) => {
            if (!el) return;
            el.addEventListener(evt, handler, { signal: listSignal });
        };

        const checkActive = container.querySelector('#check-active-plans');
        if (checkActive) {
            onList(checkActive, 'change', (e) => {
                const rows = container.querySelectorAll('.plan-row');
                rows.forEach(r => {
                    if (e.target.checked && r.dataset.active === "false") {
                        r.style.display = 'none';
                    } else {
                        r.style.display = '';
                    }
                });
            });
            checkActive.dispatchEvent(new Event('change'));
        }

        const newPlanBtn = container.querySelector('#btn-nuevo-plan');
        if (newPlanBtn) {
            onList(newPlanBtn, 'click', () => {
                if (actions && typeof actions.openNewPlan === 'function') {
                    actions.openNewPlan();
                }
            });
        }

        const editButtons = container.querySelectorAll('.btn-editar-plan');
        editButtons.forEach(btn => {
            onList(btn, 'click', () => {
                const key = btn.dataset ? (btn.dataset.key || '') : '';
                const idCliente = btn.dataset ? (btn.dataset.idCliente || '') : '';
                const clienteLabel = btn.dataset ? (btn.dataset.clienteLabel || '') : '';
                if (!key || !idCliente) return;

                const rows = state.planGroupsCache[key] || [];
                if (actions && typeof actions.switchToDetail === 'function') {
                    actions.switchToDetail(idCliente, clienteLabel, rows, {
                        desde: (key.split('|')[1] || ''),
                        hasta: (key.split('|')[2] || '')
                    });
                }
            });
        });
    }

    function attachDetailEvents() {
        const clienteSelect = document.getElementById("field-CLIENTE");
        if (!clienteSelect) return;
        if (state.detailEventsController) {
            state.detailEventsController.abort();
        }
        state.detailEventsController = new AbortController();
        const detailSignal = state.detailEventsController.signal;
        clienteSelect.addEventListener("change", () => {
            state.currentOriginalVigencia = null;
            state.currentPlanKey = "";
            state.currentPlanGroups = [];
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }, { signal: detailSignal });
    }

    function attachWeeklyPlanHandlers(panel) {
        if (!panel) return;
        if (state.panelEventsController) {
            state.panelEventsController.abort();
        }
        state.panelEventsController = new AbortController();
        const signal = state.panelEventsController.signal;
        panel.addEventListener("click", function (e) {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;
            const action = actionBtn.getAttribute("data-action");

            if (action === "add-plan-row") {
                if (actions && typeof actions.addEmptyPlanRow === 'function') {
                    actions.addEmptyPlanRow();
                }
            } else if (action === "delete-plan-row") {
                const idx = actionBtn.getAttribute("data-idx");
                if (actions && typeof actions.deletePlanRow === 'function') {
                    actions.deletePlanRow(idx);
                }
            } else if (action === "save-weekly-plan") {
                if (actions && typeof actions.saveWeeklyPlan === 'function') {
                    actions.saveWeeklyPlan();
                }
            } else if (action === "delete-weekly-plan") {
                if (actions && typeof actions.deleteWeeklyPlan === "function") {
                    actions.deleteWeeklyPlan();
                }
            } else if (action === "new-weekly-plan-client") {
                if (actions && typeof actions.openNewPlanForClient === "function") {
                    actions.openNewPlanForClient();
                }
            } else if (action === "select-weekly-plan") {
                const key = actionBtn.getAttribute("data-plan-key") || "";
                if (actions && typeof actions.loadPlanByKey === "function") {
                    actions.loadPlanByKey(key);
                }
            }
        }, { signal: signal });
    }

    global.WeeklyPlanPanelHandlers = {
        init: actions && actions.init ? actions.init : function () { },
        setup: actions && actions.setup ? actions.setup : function () { },
        openNewPlan: actions && actions.openNewPlan ? actions.openNewPlan : function () { },
        openNewPlanForClient: actions && actions.openNewPlanForClient ? actions.openNewPlanForClient : function () { },
        switchToDetail: actions && actions.switchToDetail ? actions.switchToDetail : function () { },
        attachListEvents: attachListEvents,
        attachDetailEvents: attachDetailEvents,
        attachWeeklyPlanHandlers: attachWeeklyPlanHandlers,
        loadPlanByKey: actions && actions.loadPlanByKey ? actions.loadPlanByKey : function () { },
        addEmptyPlanRow: actions && actions.addEmptyPlanRow ? actions.addEmptyPlanRow : function () { },
        deletePlanRow: actions && actions.deletePlanRow ? actions.deletePlanRow : function () { },
        deleteWeeklyPlan: actions && actions.deleteWeeklyPlan ? actions.deleteWeeklyPlan : function () { },
        saveWeeklyPlan: actions && actions.saveWeeklyPlan ? actions.saveWeeklyPlan : function () { },
        vigDesdeInputVal: actions && actions.vigDesdeInputVal ? actions.vigDesdeInputVal : function () { return ""; },
        vigHastaInputVal: actions && actions.vigHastaInputVal ? actions.vigHastaInputVal : function () { return ""; }
    };
})(typeof window !== "undefined" ? window : this);


/**
 * WeeklyPlanPanel
 * Orquestador del plan semanal.
 */
(function (global) {
    const WeeklyPlanPanel = (() => {
        function ensureDeps() {
            if (!global.WeeklyPlanPanelState || !global.WeeklyPlanPanelRender || !global.WeeklyPlanPanelHandlers || !global.WeeklyPlanPanelData) {
                console.error('WeeklyPlanPanel dependencies no disponibles');
                return false;
            }
            return true;
        }

        function init(refData) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelHandlers.init(refData);
        }

        function setup() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelHandlers.setup();
        }

        function render(container) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelRender.render(container);
        }

        function renderList(container, records) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelRender.renderList(container, records);
        }

        function fetchWeeklyPlanForClient() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }

        function reloadList() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelData.reloadList();
        }

        return {
            init: init,
            setup: setup,
            render: render,
            renderList: renderList,
            fetchWeeklyPlanForClient: fetchWeeklyPlanForClient,
            reloadList: reloadList
        };
    })();

    global.WeeklyPlanPanel = WeeklyPlanPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * Attendance Templates
 * Plantillas HTML para los paneles de asistencia.
 */

(function (global) {
    const AttendanceTemplates = (() => {
        const escapeHtml = (global.HtmlHelpers && typeof global.HtmlHelpers.escapeHtml === 'function')
            ? global.HtmlHelpers.escapeHtml
            : function (val) {
                return String(val == null ? '' : val)
                    .replace(/&/g, '&amp;')
                    .replace(/[<]/g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

        function buildDailyAttendanceLayout() {
            return `
                <div id="attendance-daily-root" class="d-flex flex-column gap-3">
                    <div class="lt-surface lt-surface--subtle p-2">
                        <div class="lt-toolbar">
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <label class="form-label small fw-semibold text-muted mb-0">Fecha</label>
                                <input type="date" id="attendance-date" class="form-control form-control-sm" value="" style="width: 140px;">
                            </div>
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                <button type="button" id="attendance-add-extra" class="btn btn-sm btn-primary lt-btn-compact text-nowrap">
                                    <i class="bi bi-plus-circle me-1"></i>Fuera de plan
                                </button>
                                <button type="button" id="attendance-save" class="btn btn-sm btn-success lt-btn-compact text-nowrap">
                                    <i class="bi bi-check2-circle me-1"></i>Guardar
                                </button>
                            </div>
                            <div id="attendance-summary" class="d-flex flex-nowrap gap-2 flex-shrink-0"></div>
                        </div>
                    </div>

                    <div class="lt-surface p-0 position-relative">
                        <div id="attendance-loading" class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center bg-white bg-opacity-75 d-none"></div>

                        <div id="attendance-cards" class="d-flex flex-column gap-3 p-2"></div>
                    </div>
                </div>
            `;
        }

        function buildEmployeeCalendarPanelHtml() {
            return `
                <div class="employee-calendar-container">
                    <!-- Header con controles -->
                    <div class="lt-surface lt-surface--subtle p-3 mb-3">
                        <div class="row g-3 align-items-end">
                            <div class="col-12 col-md-4">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-person-badge text-primary"></i>
                                    <span>Empleado</span>
                                </label>
                                <select id="calendar-empleado-select" class="form-select">
                                    <option value="">Seleccionar empleado...</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-5">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-calendar-week text-primary"></i>
                                    <span>Semana</span>
                                </label>
                                <div class="d-flex align-items-center gap-2">
                                    <button id="calendar-prev-week" class="btn btn-outline-secondary btn-sm" title="Semana anterior">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <div id="calendar-week-label" class="flex-grow-1 text-center fw-medium">
                                        Seleccione un empleado
                                    </div>
                                    <button id="calendar-next-week" class="btn btn-outline-secondary btn-sm" title="Semana siguiente">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                    <button id="calendar-today" class="btn btn-outline-primary btn-sm" title="Ir a hoy">
                                        <i class="bi bi-calendar-check"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12 col-md-3 text-end">
                                <button id="calendar-generate-pdf" class="btn btn-success d-flex align-items-center gap-2 ms-auto" disabled>
                                    <i class="bi bi-file-earmark-pdf"></i>
                                    <span>Generar PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Calendario semanal -->
                    <div id="calendar-grid-container" class="calendar-grid-wrapper"></div>

                    <!-- Resumen -->
                    <div id="calendar-summary" class="mt-3 d-none">
                        <div class="lt-surface p-3">
                            <div class="d-flex justify-content-around text-center">
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-horas">0</div>
                                    <small class="text-muted">Horas</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-clientes">0</div>
                                    <small class="text-muted" id="summary-clientes-label">Clientes</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="summary-dias">0</div>
                                    <small class="text-muted">Días</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function buildClientCalendarPanelHtml() {
            return `
                <div class="employee-calendar-container">
                    <div class="lt-surface lt-surface--subtle p-3 mb-3">
                        <div class="row g-3 align-items-end">
                            <div class="col-12 col-md-4">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-buildings text-primary"></i>
                                    <span>Cliente</span>
                                </label>
                                <select id="client-calendar-select" class="form-select">
                                    <option value="">Todos los clientes</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-5">
                                <label class="form-label small mb-1 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-calendar-week text-primary"></i>
                                    <span>Semana</span>
                                </label>
                                <div class="d-flex align-items-center gap-2">
                                    <button id="client-calendar-prev" class="btn btn-outline-secondary btn-sm" title="Semana anterior">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <div id="client-calendar-week-label" class="flex-grow-1 text-center fw-medium">Semana</div>
                                    <button id="client-calendar-next" class="btn btn-outline-secondary btn-sm" title="Semana siguiente">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                    <button id="client-calendar-today" class="btn btn-outline-primary btn-sm" title="Ir a hoy">
                                        <i class="bi bi-calendar-check"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12 col-md-3 text-end">
                                <button id="client-calendar-refresh" class="btn btn-outline-primary d-flex align-items-center gap-2 ms-auto">
                                    <i class="bi bi-arrow-repeat"></i>
                                    <span>Actualizar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="client-calendar-grid" class="calendar-grid-wrapper"></div>

                    <div id="client-calendar-summary" class="mt-3 d-none">
                        <div class="lt-surface p-3">
                            <div class="d-flex justify-content-around text-center">
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-horas">0</div>
                                    <small class="text-muted">Horas</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-clientes">0</div>
                                    <small class="text-muted">Clientes</small>
                                </div>
                                <div>
                                    <div class="h4 mb-0 text-primary" id="client-summary-dias">0</div>
                                    <small class="text-muted">Días</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return {
            buildDailyAttendanceLayout,
            buildEmployeeCalendarPanelHtml,
            buildClientCalendarPanelHtml
        };
    })();

    global.AttendanceTemplates = AttendanceTemplates;
})(typeof window !== "undefined" ? window : this);


/**
 * AttendanceDailyState
 * Estado compartido para asistencia diaria.
 */
(function (global) {
  const AttendanceDailyState = {
    fecha: "",
    rows: [],
    loading: false,
    reference: { clientes: [], empleados: [] },
    rootEl: null,
    pendingFecha: null,
    pendingFocus: null,
    removedRows: [],
    eventsController: null,
    rowEventsController: null,
    summaryEventsController: null,
    collapseEventsController: null
  };

  AttendanceDailyState.getTodayIso = function () {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  AttendanceDailyState.reset = function (fecha) {
    AttendanceDailyState.fecha = fecha || AttendanceDailyState.getTodayIso();
    AttendanceDailyState.rows = [];
    AttendanceDailyState.loading = false;
    AttendanceDailyState.removedRows = [];
  };

  AttendanceDailyState.setRoot = function (el) {
    AttendanceDailyState.rootEl = el || null;
  };

  AttendanceDailyState.setReference = function (refs) {
    AttendanceDailyState.reference = refs || { clientes: [], empleados: [] };
  };

  AttendanceDailyState.setRows = function (rows) {
    AttendanceDailyState.rows = Array.isArray(rows) ? rows : [];
  };

  AttendanceDailyState.setFecha = function (fecha) {
    AttendanceDailyState.fecha = fecha || AttendanceDailyState.getTodayIso();
  };

  AttendanceDailyState.setLoading = function (isLoading) {
    AttendanceDailyState.loading = !!isLoading;
  };

  AttendanceDailyState.setPendingFecha = function (fecha) {
    AttendanceDailyState.pendingFecha = fecha || null;
  };

  AttendanceDailyState.consumePendingFecha = function () {
    const value = AttendanceDailyState.pendingFecha;
    AttendanceDailyState.pendingFecha = null;
    return value;
  };

  AttendanceDailyState.setPendingFocus = function (focus) {
    AttendanceDailyState.pendingFocus = focus || null;
  };

  AttendanceDailyState.consumePendingFocus = function () {
    const value = AttendanceDailyState.pendingFocus;
    AttendanceDailyState.pendingFocus = null;
    return value;
  };

  AttendanceDailyState.normalizeRow = function (row, extra, idx) {
    return {
      uid: (extra ? "extra-" : "plan-") + (idx != null ? idx : Date.now()),
      cliente: row && row.cliente ? String(row.cliente) : "",
      idCliente: row && row.idCliente ? row.idCliente : "",
      empleado: row && row.empleado ? String(row.empleado) : "",
      idEmpleado: row && row.idEmpleado ? row.idEmpleado : "",
      horaPlan: row && row.horaPlan ? String(row.horaPlan) : "",
      horasPlan: row && row.horasPlan !== undefined && row.horasPlan !== null ? row.horasPlan : "",
      asistencia: row && row.asistencia ? true : false,
      horasReales: row && row.horasReales !== undefined && row.horasReales !== null ? row.horasReales : "",
      observaciones: row && row.observaciones ? String(row.observaciones) : "",
      asistenciaRowNumber: row && row.asistenciaRowNumber ? row.asistenciaRowNumber : null,
      idAsistencia: row && (row.idAsistencia != null && row.idAsistencia !== "") ? row.idAsistencia : null,
      fueraDePlan: !!extra || !!(row && row.fueraDePlan)
    };
  };

  global.AttendanceDailyState = AttendanceDailyState;
})(typeof window !== "undefined" ? window : this);


/**
 * AttendanceDailyData
 * Capa de datos para asistencia diaria.
 */
(function (global) {
  const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;
  const planCache = new Map();

  function getCachedPlan(fecha) {
    if (!fecha) return null;
    const entry = planCache.get(fecha);
    if (!entry) return null;
    if ((Date.now() - entry.ts) > PLAN_CACHE_TTL_MS) {
      planCache.delete(fecha);
      return null;
    }
    return entry.rows || [];
  }

  function storeCachedPlan(fecha, rows) {
    if (!fecha) return rows;
    planCache.set(fecha, { ts: Date.now(), rows: Array.isArray(rows) ? rows : [] });
    return rows;
  }

  function ensureApi() {
    return global.ApiService && typeof global.ApiService.callLatest === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadReference() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve({ clientes: [], empleados: [] });
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs || { clientes: [], empleados: [] };
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando referencias", err, { silent: true });
        } else {
          console.warn("Error cargando referencias:", err);
        }
        return { clientes: [], empleados: [] };
      });
  }

  function loadDailyPlan(fecha) {
    const cached = getCachedPlan(fecha);
    if (cached) return Promise.resolve(cached);
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.callLatest("attendance-plan-" + fecha, "getDailyAttendancePlan", fecha)
      .then((rows) => {
        if (rows && rows.ignored) return rows;
        if (Array.isArray(rows)) return storeCachedPlan(fecha, rows);
        return [];
      });
  }

  function searchRecords(tipoFormato, query) {
    if (!global.AttendanceService || typeof global.AttendanceService.searchRecords !== "function") {
      return Promise.resolve([]);
    }
    return global.AttendanceService.searchRecords(tipoFormato, query);
  }

  function saveDailyAttendance(fecha, payload) {
    if (!global.AttendanceService || typeof global.AttendanceService.saveDailyAttendance !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.saveDailyAttendance(fecha, payload);
  }

  global.AttendanceDailyData = {
    loadReference: loadReference,
    loadDailyPlan: loadDailyPlan,
    searchRecords: searchRecords,
    saveDailyAttendance: saveDailyAttendance,
    prefetch: function (fecha) {
      const targetDate = fecha || (global.AttendanceDailyState && typeof global.AttendanceDailyState.getTodayIso === "function"
        ? global.AttendanceDailyState.getTodayIso()
        : "");
      return loadReference()
        .then(function () {
          return loadDailyPlan(targetDate);
        })
        .catch(function () {
          return null;
        });
    }
  };
})(typeof window !== "undefined" ? window : this);


/**
 * AttendanceDailyRender
 * Render seguro para asistencia diaria.
 */
(function (global) {
  const state = global.AttendanceDailyState;
  const Dom = global.DomHelpers;

  function renderLayout(container, fecha) {
    if (!container) return;
    if (!global.AttendanceTemplates || typeof global.AttendanceTemplates.buildDailyAttendanceLayout !== "function") {
      console.error("AttendanceTemplates no disponible");
      return;
    }
    if (Dom && Dom.clear) {
      Dom.clear(container);
    } else {
      container.textContent = "";
    }
    // safe static: layout fijo sin datos externos.
    container.innerHTML = global.AttendanceTemplates.buildDailyAttendanceLayout();
    const dateInput = container.querySelector("#attendance-date");
    if (dateInput) dateInput.value = fecha || state.fecha || "";
  }

  function setLoading(isLoading) {
    if (!state || !state.rootEl) return;
    state.setLoading(isLoading);
    const overlay = state.rootEl.querySelector("#attendance-loading");
    if (!overlay) return;
    overlay.classList.toggle("d-none", !isLoading);
    if (isLoading) {
      if (global.EmptyState) {
        global.EmptyState.render(overlay, { variant: "loading", message: "Cargando asistencia del día..." });
      } else if (Dom) {
        Dom.clear(overlay);
        overlay.appendChild(Dom.el("div", { className: "text-center text-muted small", text: "Cargando asistencia del día..." }));
      }
      return;
    }
    if (Dom && Dom.clear) {
      Dom.clear(overlay);
    } else {
      overlay.textContent = "";
    }
  }

  function renderRows(emptyMessage) {
    const root = state.rootEl;
    if (!root || !Dom) return;

    const list = root.querySelector("#attendance-cards");
    if (!list) return;

    Dom.clear(list);

    if (!state.rows.length) {
      const message = emptyMessage || "No hay plan para la fecha seleccionada. Podés agregar asistencia fuera de plan.";
      if (global.EmptyState) {
        const normalized = String(message).toLowerCase();
        let variant = "empty";
        if (normalized.includes("cargando")) {
          variant = "loading";
        } else if (normalized.includes("no pudimos") || normalized.includes("error")) {
          variant = "error";
        }
        global.EmptyState.render(list, {
          variant: variant,
          title: variant === "error" ? "Error al cargar" : "Sin plan",
          message: message
        });
      } else {
        list.appendChild(Dom.el("div", {
          className: "text-center text-muted py-4",
          text: message
        }));
      }
      return;
    }

    const frag = document.createDocumentFragment();
    const isPastDay = isDatePast(state.fecha);

    state.rows.forEach(function (row) {
      const card = document.createElement("div");
      card.className = "card shadow-sm border-0";
      if (row.fueraDePlan) {
        card.classList.add("border", "border-secondary", "border-opacity-50");
      }

      const clienteSelect = buildClienteSelect(row.uid, row.cliente, !row.fueraDePlan, row.idCliente);
      const empleadoSelect = buildEmpleadoSelect(row.uid, row.empleado, !row.fueraDePlan, row.idEmpleado);
      const horasPlanText = formatHorasPlan(row.horasPlan);
      const horaPlanText = formatHoraPlan(row.horaPlan);
      const collapseId = "att-card-" + row.uid;
      const isOpen = row._autoOpen === true;
      const statusLabel = row.asistencia ? "Asistió" : "No asistió";
      const statusClass = row.asistencia ? "bg-success bg-opacity-75 text-white" : "bg-danger bg-opacity-75 text-white";
      const arrow = isOpen ? "▲" : "▼";

      let headerStyle = "";
      let cardStyle = "";
      if (isPastDay) {
        if (row.asistencia) {
          cardStyle = "background-color:#f7fff9;border-color:#b7e6c3;";
          headerStyle = "background-color:#f0fff3;";
        } else {
          cardStyle = "background-color:#fff6f6;border-color:#f2c8c8;";
          headerStyle = "background-color:#fff0f0;";
        }
      }

      if (cardStyle) {
        card.setAttribute("style", cardStyle);
      }

      const header = Dom.el("div", {
        className: "card-header py-2 px-3 bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 att-card-toggle",
        style: headerStyle || "",
        "data-bs-toggle": "collapse",
        "data-bs-target": "#" + collapseId,
        "aria-expanded": isOpen ? "true" : "false",
        "aria-controls": collapseId,
        role: "button"
      });

      const headerLeft = Dom.el("div", { className: "d-flex flex-wrap gap-2 align-items-center" }, [
        Dom.el("span", { className: "badge px-2 " + statusClass, text: statusLabel }),
        Dom.el("span", { className: "fw-semibold", text: row.empleado || "Empleado" }),
        Dom.el("span", { className: "text-muted", text: "•" }),
        Dom.el("span", { className: "fw-semibold text-primary", text: row.cliente || "Cliente" })
      ]);

      const headerRight = Dom.el("div", { className: "d-flex gap-2 align-items-center" }, [
        Dom.el("span", {
          className: row.fueraDePlan ? "badge bg-secondary" : "badge text-bg-success",
          text: row.fueraDePlan ? "Fuera de plan" : "Plan"
        }),
        Dom.el("span", {
          className: "text-muted fw-semibold",
          dataset: { role: "collapse-arrow" },
          "aria-hidden": "true",
          text: arrow
        })
      ]);

      header.appendChild(headerLeft);
      header.appendChild(headerRight);

      const body = Dom.el("div", { className: "card-body pt-2 pb-3 px-3" });

      const rowSelects = Dom.el("div", { className: "row g-3" }, [
        Dom.el("div", { className: "col-12 col-md-6" }, [
          Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Cliente" }),
          clienteSelect
        ]),
        Dom.el("div", { className: "col-12 col-md-6" }, [
          Dom.el("label", { className: "small text-muted fw-semibold d-block mb-1", text: "Empleado" }),
          empleadoSelect
        ])
      ]);

      const checkInput = Dom.el("input", {
        type: "checkbox",
        className: "form-check-input",
        dataset: { role: "asistencia-check", uid: row.uid }
      });
      if (row.asistencia) checkInput.checked = true;

      const horasInput = Dom.el("input", {
        type: "number",
        step: "0.5",
        min: "0",
        className: "form-control form-control-sm text-end",
        dataset: { role: "horas-reales", uid: row.uid },
        value: row.horasReales != null ? String(row.horasReales) : ""
      });

      const obsInput = Dom.el("textarea", {
        rows: "2",
        className: "form-control form-control-sm",
        dataset: { role: "observaciones", uid: row.uid }
      }, row.observaciones || "");

      const removeCell = Dom.el("button", {
        className: row.fueraDePlan ? "btn btn-sm btn-outline-danger" : "btn btn-sm btn-outline-secondary",
        dataset: { role: "remove-row", uid: row.uid },
        title: "Quitar fila"
      }, "✕");

      const rowInputs = Dom.el("div", { className: "row g-3 align-items-center mt-1" }, [
        Dom.el("div", { className: "col-12 col-md-3" }, [
          Dom.el("div", { className: "small text-muted fw-semibold", text: "Horas planificadas" }),
          Dom.el("div", { className: "fw-semibold", text: horasPlanText }),
          Dom.el("div", { className: "small text-muted", text: horaPlanText || "\u00a0" })
        ]),
        Dom.el("div", { className: "col-6 col-md-2 text-center" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Asistió" }),
          checkInput
        ]),
        Dom.el("div", { className: "col-6 col-md-3" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Horas reales" }),
          horasInput
        ]),
        Dom.el("div", { className: "col-12 col-md-3" }, [
          Dom.el("label", { className: "small text-muted fw-semibold mb-1 d-block", text: "Observaciones" }),
          obsInput
        ]),
        Dom.el("div", { className: "col-12 col-md-1 text-end" }, removeCell)
      ]);

      body.appendChild(rowSelects);
      body.appendChild(rowInputs);

      const collapse = Dom.el("div", {
        id: collapseId,
        className: "collapse att-collapse " + (isOpen ? "show" : "")
      }, body);

      card.appendChild(header);
      card.appendChild(collapse);

      frag.appendChild(card);
    });

    list.appendChild(frag);
  }

  function renderDailySummary() {
    const root = state.rootEl;
    if (!root || !Dom) return;

    const summaryEl = root.querySelector("#attendance-summary");
    if (!summaryEl) return;

    if (!state.rows.length) {
      Dom.clear(summaryEl);
      return;
    }

    const clientesAtendidos = new Set();
    let totalHoras = 0;
    let registros = state.rows.length;
    let presentes = 0;

    state.rows.forEach(r => {
      if (r.asistencia) {
        presentes += 1;
        if (r.cliente) clientesAtendidos.add(r.cliente);
        const horas = parseFloat(r.horasReales !== "" ? r.horasReales : r.horasPlan);
        if (!isNaN(horas)) totalHoras += horas;
      }
    });

    Dom.clear(summaryEl);
    const chips = [
      { className: 'lt-chip lt-chip--primary', label: 'Clientes', value: clientesAtendidos.size },
      { className: 'lt-chip lt-chip--success', label: 'Horas', value: totalHoras.toFixed(2) },
      { className: 'lt-chip lt-chip--muted', label: 'Asistencias', value: presentes + '/' + registros }
    ];
    chips.forEach(chip => {
      summaryEl.appendChild(Dom.el('span', { className: chip.className }, [
        Dom.el('span', { className: 'opacity-75', text: chip.label }),
        Dom.text(' '),
        Dom.el('strong', { text: String(chip.value) })
      ]));
    });
  }

  function renderSummary(records) {
    const headersRow = document.getElementById("grid-headers");
    const tbody = document.getElementById("grid-body");
    if (!headersRow || !tbody || !Dom) return;

    Dom.clear(headersRow);
    ['Fecha', 'Clientes atendidos', 'Horas totales', 'Asistencia (real / planificada)', 'Acciones']
      .forEach(function (label, idx) {
        const th = Dom.el('th', {
          className: idx === 0 ? '' : 'text-center',
          text: label
        });
        headersRow.appendChild(th);
      });

    Dom.clear(tbody);

    const summaryRows = buildSummaryRows(records);
    if (!summaryRows.length) {
      tbody.appendChild(Dom.el('tr', null, Dom.el('td', {
        colspan: '5',
        className: 'text-center text-muted py-5',
        text: 'No hay asistencias registradas.'
      })));
      return;
    }

    const renderRow = (item) => {
      const tr = Dom.el('tr', null, [
        Dom.el('td', null, Dom.el('strong', { text: item.fechaLabel })),
        Dom.el('td', { className: 'text-center', text: String(item.clientes) }),
        Dom.el('td', { className: 'text-center', text: item.horas.toFixed(2) }),
        Dom.el('td', { className: 'text-center', text: item.presentes + ' / ' + item.registros })
      ]);
      const btn = Dom.el('button', {
        className: 'btn btn-sm btn-primary',
        dataset: { action: 'open-day', fecha: item.fecha }
      }, 'Editar día');
      tr.appendChild(Dom.el('td', { className: 'text-center' }, btn));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, summaryRows, renderRow, { chunkSize: 120 });
    } else {
      const frag = document.createDocumentFragment();
      summaryRows.forEach(item => {
        frag.appendChild(renderRow(item));
      });
      tbody.appendChild(frag);
    }
  }

  function buildSummaryRows(records) {
    const map = new Map();
    (records || []).forEach(item => {
      const rec = item.record ? item.record : item;
      const fecha = rec.FECHA || rec.fecha;
      if (!fecha) return;
      const key = String(fecha).trim();
      if (!map.has(key)) {
        map.set(key, { registros: 0, clientes: new Set(), horas: 0, presentes: 0 });
      }
      const agg = map.get(key);
      agg.registros += 1;
      const asist = rec.ASISTENCIA !== undefined ? rec.ASISTENCIA : rec.asistencia;
      const horasRaw = rec.HORAS !== undefined ? rec.HORAS : rec.horas;
      const cliente = rec.CLIENTE || rec.cliente;

      if (asist === true || asist === "TRUE" || asist === "true" || asist === 1 || asist === "1") {
        if (cliente) agg.clientes.add(cliente);
        const horasNum = parseFloat(horasRaw);
        if (!isNaN(horasNum)) {
          agg.horas += horasNum;
        }
        agg.presentes += 1;
      }
    });

    const result = [];
    map.forEach((val, fecha) => {
      result.push({
        fecha: fecha,
        fechaLabel: formatDateLabel(fecha),
        registros: val.registros,
        clientes: val.clientes.size,
        horas: val.horas,
        presentes: val.presentes
      });
    });

    result.sort((a, b) => a.fecha > b.fecha ? -1 : 1);
    return result;
  }

  function formatDateLabel(fecha) {
    if (!fecha) return "";
    const parts = String(fecha).split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      const dt = new Date(y, m, d);
      if (!isNaN(dt)) {
        return dt.toLocaleDateString("es-AR");
      }
    }
    return fecha;
  }

  function isDatePast(fechaStr) {
    if (!fechaStr) return false;
    const p = fechaStr.split("-");
    if (p.length !== 3) return false;
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function formatHorasPlan(val) {
    if (val === undefined || val === null || val === "") return "-";
    const num = Number(val);
    if (!isNaN(num)) {
      return num.toFixed(1) + " hs";
    }
    return String(val);
  }

  function formatHoraPlan(val) {
    if (!val) return "";
    if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
      return "Ingreso " + val.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }
    const numericVal = Number(val);
    if (Number.isFinite(numericVal)) {
      const fraction = numericVal >= 1 ? (numericVal % 1) : numericVal;
      if (fraction > 0) {
        const totalMinutes = Math.round(fraction * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
        const mm = String(totalMinutes % 60).padStart(2, "0");
        return "Ingreso " + hh + ":" + mm;
      }
    }
    const s = String(val);
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (m) {
      const hh = m[1].padStart(2, "0");
      const mm = m[2];
      return "Ingreso " + hh + ":" + mm;
    }
    return "";
  }

  function buildClienteSelect(uid, selected, disabled, selectedId) {
    if (!Dom) return document.createElement("select");
    const select = Dom.el("select", {
      className: "form-select form-select-sm bg-white border",
      dataset: { role: "cliente", uid: uid }
    });
    if (disabled) select.disabled = true;
    select.appendChild(Dom.el("option", { value: "", text: "Cliente..." }));

    let found = false;
    const selectedIdStr = selectedId != null && selectedId !== '' ? String(selectedId) : '';
    (state.reference.clientes || []).forEach(cli => {
      const label = (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function')
        ? DomainHelpers.getClientDisplayName(cli)
        : (cli && typeof cli === 'object'
          ? (cli.nombre || cli.razonSocial || cli.CLIENTE || cli)
          : cli);
      const id = cli && typeof cli === 'object' && cli.id != null ? String(cli.id) : '';
      if (!label) return;
      if (!id) return;
      const opt = Dom.el("option", { value: String(id), text: String(label) });
      if (selectedIdStr && id === selectedIdStr) {
        opt.selected = true;
        found = true;
      }
      select.appendChild(opt);
    });

    if (selected && !found) {
      const fallback = Dom.el("option", { value: "", text: selected + " (sin ID)" });
      fallback.selected = true;
      select.appendChild(fallback);
    }
    return select;
  }

  function buildEmpleadoSelect(uid, selected, disabled, selectedId) {
    if (!Dom) return document.createElement("select");
    const select = Dom.el("select", {
      className: "form-select form-select-sm bg-white border",
      dataset: { role: "empleado", uid: uid }
    });
    if (disabled) select.disabled = true;
    select.appendChild(Dom.el("option", { value: "", text: "Empleado..." }));

    let found = false;
    const selectedIdStr = selectedId != null && selectedId !== '' ? String(selectedId) : '';
    (state.reference.empleados || []).forEach(emp => {
      const label = typeof emp === 'string' ? emp : (emp.nombre || emp.empleado || emp.label || '');
      const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id) : '';
      if (!label) return;
      if (!id) return;
      const opt = Dom.el("option", { value: String(id), text: String(label) });
      if (selectedIdStr && id === selectedIdStr) {
        opt.selected = true;
        found = true;
      }
      select.appendChild(opt);
    });

    if (selected && !found) {
      const fallback = Dom.el("option", { value: "", text: selected + " (sin ID)" });
      fallback.selected = true;
      select.appendChild(fallback);
    }
    return select;
  }

  global.AttendanceDailyRender = {
    renderLayout: renderLayout,
    setLoading: setLoading,
    renderRows: renderRows,
    renderDailySummary: renderDailySummary,
    renderSummary: renderSummary
  };
})(typeof window !== "undefined" ? window : this);


/**
 * AttendanceDailyHandlers
 * Eventos para asistencia diaria.
 */
(function (global) {
  const state = global.AttendanceDailyState;

  function bindBaseEvents(callbacks) {
    if (!state || !state.rootEl) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;

    const dateInput = state.rootEl.querySelector("#attendance-date");
    const addBtn = state.rootEl.querySelector("#attendance-add-extra");
    const saveBtn = state.rootEl.querySelector("#attendance-save");

    if (dateInput) {
      dateInput.addEventListener("change", function () {
        if (callbacks && typeof callbacks.onDateChange === "function") {
          callbacks.onDateChange(this.value);
        }
      }, { signal });
    }

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (callbacks && typeof callbacks.onAddRow === "function") {
          callbacks.onAddRow();
        }
      }, { signal });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        if (callbacks && typeof callbacks.onSave === "function") {
          callbacks.onSave();
        }
      }, { signal });
    }
  }

  function bindRowEvents(callbacks) {
    if (!state || !state.rootEl) return;
    if (state.rowEventsController) {
      state.rowEventsController.abort();
    }
    state.rowEventsController = new AbortController();
    const signal = state.rowEventsController.signal;

    state.rootEl.addEventListener("change", function (e) {
      const target = e.target;
      if (!target || !target.dataset) return;
      const role = target.dataset.role;
      const uid = target.dataset.uid;
      if (!role || !uid) return;

      if (role === "cliente") {
        const opt = target.selectedOptions ? target.selectedOptions[0] : null;
        const id = target.value || "";
        const label = opt ? opt.textContent : "";
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { cliente: label || "", idCliente: id });
        }
      } else if (role === "empleado") {
        const opt = target.selectedOptions ? target.selectedOptions[0] : null;
        const id = target.value || "";
        const label = opt ? opt.textContent : "";
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { empleado: label || "", idEmpleado: id });
        }
      } else if (role === "asistencia-check") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { asistencia: !!target.checked });
        }
      }
    }, { signal });

    state.rootEl.addEventListener("input", function (e) {
      const target = e.target;
      if (!target || !target.dataset) return;
      const role = target.dataset.role;
      const uid = target.dataset.uid;
      if (!role || !uid) return;

      if (role === "horas-reales") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { horasReales: target.value });
        }
      } else if (role === "observaciones") {
        if (callbacks && typeof callbacks.onUpdateRow === "function") {
          callbacks.onUpdateRow(uid, { observaciones: target.value });
        }
      }
    }, { signal });

    state.rootEl.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-role="remove-row"]') : null;
      if (!btn) return;
      const uid = btn.dataset ? btn.dataset.uid : "";
      if (!uid) return;
      if (callbacks && typeof callbacks.onRemoveRow === "function") {
        callbacks.onRemoveRow(uid);
      }
    }, { signal });
  }

  function bindSummaryEvents(onOpenDay) {
    const tbody = document.getElementById("grid-body");
    if (!tbody) return;
    if (state.summaryEventsController) {
      state.summaryEventsController.abort();
    }
    state.summaryEventsController = new AbortController();
    const signal = state.summaryEventsController.signal;

    tbody.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-action="open-day"]') : null;
      if (!btn) return;
      if (typeof onOpenDay === "function") {
        onOpenDay(btn.dataset.fecha || "");
      }
    }, { signal });
  }

  function bindCollapseArrows() {
    if (!state || !state.rootEl) return;
    if (state.collapseEventsController) {
      state.collapseEventsController.abort();
    }
    state.collapseEventsController = new AbortController();
    const signal = state.collapseEventsController.signal;

    const collapses = state.rootEl.querySelectorAll(".att-collapse");
    collapses.forEach(function (col) {
      const targetId = col.id;
      const header = state.rootEl.querySelector(`[data-bs-target="#${targetId}"]`);
      if (!header) return;
      const arrowEl = header.querySelector('[data-role="collapse-arrow"]');
      if (!arrowEl) return;

      const updateArrow = function () {
        const isShown = col.classList.contains("show");
        arrowEl.textContent = isShown ? "▲" : "▼";
        header.setAttribute("aria-expanded", isShown ? "true" : "false");
      };

      col.addEventListener("shown.bs.collapse", updateArrow, { signal });
      col.addEventListener("hidden.bs.collapse", updateArrow, { signal });
      updateArrow();
    });
  }

  global.AttendanceDailyHandlers = {
    bindBaseEvents: bindBaseEvents,
    bindRowEvents: bindRowEvents,
    bindSummaryEvents: bindSummaryEvents,
    bindCollapseArrows: bindCollapseArrows
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Daily Attendance UI
 * Orquesta la asistencia diaria usando state/render/handlers/data.
 */

(function (global) {
    const AttendanceDailyUI = (() => {
        const state = global.AttendanceDailyState;
        const render = global.AttendanceDailyRender;
        const handlers = global.AttendanceDailyHandlers;
        const data = global.AttendanceDailyData;

        function ensureDeps() {
            if (!state || !render || !handlers) {
                console.error("AttendanceDaily modules no disponibles");
                return false;
            }
            return true;
        }

        function renderPanel(container) {
            if (!ensureDeps()) return;
            state.setRoot(container);
            const initialDate = state.consumePendingFecha() || state.getTodayIso();
            state.reset(initialDate);

            render.renderLayout(container, state.fecha);
            render.renderRows("Cargando...");

            handlers.bindBaseEvents({
                onDateChange: function (fecha) {
                    state.setFecha(fecha);
                    state.setRows([]);
                    render.renderRows("Cargando...");
                    render.renderDailySummary();
                    loadPlan(state.fecha);
                },
                onAddRow: function () {
                    addExtraRow();
                },
                onSave: function () {
                    save();
                }
            });

            render.setLoading(true);
            if (data && typeof data.loadReference === "function") {
                data.loadReference()
                    .then(function (refs) {
                        state.setReference(refs || { clientes: [], empleados: [] });
                        return loadPlan(state.fecha);
                    })
                    .catch(function () {
                        state.setReference({ clientes: [], empleados: [] });
                        return loadPlan(state.fecha);
                    });
            } else {
                state.setReference({ clientes: [], empleados: [] });
                loadPlan(state.fecha);
            }
        }

        function loadPlan(fecha) {
            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para cargar asistencia.", "warning");
                return Promise.resolve([]);
            }

            state.setRows([]);
            render.renderRows("Cargando...");
            render.renderDailySummary();
            render.setLoading(true);

            if (!data || typeof data.loadDailyPlan !== "function") {
                render.renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                render.setLoading(false);
                return Promise.resolve([]);
            }

            return data.loadDailyPlan(fecha)
                .then(function (rows) {
                    if (rows && rows.ignored) return;
                    const list = Array.isArray(rows) ? rows : [];
                    state.setRows(list.map((r, idx) => state.normalizeRow(r, false, idx)));

                    applyPendingFocus();

                    if (!state.rows.length) {
                        addExtraRow(true);
                    }

                    render.renderRows();
                    handlers.bindRowEvents({
                        onUpdateRow: updateRow,
                        onRemoveRow: removeRow
                    });
                    handlers.bindCollapseArrows();
                    render.renderDailySummary();
                })
                .catch(function (err) {
                    if (Alerts && typeof Alerts.showError === "function") {
                        Alerts.showError("Error al cargar plan diario", err);
                    } else {
                        console.error("Error cargando plan diario:", err);
                        Alerts && Alerts.showAlert("Error al cargar plan diario", "danger");
                    }
                    state.setRows([]);
                    render.renderRows("No pudimos cargar el plan diario. Intentá de nuevo.");
                })
                .finally(function () {
                    render.setLoading(false);
                    render.renderDailySummary();
                });
        }

        function addExtraRow(skipRender) {
            const newRow = state.normalizeRow({ asistencia: true }, true);
            newRow._autoOpen = true;
            state.rows.unshift(newRow);

            if (!skipRender) {
                render.renderRows();
                handlers.bindRowEvents({
                    onUpdateRow: updateRow,
                    onRemoveRow: removeRow
                });
                handlers.bindCollapseArrows();
                render.renderDailySummary();
            }
        }

        function updateRow(uid, patch) {
            const row = state.rows.find(r => r.uid === uid);
            if (!row) return;
            Object.assign(row, patch || {});
            render.renderDailySummary();
        }

        function removeRow(uid) {
            const idx = state.rows.findIndex(r => r.uid === uid);
            if (idx === -1) return;
            const removed = state.rows[idx];
            if (removed && (removed.idAsistencia || removed.asistenciaRowNumber || removed.idCliente || removed.idEmpleado)) {
                if (!Array.isArray(state.removedRows)) state.removedRows = [];
                state.removedRows.push({
                    idAsistencia: removed.idAsistencia || null,
                    asistenciaRowNumber: removed.asistenciaRowNumber || null,
                    idCliente: removed.idCliente || "",
                    idEmpleado: removed.idEmpleado || ""
                });
            }
            state.rows.splice(idx, 1);
            render.renderRows();
            handlers.bindRowEvents({
                onUpdateRow: updateRow,
                onRemoveRow: removeRow
            });
            handlers.bindCollapseArrows();
            render.renderDailySummary();
        }

        function applyPendingFocus() {
            const pending = state.consumePendingFocus();
            if (!pending) return;

            const targetEmp = (pending.empleado || '').toString().toLowerCase().trim();
            const targetCli = (pending.cliente || '').toString().toLowerCase().trim();

            let matched = null;
            if (targetEmp || targetCli) {
                matched = state.rows.find(function (r) {
                    const emp = (r.empleado || '').toString().toLowerCase().trim();
                    const cli = (r.cliente || '').toString().toLowerCase().trim();
                    return emp === targetEmp && cli === targetCli;
                });
            }

            if (matched) {
                matched._autoOpen = true;
                if (pending.horas != null) matched.horasReales = pending.horas;
                if (pending.observaciones != null) matched.observaciones = pending.observaciones;
            } else if (targetEmp || targetCli) {
                const extra = state.normalizeRow({
                    cliente: pending.cliente || '',
                    empleado: pending.empleado || '',
                    asistencia: true,
                    horasReales: pending.horas != null ? pending.horas : '',
                    observaciones: pending.observaciones || ''
                }, true);
                extra._autoOpen = true;
                state.rows.unshift(extra);
            }
        }

        function openModalForDate(fecha) {
            if (!GridManager || !FormManager) return;
            state.setPendingFecha(fecha);

            GridManager.openModal("Asistencia del día", function () {
                FormManager.renderForm("ASISTENCIA");
            });
        }

        function openForDate(fecha) {
            if (!state.rootEl || !fecha) return;
            state.reset(fecha);
            const dateInput = state.rootEl.querySelector("#attendance-date");
            if (dateInput) {
                dateInput.value = fecha;
            }
            render.renderRows("Cargando...");
            render.renderDailySummary();
            loadPlan(fecha);
        }

        function openForDateWithFocus(fecha, empleado, cliente, extras) {
            state.setPendingFocus({
                empleado: empleado,
                cliente: cliente,
                horas: extras && extras.horas != null ? extras.horas : null,
                observaciones: extras && extras.observaciones ? extras.observaciones : ''
            });
            openForDate(fecha);
        }

        function save() {
            const root = state.rootEl;
            const fechaInput = root ? root.querySelector("#attendance-date") : null;
            const fecha = fechaInput ? fechaInput.value : state.fecha;

            if (state.loading) {
                if (Alerts) Alerts.showAlert("Ya estamos guardando la asistencia.", "warning");
                return;
            }

            if (!fecha) {
                if (Alerts) Alerts.showAlert("Elegí una fecha para guardar asistencia.", "warning");
                return;
            }

            if (!state.rows.length) {
                if (Alerts) Alerts.showAlert("No hay filas para guardar.", "warning");
                return;
            }

            const filaIncompleta = state.rows.find(r => !r.cliente || !r.empleado);
            if (filaIncompleta) {
                if (Alerts) Alerts.showAlert("Completá cliente y empleado en todas las filas.", "warning");
                return;
            }
            const filaSinId = state.rows.find(r => !r.idCliente || !r.idEmpleado);
            if (filaSinId) {
                if (Alerts) Alerts.showAlert("Seleccioná cliente y empleado desde la lista para guardar IDs.", "warning");
                return;
            }

            const saveBtn = root ? root.querySelector("#attendance-save") : null;

            state.setLoading(true);
            if (saveBtn) saveBtn.disabled = true;
            UiState.setGlobalLoading(true, "Guardando asistencia...");

            const payload = {
                rows: state.rows.map(r => ({
                    cliente: r.cliente,
                    idCliente: r.idCliente || "",
                    empleado: r.empleado,
                    idEmpleado: r.idEmpleado || "",
                    asistencia: !!r.asistencia,
                    horasReales: r.horasReales !== undefined && r.horasReales !== null ? r.horasReales : "",
                    horasPlan: r.horasPlan !== undefined && r.horasPlan !== null ? r.horasPlan : "",
                    observaciones: r.observaciones || "",
                    asistenciaRowNumber: r.asistenciaRowNumber || null,
                    idAsistencia: r.idAsistencia || null
                })),
                removed: Array.isArray(state.removedRows) ? state.removedRows.slice() : [],
                purgeMissing: true
            };

            if (!data || typeof data.saveDailyAttendance !== "function") {
                if (Alerts) Alerts.showAlert("No se puede guardar la asistencia en este momento.", "danger");
                UiState.setGlobalLoading(false);
                state.setLoading(false);
                if (saveBtn) saveBtn.disabled = false;
                return;
            }

            data.saveDailyAttendance(fecha, payload)
                .then(function (res) {
                    const deletedCount = Array.isArray(res) && typeof res.deleted === "number"
                        ? res.deleted
                        : (res && typeof res.deleted === "number" ? res.deleted : 0);
                    if (Array.isArray(res) && res.length) {
                        const byKey = new Map();
                        res.forEach(function (item) {
                            if (!item) return;
                            const key = String(item.idCliente || '').trim() + '||' + String(item.idEmpleado || '').trim();
                            if (!key || !item.idAsistencia) return;
                            if (!byKey.has(key)) byKey.set(key, item.idAsistencia);
                        });
                        if (byKey.size) {
                            state.rows.forEach(function (row) {
                                const key = String(row.idCliente || '').trim() + '||' + String(row.idEmpleado || '').trim();
                                if (byKey.has(key)) {
                                    row.idAsistencia = byKey.get(key);
                                }
                            });
                        }
                    }
                    if (Alerts) {
                        const msg = deletedCount > 0
                            ? "Asistencia guardada correctamente. Se eliminaron " + deletedCount + " registros."
                            : "Asistencia guardada correctamente.";
                        Alerts.showAlert(msg, "success");
                    }
                    state.removedRows = [];
                    if (GridManager) GridManager.refreshGrid();
                })
                .catch(function (err) {
                    if (Alerts && typeof Alerts.showError === "function") {
                        Alerts.showError("Error al guardar asistencia", err);
                    } else {
                        Alerts && Alerts.showAlert("Error al guardar asistencia", "danger");
                    }
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                    state.setLoading(false);
                    if (saveBtn) saveBtn.disabled = false;
                });
        }

        function renderSummary(records) {
            if (!ensureDeps()) return;
            render.renderSummary(records);
            handlers.bindSummaryEvents(openModalForDate);
        }

        return {
            render: renderPanel,
            renderSummary: renderSummary,
            openForDate: openForDate,
            openForDateWithFocus: openForDateWithFocus,
            save: save
        };
    })();

    global.AttendanceDailyUI = AttendanceDailyUI;
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const AttendancePanelsState = {
        dailyController: null
    };

    global.AttendancePanelsState = AttendancePanelsState;
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const WEEKLY_CACHE_TTL_MS = 5 * 60 * 1000;
    const weeklyCache = { data: null, ts: 0, inFlight: null };

    const AttendancePanelsData = {
        fetchDailyAttendance: function (tipoFormato, fecha) {
            if (!global.AttendanceDailyData || typeof global.AttendanceDailyData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            return global.AttendanceDailyData.searchRecords(tipoFormato, fecha);
        },
        searchWeeklyPlans: function (query, options) {
            if (!global.RecordsData || typeof global.RecordsData.searchRecords !== "function") {
                return Promise.resolve([]);
            }
            const q = query || "";
            const force = options && options.force;
            if (!q && !force && weeklyCache.data && (Date.now() - weeklyCache.ts) < WEEKLY_CACHE_TTL_MS) {
                return Promise.resolve(weeklyCache.data);
            }
            if (!q && !force && weeklyCache.inFlight) {
                return weeklyCache.inFlight;
            }
            const request = global.RecordsData.searchRecords("ASISTENCIA_PLAN", q)
                .then(function (records) {
                    if (records && records.ignored) return records;
                    if (!q) {
                        weeklyCache.data = records || [];
                        weeklyCache.ts = Date.now();
                    }
                    weeklyCache.inFlight = null;
                    return records;
                })
                .catch(function (err) {
                    weeklyCache.inFlight = null;
                    throw err;
                });
            if (!q) {
                weeklyCache.inFlight = request;
            }
            return request;
        },
        prefetchWeeklyPlans: function () {
            return AttendancePanelsData.searchWeeklyPlans("", { force: true })
                .catch(function () {
                    return null;
                });
        }
    };

    global.AttendancePanelsData = AttendancePanelsData;
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const Dom = global.DomHelpers || null;

    function renderDailyPanel(container) {
        if (!container) return null;
        if (Dom) {
            Dom.clear(container);
        } else {
            container.textContent = "";
        }

        const gridWrapper = document.createElement("div");
        gridWrapper.className = "card shadow-sm p-3 mb-4";

        const title = document.createElement("h5");
        title.className = "card-title mb-3";
        title.textContent = "Asistencia Diaria";

        const tableWrap = document.createElement("div");
        tableWrap.className = "table-responsive";

        const table = document.createElement("table");
        table.className = "table table-hover";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        headRow.id = "grid-headers";
        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        tbody.id = "grid-body";

        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrap.appendChild(table);

        gridWrapper.appendChild(title);
        gridWrapper.appendChild(tableWrap);
        container.appendChild(gridWrapper);

        return { container, gridWrapper, table, headRow, tbody };
    }

    global.AttendancePanelsRender = {
        renderDailyPanel: renderDailyPanel
    };
})(typeof window !== "undefined" ? window : this);


(function (global) {
    const state = global.AttendancePanelsState;

    function bindDateChange(dateInput, loadFn) {
        if (!dateInput || typeof loadFn !== "function") return;
        if (state && state.dailyController) {
            state.dailyController.abort();
        }
        if (state) {
            state.dailyController = new AbortController();
            dateInput.addEventListener("change", loadFn, { signal: state.dailyController.signal });
        } else {
            dateInput.addEventListener("change", loadFn);
        }
    }

    function createDailyLoader(tipoFormato) {
        const data = global.AttendancePanelsData;
        return function loadAttendance() {
            const dateInput = document.getElementById("field-fecha");
            const fecha = dateInput ? dateInput.value : "";
            if (!data || typeof data.fetchDailyAttendance !== "function") {
                if (global.GridManager) {
                    global.GridManager.renderGrid(tipoFormato, []);
                }
                return;
            }
            data.fetchDailyAttendance(tipoFormato, fecha)
                .then(function (records) {
                    if (global.GridManager) {
                        global.GridManager.renderGrid(tipoFormato, records || []);
                    }
                })
                .catch(function (err) {
                    if (global.Alerts && typeof global.Alerts.showError === "function") {
                        global.Alerts.showError("Error cargando asistencia", err);
                    } else {
                        console.error("Error cargando asistencia:", err);
                    }
                    if (global.GridManager) {
                        global.GridManager.renderGrid(tipoFormato, []);
                    }
                });
        };
    }

    global.AttendancePanelsHandlers = {
        bindDateChange: bindDateChange,
        createDailyLoader: createDailyLoader
    };
})(typeof window !== "undefined" ? window : this);


/**
 * Attendance Panels - Consolidated
 * Wrapper para todos los paneles de asistencia
 */

(function (global) {
    const AttendancePanels = (() => {
        const render = global.AttendancePanelsRender;
        const handlers = global.AttendancePanelsHandlers;

        function setupWeeklyPlanPanel() {
            // Delegar la creación del panel semanal al módulo centralizado WeeklyPlanPanel
            if (typeof WeeklyPlanPanel !== 'undefined' && WeeklyPlanPanel.setup) {
                WeeklyPlanPanel.setup();
            } else {
                console.error('WeeklyPlanPanel no está disponible');
                if (typeof Alerts !== 'undefined' && Alerts) {
                    if (Alerts.notifyError) {
                        Alerts.notifyError('Error al cargar el plan semanal', new Error('WeeklyPlanPanel no está disponible'));
                    } else if (Alerts.showError) {
                        Alerts.showError('Error al cargar el plan semanal', new Error('WeeklyPlanPanel no está disponible'));
                    } else {
                        Alerts.showAlert('Error al cargar el plan semanal.', 'danger');
                    }
                }
            }
        }

        function setupDailyPanel() {
            // Contenedor donde se mostrará la grilla de asistencia diaria
            const container = document.getElementById('daily-attendance-panel');
            if (!container) return;

            if (render && typeof render.renderDailyPanel === "function") {
                render.renderDailyPanel(container);
            }

            const loadAttendance = handlers && typeof handlers.createDailyLoader === "function"
                ? handlers.createDailyLoader("ASISTENCIA")
                : function () { };

            loadAttendance();

            const dateInput = document.getElementById("field-fecha");
            if (handlers && typeof handlers.bindDateChange === "function") {
                handlers.bindDateChange(dateInput, loadAttendance);
            }
        }

        return {
            setupWeeklyPlanPanel,
            setupDailyPanel
        };
    })();

    global.AttendancePanels = AttendancePanels;
})(typeof window !== "undefined" ? window : this);


/**
 * EmployeeCalendarData
 * Capa de datos para calendario de empleados.
 */
(function (global) {
  const EMP_CACHE_TTL_MS = 5 * 60 * 1000;
  const employeeCache = { list: null, ts: 0, inFlight: null };

  function isCacheFresh() {
    return !!(employeeCache.list && (Date.now() - employeeCache.ts) < EMP_CACHE_TTL_MS);
  }

  function storeCache(list) {
    employeeCache.list = Array.isArray(list) ? list : [];
    employeeCache.ts = Date.now();
    return employeeCache.list;
  }

  function loadEmployeesFromReference() {
    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const ref = global.ReferenceService.get();
        return ref && ref.empleados ? ref.empleados : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando empleados", err, { silent: true });
        } else {
          console.warn("Error cargando empleados:", err);
        }
        return [];
      });
  }

  function loadEmployees(options) {
    const force = options && options.force;
    if (!force && isCacheFresh()) {
      return Promise.resolve(employeeCache.list);
    }
    if (!force && employeeCache.inFlight) {
      return employeeCache.inFlight;
    }

    const request = (global.AttendanceService && typeof global.AttendanceService.getEmpleadosConId === "function")
      ? global.AttendanceService.getEmpleadosConId()
          .then((items) => storeCache(items || []))
          .catch((err) => {
            if (Alerts && Alerts.notifyError) {
              Alerts.notifyError("Error cargando empleados", err, { silent: true });
            } else {
              console.warn("Error cargando empleados:", err);
            }
            return loadEmployeesFromReference().then(storeCache);
          })
      : loadEmployeesFromReference().then(storeCache);

    if (!force) {
      employeeCache.inFlight = request;
    }

    return request.finally(function () {
      employeeCache.inFlight = null;
    });
  }

  function fetchSchedule(options) {
    if (!global.ApiService || typeof global.ApiService.call !== "function") {
      return Promise.resolve({});
    }
    const opts = options || {};
    const weekStartDate = opts.weekStartDate || "";
    const allEmployees = !!opts.allEmployees;
    const apiName = allEmployees ? "getWeeklyEmployeeOverview" : "getEmployeeWeeklySchedule";
    const payload = allEmployees
      ? { weekStartDate: weekStartDate }
      : {
          empleado: opts.empleado || "",
          idEmpleado: opts.idEmpleado || "",
          weekStartDate: weekStartDate
        };
    return global.ApiService.call(apiName, payload);
  }

  function generatePdf(payload) {
    if (!global.AttendanceService || typeof global.AttendanceService.generateEmployeeSchedulePdf !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.generateEmployeeSchedulePdf(payload);
  }

  function listClientMedia(clienteId) {
    if (!global.AttendanceService || typeof global.AttendanceService.listClientMedia !== "function") {
      return Promise.resolve({ fachada: [], llave: [] });
    }
    return global.AttendanceService.listClientMedia(clienteId);
  }

  function getClientMediaImage(fileId, size) {
    if (!global.AttendanceService || typeof global.AttendanceService.getClientMediaImage !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.getClientMediaImage(fileId, size);
  }

  global.EmployeeCalendarData = {
    loadEmployees: loadEmployees,
    prefetchEmployees: function () {
      return loadEmployees({ force: true }).catch(function () {
        return [];
      });
    },
    fetchSchedule: fetchSchedule,
    generatePdf: generatePdf,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Employee Calendar Panel
 * Vista de calendario semanal para mostrar la agenda de un empleado
 * con posibilidad de generar PDF "Hoja de Ruta"
 */

(function (global) {
    const EmployeeCalendarPanel = (() => {
        // State
        let currentEmpleado = null;
        let currentIdEmpleado = null;
        let currentWeekStart = null;
        let scheduleData = null;
        let empleadosList = [];
        let isAllEmployees = false;
        let eventsController = null;

        const ALL_EMPLOYEES_VALUE = '__ALL__';
        const Dom = global.DomHelpers || (function () {
            function text(value) {
                return document.createTextNode(value == null ? "" : String(value));
            }
            function setAttrs(el, attrs) {
                if (!attrs) return;
                Object.keys(attrs).forEach(key => {
                    const val = attrs[key];
                    if (val == null) return;
                    if (key === "class" || key === "className") {
                        el.className = String(val);
                        return;
                    }
                    if (key === "text") {
                        el.textContent = String(val);
                        return;
                    }
                    if (key === "dataset" && typeof val === "object") {
                        Object.keys(val).forEach(dataKey => {
                            if (val[dataKey] != null) el.dataset[dataKey] = String(val[dataKey]);
                        });
                        return;
                    }
                    if (key === "style" && typeof val === "object") {
                        Object.keys(val).forEach(styleKey => {
                            el.style[styleKey] = val[styleKey];
                        });
                        return;
                    }
                    el.setAttribute(key, String(val));
                });
            }
            function append(parent, child) {
                if (!parent || child == null) return;
                if (Array.isArray(child)) {
                    child.forEach(c => append(parent, c));
                    return;
                }
                if (typeof child === "string" || typeof child === "number") {
                    parent.appendChild(text(child));
                    return;
                }
                parent.appendChild(child);
            }
            function el(tag, attrs, children) {
                const node = document.createElement(tag);
                setAttrs(node, attrs);
                append(node, children);
                return node;
            }
            function clear(el) {
                if (!el) return;
                while (el.firstChild) el.removeChild(el.firstChild);
            }
            return { el, text, clear, append };
        })();

        const EmployeeCalendarData = global.EmployeeCalendarData || null;

        function formatHoras(h) {
            const num = Number(h);
            return isNaN(num) ? '0' : num.toFixed(1).replace('.0', '');
        }

        function getClienteDisplayName(cliente) {
            if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
                return DomainHelpers.getClientDisplayName(cliente);
            }
            if (!cliente) return '';
            if (typeof cliente === 'string') return cliente;
            return cliente.nombre || cliente.cliente || cliente.razonSocial || '';
        }

        function getMondayOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }

        function renderEmptyState(container, message) {
            if (!container) return;
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(container, { variant: 'empty', title: 'Sin datos', message: message });
                return;
            }
            Dom.clear(container);
            container.appendChild(
                Dom.el('div', { className: 'text-center text-muted py-5' }, [
                    Dom.el('i', { className: 'bi bi-calendar3 display-4 mb-3 d-block opacity-50' }),
                    Dom.el('p', { className: 'mb-0', text: message })
                ])
            );
        }

        function renderLoadingState(container, message) {
            if (!container) return;
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(container, { variant: 'loading', message: message || 'Cargando...' });
                return;
            }
            Dom.clear(container);
            container.appendChild(
                Dom.el('div', { className: 'text-center py-5' }, [
                    Dom.el('div', { className: 'spinner-border text-primary' }),
                    Dom.el('div', { className: 'mt-2 text-muted', text: message || 'Cargando...' })
                ])
            );
        }

        function formatDateISO(date) {
            if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.formatDateISO === 'function') {
                return DomainHelpers.formatDateISO(date);
            }
            const d = new Date(date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        function addDays(date, days) {
            const d = new Date(date);
            d.setDate(d.getDate() + days);
            return d;
        }

        /**
         * Renderiza el panel completo
         */
        function render(containerId) {
            const container = typeof containerId === 'string'
                ? document.getElementById(containerId)
                : containerId || document.getElementById('employee-calendar-panel');

            if (!container) return;

            // Inicializar semana actual
            if (!currentWeekStart) {
                currentWeekStart = getMondayOfWeek(new Date());
            }

            if (typeof AttendanceTemplates === "undefined" || !AttendanceTemplates || typeof AttendanceTemplates.buildEmployeeCalendarPanelHtml !== "function") {
                console.error("AttendanceTemplates no disponible");
                return;
            }
            // safe static: layout fijo sin datos externos.
            container.innerHTML = AttendanceTemplates.buildEmployeeCalendarPanelHtml();
            const gridContainer = container.querySelector('#calendar-grid-container');
            if (gridContainer) {
                renderEmptyState(gridContainer, 'Selecciona un empleado para ver su calendario');
            }
            attachEvents(container);
            loadEmpleados();
        }

        /**
         * Renderiza la grilla del calendario
         */
        function renderCalendarGrid(data) {
            const container = document.getElementById('calendar-grid-container');
            if (!container) return;
            if (!data || !data.dias) {
                renderEmptyState(container, 'Sin datos para mostrar');
                return;
            }

            const dias = data.dias;

            Dom.clear(container);
            const grid = Dom.el('div', { className: 'calendar-week-grid' });
            const row = Dom.el('div', { className: 'calendar-days-row' });
            grid.appendChild(row);

            dias.forEach((dia, idx) => {
                const hasClients = dia.clientes && dia.clientes.length > 0;
                const isWeekend = idx >= 5;
                const dayClasses = [
                    'calendar-day',
                    hasClients ? 'calendar-day--has-work' : 'calendar-day--free',
                    isWeekend ? 'calendar-day--weekend' : ''
                ].filter(Boolean).join(' ');

                const day = Dom.el('div', { className: dayClasses });
                const header = Dom.el('div', { className: 'calendar-day-header' }, [
                    Dom.el('span', { className: 'calendar-day-name', text: dia.diaDisplay || '' }),
                    Dom.el('span', { className: 'calendar-day-date', text: dia.fechaDisplay || '' })
                ]);
                const content = Dom.el('div', { className: 'calendar-day-content' });

                if (hasClients) {
                    dia.clientes.forEach(cliente => {
                        const horasDisplay = formatHoras(cliente.horasPlan);
                        const direccionShort = cliente.direccion
                            ? (cliente.direccion.length > 30 ? cliente.direccion.substring(0, 30) + '...' : cliente.direccion)
                            : '';
                        const displayName = getClienteDisplayName(cliente);

                        const card = Dom.el('div', {
                            className: 'calendar-client-card',
                            dataset: {
                                clienteId: cliente.idCliente || '',
                                clienteNombre: displayName,
                                dia: dia.diaSemana || ''
                            }
                        });
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-name', title: displayName }, [
                                Dom.el('i', { className: 'bi bi-building me-1' }),
                                Dom.text(displayName)
                            ])
                        );
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-time' }, [
                                Dom.el('i', { className: 'bi bi-clock me-1' }),
                                Dom.text(cliente.horaEntrada || '--:--'),
                                Dom.el('span', { className: 'badge bg-primary ms-1', text: `${horasDisplay} hs` })
                            ])
                        );
                        if (direccionShort) {
                            card.appendChild(
                                Dom.el('div', { className: 'calendar-client-address', title: cliente.direccion || '' }, [
                                    Dom.el('i', { className: 'bi bi-geo-alt me-1' }),
                                    Dom.text(direccionShort)
                                ])
                            );
                        }
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-expand' }, [
                                Dom.el('i', { className: 'bi bi-eye' }),
                                Dom.text(' Ver detalles')
                            ])
                        );
                        card.addEventListener('click', () => {
                            showClientDetails(card.dataset.clienteId, card.dataset.clienteNombre, card.dataset.dia);
                        });
                        content.appendChild(card);
                    });
                } else {
                    content.appendChild(
                        Dom.el('div', { className: 'calendar-no-work' }, [
                            Dom.el('i', { className: 'bi bi-moon-stars opacity-50' }),
                            Dom.el('span', { text: 'Sin asignación' })
                        ])
                    );
                }

                day.appendChild(header);
                day.appendChild(content);
                row.appendChild(day);
            });

            container.appendChild(grid);
        }

        function renderAllEmployeesGrid(data) {
            const container = document.getElementById('calendar-grid-container');
            if (!container) return;

            if (!data || !data.dias || data.dias.length === 0) {
                renderEmptyState(container, 'Sin datos para mostrar');
                return;
            }

            Dom.clear(container);
            const grid = Dom.el('div', { className: 'calendar-week-grid' });
            const row = Dom.el('div', { className: 'calendar-days-row' });
            grid.appendChild(row);

            data.dias.forEach((dia, idx) => {
                const hasEmployees = dia.empleados && dia.empleados.length > 0;
                const isWeekend = idx >= 5;
                const dayClasses = [
                    'calendar-day',
                    hasEmployees ? 'calendar-day--has-work' : 'calendar-day--free',
                    isWeekend ? 'calendar-day--weekend' : ''
                ].filter(Boolean).join(' ');

                const day = Dom.el('div', { className: dayClasses });
                const header = Dom.el('div', { className: 'calendar-day-header' }, [
                    Dom.el('span', { className: 'calendar-day-name', text: dia.diaDisplay || '' }),
                    Dom.el('span', { className: 'calendar-day-date', text: dia.fechaDisplay || '' })
                ]);
                const content = Dom.el('div', { className: 'calendar-day-content' });

                if (hasEmployees) {
                    dia.empleados.forEach(emp => {
                        const clientes = Array.isArray(emp.clientes) ? emp.clientes : [];
                        const uniqueClientes = [];
                        const seen = new Set();
                        clientes.forEach(c => {
                            const key = c.idCliente ? String(c.idCliente).trim() : '';
                            if (!key || seen.has(key)) return;
                            seen.add(key);
                            uniqueClientes.push(c);
                        });

                        const card = Dom.el('div', { className: 'calendar-client-card calendar-client-card--summary' });
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-name', title: emp.empleado || '' }, [
                                Dom.el('i', { className: 'bi bi-person-workspace me-1' }),
                                Dom.text(emp.empleado || 'Sin asignar')
                            ])
                        );
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-time' }, [
                                Dom.el('i', { className: 'bi bi-clock me-1' }),
                                Dom.text(`${formatHoras(emp.totalHoras)} hs`)
                            ])
                        );
                        if (uniqueClientes.length) {
                            const chips = Dom.el('div', { className: 'calendar-client-employees' });
                            uniqueClientes.forEach(c => {
                                const nombre = getClienteDisplayName(c);
                                const detalles = [];
                                if (c.horaEntrada) detalles.push(c.horaEntrada);
                                if (c.horasPlan) detalles.push(`${formatHoras(c.horasPlan)} hs`);
                                const title = detalles.length ? `${nombre} · ${detalles.join(' · ')}` : nombre;
                                chips.appendChild(Dom.el('span', { className: 'calendar-emp-chip', title: title, text: nombre }));
                            });
                            card.appendChild(chips);
                        }
                        content.appendChild(card);
                    });
                } else {
                    content.appendChild(
                        Dom.el('div', { className: 'calendar-no-work' }, [
                            Dom.el('i', { className: 'bi bi-moon-stars opacity-50' }),
                            Dom.el('span', { text: 'Sin asignaciones' })
                        ])
                    );
                }

                day.appendChild(header);
                day.appendChild(content);
                row.appendChild(day);
            });

            container.appendChild(grid);
        }

        function buildInfoRow(iconClass, content, alignStart) {
            const row = Dom.el('div', {
                className: alignStart ? 'd-flex align-items-start gap-2' : 'd-flex align-items-center gap-2'
            });
            row.appendChild(Dom.el('i', { className: iconClass + (alignStart ? ' mt-1' : '') }));
            Dom.append(row, content);
            return row;
        }

        function buildLabelValue(label, value) {
            return Dom.el('span', null, [
                Dom.el('strong', { text: label }),
                Dom.text(' ' + value)
            ]);
        }

        /**
         * Muestra modal con detalles del cliente
         */
        function showClientDetails(clienteId, clienteNombre, diaSemana) {
            if (!scheduleData || !scheduleData.dias) return;

            // Buscar el cliente en los datos
            let clienteData = null;
            scheduleData.dias.forEach(dia => {
                if (dia.diaSemana !== diaSemana) return;
                const c = dia.clientes.find(cl => {
                    if (clienteId) {
                        return String(cl.idCliente || '') === String(clienteId);
                    }
                    return clienteNombre && String(cl.cliente || '').trim() === String(clienteNombre).trim();
                });
                if (c) clienteData = c;
            });

            if (!clienteData) return;

            const modalId = 'client-detail-modal';
            const oldModal = document.getElementById(modalId);
            if (oldModal) oldModal.remove();

            const titleText = getClienteDisplayName(clienteData) || clienteNombre || 'Cliente';
            const header = Dom.el('div', { className: 'modal-header bg-primary text-white' }, [
                Dom.el('h5', { className: 'modal-title' }, [
                    Dom.el('i', { className: 'bi bi-building me-2' }),
                    Dom.text(titleText)
                ]),
                Dom.el('button', {
                    type: 'button',
                    className: 'btn-close btn-close-white',
                    'data-bs-dismiss': 'modal',
                    'aria-label': 'Cerrar'
                })
            ]);

            const visitInfoList = Dom.el('div', { className: 'd-flex flex-column gap-2' }, [
                buildInfoRow('bi bi-clock text-primary', buildLabelValue('Horario:', clienteData.horaEntrada || 'No especificado')),
                buildInfoRow('bi bi-hourglass-split text-primary', buildLabelValue('Horas:', `${formatHoras(clienteData.horasPlan)} hs`))
            ]);

            const visitInfo = Dom.el('div', { className: 'col-md-6' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-info-circle me-1' }),
                    Dom.text('Información de la visita')
                ]),
                visitInfoList
            ]);

            if (clienteData.observaciones) {
                visitInfoList.appendChild(
                    buildInfoRow(
                        'bi bi-sticky text-warning',
                        buildLabelValue('Obs:', String(clienteData.observaciones || '')),
                        true
                    )
                );
            }

            const clientInfoList = Dom.el('div', { className: 'd-flex flex-column gap-2' });
            if (clienteData.idCliente) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-hash text-secondary', buildLabelValue('ID:', String(clienteData.idCliente)))
                );
            }
            if (clienteData.direccion) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-geo-alt text-danger', Dom.el('span', { text: String(clienteData.direccion) }), true)
                );
            }
            if (clienteData.telefono) {
                const tel = String(clienteData.telefono);
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-telephone text-success', Dom.el('a', { href: 'tel:' + tel, text: tel }))
                );
            }
            if (clienteData.encargado) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-person text-info', buildLabelValue('Contacto:', String(clienteData.encargado)))
                );
            }
            if (clienteData.correo) {
                const mail = String(clienteData.correo);
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-envelope text-primary', Dom.el('a', { href: 'mailto:' + mail, text: mail }))
                );
            }

            const clientInfo = Dom.el('div', { className: 'col-md-6' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-building me-1' }),
                    Dom.text('Datos del cliente')
                ]),
                clientInfoList
            ]);

            const photosContainer = Dom.el('div', {
                className: 'row g-3',
                id: 'client-photos-container'
            });

            const photosSection = Dom.el('div', { id: 'client-detail-photos', className: 'mt-4 d-none' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-images me-1' }),
                    Dom.text('Fotos del local')
                ]),
                photosContainer
            ]);

            const body = Dom.el('div', { className: 'modal-body' }, [
                Dom.el('div', { className: 'row g-4' }, [visitInfo, clientInfo]),
                photosSection
            ]);

            const footer = Dom.el('div', { className: 'modal-footer' }, [
                Dom.el('button', {
                    type: 'button',
                    className: 'btn btn-secondary',
                    'data-bs-dismiss': 'modal'
                }, 'Cerrar')
            ]);

            if (clienteData.direccion) {
                const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(String(clienteData.direccion));
                footer.appendChild(
                    Dom.el('a', {
                        href: mapUrl,
                        target: '_blank',
                        className: 'btn btn-outline-primary'
                    }, [
                        Dom.el('i', { className: 'bi bi-map me-1' }),
                        Dom.text('Ver en mapa')
                    ])
                );
            }

            const modalEl = Dom.el('div', { className: 'modal fade', id: modalId, tabindex: '-1' }, [
                Dom.el('div', { className: 'modal-dialog modal-lg modal-dialog-centered' }, [
                    Dom.el('div', { className: 'modal-content' }, [
                        header,
                        body,
                        footer
                    ])
                ])
            ]);

            document.body.appendChild(modalEl);
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
            });

            if (clienteId && EmployeeCalendarData && typeof EmployeeCalendarData.listClientMedia === 'function') {
                loadClientPhotos(clienteId);
            }
        }

        /**
         * Carga las fotos del cliente para el modal
         */
        function loadClientPhotos(clienteId) {
            const photosSection = document.getElementById('client-detail-photos');
            const photosContainer = document.getElementById('client-photos-container');

            if (!photosSection || !photosContainer) return;

            renderLoadingState(photosContainer, 'Cargando fotos...');

            if (!EmployeeCalendarData || typeof EmployeeCalendarData.listClientMedia !== 'function') {
                photosSection.classList.add('d-none');
                return;
            }

            EmployeeCalendarData.listClientMedia(clienteId)
                .then(media => {
                    const fachada = media && Array.isArray(media.fachada) ? media.fachada : [];
                    const llave = media && Array.isArray(media.llave) ? media.llave : [];

                    if (!fachada.length && !llave.length) {
                        photosSection.classList.add('d-none');
                        return;
                    }

                    photosSection.classList.remove('d-none');
                    Dom.clear(photosContainer);

                    const buildGroup = (items, title, icon, iconClass) => {
                        const count = items.length;
                        const header = Dom.el('div', { className: 'd-flex align-items-center justify-content-between mb-2' }, [
                            Dom.el('div', { className: 'd-flex align-items-center gap-2' }, [
                                Dom.el('i', { className: `bi ${icon} ${iconClass}` }),
                                Dom.el('span', { className: 'fw-semibold small', text: title })
                            ]),
                            Dom.el('span', { className: 'small text-muted', text: `${count} foto${count === 1 ? '' : 's'}` })
                        ]);

                        const thumbs = Dom.el('div', { className: 'd-flex flex-wrap gap-2' });
                        if (count) {
                            items.forEach(photo => {
                                const mime = photo.mimeType || 'image/jpeg';
                                const base64 = photo.thumbnailBase64 || '';
                                const dataUrl = base64 ? `data:${mime};base64,${base64}` : '';
                                const btn = Dom.el('button', {
                                    type: 'button',
                                    className: 'client-photo-thumb',
                                    dataset: { photoId: photo.fileId || '' },
                                    title: photo.name || title
                                });
                                if (dataUrl) {
                                    btn.appendChild(Dom.el('img', { src: dataUrl, alt: title }));
                                } else {
                                    btn.appendChild(Dom.el('i', { className: 'bi bi-image' }));
                                }
                                thumbs.appendChild(btn);
                            });
                        } else {
                            thumbs.appendChild(Dom.el('div', { className: 'text-muted small', text: 'Sin fotos' }));
                        }

                        return Dom.el('div', { className: 'col-12 col-md-6' }, [
                            Dom.el('div', { className: 'lt-surface p-2 h-100' }, [
                                header,
                                thumbs
                            ])
                        ]);
                    };

                    photosContainer.appendChild(buildGroup(fachada, 'Fachadas', 'bi-building', 'text-primary'));
                    photosContainer.appendChild(buildGroup(llave, 'Llaves', 'bi-key-fill', 'text-warning'));

                    photosContainer.querySelectorAll('[data-photo-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const fileId = btn.dataset.photoId;
                            if (fileId) viewPhoto(fileId);
                        });
                    });
                })
                .catch(() => {
                    photosSection.classList.add('d-none');
                });
        }

        /**
         * Ver foto en tamaño completo
         */
        function viewPhoto(fileId) {
            if (!fileId || !EmployeeCalendarData || typeof EmployeeCalendarData.getClientMediaImage !== 'function') return;

            EmployeeCalendarData.getClientMediaImage(fileId, 1600)
                .then(imgData => {
                    if (imgData && imgData.base64) {
                        const dataUrl = `data:${imgData.mimeType || 'image/jpeg'};base64,${imgData.base64}`;
                        const modalId = 'photo-viewer-modal';
                        const oldModal = document.getElementById(modalId);
                        if (oldModal) oldModal.remove();

                        const modalEl = Dom.el('div', { className: 'modal fade', id: modalId, tabindex: '-1' }, [
                            Dom.el('div', { className: 'modal-dialog modal-xl modal-dialog-centered' }, [
                                Dom.el('div', { className: 'modal-content bg-dark' }, [
                                    Dom.el('div', { className: 'modal-body p-0 text-center position-relative' }, [
                                        Dom.el('button', {
                                            type: 'button',
                                            className: 'btn-close btn-close-white position-absolute top-0 end-0 m-3',
                                            'data-bs-dismiss': 'modal',
                                            'aria-label': 'Cerrar',
                                            style: 'z-index: 10;'
                                        }),
                                        Dom.el('img', {
                                            src: dataUrl,
                                            alt: 'Foto',
                                            style: 'max-width: 100%; max-height: 90vh; object-fit: contain;'
                                        })
                                    ])
                                ])
                            ])
                        ]);

                        document.body.appendChild(modalEl);
                        const modal = new bootstrap.Modal(modalEl);
                        modal.show();

                        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
                    }
                })
                .catch(err => console.error('Error cargando foto:', err));
        }

        /**
         * Actualiza el resumen
         */
        function updateSummary(data) {
            const summaryEl = document.getElementById('calendar-summary');
            if (!summaryEl) return;

            if (!data || !data.resumen) {
                summaryEl.classList.add('d-none');
                return;
            }

            summaryEl.classList.remove('d-none');
            document.getElementById('summary-horas').textContent = formatHoras(data.resumen.totalHoras);
            const totalClientes = isAllEmployees
                ? (data.resumen.totalEmpleados || data.resumen.totalClientes || 0)
                : (data.resumen.totalClientes || 0);
            document.getElementById('summary-clientes').textContent = totalClientes;
            document.getElementById('summary-dias').textContent = data.resumen.diasTrabajo || 0;

            const labelEl = document.getElementById('summary-clientes-label');
            if (labelEl) labelEl.textContent = isAllEmployees ? 'Empleados' : 'Clientes';
        }

        /**
         * Carga la agenda del empleado seleccionado
         */
        function loadSchedule() {
            if (!isAllEmployees && !currentEmpleado && !currentIdEmpleado) return;

            const container = document.getElementById('calendar-grid-container');
            if (container) {
                renderLoadingState(container, 'Cargando agenda...');
            }

            const weekStartStr = formatDateISO(currentWeekStart);
            if (!EmployeeCalendarData || typeof EmployeeCalendarData.fetchSchedule !== 'function') {
                if (container) {
                    EmptyState.render(container, {
                        variant: 'error',
                        title: 'Error al cargar',
                        message: 'No se pudo cargar la agenda.'
                    });
                }
                return;
            }

            EmployeeCalendarData.fetchSchedule({
                weekStartDate: weekStartStr,
                empleado: currentEmpleado,
                idEmpleado: currentIdEmpleado,
                allEmployees: isAllEmployees
            })
                .then(data => {
                    if (data && data.error) {
                        throw new Error(data.error);
                    }
                    scheduleData = data;
                    if (isAllEmployees) {
                        renderAllEmployeesGrid(data);
                    } else {
                        renderCalendarGrid(data);
                    }
                    updateSummary(data);
                    updateWeekLabel();

                    // Habilitar botón PDF
                    const pdfBtn = document.getElementById('calendar-generate-pdf');
                    if (pdfBtn) pdfBtn.disabled = isAllEmployees;
                })
                .catch(err => {
                    console.error('Error cargando agenda:', err);
                    if (container) {
                        if (typeof EmptyState !== 'undefined' && EmptyState) {
                            EmptyState.render(container, {
                                variant: 'error',
                                title: 'Error al cargar',
                                message: (err && err.message ? err.message : err)
                            });
                        } else {
                            Dom.clear(container);
                            container.appendChild(
                                Dom.el('div', { className: 'alert alert-danger' }, [
                                    Dom.el('i', { className: 'bi bi-exclamation-triangle me-2' }),
                                    Dom.text('Error al cargar la agenda: ' + (err && err.message ? err.message : err))
                                ])
                            );
                        }
                    }
                });
        }

        /**
         * Actualiza el label de la semana actual
         */
        function updateWeekLabel() {
            const label = document.getElementById('calendar-week-label');
            if (!label) return;

            if (scheduleData && scheduleData.semana) {
                label.textContent = `Semana ${scheduleData.semana.label}`;
            } else if (currentWeekStart) {
                const end = addDays(currentWeekStart, 6);
                const startStr = `${currentWeekStart.getDate().toString().padStart(2, '0')}/${(currentWeekStart.getMonth() + 1).toString().padStart(2, '0')}`;
                const endStr = `${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}`;
                label.textContent = `Semana ${startStr} - ${endStr}`;
            }
        }

        /**
         * Carga lista de empleados
         */
        function loadEmpleados() {
            const select = document.getElementById('calendar-empleado-select');
            if (!select) return;

            if (!EmployeeCalendarData || typeof EmployeeCalendarData.loadEmployees !== 'function') {
                console.warn('EmployeeCalendarData.loadEmployees no disponible');
                return;
            }

            EmployeeCalendarData.loadEmployees()
                .then(empleados => {
                    empleadosList = empleados || [];

                    Dom.clear(select);
                    select.appendChild(Dom.el('option', { value: '', text: 'Seleccionar empleado...' }));
                    select.appendChild(Dom.el('option', { value: ALL_EMPLOYEES_VALUE, text: 'Todos los empleados' }));

                    empleadosList.forEach(emp => {
                        const nombre = typeof emp === 'string'
                            ? String(emp).trim()
                            : String(emp.nombre || emp.empleado || emp.label || '').trim();
                        const id = emp && typeof emp === 'object' && emp.id != null ? String(emp.id).trim() : '';
                        if (!nombre) return;
                        const value = id || nombre;
                        select.appendChild(
                            Dom.el('option', {
                                value: value,
                                text: nombre,
                                dataset: { id: id, nombre: nombre }
                            })
                        );
                    });
                })
                .catch(err => {
                    console.error('Error cargando empleados:', err);
                });
        }

        /**
         * Genera y descarga el PDF de hoja de ruta
         */
        function generatePdf() {
            if (isAllEmployees) {
                if (Alerts) Alerts.showAlert('Selecciona un empleado para generar el PDF', 'warning');
                return;
            }

            if (!currentEmpleado && !currentIdEmpleado) {
                if (Alerts) Alerts.showAlert('Selecciona un empleado primero', 'warning');
                return;
            }

            const btn = document.getElementById('calendar-generate-pdf');
            if (btn) {
                const ui = global.UIHelpers;
                if (ui && typeof ui.withSpinner === "function") {
                    ui.withSpinner(btn, true, "Generando...");
                } else {
                    btn.disabled = true;
                }
            }

            const weekStartStr = formatDateISO(currentWeekStart);

            if (!EmployeeCalendarData || typeof EmployeeCalendarData.generatePdf !== 'function') {
                if (Alerts) Alerts.showAlert('No se pudo generar el PDF.', 'danger');
                if (btn) {
                    const ui = global.UIHelpers;
                    if (ui && typeof ui.withSpinner === "function") {
                        ui.withSpinner(btn, false);
                    } else {
                        btn.disabled = false;
                    }
                }
                return;
            }

            EmployeeCalendarData.generatePdf({
                empleado: currentEmpleado,
                idEmpleado: currentIdEmpleado,
                weekStartDate: weekStartStr
            })
                .then(result => {
                    if (result && result.base64) {
                        // Descargar PDF
                        const link = document.createElement('a');
                        link.href = 'data:application/pdf;base64,' + result.base64;
                        link.download = result.filename || 'hoja_ruta.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        if (Alerts) Alerts.showAlert('PDF generado correctamente', 'success');
                    } else {
                        throw new Error('No se pudo generar el PDF');
                    }
                })
                .catch(err => {
                    console.error('Error generando PDF:', err);
                    if (Alerts) Alerts.showAlert('Error al generar PDF: ' + (err.message || err), 'danger');
                })
                .finally(() => {
                    if (btn) {
                        const ui = global.UIHelpers;
                        if (ui && typeof ui.withSpinner === "function") {
                            ui.withSpinner(btn, false);
                        } else {
                            btn.disabled = false;
                        }
                    }
                });
        }

        /**
         * Attacha eventos a los elementos del panel
         */
        function attachEvents(container) {
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
            const signal = eventsController.signal;
            const on = (el, evt, handler) => {
                if (!el) return;
                el.addEventListener(evt, handler, { signal });
            };

            // Selector de empleado
            const empleadoSelect = container.querySelector('#calendar-empleado-select');
            if (empleadoSelect) {
                on(empleadoSelect, 'change', function () {
                    const selected = this.options[this.selectedIndex];
                    const selectedValue = this.value || '';
                    isAllEmployees = selectedValue === ALL_EMPLOYEES_VALUE;

                    if (isAllEmployees) {
                        currentIdEmpleado = '';
                        currentEmpleado = '';
                        loadSchedule();
                    } else if (selectedValue) {
                        currentIdEmpleado = selected && selected.dataset ? (selected.dataset.id || '') : '';
                        currentEmpleado = selected && selected.dataset ? (selected.dataset.nombre || selected.textContent || '') : selectedValue;
                        loadSchedule();
                    } else {
                        isAllEmployees = false;
                        scheduleData = null;
                        const grid = document.getElementById('calendar-grid-container');
                        renderEmptyState(grid, 'Selecciona un empleado para ver su calendario');
                        document.getElementById('calendar-summary').classList.add('d-none');
                        document.getElementById('calendar-generate-pdf').disabled = true;
                    }
                });
            }

            // Navegación semanal
            const prevBtn = container.querySelector('#calendar-prev-week');
            if (prevBtn) {
                on(prevBtn, 'click', () => {
                    currentWeekStart = addDays(currentWeekStart, -7);
                    if (isAllEmployees || currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            const nextBtn = container.querySelector('#calendar-next-week');
            if (nextBtn) {
                on(nextBtn, 'click', () => {
                    currentWeekStart = addDays(currentWeekStart, 7);
                    if (isAllEmployees || currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            const todayBtn = container.querySelector('#calendar-today');
            if (todayBtn) {
                on(todayBtn, 'click', () => {
                    currentWeekStart = getMondayOfWeek(new Date());
                    if (isAllEmployees || currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            // Generar PDF
            const pdfBtn = container.querySelector('#calendar-generate-pdf');
            if (pdfBtn) {
                on(pdfBtn, 'click', generatePdf);
            }
        }

        return {
            render,
            viewPhoto,
            loadSchedule
        };
    })();

    global.EmployeeCalendarPanel = EmployeeCalendarPanel;
})(typeof window !== 'undefined' ? window : this);


/**
 * ClientCalendarData
 * Capa de datos para calendario de clientes.
 */
(function (global) {
  const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;
  const clientCache = { list: null, ts: 0, inFlight: null };

  function isCacheFresh() {
    return !!(clientCache.list && (Date.now() - clientCache.ts) < CLIENT_CACHE_TTL_MS);
  }

  function storeCache(list) {
    clientCache.list = Array.isArray(list) ? list : [];
    clientCache.ts = Date.now();
    return clientCache.list;
  }

  function loadClients() {
    if (isCacheFresh()) {
      return Promise.resolve(clientCache.list);
    }
    if (clientCache.inFlight) {
      return clientCache.inFlight;
    }
    if (!global.ReferenceService || typeof global.ReferenceService.ensureLoaded !== "function") {
      return Promise.resolve(storeCache([]));
    }
    const request = global.ReferenceService.ensureLoaded()
      .then(() => {
        const ref = global.ReferenceService.get();
        return storeCache(ref && ref.clientes ? ref.clientes : []);
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err, { silent: true });
        } else {
          console.warn("Error cargando clientes:", err);
        }
        return storeCache([]);
      });
    clientCache.inFlight = request;
    return request.finally(function () {
      clientCache.inFlight = null;
    });
  }

  function fetchSchedule(options) {
    if (!global.AttendanceService || typeof global.AttendanceService.getWeeklyClientOverview !== "function") {
      return Promise.resolve({});
    }
    const opts = options || {};
    return global.AttendanceService.getWeeklyClientOverview({
      weekStartDate: opts.weekStartDate || "",
      clientId: opts.clientId || ""
    });
  }

  function listClientMedia(clienteId) {
    if (!global.AttendanceService || typeof global.AttendanceService.listClientMedia !== "function") {
      return Promise.resolve({ fachada: [], llave: [] });
    }
    return global.AttendanceService.listClientMedia(clienteId);
  }

  function getClientMediaImage(fileId, size) {
    if (!global.AttendanceService || typeof global.AttendanceService.getClientMediaImage !== "function") {
      return Promise.reject(new Error("AttendanceService no disponible"));
    }
    return global.AttendanceService.getClientMediaImage(fileId, size);
  }

  global.ClientCalendarData = {
    loadClients: loadClients,
    prefetchClients: function () {
      return loadClients().catch(function () {
        return [];
      });
    },
    fetchSchedule: fetchSchedule,
    listClientMedia: listClientMedia,
    getClientMediaImage: getClientMediaImage
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Client Calendar Panel
 * Vista semanal para ver a qué clientes se visita por día.
 */

(function (global) {
    const ClientCalendarPanel = (() => {
        let currentWeekStart = null;
        let currentClientId = '';
        let currentClientName = '';
        let scheduleData = null;
        let clientList = [];
        let eventsController = null;
        const Dom = global.DomHelpers || (function () {
            function text(value) {
                return document.createTextNode(value == null ? "" : String(value));
            }
            function setAttrs(el, attrs) {
                if (!attrs) return;
                Object.keys(attrs).forEach(key => {
                    const val = attrs[key];
                    if (val == null) return;
                    if (key === "class" || key === "className") {
                        el.className = String(val);
                        return;
                    }
                    if (key === "text") {
                        el.textContent = String(val);
                        return;
                    }
                    if (key === "dataset" && typeof val === "object") {
                        Object.keys(val).forEach(dataKey => {
                            if (val[dataKey] != null) el.dataset[dataKey] = String(val[dataKey]);
                        });
                        return;
                    }
                    if (key === "style" && typeof val === "object") {
                        Object.keys(val).forEach(styleKey => {
                            el.style[styleKey] = val[styleKey];
                        });
                        return;
                    }
                    el.setAttribute(key, String(val));
                });
            }
            function append(parent, child) {
                if (!parent || child == null) return;
                if (Array.isArray(child)) {
                    child.forEach(c => append(parent, c));
                    return;
                }
                if (typeof child === "string" || typeof child === "number") {
                    parent.appendChild(text(child));
                    return;
                }
                parent.appendChild(child);
            }
            function el(tag, attrs, children) {
                const node = document.createElement(tag);
                setAttrs(node, attrs);
                append(node, children);
                return node;
            }
            function clear(el) {
                if (!el) return;
                while (el.firstChild) el.removeChild(el.firstChild);
            }
            return { el, text, clear, append };
        })();

        const ClientCalendarData = global.ClientCalendarData || null;

        function formatHoras(h) {
            const num = Number(h);
            return isNaN(num) ? '0' : num.toFixed(1).replace('.0', '');
        }

        function getClienteDisplayName(cliente) {
            if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.getClientDisplayName === 'function') {
                return DomainHelpers.getClientDisplayName(cliente);
            }
            if (!cliente) return '';
            if (typeof cliente === 'string') return cliente;
            return cliente.nombre || cliente.cliente || cliente.razonSocial || '';
        }

        function getMondayOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }

        function renderEmptyState(container, message) {
            if (!container) return;
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(container, { variant: 'empty', title: 'Sin datos', message: message });
                return;
            }
            Dom.clear(container);
            container.appendChild(
                Dom.el('div', { className: 'text-center text-muted py-5' }, [
                    Dom.el('i', { className: 'bi bi-calendar3 display-4 mb-3 d-block opacity-50' }),
                    Dom.el('p', { className: 'mb-0', text: message })
                ])
            );
        }

        function renderLoadingState(container, message) {
            if (!container) return;
            if (typeof EmptyState !== 'undefined' && EmptyState) {
                EmptyState.render(container, { variant: 'loading', message: message || 'Cargando...' });
                return;
            }
            Dom.clear(container);
            container.appendChild(
                Dom.el('div', { className: 'text-center py-5' }, [
                    Dom.el('div', { className: 'spinner-border text-primary' }),
                    Dom.el('div', { className: 'mt-2 text-muted', text: message || 'Cargando...' })
                ])
            );
        }

        function formatDateISO(date) {
            if (typeof DomainHelpers !== 'undefined' && DomainHelpers && typeof DomainHelpers.formatDateISO === 'function') {
                return DomainHelpers.formatDateISO(date);
            }
            const d = new Date(date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        function addDays(date, days) {
            const d = new Date(date);
            d.setDate(d.getDate() + days);
            return d;
        }

        function render(containerId) {
            const container = typeof containerId === 'string'
                ? document.getElementById(containerId)
                : containerId || document.getElementById('client-calendar-panel');

            if (!container) return;

            if (!currentWeekStart) {
                currentWeekStart = getMondayOfWeek(new Date());
            }

            if (typeof AttendanceTemplates === "undefined" || !AttendanceTemplates || typeof AttendanceTemplates.buildClientCalendarPanelHtml !== "function") {
                console.error("AttendanceTemplates no disponible");
                return;
            }
            // safe static: layout fijo sin datos externos.
            container.innerHTML = AttendanceTemplates.buildClientCalendarPanelHtml();
            attachEvents(container);
            loadClients();
            loadSchedule();
        }

        function loadClients() {
            const select = document.getElementById('client-calendar-select');
            if (!select) return;

            if (!ClientCalendarData || typeof ClientCalendarData.loadClients !== 'function') {
                console.warn('ClientCalendarData.loadClients no disponible');
                return;
            }

            ClientCalendarData.loadClients().then(clients => {
                clientList = clients || [];

                Dom.clear(select);
                select.appendChild(Dom.el('option', { value: '', text: 'Todos los clientes' }));
                clientList.forEach(c => {
                    const id = c && typeof c === 'object' ? (c.id || c.ID || c.ID_CLIENTE || '') : '';
                    const nombre = getClienteDisplayName(c);
                    if (!id || !nombre) return;

                    select.appendChild(
                        Dom.el('option', {
                            value: String(id),
                            text: nombre,
                            dataset: { id: String(id), nombre: nombre }
                        })
                    );
                });
            }).catch(err => {
                console.error('Error cargando clientes:', err);
            });
        }

        function loadSchedule() {
            const container = document.getElementById('client-calendar-grid');
            if (container) {
                renderLoadingState(container, 'Cargando calendario...');
            }

            const weekStartStr = formatDateISO(currentWeekStart);

            if (!ClientCalendarData || typeof ClientCalendarData.fetchSchedule !== 'function') {
                if (container) {
                    EmptyState.render(container, {
                        variant: 'error',
                        title: 'Error al cargar',
                        message: 'No se pudo cargar el calendario.'
                    });
                }
                return;
            }

            ClientCalendarData.fetchSchedule({
                weekStartDate: weekStartStr,
                clientId: currentClientId
            })
                .then(data => {
                    if (data && data.error) throw new Error(data.error);
                    scheduleData = data;
                    renderCalendarGrid(data);
                    updateSummary(data);
                    updateWeekLabel();
                })
                .catch(err => {
                    console.error('Error cargando calendario clientes:', err);
                    if (container) {
                        if (typeof EmptyState !== 'undefined' && EmptyState) {
                            EmptyState.render(container, {
                                variant: 'error',
                                title: 'Error al cargar',
                                message: (err && err.message ? err.message : err)
                            });
                        } else {
                            Dom.clear(container);
                            container.appendChild(
                                Dom.el('div', { className: 'alert alert-danger' }, [
                                    Dom.el('i', { className: 'bi bi-exclamation-triangle me-2' }),
                                    Dom.text('Error al cargar calendario: ' + (err && err.message ? err.message : err))
                                ])
                            );
                        }
                    }
                });
        }

        function renderCalendarGrid(data) {
            const container = document.getElementById('client-calendar-grid');
            if (!container) return;

            if (!data || !data.dias || data.dias.length === 0) {
                renderEmptyState(container, 'Sin datos para mostrar');
                return;
            }

            Dom.clear(container);
            const grid = Dom.el('div', { className: 'calendar-week-grid' });
            const row = Dom.el('div', { className: 'calendar-days-row' });
            grid.appendChild(row);

            data.dias.forEach((dia, idx) => {
                const hasClients = dia.clientes && dia.clientes.length > 0;
                const isWeekend = idx >= 5;
                const dayClasses = [
                    'calendar-day',
                    hasClients ? 'calendar-day--has-work' : 'calendar-day--free',
                    isWeekend ? 'calendar-day--weekend' : ''
                ].filter(Boolean).join(' ');

                const day = Dom.el('div', { className: dayClasses });
                const header = Dom.el('div', { className: 'calendar-day-header' }, [
                    Dom.el('span', { className: 'calendar-day-name', text: dia.diaDisplay || '' }),
                    Dom.el('span', { className: 'calendar-day-date', text: dia.fechaDisplay || '' })
                ]);
                const content = Dom.el('div', { className: 'calendar-day-content' });

                if (hasClients) {
                    dia.clientes.forEach(cliente => {
                        const empleados = (cliente.asignaciones || []).map(a => {
                            const nombre = a.empleado || 'Sin asignar';
                            const hora = a.horaEntrada ? ` ${a.horaEntrada}` : '';
                            const horas = a.horasPlan ? ` · ${formatHoras(a.horasPlan)} hs` : '';
                            return `${nombre}${hora}${horas}`;
                        });

                        const empleadosUnique = Array.from(new Set(empleados.filter(Boolean)));
                        const direccionShort = cliente.direccion
                            ? (cliente.direccion.length > 30 ? cliente.direccion.substring(0, 30) + '...' : cliente.direccion)
                            : '';

                        const displayName = getClienteDisplayName(cliente);
                        const card = Dom.el('div', {
                            className: 'calendar-client-card calendar-client-card--summary',
                            dataset: {
                                clienteId: cliente.idCliente || '',
                                clienteNombre: displayName,
                                dia: dia.diaSemana || ''
                            }
                        });
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-name', title: displayName }, [
                                Dom.el('i', { className: 'bi bi-building me-1' }),
                                Dom.text(displayName)
                            ])
                        );
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-time' }, [
                                Dom.el('i', { className: 'bi bi-clock me-1' }),
                                Dom.text(`${formatHoras(cliente.totalHoras)} hs`)
                            ])
                        );
                        if (direccionShort) {
                            card.appendChild(
                                Dom.el('div', { className: 'calendar-client-address', title: cliente.direccion || '' }, [
                                    Dom.el('i', { className: 'bi bi-geo-alt me-1' }),
                                    Dom.text(direccionShort)
                                ])
                            );
                        }
                        if (empleadosUnique.length) {
                            const chips = Dom.el('div', { className: 'calendar-client-employees' });
                            empleadosUnique.forEach(emp => {
                                chips.appendChild(Dom.el('span', { className: 'calendar-emp-chip', text: emp }));
                            });
                            card.appendChild(chips);
                        }
                        card.appendChild(
                            Dom.el('div', { className: 'calendar-client-expand' }, [
                                Dom.el('i', { className: 'bi bi-eye' }),
                                Dom.text(' Ver detalles')
                            ])
                        );
                        card.addEventListener('click', () => {
                            showClientDetails(card.dataset.clienteId, card.dataset.clienteNombre, card.dataset.dia);
                        });
                        content.appendChild(card);
                    });
                } else {
                    content.appendChild(
                        Dom.el('div', { className: 'calendar-no-work' }, [
                            Dom.el('i', { className: 'bi bi-moon-stars opacity-50' }),
                            Dom.el('span', { text: 'Sin asignaciones' })
                        ])
                    );
                }

                day.appendChild(header);
                day.appendChild(content);
                row.appendChild(day);
            });

            container.appendChild(grid);
        }

        function buildInfoRow(iconClass, content, alignStart) {
            const row = Dom.el('div', {
                className: alignStart ? 'd-flex align-items-start gap-2' : 'd-flex align-items-center gap-2'
            });
            row.appendChild(Dom.el('i', { className: iconClass + (alignStart ? ' mt-1' : '') }));
            Dom.append(row, content);
            return row;
        }

        function buildLabelValue(label, value) {
            return Dom.el('span', null, [
                Dom.el('strong', { text: label }),
                Dom.text(' ' + value)
            ]);
        }

        function showClientDetails(clienteId, clienteNombre, diaSemana) {
            if (!scheduleData || !scheduleData.dias) return;

            let clienteData = null;
            scheduleData.dias.forEach(dia => {
                if (dia.diaSemana !== diaSemana) return;
                const c = (dia.clientes || []).find(cl => {
                    if (clienteId) {
                        return String(cl.idCliente || '') === String(clienteId);
                    }
                    return clienteNombre && String(cl.cliente || '').trim() === String(clienteNombre).trim();
                });
                if (c) clienteData = c;
            });

            if (!clienteData) return;

            const asignaciones = Array.isArray(clienteData.asignaciones) ? clienteData.asignaciones : [];
            const modalId = 'client-calendar-detail-modal';
            const oldModal = document.getElementById(modalId);
            if (oldModal) oldModal.remove();

            const titleText = getClienteDisplayName(clienteData) || clienteNombre || 'Cliente';
            const header = Dom.el('div', { className: 'modal-header bg-primary text-white' }, [
                Dom.el('h5', { className: 'modal-title' }, [
                    Dom.el('i', { className: 'bi bi-building me-2' }),
                    Dom.text(titleText)
                ]),
                Dom.el('button', {
                    type: 'button',
                    className: 'btn-close btn-close-white',
                    'data-bs-dismiss': 'modal',
                    'aria-label': 'Cerrar'
                })
            ]);

            const dayInfoList = Dom.el('div', { className: 'd-flex flex-column gap-2' }, [
                buildInfoRow('bi bi-hourglass-split text-primary', buildLabelValue('Horas:', `${formatHoras(clienteData.totalHoras)} hs`)),
                buildInfoRow('bi bi-people text-primary', buildLabelValue('Empleados:', String(asignaciones.length)))
            ]);

            const dayInfo = Dom.el('div', { className: 'col-md-6' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-info-circle me-1' }),
                    Dom.text('Información del día')
                ]),
                dayInfoList
            ]);

            if (clienteData.observaciones) {
                dayInfoList.appendChild(
                    buildInfoRow(
                        'bi bi-sticky text-warning',
                        buildLabelValue('Obs:', String(clienteData.observaciones || '')),
                        true
                    )
                );
            }

            const clientInfoList = Dom.el('div', { className: 'd-flex flex-column gap-2' });
            if (clienteData.idCliente) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-hash text-secondary', buildLabelValue('ID:', String(clienteData.idCliente)))
                );
            }
            if (clienteData.direccion) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-geo-alt text-danger', Dom.el('span', { text: String(clienteData.direccion) }), true)
                );
            }
            if (clienteData.telefono) {
                const tel = String(clienteData.telefono);
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-telephone text-success', Dom.el('a', { href: 'tel:' + tel, text: tel }))
                );
            }
            if (clienteData.encargado) {
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-person text-info', buildLabelValue('Contacto:', String(clienteData.encargado)))
                );
            }
            if (clienteData.correo) {
                const mail = String(clienteData.correo);
                clientInfoList.appendChild(
                    buildInfoRow('bi bi-envelope text-primary', Dom.el('a', { href: 'mailto:' + mail, text: mail }))
                );
            }

            const clientInfo = Dom.el('div', { className: 'col-md-6' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-building me-1' }),
                    Dom.text('Datos del cliente')
                ]),
                clientInfoList
            ]);

            const asignacionesList = Dom.el('div', { className: 'd-flex flex-column gap-2' });
            if (asignaciones.length) {
                asignaciones.forEach(a => {
                    const empleado = a.empleado || 'Sin asignar';
                    const hora = a.horaEntrada ? ` · ${a.horaEntrada}` : '';
                    const horas = a.horasPlan ? ` · ${formatHoras(a.horasPlan)} hs` : '';
                    asignacionesList.appendChild(
                        buildInfoRow(
                            'bi bi-person text-primary',
                            Dom.el('span', { text: `${empleado}${hora}${horas}` })
                        )
                    );
                });
            } else {
                asignacionesList.appendChild(Dom.el('div', { className: 'text-muted small', text: 'Sin asignaciones' }));
            }

            const asignacionesSection = Dom.el('div', { className: 'mt-4' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-people me-1' }),
                    Dom.text('Empleados asignados')
                ]),
                Dom.el('div', { className: 'lt-surface p-3' }, asignacionesList)
            ]);

            const photosContainer = Dom.el('div', {
                className: 'row g-3',
                id: 'client-calendar-photos-container'
            });

            const photosSection = Dom.el('div', { id: 'client-calendar-photos', className: 'mt-4 d-none' }, [
                Dom.el('h6', { className: 'text-muted text-uppercase small mb-3' }, [
                    Dom.el('i', { className: 'bi bi-images me-1' }),
                    Dom.text('Fotos del local')
                ]),
                photosContainer
            ]);

            const body = Dom.el('div', { className: 'modal-body' }, [
                Dom.el('div', { className: 'row g-4' }, [dayInfo, clientInfo]),
                asignacionesSection,
                photosSection
            ]);

            const footer = Dom.el('div', { className: 'modal-footer' }, [
                Dom.el('button', {
                    type: 'button',
                    className: 'btn btn-secondary',
                    'data-bs-dismiss': 'modal'
                }, 'Cerrar')
            ]);

            if (clienteData.direccion) {
                const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(String(clienteData.direccion));
                footer.appendChild(
                    Dom.el('a', {
                        href: mapUrl,
                        target: '_blank',
                        className: 'btn btn-outline-primary'
                    }, [
                        Dom.el('i', { className: 'bi bi-map me-1' }),
                        Dom.text('Ver en mapa')
                    ])
                );
            }

            const modalEl = Dom.el('div', { className: 'modal fade', id: modalId, tabindex: '-1' }, [
                Dom.el('div', { className: 'modal-dialog modal-lg modal-dialog-centered' }, [
                    Dom.el('div', { className: 'modal-content' }, [
                        header,
                        body,
                        footer
                    ])
                ])
            ]);

            document.body.appendChild(modalEl);
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
            });

            if (clienteId && ClientCalendarData && typeof ClientCalendarData.listClientMedia === 'function') {
                loadClientPhotos(clienteId);
            }
        }

        function loadClientPhotos(clienteId) {
            const photosSection = document.getElementById('client-calendar-photos');
            const photosContainer = document.getElementById('client-calendar-photos-container');

            if (!photosSection || !photosContainer) return;

            renderLoadingState(photosContainer, 'Cargando fotos...');

            if (!ClientCalendarData || typeof ClientCalendarData.listClientMedia !== 'function') {
                photosSection.classList.add('d-none');
                return;
            }

            ClientCalendarData.listClientMedia(clienteId)
                .then(media => {
                    const fachada = media && Array.isArray(media.fachada) ? media.fachada : [];
                    const llave = media && Array.isArray(media.llave) ? media.llave : [];

                    if (!fachada.length && !llave.length) {
                        photosSection.classList.add('d-none');
                        return;
                    }

                    photosSection.classList.remove('d-none');
                    Dom.clear(photosContainer);

                    const buildGroup = (items, title, icon, iconClass) => {
                        const count = items.length;
                        const header = Dom.el('div', { className: 'd-flex align-items-center justify-content-between mb-2' }, [
                            Dom.el('div', { className: 'd-flex align-items-center gap-2' }, [
                                Dom.el('i', { className: `bi ${icon} ${iconClass}` }),
                                Dom.el('span', { className: 'fw-semibold small', text: title })
                            ]),
                            Dom.el('span', { className: 'small text-muted', text: `${count} foto${count === 1 ? '' : 's'}` })
                        ]);

                        const thumbs = Dom.el('div', { className: 'd-flex flex-wrap gap-2' });
                        if (count) {
                            items.forEach(photo => {
                                const mime = photo.mimeType || 'image/jpeg';
                                const base64 = photo.thumbnailBase64 || '';
                                const dataUrl = base64 ? `data:${mime};base64,${base64}` : '';
                                const btn = Dom.el('button', {
                                    type: 'button',
                                    className: 'client-photo-thumb',
                                    dataset: { photoId: photo.fileId || '' },
                                    title: photo.name || title
                                });
                                if (dataUrl) {
                                    btn.appendChild(Dom.el('img', { src: dataUrl, alt: title }));
                                } else {
                                    btn.appendChild(Dom.el('i', { className: 'bi bi-image' }));
                                }
                                thumbs.appendChild(btn);
                            });
                        } else {
                            thumbs.appendChild(Dom.el('div', { className: 'text-muted small', text: 'Sin fotos' }));
                        }

                        return Dom.el('div', { className: 'col-12 col-md-6' }, [
                            Dom.el('div', { className: 'lt-surface p-2 h-100' }, [
                                header,
                                thumbs
                            ])
                        ]);
                    };

                    photosContainer.appendChild(buildGroup(fachada, 'Fachadas', 'bi-building', 'text-primary'));
                    photosContainer.appendChild(buildGroup(llave, 'Llaves', 'bi-key-fill', 'text-warning'));

                    photosContainer.querySelectorAll('[data-photo-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const fileId = btn.dataset.photoId;
                            if (fileId) viewPhoto(fileId);
                        });
                    });
                })
                .catch(() => {
                    photosSection.classList.add('d-none');
                });
        }

        function viewPhoto(fileId) {
            if (!fileId || !ClientCalendarData || typeof ClientCalendarData.getClientMediaImage !== 'function') return;

            ClientCalendarData.getClientMediaImage(fileId, 1600)
                .then(imgData => {
                    if (imgData && imgData.base64) {
                        const dataUrl = `data:${imgData.mimeType || 'image/jpeg'};base64,${imgData.base64}`;
                        const modalId = 'client-calendar-photo-modal';
                        const oldModal = document.getElementById(modalId);
                        if (oldModal) oldModal.remove();

                        const modalEl = Dom.el('div', { className: 'modal fade', id: modalId, tabindex: '-1' }, [
                            Dom.el('div', { className: 'modal-dialog modal-xl modal-dialog-centered' }, [
                                Dom.el('div', { className: 'modal-content bg-dark' }, [
                                    Dom.el('div', { className: 'modal-body p-0 text-center position-relative' }, [
                                        Dom.el('button', {
                                            type: 'button',
                                            className: 'btn-close btn-close-white position-absolute top-0 end-0 m-3',
                                            'data-bs-dismiss': 'modal',
                                            'aria-label': 'Cerrar',
                                            style: 'z-index: 10;'
                                        }),
                                        Dom.el('img', {
                                            src: dataUrl,
                                            alt: 'Foto',
                                            style: 'max-width: 100%; max-height: 90vh; object-fit: contain;'
                                        })
                                    ])
                                ])
                            ])
                        ]);

                        document.body.appendChild(modalEl);
                        const modal = new bootstrap.Modal(modalEl);
                        modal.show();

                        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
                    }
                })
                .catch(err => console.error('Error cargando foto:', err));
        }

        function updateSummary(data) {
            const summaryEl = document.getElementById('client-calendar-summary');
            if (!summaryEl) return;

            if (!data || !data.resumen) {
                summaryEl.classList.add('d-none');
                return;
            }

            summaryEl.classList.remove('d-none');
            document.getElementById('client-summary-horas').textContent = formatHoras(data.resumen.totalHoras);
            document.getElementById('client-summary-clientes').textContent = data.resumen.totalClientes || 0;
            document.getElementById('client-summary-dias').textContent = data.resumen.diasTrabajo || 0;
        }

        function updateWeekLabel() {
            const label = document.getElementById('client-calendar-week-label');
            if (!label) return;

            if (scheduleData && scheduleData.semana) {
                label.textContent = `Semana ${scheduleData.semana.label}`;
            } else if (currentWeekStart) {
                const end = addDays(currentWeekStart, 6);
                const startStr = `${currentWeekStart.getDate().toString().padStart(2, '0')}/${(currentWeekStart.getMonth() + 1).toString().padStart(2, '0')}`;
                const endStr = `${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}`;
                label.textContent = `Semana ${startStr} - ${endStr}`;
            }
        }

        function attachEvents(container) {
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
            const signal = eventsController.signal;
            const on = (el, evt, handler) => {
                if (!el) return;
                el.addEventListener(evt, handler, { signal });
            };

            const select = container.querySelector('#client-calendar-select');
            if (select) {
                on(select, 'change', function () {
                    const selected = this.options[this.selectedIndex];
                    currentClientId = selected && selected.dataset ? (selected.dataset.id || '') : '';
                    currentClientName = selected && selected.dataset ? (selected.dataset.nombre || '') : '';
                    loadSchedule();
                });
            }

            const prevBtn = container.querySelector('#client-calendar-prev');
            if (prevBtn) {
                on(prevBtn, 'click', () => {
                    currentWeekStart = addDays(currentWeekStart, -7);
                    loadSchedule();
                });
            }

            const nextBtn = container.querySelector('#client-calendar-next');
            if (nextBtn) {
                on(nextBtn, 'click', () => {
                    currentWeekStart = addDays(currentWeekStart, 7);
                    loadSchedule();
                });
            }

            const todayBtn = container.querySelector('#client-calendar-today');
            if (todayBtn) {
                on(todayBtn, 'click', () => {
                    currentWeekStart = getMondayOfWeek(new Date());
                    loadSchedule();
                });
            }

            const refreshBtn = container.querySelector('#client-calendar-refresh');
            if (refreshBtn) {
                on(refreshBtn, 'click', () => loadSchedule());
            }
        }

        return {
            render
        };
    })();

    global.ClientCalendarPanel = ClientCalendarPanel;
})(typeof window !== 'undefined' ? window : this);


/**
 * AnalysisPanelState
 * Estado compartido del panel de analisis.
 */
(function (global) {
  const AnalysisPanelState = {
    containerId: 'analysis-panel',
    currentPeriod: null,
    currentRange: 6,
    comparisonVisible: false,
    lastData: null,
    prefetchKey: "",
    prefetchData: null,
    prefetchAt: 0,
    Dom: (typeof DomHelpers !== 'undefined' && DomHelpers) ? DomHelpers : null,
    eventsController: null,
    escapeHtml: (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function')
      ? HtmlHelpers.escapeHtml
      : function (value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/[<]/g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
  };

  global.AnalysisPanelState = AnalysisPanelState;
})(typeof window !== 'undefined' ? window : this);


/**
 * AnalysisPanelRender
 * Render del panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function renderShell(container) {
    if (!container) return;
    // safe static: shell fijo sin datos externos.
    container.innerHTML = `
      <div class="lt-surface p-3 mb-3 analysis-hero">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div class="analysis-title">Análisis del negocio</div>
            <div class="text-muted small">Resumen mensual con indicadores clave, rankings y flujo de caja.</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="month" id="analysis-period" class="form-control form-control-sm" />
            <button class="btn btn-primary btn-sm" id="analysis-refresh">
              <i class="bi bi-arrow-repeat me-1"></i>Actualizar
            </button>
          </div>
        </div>
      </div>

      <div id="analysis-content">
        <div id="analysis-loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="text-muted mt-2">Cargando análisis...</div>
        </div>
        <div id="analysis-dashboard" class="d-none">
          <div class="row g-3 mb-3" id="analysis-kpis"></div>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <div class="lt-surface p-3">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div class="analysis-section-title mb-0">Comparativa últimos <span id="analysis-range-label"></span> meses</div>
                  <div class="d-flex align-items-center gap-2">
                    <select id="analysis-range" class="form-select form-select-sm">
                      <option value="3">3 meses</option>
                      <option value="6" selected>6 meses</option>
                      <option value="12">12 meses</option>
                    </select>
                    <button class="btn btn-outline-primary btn-sm" id="analysis-compare-toggle">
                      <i class="bi bi-bar-chart-line me-1"></i><span>Mostrar</span>
                    </button>
                  </div>
                </div>
                <div id="analysis-compare-placeholder" class="analysis-placeholder text-muted small mt-3">
                  Comparativa en pausa. Activala para calcular los meses seleccionados.
                </div>
                <div id="analysis-compare-body" class="mt-3 d-none">
                  <div id="analysis-trends"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-lg-7">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Flujo del mes</div>
                <div class="analysis-flow" id="analysis-flow"></div>
                <div class="analysis-note text-muted small mt-2">
                  Facturación basada en comprobantes emitidos dentro del mes.
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Medios de cobro</div>
                <div id="analysis-payments"></div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Gastos por categoría</div>
                <div id="analysis-expenses-category"></div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Gastos por medio</div>
                <div id="analysis-expenses-method"></div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <div class="lt-surface p-3">
                <div class="analysis-section-title">Proyección de ingresos</div>
                <div id="analysis-projection"></div>
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Top clientes (por horas)</div>
                <div class="analysis-table" id="analysis-top-clients"></div>
                <div class="analysis-note text-muted small mt-2">Estimado según asistencia y valor hora.</div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Mejores empleados</div>
                <div class="analysis-table" id="analysis-top-employees"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboard(data) {
    var kpis = data.kpis || {};
    renderKpis(kpis, data.period || {});
    if (state.comparisonVisible) {
      renderTrend(data.trend || []);
    } else {
      renderTrendPlaceholder();
    }
    renderFlow(kpis);
    renderPaymentMethods(data.pagosPorMedio || []);
    renderExpensesByCategory(data.gastosPorCategoria || []);
    renderExpensesByMethod(data.gastosPorMedio || []);
    renderProjection(data.projection || {});
    renderTopClients(data.topClientes || []);
    renderTopEmployees(data.topEmpleados || []);
  }

  function renderKpis(kpis, period) {
    var container = document.getElementById('analysis-kpis');
    if (!container) return;

    var cards = [
      {
        title: 'Facturación del mes',
        value: Formatters.formatCurrency(kpis.facturacionMes),
        hint: 'Periodo ' + (period.label || '')
      },
      {
        title: 'Sueldos estimados',
        value: Formatters.formatCurrency(kpis.sueldosMes),
        hint: 'Costo mensual'
      },
      {
        title: 'Impuestos (IVA)',
        value: Formatters.formatCurrency(kpis.impuestosMes),
        hint: 'Estimado por facturación'
      },
      {
        title: 'Gastos operativos',
        value: Formatters.formatCurrency(kpis.gastosMes),
        hint: 'Gastos registrados'
      },
      {
        title: 'Neto estimado',
        value: Formatters.formatCurrency(kpis.netoMes),
        hint: 'Facturación - sueldos - impuestos - gastos'
      },
      {
        title: 'Cobros del mes',
        value: Formatters.formatCurrency(kpis.pagosClientesMes),
        hint: 'Pagos de clientes'
      },
      {
        title: 'Facturas pendientes',
        value: Formatters.formatNumber(kpis.facturasPendientes),
        hint: Formatters.formatCurrency(kpis.facturacionPendiente)
      },
      {
        title: 'Horas trabajadas',
        value: Formatters.formatHours(kpis.horasMes),
        hint: 'Asistencia registrada'
      },
      {
        title: 'Clientes activos',
        value: Formatters.formatNumber(kpis.clientesActivos),
        hint: 'Base actual'
      },
      {
        title: 'Empleados activos',
        value: Formatters.formatNumber(kpis.empleadosActivos),
        hint: 'Base actual'
      }
    ];

    Dom.clear(container);
    cards.forEach(function (card) {
      var col = Dom.el('div', { className: 'col-12 col-md-6 col-xl-4' });
      var metric = Dom.el('div', { className: 'lt-metric p-3 h-100' }, [
        Dom.el('div', { className: 'text-muted small', text: card.title }),
        Dom.el('div', { className: 'analysis-kpi-value', text: card.value }),
        Dom.el('div', { className: 'text-muted small', text: card.hint })
      ]);
      col.appendChild(metric);
      container.appendChild(col);
    });
  }

  function renderFlow(kpis) {
    var container = document.getElementById('analysis-flow');
    if (!container) return;

    var saldo = (Number(kpis.pagosClientesMes) || 0) -
      (Number(kpis.pagosEmpleadosMes) || 0) -
      (Number(kpis.adelantosMes) || 0) -
      (Number(kpis.gastosMes) || 0);

    var rows = [
      { label: 'Facturación emitida', value: Formatters.formatCurrency(kpis.facturacionMes) },
      { label: 'Impuestos (IVA)', value: Formatters.formatCurrency(kpis.impuestosMes) },
      { label: 'Cobros del mes', value: Formatters.formatCurrency(kpis.pagosClientesMes) },
      { label: 'Pagos a empleados', value: Formatters.formatCurrency(kpis.pagosEmpleadosMes) },
      { label: 'Adelantos', value: Formatters.formatCurrency(kpis.adelantosMes) },
      { label: 'Gastos operativos', value: Formatters.formatCurrency(kpis.gastosMes) },
      { label: 'Saldo neto', value: Formatters.formatCurrency(saldo), highlight: true }
    ];

    Dom.clear(container);
    rows.forEach(function (row) {
      var rowEl = Dom.el('div', {
        className: 'analysis-flow-row ' + (row.highlight ? 'analysis-flow-row--highlight' : '')
      }, [
        Dom.el('span', { text: row.label }),
        Dom.el('strong', { text: row.value })
      ]);
      container.appendChild(rowEl);
    });
  }

  function renderPaymentMethods(items) {
    var container = document.getElementById('analysis-payments');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'Sin pagos registrados en el período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'Sin pagos registrados en el período.' }));
      }
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    Dom.clear(container);
    items.slice(0, 6).forEach(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      var row = Dom.el('div', { className: 'analysis-payment' }, [
        Dom.el('div', { className: 'd-flex justify-content-between' }, [
          Dom.el('span', { text: item.medio || 'Sin medio' }),
          Dom.el('span', { className: 'fw-semibold', text: Formatters.formatCurrency(item.total) })
        ]),
        Dom.el('div', { className: 'analysis-bar' }, Dom.el('span', { style: { width: pct + '%' } }))
      ]);
      container.appendChild(row);
    });
  }

  function renderExpensesByCategory(items) {
    renderExpensesList('analysis-expenses-category', items, 'Sin gastos registrados en el período.', 'categoria');
  }

  function renderExpensesByMethod(items) {
    renderExpensesList('analysis-expenses-method', items, 'Sin gastos registrados en el período.', 'medio');
  }

  function renderExpensesList(containerId, items, emptyMessage, labelKey) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, emptyMessage);
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: emptyMessage }));
      }
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    Dom.clear(container);
    items.slice(0, 6).forEach(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      var label = item[labelKey] || item.label || item.medio || 'Sin categoría';
      var row = Dom.el('div', { className: 'analysis-payment' }, [
        Dom.el('div', { className: 'd-flex justify-content-between' }, [
          Dom.el('span', { text: label }),
          Dom.el('span', { className: 'fw-semibold', text: Formatters.formatCurrency(item.total) })
        ]),
        Dom.el('div', { className: 'analysis-bar' }, Dom.el('span', { style: { width: pct + '%' } }))
      ]);
      container.appendChild(row);
    });
  }

  function renderTrend(items) {
    var container = document.getElementById('analysis-trends');
    updateRangeLabel();
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos para comparar.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos para comparar.' }));
      }
      return;
    }

    var maxFact = items.reduce(function (acc, item) {
      return Math.max(acc, Number(item.facturacion) || 0);
    }, 0);

    Dom.clear(container);
    var grid = Dom.el('div', { className: 'analysis-trend-grid' });
    var header = Dom.el('div', { className: 'analysis-trend-row analysis-trend-header' }, [
      Dom.el('span', { text: 'Mes' }),
      Dom.el('span', { text: 'Facturación' }),
      Dom.el('span', { text: 'Sueldos' }),
      Dom.el('span', { text: 'Gastos' }),
      Dom.el('span', { text: 'Impuestos' }),
      Dom.el('span', { text: 'Neto' })
    ]);
    grid.appendChild(header);

    items.forEach(function (item) {
      var pct = maxFact ? Math.round((Number(item.facturacion) || 0) / maxFact * 100) : 0;
      var neto = Number(item.neto) || 0;
      var netoClass = neto >= 0 ? 'text-success' : 'text-danger';

      var row = Dom.el('div', { className: 'analysis-trend-row' });
      row.appendChild(Dom.el('span', { className: 'analysis-trend-month', text: item.label || '' }));
      row.appendChild(Dom.el('span', null, [
        Dom.el('div', { className: 'analysis-trend-bar' }, Dom.el('span', { style: { width: pct + '%' } })),
        Dom.el('div', { className: 'analysis-trend-value', text: Formatters.formatCurrency(item.facturacion) })
      ]));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.sueldos) }));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.gastos) }));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.impuestos) }));
      row.appendChild(Dom.el('span', { className: netoClass, text: Formatters.formatCurrency(neto) }));
      grid.appendChild(row);
    });

    container.appendChild(grid);
  }

  function renderTrendPlaceholder() {
    updateRangeLabel();
    var container = document.getElementById('analysis-trends');
    if (container) Dom.clear(container);
  }

  function updateRangeLabel() {
    var rangeLabel = document.getElementById('analysis-range-label');
    if (rangeLabel) rangeLabel.textContent = String(state.currentRange);
  }

  function updateComparisonUI() {
    var placeholder = document.getElementById('analysis-compare-placeholder');
    var body = document.getElementById('analysis-compare-body');
    var toggle = document.getElementById('analysis-compare-toggle');
    if (placeholder) placeholder.classList.toggle('d-none', state.comparisonVisible);
    if (body) body.classList.toggle('d-none', !state.comparisonVisible);
    if (toggle) {
      toggle.classList.toggle('btn-outline-primary', !state.comparisonVisible);
      toggle.classList.toggle('btn-primary', state.comparisonVisible);
      var label = toggle.querySelector('span');
      if (label) label.textContent = state.comparisonVisible ? 'Ocultar' : 'Mostrar';
    }
  }

  function renderProjection(projection) {
    var container = document.getElementById('analysis-projection');
    if (!container) return;

    if (!projection || !projection.meses) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos suficientes para proyectar.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos suficientes para proyectar.' }));
      }
      return;
    }

    var margen = Number(projection.margenPct) || 0;
    var margenLabel = margen.toFixed(1).replace(/\.0$/, '') + '%';

    Dom.clear(container);
    var wrapper = Dom.el('div', { className: 'analysis-projection' });
    wrapper.appendChild(Dom.el('div', {
      className: 'analysis-projection-note',
      text: 'Promedio de los últimos ' + projection.meses + ' meses'
    }));
    var grid = Dom.el('div', { className: 'analysis-projection-grid' });
    var items = [
      { label: 'Facturación esperada', value: Formatters.formatCurrency(projection.facturacion) },
      { label: 'Sueldos estimados', value: Formatters.formatCurrency(projection.sueldos) },
      { label: 'Impuestos (IVA)', value: Formatters.formatCurrency(projection.impuestos) },
      { label: 'Gastos estimados', value: Formatters.formatCurrency(projection.gastos) },
      { label: 'Neto proyectado', value: Formatters.formatCurrency(projection.neto) },
      { label: 'Horas estimadas', value: Formatters.formatHours(projection.horas) },
      { label: 'Margen estimado', value: margenLabel }
    ];
    items.forEach(function (item) {
      grid.appendChild(Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-projection-label', text: item.label }),
        Dom.el('div', { className: 'analysis-projection-value', text: item.value })
      ]));
    });
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
  }

  function renderTopClients(items) {
    var container = document.getElementById('analysis-top-clients');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos de clientes para este período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos de clientes para este período.' }));
      }
      return;
    }

    Dom.clear(container);
    var list = Dom.el('div', { className: 'analysis-list' });
    items.forEach(function (item, idx) {
      var row = Dom.el('div', { className: 'analysis-list-row' });
      var left = Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-rank', text: '#' + (idx + 1) }),
        Dom.el('div', { className: 'analysis-name', text: item.cliente || 'Cliente' }),
        Dom.el('div', {
          className: 'analysis-subtext',
          text: Formatters.formatHours(item.horas) + ' · ' + (item.dias || 0) + ' días'
        })
      ]);
      var right = Dom.el('div', { className: 'analysis-value', text: Formatters.formatCurrency(item.totalFacturacion) });
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderTopEmployees(items) {
    var container = document.getElementById('analysis-top-employees');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos de empleados para este período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos de empleados para este período.' }));
      }
      return;
    }

    Dom.clear(container);
    var list = Dom.el('div', { className: 'analysis-list' });
    items.forEach(function (item, idx) {
      var row = Dom.el('div', { className: 'analysis-list-row' });
      var left = Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-rank', text: '#' + (idx + 1) }),
        Dom.el('div', { className: 'analysis-name', text: item.empleado || 'Empleado' }),
        Dom.el('div', {
          className: 'analysis-subtext',
          text: Formatters.formatHours(item.horas) + ' · ' + Formatters.formatCurrency(item.totalNeto || 0)
        })
      ]);
      var right = Dom.el('div', { className: 'analysis-value', text: Formatters.formatHours(item.horas) });
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  global.AnalysisPanelRender = {
    renderShell: renderShell,
    renderDashboard: renderDashboard,
    renderKpis: renderKpis,
    renderFlow: renderFlow,
    renderPaymentMethods: renderPaymentMethods,
    renderExpensesByCategory: renderExpensesByCategory,
    renderExpensesByMethod: renderExpensesByMethod,
    renderExpensesList: renderExpensesList,
    renderTrend: renderTrend,
    renderTrendPlaceholder: renderTrendPlaceholder,
    updateRangeLabel: updateRangeLabel,
    updateComparisonUI: updateComparisonUI,
    renderProjection: renderProjection,
    renderTopClients: renderTopClients,
    renderTopEmployees: renderTopEmployees
  };
})(typeof window !== 'undefined' ? window : this);


/**
 * AnalysisPanelData
 * Carga de datos para el panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;
  const PREFETCH_TTL_MS = 5 * 60 * 1000;

  function buildPayload() {
    var payload = state.currentPeriod
      ? { period: state.currentPeriod, monthsBack: state.currentRange }
      : { monthsBack: state.currentRange };
    payload.includeTrend = !!state.comparisonVisible;
    return payload;
  }

  function buildKey(payload) {
    if (!payload) return "";
    var period = payload.period || "";
    var monthsBack = payload.monthsBack || "";
    var trend = payload.includeTrend ? "1" : "0";
    return [period, monthsBack, trend].join("|");
  }

  function isPrefetchFresh(key) {
    if (!state.prefetchData || !state.prefetchKey) return false;
    if (key !== state.prefetchKey) return false;
    return (Date.now() - (state.prefetchAt || 0)) < PREFETCH_TTL_MS;
  }

  function prefetch() {
    if (!global.ApiService || typeof global.ApiService.call !== "function") {
      return Promise.resolve(null);
    }
    var payload = buildPayload();
    var key = buildKey(payload);
    return global.ApiService.call('getAnalyticsSummary', payload)
      .then(function (data) {
        state.prefetchData = data || {};
        state.prefetchKey = key;
        state.prefetchAt = Date.now();
        return state.prefetchData;
      })
      .catch(function () {
        return null;
      });
  }

  function load() {
    var loading = document.getElementById('analysis-loading');
    var dash = document.getElementById('analysis-dashboard');
    if (loading) loading.classList.remove('d-none');
    if (dash) dash.classList.add('d-none');

    if (!global.ApiService || typeof global.ApiService.call !== 'function') {
      if (loading) loading.classList.add('d-none');
      if (dash) dash.classList.add('d-none');
      var missingContainer = document.getElementById('analysis-content');
      if (missingContainer) {
        if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
          EmptyState.render(missingContainer, {
            variant: 'error',
            title: 'Análisis no disponible',
            message: 'No se pudo iniciar la conexión con el servidor.'
          });
        } else if (state.Dom) {
          state.Dom.clear(missingContainer);
          missingContainer.appendChild(
            state.Dom.el('div', {
              className: 'alert alert-danger',
              text: 'Análisis no disponible: no se pudo iniciar la conexión con el servidor.'
            })
          );
        } else {
          missingContainer.textContent = 'Análisis no disponible: no se pudo iniciar la conexión con el servidor.';
        }
      }
      return;
    }

    var payload = buildPayload();
    var key = buildKey(payload);

    if (isPrefetchFresh(key)) {
      state.lastData = state.prefetchData || {};
      if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderDashboard === 'function') {
        global.AnalysisPanelRender.renderDashboard(state.lastData);
      }
      if (loading) loading.classList.add('d-none');
      if (dash) dash.classList.remove('d-none');
      return;
    }

    global.ApiService.call('getAnalyticsSummary', payload)
      .then(function (data) {
        state.lastData = data || {};
        if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderDashboard === 'function') {
          global.AnalysisPanelRender.renderDashboard(state.lastData);
        }
      })
      .catch(function (err) {
        var container = document.getElementById('analysis-content');
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError('Error cargando análisis', err, { container: container });
        } else if (Alerts && Alerts.showError) {
          Alerts.showError('Error cargando análisis', err);
          if (container && typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
            EmptyState.render(container, {
              variant: 'error',
              title: 'Error cargando análisis',
              message: err && err.message ? err.message : err
            });
          }
        } else if (container) {
          if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.render === 'function') {
            EmptyState.render(container, {
              variant: 'error',
              title: 'Error cargando análisis',
              message: err && err.message ? err.message : err
            });
          } else if (state.Dom) {
            state.Dom.clear(container);
            container.appendChild(
              state.Dom.el('div', {
                className: 'alert alert-danger',
                text: 'Error cargando análisis: ' + (err && err.message ? err.message : err)
              })
            );
          } else {
            container.textContent = 'Error cargando análisis: ' + (err && err.message ? err.message : err);
          }
        }
      })
      .finally(function () {
        if (loading) loading.classList.add('d-none');
        if (dash) dash.classList.remove('d-none');
      });
  }

  global.AnalysisPanelData = { load: load, prefetch: prefetch };
})(typeof window !== 'undefined' ? window : this);


/**
 * AnalysisPanelHandlers
 * Eventos del panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;

  function attach() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    var signal = state.eventsController.signal;
    var on = function (el, evt, handler) {
      if (!el) return;
      el.addEventListener(evt, handler, { signal: signal });
    };

    var periodInput = document.getElementById('analysis-period');
    if (periodInput) {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      periodInput.value = y + '-' + m;
      state.currentPeriod = periodInput.value;
      on(periodInput, 'change', function () {
        state.currentPeriod = periodInput.value;
        global.AnalysisPanelData.load();
      });
    }

    var rangeSelect = document.getElementById('analysis-range');
    if (rangeSelect) {
      rangeSelect.value = String(state.currentRange);
      on(rangeSelect, 'change', function () {
        state.currentRange = Number(rangeSelect.value) || 6;
        global.AnalysisPanelData.load();
      });
    }

    var compareToggle = document.getElementById('analysis-compare-toggle');
    if (compareToggle) {
      on(compareToggle, 'click', function () {
        state.comparisonVisible = !state.comparisonVisible;
        if (global.AnalysisPanelRender && typeof global.AnalysisPanelRender.updateComparisonUI === 'function') {
          global.AnalysisPanelRender.updateComparisonUI();
        }
        if (state.comparisonVisible && state.lastData && global.AnalysisPanelRender && typeof global.AnalysisPanelRender.renderTrend === 'function') {
          global.AnalysisPanelRender.renderTrend(state.lastData.trend || []);
        }
      });
    }

    var refreshBtn = document.getElementById('analysis-refresh');
    if (refreshBtn) {
      on(refreshBtn, 'click', function () {
        global.AnalysisPanelData.load();
      });
    }
  }

  global.AnalysisPanelHandlers = { attach: attach };
})(typeof window !== 'undefined' ? window : this);


/**
 * AnalysisPanel
 * Orquestador del modulo de analisis.
 */
var AnalysisPanel = (function () {
  function render(targetId) {
    if (!AnalysisPanelState || !AnalysisPanelRender || !AnalysisPanelHandlers || !AnalysisPanelData) {
      console.error('AnalysisPanel dependencies no disponibles');
      return;
    }

    var container = document.getElementById(targetId || AnalysisPanelState.containerId);
    if (!container) return;

    AnalysisPanelState.comparisonVisible = false;
    AnalysisPanelState.lastData = null;

    AnalysisPanelRender.renderShell(container);
    AnalysisPanelHandlers.attach();
    AnalysisPanelRender.updateComparisonUI();
    AnalysisPanelData.load();
  }

  return { render: render };
})();


/**
 * PaymentsPanelState
 * Estado y helpers del panel de pagos.
 */
(function (global) {
  const PaymentsPanelState = {
    containerId: "payments-panel",
    clientIdMap: new Map(),
    pendingInvoices: [],
    unappliedPayments: [],
    currentMode: "account",
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    referenceListenerBound: false,
    eventsController: null,
    escapeHtml: (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.escapeHtml === "function")
      ? HtmlHelpers.escapeHtml
      : function (value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/[<]/g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  global.PaymentsPanelState = PaymentsPanelState;
})(typeof window !== "undefined" ? window : this);


/**
 * PaymentsPanelData
 * Datos del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;

  function extractClientIdFromLabel_(label) {
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      return DomainHelpers.extractIdFromLabel(label);
    }
    return "";
  }

  function getClientIdFromLabel(label) {
    if (!label) return "";
    const extracted = extractClientIdFromLabel_(label);
    if (extracted) return extracted;
    const plain = String(label).trim();
    if (/^\d+$/.test(plain)) return plain;
    return "";
  }

  function loadClients() {
    const datalist = document.getElementById("payments-client-list");
    if (!datalist || !ReferenceService) return;

    if (!ReferenceService || typeof ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = ReferenceService.ensureLoaded();

    loadPromise.then(() => {
      const refs = ReferenceService.get();
      const clients = refs && refs.clientes ? refs.clientes : [];
      const ui = global.UIHelpers;
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, []);
      } else {
        datalist.innerHTML = "";
      }
      state.clientIdMap.clear();

      const labels = clients
        .map((c) => {
          if (!c || typeof c !== "object") return "";
          const id = c.id != null ? String(c.id).trim() : "";
          if (!id) return "";
          let label = state.formatClientLabel(c);
          label = label != null ? String(label).trim() : "";
          if (!label) label = `ID: ${id}`;
          if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
            if (!DomainHelpers.extractIdFromLabel(label)) {
              label = `${label} (ID: ${id})`;
            }
          }
          state.clientIdMap.set(label, id);
          return label;
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es"));

      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels);
        return;
      }
      labels.forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    });
  }

  function refreshClientData() {
    const clientRaw = document.getElementById("payments-client")?.value || "";
    const idCliente = getClientIdFromLabel(clientRaw);

    if (!clientRaw || !idCliente) {
      state.pendingInvoices = [];
      state.unappliedPayments = [];
      PaymentsPanelRender.renderInvoiceTable([]);
      PaymentsPanelRender.renderUnappliedTable([]);
      PaymentsPanelRender.renderInvoiceOptions([]);
      PaymentsPanelRender.renderInvoiceSummary("");
      PaymentsPanelRender.updateInvoiceCount(0);
      PaymentsPanelRender.updateUnappliedCount(0);
      return;
    }

    fetchPendingInvoices(clientRaw, idCliente);
    fetchUnappliedPayments(clientRaw, idCliente);
  }

  function fetchPendingInvoices(clientRaw, idCliente) {
    PaymentsPanelRender.toggleInvoiceLoading(true);
    PaymentsService.getClientInvoicesForPayment("", idCliente)
      .then((res) => {
        state.pendingInvoices = (res && res.invoices) ? res.invoices : (res || []);
        PaymentsPanelRender.renderInvoiceTable(state.pendingInvoices);
        PaymentsPanelRender.renderInvoiceOptions(state.pendingInvoices);
        PaymentsPanelRender.updateInvoiceCount(state.pendingInvoices.length);
      })
      .catch((err) => {
        Alerts && Alerts.notifyError
          ? Alerts.notifyError("Error cargando facturas", err)
          : (Alerts && Alerts.showError ? Alerts.showError("Error cargando facturas", err) : console.error(err));
        state.pendingInvoices = [];
        PaymentsPanelRender.renderInvoiceTable([]);
        PaymentsPanelRender.renderInvoiceOptions([]);
        PaymentsPanelRender.updateInvoiceCount(0);
      })
      .finally(() => PaymentsPanelRender.toggleInvoiceLoading(false));
  }

  function fetchUnappliedPayments(clientRaw, idCliente) {
    PaymentsPanelRender.toggleUnappliedLoading(true);
    PaymentsService.getUnappliedClientPayments("", idCliente)
      .then((res) => {
        state.unappliedPayments = (res && res.payments) ? res.payments : (res || []);
        PaymentsPanelRender.renderUnappliedTable(state.unappliedPayments);
        PaymentsPanelRender.updateUnappliedCount(state.unappliedPayments.length);
      })
      .catch((err) => {
        Alerts && Alerts.notifyError
          ? Alerts.notifyError("Error cargando pagos", err)
          : (Alerts && Alerts.showError ? Alerts.showError("Error cargando pagos", err) : console.error(err));
        state.unappliedPayments = [];
        PaymentsPanelRender.renderUnappliedTable([]);
        PaymentsPanelRender.updateUnappliedCount(0);
      })
      .finally(() => PaymentsPanelRender.toggleUnappliedLoading(false));
  }

  global.PaymentsPanelData = {
    loadClients,
    refreshClientData,
    fetchPendingInvoices,
    fetchUnappliedPayments,
    getClientIdFromLabel
  };
})(typeof window !== "undefined" ? window : this);


/**
 * PaymentsPanelRender
 * Render del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;
  const Dom = global.DomHelpers;

  function renderSelect_(select, options, selected, settings) {
    if (!select) return;
    const ui = global.UIHelpers;
    if (ui && typeof ui.renderSelect === "function") {
      ui.renderSelect(select, options, selected, settings);
      return;
    }
    Dom.clear(select);
    const cfg = settings || {};
    if (cfg.includeEmpty) {
      select.appendChild(Dom.el("option", { value: "", text: cfg.emptyLabel || "Seleccionar..." }));
    }
    (options || []).forEach((opt) => {
      const node = Dom.el("option", { value: opt.value, text: opt.label });
      if (opt.dataset) {
        Object.keys(opt.dataset).forEach((key) => {
          if (opt.dataset[key] != null) node.dataset[key] = String(opt.dataset[key]);
        });
      }
      if (selected && String(opt.value) === String(selected)) node.selected = true;
      select.appendChild(node);
    });
  }

  function getPaymentMethods_() {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  }

  function renderPaymentMethodOptions_() {
    const select = document.getElementById("payments-method");
    if (!select) return;
    const current = select.value || "";
    const options = getPaymentMethods_().map((method) => ({
      value: method,
      label: method
    }));
    renderSelect_(select, options, current, { includeEmpty: true, emptyLabel: "Seleccionar..." });
  }

  function render() {
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Pagos</h6>
            <div class="small text-muted">Registrá pagos a cuenta o aplicados a facturas.</div>
          </div>
          <button class="btn btn-outline-secondary btn-sm" id="payments-refresh">
            <i class="bi bi-arrow-repeat me-1"></i>Actualizar
          </button>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 align-items-end mb-3">
            <div class="col-md-5">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="payments-client-list" id="payments-client" class="form-control form-control-sm" placeholder="Seleccionar cliente...">
              <datalist id="payments-client-list"></datalist>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Tipo de pago</label>
              <div class="btn-group w-100" role="group" id="payments-mode-group">
                <button type="button" class="btn btn-outline-primary btn-sm active" data-mode="account">
                  <i class="bi bi-cash-stack me-1"></i>A cuenta
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm" data-mode="invoice">
                  <i class="bi bi-receipt-cutoff me-1"></i>A factura
                </button>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Fecha</label>
              <input type="date" id="payments-date" class="form-control form-control-sm">
            </div>
          </div>

          <div class="row g-2">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Monto</label>
              <input type="number" id="payments-amount" class="form-control form-control-sm" step="0.01" min="0">
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Medio de pago</label>
              <select id="payments-method" class="form-select form-select-sm"></select>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Comprobante</label>
              <input type="text" id="payments-receipt" class="form-control form-control-sm" placeholder="Nro. comprobante">
            </div>
          </div>

          <div class="row g-2 mt-2">
            <div class="col-md-8">
              <label class="form-label small text-muted fw-bold mb-1">Observaciones</label>
              <input type="text" id="payments-notes" class="form-control form-control-sm" placeholder="Detalle del pago...">
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Factura</label>
              <select id="payments-invoice" class="form-select form-select-sm" disabled>
                <option value="">Seleccionar factura...</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-success btn-sm" id="payments-save">
              <i class="bi bi-check2-circle me-1"></i>Guardar pago
            </button>
          </div>

          <div class="row g-2 mt-4">
            <div class="col-lg-8">
              <div class="card border shadow-none h-100">
                <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                  <span class="text-muted small fw-bold text-uppercase">Facturas pendientes</span>
                  <span class="badge bg-white text-dark border" id="payments-invoice-count">0</span>
                </div>
                <div class="card-body p-0">
                  <div id="payments-invoice-summary" class="p-3 border-bottom">
                    <div class="text-muted small">Seleccioná una factura para ver el detalle.</div>
                  </div>
                  <div id="payments-invoice-loading" class="text-center py-4 d-none">
                  </div>
                  <div class="table-responsive lt-table-wrap" id="payments-invoice-table-wrapper">
                    <table class="table table-hover table-sm align-middle mb-0">
                      <thead class="table-light">
                        <tr>
                          <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                          <th class="py-2 text-muted font-weight-normal">Factura</th>
                          <th class="text-end py-2 text-muted font-weight-normal">Saldo</th>
                          <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                        </tr>
                      </thead>
                      <tbody id="payments-invoice-tbody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card border shadow-none h-100">
                <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                  <span class="text-muted small fw-bold text-uppercase">Pagos a cuenta</span>
                  <span class="badge bg-white text-dark border" id="payments-unapplied-count">0</span>
                </div>
                <div class="card-body p-0">
                  <div id="payments-unapplied-loading" class="text-center py-4 d-none">
                  </div>
                  <div class="table-responsive lt-table-wrap" id="payments-unapplied-table-wrapper">
                    <table class="table table-hover table-sm align-middle mb-0">
                      <thead class="table-light">
                        <tr>
                          <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                          <th class="py-2 text-muted font-weight-normal">Detalle</th>
                          <th class="text-end py-2 text-muted font-weight-normal">Disponible</th>
                          <th class="py-2 text-muted font-weight-normal">Medio</th>
                          <th class="py-2 text-muted font-weight-normal">Comprobante</th>
                          <th class="text-center py-2 text-muted font-weight-normal">Acción</th>
                        </tr>
                      </thead>
                      <tbody id="payments-unapplied-tbody"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderPaymentMethodOptions_();
    PaymentsPanelHandlers.setDefaultDate();
    PaymentsPanelData.loadClients();
    PaymentsPanelHandlers.attachEvents();
    PaymentsPanelHandlers.updateMode("account");
    renderInvoiceTable([]);
    renderUnappliedTable([]);
  }

  function renderInvoiceOptions(items) {
    const select = document.getElementById("payments-invoice");
    if (!select) return;
    const options = (items || []).map((inv) => {
      const fechaStr = inv.fecha ? Formatters.formatDateDisplay(inv.fecha) : "";
      const saldo = Formatters.formatCurrency(inv.saldo || 0);
      return {
        value: inv.id || "",
        label: `${fechaStr} - ${inv.numero || "S/N"} (${saldo})`,
        dataset: { numero: inv.numero || "" }
      };
    });
    renderSelect_(select, options, "", { includeEmpty: true, emptyLabel: "Seleccionar factura..." });
  }

  function renderInvoiceSummary(invoiceId) {
    const box = document.getElementById("payments-invoice-summary");
    if (!box) return;

    const invoice = state.pendingInvoices.find((inv) => String(inv.id || "") === String(invoiceId || ""));
    if (!invoice) {
      if (typeof EmptyState !== "undefined" && EmptyState && typeof EmptyState.renderInline === "function") {
        EmptyState.renderInline(box, "Seleccioná una factura para ver el detalle.");
      } else {
        Dom.clear(box);
        Dom.append(box, Dom.el("div", { className: "text-muted small", text: "Seleccioná una factura para ver el detalle." }));
      }
      return;
    }

    Dom.clear(box);
    Dom.append(box, [
      Dom.el("div", { className: "small text-muted", text: "Factura seleccionada" }),
      Dom.el("div", { className: "fw-semibold", text: invoice.numero || "S/N" }),
      Dom.el("div", { className: "small text-muted mt-1", text: invoice.concepto || "" }),
      Dom.el("div", { className: "d-flex gap-3 mt-2" }, [
        Dom.el("span", { text: `Fecha: ${Formatters.formatDateDisplay(invoice.fecha)}` }),
        Dom.el("span", null, [
          Dom.el("span", { text: "Saldo: " }),
          Dom.el("strong", { text: Formatters.formatCurrency(invoice.saldo || 0) })
        ])
      ])
    ]);
  }

  function renderEmptyRow_(tbody, colSpan, message) {
    if (!tbody) return;
    const td = Dom.el("td", {
      className: "text-center py-4",
      colSpan: String(colSpan || 1)
    });
    if (global.EmptyState && typeof global.EmptyState.renderInline === "function") {
      global.EmptyState.renderInline(td, message || "Sin datos para mostrar.");
    } else {
      Dom.append(td, Dom.el("div", { className: "text-muted small", text: message || "Sin datos para mostrar." }));
    }
    const tr = Dom.el("tr", null, td);
    tbody.appendChild(tr);
  }

  function renderInvoiceTable(items) {
    const tbody = document.getElementById("payments-invoice-tbody");
    if (!tbody) return;
    Dom.clear(tbody);

    if (!items || !items.length) {
      renderEmptyRow_(tbody, 4, "Sin facturas pendientes.");
      return;
    }

    items.forEach((inv) => {
      const tr = Dom.el("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: Formatters.formatDateDisplay(inv.fecha) }));

      const infoTd = Dom.el("td");
      Dom.append(infoTd, [
        Dom.el("div", { className: "fw-semibold", text: inv.numero || "S/N" }),
        Dom.el("div", { className: "text-muted small", text: inv.concepto || "" })
      ]);
      tr.appendChild(infoTd);

      tr.appendChild(Dom.el("td", {
        className: "text-end text-danger",
        text: Formatters.formatCurrency(inv.saldo || 0)
      }));

      const actionBtn = Dom.el("button", {
        className: "btn btn-outline-primary btn-sm",
        dataset: { invoiceId: inv.id || "" },
        text: "Seleccionar"
      });
      tr.appendChild(Dom.el("td", { className: "text-center" }, actionBtn));

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-invoice-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const invoiceId = btn.getAttribute("data-invoice-id");
        const select = document.getElementById("payments-invoice");
        if (select) {
          select.value = invoiceId || "";
          renderInvoiceSummary(invoiceId);
        }
      });
    });
  }

  function renderUnappliedTable(items) {
    const tbody = document.getElementById("payments-unapplied-tbody");
    if (!tbody) return;
    Dom.clear(tbody);

    if (!items || !items.length) {
      renderEmptyRow_(tbody, 6, "Sin pagos a cuenta disponibles.");
      return;
    }

    items.forEach((pay) => {
      const tr = Dom.el("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: Formatters.formatDateDisplay(pay.fecha) }));
      tr.appendChild(Dom.el("td", { text: pay.detalle || "" }));
      tr.appendChild(Dom.el("td", {
        className: "text-end text-success",
        text: Formatters.formatCurrency(pay.monto || 0)
      }));
      tr.appendChild(Dom.el("td", { text: pay.medioPago || "" }));
      tr.appendChild(Dom.el("td", { text: pay.numeroComprobante || "" }));

      const actionBtn = Dom.el("button", {
        className: "btn btn-outline-primary btn-sm",
        dataset: { payId: pay.id || "" },
        text: "Aplicar"
      });
      tr.appendChild(Dom.el("td", { className: "text-center" }, actionBtn));

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-pay-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const payId = btn.getAttribute("data-pay-id");
        PaymentsPanelHandlers.openApplyModal(payId);
      });
    });
  }

  function updateInvoiceCount(count) {
    const badge = document.getElementById("payments-invoice-count");
    if (badge) badge.textContent = String(count || 0);
  }

  function updateUnappliedCount(count) {
    const badge = document.getElementById("payments-unapplied-count");
    if (badge) badge.textContent = String(count || 0);
  }

  function toggleInvoiceLoading(show) {
    const loading = document.getElementById("payments-invoice-loading");
    const wrapper = document.getElementById("payments-invoice-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando facturas..." });
      }
    }
    if (wrapper) wrapper.classList.toggle("d-none", show);
  }

  function toggleUnappliedLoading(show) {
    const loading = document.getElementById("payments-unapplied-loading");
    const wrapper = document.getElementById("payments-unapplied-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando pagos..." });
      }
    }
    if (wrapper) wrapper.classList.toggle("d-none", show);
  }

  global.PaymentsPanelRender = {
    render,
    renderInvoiceOptions,
    renderInvoiceSummary,
    renderInvoiceTable,
    renderUnappliedTable,
    updateInvoiceCount,
    updateUnappliedCount,
    toggleInvoiceLoading,
    toggleUnappliedLoading
  };
})(typeof window !== "undefined" ? window : this);


/**
 * PaymentsPanelHandlers
 * Eventos y acciones del panel de pagos.
 */
(function (global) {
  const state = global.PaymentsPanelState;
  const Dom = global.DomHelpers;

  function setDefaultDate() {
    const dateInput = document.getElementById("payments-date");
    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
  }

  function handleReferenceUpdate() {
    const view = document.getElementById("view-pagos");
    if (view && !view.classList.contains("d-none")) {
      PaymentsPanelData.loadClients();
    }
  }

  function attachEvents() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    const refreshBtn = document.getElementById("payments-refresh");
    if (refreshBtn) {
      on(refreshBtn, "click", () => {
        PaymentsPanelData.loadClients();
        PaymentsPanelData.refreshClientData();
      });
    }

    const clientInput = document.getElementById("payments-client");
    if (clientInput) {
      on(clientInput, "change", () => {
        PaymentsPanelData.refreshClientData();
        PaymentsPanelRender.renderInvoiceSummary("");
      });
    }

    const modeGroup = document.getElementById("payments-mode-group");
    if (modeGroup) {
      modeGroup.querySelectorAll("[data-mode]").forEach((btn) => {
        on(btn, "click", () => updateMode(btn.getAttribute("data-mode")));
      });
    }

    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) {
      on(invoiceSelect, "change", () => {
        PaymentsPanelRender.renderInvoiceSummary(invoiceSelect.value || "");
      });
    }

    const saveBtn = document.getElementById("payments-save");
    if (saveBtn) {
      on(saveBtn, "click", savePayment);
    }
  }

  function updateMode(mode) {
    const normalized = mode === "invoice" ? "invoice" : "account";
    state.currentMode = normalized;

    const group = document.getElementById("payments-mode-group");
    if (group) {
      group.querySelectorAll("[data-mode]").forEach((btn) => {
        const isActive = btn.getAttribute("data-mode") === normalized;
        btn.classList.toggle("active", isActive);
      });
    }

    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) {
      invoiceSelect.disabled = normalized !== "invoice";
      if (normalized !== "invoice") {
        invoiceSelect.value = "";
      }
    }
  }

  function openApplyModal(paymentId) {
    const payment = state.unappliedPayments.find((p) => String(p.id || "") === String(paymentId || ""));
    if (!payment) return;
    showApplyModal(payment);
  }

  function showApplyModal(payment) {
    if (!global.ModalHelpers) return;

    const body = Dom.el("div", { className: "payments-apply-body" }, [
      Dom.el("div", { className: "d-flex justify-content-between align-items-center mb-3" }, [
        Dom.el("div", {}, [
          Dom.el("div", { className: "small text-muted", text: "Pago disponible" }),
          Dom.el("div", { className: "fw-semibold", id: "payments-apply-amount" })
        ]),
        Dom.el("div", { className: "text-end" }, [
          Dom.el("div", { className: "small text-muted", text: "Disponible" }),
          Dom.el("strong", { id: "payments-apply-remaining" })
        ])
      ]),
      Dom.el("div", { className: "table-responsive" }, [
        Dom.el("table", { className: "table table-sm align-middle" }, [
          Dom.el("thead", { className: "table-light" }, [
            Dom.el("tr", {}, [
              Dom.el("th", { text: "Factura" }),
              Dom.el("th", { text: "Fecha" }),
              Dom.el("th", { className: "text-end", text: "Saldo" }),
              Dom.el("th", { className: "text-end", text: "Aplicar" })
            ])
          ]),
          Dom.el("tbody", { id: "payments-apply-tbody" })
        ])
      ]),
      Dom.el("div", { className: "text-end" }, [
        Dom.el("span", { className: "text-muted small", text: "Total aplicado:" }),
        Dom.el("strong", { id: "payments-apply-total", className: "ms-2" })
      ])
    ]);

    const footer = [
      Dom.el("button", {
        type: "button",
        className: "btn btn-secondary",
        "data-bs-dismiss": "modal",
        text: "Cancelar"
      }),
      Dom.el("button", {
        type: "button",
        className: "btn btn-primary",
        id: "payments-apply-confirm",
        text: "Aplicar pago"
      })
    ];

    const modalEl = global.ModalHelpers.create(
      "payments-apply-modal",
      "Aplicar pago a facturas",
      body,
      footer,
      { size: "lg" }
    );
    if (!modalEl) return;

    const amountEl = document.getElementById("payments-apply-amount");
    const remainingEl = document.getElementById("payments-apply-remaining");
    const totalEl = document.getElementById("payments-apply-total");
    if (amountEl) amountEl.textContent = Formatters.formatCurrency(payment.monto || 0);
    if (remainingEl) remainingEl.textContent = Formatters.formatCurrency(payment.monto || 0);
    if (totalEl) totalEl.textContent = Formatters.formatCurrency(0);

    const tbody = document.getElementById("payments-apply-tbody");
    Dom.clear(tbody);
    (state.pendingInvoices || []).forEach((inv) => {
      const saldo = Number(inv.saldo || 0);
      const tr = Dom.el("tr");
      const infoTd = Dom.el("td");
      Dom.append(infoTd, [
        Dom.el("div", { className: "fw-semibold", text: inv.numero || "S/N" }),
        Dom.el("div", { className: "text-muted small", text: inv.concepto || "" })
      ]);
      tr.appendChild(infoTd);
      tr.appendChild(Dom.el("td", { text: Formatters.formatDateDisplay(inv.fecha) }));
      tr.appendChild(Dom.el("td", { className: "text-end", text: Formatters.formatCurrency(saldo) }));
      const input = Dom.el("input", {
        type: "number",
        className: "form-control form-control-sm text-end",
        step: "0.01",
        min: "0",
        max: saldo,
        value: "0",
        dataset: { invoiceId: inv.id || "", invoiceMax: saldo }
      });
      tr.appendChild(Dom.el("td", { className: "text-end" }, input));
      tbody.appendChild(tr);
    });

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("input", () => updateApplyTotals(modalEl, payment));

    const confirmBtn = document.getElementById("payments-apply-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => handleApplyConfirm(modalEl, payment, modal));
    }

    autoDistributeAllocations(modalEl, payment);
  }

  function autoDistributeAllocations(modalEl, payment) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    let remaining = Number(payment.monto || 0);
    inputs.forEach((input) => {
      if (remaining <= 0) {
        input.value = "0";
        return;
      }
      const max = Number(input.dataset.invoiceMax || 0);
      const value = Math.min(max, remaining);
      input.value = value.toFixed(2);
      remaining -= value;
    });
    updateApplyTotals(modalEl, payment);
  }

  function updateApplyTotals(modalEl, payment) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    let total = 0;
    inputs.forEach((input) => {
      const value = Number(input.value || 0);
      if (!isNaN(value)) total += value;
    });

    const totalEl = document.getElementById("payments-apply-total");
    if (totalEl) totalEl.textContent = Formatters.formatCurrency(total);

    const remainingEl = document.getElementById("payments-apply-remaining");
    if (remainingEl) {
      const remaining = Number(payment.monto || 0) - total;
      remainingEl.textContent = Formatters.formatCurrency(remaining);
    }
  }

  function collectAllocations(modalEl) {
    const inputs = modalEl.querySelectorAll("input[data-invoice-id]");
    const allocations = [];
    inputs.forEach((input) => {
      const amount = Number(input.value || 0);
      if (amount > 0) {
        allocations.push({
          invoiceId: input.dataset.invoiceId,
          amount: amount
        });
      }
    });
    return allocations;
  }

  function handleApplyConfirm(modalEl, payment, modal) {
    const allocations = collectAllocations(modalEl);
    if (!allocations.length) {
      Alerts && Alerts.showAlert("Ingresá un monto a aplicar.", "warning");
      return;
    }

    UiState.setGlobalLoading(true, "Aplicando pago...");
    PaymentsService.applyClientPayment(payment.id, allocations)
      .then((res) => {
        const applied = res && res.applied != null ? Formatters.formatCurrency(res.applied) : "";
        const remaining = res && res.remaining != null ? Formatters.formatCurrency(res.remaining) : "";
        if (applied || remaining) {
          Alerts && Alerts.showAlert(`Pago aplicado. Aplicado: ${applied} · Pendiente: ${remaining}`, "success");
        } else {
          Alerts && Alerts.showAlert("Pago aplicado correctamente.", "success");
        }
        modal.hide();
        PaymentsPanelData.refreshClientData();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al aplicar pago", err);
        } else {
          Alerts && Alerts.showAlert("Error al aplicar pago", "danger");
        }
      })
      .finally(() => UiState.setGlobalLoading(false));
  }

  function savePayment() {
    const clientRaw = document.getElementById("payments-client")?.value || "";
    const idCliente = PaymentsPanelData.getClientIdFromLabel(clientRaw);
    const fecha = document.getElementById("payments-date")?.value || "";
    const monto = document.getElementById("payments-amount")?.value || "";
    const medioPago = document.getElementById("payments-method")?.value || "";
    const nroComprobante = document.getElementById("payments-receipt")?.value || "";
    const obs = document.getElementById("payments-notes")?.value || "";
    const facturaSelect = document.getElementById("payments-invoice");
    const facturaId = state.currentMode === "invoice" && facturaSelect ? facturaSelect.value : "";
    const facturaNumero = state.currentMode === "invoice" && facturaSelect && facturaSelect.selectedOptions[0]
      ? (facturaSelect.selectedOptions[0].dataset.numero || "")
      : "";

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente.", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!monto) {
      Alerts && Alerts.showAlert("Ingresá un monto.", "warning");
      return;
    }
    if (state.currentMode === "invoice" && !facturaId) {
      Alerts && Alerts.showAlert("Seleccioná una factura para asociar el pago.", "warning");
      return;
    }

    UiState.setGlobalLoading(true, "Guardando pago...");
    PaymentsService.recordClientPayment({
      fecha: fecha,
      cliente: clientRaw,
      idCliente: idCliente,
      monto: monto,
      detalle: obs,
      numeroComprobante: nroComprobante,
      medioPago: medioPago,
      idFactura: facturaId || "",
      facturaNumero: facturaNumero || ""
    })
      .then(() => {
        Alerts && Alerts.showAlert("Pago registrado correctamente.", "success");
        clearForm(false);
        PaymentsPanelData.refreshClientData();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al registrar pago", err);
        } else {
          Alerts && Alerts.showAlert("Error al registrar pago", "danger");
        }
      })
      .finally(() => UiState.setGlobalLoading(false));
  }

  function clearForm(resetClient = true) {
    if (resetClient) {
      const clientInput = document.getElementById("payments-client");
      if (clientInput) clientInput.value = "";
      state.pendingInvoices = [];
      state.unappliedPayments = [];
    }
    const amount = document.getElementById("payments-amount");
    if (amount) amount.value = "";
    const method = document.getElementById("payments-method");
    if (method) method.value = "";
    const receipt = document.getElementById("payments-receipt");
    if (receipt) receipt.value = "";
    const notes = document.getElementById("payments-notes");
    if (notes) notes.value = "";
    const invoiceSelect = document.getElementById("payments-invoice");
    if (invoiceSelect) invoiceSelect.value = "";
    PaymentsPanelRender.renderInvoiceSummary("");
    if (resetClient) {
      PaymentsPanelRender.renderInvoiceTable([]);
      PaymentsPanelRender.updateInvoiceCount(0);
      PaymentsPanelRender.renderUnappliedTable([]);
      PaymentsPanelRender.updateUnappliedCount(0);
    }
  }

  global.PaymentsPanelHandlers = {
    setDefaultDate,
    handleReferenceUpdate,
    attachEvents,
    updateMode,
    openApplyModal,
    savePayment,
    clearForm
  };
})(typeof window !== "undefined" ? window : this);


/**
 * PaymentsPanel
 * Orquestador del modulo de pagos.
 */
var PaymentsPanel = (function () {
  function render() {
    if (typeof PaymentsPanelRender !== "undefined" && PaymentsPanelRender && typeof PaymentsPanelRender.render === "function") {
      PaymentsPanelRender.render();
    }
  }

  return { render: render };
})();


/**
 * Invoice Templates
 */
var InvoiceTemplates = (function () {
    function buildMainPanel(options) {
        return `
            <div class="d-flex flex-column gap-3">
            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-receipt me-2"></i>Facturación</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#invoice-history-collapse" aria-expanded="false" aria-controls="invoice-history-collapse">
                            <i class="bi bi-clock-history me-1"></i>Historial
                        </button>
                        <button class="btn btn-danger btn-sm" id="invoice-download-selected" disabled>
                            <i class="bi bi-file-earmark-pdf-fill me-1"></i>Descargar PDF
                        </button>
                        <button class="btn btn-primary btn-sm" id="invoice-new-btn">
                            <i class="bi bi-plus-circle me-1"></i>Nueva factura
                        </button>
                    </div>
                </div>
                <div id="invoice-history-collapse" class="collapse">
                <div class="card-body p-3">
                    <!-- Filtros búsqueda -->
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
                            <input list="invoice-client-list" id="invoice-filter-client" class="form-control form-control-sm" placeholder="Todos los clientes">
                            <datalist id="invoice-client-list"></datalist>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Periodo</label>
                            <input type="month" id="invoice-filter-period" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Estado</label>
                            <select id="invoice-filter-status" class="form-select form-select-sm"></select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Desde</label>
                            <input type="date" id="invoice-filter-from" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
                            <input type="date" id="invoice-filter-to" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary btn-sm w-100" id="invoice-search-btn" title="Buscar">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                    </div>

                    <div id="invoice-loading" class="text-center py-3 d-none"></div>

                    <div id="invoice-summary" class="row g-2 mb-3 d-none"></div>

                    <div id="invoice-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">
                                            <input type="checkbox" id="invoice-select-all">
                                        </th>
                                        <th class="py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Periodo</th>
                                        <th class="py-2 text-muted font-weight-normal">Número</th>
                                        <th class="py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="text-end py-2 text-muted font-weight-normal">Total</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Estado</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-tbody"></tbody>
                            </table>
                        </div>
                        <div id="invoice-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
                    </div>

                    <div id="invoice-empty" class="text-center text-muted py-4 d-none"></div>
                </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-plus-circle me-2"></i>Generar factura</h6>
                    <div class="small text-muted">Buscar registros de asistencia del cliente y completar datos pendientes.</div>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2 mb-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small text-muted fw-bold">Cliente a facturar</label>
                            <input list="invoice-gen-client-list" id="invoice-gen-client" class="form-control form-control-sm" placeholder="Seleccionar cliente">
                            <datalist id="invoice-gen-client-list"></datalist>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Desde</label>
                            <input type="date" id="invoice-gen-desde" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted fw-bold">Hasta</label>
                            <input type="date" id="invoice-gen-hasta" class="form-control form-control-sm">
                        </div>
                        <div class="col-md-2 d-grid">
                            <button class="btn btn-outline-secondary btn-sm" id="invoice-gen-search">
                                <i class="bi bi-search me-1"></i>Buscar
                            </button>
                        </div>
                    </div>
                    <div class="row g-2 align-items-center">
                        <div class="col-md-6 d-grid">
                            <button class="btn btn-primary btn-sm" id="invoice-gen-open-modal">
                                <i class="bi bi-check2-circle me-1"></i>Completar y guardar
                            </button>
                        </div>
                        <div class="col-md-6 d-grid">
                            <button class="btn btn-danger btn-sm" id="invoice-download-last-btn" disabled>
                                <i class="bi bi-file-earmark-pdf-fill me-1"></i>PDF
                            </button>
                        </div>
                    </div>

                    <div id="invoice-gen-loading" class="text-center py-3 d-none"></div>

                    <div id="invoice-gen-results" class="d-none mt-3">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                                        <th class="py-2 text-muted font-weight-normal">Empleado</th>
                                        <th class="py-2 text-muted font-weight-normal">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                                        <th class="text-center py-2 text-muted font-weight-normal">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-gen-tbody"></tbody>
                            </table>
                        </div>
                        <div id="invoice-gen-pagination" class="d-flex justify-content-between align-items-center py-2"></div>
                    </div>

                    <div id="invoice-gen-empty" class="text-center text-muted py-3 d-none"></div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-clipboard-check me-2"></i>Control de facturación</h6>
                    <div class="d-flex gap-2 align-items-center">
                        <input type="month" id="invoice-cov-period" class="form-control form-control-sm" style="max-width: 170px;">
                        <button class="btn btn-primary btn-sm" id="invoice-cov-search" title="Buscar">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div id="invoice-cov-loading" class="text-center py-3 d-none"></div>

                    <div id="invoice-cov-summary" class="row g-2 mb-2 d-none"></div>

                    <div id="invoice-cov-results" class="d-none">
                        <div class="table-responsive lt-table-wrap">
                            <table class="table table-hover table-sm align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Horas</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Días</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Facturado</th>
                                        <th class="py-2 text-muted font-weight-normal">Factura</th>
                                        <th class="py-2 text-muted font-weight-normal text-end">Total</th>
                                        <th class="py-2 text-muted font-weight-normal text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="invoice-cov-tbody"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="invoice-cov-empty" class="text-center text-muted py-3 d-none"></div>
                </div>
            </div>
            </div>

            <!-- Modal de factura -->
            <div class="modal fade" id="invoice-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoice-modal-title">Nueva Factura</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="invoice-form">
                                <input type="hidden" id="invoice-id">
                                <input type="hidden" id="invoice-id-cliente">
                                
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Fecha <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" id="invoice-fecha" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Periodo</label>
                                        <input type="month" class="form-control" id="invoice-periodo">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Estado</label>
                                        <select class="form-select" id="invoice-estado"></select>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Comprobante</label>
                                        <select class="form-select" id="invoice-comprobante"></select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Número</label>
                                        <input type="text" class="form-control" id="invoice-numero" placeholder="0001-00000001">
                                    </div>
                                    
                                    <div class="col-md-8">
                                        <label class="form-label">Razón Social <span class="text-danger">*</span></label>
                                        <input list="invoice-modal-client-list" class="form-control" id="invoice-razon-social" required>
                                        <datalist id="invoice-modal-client-list"></datalist>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">CUIT</label>
                                        <input type="text" class="form-control" id="invoice-cuit">
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Concepto</label>
                                        <textarea class="form-control" id="invoice-concepto" rows="2" placeholder="Descripción del servicio facturado"></textarea>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <label class="form-label">Horas</label>
                                        <input type="number" class="form-control" id="invoice-horas" step="0.5" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Valor Hora</label>
                                        <input type="number" class="form-control" id="invoice-valor-hora" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Importe</label>
                                        <input type="number" class="form-control" id="invoice-importe" step="0.01" min="0">
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <label class="form-label">Subtotal</label>
                                        <input type="number" class="form-control" id="invoice-subtotal" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Total <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" id="invoice-total" step="0.01" min="0" required>
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="form-label">Observaciones</label>
                                        <textarea class="form-control" id="invoice-observaciones" rows="2"></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="invoice-save-btn">
                                <i class="bi bi-save me-1"></i>Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de factura desde asistencia -->
            <div class="modal fade" id="invoice-att-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Factura desde asistencia</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Cliente <span class="text-danger">*</span></label>
                                <input list="invoice-client-list" id="invoice-att-cliente" class="form-control" placeholder="Seleccionar cliente">
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Desde</label>
                                    <input type="date" id="invoice-att-desde" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hasta</label>
                                    <input type="date" id="invoice-att-hasta" class="form-control">
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Comprobante</label>
                                    <select class="form-select" id="invoice-att-comp"></select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Número</label>
                                    <input type="text" id="invoice-att-numero" class="form-control" placeholder="0001-00000001">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea id="invoice-att-obs" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="alert alert-info small mb-0">
                                Se calcularán horas con asistencia y tarifa diaria del cliente en el rango indicado. Si dejás fechas vacías, usa el mes actual.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary btn-sm" id="invoice-att-save">Generar factura</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        buildMainPanel: buildMainPanel
    };
})();


/**
 * InvoicePanelState
 * Estado y helpers del panel de facturacion.
 */
(function (global) {
  const InvoicePanelState = {
    containerId: "invoice-main-panel",
    PAGE_SIZE: 10,
    lastInvoices: [],
    generatorInvoices: [],
    generatorHours: [],
    lastGeneratorFilters: null,
    clientIdMap: new Map(),
    selectedInvoiceIds: new Set(),
    lastSavedInvoiceId: null,
    ivaPct: 0.21,
    invoicePage: 1,
    generatorPage: 1,
    coverageRows: [],
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    escapeHtml: (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.escapeHtml === "function")
      ? HtmlHelpers.escapeHtml
      : function (val) {
        return String(val == null ? "" : val)
          .replace(/&/g, "&amp;")
          .replace(/[<]/g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? function (cli) {
        return DomainHelpers.getClientLabel(cli, { preferRazon: true });
      }
      : function (cli) {
        return (typeof HtmlHelpers !== "undefined" && HtmlHelpers && typeof HtmlHelpers.formatClientLabel === "function")
          ? HtmlHelpers.formatClientLabel(cli, { preferRazon: true })
          : (cli || "");
      }
  };

  global.InvoicePanelState = InvoicePanelState;
})(typeof window !== "undefined" ? window : this);


/**
 * InvoicePanelRender
 * Render del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }
  const Dom = state.Dom;

  function buildBadge_(label, options) {
    const ui = global.UIHelpers;
    const text = label == null ? "" : String(label);
    if (ui && typeof ui.badge === "function") {
      return ui.badge(text, options);
    }
    const className = options && options.className ? options.className : "badge bg-light text-dark border";
    if (Dom) {
      return Dom.el("span", { className: className, text: text });
    }
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function getInvoiceStatusOptions_() {
    const defaults = ["Pendiente", "Pagada", "Anulada", "Vencida"];
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      return DropdownConfig.getOptions("INVOICE_ESTADO", defaults);
    }
    return defaults;
  }

  function getInvoiceComprobanteOptions_() {
    const defaults = [
      "Factura A",
      "Factura B",
      "Factura C",
      "Nota de Crédito",
      "Nota de Débito",
      "Recibo"
    ];
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      return DropdownConfig.getOptions("INVOICE_COMPROBANTE", defaults);
    }
    return defaults;
  }

  function renderInitialStates_() {
    const empty = document.getElementById("invoice-empty");
    if (empty && global.EmptyState) {
      global.EmptyState.render(empty, {
        variant: "empty",
        title: "Sin facturas",
        message: "No hay facturas para mostrar. Usá los filtros o creá una nueva factura."
      });
    }
    if (empty) empty.classList.remove("d-none");

    const genEmpty = document.getElementById("invoice-gen-empty");
    if (genEmpty && global.EmptyState) {
      global.EmptyState.render(genEmpty, {
        variant: "empty",
        title: "Sin registros",
        message: "No hay registros de asistencia de este cliente en el rango indicado."
      });
    }
    if (genEmpty) genEmpty.classList.remove("d-none");

    const covEmpty = document.getElementById("invoice-cov-empty");
    if (covEmpty && global.EmptyState) {
      global.EmptyState.render(covEmpty, {
        variant: "empty",
        title: "Sin datos",
        message: "Elegí un período y buscá para ver quién quedó sin facturar."
      });
    }
    if (covEmpty) covEmpty.classList.remove("d-none");
  }

  function renderSelectOptions_() {
    const ui = global.UIHelpers;
    const renderSelect = (selectEl, options, selected, config) => {
      if (!selectEl) return;
      if (ui && typeof ui.renderSelect === "function") {
        ui.renderSelect(selectEl, options, selected, config);
        return;
      }
      const opts = Array.isArray(options) ? options.slice() : [];
      const sel = selected != null ? String(selected) : "";
      if (sel && opts.indexOf(sel) === -1 && (!config || config.ensureSelected !== false)) {
        opts.unshift(sel);
      }
      selectEl.innerHTML = "";
      if (config && config.includeEmpty) {
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = config.emptyLabel || "Seleccionar...";
        selectEl.appendChild(emptyOpt);
      }
      opts.forEach((optValue) => {
        if (optValue == null) return;
        const opt = document.createElement("option");
        opt.value = String(optValue);
        opt.textContent = String(optValue);
        if (sel && String(optValue) === sel) opt.selected = true;
        selectEl.appendChild(opt);
      });
    };

    const statusOptions = getInvoiceStatusOptions_();
    renderSelect(document.getElementById("invoice-filter-status"), statusOptions, "", {
      includeEmpty: true,
      emptyLabel: "Todos"
    });
    renderSelect(document.getElementById("invoice-estado"), statusOptions, "Pendiente");

    const comprobanteOptions = getInvoiceComprobanteOptions_();
    renderSelect(document.getElementById("invoice-comprobante"), comprobanteOptions, "Factura B");
    renderSelect(document.getElementById("invoice-att-comp"), comprobanteOptions, "Factura B");
  }

  function ensureSelectOption_(selectEl, value) {
    if (!selectEl || value == null || value === "") return;
    const val = String(value);
    const exists = Array.from(selectEl.options || []).some((opt) => opt.value === val);
    if (exists) return;
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
  }

  function initCoveragePeriod_() {
    const el = document.getElementById("invoice-cov-period");
    if (!el) return;
    if (!el.value) {
      const d = new Date();
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      el.value = `${yyyy}-${mm}`;
    }
  }

  function setCoverageLoading_(loading) {
    const loadingEl = document.getElementById("invoice-cov-loading");
    const resultsEl = document.getElementById("invoice-cov-results");
    const emptyEl = document.getElementById("invoice-cov-empty");
    const summaryEl = document.getElementById("invoice-cov-summary");
    if (loadingEl) {
      loadingEl.classList.toggle("d-none", !loading);
      if (loading && global.EmptyState) {
        global.EmptyState.render(loadingEl, { variant: "loading", message: "Calculando cobertura..." });
      }
    }
    if (resultsEl) resultsEl.classList.toggle("d-none", loading || !state.coverageRows || state.coverageRows.length === 0);
    if (emptyEl) emptyEl.classList.toggle("d-none", loading || (state.coverageRows && state.coverageRows.length > 0));
    if (summaryEl) summaryEl.classList.toggle("d-none", loading || !state.coverageRows || state.coverageRows.length === 0);
  }

  function renderCoverageSummary_(rows) {
    const el = document.getElementById("invoice-cov-summary");
    if (!el) return;
    if (!rows || rows.length === 0) {
      el.classList.add("d-none");
      return;
    }
    const totalClientes = rows.length;
    const pendientes = rows.filter((r) => !r.facturado).length;
    const horas = rows.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
    if (Dom) {
      Dom.clear(el);
      const cards = [
        { label: "Clientes", value: totalClientes, valueClass: "" },
        { label: "Pendientes", value: pendientes, valueClass: "text-danger" },
        { label: "Facturados", value: totalClientes - pendientes, valueClass: "text-success" },
        { label: "Horas", value: (Number(horas) || 0).toFixed(2).replace(/\.00$/, ""), valueClass: "" }
      ];
      cards.forEach((card) => {
        const col = Dom.el("div", { className: "col-md-3" }, [
          Dom.el("div", { className: "card border-0 bg-light" }, [
            Dom.el("div", { className: "card-body py-2" }, [
              Dom.el("div", { className: "text-muted small fw-bold", text: card.label }),
              Dom.el("div", { className: `fw-bold ${card.valueClass}`.trim(), text: card.value })
            ])
          ])
        ]);
        el.appendChild(col);
      });
    } else {
      el.innerHTML = `
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Clientes</div>
              <div class="fw-bold">${totalClientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Pendientes</div>
              <div class="fw-bold text-danger">${pendientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Facturados</div>
              <div class="fw-bold text-success">${totalClientes - pendientes}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 bg-light">
            <div class="card-body py-2">
              <div class="text-muted small fw-bold">Horas</div>
              <div class="fw-bold">${(Number(horas) || 0).toFixed(2).replace(/\.00$/, "")}</div>
            </div>
          </div>
        </div>
      `;
    }
    el.classList.remove("d-none");
  }

  function renderCoverageTable_(rows, period) {
    const tbody = document.getElementById("invoice-cov-tbody");
    const results = document.getElementById("invoice-cov-results");
    const empty = document.getElementById("invoice-cov-empty");
    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }
    if (!rows || rows.length === 0) {
      const progressEl = document.getElementById("invoice-gen-render-progress");
      if (progressEl) progressEl.remove();
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, { variant: "empty", title: "Sin datos", message: "No hay datos de cobertura para el período." });
      }
      return;
    }

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: r.cliente || "-" }));
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: String(r.horas || 0) }));
      tr.appendChild(Dom.el("td", { className: "text-end", text: String(r.dias || 0) }));

      const badgeTd = Dom.el("td", { className: "text-center" });
      const badge = buildBadge_(r.facturado ? "Sí" : "No", {
        className: r.facturado
          ? "badge bg-success-subtle text-success border"
          : "badge bg-danger-subtle text-danger border"
      });
      badgeTd.appendChild(badge);
      tr.appendChild(badgeTd);

      const facturaTd = Dom.el("td");
      if (r.facturado) {
        const label = r.facturaNumero || ("#" + (r.facturaId || ""));
        facturaTd.appendChild(buildBadge_(label, { className: "badge bg-light text-dark border" }));
      } else {
        facturaTd.appendChild(Dom.el("span", { className: "text-muted", text: "—" }));
      }
      tr.appendChild(facturaTd);

      const totalLabel = r.facturado ? Formatters.formatCurrency(r.facturaTotal || 0) : "—";
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: totalLabel }));

      const actionsTd = Dom.el("td", { className: "text-center" });
      if (r.facturado) {
        const editBtn = Dom.el("button", {
          className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
          title: "Abrir factura",
          onClick: () => {
            if (global.InvoicePanelHandlers) {
              global.InvoicePanelHandlers.editInvoice(r.facturaId);
            }
          }
        }, Dom.el("i", { className: "bi bi-pencil-fill" }));
        const pdfBtn = Dom.el("button", {
          className: "btn btn-sm btn-outline-danger lt-btn-icon",
          title: "PDF",
          onClick: () => {
            if (global.InvoicePanelHandlers) {
              global.InvoicePanelHandlers.downloadPdf(r.facturaId);
            }
          }
        }, Dom.el("i", { className: "bi bi-file-earmark-pdf-fill" }));
        actionsTd.appendChild(editBtn);
        actionsTd.appendChild(pdfBtn);
      } else {
        const generateBtn = Dom.el("button", {
          className: "btn btn-sm btn-primary invoice-cov-generate",
          dataset: {
            idCliente: String(r.idCliente || ""),
            cliente: String(r.cliente || ""),
            period: String(period || "")
          }
        }, [
          Dom.el("i", { className: "bi bi-lightning-charge-fill me-1" }),
          Dom.text("Generar")
        ]);
        actionsTd.appendChild(generateBtn);
      }
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });

    results.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function renderSummary() {
    const summaryDiv = document.getElementById("invoice-summary");
    if (!summaryDiv) return;
    summaryDiv.classList.add("d-none");
  }

  function renderGeneratorResults(rows) {
    const tbody = document.getElementById("invoice-gen-tbody");
    const results = document.getElementById("invoice-gen-results");
    const empty = document.getElementById("invoice-gen-empty");

    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }

    if (!rows || rows.length === 0) {
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, { variant: "empty", title: "Sin registros", message: "No hay registros de asistencia en el rango indicado." });
      }
      return;
    }

    const totalPages = Math.max(1, Math.ceil(rows.length / state.PAGE_SIZE));
    if (state.generatorPage > totalPages) state.generatorPage = totalPages;
    const start = (state.generatorPage - 1) * state.PAGE_SIZE;
    const pageItems = rows.slice(start, start + state.PAGE_SIZE);

    const ui = global.UIHelpers;
    const progressId = "invoice-gen-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      results.insertBefore(progressEl, results.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (item) => {
      const tr = document.createElement("tr");
      tr.appendChild(Dom.el("td", { className: "ps-3", text: item.fecha || "-" }));
      tr.appendChild(Dom.el("td", { text: item.empleado || "-" }));
      tr.appendChild(Dom.el("td", { text: String(item.horas != null ? item.horas : 0) }));
      tr.appendChild(Dom.el("td", { text: item.observaciones || "" }));

      const actionsTd = Dom.el("td", { className: "text-center" });
      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
        title: "Editar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.editAttendance(item.id);
          }
        }
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon",
        title: "Eliminar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.deleteAttendance(item.id);
          }
        }
      }, Dom.el("i", { className: "bi bi-trash" }));
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);
      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, pageItems, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} registros...`;
          }
        },
        onDone: finish
      });
    } else {
      pageItems.forEach((item) => {
        const tr = renderRow(item);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
    updateSelectionUi();
    renderGeneratorPagination(totalPages);
  }

  function renderTable(invoices) {
    const tbody = document.getElementById("invoice-tbody");
    const results = document.getElementById("invoice-results");
    const empty = document.getElementById("invoice-empty");

    if (!tbody || !results || !empty) return;

    if (Dom) {
      Dom.clear(tbody);
    } else {
      tbody.innerHTML = "";
    }

    if (!invoices || invoices.length === 0) {
      const progressEl = document.getElementById("invoice-render-progress");
      if (progressEl) progressEl.remove();
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (global.EmptyState) {
        global.EmptyState.render(empty, {
          variant: "empty",
          title: "Sin facturas",
          message: "No hay facturas para mostrar. Usá los filtros o creá una nueva factura."
        });
      }
      renderInvoicePagination(0);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(invoices.length / state.PAGE_SIZE));
    if (state.invoicePage > totalPages) state.invoicePage = totalPages;
    const start = (state.invoicePage - 1) * state.PAGE_SIZE;
    const pageItems = invoices.slice(start, start + state.PAGE_SIZE);

    const ui = global.UIHelpers;
    const progressId = "invoice-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      results.insertBefore(progressEl, results.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (inv) => {
      const periodLabel = (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.formatPeriodLabel === "function")
        ? DomainHelpers.formatPeriodLabel(inv["PERIODO"])
        : (inv["PERIODO"] || "");
      const tr = document.createElement("tr");
      const estado = inv["ESTADO"] || "Pendiente";
      const idStr = inv.ID != null ? String(inv.ID) : "";
      const fecha = inv["FECHA"] || "-";
      const periodo = periodLabel || "-";
      const numero = inv["NUMERO"] || "S/N";
      const razon = inv["RAZÓN SOCIAL"] || "-";
      const total = Formatters.formatCurrency(inv["TOTAL"]);

      const selectTd = Dom.el("td", { className: "ps-3" });
      const checkbox = Dom.el("input", {
        type: "checkbox",
        className: "invoice-select",
        dataset: { id: idStr }
      });
      checkbox.checked = state.selectedInvoiceIds.has(String(inv.ID));
      checkbox.addEventListener("change", () => {
        if (global.InvoicePanelHandlers) {
          global.InvoicePanelHandlers.toggleInvoiceSelection(idStr, checkbox.checked);
        }
      });
      selectTd.appendChild(checkbox);
      tr.appendChild(selectTd);

      tr.appendChild(Dom.el("td", { className: "ps-3", text: fecha }));
      tr.appendChild(Dom.el("td", { text: periodo }));

      const numeroBadge = buildBadge_(numero, { className: "badge bg-light text-dark border" });
      tr.appendChild(Dom.el("td", null, numeroBadge));

      tr.appendChild(Dom.el("td", { text: razon }));
      tr.appendChild(Dom.el("td", { className: "text-end fw-bold", text: total }));

      const estadoTd = Dom.el("td", { className: "text-center" });
      estadoTd.appendChild(buildEstadoBadge_(estado));
      tr.appendChild(estadoTd);

      const actionsTd = Dom.el("td", { className: "text-center" });
      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon me-1",
        title: "Editar",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.editInvoice(idStr);
          }
        }
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon",
        title: "Anular",
        onClick: () => {
          if (global.InvoicePanelHandlers) {
            global.InvoicePanelHandlers.deleteInvoice(idStr);
          }
        }
      }, Dom.el("i", { className: "bi bi-x-circle-fill" }));
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, pageItems, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} facturas...`;
          }
        },
        onDone: finish
      });
    } else {
      pageItems.forEach((inv) => {
        const tr = renderRow(inv);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
    renderInvoicePagination(totalPages);
  }

  function buildEstadoBadge_(estado) {
    const normalized = String(estado || "").trim();
    const map = {
      Pendiente: { className: "badge bg-warning", label: "Pendiente" },
      Pagada: { className: "badge bg-success", label: "Pagada" },
      Anulada: { className: "badge bg-danger", label: "Anulada" },
      Vencida: { className: "badge bg-dark", label: "Vencida" }
    };
    const entry = map[normalized] || { className: "badge bg-secondary", label: normalized || "Estado" };
    return buildBadge_(entry.label, { className: entry.className });
  }

  function renderInvoicePagination(totalPages) {
    const container = document.getElementById("invoice-pagination");
    if (!container) return;
    container.innerHTML = "";
    if (totalPages <= 1) return;

    const info = document.createElement("div");
    info.className = "small text-muted";
    info.textContent = `Página ${state.invoicePage} de ${totalPages}`;

    const controls = document.createElement("div");
    controls.className = "btn-group btn-group-sm";

    const prev = document.createElement("button");
    prev.className = "btn btn-outline-secondary";
    prev.textContent = "‹";
    prev.disabled = state.invoicePage <= 1;
    prev.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setInvoicePage(state.invoicePage - 1);
      }
    };

    const next = document.createElement("button");
    next.className = "btn btn-outline-secondary";
    next.textContent = "›";
    next.disabled = state.invoicePage >= totalPages;
    next.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setInvoicePage(state.invoicePage + 1);
      }
    };

    controls.appendChild(prev);
    controls.appendChild(next);

    container.appendChild(info);
    container.appendChild(controls);
  }

  function renderGeneratorPagination(totalPages) {
    const container = document.getElementById("invoice-gen-pagination");
    if (!container) return;
    container.innerHTML = "";
    if (totalPages <= 1) return;

    const info = document.createElement("div");
    info.className = "small text-muted";
    info.textContent = `Página ${state.generatorPage} de ${totalPages}`;

    const controls = document.createElement("div");
    controls.className = "btn-group btn-group-sm";

    const prev = document.createElement("button");
    prev.className = "btn btn-outline-secondary";
    prev.textContent = "‹";
    prev.disabled = state.generatorPage <= 1;
    prev.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setGeneratorPage(state.generatorPage - 1);
      }
    };

    const next = document.createElement("button");
    next.className = "btn btn-outline-secondary";
    next.textContent = "›";
    next.disabled = state.generatorPage >= totalPages;
    next.onclick = () => {
      if (global.InvoicePanelHandlers) {
        global.InvoicePanelHandlers.setGeneratorPage(state.generatorPage + 1);
      }
    };

    controls.appendChild(prev);
    controls.appendChild(next);

    container.appendChild(info);
    container.appendChild(controls);
  }

  function updateSelectionUi() {
    const dlLastBtn = document.getElementById("invoice-download-last-btn");
    if (dlLastBtn) {
      dlLastBtn.disabled = !state.lastSavedInvoiceId;
    }
    const dlSelected = document.getElementById("invoice-download-selected");
    if (dlSelected) {
      dlSelected.disabled = state.selectedInvoiceIds.size === 0;
    }
    const selectAll = document.getElementById("invoice-select-all");
    if (selectAll) {
      const checkboxes = document.querySelectorAll(".invoice-select");
      const total = checkboxes.length;
      const selected = state.selectedInvoiceIds.size;
      selectAll.checked = total > 0 && selected === total;
      selectAll.indeterminate = selected > 0 && selected < total;
    }
  }

  function toggleLoading(show) {
    const loading = document.getElementById("invoice-loading");
    const results = document.getElementById("invoice-results");
    const empty = document.getElementById("invoice-empty");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && global.EmptyState) {
        global.EmptyState.render(loading, { variant: "loading", message: "Cargando..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  function toggleGeneratorLoading(show) {
    const loading = document.getElementById("invoice-gen-loading");
    const results = document.getElementById("invoice-gen-results");
    const empty = document.getElementById("invoice-gen-empty");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && global.EmptyState) {
        global.EmptyState.render(loading, { variant: "loading", message: "Buscando asistencia del cliente..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function populateClientLists(clients) {
    const filterList = document.getElementById("invoice-client-list");
    const modalList = document.getElementById("invoice-modal-client-list");
    const generatorList = document.getElementById("invoice-gen-client-list");

    state.clientIdMap.clear();
    const ui = global.UIHelpers;
    const renderList = (list, labels) => {
      if (!list) return;
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(list, labels || []);
        return;
      }
      list.innerHTML = "";
      (labels || []).forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        list.appendChild(opt);
      });
    };

    const labels = (clients || [])
      .map((cli) => {
        const label = state.formatClientLabel(cli);
        if (label && cli && cli.id) {
          state.clientIdMap.set(label, cli.id);
        }
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));

    [filterList, modalList, generatorList].forEach((list) => {
      renderList(list, labels);
    });
  }

  function render() {
    const container = document.getElementById(state.containerId);
    if (!container) return;

    if (!InvoiceTemplates || typeof InvoiceTemplates.buildMainPanel !== "function") {
      console.error("InvoiceTemplates no disponible");
      return;
    }
    // safe static: layout fijo sin datos externos.
    container.innerHTML = InvoiceTemplates.buildMainPanel({});

    renderInitialStates_();
    renderSelectOptions_();

    if (global.InvoicePanelHandlers) {
      global.InvoicePanelHandlers.attachEvents();
    }
    if (global.InvoicePanelData) {
      global.InvoicePanelData.loadClients();
      global.InvoicePanelData.loadIvaConfig();
    }
    initCoveragePeriod_();
  }

  global.InvoicePanelRender = {
    render: render,
    ensureSelectOption: ensureSelectOption_,
    initCoveragePeriod: initCoveragePeriod_,
    setCoverageLoading: setCoverageLoading_,
    renderCoverageSummary: renderCoverageSummary_,
    renderCoverageTable: renderCoverageTable_,
    renderSummary: renderSummary,
    renderGeneratorResults: renderGeneratorResults,
    renderTable: renderTable,
    renderInvoicePagination: renderInvoicePagination,
    renderGeneratorPagination: renderGeneratorPagination,
    updateSelectionUi: updateSelectionUi,
    toggleLoading: toggleLoading,
    toggleGeneratorLoading: toggleGeneratorLoading,
    setText: setText,
    populateClientLists: populateClientLists
  };
})(typeof window !== "undefined" ? window : this);


/**
 * InvoicePanelData
 * Capa de datos del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }

  function loadClients() {
    if (typeof ReferenceService === "undefined" || !ReferenceService.load) return;

    if (!ReferenceService || typeof ReferenceService.ensureLoaded !== "function") {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return;
    }
    const loadPromise = ReferenceService.ensureLoaded();
    loadPromise
      .then(() => {
        const refs = ReferenceService.get();
        const clientes = refs && refs.clientes ? refs.clientes : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.populateClientLists(clientes);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes (referencias)", err, { silent: true });
        } else {
          console.error("Error cargando clientes (referencias):", err);
        }
        InvoiceService.getReferenceData()
          .then((refs) => {
            const clientes = refs && refs.clientes ? refs.clientes : [];
            if (global.InvoicePanelRender) {
              global.InvoicePanelRender.populateClientLists(clientes);
            }
          })
          .catch((fallbackErr) => {
            if (Alerts && Alerts.notifyError) {
              Alerts.notifyError("Error cargando clientes", fallbackErr);
            } else if (Alerts && Alerts.showError) {
              Alerts.showError("Error cargando clientes", fallbackErr);
            } else {
              console.error("Error cargando clientes:", fallbackErr);
            }
          });
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
      });
  }

  function getClientLabelById(idCliente) {
    const idStr = idCliente != null ? String(idCliente).trim() : "";
    if (!idStr) return "";

    for (const entry of state.clientIdMap.entries()) {
      const label = entry[0];
      const idVal = entry[1];
      if (String(idVal) === idStr) {
        return label;
      }
    }

    const refs = ReferenceService && ReferenceService.get ? ReferenceService.get() : null;
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => c && typeof c === "object" && String(c.id || "").trim() === idStr);
    return match ? state.formatClientLabel(match) : "";
  }

  function cleanClientValue(raw) {
    if (!raw) return "";
    const idx = raw.indexOf("(");
    return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
  }

  function extractClientIdFromLabel(label) {
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      return DomainHelpers.extractIdFromLabel(label);
    }
    const match = String(label || "").match(/ID\s*:\s*([^|)]+)/i);
    return match ? match[1].trim() : "";
  }

  function getClientIdFromLabel(label) {
    if (!label) return "";
    return state.clientIdMap.get(label) || extractClientIdFromLabel(label);
  }

  function getClientByLabel(label) {
    if (!label) return null;
    const refs = ReferenceService && ReferenceService.get ? ReferenceService.get() : null;
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => {
      const clientLabel = state.formatClientLabel(c);
      return clientLabel === label;
    });
    return match || null;
  }

  function parseIvaPctFromConfig(config) {
    if (!config) return 0.21;
    const raw = config["IVA_PORCENTAJE"] != null ? config["IVA_PORCENTAJE"] : config["IVA"];
    if (raw == null || raw === "") return 0.21;
    const cleaned = String(raw).replace("%", "").trim();
    const n = Number(cleaned);
    if (isNaN(n)) return 0.21;
    return n > 1 ? n / 100 : n;
  }

  function loadIvaConfig() {
    if (!ApiService || !ApiService.call) return;
    InvoiceService.getConfig()
      .then((cfg) => {
        state.ivaPct = parseIvaPctFromConfig(cfg);
        if (global.InvoicePanelHandlers) {
          global.InvoicePanelHandlers.recalculateTotals();
        }
      })
      .catch(() => {
        /* usar default */
      });
  }

  function handleCoverageSearch() {
    const period = document.getElementById("invoice-cov-period")?.value || "";
    if (!period) {
      Alerts && Alerts.showAlert("Elegí un período para controlar.", "warning");
      return;
    }
    if (!ApiService || !ApiService.call) return;
    state.coverageRows = [];
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.setCoverageLoading(true);
    }
    InvoiceService.getInvoicingCoverage(period, {})
      .then((res) => {
        state.coverageRows = res && res.rows ? res.rows : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderCoverageSummary(state.coverageRows);
          global.InvoicePanelRender.renderCoverageTable(state.coverageRows, period);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error en control de facturación", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error en control de facturación", err);
        } else {
          console.error("Error en control de facturación:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.setCoverageLoading(false);
        }
      });
  }

  function handleSearch(filters) {
    if (!filters) return;
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.toggleLoading(true);
    }

    state.selectedInvoiceIds.clear();
    InvoiceService.getInvoices(filters)
      .then((invoices) => {
        state.lastInvoices = invoices || [];
        state.invoicePage = 1;
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderSummary(state.lastInvoices);
          global.InvoicePanelRender.renderTable(state.lastInvoices);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error al cargar facturas", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error al cargar facturas", err);
        } else {
          console.error("Error al cargar facturas:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.toggleLoading(false);
        }
      });
  }

  function fetchGeneratorHours() {
    if (!state.lastGeneratorFilters || !state.lastGeneratorFilters.cliente) {
      if (global.InvoicePanelRender) {
        global.InvoicePanelRender.renderGeneratorResults([]);
      }
      return;
    }

    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.toggleGeneratorLoading(true);
    }
    InvoiceService.getHoursByClient(
      state.lastGeneratorFilters.fechaDesde,
      state.lastGeneratorFilters.fechaHasta,
      state.lastGeneratorFilters.cliente,
      state.lastGeneratorFilters.idCliente
    )
      .then((res) => {
        state.generatorHours = res && res.rows ? res.rows : [];
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.renderGeneratorResults(state.generatorHours);
        }
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error al cargar asistencia del cliente", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error al cargar asistencia del cliente", err);
        } else {
          console.error("Error al cargar asistencia del cliente:", err);
        }
      })
      .finally(() => {
        if (global.InvoicePanelRender) {
          global.InvoicePanelRender.toggleGeneratorLoading(false);
        }
      });
  }

  function refreshGeneratorList() {
    if (state.lastGeneratorFilters) {
      fetchGeneratorHours();
    }
  }

  function monthRangeFromPeriod(period) {
    const p = String(period || "").trim();
    if (!/^\d{4}-\d{2}$/.test(p)) return { start: "", end: "" };
    const y = Number(p.slice(0, 4));
    const m = Number(p.slice(5, 7));
    const endDate = new Date(y, m, 0);
    const dd = String(endDate.getDate()).padStart(2, "0");
    return { start: `${p}-01`, end: `${p}-${dd}` };
  }

  global.InvoicePanelData = {
    loadClients: loadClients,
    getClientLabelById: getClientLabelById,
    cleanClientValue: cleanClientValue,
    extractClientIdFromLabel: extractClientIdFromLabel,
    getClientIdFromLabel: getClientIdFromLabel,
    getClientByLabel: getClientByLabel,
    loadIvaConfig: loadIvaConfig,
    handleCoverageSearch: handleCoverageSearch,
    handleSearch: handleSearch,
    fetchGeneratorHours: fetchGeneratorHours,
    refreshGeneratorList: refreshGeneratorList,
    monthRangeFromPeriod: monthRangeFromPeriod
  };
})(typeof window !== "undefined" ? window : this);


/**
 * InvoicePanelHandlers
 * Eventos y acciones del panel de facturacion.
 */
(function (global) {
  const state = global.InvoicePanelState;
  if (!state) {
    console.error("InvoicePanelState no disponible");
    return;
  }

  function attachEvents() {
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler, opts) => {
      if (!el) return;
      el.addEventListener(evt, handler, Object.assign({ signal: signal }, opts || {}));
    };

    const newBtn = document.getElementById("invoice-new-btn");
    on(newBtn, "click", () => openModal());

    const genSearchBtn = document.getElementById("invoice-gen-search");
    on(genSearchBtn, "click", searchClientHours);
    const genOpenModalBtn = document.getElementById("invoice-gen-open-modal");
    on(genOpenModalBtn, "click", openModalFromGenerator);

    const searchBtn = document.getElementById("invoice-search-btn");
    on(searchBtn, "click", handleSearch);

    const saveBtn = document.getElementById("invoice-save-btn");
    on(saveBtn, "click", handleSave);

    const dlLastBtn = document.getElementById("invoice-download-last-btn");
    on(dlLastBtn, "click", () => {
      if (state.lastSavedInvoiceId) downloadPdf(state.lastSavedInvoiceId);
    });
    const dlSelectedBtn = document.getElementById("invoice-download-selected");
    on(dlSelectedBtn, "click", downloadSelectedPdfs);
    const selectAll = document.getElementById("invoice-select-all");
    on(selectAll, "change", (e) => toggleSelectAll(e.target.checked));

    const horasInput = document.getElementById("invoice-horas");
    const valorHoraInput = document.getElementById("invoice-valor-hora");
    on(horasInput, "input", recalculateTotals);
    on(valorHoraInput, "input", recalculateTotals);

    const razonSocialInput = document.getElementById("invoice-razon-social");
    if (razonSocialInput) {
      on(razonSocialInput, "change", autocompleteCUIT);
    }

    const cuitInput = document.getElementById("invoice-cuit");
    if (cuitInput) {
      cuitInput.inputMode = "numeric";
      if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.formatDocNumber === "function") {
        const applyMask = () => {
          cuitInput.value = InputUtils.formatDocNumber(cuitInput.value, "CUIT");
        };
        if (!cuitInput.dataset.maskDoc) {
          cuitInput.dataset.maskDoc = "1";
          on(cuitInput, "input", applyMask);
          on(cuitInput, "blur", applyMask);
        }
        applyMask();
      }
      if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.docPlaceholder === "function") {
        const ph = InputUtils.docPlaceholder("CUIT");
        if (ph) cuitInput.placeholder = ph;
      }
    }

    const covSearchBtn = document.getElementById("invoice-cov-search");
    on(covSearchBtn, "click", () => {
      if (global.InvoicePanelData) {
        global.InvoicePanelData.handleCoverageSearch();
      }
    });
    const covPeriod = document.getElementById("invoice-cov-period");
    on(covPeriod, "change", () => {
      if (state.coverageRows && state.coverageRows.length && global.InvoicePanelData) {
        global.InvoicePanelData.handleCoverageSearch();
      }
    });
    const covTbody = document.getElementById("invoice-cov-tbody");
    if (covTbody) {
      on(covTbody, "click", (e) => {
        const btn = e.target && e.target.closest ? e.target.closest(".invoice-cov-generate") : null;
        if (!btn) return;
        const idCliente = btn.dataset ? btn.dataset.idCliente || "" : "";
        const cliente = btn.dataset ? btn.dataset.cliente || "" : "";
        const period = btn.dataset ? btn.dataset.period || "" : "";
        generateCoverageInvoice(idCliente, cliente, period);
      });
    }
  }

  function getFilters() {
    const clientRaw = document.getElementById("invoice-filter-client")?.value || "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clientRaw) : "";
    return {
      cliente: clientRaw,
      idCliente: idCliente,
      periodo: document.getElementById("invoice-filter-period")?.value || "",
      estado: document.getElementById("invoice-filter-status")?.value || "",
      fechaDesde: document.getElementById("invoice-filter-from")?.value || "",
      fechaHasta: document.getElementById("invoice-filter-to")?.value || ""
    };
  }

  function handleSearch() {
    const filters = getFilters();
    if (filters.cliente && !filters.idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (global.InvoicePanelData) {
      global.InvoicePanelData.handleSearch(filters);
    }
  }

  function openModal(invoiceData) {
    const modal = new bootstrap.Modal(document.getElementById("invoice-modal"));
    const title = document.getElementById("invoice-modal-title");
    const form = document.getElementById("invoice-form");

    if (title) title.textContent = invoiceData ? "Editar Factura" : "Nueva Factura";
    if (form) form.reset();

    if (invoiceData) {
      document.getElementById("invoice-id").value = invoiceData.ID || "";
      const idCliente = invoiceData["ID_CLIENTE"] || "";
      const clienteLabel = global.InvoicePanelData ? global.InvoicePanelData.getClientLabelById(idCliente) : "";
      document.getElementById("invoice-id-cliente").value = idCliente;
      document.getElementById("invoice-fecha").value = invoiceData["FECHA"] || "";
      document.getElementById("invoice-periodo").value = invoiceData["PERIODO"] || "";
      const compSelect = document.getElementById("invoice-comprobante");
      if (compSelect && global.InvoicePanelRender) {
        global.InvoicePanelRender.ensureSelectOption(compSelect, invoiceData["COMPROBANTE"]);
        compSelect.value = invoiceData["COMPROBANTE"] || "Factura B";
      }
      document.getElementById("invoice-numero").value = invoiceData["NUMERO"] || "";
      document.getElementById("invoice-razon-social").value = clienteLabel || invoiceData["RAZÓN SOCIAL"] || "";
      document.getElementById("invoice-cuit").value = invoiceData["CUIT"] || "";
      document.getElementById("invoice-concepto").value = invoiceData["CONCEPTO"] || "";
      document.getElementById("invoice-horas").value = invoiceData["HORAS"] || "";
      document.getElementById("invoice-valor-hora").value = invoiceData["VALOR HORA"] || "";
      document.getElementById("invoice-importe").value = invoiceData["IMPORTE"] || "";
      document.getElementById("invoice-subtotal").value = invoiceData["SUBTOTAL"] || "";
      document.getElementById("invoice-total").value = invoiceData["TOTAL"] || "";
      const estadoSelect = document.getElementById("invoice-estado");
      if (estadoSelect && global.InvoicePanelRender) {
        global.InvoicePanelRender.ensureSelectOption(estadoSelect, invoiceData["ESTADO"]);
        estadoSelect.value = invoiceData["ESTADO"] || "Pendiente";
      }
      document.getElementById("invoice-observaciones").value = invoiceData["OBSERVACIONES"] || "";
    } else {
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("invoice-fecha").value = today;
      const estadoSelect = document.getElementById("invoice-estado");
      if (estadoSelect) estadoSelect.value = "Pendiente";
    }

    autocompleteCUIT();
    if (!invoiceData || !invoiceData.ID) {
      recalculateTotals();
    }
    modal.show();
  }

  function recalculateTotals() {
    const horasInput = document.getElementById("invoice-horas");
    const valorHoraInput = document.getElementById("invoice-valor-hora");
    const importeInput = document.getElementById("invoice-importe");
    const subtotalInput = document.getElementById("invoice-subtotal");
    const totalInput = document.getElementById("invoice-total");
    if (!horasInput || !valorHoraInput) return;

    const horas = Number(horasInput.value) || 0;
    const valorHora = Number(valorHoraInput.value) || 0;
    const subtotal = horas * valorHora;
    const subtotalFixed = (isNaN(subtotal) ? 0 : subtotal).toFixed(2);
    const totalFixed = (subtotal * (1 + state.ivaPct)).toFixed(2);

    if (importeInput) importeInput.value = subtotalFixed;
    if (subtotalInput) subtotalInput.value = subtotalFixed;
    if (totalInput) totalInput.value = totalFixed;
  }

  function handleSave() {
    const form = document.getElementById("invoice-form");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById("invoice-id").value;
    const idCliente = document.getElementById("invoice-id-cliente").value;
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const razonRaw = document.getElementById("invoice-razon-social").value;
    const razonSocial = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(razonRaw) || razonRaw : razonRaw;

    const data = {
      ID_CLIENTE: idCliente || "",
      FECHA: document.getElementById("invoice-fecha").value,
      PERIODO: document.getElementById("invoice-periodo").value,
      COMPROBANTE: document.getElementById("invoice-comprobante").value,
      NUMERO: document.getElementById("invoice-numero").value,
      "RAZÓN SOCIAL": razonSocial,
      CUIT: document.getElementById("invoice-cuit").value,
      CONCEPTO: document.getElementById("invoice-concepto").value,
      HORAS: document.getElementById("invoice-horas").value,
      "VALOR HORA": document.getElementById("invoice-valor-hora").value,
      IMPORTE: document.getElementById("invoice-importe").value,
      SUBTOTAL: document.getElementById("invoice-subtotal").value,
      TOTAL: document.getElementById("invoice-total").value,
      ESTADO: document.getElementById("invoice-estado").value,
      OBSERVACIONES: document.getElementById("invoice-observaciones").value
    };

    const saveBtn = document.getElementById("invoice-save-btn");
    const ui = global.UIHelpers;
    if (saveBtn) {
      if (ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(saveBtn, true, "Guardando...");
      } else {
        saveBtn.disabled = true;
      }
    }

    const request = id
      ? InvoiceService.updateInvoice(id, data)
      : InvoiceService.createInvoice(data);

    request
      .then((res) => {
        const newId = res && (res.id || res);
        const isUpdate = !!id;

        bootstrap.Modal.getInstance(document.getElementById("invoice-modal")).hide();
        state.invoicePage = 1;

        if (global.InvoicePanelData) {
          global.InvoicePanelData.refreshGeneratorList();
        }

        if (newId) {
          state.lastSavedInvoiceId = String(newId);
          if (global.InvoicePanelRender) {
            global.InvoicePanelRender.updateSelectionUi();
          }
        }

        // Si es creación, ofrecer descarga
        if (!isUpdate && newId) {
          const confirmMsg = `Factura guardada correctamente.\n\n¿Querés descargar el PDF ahora?`;
          const confirmDownload = (window.UiDialogs && typeof window.UiDialogs.confirm === "function")
            ? window.UiDialogs.confirm({
              title: "Factura Guardada",
              message: confirmMsg,
              confirmText: "Descargar",
              cancelText: "Cerrar",
              confirmVariant: "success",
              icon: "bi-check-circle-fill",
              iconClass: "text-success"
            })
            : Promise.resolve(confirm(confirmMsg));

          confirmDownload.then((confirmed) => {
            if (confirmed) {
              downloadPdf(String(newId));
            }
          });
        } else {
          Alerts && Alerts.showAlert("Factura actualizada exitosamente", "success");
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al guardar factura", err);
        } else {
          console.error("Error al guardar factura:", err);
          Alerts && Alerts.showAlert("Error al guardar factura", "danger");
        }
      })
      .finally(() => {
        if (saveBtn && ui && typeof ui.withSpinner === "function") {
          ui.withSpinner(saveBtn, false);
        } else if (saveBtn) {
          saveBtn.disabled = false;
        }
      });
  }

  function autocompleteCUIT() {
    const razonSocialInput = document.getElementById("invoice-razon-social");
    const cuitInput = document.getElementById("invoice-cuit");
    const idClienteInput = document.getElementById("invoice-id-cliente");

    if (!razonSocialInput || !cuitInput) return;

    const selectedClient = razonSocialInput.value;
    const cliente = global.InvoicePanelData && typeof global.InvoicePanelData.getClientByLabel === "function"
      ? global.InvoicePanelData.getClientByLabel(selectedClient)
      : null;

    if (cliente) {
      const docType = (cliente.docType || cliente["TIPO DOCUMENTO"] || "").toString().trim().toUpperCase();
      const docNumber = cliente.docNumber || cliente["NUMERO DOCUMENTO"] || cliente.cuit || "";
      const shouldFill = docType === "CUIT" || docType === "CUIL" || !!cliente.cuit;
      if (shouldFill && docNumber) {
        if (typeof InputUtils !== "undefined" && InputUtils && typeof InputUtils.formatDocNumber === "function") {
          cuitInput.value = InputUtils.formatDocNumber(docNumber, docType || "CUIT");
        } else {
          cuitInput.value = docNumber;
        }
      } else {
        cuitInput.value = "";
      }
      if (cliente.id && idClienteInput) {
        idClienteInput.value = cliente.id;
      }
    }
  }

  function searchClientHours() {
    const clientInput = document.getElementById("invoice-gen-client");
    const clienteRaw = clientInput ? clientInput.value.trim() : "";
    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente para buscar.", "warning");
      return;
    }
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";

    state.lastGeneratorFilters = {
      cliente: clienteRaw,
      clienteLabel: clienteRaw,
      idCliente: idCliente,
      fechaDesde: desde,
      fechaHasta: hasta
    };
    if (global.InvoicePanelData) {
      global.InvoicePanelData.fetchGeneratorHours();
    }
  }

  function openModalFromGenerator() {
    const clientInput = document.getElementById("invoice-gen-client");
    const cliente = clientInput ? clientInput.value.trim() : "";
    if (!cliente) {
      Alerts && Alerts.showAlert("Elegí un cliente para facturar.", "warning");
      return;
    }
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(cliente) : "";
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";

    const preset = buildPresetFromHours(cliente, desde, hasta);
    openModal(preset);
  }

  function buildPresetFromHours(clienteRaw, desde, hasta) {
    const cliente = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(clienteRaw) : clienteRaw;
    const preset = {
      "RAZÓN SOCIAL": cliente || clienteRaw,
      FECHA: new Date().toISOString().slice(0, 10),
      OBSERVACIONES: (desde || hasta) ? `Período: ${desde || "s/d"} a ${hasta || "s/h"}` : ""
    };

    if (state.generatorHours && state.generatorHours.length > 0) {
      const totalHoras = state.generatorHours.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
      preset.HORAS = totalHoras || "";
      preset.CONCEPTO = `Servicios ${cliente} (${desde || ""} a ${hasta || ""})`;
      const idCli = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
      if (idCli) {
        preset.ID_CLIENTE = idCli;
      }
    }
    if (desde) {
      preset.PERIODO = desde.slice(0, 7);
    }
    return preset;
  }

  function prefillFromHours(fecha, empleado, horas) {
    const clienteRaw = document.getElementById("invoice-gen-client")?.value || "";
    const cliente = global.InvoicePanelData ? global.InvoicePanelData.cleanClientValue(clienteRaw) : clienteRaw;
    const desde = document.getElementById("invoice-gen-desde")?.value || "";
    const hasta = document.getElementById("invoice-gen-hasta")?.value || "";
    const preset = buildPresetFromHours(clienteRaw || cliente, desde, hasta);
    preset.FECHA = fecha || preset.FECHA;
    preset.CONCEPTO = `Servicios ${cliente} - ${empleado || ""} ${fecha || ""}`;
    if (horas) preset.HORAS = horas;
    openModal(preset);
  }

  function openFromAttendanceModal() {
    const modalEl = document.getElementById("invoice-att-modal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);

    const hoy = new Date();
    const first = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
    const desde = document.getElementById("invoice-att-desde");
    const hasta = document.getElementById("invoice-att-hasta");
    if (desde && !desde.value) desde.value = first;
    if (hasta && !hasta.value) hasta.value = last;

    modal.show();

    const saveBtn = document.getElementById("invoice-att-save");
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener("click", handleFromAttendanceSave);
    }
  }

  function handleFromAttendanceSave() {
    const clienteInput = document.getElementById("invoice-att-cliente");
    const desdeInput = document.getElementById("invoice-att-desde");
    const hastaInput = document.getElementById("invoice-att-hasta");
    const compInput = document.getElementById("invoice-att-comp");
    const numInput = document.getElementById("invoice-att-numero");
    const obsInput = document.getElementById("invoice-att-obs");

    const clienteRaw = clienteInput ? clienteInput.value.trim() : "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : "";
    const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : "";

    UiState && UiState.setGlobalLoading(true, "Generando factura desde asistencia...");
    InvoiceService.createInvoiceFromAttendance(clienteRaw, fechaDesde, fechaHasta, {
      comprobante: compInput ? compInput.value : "",
      numero: numInput ? numInput.value : "",
      observaciones: obsInput ? obsInput.value : ""
    }, idCliente)
      .then(() => {
        Alerts && Alerts.showAlert("Factura generada desde asistencia.", "success");
        const modalEl = document.getElementById("invoice-att-modal");
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        handleSearch();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar factura", err);
        } else {
          Alerts && Alerts.showAlert("Error al generar factura", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
      });
  }

  function generateFromGenerator() {
    const clientInput = document.getElementById("invoice-gen-client");
    const desdeInput = document.getElementById("invoice-gen-desde");
    const hastaInput = document.getElementById("invoice-gen-hasta");

    const clienteRaw = clientInput ? clientInput.value.trim() : "";
    const idCliente = global.InvoicePanelData ? global.InvoicePanelData.getClientIdFromLabel(clienteRaw) : "";
    const fechaDesde = desdeInput && desdeInput.value ? desdeInput.value : "";
    const fechaHasta = hastaInput && hastaInput.value ? hastaInput.value : "";

    if (!clienteRaw) {
      Alerts && Alerts.showAlert("Elegí un cliente antes de generar.", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!fechaDesde || !fechaHasta) {
      Alerts && Alerts.showAlert("Indicá fechas Desde y Hasta para generar la factura.", "warning");
      return;
    }

    UiState && UiState.setGlobalLoading(true, "Generando factura con filtros...");
    InvoiceService.createInvoiceFromAttendance(clienteRaw, fechaDesde, fechaHasta, {}, idCliente)
      .then(() => {
        Alerts && Alerts.showAlert("Factura generada.", "success");
        handleSearch();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar factura", err);
        } else {
          Alerts && Alerts.showAlert("Error al generar factura", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function editInvoice(id) {
    InvoiceService.getInvoiceById(id)
      .then((invoice) => {
        if (invoice) {
          openModal(invoice);
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar factura", err);
        } else {
          console.error("Error al cargar factura:", err);
          Alerts && Alerts.showAlert("Error al cargar factura", "danger");
        }
      });
  }

  function deleteInvoice(id, skipRefreshMain) {
    const confirmPromise =
      typeof window !== "undefined" &&
        window.UiDialogs &&
        typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
          title: "Anular factura",
          message: "¿Estás seguro de que querés anular esta factura?",
          confirmText: "Anular",
          cancelText: "Cancelar",
          confirmVariant: "danger",
          icon: "bi-x-octagon-fill",
          iconClass: "text-danger"
        })
        : Promise.resolve(confirm("¿Estás seguro de que querés anular esta factura?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      InvoiceService.deleteInvoice(id)
        .then(() => {
          Alerts && Alerts.showAlert("Factura anulada exitosamente", "success");
          if (!skipRefreshMain) {
            handleSearch();
          }
          if (global.InvoicePanelData) {
            global.InvoicePanelData.refreshGeneratorList();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al anular factura", err);
          } else {
            console.error("Error al anular factura:", err);
            Alerts && Alerts.showAlert("Error al anular factura", "danger");
          }
        });
    });
  }

  function generateCoverageInvoice(idCliente, cliente, period) {
    const p = String(period || "").trim();
    const range = global.InvoicePanelData ? global.InvoicePanelData.monthRangeFromPeriod(p) : { start: "", end: "" };
    if (!range.start || !range.end) {
      Alerts && Alerts.showAlert("Período inválido para generar.", "warning");
      return;
    }
    const cli = String(cliente || "").trim();
    const id = String(idCliente || "").trim();

    const Dom = global.DomHelpers;

    (window.UiDialogs && typeof window.UiDialogs.prompt === "function")
      ? window.UiDialogs.prompt({
        title: "Número de Factura",
        message: `Ingresá el número para la factura de ${cli}:`,
        placeholder: "0000-00000000",
        onAction: async (numFactura) => {
          if (!numFactura) throw new Error("Debes ingresar un número de factura.");

          UiState && UiState.setGlobalLoading(true, "Generando factura y preparando PDF...");
          try {
            const res = await InvoiceService.createInvoiceFromAttendance(
              cli || { cliente: cli, idCliente: id },
              range.start,
              range.end,
              {
                numero: numFactura,
                observaciones: `Período: ${range.start} a ${range.end}`
              },
              id || ""
            );

            const newId = res && (res.id || (res.record && res.record.ID));
            if (!newId) throw new Error("No se pudo obtener el ID de la factura.");

            state.lastSavedInvoiceId = String(newId);
            if (global.InvoicePanelData) {
              global.InvoicePanelData.handleCoverageSearch();
            }

            return {
              success: true,
              render: (container) => {
                container.appendChild(Dom.el("div", { className: "text-center py-2" }, [
                  Dom.el("div", { className: "text-success mb-2" }, [
                    Dom.el("i", { className: "bi bi-check-circle-fill fs-2" })
                  ]),
                  Dom.el("div", { className: "fw-bold mb-3", text: "¡Factura generada!" }),
                  Dom.el("button", {
                    className: "btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2",
                    onClick: () => downloadPdf(String(newId))
                  }, [
                    Dom.el("i", { className: "bi bi-file-earmark-pdf-fill" }),
                    Dom.text("Descargar PDF")
                  ])
                ]));
              }
            };
          } catch (err) {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error generando factura", err);
            } else {
              console.error("Error generando factura (cobertura):", err);
              Alerts && Alerts.showAlert("Error generando factura", "danger");
            }
            throw err; // Re-throw to indicate failure to the dialog
          } finally {
            UiState && UiState.setGlobalLoading(false);
          }
        }
      })
      : Promise.resolve(null);
  }

  function editAttendance(id) {
    const row = state.generatorHours.find((r) => String(r.id) === String(id));
    if (!row) {
      Alerts && Alerts.showAlert("Registro no encontrado.", "warning");
      return;
    }
    const newHoras = prompt("Horas trabajadas", row.horas || "");
    if (newHoras === null) return;
    const newObs = prompt("Observaciones", row.observaciones || "");
    const payload = {
      HORAS: Number(newHoras) || 0,
      OBSERVACIONES: newObs || "",
      ASISTENCIA: true,
      CLIENTE: row.cliente || "",
      ID_CLIENTE: row.idCliente || "",
      EMPLEADO: row.empleado || "",
      FECHA: row.fecha
    };
    UiState && UiState.setGlobalLoading(true, "Guardando asistencia...");
    AttendanceService.updateAttendanceRecord(id, payload)
      .then(() => {
        Alerts && Alerts.showAlert("Registro actualizado.", "success");
        if (global.InvoicePanelData) {
          global.InvoicePanelData.refreshGeneratorList();
        }
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al actualizar", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al actualizar", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function deleteAttendance(id) {
    const confirmPromise =
      typeof window !== "undefined" &&
        window.UiDialogs &&
        typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
          title: "Eliminar asistencia",
          message: "¿Eliminar este registro de asistencia?",
          confirmText: "Eliminar",
          cancelText: "Cancelar",
          confirmVariant: "danger",
          icon: "bi-trash3-fill",
          iconClass: "text-danger"
        })
        : Promise.resolve(confirm("¿Eliminar este registro de asistencia?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      UiState && UiState.setGlobalLoading(true, "Eliminando asistencia...");
      AttendanceService.deleteAttendanceRecord(id)
        .then(() => {
          Alerts && Alerts.showAlert("Registro eliminado.", "success");
          if (global.InvoicePanelData) {
            global.InvoicePanelData.refreshGeneratorList();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al eliminar", err);
          } else {
            console.error(err);
            Alerts && Alerts.showAlert("Error al eliminar", "danger");
          }
        })
        .finally(() => UiState && UiState.setGlobalLoading(false));
    });
  }

  function downloadPdf(id) {
    if (!id) return;
    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    InvoiceService.generateInvoicePdf(id)
      .then((res) => {
        if (!res || !res.base64) {
          Alerts && Alerts.showAlert("No se pudo generar el PDF.", "warning");
          return;
        }
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "factura.pdf";
        link.click();
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al generar PDF", err);
        } else {
          console.error("Error al generar PDF:", err);
          Alerts && Alerts.showAlert("Error al generar PDF", "danger");
        }
      })
      .finally(() => UiState && UiState.setGlobalLoading(false));
  }

  function setInvoicePage(page) {
    state.invoicePage = Math.max(1, page);
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.renderTable(state.lastInvoices);
    }
  }

  function setGeneratorPage(page) {
    state.generatorPage = Math.max(1, page);
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.renderGeneratorResults(state.generatorHours);
    }
  }

  function toggleInvoiceSelection(id, checked) {
    const key = String(id);
    if (checked) {
      state.selectedInvoiceIds.add(key);
    } else {
      state.selectedInvoiceIds.delete(key);
    }
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.updateSelectionUi();
    }
  }

  function toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll(".invoice-select");
    checkboxes.forEach((cb) => {
      cb.checked = checked;
      const id = cb.getAttribute("data-id");
      if (checked) {
        state.selectedInvoiceIds.add(String(id));
      } else {
        state.selectedInvoiceIds.delete(String(id));
      }
    });
    if (global.InvoicePanelRender) {
      global.InvoicePanelRender.updateSelectionUi();
    }
  }

  function downloadSelectedPdfs() {
    if (state.selectedInvoiceIds.size === 0) return;
    const ids = Array.from(state.selectedInvoiceIds);
    const btn = document.getElementById("invoice-download-selected");
    const ui = global.UIHelpers;
    if (btn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(btn, true, "Descargando...");
    }
    const task = (async () => {
      for (const id of ids) {
        try {
          const res = await InvoiceService.generateInvoicePdf(id);
          if (!res || !res.base64) continue;
          const link = document.createElement("a");
          link.href = "data:application/pdf;base64," + res.base64;
          link.download = res.filename || `factura_${id}.pdf`;
          link.click();
        } catch (err) {
          console.error("PDF error", err);
        }
      }
    })();
    task.finally(() => {
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, false);
      }
      if (global.InvoicePanelRender && typeof global.InvoicePanelRender.updateSelectionUi === "function") {
        global.InvoicePanelRender.updateSelectionUi();
      }
    });
  }

  global.InvoicePanelHandlers = {
    attachEvents: attachEvents,
    getFilters: getFilters,
    handleSearch: handleSearch,
    openModal: openModal,
    recalculateTotals: recalculateTotals,
    handleSave: handleSave,
    autocompleteCUIT: autocompleteCUIT,
    searchClientHours: searchClientHours,
    openModalFromGenerator: openModalFromGenerator,
    buildPresetFromHours: buildPresetFromHours,
    prefillFromHours: prefillFromHours,
    openFromAttendanceModal: openFromAttendanceModal,
    handleFromAttendanceSave: handleFromAttendanceSave,
    generateFromGenerator: generateFromGenerator,
    editInvoice: editInvoice,
    deleteInvoice: deleteInvoice,
    generateCoverageInvoice: generateCoverageInvoice,
    editAttendance: editAttendance,
    deleteAttendance: deleteAttendance,
    downloadPdf: downloadPdf,
    setInvoicePage: setInvoicePage,
    setGeneratorPage: setGeneratorPage,
    toggleInvoiceSelection: toggleInvoiceSelection,
    toggleSelectAll: toggleSelectAll,
    downloadSelectedPdfs: downloadSelectedPdfs
  };
})(typeof window !== "undefined" ? window : this);


/**
 * InvoicePanel
 * Orquestador del modulo de facturacion.
 */
var InvoicePanel = (function () {
  function ensureDeps() {
    if (!InvoicePanelState || !InvoicePanelRender || !InvoicePanelHandlers || !InvoicePanelData) {
      console.error("InvoicePanel dependencies no disponibles");
      return false;
    }
    return true;
  }

  function render() {
    if (!ensureDeps()) return;
    InvoicePanelRender.render();
  }

  return {
    render: render,
    editInvoice: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.editInvoice(id);
    },
    deleteInvoice: function (id, skipRefreshMain) {
      if (ensureDeps()) InvoicePanelHandlers.deleteInvoice(id, skipRefreshMain);
    },
    openModal: function (data) {
      if (ensureDeps()) InvoicePanelHandlers.openModal(data);
    },
    downloadPdf: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.downloadPdf(id);
    },
    prefillFromHours: function (fecha, empleado, horas) {
      if (ensureDeps()) InvoicePanelHandlers.prefillFromHours(fecha, empleado, horas);
    },
    editAttendance: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.editAttendance(id);
    },
    deleteAttendance: function (id) {
      if (ensureDeps()) InvoicePanelHandlers.deleteAttendance(id);
    },
    setInvoicePage: function (page) {
      if (ensureDeps()) InvoicePanelHandlers.setInvoicePage(page);
    },
    setGeneratorPage: function (page) {
      if (ensureDeps()) InvoicePanelHandlers.setGeneratorPage(page);
    },
    toggleInvoiceSelection: function (id, checked) {
      if (ensureDeps()) InvoicePanelHandlers.toggleInvoiceSelection(id, checked);
    },
    toggleSelectAll: function (checked) {
      if (ensureDeps()) InvoicePanelHandlers.toggleSelectAll(checked);
    },
    generateCoverageInvoice: function (idCliente, cliente, period) {
      if (ensureDeps()) InvoicePanelHandlers.generateCoverageInvoice(idCliente, cliente, period);
    }
  };
})();


/**
 * HoursDetailPanelState
 * Estado y helpers del panel de detalle de horas.
 */
(function (global) {
  const state = {
    containerId: "hours-detail-panel",
    employeeIdMap: new Map(),
    eventsController: null,
    lastResults: [],
    lastSummary: null,
    lastFilters: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatEmployeeLabel: function (emp) {
      if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getEmployeeLabel === "function") {
        return DomainHelpers.getEmployeeLabel(emp);
      }
      if (!emp) return "";
      if (typeof emp === "string") return emp;
      return (emp.nombre || emp.displayName || emp.empleado || emp.label || "").toString().trim();
    }
  };

  state.setEmployeeMap = function (employees) {
    const list = Array.isArray(employees) ? employees.slice() : [];
    state.employeeIdMap = new Map();
    const labels = list
      .map((emp) => {
        if (!emp || typeof emp !== "object") return "";
        const id = emp.id || emp.ID || emp.ID_EMPLEADO;
        const idStr = id != null ? String(id).trim() : "";
        if (!idStr) return "";
        let label = state.formatEmployeeLabel(emp);
        label = label != null ? String(label).trim() : "";
        if (!label) label = `#${idStr}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (#${idStr})`;
          }
        }
        state.employeeIdMap.set(label, idStr);
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
    return labels;
  };

  state.getEmployeeIdFromLabel = function (label) {
    if (!label) return "";
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;
    return "";
  };

  global.HoursDetailPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * HoursDetailPanelData
 * Capa de datos del panel de detalle de horas.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadEmployees() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.empleados ? refs.empleados : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando empleados", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando empleados", err);
        } else {
          console.error("Error cargando empleados:", err);
        }
        return [];
      });
  }

  function normalizeHoursResponse(results) {
    const parsed = (typeof results === "string")
      ? (function () {
          try {
            return JSON.parse(results);
          } catch (e) {
            console.warn("No se pudo parsear resultados", e);
            return {};
          }
        })()
      : (results || {});

    const rows = parsed && parsed.rows ? parsed.rows : (Array.isArray(parsed) ? parsed : []);
    const summary = parsed && parsed.summary ? parsed.summary : null;
    return { rows: rows || [], summary: summary };
  }

  function fetchHoursByEmployee(start, end, employeeLabel, idEmpleado) {
    if (!ensureApi()) return Promise.resolve({ rows: [], summary: null });
    return global.ApiService.call("getHoursByEmployee", start, end, employeeLabel, idEmpleado)
      .then(normalizeHoursResponse);
  }

  function generatePdf(start, end, employeeLabel, idEmpleado) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("generateHoursPdf", start, end, employeeLabel, idEmpleado);
  }

  function deleteRecord(id) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteRecord", ["ASISTENCIA", id]);
  }

  function updateRecord(id, payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("updateRecord", "ASISTENCIA", id, payload);
  }

  global.HoursDetailPanelData = {
    loadEmployees: loadEmployees,
    fetchHoursByEmployee: fetchHoursByEmployee,
    generatePdf: generatePdf,
    deleteRecord: deleteRecord,
    updateRecord: updateRecord,
    normalizeHoursResponse: normalizeHoursResponse
  };
})(typeof window !== "undefined" ? window : this);


/**
 * HoursDetailPanelRender
 * Render del panel de detalle de horas.
 */
(function (global) {
  const state = global.HoursDetailPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2">
          <h6 class="mb-0 text-primary fw-bold">
            <i class="bi bi-clock-history me-2"></i>Seguimiento de Horas por Empleado
          </h6>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Empleado</label>
              <input list="hours-employee-list" id="hours-filter-employee" class="form-control form-control-sm" placeholder="Buscar empleado...">
              <datalist id="hours-employee-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="hours-filter-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="hours-filter-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button id="btn-search-hours" class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <i class="bi bi-search"></i> Buscar
              </button>
              <button id="btn-export-pdf" class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
            </div>
          </div>

          <div id="hours-loading" class="text-center py-3 d-none"></div>

          <div id="hours-summary" class="row g-2 mb-3 d-none">
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-total">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor hora</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-rate">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Adelantos</div>
                  <div class="fs-6 fw-bold text-danger" id="hours-summary-advances">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Viáticos</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-viaticos">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light">
                <div class="card-body py-2 px-2 text-center">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Presentismo</div>
                  <div class="fs-6 fw-bold text-dark" id="hours-summary-presentismo">$0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="lt-metric lt-metric--dark h-100 text-center">
                <div class="card-body py-2 px-2">
                  <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a pagar</div>
                  <div class="fs-6 fw-bold" id="hours-summary-total-net">$0</div>
                  <div class="small lt-metric__k" style="font-size: 0.65rem;" id="hours-summary-total-gross"></div>
                </div>
              </div>
            </div>
          </div>

          <div id="hours-results-container" class="d-none">
            <div class="table-responsive border rounded">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                    <th class="py-2 text-muted font-weight-normal">Fecha</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                    <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                    <th class="text-end py-2 pe-3 text-muted font-weight-normal" style="width: 100px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="hours-table-body"></tbody>
              </table>
            </div>
          </div>

          <div id="hours-empty-state" class="text-center py-4 d-none"></div>
        </div>
      </div>
    `;

    const emptyState = document.getElementById("hours-empty-state");
    if (emptyState && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(emptyState, {
        variant: "empty",
        title: "Sin registros",
        message: "Utilizá los filtros para buscar registros."
      });
    }
  }

  function renderEmployees(employees) {
    const datalist = document.getElementById("hours-employee-list");
    const input = document.getElementById("hours-filter-employee");
    if (!datalist || !input) return;

    const ui = global.UIHelpers;
    const renderList = (labels) => {
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels || []);
        return;
      }
      Dom && Dom.clear ? Dom.clear(datalist) : (datalist.innerHTML = "");
      (labels || []).forEach((label) => {
        const option = document.createElement("option");
        option.value = label;
        datalist.appendChild(option);
      });
    };
    renderList([]);
    input.value = "";

    const labels = state.setEmployeeMap(employees || []);
    renderList(labels);
  }

  function setLoading(show) {
    const loadingEl = document.getElementById("hours-loading");
    if (!loadingEl) return;
    loadingEl.classList.toggle("d-none", !show);
    if (show && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(loadingEl, { variant: "loading", message: "Cargando registros..." });
    }
  }

  function renderEmpty(message) {
    const container = document.getElementById("hours-results-container");
    const emptyState = document.getElementById("hours-empty-state");
    if (container) container.classList.add("d-none");
    if (emptyState) {
      emptyState.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(emptyState, {
          variant: "empty",
          title: "Sin registros",
          message: message || "No hay datos para los filtros seleccionados."
        });
      }
    }
  }

  function renderTable(rows, summary) {
    const tbody = document.getElementById("hours-table-body");
    const container = document.getElementById("hours-results-container");
    const emptyState = document.getElementById("hours-empty-state");
    if (!tbody || !container) return;

    if (!rows || !rows.length) {
      const progressEl = document.getElementById("hours-render-progress");
      if (progressEl) progressEl.remove();
      renderEmpty("No hay datos para los filtros seleccionados.");
      updateSummary(summary || null);
      return;
    }

    const ui = global.UIHelpers;
    const progressId = "hours-render-progress";
    let progressEl = document.getElementById(progressId);
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      container.insertBefore(progressEl, container.firstChild);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (row) => {
      const hours = parseFloat(row.horas) || 0;
      const isAbsent = row.asistencia === false;
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: row.cliente || "-" }),
        Dom.el("td", { text: row.fecha || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: String(hours) }),
        Dom.el("td", { className: "text-muted small", text: row.observaciones || "-" })
      ]);

      const editBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary lt-btn-icon btn-edit-hour",
        dataset: { id: row.id },
        title: "Editar"
      }, Dom.el("i", { className: "bi bi-pencil-fill" }));
      const deleteBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-danger lt-btn-icon btn-delete-hour",
        dataset: { id: row.id },
        title: "Eliminar"
      }, Dom.el("i", { className: "bi bi-trash-fill" }));
      const actions = Dom.el("div", { className: "d-flex gap-2 justify-content-end" }, [editBtn, deleteBtn]);
      tr.appendChild(Dom.el("td", { className: "text-end" }, actions));

      if (isAbsent) {
        tr.classList.add("absence-row");
      }
      return tr;
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} registros...`;
          }
        },
        onDone: finish
      });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((row) => {
        const tr = renderRow(row);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    updateSummary(summary || {});
    container.classList.remove("d-none");
    if (emptyState) emptyState.classList.add("d-none");
  }

  function updateSummary(summary) {
    const box = document.getElementById("hours-summary");
    if (!box) return;

    const totals = {
      totalHoras: 0,
      valorHora: 0,
      totalBruto: 0,
      adelantos: 0,
      totalNeto: 0,
      viaticos: 0,
      presentismo: 0,
      ...(summary || {})
    };

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("hours-summary-total", Formatters.formatNumber(totals.totalHoras, 2));
    setText("hours-summary-rate", Formatters.formatCurrency(totals.valorHora));
    setText("hours-summary-advances", Formatters.formatCurrency(totals.adelantos));
    setText("hours-summary-total-net", Formatters.formatCurrency(totals.totalNeto));
    setText("hours-summary-total-gross", "Total: " + Formatters.formatCurrency(totals.totalBruto));
    setText("hours-summary-viaticos", Formatters.formatCurrency(totals.viaticos));
    setText("hours-summary-presentismo", Formatters.formatCurrency(totals.presentismo));

    box.classList.remove("d-none");
  }

  global.HoursDetailPanelRender = {
    render: render,
    renderEmployees: renderEmployees,
    setLoading: setLoading,
    renderTable: renderTable,
    renderEmpty: renderEmpty,
    updateSummary: updateSummary
  };
})(typeof window !== "undefined" ? window : this);


/**
 * HoursDetailPanelHandlers
 * Eventos del panel de detalle de horas.
 */
(function (global) {
  const state = global.HoursDetailPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.HoursDetailPanelRender && global.HoursDetailPanelData;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("hours-filter-start");
    const endInput = document.getElementById("hours-filter-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.HoursDetailPanelData.loadEmployees().then((employees) => {
      global.HoursDetailPanelRender.renderEmployees(employees || []);
    });
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("btn-search-hours"), "click", handleSearch);
    on(document.getElementById("btn-export-pdf"), "click", handleExportPdf);

    const tbody = document.getElementById("hours-table-body");
    on(tbody, "click", handleTableClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const start = document.getElementById("hours-filter-start")?.value || "";
    const end = document.getElementById("hours-filter-end")?.value || "";
    const employeeRaw = document.getElementById("hours-filter-employee")?.value || "";
    const idEmpleado = state.getEmployeeIdFromLabel(employeeRaw);

    if (!employeeRaw) {
      Alerts && Alerts.showAlert("Por favor seleccione un empleado", "warning");
      return;
    }
    if (!idEmpleado) {
      Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista", "warning");
      return;
    }

    state.lastFilters = { start, end, employeeRaw, idEmpleado };

    global.HoursDetailPanelRender.setLoading(true);
    const summaryBox = document.getElementById("hours-summary");
    if (summaryBox) summaryBox.classList.add("d-none");

    global.HoursDetailPanelData.fetchHoursByEmployee(start, end, employeeRaw, idEmpleado)
      .then((result) => {
        const rows = result && result.rows ? result.rows : [];
        const summary = result && result.summary ? result.summary : null;
        state.lastResults = rows;
        state.lastSummary = summary;
        global.HoursDetailPanelRender.renderTable(rows || [], summary);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar horas", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al cargar horas", "danger");
        }
      })
      .finally(() => {
        global.HoursDetailPanelRender.setLoading(false);
      });
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const start = document.getElementById("hours-filter-start")?.value || "";
    const end = document.getElementById("hours-filter-end")?.value || "";
    const employee = document.getElementById("hours-filter-employee")?.value || "";
    const idEmpleado = state.getEmployeeIdFromLabel(employee);

    if (!employee) {
      Alerts && Alerts.showAlert("Selecciona un empleado para exportar", "warning");
      return;
    }
    if (!idEmpleado) {
      Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista", "warning");
      return;
    }

    const btn = document.getElementById("btn-export-pdf");
    const ui = global.UIHelpers;
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, true, "Descargando...");
      }

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.HoursDetailPanelData.generatePdf(start, end, employee, idEmpleado)
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "reporte.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error generando PDF", err);
        } else {
          Alerts && Alerts.showAlert("Error generando PDF", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
      if (btn && ui && typeof ui.withSpinner === "function") {
        ui.withSpinner(btn, false);
      }
      });
  }

  function handleTableClick(event) {
    const editBtn = event.target.closest(".btn-edit-hour");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const record = state.lastResults.find((r) => String(r.id) === String(id));
      if (record) openInlineEditModal(record);
      return;
    }
    const deleteBtn = event.target.closest(".btn-delete-hour");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (id) deleteRecord(id);
    }
  }

  function deleteRecord(id) {
    const confirmPromise =
      typeof window !== "undefined" &&
      window.UiDialogs &&
      typeof window.UiDialogs.confirm === "function"
        ? window.UiDialogs.confirm({
            title: "Eliminar registro de horas",
            message: "¿Está seguro de eliminar este registro de horas?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            confirmVariant: "danger",
            icon: "bi-trash3-fill",
            iconClass: "text-danger"
          })
        : Promise.resolve(confirm("¿Está seguro de eliminar este registro de horas?"));

    confirmPromise.then(function (confirmed) {
      if (!confirmed) return;

      UiState && UiState.setGlobalLoading(true, "Eliminando...");
      global.HoursDetailPanelData.deleteRecord(id)
        .then(() => {
          Alerts && Alerts.showAlert("Registro eliminado correctamente", "success");
          if (state.lastFilters) {
            handleSearch();
          }
        })
        .catch((err) => {
          if (Alerts && typeof Alerts.showError === "function") {
            Alerts.showError("Error al eliminar", err);
          } else {
            Alerts && Alerts.showAlert("Error al eliminar", "danger");
          }
        })
        .finally(() => {
          UiState && UiState.setGlobalLoading(false);
        });
    });
  }

  function openInlineEditModal(record) {
    const existing = document.getElementById("hours-edit-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "hours-edit-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog modal-dialog-centered" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h5", { className: "modal-title", text: "Editar asistencia" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" }, "aria-label": "Close" })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Empleado" }),
              Dom.el("input", { type: "text", className: "form-control", value: record.empleado || "", disabled: true })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Cliente" }),
              Dom.el("input", { type: "text", className: "form-control", value: record.cliente || "", disabled: true })
            ]),
            Dom.el("div", { className: "row g-3" }, [
              Dom.el("div", { className: "col-md-6" }, [
                Dom.el("label", { className: "form-label small text-muted", text: "Fecha" }),
                Dom.el("input", { type: "date", id: "hours-edit-fecha", className: "form-control", value: record.fecha || "" })
              ]),
              Dom.el("div", { className: "col-md-6" }, [
                Dom.el("label", { className: "form-label small text-muted", text: "Horas" }),
                Dom.el("input", { type: "number", step: "0.25", id: "hours-edit-horas", className: "form-control", value: record.horas || "" })
              ])
            ]),
            Dom.el("div", { className: "form-check form-switch mt-3" }, [
              Dom.el("input", { className: "form-check-input", type: "checkbox", id: "hours-edit-asistencia" }),
              Dom.el("label", { className: "form-check-label", text: "Asistencia", for: "hours-edit-asistencia" })
            ]),
            Dom.el("div", { className: "mt-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Observaciones" }),
              Dom.el("textarea", { id: "hours-edit-observaciones", className: "form-control", rows: "2" }, record.observaciones || "")
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary", id: "hours-edit-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const asistenciaInput = document.getElementById("hours-edit-asistencia");
    if (asistenciaInput) {
      asistenciaInput.checked = record.asistencia !== false;
    }

    const horasInput = document.getElementById("hours-edit-horas");
    if (horasInput && record.asistencia === false && record.horasPlan) {
      horasInput.value = record.horasPlan;
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const saveBtn = document.getElementById("hours-edit-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const fecha = document.getElementById("hours-edit-fecha")?.value || "";
        const horas = document.getElementById("hours-edit-horas")?.value || "";
        const observaciones = document.getElementById("hours-edit-observaciones")?.value || "";
        const asistencia = document.getElementById("hours-edit-asistencia")?.checked ?? true;
        const horasToSave = asistencia ? horas : (horas || record.horasPlan || "");

        if (!fecha) {
          Alerts && Alerts.showAlert("Seleccione fecha.", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando...");
        const payload = {
          EMPLEADO: record.empleado,
          CLIENTE: record.cliente,
          FECHA: fecha,
          ASISTENCIA: asistencia,
          HORAS: horasToSave,
          OBSERVACIONES: observaciones
        };

        global.HoursDetailPanelData.updateRecord(record.id, payload)
          .then(() => {
            Alerts && Alerts.showAlert("Registro actualizado.", "success");
            modal.hide();
            modalEl.remove();
            handleSearch();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar", "danger");
            }
          })
          .finally(() => {
            UiState && UiState.setGlobalLoading(false);
          });
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => {
      modalEl.remove();
    });
  }

  global.HoursDetailPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);


/**
 * HoursDetailPanel
 * Orquestador del panel de detalle de horas.
 */
(function (global) {
  const HoursDetailPanel = (() => {
    function ensureDeps() {
      return global.HoursDetailPanelState
        && global.HoursDetailPanelRender
        && global.HoursDetailPanelHandlers
        && global.HoursDetailPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("HoursDetailPanel dependencies no disponibles");
        return;
      }
      global.HoursDetailPanelRender.render();
      global.HoursDetailPanelHandlers.attachEvents();
      global.HoursDetailPanelHandlers.init();
    }

    return { render: render };
  })();

  global.HoursDetailPanel = HoursDetailPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientMonthlySummaryPanelState
 */
(function (global) {
  const state = {
    containerId: "client-monthly-summary-panel",
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
          return cli == null ? "" : String(cli);
        }
  };

  state.buildFallbackClientLabel = function (nombre, idCliente) {
    const name = String(nombre || "").trim();
    const id = String(idCliente || "").trim();
    if (!name && !id) return "";
    if (!id) return name;
    return name ? `${name} (ID: ${id})` : `ID: ${id}`;
  };

  global.ClientMonthlySummaryPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientMonthlySummaryPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.get === "function";
  }

  function fetchSummary(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getMonthlySummaryByClient", Number(year), Number(month));
  }

  function getClientLabelById(idCliente) {
    const idStr = String(idCliente || "").trim();
    if (!idStr || !ensureReference()) return "";
    const refs = global.ReferenceService.get();
    const clientes = refs && refs.clientes ? refs.clientes : [];
    const match = clientes.find((c) => c && typeof c === "object" && String(c.id || "").trim() === idStr);
    if (!match) return "";
    if (global.DomainHelpers && typeof global.DomainHelpers.getClientLabel === "function") {
      return global.DomainHelpers.getClientLabel(match);
    }
    return match.nombre || match.razonSocial || "";
  }

  global.ClientMonthlySummaryPanelData = {
    fetchSummary: fetchSummary,
    getClientLabelById: getClientLabelById
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientMonthlySummaryPanelRender
 */
(function (global) {
  const state = global.ClientMonthlySummaryPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Mes</label>
              <input type="month" id="cms-month" class="form-control form-control-sm">
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="cms-search">
                <i class="bi bi-search"></i> Consultar
              </button>
            </div>
          </div>

          <div id="cms-loading" class="text-center py-3 d-none"></div>
          <div id="cms-empty" class="text-center text-muted py-4 d-none"></div>
          <div class="table-responsive lt-table-wrap d-none" id="cms-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Cliente</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Días</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Valor hora</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                  <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                </tr>
              </thead>
              <tbody id="cms-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const monthInput = document.getElementById("cms-month");
    if (monthInput) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById("cms-tbody");
    const wrapper = document.getElementById("cms-table-wrapper");
    const empty = document.getElementById("cms-empty");
    if (!tbody || !wrapper || !empty) return;

    if (!rows || !rows.length) {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      wrapper.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, { variant: "empty", title: "Sin datos", message: "Sin datos para el mes seleccionado." });
      }
      return;
    }

    const renderRow = (row) => {
      const idCliente = row.idCliente != null ? String(row.idCliente).trim() : "";
      const clienteNombre = row.cliente || "";
      const clienteFallbackLabel = state.buildFallbackClientLabel(clienteNombre, idCliente);
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: clienteNombre || "-" }),
        Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(row.horas, 2) }),
        Dom.el("td", { className: "text-center", text: String(row.dias || 0) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.valorHora) }),
        Dom.el("td", { className: "text-center fw-bold text-success", text: Formatters.formatCurrency(row.totalFacturacion) })
      ]);
      const btn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary cms-view-detail",
        dataset: { idCliente: idCliente, clienteLabel: clienteFallbackLabel }
      }, [
        Dom.el("i", { className: "bi bi-eye" }),
        Dom.text(" Detalle")
      ]);
      tr.appendChild(Dom.el("td", { className: "text-end" }, btn));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, { chunkSize: 150 });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((row) => {
        tbody.appendChild(renderRow(row));
      });
    }

    wrapper.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("cms-loading");
    const empty = document.getElementById("cms-empty");
    const wrapper = document.getElementById("cms-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Calculando..." });
      }
    }
    if (wrapper && show) wrapper.classList.add("d-none");
    if (empty && show) empty.classList.add("d-none");
  }

  global.ClientMonthlySummaryPanelRender = {
    render: render,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientMonthlySummaryPanelHandlers
 */
(function (global) {
  const state = global.ClientMonthlySummaryPanelState;

  function ensureDeps() {
    return state && global.ClientMonthlySummaryPanelData && global.ClientMonthlySummaryPanelRender;
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("cms-search"), "click", handleSearch);
    const tbody = document.getElementById("cms-tbody");
    on(tbody, "click", handleDetailClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("cms-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) {
      Alerts && Alerts.showAlert("Selecciona un mes", "warning");
      return;
    }
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.ClientMonthlySummaryPanelRender.toggleLoading(true);
    global.ClientMonthlySummaryPanelData.fetchSummary(y, m)
      .then((rows) => {
        global.ClientMonthlySummaryPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al calcular resumen", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al calcular resumen", "danger");
        }
      })
      .finally(() => global.ClientMonthlySummaryPanelRender.toggleLoading(false));
  }

  function handleDetailClick(event) {
    const btn = event.target.closest(".cms-view-detail");
    if (!btn) return;
    const idCliente = btn.getAttribute("data-id-cliente") || "";
    const fallbackLabel = btn.getAttribute("data-cliente-label") || "";
    const cliente = global.ClientMonthlySummaryPanelData.getClientLabelById(idCliente) || fallbackLabel;
    if (!cliente) return;

    const monthInput = document.getElementById("cms-month");
    const val = monthInput ? monthInput.value : "";
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];
    const start = `${y}-${m}-01`;
    const endDate = new Date(Number(y), Number(m), 0);
    const endStr = `${y}-${m}-${String(endDate.getDate()).padStart(2, "0")}`;

    const evt = new CustomEvent("view-change", { detail: { view: "reportes-clientes" } });
    document.dispatchEvent(evt);

    setTimeout(() => {
      const cliInput = document.getElementById("client-report-client");
      const startInput = document.getElementById("client-report-start");
      const endInput = document.getElementById("client-report-end");
      if (cliInput) cliInput.value = cliente;
      if (startInput) startInput.value = start;
      if (endInput) endInput.value = endStr;
      const btnSearch = document.getElementById("client-report-search");
      if (btnSearch) btnSearch.click();
    }, 200);
  }

  global.ClientMonthlySummaryPanelHandlers = {
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientMonthlySummaryPanel
 */
(function (global) {
  const ClientMonthlySummaryPanel = (() => {
    function ensureDeps() {
      return global.ClientMonthlySummaryPanelState
        && global.ClientMonthlySummaryPanelRender
        && global.ClientMonthlySummaryPanelHandlers
        && global.ClientMonthlySummaryPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientMonthlySummaryPanel dependencies no disponibles");
        return;
      }
      global.ClientMonthlySummaryPanelRender.render();
      global.ClientMonthlySummaryPanelHandlers.attachEvents();
    }

    return { render: render };
  })();

  global.ClientMonthlySummaryPanel = ClientMonthlySummaryPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientAccountPanelState
 * Estado y helpers de cuenta corriente clientes.
 */
(function (global) {
  const state = {
    containerId: "client-account-panel",
    clientIdMap: new Map(),
    lastQuery: null,
    eventsController: null,
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  state.setClientMap = function (clients) {
    state.clientIdMap = new Map();
    const list = Array.isArray(clients) ? clients.slice() : [];
    const labels = list
      .map((cli) => {
        if (!cli || typeof cli !== "object") return null;
        const id = cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        let label = state.formatClientLabel(cli);
        label = label != null ? String(label).trim() : "";
        if (!label) label = `ID: ${id}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (ID: ${id})`;
          }
        }
        state.clientIdMap.set(label, id);
        return { raw: cli, label: label };
      })
      .filter((item) => item && item.label)
      .sort((a, b) => a.label.localeCompare(b.label, "es"));

    return labels.map((item) => item.label);
  };

  state.getClientIdFromLabel = function (label) {
    if (!label) return "";

    // Primero buscar en el mapa (fuente de verdad)
    const labelStr = String(label).trim();
    if (state.clientIdMap.has(labelStr)) {
      return state.clientIdMap.get(labelStr);
    }

    // Fallback: intentar extraer del label
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }

    // Fallback: si es un número puro, usarlo
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;

    return "";
  };

  state.getPaymentMethods = function () {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  };

  global.ClientAccountPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientAccountPanelData
 * Capa de datos para cuenta corriente clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadClients() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.clientes ? refs.clientes : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
        return [];
      });
  }

  function fetchAccountStatement(query) {
    if (!ensureApi()) return Promise.resolve({ movimientos: [], saldoInicial: 0 });
    return global.ApiService.call(
      "getClientAccountStatement",
      query.clientRaw,
      query.startDate,
      query.endDate,
      query.idCliente
    );
  }

  function fetchInvoicesCount(idCliente, startDate, endDate) {
    if (!ensureApi()) return Promise.resolve(0);
    return global.ApiService.call("getInvoices", { idCliente: idCliente, fechaDesde: startDate, fechaHasta: endDate })
      .then((invs) => (Array.isArray(invs) ? invs.length : 0))
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error contando facturas", err, { silent: true });
        } else {
          console.error("Error contando facturas:", err);
        }
        return 0;
      });
  }

  function generatePdf(query) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call(
      "generateClientAccountStatementPdf",
      query.clientRaw,
      query.startDate,
      query.endDate,
      query.idCliente
    );
  }

  function fetchPendingInvoices(idCliente) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getClientInvoicesForPayment", "", idCliente)
      .then((list) => (Array.isArray(list) ? list : []));
  }

  function recordPayment(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("recordClientPayment", payload);
  }

  global.ClientAccountPanelData = {
    loadClients: loadClients,
    fetchAccountStatement: fetchAccountStatement,
    fetchInvoicesCount: fetchInvoicesCount,
    generatePdf: generatePdf,
    fetchPendingInvoices: fetchPendingInvoices,
    recordPayment: recordPayment
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientAccountPanelRender
 * Render de cuenta corriente de clientes.
 */
(function (global) {
  const state = global.ClientAccountPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    let container = document.getElementById(state.containerId);
    if (!container) {
      const parent = document.getElementById("view-reportes-clientes");
      if (parent) {
        container = document.createElement("div");
        container.id = state.containerId;
        container.className = "mt-4";
        parent.appendChild(container);
      } else {
        return;
      }
    }

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-wallet2 me-2"></i>Cuenta Corriente Clientes</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="client-acc-list" id="client-acc-input" class="form-control form-control-sm" placeholder="Buscar cliente...">
              <datalist id="client-acc-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="client-acc-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="client-acc-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-5 d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-search">
                <i class="bi bi-search"></i> Consultar
              </button>
              <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pdf" title="Descargar PDF">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
              <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-acc-pay">
                <i class="bi bi-cash-coin"></i> Registrar Pago
              </button>
            </div>
          </div>

          <div id="client-acc-loading" class="text-center py-3 d-none"></div>

          <div id="client-acc-empty" class="text-center text-muted py-4 d-none"></div>

          <div id="client-acc-summary" class="row g-2 mb-2 d-none"></div>

          <div class="table-responsive lt-table-wrap d-none" id="client-acc-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="table-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                  <th class="py-2 text-muted font-weight-normal">Concepto</th>
                  <th class="text-end py-2 text-muted font-weight-normal">Debe (Factura)</th>
                  <th class="text-end py-2 text-muted font-weight-normal">Haber (Pago)</th>
                  <th class="text-end py-2 pe-3 text-muted font-weight-normal">Saldo</th>
                </tr>
              </thead>
              <tbody id="client-acc-tbody"></tbody>
            </table>
          </div>

          <details class="mt-2 d-none" id="client-acc-debug">
            <summary class="small text-muted">Diagnóstico</summary>
            <pre class="small mb-0 mt-2 p-2 bg-light border rounded" id="client-acc-debug-pre" style="white-space: pre-wrap;"></pre>
          </details>
        </div>
      </div>
    `;

    const empty = document.getElementById("client-acc-empty");
    if (empty && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Cuenta corriente",
        message: "Seleccioná un cliente para ver su cuenta corriente."
      });
    }
  }

  function renderClients(clients) {
    const datalist = document.getElementById("client-acc-list");
    const input = document.getElementById("client-acc-input");
    if (!datalist || !input) return;

    const ui = global.UIHelpers;
    const renderList = (labels) => {
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels || []);
        return;
      }
      Dom && Dom.clear ? Dom.clear(datalist) : (datalist.innerHTML = "");
      (labels || []).forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    };
    renderList([]);
    input.value = "";

    const labels = state.setClientMap(clients || []);
    renderList(labels);
  }

  function renderEmpty(message, extra) {
    const empty = document.getElementById("client-acc-empty");
    if (!empty) return;
    empty.classList.remove("d-none");
    if (typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Sin movimientos",
        message: message || "No hay movimientos registrados en este período."
      });
    } else {
      Dom && Dom.clear ? Dom.clear(empty) : (empty.innerHTML = "");
      empty.appendChild(Dom.el("div", { className: "text-muted small", text: message || "No hay movimientos registrados en este período." }));
    }
    if (extra) {
      empty.appendChild(Dom.el("div", { className: "small text-muted mt-1", text: extra }));
    }
  }

  function renderTable(data) {
    const tbody = document.getElementById("client-acc-tbody");
    const wrapper = document.getElementById("client-acc-table-wrapper");
    const summaryEl = document.getElementById("client-acc-summary");
    if (!tbody || !wrapper) return;

    const rows = data && data.movimientos ? data.movimientos : [];
    const saldoInicial = data && typeof data.saldoInicial === "number" ? data.saldoInicial : 0;

    if (rows.length === 0 && saldoInicial === 0) {
      const progressEl = document.getElementById("client-acc-render-progress");
      if (progressEl) progressEl.remove();
      wrapper.classList.add("d-none");
      if (summaryEl) summaryEl.classList.add("d-none");
      renderEmpty("No hay movimientos registrados en este período.");
      return;
    }

    const totalDebe = rows.reduce((acc, r) => acc + (Number(r.debe) || 0), 0);
    const totalHaber = rows.reduce((acc, r) => acc + (Number(r.haber) || 0), 0);

    let saldoFinal = saldoInicial;
    if (rows.length > 0) {
      const lastRowSaldo = rows[rows.length - 1].saldo;
      saldoFinal = (lastRowSaldo !== undefined && lastRowSaldo !== null) ? Number(lastRowSaldo) : saldoInicial;
    }

    if (summaryEl) {
      const saldoClass = saldoFinal > 0 ? "text-danger" : (saldoFinal < 0 ? "text-success" : "text-muted");
      Dom && Dom.clear ? Dom.clear(summaryEl) : (summaryEl.innerHTML = "");
      const cards = [
        { label: "Saldo anterior", value: Formatters.formatCurrency(saldoInicial), className: "" },
        { label: "Facturado", value: Formatters.formatCurrency(totalDebe), className: "text-danger" },
        { label: "Cobrado", value: Formatters.formatCurrency(totalHaber), className: "text-success" },
        { label: "Saldo final", value: Formatters.formatCurrency(saldoFinal), className: saldoClass }
      ];
      cards.forEach((card) => {
        const col = Dom.el("div", { className: "col-md-3" }, [
          Dom.el("div", { className: "card border-0 bg-light" }, [
            Dom.el("div", { className: "card-body py-2" }, [
              Dom.el("div", { className: "text-muted small fw-bold", text: card.label }),
              Dom.el("div", { className: "fw-bold " + card.className, text: card.value })
            ])
          ])
        ]);
        summaryEl.appendChild(col);
      });
      summaryEl.classList.remove("d-none");
    }

    const initialRow = Dom.el("tr", { className: "table-secondary fw-bold" }, [
      Dom.el("td", { className: "ps-3", colspan: "2", text: "Saldo Anterior" }),
      Dom.el("td", { className: "text-end", text: "-" }),
      Dom.el("td", { className: "text-end", text: "-" }),
      Dom.el("td", {
        className: "text-end pe-3 " + (saldoInicial > 0 ? "text-danger" : (saldoInicial < 0 ? "text-success" : "text-muted")),
        text: Formatters.formatCurrency(saldoInicial)
      })
    ]);
    const ui = global.UIHelpers;
    const progressId = "client-acc-render-progress";
    let progressEl = document.getElementById(progressId);
    const host = wrapper.parentElement || wrapper;
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      host.insertBefore(progressEl, wrapper);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (r) => {
      const saldoClass = r.saldo > 0 ? "text-danger" : (r.saldo < 0 ? "text-success" : "text-muted");
      const dateStr = Formatters.formatDateDisplay(r.fecha);
      return Dom.el("tr", null, [
        Dom.el("td", { className: "ps-3", text: dateStr }),
        Dom.el("td", { text: r.concepto || "" }),
        Dom.el("td", { className: "text-end text-danger", text: r.debe > 0 ? Formatters.formatCurrency(r.debe) : "-" }),
        Dom.el("td", { className: "text-end text-success", text: r.haber > 0 ? Formatters.formatCurrency(r.haber) : "-" }),
        Dom.el("td", { className: "text-end fw-bold pe-3 " + saldoClass, text: Formatters.formatCurrency(r.saldo) })
      ]);
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} movimientos...`;
          }
        },
        onDone: finish
      }).then(() => {
        tbody.insertBefore(initialRow, tbody.firstChild);
      });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      tbody.appendChild(initialRow);
      rows.forEach((r) => {
        const tr = renderRow(r);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    wrapper.classList.remove("d-none");
    const empty = document.getElementById("client-acc-empty");
    if (empty) empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("client-acc-loading");
    const empty = document.getElementById("client-acc-empty");
    const wrapper = document.getElementById("client-acc-table-wrapper");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando movimientos..." });
      }
    }
    if (show) {
      if (empty) empty.classList.add("d-none");
      if (wrapper) wrapper.classList.add("d-none");
    }
  }

  function setDebug(payload, show) {
    const details = document.getElementById("client-acc-debug");
    const pre = document.getElementById("client-acc-debug-pre");
    if (!details || !pre) return;

    if (!show) {
      details.classList.add("d-none");
      details.open = false;
      return;
    }

    let text = "";
    try {
      text = JSON.stringify(payload, null, 2);
    } catch (e) {
      text = String(payload);
    }

    if (text.length > 12000) {
      text = text.slice(0, 12000) + "\n... (truncado)";
    }

    pre.textContent = text;
    details.classList.remove("d-none");
    details.open = true;
  }

  global.ClientAccountPanelRender = {
    render: render,
    renderClients: renderClients,
    renderTable: renderTable,
    renderEmpty: renderEmpty,
    toggleLoading: toggleLoading,
    setDebug: setDebug
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientAccountPanelHandlers
 * Eventos de cuenta corriente de clientes.
 */
(function (global) {
  const state = global.ClientAccountPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.ClientAccountPanelData && global.ClientAccountPanelRender;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("client-acc-start");
    const endInput = document.getElementById("client-acc-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.ClientAccountPanelData.loadClients().then((clients) => {
      global.ClientAccountPanelRender.renderClients(clients || []);
    });
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("client-acc-search"), "click", handleSearch);
    on(document.getElementById("client-acc-pdf"), "click", handleExportPdf);
    on(document.getElementById("client-acc-pay"), "click", openPaymentModal);
  }

  function handleReferenceUpdate() {
    const view = document.getElementById("view-reportes-clientes");
    if (view && !view.classList.contains("d-none")) {
      global.ClientAccountPanelData.loadClients().then((clients) => {
        global.ClientAccountPanelRender.renderClients(clients || []);
      });
    }
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const startDate = document.getElementById("client-acc-start")?.value || "";
    const endDate = document.getElementById("client-acc-end")?.value || "";

    console.log("[ClientAccount] handleSearch - clientRaw:", clientRaw);
    console.log("[ClientAccount] handleSearch - idCliente extracted:", idCliente);
    console.log("[ClientAccount] handleSearch - clientIdMap:", Array.from(state.clientIdMap.entries()));

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!startDate || !endDate) {
      Alerts && Alerts.showAlert("Seleccioná un rango de fechas", "warning");
      return;
    }

    state.lastQuery = { clientRaw, idCliente, startDate, endDate };
    console.log("[ClientAccount] handleSearch - calling fetchAccountStatement with:", state.lastQuery);

    global.ClientAccountPanelRender.toggleLoading(true);

    global.ClientAccountPanelData.fetchAccountStatement(state.lastQuery)
      .then((data) => {
        console.log("[ClientAccount] handleSearch - response:", data);
        global.ClientAccountPanelRender.renderTable(data);
        global.ClientAccountPanelRender.setDebug({ query: state.lastQuery, response: data }, false);

        const rows = data && data.movimientos ? data.movimientos : [];
        const saldoInicial = data && typeof data.saldoInicial === "number" ? data.saldoInicial : 0;
        if (rows.length === 0 && saldoInicial === 0) {
          global.ClientAccountPanelData.fetchInvoicesCount(idCliente, startDate, endDate)
            .then((count) => {
              const extra = "Facturas encontradas para este cliente y rango: " + count;
              global.ClientAccountPanelRender.renderEmpty("No hay movimientos registrados en este período.", extra);
              if (count > 0) {
                global.ClientAccountPanelRender.setDebug({ query: state.lastQuery, response: data, invoicesFound: count }, true);
              }
            });
        }
      })
      .catch((err) => {
        console.error("[ClientAccount] handleSearch - error:", err);
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al cargar cuenta corriente", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al cargar cuenta corriente", "danger");
        }
      })
      .finally(() => global.ClientAccountPanelRender.toggleLoading(false));
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const startDate = document.getElementById("client-acc-start")?.value || "";
    const endDate = document.getElementById("client-acc-end")?.value || "";

    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }
    if (!startDate || !endDate) {
      Alerts && Alerts.showAlert("Seleccioná un rango de fechas", "warning");
      return;
    }

    const btn = document.getElementById("client-acc-pdf");
    const ui = global.UIHelpers;
    if (btn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(btn, true, "Descargando...");
    }

    // Extraer nombre limpio del cliente quitando metadatos (ID: XX, CUIT, etc)
    const cleanClientName = clientRaw.replace(/\s*\([^)]*\)\s*$/g, '').trim();

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.ClientAccountPanelData.generatePdf({
      clientRaw: cleanClientName, // Pasar el nombre limpio
      idCliente,
      startDate,
      endDate
    })
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "cuenta_corriente_cliente.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error generando PDF", err);
        } else {
          Alerts && Alerts.showAlert("Error generando PDF", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
        if (btn && ui && typeof ui.withSpinner === "function") {
          ui.withSpinner(btn, false);
        }
      });
  }

  function openPaymentModal() {
    if (!ensureDeps()) return;
    const clientRaw = document.getElementById("client-acc-input")?.value || "";
    const idCliente = state.getClientIdFromLabel(clientRaw);
    const clientLabel = clientRaw;
    if (!clientRaw) {
      Alerts && Alerts.showAlert("Seleccioná un cliente primero", "warning");
      return;
    }
    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const existing = document.getElementById("client-pay-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "client-pay-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog modal-dialog-centered" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h6", { className: "modal-title fw-bold", text: "Registrar Pago de Cliente" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" } })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Cliente" }),
              Dom.el("input", { type: "text", className: "form-control", value: clientRaw, disabled: true })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Fecha" }),
              Dom.el("input", { type: "date", id: "cp-fecha", className: "form-control", value: new Date().toISOString().slice(0, 10) })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Monto" }),
              Dom.el("input", { type: "number", id: "cp-monto", className: "form-control", step: "0.01" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Medio de pago" }),
              Dom.el("select", { id: "cp-medio", className: "form-select" }, [
                Dom.el("option", { value: "", text: "Seleccionar..." })
              ])
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Factura (opcional)" }),
              Dom.el("select", { id: "cp-factura", className: "form-select" }, [
                Dom.el("option", { value: "", text: "-- Sin factura --" })
              ]),
              Dom.el("div", { className: "form-text", text: "Vinculá el pago a una factura para reflejarlo en la cuenta corriente." })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted fw-bold", text: "Observaciones" }),
              Dom.el("textarea", { id: "cp-obs", className: "form-control", rows: "2" })
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary btn-sm", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary btn-sm", id: "cp-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const medioSelect = document.getElementById("cp-medio");
    if (medioSelect) {
      state.getPaymentMethods().forEach((method) => {
        const opt = document.createElement("option");
        opt.value = method;
        opt.textContent = method;
        medioSelect.appendChild(opt);
      });
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const facturaSelect = document.getElementById("cp-factura");
    const help = modalEl.querySelector(".form-text");
    global.ClientAccountPanelData.fetchPendingInvoices(idCliente)
      .then((items) => {
        if (!facturaSelect) return;
        if (help) {
          help.textContent = items.length
            ? (`Facturas pendientes encontradas: ${items.length}.`)
            : "No hay facturas pendientes para vincular. Podés registrar el pago sin factura.";
        }
        items.forEach((inv) => {
          const opt = document.createElement("option");
          opt.value = inv.id || "";
          const fechaStr = inv.fecha ? Formatters.formatDateDisplay(inv.fecha) : "";
          const pendiente = inv.saldo != null ? Number(inv.saldo) : null;
          const pendienteStr = (pendiente != null && !isNaN(pendiente) && pendiente > 0)
            ? `Pendiente ${Formatters.formatCurrency(pendiente)}`
            : "";
          const labelParts = [
            inv.comprobante || "Factura",
            inv.numero || "S/N",
            inv.periodo || "",
            fechaStr,
            pendienteStr
          ].filter(Boolean);
          opt.textContent = labelParts.join(" - ");
          opt.dataset.numero = inv.numero || "";
          facturaSelect.appendChild(opt);
        });
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error cargando facturas pendientes", err);
        } else {
          console.error("No se pudieron cargar facturas del cliente:", err);
        }
        if (help) {
          help.textContent = "Error cargando facturas pendientes.";
        }
      });

    const saveBtn = document.getElementById("cp-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const fecha = document.getElementById("cp-fecha")?.value || "";
        const monto = document.getElementById("cp-monto")?.value || "";
        const obs = document.getElementById("cp-obs")?.value || "";
        const medioPago = document.getElementById("cp-medio")?.value || "";
        const facturaSelect = document.getElementById("cp-factura");
        const facturaId = facturaSelect ? facturaSelect.value : "";
        const facturaNumero = facturaSelect && facturaSelect.selectedOptions[0]
          ? (facturaSelect.selectedOptions[0].dataset.numero || "")
          : "";

        if (!monto) {
          Alerts && Alerts.showAlert("Ingresá un monto", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando pago...");
        global.ClientAccountPanelData.recordPayment({
          fecha: fecha,
          cliente: clientLabel,
          idCliente: idCliente,
          monto: monto,
          detalle: obs,
          medioPago: medioPago,
          idFactura: facturaId || "",
          facturaNumero: facturaNumero
        })
          .then(() => {
            Alerts && Alerts.showAlert("Pago registrado", "success");
            modal.hide();
            modalEl.remove();
            handleSearch();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar pago", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar pago", "danger");
            }
          })
          .finally(() => UiState && UiState.setGlobalLoading(false));
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }

  global.ClientAccountPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch,
    handleReferenceUpdate: handleReferenceUpdate
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientAccountPanel
 * Orquestador de cuenta corriente de clientes.
 */
(function (global) {
  const ClientAccountPanel = (() => {
    function ensureDeps() {
      return global.ClientAccountPanelState
        && global.ClientAccountPanelRender
        && global.ClientAccountPanelHandlers
        && global.ClientAccountPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientAccountPanel dependencies no disponibles");
        return;
      }
      global.ClientAccountPanelRender.render();
      global.ClientAccountPanelHandlers.attachEvents();
      global.ClientAccountPanelHandlers.init();
    }

    return { render: render, handleReferenceUpdate: global.ClientAccountPanelHandlers ? global.ClientAccountPanelHandlers.handleReferenceUpdate : undefined };
  })();

  global.ClientAccountPanel = ClientAccountPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientReportPanelState
 * Estado y helpers del reporte de clientes.
 */
(function (global) {
  const state = {
    containerId: "client-report-panel",
    lastRows: [],
    clientIdMap: new Map(),
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null,
    formatClientLabel: (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getClientLabel === "function")
      ? DomainHelpers.getClientLabel
      : function (cli) {
        return cli == null ? "" : String(cli);
      }
  };

  state.setClientMap = function (clients) {
    const list = Array.isArray(clients) ? clients.slice() : [];
    state.clientIdMap = new Map();
    const labels = list
      .map((cli) => {
        if (!cli || typeof cli !== "object") return null;
        const id = cli.id != null ? String(cli.id).trim() : "";
        if (!id) return null;
        let label = state.formatClientLabel(cli);
        label = label != null ? String(label).trim() : "";
        if (!label) label = `ID: ${id}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (ID: ${id})`;
          }
        }
        state.clientIdMap.set(label, id);
        return { raw: cli, label: label };
      })
      .filter((item) => item && item.label)
      .sort((a, b) => a.label.localeCompare(b.label, "es"));

    return labels.map((item) => item.label);
  };

  state.getClientIdFromLabel = function (label) {
    if (!label) return "";

    // Primero buscar en el mapa (fuente de verdad)
    const labelStr = String(label).trim();
    if (state.clientIdMap.has(labelStr)) {
      return state.clientIdMap.get(labelStr);
    }

    // Fallback: intentar extraer del label
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }

    // Fallback: si es un número puro, usarlo
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;

    return "";
  };

  global.ClientReportPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * ClientReportPanelData
 * Capa de datos del reporte de clientes.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function loadClients() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.clientes ? refs.clientes : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando clientes", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando clientes", err);
        } else {
          console.error("Error cargando clientes:", err);
        }
        return [];
      });
  }

  function fetchReport(filters) {
    if (!ensureApi()) return Promise.resolve({ rows: [], summary: {} });
    return global.ApiService.call("getHoursByClient", filters.start, filters.end, filters.client, filters.idCliente)
      .then((res) => {
        return {
          rows: res && res.rows ? res.rows : [],
          summary: res && res.summary ? res.summary : {}
        };
      });
  }

  function generatePdf(filters) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("generateClientHoursPdf", filters.start, filters.end, filters.client, filters.idCliente);
  }

  global.ClientReportPanelData = {
    loadClients: loadClients,
    fetchReport: fetchReport,
    generatePdf: generatePdf
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientReportPanelRender
 * Render del reporte de clientes.
 */
(function (global) {
  const state = global.ClientReportPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-graph-up me-2"></i>Reporte de Clientes</h6>
          </div>
          <span class="badge text-bg-light border">Vista dedicada</span>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label small text-muted fw-bold mb-1">Cliente</label>
              <input list="client-report-client-list" id="client-report-client" class="form-control form-control-sm" placeholder="Buscar cliente...">
              <datalist id="client-report-client-list"></datalist>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Desde</label>
              <input type="date" id="client-report-start" class="form-control form-control-sm">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small text-muted fw-bold mb-1">Hasta</label>
              <input type="date" id="client-report-end" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-search">
                <i class="bi bi-search"></i> Buscar
              </button>
              <button class="btn btn-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="client-report-pdf" title="Descargar PDF">
                <i class="bi bi-file-earmark-pdf-fill"></i> PDF
              </button>
            </div>
          </div>

          <div id="client-report-loading" class="text-center py-3 d-none"></div>

          <div id="client-report-summary" class="row g-2 mb-3 d-none">
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Horas</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-hours">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Empleados</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-emps">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Días</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-days">0</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card h-100 shadow-none border bg-light text-center">
                <div class="card-body py-2 px-1">
                  <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Valor Hora</div>
                  <div class="fs-6 fw-bold mb-0 text-dark" id="client-summary-rate">$0</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="lt-metric lt-metric--dark h-100 text-center">
                <div class="card-body py-2 px-1">
                  <div class="small lt-metric__k text-uppercase" style="font-size: 0.7rem;">Total a Facturar</div>
                  <div class="fs-5 fw-bold mb-0" id="client-summary-total">$0</div>
                </div>
              </div>
            </div>
          </div>

          <div id="client-report-aggregate" class="card shadow-none border mb-3 d-none">
            <div class="card-header bg-light py-1 px-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.75rem;">Resumen por Empleado</span>
                <span class="badge bg-white text-dark border" id="client-agg-count"></span>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive lt-table-wrap">
                <table class="table table-sm mb-0 align-middle table-striped" style="font-size: 0.85rem;">
                  <thead class="table-light text-muted">
                    <tr>
                      <th class="ps-3 border-0 font-weight-normal">Empleado</th>
                      <th class="text-center border-0 font-weight-normal">Horas</th>
                      <th class="text-center border-0 font-weight-normal">Días</th>
                      <th class="text-center border-0 font-weight-normal">Registros</th>
                    </tr>
                  </thead>
                  <tbody id="client-report-agg-body"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="client-report-results" class="d-none">
            <div class="table-responsive lt-table-wrap">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="table-light">
                  <tr>
                    <th class="ps-3 py-2 text-muted font-weight-normal">Fecha</th>
                    <th class="py-2 text-muted font-weight-normal">Empleado</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                    <th class="text-center py-2 text-muted font-weight-normal">Asist.</th>
                    <th class="py-2 text-muted font-weight-normal">Observaciones</th>
                  </tr>
                </thead>
                <tbody id="client-report-tbody"></tbody>
              </table>
            </div>
          </div>

          <div id="client-report-empty" class="text-center text-muted py-4 d-none"></div>
        </div>
      </div>
    `;

    const empty = document.getElementById("client-report-empty");
    if (empty && typeof EmptyState !== "undefined" && EmptyState) {
      EmptyState.render(empty, {
        variant: "empty",
        title: "Sin registros",
        message: "Utilizá los filtros para buscar registros."
      });
    }
  }

  function renderClients(clients) {
    const datalist = document.getElementById("client-report-client-list");
    const input = document.getElementById("client-report-client");
    if (!datalist || !input) return;

    const ui = global.UIHelpers;
    const renderList = (labels) => {
      if (ui && typeof ui.renderDatalist === "function") {
        ui.renderDatalist(datalist, labels || []);
        return;
      }
      Dom && Dom.clear ? Dom.clear(datalist) : (datalist.innerHTML = "");
      (labels || []).forEach((label) => {
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    };
    renderList([]);
    input.value = "";

    const labels = state.setClientMap(clients || []);
    renderList(labels);
  }

  function renderSummary(rows, summary) {
    const box = document.getElementById("client-report-summary");
    if (!box) return;

    if (!rows || rows.length === 0) {
      box.classList.add("d-none");
      return;
    }

    const totals = {
      totalHoras: 0,
      empleados: 0,
      dias: 0,
      valorHora: 0,
      totalFacturacion: 0,
      ...(summary || {})
    };

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("client-summary-hours", Formatters.formatNumber(totals.totalHoras, 2));
    setText("client-summary-emps", Formatters.formatNumber(totals.empleados, 0));
    setText("client-summary-days", Formatters.formatNumber(totals.dias, 0));
    setText("client-summary-rate", Formatters.formatCurrency(totals.valorHora));
    setText("client-summary-total", Formatters.formatCurrency(totals.totalFacturacion));

    box.classList.remove("d-none");
  }

  function renderAggregate(rows) {
    const wrapper = document.getElementById("client-report-aggregate");
    const tbody = document.getElementById("client-report-agg-body");
    const countBadge = document.getElementById("client-agg-count");
    if (!wrapper || !tbody) return;

    Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");

    if (!rows || rows.length === 0) {
      wrapper.classList.add("d-none");
      if (countBadge) countBadge.textContent = "";
      return;
    }

    const aggMap = new Map();
    rows.forEach((r) => {
      const key = r.empleado || "Sin empleado";
      const entry = aggMap.get(key) || { horas: 0, dias: new Set(), registros: 0 };
      const h = Number(r.horas);
      entry.horas += isNaN(h) ? 0 : h;
      if (r.fecha) entry.dias.add(r.fecha);
      entry.registros += 1;
      aggMap.set(key, entry);
    });

    const list = Array.from(aggMap.entries())
      .map(([empleado, info]) => ({
        empleado: empleado,
        horas: info.horas,
        dias: info.dias.size,
        registros: info.registros
      }))
      .sort((a, b) => b.horas - a.horas);

    list.forEach((item) => {
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: item.empleado || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(item.horas, 2) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatNumber(item.dias, 0) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatNumber(item.registros, 0) })
      ]);
      tbody.appendChild(tr);
    });

    if (countBadge) countBadge.textContent = list.length + " empleados";
    wrapper.classList.remove("d-none");
  }

  function renderTable(rows) {
    const tbody = document.getElementById("client-report-tbody");
    const results = document.getElementById("client-report-results");
    const empty = document.getElementById("client-report-empty");
    if (!tbody || !results || !empty) return;

    if (!rows || rows.length === 0) {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      results.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, {
          variant: "empty",
          title: "Sin registros",
          message: "No hay datos para los filtros seleccionados."
        });
      }
      return;
    }

    const buildBadge_ = (label, className) => {
      const ui = global.UIHelpers;
      if (ui && typeof ui.badge === "function") {
        return ui.badge(label, { className: className });
      }
      return Dom.el("span", { className: className, text: label });
    };

    const renderRow = (r) => {
      const tr = Dom.el("tr");
      if (r.asistencia === false) {
        tr.classList.add("table-warning");
      }
      const badge = buildBadge_(
        r.asistencia === false ? "No" : "Sí",
        r.asistencia === false
          ? "badge bg-danger-subtle text-danger"
          : "badge bg-success-subtle text-success"
      );
      tr.appendChild(Dom.el("td", { text: r.fecha || "" }));
      tr.appendChild(Dom.el("td", { text: r.empleado || "" }));
      tr.appendChild(Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(r.horas, 2) }));
      tr.appendChild(Dom.el("td", { className: "text-center" }, badge));
      tr.appendChild(Dom.el("td", { className: "text-muted small", text: r.observaciones || "-" }));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, { chunkSize: 150 });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((r) => {
        tbody.appendChild(renderRow(r));
      });
    }

    results.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("client-report-loading");
    const results = document.getElementById("client-report-results");
    const empty = document.getElementById("client-report-empty");

    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Procesando..." });
      }
    }
    if (show) {
      if (results) results.classList.add("d-none");
      if (empty) empty.classList.add("d-none");
    }
  }

  global.ClientReportPanelRender = {
    render: render,
    renderClients: renderClients,
    renderSummary: renderSummary,
    renderAggregate: renderAggregate,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientReportPanelHandlers
 * Eventos del reporte de clientes.
 */
(function (global) {
  const state = global.ClientReportPanelState;

  function ensureDeps() {
    return state && global.ClientReportPanelData && global.ClientReportPanelRender;
  }

  function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById("client-report-start");
    const endInput = document.getElementById("client-report-end");
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = lastDay;
  }

  function init() {
    if (!ensureDeps()) return;
    setDefaultDates();
    global.ClientReportPanelData.loadClients().then((clients) => {
      global.ClientReportPanelRender.renderClients(clients || []);
    });
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("client-report-search"), "click", handleSearch);
    on(document.getElementById("client-report-pdf"), "click", handleExportPdf);
    on(document.getElementById("client-report-csv"), "click", handleExportCsv);
  }

  function getFilters() {
    const start = document.getElementById("client-report-start");
    const end = document.getElementById("client-report-end");
    const client = document.getElementById("client-report-client");

    return {
      start: start ? start.value : "",
      end: end ? end.value : "",
      client: client ? client.value : ""
    };
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const filters = getFilters();
    console.log("[ClientReport] handleSearch - filters:", filters);

    if (!filters.client) {
      Alerts && Alerts.showAlert("Seleccioná un cliente para consultar", "warning");
      return;
    }

    const idCliente = state.getClientIdFromLabel(filters.client);
    console.log("[ClientReport] handleSearch - idCliente extracted:", idCliente);
    console.log("[ClientReport] handleSearch - clientIdMap:", Array.from(state.clientIdMap.entries()));

    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    global.ClientReportPanelRender.toggleLoading(true);

    const requestParams = {
      start: filters.start,
      end: filters.end,
      client: filters.client,
      idCliente: idCliente
    };
    console.log("[ClientReport] handleSearch - calling fetchReport with:", requestParams);

    global.ClientReportPanelData.fetchReport(requestParams)
      .then((res) => {
        console.log("[ClientReport] handleSearch - response:", res);
        const rows = res && res.rows ? res.rows : [];
        const summary = res && res.summary ? res.summary : {};
        state.lastRows = rows;
        global.ClientReportPanelRender.renderSummary(rows, summary);
        global.ClientReportPanelRender.renderTable(rows);
        global.ClientReportPanelRender.renderAggregate(rows);
      })
      .catch((err) => {
        console.error("[ClientReport] handleSearch - error:", err);
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("No se pudo cargar el reporte", err);
        } else {
          console.error("Error en reporte de clientes:", err);
          Alerts && Alerts.showAlert("No se pudo cargar el reporte", "danger");
        }
      })
      .finally(() => global.ClientReportPanelRender.toggleLoading(false));
  }

  function handleExportPdf() {
    if (!ensureDeps()) return;
    const filters = getFilters();
    console.log("[ClientReport] handleExportPdf - filters obtenidos:", filters);

    if (!filters.client) {
      Alerts && Alerts.showAlert("Seleccioná un cliente para exportar", "warning");
      return;
    }
    if (!state.lastRows || state.lastRows.length === 0) {
      Alerts && Alerts.showAlert("Generá primero el reporte para descargarlo.", "info");
      return;
    }

    const idCliente = state.getClientIdFromLabel(filters.client);
    console.log("[ClientReport] handleExportPdf - idCliente extraído:", idCliente);
    console.log("[ClientReport] handleExportPdf - clientIdMap:", Array.from(state.clientIdMap.entries()));

    if (!idCliente) {
      Alerts && Alerts.showAlert("Seleccioná un cliente válido de la lista.", "warning");
      return;
    }

    const btn = document.getElementById("client-report-pdf");
    const ui = global.UIHelpers;
    if (btn && ui && typeof ui.withSpinner === "function") {
      ui.withSpinner(btn, true, "Descargando...");
    }

    // Extraer nombre limpio del cliente quitando metadatos (ID: XX, CUIT, etc)
    const cleanClientName = filters.client.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    console.log("[ClientReport] handleExportPdf - nombre limpio extraído:", cleanClientName);

    const pdfParams = {
      start: filters.start,
      end: filters.end,
      client: cleanClientName,  // Usar el nombre limpio sin metadatos
      idCliente: idCliente
    };
    console.log("[ClientReport] handleExportPdf - llamando generatePdf con:", pdfParams);

    UiState && UiState.setGlobalLoading(true, "Generando PDF...");
    global.ClientReportPanelData.generatePdf(pdfParams)
      .then((res) => {
        if (!res || !res.base64) throw new Error("No se pudo generar PDF");
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64," + res.base64;
        link.download = res.filename || "reporte_cliente.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error generando PDF", err);
        } else {
          Alerts && Alerts.showAlert("Error generando PDF", "danger");
        }
      })
      .finally(() => {
        UiState && UiState.setGlobalLoading(false);
        if (btn && ui && typeof ui.withSpinner === "function") {
          ui.withSpinner(btn, false);
        }
      });
  }

  function handleExportCsv() {
    if (!state.lastRows || state.lastRows.length === 0) {
      Alerts && Alerts.showAlert("Nada para exportar. Buscá primero.", "info");
      return;
    }

    const headers = ["Fecha", "Cliente", "Empleado", "Horas", "Asistencia", "Observaciones"];
    const rows = state.lastRows.map((r) => [
      r.fecha || "",
      '"' + String(r.cliente || "").replace(/"/g, '""') + '"',
      '"' + String(r.empleado || "").replace(/"/g, '""') + '"',
      Number(r.horas || 0),
      r.asistencia === false ? "No" : "Si",
      '"' + String(r.observaciones || "").replace(/"/g, '""') + '"'
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte_cliente_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  global.ClientReportPanelHandlers = {
    init: init,
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);


/**
 * ClientReportPanel
 * Orquestador del reporte de clientes.
 */
(function (global) {
  const ClientReportPanel = (() => {
    function ensureDeps() {
      return global.ClientReportPanelState
        && global.ClientReportPanelRender
        && global.ClientReportPanelHandlers
        && global.ClientReportPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("ClientReportPanel dependencies no disponibles");
        return;
      }
      global.ClientReportPanelRender.render();
      global.ClientReportPanelHandlers.attachEvents();
      global.ClientReportPanelHandlers.init();
    }

    return { render: render };
  })();

  global.ClientReportPanel = ClientReportPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * MonthlySummaryPanelState
 */
(function (global) {
  const state = {
    containerId: "monthly-summary-panel",
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null
  };

  global.MonthlySummaryPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * MonthlySummaryPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function fetchSummary(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getMonthlySummary", Number(year), Number(month));
  }

  global.MonthlySummaryPanelData = {
    fetchSummary: fetchSummary
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MonthlySummaryPanelRender
 */
(function (global) {
  const state = global.MonthlySummaryPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-calendar3 me-2"></i>Resumen Mensual</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Mes</label>
              <input type="month" id="ms-month" class="form-control form-control-sm">
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" id="ms-search">
                <i class="bi bi-search"></i> Consultar
              </button>
            </div>
          </div>

          <div id="ms-loading" class="text-center py-3 d-none"></div>
          <div id="ms-empty" class="text-center text-muted py-4 d-none"></div>
          <div class="table-responsive border rounded d-none" id="ms-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="bg-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Horas</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Valor Hora</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Viáticos</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Presentismo</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Adelantos</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Total</th>
                  <th class="text-end py-2 pe-3 text-muted font-weight-normal">Acciones</th>
                </tr>
              </thead>
              <tbody id="ms-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const monthInput = document.getElementById("ms-month");
    if (monthInput) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById("ms-tbody");
    const wrapper = document.getElementById("ms-table-wrapper");
    const empty = document.getElementById("ms-empty");

    if (!tbody || !wrapper || !empty) return;

    if (!rows || !rows.length) {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      wrapper.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, { variant: "empty", title: "Sin datos", message: "Sin datos para el mes seleccionado." });
      }
      return;
    }

    const renderRow = (row) => {
      const tr = Dom.el("tr", null, [
        Dom.el("td", { text: row.empleado || "" }),
        Dom.el("td", { className: "text-center fw-bold", text: Formatters.formatNumber(row.horas, 2) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.valorHora) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.viaticos) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(row.presentismo) }),
        Dom.el("td", { className: "text-center text-danger", text: Formatters.formatCurrency(row.adelantos) }),
        Dom.el("td", { className: "text-center fw-bold text-success", text: Formatters.formatCurrency(row.totalNeto) })
      ]);
      const detailBtn = Dom.el("button", {
        className: "btn btn-sm btn-outline-primary ms-view-detail",
        dataset: { emp: row.empleado || "" }
      }, [
        Dom.el("i", { className: "bi bi-eye" }),
        Dom.text(" Detalle")
      ]);
      tr.appendChild(Dom.el("td", { className: "text-end" }, detailBtn));
      return tr;
    };

    const ui = global.UIHelpers;
    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, { chunkSize: 150 });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((row) => {
        tbody.appendChild(renderRow(row));
      });
    }

    wrapper.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("ms-loading");
    const empty = document.getElementById("ms-empty");
    const wrapper = document.getElementById("ms-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Calculando..." });
      }
    }
    if (wrapper && show) wrapper.classList.add("d-none");
    if (empty && show) empty.classList.add("d-none");
  }

  global.MonthlySummaryPanelRender = {
    render: render,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MonthlySummaryPanelHandlers
 */
(function (global) {
  const state = global.MonthlySummaryPanelState;

  function ensureDeps() {
    return state && global.MonthlySummaryPanelData && global.MonthlySummaryPanelRender;
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("ms-search"), "click", handleSearch);
    const tbody = document.getElementById("ms-tbody");
    on(tbody, "click", handleDetailClick);
  }

  function handleSearch() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("ms-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) {
      Alerts && Alerts.showAlert("Selecciona un mes", "warning");
      return;
    }
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.MonthlySummaryPanelRender.toggleLoading(true);
    global.MonthlySummaryPanelData.fetchSummary(y, m)
      .then((rows) => {
        global.MonthlySummaryPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error al calcular resumen", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error al calcular resumen", "danger");
        }
      })
      .finally(() => global.MonthlySummaryPanelRender.toggleLoading(false));
  }

  function handleDetailClick(event) {
    const btn = event.target.closest(".ms-view-detail");
    if (!btn) return;
    const emp = btn.getAttribute("data-emp") || "";
    if (!emp) return;

    const monthInput = document.getElementById("ms-month");
    const val = monthInput ? monthInput.value : "";
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];
    const start = `${y}-${m}-01`;
    const end = new Date(Number(y), Number(m), 0);
    const endStr = `${y}-${m}-${String(end.getDate()).padStart(2, "0")}`;

    const eventChange = new CustomEvent("view-change", { detail: { view: "reportes" } });
    document.dispatchEvent(eventChange);

    setTimeout(() => {
      const empInput = document.getElementById("hours-filter-employee");
      const startInput = document.getElementById("hours-filter-start");
      const endInput = document.getElementById("hours-filter-end");
      if (empInput) empInput.value = emp;
      if (startInput) startInput.value = start;
      if (endInput) endInput.value = endStr;
      const btnSearch = document.getElementById("btn-search-hours");
      if (btnSearch) btnSearch.click();
    }, 200);
  }

  global.MonthlySummaryPanelHandlers = {
    attachEvents: attachEvents,
    handleSearch: handleSearch
  };
})(typeof window !== "undefined" ? window : this);


/**
 * MonthlySummaryPanel
 */
(function (global) {
  const MonthlySummaryPanel = (() => {
    function ensureDeps() {
      return global.MonthlySummaryPanelState
        && global.MonthlySummaryPanelRender
        && global.MonthlySummaryPanelHandlers
        && global.MonthlySummaryPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("MonthlySummaryPanel dependencies no disponibles");
        return;
      }
      global.MonthlySummaryPanelRender.render();
      global.MonthlySummaryPanelHandlers.attachEvents();
    }

    return { render: render };
  })();

  global.MonthlySummaryPanel = MonthlySummaryPanel;
})(typeof window !== "undefined" ? window : this);


/**
 * AccountStatementPanelState
 */
(function (global) {
  const state = {
    containerId: "account-statement-panel",
    defaultPaymentMethods: ["Uala", "Mercado Pago", "Efectivo", "Santander"],
    employeeIdMap: new Map(),
    eventsController: null,
    Dom: (typeof DomHelpers !== "undefined" && DomHelpers) ? DomHelpers : null
  };

  state.getPaymentMethods = function () {
    if (typeof DropdownConfig !== "undefined" && DropdownConfig && typeof DropdownConfig.getOptions === "function") {
      const list = DropdownConfig.getOptions("MEDIO DE PAGO", state.defaultPaymentMethods);
      if (Array.isArray(list) && list.length) return list;
    }
    return state.defaultPaymentMethods.slice();
  };

  state.setEmployeeMap = function (employees) {
    const list = Array.isArray(employees) ? employees.slice() : [];
    state.employeeIdMap = new Map();
    const labels = list
      .map((emp) => {
        if (!emp || typeof emp !== "object") return "";
        const id = emp.id || emp.ID || emp.ID_EMPLEADO;
        const idStr = id != null ? String(id).trim() : "";
        if (!idStr) return "";
        let label = (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.getEmployeeLabel === "function")
          ? DomainHelpers.getEmployeeLabel(emp)
          : (emp.nombre || emp.empleado || "");
        label = label != null ? String(label).trim() : "";
        if (!label) label = `#${idStr}`;
        if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
          if (!DomainHelpers.extractIdFromLabel(label)) {
            label = `${label} (#${idStr})`;
          }
        }
        state.employeeIdMap.set(label, idStr);
        return label;
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
    return labels;
  };

  state.getEmployeeIdFromLabel = function (label) {
    if (!label) return "";
    if (typeof DomainHelpers !== "undefined" && DomainHelpers && typeof DomainHelpers.extractIdFromLabel === "function") {
      const extracted = DomainHelpers.extractIdFromLabel(label);
      if (extracted) return extracted;
    }
    const plain = String(label).trim();
    if (/^\\d+$/.test(plain)) return plain;
    return "";
  };

  global.AccountStatementPanelState = state;
})(typeof window !== "undefined" ? window : this);


/**
 * AccountStatementPanelData
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function ensureReference() {
    return global.ReferenceService && typeof global.ReferenceService.ensureLoaded === "function";
  }

  function fetchStatement(year, month) {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getEmployeeAccountStatement", Number(year), Number(month));
  }

  function loadEmployees() {
    if (!ensureReference()) {
      console.warn("ReferenceService.ensureLoaded no disponible");
      return Promise.resolve([]);
    }
    return global.ReferenceService.ensureLoaded()
      .then(() => {
        const refs = global.ReferenceService.get();
        return refs && refs.empleados ? refs.empleados : [];
      })
      .catch((err) => {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("Error cargando empleados", err);
        } else if (Alerts && Alerts.showError) {
          Alerts.showError("Error cargando empleados", err);
        } else {
          console.error("Error cargando empleados:", err);
        }
        return [];
      });
  }

  function recordPayment(payload) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call(
      "recordEmployeePayment",
      payload.fecha,
      payload.empleado,
      payload.concepto,
      payload.monto,
      payload.medioPago,
      payload.observaciones
    );
  }

  global.AccountStatementPanelData = {
    fetchStatement: fetchStatement,
    loadEmployees: loadEmployees,
    recordPayment: recordPayment
  };
})(typeof window !== "undefined" ? window : this);


/**
 * AccountStatementPanelRender
 */
(function (global) {
  const state = global.AccountStatementPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function render() {
    if (!state) return;
    const container = document.getElementById(state.containerId);
    if (!container) return;

    // safe static: layout fijo sin datos externos.
    container.innerHTML = `
      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 text-primary fw-bold"><i class="bi bi-journal-text me-2"></i>Cuenta Corriente Empleados</h6>
          </div>
        </div>
        <div class="card-body p-3">
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small text-muted fw-bold mb-1">Mes</label>
              <input type="month" id="acc-month" class="form-control form-control-sm">
            </div>
            <div class="col-md-4 d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1" id="acc-refresh" title="Actualizar">
                <i class="bi bi-arrow-repeat"></i>
              </button>
              <button class="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1" id="acc-new-payment">
                <i class="bi bi-cash-coin"></i> Registrar pago
              </button>
            </div>
          </div>

          <div id="acc-loading" class="text-center py-3 d-none"></div>
          <div id="acc-empty" class="text-center text-muted py-4 d-none"></div>
          <div class="table-responsive border rounded d-none" id="acc-table-wrapper">
            <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="bg-light">
                <tr>
                  <th class="ps-3 py-2 text-muted font-weight-normal">Empleado</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Debe (neto)</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Haber (pagos+adelantos)</th>
                  <th class="text-center py-2 text-muted font-weight-normal">Saldo</th>
                </tr>
              </thead>
              <tbody id="acc-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const monthInput = document.getElementById("acc-month");
    if (monthInput) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }
  }

  function renderTable(rows) {
    const tbody = document.getElementById("acc-tbody");
    const wrapper = document.getElementById("acc-table-wrapper");
    const empty = document.getElementById("acc-empty");
    if (!tbody || !wrapper || !empty) return;

    if (!rows || !rows.length) {
      const progressEl = document.getElementById("acc-render-progress");
      if (progressEl) progressEl.remove();
      wrapper.classList.add("d-none");
      empty.classList.remove("d-none");
      if (typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(empty, {
          variant: "empty",
          title: "Sin movimientos",
          message: "Sin movimientos para el mes seleccionado."
        });
      }
      return;
    }

    const ui = global.UIHelpers;
    const progressId = "acc-render-progress";
    let progressEl = document.getElementById(progressId);
    const host = wrapper.parentElement || wrapper;
    if (!progressEl) {
      progressEl = Dom.el("div", { id: progressId, className: "small text-muted py-2" });
      host.insertBefore(progressEl, wrapper);
    }
    progressEl.textContent = "Renderizando...";
    progressEl.classList.remove("d-none");

    const renderRow = (r) => {
      const saldoClass = Number(r.saldo) >= 0 ? "text-success" : "text-danger";
      return Dom.el("tr", null, [
        Dom.el("td", { text: r.empleado || "" }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(r.debe) }),
        Dom.el("td", { className: "text-center", text: Formatters.formatCurrency(r.haber) }),
        Dom.el("td", { className: "text-center fw-bold " + saldoClass, text: Formatters.formatCurrency(r.saldo) })
      ]);
    };

    const finish = () => {
      if (progressEl) progressEl.remove();
    };

    if (ui && typeof ui.renderChunks === "function") {
      ui.renderChunks(tbody, rows, renderRow, {
        chunkSize: 150,
        onProgress: (done, total) => {
          if (progressEl) {
            progressEl.textContent = `Renderizando ${done} de ${total} registros...`;
          }
        },
        onDone: finish
      });
    } else {
      Dom && Dom.clear ? Dom.clear(tbody) : (tbody.innerHTML = "");
      rows.forEach((r) => {
        const tr = renderRow(r);
        if (tr) tbody.appendChild(tr);
      });
      finish();
    }

    wrapper.classList.remove("d-none");
    empty.classList.add("d-none");
  }

  function toggleLoading(show) {
    const loading = document.getElementById("acc-loading");
    const empty = document.getElementById("acc-empty");
    const wrapper = document.getElementById("acc-table-wrapper");
    if (loading) {
      loading.classList.toggle("d-none", !show);
      if (show && typeof EmptyState !== "undefined" && EmptyState) {
        EmptyState.render(loading, { variant: "loading", message: "Cargando..." });
      }
    }
    if (wrapper && show) wrapper.classList.add("d-none");
    if (empty && show) empty.classList.add("d-none");
  }

  global.AccountStatementPanelRender = {
    render: render,
    renderTable: renderTable,
    toggleLoading: toggleLoading
  };
})(typeof window !== "undefined" ? window : this);


/**
 * AccountStatementPanelHandlers
 */
(function (global) {
  const state = global.AccountStatementPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function ensureDeps() {
    return state && global.AccountStatementPanelData && global.AccountStatementPanelRender;
  }

  function attachEvents() {
    if (!ensureDeps()) return;
    if (state.eventsController) {
      state.eventsController.abort();
    }
    state.eventsController = new AbortController();
    const signal = state.eventsController.signal;
    const on = (el, evt, handler) => {
      if (!el) return;
      el.addEventListener(evt, handler, { signal });
    };

    on(document.getElementById("acc-refresh"), "click", loadData);
    on(document.getElementById("acc-new-payment"), "click", openPaymentModal);
  }

  function loadData() {
    if (!ensureDeps()) return;
    const monthInput = document.getElementById("acc-month");
    const val = monthInput ? monthInput.value : "";
    if (!val) return;
    const parts = val.split("-");
    const y = parts[0];
    const m = parts[1];

    global.AccountStatementPanelRender.toggleLoading(true);
    global.AccountStatementPanelData.fetchStatement(y, m)
      .then((rows) => {
        global.AccountStatementPanelRender.renderTable(rows || []);
      })
      .catch((err) => {
        if (Alerts && typeof Alerts.showError === "function") {
          Alerts.showError("Error cuenta corriente", err);
        } else {
          console.error(err);
          Alerts && Alerts.showAlert("Error cuenta corriente", "danger");
        }
      })
      .finally(() => global.AccountStatementPanelRender.toggleLoading(false));
  }

  function openPaymentModal() {
    if (!ensureDeps()) return;
    const existing = document.getElementById("acc-payment-modal");
    if (existing) existing.remove();

    const modalEl = Dom.el("div", { className: "modal fade", id: "acc-payment-modal", tabIndex: "-1" },
      Dom.el("div", { className: "modal-dialog" },
        Dom.el("div", { className: "modal-content" }, [
          Dom.el("div", { className: "modal-header" }, [
            Dom.el("h5", { className: "modal-title", text: "Registrar pago a empleado" }),
            Dom.el("button", { type: "button", className: "btn-close", dataset: { bsDismiss: "modal" }, "aria-label": "Close" })
          ]),
          Dom.el("div", { className: "modal-body" }, [
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Empleado" }),
              Dom.el("input", { list: "acc-emp-list", id: "acc-pay-emp", className: "form-control", placeholder: "Empleado" }),
              Dom.el("datalist", { id: "acc-emp-list" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Fecha" }),
              Dom.el("input", { type: "date", id: "acc-pay-fecha", className: "form-control", value: getToday() })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Concepto" }),
              Dom.el("input", { type: "text", id: "acc-pay-concepto", className: "form-control", value: "Pago mensual" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Monto" }),
              Dom.el("input", { type: "number", step: "0.01", id: "acc-pay-monto", className: "form-control" })
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Medio de pago" }),
              Dom.el("select", { id: "acc-pay-medio", className: "form-select" }, [
                Dom.el("option", { value: "", text: "Seleccionar..." })
              ])
            ]),
            Dom.el("div", { className: "mb-3" }, [
              Dom.el("label", { className: "form-label small text-muted", text: "Observaciones" }),
              Dom.el("textarea", { id: "acc-pay-obs", className: "form-control", rows: "2" })
            ])
          ]),
          Dom.el("div", { className: "modal-footer" }, [
            Dom.el("button", { type: "button", className: "btn btn-secondary", dataset: { bsDismiss: "modal" }, text: "Cancelar" }),
            Dom.el("button", { type: "button", className: "btn btn-primary", id: "acc-pay-save", text: "Guardar" })
          ])
        ])
      )
    );

    document.body.appendChild(modalEl);

    const medioSelect = document.getElementById("acc-pay-medio");
    if (medioSelect) {
      state.getPaymentMethods().forEach((method) => {
        const opt = document.createElement("option");
        opt.value = method;
        opt.textContent = method;
        medioSelect.appendChild(opt);
      });
    }

    global.AccountStatementPanelData.loadEmployees().then((emps) => {
      const datalist = document.getElementById("acc-emp-list");
      if (!datalist) return;
      datalist.innerHTML = "";
      const labels = state.setEmployeeMap ? state.setEmployeeMap(emps || []) : [];
      labels.forEach((label) => {
        if (!label) return;
        const opt = document.createElement("option");
        opt.value = label;
        datalist.appendChild(opt);
      });
    });

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const saveBtn = document.getElementById("acc-pay-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const emp = document.getElementById("acc-pay-emp")?.value || "";
        const idEmpleado = state.getEmployeeIdFromLabel ? state.getEmployeeIdFromLabel(emp) : "";
        const fecha = document.getElementById("acc-pay-fecha")?.value || "";
        const concepto = document.getElementById("acc-pay-concepto")?.value || "";
        const monto = document.getElementById("acc-pay-monto")?.value || "";
        const medioPago = document.getElementById("acc-pay-medio")?.value || "";
        const obs = document.getElementById("acc-pay-obs")?.value || "";

        if (!emp || !monto) {
          Alerts && Alerts.showAlert("Empleado y monto son requeridos", "warning");
          return;
        }
        if (!idEmpleado) {
          Alerts && Alerts.showAlert("Seleccioná un empleado válido de la lista.", "warning");
          return;
        }

        UiState && UiState.setGlobalLoading(true, "Guardando pago...");
        global.AccountStatementPanelData.recordPayment({
          empleado: emp,
          idEmpleado: idEmpleado,
          fecha: fecha,
          concepto: concepto,
          monto: monto,
          medioPago: medioPago,
          observaciones: obs
        })
          .then(() => {
            Alerts && Alerts.showAlert("Pago registrado", "success");
            modal.hide();
            modalEl.remove();
            loadData();
          })
          .catch((err) => {
            if (Alerts && typeof Alerts.showError === "function") {
              Alerts.showError("Error al guardar pago", err);
            } else {
              Alerts && Alerts.showAlert("Error al guardar pago", "danger");
            }
          })
          .finally(() => {
            UiState && UiState.setGlobalLoading(false);
          });
      });
    }

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }

  function getToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  global.AccountStatementPanelHandlers = {
    attachEvents: attachEvents,
    loadData: loadData,
    openPaymentModal: openPaymentModal
  };
})(typeof window !== "undefined" ? window : this);


/**
 * AccountStatementPanel
 */
(function (global) {
  const AccountStatementPanel = (() => {
    function ensureDeps() {
      return global.AccountStatementPanelState
        && global.AccountStatementPanelRender
        && global.AccountStatementPanelHandlers
        && global.AccountStatementPanelData;
    }

    function render() {
      if (!ensureDeps()) {
        console.error("AccountStatementPanel dependencies no disponibles");
        return;
      }
      global.AccountStatementPanelRender.render();
      global.AccountStatementPanelHandlers.attachEvents();
      global.AccountStatementPanelHandlers.loadData();
    }

    return { render: render };
  })();

  global.AccountStatementPanel = AccountStatementPanel;
})(typeof window !== "undefined" ? window : this);


(function (global) {
    function applyMassValues(payload) {
        if (!global.ApiService || typeof global.ApiService.call !== "function") {
            return Promise.reject(new Error("ApiService no disponible"));
        }
        return global.ApiService.call("applyMassValues", payload)
            .then(() => {
                if (global.RecordsData && typeof global.RecordsData.refreshReferenceData === "function") {
                    return global.RecordsData.refreshReferenceData();
                }
                return null;
            });
    }

    global.BulkValuesData = {
        applyMassValues: applyMassValues
    };
})(typeof window !== "undefined" ? window : this);


/**
 * Panel de Valores Masivos (empleados/clientes/viáticos/presentismo)
 */
var BulkValuesPanel = (function () {
    const containerId = 'bulk-values-panel';
    let eventsController = null;
    const Dom = window.DomHelpers;

    function render() {
        const container = document.getElementById(containerId);
        if (!container || !Dom) return;

        Dom.clear(container);
        container.appendChild(buildCard());
        bindEvents(container);
    }

    function bindEvents(container) {
        if (!container) return;
        if (eventsController) {
            eventsController.abort();
        }
        eventsController = new AbortController();
        const signal = eventsController.signal;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('#bulk-apply-btn');
            if (!btn || !container.contains(btn)) return;
            applyValues();
        }, { signal });
    }

    function buildCard() {
        return Dom.el('div', { className: 'card shadow-sm border-0' }, [
            Dom.el('div', { className: 'card-header bg-white py-3' }, [
                Dom.el('h5', { className: 'mb-0 text-primary' }, [
                    Dom.el('i', { className: 'bi bi-sliders me-2' }),
                    'Valores masivos'
                ]),
                Dom.el('small', {
                    className: 'text-muted',
                    text: 'Actualiza en bloque valores de empleados y clientes.'
                })
            ]),
            Dom.el('div', { className: 'card-body' }, [
                Dom.el('div', { className: 'row g-3' }, [
                    buildInputCol('bulk-valor-hora-emp', 'Valor hora (empleados)', 'Ej: 2500'),
                    buildInputCol('bulk-valor-hora-cli', 'Valor hora (clientes)', 'Ej: 3000'),
                    buildInputCol('bulk-viaticos', 'Viáticos (empleados)', 'Ej: 500'),
                    buildInputCol('bulk-pres-media', 'Presentismo media jornada', 'Ej: 1000'),
                    buildInputCol('bulk-pres-full', 'Presentismo jornada completa', 'Ej: 1500'),
                    buildInputCol('bulk-iva', 'IVA (%)', 'Ej: 21')
                ]),
                Dom.el('div', { className: 'd-flex justify-content-end mt-4' },
                    Dom.el('button', {
                        className: 'btn btn-primary',
                        id: 'bulk-apply-btn',
                        type: 'button'
                    }, [
                        Dom.el('i', { className: 'bi bi-arrow-repeat me-2' }),
                        'Aplicar masivo'
                    ])
                )
            ])
        ]);
    }

    function buildInputCol(id, labelText, placeholder) {
        return Dom.el('div', { className: 'col-md-3' }, [
            Dom.el('label', {
                className: 'form-label small text-muted fw-semibold',
                for: id,
                text: labelText
            }),
            Dom.el('input', {
                type: 'number',
                step: '0.01',
                className: 'form-control',
                id: id,
                placeholder: placeholder || ''
            })
        ]);
    }

    function applyValues() {
        const payload = {
            valorHoraEmpleado: getInputValue('bulk-valor-hora-emp'),
            valorHoraCliente: getInputValue('bulk-valor-hora-cli'),
            viaticos: getInputValue('bulk-viaticos'),
            presentismoMedia: getInputValue('bulk-pres-media'),
            presentismoCompleta: getInputValue('bulk-pres-full'),
            ivaPorcentaje: getInputValue('bulk-iva')
        };

        UiState && UiState.setGlobalLoading(true, 'Aplicando valores...');

        const data = global.BulkValuesData;
        if (!data || typeof data.applyMassValues !== 'function') {
            Alerts && Alerts.showAlert('No se pudo aplicar valores: servicio no disponible.', 'danger');
            UiState && UiState.setGlobalLoading(false);
            return;
        }
        data.applyMassValues(payload)
            .then((refData) => {
                Alerts && Alerts.showAlert('Valores actualizados masivamente.', 'success');
                if (FormManager && refData) {
                    FormManager.updateReferenceData(refData);
                }
            })
            .catch(err => {
                Alerts && Alerts.showAlert('Error al aplicar valores: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        const v = el.value;
        return v === '' ? '' : v;
    }

    return {
        render
    };
})();


/**
 * Form Manager
 * Gestiona la carga, renderizado y configuración de formularios
 */

(function (global) {
    const FormManager = (() => {
        let currentFormat = null;
        let referenceData = { clientes: [], empleados: [] };
        let eventsController = null;
        const Dom = global.DomHelpers;
        const RecordsData = global.RecordsData || null;

        function resetEventsController() {
            if (eventsController) {
                eventsController.abort();
            }
            eventsController = new AbortController();
        }

        function bindEvent(el, evt, handler, opts) {
            if (!el) return;
            if (!eventsController) {
                eventsController = new AbortController();
            }
            const options = Object.assign({}, opts || {});
            if (eventsController && eventsController.signal) {
                options.signal = eventsController.signal;
            }
            el.addEventListener(evt, handler, options);
        }

        /**
         * Inicializa el form manager con datos de referencia
         */
        function init(refData) {
            referenceData = refData || { clientes: [], empleados: [] };
        }

        /**
         * Carga los formatos disponibles desde el servidor
         */
        function loadFormats() {
            if (!RecordsData || typeof RecordsData.getAvailableFormats !== "function") {
                renderFormatsOptions(buildLocalFormats());
                if (Alerts) Alerts.showAlert("No pudimos cargar los formatos del servidor. Se usan formatos locales.", "warning");
                return Promise.resolve();
            }
            return RecordsData.getAvailableFormats()
                .then(function (formats) {
                    if (!Array.isArray(formats) || !formats.length) {
                        renderFormatsOptions(buildLocalFormats());
                        if (Alerts) Alerts.showAlert("No pudimos cargar los formatos del servidor. Se usan formatos locales.", "warning");
                        return;
                    }
                    renderFormatsOptions(formats);
                })
                .catch(function (err) {
                    console.error("Error obteniendo formatos:", err);
                    renderFormatsOptions(buildLocalFormats());
                    if (Alerts) Alerts.showAlert("No pudimos cargar los formatos. Usando definiciones locales.", "warning");
                });
        }

        /**
         * Construye formatos desde definiciones locales
         */
        function buildLocalFormats() {
            const hidden = new Set(['FACTURACION', 'PAGOS', 'PAGOS_CLIENTES']);
            return Object.keys(FORM_DEFINITIONS)
                .filter(function (id) { return !hidden.has(id); })
                .map(function (id) {
                    return { id: id, name: FORM_DEFINITIONS[id].title || id };
                });
        }

        /**
         * Renderiza las opciones del selector de formatos
         */
        function renderFormatsOptions(formats) {
            if (!Array.isArray(formats)) return;
            const select = document.getElementById("formato");
            if (!select) return;

            Dom.clear(select);
            formats.forEach(function (f) {
                select.appendChild(Dom.el("option", { value: f.id, text: f.name }));
            });

            if (formats.length > 0) {
                currentFormat = formats[0].id;
                select.value = currentFormat;
                renderForm(currentFormat);
            }
        }

        /**
         * Renderiza un formulario específico
         * @param {string} tipoFormato - Tipo de formato a renderizar
         * @param {string} containerId - ID del contenedor (opcional, por defecto "form-fields")
         */
        function renderForm(tipoFormato, containerId) {
            currentFormat = tipoFormato;
            resetEventsController();

            if (Alerts) Alerts.clearAlerts();

            const formDef = FORM_DEFINITIONS[tipoFormato];
            const container = document.getElementById(containerId || "form-fields");
            const titleEl = document.getElementById("form-title");
            const sugg = document.getElementById("search-suggestions");

            // Restaurar footer del modal por si fue ocultado
            const modalFooter = document.querySelector('.modal-footer-custom');
            if (modalFooter) modalFooter.style.display = '';

            if (!container) {
                console.error("Container not found:", containerId || "form-fields");
                return;
            }

            // Renderizado custom para asistencia diaria
            if (tipoFormato === "ASISTENCIA" && global.AttendanceDailyUI) {
                Dom.clear(container);
                if (titleEl) titleEl.textContent = formDef ? formDef.title : "Registro";
                global.AttendanceDailyUI.render(container);
                // Actualizar visibilidad del footer si aplica
                if (global.FooterManager) {
                    global.FooterManager.updateVisibility();
                }
                return;
            }

            // Renderizado custom para Plan Semanal
            if (tipoFormato === "ASISTENCIA_PLAN" && global.WeeklyPlanPanel) {
                Dom.clear(container);
                if (titleEl) titleEl.textContent = formDef ? formDef.title : "Plan Semanal";
                global.WeeklyPlanPanel.render(container);
                if (global.FooterManager) {
                    global.FooterManager.updateVisibility();
                }
                // Evitar que se cargue la grilla por defecto
                if (global.GridManager) {
                    const gridContainer = document.getElementById("grid-container");
                    if (gridContainer) Dom.clear(gridContainer);
                }
                return;
            }

            Dom.clear(container);
            if (sugg) {
                sugg.classList.add("d-none");
                Dom.clear(sugg);
            }

            if (!formDef) {
                if (titleEl) titleEl.textContent = "Registro";
                container.appendChild(
                    Dom.el("p", {
                        className: "text-muted small mb-0",
                        text: "No hay formulario definido para este formato."
                    })
                );
                return;
            }

            if (titleEl) titleEl.textContent = formDef.title;

            formDef.fields.forEach(field => {
                const colDiv = document.createElement("div");
                const isSection = field.type === "section";
                const isFull = isSection || field.full;
                colDiv.className = isFull ? "col-12" : "col-12 col-md-6";
                if (field.id) colDiv.dataset.fieldId = field.id;
                if (field.hidden) colDiv.classList.add("d-none");

                const formGroup = FormRenderer.renderField(field, referenceData);
                colDiv.appendChild(formGroup);
                container.appendChild(colDiv);
            });

            // Vincular IDs ocultos con selects de cliente/empleado
            setupEntityIdSync(container, formDef);

            // Autocompletar documento para FACTURACION y PAGOS_CLIENTES
            if (tipoFormato === "FACTURACION" || tipoFormato === "PAGOS_CLIENTES") {
                setupCuitAutocomplete();
            }

            // Fotos para CLIENTES (fachada / llave)
            if (tipoFormato === "CLIENTES" && typeof ClientMediaPanel !== "undefined" && ClientMediaPanel && typeof ClientMediaPanel.render === "function") {
                try {
                    ClientMediaPanel.render(container);
                } catch (e) {
                    console.warn("No se pudo renderizar panel de fotos:", e);
                }
            }

            if (tipoFormato === "CLIENTES") {
                setupClientesEncargadoToggle();
                moveClientMediaPanelAboveServiceDays(container);
                if (global.ClientTagsField && typeof global.ClientTagsField.init === "function") {
                    global.ClientTagsField.init(container);
                }
            }

            setupInputMasks(container, formDef);

            if (global.MapsAutocomplete && typeof global.MapsAutocomplete.bind === "function") {
                global.MapsAutocomplete.bind(container);
            }

            // Actualizar visibilidad del footer
            if (global.FooterManager) {
                global.FooterManager.updateVisibility();
            }
        }

        /**
         * Configura autocompletado de documento (CUIT/CUIL)
         */
        function setupCuitAutocomplete() {
            const rsSelect = document.getElementById("field-RAZÓN SOCIAL");
            const cuitInput = document.getElementById("field-CUIT");
            const inputUtils = global.InputUtils || {};

            if (rsSelect && cuitInput) {
                if (rsSelect.dataset.cuitBound) return;
                rsSelect.dataset.cuitBound = "1";
                bindEvent(rsSelect, "change", function () {
                    const selectedOption = this.selectedOptions ? this.selectedOptions[0] : null;
                    const selectedId = selectedOption && selectedOption.dataset ? selectedOption.dataset.id : "";
                    const cli = selectedId
                        ? referenceData.clientes.find(c => String(c.id) === String(selectedId))
                        : null;
                    const docType = cli ? (cli.docType || cli["TIPO DOCUMENTO"] || "") : "";
                    const docNumber = cli ? (cli.docNumber || cli["NUMERO DOCUMENTO"] || cli.cuit || "") : "";
                    const normalizedType = String(docType || '').trim().toUpperCase();
                    const shouldFill = normalizedType === "CUIT" || normalizedType === "CUIL" || (!!cli && !!cli.cuit);
                    if (shouldFill && docNumber) {
                        if (typeof inputUtils.formatDocNumber === "function") {
                            cuitInput.value = inputUtils.formatDocNumber(docNumber, normalizedType || "CUIT");
                        } else {
                            cuitInput.value = docNumber;
                        }
                    } else {
                        cuitInput.value = "";
                    }
                });
            }
        }

        function setupEntityIdSync(container, formDef) {
            if (!container || !formDef || !Array.isArray(formDef.fields)) return;
            const fields = formDef.fields;

            fields.forEach(field => {
                if (!field || (field.type !== "cliente" && field.type !== "empleado")) return;

                const select = document.getElementById("field-" + field.id);
                const idField = field.type === "cliente" ? "ID_CLIENTE" : "ID_EMPLEADO";
                const idInput = document.getElementById("field-" + idField);
                if (!select || !idInput) return;
                if (select.dataset.idSyncBound) return;
                select.dataset.idSyncBound = "1";

                const updateIdFromSelection = (force) => {
                    const selectedOption = select.selectedOptions ? select.selectedOptions[0] : null;
                    const selectedId = selectedOption && selectedOption.dataset ? selectedOption.dataset.id : "";
                    if (force || !idInput.value) {
                        idInput.value = selectedId || "";
                    }
                };

                bindEvent(select, "change", function () {
                    updateIdFromSelection(true);
                });

                updateIdFromSelection(false);
            });
        }

        /**
         * Limpia el formulario actual
         */
        function clearForm() {
            if (!currentFormat) return;
            const formDef = FORM_DEFINITIONS[currentFormat];
            if (!formDef) return;

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;

                input.classList.remove("is-invalid");

                if (field.type === "boolean") {
                    input.checked = typeof field.defaultChecked === "boolean" ? field.defaultChecked : true;
                    input.dispatchEvent(new Event("change"));
                } else {
                    input.value = "";
                }
            });

            if (currentFormat === "CLIENTES") {
                applyClientesEncargadoVisibility();
                if (global.ClientTagsField && typeof global.ClientTagsField.reset === "function") {
                    global.ClientTagsField.reset();
                }
            }
            applyInputMasks();
        }

        /**
         * Actualiza los datos de referencia
         */
        function updateReferenceData(newRefData) {
            referenceData = newRefData || { clientes: [], empleados: [] };
            if (currentFormat) {
                renderForm(currentFormat);
            }
        }

        /**
         * Obtiene el formato actual
         */
        function getCurrentFormat() {
            return currentFormat;
        }

        function refreshCurrent() {
            if (currentFormat) {
                renderForm(currentFormat);
            }
        }

        function applyClientesEncargadoVisibility() {
            if (currentFormat !== "CLIENTES") return;
            const toggle = document.getElementById("field-TIENE ENCARGADO");
            const show = !!(toggle && toggle.checked);

            const toggleField = (fieldId, visible) => {
                document.querySelectorAll(`[data-field-id="${fieldId}"]`).forEach(el => {
                    el.classList.toggle("d-none", !visible);
                });
            };

            toggleField("SECTION_ENCARGADO", show);
            toggleField("ENCARGADO", show);
            toggleField("TELEFONO", show);
        }

        function setupClientesEncargadoToggle() {
            const toggle = document.getElementById("field-TIENE ENCARGADO");
            if (!toggle) return;
            if (!toggle.dataset.encargadoBound) {
                toggle.dataset.encargadoBound = "1";
                bindEvent(toggle, "change", applyClientesEncargadoVisibility);
            }
            applyClientesEncargadoVisibility();
        }

        function moveClientMediaPanelAboveServiceDays(container) {
            if (!container) return;
            const section = document.getElementById("client-media-section");
            const anchor = container.querySelector('[data-field-id="SECTION_DIAS"]')
                || container.querySelector('[data-field-id="LUNES HS"]');
            if (section && anchor && section.parentNode === container) {
                container.insertBefore(section, anchor);
            }
        }

        function applyInputMasks() {
            const container = document.getElementById("form-fields");
            if (!container || !currentFormat) return;
            const formDef = FORM_DEFINITIONS[currentFormat];
            if (formDef) {
                setupInputMasks(container, formDef);
            }
        }

        function setupInputMasks(container, formDef) {
            if (!container || !formDef) return;
            const inputUtils = global.InputUtils || {};
            const docTypeInputs = {};
            const docNumberInputs = [];

            formDef.fields.forEach(field => {
                if (!field || !field.id) return;
                if (field.type === "docType") {
                    const el = document.getElementById("field-" + field.id);
                    if (el) docTypeInputs[field.id] = el;
                }
            });

            formDef.fields.forEach(field => {
                if (!field || !field.id) return;
                const input = document.getElementById("field-" + field.id);
                if (!input) return;

                if (field.type === "phone") {
                    if (!input.dataset.maskPhone) {
                        input.dataset.maskPhone = "1";
                        bindEvent(input, "input", function () {
                            if (typeof inputUtils.sanitizePhone === "function") {
                                const clean = inputUtils.sanitizePhone(input.value);
                                if (clean !== input.value) input.value = clean;
                            }
                        });
                    }
                    if (!input.dataset.phonePattern) {
                        input.dataset.phonePattern = "1";
                        input.setAttribute("pattern", "^\\+?\\d{7,15}$");
                        input.setAttribute("title", "Formato internacional: +5491112345678 (7 a 15 dígitos).");
                    }
                    if (!input.placeholder) {
                        input.placeholder = "+5491112345678";
                    }
                    if (typeof inputUtils.sanitizePhone === "function") {
                        const cleanInitial = inputUtils.sanitizePhone(input.value);
                        if (cleanInitial !== input.value) input.value = cleanInitial;
                    }
                    input.inputMode = "tel";
                }

                if (field.type === "email") {
                    input.type = "email";
                }

                if (field.type === "docNumber") {
                    docNumberInputs.push({ field, input });
                }
            });

            docNumberInputs.forEach(item => {
                const field = item.field;
                const input = item.input;
                const docTypeFieldId = field.docTypeField || input.dataset.docTypeField || "TIPO DOCUMENTO";
                const fixedDocType = field.docTypeValue || input.dataset.docTypeValue || "";
                const typeInput = fixedDocType ? null : docTypeInputs[docTypeFieldId] || document.getElementById("field-" + docTypeFieldId);

                const applyMask = () => {
                    const docType = fixedDocType || (typeInput ? typeInput.value : "");
                    if (typeof inputUtils.formatDocNumber === "function") {
                        input.value = inputUtils.formatDocNumber(input.value, docType);
                    }
                    if (typeof inputUtils.docPlaceholder === "function") {
                        const ph = inputUtils.docPlaceholder(docType);
                        if (ph) input.placeholder = ph;
                    }
                };

                if (!input.dataset.maskDoc) {
                    input.dataset.maskDoc = "1";
                    bindEvent(input, "input", applyMask);
                    bindEvent(input, "blur", applyMask);
                }

                if (typeInput && !typeInput.dataset.maskDoc) {
                    typeInput.dataset.maskDoc = "1";
                    bindEvent(typeInput, "change", applyMask);
                }

                applyMask();
            });
        }

        return {
            init,
            loadFormats,
            renderForm,
            clearForm,
            updateReferenceData,
            getCurrentFormat,
            refreshCurrent,
            applyClientesEncargadoVisibility,
            applyInputMasks
        };
    })();

    global.FormManager = FormManager;
})(typeof window !== "undefined" ? window : this);


/**
 * RecordsData
 * Capa de datos para operaciones CRUD y formatos.
 */
(function (global) {
  function ensureApi() {
    return global.ApiService && typeof global.ApiService.call === "function";
  }

  function getAvailableFormats() {
    if (!ensureApi()) return Promise.resolve([]);
    return global.ApiService.call("getAvailableFormats");
  }

  function searchRecords(tipoFormato, query, includeInactive) {
    if (!ensureApi()) return Promise.resolve([]);
    if (typeof global.ApiService.callLatest === "function") {
      const key = "search-" + String(tipoFormato || "") + "|" + String(query || "") + "|" + String(includeInactive || "");
      return global.ApiService.callLatest(
        key,
        "searchRecords",
        tipoFormato,
        query || "",
        includeInactive
      );
    }
    return global.ApiService.call("searchRecords", tipoFormato, query || "", includeInactive);
  }

  function saveRecord(tipoFormato, record) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("saveFormRecord", tipoFormato, record);
  }

  function updateRecord(tipoFormato, id, record) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("updateRecord", tipoFormato, id, record);
  }

  function deleteRecord(tipoFormato, id) {
    if (!ensureApi()) return Promise.reject(new Error("ApiService no disponible"));
    return global.ApiService.call("deleteRecord", tipoFormato, id);
  }

  function refreshReferenceData() {
    if (!global.ReferenceService) return Promise.resolve(null);
    const refreshFn = typeof global.ReferenceService.refresh === "function"
      ? global.ReferenceService.refresh
      : global.ReferenceService.load;
    if (typeof refreshFn !== "function") return Promise.resolve(null);
    return refreshFn()
      .then(function () {
        return global.ReferenceService.get ? global.ReferenceService.get() : null;
      })
      .catch(function (err) {
        if (Alerts && Alerts.notifyError) {
          Alerts.notifyError("No se pudieron actualizar referencias", err, { silent: true });
        } else {
          console.warn("No se pudieron actualizar referencias:", err);
        }
        return null;
      });
  }

  function refreshReferenceDataIfNeeded(tipoFormato) {
    if (!global.DomainMeta || typeof global.DomainMeta.getMeta !== "function") return Promise.resolve(null);
    const meta = global.DomainMeta.getMeta(tipoFormato);
    if (!meta || !meta.refreshReference) return Promise.resolve(null);
    return refreshReferenceData();
  }

  global.RecordsData = {
    getAvailableFormats: getAvailableFormats,
    searchRecords: searchRecords,
    saveRecord: saveRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    refreshReferenceData: refreshReferenceData,
    refreshReferenceDataIfNeeded: refreshReferenceDataIfNeeded
  };
})(typeof window !== "undefined" ? window : this);


/**
 * Record Manager
 * Maneja CRUD de registros (Create, Read, Update, Delete)
 */

(function (global) {
    const RecordManager = (() => {
        let currentMode = "create"; // "create" | "edit"
        let selectedRowNumber = null;
        let selectedRowIndex = null;
        const RecordsData = global.RecordsData || null;

        function refreshReferencesIfNeeded(tipoFormato) {
            if (!RecordsData || typeof RecordsData.refreshReferenceDataIfNeeded !== "function") return;
            RecordsData.refreshReferenceDataIfNeeded(tipoFormato)
                .then(function (refData) {
                    if (refData && global.FormManager && typeof global.FormManager.updateReferenceData === "function") {
                        global.FormManager.updateReferenceData(refData);
                    }
                });
        }

        function enterCreateMode(clear = true) {
            currentMode = "create";
            selectedRowNumber = null;
            selectedRowIndex = null;

            if (clear && global.FormManager) {
                global.FormManager.clearForm();
            }

            if (global.SearchManager) {
                global.SearchManager.clearSearch();
            }

            if (global.FooterManager) {
                global.FooterManager.showCreateMode();
            }
        }

        function enterEditMode(id, record) {
            currentMode = "edit";
            selectedRowNumber = id; // Now stores ID instead of rowNumber
            selectedRowIndex = record && record._rowNumber ? Number(record._rowNumber) || null : null;
            loadRecordIntoForm(record);

            if (global.FooterManager) {
                global.FooterManager.showEditMode();
            }
        }

        function loadRecordForEdit(id, record) {
            enterEditMode(id, record);
        }

        function loadRecordIntoForm(record) {
            Object.keys(record).forEach(function (fieldId) {
                // Skip ID field - it's not editable
                if (fieldId === 'ID') return;

                const input = document.getElementById("field-" + fieldId);
                if (!input) return;

                const value = record[fieldId];

                if (input.type === "checkbox") {
                    // Recognize various truthy values including normalized strings
                    input.checked = value === true ||
                        value === "TRUE" ||
                        value === "true" ||  // Added for normalized boolean
                        value === "Activo" ||
                        value === 1 ||
                        value === "1";
                    input.dispatchEvent(new Event("change"));
                } else {
                    // For text inputs, use the value as-is (even if empty string)
                    input.value = value !== null && value !== undefined ? value : "";
                }
            });

            if (global.FormManager && typeof global.FormManager.applyClientesEncargadoVisibility === "function") {
                global.FormManager.applyClientesEncargadoVisibility();
            }
            if (global.ClientTagsField && typeof global.ClientTagsField.syncFromValue === "function") {
                global.ClientTagsField.syncFromValue();
            }
            if (global.FormManager && typeof global.FormManager.applyInputMasks === "function") {
                global.FormManager.applyInputMasks();
            }
        }

        function saveRecord() {
            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) {
                if (Alerts) Alerts.showAlert("No hay formato seleccionado.", "warning");
                return Promise.resolve(false);
            }

            // Flujo custom para asistencia diaria (plan vs real)
            if (tipoFormato === "ASISTENCIA" && global.AttendanceDailyUI) {
                global.AttendanceDailyUI.save();
                return Promise.resolve(false);
            }

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) return Promise.resolve(false);

            const record = {};
            let hasErrors = false;
            const errorFields = [];
            const inputUtils = global.InputUtils || {};

            function shouldSkipValidation(field, input) {
                if (!field || !input) return true;
                if (field.hidden || input.type === "hidden") return true;
                if (input.closest && input.closest(".d-none")) return true;
                return false;
            }

            function registerError(field, input) {
                if (!field || !input) return;
                input.classList.add("is-invalid");
                errorFields.push(field.label || field.id);
                hasErrors = true;
            }

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;

                input.classList.remove("is-invalid");

                let value;
                if (field.type === "boolean") {
                    value = input.checked;
                } else {
                    value = input.value.trim();
                }

                record[field.id] = value;
            });

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;
                if (shouldSkipValidation(field, input)) return;
                const value = record[field.id];
                const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

                if (field.type === "phone" && hasValue) {
                    if (typeof inputUtils.isValidPhone === "function") {
                        if (!inputUtils.isValidPhone(value)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "email" && hasValue) {
                    if (typeof inputUtils.isValidEmail === "function") {
                        if (!inputUtils.isValidEmail(value)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "docNumber" && hasValue) {
                    const docTypeField = field.docTypeField || "TIPO DOCUMENTO";
                    const docType = field.docTypeValue || record[docTypeField] || "";
                    if (typeof inputUtils.isValidDocNumber === "function") {
                        if (!inputUtils.isValidDocNumber(value, docType)) {
                            registerError(field, input);
                        }
                    }
                }

                if (field.type === "number" && hasValue) {
                    const parsedNumber = NumberUtils && typeof NumberUtils.parseLocalizedNumber === "function"
                        ? NumberUtils.parseLocalizedNumber(value)
                        : Number(value);
                    if (parsedNumber === null || isNaN(parsedNumber)) {
                        registerError(field, input);
                    }
                }

                if (typeof input.checkValidity === "function" && !input.checkValidity()) {
                    registerError(field, input);
                }
            });

            const idRules = [
                { idField: "ID_CLIENTE", labelField: "CLIENTE", label: "Cliente" },
                { idField: "ID_CLIENTE", labelField: "RAZÓN SOCIAL", label: "Razón social" },
                { idField: "ID_EMPLEADO", labelField: "EMPLEADO", label: "Empleado" }
            ];

            idRules.forEach(rule => {
                if (!record.hasOwnProperty(rule.idField)) return;
                const labelValue = record[rule.labelField];
                const idValue = record[rule.idField];
                const hasLabel = labelValue != null && String(labelValue).trim() !== "";
                const hasId = idValue != null && String(idValue).trim() !== "";
                if (hasLabel && !hasId) {
                    const input = document.getElementById("field-" + rule.labelField);
                    if (input) {
                        input.classList.add("is-invalid");
                    }
                    errorFields.push(rule.label || rule.labelField);
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                const unique = Array.from(new Set(errorFields)).filter(Boolean);
                const msg = unique.length
                    ? "Revisá los campos: " + unique.join(", ")
                    : "Por favor completá los campos requeridos.";
                if (Alerts) Alerts.showAlert(msg, "warning");
                return Promise.resolve(false);
            }

            UiState.setGlobalLoading(true, "Guardando...");

            if (currentMode === "edit" && selectedRowNumber) {
                // Update existing (selectedRowNumber now contains ID)
                if (!RecordsData || typeof RecordsData.updateRecord !== "function") {
                    if (Alerts) Alerts.showAlert("No se pudo actualizar el registro.", "danger");
                    UiState.setGlobalLoading(false);
                    return Promise.resolve(false);
                }
                return RecordsData.updateRecord(tipoFormato, selectedRowNumber, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro actualizado correctamente.", "success");
                        enterCreateMode(true);
                        refreshReferencesIfNeeded(tipoFormato);
                        return true;
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al actualizar: " + err.message, "danger");
                        return false;
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            } else {
                // Create new
                if (!RecordsData || typeof RecordsData.saveRecord !== "function") {
                    if (Alerts) Alerts.showAlert("No se pudo guardar el registro.", "danger");
                    UiState.setGlobalLoading(false);
                    return Promise.resolve(false);
                }
                return RecordsData.saveRecord(tipoFormato, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro guardado correctamente.", "success");
                        enterCreateMode(true);
                        refreshReferencesIfNeeded(tipoFormato);
                        return true;
                    })
                    .catch(function (err) {
                        if (Alerts) Alerts.showAlert("Error al guardar: " + err.message, "danger");
                        return false;
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }
        }

        function deleteRecord() {
            if (currentMode !== "edit" || !selectedRowNumber) {
                if (Alerts) Alerts.showAlert("No hay registro seleccionado para eliminar.", "warning");
                return Promise.resolve(false);
            }

            const tipoFormato = global.FormManager ? global.FormManager.getCurrentFormat() : null;
            if (!tipoFormato) return Promise.resolve(false);

            const confirmPromise =
                global.UiDialogs && typeof global.UiDialogs.confirm === "function"
                    ? global.UiDialogs.confirm({
                        title: "Eliminar registro",
                        message: "¿Estás seguro de que querés eliminar este registro?",
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        confirmVariant: "danger",
                        icon: "bi-trash3-fill",
                        iconClass: "text-danger"
                    })
                    : Promise.resolve(confirm("¿Estás seguro de que querés eliminar este registro?"));

            return confirmPromise.then(function (confirmed) {
                if (!confirmed) return;

            UiState.setGlobalLoading(true, "Eliminando...");

            if (!RecordsData || typeof RecordsData.deleteRecord !== "function") {
                if (Alerts) Alerts.showAlert("No se pudo eliminar el registro.", "danger");
                UiState.setGlobalLoading(false);
                return false;
            }

            const payload = selectedRowIndex
                ? { id: selectedRowNumber, rowNumber: selectedRowIndex }
                : selectedRowNumber;

            return RecordsData.deleteRecord(tipoFormato, payload)
                .then(function () {
                    if (Alerts) Alerts.showAlert("✅ Registro eliminado correctamente.", "success");
                    enterCreateMode(true);
                    refreshReferencesIfNeeded(tipoFormato);
                    if (global.location && typeof global.location.reload === "function") {
                        setTimeout(function () {
                            global.location.reload();
                        }, 300);
                    }
                    return true;
                })
                .catch(function (err) {
                    if (Alerts) Alerts.showAlert("Error al eliminar: " + err.message, "danger");
                    return false;
                })
                .finally(function () {
                    UiState.setGlobalLoading(false);
                });
            });
        }

        function cancelEdit() {
            enterCreateMode(true);
        }

        return {
            enterCreateMode,
            resetEditState: function () {
                currentMode = "create";
                selectedRowNumber = null;
                selectedRowIndex = null;
            },
            loadRecordForEdit,
            saveRecord,
            deleteRecord,
            cancelEdit
        };
    })();

    global.RecordManager = RecordManager;
})(typeof window !== "undefined" ? window : this);


/**
 * Main application - Reduced version
 * Bootstraps and connects all modules
 * 
 * Dependencies loaded via bundle (in order):
 * - formDefinitions.js
 * - apiService.js  
 * - referenceService.js
 * - ui/alerts.js
 * - ui/state.js
 * - ui/formRenderer.js
 * - ui/footer.js
 * - utils/htmlHelpers.js
 * - forms/formManager.js
 * - search/searchManager.js
 * - records/recordManager.js
 * - attendance/weeklyPlanPanel.js
 * - attendance/attendancePanels.js
 */

(() => {
  if (typeof document === 'undefined') {
    return;
  }

  const globals = typeof window !== 'undefined' ? window : this;
  const {
    ReferenceData,
    FormManager,
    WeeklyPlanPanel,
    DropdownConfig,
    InvoicePanel,
    GridManager,
    RecordsData,
    PaymentsPanelHandlers,
    ClientAccountPanel,
    Alerts,
    RecordManager,
    Footer,
    HoursDetailPanel,
    MonthlySummaryPanel,
    AccountStatementPanel,
    ClientReportPanel,
    ClientMonthlySummaryPanel,
    BulkValuesPanel,
    DropdownConfigPanel,
    AnalysisPanel,
    AnalysisPanelData,
    MapPanel,
    MapsPanelData,
    AttendanceDailyUI,
    AttendanceDailyData,
    EmployeeCalendarPanel,
    EmployeeCalendarData,
    ClientCalendarPanel,
    ClientCalendarData,
    PaymentsPanel,
    AttendancePanelsData,
    EmptyState,
    DomainMeta,
    Sidebar
  } = globals;

  // ===== Bootstrap Application =====

  let appInitialized = false;
  let handlersBound = false;
  let referenceSubscribed = false;
  let referenceUnsubscribe = null;
  let activeViewId = null;
  let prefetchScheduled = false;
  const referenceUpdateRegistry = new Map();

  function schedulePrefetchAll() {
    if (prefetchScheduled) return;
    prefetchScheduled = true;

    const tasks = [];
    const addTask = (fn) => {
      if (typeof fn === "function") tasks.push(fn);
    };

    addTask(AnalysisPanelData && AnalysisPanelData.prefetch ? AnalysisPanelData.prefetch : null);
    addTask(MapsPanelData && MapsPanelData.prefetch ? MapsPanelData.prefetch : null);
    addTask(AttendancePanelsData && AttendancePanelsData.prefetchWeeklyPlans ? AttendancePanelsData.prefetchWeeklyPlans : null);
    addTask(AttendanceDailyData && AttendanceDailyData.prefetch ? AttendanceDailyData.prefetch : null);
    addTask(EmployeeCalendarData && EmployeeCalendarData.prefetchEmployees ? EmployeeCalendarData.prefetchEmployees : null);
    addTask(ClientCalendarData && ClientCalendarData.prefetchClients ? ClientCalendarData.prefetchClients : null);

    let index = 0;
    const runNext = () => {
      if (index >= tasks.length) return;
      const task = tasks[index++];
      Promise.resolve()
        .then(task)
        .catch(() => null)
        .finally(() => {
          setTimeout(runNext, 250);
        });
    };

    setTimeout(runNext, 500);
  }

  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    // 1. Load reference data
    if (!ReferenceData || typeof ReferenceData.ensureLoaded !== "function") {
      console.warn("ReferenceData.ensureLoaded no disponible");
    } else {
      const loadPromise = ReferenceData.ensureLoaded();
      loadPromise
        .then(function () {
          const refData = ReferenceData.get();

          // Initialize modules with reference data
          if (FormManager) {
            FormManager.init(refData);
            // Update UI with loaded data
            FormManager.updateReferenceData(refData);
          }

          if (WeeklyPlanPanel) {
            WeeklyPlanPanel.init(refData);
          }
        })
        .catch(function (err) {
          console.error("Error loading reference data:", err);
        });
    }

    if (DropdownConfig && typeof DropdownConfig.load === "function") {
      DropdownConfig.load().then(() => {
        if (FormManager && typeof FormManager.refreshCurrent === "function") {
          FormManager.refreshCurrent();
        }
        const factView = document.getElementById("view-facturacion");
        if (InvoicePanel && factView && !factView.classList.contains("d-none")) {
          InvoicePanel.render();
        }
      });
    }

    // Setup event handlers
    setupEventHandlers();
    bindReferenceUpdates();
    schedulePrefetchAll();
  }

  const registroViews = {
    clientes: { format: "CLIENTES", title: "Diccionario de clientes" },
    empleados: { format: "EMPLEADOS", title: "Diccionario de empleados" },
    adelantos: { format: "ADELANTOS", title: "Adelantos de sueldo" },
    gastos: { format: "GASTOS", title: "Gastos" }
  };
  let currentRegistroFormat = "CLIENTES";

  function setRegistroContext(title) {
    const label = document.getElementById("registro-context-label");
    if (label && title) label.textContent = title;
  }

  function setRegistroFormat(tipoFormato, title) {
    currentRegistroFormat = tipoFormato;
    if (title) setRegistroContext(title);

    const gridContainer = document.getElementById("data-grid-container");
    if (gridContainer) gridContainer.classList.remove("d-none");

    const searchInput = document.getElementById("search-query");
    if (searchInput) searchInput.parentElement.classList.remove("d-none");

    const inactiveToggle = document.getElementById("registro-inactive-toggle");
    const checkVerInactivos = document.getElementById("check-ver-inactivos");
    const supportsInactive = tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS";
    if (inactiveToggle) inactiveToggle.classList.toggle("d-none", !supportsInactive);
    if (!supportsInactive && checkVerInactivos) checkVerInactivos.checked = false;

    const btnNuevo = document.getElementById("btn-nuevo");
    if (btnNuevo) btnNuevo.classList.remove("d-none");

    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) btnRefresh.classList.remove("d-none");

    const customPanel = document.getElementById("custom-view-panel");
    if (customPanel) customPanel.classList.add("d-none");

    if (GridManager && typeof GridManager.renderLoading === "function") {
      GridManager.renderLoading(tipoFormato, "Cargando registros...");
    }

    if (!RecordsData || typeof RecordsData.searchRecords !== "function") {
      console.error("RecordsData.searchRecords no disponible");
      return;
    }
    const includeInactive = checkVerInactivos ? checkVerInactivos.checked : false;
    RecordsData.searchRecords(tipoFormato, "", includeInactive)
      .then(function (records) {
        if (GridManager) {
          GridManager.renderGrid(tipoFormato, records || [], { resetPage: true });
        }
      })
      .catch(function (err) {
        console.error("Error cargando registros:", err);
        if (GridManager) {
          GridManager.renderGrid(tipoFormato, [], { resetPage: true });
        }
      });
  }

  function registerReferenceHandler(viewId, handler) {
    if (!viewId || typeof handler !== "function") return;
    referenceUpdateRegistry.set(viewId, handler);
  }

  function bindReferenceUpdates() {
    if (referenceSubscribed) return;
    if (!ReferenceData || typeof ReferenceData.subscribe !== "function") return;
    referenceSubscribed = true;
    referenceUnsubscribe = ReferenceData.subscribe(handleReferenceUpdate);
  }

  function handleReferenceUpdate(data) {
    referenceUpdateRegistry.forEach((handler, viewId) => {
      if (typeof handler !== "function") return;
      try {
        handler(data);
      } catch (err) {
        console.error("Error en handler de referencia (" + viewId + "):", err);
      }
    });
  }

  function setupEventHandlers() {
    if (handlersBound) return;
    handlersBound = true;
    registerReferenceHandler("clientes", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("empleados", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("adelantos", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("gastos", () => {
      if (GridManager) GridManager.refreshGrid();
    });
    registerReferenceHandler("pagos", (detail) => {
      if (PaymentsPanelHandlers && typeof PaymentsPanelHandlers.handleReferenceUpdate === "function") {
        PaymentsPanelHandlers.handleReferenceUpdate(detail || null);
      }
    });
    registerReferenceHandler("reportes-clientes", (detail) => {
      if (ClientAccountPanel && typeof ClientAccountPanel.handleReferenceUpdate === "function") {
        ClientAccountPanel.handleReferenceUpdate(detail || null);
      }
    });

    // Search input - Filtrar grilla
    const searchInput = document.getElementById("search-query");
    const checkVerInactivos = document.getElementById("check-ver-inactivos");

    function performSearch() {
      const tipoFormato = currentRegistroFormat;
      const query = searchInput ? searchInput.value : "";
      const includeInactive = checkVerInactivos ? checkVerInactivos.checked : false;

      if (!tipoFormato) {
        if (query.length > 0 && Alerts) {
          Alerts.showAlert("Selecciona una sección primero para buscar", "warning");
        }
        return;
      }

      // Buscar y actualizar grilla
      if (!RecordsData || typeof RecordsData.searchRecords !== "function") {
        console.error("RecordsData.searchRecords no disponible");
        return;
      }

      if (GridManager && typeof GridManager.renderLoading === "function") {
        // Optional: show loading indicator if needed, but for typing usually we wait? 
        // Actually searchRecords is async, so better show strict loading if it's a new search
      }

      RecordsData.searchRecords(tipoFormato, query, includeInactive)
        .then(function (records) {
          if (GridManager) {
            GridManager.renderGrid(tipoFormato, records || [], { resetPage: true });
          }
        })
        .catch(function (err) {
          console.error("Error en búsqueda:", err);
        });
    }

    if (searchInput) {
      searchInput.addEventListener("input", performSearch);
    }

    if (checkVerInactivos) {
      checkVerInactivos.addEventListener("change", performSearch);
    }

    // Botón Nuevo - Abrir modal
    const btnNuevo = document.getElementById("btn-nuevo");
    if (btnNuevo) {
      btnNuevo.addEventListener("click", function () {
        const tipoFormato = currentRegistroFormat;

        if (!tipoFormato) {
          if (Alerts) {
            Alerts.showAlert("Selecciona una sección primero", "warning");
          }
          return;
        }

        if (RecordManager && typeof RecordManager.resetEditState === "function") {
          RecordManager.resetEditState();
        }

        // Abrir modal y renderizar formulario en el callback
        if (GridManager) {
          GridManager.openModal("Nuevo Registro", function () {
            if (FormManager) {
              FormManager.renderForm(tipoFormato);
              FormManager.clearForm();
            }
          });
        }
      });
    }

    // Botón Refresh
    const btnRefresh = document.getElementById("btn-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", function () {
        if (GridManager) {
          GridManager.refreshGrid();
        }
      });
    }

    // Modal - Botón Cerrar
    const btnCloseModal = document.getElementById("btn-close-modal");
    if (btnCloseModal) {
      btnCloseModal.addEventListener("click", function () {
        if (GridManager) {
          GridManager.closeModal();
        }
      });
    }

    // Modal - Botón Cancelar
    const btnCancelarModal = document.getElementById("btn-cancelar-modal");
    if (btnCancelarModal) {
      btnCancelarModal.addEventListener("click", function () {
        if (GridManager) {
          GridManager.closeModal();
        }
      });
    }

    // Modal - Botón Guardar
    const btnGuardarModal = document.getElementById("btn-guardar-modal");
    if (btnGuardarModal) {
      btnGuardarModal.addEventListener("click", function () {
        if (RecordManager) {
          const result = RecordManager.saveRecord();
          const handleClose = (ok) => {
            if (!ok) return;
            setTimeout(() => {
              if (GridManager) {
                GridManager.closeModal();
                const currentFormat = FormManager && typeof FormManager.getCurrentFormat === "function"
                  ? FormManager.getCurrentFormat()
                  : null;
                GridManager.refreshGrid();
              }
            }, 500);
          };
          if (result && typeof result.then === "function") {
            result.then(handleClose);
          } else {
            handleClose(result === true);
          }
        }
      });
    }

    // Modal - Botón Eliminar
    const btnEliminarModal = document.getElementById("btn-eliminar-modal");
    if (btnEliminarModal) {
      btnEliminarModal.addEventListener("click", function () {
        if (RecordManager) {
          const result = RecordManager.deleteRecord();
          const handleClose = (ok) => {
            if (!ok) return;
            if (GridManager) {
              GridManager.closeModal();
              const currentFormat = FormManager && typeof FormManager.getCurrentFormat === "function"
                ? FormManager.getCurrentFormat()
                : null;
              GridManager.refreshGrid();
            }
          };
          if (result && typeof result.then === "function") {
            result.then(handleClose);
          } else {
            handleClose(result === true);
          }
        }
      });
    }

    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById("form-modal");
    if (modalOverlay) {
      let overlayClickEligible = false;

      modalOverlay.addEventListener("pointerdown", function (e) {
        overlayClickEligible = e.target === modalOverlay;
      });

      modalOverlay.addEventListener("pointermove", function () {
        if (overlayClickEligible) overlayClickEligible = false;
      });

      modalOverlay.addEventListener("pointercancel", function () {
        overlayClickEligible = false;
      });

      modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay && overlayClickEligible && GridManager) {
          GridManager.closeModal();
        }
        overlayClickEligible = false;
      });
    }

    // Footer buttons
    if (Footer) {
      Footer.render();
    }

    // Tab Handling
    const tabInformes = document.getElementById('informes-tab');
    const tabGestion = document.getElementById('gestion-tab');
    const footerContainer = document.getElementById('footer-container');

    if (tabInformes) {
      tabInformes.addEventListener('shown.bs.tab', function (e) {
        // Initialize Hours Panel when tab is shown
        if (HoursDetailPanel) {
          HoursDetailPanel.render();
        }
        // Hide footer in Reports tab (optional, or keep it if needed)
        if (footerContainer) footerContainer.classList.add('d-none');
      });
    }

    if (tabGestion) {
      tabGestion.addEventListener('shown.bs.tab', function (e) {
        // Show footer in Management tab
        if (footerContainer) footerContainer.classList.remove('d-none');
      });
    }
    const btnSave = document.getElementById("btn-grabar");
    if (btnSave) {
      btnSave.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
        }
      });
    }

    const btnCancel = document.getElementById("btn-limpiar");
    if (btnCancel) {
      btnCancel.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.cancelEdit();
        }
      });
    }

    const btnDelete = document.getElementById("btn-eliminar");
    if (btnDelete) {
      btnDelete.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
        }
      });
    }

    // Botones superiores (duplicados para acceso rápido)
    const btnSaveTop = document.getElementById("btn-grabar-top");
    if (btnSaveTop) {
      btnSaveTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.saveRecord();
        }
      });
    }

    const btnCancelTop = document.getElementById("btn-limpiar-top");
    if (btnCancelTop) {
      btnCancelTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.cancelEdit();
        }
      });
    }

    const btnDeleteTop = document.getElementById("btn-eliminar-top");
    if (btnDeleteTop) {
      btnDeleteTop.addEventListener("click", function () {
        if (RecordManager) {
          RecordManager.deleteRecord();
        }
      });
    }

    function handleViewChange(viewId) {
      if (!viewId) return;
      activeViewId = viewId;
      const pageTitle = document.getElementById('page-title');
      const titles = {
        analisis: 'Análisis',
        mapa: 'Mapa',
        registro: 'Diccionario',
        clientes: 'Diccionario de clientes',
        empleados: 'Diccionario de empleados',
        adelantos: 'Adelantos de sueldo',
        pagos: 'Pagos',
        gastos: 'Gastos',
        'asistencia-plan': 'Plan Semanal',
        'asistencia-diaria': 'Tomar Asistencia',
        'asistencia-calendario': 'Calendario Empleado',
        'asistencia-clientes': 'Calendario Clientes',
        reportes: 'Reporte Empleados',
        'reportes-clientes': 'Reporte Clientes',
        facturacion: 'Facturación',
        configuracion: 'Configuración'
      };

      const registroConfig = registroViews[viewId] || (viewId === 'registro' ? registroViews.clientes : null);
      const targetViewId = registroConfig ? 'registro' : viewId;

      // Update Title
      if (pageTitle) {
        const title = titles[viewId] || viewId.charAt(0).toUpperCase() + viewId.slice(1);
        pageTitle.textContent = title;
      }

      // Hide all views
      document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('d-none');
      });

      // Show target view
      const targetView = document.getElementById(`view-${targetViewId}`);
      if (targetView) {
        targetView.classList.remove('d-none');
      }

      if (registroConfig) {
        setRegistroFormat(registroConfig.format, registroConfig.title);
        return;
      }

      // Initialize view-specific content
      if (viewId === 'asistencia-plan' && typeof WeeklyPlanPanel !== 'undefined') {
        const container = document.getElementById('weekly-plan-panel');
        if (container) {
          if (EmptyState) {
            EmptyState.render(container, { variant: 'loading', message: 'Cargando planes...' });
          } else {
            container.textContent = 'Cargando planes...';
          }
          if (!AttendancePanelsData || typeof AttendancePanelsData.searchWeeklyPlans !== "function") {
            console.error("AttendancePanelsData.searchWeeklyPlans no disponible");
            return;
          }
          AttendancePanelsData.searchWeeklyPlans("")
            .then(records => {
              WeeklyPlanPanel.renderList(container, records || []);
            })
            .catch(err => {
              console.error('Error cargando planes:', err);
              if (EmptyState) {
                EmptyState.render(container, {
                  variant: 'error',
                  title: 'Error al cargar planes',
                  message: 'No se pudo cargar la lista de planes.'
                });
              } else {
                container.textContent = 'Error al cargar planes';
              }
            });
        }
      }
      if (viewId === 'analisis') {
        const container = document.getElementById('analysis-panel');
        if (!AnalysisPanel || !container) {
          if (container) {
            if (EmptyState) {
              EmptyState.render(container, {
                variant: 'error',
                title: 'Módulo no disponible',
                message: 'No se pudo cargar el análisis.'
              });
            } else {
              container.textContent = 'No se pudo cargar el análisis.';
            }
          }
        } else {
          AnalysisPanel.render('analysis-panel');
        }
      }
      if (viewId === 'mapa') {
        const container = document.getElementById('maps-panel');
        if (!MapPanel || !container) {
          if (container) {
            if (EmptyState) {
              EmptyState.render(container, {
                variant: 'error',
                title: 'Mapa no disponible',
                message: 'No se pudo cargar el mapa.'
              });
            } else {
              container.textContent = 'No se pudo cargar el mapa.';
            }
          }
        } else {
          MapPanel.render('maps-panel');
        }
      }

      if (viewId === 'asistencia-diaria' && AttendanceDailyUI) {
        const container = document.getElementById('daily-attendance-panel');
        if (container) AttendanceDailyUI.render(container);
      }

      if (viewId === 'asistencia-calendario' && EmployeeCalendarPanel) {
        EmployeeCalendarPanel.render('employee-calendar-panel');
      }

      if (viewId === 'asistencia-clientes' && ClientCalendarPanel) {
        ClientCalendarPanel.render('client-calendar-panel');
      }

      if (viewId === 'reportes' && HoursDetailPanel) {
        if (MonthlySummaryPanel) MonthlySummaryPanel.render();
        HoursDetailPanel.render();
        if (AccountStatementPanel) AccountStatementPanel.render();
      }
      if (viewId === 'reportes-clientes' && ClientReportPanel) {
        if (ClientMonthlySummaryPanel) {
          ClientMonthlySummaryPanel.render();
        }
        if (ClientAccountPanel) {
          ClientAccountPanel.render();
        }
        ClientReportPanel.render();
      }
      if (viewId === 'configuracion') {
        if (BulkValuesPanel) BulkValuesPanel.render();
        if (DropdownConfigPanel) {
          DropdownConfigPanel.render();
        }
      }
      if (viewId === 'facturacion' && InvoicePanel) {
        InvoicePanel.render();
      }
      if (viewId === 'pagos' && PaymentsPanel) {
        PaymentsPanel.render();
      }
    }

    // Sidebar Initialization
    if (typeof Sidebar !== 'undefined' && Sidebar) {
      Sidebar.init();

      // Handle view changes
      document.addEventListener('view-change', (e) => {
        const viewId = e.detail ? e.detail.view : null;
        handleViewChange(viewId);
      });

      if (Sidebar.setActive) {
        Sidebar.setActive('asistencia-plan');
      } else {
        handleViewChange('asistencia-plan');
      }
    } else {
      handleViewChange('asistencia-plan');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

