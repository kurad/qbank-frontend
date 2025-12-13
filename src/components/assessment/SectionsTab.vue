<template>
  <div class="card shadow-sm mb-4">
    <div
      class="card-header bg-secondary text-white fw-semibold d-flex justify-content-between align-items-center"
    >
      <span>Sections</span>
      <small class="text-white-50" v-if="sectionsLoading">Loading sections...</small>
    </div>
    <div class="card-body">
      <!-- Assessment Instructions -->
      <div class="mb-3">
        <h6 class="mb-2">Assessment Instructions</h6>
        <textarea
          v-model="instructions"
          class="form-control form-control-sm"
          rows="3"
          placeholder="Add instructions for this assessment (shown to students before they start)"
        ></textarea>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <small class="text-muted">
            These instructions apply to the whole assessment.
          </small>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="savingInstructions || !assessment?.id"
            @click="saveInstructions"
          >
            <span
              v-if="savingInstructions"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            <span>{{ savingInstructions ? 'Saving...' : 'Save Instructions' }}</span>
          </button>
        </div>
        <div v-if="instructionsError" class="alert alert-danger mt-2 py-1 px-2 small">
          {{ instructionsError }}
        </div>
      </div>

      <div class="row">
        <div class="col-md-5 mb-3">
          <h6 class="mb-2 d-flex justify-content-between align-items-center">
            <span>Existing Sections</span>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="startCreateSection"
            >
              New Section
            </button>
          </h6>
          <div v-if="sectionsError" class="alert alert-danger py-2 px-3">
            {{ sectionsError }}
          </div>
          <div
            v-else-if="!sectionsLoading && sections.length === 0"
            class="text-muted small"
          >
            No sections created yet.
          </div>
          <ul class="list-group">
            <li
              v-for="s in sections"
              :key="s.id"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
              :class="{ active: activeSectionId === s.id }"
              style="cursor: pointer;"
              @click="activeSectionId = s.id"
            >
              <div class="me-2">
                <div class="fw-semibold">{{ s.ordering }}. {{ s.title }}</div>
                <small class="text-muted" v-if="s.instruction">{{ s.instruction }}</small>
              </div>
              <div class="d-flex align-items-center gap-2">
              <span class="badge bg-light text-dark ms-2">
                {{ (s.questions && s.questions.length) || 0 }} questions
              </span>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click.stop="openEditSectionModal(s)"
              >
                <i class="bi bi-pencil"></i>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click.stop="deleteSection(s)"
              >
                <i class="bi bi-trash"></i>
              </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="col-md-7 mb-3">
          <h6 class="mb-2">Section Questions</h6>
          <div v-if="activeSection">
            <h6 class="mb-2">Questions in {{ activeSection.title }}</h6>
            <hr />
            <div v-if="!activeSection">
              <small class="text-muted"
                >Select a Section on the left to manage its questions.</small
              >
            </div>
            <div v-else>
              <p class="small text-muted mb-2">
                Tick which questions from this assessment belong to this section
              </p>

              <!-- Questions currently in this section -->
              <div
                v-if="!sectionQuestionsDetailed || !sectionQuestionsDetailed.length"
                class="text-muted small mb-2"
              >
                No questions added to this section yet.
              </div>
              <div
                v-else
                class="border rounded p-2 mb-2"
                style="max-height: 260px; overflow-y: auto;"
              >
                <div
                  v-for="(q, idx) in sectionQuestionsDetailed || []"
                  :key="q.id || idx"
                  class="form-check small mb-2"
                >
                  <input
                    type="checkbox"
                    class="form-check-input me-1"
                    :id="'secq-' + (q.id || idx)"
                    :value="q.id"
                    v-model="sectionQuestionSelection"
                    :disabled="isQuestionAssignedElsewhere(q.id)"
                  />
                  <label
                    class="form-check-label"
                    :for="'secq-' + (q.id || idx)"
                  >
                    <strong>#{{ idx + 1 }}</strong>
                    <span v-html="q.question"></span>
                    <span
                      v-if="getQuestionMarks(q) > 0"
                      class="badge bg-light text-secondary ms-1 align-middle"
                    >
                      Marks: {{ getQuestionMarks(q) }}
                    </span>
                    <!-- Parent question: show sub-questions summary if present -->
                    <div
                      v-if="q.question_type === 'parent' && Array.isArray(q.sub_questions) && q.sub_questions.length"
                      class="mt-1 ps-2 border-start"
                    >
                      <ol class="mb-1 ps-3 small">
                        <li
                          v-for="(sub, sIdx) in q.sub_questions"
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
                    <span
                      v-if="isQuestionAssignedElsewhere(q.id)"
                      class="text-muted ms-1"
                    >
                      (already in another section)
                    </span>
                    <!-- Compact options/answers preview -->
                    <div class="mt-1 ms-3">
                      <!-- MCQ -->
                      <div
                        v-if="q.question_type === 'mcq'"
                        class="d-flex flex-wrap align-items-start gap-2"
                      >
                        <span
                          v-for="(opt, oi) in parseOptions(q.options)"
                          :key="oi"
                          class="small"
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              getOptionValue(opt)
                            ),
                          }"
                        >
                          <span class="me-1 text-muted">
                            {{ String.fromCharCode(65 + oi) }}.
                          </span>
                          <span>{{ getOptionValue(opt) }}</span>
                        </span>
                      </div>

                      <!-- True/False -->
                      <div
                        v-else-if="q.question_type === 'true_false'"
                        class="d-flex align-items-center gap-3 small"
                      >
                        <span
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              'true'
                            ),
                          }"
                        >
                          True
                        </span>
                        <span
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              'false'
                            ),
                          }"
                        >
                          False
                        </span>
                      </div>

                      <!-- Matching -->
                      <div
                        v-else-if="q.question_type === 'matching'"
                        class="small"
                      >
                        <div class="d-flex flex-wrap gap-2">
                          <span
                            v-for="(pair, i) in getMatchingItems(q).pairs"
                            :key="'pair-'+i"
                          >
                            {{
                              getMatchingItems(q).left[
                                pair.left_index
                              ] || `Left ${pair.left_index + 1}`
                            }}
                            →
                            {{
                              getMatchingItems(q).right[
                                pair.right_index
                              ] || `Right ${pair.right_index + 1}`
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                class="btn btn-primary btn-sm mt-1"
                :disabled="savingSectionQuestions || !activeSection"
                @click="saveSectionQuestions"
              >
                <span
                  v-if="savingSectionQuestions"
                  class="spinner-border spinner-border-sm me-1"
                ></span>
                <span>
                  {{
                    savingSectionQuestions
                      ? 'Saving...'
                      : 'Save Section Questions'
                  }}
                </span>
              </button>
              <div class="mt-2 small text-muted">
                Total marks in this section: <strong>{{ selectedSectionMarks }}</strong>
              </div>

              <!-- Available questions to add -->
              <hr class="my-3" />
              <h6 class="mb-2">Available questions to add</h6>
              <div
                v-if="!availableQuestions.length"
                class="text-muted small mb-2"
              >
                No more questions available to add to this section.
              </div>
              <div
                v-else
                class="border rounded p-2 mb-2"
                style="max-height: 260px; overflow-y: auto;"
              >
                <div
                  v-for="(q, idx) in availableQuestions"
                  :key="q.id || 'avail-' + idx"
                  class="form-check small mb-2"
                >
                  <input
                    type="checkbox"
                    class="form-check-input me-1"
                    :id="'avail-secq-' + (q.id || idx)"
                    :value="q.id"
                    v-model="sectionQuestionSelection"
                  />
                  <label
                    class="form-check-label"
                    :for="'avail-secq-' + (q.id || idx)"
                  >
                    <span v-html="q.question"></span>
                    <span
                      v-if="getQuestionMarks(q) > 0"
                      class="badge bg-light text-secondary ms-1 align-middle"
                    >
                      Marks: {{ getQuestionMarks(q) }}
                    </span>
                    <!-- Parent question: show sub-questions summary if present -->
                    <div
                      v-if="q.question_type === 'parent' && Array.isArray(q.sub_questions) && q.sub_questions.length"
                      class="mt-1 ps-2 border-start"
                    >
                      <ol class="mb-1 ps-3 small">
                        <li
                          v-for="(sub, sIdx) in q.sub_questions"
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
                    <div class="mt-1 ms-3">
                      <!-- MCQ -->
                      <div
                        v-if="q.question_type === 'mcq'"
                        class="d-flex flex-wrap align-items-start gap-2"
                      >
                        <span
                          v-for="(opt, oi) in parseOptions(q.options)"
                          :key="oi"
                          class="small"
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              getOptionValue(opt)
                            ),
                          }"
                        >
                          <span class="me-1 text-muted">
                            {{ String.fromCharCode(65 + oi) }}.
                          </span>
                          <span>{{ getOptionValue(opt) }}</span>
                        </span>
                      </div>

                      <!-- True/False -->
                      <div
                        v-else-if="q.question_type === 'true_false'"
                        class="d-flex align-items-center gap-3 small"
                      >
                        <span
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              'true'
                            ),
                          }"
                        >
                          True
                        </span>
                        <span
                          :class="{
                            'text-success fw-semibold': isCorrectOption(
                              q.correct_answer,
                              'false'
                            ),
                          }"
                        >
                          False
                        </span>
                      </div>

                      <!-- Matching -->
                      <div
                        v-else-if="q.question_type === 'matching'"
                        class="small"
                      >
                        <div class="d-flex flex-wrap gap-2">
                          <span
                            v-for="(pair, i) in getMatchingItems(q).pairs"
                            :key="'avail-pair-' + i"
                          >
                            {{
                              getMatchingItems(q).left[
                                pair.left_index
                              ] || `Left ${pair.left_index + 1}`
                            }}
                            →
                            {{
                              getMatchingItems(q).right[
                                pair.right_index
                              ] || `Right ${pair.right_index + 1}`
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Section Modal -->
  <div
    class="modal fade"
    tabindex="-1"
    ref="createSectionModal"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ editingSectionId ? 'Edit Section' : 'Create New Section' }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeCreateSectionModal"
          ></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="form-label">Title</label>
            <input
              v-model.trim="newSection.title"
              type="text"
              class="form-control form-control-sm"
              :disabled="creatingSection"
              placeholder="e.g. Section A - Attempt ALL the questions in this section"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Instruction (optional)</label>
            <textarea
              v-model.trim="newSection.instruction"
              rows="2"
              class="form-control form-control-sm"
              :disabled="creatingSection"
              placeholder="Provide instructions for this section"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="creatingSection"
            @click="closeCreateSectionModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="creatingSection || !newSection.title"
            @click="editingSectionId ? updateSection() :createSection()"
          >
            <span
              v-if="creatingSection"
              class="spinner-border spinner-border-sm me-1"
            ></span>
            <span>{{ creatingSection ? (editingSectionId ? 'Saving...' : 'Creating...') : (editingSectionId ? 'Save Changes' : 'Creating Section') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Modal } from "bootstrap";
import {
  parseOptions,
  getOptionValue,
  isCorrectOption,
  getMatchingItems,
} from "@/utils/questionDisplay";

export default {
  name: "SectionsTab",
  props: {
    assessment: {
      type: Object,
      required: true,
    },
    localQuestions: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      sections: [],
      sectionsLoading: false,
      sectionsError: "",
      creatingSection: false,
      createSectionModal: null,
      activeSectionId: null,
      sectionQuestionSelection: [],
      savingSectionQuestions: false,
      sectionWarnings: [],
      newSection: {
        title: "",
        instruction: "",
      },
      instructions: (this.assessment && this.assessment.instructions) || "",
      savingInstructions: false,
      instructionsError: "",
    };
  },
  computed: {
    activeSection() {
      if (!this.activeSectionId) return null;
      return this.sections.find((s) => s.id === this.activeSectionId) || null;
    },
    assignedElsewhereIds() {
      const ids = new Set();
      this.sections.forEach((section) => {
        if (!section || section.id === this.activeSectionId) return;
        if (!Array.isArray(section.questions)) return;
        section.questions.forEach((q) => {
          if (q && q.id) ids.add(q.id);
        });
      });
      return ids;
    },
    availableQuestions() {
      const selectedIds = new Set(
        Array.isArray(this.sectionQuestionSelection)
          ? this.sectionQuestionSelection
          : []
      );

      return this.localQuestions
        .map((item) => item.question)
        .filter((q) => {
          if (!q || !q.id) return false;
          if (selectedIds.has(q.id)) return false;
          if (this.assignedElsewhereIds.has(q.id)) return false;
          return true;
        });
    },
    sectionQuestionsDetailed() {
      const section = this.activeSection;
      if (!section || !Array.isArray(section.questions)) return [];

      const questionMap = new Map(
        this.localQuestions
          .map((item) => item && item.question)
          .filter((q) => q && q.id)
          .map((q) => [q.id, q])
      );

      return section.questions
        .filter((sq) => sq && sq.id)
        .map((sq) => {
          const full = questionMap.get(sq.id);
          return full || sq;
        });
    },
    selectedSectionMarks() {
      if (
        !Array.isArray(this.sectionQuestionSelection) ||
        !this.sectionQuestionSelection.length
      ) {
        return 0;
      }
      const selectedIds = new Set(this.sectionQuestionSelection);

      return this.localQuestions
        .map((item) => item && item.question)
        .filter((q) => q && q.id && selectedIds.has(q.id))
        .reduce((sum, q) => sum + this.getQuestionMarks(q), 0);
    },
  },
  watch: {
    "assessment.id"(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.loadSections();
      }
    },
    "assessment.instructions"(val) {
      this.instructions = val || "";
    },
  },
  mounted() {
    this.loadSections();
  },
  methods: {
    parseOptions,
    getOptionValue,
    isCorrectOption,
    getMatchingItems,
    getQuestionMarks(q) {
      if (!q) return 0;
      try {
        if (Array.isArray(q.sub_questions) && q.sub_questions.length) {
          return q.sub_questions.reduce((sum, sub) => {
            const m = parseFloat(sub && sub.marks != null ? sub.marks : 0);
            return sum + (isNaN(m) ? 0 : m);
          }, 0);
        }
        const m = parseFloat(q.marks != null ? q.marks : 0);
        return isNaN(m) ? 0 : m;
      } catch (_) {
        return 0;
      }
    },
    async deleteSection(section) {
      if (!section || !section.id) return;
      const yes = window.confirm(
        `Are you sure you want to delete section "${section.title || ""}"?`
      );
      if (!yes) return;

      try {
        await axios.delete(`/assessment-sections/${section.id}`);

        this.sections = this.sections.filter((s) => s.id !== section.id);

        if (this.activeSectionId === section.id) {
          this.activeSectionId = this.sections.length
            ? this.sections[0].id
            : null;
        }

        this.syncSectionSelection();
      } catch (err) {
        console.error("Failed to delete section", err);
        const msg =
          err.response?.data?.message || "Failed to delete section.";
        alert(msg);
      }
    },
    async loadSections() {
      if (!this.assessment?.id) return;
      this.sectionsLoading = true;
      this.sectionsError = "";
      try {
        const res = await axios.get(
          `/assessments/${this.assessment.id}/sections`
        );
        const data = res.data || {};
        this.sections = Array.isArray(data.sections) ? data.sections : [];
        if (this.sections.length && !this.activeSectionId) {
          this.activeSectionId = this.sections[0].id;
        }
        this.syncSectionSelection();
      } catch (err) {
        console.error("Failed to load sections", err);
        this.sectionsError =
          err.response?.data?.message || "Failed to load sections.";
      } finally {
        this.sectionsLoading = false;
      }
    },
    openCreateSectionModal() {
      if (!this.createSectionModal && this.$refs.createSectionModal) {
        this.createSectionModal = new Modal(this.$refs.createSectionModal);
      }
      if (this.createSectionModal) {
        this.createSectionModal.show();
      }
    },
    startCreateSection() {
      this.editingSectionId = null;
      this.newSection.title = "";
      this.newSection.instruction = "";
      this.openCreateSectionModal();
    },
    openEditSectionModal(section) {
      if (!section) return;
      this.editingSectionId = section.id;
      this.newSection.title = section.title || "";
      this.newSection.instruction = section.instruction || "";
      this.openCreateSectionModal(); // reuse modal instance/show logic
    },
    closeCreateSectionModal() {
      if (this.createSectionModal) {
        try {
          this.createSectionModal.hide();
        } catch (e) {}
      }
    },
    async createSection() {
      if (!this.assessment?.id || !this.newSection.title) return;
      this.creatingSection = true;
      try {
        const res = await axios.post(
          `/assessments/${this.assessment.id}/sections`,
          {
            title: this.newSection.title,
            instruction: this.newSection.instruction || null,
          }
        );
        const section = res.data;
        this.sections.push(section);
        if (!this.activeSectionId) {
          this.activeSectionId = section.id;
        }
        this.newSection.title = "";
        this.newSection.instruction = "";
        this.syncSectionSelection();
        this.closeCreateSectionModal();
      } catch (err) {
        console.error("Failed to create section", err);
        const msg =
          err.response?.data?.message || "Failed to create section.";
        alert(msg);
      } finally {
        this.creatingSection = false;
      }
    },
    async updateSection() {
      if (!this.editingSectionId || !this.newSection.title) return;
      this.creatingSection = true; // reuse same flag
      try {
        const res = await axios.put(
          `/assessment-sections/${this.editingSectionId}`,
          {
            title: this.newSection.title,
            instruction: this.newSection.instruction || null,
          }
        );
        const updated = res.data;

        const idx = this.sections.findIndex((s) => s.id === updated.id);
        if (idx !== -1) {
          this.sections.splice(idx, 1, updated);
        }

        this.editingSectionId = null;
        this.newSection.title = "";
        this.newSection.instruction = "";
        this.closeCreateSectionModal();
      } catch (err) {
        console.error("Failed to update section", err);
        const msg =
          err.response?.data?.message || "Failed to update section.";
        alert(msg);
      } finally {
        this.creatingSection = false;
      }
    },
    syncSectionSelection() {
      const section = this.activeSection;
      if (!section || !Array.isArray(section.questions)) {
        this.sectionQuestionSelection = [];
        return;
      }
      this.sectionQuestionSelection = section.questions
        .map((q) => q.id)
        .filter((id) => !!id && !this.assignedElsewhereIds.has(id));
    },
    async saveSectionQuestions() {
      if (!this.activeSectionId) return;
      this.savingSectionQuestions = true;
      this.sectionWarnings = [];
      try {
        const idsOrder = this.localQuestions
          .map((item) => item.question?.id)
          .filter(
            (id) =>
              id &&
              this.sectionQuestionSelection.includes(id) &&
              !this.assignedElsewhereIds.has(id)
          );

        const res = await axios.post(
          `/assessment-sections/${this.activeSectionId}/questions`,
          { question_ids: idsOrder }
        );
        const payload = res.data || {};
        if (Array.isArray(payload.warnings)) {
          this.sectionWarnings = payload.warnings;
        }
        await this.loadSections();
      } catch (err) {
        console.error("Failed to save section questions", err);
        const msg =
          err.response?.data?.message ||
          "Failed to save section questions.";
        alert(msg);
      } finally {
        this.savingSectionQuestions = false;
      }
    },
    isQuestionAssignedElsewhere(questionId) {
      if (!questionId) return false;
      return this.assignedElsewhereIds.has(questionId);
    },
    async saveInstructions() {
      if (!this.assessment?.id) return;
      this.instructionsError = "";
      this.savingInstructions = true;
      try {
        const res = await axios.put(
          `/assessments/${this.assessment.id}/instructions`,
          {
            instructions: this.instructions || null,
          }
        );
        const payload = res.data || {};
        if (payload.assessment) {
          this.instructions = payload.assessment.instructions || "";
        }
      } catch (err) {
        console.error("Failed to update instructions", err);
        this.instructionsError =
          err?.response?.data?.message || "Failed to update instructions.";
      } finally {
        this.savingInstructions = false;
      }
    },
  },
};
</script>
