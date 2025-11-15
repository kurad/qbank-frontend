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

    <!-- Questions Section -->
    <div class="card shadow-sm mb-4">
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
                  <small class="text-muted">
                    Type: {{ element.question.question_type }} | Points:
                    {{ element.question.marks }}
                  </small>
                  <!-- Render options/answers -->
                  <div class="mt-2">
                    <!-- MCQ -->
                    <div v-if="element.question.question_type === 'mcq'"
                         class="mb-2 d-flex flex-wrap align-items-center gap-3 ps-1">
                      <div v-for="(opt, oi) in parseOptions(element.question.options)"
                           :key="oi"
                           class="d-inline-flex align-items-center"
                           :class="{ 'text-success fw-semibold': isCorrectOption(element.question.correct_answer, getOptionValue(opt)) }">
                        <span class="me-1 text-muted">{{ String.fromCharCode(65 + oi) }}.</span>
                        <span>{{ getOptionValue(opt) }}</span>
                        <i v-if="isCorrectOption(element.question.correct_answer, getOptionValue(opt))"
                           class="bi bi-check-circle ms-1"></i>
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
          <button class="btn btn-outline-primary btn-sm" @click="openAddModal">
            Add more Questions
          </button>
        </div>
      </div>
    </div>

    <!-- Save Questions -->
    <div class="card shadow-sm mb-4">
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
  </div>

  <!-- Loading State -->
  <div v-else class="text-center py-5">
    <div class="spinner-border text-primary" role="status"></div>
    <p class="mt-2 text-muted">Loading assessment...</p>
  </div>

  <!-- Add Questions Modal -->
  <div class="modal fade" tabindex="-1" ref="addModalEl">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Add Questions to Assessment</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeAddModal"
          ></button>
        </div>

        <div class="modal-body">
          <!-- Step 1 -->
          <div v-if="addStep === 1">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Grade Level</label>
                <select
                  v-model="addForm.grade_level_id"
                  class="form-select"
                  @change="onAddGradeChange"
                >
                  <option value="">Choose</option>
                  <option v-for="g in gradeLevels" :key="g.id" :value="g.id">
                    {{ g.grade_name }}
                  </option>
                </select>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label">Subject</label>
                <select
                  v-model="addForm.subject_id"
                  class="form-select"
                  @change="loadAddTopics"
                >
                  <option value="">Choose</option>
                  <option v-for="s in subjects" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label">Topics</label>
                <div class="topic-picker border rounded p-2 bg-white">
                  <div class="d-flex align-items-center flex-wrap">
                    <span
                      v-for="id in addForm.topic_ids"
                      :key="id"
                      class="badge bg-primary text-truncate topic-chip me-2 mb-2"
                    >
                      {{ getAddTopicName(id) }}
                      <button
                        type="button"
                        class="btn-close btn-close-white btn-sm ms-2"
                        @click="toggleAddTopic(id)"
                        aria-label="Remove"
                      ></button>
                    </span>

                    <input
                      v-model="addTopicQuery"
                      @input="filterAddTopicOptions"
                      @keydown.enter.prevent="addAddTopicFromQuery"
                      class="form-control form-control-sm border-0 p-0 flex-grow-1"
                      placeholder="Search and press Enter to add"
                      style="min-width: 120px"
                    />
                  </div>

                  <div v-if="loadingAddTopics" class="mt-2 text-muted small">
                    Loading topics...
                  </div>
                  <div
                    v-else-if="filteredAddTopicOptions.length"
                    class="topic-options mt-2"
                  >
                    <button
                      v-for="opt in filteredAddTopicOptions"
                      :key="opt.id"
                      class="btn btn-sm btn-light me-2 mb-2"
                      @click="selectAddTopic(opt)"
                    >
                      {{ opt.topic_name }}
                    </button>
                  </div>
                  <div v-else class="text-muted small mt-2">
                    Type to search topics
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <button
                class="btn btn-primary"
                @click="loadAddQuestions"
                :disabled="!addForm.topic_ids.length || loadingAddQuestions"
              >
                {{ loadingAddQuestions ? "Loading..." : "Load Questions" }}
              </button>
            </div>
          </div>

          <!-- Step 2 -->
          <div v-if="addStep === 2">
            <div class="row">
              <div class="col-md-7">
                <h6>Available Questions</h6>
                <div v-if="addQuestions.length === 0" class="text-muted">
                  No questions for selected topics
                </div>

                <div
                  v-for="q in addQuestions"
                  :key="q.id"
                  class="border rounded p-3 shadow-sm"
                  :class="{ 'opacity-50': existingQuestionIds.has(q.id) }"
                >
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input me-2"
                      type="checkbox"
                      :id="'addq' + q.id"
                      :value="q.id"
                      v-model="addSelected"
                      :disabled="existingQuestionIds.has(q.id)"
                    />
                    <label
                      class="form-check-label fw-bold"
                      :for="'addq' + q.id"
                      v-html="q.question"
                    ></label>
                    <span
                      v-if="existingQuestionIds.has(q.id)"
                      class="badge bg-secondary ms-2"
                    >Already Added</span>
                  </div>
                  <!-- MCQ Options -->
                  <ul
                    v-if="q.question_type === 'mcq'"
                    class="list-group-flush mb-2"
                  >
                    <li
                      v-for="(option, idx) in parseOptions(q.options)"
                      :key="idx"
                      class="list-group-item d-flex justify-content-between align-items-center"
                      :class="{
                        'list-group-item-success': option === q.correct_answer,
                      }"
                    >
                      <div>
                        <strong>{{ String.fromCharCode(65 + idx) }}.</strong>
                        <span class="ms-2">{{ option }}</span>
                      </div>
                      <i
                        v-if="option === q.correct_answer"
                        class="bi bi-check-circle text-success"
                      ></i>
                    </li>
                  </ul>
                  <!-- True/False -->
                  <div
                    v-else-if="q.question_type === 'true_false'"
                    class="mb-2"
                  >
                    <strong>Answer:</strong>
                    <span class="text-success">{{ q.correct_answer }}</span>
                  </div>
                  <!-- Other Question Types -->
                  <div v-else class="mb-2">
                    <strong>Answer: </strong> {{ q.correct_answer }}
                  </div>
                  <small class="text-muted">
                    Topic: {{ q.topic.topic_name }} | Difficulty:
                    {{ q.difficulty_level }} | Points: {{ q.marks }}
                  </small>
                </div>
              </div>

              <div class="col-md-5">
                <h6>Selected ({{ addSelected.length }})</h6>
                <ul class="list-group mb-3">
                  <li
                    v-for="id in addSelected"
                    :key="id"
                    class="list-group-item"
                  >
                    {{ getAddQuestionText(id) }}
                  </li>
                </ul>

                <button
                  class="btn btn-success w-100"
                  :disabled="adding || !addSelected.length"
                  @click="addSelectedQuestions"
                >
                  {{ adding ? "Adding..." : "Add Selected Questions" }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="addStep === 2"
            class="btn btn-secondary"
            @click="addStep = 1"
          >
            Back
          </button>
          <button
            v-if="addStep === 1"
            class="btn btn-light"
            @click="closeAddModal"
          >
            Cancel
          </button>
          <button
            v-if="addStep === 2"
            class="btn btn-outline-secondary"
            @click="clearAddSelection"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>

  <AssessmentPdfGenerator ref="pdfGen" />
</template>

<script>
import draggable from "vuedraggable";
import axios from "axios";
import { Modal } from "bootstrap";
import AssessmentPdfGenerator from "@/components/assessment/AssessmentPdfGenerator.vue";

export default {
  name: "AssessmentEditor",
  components: { draggable, AssessmentPdfGenerator },

  data() {
    return {
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
      // Add modal data
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
      // title edit
      editingTitle: false,
      editableTitle: '',
      savingTitle: false,
      titleSavedAt: 0,
    };
  },

  computed: {
    availableQuestions() {
      const existingIds = new Set(
        this.localQuestions.map((q) => q.question.id)
      );
      return this.allQuestions.filter((q) => !existingIds.has(q.id));
    },
    existingQuestionIds() {
      try {
        return new Set(this.localQuestions.map((q) => q.question.id));
      } catch (_) {
        return new Set();
      }
    },
    totalMarks() {
      try {
        return this.localQuestions.reduce((sum, item) => {
          const m = Number(item?.question?.marks ?? 0);
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

  beforeUnmount() {
    if (this.addModal) {
      try {
        this.addModal.hide();
      } catch (e) {}
      if (typeof this.addModal.dispose === "function") {
        try {
          this.addModal.dispose();
        } catch (e) {}
      }
      this.addModal = null;
    }
  },

  beforeDestroy() {
    if (this.addModal) {
      try {
        this.addModal.hide();
      } catch (e) {}
      if (typeof this.addModal.dispose === "function") {
        try {
          this.addModal.dispose();
        } catch (e) {}
      }
      this.addModal = null;
    }
  },

  methods: {
    startEditTitle() {
      this.editingTitle = true;
      this.editableTitle = String(this.assessment?.title || '');
    },
    cancelEditTitle() {
      this.editingTitle = false;
      this.editableTitle = '';
    },
    async saveAssessmentTitle() {
      if (!this.assessment?.id) return;
      const title = (this.editableTitle || '').trim();
      if (!title) return;
      this.savingTitle = true;
      try {
        await axios.patch(`/assessments/${this.assessment.id}`, { title });
        this.assessment = { ...this.assessment, title };
        this.titleSavedAt = Date.now();
        this.editingTitle = false;
      } catch (e) {
        alert('Failed to save title');
      } finally {
        this.savingTitle = false;
      }
    },
    async confirmDelete() {
      const name = this.assessment?.title || 'Untitled';
      const proceed = confirm(`Delete assessment "${name}"? This cannot be undone.`);
      if (!proceed) return;
      await this.deleteAssessment();
    },
    async deleteAssessment() {
      if (!this.assessment?.id) return;
      this.deleting = true;
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.delete(`/assessments/${this.assessment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msg = res?.data?.message || res?.data?.data?.message || 'Assessment deleted successfully';
        if (this.$showToast) this.$showToast(msg, 'success');
        this.$router.push({ name: 'create-assessment' });
      } catch (err) {
        const backend = err?.response?.data;
        const msg = backend?.message || backend?.error || 'Failed to delete assessment';
        if (this.$showToast) this.$showToast(msg, 'danger');
        console.error('Delete assessment failed:', err);
      } finally {
        this.deleting = false;
      }
    },
    buildPdfQuestions() {
      try {
        return (this.localQuestions || []).map((item) => {
          const q = item?.question || {};
          const type = String(q.question_type || '').toLowerCase();
          const correct = q.correct_answer;

          // Matching support
          if (type === 'matching') {
            let opts = q.options;
            if (typeof opts === 'string') {
              try { opts = JSON.parse(opts); } catch { opts = {}; }
            }
            const left = Array.isArray(opts?.left) ? opts.left : [];
            const right = Array.isArray(opts?.right) ? opts.right : [];
            let pairs = correct;
            if (typeof pairs === 'string') {
              try { pairs = JSON.parse(pairs); } catch { pairs = []; }
            }
            if (!Array.isArray(pairs)) pairs = [];

            return {
              id: q.id,
              question_text: q.question || q.question_text || '',
              is_math: !!q.is_math,
              question_type: type,
              question_image: q.question_image_url || q.question_image || null,
              matching_items: { left, right },
              matching_pairs: pairs,
              marks: q.marks || 0,
            };
          }

          // MCQ / True-False
          const optsRaw = this.parseOptions(q.options);
          const options = type === 'true_false'
            ? []
            : (optsRaw || []).map((opt) => {
                const text = this.getOptionValue(opt);
                let isCorrect = false;
                if (opt && typeof opt === 'object' && 'is_correct' in opt) {
                  isCorrect = !!opt.is_correct;
                } else {
                  isCorrect = this.isCorrectOption(correct, text);
                }
                return { option_text: text, is_correct: isCorrect };
              });

          return {
            id: q.id,
            question_text: q.question || q.question_text || '',
            is_math: !!q.is_math,
            question_type: type,
            question_image: q.question_image_url || q.question_image || null,
            options,
            correct_answer: type === 'true_false' ? String(correct || '').toLowerCase() : correct,
            marks: q.marks || 0,
          };
        });
      } catch (_) {
        return [];
      }
    },

    // Download helpers for backend-generated PDFs
    saveBlob(blob, fallbackName) {
      try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName || 'assessment.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (_) {}
    },

    async exportStudentPdf() {
      if (!this.assessment?.id) return;
      this.exportingStudent = true;
      try {
        const qs = this.buildPdfQuestions();
        await this.$refs.pdfGen.generatePdf(this.assessment, qs, false);
      } catch (e) {
        console.error('Student PDF export failed', e);
      } finally {
        this.exportingStudent = false;
      }
    },

    async exportTeacherPdf() {
      if (!this.assessment?.id) return;
      this.exportingTeacher = true;
      try {
        const qs = this.buildPdfQuestions();
        await this.$refs.pdfGen.generatePdf(this.assessment, qs, true);
      } catch (e) {
        console.error('Teacher PDF export failed', e);
      } finally {
        this.exportingTeacher = false;
      }
    },
    async loadData() {
      const id = this.$route.params.id;
      this.loaded = false;
      try {
        const [
          assessmentRes,
          questionsRes,
          studentsRes,
          gradesRes,
          subjectsRes,
        ] = await Promise.all([
          axios.get(`/assessments/${id}/details`),
          axios.get("/questions/all"),
          axios.get("/students"),
          axios.get("/grade-levels"),
          axios.get("/subjects"),
        ]);

        this.assessment = assessmentRes.data.assessment || {};
        this.allQuestions = questionsRes.data || [];
        this.students = studentsRes.data || [];
        this.gradeLevels = gradesRes.data || [];
        this.subjects = subjectsRes.data || [];
        this.localQuestions = Array.isArray(this.assessment.questions)
          ? [...this.assessment.questions]
          : [];
        console.log("✅ Assessment loaded successfully", this.assessment);
      } catch (error) {
        console.error("❌ Failed to load data:", error);
        alert("Failed to load assessment or related data.");
      } finally {
        this.loaded = true;
      }
    },

    openAddModal() {
      this.addModal = new Modal(this.$refs.addModalEl);
      this.addModal.show();
      this.addStep = 1;
      this.resetAddForm();
    },

    closeAddModal() {
      if (this.addModal) this.addModal.hide();
      this.resetAddForm();
    },

    resetAddForm() {
      this.addForm = {
        grade_level_id: "",
        subject_id: "",
        topic_ids: [],
      };
      this.addQuestions = [];
      this.addSelected = [];
      this.addTopics = [];
      this.addTopicQuery = "";
      this.filteredAddTopicOptions = [];
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
        const res = await axios.get(`/topics`, {
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
      if (!this.addForm.topic_ids.length) return alert("Select topics");
      if (this.loadingAddQuestions) return;
      this.loadingAddQuestions = true;
      try {
        const res = await axios.get("/questions/by-topics", {
          params: { "topic_ids[]": this.addForm.topic_ids },
        });
        this.addQuestions = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];
        this.addSelected = [];
        this.addStep = 2;
        return;
      } catch (err) {
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
      return q
        ? q.question.length > 80
          ? q.question.slice(0, 80) + "..."
          : q.question
        : "";
    },

    clearAddSelection() {
      this.addSelected = [];
    },

    parseOptions(options) {
      try {
        if (typeof options === "string") return JSON.parse(options);
        return Array.isArray(options) ? options : [];
      } catch (e) {
        return [];
      }
    },

    getOptionValue(opt) {
      if (opt == null) return "";
      if (typeof opt === 'object') {
        // handle shapes like { option_text, is_correct } or generic
        if (Object.prototype.hasOwnProperty.call(opt, 'option_text')) return String(opt.option_text ?? '');
        // fallback: stringify simple object values
        return String(opt.text ?? opt.value ?? '');
      }
      return String(opt);
    },

    isCorrectOption(correct, candidate) {
      try {
        // normalize string booleans and trim
        const c = typeof correct === 'string' ? correct.trim() : correct;
        const v = typeof candidate === 'string' ? candidate.trim() : candidate;
        if (typeof c === 'string' && typeof v === 'string') {
          return c.toLowerCase() === v.toLowerCase();
        }
        // if correct is boolean-like
        if (typeof c === 'boolean') {
          const vv = String(v).toLowerCase();
          return (c && vv === 'true') || (!c && vv === 'false');
        }
        return c === v;
      } catch (_) {
        return false;
      }
    },

    getMatchingItems(q) {
      const out = { left: [], right: [], pairs: [] };
      if (!q) return out;
      // Parse options (which may be JSON string or object with left/right)
      let opts = q.options;
      if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch { opts = {}; }
      }
      const left = Array.isArray(opts?.left) ? opts.left : [];
      const right = Array.isArray(opts?.right) ? opts.right : [];
      // Parse correct_answer (which may be JSON string of pairs)
      let pairs = q.correct_answer;
      if (typeof pairs === 'string') {
        try { pairs = JSON.parse(pairs); } catch { pairs = []; }
      }
      if (!Array.isArray(pairs)) pairs = [];
      return { left, right, pairs };
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
