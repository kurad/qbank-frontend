<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold text-primary mb-0">Users</h3>
      <button class="btn btn-primary btn-sm" @click="openCreate">Add User</button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 align-items-center mb-3">
          <div class="col-auto">
            <input v-model.trim="query" @keyup.enter="fetchUsers(1)" class="form-control form-control-sm" placeholder="Search users..." />
          </div>
          <div class="col-auto">
            <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="fetchUsers(1)">
              <span v-if="loading" class="spinner-border spinner-border-sm me-1" /> Search
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>School</th>
                <th>Status</th>
                <th style="width: 200px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-muted">Loading...</td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="text-muted">No users found.</td>
              </tr>
              <tr v-else v-for="u in users" :key="u.id">
                <td class="fw-semibold">{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td class="text-capitalize">{{ u.role || '-' }}</td>
                <td>{{ schoolName(u.school_id) }}</td>
                <td>
                  <span class="badge" :class="(u.status || 'active') === 'active' ? 'bg-success' : 'bg-secondary'">{{ u.status || 'active' }}</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" @click="openEdit(u)">Edit</button>
                    <button class="btn" :class="(u.status || 'active') === 'active' ? 'btn-outline-warning' : 'btn-outline-success'" :disabled="togglingId === u.id" @click="toggleStatus(u)">
                      <span v-if="togglingId === u.id" class="spinner-border spinner-border-sm me-1" />
                      {{ (u.status || 'active') === 'active' ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted small">Page {{ page }} of {{ lastPage }} · Total {{ total }}</div>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" :disabled="loading || page <= 1" @click="fetchUsers(page-1)">Prev</button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="loading || page >= lastPage" @click="fetchUsers(page+1)">Next</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,.25)" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.id ? 'Edit User' : 'Add User' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
            <div class="mb-2">
              <label class="form-label">Name</label>
              <input v-model.trim="form.name" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Email</label>
              <input v-model.trim="form.email" type="email" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Password</label>
              <input v-model.trim="form.password" type="password" class="form-control" :placeholder="form.id ? '(leave blank to keep current)' : ''" />
            </div>
            <div class="mb-2">
              <label class="form-label">Role</label>
              <select v-model="form.role" class="form-select">
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">School</label>
              <select v-model="form.school_id" class="form-select">
                <option :value="''">Unassigned</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.school_name }}</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" :disabled="saving" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" :disabled="saving" @click="submit">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" />
              {{ form.id ? 'Save Changes' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { userService } from '@/services/userService';
import { schoolService } from '@/services/schoolService';

export default {
  name: 'UserManagement',
  data() {
    return {
      loading: false,
      error: '',
      users: [],
      page: 1,
      per_page: 10,
      lastPage: 1,
      total: 0,
      query: '',
      togglingId: null,
      schools: [],
      showModal: false,
      form: { id: null, name: '', email: '', password: '', role: 'teacher', school_id: '', status: 'active' },
      saving: false,
      formError: '',
    };
  },
  created() {
    this.fetchUsers(1);
    this.fetchSchools();
  },
  methods: {
    schoolName(id) {
      const s = this.schools.find(x => String(x.id) === String(id));
      return s ? s.school_name : '-';
    },
    async fetchSchools() {
      try {
        const { data } = await schoolService.list({ page: 1, per_page: 1000, search: '' });
        this.schools = data;
      } catch (_) {
        this.schools = [];
      }
    },
    async fetchUsers(p = 1) {
      this.loading = true; this.error = '';
      try {
        const { data, pagination } = await userService.list({ page: p, per_page: this.per_page, search: this.query });
        this.users = data;
        this.page = Number(pagination.current_page || p || 1);
        this.lastPage = Number(pagination.last_page || 1);
        this.per_page = Number(pagination.per_page || this.per_page);
        this.total = Number(pagination.total || data.length || 0);
      } catch (e) {
        this.error = 'Failed to fetch users';
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.form = { id: null, name: '', email: '', password: '', role: 'teacher', school_id: '', status: 'active' };
      this.formError = '';
      this.showModal = true;
    },
    openEdit(u) {
      this.form = { id: u.id, name: u.name || '', email: u.email || '', password: '', role: u.role || 'teacher', school_id: u.school_id || '', status: u.status || 'active' };
      this.formError = '';
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async submit() {
      this.saving = true; this.formError = '';
      try {
        if (!this.form.name) { this.formError = 'Name is required'; this.saving = false; return; }
        if (!this.form.email) { this.formError = 'Email is required'; this.saving = false; return; }
        if (!this.form.id && !this.form.password) { this.formError = 'Password is required'; this.saving = false; return; }
        const payload = { name: this.form.name, email: this.form.email, role: this.form.role, school_id: this.form.school_id || null, status: this.form.status };
        if (this.form.password) payload.password = this.form.password;
        if (this.form.id) await userService.update(this.form.id, payload); else await userService.create(payload);
        this.showModal = false;
        this.fetchUsers(this.page);
      } catch (e) {
        this.formError = e?.response?.data?.message || 'Failed to save user';
      } finally {
        this.saving = false;
      }
    },
    async toggleStatus(u) {
      this.togglingId = u.id;
      try {
        const next = (u.status || 'active') === 'active' ? 'inactive' : 'active';
        await userService.setStatus(u.id, next);
        u.status = next;
      } catch (e) {
      } finally {
        this.togglingId = null;
      }
    },
  },
};
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
</style>