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

        function render(containerId) {
            const container = typeof containerId === 'string'
                ? document.getElementById(containerId)
                : containerId || document.getElementById('client-calendar-panel');

            if (!container) return;

            if (!currentWeekStart) {
                currentWeekStart = getMondayOfWeek(new Date());
            }

            container.innerHTML = buildPanelHtml();
            attachEvents(container);
            loadClients();
            loadSchedule();
        }

        function buildPanelHtml() {
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

                    <div id="client-calendar-grid" class="calendar-grid-wrapper">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                            <p class="mb-0">Cargando calendario...</p>
                        </div>
                    </div>

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

        function loadClients() {
            const select = document.getElementById('client-calendar-select');
            if (!select) return;

            if (ReferenceService && ReferenceService.isLoaded && !ReferenceService.isLoaded()) {
                ReferenceService.load().finally(loadClients);
                return;
            }

            const ref = ReferenceService && ReferenceService.get ? ReferenceService.get() : null;
            clientList = ref && ref.clientes ? ref.clientes : [];

            select.innerHTML = '<option value="">Todos los clientes</option>';
            clientList.forEach(c => {
                const id = c && typeof c === 'object' ? (c.id || c.ID || c.ID_CLIENTE || '') : '';
                const nombre = c && typeof c === 'object'
                    ? (c.razonSocial || c.nombre || '')
                    : String(c || '');

                const opt = document.createElement('option');
                opt.value = id ? String(id) : nombre;
                opt.textContent = nombre || String(id || '');
                opt.dataset.id = id ? String(id) : '';
                opt.dataset.nombre = nombre || String(id || '');
                select.appendChild(opt);
            });
        }

        function loadSchedule() {
            const container = document.getElementById('client-calendar-grid');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary"></div>
                        <div class="mt-2 text-muted">Cargando calendario...</div>
                    </div>
                `;
            }

            const weekStartStr = formatDateISO(currentWeekStart);

            ApiService.call('getWeeklyClientOverview', {
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
                        container.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Error al cargar calendario: ${escapeHtml(err.message || err)}
                            </div>
                        `;
                    }
                });
        }

        function renderCalendarGrid(data) {
            const container = document.getElementById('client-calendar-grid');
            if (!container) return;

            if (!data || !data.dias || data.dias.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-calendar3 display-4 mb-3 d-block opacity-50"></i>
                        <p class="mb-0">Sin datos para mostrar</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="calendar-week-grid">
                    <div class="calendar-days-row">
            `;

            data.dias.forEach((dia, idx) => {
                const hasClients = dia.clientes && dia.clientes.length > 0;
                const isWeekend = idx >= 5;
                const dayClasses = [
                    'calendar-day',
                    hasClients ? 'calendar-day--has-work' : 'calendar-day--free',
                    isWeekend ? 'calendar-day--weekend' : ''
                ].filter(Boolean).join(' ');

                html += `
                    <div class="${dayClasses}">
                        <div class="calendar-day-header">
                            <span class="calendar-day-name">${escapeHtml(dia.diaDisplay || '')}</span>
                            <span class="calendar-day-date">${escapeHtml(dia.fechaDisplay || '')}</span>
                        </div>
                        <div class="calendar-day-content">
                `;

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

                        html += `
                            <div class="calendar-client-card calendar-client-card--summary"
                                 data-cliente-id="${escapeHtml(cliente.idCliente || '')}"
                                 data-cliente-nombre="${escapeHtml(cliente.cliente || '')}"
                                 data-dia="${escapeHtml(dia.diaSemana || '')}">
                                <div class="calendar-client-name" title="${escapeHtml(cliente.cliente)}">
                                    <i class="bi bi-building me-1"></i>
                                    ${escapeHtml(cliente.cliente || cliente.razonSocial || '')}
                                </div>
                                <div class="calendar-client-time">
                                    <i class="bi bi-clock me-1"></i>
                                    ${formatHoras(cliente.totalHoras)} hs
                                </div>
                                ${direccionShort ? `
                                    <div class="calendar-client-address" title="${escapeHtml(cliente.direccion)}">
                                        <i class="bi bi-geo-alt me-1"></i>
                                        ${escapeHtml(direccionShort)}
                                    </div>
                                ` : ''}
                                ${empleadosUnique.length ? `
                                    <div class="calendar-client-employees">
                                        ${empleadosUnique.map(emp => `<span class="calendar-emp-chip">${escapeHtml(emp)}</span>`).join('')}
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
                            <span>Sin asignaciones</span>
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

            container.querySelectorAll('.calendar-client-card').forEach(card => {
                card.addEventListener('click', () => {
                    const clienteId = card.dataset.clienteId;
                    const clienteNombre = card.dataset.clienteNombre;
                    const dia = card.dataset.dia;
                    showClientDetails(clienteId, clienteNombre, dia);
                });
            });
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
            const asignacionesHtml = asignaciones.length
                ? asignaciones.map(a => {
                    const empleado = a.empleado || 'Sin asignar';
                    const hora = a.horaEntrada ? ` · ${a.horaEntrada}` : '';
                    const horas = a.horasPlan ? ` · ${formatHoras(a.horasPlan)} hs` : '';
                    return `
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-person text-primary"></i>
                            <span>${escapeHtml(empleado)}${escapeHtml(hora)}${escapeHtml(horas)}</span>
                        </div>
                    `;
                }).join('')
                : '<div class="text-muted small">Sin asignaciones</div>';

            const modalHtml = `
                <div class="modal fade" id="client-calendar-detail-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">
                                    <i class="bi bi-building me-2"></i>
                                    ${escapeHtml(clienteData.cliente || clienteData.razonSocial || '')}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <h6 class="text-muted text-uppercase small mb-3">
                                            <i class="bi bi-info-circle me-1"></i> Información del día
                                        </h6>
                                        <div class="d-flex flex-column gap-2">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-hourglass-split text-primary"></i>
                                                <span><strong>Horas:</strong> ${formatHoras(clienteData.totalHoras)} hs</span>
                                            </div>
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-people text-primary"></i>
                                                <span><strong>Empleados:</strong> ${asignaciones.length}</span>
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

                                <div class="mt-4">
                                    <h6 class="text-muted text-uppercase small mb-3">
                                        <i class="bi bi-people me-1"></i> Empleados asignados
                                    </h6>
                                    <div class="lt-surface p-3">
                                        <div class="d-flex flex-column gap-2">
                                            ${asignacionesHtml}
                                        </div>
                                    </div>
                                </div>

                                <div id="client-calendar-photos" class="mt-4 d-none">
                                    <h6 class="text-muted text-uppercase small mb-3">
                                        <i class="bi bi-images me-1"></i> Fotos del local
                                    </h6>
                                    <div class="row g-3" id="client-calendar-photos-container">
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

            const oldModal = document.getElementById('client-calendar-detail-modal');
            if (oldModal) oldModal.remove();

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('client-calendar-detail-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
            });

            if (clienteId && typeof ApiService !== 'undefined') {
                loadClientPhotos(clienteId);
            }
        }

        function loadClientPhotos(clienteId) {
            const photosSection = document.getElementById('client-calendar-photos');
            const photosContainer = document.getElementById('client-calendar-photos-container');

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

        function viewPhoto(fileId) {
            if (!fileId || typeof ApiService === 'undefined') return;

            ApiService.call('getClientMediaImage', fileId, 1600)
                .then(imgData => {
                    if (imgData && imgData.base64) {
                        const dataUrl = `data:${imgData.mimeType || 'image/jpeg'};base64,${imgData.base64}`;
                        const modalHtml = `
                            <div class="modal fade" id="client-calendar-photo-modal" tabindex="-1">
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

                        const oldModal = document.getElementById('client-calendar-photo-modal');
                        if (oldModal) oldModal.remove();

                        document.body.insertAdjacentHTML('beforeend', modalHtml);
                        const modalEl = document.getElementById('client-calendar-photo-modal');
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
            const select = container.querySelector('#client-calendar-select');
            if (select) {
                select.addEventListener('change', function () {
                    const selected = this.options[this.selectedIndex];
                    currentClientId = selected && selected.dataset ? (selected.dataset.id || '') : '';
                    currentClientName = selected && selected.dataset ? (selected.dataset.nombre || '') : '';
                    loadSchedule();
                });
            }

            const prevBtn = container.querySelector('#client-calendar-prev');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentWeekStart = addDays(currentWeekStart, -7);
                    loadSchedule();
                });
            }

            const nextBtn = container.querySelector('#client-calendar-next');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentWeekStart = addDays(currentWeekStart, 7);
                    loadSchedule();
                });
            }

            const todayBtn = container.querySelector('#client-calendar-today');
            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    currentWeekStart = getMondayOfWeek(new Date());
                    loadSchedule();
                });
            }

            const refreshBtn = container.querySelector('#client-calendar-refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => loadSchedule());
            }
        }

        return {
            render
        };
    })();

    global.ClientCalendarPanel = ClientCalendarPanel;
})(typeof window !== 'undefined' ? window : this);
