// main.js - Application Router and Orchestrator

const routes = {
    '/': 'login',
    '/login': 'login',
    '/dashboard': 'dashboard',
    '/contact': 'contact',
    '/store': 'store',
    '/store-details': 'store-details',
    '/product': 'product',
    '/stock': 'stock',
    '/transaction': 'transaction',
    '/transaction-view': 'transaction-view',
    '/expenses': 'expenses',
    '/salary': 'salary',
    '/profile': 'profile',
    '/notifications': 'notifications',
    '/pos': 'pos',
    '/statement': 'statement',
};

const appState = {
    currentRoute: 'login'
};

async function navigateTo(path) {
    const route = path.replace(/^\//, '');
    
    // For local file:// usage, use query params to avoid breaking relative paths
    if (window.location.protocol === 'file:') {
        history.pushState(null, null, '?page=' + route);
    } else {
        history.pushState(null, null, '/' + route);
    }
    
    await router();
}

async function router() {
    let routeId = 'login';
    
    if (window.location.protocol === 'file:') {
        const urlParams = new URLSearchParams(window.location.search);
        routeId = urlParams.get('page') || 'login';
    } else {
        let path = window.location.pathname;
        if (path.endsWith('index.html') || path.endsWith('/')) {
            routeId = 'login';
        } else {
            routeId = path.split('/').pop().replace('.html', '');
        }
    }

    if (routeId !== 'login') {
        const ok = await requireSession();
        if (!ok) return; // requireSession already navigated to login
    }
    
    routeId = routes['/' + routeId] || routeId;
    appState.currentRoute = routeId;

    // Inject layout if it hasn't been injected yet
    const rootContainer = document.getElementById('root');
    if (rootContainer && !document.getElementById('app-sidebar')) {
        if (typeof render_layout === 'function') {
            rootContainer.innerHTML = render_layout();
        }
    }

    // Render Layout Shell Components
    const sidebarContainer = document.getElementById('app-sidebar');
    const topbarContainer = document.getElementById('app-topbar');
    const mainContent = document.querySelector('.main-content');
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    if (sidebarContainer && topbarContainer) {
        if (routeId === 'login') {
            sidebarContainer.style.display = 'none';
            topbarContainer.style.display = 'none';
            if (mainContent) {
                mainContent.style.marginLeft = '0';
                mainContent.style.padding = '0';
            }
            if (dashboardContainer) dashboardContainer.style.gridTemplateColumns = '1fr';
            document.body.style.overflow = '';
            document.body.classList.remove('sidebar-collapsed');
        } else {
            sidebarContainer.style.display = 'block';
            topbarContainer.style.display = 'block';
            if (mainContent) {
                mainContent.style.marginLeft = '';
                mainContent.style.padding = '';
            }
            if (dashboardContainer) dashboardContainer.style.gridTemplateColumns = '';
            
            if (routeId === 'pos') {
                document.body.style.overflow = 'hidden';
                document.body.classList.add('sidebar-collapsed');
            } else {
                document.body.style.overflow = '';
                document.body.classList.remove('sidebar-collapsed');
            }
            
            sidebarContainer.innerHTML = await renderSidebar(routeId);
            topbarContainer.innerHTML = renderTopbar();
            await attachLayoutListeners();
        }
    }

    // Render Page Content
    await loadAndRenderPage(routeId);
    await populateUserProfileHeader();
}

window.pageScriptLoading = window.pageScriptLoading || {};

async function loadAndRenderPage(routeId) {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;

    const functionName = 'render_' + routeId.replace('-', '_');

    if (typeof window[functionName] !== 'function') {
        try {
            if (!window.pageScriptLoading[routeId]) {
                window.pageScriptLoading[routeId] = loadScript(`pages/${routeId}.js`);
            }
            await window.pageScriptLoading[routeId];
        } catch (error) {
            delete window.pageScriptLoading[routeId];
            contentDiv.innerHTML = `<div style="padding: 24px;"><h2>Error loading ${routeId}.js</h2><p>${error.message}</p></div>`;
            return;
        }
    }

    if (typeof window[functionName] === 'function') {
        contentDiv.innerHTML = window[functionName]();
        if (typeof window['init_' + routeId.replace('-', '_')] === 'function') {
            window['init_' + routeId.replace('-', '_')]();
        }
        if (typeof window.initializeSelect2 === 'function') {
            window.initializeSelect2();
        }
    } else {
        contentDiv.innerHTML = `<div style="padding: 24px;"><h2>Page ${routeId} not found or not converted to JS yet.</h2><p>Please create pages/${routeId}.js with a function named ${functionName}().</p></div>`;
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const APP_VERSION = '2026-07-15-1'; // For production later
        script.src = src + '?v=' + Date.now(); // cache-bust every load
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

async function attachLayoutListeners() {
    // Topbar Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn) {
        // Replace node to avoid duplicate event listeners on subsequent renders
        const newBtn = sidebarToggleBtn.cloneNode(true);
        sidebarToggleBtn.parentNode.replaceChild(newBtn, sidebarToggleBtn);
        newBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // "Active Store" details link — jump to that store's profile page
    const activeStoreDetailsLink = document.getElementById('active-store-details-link');
    if (activeStoreDetailsLink) {
        // Replace node to avoid duplicate listeners on subsequent renders
        const newDetailsLink = activeStoreDetailsLink.cloneNode(true);
        activeStoreDetailsLink.parentNode.replaceChild(newDetailsLink, activeStoreDetailsLink);
        newDetailsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const activeStoreId = await window.getActiveStoreId();
            if (!activeStoreId) return;
            localStorage.setItem('view_store_id', activeStoreId);
            navigateTo('store-details');
        });
    }

    if (typeof window.initializeSelect2 === 'function') {
        window.initializeSelect2();
    }

    // Populate the "VIEW OUTSTANDING" contact search dropdown
    if (typeof window.wireTopbarSearch === 'function') {
        await window.wireTopbarSearch();
    }
    
    // Global Store Selector Logic
    if (typeof jQuery !== 'undefined') {
        const globalStoreSel = $('#global-store-selector');
        if (globalStoreSel.length) {
            function formatStoreOption(state) {
                if (!state.id) { return state.text; }
                return $('<span>' + state.text + '</span>');
            }

            try { globalStoreSel.select2('destroy'); } catch(e) {}
            globalStoreSel.select2({
                templateResult: formatStoreOption,
                templateSelection: formatStoreOption
            });

            let previousStore = localStorage.getItem('active_store_id');
            if (!previousStore) {
                const activeStoreId = await window.getActiveStoreId();
                previousStore = activeStoreId;
            }

            // Force the dropdown to reflect the true active store — don't rely solely
            // on the rendered 'selected' attribute surviving a full sidebar re-render.
            globalStoreSel.val(String(previousStore)).trigger('change.select2');
            
            globalStoreSel.off('select2:selecting').on('select2:selecting', function(e) {
                e.preventDefault();
                const nextStore = e.params.args.data.id;
                
                const modal = document.getElementById('global-store-modal');
                if (modal) {
                    modal.classList.add('active');
                    
                    window.confirmGlobalStoreChange = function() {
                        modal.classList.remove('active');
                        localStorage.setItem('active_store_id', nextStore);
                        
                        // Programmatically update the select2
                        globalStoreSel.val(nextStore).trigger('change.select2');
                        
                        // Re-run router to update all page templates with the new store context
                        router();
                    };
                    
                    window.cancelGlobalStoreChange = function() {
                        modal.classList.remove('active');
                    };
                }
            });
        }
    }
}

// Intercept browser back/forward buttons
window.addEventListener('popstate', router);

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Intercept SPA navigation clicks dynamically
    document.body.addEventListener('click', e => {
        const linkTarget = e.target.closest('[data-link]');
        if (linkTarget) {
            e.preventDefault();
            navigateTo('/' + linkTarget.getAttribute('data-link'));
        }
    });

    router();
});

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
});

// Button Micro-animations via Event Delegation
document.body.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('button:not(.disabled)');
    if (btn) btn.style.transform = 'scale(0.95)';
});
document.body.addEventListener('mouseup', (e) => {
    const btn = e.target.closest('button:not(.disabled)');
    if (btn) btn.style.transform = 'scale(1)';
});
document.body.addEventListener('mouseleave', (e) => {
    const btn = e.target.closest('button:not(.disabled)');
    if (btn) {
        if(btn.classList.contains('primary-btn')) {
            btn.style.transform = 'translateY(-2px)';
        } else {
            btn.style.transform = 'scale(1)';
        }
    }
}, true); // use capture phase for mouseleave

window.initializeSelect2 = function() {
    if (typeof jQuery !== 'undefined' && $.fn.select2) {
        $('select.select2-search').each(function() {
            if (!$(this).hasClass("select2-hidden-accessible")) {
                $(this).select2({
                    width: '100%'
                });
            }
        });
    }
};