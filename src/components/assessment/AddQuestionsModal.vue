<template>
  <div v-if="showAddModal" class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Add Questions to Assessment</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <div class="modal-body">
          <!-- Step 1: filters -->
          <div v-if="step === 1">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Grade Level</label>
                <select
                  v-model="form.grade_level_id"
                  class="form-select"
                  @change="onGradeChange"
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

                  <div v-if="loadingTopics" class="mt-2 text-muted small">
                    Loading topics...
                  </div>
                  <div
                    v-else-if="filteredTopicOptions.length"
                    class="topic-options mt-2"
                  >
                    <button
                      v-for="opt in filteredTopicOptions"
                      :key="opt.id"
                      class="btn btn-sm btn-light me-2 mb-2"
                      @click="selectTopic(opt)"
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
                @click="loadQuestions"
                :disabled="!form.topic_ids.length || loadingQuestions"
              >
                {{ loadingQuestions ? 'Loading...' : 'Load Questions' }}
              </button>
            </div>
          </div>

          <!-- Step 2: pick questions -->
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
                  class="border rounded p-3 shadow-sm mb-2"
                >
                  <div class="form-check mb-2">
                    <input
                      class="form-check-input me-2"
                      type="checkbox"
                      :id="'addq' + q.id"
                      :value="q.id"
                      v-model="selectedIds"
                      :disabled="existingQuestionIds?.has && existingQuestionIds.has(q.id)"
                    />
                    <label
                      class="form-check-label fw-bold d-block mb-1"
                      :for="'addq' + q.id"
                      v-html="q.question"
                    ></label>
                  </div>

                    <!-- MCQ options -->
  <div
    v-if="q.question_type === 'mcq'"
    class="mb-2 d-flex flex-wrap align-items-start gap-3 ps-1"
  >
    <div
      v-for="(opt, oi) in parseOptions(q.options)"
      :key="oi"
      class="d-inline-flex flex-column"
      :class="{
        'text-success fw-semibold': isCorrectOption(
          q.correct_answer,
          getOptionValue(opt)
        ),
      }"
    >
      <div class="d-flex align-items-center">
        <span class="me-1 text-muted">
          {{ String.fromCharCode(65 + oi) }}.
        </span>
        <span>{{ getOptionValue(opt) }}</span>
        <i
          v-if="isCorrectOption(q.correct_answer, getOptionValue(opt))"
          class="bi bi-check-circle ms-1"
        ></i>
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
  <div
    v-else-if="q.question_type === 'true_false'"
    class="mb-2 d-flex align-items-center gap-4 ps-1"
  >
    <div
      class="d-inline-flex align-items-center"
      :class="{ 'text-success fw-semibold': isCorrectOption(q.correct_answer, 'true') }"
    >
      <span class="me-1">True</span>
      <i
        v-if="isCorrectOption(q.correct_answer, 'true')"
        class="bi bi-check-circle ms-1"
      ></i>
    </div>
    <div
      class="d-inline-flex align-items-center"
      :class="{ 'text-success fw-semibold': isCorrectOption(q.correct_answer, 'false') }"
    >
      <span class="me-1">False</span>
      <i
        v-if="isCorrectOption(q.correct_answer, 'false')"
        class="bi bi-check-circle ms-1"
      ></i>
    </div>
  </div>

  <!-- Matching -->
  <div v-else-if="q.question_type === 'matching'" class="mb-2">
    <div class="row g-3">
      <div class="col-12 col-md-6">
        <strong>Left</strong>
        <ul class="list-group list-group-flush">
          <li
            v-for="(txt, i) in getMatchingItems(q).left"
            :key="'add-left-'+i"
            class="list-group-item py-1"
          >
            {{ txt }}
          </li>
        </ul>
      </div>
      <div class="col-12 col-md-6">
        <strong>Right</strong>
        <ul class="list-group list-group-flush">
          <li
            v-for="(txt, i) in getMatchingItems(q).right"
            :key="'add-right-'+i"
            class="list-group-item py-1"
          >
            {{ txt }}
          </li>
        </ul>
      </div>
    </div>
    <div class="mt-2">
      <strong>✅ Correct Pairs:</strong>
      <ul class="list-unstyled mb-0">
        <li
          v-for="(pair, i) in getMatchingItems(q).pairs"
          :key="'add-pair-'+i"
        >
          {{ getMatchingItems(q).left[pair.left_index] || `Left ${pair.left_index + 1}` }}
          →
          {{ getMatchingItems(q).right[pair.right_index] || `Right ${pair.right_index + 1}` }}
        </li>
      </ul>
    </div>
  </div>

                  <small class="text-muted">
                    Topic: {{ q.topic?.topic_name }} | Difficulty:
                    {{ q.difficulty_level }} | Points: {{ q.marks }}
                  </small>
                </div>
              </div>

              <div class="col-md-5">
                <h6>Selected ({{ selectedIds.length }})</h6>
                <ul class="list-group mb-3">
                  <li
                    v-for="id in selectedIds"
                    :key="id"
                    class="list-group-item"
                  >
                    {{ getQuestionText(id) }}
                  </li>
                </ul>

                <button
                  class="btn btn-success w-100"
                  :disabled="addIsLoading || !selectedIds.length"
                  @click="confirmAdd"
                >
                  {{ addIsLoading ? 'Adding...' : 'Add Selected Questions' }}
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
          <button
            class="btn btn-light"
            @click="close"
          >
            Close
          </button>
          <button
            v-if="step === 2"
            class="btn btn-outline-secondary"
            @click="selectedIds = []"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from '@/axios'
