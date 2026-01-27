var NumberUtils = (function () {
  function normalizeCandidate_(value) {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    return raw;
  }

  function parseLocalizedNumber(value) {
    const candidate = normalizeCandidate_(value);
    if (candidate === null) return null;

    const cleaned = candidate
      .replace(/\s/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return {
    parseLocalizedNumber
  };
})();
