<template>
  <div class="questions-list container-fluid p-4 bg-white rounded shadow-sm">
    <h2 class="section-title mb-4">Question Management</h2>
    <div class="filter-section mb-4">
      <form class="row g-3 align-items-end">
        
        <div class="col-md-3">
          <label for="grade_level_id" class="form-label">Grade Level</label>
          <select v-model="selectedGrade" id="grade_level_id"  class="form-select" >
            <option :value="''" disabled>Select grade</option>
            <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">{{ grade.grade_name }}</option>
          </select>
        </div>
        <div class="col-md-3" v-if="subjects.length">
          <label for="subject_id" class="form-label">Subject</label>
          <select v-model="selectedSubject" id="subject_id" class="form-select">
            <option value="" disabled>Select subject</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>
        <div class="col-md-3" v-if="topics.length">
          <label for="topic_id" class="form-label">Topic</label>
          <div class="input-group">
            <select v-model="selectedTopic" id="topic_id" @change="fetchQuestions" class="form-select">
              <option value="" disabled>Select topic</option>
              <option v-for="topic in topics" :key="topic.id" :value="topic.id">{{ topic.topic_name }}</option>
            </select>
          </div>
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button
            type="button"
            @click="openAddModal"
            class="btn btn-primary w-100"
            :disabled="!selectedSubject || !selectedTopic"
            :style="(!selectedSubject || !selectedTopic) ? 'opacity:0.6;cursor:not-allowed;' : ''"
            title="Add a new question to this topic"
          >
            <span class="fw-bold">+</span> Add Question
          </button>
        </div>
      </form>
    </div>
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="text-primary fw-semibold">Loading questions...</div>
    </div>
    <div v-else-if="filteredQuestions.length === 0 && selectedTopic" class="no-questions">
      <div class="text-center py-5 text-muted">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
        </svg>
        <p class="mt-3">No questions found for this topic.</p>
        <button type="button" @click="openAddModal" class="btn btn-outline-primary mt-2" title="Add your first question">
          <span class="fw-bold">+</span> Add First Question
        </button>
      </div>
    </div>
    <div v-else class="questions-container">
      <div v-for="(q, idx) in questions" :key="q.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-bold text-secondary">#{{ idx + 1 }}</div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-light text-dark border me-1">{{ q.question_type ? q.question_type.replace('_', ' ') : (q.is_chemistry ? 'Chemistry' : (q.is_math ? 'Math' : 'Text')) }}</span>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="openEditModal(q)" title="Edit question">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span class="ms-1">Edit</span>
            </button>
          </div>
          <div class="mb-2">
            <span class="fw-semibold" v-html="renderMarkdown(q.question)"></span>
            <img v-if="q.question_image_url" :src="q.question_image_url" alt="Question Image" class="img-thumbnail ms-2" style="max-width:180px;max-height:120px;object-fit:contain;" />
          </div>
          <div>
            <!-- MCQ options -->
            <template v-if="q.question_type === 'mcq' && Array.isArray(q.options)">
              <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, getOptionValue(opt))}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                <label class="form-check-label" v-html="renderMarkdown(getOptionValue(opt))"></label>
              </div>
            </template>
            <!-- True/False -->
            <template v-else-if="q.question_type === 'true_false'">
              <div class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, 'True')}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, 'True')" disabled />
                <label class="form-check-label">True</label>
              </div>
              <div class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, 'False')}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, 'False')" disabled />
                <label class="form-check-label">False</label>
              </div>
            </template>
            <!-- Short Answer -->
            <template v-else-if="q.question_type === 'short_answer'">
              <div class="form-text">Short Answer: <strong v-html="renderMarkdown(q.correct_answer)"></strong></div>
            </template>
            <!-- Other options -->
            <template v-else-if="Array.isArray(q.options)">
              <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, getOptionValue(opt))}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                <label class="form-check-label" v-html="renderMarkdown(getOptionValue(opt))"></label>
              </div>
            </template>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="badge bg-light text-dark">{{ q.marks || 1 }} {{ q.marks === 1 ? 'point' : 'points' }}</span>
            <div>
              <span v-if="q.difficulty" class="badge bg-warning text-dark me-1">{{ q.difficulty }}</span>
              <span v-if="q.required" class="badge bg-primary">Required</span>
            </div>
          </div>
          <div v-if="q.explanation" class="alert alert-info mt-2 p-2">
            <div class="fw-semibold">Explanation:</div>
            <div>{{ q.explanation }}</div>
          </div>
          <!-- Insert add form after last question -->
          <div v-if="showAddInline" class="mt-4">
            <div class="card card-body shadow-sm">
              <QuestionForm
                :subject-id="selectedSubject"
                :topic-id="selectedTopic"
                :selected-grade-filter="selectedGradeFilter"
                :compact="true"
                hide-meta
                @created="onCreatedInline"
                @cancel="closeAddInline"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- If no questions, show add form at top -->
      <div v-if="showAddInline" class="mt-4">
        <div class="card card-body shadow-sm">
          <QuestionForm
            :subject-id="selectedSubject"
            :topic-id="selectedTopic"
            :selected-grade-filter="selectedGradeFilter"
            :compact="true"
            hide-meta
            @created="onCreatedInline"
            @cancel="closeAddInline"
          />
        </div>
      </div>

      <!-- Add Question button after the last question -->
      <div v-if="questions.length > 0 && !showAddInline" class="d-flex justify-content-center mt-4">
        <button type="button" @click="openAddModal" class="btn btn-outline-primary" title="Add another question">
          <span class="fw-bold">+</span> Add Question
        </button>
      </div>
    </div>

    <!-- Modal for edit only -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.25);" @click.self="closeModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Question</h5>
            <button type="button" class="btn-close" @click="closeModal" title="Close"></button>
          </div>
          <div class="modal-body">
            <QuestionForm
              v-if="showModal"
              :edit-question="editingQuestion"
              :subject-id="selectedSubject"
              :topic-id="selectedTopic"
              :selected-grade-filter="selectedGradeFilter"
              @created="onSaved"
              @cancel="closeModal"
            />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import QuestionForm from './QuestionFormWithMathKaTeX.vue';
