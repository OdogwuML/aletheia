// Aletheia SPA Router
const router = {
    routes: {},
    currentPage: null,

    register(path, handler) {
        this.routes[path] = handler;
    },

    async navigate(hash) {
        // Parse route
        const [path, query] = (hash || '').replace('#', '').split('?');
        const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};

        // Find matching route
        let handler = null;
        let routeParams = {};

        for (const [pattern, h] of Object.entries(this.routes)) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                handler = h;
                routeParams = match;
                break;
            }
        }

        if (!handler) {
            // Default: redirect to landing
            if (auth.isAuthenticated) {
                auth.redirectToDashboard();
            } else {
                this.navigate('');
            }
            return;
        }

        // Run page handler (showPage/showView is called inside each page controller)
        if (handler.init) {
            try {
                await handler.init({ ...routeParams, ...params });
            } catch (err) {
                console.error('Page error:', err);
                if (typeof utils !== 'undefined' && utils.toast) {
                    utils.toast(err.message, 'error');
                }
            }
        }
    },

    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    },

    init() {
        window.addEventListener('hashchange', () => this.navigate(window.location.hash));
        this.navigate(window.location.hash || '');
    }
};


window.router = router;
