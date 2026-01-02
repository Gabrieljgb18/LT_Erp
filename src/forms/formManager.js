/**
 * Form Manager
 * Gestiona la carga, renderizado y configuración de formularios
 */

(function (global) {
    const FormManager = (() => {
        let currentFormat = null;
        let referenceData = { clientes: [], empleados: [] };

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
            return ApiService.call('getAvailableFormats')
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

            select.innerHTML = "";
            formats.forEach(function (f) {
                const option = document.createElement("option");
                option.value = f.id;
                option.textContent = f.name;
                select.appendChild(option);
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
                container.innerHTML = "";
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
                container.innerHTML = "";
                if (titleEl) titleEl.textContent = formDef ? formDef.title : "Plan Semanal";
                global.WeeklyPlanPanel.render(container);
                if (global.FooterManager) {
                    global.FooterManager.updateVisibility();
                }
                // Evitar que se cargue la grilla por defecto
                if (global.GridManager) {
                    const gridContainer = document.getElementById("grid-container");
                    if (gridContainer) gridContainer.innerHTML = "";
                }
                return;
            }

            container.innerHTML = "";
            if (sugg) {
                sugg.classList.add("d-none");
                sugg.innerHTML = "";
            }

            if (!formDef) {
                if (titleEl) titleEl.textContent = "Registro";
                container.innerHTML =
                    '<p class="text-muted small mb-0">No hay formulario definido para este formato.</p>';
                return;
            }

            if (titleEl) titleEl.textContent = formDef.title;

            formDef.fields.forEach(field => {
                const colDiv = document.createElement("div");
                const isSection = field.type === "section";
                const isFull = isSection || field.full;
                colDiv.className = isFull ? "col-12" : "col-12 col-md-6";
                if (field.id) colDiv.dataset.fieldId = field.id;

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
                rsSelect.addEventListener("change", function () {
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

                const updateIdFromSelection = (force) => {
                    const selectedOption = select.selectedOptions ? select.selectedOptions[0] : null;
                    const selectedId = selectedOption && selectedOption.dataset ? selectedOption.dataset.id : "";
                    if (force || !idInput.value) {
                        idInput.value = selectedId || "";
                    }
                };

                select.addEventListener("change", function () {
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
            toggle.onchange = applyClientesEncargadoVisibility;
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
                        input.addEventListener("input", function () {
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
                    input.addEventListener("input", applyMask);
                    input.addEventListener("blur", applyMask);
                }

                if (typeInput && !typeInput.dataset.maskDoc) {
                    typeInput.dataset.maskDoc = "1";
                    typeInput.addEventListener("change", applyMask);
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
