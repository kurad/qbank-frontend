<template>
  <div class="container mt-5 p-4 bg-white rounded shadow-lg">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center">
        <span class="display-6 me-3 text-primary"><i class="bi bi-journal-text"></i></span>
        <h3 class="mb-0 fw-bold">Assessments</h3>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <i class="bi bi-plus-lg me-2"></i>Create Assessment
      </button>
    </div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else>
      <div v-if="assessments.length === 0" class="alert alert-info text-center">No assessments found.</div>
      <div v-else class="row g-4">
        <div v-for="a in assessments" :key="a.id" class="col-12 col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm border-0 rounded-3 hover-shadow">
            <div class="card-header bg-white border-0 pt-3">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title mb-0 text-truncate" :title="a.title || 'Untitled'" style="font-size:smaller;">
                  {{ a.title || 'Untitled' }}
                </h5>
                <span class="badge rounded-pill" :class="getTypeBadgeClass(a.type)">
                  {{ a.type }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-3">
                <div class="text-muted">
                  <i class="bi bi-question-circle me-1"></i>
                  <span>{{ a.question_count || 0 }} Questions</span>
                </div>
                <div class="text-muted">
                  <i class="bi bi-calendar3 me-1"></i>
                  <span>{{ formatDate(a.due_date) }}</span>
                </div>
              </div>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" @click="reviewAssessment(a.id)" title="Review Assessment">
                  <i class="bi bi-eye me-1"></i> Review
                </button>
                <button class="btn btn-sm btn-outline-success flex-grow-1" @click="addQuestions(a.id, a.subject_id, a.grade_level_id)" title="Add Questions">
                  <i class="bi bi-plus-circle me-1"></i> Add
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  :disabled="deletingId === a.id"
                  @click="confirmDelete(a)"
                  title="Delete Assessment"
                >
                  <span v-if="deletingId === a.id" class="spinner-border spinner-border-sm me-1" />
                  <i v-else class="bi bi-trash me-1"></i>
                  {{ deletingId === a.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Create Assessment Modal -->
   <div class="modal fade" :class="{'show d-block': showCreateModal}" tabindex="-1" v-if="showCreateModal">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content shadow-lg border-0 rounded-4">
      <!-- Header -->
      <div class="modal-header bg-primary text-white rounded-top-4">
        <h5 class="modal-title fw-bold">📝 Create New Assessment</h5>
        <button type="button" class="btn-close btn-close-white" @click="showCreateModal = false" aria-label="Close"></button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Title -->
        <div class="mb-3">
          <label class="form-label fw-semibold">Assessment Title</label>
          <input type="text" class="form-control rounded-3" v-model="newAssessment.title" placeholder="Enter assessment title" required>
        </div>

        <!-- Filters -->
        <div class="row g-3">
          <!-- Grade Level -->
          <div class="col-md-4">
            <label class="form-label fw-semibold">Grade Level</label>
            <select class="form-select rounded-3" v-model="selectedGrade">
              <option value="" disabled>Select Grade Level</option>
              <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
                {{ grade.grade_name }}
              </option>
            </select>
          </div>

          <!-- Subject -->
          <div class="col-md-4" >
            <label class="form-label fw-semibold">Subject</label>
            <select class="form-select rounded-3" v-model="selectedSubject">
              <option value="" disabled>Select Subject</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>

          <!-- Topic -->
          <div class="col-md-4">
            <label class="form-label fw-semibold">Topic</label>
            <select class="form-select rounded-3" v-model="newAssessment.topic_id">
              <option value="" disabled>Select Topic</option>
              <option v-for="topic in topics" :key="topic.id" :value="topic.id">
                {{ topic.topic_name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Assessment Settings -->
        <div class="row g-3 mt-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold">Assessment Type</label>
            <select class="form-select rounded-3" v-model="newAssessment.type" required>
              <option value="quiz">Quiz</option>
              <option value="exam">Exam</option>
              <option value="homework">Homework</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Delivery Mode</label>
            <select class="form-select rounded-3" v-model="newAssessment.delivery_mode" required>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        <!-- Online settings -->
        <div v-if="newAssessment.delivery_mode === 'online'" class="mt-3">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Due Date</label>
              <input type="date" class="form-control rounded-3" v-model="newAssessment.due_date" required>
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="newAssessment.is_timed">
                <label class="form-check-label fw-semibold">Timed Assessment</label>
              </div>
            </div>
            <div class="col-md-6" v-if="newAssessment.is_timed">
              <label class="form-label fw-semibold">Time Limit (minutes)</label>
              <input type="number" class="form-control rounded-3" v-model="newAssessment.time_limit" min="1">
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light rounded-bottom-4">
        <button type="button" class="btn btn-outline-secondary rounded-3" @click="showCreateModal = false">Cancel</button>
        <button type="button" class="btn btn-primary rounded-3" @click="createAssessment" :disabled="isCreating">
          <span v-if="isCreating" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ isCreating ? 'Creating...' : 'Create & Add Questions' }}
        </button>
      </div>
    </div>
  </div>
</div>

    <div v-if="showCreateModal" class="modal-backdrop fade show" @click="showCreateModal = false"></div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      selectedSubject: '',
      selectedGrade: '',
      selectedTopic:'',

      assessments: [],
      subjects: [],
      topics: [],
      gradeLevels: [],
      loading: true,
      showCreateModal: false,
      isCreating: false,
      newAssessment: {
        title: '',
        topic_id: '',
        type: 'quiz',
        delivery_mode: 'offline',
        due_date: new Date().toISOString().split('T')[0],
        is_timed: false,
        time_limit: 30
      },
      deletingId: null
    };
  },
  async mounted() {
    await this.fetchAssessments();
    await this.fetchGradeLevels();
  },
  watch: {

    selectedGrade() {
      this.fetchSubjects();
    },
    selectedSubject() {
      this.fetchTopics();
    },
  },
  filters: {
    capitalize: function(value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
  },
  methods: {
    getTypeBadgeClass(type) {
      const typeClasses = {
        'quiz': 'bg-primary',
        'exam': 'bg-danger',
        'homework': 'bg-warning text-dark',
        'default': 'bg-secondary'
      };
      return typeClasses[type] || typeClasses['default'];
    },
   
    async fetchSubjects() {
      if (!this.selectedGrade) return;
      
      try {
        const response = await axios.get(`/grade-levels/${this.selectedGrade}/subjects`);
        this.subjects = response.data;
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    },
    
    async fetchGradeLevels() {
     
      try {
        const response = await axios.get('/grade-levels');
        this.gradeLevels = response.data;
      } catch (error) {
        console.error('Error fetching grade levels:', error);
        this.gradeLevels = [];
      }
    },
     async fetchTopics() {
      if (!this.selectedGrade || !this.selectedSubject) return;
      try { const res = await axios.get(`/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/units`); this.topics = res.data || []; this.selectedTopic = ''; } catch { this.topics = []; }
    },
    
    async createAssessment() {
      
      this.isCreating = true;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.post('/assessments', this.newAssessment, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Redirect to select questions page with the new assessment id
        this.$router.push({
          path: `/select-questions/${response.data.assessment.id}`
        });
        
      } catch (error) {
        console.error('Error creating assessment:', error);
        alert('Failed to create assessment. Please try again.');
      } finally {
        this.isCreating = false;
      }
    },
    
    async fetchAssessments() {
      this.loading = true;
      const token = localStorage.getItem('auth_token');
      try {
        console.log('Using token:', token);
        const res = await axios.get('/assessments/created', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.assessments = res.data.created_assessments || [];
      } catch (err) {
        if (err.response && err.response.status === 401) {
          alert('Session expired or unauthorized. Please log in again.');
          this.$router.push({ name: 'Login' });
        } else {
          alert('Failed to load assessments.');
        }
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', // or 'long' for full month name
      day: '2-digit'
  }).format(date);
},
    assignAssessment(id) {
      // Implement assignment logic or route
      this.$router.push({ name: 'AssignAssessment', params: { id } });
    },
    printAssessment(id) {
      // Implement print logic or route
      this.$router.push({ name: 'PrintAssessment', params: { id } });
    },
    reviewAssessment(id) {
      this.$router.push({ name: 'ReviewAssessment', params: { id } });
    },
    
    addQuestions(assessmentId, subjectId, gradeLevelId) {
      // Navigate to SelectQuestions with assessment ID and subject/grade info
      this.$router.push({
        name: 'SelectQuestions',
        params: { assessmentId: assessmentId },
        query: { 
          subject_id: subjectId,
          grade_level_id: gradeLevelId 
        }
      });
    },
    async confirmDelete(a) {
      const proceed = confirm(`Delete assessment "${a.title || 'Untitled'}"? This cannot be undone.`);
      if (!proceed) return;
      await this.deleteAssessment(a.id);
    },
    async deleteAssessment(id) {
      if (!id) return;
      this.deletingId = id;
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.delete(`/assessments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const msg = res?.data?.message || res?.data?.data?.message || 'Assessment deleted successfully';
        if (this.$showToast) this.$showToast(msg, 'success');
        await this.fetchAssessments();
      } catch (err) {
        const backend = err?.response?.data;
        const msg = backend?.message || backend?.error || 'Failed to delete assessment';
        if (this.$showToast) this.$showToast(msg, 'danger');
        console.error('Delete assessment failed:', err);
      } finally {
        this.deletingId = null;
      }
    }
  },
};
</script>

<style scoped>
.hover-shadow {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.hover-shadow:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1) !important;
}

.card {
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem 1.25rem;
}

.card-title {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  max-width: 70%;
}

.badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.35em 0.65em;
  letter-spacing: 0.5px;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 0.5rem;
}

.text-muted {
  font-size: 0.85rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card {
    margin-bottom: 1rem;
  }
}

.container {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2.5em 2em 2em 2em;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* Ensure the table takes remaining space and is scrollable */
table {
  width: 100%;
  table-layout: fixed;
}

tbody {
  display: block;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

thead, tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}
</style>
