<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold">Subjects</h3>
      <button class="btn btn-primary" @click="showModal = true">
        <i class="bi bi-plus-lg me-1"></i> New Subject
      </button>
    </div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else>
      <div v-if="subjects.length === 0" class="alert alert-info text-center">No subjects found.</div>
      <table v-else class="table table-sm table-hover align-middle">
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>{{ subject.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Modal for creating a new subject -->
    <div class="modal fade" :class="{'show d-block': showModal}" tabindex="-1" v-if="showModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Subject</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Subject Name</label>
              <input type="text" class="form-control" v-model="newSubjectName" placeholder="Enter subject name" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="createSubject" :disabled="isCreating || !newSubjectName">
              <span v-if="isCreating" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ isCreating ? 'Creating...' : 'Create Subject' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      subjects: [],
      loading: true,
      showModal: false,
      newSubjectName: '',
      isCreating: false
    };
  },
  async mounted() {
    await this.fetchSubjects();
  },
  methods: {
    async fetchSubjects() {
      this.loading = true;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.subjects = response.data;
      } catch (error) {
        console.error('Error fetching subjects:', error);
        this.subjects = [];
      } finally {
        this.loading = false;
      }
    },
    async createSubject() {
      if (!this.newSubjectName) return;
      this.isCreating = true;
      try {
        const token = localStorage.getItem('auth_token');
        await axios.post('/subjects', { name: this.newSubjectName }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.newSubjectName = '';
        this.showModal = false;
        await this.fetchSubjects();
      } catch (error) {
        console.error('Error creating subject:', error);
        alert('Failed to create subject.');
      } finally {
        this.isCreating = false;
      }
    },
    closeModal() {
      this.showModal = false;
      this.newSubjectName = '';
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
</style>