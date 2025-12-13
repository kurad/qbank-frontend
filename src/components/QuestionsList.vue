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

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="section-title mb-0">📘 Question Management</h2>
      <div class="d-flex align-items-center gap-2">
        <router-link
          class="btn btn-primary btn-sm"
          :to="{ name: 'bulk-questions' }"
          title="Create multiple questions at once"
        >
          Bulk Add Questions
        </router-link>
        <button
          class="btn btn-outline-success btn-sm"
          type="button"
          @click="showAiPanel = !showAiPanel"
        >
          {{ showAiPanel ? 'Close AI Generator' : 'AI Generate Questions' }}
        </button>
        <div class="ms-2">
          <button class="btn btn-outline-secondary btn-sm" @click="useGrouped = !useGrouped">
            {{ useGrouped ? 'Switch to Filters' : 'Switch to Grouped' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Grouped Browser: Grade -> Subject -> Topic -->
    <div v-if="useGrouped" class="mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white">
          <strong>Browse by Grade › Subject › Unit</strong>
        </div>
        <div class="card-body">
          <div v-if="gradeLevels.length === 0" class="text-muted">No grades found.</div>
          <div v-for="grade in gradeLevels" :key="grade.id" class="mb-2">
            <div class="d-flex align-items-center">
              <button class="btn btn-link p-0 me-2" @click="toggleGrade(grade.id)">
                {{ expandedGrades.has(grade.id) ? '▾' : '▸' }}
              </button>
              <span class="fw-semibold">Grade: {{ grade.grade_name }}</span>
            </div>
            <div v-if="expandedGrades.has(grade.id)" class="ms-4 mt-2">
              <div v-if="!subjectsByGrade[grade.id]" class="text-muted small">Loading subjects...</div>
              <div v-else-if="subjectsByGrade[grade.id].length === 0" class="text-muted small">No subjects.</div>
              <div v-else v-for="subject in subjectsByGrade[grade.id]" :key="subject.id" class="mb-1">
                <div class="d-flex align-items-center">
                  <button class="btn btn-link p-0 me-2" @click="toggleSubject(grade.id, subject.id)">
                    {{ expandedSubjects.has(subjectKey(grade.id, subject.id)) ? '▾' : '▸' }}
                  </button>
                  <span>Subject: {{ subject.name }}</span>
                </div>
                <div v-if="expandedSubjects.has(subjectKey(grade.id, subject.id))" class="ms-4 mt-2">
                  <div v-if="!topicsBySubjectGrade[subjectKey(grade.id, subject.id)]" class="text-muted small">Loading Units...</div>
                  <div v-else-if="topicsBySubjectGrade[subjectKey(grade.id, subject.id)].length === 0" class="text-muted small">No units.</div>
                  <div v-else v-for="topic in topicsBySubjectGrade[subjectKey(grade.id, subject.id)]" :key="topic.id" class="mb-2">
                    <div class="d-flex align-items-center">
                      <button class="btn btn-link p-0 me-2" @click="toggleTopic(topic.id, grade.id, subject.id)">
                        {{ expandedTopics.has(topic.id) ? '▾' : '▸' }}
                      </button>
                      <span>
                        Unit: {{ topic.topic_name }}
                        <span class="text-muted small">
                          ({{ questionsByTopic[topic.id] ?? (questionsByTopic[topic.id] || []).length }} questions)
                        </span>
                      </span>
                    </div>
                    <div v-if="expandedTopics.has(topic.id)" class="ms-4 mt-2">
                      <div v-if="topicLoading.has(topic.id)" class="text-muted small">Loading questions...</div>
                      <div v-else>
                        <div v-if="(questionsByTopic[topic.id] || []).length === 0" class="text-muted small">No questions in this topic.</div>
                        <div v-else>
                          <div
                            v-for="(q, idx) in processArray(questionsByTopic[topic.id])"
                            :key="q.id"
                            class="card mb-3 border-0 shadow-sm question-card"
                          >
                            <div class="card-body">
                              <div class="d-flex justify-content-between align-items-start mb-3">
                                <div class="fw-bold text-secondary">Q{{ idx + 1 }}</div>
                                <span class="badge bg-light text-dark text-capitalize">{{ q.question_type || 'Text' }}</span>
                                <div class="d-flex align-items-center gap-2">
                                  <button type="button" class="btn btn-sm btn-outline-secondary me-1" @click="openEditModal(q)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 3.487a2.121 2.121 0 113 3L7.5 18.75 3 21l2.25-4.5L16.862 3.487z"/></svg>
                                  </button>
                                  <button type="button" class="btn btn-sm btn-outline-danger" title="Delete Question" @click="confirmDelete(q)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              </div>
                              <div class="mb-3">
                                <div
                                  class="fw-semibold fs-5 mb-2"
                                  v-html="renderMath(q.question, q.is_math)"
                                ></div>
                                <img v-if="q.question_image_url" :src="q.question_image_url" alt="Question Image" class="img-thumbnail mt-2" style="max-width: 220px; max-height: 150px; object-fit: contain" />
                              </div>
                              <div>
                                <template v-if="q.question_type === 'mcq' && Array.isArray(q.options)">
                                  <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check mb-2 p-1 ms-2" :class="{ 'bg-success-subtle border-success': isCorrectOption(q.correct_answer, getOptionValue(opt)) }">
                                    <input class="form-check-input me-2" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                                    <label class="form-check-label d-flex ms-3 align-items-start">
                                      <span class="fw-bold me-2">{{ String.fromCharCode(65 + oidx) }}.</span>
                                      <div>
                                        <div v-html="renderMath(getOptionValue(opt), q.is_math)"></div>
                                        <img
                                          v-if="getOptionImageUrl(opt)"
                                          :src="getOptionImageUrl(opt)"
                                          alt="Option Image"
                                          class="img-thumbnail mt-1"
                                          style="max-width: 180px; max-height: 120px; object-fit: contain"
                                        />
                                      </div>
                                    </label>
                                  </div>
                                </template>
                                <template v-else-if="q.question_type === 'true_false'">
                                  <div v-for="val in ['true','false']" :key="val" class="form-check mb-2 p-1 ms-2" :class="{ 'bg-success-subtle border-success': isCorrectOption(q.correct_answer, val) }">
                                    <input class="form-check-input me-2" type="checkbox" :checked="isCorrectOption(q.correct_answer, val)" disabled />
                                    <label class="form-check-label ms-3">{{ val.charAt(0).toUpperCase() + val.slice(1) }}</label>
                                  </div>
                                </template>
                                <template v-else-if="q.question_type === 'short_answer'">
                                  <div class="alert alert-secondary py-2"><strong>Answer: </strong><span v-html="renderMarkdown(q.correct_answer)"></span></div>
                                </template>
                                <template v-else-if="q.question_type === 'matching'">
                                  <div class="matching-container mb-3">
                                    <div class="row g-3">
                                      <div class="col-md-5">
                                        <strong>Left Column</strong>
                                        <ul class="list-group list-group-flush">
                                          <li v-for="(item, i2) in q.matching_items?.left || []" :key="'left-' + i2" class="list-group-item matching-item-left">{{ item || `Left ${i2 + 1}` }}</li>
                                        </ul>
                                      </div>
                                      <div class="col-md-5">
                                        <strong>Right Column</strong>
                                        <ul class="list-group list-group-flush">
                                          <li v-for="(item, i3) in q.matching_items?.right || []" :key="'right-' + i3" class="list-group-item matching-item-right">{{ item || `Right ${i3 + 1}` }}</li>
                                        </ul>
                                      </div>
                                    </div>
                                    <div class="mt-3">
                                      <strong>✅ Correct Pairs:</strong>
                                      <ul class="list-unstyled mb-0">
                                        <li v-for="(pair, i4) in q.matching_pairs || []" :key="'pair-' + i4" class="matching-pair">
                                          <span class="pair-left">{{ q.matching_items?.left?.[pair.left_index] || `Left ${pair.left_index + 1}` }}</span>
                                          <span class="arrow">→</span>
                                          <span class="pair-right">{{ q.matching_items?.right?.[pair.right_index] || `Right ${pair.right_index + 1}` }}</span>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </template>
                              </div>
                              <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                                <span class="badge bg-light text-dark">{{ q.marks || 1 }} {{ q.marks === 1 ? 'point' : 'points' }}</span>
                                <div>
                                  <span v-if="q.difficulty_level" class="badge bg-warning text-dark me-1">{{ q.difficulty_level }}</span>
                                  <span v-if="q.required" class="badge bg-primary">Required</span>
                                </div>
                              </div>
                              <div v-if="q.explanation" class="alert alert-info mt-3">
                                <div class="fw-semibold">💡 Explanation:</div>
                                <div v-html="renderMath(q.explanation, q.is_math)"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <QuestionsFilters
      v-else
      :grade-levels="gradeLevels"
      :subjects="subjects"
      :topics="topics"
      :selected-grade="selectedGrade"
      :selected-subject="selectedSubject"
      :selected-topic="selectedTopic"
      :search-text="searchText"
      :filter-question-type="filterQuestionType"
      :filter-difficulty="filterDifficulty"
      @update:selectedGrade="(val) => (selectedGrade = val)"
      @update:selectedSubject="(val) => (selectedSubject = val)"
      @update:selectedTopic="(val) => (selectedTopic = val)"
      @update:searchText="(val) => (searchText = val)"
      @update:filterQuestionType="(val) => (filterQuestionType = val)"
      @update:filterDifficulty="(val) => (filterDifficulty = val)"
      @search="applySearch"
      @reset="resetFilters"
    />

    <!-- AI Question Generator Panel -->
    <div v-if="selectedTopic && showAiPanel" class="mb-4">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>AI Question Generator</strong>
          <small class="text-muted">Unit: {{ selectedTopicName }} • Subject: {{ selectedSubjectName }} • Grade: {{ selectedGradeName }}</small>
        </div>
        <div class="card-body">
          <div class="row g-3 mb-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Prompt</label>
              <textarea
                v-model="aiPrompt"
                class="form-control"
                rows="3"
                placeholder="Describe the questions you want the AI to generate (e.g. '5 MCQs about photosynthesis for Grade 7')."
              ></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Question Type</label>
              <select v-model="aiQuestionType" class="form-select form-select-sm">
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Difficulty (Bloom's)</label>
              <select v-model="aiDifficulty" class="form-select form-select-sm">
                <option value="remembering">Remembering</option>
                <option value="understanding">Understanding</option>
                <option value="applying">Applying</option>
                <option value="analyzing">Analyzing</option>
                <option value="evaluating">Evaluating</option>
                <option value="creating">Creating</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button
                type="button"
                class="btn btn-success w-100"
                :disabled="aiGenerateLoading || !aiPrompt"
                @click="generateAIQuestions"
              >
                <span v-if="!aiGenerateLoading">Generate Questions</span>
                <span v-else>Generating...</span>
              </button>
            </div>
          </div>

          <div v-if="aiError" class="alert alert-danger py-2 mb-3">
            {{ aiError }}
          </div>

          <div v-if="aiGeneratedQuestions.length" class="mt-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Generated Questions (not yet saved)</h6>
              <div class="d-flex align-items-center gap-2">
                <div class="form-check mb-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :checked="aiAllSelected"
                    @change="toggleAiSelectAll"
                    id="aiSelectAll"
                  />
                  <label class="form-check-label small" for="aiSelectAll">Select all</label>
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="aiSaveLoading || !aiSelectedQuestions.length"
                  @click="saveSelectedAIQuestions"
                >
                  <span v-if="!aiSaveLoading">Save Selected</span>
                  <span v-else>Saving...</span>
                </button>
              </div>
            </div>

            <div v-if="aiSaveMessage" class="alert alert-success py-2 mb-3">
              {{ aiSaveMessage }}
            </div>

            <div class="ai-questions-list">
              <div
                v-for="(q, index) in aiGeneratedQuestions"
                :key="index"
                class="card mb-2 border-0 shadow-sm"
              >
                <div class="card-body d-flex">
                  <div class="pt-1 pe-2">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="isAiSelected(q)"
                      @change="toggleAiQuestionSelection(q)"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div class="fw-bold text-secondary">Q{{ index + 1 }}</div>
                      <span class="badge bg-light text-dark text-capitalize">
                        {{ q.question_type || aiQuestionType }} • {{ q.difficulty_level || aiDifficulty }}
                      </span>
                    </div>
                    <div class="mb-2">
                      <div class="fw-semibold" v-html="renderMath(q.question, q.is_math)"></div>
                    </div>
                    <div v-if="q.options">
                      <ul class="mb-0 small">
                        <li v-for="(opt, oidx) in normalizeOptions(q.options)" :key="oidx">
                          {{ getOptionValue(opt) || opt }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="q.correct_answer" class="mt-1 small text-muted">
                      Suggested answer: {{ formatAiCorrectAnswer(q.correct_answer) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

    <!-- Questions List with Pagination -->
    <div v-else class="questions-container">
      <!-- Top pagination controls -->
      <div v-if="selectedTopic" class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <label class="form-label mb-0 small">Per page</label>
          <select v-model.number="pageSize" class="form-select form-select-sm" style="width: 90px">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="small text-muted" v-if="totalQuestions">
            {{ totalQuestions }} questions found
          </span>
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="goToPage(currentPage - 1)">Prev</button>
            </li>
            <li class="page-item disabled"><span class="page-link">{{ currentPage }} / {{ totalPages }}</span></li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="goToPage(currentPage + 1)">Next</button>
            </li>
          </ul>
        </nav>
      </div>
      <QuestionCard
        v-for="(q, idx) in pagedQuestions"
        :key="q.id"
        :question="q"
        :index-label="idx + 1"
        @edit="openEditModal"
        @delete="confirmDelete"
      />
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
  </div>
</template>

<script>
import axios from "axios";
import QuestionForm from "./QuestionFormWithMathKaTeX.vue";
import QuestionCard from "./QuestionCard.vue";
import QuestionsFilters from "./QuestionsFilters.vue";
import katex from "katex";
import "katex/dist/katex.min.css";
import { renderMath as renderMathUtil } from "@/utils/mathRenderer";

export default {
  name: "QuestionsList",
  components: { QuestionForm, QuestionCard, QuestionsFilters },

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

      // inline add & edit
      showModal: false,
      editingQuestion: null,
      showAddInline: false,

      // pagination (filters view)
      currentPage: 1,
      pageSize: 10,
      hasMore: true,
      totalPagesFromApi: null,
      totalQuestions: 0,

      // search & filter state
      searchText: "",
      filterQuestionType: "",
      filterDifficulty: "",

      // Grouped browser state
      expandedGrades: new Set(),
      expandedSubjects: new Set(), // keys: `${gradeId}-${subjectId}`
      expandedTopics: new Set(),
      subjectsByGrade: {},
      topicsBySubjectGrade: {}, // key: `${gradeId}-${subjectId}`
      questionsByTopic: {},
      topicLoading: new Set(),
      useGrouped: false,

      questionCountByTopic: {},

      // AI generator state
      showAiPanel: false,
      aiPrompt: "",
      aiQuestionType: "short_answer",
      aiDifficulty: "remembering",
      aiGeneratedQuestions: [],
      aiSelectedQuestions: [],
      aiGenerateLoading: false,
      aiSaveLoading: false,
      aiError: "",
      aiSaveMessage: "",
    };
  },

  computed: {
    filteredQuestions() {
      return this.questions.filter((q) => q.topic_id === this.selectedTopic);
    },
    processedQuestions() {
      return this.filteredQuestions.map((q) => {
        const newQ = { ...q };

        // Parse options
        if (typeof newQ.options === "string") {
          try {
            newQ.options = JSON.parse(newQ.options);
          } catch {
            newQ.options = [];
          }
        }

        // Parse correct_answer
        if (typeof newQ.correct_answer === "string") {
          try {
            newQ.correct_answer = JSON.parse(newQ.correct_answer);
          } catch {
            // leave as string
          }
        }

        // Normalize true/false
        if (newQ.question_type === "true_false") {
          newQ.correct_answer = String(newQ.correct_answer).toLowerCase();
        }

        // Matching
        if (newQ.question_type === "matching") {
          if (!newQ.options) newQ.options = { left: [], right: [] };
          newQ.matching_items = {
            left: Array.isArray(newQ.options.left) ? newQ.options.left : [],
            right: Array.isArray(newQ.options.right) ? newQ.options.right : [],
          };
          newQ.matching_pairs = Array.isArray(newQ.correct_answer)
            ? newQ.correct_answer
            : [];
        }

        // Normalize sub-questions (same structure as normal questions)
        if (Array.isArray(newQ.sub_questions) && newQ.sub_questions.length) {
          newQ.sub_questions = this.processArray(newQ.sub_questions);
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
    totalPages() {
      if (this.totalPagesFromApi) {
        return this.totalPagesFromApi;
      }
      const len = this.processedQuestions.length;
      return Math.max(1, Math.ceil(len / this.pageSize));
    },
    pagedQuestions() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.processedQuestions.slice(start, start + this.pageSize);
    },

    // AI selection
    aiAllSelected() {
      return (
        this.aiGeneratedQuestions.length > 0 &&
        this.aiSelectedQuestions.length === this.aiGeneratedQuestions.length
      );
    },
  },

  created() {
    this.fetchGradeLevels();
  },

  methods: {
    // -------- Grouped browser helpers --------
    subjectKey(gradeId, subjectId) {
      return `${gradeId}-${subjectId}`;
    },
    async toggleGrade(gradeId) {
      if (this.expandedGrades.has(gradeId)) {
        this.expandedGrades.delete(gradeId);
        return;
      }
      this.expandedGrades.add(gradeId);
      if (!this.subjectsByGrade[gradeId]) {
        try {
          const res = await axios.get(`/grade-levels/${gradeId}/subjects`);
          this.subjectsByGrade[gradeId] = res.data || [];
        } catch {
          this.subjectsByGrade[gradeId] = [];
        }
      }
    },
    async toggleSubject(gradeId, subjectId) {
      const key = this.subjectKey(gradeId, subjectId);
      if (this.expandedSubjects.has(key)) {
        this.expandedSubjects.delete(key);
        return;
      }
      this.expandedSubjects.add(key);
      if (!this.topicsBySubjectGrade[key]) {
        try {
          const res = await axios.get(
            `/subjects/${subjectId}/grades/${gradeId}/units`
          );
          this.topicsBySubjectGrade[key] = res.data || [];
        } catch {
          this.topicsBySubjectGrade[key] = [];
        }
      }
    },
    async toggleTopic(topicId) {
      if (this.expandedTopics.has(topicId)) {
        this.expandedTopics.delete(topicId);
        return;
      }
      this.expandedTopics.add(topicId);
      if (!this.questionsByTopic[topicId]) {
        this.topicLoading.add(topicId);
        try {
          const res = await axios.get(
            `/topics/${topicId}/questions/no-pagination`
          );
          const data = res.data.data || res.data || [];
          this.questionsByTopic[topicId] = Array.isArray(data) ? data : [];
          const countRes = await axios.get(`/topics/${topicId}/question-count`);
          const count = countRes.data?.count ?? this.questionsByTopic[topicId].length;
          this.$set(this.questionCountByTopic, topicId, count);
          
        } catch {
          this.questionsByTopic[topicId] = [];
          this.$set(this.questionCountByTopic, topicId, 0);
        } finally {
          this.topicLoading.delete(topicId);
        }
      }
    },
    processArray(arr) {
      return (arr || []).map((q) => {
        const newQ = { ...q };
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
          } catch {
            // ignore
          }
        }
        if (newQ.question_type === "true_false") {
          newQ.correct_answer = String(newQ.correct_answer).toLowerCase();
        }
        if (newQ.question_type === "matching") {
          if (!newQ.options) newQ.options = { left: [], right: [] };
          newQ.matching_items = {
            left: Array.isArray(newQ.options.left) ? newQ.options.left : [],
            right: Array.isArray(newQ.options.right) ? newQ.options.right : [],
          };
          newQ.matching_pairs = Array.isArray(newQ.correct_answer)
            ? newQ.correct_answer
            : [];
        }
        return newQ;
      });
    },

    // -------- Toast & modals --------
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

    // -------- Display helpers --------
    getOptionValue(opt) {
      if (typeof opt === "object" && opt !== null) {
        if (typeof opt.text === "string") return opt.text;
        if (typeof opt.value === "string") return opt.value;
      }
      return opt;
    },
    getOptionImageUrl(opt) {
      if (!opt || typeof opt !== "object" || !opt.image) return "";
      if (opt.image.startsWith("http://") || opt.image.startsWith("https://")) {
        return opt.image;
      }
      try {
        const base = (axios.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
        if (base) {
          return `${base}/storage/${opt.image}`;
        }
      } catch {}
      return `/storage/${opt.image}`;
    },
    renderMarkdown(content) {
      if (!content) return "";
      try {
        content = content.replace(/\$(.+?)\$/g, (match, text) =>
          katex.renderToString(text, {
            throwOnError: false,
            displayMode: false,
          })
        );
        content = content.replace(/\$\$([^$]+)\$\$/g, (match, text) =>
          katex.renderToString(text, {
            throwOnError: false,
            displayMode: true,
          })
        );
        return content;
      } catch (err) {
        return content;
      }
    },
    isCorrectOption(correct, opt) {
      if (!correct) return false;
      const normalize = (val) => String(val).toLowerCase();
      if (Array.isArray(correct))
        return correct.map(normalize).includes(normalize(opt));
      try {
        const parsed = JSON.parse(correct);
        if (Array.isArray(parsed))
          return parsed.map(normalize).includes(normalize(opt));
        return normalize(parsed) === normalize(opt);
      } catch {
        return normalize(correct) === normalize(opt);
      }
    },
    renderMath(content, isMath) {
      if (!content) return "";

      // If this is not marked as a math question, render as normal text/markdown
      if (!isMath) {
        return this.renderMarkdown(content);
      }

      try {
        // If the entire content is a single math expression delimited by
        // $$...$$, $...$, \(...\) or \[...\], let the utility handle it directly.
        if (/^(\$\$.*\$\$|\$[^\$]*\$|\\\(.*\\\)|\\\[.*\\\])$/.test(content)) {
          return renderMathUtil(content);
        }

        let result = content;

        // Block math $$...$$
        result = result.replace(/\$\$(.*?)\$\$/g, (match, tex) =>
          renderMathUtil(`$$${tex}$$`)
        );

        // Inline math $...$
        result = result.replace(/\$([^\$]+)\$/g, (match, tex) =>
          renderMathUtil(`$${tex}$`)
        );

        // Inline math \(...\)
        result = result.replace(/\\\((.*?)\\\)/g, (match, tex) =>
          renderMathUtil(`\\(${tex}\\)`)
        );

        return result;
      } catch (err) {
        console.warn("Math rendering error:", err);
        return this.renderMarkdown(content);
      }
    },

    // -------- Fetching (filters view) --------
    async fetchGradeLevels() {
      try {
        const res = await axios.get("/grade-levels");
        this.gradeLevels = res.data;
      } catch {
        this.gradeLevels = [];
      }
    },
    async fetchSubjects() {
      if (!this.selectedGrade) return;
      try {
        const res = await axios.get(
          `/grade-levels/${this.selectedGrade}/subjects`
        );
        this.subjects = res.data;
        this.topics = [];
        this.selectedSubject = "";
      } catch {
        this.subjects = [];
      }
    },
    async fetchTopics() {
      if (!this.selectedGrade || !this.selectedSubject) return;
      try {
        const res = await axios.get(
          `/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/units`
        );
        this.topics = res.data || [];
        this.selectedTopic = "";
      } catch {
        this.topics = [];
      }
    },
    async fetchQuestions(page = 1) {
      if (!this.selectedTopic) return;
      this.loading = true;
      try {
        const params = {
          page,
          page_size: this.pageSize,
          search: this.searchText || undefined,
          topic_id: this.selectedTopic || undefined,
          subject_id: this.selectedSubject || undefined,
          grade_level_id: this.selectedGrade || undefined,
          question_type: this.filterQuestionType || undefined,
          difficulty_level: this.filterDifficulty || undefined,
        };

        const res = await axios.get(`/questions/search`, { params });

        const data = res.data?.data || [];
        this.questions = Array.isArray(data) ? data : [];

        if (res.data?.pagination) {
          this.currentPage = res.data.pagination.current_page;
          this.totalPagesFromApi = res.data.pagination.last_page;
          this.totalQuestions = res.data.pagination.total;
          this.hasMore =
            res.data.pagination.current_page < res.data.pagination.last_page;
        } else {
          this.totalPagesFromApi = null;
          this.totalQuestions = this.questions.length;
        }
      } catch (err) {
        console.error(err);
        this.questions = [];
        this.totalPagesFromApi = null;
        this.totalQuestions = 0;
      } finally {
        this.loading = false;
      }
    },
    goToPage(page) {
      const target = Math.min(Math.max(1, page), this.totalPages || 1);
      if (target === this.currentPage) return;
      this.fetchQuestions(target);
    },
    applySearch() {
      this.currentPage = 1;
      this.totalPagesFromApi = null;
      this.fetchQuestions(1);
    },
    resetFilters() {
      this.searchText = "";
      this.filterQuestionType = "";
      this.filterDifficulty = "";
      this.applySearch();
    },
    confirmDelete(q) {
      if (!confirm("Are you sure you want to delete this question?")) return;
      axios
        .delete(`/questions/${q.id}`)
        .then(() => this.fetchQuestions())
        .catch((err) => console.error(err));
    },

    // -------- AI helpers --------
    normalizeOptions(options) {
      if (!options) return [];
      if (Array.isArray(options)) return options;
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    formatAiCorrectAnswer(answer) {
      if (Array.isArray(answer)) return answer.join(", ");
      if (typeof answer === "object" && answer !== null) {
        try {
          return JSON.stringify(answer);
        } catch {
          return String(answer);
        }
      }
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) return parsed.join(", ");
        if (typeof parsed === "object" && parsed !== null)
          return JSON.stringify(parsed);
      } catch {
        // ignore
      }
      return String(answer);
    },
    isAiSelected(q) {
      return this.aiSelectedQuestions.includes(q);
    },
    toggleAiQuestionSelection(q) {
      if (this.isAiSelected(q)) {
        this.aiSelectedQuestions = this.aiSelectedQuestions.filter(
          (item) => item !== q
        );
      } else {
        this.aiSelectedQuestions.push(q);
      }
    },
    toggleAiSelectAll() {
      if (this.aiAllSelected) {
        this.aiSelectedQuestions = [];
      } else {
        this.aiSelectedQuestions = [...this.aiGeneratedQuestions];
      }
    },
    async generateAIQuestions() {
      if (!this.selectedTopic || !this.aiPrompt) return;
      this.aiError = "";
      this.aiSaveMessage = "";
      this.aiGeneratedQuestions = [];
      this.aiSelectedQuestions = [];
      try {
        this.aiGenerateLoading = true;
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.post(
          "/questions/ai-generate",
          {
            prompt: this.aiPrompt,
            topic_id: this.selectedTopic,
            question_type: this.aiQuestionType,
            difficulty_level: this.aiDifficulty,
          },
          { headers }
        );
        const data = res.data;
        if (data && data.success && Array.isArray(data.data)) {
          this.aiGeneratedQuestions = data.data.map((q) => {
            const newQ = { ...q };
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
              } catch {
                // leave as string
              }
            }
            return newQ;
          });
        } else {
          this.aiError =
            (data && data.message) || "Failed to generate AI questions.";
        }
      } catch (err) {
        this.aiError =
          err?.response?.data?.message ||
          "An unexpected error occurred while generating AI questions.";
      } finally {
        this.aiGenerateLoading = false;
      }
    },
    async saveSelectedAIQuestions() {
      if (!this.aiSelectedQuestions.length || !this.selectedTopic) return;
      this.aiError = "";
      this.aiSaveMessage = "";
      try {
        this.aiSaveLoading = true;
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const saved =[];
        for (const q of this.aiSelectedQuestions) {
      const payload = {
        topic_id: this.selectedTopic,
        question: q.question,
        question_type: q.question_type || this.aiQuestionType,
        difficulty_level: q.difficulty_level || this.aiDifficulty,
        options: q.options || [],
        correct_answer: q.correct_answer || "",
        is_math: q.is_math ? 1 : 0,
        is_chemistry: 0,
        multiple_answers: 0,
        is_required: 0,
      };
        const res = await axios.post(
          "/questions/ai-generate/store",
          payload,
          { headers }
        );
        saved.push(res.data);

              this.aiSaveMessage = `Saved ${saved.length} AI questions.`;

          this.aiGeneratedQuestions = [];
          this.aiSelectedQuestions = [];
          this.fetchQuestions();
        }
      } catch (err) {
        this.aiError =
          err?.response?.data?.message ||
          "An unexpected error occurred while saving AI questions.";
      } finally {
        this.aiSaveLoading = false;
      }
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
      this.fetchQuestions();
    },
  },
};
</script>

<style scoped>
.question-card {
  transition: all 0.2s ease-in-out;
}
.question-card:hover {
  transform: translateY(-2px);
}
.matching-container {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.matching-item-left,
.matching-item-right {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  padding: 0.5em 0.75em;
  border-radius: 6px;
  margin-bottom: 0.3em;
  transition: all 0.2s;
}

.matching-item-left:hover,
.matching-item-right:hover {
  background-color: #e2e8f0;
}

.matching-pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25em 0;
}

.pair-left,
.pair-right {
  font-weight: 500;
}

.arrow {
  font-weight: 700;
  color: #0d6efd;
}
.option-card {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  transition: all 0.2s ease-in-out;
  margin-bottom: 0.5rem;
}

.option-card:hover {
  border-color: #adb5bd;
  background-color: #f8f9fa;
}

.option-card.correct {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.option-label {
  font-family: "Times New Roman", Times, serif;
  font-size: 1em;
  color: #6c757d;
  min-width: 20px;
  font-weight: 500;
}

.math-content {
  font-size: 1.05em;
}

.search-row {
  background-color: #e7f1ff;
  border-radius: 0.5rem;
  padding: 0.75rem 0.75rem 0.25rem;
}

.questions-list img.img-thumbnail {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: zoom-in;
}

@media (hover: hover) and (pointer: fine) {
  .questions-list img.img-thumbnail:hover {
    transform: scale(2);
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
}

</style>
