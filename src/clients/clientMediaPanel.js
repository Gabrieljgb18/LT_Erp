/**
 * Panel de fotos para Clientes (Fachadas / Llaves)
 * - Soporta múltiples fotos por tipo
 * - Se renderiza dentro del modal de edición de CLIENTES
 */
var ClientMediaPanel = (function () {
    const SECTION_ID = 'client-media-section';
    const NOTICE_ID = 'client-media-notice';
    const LOADING_ID = 'client-media-loading';
    const LOADING_TEXT_ID = 'client-media-loading-text';
    const VIEWER_ID = 'client-media-viewer';
    const VIEWER_TITLE_ID = 'client-media-viewer-title';
    const VIEWER_IMG_ID = 'client-media-viewer-img';
    const VIEWER_SPINNER_ID = 'client-media-viewer-spinner';
    const VIEWER_MSG_ID = 'client-media-viewer-msg';
    const VIEWER_DRIVE_ID = 'client-media-viewer-drive';
    const ACCEPT_IMAGE_ANY = 'image/' + '*';
    const Dom = window.DomHelpers;
    const UI = window.UIHelpers;
    const ClientMediaData = window.ClientMediaData || null;

    let state = {
        clientId: '',
        fachada: [],
        llave: [],
        viewerKeyHandlerInstalled: false,
        eventsController: null
    };

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

    function showNotice_(type, message) {
        const el = document.getElementById(NOTICE_ID);
        if (!el) return;
        Dom.clear(el);
        if (!message) return;
        const safeType = type || 'info';
        const iconClass = safeType === 'danger'
            ? 'bi-exclamation-triangle-fill'
            : safeType === 'success'
                ? 'bi-check-circle-fill'
                : 'bi-info-circle-fill';
        el.appendChild(
            Dom.el('div', {
                className: `alert alert-${safeType} py-2 px-3 mb-0 d-flex align-items-start gap-2`
            }, [
                Dom.el('i', { className: `bi ${iconClass}` }),
                Dom.el('div', { className: 'small', text: message })
            ])
        );
    }

    function setPanelLoading_(isLoading, message) {
        const overlay = document.getElementById(LOADING_ID);
        if (!overlay) return;
        const text = document.getElementById(LOADING_TEXT_ID);
        if (text) text.textContent = message || 'Procesando...';
        overlay.classList.toggle('d-none', !isLoading);
    }

    function ensureViewer_() {
        const existing = document.getElementById(VIEWER_ID);
        if (existing) return existing;

        const overlay = Dom.el('div', {
            id: VIEWER_ID,
            className: 'client-media-viewer d-none'
        });

        const backdrop = Dom.el('div', {
            className: 'client-media-viewer__backdrop',
            'data-cm-viewer-close': '1'
        });

        const titleEl = Dom.el('div', {
            className: 'client-media-viewer__title',
            id: VIEWER_TITLE_ID,
            text: 'Foto'
        });

        const closeBtn = Dom.el('button', {
            type: 'button',
            className: 'btn btn-sm btn-outline-light lt-btn-icon',
            'data-cm-viewer-close': '1',
            'aria-label': 'Cerrar'
        }, Dom.el('i', { className: 'bi bi-x-lg' }));

        const header = Dom.el('div', { className: 'client-media-viewer__header' }, [
            titleEl,
            closeBtn
        ]);

        const spinner = Dom.el('div', {
            className: 'client-media-viewer__spinner',
            id: VIEWER_SPINNER_ID
        }, [
            Dom.el('div', {
                className: 'spinner-border text-light',
                role: 'status',
                'aria-label': 'Cargando'
            }),
            Dom.el('div', {
                className: 'small mt-2 text-light opacity-75',
                id: VIEWER_MSG_ID,
                text: 'Cargando...'
            })
        ]);

        const img = Dom.el('img', {
            id: VIEWER_IMG_ID,
            className: 'd-none',
            alt: ''
        });

        const body = Dom.el('div', { className: 'client-media-viewer__body' }, [
            spinner,
            img
        ]);

        const driveLink = Dom.el('a', {
            id: VIEWER_DRIVE_ID,
            className: 'btn btn-outline-light btn-sm d-none',
            target: '_blank',
            rel: 'noopener'
        }, [
            Dom.el('i', { className: 'bi bi-box-arrow-up-right' }),
            Dom.text(' Abrir en Drive')
        ]);

        const footer = Dom.el('div', { className: 'client-media-viewer__footer' }, [
            driveLink,
            Dom.el('button', {
                type: 'button',
                className: 'btn btn-light btn-sm',
                'data-cm-viewer-close': '1'
            }, 'Cerrar')
        ]);

        const dialog = Dom.el('div', {
            className: 'client-media-viewer__dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': VIEWER_TITLE_ID
        }, [header, body, footer]);

        overlay.appendChild(backdrop);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            const closeTarget = e.target && e.target.closest ? e.target.closest('[data-cm-viewer-close]') : null;
            if (closeTarget) {
                closeViewer_();
            }
        });

        if (!state.viewerKeyHandlerInstalled) {
            state.viewerKeyHandlerInstalled = true;
            document.addEventListener('keydown', function (e) {
                if (e && e.key === 'Escape') closeViewer_();
            });
        }

        return overlay;
    }

    function openViewerLoading_(title, message) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const msg = document.getElementById(VIEWER_MSG_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';
        if (msg) msg.textContent = message || 'Cargando...';
        if (drive) {
            drive.classList.add('d-none');
            drive.removeAttribute('href');
        }
        if (img) {
            img.classList.add('d-none');
            img.removeAttribute('src');
        }
        if (spinner) spinner.classList.remove('d-none');

        overlay.classList.remove('d-none');
    }

    function openViewerImage_(title, imageState) {
        const overlay = ensureViewer_();
        const titleEl = document.getElementById(VIEWER_TITLE_ID);
        const img = document.getElementById(VIEWER_IMG_ID);
        const spinner = document.getElementById(VIEWER_SPINNER_ID);
        const drive = document.getElementById(VIEWER_DRIVE_ID);

        if (titleEl) titleEl.textContent = title || 'Foto';

        if (!imageState || !imageState.base64) return;
        const dataUrl = `data:${imageState.mimeType || 'image/jpeg'};base64,${imageState.base64 || ''}`;

        if (spinner) spinner.classList.add('d-none');
        if (img) {
            img.src = dataUrl;
            img.alt = title || 'Foto';
            img.classList.remove('d-none');
        }
        if (drive) {
            if (imageState.url) {
                drive.href = String(imageState.url);
                drive.classList.remove('d-none');
            } else {
                drive.classList.add('d-none');
                drive.removeAttribute('href');
            }
        }
        overlay.classList.remove('d-none');
    }

    function closeViewer_() {
        const overlay = document.getElementById(VIEWER_ID);
        if (!overlay) return;
        overlay.classList.add('d-none');
    }

    function buildKindCardNode_(kind) {
        const key = kind.toLowerCase();
        const meta = kind === 'FACHADA'
            ? { title: 'Fachadas', icon: 'bi-building', iconClass: 'text-primary' }
            : { title: 'Llaves', icon: 'bi-key-fill', iconClass: 'text-warning' };

        const countLabel = Dom.el('div', {
            className: 'small text-muted',
            id: `client-media-${key}-count`,
            text: '0 fotos'
        });

        const addBtn = Dom.el('button', {
            type: 'button',
            className: 'btn btn-sm btn-outline-primary lt-btn-compact d-flex align-items-center gap-1',
            'data-cm-action': 'add',
            'data-cm-kind': kind
        }, [
            Dom.el('i', { className: 'bi bi-plus-lg' }),
            Dom.el('span', { text: 'Agregar' })
        ]);

        const empty = Dom.el('div', {
            className: 'text-center text-muted small py-4 d-none',
            id: `client-media-${key}-empty`
        }, [
            Dom.el('i', { className: 'bi bi-image', style: 'font-size: 1.6rem; opacity: 0.35;' }),
            Dom.el('div', { className: 'mt-1', text: 'Sin fotos' })
        ]);

        const grid = Dom.el('div', { className: 'row g-2', id: `client-media-${key}-grid` });
        const input = Dom.el('input', {
            type: 'file',
            className: 'd-none',
            multiple: 'multiple',
            id: `client-media-${key}-add-input`,
            'data-cm-input-kind': kind
        });

        const surface = Dom.el('div', { className: 'lt-surface p-3 h-100' }, [
            Dom.el('div', { className: 'd-flex align-items-start justify-content-between gap-2' }, [
                Dom.el('div', { className: 'd-flex align-items-center gap-2' }, [
                    Dom.el('i', { className: `bi ${meta.icon} ${meta.iconClass}` }),
                    Dom.el('div', null, [
                        Dom.el('div', { className: 'fw-semibold', text: meta.title }),
                        countLabel
                    ])
                ]),
                addBtn
            ]),
            Dom.el('div', { className: 'mt-3' }, [grid, empty]),
            input
        ]);

        return Dom.el('div', { className: 'col-12 col-md-6' }, surface);
    }

    function render(containerEl) {
        if (!containerEl) return;

        const existing = document.getElementById(SECTION_ID);
        if (existing) existing.remove();

        const rec = getEditingClient_();
        const clientId = getClientIdFromRecord_(rec);

        state = {
            clientId: clientId,
            fachada: [],
            llave: [],
            viewerKeyHandlerInstalled: state.viewerKeyHandlerInstalled,
            eventsController: state.eventsController
        };

        const section = Dom.el('div', { className: 'col-12', id: SECTION_ID });

        const loadingOverlay = Dom.el('div', { className: 'client-media-loading d-none', id: LOADING_ID }, [
            Dom.el('div', { className: 'client-media-loading__backdrop' }),
            Dom.el('div', { className: 'client-media-loading__content' }, [
                Dom.el('div', {
                    className: 'spinner-border text-primary',
                    role: 'status',
                    'aria-label': 'Cargando'
                }),
                Dom.el('div', { className: 'small mt-2', id: LOADING_TEXT_ID, text: 'Procesando...' })
            ])
        ]);

        const headerIcon = Dom.el('div', {
            className: 'rounded-circle d-flex align-items-center justify-content-center',
            style: 'width: 40px; height: 40px; background: rgba(99,102,241,0.12);'
        }, Dom.el('i', { className: 'bi bi-camera-fill text-primary' }));

        const headerText = Dom.el('div', null, [
            Dom.el('div', { className: 'fw-semibold', text: 'Fotos del cliente' }),
            Dom.el('div', { className: 'small text-muted', text: 'Guardá y consultá fotos de fachada y llaves.' })
        ]);

        const chip = UI && typeof UI.chip === 'function'
            ? UI.chip([
                Dom.el('i', { className: 'bi bi-hash' }),
                Dom.el('span', { text: `ID: ${clientId || '—'}` })
            ], { variant: 'muted' })
            : Dom.el('span', { className: 'lt-chip lt-chip--muted' }, [
                Dom.el('i', { className: 'bi bi-hash' }),
                Dom.el('span', { text: `ID: ${clientId || '—'}` })
            ]);

        const header = Dom.el('div', {
            className: 'd-flex align-items-start justify-content-between flex-wrap gap-2 mb-2'
        }, [
            Dom.el('div', { className: 'd-flex align-items-center gap-3' }, [headerIcon, headerText]),
            chip
        ]);

        const notice = Dom.el('div', { id: NOTICE_ID, className: 'mb-2' });

        const row = Dom.el('div', { className: 'row g-2' }, [
            buildKindCardNode_('FACHADA'),
            buildKindCardNode_('LLAVE')
        ]);

        const panel = Dom.el('div', { className: 'lt-surface lt-surface--subtle p-3 client-media-panel' }, [
            loadingOverlay,
            header,
            notice,
            row
        ]);

        section.appendChild(panel);

        containerEl.appendChild(section);

        attachEvents_(section);

        if (clientId) {
            refresh_(clientId);
        } else {
            showNotice_('warning', 'Guardá el cliente para habilitar la carga de fotos.');
        }
    }

    function setKindCount_(kind, count) {
        const key = kind.toLowerCase();
        const el = document.getElementById(`client-media-${key}-count`);
        if (!el) return;
        el.textContent = count === 1 ? '1 foto' : `${count} fotos`;
    }

    function renderKindGrid_(kind, items) {
        const key = kind.toLowerCase();
        const grid = document.getElementById(`client-media-${key}-grid`);
        const empty = document.getElementById(`client-media-${key}-empty`);
        if (!grid || !empty) return;

        const list = Array.isArray(items) ? items : [];
        setKindCount_(kind, list.length);

        Dom.clear(grid);

        if (!list.length) {
            empty.classList.remove('d-none');
            return;
        }
        empty.classList.add('d-none');

        list.forEach((it) => {
            const thumb = it && it.thumbnailBase64 ? it.thumbnailBase64 : '';
            const mime = it && it.mimeType ? it.mimeType : 'image/jpeg';
            const fileId = it && it.fileId ? String(it.fileId) : '';
            const name = it && it.name ? String(it.name) : '';

            const dataUrl = thumb ? `data:${mime};base64,${thumb}` : '';
            const preview = dataUrl
                ? Dom.el('img', {
                    src: dataUrl,
                    alt: name || kind,
                    className: 'client-media-thumb__img',
                    'data-cm-action': 'view',
                    'data-cm-kind': kind,
                    'data-cm-file-id': fileId
                })
                : Dom.el('div', {
                    className: 'd-flex align-items-center justify-content-center text-muted small h-100',
                    text: 'Sin preview'
                });

            const deleteBtn = Dom.el('button', {
                type: 'button',
                className: 'client-media-thumb__delete',
                'data-cm-action': 'delete',
                'data-cm-kind': kind,
                'data-cm-file-id': fileId,
                title: 'Eliminar'
            }, Dom.el('i', { className: 'bi bi-trash3' }));

            const thumbInner = Dom.el('div', { className: 'client-media-thumb__inner' }, [
                preview,
                deleteBtn
            ]);

            const thumbWrap = Dom.el('div', {
                className: 'ratio ratio-4x3 bg-white border rounded-3 overflow-hidden client-media-thumb'
            }, thumbInner);

            const nameLabel = Dom.el('div', {
                className: 'small text-muted text-truncate mt-2',
                title: name
            }, [
                Dom.el('i', { className: 'bi bi-image me-1' }),
                Dom.text(name || '')
            ]);

            const card = Dom.el('div', { className: 'lt-surface p-2 h-100' }, [thumbWrap, nameLabel]);
            const col = Dom.el('div', { className: 'col-6 col-lg-4' }, card);

            grid.appendChild(col);
        });
    }

    function refresh_(clientId) {
        showNotice_('', '');
        setPanelLoading_(true, 'Cargando fotos...');
        if (!ClientMediaData || typeof ClientMediaData.listClientMedia !== 'function') {
            showNotice_('danger', 'No se pudieron cargar las fotos.');
            setPanelLoading_(false);
            return;
        }
        ClientMediaData.listClientMedia(clientId)
            .then((res) => {
                state.fachada = (res && res.fachada) ? res.fachada : [];
                state.llave = (res && res.llave) ? res.llave : [];
                renderKindGrid_('FACHADA', state.fachada);
                renderKindGrid_('LLAVE', state.llave);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'No se pudieron cargar las fotos. ' + (err && err.message ? err.message : err));
            })
            .finally(() => setPanelLoading_(false));
    }

    function attachEvents_(sectionEl) {
        if (!sectionEl) return;
        if (state.eventsController) {
            state.eventsController.abort();
        }
        state.eventsController = new AbortController();
        const signal = state.eventsController.signal;

        // Delegación de clicks
        sectionEl.addEventListener('click', function (e) {
            const target = e.target && e.target.closest ? e.target.closest('[data-cm-action]') : null;
            if (!target) return;

            const action = target.getAttribute('data-cm-action');
            const kind = String(target.getAttribute('data-cm-kind') || '').trim().toUpperCase();
            const fileId = String(target.getAttribute('data-cm-file-id') || '').trim();

            if (!state.clientId) {
                showNotice_('warning', 'Guardá el cliente para habilitar las fotos.');
                return;
            }

            if (action === 'add') {
                const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
                if (input) input.click();
                return;
            }

            if (action === 'view') {
                if (!fileId) return;
                openImageModalFromServer_(fileId);
                return;
            }

            if (action === 'delete') {
                if (!fileId) return;
                confirmDeleteFile_(fileId);
                return;
            }
        }, { signal: signal });

        // Inputs: agregar
        ['FACHADA', 'LLAVE'].forEach((kind) => {
            const input = document.getElementById(`client-media-${kind.toLowerCase()}-add-input`);
            if (!input) return;
            input.accept = ACCEPT_IMAGE_ANY;
            input.addEventListener('change', function () {
                const files = this.files ? Array.from(this.files) : [];
                this.value = '';
                if (!files.length) return;
                uploadFiles_(state.clientId, kind, files);
            }, { signal: signal });
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

    async function uploadFiles_(clientId, kind, files) {
        const list = Array.isArray(files) ? files.filter(Boolean) : [];
        if (!list.length) return;

        showNotice_('', '');

        try {
            setPanelLoading_(true, `Subiendo ${list.length} foto(s)...`);
            UiState && UiState.setGlobalLoading(true, `Subiendo ${list.length} foto(s)...`);
            for (let i = 0; i < list.length; i++) {
                const label = `Subiendo foto ${i + 1}/${list.length}...`;
                setPanelLoading_(true, label);
                UiState && UiState.setGlobalLoading(true, label);
                const { base64, mimeType } = await resizeImageToJpegBase64_(list[i], 1600, 0.85);
                if (!ClientMediaData || typeof ClientMediaData.uploadClientMedia !== 'function') {
                    throw new Error('No se puede subir la foto en este momento.');
                }
                await ClientMediaData.uploadClientMedia({
                    clientId: clientId,
                    kind: kind,
                    base64: base64,
                    mimeType: mimeType,
                    replaceFileId: ''
                });
            }
            showNotice_('success', 'Fotos actualizadas.');
            refresh_(clientId);
        } catch (err) {
            console.error(err);
            showNotice_('danger', 'Error al subir foto: ' + (err && err.message ? err.message : err));
        } finally {
            setPanelLoading_(false);
            UiState && UiState.setGlobalLoading(false);
        }
    }

    function confirmDeleteFile_(fileId) {
        const doDelete = () => {
            setPanelLoading_(true, 'Eliminando foto...');
            UiState && UiState.setGlobalLoading(true, 'Eliminando foto...');
            if (!ClientMediaData || typeof ClientMediaData.deleteClientMediaFile !== 'function') {
                showNotice_('danger', 'No se pudo eliminar la foto.');
                setPanelLoading_(false);
                UiState && UiState.setGlobalLoading(false);
                return;
            }
            ClientMediaData.deleteClientMediaFile(fileId)
                .then(() => {
                    showNotice_('success', 'Foto eliminada.');
                    refresh_(state.clientId);
                })
                .catch((err) => {
                    console.error(err);
                    showNotice_('danger', 'Error al eliminar foto: ' + (err && err.message ? err.message : err));
                })
                .finally(() => {
                    setPanelLoading_(false);
                    UiState && UiState.setGlobalLoading(false);
                });
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

    function openImageModalFromServer_(fileId) {
        openViewerLoading_('Foto', 'Cargando foto...');
        UiState && UiState.setGlobalLoading(true, 'Cargando foto...');
        if (!ClientMediaData || typeof ClientMediaData.getClientMediaImage !== 'function') {
            showNotice_('danger', 'No se pudo cargar la imagen.');
            closeViewer_();
            UiState && UiState.setGlobalLoading(false);
            return;
        }
        ClientMediaData.getClientMediaImage(fileId, 1600)
            .then((res) => {
                if (!res || !res.base64) {
                    showNotice_('warning', 'No se pudo cargar la imagen.');
                    closeViewer_();
                    return;
                }
                openViewerImage_('Foto', res);
            })
            .catch((err) => {
                console.error(err);
                showNotice_('danger', 'Error al cargar foto: ' + (err && err.message ? err.message : err));
                closeViewer_();
            })
            .finally(() => UiState && UiState.setGlobalLoading(false));
    }

    function openImageModal_(title, state) {
        openViewerImage_(title, state);
    }

    return {
        render: render
    };
})();
