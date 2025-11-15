<template>
  <div class="questions-list container py-4">
    <!-- Toast container -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <div
        id="liveToast"
        class="toast align-items-center text-white border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        ref="toast"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toastMessage }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
      </div>
    <h2 class="section-title mb-4">📘 Question Management</h2>

    <!-- Filters -->
    <div class="filter-section mb-4 shadow-sm">
      <form class="row g-3 align-items-end">
        <div class="col-md-3">
          <label for="grade_level_id" class="form-label fw-semibold"
            >Select Grade Level</label
          >
          <select
            v-model="selectedGrade"
            id="grade_level_id"
            class="form-select shadow-sm"
          >
            <option :value="''" disabled>Select grade</option>
            <option
              v-for="grade in gradeLevels"
              :key="grade.id"
              :value="grade.id"
            >
              {{ grade.grade_name }}
            </option>
          </select>
        </div>

        <div class="col-md-3" v-if="subjects.length">
          <label for="subject_id" class="form-label fw-semibold">Subject</label>
          <select
            v-model="selectedSubject"
            id="subject_id"
            class="form-select shadow-sm"
          >
            <option value="" disabled>Select subject</option>
            <option
              v-for="subject in subjects"
              :key="subject.id"
              :value="subject.id"
            >
              {{ subject.name }}
            </option>
          </select>
        </div>

        <div class="col-md-3" v-if="topics.length">
          <label for="topic_id" class="form-label fw-semibold">Topic</label>
          <select
            v-model="selectedTopic"
            id="topic_id"
            class="form-select shadow-sm"
          >
            <option value="" disabled>Select topic</option>
            <option v-for="topic in topics" :key="topic.id" :value="topic.id">
              {{ topic.topic_name }}
            </option>
          </select>
        </div>
      </form>
    </div>

    <!-- Add Question Inline -->
    <div v-if="selectedTopic" class="mb-4">
      <div
        class="d-flex align-items-center mb-3 justify-content-between sticky-top bg-white p-3"
        style="z-index: 1000; top: 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)"
      >
        <div>
          <span class="fw-bold text-dark">Adding question for:</span>
          <span class="text-muted ms-2"
            >Subject: {{ selectedSubjectName }} › Unit:
            {{ selectedTopicName }} › Grade {{ selectedGradeName }}</span
          >
        </div>
        <button
          class="btn btn-outline-primary btn-sm"
          @click="toggleAddInline"
          style="white-space: nowrap"
        >
          {{ showAddInline ? "Close Form" : "➕ Add Question" }}
        </button>
      </div>

      <div v-if="showAddInline" class="card card-body border-0 shadow-sm">
        <QuestionForm
          :subject-id="selectedSubject"
          :topic-id="selectedTopic"
          :selected-grade-filter="selectedGrade"
          :compact="true"
          hide-meta
          @created="onCreatedInline"
          @cancel="closeAddInline"
          @show-toast="handleToast"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p class="fw-semibold text-primary">Loading questions...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredQuestions.length === 0 && selectedTopic"
      class="no-questions"
    >
      <p class="text-muted">No questions found for this topic.</p>
      <button
        type="button"
        @click="showAddInline = true"
        class="btn btn-outline-primary mt-2"
      >
        <span class="fw-bold">+</span> Add First Question
      </button>
    </div>

    <!-- Questions List -->
    <div v-else class="questions-container">
      <div
        v-for="(q, idx) in processedQuestions"
        :key="q.id"
        class="card mb-4 border-0 shadow-sm question-card"
      >
        <div class="card-body">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="fw-bold text-secondary">Q{{ idx + 1 }}</div>
            <span class="badge bg-light text-dark text-capitalize">{{
              q.question_type || "Text"
            }}</span>
            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary me-1"
                @click="openEditModal(q)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.862 3.487a2.121 2.121 0 113 3L7.5 18.75 3 21l2.25-4.5L16.862 3.487z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                title="Delete Question"
                @click="confirmDelete(q)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Question -->
          <div class="mb-3">
            <div
              class="fw-semibold fs-5 mb-2"
              v-html="q.is_math ? renderMath(q.question) : q.question"
            ></div>
            <img
              v-if="q.question_image_url"
              :src="q.question_image_url"
              alt="Question Image"
              class="img-thumbnail mt-2"
              style="max-width: 220px; max-height: 150px; object-fit: contain"
            />
          </div>

          <!-- Options -->
          <div>
            <!-- MCQ -->
            <template
              v-if="q.question_type === 'mcq' && Array.isArray(q.options)"
            >
              <div
                v-for="(opt, oidx) in q.options"
                :key="oidx"
                class="form-check mb-2 p-1 ms-2"
                :class="{
                  'bg-success-subtle border-success': isCorrectOption(
                    q.correct_answer,
                    getOptionValue(opt)
                  ),
                }"
              >
                <input
                  class="form-check-input me-2"
                  type="checkbox"
                  :checked="
                    isCorrectOption(q.correct_answer, getOptionValue(opt))
                  "
                  disabled
                />
                <label class="form-check-label d-flex ms-3">
                  <span class="fw-bold me-2"
                    >{{ String.fromCharCode(65 + oidx) }}.</span
                  >
                  <span
                    v-html="
                      q.is_math
                        ? renderMath(getOptionValue(`$${opt}$`))
                        : getOptionValue(opt)
                    "
                  ></span>
                </label>
              </div>
            </template>

            <!-- True/False -->
            <template v-else-if="q.question_type === 'true_false'">
              <div
                v-for="val in ['true', 'false']"
                :key="val"
                class="form-check mb-2 p-1 ms-2"
                :class="{
                  'bg-success-subtle border-success': isCorrectOption(
                    q.correct_answer,
                    val
                  ),
                }"
              >
                <input
                  class="form-check-input me-2"
                  type="checkbox"
                  :checked="isCorrectOption(q.correct_answer, val)"
                  disabled
                />
                <label class="form-check-label ms-3">{{
                  val.charAt(0).toUpperCase() + val.slice(1)
                }}</label>
              </div>
            </template>

            <!-- Short Answer -->
            <template v-else-if="q.question_type === 'short_answer'">
              <div class="alert alert-secondary py-2">
                <strong>Answer: </strong>
                <span v-html="renderMarkdown(q.correct_answer)"></span>
              </div>
            </template>
            <!-- Matching -->
            <template v-else-if="q.question_type === 'matching'">
              <div class="row">
                <div class="col-md-5">
                  <strong>Left Column</strong>
                  <ul class="list-group mb-2">
                    <li v-for="(item, idx) in (q.matching_items.left || [])" :key="'left-' + idx" class="list-group-item py-1 px-2">
                      {{ item ? item : 'Left ' + (idx + 1) }}
                    </li>
                  </ul>
                </div>
                <div class="col-md-5">
                  <strong>Right Column</strong>
                  <ul class="list-group mb-2">
                    <li v-for="(item, idx) in (q.matching_items.right || [])" :key="'right-' + idx" class="list-group-item py-1 px-2">
                      {{ item ? item : 'Right ' + (idx + 1) }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="mt-2">
                <strong>Pairs:</strong>
                <ul class="list-unstyled mb-0">
                  <li v-for="(pair, idx) in (q.matching_pairs || [])" :key="'pair-' + idx">
                    <span>
                      {{ (q.matching_items.left && q.matching_items.left[pair.left_index]) ? q.matching_items.left[pair.left_index] : 'Left ' + (pair.left_index + 1) }}
                      →
                      {{ (q.matching_items.right && q.matching_items.right[pair.right_index]) ? q.matching_items.right[pair.right_index] : 'Right ' + (pair.right_index + 1) }}
                    </span>
                  </li>
                </ul>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div
            class="d-flex justify-content-between align-items-center mt-3 border-top pt-2"
          >
            <span class="badge bg-light text-dark"
              >{{ q.marks || 1 }} {{ q.marks === 1 ? "point" : "points" }}</span
            >
            <div>
              <span
                v-if="q.difficulty_level"
                class="badge bg-warning text-dark me-1"
                >{{ q.difficulty_level }}</span
              >
              <span v-if="q.required" class="badge bg-primary">Required</span>
            </div>
          </div>

          <!-- Explanation -->
          <div v-if="q.explanation" class="alert alert-info mt-3">
            <div class="fw-semibold">💡 Explanation:</div>
            <div v-html="renderMath(q.explanation)"></div>
          </div>
        </div>
      </div>
        <div class="text-center my-4" v-if="hasMore && !loading">
          <button class="btn btn-outline-primary" @click="fetchQuestions(currentPage + 1, true)">
            Load More
          </button>
        </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.25)"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">Edit Question</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <QuestionForm
              :edit-question="editingQuestion"
              :subject-id="selectedSubject"
              :topic-id="selectedTopic"
              :selected-grade-filter="selectedGrade"
              @created="onSaved"
              @updated="onSaved"
              @cancel="closeModal"
            />
          </div>
        </div>
      </div>
    </div>
  
