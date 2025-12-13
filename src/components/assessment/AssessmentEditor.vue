<template>
  <div class="container py-4" v-if="loaded">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold text-primary">Assessment Review</h3>
      <div class="d-flex align-items-center gap-2">
        <button
          class="btn btn-outline-danger btn-sm me-2"
          title="Delete Assessment"
          :disabled="deleting || exportingStudent || exportingTeacher"
          @click="confirmDelete"
        >
          <span v-if="deleting" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-trash me-1"></i>
          <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
        </button>
        <button
          class="btn btn-outline-primary btn-sm me-2"
          title="Export Student Version"
          @click="exportStudentPdf"
          :disabled="exportingStudent || exportingTeacher"
        >
          <span v-if="exportingStudent" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-file-earmark-pdf me-1"></i>
          <span>{{ exportingStudent ? 'Exporting...' : 'Student PDF' }}</span>
        </button>
        <button
          class="btn btn-outline-primary btn-sm me-2"
          title="Export Student Version (with Sections)"
          @click="exportStandardStudentPdf"
          :disabled="exportingStudent || exportingTeacher"
        >
          <span v-if="exportingStudent" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-files me-1"></i>
          <span>{{ exportingStudent ? 'Exporting...' : 'Standard Student PDF' }}</span>
        </button>
        <button
          class="btn btn-outline-success btn-sm me-3"
          title="Export Marking Guide"
          @click="exportTeacherPdf"
          :disabled="exportingTeacher || exportingStudent"
        >
          <span v-if="exportingTeacher" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-check2-square me-1"></i>
          <span>{{ exportingTeacher ? 'Exporting...' : 'Marking Guide' }}</span>
        </button>
        <router-link to="/teacher/create-assessment" class="btn btn-outline-secondary">
          ← Back to Assessments
        </router-link>
      </div>
    </div>

    <!-- Assessment Info -->
    <div class="card mb-4 shadow-sm">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="flex-grow-1 me-3">
            <h5 v-if="!editingTitle" class="card-title mb-0">{{ assessment.title }}</h5>
            <div v-else class="d-flex align-items-center gap-2">
              <input
                v-model.trim="editableTitle"
                type="text"
                class="form-control form-control-sm"
                :disabled="savingTitle"
                :placeholder="assessment.title || 'Assessment title'"
              />
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button v-if="!editingTitle" class="btn btn-sm btn-outline-primary" @click="startEditTitle">
              Edit Title
            </button>
            <template v-else>
              <button class="btn btn-sm btn-primary" :disabled="savingTitle || !editableTitle" @click="saveAssessmentTitle">
                <span v-if="savingTitle" class="spinner-border spinner-border-sm me-1"></span>
                Save
              </button>
              <button class="btn btn-sm btn-light" :disabled="savingTitle" @click="cancelEditTitle">Cancel</button>
            </template>
          </div>
        </div>
        <p class="text-muted mb-0">
          Type: <strong>{{ assessment.type }}</strong> | Questions:
          <strong>{{ localQuestions.length }}</strong> | Total Marks:
          <strong>{{ totalMarks }}</strong> | Mode:
          <strong>{{ assessment.delivery_mode }}</strong>
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: currentTab === 'questions' }"
          type="button"
          @click="currentTab = 'questions'"
        >
          Normal Paper
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: currentTab === 'sections' }"
          type="button"
          @click="currentTab = 'sections'"
        >
          Standard Paper
        </button>
      </li>
    </ul>

    <!-- Questions Section -->
    <div v-if="currentTab === 'questions'" class="card shadow-sm mb-4">
      <div class="card-header bg-primary text-white fw-semibold">Questions</div>
      <div class="card-body">
        <draggable
          v-model="localQuestions"
          item-key="id"
          :animation="200"
          handle=".handle"
        >
          <template #item="{ element, index }">
            <div
              class="border rounded p-3 mb-2 d-flex align-items-start justify-content-between"
            >
              <div class="d-flex align-items-start">
                <span class="handle me-2" style="cursor: grab; font-size: 1.3em"
                  >&#9776;</span
                >
                <div>
                  <div v-html="element.question.question"></div>
                  <img
                    v-if="element.question.question_image || element.question.question_image_url"
                    :src="getQuestionImageUrl(element.question)"
                    alt="Question Image"
                    class="img-thumbnail mt-1"
                    style="max-width: 220px; max-height: 150px; object-fit: contain;"
                  />
                  <small class="text-muted d-block mt-1">
                    Type: {{ element.question.question_type }} | Points:
                    {{ element.question.marks }}
                  </small>

                  <!-- Parent question: show sub-questions summary if present -->
                  <div
                    v-if="element.question.question_type === 'parent' && Array.isArray(element.question.sub_questions) && element.question.sub_questions.length"
                    class="mt-2 ps-2 border-start"
                  >
                    <div class="fw-semibold mb-1">Sub-questions:</div>
                    <ol class="mb-2 ps-3">
                      <li
                        v-for="(sub, sIdx) in element.question.sub_questions"
                        :key="sub.id || sIdx"
                        class="mb-1"
                      >
                        <div>
                          <span v-html="sub.question"></span>
                        </div>
                        <small class="text-muted">
                          Type: {{ sub.question_type }}
                          <span v-if="sub.marks != null && sub.marks !== ''">
                            | Points: {{ sub.marks }}
                          </span>
                        </small>
                      </li>
                    </ol>
                  </div>

                  <!-- Render options/answers -->
                  <div class="mt-2">
                    <!-- MCQ -->
                    <div v-if="element.question.question_type === 'mcq'"
                         class="mb-2 d-flex flex-wrap align-items-start gap-3 ps-1">
                      <div v-for="(opt, oi) in parseOptions(element.question.options)"
                           :key="oi"
                           class="d-inline-flex flex-column"
                           :class="{ 'text-success fw-semibold': isCorrectOption(element.question.correct_answer, getOptionValue(opt)) }">
                        <div class="d-flex align-items-center">
                          <span class="me-1 text-muted">{{ String.fromCharCode(65 + oi) }}.</span>
                          <span>{{ getOptionValue(opt) }}</span>
                          <i v-if="isCorrectOption(element.question.correct_answer, getOptionValue(opt))"
                             class="bi bi-check-circle ms-1"></i>
                        </div>
                        <img
                          v-if="getOptionImageUrl(opt)"
                          :src="getOptionImageUrl(opt)"
                          alt="Option Image"
                          class="img-thumbnail mt-1"
                          style="max-width: 180px; max-height: 120px; object-fit: contain;"
                        />
                      </div>
                    </div>

                    <!-- True/False -->
                    <div v-else-if="element.question.question_type === 'true_false'" class="mb-2 d-flex align-items-center gap-4 ps-1">
                      <div class="d-inline-flex align-items-center"
                           :class="{ 'text-success fw-semibold': isCorrectOption(element.question.correct_answer, 'true') }">
                        <span class="me-1">True</span>
                        <i v-if="isCorrectOption(element.question.correct_answer, 'true')"
                           class="bi bi-check-circle ms-1"></i>
                      </div>
                      <div class="d-inline-flex align-items-center"
                           :class="{ 'text-success fw-semibold': isCorrectOption(element.question.correct_answer, 'false') }">
                        <span class="me-1">False</span>
                        <i v-if="isCorrectOption(element.question.correct_answer, 'false')"
                           class="bi bi-check-circle ms-1"></i>
                      </div>
                    </div>

                    <!-- Matching -->
                    <div v-else-if="element.question.question_type === 'matching'" class="mb-2">
                      <div class="row g-3">
                        <div class="col-12 col-md-6">
                          <strong>Left</strong>
                          <ul class="list-group list-group-flush">
                            <li v-for="(txt, i) in getMatchingItems(element.question).left"
                                :key="'left-'+i"
                                class="list-group-item py-1">{{ txt }}</li>
                          </ul>
                        </div>
                        <div class="col-12 col-md-6">
                          <strong>Right</strong>
                          <ul class="list-group list-group-flush">
                            <li v-for="(txt, i) in getMatchingItems(element.question).right"
                                :key="'right-'+i"
                                class="list-group-item py-1">{{ txt }}</li>
                          </ul>
                        </div>
                      </div>
                      <div class="mt-2">
                        <strong>✅ Correct Pairs:</strong>
                        <ul class="list-unstyled mb-0">
                          <li v-for="(pair, i) in getMatchingItems(element.question).pairs" :key="'pair-'+i">
                            {{ getMatchingItems(element.question).left[pair.left_index] || `Left ${pair.left_index + 1}` }}
                            →
                            {{ getMatchingItems(element.question).right[pair.right_index] || `Right ${pair.right_index + 1}` }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="removeQuestion(index)"
              >
                Remove
              </button>
            </div>
          </template>
        </draggable>

        <!-- Add Question Section -->
        <div class="mt-3">
          <button class="btn btn-outline-primary btn-sm" @click="showAddModal = true">
            Add more Questions
          </button>
        </div>
      </div>
    </div>

    <!-- Save Questions -->
    <div v-if="currentTab === 'questions'" class="card shadow-sm mb-4">
      <div class="card-body">
        <button
          class="btn btn-primary"
          :disabled="saving"
          @click="saveQuestions"
        >
          <span v-if="saving">Saving...</span>
          <span v-else>Save Questions</span>
        </button>
        <span v-if="saveSuccess" class="text-success ms-2">✅ Saved!</span>
      </div>
    </div>

    <!-- Sections Manager -->
    <SectionsTab
      v-if="currentTab === 'sections'"
      :assessment="assessment"
      :local-questions="localQuestions"
    />

   
  </div>
  <AddQuestionsModal
    v-model="showAddModal"
    :assessment-id="assessment.id"
    :existing-question-ids="new Set(localQuestions.map(q => q.question.id))"
    @add-questions="handleAddQuestions"
  />
  <!-- Headless PDF generator for student/teacher exports -->
  <AssessmentPdfGenerator ref="pdfGen" />
  <!-- Headless PDF generator for standard (sections-based) exports -->
  <StandardAssessmentPdfGenerator ref="standardPdfGen" />
</template>

<script>
import draggable from "vuedraggable";
import axios from "axios";
import { Modal } from "bootstrap";
import {
  parseOptions,
  getOptionValue,
  isCorrectOption,
  getMatchingItems,
  getOptionImageUrl,
  getQuestionImageUrl,
} from "@/utils/questionDisplay";
import AddQuestionsModal from "./AddQuestionsModal.vue";
import SectionsTab from "./SectionsTab.vue";
import AssessmentPdfGenerator from "./AssessmentPdfGenerator.vue";
import StandardAssessmentPdfGenerator from "./StandardAssessmentPdfGenerator.vue";

export default {
  name: "AssessmentEditor",
  components: { draggable, AddQuestionsModal, SectionsTab, AssessmentPdfGenerator, StandardAssessmentPdfGenerator },

  data() {
    return {
      showAddModal: false,
      assessment: {},
      allQuestions: [],
      students: [],
      localQuestions: [],
      selectedStudents: [],
      assigning: false,
      assignSuccess: false,
      saving: false,
      saveSuccess: false,
      loaded: false,
      exportingStudent: false,
      exportingTeacher: false,
      deleting: false,
      currentTab: "questions",
      // Sections state (now handled in SectionsTab but kept for compatibility)
      sections: [],
      sectionsLoading: false,
      sectionsLoaded: false,
      sectionsError: "",
      creatingSection: false,
      activeSectionId: null,
      sectionQuestionSelection: [],
      savingSectionQuestions: false,
      sectionWarnings: [],
      newSection: {
        title: "",
        instruction: "",
      },
      // Add Questions modal state (two-step topic-based picker)
      addModal: null,
      addStep: 1,
      gradeLevels: [],
      subjects: [],
      addTopics: [],
      addQuestions: [],
      addSelected: [],
      adding: false,
      loadingAddTopics: false,
      loadingAddQuestions: false,
      addForm: {
        grade_level_id: "",
        subject_id: "",
        topic_ids: [],
      },
      addTopicQuery: "",
      filteredAddTopicOptions: [],
    };
  },

  computed: {
    totalMarks() {
      try {
        return this.localQuestions.reduce((sum, item) => {
          const q = item && item.question ? item.question : null;
          if (!q) return sum;

          // If there are sub-questions, use the sum of their marks
          if (Array.isArray(q.sub_questions) && q.sub_questions.length) {
            const subTotal = q.sub_questions.reduce((s, sub) => {
              const m = parseFloat(sub && sub.marks != null ? sub.marks : 0);
              return s + (isNaN(m) ? 0 : m);
            }, 0);
            return sum + subTotal;
          }

          // Otherwise, fall back to the question's own marks
          const m = parseFloat(q.marks != null ? q.marks : 0);
          return sum + (isNaN(m) ? 0 : m);
        }, 0);
      } catch (_) {
        return 0;
      }
    },
  },

  mounted() {
    this.loadData();
  },

  methods: {
    async handleAddQuestions(ids) {
      const calls = ids.map((id) => axios.get(`/questions/${id}`));
      const results = await Promise.all(calls);
      const newQs = results.map((r) => r.data);

      const existingIds = new Set(this.localQuestions.map((q) => q.question.id));
      newQs.forEach((q) => {
        if (q && q.id && !existingIds.has(q.id)) {
          this.localQuestions.push({ question: q });
        }
      });
    },

    async loadData() {
      const id = this.$route.params.id;
      this.loaded = false;
      try {
        const [assessmentRes, questionsRes] = await Promise.all([
          axios.get(`/assessments/${id}/details`),
          axios.get("/questions/all"),
        ]);
        const assessment = assessmentRes.data.assessment || {};
        this.assessment = assessment;
        this.localQuestions = Array.isArray(assessment.questions)
          ? [...assessment.questions]
          : [];
        this.allQuestions = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : questionsRes.data?.data || [];
      } catch (error) {
        console.error("❌ Failed to load assessment:", error);
        alert("Failed to load assessment.");
      } finally {
        this.loaded = true;
      }
    },

    confirmDelete() {
      alert("Delete assessment is not wired yet.");
    },

    async exportStudentPdf() {
      if (!this.assessment?.id) {
        alert("Assessment ID is missing.");
        return;
      }
      this.exportingStudent = true;
      try {
        const response = await axios.get(
          `/assessments/${this.assessment.id}/pdf/student?layout=standard`,
          { responseType: "blob" }
        );

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        const safeTitle = (this.assessment.title || "assessment")
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();

        link.href = url;
        link.download = `student-assessment-${safeTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to export student PDF", e);
        alert("Failed to export student PDF.");
      } finally {
        this.exportingStudent = false;
      }
    },

    async exportTeacherPdf() {
      if (!this.assessment?.id || !this.localQuestions.length) {
        alert("No questions to export.");
        return;
      }
      const gen = this.$refs.pdfGen;
      if (!gen || typeof gen.generatePdf !== "function") {
        alert("PDF generator is not available.");
        return;
      }
      const qs = this.localQuestions.map((item) => {
        const q = item.question || {};
        let options = q.options;
        let matching_items = q.matching_items || null;
        let matching_pairs = q.matching_pairs || null;

        if (q.question_type === "mcq") {
          try {
            const parsed = parseOptions(q.options);
            options = parsed.map((opt) => ({
              option_text: getOptionValue(opt),
              option_image: getOptionImageUrl(opt) || null,
              is_correct: isCorrectOption(q.correct_answer, getOptionValue(opt)),
            }));
          } catch (e) {
            options = [];
          }
        } else if (q.question_type === "matching") {
          const mi = getMatchingItems(q);
          matching_items = { left: mi.left, right: mi.right };
          matching_pairs = mi.pairs;
        }

        return {
          ...q,
          question_text: q.question_text || q.question || "",
          is_math: q.is_math || false,
          options,
          matching_items,
          matching_pairs,
        };
      });
      this.exportingTeacher = true;
      try {
        await gen.generatePdf(this.assessment, qs, true /* isTeacher */);
      } catch (e) {
        console.error("Failed to export teacher PDF", e);
        alert("Failed to export teacher PDF.");
      } finally {
        this.exportingTeacher = false;
      }
    },

    async exportStandardStudentPdf() {
      if (!this.assessment?.id) {
        alert("Assessment ID is missing.");
        return;
      }
      this.exportingStudent = true;
      try {
        const response = await axios.get(
          `/assessments/${this.assessment.id}/pdf/student?layout=normal`,
          { responseType: "blob" }
        );

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        const safeTitle = (this.assessment.title || "assessment-sections")
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();

        link.href = url;
        link.download = `student-assessment-${safeTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to export standard student PDF", e);
        alert("Failed to export standard student PDF.");
      } finally {
        this.exportingStudent = false;
      }
    },

    parseOptions,
    getOptionValue,
    isCorrectOption,
    getMatchingItems,
    getOptionImageUrl,
    getQuestionImageUrl,

    // Add Questions modal (two-step topic-based picker)
    openAddModal() {
      if (!this.addModal && this.$refs.addModalEl) {
        this.addModal = new Modal(this.$refs.addModalEl);
      }
      if (this.addModal) {
        this.addModal.show();
      }

      // Reset form and step
      this.addStep = 1;
      this.addForm = {
        grade_level_id: this.assessment.grade_level_id || "",
        subject_id: this.assessment.subject_id || "",
        topic_ids: [],
      };
      this.addTopicQuery = "";
      this.filteredAddTopicOptions = [];
      this.addQuestions = [];
      this.addSelected = [];

      this.loadAddInitial();
    },

    closeAddModal() {
      if (this.addModal) {
        try {
          this.addModal.hide();
        } catch (e) {}
      }
      this.addSelected = [];
    },

    clearAddSelection() {
      this.addSelected = [];
    },

    async loadAddInitial() {
      try {
        const [gRes, sRes] = await Promise.all([
          axios.get("/grade-levels"),
          axios.get("/subjects"),
        ]);
        this.gradeLevels = gRes.data || [];
        this.subjects = sRes.data || [];
      } catch (e) {
        this.gradeLevels = [];
        this.subjects = [];
      }
    },

    onAddGradeChange() {
      this.addForm.topic_ids = [];
      this.addTopicQuery = "";
      this.addTopics = [];
      this.filteredAddTopicOptions = [];
      if (this.addForm.subject_id) {
        this.loadAddTopics();
      }
    },

    async loadAddTopics() {
      if (!this.addForm.grade_level_id || !this.addForm.subject_id) return;
      this.loadingAddTopics = true;
      try {
        const res = await axios.get("/topics", {
          params: {
            grade_level_id: this.addForm.grade_level_id,
            subject_id: this.addForm.subject_id,
          },
        });
        this.addTopics = res.data || [];
        this.filteredAddTopicOptions = this.addTopics.filter(
          (t) => !this.addForm.topic_ids.includes(t.id)
        );
      } catch (e) {
        this.addTopics = [];
        this.filteredAddTopicOptions = [];
      } finally {
        this.loadingAddTopics = false;
      }
    },

    filterAddTopicOptions() {
      const q = this.addTopicQuery.trim().toLowerCase();
      if (!q) {
        this.filteredAddTopicOptions = this.addTopics.filter(
          (t) => !this.addForm.topic_ids.includes(t.id)
        );
        return;
      }
      this.filteredAddTopicOptions = this.addTopics.filter(
        (t) =>
          !this.addForm.topic_ids.includes(t.id) &&
          t.topic_name.toLowerCase().includes(q)
      );
    },

    selectAddTopic(topic) {
      if (!this.addForm.topic_ids.includes(topic.id))
        this.addForm.topic_ids.push(topic.id);
      this.addTopicQuery = "";
      this.filterAddTopicOptions();
    },

    toggleAddTopic(id) {
      this.addForm.topic_ids = this.addForm.topic_ids.includes(id)
        ? this.addForm.topic_ids.filter((x) => x !== id)
        : [...this.addForm.topic_ids, id];
      this.filterAddTopicOptions();
    },

    addAddTopicFromQuery() {
      const match = this.filteredAddTopicOptions[0];
      if (match) this.selectAddTopic(match);
    },

    getAddTopicName(id) {
      const t = this.addTopics.find((x) => x.id === id);
      return t ? t.topic_name : "Unknown";
    },

    async loadAddQuestions() {
      if (!this.addForm.topic_ids.length) {
        alert("Select topics first.");
        return;
      }
      if (this.loadingAddQuestions) return;

      this.loadingAddQuestions = true;
      try {
        // Primary: GET /questions/topics with topic_ids[] params
        const res = await axios.get("/questions/topics", {
          params: {
            "topic_ids[]": this.addForm.topic_ids,
          },
        });
        const payload = res.data;
        this.addQuestions = Array.isArray(payload)
          ? payload
          : payload.data || [];
        this.addSelected = [];
        this.addStep = 2;
        return;
      } catch (err) {
        // 404 fallback: fetch per-topic questions and merge
        if (err.response && err.response.status === 404) {
          try {
            const calls = this.addForm.topic_ids.map((id) =>
              axios.get(`/topics/${id}/questions/no-pagination`)
            );
            const results = await Promise.all(calls);
            const all = [];
            results.forEach((r) => {
              const arr = Array.isArray(r.data) ? r.data : r.data.data || [];
              arr.forEach((q) => all.push(q));
            });
            const map = {};
            all.forEach((q) => {
              if (q && q.id) map[q.id] = q;
            });
            this.addQuestions = Object.values(map);
            this.addSelected = [];
            this.addStep = 2;
            return;
          } catch (innerErr) {
            console.error("Fallback per-topic fetch failed:", innerErr);
            alert("Failed to load questions (fallback).");
            return;
          }
        }

        console.error("Failed to load questions for topics:", err);
        alert(err.response?.data?.message || "Failed to load questions.");
      } finally {
        this.loadingAddQuestions = false;
      }
    },

    getAddQuestionText(id) {
      const q = this.addQuestions.find((x) => x.id === id);
      if (!q || !q.question) return "";
      const plain = String(q.question).replace(/<[^>]*>/g, "");
      return plain.length > 80 ? plain.slice(0, 80) + "..." : plain;
    },

    addSelectedQuestions() {
      if (!this.addSelected.length) return;
      this.adding = true;
      const existingIds = new Set(
        this.localQuestions.map((q) => q.question.id)
      );
      const toAdd = this.addQuestions.filter(
        (q) => this.addSelected.includes(q.id) && !existingIds.has(q.id)
      );
      toAdd.forEach((q) => {
        this.localQuestions.push({ question: q });
      });
      this.closeAddModal();
      this.adding = false;
    },

    removeQuestion(idx) {
      this.localQuestions.splice(idx, 1);
    },

    async saveQuestions() {
      if (!this.assessment?.id) {
        return alert("Assessment ID is missing. Try reloading the page.");
      }
      if (!this.localQuestions.length) {
        return alert("No questions to save.");
      }
      this.saving = true;
      try {
        await axios.post(`/assessments/${this.assessment.id}/questions`, {
          assessment_id: this.assessment.id,
          question_ids: this.localQuestions.map((q) => q.question.id),
        });
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 2000);
      } catch (error) {
        console.error("❌ Failed to save questions:", error);
        const msg = error.response?.data?.message || "Failed to save questions";
        alert(`❌ ${msg}`);
      } finally {
        this.saving = false;
      }
    },

    async assignAssessment() {
      this.assigning = true;
      try {
        await axios.post("/assign-assessment", {
          assessment_id: this.assessment.id,
          student_ids: this.selectedStudents,
          question_ids: this.localQuestions.map((q) => q.question.id),
        });
        this.assignSuccess = true;
        setTimeout(() => (this.assignSuccess = false), 2000);
      } catch (error) {
        alert("❌ Failed to assign assessment");
      } finally {
        this.assigning = false;
      }
    },
  },
};
</script>

<style scoped>
.handle {
  color: #888;
}
.card {
  border-radius: 0.75rem;
}
.modal-content {
  border-radius: 12px;
  overflow: hidden;
}
.modal-header {
  background: linear-gradient(90deg, #2b6cb0, #4f46e5);
  color: #fff;
}
.modal-title {
  font-weight: 700;
}
.topic-picker {
  min-height: 56px;
}
.topic-chip {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
}
.topic-options button {
  border: 1px solid #e9ecef;
}
.form-check {
  background: #fff;
}
.form-check .form-check-input {
  transform: scale(1.15);
}
.selected-question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.topic-picker .form-control:focus {
  box-shadow: none;
}
.topic-options {
  max-height: 140px;
  overflow-y: auto;
}
.topic-options::-webkit-scrollbar {
  height: 6px;
}
.topic-options::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}
.list-group-item-success {
  background-color: #d1e7dd !important;
}
.list-group-item {
  font-size: 0.9rem;
}
</style>
