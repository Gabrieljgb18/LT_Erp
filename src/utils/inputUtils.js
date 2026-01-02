(function (global) {
  const InputUtils = (() => {
    function normalizeDocType(type) {
      const raw = String(type || '').trim().toUpperCase();
      if (raw === 'DNI') return 'DNI';
      if (raw === 'CUIL') return 'CUIL';
      if (raw === 'CUIT') return 'CUIT';
      return '';
    }

    function digitsOnly(value) {
      return String(value || '').replace(/\D/g, '');
    }

    function formatDocNumber(value, docType) {
      const type = normalizeDocType(docType);
      const digits = digitsOnly(value);

      if (type === 'DNI') {
        return digits.slice(0, 8);
      }

      if (type === 'CUIL' || type === 'CUIT') {
        const trimmed = digits.slice(0, 11);
        if (trimmed.length <= 2) return trimmed;
        if (trimmed.length <= 10) {
          return trimmed.slice(0, 2) + '-' + trimmed.slice(2);
        }
        return trimmed.slice(0, 2) + '-' + trimmed.slice(2, 10) + '-' + trimmed.slice(10);
      }

      return value;
    }

    function docPlaceholder(docType) {
      const type = normalizeDocType(docType);
      if (type === 'DNI') return '12345678';
      if (type === 'CUIL' || type === 'CUIT') return '00-00000000-0';
      return '';
    }

    function isValidDocNumber(value, docType) {
      if (!value) return true;
      const type = normalizeDocType(docType);
      const digits = digitsOnly(value);

      if (!type) return false;

      if (type === 'DNI') {
        return digits.length === 8;
      }

      if (type === 'CUIL' || type === 'CUIT') {
        return digits.length === 11;
      }

      return false;
    }

    function formatDocLabel(docType, docNumber) {
      const type = normalizeDocType(docType);
      if (!docNumber) return '';
      const formatted = formatDocNumber(docNumber, type || docType);
      if (!formatted) return '';
      return type ? (type + ' ' + formatted) : formatted;
    }

    function sanitizePhone(value) {
      const raw = String(value || '').trim();
      let out = '';
      let hasPlus = false;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === '+' && !hasPlus && out.length === 0) {
          out += '+';
          hasPlus = true;
          continue;
        }
        if (ch >= '0' && ch <= '9') {
          out += ch;
        }
      }
      return out;
    }

    function isValidPhone(value) {
      if (!value) return true;
      const clean = sanitizePhone(value);
      if (!clean) return false;
      const digits = clean.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return false;
      if (clean[0] === '+') {
        return /^\+\d+$/.test(clean);
      }
      return /^\d+$/.test(clean);
    }

    function isValidEmail(value) {
      if (!value) return true;
      const v = String(value).trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    return {
      normalizeDocType,
      digitsOnly,
      formatDocNumber,
      docPlaceholder,
      isValidDocNumber,
      formatDocLabel,
      sanitizePhone,
      isValidPhone,
      isValidEmail
    };
  })();

  global.InputUtils = InputUtils;
})(typeof window !== "undefined" ? window : this);
