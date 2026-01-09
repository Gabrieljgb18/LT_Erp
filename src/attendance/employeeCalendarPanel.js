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
