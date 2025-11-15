<template>
  <div class="container py-4">
    <!-- Header Section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Select Questions</h2>
      <router-link 
        :to="{ name: 'AssessmentList' }" 
        class="btn btn-outline-secondary"
      >
        <i class="bi bi-arrow-left me-1"></i> Back to Assessments
      </router-link>
    </div>

    <!-- Filters Section -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-6">
          <div class="col-12 mb-3">
            <label class="form-label fs-5 fw-semibold">Select Subject & Grade</label>
            <div class="position-relative w-100" style="max-width: 600px;">
              <input
                v-model="subjectSearch"
                @input="searchSubjects"
                @focus="showSubjectDropdown = true"
                @blur="handleSubjectBlur"
                type="text"
                class="form-control form-control-lg shadow-sm border-primary rounded-pill px-4 py-3"
                placeholder="Type subject name or grade (e.g., Computer Science S4)"
                style="font-size: 1.25rem;"
              />
              <div v-if="showSubjectDropdown && filteredSubjects.length" class="dropdown-menu d-block w-100 position-absolute shadow rounded mt-1" style="z-index: 10;">
                <button 
                  v-for="subject in filteredSubjects" 
                  :key="subject.id + '-' + subject.grade_level_id"
                  class="dropdown-item py-3 fs-6"
                  @mousedown="selectSubject(subject)"
                >
                  <span class="fw-bold">{{ subject.name }}</span>
                  <span class="text-muted ms-2">- {{ subject.grade_level }}</span>
                </button>
              </div>
            </div>
            <div v-if="selectedSubject" class="mt-3 d-flex align-items-center">
              <span class="badge bg-primary fs-6 px-3 py-2 me-3">{{ selectedSubject.name }} - {{ selectedSubject.grade_level }}</span>
              <button class="btn btn-sm btn-outline-danger rounded-pill px-3" @click="clearSubject">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row">
      <!-- Questions List -->
      <div class="col-lg-7">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>Available Questions ({{ filteredQuestions.length }})</h5>
          <div v-if="filteredQuestions.length > 0" class="text-muted small">
            Showing {{ paginationInfo }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading questions...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <!-- No Results -->
        <div v-else-if="filteredQuestions.length === 0" class="text-center py-5 bg-light rounded">
          <div class="mb-3">
            <i class="bi bi-question-circle display-6 text-muted"></i>
          </div>
          <h5>No questions found</h5>
          <p class="text-muted">Try adjusting your filters or search term</p>
          <button class="btn btn-outline-primary mt-2" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
          </button>
        </div>

        <!-- Questions List: Collapsible by topic -->
        <div v-else class="question-list">
          <div v-for="topic in Object.keys(groupedQuestions)" :key="topic" class="mb-4">
            <button
              class="btn btn-link w-100 text-start px-0 mb-2 d-flex align-items-center"
              @click="toggleTopicCollapse(topic)"
              :aria-expanded="!isTopicCollapsed(topic)"
              style="font-size:1.15rem; font-weight:600; text-decoration:none;"
            >
              <span class="me-2">
                <i :class="isTopicCollapsed(topic) ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
              </span>
              {{ topic }}
              <span class="badge bg-secondary ms-2">{{ getQuestionsByTopic(topic).length }}</span>
            </button>
            <transition name="fade">
              <div v-show="!isTopicCollapsed(topic)">
                <div v-for="question in getQuestionsByTopic(topic)" :key="question.id" class="question-card mb-2">
                  <div class="card">
                    <div class="card-body d-flex align-items-center">
                      <input
                        type="checkbox"
                        class="form-check-input me-3"
                        :checked="isSelected(question)"
                        :disabled="isAlreadyAdded(question)"
                        @change="toggleQuestion(question)"
                      />
                      <div class="flex-grow-1">
                        <span class="badge me-2" :class="getDifficultyClass(question.difficulty_level)">
                          {{ formatDifficulty(question.difficulty_level) }}
                        </span>
                        <span class="fw-bold">{{ question.question }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
          <!-- Pagination -->
          <nav v-if="totalPages > 1" class="mt-4">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                  Previous
                </button>
              </li>
              <li 
                v-for="page in totalPages" 
                :key="page"
                class="page-item" 
                :class="{ active: currentPage === page }"
              >
                <button class="page-link" @click="currentPage = page">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Selected Questions Panel -->
      <div class="col-lg-4 mt-4 mt-lg-0">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              Selected Questions 
              <span class="badge bg-primary">{{ selectedQuestionsCount }}</span>
            </h5>
            <button 
              class="btn btn-sm btn-outline-danger" 
              @click="clearSelection"
              :disabled="selectedQuestions.length === 0"
            >
              Clear All
            </button>
          </div>
          <div class="card-body p-0">
            <div v-if="selectedQuestions.length === 0" class="text-center p-4">
              <p class="text-muted mb-2">No questions selected yet</p>
              <p class="small text-muted">Click on questions to select them</p>
            </div>
            <div v-else class="selected-questions-list p-3">
              <div 
                v-for="(question, index) in selectedQuestions" 
                :key="'selected-'+question.id" 
                class="selected-question-item mb-2 p-2 border rounded"
                :class="{ 'bg-light': isMarkedForRemoval(question) }"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-truncate" v-html="formatQuestionText(question.question_text)"></span>
                  <button 
                    class="btn btn-sm"
                    :class="isMarkedForRemoval(question) ? 'btn-outline-success' : 'btn-outline-danger'"
                    @click="isMarkedForRemoval(question) ? undoRemoveQuestion(question) : removeQuestion(question)"
                  >
                    <i v-if="isMarkedForRemoval(question)" class="bi bi-arrow-counterclockwise"></i>
                    <i v-else class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="mt-3">
                <button 
                  class="btn btn-primary w-100" 
                  @click="saveSelection"
                  :disabled="isSaving"
                >
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isSaving ? 'Saving...' : 'Save Selection' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div 
        class="toast align-items-center text-white" 
        :class="`bg-${toast.type}`" 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true" 
        v-if="toast.show"
      >
        <div class="d-flex">
          <div class="toast-body">
            <i :class="getToastIcon(toast.type)" class="me-2"></i>
            {{ toast.message }}
          </div>
          <button 
            type="button" 
            class="btn-close btn-close-white me-2 m-auto" 
            @click="toast.show = false" 
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
</template>

<script>
import axios from 'axios';
import { questionService } from '@/services/questionService';

export default {
  name: 'SelectQuestions',
  data() {
    return {
      // Data
      questions: [],
      filteredQuestions: [],
      selectedQuestions: [],
      questionsMarkedForRemoval: [],
      existingQuestions: [],
      grades: [],
      subjects: [],
      topics: [],
      groupedQuestions: {},
      
      // UI State
      isLoading: false,
      isSaving: false,
      error: null,
      currentPage: 1,
      itemsPerPage: 10,
      
      // Filters
      filters: {
        search: '',
        topic: '',
        subject: '',
        grade: ''
      },
      
  // Subject search
  subjectSearch: '',
  filteredSubjects: [],
  selectedSubject: null,
  showSubjectDropdown: false,
  groupedQuestions: {},
      
      // Toast
      toast: {
        show: false,
        message: '',
        type: 'info' // 'success', 'danger', 'warning', 'info'
      },
      
      // Track collapsed/expanded topics
      collapsedTopics: {}
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
    },
    paginatedQuestions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredQuestions.slice(start, end);
    },
    paginationInfo() {
      const start = (this.currentPage - 1) * this.itemsPerPage + 1;
      const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredQuestions.length);
      return `Showing ${start}-${end} of ${this.filteredQuestions.length}`;
    },
    selectedQuestionsCount() {
      return this.selectedQuestions.length;
    }
  },
  watch: {
    currentPage() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  created() {
    this.initializeData();
  },
  methods: {
    async initializeData() {
      this.isLoading = true;
      try {
        await Promise.all([
          this.fetchGradeLevels(),
          this.fetchExistingQuestions()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        this.showToast('Failed to load initial data', 'danger');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Fetch Data Methods
    async fetchGradeLevels() {
      try {
        const response = await axios.get('/grade-levels');
        this.grades = response.data || [];
      } catch (error) {
        console.error('Error fetching grades:', error);
        this.showToast('Failed to load grade levels', 'danger');
      }
    },
    
    async fetchSubjects() {
      if (!this.filters.grade) {
        this.subjects = [];
        this.filters.subject = '';
        return;
      }
      
      try {
        const response = await axios.get(`/subjects?grade_id=${this.filters.grade}`);
        this.subjects = response.data || [];
        this.filters.subject = ''; // Reset subject when grade changes
        this.topics = []; // Clear topics
      } catch (error) {
        console.error('Error fetching subjects:', error);
        this.showToast('Failed to load subjects', 'danger');
      }
    },
    
    async fetchTopics() {
      if (!this.filters.subject) {
        this.topics = [];
        this.filters.topic = '';
        return;
      }
      
      try {
        const response = await axios.get(`/topics?subject_id=${this.filters.subject}`);
        this.topics = response.data || [];
        this.filters.topic = ''; // Reset topic when subject changes
      } catch (error) {
        console.error('Error fetching topics:', error);
        this.showToast('Failed to load topics', 'danger');
      }
    },
    
    // Subject search methods
    async searchSubjects() {
      if (!this.subjectSearch.trim()) {
        this.filteredSubjects = [];
        return;
      }
      
      try {
        const results = await questionService.searchSubjects(this.subjectSearch);
        this.filteredSubjects = results;
      } catch (error) {
        console.error('Error searching subjects:', error);
        // Fallback to client-side filtering if API fails
        const search = this.subjectSearch.toLowerCase();
        this.filteredSubjects = this.subjects.filter(subject => 
          subject.name.toLowerCase().includes(search)
        );
      }
    },

    async selectSubject(subject) {
      // subject: { id, name, grade_level_id, grade_level }
      this.selectedSubject = subject;
      this.filters.subject = subject.id;
      this.filters.grade = subject.grade_level_id;
      this.subjectSearch = `${subject.name} - ${subject.grade_level}`;
      this.showSubjectDropdown = false;
      await this.fetchTopicsWithQuestionsBySubjectAndGrade(subject.id, subject.grade_level_id);
    },
    // Fetch topics with questions for a subject-grade pair
    async fetchTopicsWithQuestionsBySubjectAndGrade(subjectId, gradeLevelId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await questionService.fetchTopicsWithQuestionsBySubjectAndGrade(subjectId, gradeLevelId);
        // response: { success: true, data: [ { topic_id, topic_name, questions: [...] }, ... ] }
        this.questions = [];
        this.groupedQuestions = {};
        this.collapsedTopics = {};
        const topics = response && response.data ? response.data : [];
        topics.forEach(topic => {
          if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
            this.groupedQuestions[topic.topic_name] = [];
            this.collapsedTopics[topic.topic_name] = true; // collapsed by default
            return;
          }
          // Ensure each question has topic_id and topic_name for selection logic
          this.groupedQuestions[topic.topic_name] = topic.questions.map(q => ({
            ...q,
            topic_id: topic.topic_id,
            topic_name: topic.topic_name
          }));
          this.questions.push(...this.groupedQuestions[topic.topic_name]);
          this.collapsedTopics[topic.topic_name] = true; // collapsed by default
        });
        this.filteredQuestions = this.questions;
        this.currentPage = 1;
      } catch (error) {
        this.error = 'Failed to load questions for subject and grade.';
        this.showToast('Failed to load questions for subject and grade', 'danger');
      } finally {
        this.isLoading = false;
      }
    },
    // Helper for grouped display
    getQuestionsByTopic(topic) {
      return this.groupedQuestions && this.groupedQuestions[topic] ? this.groupedQuestions[topic] : [];
    },

    
    clearSubject() {
      this.selectedSubject = null;
      this.filters.subject = '';
      this.subjectSearch = '';
      this.onSubjectChange();
    },
    
    handleSubjectBlur() {
      // Delay hiding dropdown to allow click to register
      setTimeout(() => {
        this.showSubjectDropdown = false;
      }, 200);
    },
    
    async fetchQuestions() {
      this.isLoading = true;
      this.error = null;
      try {
        console.log('Fetching questions with filters:', this.filters);
        const response = await questionService.fetchQuestions(this.filters);
        console.log('API Response:', response);

           // Check if response is an array or has a data property
        const questions = Array.isArray(response) ? response : (response.data || []);
        console.log('Processed questions:', questions);
    
        // this.questions = response.data.data || [];
        this.questions = questions;

        this.filteredQuestions = [...this.questions];
        this.currentPage = 1; // Reset to first page
      } catch (error) {
        console.error('Error fetching questions:', error);
        this.showToast('Failed to load questions', 'danger');
        this.error = 'Failed to load questions. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchExistingQuestions() {
      const assessmentId = this.$route.params.assessmentId;
      if (!assessmentId) return;
      
      try {
        const response = await questionService.fetchExistingQuestions(assessmentId);
        this.existingQuestions = response.data || [];
      } catch (error) {
        console.error('Error fetching existing questions:', error);
        this.showToast('Failed to load existing questions', 'warning');
      }
    },
    
    // Fetch topics with questions for a subject
    async fetchTopicsWithQuestionsBySubject(subjectId) {
      this.isLoading = true;
      this.error = null;
      try {
        const topics = await questionService.fetchTopicsWithQuestionsBySubject(subjectId);
        // Flatten all questions for selection logic
        this.questions = [];
        this.groupedQuestions = {};
        topics.forEach(topic => {
          if (!topic.questions) return;
          this.groupedQuestions[topic.topic_name] = topic.questions.map(q => ({
            ...q,
            topic_id: topic.id,
            topic_name: topic.topic_name
          }));
          this.questions.push(...this.groupedQuestions[topic.topic_name]);
        });
        this.filteredQuestions = this.questions;
        this.currentPage = 1;
      } catch (error) {
        this.error = 'Failed to load questions for subject.';
        this.showToast('Failed to load questions for subject', 'danger');
      } finally {
        this.isLoading = false;
      }
    },

    // Helper for template
    getQuestionsByTopic(topic) {
      return this.groupedQuestions && this.groupedQuestions[topic] ? this.groupedQuestions[topic] : [];
    },
    
    // Question Selection Methods
    toggleQuestion(question) {
      // Don't allow toggling already added questions
      if (this.isAlreadyAdded(question)) {
        return;
      }
      
      const isAlreadySelected = this.isSelected(question);
      const isMarked = this.isMarkedForRemoval(question);
      const isExisting = this.isExistingQuestion(question);
      
      if (isAlreadySelected && !isMarked && isExisting) {
        // Mark existing question for removal
        this.questionsMarkedForRemoval.push(question);
      } else if (isMarked) {
        // Undo removal
        this.questionsMarkedForRemoval = this.questionsMarkedForRemoval.filter(
          q => q.id !== question.id
        );
      } else if (isAlreadySelected) {
        // Remove from selected questions
        this.selectedQuestions = this.selectedQuestions.filter(
          q => q.id !== question.id
        );
      } else {
        // Add to selected questions
        this.selectedQuestions = [...this.selectedQuestions, question];
      }
    },
    
    isAlreadyAdded(question) {
      return this.existingQuestions.some(q => q.id === question.id) && 
             !this.questionsMarkedForRemoval.some(q => q.id === question.id);
    },
    
    removeQuestion(question) {
      if (this.isExistingQuestion(question)) {
        // Mark for removal if it's an existing question
        if (!this.isMarkedForRemoval(question)) {
          this.questionsMarkedForRemoval = [
            ...this.questionsMarkedForRemoval,
            question
          ];
        }
      } else {
        // Remove from selected questions if it's a new selection
        this.selectedQuestions = this.selectedQuestions.filter(
          q => q.id !== question.id
        );
      }
    },
    
    undoRemoveQuestion(question) {
      this.questionsMarkedForRemoval = this.questionsMarkedForRemoval.filter(
        q => q.id !== question.id
      );
    },
    
    clearSelection() {
      this.selectedQuestions = [];
      this.questionsMarkedForRemoval = [];
    },
    
    // Filter and Search Methods
    filterQuestions() {
      // Apply filters to questions
      this.filteredQuestions = this.questions.filter(question => {
        // Add your filter logic here
        return true;
      });
      this.currentPage = 1; // Reset to first page
    },
    
    resetFilters() {
      this.filters = {
        search: '',
        topic: '',
        subject: '',
        grade: ''
      };
      this.fetchQuestions();
    },
    
    // Save Methods
    async saveSelection() {
      if (this.selectedQuestions.length === 0 && this.questionsMarkedForRemoval.length === 0) {
        this.showToast('No changes to save', 'warning');
        return;
      }
      
      this.isSaving = true;
      
      try {
        const assessmentId = this.$route.params.assessmentId;
        const questionIds = this.selectedQuestions.map(q => q.id);
        const removalIds = this.questionsMarkedForRemoval.map(q => q.id);
        
        await questionService.saveQuestions(assessmentId, questionIds, removalIds);
        
        this.showToast('Questions saved successfully', 'success');
        
        // Reset selections
        this.selectedQuestions = [];
        this.questionsMarkedForRemoval = [];
        
        // Refresh the questions list
        await this.fetchQuestions();
        await this.fetchExistingQuestions();
        
      } catch (error) {
        console.error('Error saving questions:', error);
        this.showToast('Failed to save questions', 'danger');
      } finally {
        this.isSaving = false;
      }
    },
    
    // Helper Methods
    isSelected(question) {
      return this.selectedQuestions.some(q => q.id === question.id);
    },
    
    isExistingQuestion(question) {
      return this.existingQuestions.some(q => q.id === question.id);
    },
    
    isMarkedForRemoval(question) {
      return this.questionsMarkedForRemoval.some(q => q.id === question.id);
    },
    
    getSubjectName(subjectId) {
      const subject = this.subjects.find(s => s.id === subjectId);
      return subject ? subject.name : 'Unknown Subject';
    },
    
    getTopicName(topicId) {
      const topic = this.topics.find(t => t.id === topicId);
      return topic ? topic.topic_name : 'Unknown Topic';
    },
    
    getGradeName(gradeId) {
      const grade = this.grades.find(g => g.id === gradeId);
      return grade ? `Grade ${grade.grade_name}` : 'Unknown Grade';
    },
    
    formatQuestionText(text) {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    },
    
    formatDifficulty(difficulty) {
      if (!difficulty) return 'Unknown';
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    },
    
    getDifficultyClass(difficulty) {
      const classes = {
        easy: 'bg-success',
        medium: 'bg-warning text-dark',
        hard: 'bg-danger',
        default: 'bg-secondary'
      };
      return classes[difficulty?.toLowerCase()] || classes.default;
    },
    
    getToastIcon(type) {
      const icons = {
        success: 'bi-check-circle',
        danger: 'bi-exclamation-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
      };
      return `bi ${icons[type] || 'bi-info-circle'}`;
    },
    
    showToast(message, type = 'info') {
      this.toast = {
        show: true,
        message,
        type
      };
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.toast.show = false;
      }, 5000);
    },
    
    // Event Handlers
    onGradeChange() {
      this.filters.subject = '';
      this.filters.topic = '';
      this.topics = [];
      this.fetchSubjects();
    },
    
    onSubjectChange() {
      this.filters.topic = '';
      this.fetchTopics();
    },

    toggleTopicCollapse(topic) {
      this.collapsedTopics[topic] = !this.collapsedTopics[topic];
    },
    isTopicCollapsed(topic) {
      return !!this.collapsedTopics[topic];
    },
  }
};
</script>

<style scoped>
/* Question List */
.question-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Custom scrollbar */
.question-list::-webkit-scrollbar {
  width: 6px;
}

.question-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.question-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.question-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .question-list {
    max-height: none;
    overflow-y: visible;
  }
}

/* Animation for question cards */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.question-card {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Selected Questions */
.selected-questions-list {
  max-height: 500px;
  overflow-y: auto;
}

.selected-question-item {
  transition: all 0.2s ease;
}

.selected-question-item:hover {
  background-color: #f8f9fa;
}

/* Pagination */
.pagination {
  margin: 1.5rem 0;
}

.page-link {
  cursor: pointer;
  min-width: 2.5rem;
  text-align: center;
}

/* Toast notification */
.toast {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.toast:not(.show) {
  opacity: 0;
}

/* Difficulty badges */
.bg-easy { background-color: #198754; }
.bg-medium { background-color: #ffc107; color: #000; }
.bg-hard { background-color: #dc3545; }
.bg-unknown { background-color: #6c757d; }
</style>