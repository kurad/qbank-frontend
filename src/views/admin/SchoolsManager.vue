<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold text-primary mb-0">Schools</h3>
      <button class="btn btn-primary btn-sm" @click="openCreate">Add School</button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="row g-2 align-items-center mb-3">
          <div class="col-auto">
            <input v-model.trim="query" @keyup.enter="fetchSchools(1)" class="form-control form-control-sm" placeholder="Search schools..." />
          </div>
          <div class="col-auto">
            <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="fetchSchools(1)">
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
                <th>District</th>
                <th>Email</th>
                <th>Logo</th>
                <th>Status</th>
                <th style="width: 160px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-muted">Loading...</td>
              </tr>
              <tr v-else-if="schools.length === 0">
                <td colspan="6" class="text-muted">No schools found.</td>
              </tr>
              <tr v-else v-for="s in schools" :key="s.id">
                <td class="fw-semibold">{{ s.school_name }}</td>
                <td>{{ s.district || '-' }}</td>
                <td>{{ s.email || '-' }}</td>
                <td>
                  <img v-if="s.logo_url || s.logo_path" :src="resolveLogoUrl(s)" alt="logo" style="height:28px; width:auto; object-fit:contain" />
                </td>
                <td>
                  <span class="badge" :class="s.status === 'active' ? 'bg-success' : 'bg-secondary'">{{ s.status || 'inactive' }}</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" @click="openEdit(s)">Edit</button>
                    <button class="btn" :class="s.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'" :disabled="togglingId === s.id" @click="toggleStatus(s)">
                      <span v-if="togglingId === s.id" class="spinner-border spinner-border-sm me-1" />
                      {{ s.status === 'active' ? 'Deactivate' : 'Activate' }}
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
            <button class="btn btn-sm btn-outline-secondary" :disabled="loading || page <= 1" @click="fetchSchools(page-1)">Prev</button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="loading || page >= lastPage" @click="fetchSchools(page+1)">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,.25)" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.id ? 'Edit School' : 'Add School' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
            <div class="mb-2">
              <label class="form-label">School Name</label>
              <input v-model.trim="form.school_name" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">District</label>
              <input v-model.trim="form.district" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Email</label>
              <input v-model.trim="form.email" type="email" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Logo</label>
              <input ref="logoInput" type="file" accept="image/*" class="form-control" @change="onLogoChange" />
              <div v-if="logoPreview" class="mt-2">
                <img :src="logoPreview" alt="preview" style="height:50px; width:auto; object-fit:contain" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" :disabled="saving" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" :disabled="saving" @click="submit">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" />
              {{ form.id ? 'Save Changes' : 'Create School' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { schoolService } from '@/services/schoolService';

export default {
  name: 'SchoolsManager',
  data() {
    return {
      loading: false,
      error: '',
      schools: [],
      page: 1,
      per_page: 10,
      lastPage: 1,
      total: 0,
      query: '',
      togglingId: null,
      // modal
      showModal: false,
      form: { id: null, school_name: '', district: '', email: '', status: 'active', logo: null },
      logoPreview: '',
      saving: false,
      formError: '',
    };
  },
  created() {
    this.fetchSchools(1);
  },
  methods: {
    resolveLogoUrl(s) {
      // attempt to resolve via public storage path if only path provided
      if (s.logo_url) return s.logo_url;
      if (s.logo_path) return `/storage/${s.logo_path}`;
      return '';
    },
    async fetchSchools(p = 1) {
      this.loading = true; this.error = '';
      try {
        const { data, pagination } = await schoolService.list({ page: p, per_page: this.per_page, search: this.query });
        this.schools = data;
        this.page = Number(pagination.current_page || p || 1);
        this.lastPage = Number(pagination.last_page || 1);
        this.per_page = Number(pagination.per_page || this.per_page);
        this.total = Number(pagination.total || data.length || 0);
      } catch (e) {
        this.error = 'Failed to fetch schools';
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.form = { id: null, school_name: '', district: '', email: '', status: 'active', logo: null };
      this.logoPreview = '';
      this.formError = '';
      this.showModal = true;
      this.$nextTick(() => this.$refs.logoInput && (this.$refs.logoInput.value = ''));
    },
    openEdit(s) {
      this.form = { id: s.id, school_name: s.school_name || '', district: s.district || '', email: s.email || '', status: s.status || 'inactive', logo: null };
      this.logoPreview = this.resolveLogoUrl(s) || '';
      this.formError = '';
      this.showModal = true;
      this.$nextTick(() => this.$refs.logoInput && (this.$refs.logoInput.value = ''));
    },
    closeModal() {
      this.showModal = false;
    },
    onLogoChange(e) {
      const f = e.target.files && e.target.files[0];
      this.form.logo = f || null;
      this.logoPreview = f ? URL.createObjectURL(f) : '';
    },
    async submit() {
      this.saving = true; this.formError = '';
      try {
        if (!this.form.school_name) {
          this.formError = 'School name is required';
          this.saving = false;
          return;
        }
        if (this.form.id) {
          await schoolService.update(this.form.id, {
            school_name: this.form.school_name,
            district: this.form.district,
            email: this.form.email,
            status: this.form.status,
            logo: this.form.logo,
          });
        } else {
          await schoolService.create({
            school_name: this.form.school_name,
            district: this.form.district,
            email: this.form.email,
            status: this.form.status,
            logo: this.form.logo,
          });
        }
        this.showModal = false;
        this.fetchSchools(this.page);
      } catch (e) {
        this.formError = e?.response?.data?.message || 'Failed to save school';
      } finally {
        this.saving = false;
      }
    },
    async toggleStatus(s) {
      this.togglingId = s.id;
      try {
        const next = s.status === 'active' ? 'inactive' : 'active';
        await schoolService.setStatus(s.id, next);
        s.status = next;
      } catch (e) {
        // ignore
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
