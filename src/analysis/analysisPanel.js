/**
 * Panel de Analisis
 */
var AnalysisPanel = (function () {
  var containerId = 'analysis-panel';
  var currentPeriod = null;
  var currentRange = 6;
  var comparisonVisible = false;
  var lastData = null;
  var escapeHtml_ = (typeof HtmlHelpers !== 'undefined' && HtmlHelpers && typeof HtmlHelpers.escapeHtml === 'function')
    ? HtmlHelpers.escapeHtml
    : function (value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

  function render(targetId) {
    var container = document.getElementById(targetId || containerId);
    if (!container) return;

    comparisonVisible = false;
    lastData = null;

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

    var periodInput = document.getElementById('analysis-period');
    if (periodInput) {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      periodInput.value = y + '-' + m;
      currentPeriod = periodInput.value;
      periodInput.addEventListener('change', function () {
        currentPeriod = periodInput.value;
        loadData_();
      });
    }

    var rangeSelect = document.getElementById('analysis-range');
    if (rangeSelect) {
      rangeSelect.value = String(currentRange);
      rangeSelect.addEventListener('change', function () {
        currentRange = Number(rangeSelect.value) || 6;
        loadData_();
      });
    }

    var compareToggle = document.getElementById('analysis-compare-toggle');
    if (compareToggle) {
      compareToggle.addEventListener('click', function () {
        comparisonVisible = !comparisonVisible;
        updateComparisonUI_();
        if (comparisonVisible && lastData) {
          renderTrend_(lastData.trend || []);
        }
      });
    }

    var refreshBtn = document.getElementById('analysis-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        loadData_();
      });
    }

    updateComparisonUI_();
    loadData_();
  }

  function loadData_() {
    var loading = document.getElementById('analysis-loading');
    var dash = document.getElementById('analysis-dashboard');
    if (loading) loading.classList.remove('d-none');
    if (dash) dash.classList.add('d-none');

    var payload = currentPeriod ? { period: currentPeriod, monthsBack: currentRange } : { monthsBack: currentRange };
    ApiService.call('getAnalyticsSummary', payload)
      .then(function (data) {
        lastData = data || {};
        renderDashboard_(lastData);
      })
      .catch(function (err) {
        var container = document.getElementById('analysis-content');
        if (container) {
          container.innerHTML = '<div class="alert alert-danger">Error cargando análisis: ' + escapeHtml_(err.message || err) + '</div>';
        }
      })
      .finally(function () {
        if (loading) loading.classList.add('d-none');
        if (dash) dash.classList.remove('d-none');
      });
  }

  function renderDashboard_(data) {
    var kpis = data.kpis || {};
    renderKpis_(kpis, data.period || {});
    if (comparisonVisible) {
      renderTrend_(data.trend || []);
    } else {
      renderTrendPlaceholder_();
    }
    renderFlow_(kpis);
    renderPaymentMethods_(data.pagosPorMedio || []);
    renderExpensesByCategory_(data.gastosPorCategoria || []);
    renderExpensesByMethod_(data.gastosPorMedio || []);
    renderProjection_(data.projection || {});
    renderTopClients_(data.topClientes || []);
    renderTopEmployees_(data.topEmpleados || []);
  }

  function renderKpis_(kpis, period) {
    var container = document.getElementById('analysis-kpis');
    if (!container) return;

    var cards = [
      {
        title: 'Facturación del mes',
        value: formatCurrency_(kpis.facturacionMes),
        hint: 'Periodo ' + (period.label || '')
      },
      {
        title: 'Sueldos estimados',
        value: formatCurrency_(kpis.sueldosMes),
        hint: 'Costo mensual'
      },
      {
        title: 'Impuestos (IVA)',
        value: formatCurrency_(kpis.impuestosMes),
        hint: 'Estimado por facturación'
      },
      {
        title: 'Gastos operativos',
        value: formatCurrency_(kpis.gastosMes),
        hint: 'Gastos registrados'
      },
      {
        title: 'Neto estimado',
        value: formatCurrency_(kpis.netoMes),
        hint: 'Facturación - sueldos - impuestos - gastos'
      },
      {
        title: 'Cobros del mes',
        value: formatCurrency_(kpis.pagosClientesMes),
        hint: 'Pagos de clientes'
      },
      {
        title: 'Facturas pendientes',
        value: formatNumber_(kpis.facturasPendientes),
        hint: formatCurrency_(kpis.facturacionPendiente)
      },
      {
        title: 'Horas trabajadas',
        value: formatHours_(kpis.horasMes),
        hint: 'Asistencia registrada'
      },
      {
        title: 'Clientes activos',
        value: formatNumber_(kpis.clientesActivos),
        hint: 'Base actual'
      },
      {
        title: 'Empleados activos',
        value: formatNumber_(kpis.empleadosActivos),
        hint: 'Base actual'
      }
    ];

    container.innerHTML = cards.map(function (card) {
      return `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="lt-metric p-3 h-100">
            <div class="text-muted small">${escapeHtml_(card.title)}</div>
            <div class="analysis-kpi-value">${escapeHtml_(card.value)}</div>
            <div class="text-muted small">${escapeHtml_(card.hint)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFlow_(kpis) {
    var container = document.getElementById('analysis-flow');
    if (!container) return;

    var saldo = (Number(kpis.pagosClientesMes) || 0) -
      (Number(kpis.pagosEmpleadosMes) || 0) -
      (Number(kpis.adelantosMes) || 0) -
      (Number(kpis.gastosMes) || 0);

    var rows = [
      { label: 'Facturación emitida', value: formatCurrency_(kpis.facturacionMes) },
      { label: 'Impuestos (IVA)', value: formatCurrency_(kpis.impuestosMes) },
      { label: 'Cobros del mes', value: formatCurrency_(kpis.pagosClientesMes) },
      { label: 'Pagos a empleados', value: formatCurrency_(kpis.pagosEmpleadosMes) },
      { label: 'Adelantos', value: formatCurrency_(kpis.adelantosMes) },
      { label: 'Gastos operativos', value: formatCurrency_(kpis.gastosMes) },
      { label: 'Saldo neto', value: formatCurrency_(saldo), highlight: true }
    ];

    container.innerHTML = rows.map(function (row) {
      return `
        <div class="analysis-flow-row ${row.highlight ? 'analysis-flow-row--highlight' : ''}">
          <span>${escapeHtml_(row.label)}</span>
          <strong>${escapeHtml_(row.value)}</strong>
        </div>
      `;
    }).join('');
  }

  function renderPaymentMethods_(items) {
    var container = document.getElementById('analysis-payments');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="text-muted small">Sin pagos registrados en el período.</div>';
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    container.innerHTML = items.slice(0, 6).map(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      return `
        <div class="analysis-payment">
          <div class="d-flex justify-content-between">
            <span>${escapeHtml_(item.medio || 'Sin medio')}</span>
            <span class="fw-semibold">${escapeHtml_(formatCurrency_(item.total))}</span>
          </div>
          <div class="analysis-bar">
            <span style="width:${pct}%"></span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderExpensesByCategory_(items) {
    renderExpensesList_('analysis-expenses-category', items, 'Sin gastos registrados en el período.', 'categoria');
  }

  function renderExpensesByMethod_(items) {
    renderExpensesList_('analysis-expenses-method', items, 'Sin gastos registrados en el período.', 'medio');
  }

  function renderExpensesList_(containerId, items, emptyMessage, labelKey) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="text-muted small">' + escapeHtml_(emptyMessage) + '</div>';
      return;
    }

    var total = items.reduce(function (acc, item) {
      return acc + (Number(item.total) || 0);
    }, 0);

    container.innerHTML = items.slice(0, 6).map(function (item) {
      var pct = total ? Math.round((Number(item.total) || 0) / total * 100) : 0;
      var label = item[labelKey] || item.label || item.medio || 'Sin categoría';
      return `
        <div class="analysis-payment">
          <div class="d-flex justify-content-between">
            <span>${escapeHtml_(label)}</span>
            <span class="fw-semibold">${escapeHtml_(formatCurrency_(item.total))}</span>
          </div>
          <div class="analysis-bar">
            <span style="width:${pct}%"></span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTrend_(items) {
    var container = document.getElementById('analysis-trends');
    updateRangeLabel_();
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="text-muted small">No hay datos para comparar.</div>';
      return;
    }

    var maxFact = items.reduce(function (acc, item) {
      return Math.max(acc, Number(item.facturacion) || 0);
    }, 0);

    container.innerHTML = `
      <div class="analysis-trend-grid">
        <div class="analysis-trend-row analysis-trend-header">
          <span>Mes</span>
          <span>Facturación</span>
          <span>Sueldos</span>
          <span>Gastos</span>
          <span>Impuestos</span>
          <span>Neto</span>
        </div>
        ${items.map(function (item) {
          var pct = maxFact ? Math.round((Number(item.facturacion) || 0) / maxFact * 100) : 0;
          var neto = Number(item.neto) || 0;
          var netoClass = neto >= 0 ? 'text-success' : 'text-danger';
          return `
            <div class="analysis-trend-row">
              <span class="analysis-trend-month">${escapeHtml_(item.label || '')}</span>
              <span>
                <div class="analysis-trend-bar"><span style="width:${pct}%"></span></div>
                <div class="analysis-trend-value">${escapeHtml_(formatCurrency_(item.facturacion))}</div>
              </span>
              <span>${escapeHtml_(formatCurrency_(item.sueldos))}</span>
              <span>${escapeHtml_(formatCurrency_(item.gastos))}</span>
              <span>${escapeHtml_(formatCurrency_(item.impuestos))}</span>
              <span class="${netoClass}">${escapeHtml_(formatCurrency_(neto))}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTrendPlaceholder_() {
    updateRangeLabel_();
    var container = document.getElementById('analysis-trends');
    if (container) container.innerHTML = '';
  }

  function updateRangeLabel_() {
    var rangeLabel = document.getElementById('analysis-range-label');
    if (rangeLabel) rangeLabel.textContent = String(currentRange);
  }

  function updateComparisonUI_() {
    var placeholder = document.getElementById('analysis-compare-placeholder');
    var body = document.getElementById('analysis-compare-body');
    var toggle = document.getElementById('analysis-compare-toggle');
    if (placeholder) placeholder.classList.toggle('d-none', comparisonVisible);
    if (body) body.classList.toggle('d-none', !comparisonVisible);
    if (toggle) {
      toggle.classList.toggle('btn-outline-primary', !comparisonVisible);
      toggle.classList.toggle('btn-primary', comparisonVisible);
      var label = toggle.querySelector('span');
      if (label) label.textContent = comparisonVisible ? 'Ocultar' : 'Mostrar';
    }
  }

  function renderProjection_(projection) {
    var container = document.getElementById('analysis-projection');
    if (!container) return;

    if (!projection || !projection.meses) {
      container.innerHTML = '<div class="text-muted small">No hay datos suficientes para proyectar.</div>';
      return;
    }

    var margen = Number(projection.margenPct) || 0;
    var margenLabel = margen.toFixed(1).replace(/\\.0$/, '') + '%';

    container.innerHTML = `
      <div class="analysis-projection">
        <div class="analysis-projection-note">Promedio de los últimos ${escapeHtml_(projection.meses)} meses</div>
        <div class="analysis-projection-grid">
          <div>
            <div class="analysis-projection-label">Facturación esperada</div>
            <div class="analysis-projection-value">${escapeHtml_(formatCurrency_(projection.facturacion))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Sueldos estimados</div>
            <div class="analysis-projection-value">${escapeHtml_(formatCurrency_(projection.sueldos))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Impuestos (IVA)</div>
            <div class="analysis-projection-value">${escapeHtml_(formatCurrency_(projection.impuestos))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Gastos estimados</div>
            <div class="analysis-projection-value">${escapeHtml_(formatCurrency_(projection.gastos))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Neto proyectado</div>
            <div class="analysis-projection-value">${escapeHtml_(formatCurrency_(projection.neto))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Horas estimadas</div>
            <div class="analysis-projection-value">${escapeHtml_(formatHours_(projection.horas))}</div>
          </div>
          <div>
            <div class="analysis-projection-label">Margen estimado</div>
            <div class="analysis-projection-value">${escapeHtml_(margenLabel)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTopClients_(items) {
    var container = document.getElementById('analysis-top-clients');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="text-muted small">No hay datos de clientes para este período.</div>';
      return;
    }

    container.innerHTML = `
      <div class="analysis-list">
        ${items.map(function (item, idx) {
          return `
            <div class="analysis-list-row">
              <div>
                <div class="analysis-rank">#${idx + 1}</div>
                <div class="analysis-name">${escapeHtml_(item.cliente || 'Cliente')}</div>
                <div class="analysis-subtext">${escapeHtml_(formatHours_(item.horas))} · ${escapeHtml_(item.dias || 0)} días</div>
              </div>
              <div class="analysis-value">${escapeHtml_(formatCurrency_(item.totalFacturacion))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTopEmployees_(items) {
    var container = document.getElementById('analysis-top-employees');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="text-muted small">No hay datos de empleados para este período.</div>';
      return;
    }

    container.innerHTML = `
      <div class="analysis-list">
        ${items.map(function (item, idx) {
          return `
            <div class="analysis-list-row">
              <div>
                <div class="analysis-rank">#${idx + 1}</div>
                <div class="analysis-name">${escapeHtml_(item.empleado || 'Empleado')}</div>
                <div class="analysis-subtext">${escapeHtml_(formatHours_(item.horas))} · ${escapeHtml_(formatCurrency_(item.totalNeto || 0))}</div>
              </div>
              <div class="analysis-value">${escapeHtml_(formatHours_(item.horas))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function formatCurrency_(value) {
    if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatCurrency === 'function') {
      return Formatters.formatCurrency(value);
    }
    var num = Number(value) || 0;
    return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  }

  function formatNumber_(value) {
    if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatNumber === 'function') {
      return Formatters.formatNumber(value);
    }
    var num = Number(value) || 0;
    return num.toLocaleString('es-AR');
  }

  function formatHours_(value) {
    if (typeof Formatters !== 'undefined' && Formatters && typeof Formatters.formatHours === 'function') {
      return Formatters.formatHours(value);
    }
    var num = Number(value) || 0;
    return num.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' hs';
  }

  return { render: render };
})();
