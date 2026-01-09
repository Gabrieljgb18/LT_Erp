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