import {
  parseOptions,
  getOptionValue,
  isCorrectOption,
  getMatchingItems,
  getOptionImageUrl,
} from '@/utils/questionDisplay'

export default {
  name: 'AddQuestionsModal',
  props: {
    modelValue: { type: Boolean, required: true },
    assessmentId: { type: [Number, String], required: false },
    existingQuestionIds: { type: Object, required: false, default: () => new Set() },
  },
  emits: ['update:modelValue', 'add-questions'],
  data() {
  return {
    // v-model bridge state not needed here; we already use computed showAddModal

    // Step control
    step: 1,

    // Lookups
    gradeLevels: [],
    subjects: [],
    topics: [],

    // Questions loaded for selected topics
    questions: [],
    selectedIds: [],

    loadingTopics: false,
    loadingQuestions: false,

    form: {
      grade_level_id: "",
      subject_id: "",
      topic_ids: [],
    },

    topicQuery: "",
    filteredTopicOptions: [],
  };
},
  computed: {
    // v-model bridge
    showAddModal: {
      get() { return this.modelValue },
      set(v) { this.$emit('update:modelValue', v) }
    },
    groupedAvailable() {
      const groups = new Map()
      for (const q of this.availableQuestions || []) {
        const g = q._group || 'Ungrouped'
        if (!groups.has(g)) groups.set(g, [])
        groups.get(g).push(q)
      }
      return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
    }
  },
methods: {
  // expose shared helpers for template usage
  parseOptions,
  getOptionValue,
  isCorrectOption,
  getMatchingItems,
  getOptionImageUrl,
  close() {
    if (this.addIsLoading) return;
    this.showAddModal = false;
  },

  async loadInitial() {
    try {
      const [gRes, sRes] = await Promise.all([
        axios.get("/grade-levels"),
        axios.get("/subjects"),
      ]);
      this.gradeLevels = gRes.data || [];
      this.subjects = sRes.data || [];
    } catch {
      this.gradeLevels = [];
      this.subjects = [];
    }
  },

  onGradeChange() {
    this.form.topic_ids = [];
    this.topicQuery = "";
    this.topics = [];
    this.filteredTopicOptions = [];
    if (this.form.subject_id) {
      this.loadTopics();
    }
  },

  async loadTopics() {
    if (!this.form.grade_level_id || !this.form.subject_id) return;
    this.loadingTopics = true;
    try {
      const res = await axios.get("/topics", {
        params: {
          grade_level_id: this.form.grade_level_id,
          subject_id: this.form.subject_id,
        },
      });
      this.topics = res.data || [];
      this.filteredTopicOptions = this.topics.filter(
        (t) => !this.form.topic_ids.includes(t.id)
      );
    } catch {
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
    const match = this.filteredTopicOptions[0];
    if (match) this.selectTopic(match);
  },

  getTopicName(id) {
    const t = this.topics.find((x) => x.id === id);
    return t ? t.topic_name : "Unknown";
  },

  async loadQuestions() {
    if (!this.form.topic_ids.length) {
      alert("Select topics first.");
      return;
    }
    if (this.loadingQuestions) return;

    this.loadingQuestions = true;
    try {
      // Primary: /questions/topics with topic_ids[]
      const res = await axios.get("/questions/topics", {
        params: {
          "topic_ids[]": this.form.topic_ids,
        },
      });
      const payload = res.data;
      this.questions = Array.isArray(payload)
        ? payload
        : payload.data || [];
    } catch (err) {
      // 404 fallback: fetch per-topic questions and merge
      if (err.response && err.response.status === 404) {
        try {
          const calls = this.form.topic_ids.map((id) =>
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
          this.questions = Object.values(map);
        } catch (innerErr) {
          console.error("Fallback per-topic fetch failed:", innerErr);
          alert("Failed to load questions (fallback).");
          this.loadingQuestions = false;
          return;
        }
      } else {
        console.error("Failed to load questions for topics:", err);
        alert(err.response?.data?.message || "Failed to load questions.");
        this.loadingQuestions = false;
        return;
      }
    }

    // filter out already-existing IDs
    const existing = this.existingQuestionIds;
    this.questions = this.questions.filter(
      (q) => !(existing?.has && existing.has(q.id))
    );
    this.selectedIds = [];
    this.step = 2;
    this.loadingQuestions = false;
  },

  getQuestionText(id) {
    const q = this.questions.find((x) => x.id === id);
    if (!q || !q.question) return "";
    const plain = String(q.question).replace(/<[^>]*>/g, "");
    return plain.length > 80 ? plain.slice(0, 80) + "..." : plain;
  },

  async confirmAdd() {
    if (!this.selectedIds.length) return;
    this.addIsLoading = true;
    try {
      await this.$emit("add-questions", this.selectedIds);
      this.showAddModal = false;
    } finally {
      this.addIsLoading = false;
    }
  },
},
watch: {
  showAddModal(open) {
    if (open) {
      this.step = 1;
      this.form = {
        grade_level_id: "",
        subject_id: "",
        topic_ids: [],
      };
      this.topicQuery = "";
      this.filteredTopicOptions = [];
      this.questions = [];
      this.selectedIds = [];
      this.loadInitial();
    }
  },
},
}
</script>

<style scoped>
.modal-fullscreen {
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: none;
}

.custom-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1040;
}

/* Smooth collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.question-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

.katex {
  font-size: 1em;
}
/* Modal layout */
.modal-dialog.modal-xl {
  max-width: 1100px;
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
}

.modal-header {
  background: linear-gradient(90deg, #2563eb, #4f46e5);
  color: #fff;
  border-bottom: none;
}

.modal-title {
  font-weight: 700;
}

/* Body spacing */
.modal-body {
  padding: 1.5rem 1.75rem;
}

/* Topic picker */
.topic-picker {
  min-height: 56px;
  background: #f9fafb;
}

.topic-chip {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
}

/* Scrollable options under topics */
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

/* Question cards */
.form-check {
  background: #fff;
}

.form-check .form-check-input {
  transform: scale(1.05);
}

.border.rounded.p-3.shadow-sm {
  border-radius: 0.75rem;
}

/* Selected list */
.list-group-item {
  font-size: 0.9rem;
}
</style>
