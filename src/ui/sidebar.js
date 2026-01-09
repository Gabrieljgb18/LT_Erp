/**
 * Sidebar Component
 * Handles the responsive sidebar navigation logic
 */
(function (global) {
    const Sidebar = (() => {
    // State
    let isOpen = false;
    let isCollapsed = false;
    let activeItem = null;
    const storageKey = 'lt-erp-sidebar-collapsed';
    let initialized = false;

    // DOM Elements
    const elements = {
        sidebar: null,
        overlay: null,
        toggleBtn: null,
        menuItems: []
    };

    /**
     * Initialize the sidebar
     */
    function init() {
        if (initialized) return;
        initialized = true;
        elements.sidebar = document.getElementById('app-sidebar');
        elements.overlay = document.getElementById('sidebar-overlay');
        elements.toggleBtn = document.getElementById('sidebar-toggle');

        if (!elements.sidebar) return;

        hydrateCollapsedState();
        syncResponsiveState();

        if (elements.sidebar.dataset.resizeBound !== "true") {
            window.addEventListener('resize', syncResponsiveState);
            elements.sidebar.dataset.resizeBound = "true";
        }

        // Setup event listeners
        if (elements.toggleBtn && elements.toggleBtn.dataset.bound !== "true") {
            elements.toggleBtn.dataset.bound = "true";
            elements.toggleBtn.addEventListener('click', toggle);
        }

        if (elements.overlay && elements.overlay.dataset.bound !== "true") {
            elements.overlay.dataset.bound = "true";
            elements.overlay.addEventListener('click', close);
        }

        // Setup menu items
        const links = elements.sidebar.querySelectorAll('.nav-link[data-target]');
        links.forEach(link => {
            if (link.dataset.bound === "true") return;
            link.dataset.bound = "true";
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if (targetId) {
                    setActive(targetId);
                    // On mobile, close sidebar after selection
                    if (window.innerWidth < 992) {
                        close();
                    }
                }
            });
            elements.menuItems.push(link);
        });

        // Tooltip labels for collapsed state
        const titledLinks = elements.sidebar.querySelectorAll('.nav-link, .nav-link-parent');
        titledLinks.forEach(link => {
            const label = link.querySelector('span');
            const text = label ? label.textContent.trim() : '';
            if (text && !link.getAttribute('title')) {
                link.setAttribute('title', text);
            }
        });

        // Setup submenu toggles
        const submenuToggles = elements.sidebar.querySelectorAll('[data-toggle-submenu]');
        submenuToggles.forEach(toggle => {
            if (toggle.dataset.bound === "true") return;
            toggle.dataset.bound = "true";
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const submenuId = toggle.getAttribute('data-toggle-submenu');
                const submenu = document.getElementById(submenuId);
                if (!submenu) return;

                const isOpen = submenu.classList.contains('show');
                elements.sidebar.querySelectorAll('.nav-submenu').forEach(sm => sm.classList.remove('show'));
                elements.sidebar.querySelectorAll('.nav-link-parent').forEach(p => p.classList.remove('expanded'));

                if (!isOpen) {
                    submenu.classList.add('show');
                    toggle.classList.add('expanded');
                }
            });
        });
    }

    /**
     * Toggle sidebar state
     */
    function toggle() {
        if (window.innerWidth < 992) {
            isOpen = !isOpen;
            updateState();
            return;
        }
        setCollapsed(!isCollapsed);
    }

    /**
     * Open sidebar
     */
    function open() {
        isOpen = true;
        updateState();
    }

    /**
     * Close sidebar
     */
    function close() {
        isOpen = false;
        updateState();
    }

    /**
     * Update DOM based on state
     */
    function updateState() {
        if (isOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }

    function hydrateCollapsedState() {
        try {
            const saved = localStorage.getItem(storageKey);
            isCollapsed = saved === '1';
        } catch (e) {
            isCollapsed = false;
        }
    }

    function setCollapsed(value) {
        isCollapsed = Boolean(value);
        try {
            localStorage.setItem(storageKey, isCollapsed ? '1' : '0');
        } catch (e) {
            // ignore storage errors
        }
        syncResponsiveState();
    }

    function syncResponsiveState() {
        const isMobile = window.innerWidth < 992;
        if (isMobile) {
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.toggle('sidebar-collapsed', isCollapsed);
            document.body.classList.remove('sidebar-open');
            isOpen = false;
        }
    }

    /**
     * Set active menu item
     * @param {string} targetId - ID of the target view
     */
    function setActive(targetId) {
        activeItem = targetId;

        // Update menu items
        let activeLink = null;
        elements.menuItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
                activeLink = item;
            } else {
                item.classList.remove('active');
            }
        });

        // Reset parent menus
        if (elements.sidebar) {
            elements.sidebar.querySelectorAll('.nav-link-parent').forEach(p => {
                p.classList.remove('active');
            });
        }

        // Expand parent submenu if needed
        if (activeLink) {
            const group = activeLink.closest('.nav-item-group');
            if (group) {
                const parentToggle = group.querySelector('.nav-link-parent');
                const submenu = group.querySelector('.nav-submenu');
                if (parentToggle && submenu) {
                    parentToggle.classList.add('active', 'expanded');
                    submenu.classList.add('show');
                }
            }
        }

        // Trigger custom event for view change
        const event = new CustomEvent('view-change', {
            detail: { view: targetId }
        });
        document.dispatchEvent(event);
    }

        return {
            init,
            toggle,
            open,
            close,
            setActive
        };
    })();

    global.Sidebar = Sidebar;
})(typeof window !== "undefined" ? window : this);
