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
      <table v-else class="table table-hover align-middle">
        <thead>
          <tr>
            <th>Title</th>
            <!-- <th>Topic</th> -->
            <th>Type</th>
            <th>Count</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assessments" :key="a.id">
            <td>{{ a.title || 'Untitled' }}</td>
            <!-- <td>{{ a.subject.name }}</td> -->
            <td>{{ a.type }}</td>
            <td>{{ a.question_count }}</td>
            <td>{{ formatDate(a.due_date) }}</td>
            <td class="text-nowrap">
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" @click="reviewAssessment(a.id)" title="Review Assessment">
                  <i class="bi bi-eye"></i> Review
                </button>
                <button class="btn btn-sm btn-outline-success" @click="addQuestions(a.id, a.subject_id, a.grade_level_id)" title="Add Questions">
                  <i class="bi bi-plus-circle"></i> Add Questions
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
      }
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
  methods: {
   
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
      try { const res = await axios.get(`/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/topics`); this.topics = res.data || []; this.selectedTopic = ''; } catch { this.topics = []; }
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
        params: { id: assessmentId },
        query: { 
          subject_id: subjectId,
          grade_level_id: gradeLevelId 
        }
      });
    },
  },
};
</script>

<style scoped>
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
