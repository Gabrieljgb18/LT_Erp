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
