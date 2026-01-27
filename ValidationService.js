var ValidationService = (function () {
  const INTERNAL_SCHEMAS = {
    PAGOS_EMP: {
      fields: {
        'ID': { type: 'number', readOnly: true },
        'FECHA': { type: 'date' },
        'MONTO': { type: 'number' }
      }
    }
  };

  function getTemplate_(formatId) {
    if (typeof Formats === 'undefined' || !Formats.getFormatTemplate) return null;
    return Formats.getFormatTemplate(formatId);
  }

  function getSchema_(formatId) {
    const tpl = getTemplate_(formatId);
    if (tpl && tpl.schema) return tpl.schema;
    if (INTERNAL_SCHEMAS[formatId]) return INTERNAL_SCHEMAS[formatId];
    return null;
  }

  function isEmpty_(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  }

  function normalizeString_(value, fieldDef) {
    if (value === null || value === undefined) return '';
    let out;
    if (Array.isArray(value)) {
      out = value.map(function (v) { return String(v == null ? '' : v).trim(); }).join(', ');
    } else if (typeof value === 'object' && Object.prototype.toString.call(value) === '[object Date]') {
      out = value.toString();
    } else {
      out = String(value);
    }
    if (fieldDef && fieldDef.trim !== false) {
      out = out.trim();
    }
    if (fieldDef && fieldDef.collapseSpaces) {
      out = out.replace(/\s+/g, ' ');
    }
    if (fieldDef && fieldDef.maxLength && out.length > fieldDef.maxLength) {
      out = out.slice(0, fieldDef.maxLength);
    }
    return out;
  }

  function parseNumber_(value) {
    if (NumberUtils && typeof NumberUtils.parseLocalizedNumber === 'function') {
      return NumberUtils.parseLocalizedNumber(value);
    }
    if (typeof value === 'number') return isNaN(value) ? null : value;
    const raw = String(value).trim();
    if (!raw) return null;
    const cleaned = raw
      .replace(/\s/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  function normalizeNumber_(value, fieldDef, errors, fieldName) {
    if (isEmpty_(value)) return '';
    const num = parseNumber_(value);
    if (num === null) {
      errors.push('Campo ' + fieldName + ' debe ser numerico.');
      return '';
    }
    if (fieldDef && typeof fieldDef.min === 'number' && num < fieldDef.min) {
      errors.push('Campo ' + fieldName + ' debe ser >= ' + fieldDef.min + '.');
    }
    if (fieldDef && typeof fieldDef.max === 'number' && num > fieldDef.max) {
      errors.push('Campo ' + fieldName + ' debe ser <= ' + fieldDef.max + '.');
    }
    return num;
  }

  function parseDate_(value) {
    if (value instanceof Date && !isNaN(value)) return value;
    const raw = String(value || '').trim();
    if (!raw) return null;

    // yyyy-mm-dd
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return isNaN(d) ? null : d;
    }

    // dd/mm/yyyy
    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const d2 = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      return isNaN(d2) ? null : d2;
    }

    // dd-mm-yyyy
    const dmyDash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyDash) {
      const d3 = new Date(Number(dmyDash[3]), Number(dmyDash[2]) - 1, Number(dmyDash[1]));
      return isNaN(d3) ? null : d3;
    }

    const fallback = new Date(raw);
    return isNaN(fallback) ? null : fallback;
  }

  function normalizeDate_(value, errors, fieldName) {
    if (isEmpty_(value)) return '';
    const date = parseDate_(value);
    if (!date) {
      errors.push('Campo ' + fieldName + ' debe ser fecha valida.');
      return '';
    }
    return date;
  }

  function parseTimeToFraction_(hours, minutes) {
    const h = Number(hours);
    const m = Number(minutes);
    if (!isFinite(h) || !isFinite(m)) return null;
    if (h < 0 || h > 24 || m < 0 || m > 59) return null;
    return (h * 60 + m) / (24 * 60);
  }

  function normalizeTime_(value, errors, fieldName) {
    if (isEmpty_(value)) return '';

    if (value instanceof Date && !isNaN(value)) {
      return parseTimeToFraction_(value.getHours(), value.getMinutes()) || '';
    }

    if (typeof value === 'number' && isFinite(value)) {
      if (value >= 0 && value <= 1) return value;
      if (value >= 0 && value <= 24) return value / 24;
      errors.push('Campo ' + fieldName + ' fuera de rango.');
      return '';
    }

    const raw = String(value).trim();
    if (!raw) return '';
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const fraction = parseTimeToFraction_(match[1], match[2]);
      if (fraction !== null) return fraction;
    }

    errors.push('Campo ' + fieldName + ' debe ser hora valida.');
    return '';
  }

  function normalizeValue_(value, fieldDef, fieldName, mode, errors) {
    const defType = fieldDef && fieldDef.type ? fieldDef.type : 'string';
    if (defType === 'number') {
      return normalizeNumber_(value, fieldDef, errors, fieldName);
    }
    if (defType === 'date') {
      return normalizeDate_(value, errors, fieldName);
    }
    if (defType === 'time') {
      return normalizeTime_(value, errors, fieldName);
    }
    if (defType === 'boolean') {
      if (isEmpty_(value)) return '';
      const truthy = value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'SI' || value === 'Si';
      const falsy = value === false || value === 0 || value === '0' || value === 'false' || value === 'FALSE' || value === 'NO' || value === 'No';
      if (truthy) return true;
      if (falsy) return false;
      errors.push('Campo ' + fieldName + ' debe ser booleano.');
      return '';
    }

    const out = normalizeString_(value, fieldDef);
    if (fieldDef && Array.isArray(fieldDef.enum) && out !== '') {
      if (fieldDef.enum.indexOf(out) === -1) {
        errors.push('Campo ' + fieldName + ' tiene valor no permitido.');
      }
    }
    return out;
  }

  function validateAndNormalizeRecord(formatId, record, mode, options) {
    const errors = [];
    const input = record && typeof record === 'object' ? record : null;
    if (!input) {
      return { ok: false, record: {}, errors: ['Payload invalido.'] };
    }

    const tpl = getTemplate_(formatId);
    const schema = getSchema_(formatId) || {};
    const fields = schema.fields || {};
    const headers = (options && options.headers) || (tpl && tpl.headers) || Object.keys(input);
    const partial = options && typeof options.partial === 'boolean'
      ? options.partial
      : (mode === 'update');

    const out = {};
    headers.forEach(function (fieldName) {
      const fieldDef = fields[fieldName] || { type: 'string' };
      const hasValue = Object.prototype.hasOwnProperty.call(input, fieldName);
      if (!hasValue) {
        if (!partial && fieldDef.required) {
          errors.push('Falta ' + fieldName + '.');
        }
        return;
      }
      const normalized = normalizeValue_(input[fieldName], fieldDef, fieldName, mode, errors);
      if (normalized !== undefined) {
        out[fieldName] = normalized;
      }
    });

    return {
      ok: errors.length === 0,
      record: out,
      errors: errors
    };
  }

  return {
    validateAndNormalizeRecord: validateAndNormalizeRecord,
    getSchema: getSchema_
  };
})();
