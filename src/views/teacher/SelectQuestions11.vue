<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Select Questions</h2>
      <div>
        <router-link 
          :to="{ name: 'AssessmentList' }" 
          class="btn btn-outline-secondary"
        >
          <i class="bi bi-arrow-left me-1"></i> Back to Assessments
        </router-link>
      </div>
    </div>
    
    <question-filters 
      v-model="filters"
      @filter="fetchQuestions"
    />

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading questions...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else class="row">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>Available Questions ({{ filteredQuestions.length }})</h5>
          <div v-if="filteredQuestions.length > 0" class="text-muted small">
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredQuestions.length) }}-{{ Math.min(currentPage * itemsPerPage, filteredQuestions.length) }} of {{ filteredQuestions.length }}
          </div>
        </div>
        
        <div v-if="filteredQuestions.length === 0" class="text-center py-5 bg-light rounded">
          <div class="mb-3">
            <i class="bi bi-question-circle display-6 text-muted"></i>
          </div>
          <h5>No questions found</h5>
          <p class="text-muted">Try adjusting your filters or search term</p>
          <button class="btn btn-outline-primary mt-2" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
          </button>
        </div>
        
        <div v-else class="question-list">
          <question-card
            v-for="question in paginatedQuestions"
            :key="question.id"
            :question="question"
            :is-selected="isSelected(question)"
            :is-existing="isExistingQuestion(question)"
            :is-marked-for-removal="isMarkedForRemoval(question)"
            :subject-name="getSubjectName(question.subject_id)"
            :topic-name="getTopicName(question.topic_id)"
            :grade-name="getGradeName(question.grade_id)"
            @select="selectQuestion"
            @remove="removeQuestion"
            @undo-remove="undoRemoveQuestion"
          />
          
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
      
      <div class="col-lg-4 mt-4 mt-lg-0">
        <selected-questions
          :selected-questions="selectedQuestions"
          :questions-marked-for-removal="questionsMarkedForRemoval"
          :existing-questions="existingQuestions"
          :is-saving="isSaving"
          @save="saveSelection"
          @remove="removeQuestion"
          @undo-remove="undoRemoveQuestion"
          @clear="clearSelection"
        />
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div class="toast align-items-center text-white" :class="`bg-${toast.type}`" role="alert" aria-live="assertive" aria-atomic="true" v-if="toast.show">
        <div class="d-flex">
          <div class="toast-body">
            <i :class="getToastIcon(toast.type)" class="me-2"></i>
            {{ toast.message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toast.show = false" aria-label="Close"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuestionSelection } from '@/composables/useQuestionSelection';
import { questionService } from '@/services/questionService';
import QuestionFilters from '@/components/questions/QuestionFilters.vue';
import QuestionCard from '@/components/questions/QuestionCard.vue';
import SelectedQuestions from '@/components/questions/SelectedQuestions.vue';
import type { Question, QuestionFilters as QuestionFiltersType } from '@/types/question';

export default defineComponent({
  name: 'SelectQuestions',
  components: {
    QuestionFilters,
    QuestionCard,
    SelectedQuestions
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // State
    const questions = ref<Question[]>([]);
    const filteredQuestions = ref<Question[]>([]);
    const grades = ref<{id: number; grade_name: string}[]>([]);
    const subjects = ref<{id: number; name: string}[]>([]);
    const topics = ref<{id: number; topic_name: string}[]>([]);
    const isLoading = ref(true);
    const error = ref<string | null>(null);
    const isSaving = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const toast = ref({
      show: false,
      message: '',
      type: 'info' // 'success', 'danger', 'warning', 'info'
    });
    
    // Initialize filters with route query params
    const filters = ref<QuestionFiltersType>({
      search: (route.query.search as string) || '',
      topic: route.query.topic ? Number(route.query.topic) : '',
      subject: route.query.subject ? Number(route.query.subject) : '',
      grade: route.query.grade ? Number(route.query.grade) : ''
    });
    
    // Initialize question selection logic
    const {
      selectedQuestions,
      questionsMarkedForRemoval,
      existingQuestions,
      isSelected,
      isExistingQuestion,
      isMarkedForRemoval,
      toggleQuestion,
      removeQuestion,
      undoRemoveQuestion,
      resetSelections
    } = useQuestionSelection();
    
    // Computed properties
    const totalPages = computed(() => {
      return Math.ceil(filteredQuestions.value.length / itemsPerPage);
    });
    
    const paginatedQuestions = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredQuestions.value.slice(start, end);
    });
    
    // Watchers
    watch(currentPage, () => {
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    watch(filters, (newFilters) => {
      // Update URL with current filters
      const query = { ...route.query };
      
      if (newFilters.search) query.search = newFilters.search;
      else delete query.search;
      
      if (newFilters.topic) query.topic = String(newFilters.topic);
      else delete query.topic;
      
      if (newFilters.subject) query.subject = String(newFilters.subject);
      else delete query.subject;
      
      if (newFilters.grade) query.grade = String(newFilters.grade);
      else delete query.grade;
      
      router.replace({ query });
      
      // Reset to first page when filters change
      currentPage.value = 1;
    }, { deep: true });
    
    // Methods
    const showToast = (message: string, type = 'info') => {
      toast.value = { message, type, show: true };
      setTimeout(() => {
        toast.value.show = false;
      }, 5000);
    };
    
    const getToastIcon = (type: string) => {
      const icons: Record<string, string> = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
      };
      return icons[type] || 'bi-info-circle-fill';
    };
    
    const resetFilters = () => {
      filters.value = {
        search: '',
        topic: '',
        subject: '',
        grade: ''
      };
    };
    
    const clearSelection = () => {
      resetSelections();
      showToast('Selection cleared', 'info');
    };
    
    const selectQuestion = (question: Question) => {
      toggleQuestion(question);
      showToast('Question selected', 'success');
    };
    
    const getSubjectName = (subjectId?: number): string => {
      if (!subjectId) return '';
      const subject = subjects.value.find(s => s.id === subjectId);
      return subject ? subject.name : '';
    };
    
    const getTopicName = (topicId?: number): string => {
      if (!topicId) return '';
      const topic = topics.value.find(t => t.id === topicId);
      return topic ? topic.topic_name : '';
    };
    
    const getGradeName = (gradeId?: number): string => {
      if (!gradeId) return '';
      const grade = grades.value.find(g => g.id === gradeId);
      return grade ? grade.grade_name : '';
    };
    
    const filterQuestions = () => {
      if (!filters.value.search && !filters.value.topic && !filters.value.subject && !filters.value.grade) {
        filteredQuestions.value = [...questions.value];
        return;
      }
      
      filteredQuestions.value = questions.value.filter(question => {
        // Filter by search term
        const searchTerm = (filters.value.search || '').toLowerCase();
        const matchesSearch = !searchTerm || 
          (question.question_text && question.question_text.toLowerCase().includes(searchTerm));
        
        // Filter by topic
        const matchesTopic = !filters.value.topic || question.topic_id === filters.value.topic;
        
        // Filter by subject
        const matchesSubject = !filters.value.subject || question.subject_id === filters.value.subject;
        
        // Filter by grade
        const matchesGrade = !filters.value.grade || question.grade_id === filters.value.grade;
        
        return matchesSearch && matchesTopic && matchesSubject && matchesGrade;
      });
    };
    
    // API calls
    const fetchGradeLevels = async () => {
      try {
        const data = await questionService.fetchGradeLevels();
        grades.value = data;
      } catch (err) {
        console.error('Error fetching grade levels:', err);
        showToast('Failed to load grade levels', 'danger');
      }
    };
    
    const fetchSubjects = async (gradeId?: string | number) => {
      try {
        const data = await questionService.fetchSubjects(gradeId);
        subjects.value = data;
      } catch (err) {
        console.error('Error fetching subjects:', err);
        showToast('Failed to load subjects', 'danger');
      }
    };
    
    const fetchTopics = async (subjectId?: string | number) => {
      try {
        const data = await questionService.fetchTopics(subjectId);
        topics.value = data;
      } catch (err) {
        console.error('Error fetching topics:', err);
        showToast('Failed to load topics', 'danger');
      }
    };
    
    const fetchQuestions = async () => {
      isLoading.value = true;
      error.value = null;
      
      try {
        const data = await questionService.fetchQuestions(filters.value);
        questions.value = Array.isArray(data) ? data : [];
        filterQuestions();
      } catch (err) {
        console.error('Error fetching questions:', err);
        error.value = 'Failed to load questions. Please try again later.';
        showToast(error.value, 'danger');
      } finally {
        isLoading.value = false;
      }
    };
    
    const fetchExistingQuestions = async () => {
      const assessmentId = route.params.assessmentId;
      if (!assessmentId) return;
      
      try {
        const data = await questionService.fetchExistingQuestions(assessmentId);
        existingQuestions.value = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Error fetching existing questions:', err);
        showToast('Failed to load existing questions', 'warning');
      }
    };
    
    const saveSelection = async () => {
      const assessmentId = route.params.assessmentId;
      if (!assessmentId) {
        showToast('Invalid assessment ID', 'danger');
        return;
      }
      
      if (selectedQuestions.value.length === 0 && questionsMarkedForRemoval.value.length === 0) {
        showToast('No changes to save', 'info');
        return;
      }
      
      isSaving.value = true;
      
      try {
        const questionIds = selectedQuestions.value.map(q => q.id);
        const removeIds = questionsMarkedForRemoval.value.map(q => q.id);
        
        await questionService.saveQuestions(assessmentId, questionIds, removeIds);
        
        // Update existing questions
        const newExistingQuestions = [
          ...existingQuestions.value.filter(q => !removeIds.includes(q.id)),
          ...selectedQuestions.value
        ];
        
        existingQuestions.value = newExistingQuestions;
        selectedQuestions.value = [];
        questionsMarkedForRemoval.value = [];
        
        showToast('Questions saved successfully', 'success');
        
        // Refresh the questions to reflect changes
        await fetchQuestions();
      } catch (err) {
        console.error('Error saving questions:', err);
        showToast('Failed to save questions', 'danger');
      } finally {
        isSaving.value = false;
      }
    };
    
    // Lifecycle hooks
    onMounted(async () => {
      await Promise.all([
        fetchGradeLevels(),
        fetchQuestions(),
        fetchExistingQuestions()
      ]);
      
      // If we have a grade in the URL, fetch its subjects
      if (filters.value.grade) {
        await fetchSubjects(filters.value.grade);
      }
      
      // If we have a subject in the URL, fetch its topics
      if (filters.value.subject) {
        await fetchTopics(filters.value.subject);
      }
    });
    
    return {
      // State
      questions,
      filteredQuestions,
      grades,
      subjects,
      topics,
      isLoading,
      error,
      isSaving,
      currentPage,
      itemsPerPage,
      totalPages,
      paginatedQuestions,
      filters,
      toast,
      
      // Question selection
      selectedQuestions,
      questionsMarkedForRemoval,
      existingQuestions,
      isSelected,
      isExistingQuestion,
      isMarkedForRemoval,
      
      // Methods
      fetchQuestions,
      filterQuestions,
      resetFilters,
      clearSelection,
      selectQuestion,
      removeQuestion,
      undoRemoveQuestion,
      saveSelection,
      getSubjectName,
      getTopicName,
      getGradeName,
      getToastIcon,
      showToast
    };
  }
});
</script>


                    </h5> -->
                    <span class="badge mb-2" 
                          :class="getDifficultyClass(question.difficulty_level)">
                      {{ question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1) }}
                    </span>
                  </div>
                  <div class="question-content">
                    <div v-html="formatQuestionText(question.question)" class="mb-3"></div>
                    
                    <div v-if="question.question_type === 'true_false'" class="options-container">
                      <div class="option-item" :class="{ 'text-success fw-bold': question.correct_answer === 'true' }">
                        <span class="option-letter me-2">A.</span>
                        <span>True</span>
                      </div>
                      <div class="option-item" :class="{ 'text-success fw-bold': question.correct_answer === 'false' }">
                        <span class="option-letter me-2">B.</span>
                        <span>False</span>
                      </div>
                    </div>
                    <div v-else-if="question.options && question.options.length > 0" class="options-container">
                      <div v-for="(option, index) in question.options" :key="index" 
                           class="option-item"
                           :class="{ 'text-success fw-bold': option === question.correct_answer }">
                        <span class="option-letter me-2">{{ String.fromCharCode(65 + index) }}.</span>
                        <span v-html="formatQuestionText(option)"></span>
                      </div>
                    </div>
                    
                    <div v-if="question.is_math || question.is_chemistry" class="mt-2">
                      <span class="badge bg-info me-2">
                        {{ question.is_math ? 'Math' : 'Chemistry' }} Question
                      </span>
                    </div>
                    
                    <div v-if="question.explanation" class="explanation mt-2 small text-muted">
                      <strong>Explanation:</strong> {{ question.explanation }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="selected-questions-container">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  Selected Questions 
                  <span class="badge bg-primary">{{ selectedQuestions.length }}</span>
                </h5>
                <div>
                  <button 
                    @click="fetchExistingQuestions" 
                    class="btn btn-sm btn-outline-primary me-2"
                    :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    {{ isLoading ? 'Loading...' : 'Refresh' }}
                  </button>
                  <button 
                    v-if="selectedQuestions.length > 0"
                    @click="saveSelection" 
                    class="btn btn-sm btn-success"
                    :disabled="isSaving">
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    {{ isSaving ? 'Saving...' : 'Save Selection' }}
                  </button>
                </div>
              </div>
              <div class="card-body p-0">
                <div v-if="selectedQuestions.length === 0 && !isLoading" class="text-center p-4">
                  <p class="text-muted mb-2">No questions selected yet</p>
                  <p class="small text-muted">Click on questions to select them</p>
                  <button @click="showDebugInfo = !showDebugInfo" class="btn btn-sm btn-outline-secondary mt-3">
                    {{ showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
                  </button>
                  <div v-if="showDebugInfo" class="mt-3 text-start">
                    <p class="small fw-bold">Assessment ID: {{ assessmentId || 'Not set' }}</p>
                    <p class="small fw-bold">Selected Questions Count: {{ selectedQuestions.length }}</p>
                    <p class="small fw-bold">API Status: {{ error || 'No errors' }}</p>
                    <div class="d-grid gap-2 mt-3">
                      <button @click="checkAssessmentId" class="btn btn-sm btn-outline-info">
                        Verify Assessment ID
                      </button>
                      <button @click="resetAndRetry" class="btn btn-sm btn-outline-warning">
                        Reset & Retry
                      </button>
                      <button @click="testDirectApiCall" class="btn btn-sm btn-outline-primary">
                        Test API Directly
                      </button>
                    </div>
                    <div v-if="debugMessages.length > 0" class="mt-3 small">
                      <p class="fw-bold">Debug Messages:</p>
                      <ul class="list-group">
                        <li v-for="(msg, index) in debugMessages" :key="index" class="list-group-item list-group-item-info py-1 small">
                          {{ msg }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div v-if="isLoading" class="text-center p-4">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="small text-muted mt-2">Loading existing questions...</p>
                </div>
                <div v-if="showDebugInfo && selectedQuestions.length > 0" class="alert alert-info mt-3 mb-3 mx-3 p-2 small">
                  <p class="mb-1"><strong>Selected Questions Debug:</strong></p>
                  <ul class="mb-0 ps-3">
                    <li>Total count: {{ selectedQuestions.length }}</li>
                    <li>Existing questions: {{ selectedQuestions.filter(q => q.isExisting).length }}</li>
                    <li>Marked for removal: {{ selectedQuestions.filter(q => q.markedForRemoval).length }}</li>
                    <li>New questions: {{ selectedQuestions.filter(q => !q.isExisting).length }}</li>
                  </ul>
                  <div v-if="selectedQuestions.length > 0" class="mt-2">
                    <p class="mb-1"><strong>First Question Properties:</strong></p>
                    <button @click="inspectFirstQuestion" class="btn btn-sm btn-outline-secondary mb-2">Inspect First Question</button>
                    <pre v-if="firstQuestionInspection" class="bg-light p-2 mb-0" style="max-height: 150px; overflow-y: auto; font-size: 10px;">{{ firstQuestionInspection }}</pre>
                  </div>
                </div>
                <div v-else class="selected-questions-list">
                  <div 
                    v-for="(question, index) in selectedQuestions" 
                    :key="'selected-'+question.id" 
                    class="selected-question-item"
                    :class="{
                      'bg-light': question.isExisting,
                      'text-muted marked-for-removal': question.markedForRemoval
                    }"
                    @click="scrollToQuestion(question.id)">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="question-preview">
                        <span class="question-number">{{ index + 1 }}.</span>
                        <span class="question-text" v-html="formatQuestionText(question.question)"></span>
                      </div>
                      <button 
                        v-if="!question.isExisting || !question.markedForRemoval"
                        @click.stop="removeQuestion(question)"
                        class="btn btn-sm btn-outline-danger"
                        title="Remove question">
                        &times;
                      </button>
                      <button 
                        v-if="question.isExisting && question.markedForRemoval"
                        @click.stop="undoRemoveQuestion(question)"
                        class="btn btn-sm btn-outline-success"
                        title="Undo removal">
                        ↩
                      </button>
                    </div>
                    <div class="question-meta mt-1">
                      <span class="badge" :class="getDifficultyClass(question.difficulty_level)">
                        {{ question.difficulty_level || 'N/A' }}
                      </span>
                      <small class="text-muted ms-2">{{ getTopicName(question.topic_id) }}</small>
                      
                      <!-- Badges for existing questions -->
                      <span v-if="question.isExisting && !question.markedForRemoval" 
                            class="badge bg-secondary ms-2">Existing</span>
                      <span v-if="question.markedForRemoval" 
                            class="badge bg-danger ms-2">Will Be Removed</span>
                    </div>
                  </div>
                </div>
              </div>
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
      subjects: [],
      topics: [],
      grades: [],
      questions: [],
      selectedGrade: null,
      selectedSubject: null,
      selectedTopic: null,
      filters: {
        subject: '',
        topic: '',
        grade: '',
        search: ''
      },
      filteredQuestions: [],
      selectedQuestions: [],
      isLoading: false,
      error: null,
      isSaving: false,
      showDebugInfo: false,
      debugMessages: [],
      firstQuestionInspection: null
    };
  },
  watch: {
    selectedGrade() {
      this.fetchSubjects();
    },
    selectedSubject() {
      this.fetchTopics();
    },
    'filters.topic'(newTopic) {
      if (newTopic) {
        this.fetchQuestions();
      } else {
        this.questions = [];
        this.filteredQuestions = [];
      }
    },
  },
  created() {
    this.fetchGradeLevels();
    console.log('Route params:', this.$route.params);
    console.log('Assessment ID from URL:', this.$route.params.assessmentId);
    this.assessmentId = this.$route.params.assessmentId;
    console.log('Assessment ID set in created hook:', this.assessmentId);
    
    // Fetch existing questions for this assessment
    if (this.assessmentId) {
      this.fetchExistingQuestions();
    }
  },
  methods: {
    async fetchExistingQuestions() {
      if (!this.assessmentId) {
        console.warn('Assessment ID is not set, cannot fetch existing questions');
        this.error = 'Assessment ID is not set';
        this.debugMessages.push('ERROR: Assessment ID is not set, cannot fetch existing questions');
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.debugMessages.push(`Fetching existing questions for assessment ID: ${this.assessmentId}`);

      try {
        const token = localStorage.getItem('auth_token');
        
        // Try the primary endpoint first
        const response = await axios.get(`/assessments/${this.assessmentId}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.debugMessages.push(`Primary API response status: ${response.status}`);
        
        // Log the raw response structure for debugging
        const responseStructure = this.getObjectStructure(response.data);
        this.debugMessages.push(`Response structure: ${responseStructure}`);
        
        // Extract questions array from various possible response formats
        const extractedQuestions = this.extractQuestionsFromResponse(response.data);
        
        if (extractedQuestions.length > 0) {
          this.selectedQuestions = extractedQuestions.map(q => ({
            ...q,
            isExisting: true,
            markedForRemoval: false
          }));
          
          this.debugMessages.push(`Successfully loaded ${this.selectedQuestions.length} existing questions`);
          if (this.selectedQuestions.length > 0) {
            this.debugMessages.push(`First question ID: ${this.selectedQuestions[0].id}`);
          }
        } else {
          this.debugMessages.push('No valid questions found in primary API response');
          // Try fallback endpoint if primary returns empty results
          await this.fetchExistingQuestionsFallback();
        }
      } catch (error) {
        console.error('Error fetching existing questions:', error);
        this.error = `Failed to fetch existing questions: ${error.message}`;
        this.debugMessages.push(`Error with primary endpoint: ${error.message}`);
        
        // Try fallback endpoint if primary fails
        await this.fetchExistingQuestionsFallback();
      } finally {
        this.isLoading = false;
      }
    },

    // Helper method to extract the structure of an object for debugging
    getObjectStructure(obj) {
      if (Array.isArray(obj)) {
        return `Array with ${obj.length} items${obj.length > 0 ? ` (first item keys: ${Object.keys(obj[0]).join(', ')})` : ''}`;
      } else if (obj && typeof obj === 'object') {
        return `Object with keys: ${Object.keys(obj).join(', ')}`;
      } else {
        return `${typeof obj}: ${JSON.stringify(obj).substring(0, 100)}`;
      }
    },
    
    // Helper method to extract questions array from various response formats
    extractQuestionsFromResponse(data) {
      let questionsData = data;
      let extractionPath = 'direct';
      
      // Case 1: Direct array of questions
      if (Array.isArray(data)) {
        extractionPath = 'direct array';
      }
      // Case 2: Object with questions property
      else if (data && typeof data === 'object' && data.questions) {
        questionsData = data.questions;
        extractionPath = 'data.questions';
      }
      // Case 3: Object with data property containing questions
      else if (data && typeof data === 'object' && data.data) {
        if (Array.isArray(data.data)) {
          questionsData = data.data;
          extractionPath = 'data.data (array)';
        } else if (data.data.questions) {
          questionsData = data.data.questions;
          extractionPath = 'data.data.questions';
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(questionsData)) {
        this.debugMessages.push(`Failed to extract questions array from response (path: ${extractionPath})`);
        return [];
      }
      
      // Filter valid questions (must have id and question properties)
      const validQuestions = questionsData.filter(q => q && q.id && q.question);
      this.debugMessages.push(`Extracted ${validQuestions.length}/${questionsData.length} valid questions via ${extractionPath}`);
      
      return validQuestions;
    },

    async fetchExistingQuestionsFallback() {
      this.debugMessages.push(`Trying fallback endpoint for assessment ID: ${this.assessmentId}`);
      
      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await axios.get(`/questions?assessment_id=${this.assessmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.debugMessages.push(`Fallback API response status: ${response.status}`);
        
        // Log the raw response structure for debugging
        const responseStructure = this.getObjectStructure(response.data);
        this.debugMessages.push(`Fallback response structure: ${responseStructure}`);
        
        // Extract questions array from various possible response formats
        const extractedQuestions = this.extractQuestionsFromResponse(response.data);
        
        if (extractedQuestions.length > 0) {
          this.selectedQuestions = extractedQuestions.map(q => ({
            ...q,
            isExisting: true,
            markedForRemoval: false
          }));
          
          this.debugMessages.push(`Successfully loaded ${this.selectedQuestions.length} existing questions from fallback`);
          if (this.selectedQuestions.length > 0) {
            this.debugMessages.push(`First fallback question ID: ${this.selectedQuestions[0].id}`);
          }
        } else {
          this.debugMessages.push('No valid questions found in fallback API response');
        }
      } catch (error) {
        console.error('Error fetching existing questions from fallback:', error);
        this.error = `Failed to fetch existing questions (fallback also failed): ${error.message}`;
        this.debugMessages.push(`Error with fallback endpoint: ${error.message}`);
      }
    },
    
    getSubjectName(subjectId) {
      const subject = this.subjects.find(s => s.id == subjectId);
      return subject ? subject.name : 'Unknown';
    },
    getTopicName(topicId) {
      const topic = this.topics.find(t => t.id == topicId);
      return topic ? topic.topic_name : 'Unknown';
    },
    getGradeName(gradeId) {
      const grade = this.grades.find(g => g.id == gradeId);
      return grade ? grade.grade_name : 'Unknown';
    },
    getDifficultyClass(difficulty) {
      // Map Bloom's Taxonomy levels to Bootstrap color classes
      const bloomLevels = {
        'remembering': 'bg-primary',      // Basic recall of information
        'understanding': 'bg-info',       // Understanding meaning
        'applying': 'bg-success',         // Using information in new situations
        'analyzing': 'bg-warning',        // Breaking down into parts
        'evaluating': 'bg-dark',        // Making judgments (using purple from Bootstrap's extended colors)
        'creating': 'bg-danger',          // Creating new ideas/products
      };
      
      // Default to secondary if difficulty level is not recognized
      return bloomLevels[difficulty?.toLowerCase()] || 'bg-secondary';
    },
    formatQuestionText(text) {
      if (!text) return '';
      // Convert newlines to <br> and handle basic HTML formatting
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\$(.*?)\$/g, (match, equation) => {
          // This is where we'll handle math equations with KaTeX
          // For now, just return the equation in a span with a class for later processing
          return `<span class="math-equation">${equation}</span>`;
        });
    },
    async fetchGradeLevels() {
      try {
        const res = await axios.get('/grade-levels');
        this.grades = res.data;
      } catch (err) {
        console.error("Failed to fetch grade levels:", err);
        this.error = 'Failed to load grade levels';
      }
    },
    async fetchSubjects() {
      if (!this.selectedGrade) return;
      try {
        const res = await axios.get(`/grade-levels/${this.selectedGrade}/subjects`);
        this.subjects = res.data;
        this.topics = [];
        this.selectedSubject = '';
        this.filters.topic = '';
        this.fetchQuestions();
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        this.error = 'Failed to load subjects';
      }
    },
    async fetchTopics() {
      if (!this.selectedGrade || !this.selectedSubject) return;
      try {
        const res = await axios.get(`/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/units`);
        this.topics = res.data || [];
        this.selectedTopic = '';
        this.fetchQuestions();
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        this.error = 'Failed to load topics';
      }
    },
    async fetchQuestions() {
      this.isLoading = true;
      this.error = null; // Clear any previous errors
      try {
        if (this.filters.topic) {
          const res = await axios.get(`/topics/${this.filters.topic}/questions`);
          // Check if response has data property and it's an array
          if (res.data && Array.isArray(res.data.data)) {
            this.questions = res.data.data;
            this.filteredQuestions = [...this.questions];
          } else {
            this.questions = [];
            this.filteredQuestions = [];
            console.warn('Unexpected API response format:', res.data);
          }
        } else {
          this.questions = [];
          this.filteredQuestions = [];
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        this.error = 'Failed to load questions';
        this.questions = [];
        this.filteredQuestions = [];
      } finally {
        this.isLoading = false;
      }
    },
    filterQuestions() {
      if (!this.questions) return;
      
      this.filteredQuestions = this.questions.filter(q => {
        const matchesSubject = this.selectedSubject ? q.subject_id == this.selectedSubject : true;
        const matchesTopic = this.filters.topic ? q.topic_id == this.filters.topic : true;
        const matchesSearch = this.filters.search ? 
          q.question_text.toLowerCase().includes(this.filters.search.toLowerCase()) : true;
          
        return matchesSubject && matchesTopic && matchesSearch;
      });
    },
    selectQuestion(question) {
      if (!this.isSelected(question)) {
        this.selectedQuestions.push({...question});
      }
    },
    removeQuestion(question) {
      const index = this.selectedQuestions.findIndex(q => q.id === question.id);
      if (index !== -1) {
        const existingQuestion = this.selectedQuestions[index];
        
        // If it's an existing question, mark it for removal instead of removing it
        if (existingQuestion.isExisting) {
          this.$set(this.selectedQuestions[index], 'markedForRemoval', true);
        } else {
          // If it's a newly added question, just remove it from the array
          this.selectedQuestions.splice(index, 1);
        }
      }
    },
    undoRemoveQuestion(question) {
      const index = this.selectedQuestions.findIndex(q => q.id === question.id);
      if (index !== -1 && this.selectedQuestions[index].markedForRemoval) {
        // Remove the markedForRemoval flag
        this.$set(this.selectedQuestions[index], 'markedForRemoval', false);
      }
    },
    
    checkAssessmentId() {
      this.debugMessages = [];
      
      // Add assessment ID info
      this.debugMessages.push(`Assessment ID from route: ${this.$route.params.assessmentId}`);
      this.debugMessages.push(`Current assessmentId value: ${this.assessmentId}`);
      
      // Check if assessment ID is valid
      if (!this.assessmentId) {
        this.debugMessages.push('ERROR: Assessment ID is not set!');
      } else {
        this.debugMessages.push('Assessment ID appears to be set correctly.');
      }
      
      // Check selected questions
      this.debugMessages.push(`Selected questions count: ${this.selectedQuestions.length}`);
      if (this.selectedQuestions.length > 0) {
        const existingCount = this.selectedQuestions.filter(q => q.isExisting).length;
        this.debugMessages.push(`Existing questions count: ${existingCount}`);
        
        // Log first question for inspection
        const firstQuestion = this.selectedQuestions[0];
        this.debugMessages.push(`First question ID: ${firstQuestion.id}`);
        this.debugMessages.push(`First question isExisting: ${firstQuestion.isExisting}`);
        this.debugMessages.push(`First question has question property: ${!!firstQuestion.question}`);
      }
    },
    
    resetAndRetry() {
      this.debugMessages = [];
      this.debugMessages.push('Resetting and retrying...');
      
      // Reset state
      this.selectedQuestions = [];
      this.error = null;
      
      // Re-fetch assessment ID from route
      this.assessmentId = this.$route.params.assessmentId;
      this.debugMessages.push(`Reset assessment ID to: ${this.assessmentId}`);
      
      // Retry fetching existing questions
      if (this.assessmentId) {
        this.fetchExistingQuestions();
        this.debugMessages.push('Triggered fetchExistingQuestions().');
      } else {
        this.debugMessages.push('ERROR: Cannot fetch questions without assessment ID.');
      }
    },
    
    async testDirectApiCall() {
      this.debugMessages = [];
      this.debugMessages.push('Testing direct API calls...');
      
      // Check axios base URL configuration
      this.debugMessages.push(`Axios base URL: ${axios.defaults.baseURL || 'Not set'}`);
      
      if (!this.assessmentId) {
        this.debugMessages.push('ERROR: Assessment ID is not set, cannot test API');
        return;
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.debugMessages.push('ERROR: No auth token found in localStorage');
      } else {
        this.debugMessages.push(`Auth token found: ${token.substring(0, 10)}...`);
      }
      
      // Test primary endpoint
      try {
        this.debugMessages.push(`Testing primary endpoint: /assessments/${this.assessmentId}/questions`);
        const primaryResponse = await axios.get(`/assessments/${this.assessmentId}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.debugMessages.push(`✅ Primary endpoint status: ${primaryResponse.status}`);
        const primaryStructure = this.getObjectStructure(primaryResponse.data);
        this.debugMessages.push(`Primary response structure: ${primaryStructure}`);
        
        // Check if we can extract questions
        const primaryQuestions = this.extractQuestionsFromResponse(primaryResponse.data);
        this.debugMessages.push(`Primary endpoint questions count: ${primaryQuestions.length}`);
      } catch (error) {
        this.debugMessages.push(`❌ Primary endpoint error: ${error.message}`);
        if (error.response) {
          this.debugMessages.push(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
        }
      }
      
      // Test fallback endpoint
      try {
        this.debugMessages.push(`Testing fallback endpoint: /questions?assessment_id=${this.assessmentId}`);
        const fallbackResponse = await axios.get(`/questions?assessment_id=${this.assessmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.debugMessages.push(`✅ Fallback endpoint status: ${fallbackResponse.status}`);
        const fallbackStructure = this.getObjectStructure(fallbackResponse.data);
        this.debugMessages.push(`Fallback response structure: ${fallbackStructure}`);
        
        // Check if we can extract questions
        const fallbackQuestions = this.extractQuestionsFromResponse(fallbackResponse.data);
        this.debugMessages.push(`Fallback endpoint questions count: ${fallbackQuestions.length}`);
      } catch (error) {
        this.debugMessages.push(`❌ Fallback endpoint error: ${error.message}`);
        if (error.response) {
          this.debugMessages.push(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
        }
      }
      
      // Test general questions endpoint
      try {
        this.debugMessages.push(`Testing general questions endpoint: /questions`);
        const generalResponse = await axios.get(`/questions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.debugMessages.push(`✅ General endpoint status: ${generalResponse.status}`);
        const generalStructure = this.getObjectStructure(generalResponse.data);
        this.debugMessages.push(`General response structure: ${generalStructure}`);
        
        // Check if we can extract questions
        const generalQuestions = this.extractQuestionsFromResponse(generalResponse.data);
        this.debugMessages.push(`General endpoint questions count: ${generalQuestions.length}`);
      } catch (error) {
        this.debugMessages.push(`❌ General endpoint error: ${error.message}`);
        if (error.response) {
          this.debugMessages.push(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
        }
      }
    },
    
    toggleQuestion(question) {
      const index = this.selectedQuestions.findIndex(q => q.id === question.id);
      
      // If question is already in the list
      if (index !== -1) {
        const existingQuestion = this.selectedQuestions[index];
        
        // If it's an existing question (already in assessment), mark it for removal
        if (existingQuestion.isExisting) {
          // Toggle the markedForRemoval flag
          this.$set(this.selectedQuestions[index], 'markedForRemoval', 
                   !existingQuestion.markedForRemoval);
        } else {
          // If it's a newly added question, just remove it from selection
          this.selectedQuestions.splice(index, 1);
        }
      } else {
        // Add new question to selection
        this.selectedQuestions.push({...question});
      }
    },
    scrollToQuestion(questionId) {
      const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        questionElement.classList.add('highlight-question');
        setTimeout(() => {
          questionElement.classList.remove('highlight-question');
        }, 2000);
      }
    },
    isSelected(question) {
      const selectedQuestion = this.selectedQuestions.find(q => q.id === question.id);
      return selectedQuestion && !selectedQuestion.markedForRemoval;
    },
    
    isExistingQuestion(question) {
      return this.selectedQuestions.some(q => q.id === question.id && q.isExisting);
    },
    
    isMarkedForRemoval(question) {
      const selectedQuestion = this.selectedQuestions.find(q => q.id === question.id);
      return selectedQuestion && selectedQuestion.isExisting && selectedQuestion.markedForRemoval;
    },
    showToast(message, type = 'info') {
      // Get or create toast container
      const toastContainer = document.getElementById('toast-container') || (() => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
        return container;
      })();

      const toastId = 'toast-' + Date.now();
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = `toast show align-items-center text-white bg-${type} border-0`;
      toast.role = 'alert';
      toast.style.minWidth = '250px';
      
      const toastBody = document.createElement('div');
      toastBody.className = 'd-flex';
      
      const toastContent = document.createElement('div');
      toastContent.className = 'toast-body';
      toastContent.textContent = message;
      
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'btn-close btn-close-white me-2 m-auto';
      closeButton.setAttribute('data-bs-dismiss', 'toast');
      closeButton.setAttribute('aria-label', 'Close');
      
      toastBody.appendChild(toastContent);
      toastBody.appendChild(closeButton);
      toast.appendChild(toastBody);
      toastContainer.appendChild(toast);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.remove();
        }
      }, 5000);
    },
    
    async saveSelection() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.showToast('User is not authenticated', 'danger');
        return;
      }
      
      // Get assessmentId from route params
      const assessmentId = this.$route.params.assessmentId;
      if (!assessmentId) {
        this.showToast('Assessment ID is missing', 'danger');
        return;
      }
      
      // Separate questions into categories
      const newQuestions = this.selectedQuestions.filter(q => !q.isExisting);
      const questionsToRemove = this.selectedQuestions.filter(q => q.isExisting && q.markedForRemoval);
      const unchangedQuestions = this.selectedQuestions.filter(q => q.isExisting && !q.markedForRemoval);
      
      // Check if there are any changes to make
      if (newQuestions.length === 0 && questionsToRemove.length === 0) {
        this.showToast('No changes to save', 'warning');
        return;
      }
      
      this.isSaving = true;
      console.log('New questions:', newQuestions.map(q => q.id));
      console.log('Questions to remove:', questionsToRemove.map(q => q.id));
      console.log('Unchanged questions:', unchangedQuestions.map(q => q.id));
      
      try {
        // Since we don't have a specific endpoint for removing questions,
        // we'll just send the final list of questions to keep
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL || ''}/assessments/${assessmentId}/questions`,
          { 
            question_ids: [...newQuestions, ...unchangedQuestions].map(q => q.id),
            assessment_id: parseInt(assessmentId),
            replace_all: questionsToRemove.length > 0 // If we're removing questions, replace the entire list
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          }
        );
        
        console.log('Save successful:', response.data);
        
        // Create appropriate success message
        let message = '';
        if (newQuestions.length > 0 && questionsToRemove.length > 0) {
          message = `Added ${newQuestions.length} question${newQuestions.length !== 1 ? 's' : ''} and removed ${questionsToRemove.length} question${questionsToRemove.length !== 1 ? 's' : ''}`;
        } else if (newQuestions.length > 0) {
          message = `Added ${newQuestions.length} question${newQuestions.length !== 1 ? 's' : ''} to assessment`;
        } else if (questionsToRemove.length > 0) {
          message = `Removed ${questionsToRemove.length} question${questionsToRemove.length !== 1 ? 's' : ''} from assessment`;
        }
        
        this.showToast(message, 'success');
        // this.$router.push({ name: 'assessment-edit', params: { id: assessmentId } });
        this.$router.push({ name: 'AssessmentList' });
      } catch (err) {
        console.error('Failed to add questions to assessment:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            data: err.config?.data
          }
        });
        
        const errorMessage = err.response?.data?.message || 'Failed to add questions to assessment';
        this.error = errorMessage;
        this.showToast(`Error: ${errorMessage}`, 'danger');
      } finally {
        this.isSaving = false;
      }
    }
  },
  
};
</script>

<style scoped>
.selected-questions-container {
  position: sticky;
  top: 1rem;
  height: calc(100vh - 2rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.selected-questions-list {
  overflow-y: auto;
  flex: 1;
  padding: 1rem;
}

.selected-question-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-question-item:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.question-preview {
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.question-number {
  font-weight: bold;
  margin-right: 0.5rem;
  color: #0d6efd;
}

.question-text {
  display: inline;
}

.question-text :deep(*) {
  display: inline;
  margin: 0;
  padding: 0;
  line-height: inherit;
}

.question-meta {
  font-size: 0.8rem;
}

/* Make sure the card takes full height */
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Custom scrollbar for selected questions */
.selected-questions-list::-webkit-scrollbar {
  width: 6px;
}

.selected-questions-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.selected-questions-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.selected-questions-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Highlight animation for questions */
@keyframes highlight {
  0% { box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(13, 110, 253, 0.1); }
  100% { box-shadow: 0 0 0 3px rgba(13, 110, 253, 0); }
}

.highlight-question {
  animation: highlight 2s ease-out;
  transition: all 0.3s ease;
}

/* Styles for existing questions and those marked for removal */
.existing-question {
  opacity: 0.8;
}

.marked-for-removal {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Ensure the selected questions panel stays fixed */
.selected-questions-container {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
  background: white;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

/* Make the card take full height of its container */
.selected-questions-container .card {
  height: 100%;
  margin: 0;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

/* Ensure the questions list takes remaining space and scrolls */
.selected-questions-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
}

/* Style the remove button */
.selected-question-item .btn-outline-danger {
  padding: 0.1rem 0.4rem;
  line-height: 1;
  border-radius: 50%;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: all 0.2s;
}

.selected-question-item:hover .btn-outline-danger {
  opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 991.98px) {
  .selected-questions-container {
    position: static;
    max-height: none;
    margin-top: 2rem;
  }
  
  .selected-questions-list {
    max-height: 300px;
  }
}
.question-list {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 10px;
}

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

.card {
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.border-primary {
  border: 2px solid #0d6efd !important;
}

.option-letter {
  font-weight: bold;
  color: #6c757d;
}

.text-success {
  color: #198754 !important;
}

.bg-success {
  background-color: #198754 !important;
}

.bg-warning {
  background-color: #ffc107 !important;
  color: #000;
}

.bg-danger {
  background-color: #dc3545 !important;
}

.bg-info {
  background-color: #0dcaf0 !important;
}

.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
}

.form-check-input {
  margin-top: 0.3em;
}

.sticky-top {
  position: -webkit-sticky;
  position: sticky;
  top: 1rem;
  z-index: 1020;
}

.option-item {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.option-item:hover {
  background-color: #e9ecef;
}

.option-item.text-success {
  background-color: #d1e7dd;
  border-color: #a3cfbb;
}

.explanation {
  border-top: 1px solid #eee;
  padding-top: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .question-list {
    max-height: 50vh;
    margin-bottom: 1rem;
  }
  
  .sticky-top {
    position: static;
  }
}

/* Animation for selected items */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.list-group-item {
  animation: fadeIn 0.3s ease-out;
}

/* Loading spinner */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Text truncation */
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Difficulty badges */
.bg-easy { background-color: #198754; }
.bg-medium { background-color: #ffc107; color: #000; }
.bg-hard { background-color: #dc3545; }
.bg-unknown { background-color: #6c757d; }
</style>


<style scoped>
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

/* Pagination styles */
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
</style>