</template>

<script>
import axios from "axios";
import QuestionForm from "./QuestionFormWithMathKaTeX.vue";
import katex from "katex";
import "katex/dist/katex.min.css";

export default {
  name: "QuestionsList",
  components: { QuestionForm },
  data() {
    return {
      toastMessage: "",
      selectedSubject: "",
      selectedGrade: null,
      selectedTopic: "",
      subjects: [],
      topics: [],
      gradeLevels: [],
  questions: [],
  loading: false,
  showModal: false,
  editingQuestion: null,
  showAddInline: false,
  currentPage: 1,
  pageSize: 10,
  hasMore: true,
    };
  },
  computed: {
    filteredQuestions() {
      return this.questions.filter((q) => q.topic_id === this.selectedTopic);
    },
    processedQuestions() {
      return this.filteredQuestions.map((q) => {
        const newQ = { ...q };
        // Parse options and correct_answer for matching questions
        if (newQ.question_type === "matching") {
          try {
            newQ.matching_items = typeof newQ.options === "string" ? JSON.parse(newQ.options) : newQ.options;
          } catch {
            newQ.matching_items = { left: [], right: [] };
          }
          try {
            newQ.matching_pairs = typeof newQ.correct_answer === "string" ? JSON.parse(newQ.correct_answer) : newQ.correct_answer;
          } catch {
            newQ.matching_pairs = [];
          }
        } else {
          if (typeof newQ.options === "string") {
            try {
              newQ.options = JSON.parse(newQ.options);
            } catch {
              newQ.options = [];
            }
          }
          if (typeof newQ.correct_answer === "string") {
            try {
              newQ.correct_answer = JSON.parse(newQ.correct_answer);
            } catch {}
          }
          // Ensure true_false correct answer is normalized
          if (newQ.question_type === "true_false") {
            newQ.correct_answer = String(newQ.correct_answer).toLowerCase();
          }
        }
        return newQ;
      });
    },
    selectedGradeName() {
      const grade = this.gradeLevels.find((g) => g.id === this.selectedGrade);
      return grade ? grade.grade_name : "";
    },
    selectedSubjectName() {
      const sub = this.subjects.find((s) => s.id === this.selectedSubject);
      return sub ? sub.name : "";
    },
    selectedTopicName() {
      const t = this.topics.find((t) => t.id === this.selectedTopic);
      return t ? t.topic_name : "";
    },
  },
  created() {
    this.fetchGradeLevels();
  },
  methods: {
    handleToast({ message, type = "success" }) {
      this.showToast(message, type);
    },
    showToast(message, type = "success") {
      this.toastMessage = message;
      const toastEl = this.$refs.toast;
      toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");
      toastEl.classList.add(type === "success" ? "bg-success" : "bg-danger");
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    },
    toggleAddInline() {
      this.showAddInline = !this.showAddInline;
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
      this.editingQuestion = null;
      this.showModal = false;
    },
    onSaved() {
      this.fetchQuestions();
      this.closeModal();
    },
    getOptionValue(opt) {
      return typeof opt === "object" && opt !== null ? opt.value || "" : opt;
    },
    renderMarkdown(content) {
      if (!content) return "";
      try {
        // Replace inline math $...$
        content = content.replace(/\$(.+?)\$/g, (match, text) => {
          return katex.renderToString(text, {
            throwOnError: false,
            displayMode: false,
          });
        });

        // Replace block math $$...$$
        content = content.replace(/\$\$([^$]+)\$\$/g, (match, text) => {
          return katex.renderToString(text, {
            throwOnError: false,
            displayMode: true,
          });
        });
        return content;
      } catch(err) {
        return content;
      }
    },
    fetchGradeLevels() {
      axios.get("/grade-levels").then(({ data }) => { this.gradeLevels = data; });
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
        this.topics = [];
      }
    },
    async fetchQuestions(page = 1, append = false) {
      if (!this.selectedTopic) return;
      this.loading = true;
      try {
        const res = await axios.get(`/topics/${this.selectedTopic}/questions`, {
          params: { page, page_size: this.pageSize },
        });
        const data = res.data.data || [];
        if (append) {
          this.questions = [...this.questions, ...data];
        } else {
          this.questions = data;
        }
        // If backend provides pagination info, use it; else, infer from data length
        if (res.data.pagination) {
          this.currentPage = res.data.pagination.current_page;
          this.hasMore = this.currentPage < res.data.pagination.last_page;
        } else {
          this.hasMore = data.length === this.pageSize;
          this.currentPage = page;
        }
      } catch {
        if (!append) this.questions = [];
        this.hasMore = false;
      } finally {
        this.loading = false;
      }
    },
    confirmDelete(q) {
      if (confirm("Are you sure you want to delete this question?")) {
        this.deleteQuestion(q.id);
      }
    },

    async deleteQuestion(id) {
      try {
        const token = localStorage.getItem("auth_token");
        await axios.delete(`/questions/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        this.showToast("Question deleted successfully!", "success");
        this.fetchQuestions();
      } catch (err) {
        this.showToast("Failed to delete question.", "danger");
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
  },
  watch: {
    selectedGrade() {
      this.fetchSubjects();
    },
    selectedSubject() {
      this.fetchTopics();
    },
    selectedTopic() {
      this.currentPage = 1;
      this.fetchQuestions(1, false);
    },
  },
};
</script>

<style scoped>
.questions-list {
  background: #fff;
  border-radius: 18px;
  padding: 2em;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 32px rgba(60, 72, 88, 0.13);
}

.section-title {
  font-size: 1.6em;
  font-weight: 700;
  color: #374151;
}

.filter-section {
  background: #f9fafb;
  border-radius: 10px;
  padding: 1.5em;
  border: 1px solid #e5e7eb;
}

.question-card {
  transition: all 0.3s ease;
}
.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.bg-success-subtle {
  background-color: #d1e7dd !important;
  border-radius: 5px;
  padding-left: 10px;
}
.no-questions {
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}
</style>
