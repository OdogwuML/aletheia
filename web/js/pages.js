// Aletheia Page Controllers — Stitch Design Match
const pages = {};

// ============================================
// LANDING PAGE
// ============================================
pages.landing = {
  init() {
    showPage('landing');
  }
};

// ============================================
// HELPERS
// ============================================
function showPage(id) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.remove('hidden');
}

function showView(id) {
  document.querySelectorAll('.page-content').forEach(v => v.classList.add('hidden'));
  const el = document.getElementById('view-' + id);
  if (el) el.classList.remove('hidden');
  // Update sidebar active state
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-page="${id}"]`);
  if (link) link.classList.add('active');
}

function formatMoney(kobo) {
  const n = (kobo || 0) / 100;
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = ['blue', 'teal', 'purple', 'orange'];
function avatarColor(i) { return avatarColors[i % avatarColors.length]; }

// ============================================
// AUTH PAGE
// ============================================
pages.auth = {
  isSignup: false,
  selectedRole: 'landlord',

  init() {
    showPage('auth');
    this.updateUI();
  },

  selectRole(role) {
    this.selectedRole = role;
    document.getElementById('role-landlord').classList.toggle('selected', role === 'landlord');
    document.getElementById('role-tenant').classList.toggle('selected', role === 'tenant');
  },

  updateUI() {
    const h1 = document.querySelector('.auth-card h1');
    const sub = document.getElementById('auth-subtitle');
    const nameG = document.getElementById('auth-name-group');
    const roleG = document.getElementById('auth-role-group');
    const forgotLink = document.getElementById('auth-forgot-link');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (this.isSignup) {
      h1.textContent = 'Create your Account';
      sub.textContent = 'Start managing your properties in minutes.';
      nameG.classList.remove('hidden');
      roleG.classList.remove('hidden');
      forgotLink.classList.add('hidden');
      submitBtn.textContent = 'Create Account →';
      toggleText.textContent = 'Already have an account?';
      toggleLink.textContent = ' Sign in';
    } else {
      h1.textContent = 'Welcome Back';
      sub.textContent = 'Managing properties in Nigeria made simple.';
      nameG.classList.add('hidden');
      roleG.classList.add('hidden');
      forgotLink.classList.remove('hidden');
      submitBtn.textContent = 'Sign In →';
      toggleText.textContent = "Don't have an account?";
      toggleLink.textContent = ' Sign up for free';
    }

    toggleLink.onclick = (e) => {
      e.preventDefault();
      this.isSignup = !this.isSignup;
      this.updateUI();
    };

    document.getElementById('auth-form').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errEl = document.getElementById('auth-error');
      errEl.classList.add('hidden');
      try {
        if (this.isSignup) {
          const name = document.getElementById('auth-name').value;
          await api.signup({ email, password, name, role: this.selectedRole });
        } else {
          await api.login({ email, password });
        }
        const user = auth.user;
        if (user && user.role === 'tenant') {
          window.location.hash = '#/tenant';
        } else {
          window.location.hash = '#/dashboard';
        }
      } catch (err) {
        errEl.textContent = err.message || 'Authentication failed';
        errEl.classList.remove('hidden');
      }
    };
  }
};

// ============================================
// APP SHELL INIT
// ============================================
pages.appShell = {
  init(role) {
    showPage('app');
    const user = auth.user;
    const name = user?.name || 'User';
    const r = role || user?.role || 'landlord';
    const ini = getInitials(name);

    // Sidebar
    document.getElementById('user-avatar').textContent = ini;
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-role').textContent = r;
    document.getElementById('sidebar-portal-label').textContent = r === 'tenant' ? 'Tenant Portal' : 'Landlord Portal';

    // Top bar
    document.getElementById('topbar-name').textContent = name;
    document.getElementById('topbar-role').textContent = r.toUpperCase();
    document.getElementById('topbar-avatar').textContent = ini;

    // Show correct nav
    document.getElementById('nav-landlord').classList.toggle('hidden', r === 'tenant');
    document.getElementById('nav-tenant').classList.toggle('hidden', r !== 'tenant');
  }
};

// ============================================
// LANDLORD DASHBOARD
// ============================================
pages.dashboard = {
  async init() {
    pages.appShell.init('landlord');
    showView('dashboard');
    const user = auth.user;
    document.getElementById('dash-name').textContent = (user?.name || 'Chief').split(' ')[0];

    try {
      const data = await api.landlordDashboard();
      this.renderStats(data);
      this.renderRecentPayments(data.recent_payments || []);
      this.renderProperties(data.buildings || []);
    } catch {
      document.getElementById('dash-stats').innerHTML = '<p class="text-gray text-sm">Unable to load dashboard data.</p>';
    }
  },

  renderStats(d) {
    const stats = [
      { label: 'Total Properties', value: d.total_buildings || 0, change: '+2 this quarter', cls: 'positive' },
      { label: 'Total Units', value: d.total_units || 0, change: `${d.occupied_units || 0} occupied`, cls: 'stable' },
      { label: 'Occupancy Rate', value: (d.occupancy_rate || 0) + '%', bar: d.occupancy_rate || 0, cls: 'positive' },
      { label: 'Monthly Revenue', value: formatMoney(d.monthly_revenue || 0), change: '↗ On target', cls: 'positive', highlight: true },
      { label: 'Pending Payments', value: d.pending_payments || 0, change: 'Action needed', cls: 'negative' },
    ];
    document.getElementById('dash-stats').innerHTML = stats.map(s => `
      <div class="stat-card${s.highlight ? ' stat-card--highlight' : ''}">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        ${s.bar !== undefined ? `<div class="stat-bar"><div class="progress-bar"><div class="progress-fill blue" style="width:${s.bar}%"></div></div></div>` : ''}
        <div class="stat-change ${s.cls}">${s.change || ''}</div>
      </div>
    `).join('');
  },

  renderRecentPayments(payments) {
    if (!payments.length) {
      document.getElementById('dash-payments-table').innerHTML = '<p class="text-gray text-sm">No recent payments</p>';
      return;
    }
    document.getElementById('dash-payments-table').innerHTML = `
      <table class="data-table" style="font-size:0.85rem">
        <thead><tr><th>TENANT</th><th>BUILDING</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
        <tbody>${payments.slice(0, 5).map((p, i) => `
          <tr>
            <td><div class="avatar-cell"><div class="avatar-sm ${avatarColor(i)}">${getInitials(p.tenant_name)}</div><div><div class="font-semibold" style="color:var(--gray-800)">${p.tenant_name || 'Tenant'}</div></div></div></td>
            <td>${p.building_name || '—'}</td>
            <td class="font-bold">${formatMoney(p.amount)}</td>
            <td><span class="badge ${p.status === 'successful' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${p.status || 'pending'}</span></td>
          </tr>
        `).join('')}</tbody>
      </table>`;
  },

  renderProperties(buildings) {
    if (!buildings.length) {
      document.getElementById('dash-properties').innerHTML = '<p class="text-gray text-sm">No properties yet</p>';
      return;
    }
    document.getElementById('dash-properties').innerHTML = buildings.slice(0, 4).map(b => `
      <a href="#/buildings/${b.id}" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--gray-100);color:var(--gray-700);text-decoration:none">
        <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:1rem">🏢</div>
        <div style="flex:1"><div class="font-semibold text-sm" style="color:var(--gray-800)">${b.name}</div><div class="text-xs text-gray">${b.address || ''}</div></div>
        <div class="text-xs font-semibold" style="color:var(--primary)">${b.total_units || 0} units</div>
      </a>
    `).join('');
  }
};

// ============================================
// BUILDINGS LIST
// ============================================
pages.buildings = {
  async init() {
    pages.appShell.init('landlord');
    showView('buildings');
    try {
      const buildings = await api.listBuildings();
      this.render(buildings);
    } catch {
      document.getElementById('buildings-grid').innerHTML = '<p class="text-gray">Failed to load properties.</p>';
    }
  },

  render(buildings) {
    const grid = document.getElementById('buildings-grid');
    const count = buildings.length;
    document.getElementById('buildings-subtitle').textContent = `${count} propert${count === 1 ? 'y' : 'ies'} in your portfolio`;

    grid.innerHTML = buildings.map(b => {
      const occ = b.total_units ? Math.round((b.occupied_units || 0) / b.total_units * 100) : 0;
      return `
      <div class="building-card" onclick="window.location.hash='#/buildings/${b.id}'">
        <div class="building-photo">${b.photo_url ? `<img src="${b.photo_url}" alt="${b.name}">` : '🏢'}
          <span class="status-tag ${occ >= 80 ? 'healthy' : occ >= 50 ? 'warning' : 'danger'}">${occ >= 80 ? 'Healthy' : occ >= 50 ? 'Fair' : 'Low'}</span>
        </div>
        <div class="building-info">
          <div class="building-name-row"><span class="building-name">${b.name}</span><span class="building-menu">⋯</span></div>
          <div class="building-address">📍 ${b.address || 'No address'}</div>
          <div class="building-metrics">
            <div><div class="metric-label">UNITS</div><div class="metric-value">${b.occupied_units || 0}<span class="total">/${b.total_units || 0}</span></div></div>
            <div><div class="metric-label">RENT COLLECTED</div><div class="metric-value">${formatMoney(b.rent_collected || 0)}</div></div>
          </div>
          <div class="occupancy-row"><span>Occupancy</span><span class="occ-percent">${occ}%</span></div>
          <div class="progress-bar"><div class="progress-fill ${occ >= 80 ? 'green' : occ >= 50 ? 'blue' : 'red'}" style="width:${occ}%"></div></div>
          <div class="building-footer"><span>Updated ${formatDate(b.updated_at)}</span><a href="#/buildings/${b.id}">Manage →</a></div>
        </div>
      </div>`;
    }).join('') + `
    <div class="building-card--new" onclick="pages.buildings.showAddModal()">
      <div class="new-icon">+</div>
      <h3>Add New Property</h3>
      <p>Expand your portfolio by adding a new building</p>
    </div>`;
  },

  showAddModal() {
    document.getElementById('modal-add-building').classList.add('active');
  },

  async createBuilding() {
    const name = document.getElementById('building-name').value;
    const address = document.getElementById('building-address').value;
    const total = parseInt(document.getElementById('building-units').value);
    const type = document.getElementById('building-type').value;
    try {
      await api.createBuilding({ name, address, total_units: total, type });
      document.getElementById('modal-add-building').classList.remove('active');
      document.getElementById('form-add-building').reset();
      this.init();
    } catch (e) { alert(e.message); }
  }
};

// ============================================
// BUILDING DETAIL
// ============================================
pages.buildingDetail = {
  buildingId: null,

  async init(id) {
    this.buildingId = id;
    pages.appShell.init('landlord');
    showView('building-detail');
    try {
      const b = await api.getBuilding(id);
      document.getElementById('building-breadcrumb').textContent = b.name;
      document.getElementById('building-detail-name').textContent = b.name;
      document.getElementById('building-detail-address').innerHTML = '📍 ' + (b.address || '');

      const occ = b.total_units ? Math.round((b.occupied_units || 0) / b.total_units * 100) : 0;
      document.getElementById('building-stats').innerHTML = [
        { label: 'Total Units', value: b.total_units || 0 },
        { label: 'Occupied', value: b.occupied_units || 0 },
        { label: 'Occupancy', value: occ + '%', bar: occ },
        { label: 'Monthly Income', value: formatMoney(b.monthly_income || 0) },
        { label: 'Pending', value: b.pending_payments || 0 },
      ].map(s => `<div class="stat-card"><div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div>${s.bar !== undefined ? `<div class="stat-bar"><div class="progress-bar"><div class="progress-fill blue" style="width:${s.bar}%"></div></div></div>` : ''}</div>`).join('');

      const units = b.units || [];
      document.getElementById('building-units-body').innerHTML = units.length ? units.map((u, i) => `<tr>
        <td class="font-semibold">${u.unit_number || 'Unit'}</td>
        <td>${u.tenant_name ? `<div class="avatar-cell"><div class="avatar-sm ${avatarColor(i)}">${getInitials(u.tenant_name)}</div><div><div class="font-semibold">${u.tenant_name}</div><div class="text-xs text-gray">${u.tenant_phone || ''}</div></div></div>` : '<span class="text-gray">Vacant</span>'}</td>
        <td class="font-bold">${formatMoney(u.rent_amount)}</td>
        <td><span class="badge ${u.status === 'paid' ? 'badge-success' : u.status === 'overdue' ? 'badge-danger' : 'badge-warning'}">${u.status || 'vacant'}</span></td>
        <td>${formatDate(u.last_paid)}</td>
        <td class="font-bold">${u.amount_paid ? formatMoney(u.amount_paid) : '—'}</td>
        <td>${u.tenant_id ? '' : `<button class="btn btn-sm btn-primary" onclick="pages.buildingDetail.showInviteModal('${u.id}')">Invite</button>`}</td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center text-gray" style="padding:2rem">No units found. Add one above.</td></tr>';
    } catch (e) {
      document.getElementById('building-units-body').innerHTML = `<tr><td colspan="7" class="text-gray text-center">${e.message}</td></tr>`;
    }
  },

  showAddUnitModal() { document.getElementById('modal-add-unit').classList.add('active'); },
  showInviteModal(unitId) {
    document.getElementById('invite-unit-id').value = unitId;
    document.getElementById('modal-invite-tenant').classList.add('active');
  },

  async createUnit() {
    const number = document.getElementById('unit-number').value;
    const rent = parseInt(document.getElementById('unit-rent').value) * 100;
    try {
      await api.createUnit({ building_id: this.buildingId, unit_number: number, rent_amount: rent });
      document.getElementById('modal-add-unit').classList.remove('active');
      document.getElementById('form-add-unit').reset();
      this.init(this.buildingId);
    } catch (e) { alert(e.message); }
  },

  async sendInvite() {
    const unitId = document.getElementById('invite-unit-id').value;
    const email = document.getElementById('invite-email').value;
    const phone = document.getElementById('invite-phone').value;
    try {
      await api.sendInvite({ unit_id: unitId, email, phone: phone ? '+234' + phone : '' });
      document.getElementById('modal-invite-tenant').classList.remove('active');
      document.getElementById('form-invite-tenant').reset();
      alert('Invite sent successfully!');
    } catch (e) { alert(e.message); }
  }
};

