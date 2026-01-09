/**
 * WeeklyPlanPanel
 * Orquestador del plan semanal.
 */
(function (global) {
    const WeeklyPlanPanel = (() => {
        function ensureDeps() {
            if (!global.WeeklyPlanPanelState || !global.WeeklyPlanPanelRender || !global.WeeklyPlanPanelHandlers || !global.WeeklyPlanPanelData) {
                console.error('WeeklyPlanPanel dependencies no disponibles');
                return false;
            }
            return true;
        }

        function init(refData) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelHandlers.init(refData);
        }

        function setup() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelHandlers.setup();
        }

        function render(container) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelRender.render(container);
        }

        function renderList(container, records) {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelRender.renderList(container, records);
        }

        function fetchWeeklyPlanForClient() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelData.fetchWeeklyPlanForClient();
        }

        function reloadList() {
            if (!ensureDeps()) return;
            global.WeeklyPlanPanelData.reloadList();
        }

        return {
            init: init,
            setup: setup,
            render: render,
            renderList: renderList,
            fetchWeeklyPlanForClient: fetchWeeklyPlanForClient,
            reloadList: reloadList
        };
    })();

    global.WeeklyPlanPanel = WeeklyPlanPanel;
})(typeof window !== "undefined" ? window : this);