import CreateTopicInline from './CreateTopicInline.vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default {
  name: 'QuestionsList',
  components: { QuestionForm, CreateTopicInline },
  data() {
    return {
      selectedSubject: '',
      selectedGrade: null,
      topics: [],
      selectedTopic: '',
      questions: [],
      subjects: [],
      gradeLevels: [],
      selectedGradeFilter: '',
      loading: false,
      showModal: false,
      editingQuestion: null,
      showAddInline: false,
    };
  },
  computed: {
    filteredQuestions() {
      if (!this.selectedTopic || !Array.isArray(this.questions)) {
        return [];
      }
      return this.questions.filter(q => q.topic_id === this.selectedTopic);
    },
    processedQuestions() {
      return this.filteredQuestions.map(q => {
        const newQ = { ...q };
        // Ensure options are always an array
        if (typeof newQ.options === 'string') {
          try {
            newQ.options = JSON.parse(newQ.options);
          } catch (e) {
            console.error(`Failed to parse options for question ID ${newQ.id}:`, newQ.options);
            newQ.options = [];
          }
        }
        // Ensure correct_answer is usable
        if (typeof newQ.correct_answer === 'string') {
          try {
            newQ.correct_answer = JSON.parse(newQ.correct_answer);
          } catch (e) {
            // Not a JSON string, leave as is.
          }
        }
        return newQ;
      });
    }
  },
  created() {
    this.fetchGradeLevels();
  },
  methods: {
    getOptionValue(opt) {
      if(typeof opt ==='object' && opt !== null && opt.value) {
        return opt.value;
      }
      if (typeof opt === 'string') {
        return opt;
      }
      return opt;
    },
    renderMarkdown(content) {
      if (!content) return '';

      const processedContent = String(content);

      // A helper function to safely render with KaTeX
      const safeRender = (math, options) => {
        try {
          // Let KaTeX display its own errors gracefully
          return katex.renderToString(math, { ...options, throwOnError: false, output: 'html' });
        } catch (e) {
          // This is a fallback for unexpected errors in KaTeX itself
          console.error("KaTeX rendering error:", e);
          return `<span class="text-danger" title="${e.message}">KaTeX Error</span>`;
        }
      };

      // Regex to find all forms of delimiters.
      const regex = /\\\[(.*?)\\\]|\$\$(.*?)\$\$|\\\((.*?)\\\)|\$(.*?)\$/gs;
      
      let delimitersFound = false;
      const newContent = processedContent.replace(regex, (match, block1, block2, inline1, inline2) => {
        delimitersFound = true;
        const isBlock = block1 !== undefined || block2 !== undefined;
        const math = block1 || block2 || inline1 || inline2;
        
        if (math.trim() === '') return match;

        return safeRender(math, { displayMode: isBlock });
      });

      // If delimiters were found, we assume the content is mixed text and math.
      if (delimitersFound) {
        return newContent;
      }

      // If no delimiters were found, try to render the whole string.
      // This handles the case for the options which are pure LaTeX.
      return safeRender(processedContent, { displayMode: false });
    },
    isCorrectOption(correct, opt) {
      // Handles correct_answer as string, array, or JSON string
      if (Array.isArray(correct)) {
        return correct.map(String).includes(String(opt));
      }
      // If correct is a JSON string (e.g., '\"2\"'), parse it
      try {
        const parsed = JSON.parse(correct);
        if (Array.isArray(parsed)) {
          return parsed.map(String).includes(String(opt));
        }
        return String(parsed) === String(opt);
      } catch (e) {
        // If not JSON, fallback to string compare
        return String(correct) === String(opt);
      }
    },
    async fetchSubjects() {
      if (!this.selectedGrade) return;
      try {
        const res = await axios.get(`grade-levels/${this.selectedGrade}/subjects`);
        this.subjects = res.data;
        this.topics = [];
        this.selectedSubject = null;
        this.topicId = '';
      } catch (e) {
        this.subjects = [];
      }
    },
    
    async fetchTopics() {
      if (!this.selectedGrade || !this.selectedSubject) return;
      
      try {
        const res = await axios.get(`/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/topics`);
        this.topics = res.data || [];
        this.topicId ='';
      } catch (e) {
        this.topics = [];
        this.topicId = '';
      }
    },
    async fetchGradeLevels() {
      try {
        const response = await axios.get('/grade-levels');
        this.gradeLevels = response.data;
      } catch (e) {
        this.gradeLevels = [];
      }
    },
    async fetchQuestions() {
        this.loading = true;
        this.questions = [];
        if (!this.selectedTopic) return;
        try {
          let url = `/topics/${this.selectedTopic}/questions`;
         
          const res = await axios.get(url);
          console.log("API Response:", res.data);
          this.questions = Array.isArray(res.data) ? res.data : [];
        } catch (e) {
          console.error("Error fetching questions:", e);
          this.questions = [];
        } finally {
          this.loading = false;
        }
    },
    openAddModal() {
      this.showAddInline = true;
    },
    closeAddInline() {
      this.showAddInline = false;
    },
    onCreatedInline() {
      this.closeAddInline();
      this.fetchQuestions();
    },
    openEditModal(q) {
      this.editingQuestion = q;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingQuestion = null;
    },
    onSaved() {
      this.closeModal();
      this.fetchQuestions();
    },
  },
  watch: {
    selectedTopic(newVal) {
      if (newVal) {
        this.fetchQuestions();
      }
    },
    selectedGrade(){
      this.fetchSubjects();
    },
    selectedSubject(){
      this.fetchTopics();
    }
  },
};
</script>

