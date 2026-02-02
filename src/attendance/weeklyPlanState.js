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
