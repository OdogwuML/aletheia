// Aletheia Utilities
const utils = {
    // Format kobo amount to Naira
    formatMoney(kobo) {
        const naira = (kobo || 0) / 100;
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(naira);
    },

    // Format date
    formatDate(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format relative time
    timeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
        return utils.formatDate(dateStr);
    },

    // Get initials from name
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    // Show toast notification
    toast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    },

    // Show/hide loading
    showLoading(target) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    },

    // Occupancy percentage
    occupancyPercent(occupied, total) {
        if (!total) return 0;
        return Math.round((occupied / total) * 100);
    },

    // Parse query parameters from hash
    getHashParams() {
        const hash = window.location.hash;
        const qIndex = hash.indexOf('?');
        if (qIndex === -1) return {};
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        const obj = {};
        params.forEach((v, k) => obj[k] = v);
        return obj;
    },

    // Get current month period string
    getCurrentPeriod() {
        const d = new Date();
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    },

    // Payment status badge
    statusBadge(status) {
        const map = {
            'successful': '<span class="badge badge-success">Paid</span>',
            'pending': '<span class="badge badge-warning">Pending</span>',
            'failed': '<span class="badge badge-danger">Failed</span>',
            'occupied': '<span class="badge badge-success">Occupied</span>',
            'vacant': '<span class="badge badge-gray">Vacant</span>',
            'open': '<span class="badge badge-info">Open</span>',
            'in_progress': '<span class="badge badge-warning">In Progress</span>',
            'resolved': '<span class="badge badge-success">Resolved</span>',
            'closed': '<span class="badge badge-gray">Closed</span>',
            'accepted': '<span class="badge badge-success">Accepted</span>',
            'expired': '<span class="badge badge-danger">Expired</span>',
        };
        return map[status] || `<span class="badge badge-gray">${status}</span>`;
    },

    // Priority badge
    priorityBadge(priority) {
        const map = {
            'low': '<span class="badge badge-gray">Low</span>',
            'medium': '<span class="badge badge-info">Medium</span>',
            'high': '<span class="badge badge-warning">High</span>',
            'urgent': '<span class="badge badge-danger">Urgent</span>',
        };
        return map[priority] || priority;
    }
};

window.utils = utils;
