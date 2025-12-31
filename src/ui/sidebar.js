/**
 * Sidebar Component
 * Handles the responsive sidebar navigation logic
 */
const Sidebar = (() => {
    // State
    let isOpen = false;
    let activeItem = null;

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
        elements.sidebar = document.getElementById('app-sidebar');
        elements.overlay = document.getElementById('sidebar-overlay');
        elements.toggleBtn = document.getElementById('sidebar-toggle');

        if (!elements.sidebar) return;

        // Setup event listeners
        if (elements.toggleBtn) {
            elements.toggleBtn.addEventListener('click', toggle);
        }

        if (elements.overlay) {
            elements.overlay.addEventListener('click', close);
        }

        // Setup menu items
        const links = elements.sidebar.querySelectorAll('.nav-link[data-target]');
        links.forEach(link => {
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

        // Setup submenu toggles
        const submenuToggles = elements.sidebar.querySelectorAll('[data-toggle-submenu]');
        submenuToggles.forEach(toggle => {
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
        isOpen = !isOpen;
        updateState();
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
