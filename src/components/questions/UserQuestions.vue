<template>
  <div class="container py-4">
    <!-- Edit Question Modal -->
    <div class="modal fade" id="editQuestionModal" tabindex="-1" aria-labelledby="editQuestionModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editQuestionModalLabel">Edit Question</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <QuestionFormWithMathKaTeX
              v-if="editingQuestion"
              :edit-question="editingQuestion"
              @saved="handleQuestionSaved"
              @cancel="closeEditModal"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">My Questions</h3>
      <div class="text-muted small">
        <span class="badge bg-light text-dark me-2">
          <i class="bi bi-grid-3x3-gap-fill me-1"></i>
          {{ Object.keys(groupedQuestions).length }} Topics
        </span>
      </div>
    </div>

    <div v-if="loading" class="text-center text-muted">Loading questions...</div>

    <div v-else>
      <div v-if="Object.keys(groupedQuestions).length === 0" class="text-center text-muted">
        No questions found.
      </div>

      <div v-else>
        <div v-for="(questions, topic) in groupedQuestions" :key="topic" class="mb-4">
          <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded-top">
            <h5 class="mb-0 fw-bold">
              <i class="bi bi-collection me-2"></i>{{ topic }}
            </h5>
            <span class="badge bg-primary">{{ questions.length }} questions</span>
          </div>
          <ul class="list-group">
            <li v-for="(q, qIndex) in questions" :key="q.id" class="list-group-item d-flex justify-content-between align-items-start border-start-0 border-end-0 rounded-0" :class="{ 'border-top-0': qIndex === 0 }">
              <div style="min-width:0;">
                <div class="d-flex align-items-start mb-2">
                  <span class="badge bg-primary bg-opacity-10 text-primary me-2">Q{{ qIndex + 1 }}</span>
                  <div v-html="renderMath(q.question)" class="flex-grow-1"></div>
                </div>
                <div v-if="q.question_type === 'mcq' && getOptions(q).length" class="mt-3 ms-1">
                  <div v-for="(opt, oidx) in getOptions(q)" :key="oidx" class="d-flex align-items-start mb-2">
                    <div class="d-flex align-items-start w-100">
                      <span class="me-2 mt-1" v-if="isCorrectOption(q.correct_answer, opt)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </span>
                      <span v-else class="me-2 mt-1" style="width: 18px"></span>
                      <div class="d-flex flex-column">
                        <div class="d-flex align-items-center">
                          <span class="fw-bold me-2 text-muted">{{ String.fromCharCode(65 + oidx) }}.</span>
                          <span v-html="renderMath(getOptionValue(opt))" class="flex-grow-1"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="q.question_type === 'true_false'" class="mt-3">
                  <div class="d-flex align-items-center">
                    <span class="badge bg-info bg-opacity-10 text-info me-3">
                      <i class="bi bi-ui-radios me-1"></i>True/False
                    </span>
                    <span class="fw-bold" :class="{
                      'text-success': q.correct_answer === 'true',
                      'text-danger': q.correct_answer === 'false'
                    }">
                      <i v-if="q.correct_answer === 'true'" class="bi bi-check-circle-fill me-1"></i>
                      <i v-else class="bi bi-x-circle-fill me-1"></i>
                      {{ capitalize(q.correct_answer) }}
                    </span>
                  </div>
                </div>
                <div v-else-if="q.question_type === 'short_answer'" class="mt-3">
                  <div class="d-flex align-items-center">
                    <span class="badge bg-warning bg-opacity-10 text-warning me-3">
                      <i class="bi bi-chat-square-text me-1"></i>Short Answer
                    </span>
                    <div class="bg-light p-2 rounded">
                      <code class="text-dark">{{ q.correct_answer }}</code>
                    </div>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-3 mt-3 pt-2 border-top">
                  <span class="text-muted small">
                    <i class="bi bi-tag me-1"></i>
                    <span class="text-capitalize">{{ q.question_type.replace('_', ' ') }}</span>
                  </span>
                  <span class="small" :class="getDifficultyClass(q.difficulty_level)">
                    <i class="bi bi-speedometer2 me-1"></i>
                    <span class="text-capitalize">{{ q.difficulty_level }}</span>
                  </span>
                  <span class="text-muted small">
                    <i class="bi bi-star-fill me-1 text-warning"></i>
                    {{ q.marks }} {{ q.marks === 1 ? 'mark' : 'marks' }}
                  </span>
                </div>
              </div>

              <!-- <div class="btn-group btn-group-sm" role="group">
                <button 
                  class="btn btn-outline-primary d-flex align-items-center" 
                  @click="editQuestion(q)"
                  title="Edit question"
                >
                  <i class="bi bi-pencil-square me-1"></i>
                  <span class="d-none d-sm-inline">Edit</span>
                </button>
                <button 
                  class="btn btn-outline-danger d-flex align-items-center" 
                  @click="deleteQuestion(q.id)"
                  title="Delete question"
                >
                  <i class="bi bi-trash me-1"></i>
                  <span class="d-none d-sm-inline">Delete</span>
                </button>
              </div> -->
            </li>
          </ul>
        </div>

        <!-- Pagination -->
        <nav aria-label="Page navigation" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="fetchQuestions(currentPage - 1)">Previous</a>
            </li>
            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
              <a class="page-link" href="#" @click.prevent="fetchQuestions(page)">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="fetchQuestions(currentPage + 1)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Modal } from 'bootstrap';
