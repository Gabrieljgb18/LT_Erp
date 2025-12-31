/**
 * Controlador de fotos para Clientes (fachadas y llaves)
 * - Guarda imágenes en carpetas de Drive (por tipo)
 * - Nombra archivos con ID de cliente + nombre para fácil identificación
 * - Permite listar, subir/reemplazar y eliminar
 */

var ClientMediaController = (function () {
  const DEFAULT_FACHADAS_FOLDER_ID = '1Esz3E9NQH61f5opr7CABRFHHOYUXm2Vm';
  const DEFAULT_LLAVES_FOLDER_ID = '1oi-Ps8DW3_ioqOe0f62p22hkd-pyWnk7';

  const KINDS = {
    FACHADA: 'FACHADA',
    LLAVE: 'LLAVE'
  };

  function normalizeHeaderKey_(val) {
    return String(val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getFolderId_(kind) {
    const config = (typeof DatabaseService !== 'undefined' && DatabaseService.getConfig)
      ? (DatabaseService.getConfig() || {})
      : {};

    if (kind === KINDS.FACHADA) {
      return String(config['FOTOS_FACHADAS_FOLDER_ID'] || DEFAULT_FACHADAS_FOLDER_ID);
    }
    if (kind === KINDS.LLAVE) {
      return String(config['FOTOS_LLAVES_FOLDER_ID'] || DEFAULT_LLAVES_FOLDER_ID);
    }
    throw new Error('Tipo de foto inválido: ' + kind);
  }

  function getClientDisplayName_(clientId) {
    try {
      if (typeof DatabaseService !== 'undefined' && DatabaseService.findClienteById) {
        const cli = DatabaseService.findClienteById(clientId);
        if (cli && (cli.razonSocial || cli.nombre)) {
          return String(cli.razonSocial || cli.nombre);
        }
      }
    } catch (e) {
      // ignore
    }
    return '';
  }

  function sanitizeFilenamePart_(name) {
    return String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // sin acentos
      .replace(/[^\w\s-]/g, '') // sin símbolos raros
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  function buildFileName_(clientId, kind, ext) {
    const displayName = getClientDisplayName_(clientId);
    const safeName = sanitizeFilenamePart_(displayName) || ('Cliente ' + clientId);
    const safeExt = ext || 'jpg';
    return `CLIENTE_${clientId}__${safeName}__${kind}.${safeExt}`;
  }

  function extFromMime_(mimeType) {
    const mt = String(mimeType || '').toLowerCase();
    if (mt.indexOf('png') !== -1) return 'png';
    if (mt.indexOf('webp') !== -1) return 'webp';
    if (mt.indexOf('gif') !== -1) return 'gif';
    // default jpeg
    return 'jpg';
  }

  function getFolder_(kind) {
    const folderId = getFolderId_(kind);
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      throw new Error('No se pudo acceder a la carpeta de Drive para ' + kind + '. Verificá permisos/ID.');
    }
  }

  function searchFiles_(folderId, clientId, kind) {
    const prefix = `CLIENTE_${clientId}__`;
    const kindToken = `__${kind}`;
    const q =
      `'${folderId}' in parents and trashed=false and ` +
      `title contains '${prefix}' and title contains '${kindToken}'`;
    return DriveApp.searchFiles(q);
  }

  function pickLatestFile_(iter) {
    let best = null;
    let bestTs = -Infinity;
    while (iter.hasNext()) {
      const f = iter.next();
      let ts = 0;
      try {
        ts = f.getLastUpdated().getTime();
      } catch (e) {
        ts = 0;
      }
      if (ts >= bestTs) {
        bestTs = ts;
        best = f;
      }
    }
    return best;
  }

  function buildImageBase64_(file, maxSizePx) {
    const blob = file.getBlob();
    const mimeType = blob.getContentType() || 'image/jpeg';
    let outBlob = blob;
    const size = Number(maxSizePx) || 720;

    try {
      const img = ImagesService.openImage(blob);
      const resized = img.resize(size);
      outBlob = resized.getBlob();
      if (outBlob && outBlob.getContentType && !outBlob.getContentType()) {
        outBlob.setContentType(mimeType);
      }
    } catch (e) {
      // fallback a blob original
      outBlob = blob;
    }

    return {
      mimeType: outBlob.getContentType ? (outBlob.getContentType() || mimeType) : mimeType,
      base64: Utilities.base64Encode(outBlob.getBytes())
    };
  }

  function buildFileDto_(file) {
    if (!file) return { exists: false };
    const preview = buildImageBase64_(file, 720);
    return {
      exists: true,
      fileId: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      updatedAt: file.getLastUpdated ? file.getLastUpdated().toISOString() : '',
      mimeType: preview.mimeType,
      previewBase64: preview.base64
    };
  }

  function getClientMedia(clientId) {
    if (clientId == null || clientId === '') {
      throw new Error('clientId requerido');
    }

    const id = String(clientId).trim();
    const folderF = getFolderId_(KINDS.FACHADA);
    const folderL = getFolderId_(KINDS.LLAVE);

    const fFile = pickLatestFile_(searchFiles_(folderF, id, KINDS.FACHADA));
    const lFile = pickLatestFile_(searchFiles_(folderL, id, KINDS.LLAVE));

    return {
      clientId: id,
      fachada: buildFileDto_(fFile),
      llave: buildFileDto_(lFile)
    };
  }

  function uploadClientMedia(payload) {
    payload = payload || {};
    const clientId = payload.clientId;
    const kind = String(payload.kind || '').trim().toUpperCase();
    const base64 = String(payload.base64 || '').trim();
    const mimeType = String(payload.mimeType || 'image/jpeg').trim() || 'image/jpeg';

    if (clientId == null || clientId === '') throw new Error('clientId requerido');
    if (kind !== KINDS.FACHADA && kind !== KINDS.LLAVE) throw new Error('kind inválido');
    if (!base64) throw new Error('Imagen vacía');

    const id = String(clientId).trim();

    const folderId = getFolderId_(kind);
    const folder = getFolder_(kind);

    // Borrar versiones previas de este tipo (para "modificar/reemplazar")
    const oldIter = searchFiles_(folderId, id, kind);
    while (oldIter.hasNext()) {
      const f = oldIter.next();
      try { f.setTrashed(true); } catch (e) { /* ignore */ }
    }

    const bytes = Utilities.base64Decode(base64);
    const ext = extFromMime_(mimeType);
    const filename = buildFileName_(id, kind, ext);
    const blob = Utilities.newBlob(bytes, mimeType, filename);

    const file = folder.createFile(blob);
    file.setName(filename);

    return {
      ok: true,
      kind: kind,
      file: buildFileDto_(file)
    };
  }

  function deleteClientMedia(clientId, kind) {
    if (clientId == null || clientId === '') throw new Error('clientId requerido');
    kind = String(kind || '').trim().toUpperCase();
    if (kind !== KINDS.FACHADA && kind !== KINDS.LLAVE) throw new Error('kind inválido');

    const id = String(clientId).trim();
    const folderId = getFolderId_(kind);

    const iter = searchFiles_(folderId, id, kind);
    let deleted = 0;
    while (iter.hasNext()) {
      const f = iter.next();
      try {
        f.setTrashed(true);
        deleted++;
      } catch (e) {
        // ignore
      }
    }
    return { ok: true, deleted: deleted };
  }

  return {
    getClientMedia: getClientMedia,
    uploadClientMedia: uploadClientMedia,
    deleteClientMedia: deleteClientMedia
  };
})();

