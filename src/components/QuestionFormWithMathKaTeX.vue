<template>
  <form @submit.prevent="handleSubmit" class="needs-validation" novalidate>
    <!-- Question Settings -->
    <div class="form-section mb-4">
      <h3 class="section-subtitle mb-3">Question Settings</h3>
      <div class="row g-3 align-items-end question-settings-row">
        <div class="col-md-4 col-lg-3">
          <label for="question_type" class="form-label">
            Question Type <span class="required-mark">*</span>
          </label>
          <select
            v-model="questionType"
            id="question_type"
            required
            class="form-select"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
            <option value="matching">Matching</option>
          </select>
        </div>
        <div class="col-md-4 col-lg-4">
          <label for="difficulty" class="form-label">Difficulty</label>
          <select v-model="form.difficulty" id="difficulty" class="form-select">
            <option value="">Select difficulty</option>
            <option value="remembering">Remembering</option>
            <option value="understanding">Understanding</option>
            <option value="analyzing">Analyzing</option>
            <option value="applying">Applying</option>
            <option value="evaluating">Evaluating</option>
            <option value="creating">Creating</option>
          </select>
        </div>
        <div class="col-md-4 col-lg-4">
          <label for="marks" class="form-label d-flex justify-content-between align-items-center">
            <span>Marks</span>
            <span
              class="text-muted small ms-2"
              :title="['matching', 'short_answer'].includes(questionType)
                ? 'For matching and short answer, the value you enter is used exactly.'
                : 'For other types, leave blank to auto-set from difficulty, or enter a custom value.'"
            >
              (hint)
            </span>
          </label>
          <div class="input-group input-group-sm" style="max-width: 180px;">
            <input
              id="marks"
              type="number"
              min="0"
              class="form-control form-control-sm"
              v-model.number="form.marks"
            />
            <span class="input-group-text">points</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Content -->
    <div class="form-section mb-4">
      <h3 class="section-subtitle mb-3">Question Content</h3>

      <!-- Question Input -->
      <div class="d-flex align-items-center mb-3">
        <span class="badge bg-primary me-2">Q</span>
        <div class="flex-grow-1" v-if="form.is_math">
          <textarea
            ref="questionTextArea"
            class="form-control"
            v-model="questionText"
            :id="`question_${questionType}`"
            rows="4"
            placeholder="Type your full question here. Use the Math input below to insert equations at the cursor."
          ></textarea>
          <div class="mt-2">
            <label class="form-label mb-1">Math input</label>
            <math-field
              ref="mathField"
              virtual-keyboard-mode="onfocus"
              class="w-100 border rounded p-2"
              style="min-height: 48px;"
            ></math-field>
            <div class="mt-2 d-flex gap-2">
              <button type="button" class="btn btn-sm btn-outline-primary" @click="insertMathAtCursor('inline')">Insert Inline ($...$)</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="insertMathAtCursor('block')">Insert Block ($$...$$)</button>
            </div>
          </div>
          <div class="mt-2 p-2 border rounded" v-html="renderedPreview"></div>
        </div>
        <div class="flex-grow-1" v-else>
          <input
            class="form-control"
            v-model="form.question"
            :id="`question_${questionType}`"
            required
            placeholder="Enter your question here..."
          />
        </div>
        <label class="btn btn-outline-secondary ms-2" title="Add image">
          <input
            type="file"
            accept="image/*"
            @change="onQuestionImageChange"
            style="display: none"
          />
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="#888"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-9 9l9-9"
            />
          </svg>
        </label>
      </div>

      <!-- Question Image Preview -->
      <div v-if="questionImagePreview" class="mb-3">
        <img
          :src="questionImagePreview"
          alt="Question Image Preview"
          class="img-thumbnail"
          style="max-width: 200px; max-height: 150px"
        />
        <button
          type="button"
          class="btn btn-sm btn-outline-danger ms-2"
          @click="removeQuestionImage"
          title="Remove image"
        >
          &times;
        </button>
      </div>

      <!-- MCQ & True/False Options -->
      <div v-if="['mcq', 'true_false'].includes(questionType)" class="mb-3">
        <label class="form-label">Options</label>
        <div
          v-for="(option, idx) in form.options"
          :key="idx"
          class="input-group input-group-sm mb-2"
          style="max-width: 720px"
        >
          <div class="input-group-text">
            <input
              type="radio"
              v-model="form.correct_answer"
              :value="option"
              :name="`correct_answer_group_${questionType}`"
              required
            />
          </div>
          <template v-if="questionType === 'mcq'">
            <template v-if="form.is_math">
              <div class="flex-grow-1 p-1" style="min-width: 240px;">
                <textarea
                  :ref="`optTextArea_${idx}`"
                  class="form-control form-control-sm mb-1"
                  v-model="form.options[idx]"
                  :placeholder="`Option ${String.fromCharCode(65 + idx)}`"
                  rows="2"
                  required
                ></textarea>
                <math-field
                  :ref="`optMathField_${idx}`"
                  virtual-keyboard-mode="onfocus"
                  class="w-100 border rounded p-1"
                  style="min-height: 36px;"
                ></math-field>
                <div class="mt-1 d-flex gap-1">
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="insertOptionMathAtCursor(idx, 'inline')">Inline ($...$)</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="insertOptionMathAtCursor(idx, 'block')">Block ($$...$$)</button>
                </div>
                <div class="mt-1 p-2 border rounded bg-light" v-html="renderMathString(form.options[idx])"></div>
              </div>
            </template>
            <input
              v-else
              class="form-control form-control-sm"
              v-model="form.options[idx]"
              :placeholder="`Option ${String.fromCharCode(65 + idx)}`"
              required
              style="min-width: 200px; max-width: 600px"
            />
          </template>
          <input
            v-else
            type="text"
            class="form-control form-control-sm"
            :value="option"
            readonly
          />
          <label
            v-if="questionType === 'mcq'"
            class="btn btn-outline-secondary btn-sm ms-2"
            title="Add image for this option"
          >
            <input
              type="file"
              accept="image/*"
              @change="onOptionImageChange($event, idx)"
              style="display: none"
            />
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="#888"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-9 9l9-9"
              />
            </svg>
          </label>
          <div
            v-if="questionType === 'mcq' && optionImagePreviews[idx]"
            class="ms-2 d-flex align-items-center"
          >
            <img
              :src="optionImagePreviews[idx]"
              alt="Option Image Preview"
              class="img-thumbnail"
              style="max-width: 72px; max-height: 48px; object-fit: contain"
            />
            <button
              type="button"
              class="btn btn-outline-danger btn-sm ms-1"
              @click="clearOptionImage(idx)"
              title="Remove image"
            >
              &times;
            </button>
          </div>
          <button
            v-if="questionType === 'mcq' && form.options.length > 2"
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="removeOption(idx)"
            title="Remove option"
          >
            &times;
          </button>
        </div>
        <button
          v-if="questionType === 'mcq'"
          type="button"
          class="btn btn-outline-success btn-sm mt-2"
          @click="addOption"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8m-4-4h8" />
          </svg>
          Add option
        </button>
      </div>

      <!-- Short Answer -->
      <div v-else-if="questionType === 'short_answer'" class="mb-3">
        <label class="form-label">Expected Answer</label>
        <div v-if="form.is_math">
          <textarea
            ref="answerTextArea"
            class="form-control mb-2"
            v-model="answerText"
            rows="2"
            placeholder="Type the expected answer here (use math input below)"
            required
          ></textarea>

          <math-field
            ref="answerMathField"
            virtual-keyboard-mode="onfocus"
            class="w-100 border rounded p-2 mb-2"
            style="min-height: 36px;"
          ></math-field>

          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="insertAnswerMathAtCursor('inline')">Insert Inline ($...$)</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="insertAnswerMathAtCursor('block')">Insert Block ($$...$$)</button>
          </div>

          <div class="p-2 border rounded bg-light" v-html="renderMathString(answerText)"></div>
        </div>
        <div v-else>
          <input
            class="form-control"
            type="text"
            v-model="form.correct_answer"
            placeholder="Enter the expected answer"
            required
          />
        </div>
        <div class="form-text mt-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4m0-4h.01" />
          </svg>
          Students must match this answer exactly
        </div>
      </div>

      <!-- Matching Question -->
      <div v-else-if="questionType === 'matching'" class="mb-3">
        <label class="form-label">Matching Items</label>
        <div class="row">
          <div class="col-md-6">
            <strong>Left Column</strong>
            <div v-for="(item, idx) in form.matching_items.left" :key="'left-' + idx" class="input-group input-group-sm mb-2">
              <input
                class="form-control"
                v-model="form.matching_items.left[idx]"
                :placeholder="`Left ${idx + 1}`"
                required
              />
              <button v-if="form.matching_items.left.length > 2" type="button" class="btn btn-outline-danger btn-sm" @click="removeMatchingItem('left', idx)">&times;</button>
            </div>
            <button type="button" class="btn btn-outline-success btn-sm mt-1" @click="addMatchingItem('left')">+ Add Left</button>
          </div>
          <div class="col-md-6">
            <strong>Right Column</strong>
            <div v-for="(item, idx) in form.matching_items.right" :key="'right-' + idx" class="input-group input-group-sm mb-2">
              <input
                class="form-control"
                v-model="form.matching_items.right[idx]"
                :placeholder="`Right ${idx + 1}`"
                required
              />
              <button v-if="form.matching_items.right.length > 2" type="button" class="btn btn-outline-danger btn-sm" @click="removeMatchingItem('right', idx)">&times;</button>
            </div>
            <button type="button" class="btn btn-outline-success btn-sm mt-1" @click="addMatchingItem('right')">+ Add Right</button>
          </div>
        </div>
        <div class="mt-3">
          <label class="form-label">Matching Pairs (which left matches which right?)</label>
          <div v-for="(pair, idx) in form.matching_pairs" :key="'pair-' + idx" class="row align-items-center mb-2">
            <div class="col-5">
              <select v-model.number="pair.left_index" class="form-select form-select-sm">
                <option :value="null" disabled>Select Left</option>
                <option v-for="(item, lidx) in form.matching_items.left" :key="'lopt-' + lidx" :value="lidx">{{ item || `Left ${lidx + 1}` }}</option>
              </select>
            </div>
            <div class="col-2 text-center">→</div>
            <div class="col-5">
              <select v-model.number="pair.right_index" class="form-select form-select-sm">
                <option :value="null" disabled>Select Right</option>
                <option v-for="(item, ridx) in form.matching_items.right" :key="'ropt-' + ridx" :value="ridx">{{ item || `Right ${ridx + 1}` }}</option>
              </select>
            </div>
            <div class="col-12 mt-1">
              <button v-if="form.matching_pairs.length > 1" type="button" class="btn btn-outline-danger btn-sm" @click="removeMatchingPair(idx)">&times; Remove Pair</button>
            </div>
          </div>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" @click="addMatchingPair">+ Add Pair</button>
        </div>
      </div>
    </div>

    <!-- Shared Settings -->
    <div class="mb-3">
      <div class="form-check form-check-inline">
        <input
          class="form-check-input"
          type="checkbox"
          v-model="form.is_math"
          :id="`is_math_${questionType}`"
        />
        <label class="form-check-label" :for="`is_math_${questionType}`"
          >Math Question</label
        >
      </div>
      <div class="form-check form-check-inline">
        <input
          class="form-check-input"
          type="checkbox"
          v-model="form.is_required"
          :id="`required_${questionType}`"
        />
        <label class="form-check-label" :for="`required_${questionType}`"
          >Required</label
        >
      </div>
    </div>

    <!-- Additional Information -->
    <div class="form-section mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="section-subtitle mb-0">Additional Information</h3>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          @click="showAdditionalInfo = !showAdditionalInfo"
        >
          {{ showAdditionalInfo ? "Hide" : "Show" }}
        </button>
      </div>
      <div v-if="showAdditionalInfo" class="additional-info-section">
        <div class="mb-3">
          <label for="explanation" class="form-label"
            >Explanation (Optional)</label
          >
          <textarea
            v-model="form.explanation"
            id="explanation"
            class="form-control"
            rows="3"
            placeholder="Provide an explanation for the correct answer..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div class="alert alert-danger" v-if="error">{{ error }}</div>
    <div class="alert alert-success" v-if="success">
      Question saved successfully!
    </div>

    <!-- Submit Buttons -->
    <div class="d-flex justify-content-between mt-4">
      <button
        type="button"
        class="btn btn-outline-secondary"
        @click="$emit('cancel')"
        v-if="!hideCancel"
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="success">
        {{ isEditMode ? "Update" : "Save" }} Question
      </button>
    </div>
  </form>