// ============================================
// PAYMENT RECORDS
// ============================================
pages.payments = {
  allPayments: [],

  async init() {
    const user = auth.user;
    const role = user?.role || 'landlord';
    pages.appShell.init(role);
    showView('payments');
    document.getElementById('payments-subtitle').textContent =
      role === 'tenant' ? 'Your payment history and upcoming rent' : 'Review and manage all rental transactions across your property portfolio.';
    try {
      this.allPayments = await api.listPayments();
      this.render(this.allPayments);
    } catch {
      document.getElementById('payments-body').innerHTML = '<tr><td colspan="7" class="text-center text-gray">No payments found.</td></tr>';
    }
  },

  filter() {
    const status = document.getElementById('payment-status-filter').value;
    const filtered = status ? this.allPayments.filter(p => p.status === status) : this.allPayments;
    this.render(filtered);
  },

  render(payments) {
    if (!Array.isArray(payments)) payments = [];
    document.getElementById('payments-body').innerHTML = payments.length ? payments.map((p, i) => `<tr>
      <td><div class="avatar-cell"><div class="avatar-sm ${avatarColor(i)}">${getInitials(p.tenant_name)}</div><div><div class="font-semibold">${p.tenant_name || 'Tenant'}</div><div class="text-xs text-gray">${p.tenant_phone || ''}</div></div></div></td>
      <td>${p.building_name || '—'}, ${p.unit_number || ''}</td>
      <td class="font-bold">${formatMoney(p.amount)}</td>
      <td><div>${formatDate(p.created_at)}</div><div class="text-xs text-gray">${p.created_at ? new Date(p.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : ''}</div></td>
      <td><span class="badge ${p.status === 'successful' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}">● ${p.status === 'successful' ? 'Successful' : p.status === 'pending' ? 'Pending' : 'Failed'}</span></td>
      <td>${p.payment_method || '—'}</td>
      <td><button class="btn btn-icon">⋯</button></td>
    </tr>`).join('') : '<tr><td colspan="7" class="text-center text-gray" style="padding:2rem">No payments match your filter.</td></tr>';
  }
};

