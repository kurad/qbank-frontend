<template>
  <div class="assessment-container">
    <div class="assessment-header">
      <h1 class="assessment-title">Create Assessment</h1>
      <p class="assessment-subtitle">Create and assign assessments to your students</p>
    </div>
    
    <div class="assessment-card">
      <form @submit.prevent="handleSubmit" class="assessment-form">
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <i class="fas fa-paper-plane me-2"></i>
            Assign Assessment
          </button>
          <button type="button" class="btn btn-secondary" @click="$router.push('/teacher/assessments')">
            <i class="fas fa-times me-2"></i>
            Cancel
          </button>
        </div>
        <!-- Main Details Section -->
        <div class="form-section">
          <div class="form-row">
            <div class="form-group flex-grow-2">
              <label for="title" class="form-label">Assessment Title</label>
              <input 
                id="title" 
                v-model="title" 
                class="form-control form-control-lg" 
                required 
                placeholder="Enter a title for your assessment"
              />
            </div>
            <div class="form-group">
              <label for="type" class="form-label">Type</label>
              <select id="type" v-model="type" class="form-select" required>
                <option value="" disabled>Select type</option>
                <option value="quiz">Quiz</option>
                <option value="practice">Practice</option>
                <option value="homework">Homework</option>
                <option value="exam">Exam</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Subject and Topic Section -->
        <div class="form-section">
          <div class="form-row">
            <div class="form-group">
              <label for="subject" class="form-label">Subject</label>
              <select id="subject" v-model="subjectId" class="form-select" required @change="onSubjectChange">
                <option value="" disabled>Select subject</option>
                <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="topic" class="form-label">Topic</label>
              <div class="topic-select-group">
                <select id="topic" v-model="selectedTopicId" class="form-select">
                  <option value="" disabled>Select topic</option>
                  <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.topic_name }}</option>
                </select>
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  @click="loadQuestionsForTopic" 
                  :disabled="!selectedTopicId || loading"
                >
                  <i class="fas fa-sync-alt me-2"></i>
                  Load Questions
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Grade and Student Section -->
        <div class="form-section">
          <div class="form-row">
            <div class="form-group">
              <label for="grade" class="form-label">Grade Level</label>
              <select id="grade" v-model="gradeLevelId" class="form-select">
                <option value="" disabled>Select grade (optional)</option>
                <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.grade_name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Students</label>
              <div class="student-select-wrapper">
                <div v-if="students.length === 0" class="no-students-message">
                  No students available for selected grade
                </div>
                <template v-else>
                  <div class="select-all-checkbox">
                    <input 
                      type="checkbox" 
                      id="selectAllStudents" 
                      v-model="selectAllStudents"
                      @change="handleSelectAllStudents"
                    >
                    <label for="selectAllStudents">Select all students</label>
                  </div>
                  <select 
                    class="form-select" 
                  v-model="selectedStudentIds"
                  multiple
                  :disabled="selectAllStudents"
                  size="4"
                >
                  <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduling Section -->
        <div class="form-section">
          <h3 class="section-title">Schedule</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="start_time" class="form-label">Start Time</label>
              <input 
                id="start_time" 
                v-model="startTime" 
                type="datetime-local" 
                class="form-control" 
              />
            </div>
            <div class="form-group">
              <label for="end_time" class="form-label">End Time</label>
              <input 
                id="end_time" 
                v-model="endTime" 
                type="datetime-local" 
                class="form-control" 
              />
            </div>
          </div>

          <div class="form-row mt-4">
            <div class="form-group">
              <div class="time-limit-toggle">
                <label class="form-label d-flex align-items-center">
                  <input 
                    class="form-check-input me-2" 
                    type="checkbox" 
                    id="isTimed" 
                    v-model="isTimed" 
                  />
                  Time Limit
                </label>
              </div>
              <div v-if="isTimed" class="time-limit-input mt-2">
                <input 
                  id="time_limit" 
                  v-model="timeLimit" 
                  type="number" 
                  min="1" 
                  class="form-control" 
                  placeholder="Enter time limit in minutes" 
                />
              </div>
            </div>
          </div>
          </div>
          <!-- Questions Selection Section -->
          <div class="form-section">
            <h3 class="section-title">Questions</h3>
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="questionSearch" 
                class="form-control search-input" 
                placeholder="Search questions..." 
              />
            </div>

            <div v-if="Object.keys(questionsByTopic).length === 0" class="empty-state">
              <i class="fas fa-book-open empty-state-icon"></i>
              <p class="empty-state-text">No questions loaded yet</p>
              <p class="empty-state-subtext">Select a topic and click 'Load Questions' to get started</p>
            </div>

            <div v-else class="questions-container">
              <div 
                v-for="(questions, topicId) in questionsByTopic" 
                :key="topicId" 
                class="topic-group"
              >
                <h4 class="topic-title">{{ topicName(topicId) }}</h4>
                <div class="questions-grid">
                  <div 
                    v-for="q in filteredQuestions(questions)" 
                    :key="q.id"
                    class="question-card"
                  >
                    <div class="form-check question-check">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="'q'+q.id" 
                        :value="q.id" 
                        v-model="selectedQuestionIds" 
                      />
                      <label class="form-check-label" :for="'q'+q.id">
                        {{ q.question }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading || !title || !type || selectedQuestionIds.length === 0 || (!selectAllStudents && selectedStudentIds.length === 0)">
            {{ loading ? 'Submitting...' : 'Create & Assign Assessment' }}
          </button>
        </form>
        <div v-if="message" :class="{'alert alert-success mt-3': success, 'alert alert-danger mt-3': !success}">{{ message }}</div>
      </div>
    </div>
 
  
</template>

<script>
import axios from 'axios';
export default {
  name: 'AssignAssessment',
  data() {
    return {
      title: '',
      type: '',
      subjectId: '',
      selectedTopicId: '',
      selectedGroupId: '',
      startTime: '',
      endTime: '',
      isTimed: false,
      timeLimit: '',
      topics: [],
      subjects: [],
      groups: [],
      questionsByTopic: {}, // { topicId: [questions] }
      selectedQuestionIds: [],
      loading: false,
      message: '',
      success: false,
      questionSearch: '',
    };
  },
  methods: {
    onSubjectChange() {
      this.fetchTopics();
    },

    async fetchSubjects() {
      try {
        const res = await axios.get('/subjects');
        this.subjects = res.data;
      } catch (err) {
        this.message = 'Failed to load subjects.';
      }
    },
    async fetchGroups() {
      try {
        const res = await axios.get('/groups');
        this.groups = res.data;
      } catch (err) {
        this.message = 'Failed to load groups.';
      }
    },
    async fetchTopics() {
      if (!this.subjectId) {
        this.topics = [];
        return;
      }
      try {
        const res = await axios.get(`/subjects/${this.subjectId}/topics`);
        this.topics = res.data;
      } catch (err) {
        this.message = 'Failed to load topics.';
      }
    },

    topicName(topicId) {
      const topic = this.topics.find(t => t.id == topicId);
      return topic ? topic.topic_name : 'Topic';
    },
    filteredQuestions(questions) {
      if (!this.questionSearch) return questions;
      const search = this.questionSearch.toLowerCase();
      return questions.filter(q => (q.question || '').toLowerCase().includes(search));
    },
    async loadQuestionsForTopic() {
      if (!this.selectedTopicId) return;
      this.loading = true;
      try {
        const res = await axios.get(`/topics/${this.selectedTopicId}/questions`);
        console.log('questions', res.data);
        let questions = [];
        if (Array.isArray(res.data)) {
          questions = res.data;
        } else if (Array.isArray(res.data.questions)) {
          questions = res.data.questions;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          questions = res.data.data;
        }
        if (questions.length > 0) {
          this.questionsByTopic[this.selectedTopicId] = questions;
          this.message = `Loaded ${questions.length} questions for ${this.topicName(this.selectedTopicId)}.`;
        } else {
          this.message = 'No questions found for this topic.';
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        this.message = `Failed to load questions: ${err.message || 'Unknown error'}`;
      } finally {
        this.loading = false;
      }
    },


    async handleSubmit() {
      this.loading = true;
      this.message = '';

      // Validate group selection
      if (!this.selectedGroupId) {
        this.message = 'Please select a class/group.';
        this.loading = false;
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        // Step 1: Create assessment
        const assessmentPayload = {
          title: this.title,
          type: this.type,
          subject_id: this.subjectId,
          topic_id: this.selectedTopicId || null,
          start_time: this.startTime || null,
          end_time: this.endTime || null,
          is_timed: this.isTimed,
          time_limit: this.isTimed ? this.timeLimit : null,
          question_ids: this.selectedQuestionIds
        };
        const assessmentRes = await axios.post('/assessments', assessmentPayload, { headers: { Authorization: `Bearer ${token}` } });
        const assessmentId = assessmentRes.data.assessment?.id || assessmentRes.data.id || assessmentRes.data.assessment_id;
        // Step 2: Assign assessment to group
        const assignRes = await axios.post(`/assessments/${assessmentId}/assign-group`, { group_id: this.selectedGroupId }, { headers: { Authorization: `Bearer ${token}` } });
        this.success = true;
        this.message = assignRes.data.message;
        // Reset form
        this.title = '';
        this.type = '';
        this.subjectId = '';
        this.selectedTopicId = '';
        this.selectedGroupId = '';
        this.startTime = '';
        this.endTime = '';
        this.isTimed = false;
        this.timeLimit = '';
        this.selectedQuestionIds = [];
        this.questionsByTopic = {};
        this.topics = [];
      } catch (err) {
        this.success = false;
        this.message = err.response?.data?.message || 'Error creating or assigning assessment.';
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchGroups();
    this.fetchSubjects();
  },

};
</script>

<style scoped>
.assessment-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.assessment-header {
  margin-bottom: 2rem;
  text-align: left;
}

.assessment-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1a73e8;
  margin-bottom: 0.5rem;
}

.assessment-subtitle {
  color: #5f6368;
  font-size: 1rem;
  margin-bottom: 0;
}

.assessment-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
              0 1px 3px 1px rgba(60, 64, 67, 0.15);
  padding: 2rem;
  margin-bottom: 2rem;
}

.assessment-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  padding: 1rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.form-section:last-child {
  border-bottom: none;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.student-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-students-message {
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.select-all-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
}

.select-all-checkbox label {
  margin: 0;
  font-size: 0.9rem;
  color: #5f6368;
  cursor: pointer;
}

select[multiple] {
  height: auto;
  min-height: 120px;
  padding: 0.5rem;
}

select[multiple] option {
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 4px;
}

select[multiple] option:hover {
  background-color: #f1f3f4;
}

select[multiple]:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-group.flex-grow-2 {
  flex: 2;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 0.5rem;
}

.form-control, .form-select {
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 0.625rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.form-control-lg {
  font-size: 1.25rem;
  padding: 0.75rem;
}

.topic-select-group {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.topic-select-group .form-select {
  flex: 1;
}

.btn {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #1a73e8;
  border-color: #1a73e8;
  color: white;
}

.btn-primary:hover {
  background-color: #1557b0;
  border-color: #1557b0;
}

.btn-primary:disabled {
  background-color: #dadce0;
  border-color: #dadce0;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  border-color: #dadce0;
  color: #5f6368;
}

.btn-secondary:hover {
  background-color: #f1f3f4;
  border-color: #dadce0;
  color: #202124;
}

.form-actions {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 1rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1.25rem;
}

.time-limit-toggle {
  display: flex;
  align-items: center;
}

.time-limit-toggle .form-check-input {
  width: 1.125rem;
  height: 1.125rem;
  margin-right: 0.5rem;
  cursor: pointer;
}

.time-limit-toggle .form-check-input:checked {
  background-color: #1a73e8;
  border-color: #1a73e8;
}

.time-limit-input .form-control {
  max-width: 200px;
}

.mt-4 {
  margin-top: 1.5rem;
}

.d-flex {
  display: flex;
}

.align-items-center {
  align-items: center;
}

.me-2 {
  margin-right: 0.5rem;
}

.search-box {
  position: relative;
  margin-bottom: 2rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #5f6368;
}

.search-input {
  padding-left: 2.5rem;
  height: 2.75rem;
  font-size: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.empty-state-icon {
  font-size: 3rem;
  color: #dadce0;
  margin-bottom: 1rem;
}

.empty-state-text {
  font-size: 1.25rem;
  color: #202124;
  margin-bottom: 0.5rem;
}

.empty-state-subtext {
  color: #5f6368;
  margin-bottom: 0;
}

.questions-container {
  margin-top: 2rem;
}

.topic-group {
  margin-bottom: 2.5rem;
}

.topic-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e8eaed;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.question-card {
  background: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.question-card:hover {
  border-color: #1a73e8;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
              0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.question-check {
  margin: 0;
}

.question-check .form-check-input {
  margin-top: 0.25rem;
}

.question-check .form-check-label {
  margin-left: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: #202124;
}

.card {
  width: 100%;
  margin: 0;
  border-radius: 1.2em;
}
.card-title {
  font-weight: 700;
}
.container-fluid {
  width: 100%;
  height: 100%;
  padding: 0;
}
</style>