</template>

<script>
import "mathlive";
import katex from "katex";
import "katex/dist/katex.min.css";
import axios from "axios";

export default {
  name: "QuestionFormWithMathKaTeX",
  props: {
    subjectId: { type: [Number, String], required: true },
    topicId: { type: [Number, String], required: true },
    selectedGradeFilter: { type: [Number, String], default: "" },
    editQuestion: { type: Object, default: null },
    compact: { type: Boolean, default: false },
    hideMeta: { type: Boolean, default: false },
    hideCancel: { type: Boolean, default: false },
  },
  data() {
    return {
      questionType: "mcq",
      form: {
        question: "",
        options: ["", ""],
        correct_answer: "",
        explanation: "",
        difficulty: "remembering",
        marks: 1,
        is_math: false,
        is_chemistry: false,
        multiple_answers: false,
        is_required: false,
        matching_items: { left: ["", ""], right: ["", ""] },
        matching_pairs: [{ left_index: null, right_index: null }],
      },
      answerText: "",
      questionImage: null,
      optionImages: [],
      optionImagePreviews: [],
      showAdditionalInfo: false,
      questionImagePreview: "",
      error: "",
      success: false,
      isEditMode: false,
      questionText: "",
      mathEquation: "",
      renderedPreview: "",
    };
  },
  mounted() {
    if (!this.editQuestion) return;

    this.isEditMode = true;
    const q = this.editQuestion;

    // 1️⃣ Set question type first
    this.questionType = q.question_type || "mcq";

    // 2️⃣ Normalize options
    let options = ["", ""];
    if (this.questionType === "true_false") {
      options = ["true", "false"];
    } else if (this.questionType === "short_answer") {
      options = [""]; // Only one input for short answer
    } else if (Array.isArray(q.options)) {
      options = q.options
        .filter((opt) => opt !== null && opt !== undefined)
        .map((opt) =>
          typeof opt === "object"
            ? String(opt.text ?? "").trim()
            : String(opt).trim()
        );
    }

    // 3️⃣ Normalize correct_answer
    let correct_answer = "";
    if (this.questionType === "mcq" || this.questionType === "true_false") {
      correct_answer = String(q.correct_answer ?? "").trim();
      if (this.questionType === "mcq" && !options.includes(correct_answer)) {
        correct_answer = options[0] || "";
      }
    } else if (this.questionType === "short_answer") {
      let ca = q.correct_answer ?? "";
      if (Array.isArray(ca)) {
        correct_answer = ca[0] || "";
      } else if (typeof ca === "string" && ca.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(ca);
          correct_answer = Array.isArray(arr) ? arr[0] || "" : ca;
        } catch {
          correct_answer = ca;
        }
      } else {
        correct_answer = String(ca).trim();
      }
    } else if (this.questionType === "matching") {
      correct_answer = q.correct_answer ?? "";
    }

    // 4️⃣ Populate form without replacing the object
    this.form.id = q.id;
    this.form.question = q.question || "";
    this.form.options = options;
    this.form.correct_answer = correct_answer;
    // If editing a short answer that was math, populate answerText for the math editor
    if (this.questionType === 'short_answer' && this.form.is_math) {
      this.answerText = this.form.correct_answer || '';
    }
    this.form.explanation = q.explanation || "";
    this.form.difficulty = q.difficulty_level || "remembering";
    this.form.marks = typeof q.marks === "number" ? q.marks : (q.marks ? Number(q.marks) || 1 : 1);
    this.form.is_math = !!q.is_math;
    this.form.is_chemistry = !!q.is_chemistry;
    this.form.multiple_answers = !!q.multiple_answers;
    this.form.is_required = !!q.is_required || !!q.required;

    if (this.questionType === "matching") {
      this.form.matching_items = q.matching_items || {
        left: ["", ""],
        right: ["", ""],
      };
      this.form.matching_pairs = q.matching_pairs || [
        { left_index: null, right_index: null },
      ];
    }

    if (this.questionType === "mcq" && Array.isArray(q.options)) {
      // Initialize previews from existing stored images (edit mode)
      this.optionImagePreviews = q.options.map((opt) => {
        if (opt && typeof opt === "object" && opt.image) {
          return this.getStoredImageUrl(opt.image);
        }
        return "";
      });
      this.optionImages = q.options.map(() => null);
    } else {
      this.optionImages = Array.isArray(this.form.options)
        ? this.form.options.map(() => null)
        : [];
      this.optionImagePreviews = Array.isArray(this.form.options)
        ? this.form.options.map(() => "")
        : [];
    }

    // 5️⃣ Load question image preview
    if (q.question_image_url) {
      this.questionImagePreview = q.question_image_url;
    }

    // 6️⃣ Render math preview if needed
    this.updatePreview();
  },

  methods: {
    getStoredImageUrl(path) {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      try {
        const base = (axios.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
        if (base) {
          return `${base}/storage/${path}`;
        }
      } catch {}
      return `/storage/${path}`;
    },
    insertEquation() {
      if (this.mathEquation.trim()) {
        this.questionText += ` $${this.mathEquation}$ `;
        this.mathEquation = "";
        this.updatePreview();
      }
    },
    onMathInput(event) {
      // MathLive emits input events with target.value as LaTeX
      this.questionText = event?.target?.value ?? "";
      this.updatePreview();
    },
    insertMathAtCursor(mode = 'inline') {
      const field = this.$refs.mathField;
      const area = this.$refs.questionTextArea;
      if (!area || !field) return;

      // MathLive web component exposes .value containing LaTeX
      const tex = (field.value || '').trim();
      if (!tex) return;

      const start = area.selectionStart ?? this.questionText.length;
      const end = area.selectionEnd ?? this.questionText.length;
      const before = this.questionText.slice(0, start);
      const after = this.questionText.slice(end);

      const wrapped = mode === 'block' ? `\n$$${tex}$$\n` : ` $${tex}$ `;
      const next = before + wrapped + after;
      this.questionText = next;

      // Place caret after inserted content and refocus
      this.$nextTick(() => {
        try {
          const pos = (before + wrapped).length;
          area.focus();
          area.setSelectionRange(pos, pos);
        } catch {}
      });

      // Clear math input and refresh preview
      try { field.value = ''; } catch {}
      this.updatePreview();
    },
    insertAnswerMathAtCursor(mode = 'inline') {
      const mfRef = this.$refs.answerMathField;
      const taRef = this.$refs.answerTextArea;
      const field = Array.isArray(mfRef) ? mfRef[0] : mfRef;
      const area = Array.isArray(taRef) ? taRef[0] : taRef;
      if (!field || !area) return;

      const tex = (field.value || '').trim();
      if (!tex) return;

      const current = String(this.answerText ?? '');
      const start = area.selectionStart ?? current.length;
      const end = area.selectionEnd ?? current.length;
      const before = current.slice(0, start);
      const after = current.slice(end);
      const wrapped = mode === 'block' ? `\n$$${tex}$$\n` : ` $${tex}$ `;
      const next = before + wrapped + after;
      this.answerText = next;

      this.$nextTick(() => {
        try {
          const pos = (before + wrapped).length;
          area.focus();
          area.setSelectionRange(pos, pos);
        } catch {}
      });

      try { field.value = ''; } catch {}
    },
    insertOptionMathAtCursor(idx, mode = 'inline') {
      const mfRef = this.$refs[`optMathField_${idx}`];
      const taRef = this.$refs[`optTextArea_${idx}`];
      const field = Array.isArray(mfRef) ? mfRef[0] : mfRef;
      const area = Array.isArray(taRef) ? taRef[0] : taRef;
      if (!field || !area) return;

      const tex = (field.value || '').trim();
      if (!tex) return;

      const current = String(this.form.options[idx] ?? '');
      const start = area.selectionStart ?? current.length;
      const end = area.selectionEnd ?? current.length;
      const before = current.slice(0, start);
      const after = current.slice(end);
      const wrapped = mode === 'block' ? `\n$$${tex}$$\n` : ` $${tex}$ `;
      const next = before + wrapped + after;
      try {
        // Ensure reactivity in Vue 2/3
        this.form.options.splice(idx, 1, next);
      } catch {
        this.form.options[idx] = next;
      }

      this.$nextTick(() => {
        try {
          const pos = (before + wrapped).length;
          area.focus();
          area.setSelectionRange(pos, pos);
        } catch {}
      });

      try { field.value = ''; } catch {}
    },
    renderMathString(str) {
      const source = String(str ?? '');
      if (!source) return '';
      // If no delimiters, render entire string as math
      if (!source.includes('$')) {
        try {
          return katex.renderToString(source, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          return source;
        }
      }
      // Render block $$...$$
      let html = source.replace(/\$\$(.+?)\$\$/gs, (match, tex) => {
        try {
          return katex.renderToString(tex, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (e) {
          return match;
        }
      });
      // Render inline $...$
      html = html.replace(/\$(.+?)\$/g, (match, tex) => {
        try {
          return katex.renderToString(tex, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          return match;
        }
      });
      return html;
    },
    updatePreview() {
      const source = this.form.is_math ? this.questionText : this.form.question;
      if (!source) {
        this.renderedPreview = "";
        return;
      }
      // If in math mode and the source has no delimiters, render the whole expression
      if (this.form.is_math && !source.includes("$")) {
        try {
          this.renderedPreview = katex.renderToString(source, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          this.renderedPreview = source;
        }
        return;
      }
      // Support both $$ ... $$ and $ ... $
      let html = source;

      // Block math

      html = html.replace(/\$\$(.+?)\$\$/gs, (match, tex) => {
        try {
          return katex.renderToString(tex, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (e) {
          return match;
        }
      });
      // Inline math
      html = html.replace(/\$(.+?)\$/g, (match, tex) => {
        try {
          return katex.renderToString(tex, {
            throwOnError: false,
            displayMode: false,
          });
        } catch {
          return match;
        }
      });
      this.renderedPreview = html;
    },
    addOption() {
      this.form.options.push("");
      this.optionImages.push(null);
      this.optionImagePreviews.push("");
    },
    removeOption(idx) {
      if (this.form.options.length > 2) {
        const removed = this.form.options.splice(idx, 1)[0];
        if (this.optionImages && this.optionImages.length > idx) {
          this.optionImages.splice(idx, 1);
        }
        if (this.optionImagePreviews && this.optionImagePreviews.length > idx) {
          const url = this.optionImagePreviews[idx];
          if (url && typeof URL !== "undefined") {
            try {
              URL.revokeObjectURL(url);
            } catch {}
          }
          this.optionImagePreviews.splice(idx, 1);
        }
        if (this.form.correct_answer === removed) {
          this.form.correct_answer = "";
        }
      }
    },
    onOptionImageChange(e, idx) {
      const file = e.target.files[0];
      if (!this.optionImages) {
        this.optionImages = [];
      }
      // store file
      this.$set ? this.$set(this.optionImages, idx, file || null) : (this.optionImages[idx] = file || null);

      // update preview URL
      if (!this.optionImagePreviews) {
        this.optionImagePreviews = [];
      }
      const existingUrl = this.optionImagePreviews[idx];
      if (existingUrl && typeof URL !== "undefined") {
        try {
          URL.revokeObjectURL(existingUrl);
        } catch {}
      }
      const nextUrl = file ? URL.createObjectURL(file) : "";
      this.$set
        ? this.$set(this.optionImagePreviews, idx, nextUrl)
        : (this.optionImagePreviews[idx] = nextUrl);
    },
    clearOptionImage(idx) {
      if (this.optionImages && this.optionImages.length > idx) {
        this.$set
          ? this.$set(this.optionImages, idx, null)
          : (this.optionImages[idx] = null);
      }
      if (this.optionImagePreviews && this.optionImagePreviews.length > idx) {
        const url = this.optionImagePreviews[idx];
        if (url && typeof URL !== "undefined") {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        this.$set
          ? this.$set(this.optionImagePreviews, idx, "")
          : (this.optionImagePreviews[idx] = "");
      }
    },
    onQuestionImageChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.questionImage = file;
        this.questionImagePreview = URL.createObjectURL(file);
      }
    },
    removeQuestionImage() {
      this.questionImage = null;
      this.questionImagePreview = "";
    },
    addMatchingItem(column) {
      this.form.matching_items[column].push("");
    },
    removeMatchingItem(column, idx) {
      if (this.form.matching_items[column].length > 2) {
        this.form.matching_items[column].splice(idx, 1);

        // Remove any pairs that reference this item
        this.form.matching_pairs = this.form.matching_pairs.filter((pair) => {
          if (column === "left" && pair.left_index === idx) return false;
          if (column === "right" && pair.right_index === idx) return false;
          return true;
        });

        // Adjust indices for remaining pairs
        this.form.matching_pairs.forEach((pair) => {
          if (column === "left" && pair.left_index > idx) pair.left_index--;
          if (column === "right" && pair.right_index > idx) pair.right_index--;
        });
      }
    },
    addMatchingPair() {
      this.form.matching_pairs.push({ left_index: null, right_index: null });
    },
    removeMatchingPair(idx) {
      if (this.form.matching_pairs.length > 1) {
        this.form.matching_pairs.splice(idx, 1);
      }
    },

    async handleSubmit() {
      this.error = "";
      this.success = false;

      if (!this.selectedGradeFilter) {
        const errorMsg =
          "Please select a grade level before adding a question.";
        this.error = errorMsg;
        this.$emit("show-toast", { message: errorMsg, type: "danger" });
        return;
      }

      // Frontend validation per question type
      if (this.questionType === "mcq") {
        if (this.form.options.length < 2) {
          const errorMsg = "At least two options are required.";
          this.error = errorMsg;
          this.$emit("show-toast", { message: errorMsg, type: "danger" });
          return;
        }
        if (!this.form.options.includes(this.form.correct_answer)) {
          const errorMsg = "Correct answer must match one of the options.";
          this.error = errorMsg;
          this.$emit("show-toast", { message: errorMsg, type: "danger" });
          return;
        }
      } else if (this.questionType === "true_false") {
        if (!["true", "false"].includes(this.form.correct_answer)) {
          const errorMsg = "Please select True or False as the correct answer.";
          this.error = errorMsg;
          this.$emit("show-toast", { message: errorMsg, type: "danger" });
          return;
        }
      }

      // Normalize MCQ options: if text is empty but images are used, assign fallback labels
      if (this.questionType === "mcq") {
        this.form.options = this.form.options.map((opt, idx) => {
          const val = (opt || "").toString().trim();
          if (val !== "") return val;
          return `Option ${String.fromCharCode(65 + idx)}`;
        });
      }

      // Prepare FormData
      const formData = new FormData();

      // For matching questions, set options and correct_answer to JSON strings
      let optionsToSend = this.form.options;
      let correctAnswerToSend = this.form.correct_answer;
      if (this.questionType === "matching") {
        // Filter out incomplete pairs
        const filteredPairs = (this.form.matching_pairs || []).filter(
          p => p.left_index !== null && p.right_index !== null
        );
        optionsToSend = JSON.stringify(this.form.matching_items);
        correctAnswerToSend = JSON.stringify(filteredPairs);
      }

      formData.append("question_type", this.questionType);
      formData.append(
        "question",
        this.form.is_math ? this.questionText : this.form.question
      );
      // If short answer and math mode, ensure form.correct_answer contains the answerText
      if (this.questionType === 'short_answer' && this.form.is_math) {
        this.form.correct_answer = this.answerText || this.form.correct_answer || '';
      }
      formData.append("correct_answer", correctAnswerToSend || "");

      if (["mcq", "true_false"].includes(this.questionType)) {
        this.form.options.forEach((opt, i) => {
          formData.append(`options[${i}]`, opt);
          if (this.questionType === "mcq" && this.optionImages && this.optionImages[i]) {
            formData.append(`option_images[${i}]`, this.optionImages[i]);
          }
        });
      } else if (this.questionType === "matching") {
        formData.append("options", optionsToSend);
      } else {
        // Always send at least one empty option for other types to satisfy backend
        formData.append("options[]", "");
      }

      // Marks & difficulty
      // For matching and short_answer, always send user-entered marks (default 1 if empty).
      // For other types, only send marks when provided; otherwise backend will auto-calc from difficulty.
      const rawMarks = this.form.marks;
      if (["matching", "short_answer"].includes(this.questionType)) {
        let effectiveMarks = rawMarks;
        if (effectiveMarks === null || effectiveMarks === undefined || effectiveMarks === "") {
          effectiveMarks = 1;
        }
        formData.append("marks", String(effectiveMarks));
      } else if (rawMarks !== null && rawMarks !== undefined && rawMarks !== "") {
        formData.append("marks", String(rawMarks));
      }

      formData.append("explanation", this.form.explanation || "");
      formData.append(
        "difficulty_level",
        this.form.difficulty || "remembering"
      );
      formData.append("is_math", this.form.is_math ? "1" : "0");
      formData.append("is_chemistry", this.form.is_chemistry ? "1" : "0");
      formData.append(
        "multiple_answers",
        this.form.multiple_answers ? "1" : "0"
      );
      formData.append("is_required", this.form.is_required ? "1" : "0");
      formData.append("subject_id", this.subjectId);
      formData.append("topic_id", this.topicId);
      formData.append(
        "grade_level_id",
        this.selectedGradeFilter !== "" ? String(this.selectedGradeFilter) : ""
      );

      if (this.questionImage) {
        formData.append("question_image", this.questionImage);
      }

      // Handle edit mode
      let url = "/questions";
      let method = "post";
      if (this.isEditMode) {
        if (!this.form.id) {
          const errorMsg = "Unable to update question: Missing ID";
          this.error = errorMsg;
          this.$emit("show-toast", { message: errorMsg, type: "danger" });
          return;
        }
        url = `/questions/${this.form.id}`;
        method = "post";
        formData.append("_method", "PUT");
      }

      const token = localStorage.getItem("auth_token");
      try {
        const response = await axios({
          method,
          url,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (response.status === 200 || response.status === 201) {
          this.success = true;
          const successMsg = this.isEditMode
            ? "Question updated successfully!"
            : "Question created successfully!";
          this.$emit("show-toast", { message: successMsg, type: "success" });
          this.$emit(this.isEditMode ? "updated" : "created");
        }
      } catch (err) {
        let errorMsg =
          err.response?.data?.message || "An error occurred. Please try again.";
        this.error = errorMsg;
        this.$emit("show-toast", { message: errorMsg, type: "danger" });
        console.error("Error details:", err);
      }
    },
  },
  watch: {
    questionType(newType) {
      // initialize sensible defaults when switching types
      if (newType === 'true_false') {
        this.form.options = ['true', 'false'];
        if (!['true', 'false'].includes(this.form.correct_answer)) {
          this.form.correct_answer = '';
        }
      } else if (newType === 'short_answer') {
        this.form.options = [''];
        // populate answerText for math short answers
        if (this.form.is_math) {
          this.answerText = this.form.correct_answer || '';
        }
      } else if (newType === 'mcq') {
        if (!Array.isArray(this.form.options) || this.form.options.length < 2) {
          this.form.options = ['', ''];
        }
      }
    },
    // keep short-answer math editor in sync
    answerText() {
      if (this.questionType === 'short_answer' && this.form.is_math) {
        this.form.correct_answer = this.answerText;
      }
    },
    questionText() {
      this.updatePreview();
    },
    "form.options": {
      handler(newOptions) {
        if (["mcq", "true_false"].includes(this.questionType)) {
          if (!newOptions.includes(this.form.correct_answer)) {
            this.form.correct_answer = "";
          }
        }
      },
      deep: true,
    },
    "form.is_math"(val) {
      if (val) {
        if (!this.questionText) {
          this.questionText = this.form.question || "";
        }
        this.updatePreview();
      }
    },
  },
};
</script>

<style scoped>
.form-section {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-subtitle {
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.block {
  display: block;
}

.w-full {
  width: 100%;
}

.border {
  border: 1px solid #ced4da;
}

.rounded {
  border-radius: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mt-5 {
  margin-top: 2rem;
}

.bg-blue-600 {
  background-color: #2563eb;
}

.bg-green-600 {
  background-color: #16a34a;
}

.text-white {
  color: #fff;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.font-semibold {
  font-weight: 600;
}
</style>
