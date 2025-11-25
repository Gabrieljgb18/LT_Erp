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
        const links = elements.sidebar.querySelectorAll('.nav-link');
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
        elements.menuItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

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
