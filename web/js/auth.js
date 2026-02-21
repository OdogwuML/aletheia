// Aletheia Authentication Module
const auth = {
    get token() { return localStorage.getItem('aletheia_token'); },
    get user() {
        const u = localStorage.getItem('aletheia_user');
        return u ? JSON.parse(u) : null;
    },
    get isAuthenticated() { return !!this.token; },
    get role() { return this.user?.role || ''; },

    save(authResponse) {
        localStorage.setItem('aletheia_token', authResponse.access_token);
        localStorage.setItem('aletheia_user', JSON.stringify(authResponse.user));
    },

    logout() {
        localStorage.removeItem('aletheia_token');
        localStorage.removeItem('aletheia_user');
        window.location.hash = '#/login';
    },

    // Redirect based on role after login
    redirectToDashboard() {
        if (this.role === 'landlord') {
            window.location.hash = '#/dashboard';
        } else {
            window.location.hash = '#/tenant';
        }
    },

    // Guards for routes
    requireAuth() {
        if (!this.isAuthenticated) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    },

    requireRole(role) {
        if (!this.requireAuth()) return false;
        if (this.role !== role) {
            this.redirectToDashboard();
            return false;
        }
        return true;
    }
};

window.auth = auth;
