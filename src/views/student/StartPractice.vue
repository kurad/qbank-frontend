<template>
  <div class="content-wrapper">
    <h2 class="content-title">Start Practice</h2>
    <form @submit.prevent="startPractice" class="practice-form">
      <div class="row g-3">
        <!-- Grade Level Selection -->
        <div class="col-md-4">
          <div class="form-group">
            <label for="grade" class="form-label">Grade Level</label>
            <select id="grade" v-model="selectedGrade" class="form-select" required>
              <option value="" disabled>Select grade</option>
              <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
                {{ grade.grade_name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Subject Selection -->
        <div class="col-md-4" v-if="subjects.length">
          <div class="form-group">
            <label for="subject" class="form-label">Subject</label>
            <select id="subject" v-model="selectedSubject" class="form-select" required>
              <option value="" disabled>Select subject</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Topic Selection -->
        <div class="col-md-4" v-if="topics.length">
          <div class="form-group">
            <label for="topic" class="form-label">Topic</label>
            <select id="topic" v-model="topicId" class="form-select" required>
              <option value="" disabled>Select topic</option>
              <option v-for="topic in topics" :key="topic.id" :value="topic.id">
                {{ topic.topic_name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Question Count Display -->
      <div v-if="questionCount !== null" class="mt-3 question-count">
        <strong>Total Questions available:</strong> {{ questionCount }}
      </div>

      <!-- Practice Mode Selection -->
      <div class="row g-3 mt-4" v-if="questionCount > 20">
        <div class="col-md-4">
          <label class="form-label">Practice Mode</label>
          <select v-model="mode" class="form-select" required>
            <option value="all">All Questions</option>
            <option value="custom">Custom Number</option>
            <option value="unpracticed">Unpracticed Only</option>
          </select>
        </div>

        <!-- Limit Input -->
        <div class="col-md-4" v-if="mode === 'custom' || mode === 'unpracticed'">
          <label class="form-label">Number of Questions</label>
          <input type="number" v-model.number="limit" min="1" class="form-control" required />
        </div>
      </div>

      <button type="submit" class="btn btn-primary mt-4" :disabled="loading || !topicId" v-if="questionCount > 0">
        {{ loading ? 'Starting...' : 'Start Practice' }}
      </button>
    </form>

    <div v-if="message" :class="{'alert alert-success': success, 'alert alert-danger': !success}" class="mt-3">
      {{ message }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'StartPractice',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      topicId: '',
      gradeLevels: [],
      subjects: [],
      topics: [],
      selectedGrade: null,
      selectedSubject: null,
      mode: 'all',
      limit: null,
      message: '',
      success: false,
      loading: false,
      questionCount: null,
    };
  },
  methods: {
    async fetchGradeLevels() {
      try {
        const res = await axios.get('/grade-levels');
        this.gradeLevels = res.data;
        // Set default selected grade if available
        if (this.gradeLevels.length > 0) {
          this.selectedGrade = this.gradeLevels[0].id;
          this.fetchSubjects();
        }
      } catch {
        this.message = 'Failed to load grade levels.';
      }
    },
    async fetchSubjects() {
      if (!this.selectedGrade) return;
      try {
        const res = await axios.get(`/grade-levels/${this.selectedGrade}/subjects`);
        this.subjects = res.data;
        this.topics = [];
        this.selectedSubject = null;
        this.topicId = '';
      } catch {
        this.message = 'Failed to load subjects.';
      }
    },
    async fetchTopics() {
      if (!this.selectedGrade || !this.selectedSubject) return;
      try {
        const res = await axios.get(`/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/units`);
        this.topics = res.data || [];
        this.topicId = ''; // Reset topic selection when subject changes
        this.questionCount = null; // Reset question count when subject changes
      } catch (error) {
        console.error('Error fetching topics:', error);
        this.message = 'Failed to load topics for the selected subject and grade.';
        this.topics = [];
        this.topicId = ''; // Reset topic selection on error
        this.questionCount = null; // Reset question count on error
      }
    },
    async fetchQuestionCount(topicId) {
      try {
        const res = await axios.get(`/topics/${topicId}/question-count`);
        this.questionCount = res.data.count;
      } catch {
        this.questionCount = 0;
      }
    },
    async startPractice() {
      this.loading = true;
      this.message = '';
      try {
        const token = localStorage.getItem('auth_token');
        const payload = {
          topic_id: this.topicId,
          mode: this.mode,
        };
        if (this.mode === 'custom' || this.mode === 'unpracticed') {
          payload.limit = this.limit;
        }
        const res = await axios.post('/assessments/practice-for-topic', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.success = true;
        this.message = res.data.message;
        this.router.push({ name: 'StudentPracticeList' });
      } catch (err) {
        this.success = false;
        this.message = err.response?.data?.message || 'Error starting practice';
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchGradeLevels();
  },
  watch: {
    selectedGrade() {
      this.fetchSubjects();
    },
    selectedSubject() {
      this.fetchTopics();
    },
    topicId(newId) {
      if (newId) {
        this.fetchQuestionCount(newId);
      } else {
        this.questionCount = null;
      }
    },
  },
};
</script>

<style scoped>
.content-wrapper {
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.practice-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.question-count {
  font-weight: bold;
  color: #333;
}

.btn-primary {
  background-color: #007bff;
  border: none;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style>