/**
 * DomHelpers
 * Helpers para crear nodos de forma segura.
 */
(function (global) {
  const DomHelpers = (() => {
    function text(value) {
      return document.createTextNode(value == null ? "" : String(value));
    }

    function setAttrs(el, attrs) {
      if (!attrs) return;
      Object.keys(attrs).forEach((key) => {
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
          Object.keys(val).forEach((dataKey) => {
            if (val[dataKey] != null) {
              el.dataset[dataKey] = String(val[dataKey]);
            }
          });
          return;
        }
        if (key === "style" && typeof val === "object") {
          Object.keys(val).forEach((styleKey) => {
            el.style[styleKey] = val[styleKey];
          });
          return;
        }
        if (key.startsWith("on") && typeof val === "function") {
          el.addEventListener(key.slice(2).toLowerCase(), val);
          return;
        }
        el.setAttribute(key, String(val));
      });
    }

    function append(parent, child) {
      if (!parent || child == null) return;
      if (Array.isArray(child)) {
        child.forEach((c) => append(parent, c));
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
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }

    return {
      el,
      text,
      clear,
      append
    };
  })();

  global.DomHelpers = DomHelpers;
})(typeof window !== "undefined" ? window : this);