// ============================================
// MAINTENANCE
// ============================================
pages.maintenance = {
  async init() {
    const user = auth.user;
    const role = user?.role || 'landlord';
    pages.appShell.init(role);
    showView('maintenance');
    if (role === 'tenant') {
      document.getElementById('btn-create-maintenance').classList.remove('hidden');
    } else {
      document.getElementById('btn-create-maintenance').classList.add('hidden');
    }
    try {
      const items = await api.listMaintenance();
      this.render(items, role);
    } catch {
      document.getElementById('maintenance-body').innerHTML = '<tr><td colspan="5" class="text-center text-gray">No maintenance requests.</td></tr>';
    }
  },

  render(items, role) {
    if (!Array.isArray(items)) items = [];
    document.getElementById('maintenance-body').innerHTML = items.length ? items.map(m => `<tr>
      <td>${formatDate(m.created_at)}</td>
      <td><div class="font-semibold">${m.title}</div><div class="text-xs text-gray">${(m.description || '').slice(0, 50)}${m.description && m.description.length > 50 ? '...' : ''}</div></td>
      <td><span class="badge ${m.priority === 'urgent' ? 'badge-danger' : m.priority === 'high' ? 'badge-warning' : 'badge-info'}">${m.priority}</span></td>
      <td><span class="badge ${m.status === 'resolved' ? 'badge-success' : m.status === 'in_progress' ? 'badge-info' : 'badge-gray'}">${(m.status || 'open').replace('_', ' ')}</span></td>
      <td>${role === 'landlord' ? `<select class="form-control" style="width:auto;font-size:0.75rem" onchange="pages.maintenance.updateStatus('${m.id}', this.value)">
        <option value="open" ${m.status === 'open' ? 'selected' : ''}>Open</option>
        <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
        <option value="resolved" ${m.status === 'resolved' ? 'selected' : ''}>Resolved</option>
      </select>` : '—'}</td>
    </tr>`).join('') : '<tr><td colspan="5" class="text-center text-gray" style="padding:2rem">No maintenance requests yet.</td></tr>';
  },

  showCreateModal() { document.getElementById('modal-maintenance').classList.add('active'); },

  async createRequest() {
    const title = document.getElementById('maintenance-title').value;
    const desc = document.getElementById('maintenance-desc').value;
    const priority = document.getElementById('maintenance-priority').value;
    try {
      await api.createMaintenance({ title, description: desc, priority });
      document.getElementById('modal-maintenance').classList.remove('active');
      document.getElementById('form-maintenance').reset();
      this.init();
    } catch (e) { alert(e.message); }
  },

  async updateStatus(id, status) {
    try { await api.updateMaintenanceStatus(id, { status }); } catch (e) { alert(e.message); }
  }
};