import QuestionFormWithMathKaTeX from '../QuestionFormWithMathKaTeX.vue';
import { renderMath as renderMathUtil } from '@/utils/mathRenderer';
import { renderMarkdown } from "@/utils/markdownRenderer";

export default {
  name: "MyQuestions",
  data() {
    return {
      questions: [],
      groupedQuestions: {},
      currentPage: 1,
      totalPages: 1,
      loading: false,
      editingQuestion: null,
      editModal: null,
      selectedSubject: '',
      selectedTopic: '',
      selectedGrade: '',
    };
  },
  components: {
    QuestionFormWithMathKaTeX
  },
  methods: {
    openEditModal() {
      if (!this.editModal) {
        this.editModal.show();
      }
    },
    closeEditModal() {
      if (this.editModal) {
        this.editModal.hide();
      }
      this.editingQuestion = null;
    },
    handleQuestionSaved() {
      this.closeEditModal();
      this.fetchQuestions(this.currentPage);
      this.$emit('question-updated');
    },
    getDifficultyClass(level) {
      const classes = {
        'easy': 'text-success',
        'medium': 'text-warning',
        'hard': 'text-danger'
      };
      return classes[level.toLowerCase()] || 'text-muted';
    },
    async fetchQuestions(page = 1) {
      this.loading = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get(`/my-questions?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend returns grouped questions in `data`
        this.groupedQuestions = res.data.data || {};
        this.currentPage = res.data.pagination.current_page;
        this.totalPages = res.data.pagination.last_page;
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        this.loading = false;
      }
    },

    renderMath(content) {
      if (!content) return "";
      try {
        if(/^(\$\$.*\$\$|\$[^\$]*\$)$/.test(content)){
          return renderMathUtil(content);
        }
        let result = content;
        result = result.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
          return renderMathUtil(`$$${tex}$$`);
        });
        result = result.replace(/\$([^\$]+)\$/g, (match, tex) => {
          return renderMathUtil(`$${tex}$`);
        });
        return result;
      } catch (err) {
        console.warn('Math rendering error:', err);
        return this.renderMarkdown(content);
      }
    },
    renderMarkdown(content){
      if(!content) return "";
      try{
        content = content.replace(/\$(.+?)\$/g, (match, text) => katex.renderToString(text, {
          throwOnError: false,
          displayMode: false,
        })
      );
      content = content.replace(/\$\$([^$]+)\$\$/g, (match, text) => katex.renderToString(text, {
        throwOnError: false,
        displayMode: true,
      })
      );
    return content;
      }catch(err){
        return content;
      }
    },
    isCorrectOption(correct, opt) {
      if (!correct) return false;
      const normalize = (val) => String(val).toLowerCase();
      if (Array.isArray(correct)) {
        return correct.map(normalize).includes(normalize(opt));
      }
      try {
        const parsed = JSON.parse(correct);
        if (Array.isArray(parsed)) {
          return parsed.map(normalize).includes(normalize(opt));
        }
        return normalize(parsed) === normalize(opt);
      } catch {
        return normalize(correct) === normalize(opt);
      }
    },
    capitalize(value) {
      if (!value) return "";
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    },
    getOptions(q) {
      if (!q.options) return [];
      if (Array.isArray(q.options)) return q.options;
      try {
        const parsed = JSON.parse(q.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    getOptionValue(opt) {
      return typeof opt === "object" && opt !== null ? opt.value || "" :opt;
    },

    async editQuestion(question) {
      try {
        if (!question || !question.id) {
          throw new Error('Invalid question data');
        }
        
        console.log('Editing question ID:', question.id);
        this.loading = true;
        const token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error('Authentication required');
        }
        
        console.log('Making request to fetch question...');
        const response = await axios.get(`/questions/${question.id}`, {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        });
        
        console.log('Response received:', response);
        
        if (response.status === 200 && response.data) {
          // Handle both nested and direct response formats
          const questionData = response.data.data || response.data;
          console.log('Question data:', questionData);
          if (questionData) {
            this.editingQuestion = questionData;
            this.$nextTick(() => {
              console.log('Opening edit modal...');
              this.openEditModal();
            });
            return;
          }
        }
        
        // Handle error responses
        const errorMessage = response?.data?.message || 'Invalid response format';
        throw new Error(errorMessage);
        
      } catch (error) {
        console.error('Error in editQuestion:', error);
        let errorMessage = 'Failed to load question for editing';
        
        if (error && typeof error === 'object') {
          if (error.response) {
            // Server responded with error status (4xx, 5xx)
            errorMessage = error.response.data?.message || 
                         error.response.statusText || 
                         `Server error: ${error.response.status}`;
          } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from server. Please check your connection.';
          } else if (error.message) {
            // Something else happened
            errorMessage = error.message;
          }
        }
        
        console.error('Error details:', { error, message: errorMessage });
        this.$toast.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    deleteQuestion(questionId) {
      if (!confirm("Are you sure you want to delete this question?")) return;
      // Call backend to delete the question
      console.log("Delete question ID:", questionId);
    },
  },
  mounted() {
    this.fetchQuestions();
    // Initialize Bootstrap modal when component mounts
    this.$nextTick(() => {
      const modalEl = document.getElementById('editQuestionModal')
      if (modalEl) {
        this.editModal = new Modal(modalEl, { backdrop: 'static' })
      }
    });
  },
  beforeUnmount() {
    // Clean up the modal instance when component is unmounted
    if (this.editModal) {
      this.editModal.dispose();
      this.editModal = null;
    }
  },
};
</script>

<style scoped>
.list-group-item {
  transition: all 0.2s ease;
  border-left: 0;
  border-right: 0;
}

.list-group-item:first-child {
  border-top: 0;
}

.list-group-item:last-child {
  border-bottom: 0;
}

.option-item {
  transition: all 0.2s ease;
  border-radius: 6px;
  padding: 8px 12px;
}

.option-item:hover {
  background-color: #f8f9fa;
}

.option-item.correct {
  background-color: #e8f5e9;
  border-left: 3px solid #4caf50;
}

.text-easy { color: #28a745; }
.text-medium { color: #ffc107; }
.text-hard { color: #dc3545; }

.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
}

.btn-outline-primary, .btn-outline-danger {
  transition: all 0.2s;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: white;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.bg-light {
  background-color: #f8f9fa !important;
}
</style>
