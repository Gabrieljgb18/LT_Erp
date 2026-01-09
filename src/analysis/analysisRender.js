/**
 * AnalysisPanelRender
 * Render del panel de analisis.
 */
(function (global) {
  const state = global.AnalysisPanelState;
  const Dom = state && state.Dom ? state.Dom : null;

  function renderShell(container) {
    if (!container) return;
    // safe static: shell fijo sin datos externos.
    container.innerHTML = `
      <div class="lt-surface p-3 mb-3 analysis-hero">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div class="analysis-title">Análisis del negocio</div>
            <div class="text-muted small">Resumen mensual con indicadores clave, rankings y flujo de caja.</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="month" id="analysis-period" class="form-control form-control-sm" />
            <button class="btn btn-primary btn-sm" id="analysis-refresh">
              <i class="bi bi-arrow-repeat me-1"></i>Actualizar
            </button>
          </div>
        </div>
      </div>

      <div id="analysis-content">
        <div id="analysis-loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="text-muted mt-2">Cargando análisis...</div>
        </div>
        <div id="analysis-dashboard" class="d-none">
          <div class="row g-3 mb-3" id="analysis-kpis"></div>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <div class="lt-surface p-3">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div class="analysis-section-title mb-0">Comparativa últimos <span id="analysis-range-label"></span> meses</div>
                  <div class="d-flex align-items-center gap-2">
                    <select id="analysis-range" class="form-select form-select-sm">
                      <option value="3">3 meses</option>
                      <option value="6" selected>6 meses</option>
                      <option value="12">12 meses</option>
                    </select>
                    <button class="btn btn-outline-primary btn-sm" id="analysis-compare-toggle">
                      <i class="bi bi-bar-chart-line me-1"></i><span>Mostrar</span>
                    </button>
                  </div>
                </div>
                <div id="analysis-compare-placeholder" class="analysis-placeholder text-muted small mt-3">
                  Comparativa en pausa. Activala para calcular los meses seleccionados.
                </div>
                <div id="analysis-compare-body" class="mt-3 d-none">
                  <div id="analysis-trends"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-lg-7">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Flujo del mes</div>
                <div class="analysis-flow" id="analysis-flow"></div>
                <div class="analysis-note text-muted small mt-2">
                  Facturación basada en comprobantes emitidos dentro del mes.
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Medios de cobro</div>
                <div id="analysis-payments"></div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Gastos por categoría</div>
                <div id="analysis-expenses-category"></div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Gastos por medio</div>
                <div id="analysis-expenses-method"></div>
              </div>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <div class="lt-surface p-3">
                <div class="analysis-section-title">Proyección de ingresos</div>
                <div id="analysis-projection"></div>
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Top clientes (por horas)</div>
                <div class="analysis-table" id="analysis-top-clients"></div>
                <div class="analysis-note text-muted small mt-2">Estimado según asistencia y valor hora.</div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="lt-surface p-3 h-100">
                <div class="analysis-section-title">Mejores empleados</div>
                <div class="analysis-table" id="analysis-top-employees"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboard(data) {
    var kpis = data.kpis || {};
    renderKpis(kpis, data.period || {});
    if (state.comparisonVisible) {
      renderTrend(data.trend || []);
    } else {
      renderTrendPlaceholder();
    }
    renderFlow(kpis);
    renderPaymentMethods(data.pagosPorMedio || []);
    renderExpensesByCategory(data.gastosPorCategoria || []);
    renderExpensesByMethod(data.gastosPorMedio || []);
    renderProjection(data.projection || {});
    renderTopClients(data.topClientes || []);
    renderTopEmployees(data.topEmpleados || []);
  }

  function renderKpis(kpis, period) {
    var container = document.getElementById('analysis-kpis');
    if (!container) return;

    var cards = [
      {
        title: 'Facturación del mes',
        value: Formatters.formatCurrency(kpis.facturacionMes),
        hint: 'Periodo ' + (period.label || '')
      },
      {
        title: 'Sueldos estimados',
        value: Formatters.formatCurrency(kpis.sueldosMes),
        hint: 'Costo mensual'
      },
      {
        title: 'Impuestos (IVA)',
        value: Formatters.formatCurrency(kpis.impuestosMes),
        hint: 'Estimado por facturación'
      },
      {
        title: 'Gastos operativos',
        value: Formatters.formatCurrency(kpis.gastosMes),
        hint: 'Gastos registrados'
      },
      {
        title: 'Neto estimado',
        value: Formatters.formatCurrency(kpis.netoMes),
        hint: 'Facturación - sueldos - impuestos - gastos'
      },
      {
        title: 'Cobros del mes',
        value: Formatters.formatCurrency(kpis.pagosClientesMes),
        hint: 'Pagos de clientes'
      },
      {
        title: 'Facturas pendientes',
        value: Formatters.formatNumber(kpis.facturasPendientes),
        hint: Formatters.formatCurrency(kpis.facturacionPendiente)
      },
      {
        title: 'Horas trabajadas',
        value: Formatters.formatHours(kpis.horasMes),
        hint: 'Asistencia registrada'
      },
      {
        title: 'Clientes activos',
        value: Formatters.formatNumber(kpis.clientesActivos),
        hint: 'Base actual'
      },
      {
        title: 'Empleados activos',
        value: Formatters.formatNumber(kpis.empleadosActivos),
        hint: 'Base actual'
      }
    ];

    Dom.clear(container);
    cards.forEach(function (card) {
      var col = Dom.el('div', { className: 'col-12 col-md-6 col-xl-4' });
      var metric = Dom.el('div', { className: 'lt-metric p-3 h-100' }, [
        Dom.el('div', { className: 'text-muted small', text: card.title }),
        Dom.el('div', { className: 'analysis-kpi-value', text: card.value }),
        Dom.el('div', { className: 'text-muted small', text: card.hint })
      ]);
      col.appendChild(metric);
      container.appendChild(col);
    });
  }

  function renderFlow(kpis) {
    var container = document.getElementById('analysis-flow');
    if (!container) return;

    var saldo = (Number(kpis.pagosClientesMes) || 0) -
      (Number(kpis.pagosEmpleadosMes) || 0) -
      (Number(kpis.adelantosMes) || 0) -
      (Number(kpis.gastosMes) || 0);

    var rows = [
      { label: 'Facturación emitida', value: Formatters.formatCurrency(kpis.facturacionMes) },
      { label: 'Impuestos (IVA)', value: Formatters.formatCurrency(kpis.impuestosMes) },
      { label: 'Cobros del mes', value: Formatters.formatCurrency(kpis.pagosClientesMes) },
      { label: 'Pagos a empleados', value: Formatters.formatCurrency(kpis.pagosEmpleadosMes) },
      { label: 'Adelantos', value: Formatters.formatCurrency(kpis.adelantosMes) },
      { label: 'Gastos operativos', value: Formatters.formatCurrency(kpis.gastosMes) },
      { label: 'Saldo neto', value: Formatters.formatCurrency(saldo), highlight: true }
    ];

    Dom.clear(container);
    rows.forEach(function (row) {
      var rowEl = Dom.el('div', {
        className: 'analysis-flow-row ' + (row.highlight ? 'analysis-flow-row--highlight' : '')
      }, [
        Dom.el('span', { text: row.label }),
        Dom.el('strong', { text: row.value })
      ]);
      container.appendChild(rowEl);
    });
  }

  function renderPaymentMethods(items) {
    var container = document.getElementById('analysis-payments');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'Sin pagos registrados en el período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'Sin pagos registrados en el período.' }));
      }
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    Dom.clear(container);
    items.slice(0, 6).forEach(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      var row = Dom.el('div', { className: 'analysis-payment' }, [
        Dom.el('div', { className: 'd-flex justify-content-between' }, [
          Dom.el('span', { text: item.medio || 'Sin medio' }),
          Dom.el('span', { className: 'fw-semibold', text: Formatters.formatCurrency(item.total) })
        ]),
        Dom.el('div', { className: 'analysis-bar' }, Dom.el('span', { style: { width: pct + '%' } }))
      ]);
      container.appendChild(row);
    });
  }

  function renderExpensesByCategory(items) {
    renderExpensesList('analysis-expenses-category', items, 'Sin gastos registrados en el período.', 'categoria');
  }

  function renderExpensesByMethod(items) {
    renderExpensesList('analysis-expenses-method', items, 'Sin gastos registrados en el período.', 'medio');
  }

  function renderExpensesList(containerId, items, emptyMessage, labelKey) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, emptyMessage);
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: emptyMessage }));
      }
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    Dom.clear(container);
    items.slice(0, 6).forEach(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      var label = item[labelKey] || item.label || item.medio || 'Sin categoría';
      var row = Dom.el('div', { className: 'analysis-payment' }, [
        Dom.el('div', { className: 'd-flex justify-content-between' }, [
          Dom.el('span', { text: label }),
          Dom.el('span', { className: 'fw-semibold', text: Formatters.formatCurrency(item.total) })
        ]),
        Dom.el('div', { className: 'analysis-bar' }, Dom.el('span', { style: { width: pct + '%' } }))
      ]);
      container.appendChild(row);
    });
  }

  function renderTrend(items) {
    var container = document.getElementById('analysis-trends');
    updateRangeLabel();
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos para comparar.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos para comparar.' }));
      }
      return;
    }

    var maxFact = items.reduce(function (acc, item) {
      return Math.max(acc, Number(item.facturacion) || 0);
    }, 0);

    Dom.clear(container);
    var grid = Dom.el('div', { className: 'analysis-trend-grid' });
    var header = Dom.el('div', { className: 'analysis-trend-row analysis-trend-header' }, [
      Dom.el('span', { text: 'Mes' }),
      Dom.el('span', { text: 'Facturación' }),
      Dom.el('span', { text: 'Sueldos' }),
      Dom.el('span', { text: 'Gastos' }),
      Dom.el('span', { text: 'Impuestos' }),
      Dom.el('span', { text: 'Neto' })
    ]);
    grid.appendChild(header);

    items.forEach(function (item) {
      var pct = maxFact ? Math.round((Number(item.facturacion) || 0) / maxFact * 100) : 0;
      var neto = Number(item.neto) || 0;
      var netoClass = neto >= 0 ? 'text-success' : 'text-danger';

      var row = Dom.el('div', { className: 'analysis-trend-row' });
      row.appendChild(Dom.el('span', { className: 'analysis-trend-month', text: item.label || '' }));
      row.appendChild(Dom.el('span', null, [
        Dom.el('div', { className: 'analysis-trend-bar' }, Dom.el('span', { style: { width: pct + '%' } })),
        Dom.el('div', { className: 'analysis-trend-value', text: Formatters.formatCurrency(item.facturacion) })
      ]));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.sueldos) }));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.gastos) }));
      row.appendChild(Dom.el('span', { text: Formatters.formatCurrency(item.impuestos) }));
      row.appendChild(Dom.el('span', { className: netoClass, text: Formatters.formatCurrency(neto) }));
      grid.appendChild(row);
    });

    container.appendChild(grid);
  }

  function renderTrendPlaceholder() {
    updateRangeLabel();
    var container = document.getElementById('analysis-trends');
    if (container) Dom.clear(container);
  }

  function updateRangeLabel() {
    var rangeLabel = document.getElementById('analysis-range-label');
    if (rangeLabel) rangeLabel.textContent = String(state.currentRange);
  }

  function updateComparisonUI() {
    var placeholder = document.getElementById('analysis-compare-placeholder');
    var body = document.getElementById('analysis-compare-body');
    var toggle = document.getElementById('analysis-compare-toggle');
    if (placeholder) placeholder.classList.toggle('d-none', state.comparisonVisible);
    if (body) body.classList.toggle('d-none', !state.comparisonVisible);
    if (toggle) {
      toggle.classList.toggle('btn-outline-primary', !state.comparisonVisible);
      toggle.classList.toggle('btn-primary', state.comparisonVisible);
      var label = toggle.querySelector('span');
      if (label) label.textContent = state.comparisonVisible ? 'Ocultar' : 'Mostrar';
    }
  }

  function renderProjection(projection) {
    var container = document.getElementById('analysis-projection');
    if (!container) return;

    if (!projection || !projection.meses) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos suficientes para proyectar.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos suficientes para proyectar.' }));
      }
      return;
    }

    var margen = Number(projection.margenPct) || 0;
    var margenLabel = margen.toFixed(1).replace(/\.0$/, '') + '%';

    Dom.clear(container);
    var wrapper = Dom.el('div', { className: 'analysis-projection' });
    wrapper.appendChild(Dom.el('div', {
      className: 'analysis-projection-note',
      text: 'Promedio de los últimos ' + projection.meses + ' meses'
    }));
    var grid = Dom.el('div', { className: 'analysis-projection-grid' });
    var items = [
      { label: 'Facturación esperada', value: Formatters.formatCurrency(projection.facturacion) },
      { label: 'Sueldos estimados', value: Formatters.formatCurrency(projection.sueldos) },
      { label: 'Impuestos (IVA)', value: Formatters.formatCurrency(projection.impuestos) },
      { label: 'Gastos estimados', value: Formatters.formatCurrency(projection.gastos) },
      { label: 'Neto proyectado', value: Formatters.formatCurrency(projection.neto) },
      { label: 'Horas estimadas', value: Formatters.formatHours(projection.horas) },
      { label: 'Margen estimado', value: margenLabel }
    ];
    items.forEach(function (item) {
      grid.appendChild(Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-projection-label', text: item.label }),
        Dom.el('div', { className: 'analysis-projection-value', text: item.value })
      ]));
    });
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
  }

  function renderTopClients(items) {
    var container = document.getElementById('analysis-top-clients');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos de clientes para este período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos de clientes para este período.' }));
      }
      return;
    }

    Dom.clear(container);
    var list = Dom.el('div', { className: 'analysis-list' });
    items.forEach(function (item, idx) {
      var row = Dom.el('div', { className: 'analysis-list-row' });
      var left = Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-rank', text: '#' + (idx + 1) }),
        Dom.el('div', { className: 'analysis-name', text: item.cliente || 'Cliente' }),
        Dom.el('div', {
          className: 'analysis-subtext',
          text: Formatters.formatHours(item.horas) + ' · ' + (item.dias || 0) + ' días'
        })
      ]);
      var right = Dom.el('div', { className: 'analysis-value', text: Formatters.formatCurrency(item.totalFacturacion) });
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderTopEmployees(items) {
    var container = document.getElementById('analysis-top-employees');
    if (!container) return;

    if (!items.length) {
      if (typeof EmptyState !== 'undefined' && EmptyState && typeof EmptyState.renderInline === 'function') {
        EmptyState.renderInline(container, 'No hay datos de empleados para este período.');
      } else {
        Dom.clear(container);
        container.appendChild(Dom.el('div', { className: 'text-muted small', text: 'No hay datos de empleados para este período.' }));
      }
      return;
    }

    Dom.clear(container);
    var list = Dom.el('div', { className: 'analysis-list' });
    items.forEach(function (item, idx) {
      var row = Dom.el('div', { className: 'analysis-list-row' });
      var left = Dom.el('div', null, [
        Dom.el('div', { className: 'analysis-rank', text: '#' + (idx + 1) }),
        Dom.el('div', { className: 'analysis-name', text: item.empleado || 'Empleado' }),
        Dom.el('div', {
          className: 'analysis-subtext',
          text: Formatters.formatHours(item.horas) + ' · ' + Formatters.formatCurrency(item.totalNeto || 0)
        })
      ]);
      var right = Dom.el('div', { className: 'analysis-value', text: Formatters.formatHours(item.horas) });
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  global.AnalysisPanelRender = {
    renderShell: renderShell,
    renderDashboard: renderDashboard,
    renderKpis: renderKpis,
    renderFlow: renderFlow,
    renderPaymentMethods: renderPaymentMethods,
    renderExpensesByCategory: renderExpensesByCategory,
    renderExpensesByMethod: renderExpensesByMethod,
    renderExpensesList: renderExpensesList,
    renderTrend: renderTrend,
    renderTrendPlaceholder: renderTrendPlaceholder,
    updateRangeLabel: updateRangeLabel,
    updateComparisonUI: updateComparisonUI,
    renderProjection: renderProjection,
    renderTopClients: renderTopClients,
    renderTopEmployees: renderTopEmployees
  };
})(typeof window !== 'undefined' ? window : this);