// ============================================
// DOCUMENTS
// ============================================
pages.documents = {
  async init() {
    const user = auth.user;
    pages.appShell.init(user?.role || 'landlord');
    showView('documents');
    try {
      const docs = await api.listDocuments();
      const list = Array.isArray(docs) ? docs : [];
      document.getElementById('documents-list').innerHTML = list.length ? list.map(d => `
        <div class="card" style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem">
          <div style="width:40px;height:40px;background:var(--primary-50);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center">📄</div>
          <div style="flex:1"><div class="font-semibold text-sm">${d.name}</div><div class="text-xs text-gray">${formatDate(d.created_at)}</div></div>
          <a href="${d.url}" target="_blank" class="btn btn-sm btn-secondary">Download</a>
        </div>
      `).join('') : '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">No documents yet</div><div class="empty-description">Lease agreements and receipts will appear here.</div></div>';
    } catch {
      document.getElementById('documents-list').innerHTML = '<p class="text-gray">Unable to load documents.</p>';
    }
  }
};

// ============================================
// TENANT DASHBOARD
// ============================================
pages.tenantDashboard = {
  async init() {
    pages.appShell.init('tenant');
    showView('tenant');
    const user = auth.user;
    document.getElementById('tenant-dash-name').textContent = (user?.name || 'Tenant').split(' ')[0];

    try {
      const data = await api.tenantDashboard();
      this.render(data);
    } catch {
      document.getElementById('tenant-main-content').innerHTML = '<p class="text-gray">Unable to load your tenancy info.</p>';
    }
  },

  render(d) {
    const unit = d.unit || {};
    const building = d.building || {};
    document.getElementById('tenant-building-subtitle').textContent = `${building.name || 'Your building'}, ${unit.unit_number || ''}`;

    document.getElementById('tenant-main-content').innerHTML = `
      <div>
        <div class="tenant-property-card">
          <div class="tenant-property-photo">
            ${building.photo_url ? `<img src="${building.photo_url}" alt="${building.name}">` : ''}
            <span class="lease-badge">Active Lease</span>
          </div>
          <div class="tenant-property-info">
            <div class="building-label">YOUR PROPERTY</div>
            <h2>${building.name || 'Your Building'}</h2>
            <div class="address">📍 ${building.address || ''}</div>
            <div class="tenant-unit-details">
              <div><div class="tenant-unit-label">UNIT NUMBER</div><div class="tenant-unit-value">${unit.unit_number || '—'}</div></div>
              <div><div class="tenant-unit-label">MONTHLY RENT</div><div class="tenant-unit-value">${formatMoney(unit.rent_amount)}</div></div>
              <div><div class="tenant-unit-label">LEASE START</div><div class="tenant-unit-value">${formatDate(unit.lease_start)}</div></div>
              <div><div class="tenant-unit-label">LEASE END</div><div class="tenant-unit-value">${formatDate(unit.lease_end)}</div></div>
            </div>
            <div class="tenant-status-card">
              <div class="tenant-status-label">Next payment due</div>
              <div class="tenant-status-value">${d.next_due_date ? formatDate(d.next_due_date) : 'Not scheduled'}</div>
              <a href="#/pay-rent" class="tenant-pay-btn">💳 Pay Rent Now</a>
              <div class="tenant-secure-text">🔒 Payments secured by Paystack</div>
            </div>
          </div>
        </div>
      </div>
      <div class="tenant-sidebar-cards">
        <div class="rent-info-card">
          <div class="rent-icon">💰</div>
          <div class="rent-label">Total Paid This Year</div>
          <div class="rent-value">${formatMoney(d.total_paid || 0)}</div>
          <div class="rent-due"><div class="due-label">Next Due Amount</div><div class="due-value">${formatMoney(unit.rent_amount)}</div></div>
        </div>
        <div class="resources-card">
          <h4>Quick Links</h4>
          <a href="#/payments" class="resource-link"><span class="res-left"><span class="res-icon">💳</span> Payment History</span> →</a>
          <a href="#/maintenance" class="resource-link"><span class="res-left"><span class="res-icon">🔧</span> Maintenance Requests</span> →</a>
          <a href="#/documents" class="resource-link"><span class="res-left"><span class="res-icon">📄</span> Documents & Receipts</span> →</a>
        </div>
      </div>`;
  }
};

