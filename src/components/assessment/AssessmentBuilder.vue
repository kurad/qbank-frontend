<template>
  <div>
    <!-- Trigger button / could be in a page -->
    <div class="d-flex align-items-start justify-content-between mb-3">
      <!-- <button class="btn btn-primary me-3" @click="open">Create Assessment</button> -->
      <div class="assessments-overview flex-grow-1">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Recent Assessments</h5>
          <div>
            <button class="btn btn-sm btn-outline-secondary me-2" @click="loadCreatedAssessments" :disabled="loadingAssessments">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <button class="btn btn-sm btn-outline-primary" @click="open">New</button>
          </div>
        </div>
        <div v-if="loadingAssessments" class="text-muted">Loading...</div>
        <div v-else-if="assessments.length === 0" class="text-muted small">No assessments created yet</div>
        <div v-else class="row g-2">
          <div v-for="a in assessments" :key="a.id" class="col-12 col-sm-6 col-md-4">
            <div class="card assessment-card h-100">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 class="card-title mb-1">{{ a.title }}</h6>
                    <div class="text-muted small">{{ a.subjectName }} · {{ a.gradeName }}</div>
                  </div>
                  <div class="text-end small text-muted">{{ formatDate(a.created_at) }}</div>
                </div>

                <p class="card-text mb-2 text-truncate">{{ a.summary || '' }}</p>

                <div class="mt-auto d-flex justify-content-between align-items-center">
                  <div class="small text-muted">Questions: <strong>{{ a.question_count ?? a.questions_count ?? (a.questions?.length ?? 0) }}</strong></div>
                  <div>
                    <router-link :to="{ name: 'assessment-edit', params: {id: a.id}}" class="btn btn-sm btn-success" ><i class="bi bi-pencil"></i> Review & Print</router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  <AssessmentEditor
    v-if="showEditor"
    :assessment="editorAssessment"
    :questions="editorQuestions"
    :all-questions="allQuestions"
    :students="students"
    @close="showEditor = false"
  />
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" tabindex="-1" ref="modalEl">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Create New Assessment</h5>
            <button type="button" class="btn-close" @click="close"></button>
          </div>

          <div class="modal-body">
            <!-- Step 1 -->
            <div v-if="step === 1">
              <div class="mb-3">
                <label class="form-label">Assessment Title</label>
                <input v-model="form.title" class="form-control" />
              </div>

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Grade Level</label>
                  <select v-model="form.grade_level_id" class="form-select" @change="onGradeChange">
                    <option value="">Choose</option>
                    <option v-for="g in gradeLevels" :key="g.id" :value="g.id">
                      {{ g.grade_name }}
                    </option>
                  </select>
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Subject</label>
                  <select
                    v-model="form.subject_id"
                    class="form-select"
                    @change="loadTopics"
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
                        v-for="id in form.topic_ids"
                        :key="id"
                        class="badge bg-primary text-truncate topic-chip me-2 mb-2"
                      >
                        {{ getTopicName(id) }}
                        <button
                          type="button"
                          class="btn-close btn-close-white btn-sm ms-2"
                          @click="toggleTopic(id)"
                          aria-label="Remove"
                        ></button>
                      </span>

                      <input
                        v-model="topicQuery"
                        @input="filterTopicOptions"
                        @keydown.enter.prevent="addTopicFromQuery"
                        class="form-control form-control-sm border-0 p-0 flex-grow-1"
                        placeholder="Search and press Enter to add"
                        style="min-width: 120px"
                      />
                    </div>

                    <div v-if="loadingTopics" class="mt-2 text-muted small">Loading topics...</div>
                    <div v-else-if="filteredTopicOptions.length" class="topic-options mt-2">
                      <button
                        v-for="opt in filteredTopicOptions"
                        :key="opt.id"
                        class="btn btn-sm btn-light me-2 mb-2"
                        @click="selectTopic(opt)"
                      >
                        {{ opt.topic_name }}
                      </button>
                    </div>
                    <div v-else class="text-muted small mt-2">Type to search topics</div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end">
                <button class="btn btn-primary" @click="loadQuestions" :disabled="!form.topic_ids.length || loadingQuestions">
                  {{ loadingQuestions ? 'Loading...' : 'Load Questions' }}
                </button>
              </div>
            </div>

            <!-- Step 2 -->
            <div v-if="step === 2">
              <div class="row">
                <div class="col-md-7">
                  <h6>Available Questions</h6>
                  <div v-if="questions.length === 0" class="text-muted">
                    No questions for selected topics
                  </div>
                 

                  <div
                    v-for="q in questions"
                    :key="q.id"
                    class="border rounded p-3 shadow-sm"
                  >
                    <div class="form-check mb-2">
                      <input
                        class="form-check-input me-2"
                        type="checkbox"
                        :id="'q' + q.id"
                        :value="q.id"
                        v-model="selected"
                      />
                      <label
                        class="form-check-label fw-bold d-block mb-1"
                        :for="'q' + q.id"
                        v-html="q.question"
                      ></label>
                      <img
                        v-if="q.question_image"
                        :src="getQuestionImageUrl(q)"
                        alt="Question Image"
                        class="img-thumbnail mt-1"
                        style="max-width: 220px; max-height: 150px; object-fit: contain;"
                      />
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
                          'list-group-item-success':
                            isCorrectOption(q.correct_answer, getOptionValue(option)),
                        }"
                      >
                      <div class="d-flex flex-column">
                        <div>
                          <strong>{{ String.fromCharCode(65 + idx) }}.</strong>
                          <span class="ms-2">{{ getOptionValue(option) }}</span>
                        </div>
                        <img
                          v-if="getOptionImageUrl(option)"
                          :src="getOptionImageUrl(option)"
                          alt="Option Image"
                          class="img-thumbnail mt-1"
                          style="max-width: 180px; max-height: 120px; object-fit: contain;"
                        />
                      </div>
                        <i
                          v-if="isCorrectOption(q.correct_answer, getOptionValue(option))"
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
                  <h6>Selected ({{ selected.length }})</h6>
                  <ul class="list-group mb-3">
                    <li
                      v-for="id in selected"
                      :key="id"
                      class="list-group-item"
                    >
                      {{ getQuestionText(id) }}
                    </li>
                  </ul>

                  <button
                    class="btn btn-success w-100"
                    :disabled="saving || !form.title || !selected.length"
                    @click="confirmSave"
                  >
                    {{ saving ? "Saving..." : "Confirm & Save" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              v-if="step === 2"
              class="btn btn-secondary"
              @click="step = 1"
            >
              Back
            </button>
            <button v-if="step === 1" class="btn btn-light" @click="close">
              Cancel
            </button>
            <button
              v-if="step === 2"
              class="btn btn-outline-secondary"
              @click="clearSelection"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Modal } from "bootstrap";

export default {
  name: "AssessmentBuilder",
  data() {
      return {
        step: 1,
        gradeLevels: [],
        subjects: [],
        topics: [],
        questions: [],
        selected: [],
        saving: false,
        assessments: [],
        loadingAssessments: false,
        loadingTopics: false,
        loadingQuestions: false,
        questionsPagination: {
          page: 1,
          perPage: 10,
          total: 0,
          lastPage: 1,
        },
        form: {
          title: "",
          grade_level_id: "",
          subject_id: "",
          topic_ids: [],
        },
        topicQuery: "",
        filteredTopicOptions: [],
        bsModal: null,
        showEditor: false,
        editorAssessment: null,
        editorQuestions: [],
        allQuestions: [],
        students: [],
      };
  },
  mounted(){
     this.loadInitial();
     this.loadAllQuestions();
     this.loadStudents();
  },
  beforeUnmount() {
    if (this.bsModal) {
      try {
        if (this.bsModal._element) this.bsModal.hide();
      } catch (e) {}
      if (typeof this.bsModal.dispose === 'function') {
        try { this.bsModal.dispose(); } catch (e) {}
      }
      this.bsModal = null;
    }
  },
  beforeDestroy() {
    if (this.bsModal) {
      try {
        if (this.bsModal._element) this.bsModal.hide();
      } catch (e) {}
      if (typeof this.bsModal.dispose === 'function') {
        try { this.bsModal.dispose(); } catch (e) {}
      }
      this.bsModal = null;
    }
  },
  methods: {
      async loadAllQuestions() {
        // Fetch all questions for add/remove in editor
        try {
          const res = await axios.get("/questions/all");
          this.allQuestions = Array.isArray(res.data) ? res.data : res.data.data || [];
        } catch {
          this.allQuestions = [];
        }
      },
      async loadStudents() {
        // Fetch all students for assignment
        try {
          const res = await axios.get("/students");
          this.students = Array.isArray(res.data) ? res.data : res.data.data || [];
        } catch {
          this.students = [];
        }
      },
      openEditor(a) {
        this.editorAssessment = a;
        this.editorQuestions = Array.isArray(a.questions) ? [...a.questions] : [];
        this.showEditor = true;
      },
    open() {
      this.bsModal = new Modal(this.$refs.modalEl);
      this.bsModal.show();
      this.loadInitial();
      this.step = 1;
    },
    close() {
      if (this.bsModal) this.bsModal.hide();
      this.reset();
    },
    reset() {
      this.form = {
        title: "",
        grade_level_id: "",
        subject_id: "",
        topic_ids: [],
      };
      this.questions = [];
      this.selected = [];
      this.topics = [];
      this.topicQuery = "";
      this.filteredTopicOptions = [];
    },
    onGradeChange() {
      // Reset topics when grade changes
      this.form.topic_ids = [];
      this.topicQuery = "";
      this.topics = [];
      this.filteredTopicOptions = [];
      if (this.form.subject_id) {
        this.loadTopics();
      }
    },
    async loadInitial() {
      const [gRes, sRes] = await Promise.all([
        axios.get("/grade-levels"),
        axios.get("/subjects"),
      ]);
      this.gradeLevels = gRes.data;
      this.subjects = sRes.data;
      // Load recent assessments for overview
      this.loadCreatedAssessments();
    },
    async loadTopics() {
      if (!this.form.grade_level_id || !this.form.subject_id) return;
      this.loadingTopics = true;
      try {
        const res = await axios.get(`/topics`, {
          params: {
            grade_level_id: this.form.grade_level_id,
            subject_id: this.form.subject_id,
          },
        });
        this.topics = res.data || [];
        // exclude already selected from options list
        this.filteredTopicOptions = this.topics.filter(
          (t) => !this.form.topic_ids.includes(t.id)
        );
      } catch (e) {
        this.topics = [];
        this.filteredTopicOptions = [];
      } finally {
        this.loadingTopics = false;
      }
    },
    filterTopicOptions() {
      const q = this.topicQuery.trim().toLowerCase();
      if (!q) {
        this.filteredTopicOptions = this.topics.filter(
          (t) => !this.form.topic_ids.includes(t.id)
        );
        return;
      }
      this.filteredTopicOptions = this.topics.filter(
        (t) =>
          !this.form.topic_ids.includes(t.id) &&
          t.topic_name.toLowerCase().includes(q)
      );
    },
    selectTopic(topic) {
      if (!this.form.topic_ids.includes(topic.id))
        this.form.topic_ids.push(topic.id);
      this.topicQuery = "";
      this.filterTopicOptions();
    },
    toggleTopic(id) {
      this.form.topic_ids = this.form.topic_ids.includes(id)
        ? this.form.topic_ids.filter((x) => x !== id)
        : [...this.form.topic_ids, id];
      this.filterTopicOptions();
    },
    addTopicFromQuery() {
      // if query matches an existing visible option, add it; else do nothing
      const match = this.filteredTopicOptions[0];
      if (match) this.selectTopic(match);
    },
    getTopicName(id) {
      const t = this.topics.find((x) => x.id === id);
      return t ? t.topic_name : "Unknown";
    },
    async loadQuestions() {
      if (!this.form.topic_ids.length) return alert("Select topics");
      if (this.loadingQuestions) return;
      this.loadingQuestions = true;
      try {
        // Preferred: GET /questions/topics with repeated query params topic_ids[]
        const res = await axios.get("/questions/topics", {
          params: {
            "topic_ids[]": this.form.topic_ids,
            page: this.questionsPagination.page,
            per_page: this.questionsPagination.perPage,
          },
        });
        // Support both plain array and paginated resource shapes
        const payload = res.data;
        this.questions = Array.isArray(payload)
          ? payload
          : (payload.data || []);
        // Extract pagination meta if available (Laravel-style)
        const meta = payload.meta || {};
        if (meta && (meta.current_page || meta.total || meta.last_page)) {
          this.questionsPagination.page = meta.current_page || this.questionsPagination.page;
          this.questionsPagination.perPage = meta.per_page || this.questionsPagination.perPage;
          this.questionsPagination.total = meta.total ?? this.questionsPagination.total;
          this.questionsPagination.lastPage = meta.last_page || Math.max(1, Math.ceil((this.questionsPagination.total || 0) / (this.questionsPagination.perPage || 1)));
        } else {
          // If not provided, infer minimal pagination
          this.questionsPagination.total = this.questions.length;
          this.questionsPagination.lastPage = 1;
          this.questionsPagination.page = 1;
        }
        this.selected = [];
        this.step = 2;
        return;
      } catch (err) {
        // If endpoint doesn't exist on some environments, fall back to per-topic GET
        if (err.response && err.response.status === 404) {
          try {
            const calls = this.form.topic_ids.map((id) =>
              axios.get(`/topics/${id}/questions/no-pagination`)
            );
            const results = await Promise.all(calls);
            // Flatten and dedupe by id
            const all = [];
            results.forEach((r) => {
              const arr = Array.isArray(r.data) ? r.data : r.data.data || [];
              arr.forEach((q) => all.push(q));
            });
            const map = {};
            all.forEach((q) => {
              if (q && q.id) map[q.id] = q;
            });
            this.questions = Object.values(map);
            // Non-paginated fallback
            this.questionsPagination.page = 1;
            this.questionsPagination.lastPage = 1;
            this.questionsPagination.total = this.questions.length;
            this.selected = [];
            this.step = 2;
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
        this.loadingQuestions = false;
      }
    },
    // Pagination controls for questions list
    nextQuestionsPage() {
      if (this.questionsPagination.page >= this.questionsPagination.lastPage) return;
      this.questionsPagination.page += 1;
      this.loadQuestions();
    },
    prevQuestionsPage() {
      if (this.questionsPagination.page <= 1) return;
      this.questionsPagination.page -= 1;
      this.loadQuestions();
    },
    async loadCreatedAssessments() {
      this.loadingAssessments = true;
      try {
        const res = await axios.get('/assessments/created');
        // DEBUG: log raw response to help trace shapes
        console.debug('[AssessmentBuilder] /assessments/created response:', res.data);
        // Robust extraction: find the first array payload in common locations
        const extractArray = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (typeof payload === 'object') {
            if (Array.isArray(payload.data)) return payload.data;
            if (Array.isArray(payload.items)) return payload.items;
            // try to find any array-valued property (first match)
            for (const k of Object.keys(payload)) {
              if (Array.isArray(payload[k])) return payload[k];
            }
          }
          return [];
        };

        const rawArray = extractArray(res.data);
        // As a last resort, if server returns object-per-assessment keyed by id, convert values
        let data = rawArray;
        if (data.length === 0 && res.data && typeof res.data === 'object') {
          const values = Object.values(res.data).filter(v => Array.isArray(v));
          if (values.length) data = values[0];
        }

        this.assessments = data.map((a) => ({
          ...a,
          title: a.title || a.name || 'Untitled',
          subjectName: (a.subject && (a.subject.name || a.subjectName)) || a.subject_name || '',
          gradeName:
            (a.grade_level && (a.grade_level.grade_name || a.grade_level_name)) || a.grade_level_name || '',
        }));
        console.debug('[AssessmentBuilder] normalized assessments count:', this.assessments.length);
      } catch (err) {
        console.error('Failed to load created assessments:', err);
        this.assessments = [];
      } finally {
        this.loadingAssessments = false;
      }
    },
    formatDate(dt) {
      if (!dt) return '';
      try {
        const d = new Date(dt);
        return d.toLocaleDateString();
      } catch {
        return dt;
      }
    },
    getQuestionText(id) {
      const q = this.questions.find((x) => x.id === id);
      return q
        ? q.question.length > 80
          ? q.question.slice(0, 80) + "..."
          : q.question
        : "";
    },
    clearSelection() {
      this.selected = [];
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
      if (opt && typeof opt === 'object') {
        if (typeof opt.text === 'string') return opt.text;
        if (typeof opt.value === 'string') return opt.value;
      }
      return opt;
    },
    isCorrectOption(correct, candidate) {
      try {
        const c = typeof correct === 'string' ? correct.trim() : correct;
        const v = typeof candidate === 'string' ? candidate.trim() : candidate;
        if (typeof c === 'string' && typeof v === 'string') {
          return c.toLowerCase() === v.toLowerCase();
        }
        if (typeof c === 'boolean') {
          const vv = String(v).toLowerCase();
          return (c && vv === 'true') || (!c && vv === 'false');
        }
        return c === v;
      } catch (_) {
        return false;
      }
    },
    getOptionImageUrl(opt) {
      if (!opt || typeof opt !== 'object' || !opt.image) return '';
      if (opt.image.startsWith('http://') || opt.image.startsWith('https://')) return opt.image;
      try {
        const base = (axios.defaults.baseURL || '').replace(/\/?api\/?$/i, '');
        if (base) return `${base}/storage/${opt.image}`;
      } catch {}
      return `/storage/${opt.image}`;
    },
    getQuestionImageUrl(q) {
      const path = q.question_image_url || q.question_image;
      if (!path) return '';
      if (String(path).startsWith('http://') || String(path).startsWith('https://')) return path;
      try {
        const base = (axios.defaults.baseURL || '').replace(/\/?api\/?$/i, '');
        if (base) return `${base}/storage/${path}`;
      } catch {}
      return `/storage/${path}`;
    },
    async confirmSave() {
      if (!this.form.title) {
        if (this.$showToast) this.$showToast('Enter title', 'warning');
        return;
      }
      if (!this.selected.length) {
        if (this.$showToast) this.$showToast('Select some questions', 'warning');
        return;
      }
      this.saving = true;
      try {
        await axios.post("/create-assessments", {
          title: this.form.title,
          grade_level_id: this.form.grade_level_id,
          subject_id: this.form.subject_id,
          topic_ids: this.form.topic_ids,
          type: "quiz",
          delivery_mode: "offline",
          question_ids: this.selected,
        });
        if (this.$showToast) this.$showToast('Assessment saved', 'success');
        this.close();
      } catch (err) {
        // Detect the warning from API
        const overused = err.response?.data?.errors?.overused_questions;
        if (overused && overused.length > 0){
          const names = overused.map(id => this.getQuestionText(id)).join("\n\n");

          if(confirm("Some questions have been used too many times.\n\n" + names + "\n\nDo you still want to continue?")){
           // Retry but with a bypass flag
           await axios.post("/create-assessments", {
            ...this.form,
            question_ids: this.selected,
            force: true,
          });
          if (this.$showToast) this.$showToast('Assessment saved', 'success');
          this.close();
          } else {
            if (this.$showToast) this.$showToast('Save cancelled', 'info');
          }
        } else {
          console.error(err);
          if (this.$showToast) this.$showToast(err.response?.data?.message || 'Error saving assessment', 'danger');
        }
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
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
