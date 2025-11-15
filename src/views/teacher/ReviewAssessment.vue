<template>
  <div class="container mt-4">
    <!-- Header -->
    <div class="header-section p-4 mb-5 rounded-3 shadow-sm">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <button
            class="btn btn-outline-primary me-3 rounded-pill"
            @click="$router.go(-1)"
          >
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2 class="d-inline-block mb-0 assessment-title">
            {{ assessment.title || "Assessment Review" }}
          </h2>
        </div>
        <div class="d-flex">
          <button
            class="btn btn-success me-3 rounded-pill shadow-sm"
            @click="saveOrder"
            :disabled="isSaving"
          >
            <span
              v-if="isSaving"
              class="spinner-border spinner-border-sm me-1"
              role="status"
            ></span>
            <i class="bi bi-check-circle me-1"></i>
            {{ isSaving ? "Saving..." : "Save Changes" }}
          </button>

          <button
            class="btn btn-outline-secondary me-3 rounded-pill"
            @click="openAddModal"
            :disabled="loading || isLoading"
          >
            <i class="bi bi-plus-circle me-1"></i> Add Questions
          </button>
          <div class="btn-group position-relative" role="group">
            <button
              type="button"
              class="btn btn-primary rounded-pill shadow-sm dropdown-toggle"
              :class="{ show: showDropdown }"
              @click="showDropdown = !showDropdown"
              :disabled="isLoading"
              aria-expanded="showDropdown"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
              ></span>
              <i class="bi bi-file-earmark-arrow-down me-1"></i>
              {{ isLoading ? "Generating..." : "Download PDF" }}
            </button>
            <ul
              class="dropdown-menu dropdown-menu-end shadow"
              :class="{ show: showDropdown }"
              style="position: absolute; top: 100%; right: 0"
            >
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    generatePdf();
                    showDropdown = false;
                  "
                >
                  <i class="bi bi-file-earmark-check me-2"></i>Marking Guide
                </a>
              </li>
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    generatePdfStudent();
                    showDropdown = false;
                  "
                >
                  <i class="bi bi-file-earmark-text me-2"></i>Student Version
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="assessment-meta mt-3">
        <span class="badge bg-light text-dark me-2"
          ><i class="bi bi-question-circle me-1"></i>
          {{ questions.length }} Questions</span
        >
        <span class="badge bg-light text-dark me-2" v-if="assessment.topic_id"
          ><i class="bi bi-bookmark me-1"></i> Topic #{{
            assessment.topic_id
          }}</span
        >
        <span
          class="badge bg-light text-dark me-2"
          v-if="assessment.delivery_mode"
          ><i class="bi bi-laptop me-1"></i>
          {{ assessment.delivery_mode }}</span
        >
        <span
          class="badge bg-light text-dark"
          v-if="assessment.difficulty_level"
          ><i class="bi bi-speedometer2 me-1"></i>
          {{ assessment.difficulty_level }}</span
        >
      </div>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="text-center my-5 p-5">
      <div
        class="spinner-grow text-primary"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading assessment...</p>
    </div>

    <!-- Assessment Questions -->
    <div v-else class="questions-container">
      <div class="list-group list-group-flush">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
        >
          <div class="question-number-badge">{{ index + 1 }}</div>

          <div class="d-flex justify-content-between align-items-start mb-3">
            <h5 class="question-title mb-0 ps-4">Question {{ index + 1 }}</h5>
            <div class="d-flex align-items-center gap-2">
              <span class="badge rounded-pill bg-light text-dark me-2 px-3 py-2">
                <i class="bi bi-list-check me-1"></i>
                {{ question.question_type }}
              </span>

              <span
                class="badge rounded-pill me-2 px-3 py-2"
                :class="getDifficultyBadgeClass(question.difficulty_level)"
              >
                <i class="bi bi-speedometer2 me-1"></i>
                {{ question.difficulty_level }}
              </span>

              <span class="badge rounded-pill bg-success px-3 py-2">
                <i class="bi bi-award me-1"></i> {{ question.marks }} marks
              </span>

              <button
                class="btn btn-sm btn-outline-danger ms-2"
                type="button"
                title="Remove question"
                @click="removeQuestion(question.id)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <!-- Question text -->
          <div
            class="question-text mb-3 ps-4 py-2"
            v-html="
              renderMath(
                question.is_math
                  ? `$${question.question_text}$`
                  : question.question_text
              )
            "
          ></div>

          <!-- Question image -->
          <div v-if="question.question_image" class="question-image mb-3 ps-4">
            <img
              :src="question.question_image"
              class="rounded shadow-sm"
              style="max-width: 250px; max-height: 180px"
            />
          </div>

          <!-- MCQ Options -->
          <div
            v-if="question.options.length"
            class="options-container ps-4 mt-3"
          >
            <div
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="option-item mb-2 p-2 rounded-3"
              :class="{ 'option-correct': option.is_correct }"
            >
              <div class="d-flex align-items-start">
                <div
                  class="option-letter me-3"
                  :class="{ 'option-letter-correct': option.is_correct }"
                >
                  {{ String.fromCharCode(65 + optIndex) }}
                </div>
                <div class="option-content flex-grow-1">
                  <span v-html="renderMath(option.option_text)"></span>
                </div>
                <div v-if="option.is_correct" class="ms-2 text-success">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- True/False -->
          <div
            v-else-if="question.question_type === 'true_false'"
            class="options-container ps-4 mt-3"
          >
            <div
              v-for="opt in ['true', 'false']"
              :key="opt"
              class="option-item mb-2 p-2 rounded-3"
              :class="{
                'option-correct': question.correct_answer.toLowerCase() === opt,
              }"
            >
              <div class="d-flex align-items-center">
                <div
                  class="option-letter me-3"
                  :class="{
                    'option-letter-correct':
                      question.correct_answer.toLowerCase() === opt,
                  }"
                >
                  {{ opt === "true" ? "T" : "F" }}
                </div>
                <div class="option-content flex-grow-1">
                  {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
                </div>
                <div
                  v-if="question.correct_answer.toLowerCase() === opt"
                  class="ms-2 text-success"
                >
                  <i class="bi bi-check-circle-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Questions Modal Component -->
    <AddQuestionsModal 
      v-model="showAddModal"
      :assessment-id="assessment?.id"
      :existing-question-ids="existingQuestionIds"
      @add-questions="addQuestionsByIds"
    />

    <!-- PDF generator utility component (no UI) -->
    <AssessmentPdfGenerator ref="pdfGen" />
  </div>
</template>

<script>
import axios from "axios";
import katex from "katex";
import "katex/dist/katex.min.css";
import AssessmentPdfGenerator from "@/components/assessment/AssessmentPdfGenerator.vue";
import AddQuestionsModal from "@/components/assessment/AddQuestionsModal.vue";

export default {
  name: "ReviewAssessment",
  components: { AssessmentPdfGenerator, AddQuestionsModal },
  data() {
    return {
      assessment: {},
      questions: [],
      loading: true,
      showAnswer: false,
      isLoading: false,
      showDropdown: false,
      isSaving: false,
      // Add modal state & data
      showAddModal: false,
    };
  },
  async created() {
    await this.fetchAssessment();
  },
  computed: {
    existingQuestionIds() {
      try {
        return new Set((this.questions || []).map(q => q.id));
      } catch (_) {
        return new Set();
      }
    },
    groupedAvailable() {
      const groups = new Map();
      for (const q of this.availableQuestions || []) {
        const g = q._group || 'Ungrouped';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(q);
      }
      return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
    }
  },
  methods: {
    async fetchAssessment() {
      const token = localStorage.getItem("auth_token");
      const assessmentId = this.$route.params.id;
      if (!token) {
        this.$router.push({ name: "Login" });
        return;
      }

      try {
        // Fetch assessment data from the API
        const response = await axios.get(
          `/assessments/${assessmentId}/details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const payload = response.data || {};

        // Resolve assessment from common shapes
        const resolvedAssessment =
          payload.assessment || payload.data?.assessment || payload;
        this.assessment = resolvedAssessment || {};

        // Resolve questions from common shapes
        const sourceQuestions =
          this.assessment.questions ||
          payload.questions ||
          payload.data?.questions ||
          [];

        // Process questions for display
        this.questions = sourceQuestions.map((q, idx) => {
          const qData = q?.question || q || {};
          const correct = qData.correct_answer ?? "";

          // Normalize options: can be array or JSON string; also filter nulls
          let rawOptions = qData.options ?? [];
          if (typeof rawOptions === "string") {
            try {
              rawOptions = JSON.parse(rawOptions);
            } catch (_) {
              rawOptions = [];
            }
          }
          if (!Array.isArray(rawOptions)) rawOptions = [];

          // If options already objects with option_text/is_correct, normalize values; else treat as primitives
          const options = rawOptions
            .filter((opt) => opt !== null && opt !== undefined)
            .map((opt) => {
              if (
                typeof opt === "object" &&
                (opt.option_text !== undefined || opt.is_correct !== undefined)
              ) {
                const text = String(opt.option_text ?? "");
                const isCorrectRaw = opt.is_correct;
                const isCorrect =
                  typeof isCorrectRaw === "boolean"
                    ? isCorrectRaw
                    : String(isCorrectRaw).toLowerCase() === "true" ||
                      String(isCorrectRaw) === "1";
                return {
                  option_text: qData.is_math ? `$${text}$` : text,
                  is_correct: isCorrect,
                };
              }
              const text = String(opt);
              return {
                option_text: qData.is_math ? `$${text}$` : text,
                is_correct: text === String(correct),
              };
            });

          // Normalize type and correct answer
          const rawType = String(qData.question_type || "mcq").toLowerCase();
          const normalizedType = rawType.includes("true") ? "true_false" : rawType;
          const normalizedCorrect = String(correct).toLowerCase();

          return {
            id: q.id || qData.id || idx,
            question_text: qData.question || qData.question_text || "",
            question_type: normalizedType,
            question_image:
              qData.question_image_url || qData.question_image || null,
            options,
            correct_answer: normalizedCorrect,
            is_math: !!qData.is_math,
            marks: qData.marks || 0,
            difficulty_level: qData.difficulty_level || "remembering",
          };
        });
      } catch (err) {
        console.error("Error fetching assessment", err.response || err);
      } finally {
        this.loading = false;
      }
    },

    renderMath(text) {
      if (!text) return "";
      // Replace display math $$...$$
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
        } catch (e) {
          console.error(e);
          return math;
        }
      });

      // Replace inline math $...$
      text = text.replace(/\$(.+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
        } catch (e) {
          console.error(e);
          return math;
        }
      });

      return text;
    },

    getDifficultyBadgeClass(level) {
      switch (level?.toLowerCase()) {
        case "easy":
          return "bg-info";
        case "medium":
          return "bg-warning";
        case "hard":
          return "bg-danger";
        default:
          return "bg-secondary";
      }
    },
    // Add Questions Modal controls
    openAddModal() {
      this.showAddModal = true;
    },
    closeAddModal() {
      this.showAddModal = false;
    },
    async fetchAvailableQuestions() {
      this.availableLoading = true;
      this.availableError = '';
      try {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = { params: { page: this.availablePage, per_page: this.availablePerPage, search: this.availableSearch || undefined } };
        const resp = await axios.get('/my-questions', { headers, ...params });
        const payload = resp.data || {};
        const flatList = [];
        const normalizeItem = (raw, groupName) => {
          const qData = raw?.question || raw || {};
          const correct = qData.correct_answer ?? '';
          let rawOptions = qData.options ?? [];
          
          // Handle both array and JSON string formats
          if (typeof rawOptions === 'string') {
            try { 
              rawOptions = JSON.parse(rawOptions); 
            } catch (_) { 
              // If JSON parsing fails, try treating it as a simple array
              if (rawOptions.includes(',')) {
                rawOptions = rawOptions.split(',').map(opt => opt.trim());
              } else {
                rawOptions = []; 
              }
            }
          }
          
          // Ensure we have an array
          if (!Array.isArray(rawOptions)) rawOptions = [];
          const options = rawOptions
            .filter(opt => opt !== null && opt !== undefined)
            .map(opt => {
              if (typeof opt === 'object' && (opt.option_text !== undefined || opt.is_correct !== undefined)) {
                const text = String(opt.option_text ?? '');
                const isCorrectRaw = opt.is_correct;
                const isCorrect = typeof isCorrectRaw === 'boolean' ? isCorrectRaw : String(isCorrectRaw).toLowerCase() === 'true' || String(isCorrectRaw) === '1';
                return { option_text: qData.is_math ? `$${text}$` : text, is_correct: isCorrect };
              }
              const text = String(opt);
              return { option_text: qData.is_math ? `$${text}$` : text, is_correct: text === String(correct) };
            });
          const rawType = String(qData.question_type || 'mcq').toLowerCase();
          return {
            id: raw.id || qData.id,
            question_text: qData.question || qData.question_text || '',
            question_type: rawType.includes('true') ? 'true_false' : rawType,
            question_image: qData.question_image_url || qData.question_image || null,
            options,
            correct_answer: String(correct).toLowerCase(),
            is_math: !!qData.is_math,
            marks: qData.marks || 0,
            difficulty_level: qData.difficulty_level || 'remembering',
            _group: groupName,
          };
        };

        // Accept multiple shapes: object-of-arrays, array, or nested array in data.data
        const grouped = payload.data;
        if (grouped && typeof grouped === 'object' && !Array.isArray(grouped)) {
          for (const [groupName, arr] of Object.entries(grouped)) {
            const list = Array.isArray(arr) ? arr : [];
            list.forEach((raw) => flatList.push(normalizeItem(raw, groupName)));
          }
        } else if (Array.isArray(payload.data)) {
          payload.data.forEach((raw) => flatList.push(normalizeItem(raw, undefined)));
        } else if (Array.isArray(payload?.data?.data)) {
          payload.data.data.forEach((raw) => flatList.push(normalizeItem(raw, undefined)));
        }

        this.availableQuestions = flatList;
        const pg = payload.pagination || payload.data?.pagination || {};
        this.availablePage = Number(pg.current_page || this.availablePage || 1);
        this.availableLastPage = Number(pg.last_page || this.availableLastPage || 1);
        this.availablePerPage = Number(pg.per_page || this.availablePerPage || 10);
        this.availableTotal = Number(pg.total || flatList.length);
      } catch (e) {
        console.error('Failed to fetch available questions', e);
        this.availableError = 'Failed to fetch questions';
      } finally {
        this.availableLoading = false;
      }
    },
    goPrevPage() {
      if (this.availablePage > 1 && !this.availableLoading) {
        this.availablePage -= 1;
        this.fetchAvailableQuestions();
      }
    },
    goNextPage() {
      if (this.availablePage < this.availableLastPage && !this.availableLoading) {
        this.availablePage += 1;
        this.fetchAvailableQuestions();
      }
    },
    toggleGroup(name) {
      const key = name || 'Ungrouped';
      if (this.expandedGroups.has(key)) this.expandedGroups.delete(key);
      else this.expandedGroups.add(key);
      this.expandedGroups = new Set(this.expandedGroups);
    },
    isExpanded(name) {
      const key = name || 'Ungrouped';
      return this.expandedGroups.has(key);
    },
    toggleSelect(id) {
      if (this.existingQuestionIds.has(id)) return;
      if (this.selectedToAdd.has(id)) this.selectedToAdd.delete(id);
      else this.selectedToAdd.add(id);
      // Force Vue to notice Set change in some cases
      this.selectedToAdd = new Set(this.selectedToAdd);
    },
    async addSelectedQuestions() {
      if (!this.selectedToAdd.size) return;
      this.addIsLoading = true;
      try {
        await this.addQuestionsByIds(Array.from(this.selectedToAdd));
        this.showAddModal = false;
      } catch (e) {
        console.error('Add selected failed', e);
      } finally {
        this.addIsLoading = false;
      }
    },
    async addQuestionsByIds(ids) {
      if (!ids.length) return;
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      try {
        // Use the backend API endpoint directly
        const response = await axios.post('/assessments/add-questions', {
          assessment_id: this.assessment.id,
          question_ids: ids
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update the questions from the response
        if (response.data && response.data.assessment) {
          const sourceQuestions = response.data.assessment.questions || [];
          
          // Process questions for display using the same format as fetchAssessment
          this.questions = sourceQuestions.map((q) => {
            const qData = q?.question || q || {};
            const correct = qData.correct_answer ?? "";
            
            // Normalize options
            let rawOptions = qData.options ?? [];
            if (typeof rawOptions === "string") {
              try { rawOptions = JSON.parse(rawOptions); } 
              catch (_) { 
                // If JSON parsing fails, try treating it as a simple array
                if (rawOptions.includes(',')) {
                  rawOptions = rawOptions.split(',').map(opt => opt.trim());
                } else {
                  rawOptions = []; 
                }
              }
            }
            if (!Array.isArray(rawOptions)) rawOptions = [];
            
            const options = rawOptions
              .filter((opt) => opt !== null && opt !== undefined)
              .map((opt) => {
                if (typeof opt === "object" && (opt.option_text !== undefined || opt.is_correct !== undefined)) {
                  const text = String(opt.option_text ?? "");
                  const isCorrectRaw = opt.is_correct;
                  const isCorrect = typeof isCorrectRaw === "boolean"
                    ? isCorrectRaw
                    : String(isCorrectRaw).toLowerCase() === "true" || String(isCorrectRaw) === "1";
                  return {
                    option_text: qData.is_math ? `$${text}$` : text,
                    is_correct: isCorrect,
                  };
                }
                const text = String(opt);
                return {
                  option_text: qData.is_math ? `$${text}$` : text,
                  is_correct: text === String(correct),
                };
              });
            
            const rawType = String(qData.question_type || "mcq").toLowerCase();
            const normalizedType = rawType.includes("true") ? "true_false" : rawType;
            const normalizedCorrect = String(correct).toLowerCase();
            
            return {
              id: q.id || qData.id,
              question_text: qData.question || qData.question_text || "",
              question_type: normalizedType,
              question_image: qData.question_image_url || qData.question_image || null,
              options,
              correct_answer: normalizedCorrect,
              is_math: !!qData.is_math,
              marks: qData.marks || 0,
              difficulty_level: qData.difficulty_level || "remembering",
            };
          });
          
          // Render math in the next tick after DOM update
          this.$nextTick(() => {
            this.renderMath();
          });
        }
      } catch (error) {
        console.error('Failed to add questions:', error.response?.data || error.message);
        throw error;
      }
    },
    async fetchQuestionById(id, headers) {
      const resp = await axios.get(`/questions/${id}`, { headers });
      const data = resp.data || {};
      const qData = data?.question || data || {};
      const correct = qData.correct_answer ?? '';
      let rawOptions = qData.options ?? [];
      
      // Handle both array and JSON string formats
      if (typeof rawOptions === 'string') {
        try { 
          rawOptions = JSON.parse(rawOptions); 
        } catch (_) { 
          // If JSON parsing fails, try treating it as a simple array
          if (rawOptions.includes(',')) {
            rawOptions = rawOptions.split(',').map(opt => opt.trim());
          } else {
            rawOptions = []; 
          }
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(rawOptions)) rawOptions = [];
      const options = rawOptions
        .filter(opt => opt !== null && opt !== undefined)
        .map(opt => {
          if (typeof opt === 'object' && (opt.option_text !== undefined || opt.is_correct !== undefined)) {
            const text = String(opt.option_text ?? '');
            const isCorrectRaw = opt.is_correct;
            const isCorrect = typeof isCorrectRaw === 'boolean'
              ? isCorrectRaw
              : String(isCorrectRaw).toLowerCase() === 'true' || String(isCorrectRaw) === '1';
            return { option_text: qData.is_math ? `$${text}$` : text, is_correct: isCorrect };
          }
          const text = String(opt);
          return { option_text: qData.is_math ? `$${text}$` : text, is_correct: text === String(correct) };
        });
      const rawType = String(qData.question_type || 'mcq').toLowerCase();
      return {
        id: qData.id || id,
        question_text: qData.question || qData.question_text || '',
        question_type: rawType.includes('true') ? 'true_false' : rawType,
        question_image: qData.question_image_url || qData.question_image || null,
        options,
        correct_answer: String(correct).toLowerCase(),
        is_math: !!qData.is_math,
        marks: qData.marks || 0,
        difficulty_level: qData.difficulty_level || 'remembering'
      };
    },
    cleanMath(text) {
      if (!text) return "";
      if (text.startsWith("$") && text.endsWith("$")) {
        return text.slice(1, -1).trim();
      }
      return text;
    },
    async generatePdf(isTeacher = true) {
      this.showDropdown = false;
      this.isLoading = true;
      try {
        await this.$refs.pdfGen.generatePdf(
          this.assessment,
          this.questions,
          isTeacher
        );
      } finally {
        this.isLoading = false;
      }
    },
    async generatePdfStudent() {
      await this.generatePdf(false);
    },
  },
};
</script>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left: 4px solid #0d6efd;
}

.assessment-title {
  color: #343a40;
  font-weight: 600;
}

.assessment-meta .badge {
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.questions-container {
  max-width: 900px;
  margin: 0 auto;
}

.question-card {
  background-color: #fff;
  transition: all 0.3s ease;
  border-left: 4px solid #6c757d !important;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
}

.question-number-badge {
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  background-color: #6c757d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border-bottom-right-radius: 8px;
}

.question-title {
  color: #495057;
  font-weight: 600;
}

.question-text {
  color: #212529;
  line-height: 1.6;
  border-left: 3px solid #e9ecef;
}

.option-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.option-item:hover {
  background-color: #f1f3f5;
}

.option-correct {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.option-letter {
  width: 28px;
  height: 28px;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.option-letter-correct {
  background-color: #28a745;
  color: white;
}
.modal-fullscreen-custom {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  margin: 0;
  padding: 0;
}

.modal-fullscreen-custom .modal-content {
  height: 100%;
  border-radius: 0;
}

.option-content {
  padding: 0 10px;
}

.list-group-item {
  border: 1px solid #ddd;
}

.question-image img {
  transition: transform 0.3s ease;
  border: 3px solid #f8f9fa;
}

.question-image img:hover {
  transform: scale(1.03);
}

/* Add subtle animation to correct answers */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.2);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

.option-correct {
  animation: pulse 2s infinite;
}

/* Difficulty level badge styling */
.badge.bg-info {
  background-color: #0dcaf0 !important;
  color: #000;
}

.badge.bg-warning {
  background-color: #ffc107 !important;
  color: #000;
}

.badge.bg-danger {
  background-color: #dc3545 !important;
  color: #fff;
}

.badge.bg-secondary {
  background-color: #6c757d !important;
  color: #fff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-section {
    padding: 15px !important;
  }

  .assessment-title {
    font-size: 1.5rem;
  }

  .question-card {
    padding: 15px !important;
  }

  .question-text,
  .options-container {
    padding-left: 15px !important;
  }
}

.form-check-label span {
  display: inline-block;
}
</style>
