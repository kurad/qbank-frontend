

<template>
  <form @submit.prevent="handleSubmit" class="needs-validation" novalidate>
    <div class="form-section mb-4">
      <h3 class="section-subtitle mb-3">Question Settings With LaTeX</h3>
      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label for="question_type" class="form-label">Question Type <span class="required-mark">*</span></label>
          <select v-model="questionType" id="question_type" required class="form-select">
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="difficulty" class="form-label">Difficulty Level</label>
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
        <div class="col-md-4">
          <label for="marks" class="form-label">Points <span class="required-mark">*</span></label>
          <input v-model.number="form.marks" id="marks" type="number" min="0" required class="form-control form-control-sm w-auto" style="max-width:90px;" />
        </div>
      </div>
    </div>

    <div class="form-section mb-4">
      <h3 class="section-subtitle mb-3">Question Content</h3>
      <div v-if="form.is_math">
        <!-- MathLive/KaTeX workflow -->
        <label class="block mb-2">Question:</label>
        <textarea 
          v-model="questionText"
          placeholder="Type question text here..."
          class="border rounded p-2 w-full"
        ></textarea>
        <label class="block mt-4 mb-2">Insert Equation:</label>
        <div style="min-height: 50px; width: 100%;">
          <math-field
            ref="mathField"
            v-model="mathEquation"
            class="border rounded p-2 w-full bg-white"
            style="min-height:50px;"
          ></math-field>
        </div>
        <button 
          class="mt-3 bg-blue-600 text-white px-3 py-1 rounded"
          @click="insertEquation"
        >
          Insert Equation
        </button>
        <div class="mt-4">
          <h4 class="font-semibold">Preview:</h4>
          <div v-html="renderedPreview"></div>
        </div>
        <!-- Options for math questions -->
        <div class="mb-3">
          <label class="form-label">Options</label>
          <div v-for="(option, idx) in form.options" :key="idx" class="input-group input-group-sm mb-2" style="max-width:440px;">
            <div class="input-group-text">
              <input type="checkbox" :checked="form.correct_answer === option" @change="form.correct_answer = option" :id="`option-${idx}`" />
            </div>
            <math-field
              class="form-control form-control-sm"
              v-model="form.options[idx]"
              :id="`option-${idx}`"
              required
              placeholder="Enter option as math..."
            ></math-field>
            <button type="button" class="btn btn-outline-danger btn-sm" @click="removeOption(idx)" v-if="form.options.length > 2" title="Remove option">&times;</button>
          </div>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" @click="addOption">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>
            Add option
          </button>
        </div>
      </div>
      <div v-else>
        <!-- Original workflow for non-math questions -->
        <div v-if="questionType === 'mcq'" class="card p-3 mb-3">
          <div class="d-flex align-items-center mb-3">
            <span class="badge bg-primary me-2">Q</span>
            <div class="flex-grow-1">
              <input class="form-control" 
                v-model="form.question" id="question" 
                required placeholder="Enter your question here..." />
            </div>
            <label class="btn btn-outline-secondary ms-2" title="Add image">
              <input type="file" accept="image/*" @change="onQuestionImageChange" style="display:none" />
              <svg width="20" height="20" fill="none" stroke="#888" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-9 9l9-9"/></svg>
            </label>
          </div>
          <div v-if="questionImagePreview" class="mb-3">
            <img :src="questionImagePreview" alt="Question Image Preview" class="img-thumbnail" style="max-width:200px;max-height:150px;" />
            <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="removeQuestionImage" title="Remove image">&times;</button>
          </div>
          <div class="mb-3">
            <label class="form-label">Options</label>
            <div v-for="(option, idx) in form.options" :key="idx" class="input-group input-group-sm mb-2" style="max-width:440px;">
              <div class="input-group-text">
                <input type="checkbox" :checked="form.correct_answer === option" @change="form.correct_answer = option" :id="`option-${idx}`" />
              </div>
              <input class="form-control form-control-sm" v-model="form.options[idx]" :placeholder="`Option ${String.fromCharCode(65 + idx)}`" required style="min-width:60px;max-width:180px;" />
              <button type="button" class="btn btn-outline-danger btn-sm" @click="removeOption(idx)" v-if="form.options.length > 2" title="Remove option">&times;</button>
            </div>
            <button type="button" class="btn btn-outline-success btn-sm mt-2" @click="addOption">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>
              Add option
            </button>
          </div>
          <div class="mb-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_math" id="is_math_mcq" />
              <label class="form-check-label" for="is_math_mcq">Math Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_chemistry" id="is_chemistry_mcq" />
              <label class="form-check-label" for="is_chemistry_mcq">Chemistry Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.multiple_answers" id="multiple_answers_mcq" />
              <label class="form-check-label" for="multiple_answers_mcq">Multiple Answers</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.required" id="required_mcq" />
              <label class="form-check-label" for="required_mcq">Required</label>
            </div>
          </div>
        </div>
        <div v-if="questionType === 'true_false'" class="card p-3 mb-3">
          <div class="d-flex align-items-center mb-3">
            <span class="badge bg-primary me-2">Q</span>
            <div class="flex-grow-1">
              <input class="form-control" v-model="form.question" id="question_tf" required placeholder="Enter your question here..." />
            </div>
            <label class="btn btn-outline-secondary ms-2" title="Add image">
              <input type="file" accept="image/*" @change="onQuestionImageChange" style="display:none" />
              <svg width="20" height="20" fill="none" stroke="#888" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-9 9l9-9"/></svg>
            </label>
          </div>
          <div v-if="questionImagePreview" class="mb-3">
            <img :src="questionImagePreview" alt="Question Image Preview" class="img-thumbnail" style="max-width:200px;max-height:150px;" />
            <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="removeQuestionImage" title="Remove image">&times;</button>
          </div>
          <div class="mb-3">
            <label class="form-label">Correct Answer</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="form.correct_answer" id="true_option" value="True" required />
              <label class="form-check-label" for="true_option">True</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="form.correct_answer" id="false_option" value="False" required />
              <label class="form-check-label" for="false_option">False</label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_math" id="is_math_tf" />
              <label class="form-check-label" for="is_math_tf">Math Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_chemistry" id="is_chemistry_tf" />
              <label class="form-check-label" for="is_chemistry_tf">Chemistry Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.required" id="required_tf" />
              <label class="form-check-label" for="required_tf">Required</label>
            </div>
          </div>
        </div>
        <div v-if="questionType === 'short_answer'" class="card p-3 mb-3">
          <div class="d-flex align-items-center mb-3">
            <span class="badge bg-primary me-2">Q</span>
            <div class="flex-grow-1">
              <input class="form-control" v-model="form.question" id="question_sa" required placeholder="Enter your question here..." />
            </div>
            <label class="btn btn-outline-secondary ms-2" title="Add image">
              <input type="file" accept="image/*" @change="onQuestionImageChange" style="display:none" />
              <svg width="20" height="20" fill="none" stroke="#888" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-9 9l9-9"/></svg>
            </label>
          </div>
          <div v-if="questionImagePreview" class="mb-3">
            <img :src="questionImagePreview" alt="Question Image Preview" class="img-thumbnail" style="max-width:200px;max-height:150px;" />
            <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="removeQuestionImage" title="Remove image">&times;</button>
          </div>
          <div class="mb-3">
            <label class="form-label">Expected Answer</label>
            <input class="form-control" v-model="form.correct_answer" id="correct_answer_sa" type="text" placeholder="Enter the expected answer" required />
            <div class="form-text mt-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
              Students must match this answer exactly
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_math" id="is_math_sa" />
              <label class="form-check-label" for="is_math_sa">Math Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.is_chemistry" id="is_chemistry_sa" />
              <label class="form-check-label" for="is_chemistry_sa">Chemistry Question</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" v-model="form.required" id="required_sa" />
              <label class="form-check-label" for="required_sa">Required</label>
            </div>
          </div>
        </div>
      </div>
      <div class="form-section mb-4">
        <h3 class="section-subtitle mb-3">Additional Information</h3>
        <div class="mb-3">
          <label for="explanation" class="form-label">Explanation (Optional)</label>
          <textarea v-model="form.explanation" id="explanation" class="form-control" rows="3" placeholder="Provide an explanation for the correct answer..."></textarea>
        </div>
      </div>
      <div class="alert alert-danger" v-if="error">{{ error }}</div>
      <div class="alert alert-success" v-if="success">Question saved successfully!</div>
      <div class="d-flex justify-content-between mt-4">
        <button type="button" class="btn btn-outline-secondary" @click="$emit('cancel')" v-if="!hideCancel">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="success">
          {{ isEditMode ? 'Update' : 'Save' }} Question
        </button>
      </div>
    </div>
  </form>
