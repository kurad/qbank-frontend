<template>
  <div class="container-fluid p-0 bg-light">
    <div class="row g-0">
      <div class="col-12 col-xxl-10 mx-auto">
        <div class="card border-0 shadow-sm m-3">
          <div class="card-header bg-white border-0 pt-3 pb-2 px-4">
            <div class="d-flex align-items-center">
              <div class="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                <i class="bi bi-journal-plus fs-4 text-primary"></i>
              </div>
              <div>
                <h1 class="h4 mb-0 fw-bold">Create New Assessment</h1>
                <p class="text-muted small mb-0">Fill in the details below to create a new assessment</p>
              </div>
            </div>
          </div>
          
          <div class="card-body p-4">
            <form @submit.prevent="submitAssessment" class="needs-validation" novalidate>
              <div class="row g-4">
                <div class="col-md-12">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Assessment Title</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-card-heading text-muted"></i>
                      </span>
                      <input 
                        type="text" 
                        class="form-control border-start-0 py-2" 
                        v-model="form.title" 
                        required 
                        placeholder="Enter assessment title"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Assessment Type</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-tag text-muted"></i>
                      </span>
                      <select class="form-select border-start-0 py-2" v-model="form.type" required>
                        <option value="" disabled selected>Select type</option>
                        <option value="quiz">Quiz</option>
                        <option value="homework">Homework</option>
                        <option value="exam">Exam</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Subject</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-book text-muted"></i>
                      </span>
                      <select class="form-select border-start-0 py-2" v-model="form.subject_id" required>
                        <option value="" disabled selected>Select subject</option>
                        <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                          {{ subject.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Grade Level</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-mortarboard text-muted"></i>
                      </span>
                      <select class="form-select border-start-0 py-2" v-model="form.grade_level_id" required>
                        <option value="" disabled selected>Select grade level</option>
                        <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
                          {{ grade.grade_name }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Due Date</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-calendar3 text-muted"></i>
                      </span>
                      <input 
                        type="date" 
                        class="form-control border-start-0 py-2" 
                        v-model="form.due_date" 
                        required
                      />
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Delivery Mode</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-wifi text-muted"></i>
                      </span>
                      <select class="form-select border-start-0 py-2" v-model="form.delivery_mode" required>
                        <option value="" disabled selected>Select mode</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="col-12">
                  <div class="form-check form-switch d-flex align-items-center p-0 mb-3">
                    <input 
                      type="checkbox" 
                      class="form-check-input m-0 me-2" 
                      style="width: 2.5em; height: 1.25em;"
                      v-model="form.is_timed" 
                      id="timedSwitch" 
                    />
                    <label class="form-check-label fw-semibold small" for="timedSwitch">
                      Timed Assessment
                    </label>
                  </div>
                </div>
                
                <div class="col-md-6" v-if="form.is_timed">
                  <div class="mb-3">
                    <label class="form-label fw-semibold text-muted text-uppercase small mb-1">Time Limit (minutes)</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-end-0 px-3">
                        <i class="bi bi-clock text-muted"></i>
                      </span>
                      <input 
                        type="number" 
                        class="form-control border-start-0 py-2" 
                        v-model="form.time_limit" 
                        min="1" 
                        placeholder="e.g. 30" 
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between align-items-center pt-3 mt-2">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary px-3 py-1" 
                  @click="$router.go(-1)"
                >
                  <i class="bi bi-arrow-left me-1"></i>
                  <span class="small">Cancel</span>
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary px-4 py-1" 
                  :disabled="isSubmitting"
                  :class="{'opacity-75': isSubmitting}"
                >
                  <span v-if="isSubmitting" 
                    class="spinner-border spinner-border-sm me-1" 
                    role="status" 
                    aria-hidden="true">
                  </span>
                  <i v-else class="bi bi-plus-circle me-1"></i>
                  <span class="small">
                    {{ isSubmitting ? 'Creating...' : 'Create' }}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      form: {
        title: '',
        type: '',
        subject_id: '',
        grade_level: '',
        instructions: '',
        is_timed: false,
        time_limit: null,
        due_date: '',
      },
      subjects: [],
      gradeLevels: Array.from({length: 12}, (_, i) => `Grade ${i + 1}`),
      isSubmitting: false,
      message: '',
      success: false,
    };
  },
  
  mounted() {
    this.fetchSubjects();
    // Add smooth transition when component mounts
    document.body.style.transition = 'background-color 0.3s ease';
    // Add a class to the body for this specific page
    document.body.classList.add('bg-light');
  },
  watch: {
    'form.subject_id'(val) {
      this.form.grade_level_id = '';
      if (val) this.fetchGradeLevels(val);
      else this.gradeLevels = [];
    }
  },
  methods: {
    async fetchSubjects() {
      const res = await axios.get('/subjects');
      this.subjects = res.data;
    },
    async fetchGradeLevels(subjectId) {
      const res = await axios.get(`/subjects/${subjectId}/grades`);
      this.gradeLevels = res.data;
    },
    async submitAssessment() {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await axios.post('/assessments', this.form, { headers: { Authorization: `Bearer ${token}` } });
        this.success = true;
        this.message = 'Assessment created successfully!';
        // Redirect to select questions page with only assessment id
        this.$router.push({
          path: `/select-questions/${res.data.assessment.id}`
        });
      } catch (err) {
        this.success = false;
        this.message = err.response?.data?.message || 'Failed to create assessment';
      }
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 700px;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2.5em 2em 2em 2em;
  margin: 2em auto;
}
.animated-fade {
  animation: fadeInUp 0.7s cubic-bezier(.39,.575,.56,1) both;
}
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}
.btn-gradient {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-gradient:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}
.form-label {
  color: #374151;
}
.form-control-lg, .form-select-lg {
  font-size: 1.1em;
  padding: 0.75em 1em;
  border-radius: 0.7em;
}
</style>
