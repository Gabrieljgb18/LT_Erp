/**
 * UIHelpers
 * Helpers reutilizables para elementos UI.
 */
(function (global) {
  const Dom = global.DomHelpers;

  function badge(text, options) {
    const opts = options || {};
    const variant = opts.variant || "light";
    const pill = Boolean(opts.pill);
    const baseClass =
      opts.className ||
      `badge bg-${variant} ${variant === "light" ? "text-dark border" : ""}`.trim();
    const className = pill ? `${baseClass} rounded-pill` : baseClass;
    return Dom.el("span", { className, text: text == null ? "" : String(text) });
  }

  function chip(content, options) {
    const opts = options || {};
    const variant = opts.variant || "";
    const className = opts.className || `lt-chip${variant ? " lt-chip--" + variant : ""}`;
    return Dom.el("span", { className }, content);
  }

  function card(options) {
    const opts = options || {};
    const className = opts.className || "card shadow-sm border-0";
    const headerClass = opts.headerClassName || "card-header bg-white py-2";
    const bodyClass = opts.bodyClassName || "card-body p-3";
    const footerClass = opts.footerClassName || "card-footer bg-white";

    const node = Dom.el("div", { className });
    if (opts.header || opts.title) {
      const header = Dom.el("div", { className: headerClass });
      if (opts.title) {
        header.appendChild(Dom.el("div", { className: "fw-semibold", text: opts.title }));
      }
      if (opts.header) {
        Dom.append(header, opts.header);
      }
      node.appendChild(header);
    }
    if (opts.body || opts.body === "") {
      const body = Dom.el("div", { className: bodyClass });
      Dom.append(body, opts.body);
      node.appendChild(body);
    }
    if (opts.footer) {
      const footer = Dom.el("div", { className: footerClass });
      Dom.append(footer, opts.footer);
      node.appendChild(footer);
    }
    return node;
  }

  function tableRow(cells, options) {
    const opts = options || {};
    const tr = Dom.el("tr", { className: opts.className || "" });
    (cells || []).forEach((cell) => {
      if (cell == null) return;
      if (cell.nodeType) {
        tr.appendChild(cell);
        return;
      }
      if (typeof cell === "string" || typeof cell === "number") {
        tr.appendChild(Dom.el("td", { text: String(cell) }));
        return;
      }
      const td = Dom.el("td", { className: cell.className || "" });
      if (cell.colSpan) {
        td.setAttribute("colspan", String(cell.colSpan));
      }
      Dom.append(td, cell.content != null ? cell.content : cell.text);
      tr.appendChild(td);
    });
    return tr;
  }

  function pagination(options) {
    const opts = options || {};
    const page = Math.max(1, Number(opts.page || 1));
    const total = Math.max(1, Number(opts.totalPages || 1));
    const onChange = typeof opts.onPageChange === "function" ? opts.onPageChange : null;
    const className =
      opts.className || "d-flex justify-content-between align-items-center gap-2";

    const prevBtn = Dom.el("button", {
      className: "btn btn-outline-secondary btn-sm",
      text: "Anterior"
    });
    const nextBtn = Dom.el("button", {
      className: "btn btn-outline-secondary btn-sm",
      text: "Siguiente"
    });

    if (page <= 1) prevBtn.disabled = true;
    if (page >= total) nextBtn.disabled = true;

    if (onChange) {
      prevBtn.addEventListener("click", () => onChange(page - 1));
      nextBtn.addEventListener("click", () => onChange(page + 1));
    }

    const info = Dom.el("div", {
      className: "text-muted small",
      text: `Página ${page} de ${total}`
    });

    return Dom.el("div", { className }, [prevBtn, info, nextBtn]);
  }

  function renderPagination(container, options) {
    if (!container || !Dom) return;
    Dom.clear(container);
    container.appendChild(pagination(options));
  }

  function renderDatalist(listEl, labels) {
    if (!listEl || !Dom) return;
    Dom.clear(listEl);
    (labels || []).forEach((label) => {
      if (label == null || label === "") return;
      listEl.appendChild(Dom.el("option", { value: String(label) }));
    });
  }

  function renderSelect(selectEl, options, selected, config) {
    if (!selectEl || !Dom) return;
    const opts = Array.isArray(options) ? options : [];
    const sel = selected != null ? String(selected) : "";
    const settings = config || {};

    Dom.clear(selectEl);
    if (settings.includeEmpty) {
      const emptyLabel = settings.emptyLabel || "Seleccionar...";
      selectEl.appendChild(Dom.el("option", { value: "", text: emptyLabel }));
    }

    const normalized = opts.map((opt) => {
      if (opt && typeof opt === "object") return opt;
      return { value: String(opt || ""), label: String(opt || "") };
    });

    const hasSelected = sel && normalized.some((opt) => String(opt.value) === sel);
    if (sel && !hasSelected && settings.ensureSelected !== false) {
      normalized.unshift({ value: sel, label: sel });
    }

    normalized.forEach((opt) => {
      if (!opt) return;
      const value = opt.value != null ? String(opt.value) : "";
      const label = opt.label != null ? String(opt.label) : value;
      const node = Dom.el("option", { value: value, text: label });
      if (opt.dataset) {
        Object.keys(opt.dataset).forEach((key) => {
          if (opt.dataset[key] != null) {
            node.dataset[key] = String(opt.dataset[key]);
          }
        });
      }
      if (opt.disabled) node.disabled = true;
      if (sel && value === sel) node.selected = true;
      selectEl.appendChild(node);
    });
  }

  function renderChunks(container, items, renderItem, options) {
    if (!container || !Dom || !Array.isArray(items) || typeof renderItem !== "function") {
      return Promise.resolve();
    }
    const opts = options || {};
    const chunkSize = Math.max(1, Number(opts.chunkSize || 150));
    const useTimeout = opts.useTimeout === true;
    let index = 0;

    Dom.clear(container);

    return new Promise((resolve) => {
      const step = () => {
        const fragment = document.createDocumentFragment();
        const end = Math.min(index + chunkSize, items.length);
        for (; index < end; index += 1) {
          const node = renderItem(items[index], index);
          if (node) fragment.appendChild(node);
        }
        container.appendChild(fragment);
        if (typeof opts.onProgress === "function") {
          opts.onProgress(index, items.length);
        }
        if (index < items.length) {
          if (useTimeout) {
            setTimeout(step, 0);
          } else if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(step);
          } else {
            setTimeout(step, 16);
          }
          return;
        }
        if (typeof opts.onDone === "function") {
          opts.onDone();
        }
        resolve();
      };
      step();
    });
  }

  function withSpinner(button, isLoading, label) {
    if (!button || !Dom) return;
    const text = label || "Procesando...";
    if (isLoading) {
      if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML || "";
      }
      Dom.clear(button);
      button.appendChild(
        Dom.el("span", {
          className: "spinner-border spinner-border-sm me-2",
          role: "status",
          "aria-hidden": "true"
        })
      );
      button.appendChild(Dom.text(text));
      button.disabled = true;
      return;
    }

    const original = button.dataset.originalContent;
    Dom.clear(button);
    if (original) {
      button.innerHTML = original;
    }
    button.disabled = false;
  }

  const UIHelpers = {
    badge,
    chip,
    card,
    tableRow,
    pagination,
    renderPagination,
    renderDatalist,
    renderSelect,
    renderChunks,
    withSpinner
  };

  global.UIHelpers = UIHelpers;
})(typeof window !== "undefined" ? window : this);
