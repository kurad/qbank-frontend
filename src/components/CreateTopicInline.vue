<template>
  <div class="create-topic-modal">
    <button
      type="button"
      class="btn btn-outline-success btn-sm"
      @click="openModal"
      :disabled="disabled"
      :title="disabled ? 'Select subject first' : 'Create a new topic'"
    >
      <span class="fw-bold">+</span> New Topic
    </button>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="closeModal"></div>
    <div v-if="showModal" class="modal-container" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Create New Topic</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Subject</label>
            <select v-model="selectedSubjectId" class="form-select">
              <option value="" disabled>Select subject</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Grade Level</label>
            <select v-model="selectedGradeId" class="form-select">
              <option value="" disabled>Select grade level</option>
              <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
                {{ grade.grade_name }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Topic Name</label>
            <input 
              v-model="topicName" 
              class="form-control" 
              placeholder="Enter topic name"
              @keyup.enter="submit"
            />
          </div>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="submit"
            :disabled="!isFormValid"
          >
            Create Topic
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CreateTopicInline',
  props: {
    subjectId: { type: [String, Number], required: true },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {
      showModal: false,
      topicName: '',
      selectedSubjectId: '',
      selectedGradeId: '',
      gradeLevels: [],
      subjects: [],
      error: '',
    };
  },
  computed: {
    isFormValid() {
      return this.topicName && this.selectedGradeId && this.selectedSubjectId;
    }
  },
  methods: {
    async fetchGradeLevels() {
      try {
        const response = await axios.get('http://localhost:8000/api/grade-levels');
        this.gradeLevels = response.data;
      } catch (e) {
        this.error = 'Failed to load grade levels.';
      }
    },
    async fetchSubjects() {
      try {
        const response = await axios.get('http://localhost:8000/api/subjects');
        this.subjects = response.data;
      } catch (e) {
        this.error = 'Failed to load subjects.';
      }
    },
    openModal() {
      if (this.disabled) return;
      this.showModal = true;
      this.fetchGradeLevels();
      this.fetchSubjects();
    },
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    resetForm() {
      this.topicName = '';
      this.selectedGradeId = '';
      this.selectedSubjectId = '';
      this.error = '';
    },
    async submit() {
      this.error = '';
      if (!this.isFormValid) {
        if (!this.selectedSubjectId) {
          this.error = 'Please select a subject.';
          return;
        }
        if (!this.selectedGradeId) {
          this.error = 'Please select a grade level.';
          return;
        }
        if (!this.topicName) {
          this.error = 'Please enter a topic name.';
          return;
        }
        this.error = 'Please fill in all required fields.';
        return;
      }
      try {
        // Send all fields in one request to match backend
        const payload = {
          subject_id: this.selectedSubjectId,
          topic_name: this.topicName,
          grade_level_id: this.selectedGradeId,
        };
        const res = await axios.post('http://localhost:8000/api/topics', payload);
        const topic = res.data.topic || res.data;
        this.$emit('created', topic);
        this.closeModal();
      } catch (e) {
        if (e.response?.data?.errors?.grade_level_id) {
          this.error = e.response.data.errors.grade_level_id[0];
        } else if (e.response?.data?.errors?.topic_name) {
          this.error = e.response.data.errors.topic_name[0];
        } else if (e.response?.data?.errors?.subject_id) {
          this.error = e.response.data.errors.subject_id[0];
        } else {
          this.error = e.response?.data?.message || 'Failed to create topic.';
        }
      }
    },
  },
};
</script>

<style scoped>
.create-topic-modal {
  display: inline-block;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1055;
  width: 100%;
  max-width: 500px;
  pointer-events: auto;
}

.modal-content {
  position: relative;
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
}

.btn-close {
  background: transparent;
  border: 0;
  font-size: 1.5rem;
  padding: 0.5rem;
  margin: -0.5rem -0.5rem -0.5rem auto;
  opacity: 0.5;
  cursor: pointer;
}

.btn-close:hover {
  opacity: 0.75;
}
</style>
