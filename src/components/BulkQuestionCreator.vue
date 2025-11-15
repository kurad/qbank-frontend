<template>
  <div class="container py-4">
    <h2 class="mb-3">Bulk Question Creator</h2>

    <div class="card p-3 mb-3">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Grade</label>
          <select v-model="selectedGrade" class="form-select" @change="onGradeChange">
            <option value="" disabled>Select grade</option>
            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.grade_name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Subject</label>
          <select v-model="selectedSubject" class="form-select" :disabled="!subjects.length" @change="onSubjectChange">
            <option value="" disabled>Select subject</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="col-md-5">
          <label class="form-label">Topic</label>
          <select v-model="selectedTopic" class="form-select" :disabled="!topics.length">
            <option value="" disabled>Select topic</option>
            <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.topic_name }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5 class="mb-0">Questions ({{ items.length }})</h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="addItem(5)">+5</button>
        <button class="btn btn-outline-secondary btn-sm" @click="addItem(1)">+1</button>
      </div>
    </div>

    <div v-if="items.length === 0" class="alert alert-info">Use +1 to add a question row.</div>

    <div v-for="(it, idx) in items" :key="it.uid" class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="fw-semibold">#{{ idx + 1 }}</div>
          <div class="d-flex align-items-center gap-2">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="it.useTextarea" :id="`ta_${it.uid}`">
              <label class="form-check-label" :for="`ta_${it.uid}`">Long Text</label>
            </div>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="it.is_math" :id="`math_${it.uid}`">
              <label class="form-check-label" :for="`math_${it.uid}`">Math</label>
            </div>
            <button class="btn btn-sm btn-outline-danger" @click="removeItem(idx)">&times;</button>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Type</label>
            <select v-model="it.question_type" class="form-select form-select-sm">
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="matching">Matching</option>
            </select>
          </div>
          <div class="col-md-9">
            <label class="form-label">Question</label>
            <template v-if="it.is_math">
              <textarea :ref="`qta_${it.uid}`" class="form-control form-control-sm mb-1" v-model="it.question" rows="it.useTextarea ? 4 : 2" :placeholder="it.useTextarea ? 'Enter question...' : 'Enter question...'" />
              <math-field :ref="`qmf_${it.uid}`" virtual-keyboard-mode="onfocus" class="w-100 border rounded p-2" style="min-height: 40px"></math-field>
              <div class="mt-1 d-flex gap-2">
                <button type="button" class="btn btn-outline-primary btn-sm" @click="insertRowMathAtCursor(it, 'question', 'inline')">Inline ($...$)</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="insertRowMathAtCursor(it, 'question', 'block')">Block ($$...$$)</button>
              </div>
            </template>
            <template v-else>
              <textarea v-if="it.useTextarea" class="form-control form-control-sm" v-model="it.question" rows="4" placeholder="Enter question..."></textarea>
              <input v-else class="form-control form-control-sm" v-model="it.question" placeholder="Enter question..." />
            </template>
            <div class="mt-2 d-flex align-items-center gap-2">
              <label class="btn btn-outline-secondary btn-sm mb-0">
                <input type="file" accept="image/*" :id="`qi_${it.uid}`" style="display:none" @change="onQuestionImageChange(it, $event)" />
                Add image
              </label>
              <button v-if="it.questionImagePreview" type="button" class="btn btn-outline-danger btn-sm" @click="removeQuestionImage(it)">&times; Remove</button>
            </div>
            <div v-if="it.questionImagePreview" class="mt-2">
              <img :src="it.questionImagePreview" alt="Question Image Preview" class="img-thumbnail" style="max-width: 200px; max-height: 150px" />
            </div>
          </div>
          <template v-if="it.question_type === 'mcq'">
            <div class="col-12">
              <label class="form-label">Options</label>
              <div class="d-flex flex-wrap gap-2">
                <div v-for="(opt, oidx) in it.options" :key="oidx" class="input-group input-group-sm" style="max-width: 420px;">
                  <div class="input-group-text">
                    <input type="radio" :name="`ca_${it.uid}`" v-model="it.correct_answer" :value="opt" />
                  </div>
                  <template v-if="it.is_math">
                    <textarea :ref="`ota_${it.uid}_${oidx}`" class="form-control" v-model="it.options[oidx]" :placeholder="`Option ${String.fromCharCode(65+oidx)}`" rows="it.useTextarea ? 3 : 2" @paste="onOptionsPaste(it, oidx, $event)"></textarea>
                    <button class="btn btn-outline-primary" type="button" @click="insertRowMathAtCursor(it, oidx, 'inline')">Inline</button>
                    <button class="btn btn-outline-secondary" type="button" @click="insertRowMathAtCursor(it, oidx, 'block')">Block</button>
                  </template>
                  <template v-else>
                    <!-- <textarea v-if="it.useTextarea" class="form-control" v-model="it.options[oidx]" :placeholder="`Option ${String.fromCharCode(65+oidx)}`" rows="3"></textarea> -->
                    <input class="form-control" v-model="it.options[oidx]" :placeholder="`Option ${String.fromCharCode(65+oidx)}`" @paste="onOptionsPaste(it, oidx, $event)" />
                  </template>
                  <button class="btn btn-outline-danger" v-if="it.options.length>2" @click="it.options.splice(oidx,1)">&times;</button>
                </div>
              </div>
              <div class="mt-2 d-flex gap-2">
                <button class="btn btn-outline-success btn-sm" @click="it.options.push('')">Add option</button>
              </div>
            </div>
          </template>

          <template v-else-if="it.question_type === 'true_false'">
            <div class="col-12">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" :name="`tf_${it.uid}`" value="true" v-model="it.correct_answer" />
                <label class="form-check-label">True</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" :name="`tf_${it.uid}`" value="false" v-model="it.correct_answer" />
                <label class="form-check-label">False</label>
              </div>
            </div>
          </template>

          <template v-else-if="it.question_type === 'short_answer'">
            <div class="col-12">
              <label class="form-label">Expected Answer</label>
              <template v-if="it.is_math">
                <textarea :ref="`ata_${it.uid}`" class="form-control form-control-sm mb-1" v-model="it.correct_answer" rows="it.useTextarea ? 3 : 2" placeholder="Enter expected answer..."></textarea>
                <math-field :ref="`amf_${it.uid}`" virtual-keyboard-mode="onfocus" class="w-100 border rounded p-2" style="min-height: 36px"></math-field>
                <div class="mt-1 d-flex gap-2">
                  <button type="button" class="btn btn-outline-primary btn-sm" @click="insertRowMathAtCursor(it, 'answer', 'inline')">Inline ($...$)</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" @click="insertRowMathAtCursor(it, 'answer', 'block')">Block ($$...$$)</button>
                </div>
              </template>
              <template v-else>
                <textarea v-if="it.useTextarea" class="form-control form-control-sm" v-model="it.correct_answer" rows="3" placeholder="Enter expected answer..."></textarea>
                <input v-else class="form-control form-control-sm" v-model="it.correct_answer" placeholder="Enter expected answer..." />
              </template>
            </div>
          </template>

          <template v-else-if="it.question_type === 'matching'">
            <div class="col-md-6">
              <strong>Left Column</strong>
              <div v-for="(lv, li) in it.matching_items.left" :key="'l-' + li" class="input-group input-group-sm mb-2">
                <input class="form-control" v-model="it.matching_items.left[li]" :placeholder="`Left ${li+1}`" />
                <button class="btn btn-outline-danger" v-if="it.matching_items.left.length>2" @click="removeMatchingItem(it,'left', li)">&times;</button>
              </div>
              <button class="btn btn-outline-success btn-sm" @click="addMatchingItem(it, 'left')">+ Add Left</button>
            </div>
            <div class="col-md-6">
              <strong>Right Column</strong>
              <div v-for="(rv, ri) in it.matching_items.right" :key="'r-' + ri" class="input-group input-group-sm mb-2">
                <input class="form-control" v-model="it.matching_items.right[ri]" :placeholder="`Right ${ri+1}`" />
                <button class="btn btn-outline-danger" v-if="it.matching_items.right.length>2" @click="removeMatchingItem(it,'right', ri)">&times;</button>
              </div>
              <button class="btn btn-outline-success btn-sm" @click="addMatchingItem(it, 'right')">+ Add Right</button>
            </div>
            <div class="col-12 mt-2">
              <label class="form-label">Matching Pairs</label>
              <div v-for="(pair, pi) in it.matching_pairs" :key="'p-' + pi" class="row g-2 align-items-center mb-2">
                <div class="col-5">
                  <select v-model.number="pair.left_index" class="form-select form-select-sm">
                    <option :value="null" disabled>Select Left</option>
                    <option v-for="(lv, li) in it.matching_items.left" :key="'lopt-' + li" :value="li">{{ lv || `Left ${li+1}` }}</option>
                  </select>
                </div>
                <div class="col-2 text-center">→</div>
                <div class="col-5">
                  <select v-model.number="pair.right_index" class="form-select form-select-sm">
                    <option :value="null" disabled>Select Right</option>
                    <option v-for="(rv, ri) in it.matching_items.right" :key="'ropt-' + ri" :value="ri">{{ rv || `Right ${ri+1}` }}</option>
                  </select>
                </div>
                <div class="col-12">
                  <button v-if="it.matching_pairs.length>1" class="btn btn-outline-danger btn-sm" type="button" @click="removeMatchingPair(it, pi)">&times; Remove Pair</button>
                </div>
              </div>
              <button class="btn btn-outline-success btn-sm" type="button" @click="addMatchingPair(it)">+ Add Pair</button>
            </div>
          </template>

          <div class="col-12">
              <div class="row g-2">
                <div class="col-md-6">
                  <label class="form-label">Difficulty (Bloom's)</label>
                  <select class="form-select form-select-sm" v-model="it.difficulty_level">
                    <option value="remembering">Remembering</option>
                    <option value="understanding">Understanding</option>
                    <option value="applying">Applying</option>
                    <option value="analyzing">Analyzing</option>
                    <option value="evaluating">Evaluating</option>
                    <option value="creating">Creating</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Explanation (optional)</label>
                  <textarea class="form-control form-control-sm" rows="2" v-model="it.explanation"></textarea>
                </div>
              </div>
          
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-between mt-3">
      <router-link class="btn btn-outline-secondary" :to="{ name: 'questions' }">Back to Questions</router-link>
      <button class="btn btn-primary" :disabled="saving || !canSave" @click="saveAll">
        {{ saving ? 'Saving...' : 'Save All' }}
      </button>
    </div>

    <div class="mt-3">
      <div class="alert alert-danger" v-if="error">{{ error }}</div>
      <div class="alert alert-success" v-if="success">Saved {{ savedCount }} questions.</div>
    </div>
  </div>
</template>

<script>
import 'mathlive';
import axios from 'axios';
import { questionService } from '@/services/questionService';

export default {
  name: 'BulkQuestionCreator',
  data() {
    return {
      gradeLevels: [],
      subjects: [],
      topics: [],
      selectedGrade: '',
      selectedSubject: '',
      selectedTopic: '',
      items: [],
      saving: false,
      error: '',
      success: false,
      savedCount: 0,
    };
  },
  computed: {
    canSave() {
      return !!(this.selectedGrade && this.selectedSubject && this.selectedTopic && this.items.length > 0);
    }
  },
  created() {
    this.fetchGrades();
    // Seed one row
    this.addItem(1);
  },
  methods: {
    addItem(n = 1) {
      for (let i = 0; i < n; i++) {
        this.items.push({
          uid: Math.random().toString(36).slice(2),
          question_type: 'mcq',
          question: '',
          options: ['', ''],
          correct_answer: '',
          explanation: '',
          difficulty_level: 'remembering',
          useTextarea: false,
          is_math: false,
          matching_items: { left: ['', ''], right: ['', ''] },
          matching_pairs: [{ left_index: null, right_index: null }],
        });
      }
    },
    removeItem(idx) {
      this.items.splice(idx, 1);
    },
    async fetchGrades() {
      try { this.gradeLevels = await questionService.fetchGradeLevels(); }
      catch { this.gradeLevels = []; }
    },
    async onGradeChange() {
      this.selectedSubject = '';
      this.selectedTopic = '';
      this.topics = [];
      try { this.subjects = await questionService.fetchSubjects(this.selectedGrade); }
      catch { this.subjects = []; }
    },
    async onSubjectChange() {
      this.selectedTopic = '';
      try { this.topics = await questionService.fetchTopics(this.selectedSubject, this.selectedGrade); }
      catch { this.topics = []; }
    },
    buildFormData(it) {
      const fd = new FormData();
      fd.append('question_type', it.question_type);
      fd.append('question', it.question || '');
      if (it.question_type === 'mcq') {
        (it.options || []).forEach((opt, i) => fd.append(`options[${i}]`, opt));
      } else if (it.question_type === 'matching') {
        fd.append('options', JSON.stringify(it.matching_items || { left: [], right: [] }));
      } else {
        fd.append('options[]', '');
      }
      if (it.question_type === 'matching') {
        const pairs = (it.matching_pairs || []).filter(p => p.left_index !== null && p.right_index !== null);
        fd.append('correct_answer', JSON.stringify(pairs));
      } else {
        fd.append('correct_answer', it.correct_answer || '');
      }
      fd.append('explanation', it.explanation || '');
  fd.append('difficulty_level', it.difficulty_level || 'remembering');
      fd.append('is_math', it.is_math ? '1' : '0');
      fd.append('is_chemistry', '0');
      fd.append('multiple_answers', '0');
      fd.append('is_required', '0');
      fd.append('subject_id', this.selectedSubject);
      fd.append('topic_id', this.selectedTopic);
      fd.append('grade_level_id', String(this.selectedGrade));
      if (it.questionImage) {
        fd.append('question_image', it.questionImage);
      }
      return fd;
    },
    onQuestionImageChange(it, e) {
      const file = e?.target?.files?.[0];
      if (!file) return;
      it.questionImage = file;
      try { it.questionImagePreview = URL.createObjectURL(file); } catch { it.questionImagePreview = ''; }
    },
    removeQuestionImage(it) {
      it.questionImage = null;
      it.questionImagePreview = '';
    },
    // Math insertion helpers
    insertRowMathAtCursor(it, target, mode = 'inline') {
      // target can be 'question', 'answer', or option index (number)
      let mfRefKey = '';
      let taRefKey = '';
      if (target === 'question') {
        mfRefKey = `qmf_${it.uid}`;
        taRefKey = `qta_${it.uid}`;
      } else if (target === 'answer') {
        mfRefKey = `amf_${it.uid}`;
        taRefKey = `ata_${it.uid}`;
      } else {
        mfRefKey = `qmf_${it.uid}`; // reuse question math field for options
        taRefKey = `ota_${it.uid}_${target}`;
      }
      const mf = this.$refs[mfRefKey];
      const ta = this.$refs[taRefKey];
      const field = Array.isArray(mf) ? mf[0] : mf;
      const area = Array.isArray(ta) ? ta[0] : ta;
      if (!field || !area) return;
      const tex = (field.value || '').trim();
      if (!tex) return;
      const beforeAfter = (val) => {
        const start = area.selectionStart ?? val.length;
        const end = area.selectionEnd ?? val.length;
        const before = val.slice(0, start);
        const after = val.slice(end);
        return { before, after };
      };
      const wrapped = mode === 'block' ? `\n$$${tex}$$\n` : ` $${tex}$ `;
      if (target === 'question') {
        const current = String(it.question || '');
        const { before, after } = beforeAfter(current);
        it.question = before + wrapped + after;
      } else if (target === 'answer') {
        const current = String(it.correct_answer || '');
        const { before, after } = beforeAfter(current);
        it.correct_answer = before + wrapped + after;
      } else if (typeof target === 'number') {
        const current = String(it.options[target] || '');
        const { before, after } = beforeAfter(current);
        this.$set ? this.$set(it.options, target, before + wrapped + after) : it.options.splice(target, 1, before + wrapped + after);
      }
      try { field.value = ''; } catch {}
    },
    addMatchingItem(it, column) {
      it.matching_items[column].push('');
    },
    removeMatchingItem(it, column, idx) {
      if (it.matching_items[column].length > 2) {
        it.matching_items[column].splice(idx, 1);
        it.matching_pairs = (it.matching_pairs || []).filter(p => {
          if (column === 'left' && p.left_index === idx) return false;
          if (column === 'right' && p.right_index === idx) return false;
          return true;
        }).map(p => ({
          left_index: p.left_index !== null && p.left_index > idx ? p.left_index - 1 : p.left_index,
          right_index: p.right_index !== null && p.right_index > idx ? p.right_index - 1 : p.right_index,
        }));
      }
    },
    addMatchingPair(it) {
      it.matching_pairs.push({ left_index: null, right_index: null });
    },
    removeMatchingPair(it, idx) {
      if (it.matching_pairs.length > 1) it.matching_pairs.splice(idx, 1);
    },
    // Handle paste into an option input/textarea. If the pasted content contains multiple
    // lines or comma-separated values, split them and insert as separate options starting
    // at the current option index. Single-value pastes behave as normal (browser will
    // still insert into the focused input, but we intercept to insert multiple options).
    onOptionsPaste(it, oidx, e) {
      try {
        const clipboard = (e.clipboardData || window.clipboardData);
        if (!clipboard) return;
        const pasted = clipboard.getData('text');
        if (!pasted) return;
        // If single-line without commas, let default behavior (do nothing special)
        const hasNewline = /\r|\n/.test(pasted);
        const hasComma = /,/.test(pasted);
        if (!hasNewline && !hasComma) return; // leave default paste
        e.preventDefault();
        const items = this.normalizePastedOptions(pasted);
        if (!items.length) return;
        this.insertMultipleOptions(it, oidx, items);
      } catch (err) {
        // swallow errors to avoid breaking paste
        return;
      }
    },

    // Normalize pasted text into an array of option strings. Splits on newlines and
    // commas, trims whitespace, removes empty entries and duplicates while preserving order.
    normalizePastedOptions(text) {
      const parts = text.split(/\r?\n|,/).map(s => (s || '').trim()).filter(Boolean);
      const seen = new Set();
      const out = [];
      for (const p of parts) {
        if (!seen.has(p)) { seen.add(p); out.push(p); }
      }
      return out;
    },

    // Insert multiple options into the it.options array starting at index oidx.
    // If the first pasted item should replace the current input value, we replace
    // the current index and insert the remaining after it. Otherwise we insert all
    // after the current index. Current behavior: replace current with first pasted.
    insertMultipleOptions(it, oidx, newOptions) {
      if (!Array.isArray(it.options)) it.options = [];
      // Replace current option with first pasted
      const first = newOptions[0];
      this.$set ? this.$set(it.options, oidx, first) : (it.options[oidx] = first);
      // Insert remaining
      if (newOptions.length > 1) {
        const rest = newOptions.slice(1);
        it.options.splice(oidx + 1, 0, ...rest);
      }
    },
    async saveAll() {
      this.error = '';
      this.success = false;
      this.savedCount = 0;
      // Basic validation
      for (const it of this.items) {
        if (!it.question) { this.error = 'Each question must have text.'; return; }
        if (it.question_type === 'mcq') {
          if (!Array.isArray(it.options) || it.options.length < 2) { this.error = 'MCQ needs at least two options.'; return; }
          if (!it.options.includes(it.correct_answer)) { this.error = 'MCQ correct answer must match one option.'; return; }
        } else if (it.question_type === 'true_false') {
          if (!['true','false'].includes(String(it.correct_answer))) { this.error = 'True/False must have a correct answer.'; return; }
        } else if (it.question_type === 'matching') {
          if ((it.matching_items.left || []).length < 2 || (it.matching_items.right || []).length < 2) { this.error = 'Matching needs at least two items on each side.'; return; }
        }
      }
      this.saving = true;
      try {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Content-Type': 'multipart/form-data', ...(token && { Authorization: `Bearer ${token}` }) };
        for (const it of this.items) {
          const fd = this.buildFormData(it);
          const resp = await axios.post('/questions', fd, { headers });
          if (resp.status === 200 || resp.status === 201) this.savedCount++;
        }
        this.success = true;
      } catch (e) {
        this.error = e?.response?.data?.message || 'Failed to save some questions.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.card-body label { font-weight: 600; }
</style>
