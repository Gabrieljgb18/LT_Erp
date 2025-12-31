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

        // Helpers
        function escapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function formatHoras(h) {
            const num = Number(h);
            return isNaN(num) ? '0' : num.toFixed(1).replace('.0', '');
        }

        function getMondayOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }

        function formatDateISO(date) {
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

            container.innerHTML = buildPanelHtml();
            attachEvents(container);
            loadEmpleados();
        }

        /**
         * Construye el HTML del panel
         */
        function buildPanelHtml() {
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
                    <div id="calendar-grid-container" class="calendar-grid-wrapper">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                            <p class="mb-0">Selecciona un empleado para ver su calendario</p>
                        </div>
                    </div>

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
                                    <small class="text-muted">Clientes</small>
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

        /**
         * Renderiza la grilla del calendario
         */
        function renderCalendarGrid(data) {
            const container = document.getElementById('calendar-grid-container');
            if (!container || !data || !data.dias) return;

            const dias = data.dias;

            // Construir grid semanal
            let html = `
                <div class="calendar-week-grid">
                    <div class="calendar-days-row">
            `;

            dias.forEach((dia, idx) => {
                const hasClients = dia.clientes && dia.clientes.length > 0;
                const isWeekend = idx >= 5; // Sábado y Domingo
                const dayClasses = [
                    'calendar-day',
                    hasClients ? 'calendar-day--has-work' : 'calendar-day--free',
                    isWeekend ? 'calendar-day--weekend' : ''
                ].filter(Boolean).join(' ');

                html += `
                    <div class="${dayClasses}">
                        <div class="calendar-day-header">
                            <span class="calendar-day-name">${escapeHtml(dia.diaDisplay)}</span>
                            <span class="calendar-day-date">${escapeHtml(dia.fechaDisplay)}</span>
                        </div>
                        <div class="calendar-day-content">
                `;

                if (hasClients) {
                    dia.clientes.forEach(cliente => {
                        const horasDisplay = formatHoras(cliente.horasPlan);
                        const direccionShort = cliente.direccion
                            ? (cliente.direccion.length > 30 ? cliente.direccion.substring(0, 30) + '...' : cliente.direccion)
                            : '';

                        html += `
                            <div class="calendar-client-card" 
                                 data-cliente-id="${escapeHtml(cliente.idCliente)}"
                                 data-cliente-nombre="${escapeHtml(cliente.cliente)}"
                                 data-dia="${escapeHtml(dia.diaSemana)}">
                                <div class="calendar-client-name" title="${escapeHtml(cliente.cliente)}">
                                    <i class="bi bi-building me-1"></i>
                                    ${escapeHtml(cliente.cliente || cliente.razonSocial)}
                                </div>
                                <div class="calendar-client-time">
                                    <i class="bi bi-clock me-1"></i>
                                    ${escapeHtml(cliente.horaEntrada || '--:--')} 
                                    <span class="badge bg-primary ms-1">${horasDisplay} hs</span>
                                </div>
                                ${direccionShort ? `
                                    <div class="calendar-client-address" title="${escapeHtml(cliente.direccion)}">
                                        <i class="bi bi-geo-alt me-1"></i>
                                        ${escapeHtml(direccionShort)}
                                    </div>
                                ` : ''}
                                <div class="calendar-client-expand">
                                    <i class="bi bi-eye"></i> Ver detalles
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html += `
                        <div class="calendar-no-work">
                            <i class="bi bi-moon-stars opacity-50"></i>
                            <span>Sin asignación</span>
                        </div>
                    `;
                }

                html += `
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            container.innerHTML = html;

            // Attach events a las tarjetas
            container.querySelectorAll('.calendar-client-card').forEach(card => {
                card.addEventListener('click', () => {
                    const clienteId = card.dataset.clienteId;
                    const clienteNombre = card.dataset.clienteNombre;
                    const dia = card.dataset.dia;
                    showClientDetails(clienteId, clienteNombre, dia);
                });
            });
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

            // Crear modal
            const modalHtml = `
                <div class="modal fade" id="client-detail-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">
                                    <i class="bi bi-building me-2"></i>
                                    ${escapeHtml(clienteData.cliente || clienteData.razonSocial)}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <h6 class="text-muted text-uppercase small mb-3">
                                            <i class="bi bi-info-circle me-1"></i> Información de la visita
                                        </h6>
                                        <div class="d-flex flex-column gap-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-clock text-primary"></i>
                                                <span><strong>Horario:</strong> ${escapeHtml(clienteData.horaEntrada || 'No especificado')}</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-hourglass-split text-primary"></i>
                                                <span><strong>Horas:</strong> ${formatHoras(clienteData.horasPlan)} hs</span>
                                            </div>
                                            ${clienteData.observaciones ? `
                                                <div class="d-flex align-items-start gap-2">
                                                    <i class="bi bi-sticky text-warning mt-1"></i>
                                                    <span><strong>Obs:</strong> ${escapeHtml(clienteData.observaciones)}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted text-uppercase small mb-3">
                                            <i class="bi bi-building me-1"></i> Datos del cliente
                                        </h6>
                                        <div class="d-flex flex-column gap-2">
                                            ${clienteData.idCliente ? `
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-hash text-secondary"></i>
                                                    <span><strong>ID:</strong> ${escapeHtml(clienteData.idCliente)}</span>
                                                </div>
                                            ` : ''}
                                            ${clienteData.direccion ? `
                                                <div class="d-flex align-items-start gap-2">
                                                    <i class="bi bi-geo-alt text-danger mt-1"></i>
                                                    <span>${escapeHtml(clienteData.direccion)}</span>
                                                </div>
                                            ` : ''}
                                            ${clienteData.telefono ? `
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-telephone text-success"></i>
                                                    <a href="tel:${escapeHtml(clienteData.telefono)}">${escapeHtml(clienteData.telefono)}</a>
                                                </div>
                                            ` : ''}
                                            ${clienteData.encargado ? `
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-person text-info"></i>
                                                    <span><strong>Contacto:</strong> ${escapeHtml(clienteData.encargado)}</span>
                                                </div>
                                            ` : ''}
                                            ${clienteData.correo ? `
                                                <div class="d-flex align-items-center gap-2">
                                                    <i class="bi bi-envelope text-primary"></i>
                                                    <a href="mailto:${escapeHtml(clienteData.correo)}">${escapeHtml(clienteData.correo)}</a>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Fotos (si existe ClientMediaController) -->
                                <div id="client-detail-photos" class="mt-4 d-none">
                                    <h6 class="text-muted text-uppercase small mb-3">
                                        <i class="bi bi-images me-1"></i> Fotos del local
                                    </h6>
                                    <div class="row g-3" id="client-photos-container">
                                        <div class="text-center text-muted py-3">
                                            <div class="spinner-border spinner-border-sm"></div>
                                            Cargando fotos...
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                ${clienteData.direccion ? `
                                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clienteData.direccion)}" 
                                       target="_blank" class="btn btn-outline-primary">
                                        <i class="bi bi-map me-1"></i> Ver en mapa
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remover modal anterior si existe
            const oldModal = document.getElementById('client-detail-modal');
            if (oldModal) oldModal.remove();

            // Insertar y mostrar modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('client-detail-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            // Limpiar al cerrar
            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
            });

            // Cargar fotos si existe ApiService
            if (clienteId && typeof ApiService !== 'undefined') {
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

            photosContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <div class="spinner-border spinner-border-sm"></div>
                    Cargando fotos...
                </div>
            `;

            ApiService.call('listClientMedia', clienteId)
                .then(media => {
                    const fachada = media && Array.isArray(media.fachada) ? media.fachada : [];
                    const llave = media && Array.isArray(media.llave) ? media.llave : [];

                    if (!fachada.length && !llave.length) {
                        photosSection.classList.add('d-none');
                        return;
                    }

                    photosSection.classList.remove('d-none');

                    const buildGroup = (items, title, icon, iconClass) => {
                        const count = items.length;
                        const thumbs = count
                            ? items.map(photo => {
                                const mime = photo.mimeType || 'image/jpeg';
                                const base64 = photo.thumbnailBase64 || '';
                                const dataUrl = base64 ? `data:${mime};base64,${base64}` : '';
                                return `
                                    <button type="button" class="client-photo-thumb" data-photo-id="${escapeHtml(photo.fileId || '')}" title="${escapeHtml(photo.name || title)}">
                                        ${dataUrl ? `<img src="${dataUrl}" alt="${escapeHtml(title)}">` : '<i class=\"bi bi-image\"></i>'}
                                    </button>
                                `;
                            }).join('')
                            : '<div class="text-muted small">Sin fotos</div>';

                        return `
                            <div class="col-12 col-md-6">
                                <div class="lt-surface p-2 h-100">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="bi ${icon} ${iconClass}"></i>
                                            <span class="fw-semibold small">${escapeHtml(title)}</span>
                                        </div>
                                        <span class="small text-muted">${count} foto${count === 1 ? '' : 's'}</span>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${thumbs}
                                    </div>
                                </div>
                            </div>
                        `;
                    };

                    photosContainer.innerHTML = `
                        ${buildGroup(fachada, 'Fachadas', 'bi-building', 'text-primary')}
                        ${buildGroup(llave, 'Llaves', 'bi-key-fill', 'text-warning')}
                    `;

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
            if (!fileId || typeof ApiService === 'undefined') return;

            ApiService.call('getClientMediaImage', fileId, 1600)
                .then(imgData => {
                    if (imgData && imgData.base64) {
                        const dataUrl = `data:${imgData.mimeType || 'image/jpeg'};base64,${imgData.base64}`;
                        const modalHtml = `
                            <div class="modal fade" id="photo-viewer-modal" tabindex="-1">
                                <div class="modal-dialog modal-xl modal-dialog-centered">
                                    <div class="modal-content bg-dark">
                                        <div class="modal-body p-0 text-center">
                                            <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                                                    data-bs-dismiss="modal" style="z-index: 10;"></button>
                                            <img src="${dataUrl}" alt="Foto" 
                                                 style="max-width: 100%; max-height: 90vh; object-fit: contain;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        const oldModal = document.getElementById('photo-viewer-modal');
                        if (oldModal) oldModal.remove();

                        document.body.insertAdjacentHTML('beforeend', modalHtml);
                        const modalEl = document.getElementById('photo-viewer-modal');
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
            document.getElementById('summary-clientes').textContent = data.resumen.totalClientes || 0;
            document.getElementById('summary-dias').textContent = data.resumen.diasTrabajo || 0;
        }

        /**
         * Carga la agenda del empleado seleccionado
         */
        function loadSchedule() {
            if (!currentEmpleado && !currentIdEmpleado) return;

            const container = document.getElementById('calendar-grid-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary"></div>
                        <div class="mt-2 text-muted">Cargando agenda...</div>
                    </div>
                `;
            }

            const weekStartStr = formatDateISO(currentWeekStart);

            ApiService.call('getEmployeeWeeklySchedule', {
                empleado: currentEmpleado,
                idEmpleado: currentIdEmpleado,
                weekStartDate: weekStartStr
            })
                .then(data => {
                    if (data && data.error) {
                        throw new Error(data.error);
                    }
                    scheduleData = data;
                    renderCalendarGrid(data);
                    updateSummary(data);
                    updateWeekLabel();

                    // Habilitar botón PDF
                    const pdfBtn = document.getElementById('calendar-generate-pdf');
                    if (pdfBtn) pdfBtn.disabled = false;
                })
                .catch(err => {
                    console.error('Error cargando agenda:', err);
                    if (container) {
                        container.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Error al cargar la agenda: ${escapeHtml(err.message || err)}
                            </div>
                        `;
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

            ApiService.call('getEmpleadosConId')
                .then(empleados => {
                    empleadosList = empleados || [];

                    select.innerHTML = '<option value="">Seleccionar empleado...</option>';
                    empleadosList.forEach(emp => {
                        const id = emp && emp.id != null ? String(emp.id).trim() : '';
                        const nombre = emp && emp.nombre ? String(emp.nombre).trim() : '';
                        const opt = document.createElement('option');
                        opt.value = id || nombre;
                        opt.textContent = nombre || id || 'Sin nombre';
                        opt.dataset.id = id;
                        opt.dataset.nombre = nombre || id;
                        select.appendChild(opt);
                    });
                })
                .catch(err => {
                    console.error('Error cargando empleados:', err);
                    // Fallback: usar referenceData
                    if (typeof ReferenceService !== 'undefined') {
                        const refData = ReferenceService.get();
                        if (refData && refData.empleados) {
                            select.innerHTML = '<option value="">Seleccionar empleado...</option>';
                            refData.empleados.forEach(emp => {
                                const opt = document.createElement('option');
                                const nombre = String(emp || '').trim();
                                opt.value = nombre;
                                opt.textContent = nombre;
                                opt.dataset.nombre = nombre;
                                opt.dataset.id = '';
                                select.appendChild(opt);
                            });
                        }
                    }
                });
        }

        /**
         * Genera y descarga el PDF de hoja de ruta
         */
        function generatePdf() {
            if (!currentEmpleado && !currentIdEmpleado) {
                if (Alerts) Alerts.showAlert('Selecciona un empleado primero', 'warning');
                return;
            }

            const btn = document.getElementById('calendar-generate-pdf');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generando...';
            }

            const weekStartStr = formatDateISO(currentWeekStart);

            ApiService.call('generateEmployeeSchedulePdf', {
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
                        btn.disabled = false;
                        btn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i><span>Generar PDF</span>';
                    }
                });
        }

        /**
         * Attacha eventos a los elementos del panel
         */
        function attachEvents(container) {
            // Selector de empleado
            const empleadoSelect = container.querySelector('#calendar-empleado-select');
            if (empleadoSelect) {
                empleadoSelect.addEventListener('change', function () {
                    const selected = this.options[this.selectedIndex];
                    currentIdEmpleado = selected && selected.dataset ? (selected.dataset.id || '') : '';
                    currentEmpleado = selected && selected.dataset ? (selected.dataset.nombre || selected.textContent || '') : (this.value || '');

                    if (currentEmpleado) {
                        loadSchedule();
                    } else {
                        scheduleData = null;
                        document.getElementById('calendar-grid-container').innerHTML = `
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                                <p class="mb-0">Selecciona un empleado para ver su calendario</p>
                            </div>
                        `;
                        document.getElementById('calendar-summary').classList.add('d-none');
                        document.getElementById('calendar-generate-pdf').disabled = true;
                    }
                });
            }

            // Navegación semanal
            const prevBtn = container.querySelector('#calendar-prev-week');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentWeekStart = addDays(currentWeekStart, -7);
                    if (currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            const nextBtn = container.querySelector('#calendar-next-week');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentWeekStart = addDays(currentWeekStart, 7);
                    if (currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            const todayBtn = container.querySelector('#calendar-today');
            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    currentWeekStart = getMondayOfWeek(new Date());
                    if (currentEmpleado || currentIdEmpleado) {
                        loadSchedule();
                    } else {
                        updateWeekLabel();
                    }
                });
            }

            // Generar PDF
            const pdfBtn = container.querySelector('#calendar-generate-pdf');
            if (pdfBtn) {
                pdfBtn.addEventListener('click', generatePdf);
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
