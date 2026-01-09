# Mapa de Modulos y Reglas

## Objetivo
Mapa rapido de la arquitectura actual y reglas de refactorizacion para mantener el codigo escalable, seguro y consistente con MVC.

## Capas
- UI (render/handlers/state/actions): solo DOM, estado local y validaciones visuales.
- Data: unico lugar donde se llama a ApiService/ReferenceService/AttendanceService/etc.
- Services: wrappers de dominio (invoice/payments/attendance/maps).
- Utils: helpers comunes (dom, domain, formatters, input).

Regla base: UI no usa ApiService/ReferenceService directo. Solo data.js.

## Mapa por dominio

**Core UI**
- `src/ui/` (alerts, dialogs, state, emptyState, uiHelpers, sidebar, footer, gridManager)
- Form renderer: `src/ui/formRendererState.js`, `formRendererData.js`, `formRendererRender.js`, `formRendererHandlers.js`, `formRenderer.js`
- `src/forms/formManager.js`
- `src/records/recordManager.js`
- `src/search/searchManager.js`
- `src/records/recordsData.js`
- `src/search/searchData.js`

**Clientes**
- `src/clients/clientMediaPanel.js`
- `src/clients/clientMediaData.js`
- `src/clients/clientTagsField.js`
- `src/clients/clientTagsData.js`

**Asistencia**
- Plan semanal: `src/attendance/weeklyPlanState.js`, `weeklyPlanData.js`, `weeklyPlanRender.js`, `weeklyPlanHandlers.js`, `weeklyPlanActions.js`, `weeklyPlanPanel.js`
- Diario: `src/attendance/attendanceDailyData.js`, `dailyAttendanceUi.js`
- Panel diario (legacy): `src/attendance/attendancePanelsState.js`, `attendancePanelsData.js`, `attendancePanelsRender.js`, `attendancePanelsHandlers.js`, `attendancePanels.js`
- Calendarios: `src/attendance/employeeCalendarData.js`, `employeeCalendarPanel.js`, `clientCalendarData.js`, `clientCalendarPanel.js`
- Templates: `src/attendance/attendanceTemplates.js`, `weeklyPlanTemplates.js`

**Facturacion**
- `src/invoice/invoiceState.js`, `invoiceData.js`, `invoiceRender.js`, `invoiceHandlers.js`, `invoicePanel.js`

**Pagos**
- `src/payments/paymentsState.js`, `paymentsData.js`, `paymentsRender.js`, `paymentsHandlers.js`, `paymentsPanel.js`

**Horas / Reportes**
- `src/hours/*State.js`, `*Data.js`, `*Render.js`, `*Handlers.js`, `*Panel.js`

**Configuracion**
- Desplegables: `src/config/dropdownConfigData.js`, `dropdownConfigPanel.js`
- Valores masivos: `src/config/bulkValuesData.js`, `bulkValuesPanel.js`

**Mapas**
- `src/maps/mapsState.js`, `mapsData.js`, `mapsRender.js`, `mapsHandlers.js`, `mapsPanel.js`, `mapsLoader.js`, `mapsAutocomplete.js`

**Analisis**
- `src/analysis/analysisState.js`, `analysisData.js`, `analysisRender.js`, `analysisHandlers.js`, `analysisPanel.js`

## Orden de bundle
`generate_bundle_html.js` define el orden. Regla: utils -> services -> reference -> ui -> domain modules -> main.

## Reglas de seguridad DOM
- Prohibido `innerHTML` con datos de Sheets o externos.
- `innerHTML` estático permitido solo con comentario `// safe static`.
- Usar `DomHelpers.el/append/clear` y `textContent`.
- Para contenido multi-linea, usar nodos y `<br>` manualmente.

## Reglas de eventos
- Cada panel debe usar AbortController o flags `bound` para evitar duplicados.
- Re-render no debe duplicar handlers.

