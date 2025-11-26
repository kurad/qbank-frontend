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
      <router-link
        class="btn btn-primary btn-sm"
        :to="{ name: 'bulk-questions' }"
        title="Create multiple questions at once"
      >
        Bulk Add Questions
      </router-link>
      <div class="ms-2">
        <button class="btn btn-outline-secondary btn-sm" @click="useGrouped = !useGrouped">
          {{ useGrouped ? 'Switch to Filters' : 'Switch to Grouped' }}
        </button>
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
                      <span>Unit: {{ topic.topic_name }}</span>
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
                                <div class="fw-semibold fs-5 mb-2" v-html="q.is_math ? (console.log('Question data:', {text: q.question, is_math: q.is_math}), renderMath(q.question)) : q.question"></div>
                                <img v-if="q.question_image_url" :src="q.question_image_url" alt="Question Image" class="img-thumbnail mt-2" style="max-width: 220px; max-height: 150px; object-fit: contain" />
                              </div>
                              <div>
                                <template v-if="q.question_type === 'mcq' && Array.isArray(q.options)">
                                  <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check mb-2 p-1 ms-2" :class="{ 'bg-success-subtle border-success': isCorrectOption(q.correct_answer, getOptionValue(opt)) }">
                                    <input class="form-check-input me-2" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                                    <label class="form-check-label d-flex ms-3">
                                      <span class="fw-bold me-2">{{ String.fromCharCode(65 + oidx) }}.</span>
                                      <span v-html="q.is_math ? renderMath(getOptionValue(`$${opt}$`)) : getOptionValue(opt)"></span>
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
                                <div v-html="renderMath(q.explanation)"></div>
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
    <div v-else class="filter-section mb-4 shadow-sm">
      <form class="row g-3 align-items-end">
        <div class="col-md-3 mb-3">
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

        <div class="col-md-3 mb-3" v-if="subjects.length">
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

        <div class="col-md-3 mb-3" v-if="topics.length">
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
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage = Math.max(1, currentPage - 1)">Prev</button>
            </li>
            <li class="page-item disabled"><span class="page-link">{{ currentPage }} / {{ totalPages }}</span></li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next</button>
            </li>
          </ul>
        </nav>
      </div>
      <div
        v-for="(q, idx) in pagedQuestions"
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
                class="option-card py-2 px-3 mb-1"
                :class="{ 'correct': isCorrectOption(q.correct_answer, getOptionValue(opt)) }"
              >
                <div class="d-flex align-items-start">
                  <div class="option-label me-2">{{ String.fromCharCode(65 + oidx) }}.</div>
                  <div class="flex-grow-1 math-content small" v-html="q.is_math ? renderMath(getOptionValue(`$${opt}$`)) : getOptionValue(opt)"></div>
                  <div class="ms-1">
                    <span v-if="isCorrectOption(q.correct_answer, getOptionValue(opt))" class="text-success">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                </div>
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
            <!-- Matching -->
            <template v-else-if="q.question_type === 'matching'">
              <div class="matching-container mb-3">
                <div class="row g-3">
                  <div class="col-md-5">
                    <strong>Left Column</strong>
                    <ul class="list-group list-group-flush">
                      <li
                        v-for="(item, idx) in q.matching_items?.left || []"
                        :key="'left-' + idx"
                        class="list-group-item matching-item-left"
                      >
                        {{ item || `Left ${idx + 1}` }}
                      </li>
                    </ul>
                  </div>
                  <div class="col-md-5">
                    <strong>Right Column</strong>
                    <ul class="list-group list-group-flush">
                      <li
                        v-for="(item, idx) in q.matching_items?.right || []"
                        :key="'right-' + idx"
                        class="list-group-item matching-item-right"
                      >
                        {{ item || `Right ${idx + 1}` }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Correct Pairs -->
                <div class="mt-3">
                  <strong>✅ Correct Pairs:</strong>
                  <ul class="list-unstyled mb-0">
                    <li
                      v-for="(pair, idx) in q.matching_pairs || []"
                      :key="'pair-' + idx"
                      class="matching-pair"
                    >
                      <span class="pair-left">
                        {{
                          q.matching_items?.left?.[pair.left_index] ||
                          `Left ${pair.left_index + 1}`
                        }}
                      </span>
                      <span class="arrow">→</span>
                      <span class="pair-right">
                        {{
                          q.matching_items?.right?.[pair.right_index] ||
                          `Right ${pair.right_index + 1}`
                        }}
                      </span>
                    </li>
                  </ul>
                </div>
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
import katex from "katex";
import "katex/dist/katex.min.css";
import { renderMath as renderMathUtil } from "@/utils/mathRenderer";

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
      // Grouped browser state
      expandedGrades: new Set(),
      expandedSubjects: new Set(), // keys: `${gradeId}-${subjectId}`
      expandedTopics: new Set(),
      subjectsByGrade: {},
      topicsBySubjectGrade: {}, // key: `${gradeId}-${subjectId}`
      questionsByTopic: {},
      topicLoading: new Set(),
      useGrouped: true,
    };
  },
  computed: {
    filteredQuestions() {
      return this.questions.filter((q) => q.topic_id === this.selectedTopic);
    },
    processedQuestions() {
      return this.filteredQuestions.map((q) => {
        const newQ = { ...q };

        // Parse options for MCQ or matching
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
          } catch {}
        }

        // Normalize true/false
        if (newQ.question_type === "true_false") {
          newQ.correct_answer = String(newQ.correct_answer).toLowerCase();
        }

        // Ensure matching items
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
      const len = this.processedQuestions.length;
      return Math.max(1, Math.ceil(len / this.pageSize));
    },
    pagedQuestions() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.processedQuestions.slice(start, start + this.pageSize);
    },
  },
  created() {
    this.fetchGradeLevels();
  },
  methods: {
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
          const res = await axios.get(`/subjects/${subjectId}/grades/${gradeId}/units`);
          this.topicsBySubjectGrade[key] = res.data || [];
        } catch {
          this.topicsBySubjectGrade[key] = [];
        }
      }
    },
    async toggleTopic(topicId, gradeId, subjectId) {
      if (this.expandedTopics.has(topicId)) {
        this.expandedTopics.delete(topicId);
        return;
      }
      this.expandedTopics.add(topicId);
      if (!this.questionsByTopic[topicId]) {
        this.topicLoading.add(topicId);
        try {
          const res = await axios.get(`/topics/${topicId}/questions/no-pagination`);
          const data = res.data.data || res.data || [];
          this.questionsByTopic[topicId] = Array.isArray(data) ? data : [];
        } catch {
          this.questionsByTopic[topicId] = [];
        } finally {
          this.topicLoading.delete(topicId);
        }
      }
    },
    processArray(arr) {
      return (arr || []).map((q) => {
        const newQ = { ...q };
        if (typeof newQ.options === "string") {
          try { newQ.options = JSON.parse(newQ.options); } catch { newQ.options = []; }
        }
        if (typeof newQ.correct_answer === "string") {
          try { newQ.correct_answer = JSON.parse(newQ.correct_answer); } catch {}
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
          newQ.matching_pairs = Array.isArray(newQ.correct_answer) ? newQ.correct_answer : [];
        }
        return newQ;
      });
    },
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
        content = content.replace(/\$(.+?)\$/g, (match, text) =>
          katex.renderToString(text, {
            throwOnError: false,
            displayMode: false,
          })
        );
        content = content.replace(/\$\$([^$]+)\$\$/g, (match, text) =>
          katex.renderToString(text, { throwOnError: false, displayMode: true })
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
    async fetchQuestions(page = 1, append = false) {
      if (!this.selectedTopic) return;
      this.loading = true;
      try {
        const res = await axios.get(`/topics/${this.selectedTopic}/questions/no-pagination`, {
          params: { page, page_size: this.pageSize },
        });
        const data = res.data.data || [];
        if (append) this.questions = [...this.questions, ...data];
        else this.questions = data;

        if (res.data.pagination) {
          this.currentPage = res.data.pagination.current_page;
          this.hasMore =
            res.data.pagination.current_page < res.data.pagination.total_pages;
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    confirmDelete(q) {
      if (!confirm("Are you sure you want to delete this question?")) return;
      axios
        .delete(`/questions/${q.id}`)
        .then(() => this.fetchQuestions())
        .catch((err) => console.error(err));
    },
    renderMath(content) {
      if (!content) return "";
      try {
        // If content is pure math (starts and ends with $$ or $), pass directly to renderer
        if (/^(\$\$.*\$\$|\$[^\$]*\$)$/.test(content)) {
          return renderMathUtil(content);
        }

        // For mixed content (text with embedded math), render each part separately
        let result = content;
        
        // Handle display math first ($$...$$)
        result = result.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
          return renderMathUtil(`$$${tex}$$`);
        });
        
        // Then handle inline math ($...$)
        result = result.replace(/\$([^\$]+)\$/g, (match, tex) => {
          return renderMathUtil(`$${tex}$`);
        });

        return result;
      } catch (err) {
        console.warn('Math rendering error:', err);
        return this.renderMarkdown(content);
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

</style>
