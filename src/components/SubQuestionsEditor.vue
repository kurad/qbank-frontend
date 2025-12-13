<template>
  <div>
    <div
      v-for="(sub, sIdx) in subQuestions"
      :key="sub.id || sIdx"
      class="border rounded p-3 mb-3"
    >
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="fw-semibold">Sub-question {{ sIdx + 1 }}</div>
        <button
          v-if="subQuestions.length > 1"
          type="button"
          class="btn btn-sm btn-outline-danger"
          @click="removeSubQuestion(sIdx)"
        >
          &times;
        </button>
      </div>

      <div class="row g-2 mb-2">
        <div class="col-md-5">
          <label class="form-label">Question text</label>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="sub.question"
            :placeholder="`Sub-question ${sIdx + 1}`"
          />
        </div>
        <div class="col-md-2">
          <label class="form-label">Type</label>
          <select
            class="form-select form-select-sm"
            v-model="sub.question_type"
            @change="onSubTypeChange(sub)"
          >
            <option value="short_answer">Short Answer</option>
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Marks</label>
          <input
            type="number"
            min="0"
            class="form-control form-control-sm"
            v-model.number="sub.marks"
          />
        </div>
        <div class="col-md-3">
          <label class="form-label">Difficulty</label>
          <select
            class="form-select form-select-sm"
            v-model="sub.difficulty_level"
          >
            <option value="">Select</option>
            <option value="remembering">Remembering</option>
            <option value="understanding">Understanding</option>
            <option value="applying">Applying</option>
            <option value="analyzing">Analyzing</option>
            <option value="evaluating">Evaluating</option>
            <option value="creating">Creating</option>
          </select>
        </div>
      </div>

      <div class="mb-2" v-if="sub.question_type === 'mcq'">
        <label class="form-label">Options</label>
        <div
          v-for="(opt, oIdx) in sub.options"
          :key="oIdx"
          class="input-group input-group-sm mb-1"
        >
          <div class="input-group-text">
            <input
              type="radio"
              :name="`sub_correct_${sIdx}`"
              :value="opt"
              v-model="sub.correct_answer"
            />
          </div>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="sub.options[oIdx]"
            :placeholder="`Option ${String.fromCharCode(65 + oIdx)}`"
          />
          <button
            v-if="sub.options.length > 2"
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="removeSubOption(sub, oIdx)"
          >
            &times;
          </button>
        </div>
        <button
          type="button"
          class="btn btn-outline-success btn-sm mt-1"
          @click="addSubOption(sub)"
        >
          + Add option
        </button>
      </div>

      <div class="mb-2" v-else-if="sub.question_type === 'true_false'">
        <label class="form-label d-block">Correct answer</label>
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            :name="`sub_tf_${sIdx}`"
            value="true"
            v-model="sub.correct_answer"
          />
          <label class="form-check-label">True</label>
        </div>
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            :name="`sub_tf_${sIdx}`"
            value="false"
            v-model="sub.correct_answer"
          />
          <label class="form-check-label">False</label>
        </div>
      </div>

      <div class="mb-2" v-else>
        <label class="form-label">Expected answer</label>
        <input
          type="text"
          class="form-control form-control-sm"
          v-model="sub.correct_answer"
          placeholder="Enter expected answer"
        />
      </div>
    </div>

    <button
      type="button"
      class="btn btn-outline-primary btn-sm"
      @click="addSubQuestion"
    >
      + Add sub-question
    </button>
  </div>
</template>

<script>
export default {
  name: 'SubQuestionsEditor',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  computed: {
    subQuestions: {
      get() {
        return Array.isArray(this.modelValue) ? this.modelValue : [];
      },
      set(val) {
        this.$emit('update:modelValue', val);
      },
    },
  },
  methods: {
    addSubQuestion() {
      const next = this.subQuestions.slice();
      next.push({
        id: null,
        question: '',
        question_type: 'short_answer',
        options: ['', ''],
        correct_answer: '',
        marks: 1,
        difficulty_level: '',
      });
      this.subQuestions = next;
    },
    removeSubQuestion(idx) {
      if (this.subQuestions.length <= 1) return;
      const next = this.subQuestions.slice();
      next.splice(idx, 1);
      this.subQuestions = next;
    },
    addSubOption(sub) {
      if (!Array.isArray(sub.options)) {
        sub.options = ['', ''];
      }
      sub.options.push('');
      this.subQuestions = this.subQuestions.slice();
    },
    removeSubOption(sub, idx) {
      if (!Array.isArray(sub.options) || sub.options.length <= 2) return;
      const removed = sub.options.splice(idx, 1)[0];
      if (sub.correct_answer === removed) {
        sub.correct_answer = '';
      }
      this.subQuestions = this.subQuestions.slice();
    },
    onSubTypeChange(sub) {
      if (sub.question_type === 'true_false') {
        sub.options = ['true', 'false'];
        if (!['true', 'false'].includes(String(sub.correct_answer))) {
          sub.correct_answer = '';
        }
      } else if (sub.question_type === 'mcq') {
        if (!Array.isArray(sub.options) || sub.options.length < 2) {
          sub.options = ['', ''];
        }
      } else {
        sub.options = [''];
      }
      this.subQuestions = this.subQuestions.slice();
    },
  },
};
</script>

<style scoped>
</style>