## Datos de referencia
- Usar `ReferenceService.ensureLoaded()` desde data.js.
- UI solo consume `referenceData` inyectada o cacheada por data.

## Convenciones
- `state.js`: estado local y helpers puros.
- `render.js`: solo DOM, sin API.
- `handlers.js`: listeners, delegacion y coordinacion con state/data.
- `data.js`: API calls y normalizacion de payloads.
- `actions.js`: operaciones complejas de UI (preparar payloads, transformar estado) sin llamadas directas a API.

## Buenas practicas
- No acoplar modulos entre si.
- Evitar mutar objetos de Sheets sin normalizar.
- Mantener mensajes de error con `Alerts` y estados con `EmptyState`.

## Checklist Done (global)
- [x] Refactor UI/state/data en facturación, mapas, análisis, pagos, horas.
- [x] Helpers de dominio centralizados en `DomainHelpers`.
- [x] Spinners y estados con `EmptyState` y `UIHelpers`.
- [x] Listeners con AbortController/flags para evitar duplicación.
- [x] Capa Data única para ApiService/ReferenceService.
- [x] Estandarización de errores con `Alerts.showError` / `Alerts.notifyError`.
- [x] `innerHTML` dinámico eliminado en módulos críticos (fallbacks estáticos documentados).

## Checklist final por módulo (estado actual)
**Core UI**
- [x] `footer.js` con guardas `data-bound` (sin handlers duplicados).
- [x] `sidebar.js` con `initialized` y guardas `data-bound`.
- [x] `dialogs.js` single-use con cleanup (`once` + remove).
- [ ] `gridManager.js` revisar delegation y evitar binds por fila.
- [ ] `formManager.js` revisar guards de bind en re-render.

**Facturación**
- [ ] `invoiceRender.js` sin `innerHTML` dinámico (pendiente fallback HTML en resumen).
- [x] `invoiceHandlers.js` valida ID cliente antes de enviar payload.
- [x] `invoiceData.js` único acceso a API.

**Pagos**
- [x] `paymentsRender.js` usa EmptyState/Spinners comunes.
- [x] `paymentsHandlers.js` valida IDs y no usa HTML inyectado.
- [x] `paymentsData.js` único acceso a API.

**Horas / Reportes**
- [x] `hoursDetailRender.js` y `clientAccountRender.js` sin `innerHTML` dinámico.
- [x] `hours*Handlers.js` valida IDs via DomainHelpers.
- [x] `*Data.js` único acceso a API.

**Asistencia**
- [ ] Plan semanal sin `innerHTML` dinámico (pendiente en templates/render).
- [x] Asistencia diaria separada (data/render/handlers) y DOM seguro.
- [x] Calendarios con EmptyState y guardas de listeners.

**Mapas**
- [ ] `mapsRender.js` sin `innerHTML` dinámico (pendiente en modales legacy).
- [ ] Modales vía `ModalHelpers.create` (pendiente migración completa).
- [x] Filtros usan IDs (no labels crudos).

**Clientes**
- [x] `clientMediaPanel.js` sin HTML inyectado.
- [x] `clientTagsField.js` usa UIHelpers y event delegation.

**Configuración**
- [ ] `dropdownConfigPanel.js` sin `innerHTML` dinámico.
- [ ] `bulkValuesPanel.js` sin `innerHTML` dinámico.

**Análisis**
- [x] `analysisRender.js` sin `innerHTML` dinámico (solo layout estático).
- [x] `analysisData.js` único acceso a API.

## Reglas de arquitectura (obligatorias)
- UI no llama API directamente: todo va por `data.js`.
- Sin `innerHTML` con datos externos; usar `DomHelpers`.
- Cada panel con `eventsController` o `bound` flags para evitar duplicados.
- Labels siempre deben resolverse a ID antes de persistir.
- Backend valida y normaliza payloads con `ValidationService` usando schema en `Format.js` antes de persistir.
- Estados de carga/empty/error solo con `EmptyState` y `UIHelpers`.
