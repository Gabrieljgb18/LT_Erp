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
        const isTruthyValue = (value) => {
            if (typeof DataUtils !== "undefined" && DataUtils && typeof DataUtils.isTruthy === "function") {
                return DataUtils.isTruthy(value);
            }
            const str = value == null ? "" : String(value).trim().toLowerCase();
            return (
                value === true ||
                value === 1 ||
                value === "1" ||
                str === "true" ||
                str === "activo" ||
                str === "si" ||
                str === "sí"
            );
        };

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
                    input.checked = isTruthyValue(value);
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
            const errorDetails = [];
            const inputUtils = global.InputUtils || {};
            const originalRecord = (currentMode === "edit" && global.GridManager && typeof global.GridManager.getCurrentEditingRecord === "function")
                ? global.GridManager.getCurrentEditingRecord()
                : null;

            function normalizeBool(value) {
                return isTruthyValue(value);
            }

            function normalizeNumber(value) {
                if (value === null || value === undefined || value === "") return null;
                if (NumberUtils && typeof NumberUtils.parseLocalizedNumber === "function") {
                    return NumberUtils.parseLocalizedNumber(value);
                }
                const n = Number(value);
                return isNaN(n) ? null : n;
            }

            function normalizeString(value) {
                if (value === null || value === undefined) return "";
                return String(value).trim();
            }

            function isSameValue(field, currentValue, previousValue) {
                if (!field) return normalizeString(currentValue) === normalizeString(previousValue);
                if (field.type === "boolean") {
                    return normalizeBool(currentValue) === normalizeBool(previousValue);
                }
                if (field.type === "number") {
                    const n1 = normalizeNumber(currentValue);
                    const n2 = normalizeNumber(previousValue);
                    if (n1 === null && n2 === null) {
                        return normalizeString(currentValue) === normalizeString(previousValue);
                    }
                    if (n1 !== null && n2 !== null) return n1 === n2;
                    return normalizeString(currentValue) === normalizeString(previousValue);
                }
                if (field.type === "date" || field.type === "time") {
                    return normalizeString(currentValue) === normalizeString(previousValue);
                }
                return normalizeString(currentValue) === normalizeString(previousValue);
            }

            function shouldSkipValidation(field, input) {
                if (!field || !input) return true;
                if (field.hidden || input.type === "hidden") return true;
                if (input.closest && input.closest(".d-none")) return true;
                return false;
            }

            function registerError(field, input, reason) {
                if (!field || !input) return;
                input.classList.add("is-invalid");
                errorFields.push(field.label || field.id);
                if (reason) {
                    const label = field.label || field.id;
                    const value = record[field.id];
                    const valueLabel = value !== undefined && value !== null && String(value).trim() !== ""
                        ? `: "${value}"`
                        : "";
                    errorDetails.push(label + " (" + reason + valueLabel + ")");
                }
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

            const sanitizeCoord = (value, min, max) => {
                if (value == null || String(value).trim() === "") return "";
                let num = null;
                if (NumberUtils && typeof NumberUtils.parseLocalizedNumber === "function") {
                    num = NumberUtils.parseLocalizedNumber(value);
                } else {
                    num = Number(value);
                }
                if (num == null || isNaN(num)) return "";
                if (num < min || num > max) return "";
                return String(num);
            };

            if (record["MAPS LAT"] !== undefined) {
                record["MAPS LAT"] = sanitizeCoord(record["MAPS LAT"], -90, 90);
            }
            if (record["MAPS LNG"] !== undefined) {
                record["MAPS LNG"] = sanitizeCoord(record["MAPS LNG"], -180, 180);
            }

            if (originalRecord) {
                formDef.fields.forEach(function (field) {
                    if (!field || !field.id) return;
                    if (!Object.prototype.hasOwnProperty.call(record, field.id)) return;
                    const currentValue = record[field.id];
                    const previousValue = originalRecord[field.id];
                    if (isSameValue(field, currentValue, previousValue)) {
                        delete record[field.id];
                    }
                });
            }

            formDef.fields.forEach(function (field) {
                const input = document.getElementById("field-" + field.id);
                if (!input) return;
                if (shouldSkipValidation(field, input)) return;
                const value = record[field.id];
                const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

                if (field.type === "phone" && hasValue) {
                    if (typeof inputUtils.isValidPhone === "function") {
                        if (!inputUtils.isValidPhone(value)) {
                            registerError(field, input, "teléfono inválido");
                        }
                    }
                }

                if (field.type === "email" && hasValue) {
                    if (typeof inputUtils.isValidEmail === "function") {
                        if (!inputUtils.isValidEmail(value)) {
                            registerError(field, input, "email inválido");
                        }
                    }
                }

                if (field.type === "docNumber" && hasValue) {
                    const docTypeField = field.docTypeField || "TIPO DOCUMENTO";
                    const docType = field.docTypeValue || record[docTypeField] || "";
                    if (typeof inputUtils.isValidDocNumber === "function") {
                        if (!inputUtils.isValidDocNumber(value, docType)) {
                            const reason = docType
                                ? "documento inválido para " + docType
                                : "tipo de documento inválido";
                            registerError(field, input, reason);
                        }
                    }
                }

                if (field.type === "number" && hasValue) {
                    const parsedNumber = NumberUtils && typeof NumberUtils.parseLocalizedNumber === "function"
                        ? NumberUtils.parseLocalizedNumber(value)
                        : Number(value);
                    if (parsedNumber === null || isNaN(parsedNumber)) {
                        registerError(field, input, "número inválido");
                    }
                }

                if (typeof input.checkValidity === "function" && !input.checkValidity()) {
                    registerError(field, input, "valor inválido");
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
                    errorDetails.push((rule.label || rule.labelField) + " (falta ID asociado)");
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                const unique = Array.from(new Set(errorFields)).filter(Boolean);
                const details = Array.from(new Set(errorDetails)).filter(Boolean);
                const msg = (details.length || unique.length)
                    ? "Revisá los campos: " + (details.length ? details.join(", ") : unique.join(", "))
                    : "Por favor completá los campos requeridos.";
                if (Alerts) Alerts.showAlert(msg, "warning");
                return Promise.resolve(false);
            }

            UiState.setGlobalLoading(true, "Guardando...");

            if (currentMode === "edit" && !selectedRowNumber) {
                if (Alerts) Alerts.showAlert("No se pudo resolver el ID del registro a actualizar.", "danger");
                UiState.setGlobalLoading(false);
                return Promise.resolve(false);
            }

            if (currentMode === "edit" && selectedRowNumber) {
                // Update existing (selectedRowNumber now contains ID)
                if (!RecordsData || typeof RecordsData.updateRecord !== "function") {
                    if (Alerts) Alerts.showAlert("No se pudo actualizar el registro.", "danger");
                    UiState.setGlobalLoading(false);
                    return Promise.resolve(false);
                }
                const payload = selectedRowIndex
                    ? { id: selectedRowNumber, rowNumber: selectedRowIndex }
                    : selectedRowNumber;
                if (tipoFormato === "EMPLEADOS") {
                    try {
                        console.log("[DEBUG] update EMPLEADOS payload:", payload, "record:", record);
                    } catch (e) {
                        // ignore
                    }
                }
                return RecordsData.updateRecord(tipoFormato, payload, record)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro actualizado correctamente.", "success");
                        enterCreateMode(true);

                        // Invalidar caché de referencias para CLIENTES y EMPLEADOS
                        if ((tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS") && global.ApiService && global.ApiService.dataCache) {
                            global.ApiService.dataCache.reference = null;
                            global.ApiService.dataCache.referenceTs = 0;
                        }

                        // Forzar recarga de referencias
                        const refreshPromise = (tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS")
                            ? (RecordsData && typeof RecordsData.refreshReferenceData === "function"
                                ? RecordsData.refreshReferenceData()
                                : Promise.resolve(null))
                            : refreshReferencesIfNeeded(tipoFormato);

                        return refreshPromise.then(function (refData) {
                            if (refData && global.FormManager && typeof global.FormManager.updateReferenceData === "function") {
                                global.FormManager.updateReferenceData(refData);
                            }
                            if (global.GridManager && typeof global.GridManager.refreshGrid === "function") {
                                global.GridManager.refreshGrid({ force: "direct", resetPage: true, source: "recordManager:update" });
                            }
                            return true;
                        });
                    })
                    .catch(function (err) {
                        const msg = (err && (err.message || err.toString())) || "Error desconocido";
                        if (Alerts) Alerts.showAlert("Error al actualizar: " + msg, "danger");
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

                        // Invalidar caché de referencias para CLIENTES y EMPLEADOS
                        if ((tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS") && global.ApiService && global.ApiService.dataCache) {
                            global.ApiService.dataCache.reference = null;
                            global.ApiService.dataCache.referenceTs = 0;
                        }

                        // Forzar recarga de referencias
                        const refreshPromise = (tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS")
                            ? (RecordsData && typeof RecordsData.refreshReferenceData === "function"
                                ? RecordsData.refreshReferenceData()
                                : Promise.resolve(null))
                            : refreshReferencesIfNeeded(tipoFormato);

                        return refreshPromise.then(function (refData) {
                            if (refData && global.FormManager && typeof global.FormManager.updateReferenceData === "function") {
                                global.FormManager.updateReferenceData(refData);
                            }
                            if (global.GridManager && typeof global.GridManager.refreshGrid === "function") {
                                global.GridManager.refreshGrid({ force: "direct", resetPage: true, source: "recordManager:create" });
                            }
                            return true;
                        });
                    })
                    .catch(function (err) {
                        const msg = (err && (err.message || err.toString())) || "Error desconocido";
                        if (Alerts) Alerts.showAlert("Error al guardar: " + msg, "danger");
                        return false;
                    })
                    .finally(function () {
                        UiState.setGlobalLoading(false);
                    });
            }
        }

        function deleteRecord() {
            if (currentMode !== "edit" || (!selectedRowNumber && !selectedRowIndex)) {
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
                    ? { id: selectedRowNumber || "", rowNumber: selectedRowIndex }
                    : selectedRowNumber;

                return RecordsData.deleteRecord(tipoFormato, payload)
                    .then(function () {
                        if (Alerts) Alerts.showAlert("✅ Registro eliminado correctamente.", "success");
                        enterCreateMode(true);

                        // Invalidar caché de referencias para CLIENTES y EMPLEADOS
                        if ((tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS") && global.ApiService && global.ApiService.dataCache) {
                            global.ApiService.dataCache.reference = null;
                            global.ApiService.dataCache.referenceTs = 0;
                        }

                        // Forzar recarga de referencias
                        const refreshPromise = (tipoFormato === "CLIENTES" || tipoFormato === "EMPLEADOS")
                            ? (RecordsData && typeof RecordsData.refreshReferenceData === "function"
                                ? RecordsData.refreshReferenceData()
                                : Promise.resolve(null))
                            : refreshReferencesIfNeeded(tipoFormato);

                        return refreshPromise.then(function (refData) {
                            if (refData && global.FormManager && typeof global.FormManager.updateReferenceData === "function") {
                                global.FormManager.updateReferenceData(refData);
                            }
                            if (global.location && typeof global.location.reload === "function") {
                                setTimeout(function () {
                                    global.location.reload();
                                }, 300);
                            }
                            return true;
                        });
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