// ============================================
// PAY RENT
// ============================================
pages.payRent = {
  async init() {
    pages.appShell.init('tenant');
    showView('pay-rent');
    try {
      const data = await api.tenantDashboard();
      this.render(data);
    } catch {
      document.getElementById('pay-rent-container').innerHTML = '<p class="text-gray">Unable to load payment info.</p>';
    }
  },

  render(d) {
    const unit = d.unit || {};
    const building = d.building || {};
    const month = new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
    document.getElementById('pay-rent-container').innerHTML = `
      <h1>Pay Your Rent</h1>
      <p class="pay-desc">Complete your monthly rent payment securely through Paystack.</p>
      <div class="pay-rent-card">
        <div class="pay-property-preview">
          ${building.photo_url ? `<img src="${building.photo_url}" alt="">` : '<div style="background:var(--gray-200);height:100%"></div>'}
          <div class="pay-overlay"><div class="pay-for">PAYING FOR</div><div class="pay-period">${month} Rent</div></div>
        </div>
        <div class="pay-details">
          <div class="pay-property-detail"><span class="pay-property-label">Property</span><span class="pay-property-value">${building.name || '—'}</span></div>
          <div class="pay-property-detail"><span class="pay-property-label">Unit</span><span class="pay-property-value">${unit.unit_number || '—'}</span></div>
          <div class="pay-property-detail"><span class="pay-property-label">Period</span><span class="pay-property-value">${month}</span></div>
          <div class="pay-total"><div class="total-label">TOTAL AMOUNT DUE</div><div class="total-amount">${formatMoney(unit.rent_amount)}</div></div>
        </div>
        <div class="pay-btn-container">
          <button class="pay-btn" onclick="pages.payRent.checkout()">🔒 Proceed to Pay</button>
          <div class="pay-secure">🔒 Secured by Paystack</div>
        </div>
      </div>
      <div class="pay-support">Facing issues? <a href="#">Contact Aletheia Support</a></div>`;
  },

  async checkout() {
    try {
      const res = await api.initializePayment({});
      if (res.authorization_url) window.location.href = res.authorization_url;
    } catch (e) { alert(e.message || 'Payment initialization failed'); }
  }
};

