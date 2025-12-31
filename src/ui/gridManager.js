/**
 * Grid Manager
 * Maneja la visualización de datos en formato de grilla/tabla
 */

(function (global) {
    const GridManager = (() => {
        let currentFormat = null;
        let allRecords = [];
        let currentEditingRecord = null;

        /**
         * Renderiza la grilla con los registros del formato actual
         */
        function renderGrid(tipoFormato, records) {
            currentFormat = tipoFormato;

            // Vista resumida especial para asistencia diaria
            if (tipoFormato === 'ASISTENCIA' && global.AttendanceDailyUI) {
                global.AttendanceDailyUI.renderSummary(records || []);
                return;
            }

            // Los registros vienen en formato {id, rowNumber, record}
            // Extraer solo los records y agregar el ID
            allRecords = (records || []).map(item => {
                if (item.record) {
                    // Agregar el ID al record para poder usarlo después
                    item.record.ID = item.id;
                    item.record._rowNumber = item.rowNumber;
                    return item.record;
                }
                return item;
            });

            const formDef = FORM_DEFINITIONS[tipoFormato];
            if (!formDef) return;

            // Obtener los 5 campos más relevantes
            const relevantFields = formDef.fields.slice(0, 5);

            // Renderizar headers
            const headersRow = document.getElementById('grid-headers');
            if (headersRow) {
                headersRow.innerHTML = '';

                relevantFields.forEach(field => {
                    const th = document.createElement('th');
                    th.textContent = field.label;
                    headersRow.appendChild(th);
                });

                // Columna de acciones
                const thActions = document.createElement('th');
                thActions.textContent = 'Acciones';
                thActions.style.width = '150px';
                thActions.style.textAlign = 'center';
                headersRow.appendChild(thActions);
            }

            // Renderizar body
            const tbody = document.getElementById('grid-body');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (!allRecords.length) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = relevantFields.length + 1;
                td.className = 'text-center text-muted py-5';
                td.textContent = 'No hay registros para mostrar';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }

            allRecords.forEach(record => {
                const tr = document.createElement('tr');

                relevantFields.forEach(field => {
                    const td = document.createElement('td');
                    // Buscar el valor usando el ID del campo (puede estar en mayúsculas o minúsculas)
                    let value = record[field.id];

                    // Si no encuentra, intentar con el label
                    if (value === undefined || value === null) {
                        value = record[field.label];
                    }

                    // Si aún no encuentra, intentar buscar case-insensitive
                    if (value === undefined || value === null) {
                        const keys = Object.keys(record);
                        const matchingKey = keys.find(k => k.toUpperCase() === field.id.toUpperCase());
                        if (matchingKey) {
                            value = record[matchingKey];
                        }
                    }

                    // Formatear según el tipo
                    if (field.type === 'boolean') {
                        value = value ? '✅ Activo' : '❌ Inactivo';
                    } else if (field.type === 'date' && value) {
                        try {
                            value = new Date(value).toLocaleDateString('es-ES');
                        } catch (e) {
                            // Mantener el valor original si no se puede convertir
                        }
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

                // Botones de acción - inline y más pequeños
                const tdActions = document.createElement('td');
                tdActions.style.textAlign = 'center';
                tdActions.style.whiteSpace = 'nowrap';

                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-sm btn-outline-primary lt-btn-icon me-1';
                btnEdit.innerHTML = '<i class=\"bi bi-pencil-fill\"></i>';
                btnEdit.title = 'Editar';
                btnEdit.onclick = () => editRecord(record);

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn btn-sm btn-outline-danger lt-btn-icon';
                btnDelete.innerHTML = '<i class=\"bi bi-trash-fill\"></i>';
                btnDelete.title = 'Eliminar';
                btnDelete.onclick = () => deleteRecord(record);

                tdActions.appendChild(btnEdit);
                tdActions.appendChild(btnDelete);
                tr.appendChild(tdActions);

                tbody.appendChild(tr);
            });
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
                } else if (field.type === 'date' && value) {
                    // Convertir fecha a formato YYYY-MM-DD
                    const date = new Date(value);
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = value || '';
                }
            });
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

            ApiService.call('deleteRecord', currentFormat, id)
                .then(function () {
                    Alerts && Alerts.showAlert('✅ Registro eliminado correctamente.', 'success');
                    if (ReferenceService) {
                        ReferenceService.load().then(function () {
                            if (FormManager) {
                                FormManager.updateReferenceData(ReferenceService.get());
                            }
                        });
                    }
                    refreshGrid();
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
            if (ApiService) {
                ApiService.call('searchRecords', currentFormat, '')
                    .then(records => {
                        renderGrid(currentFormat, records);
                    })
                    .catch(err => {
                        console.error('Error al recargar la grilla:', err);
                    });
            }
        }

        return {
            renderGrid,
            openModal,
            closeModal,
            getCurrentEditingRecord,
            refreshGrid
        };
    })();

    global.GridManager = GridManager;
})(typeof window !== 'undefined' ? window : this);
