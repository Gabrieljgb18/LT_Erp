/**
 * Panel de fotos para Clientes (Fachada / Llave)
 * Se renderiza dentro del modal de edición de CLIENTES.
 */
var ClientMediaPanel = (function () {
    const SECTION_ID = 'client-media-section';

    function escapeHtml_(val) {
        if (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function') {
            return HtmlHelpers.escapeHtml(val);
        }
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getEditingClient_() {
        try {
            if (typeof GridManager !== 'undefined' && GridManager && typeof GridManager.getCurrentEditingRecord === 'function') {
                const r = GridManager.getCurrentEditingRecord();
                if (r) return r;
            }
        } catch (e) {
            // ignore
        }
        return null;
    }

    function getClientIdFromRecord_(rec) {
        if (!rec) return '';
        return String(rec.ID || rec.Id || rec.id || '').trim();
    }

    function getClientDisplayNameFromRecord_(rec) {
        if (!rec) return '';
        return String(rec['RAZON SOCIAL'] || rec['NOMBRE'] || '').trim();
    }

    function buildCardHtml_(kind, title, icon, iconClass) {
        const key = kind.toLowerCase();
        return `
            <div class="col-12 col-md-6">
                <div class="lt-surface p-3 h-100">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi ${escapeHtml_(icon)} ${escapeHtml_(iconClass)}"></i>
                            <div class="fw-semibold">${escapeHtml_(title)}</div>
                        </div>
                        <span class="badge text-bg-light border text-muted">${escapeHtml_(kind)}</span>
                    </div>

                    <div class="border rounded-3 bg-white overflow-hidden d-flex align-items-center justify-content-center"
                        style="height: 170px;">
                        <div id="client-media-${key}-placeholder" class="text-center text-muted px-3">
                            <i class="bi bi-image" style="font-size: 1.6rem; opacity: 0.35;"></i>
                            <div class="small mt-1">Sin foto</div>
                        </div>
                        <img id="client-media-${key}-img" class="w-100 h-100 d-none" style="object-fit: cover;" alt="${escapeHtml_(title)}">
                    </div>

                    <div class="d-flex flex-wrap gap-2 mt-2">
                        <button type="button" class="btn btn-sm btn-outline-primary lt-btn-compact"
                            data-client-media-action="upload" data-client-media-kind="${escapeHtml_(kind)}">
                            <i class="bi bi-upload me-1"></i><span id="client-media-${key}-upload-label">Subir</span>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary lt-btn-compact"
                            data-client-media-action="view" data-client-media-kind="${escapeHtml_(kind)}" disabled>
                            <i class="bi bi-eye me-1"></i>Ver
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger lt-btn-compact"
                            data-client-media-action="delete" data-client-media-kind="${escapeHtml_(kind)}" disabled>
                            <i class="bi bi-trash3 me-1"></i>Eliminar
                        </button>
                        <input type="file" class="d-none" accept="image/*"
                            id="client-media-${key}-input" data-client-media-input="${escapeHtml_(kind)}">
                    </div>

                    <div class="small text-muted mt-2" id="client-media-${key}-meta"></div>
                </div>
            </div>
        `;
    }

    function render(containerEl) {
        if (!containerEl) return;

        const existing = document.getElementById(SECTION_ID);
        if (existing) existing.remove();

        const rec = getEditingClient_();
        const clientId = getClientIdFromRecord_(rec);
        const displayName = getClientDisplayNameFromRecord_(rec);

        const section = document.createElement('div');
        section.className = 'col-12';
        section.id = SECTION_ID;
        section.innerHTML = `
            <div class="lt-surface lt-surface--subtle p-3">
                <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 40px; height: 40px; background: rgba(99,102,241,0.12);">
                            <i class="bi bi-camera-fill text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-semibold">Fotos del cliente</div>
                            <div class="small text-muted">Fachada y llaves asociadas al cliente.</div>
                        </div>
                    </div>
                    <span class="lt-chip lt-chip--muted">
                        <i class="bi bi-hash"></i>
                        <span>ID: ${escapeHtml_(clientId || '—')}</span>
                    </span>
                </div>

                <div class="row g-2">
                    ${buildCardHtml_('FACHADA', 'Fachada', 'bi-building', 'text-primary')}
                    ${buildCardHtml_('LLAVE', 'Llave', 'bi-key-fill', 'text-warning')}
                </div>

                <div class="small text-muted mt-2" id="client-media-hint"></div>
            </div>
        `;

        containerEl.appendChild(section);

        const hint = document.getElementById('client-media-hint');
        if (hint) {
            hint.innerHTML = clientId
                ? `Los archivos se guardan en Drive y se renombran como <span class="text-body-secondary fw-semibold">CLIENTE_${escapeHtml_(clientId)}__NOMBRE__TIPO</span>.`
                : 'Guardá el cliente para poder cargar fotos (necesitamos el ID).';
        }

        attachEvents(clientId, displayName);

        if (clientId) {
            refresh(clientId);
        } else {
            // Si no hay ID, deshabilitar acciones
            disableAllActions_(true);
        }
    }

    function disableAllActions_(disabled) {
        document.querySelectorAll('[data-client-media-action]').forEach(btn => {
            btn.disabled = !!disabled;
        });
    }

    function setCardState_(kind, state) {
        const key = kind.toLowerCase();
        const img = document.getElementById(`client-media-${key}-img`);
        const placeholder = document.getElementById(`client-media-${key}-placeholder`);
        const meta = document.getElementById(`client-media-${key}-meta`);
        const uploadLabel = document.getElementById(`client-media-${key}-upload-label`);
        const viewBtn = document.querySelector(`[data-client-media-action="view"][data-client-media-kind="${kind}"]`);
        const deleteBtn = document.querySelector(`[data-client-media-action="delete"][data-client-media-kind="${kind}"]`);

        if (!img || !placeholder) return;

        if (state && state.exists) {
            const dataUrl = `data:${state.mimeType || 'image/jpeg'};base64,${state.previewBase64 || ''}`;
            img.src = dataUrl;
            img.classList.remove('d-none');
            placeholder.classList.add('d-none');
            if (uploadLabel) uploadLabel.textContent = 'Reemplazar';
            if (viewBtn) viewBtn.disabled = false;
            if (deleteBtn) deleteBtn.disabled = false;
            if (meta) {
                const name = state.name ? escapeHtml_(state.name) : '';
                meta.innerHTML = name ? `<i class="bi bi-file-earmark-image me-1"></i>${name}` : '';
            }
            img.style.cursor = 'zoom-in';
        } else {
            img.src = '';
            img.classList.add('d-none');
            placeholder.classList.remove('d-none');
            if (uploadLabel) uploadLabel.textContent = 'Subir';
            if (viewBtn) viewBtn.disabled = true;
            if (deleteBtn) deleteBtn.disabled = true;
            if (meta) meta.textContent = '';
            img.style.cursor = 'default';
        }
    }

    function refresh(clientId) {
        if (!clientId) return;

        // estado "cargando" ligero
        setCardState_('FACHADA', null);
        setCardState_('LLAVE', null);

        ApiService.call('getClientMedia', clientId)
            .then((res) => {
                const fachada = res && res.fachada ? res.fachada : null;
                const llave = res && res.llave ? res.llave : null;
                setCardState_('FACHADA', fachada);
                setCardState_('LLAVE', llave);
                // Guardar estado en el DOM para view
                sectionState_.fachada = fachada;
                sectionState_.llave = llave;
            })
            .catch((err) => {
                console.error(err);
                Alerts && Alerts.showAlert('No se pudieron cargar las fotos del cliente: ' + err.message, 'warning');
            });
    }

    const sectionState_ = { fachada: null, llave: null };

    function attachEvents(clientId) {
        // Upload buttons -> file input
        document.querySelectorAll('[data-client-media-action="upload"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const kind = this.getAttribute('data-client-media-kind');
                const key = String(kind || '').toLowerCase();
                const input = document.getElementById(`client-media-${key}-input`);
                if (input) input.click();
            });
        });

        // Inputs -> upload
        document.querySelectorAll('[data-client-media-input]').forEach(input => {
            input.addEventListener('change', function () {
                const kind = this.getAttribute('data-client-media-input');
                const file = this.files && this.files[0] ? this.files[0] : null;
                this.value = '';
                if (!clientId) {
                    Alerts && Alerts.showAlert('Guardá el cliente antes de subir fotos.', 'warning');
                    return;
                }
                if (!file) return;
                uploadFile_(clientId, kind, file);
            });
        });

        // Delete
        document.querySelectorAll('[data-client-media-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const kind = this.getAttribute('data-client-media-kind');
                if (!clientId) return;
                confirmDelete_(clientId, kind);
            });
        });

        // View
        document.querySelectorAll('[data-client-media-action="view"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const kind = this.getAttribute('data-client-media-kind');
                const st = kind === 'FACHADA' ? sectionState_.fachada : sectionState_.llave;
                if (!st || !st.exists) return;
                openImageModal_(kind === 'FACHADA' ? 'Fachada' : 'Llave', st);
            });
        });

        // Click on image opens modal too
        ['fachada', 'llave'].forEach(key => {
            const img = document.getElementById(`client-media-${key}-img`);
            if (!img) return;
            img.addEventListener('click', function () {
                const st = key === 'fachada' ? sectionState_.fachada : sectionState_.llave;
                if (!st || !st.exists) return;
                openImageModal_(key === 'fachada' ? 'Fachada' : 'Llave', st);
            });
        });
    }

    function resizeImageToJpegBase64_(file, maxDimPx = 1600, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('El archivo no parece ser una imagen válida.'));
                img.onload = () => {
                    const w = img.naturalWidth || img.width;
                    const h = img.naturalHeight || img.height;
                    if (!w || !h) return reject(new Error('Dimensiones de imagen inválidas.'));

                    const maxSide = Math.max(w, h);
                    const scale = maxSide > maxDimPx ? (maxDimPx / maxSide) : 1;
                    const nw = Math.max(1, Math.round(w * scale));
                    const nh = Math.max(1, Math.round(h * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = nw;
                    canvas.height = nh;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('No se pudo preparar canvas.'));

                    // Fondo blanco (por si viene PNG con transparencia)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, nw, nh);
                    ctx.drawImage(img, 0, 0, nw, nh);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const base64 = String(dataUrl || '').split(',')[1] || '';
                    if (!base64) return reject(new Error('No se pudo codificar la imagen.'));

                    resolve({ base64: base64, mimeType: 'image/jpeg' });
                };
                img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
        });
    }

    function uploadFile_(clientId, kind, file) {
        UiState && UiState.setGlobalLoading(true, 'Subiendo foto...');

        resizeImageToJpegBase64_(file, 1600, 0.85)
            .then(({ base64, mimeType }) => {
                return ApiService.call('uploadClientMedia', { clientId: clientId, kind: kind, base64: base64, mimeType: mimeType });
            })
            .then(() => {
                Alerts && Alerts.showAlert('Foto actualizada.', 'success');
                refresh(clientId);
            })
            .catch((err) => {
                console.error(err);
                Alerts && Alerts.showAlert('Error al subir foto: ' + err.message, 'danger');
            })
            .finally(() => {
                UiState && UiState.setGlobalLoading(false);
            });
    }

    function confirmDelete_(clientId, kind) {
        const doDelete = () => {
            UiState && UiState.setGlobalLoading(true, 'Eliminando foto...');
            ApiService.call('deleteClientMedia', clientId, kind)
                .then(() => {
                    Alerts && Alerts.showAlert('Foto eliminada.', 'success');
                    refresh(clientId);
                })
                .catch((err) => {
                    console.error(err);
                    Alerts && Alerts.showAlert('Error al eliminar foto: ' + err.message, 'danger');
                })
                .finally(() => UiState && UiState.setGlobalLoading(false));
        };

        if (typeof UiDialogs !== 'undefined' && UiDialogs && typeof UiDialogs.confirm === 'function') {
            UiDialogs.confirm({
                title: 'Eliminar foto',
                message: '¿Seguro que querés eliminar esta foto?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmVariant: 'danger',
                icon: 'bi-trash3-fill',
                iconClass: 'text-danger'
            }).then((ok) => { if (ok) doDelete(); });
            return;
        }

        if (confirm('¿Seguro que querés eliminar esta foto?')) doDelete();
    }

    function openImageModal_(title, state) {
        if (!state || !state.exists) return;
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
            window.open(state.url || '#', '_blank');
            return;
        }

        const modalId = 'client-media-preview-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        const titleId = modalId + '-title';

        const dataUrl = `data:${state.mimeType || 'image/jpeg'};base64,${state.previewBase64 || ''}`;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${titleId}">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${titleId}">${escapeHtml_(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-0 bg-dark">
                            <img src="${dataUrl}" alt="${escapeHtml_(title)}" style="width:100%; height:auto; display:block;">
                        </div>
                        <div class="modal-footer">
                            ${state.url ? `<a class="btn btn-outline-secondary" href="${escapeHtml_(state.url)}" target="_blank" rel="noopener">Abrir en Drive</a>` : ''}
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalEl = wrapper.firstElementChild;
        document.body.appendChild(modalEl);

        const modal = new bootstrap.Modal(modalEl, { backdrop: true, keyboard: true, focus: true });
        modalEl.addEventListener('hidden.bs.modal', function () {
            try { modal.dispose(); } catch (e) { /* ignore */ }
            modalEl.remove();
        });
        modal.show();
    }

    return {
        render: render
    };
})();