<style scoped>
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}
.modal-content {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(60,72,88,0.18);
  min-width: 340px;
  max-width: 98vw;
  max-height: 98vh;
  overflow-y: auto;
  position: relative;
  animation: modalFadeIn 0.3s ease;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2em 1.5em;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}
.modal-close:hover {
  color: #4f46e5;
}
.modal-footer {
  padding: 1em 1.5em 1.5em;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  margin-top: 1em;
}
.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.7em 1.5em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Main Container Styles */
.questions-list {
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2em;
  border: 1.5px solid #e5e7eb;
}
.section-title {
  font-size: 1.6em;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1em 0;
  padding-bottom: 0.5em;
  border-bottom: 2px solid #f3f4f6;
}
.filter-section {
    max-width: 100%;
  background: #f9fafb;
  border-radius: 10px;
  padding: 1.5em;
  margin-bottom: 2em;
  border: 1px solid #e5e7eb;
}

/* Button Styles */
.add-question-btn {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7em 1.5em;
  font-size: 1.08em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 1em;
  box-shadow: 0 2px 10px rgba(99,102,241,0.10);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.add-question-btn:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}
.btn-icon {
  font-size: 1.2em;
  font-weight: 700;
  line-height: 1;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4em;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5em 0.8em;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
  border-color: #d1d5db;
}
.edit-btn:hover {
  background: #dbeafe;
  color: #2563eb;
  border-color: #93c5fd;
}

.no-questions {
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

.questions-container {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.card {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}

.form-check-label {
  vertical-align: middle;
}

.bg-success-subtle {
  background-color: #d1e7dd !important;
  border-radius: 5px;
  padding-left: 10px;
}
</style>