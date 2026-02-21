// Aletheia API Client
const API_BASE = window.location.origin + '/api';

const api = {
  async request(method, path, body = null, requiresAuth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (requiresAuth) {
      const token = localStorage.getItem('aletheia_token');
      if (!token) {
        window.location.hash = '#/login';
        throw new Error('Not authenticated');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  // Auth
  signup: (body) => api.request('POST', '/auth/signup', body, false),
  login: (body) => api.request('POST', '/auth/login', body, false),
  acceptInvite: (body) => api.request('POST', '/auth/accept-invite', body, false),

  // Dashboard
  landlordDashboard: () => api.request('GET', '/dashboard/landlord'),
  tenantDashboard: () => api.request('GET', '/dashboard/tenant'),

  // Buildings
  listBuildings: () => api.request('GET', '/buildings'),
  getBuilding: (id) => api.request('GET', `/buildings/${id}`),
  createBuilding: (body) => api.request('POST', '/buildings', body),
  updateBuilding: (id, body) => api.request('PUT', `/buildings/${id}`, body),
  listUnits: (buildingId) => api.request('GET', `/buildings/${buildingId}/units`),
  createUnit: (body) => api.request('POST', '/units', body),

  // Payments
  initializePayment: (body) => api.request('POST', '/payments/initialize', body),
  listPayments: (params = '') => api.request('GET', `/payments${params ? '?' + params : ''}`),

  // Invitations
  sendInvite: (body) => api.request('POST', '/invitations', body),
  listInvitations: () => api.request('GET', '/invitations'),
  verifyInvite: (token) => api.request('GET', `/invitations/verify?token=${token}`, null, false),

  // Maintenance
  createMaintenance: (body) => api.request('POST', '/maintenance', body),
  listMaintenance: () => api.request('GET', '/maintenance'),
  updateMaintenanceStatus: (id, body) => api.request('PUT', `/maintenance/${id}/status`, body),

  // Documents
  uploadDocument: (body, fileUrl) => api.request('POST', `/documents?file_url=${encodeURIComponent(fileUrl)}`, body),
  listDocuments: () => api.request('GET', '/documents'),
};

window.api = api;