// ============================================
// PAYMENT SUCCESS
// ============================================
pages.paymentSuccess = {
  init(params) {
    pages.appShell.init('tenant');
    showView('payment-success');
    document.getElementById('success-container').innerHTML = `
      <div class="success-icon-circle">✓</div>
      <h1>Payment Successful</h1>
      <p class="success-msg">Your payment has been processed successfully. A copy of the receipt has been sent to your email.</p>
      <div class="success-receipt">
        <div class="receipt-top">
          <div><div class="receipt-total-label">TOTAL AMOUNT PAID</div><div class="receipt-total-amount">${formatMoney(params?.amount || 0)}</div></div>
          <span class="badge badge-success">PAID</span>
        </div>
        <div class="receipt-grid">
          <div class="receipt-item"><div class="receipt-label">Property</div><div class="receipt-value">${params?.building || '—'}</div></div>
          <div class="receipt-item"><div class="receipt-label">Payment Type</div><div class="receipt-value">${params?.type || 'Monthly Rent'}</div></div>
          <div class="receipt-item"><div class="receipt-label">Transaction ID</div><div class="receipt-value">${params?.reference || 'TXN-' + Date.now()}</div></div>
          <div class="receipt-item"><div class="receipt-label">Date & Time</div><div class="receipt-value">${new Date().toLocaleString('en-NG')}</div></div>
        </div>
      </div>
      <div class="success-actions">
        <button class="btn btn-teal btn-lg w-full">↓ Download Receipt</button>
        <a href="#/tenant" class="btn btn-dark btn-lg w-full">Back to Dashboard</a>
      </div>
      <div class="pay-support" style="margin-top:1.5rem">Facing issues? <a href="#">Contact Support</a></div>`;
  }
};

