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
