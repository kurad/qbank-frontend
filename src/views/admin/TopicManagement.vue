<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold">Topics / Units</h3>
      <button class="btn btn-primary" @click="showModal = true">
        <i class="bi bi-plus-lg me-1"></i> New Topic/Unit
      </button>
    </div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else>
      <div v-if="topics.length === 0" class="alert alert-info text-center">No topics found.</div>
      <table v-else class="table table-sm table-hover align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Subject</th>
            <th>Grade Level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="topic in topics" :key="topic.id">
            <td>{{ topic.topic_name }}</td>
            <td>{{ topic.grade_subject?.subject?.name || '-' }}</td>
            <td>{{ topic.grade_subject?.grade_level?.grade_name || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Modal for creating a new topic -->
    <div class="modal fade" :class="{'show d-block': showModal}" tabindex="-1" v-if="showModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Topic</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Topic Name</label>
              <input type="text" class="form-control" v-model="newTopic.topic_name" placeholder="Enter topic name" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Subject</label>
              <select class="form-select" v-model="newTopic.subject_id" required>
                <option value="" disabled>Select Subject</option>
                <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                  {{ subject.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Grade Level</label>
              <select class="form-select" v-model="newTopic.grade_level_id" required>
                <option value="" disabled>Select Grade Level</option>
                <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
                  {{ grade.grade_name }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="createTopic" :disabled="isCreating || !canCreate">
              <span v-if="isCreating" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ isCreating ? 'Creating...' : 'Create Topic' }}
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
      topics: [],
      subjects: [],
      gradeLevels: [],
      loading: true,
      showModal: false,
      isCreating: false,
      newTopic: {
        topic_name: '',
        grade_level_id: '',
        subject_id: ''
      }
    };
  },
  computed: {
    canCreate() {
      return this.newTopic.topic_name && this.newTopic.subject_id &&  this.newTopic.grade_level_id;
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchTopics(),
      this.fetchSubjects(),
      this.fetchGradeLevels()
    ]);
  },
  methods: {
    async fetchTopics() {
      this.loading = true;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/topics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.topics = response.data;
      } catch (error) {
        console.error('Error fetching topics:', error);
        this.topics = [];
      } finally {
        this.loading = false;
      }
    },
    async fetchSubjects() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.subjects = response.data;
      } catch (error) {
        console.error('Error fetching subjects:', error);
        this.subjects = [];
      }
    },
    async fetchGradeLevels() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/grade-levels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.gradeLevels = response.data;
      } catch (error) {
        console.error('Error fetching grade levels:', error);
        this.gradeLevels = [];
      }
    },
    async createTopic() {
  if (!this.canCreate) return;
  this.isCreating = true;
  
  try {
    const token = localStorage.getItem('auth_token');
    
    
    // Now create the topic with the grade_subject_id
    await axios.post('/topics', {
      topic_name: this.newTopic.topic_name,
      grade_level_id: this.newTopic.grade_level_id,
      subject_id: this.newTopic.subject_id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Reset the form and close the modal
    this.newTopic = { topic_name: '', subject_id: '', grade_level_id: '' };
    this.showModal = false;
    await this.fetchTopics();
  } catch (error) {
    console.error('Error creating topic:', error);
    alert('Failed to create topic.');
  } finally {
    this.isCreating = false;
  }
},
    closeModal() {
      this.showModal = false;
      this.newTopic = { topic_name: '', subject_id: '', grade_level_id: '' };
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 700px;
}
.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
</style>