// ============================================
// INVITE ACCEPTANCE PAGE
// ============================================
pages.invite = {
  init(token) {
    showPage('invite');
    this.render(token);
  },

  render(token) {
    document.getElementById('invite-card-content').innerHTML = `
      <div class="invite-badge">✓ OFFICIAL INVITATION</div>
      <h1>Accept your invitation</h1>
      <p class="invite-desc">You've been invited by the property manager to join Aletheia and manage your tenancy.</p>
      <div class="invite-property-card">
        <div class="invite-property-photo"><div style="width:100%;height:100%;background:var(--gray-200);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--gray-400)">🏢</div></div>
        <div class="invite-property-info">
          <h3>Property Name</h3>
          <div class="address">📍 Lagos, Nigeria</div>
          <div class="invite-unit-pills">
            <div class="invite-unit-pill"><div class="pill-label">UNIT NUMBER</div><div class="pill-value">Unit 4B</div></div>
            <div class="invite-unit-pill"><div class="pill-label">MONTHLY RENT</div><div class="pill-value">₦250,000</div></div>
          </div>
        </div>
      </div>
      <div class="invite-form-card">
        <h3>👤 Complete your profile</h3>
        <form id="invite-accept-form" onsubmit="event.preventDefault();pages.invite.accept('${token}')">
          <div class="form-row" style="margin-bottom:1rem">
            <div class="form-group"><label>Full Name</label><div class="input-with-icon"><span class="input-icon">👤</span><input type="text" class="form-control" id="invite-name" placeholder="e.g. Chidi Okafor" required></div></div>
            <div class="form-group"><label>Email Address</label><div class="input-with-icon"><span class="input-icon">✉</span><input type="email" class="form-control" id="invite-accept-email" placeholder="chidi@example.com" required></div></div>
          </div>
          <div class="form-row" style="margin-bottom:1rem">
            <div class="form-group"><label>Phone Number</label><div class="input-with-icon"><span class="input-icon" style="font-size:0.8rem;left:0.75rem">+234</span><input type="tel" class="form-control" id="invite-accept-phone" placeholder="801 234 5678" style="padding-left:3rem"></div></div>
            <div class="form-group"><label>Create Password</label><div class="input-with-icon"><span class="input-icon">🔒</span><input type="password" class="form-control" id="invite-accept-password" placeholder="••••••••" required></div></div>
          </div>
          <button type="submit" class="btn btn-teal btn-lg w-full">Accept Invite & Create Account →</button>
          <div class="terms">By joining, you agree to Aletheia's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</div>
        </form>
      </div>
      <div class="invite-support">Having trouble? <a href="#">Contact Support</a></div>`;
  },

  async accept(token) {
    const name = document.getElementById('invite-name').value;
    const email = document.getElementById('invite-accept-email').value;
    const phone = document.getElementById('invite-accept-phone').value;
    const password = document.getElementById('invite-accept-password').value;
    try {
      await api.acceptInvite({ token, name, email, phone: phone ? '+234' + phone : '', password });
      window.location.hash = '#/tenant';
    } catch (e) { alert(e.message || 'Failed to accept invite'); }
  }
};

// ============================================
// REGISTER ROUTES & INIT
// ============================================
router.register('', { page: 'landing', init: () => pages.landing.init() });
router.register('/login', { page: 'auth', init: () => { pages.auth.isSignup = false; pages.auth.init(); } });
router.register('/signup', { page: 'auth', init: () => { pages.auth.isSignup = true; pages.auth.init(); } });
router.register('/dashboard', { page: 'app', init: () => pages.dashboard.init() });
router.register('/buildings', { page: 'app', init: () => pages.buildings.init() });
router.register('/buildings/:id', { page: 'app', init: (params) => pages.buildingDetail.init(params.id) });
router.register('/payments', { page: 'app', init: () => pages.payments.init() });
router.register('/maintenance', { page: 'app', init: () => pages.maintenance.init() });
router.register('/documents', { page: 'app', init: () => pages.documents.init() });
router.register('/tenant', { page: 'app', init: () => pages.tenantDashboard.init() });
router.register('/pay-rent', { page: 'app', init: () => pages.payRent.init() });
router.register('/payment-success', { page: 'app', init: (params) => pages.paymentSuccess.init(params) });
router.register('/invite/:token', { page: 'invite', init: (params) => pages.invite.init(params.token) });

// Boot the router
router.init();