</template>



<script>
import "mathlive";
import katex from "katex";
import "katex/dist/katex.min.css";
import axios from 'axios';

export default {
  name: 'QuestionFormWithMathKaTeX',
  props: {
    subjectId: {
      type: [Number, String],
      required: true
    },
    topicId: {
      type: [Number, String],
      required: true
    },
    selectedGradeFilter: {
      type: [Number, String],
      default: ''
    },
    editQuestion: {
      type: Object,
      default: null
    },
    compact: {
      type: Boolean,
      default: false
    },
    hideMeta: {
      type: Boolean,
      default: false
    },
    hideCancel: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      questionType: 'mcq',
      form: {
        question: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        marks: 1,
        difficulty: 'remembering',
        is_math: false,
        is_chemistry: false,
        multiple_answers: false,
        required: false
      },
      questionImage: null,
      questionImagePreview: '',
      error: '',
      success: false,
      isEditMode: false,
      questionText: '',
      mathEquation: '',
      renderedPreview: '',
    };
  },
  mounted() {
    if (this.editQuestion) {
      this.isEditMode = true;
      const q = this.editQuestion;
      let options = [];
      if (Array.isArray(q.options)) {
        options = q.options.map(opt => typeof opt === 'object' ? opt.text : opt);
      } else {
        options = ['', ''];
      }
      this.form = {
        id: q.id,
        question: q.question || '',
        options: options,
        correct_answer: q.correct_answer || '',
        explanation: q.explanation || '',
        marks: q.marks || 1,
        difficulty: q.difficulty || '',
        is_math: !!q.is_math,
        is_chemistry: !!q.is_chemistry,
        multiple_answers: !!q.multiple_answers,
        required: !!q.is_required || !!q.required,
      };
      if (q.question_image_url) {
        this.questionImagePreview = q.question_image_url;
      }
      this.questionType = q.question_type || 'mcq';
      if (q.katex_content) {
        this.questionText = q.katex_content;
      }
    }
  },
  methods: {
    insertEquation() {
      if (this.mathEquation.trim()) {
        this.questionText += ` $${this.mathEquation}$ `;
        this.mathEquation = "";
        this.updatePreview();
      }
    },
    updatePreview() {
      this.renderedPreview = this.questionText.replace(
        /\$(.*?)\$/g,
        (match, tex) => {
          try {
            return katex.renderToString(tex, { throwOnError: false });
          } catch (e) {
            return match;
          }
        }
      );
    },
    addOption() {
      this.form.options.push('');
    },
    removeOption(idx) {
      if (this.form.options.length > 2) {
        this.form.options.splice(idx, 1);
        if (this.form.correct_answer === this.form.options[idx]) {
          this.form.correct_answer = '';
        }
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
      this.questionImagePreview = '';
    },
    async handleSubmit() {
      this.error = '';
      this.success = false;
      // Validation
      if (!this.selectedGradeFilter) {
        this.error = 'Please select a grade level before adding a question.';
        return;
      }
      if (this.questionType === 'mcq') {
        if (this.form.options.length < 2) {
          this.error = 'At least two options are required.';
          return;
        }
        if (!this.form.options.includes(this.form.correct_answer)) {
          this.error = 'Correct answer must match one of the options.';
          return;
        }
      }
      if (this.questionType === 'true_false' && !['True','False'].includes(this.form.correct_answer)) {
        this.error = 'Please select True or False as the correct answer.';
        return;
      }
      // Prepare FormData for file upload
      const formData = new FormData();
      for (const key in this.form) {
        if (Array.isArray(this.form[key])) {
          this.form[key].forEach((val, idx) => {
            formData.append(`${key}[${idx}]`, val);
          });
        } else {
          formData.append(key, this.form[key]);
        }
      }
      formData.append('subject_id', this.subjectId);
      formData.append('topic_id', this.topicId);
      formData.append('grade_level_id', this.selectedGradeFilter !== '' ? String(this.selectedGradeFilter) : '');
      formData.append('question_type', this.questionType);
      formData.append('difficulty_level', this.form.difficulty || 'understanding');
      formData.append('is_math', this.form.is_math ? '1' : '0');
      formData.append('is_chemistry', this.form.is_chemistry ? '1' : '0');
      formData.append('multiple_answers', this.form.multiple_answers ? '1' : '0');
      formData.append('is_required', this.form.required ? '1' : '0');
      // If math, use questionText, else use form.question
      formData.append('question', this.form.is_math ? this.questionText : this.form.question);
      if (this.questionImage) {
        formData.append('question_image', this.questionImage);
      }
      let url = '/questions';
      let method = 'post';
      if (this.isEditMode) {
        if (!this.form.id) {
          this.error = 'Unable to update question: Missing ID';
          return;
        }
        url = `/questions/${this.form.id}`;
        method = 'put';
        formData.append('_method', 'PUT');
      }
      const token = localStorage.getItem('auth_token');
      try {
        const response = await axios({
          method,
          url,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        });
        if (response.status === 200 || response.status === 201) {
          this.success = true;
          this.$emit(this.isEditMode ? 'updated' : 'created');
        } else {
          this.error = (response.data && (response.data.message || response.data.error)) || 'Failed to save question.';
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Network error.';
      }
    },
  },
  watch: {
    questionText() {
      this.updatePreview();
    },
    'form.options': {
      handler(newOptions) {
        if (!newOptions.includes(this.form.correct_answer)) {
          this.form.correct_answer = '';
        }
      },
      deep: true,
    },
  },
};
</script>


<style scoped>
.form-section {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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