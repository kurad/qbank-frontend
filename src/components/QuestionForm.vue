<template>
      <form @submit.prevent="handleSubmit" class="needs-validation" novalidate>
        <div class="form-section mb-4">
          <h3 class="section-subtitle mb-3">Question Settings</h3>
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
          <div v-if="questionType === 'mcq'" class="card p-3 mb-3">
            <div class="d-flex align-items-center mb-3">
              <span class="badge bg-primary me-2">Q</span>
              <div class="flex-grow-1">
                <template v-if="form.is_math">
                  <CKEditor
                    :editor="editor"
                    v-model="form.question"
                    :config="editorConfig"
                    id="question"
                  />
                </template>
                <template v-else>
                  <input class="form-control" v-model="form.question" id="question" required placeholder="Enter your question here..." />
                </template>
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
                <template v-if="form.is_math">
                  <CKEditor
                    :editor="editor"
                    v-model="form.options[idx]"
                    :config="editorConfig"
                    :id="`option-${idx}`"
                  />
                </template>
                <template v-else>
                  <input class="form-control form-control-sm" v-model="form.options[idx]" :placeholder="`Option ${String.fromCharCode(65 + idx)}`" required style="min-width:60px;max-width:180px;" />
                </template>
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
        <div v-else-if="questionType === 'true_false'" class="card p-3 mb-3">
          <div class="d-flex align-items-center mb-3">
            <span class="badge bg-primary me-2">Q</span>
            <div class="flex-grow-1">
              <template v-if="form.is_math">
                <math-field class="form-control" v-model="form.question" id="question" required placeholder="Enter your math or chemistry equation here..." @input="onMathInput"></math-field>
                <div class="form-text mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                  Use LaTeX syntax for equations (e.g., \frac{1}{2} for fractions) or chemistry formulas (e.g., \ce{H2O} for water)
                </div>
              </template>
              <template v-else>
                <input class="form-control" v-model="form.question" id="question" required placeholder="Enter your true/false question here..." />
              </template>
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
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" id="option-true" :checked="form.correct_answer === 'True'" @change="form.correct_answer = 'True'" />
              <label class="form-check-label" for="option-true">True</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" id="option-false" :checked="form.correct_answer === 'False'" @change="form.correct_answer = 'False'" />
              <label class="form-check-label" for="option-false">False</label>
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
        <div v-else-if="questionType === 'short_answer'" class="card p-3 mb-3">
          <div class="d-flex align-items-center mb-3">
            <span class="badge bg-primary me-2">Q</span>
            <div class="flex-grow-1">
              <template v-if="form.is_math">
                <math-field class="form-control" v-model="form.question" id="question" required placeholder="Enter your math or chemistry equation here..." @input="onMathInput"></math-field>
                <div class="form-text mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                  Use LaTeX syntax for equations (e.g., \frac{1}{2} for fractions) or chemistry formulas (e.g., \ce{H2O} for water)
                </div>
              </template>
              <template v-else>
                <input class="form-control" v-model="form.question" id="question" required placeholder="Enter your short answer question here..." />
              </template>
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
            <label for="correct_answer_sa" class="form-label">Correct Answer:</label>
            <template v-if="form.is_math">
              <math-field class="form-control" v-model="form.correct_answer" id="correct_answer_sa" placeholder="Enter the expected math answer" required></math-field>
              <div class="form-text mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                Students must match this equation exactly. Use LaTeX syntax (e.g., \frac{1}{2}) or chemistry formulas (e.g., \ce{H2O})
              </div>
            </template>
            <template v-else>
              <input class="form-control" v-model="form.correct_answer" id="correct_answer_sa" type="text" placeholder="Enter the expected answer" required />
              <div class="form-text mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                Students must match this answer exactly
              </div>
            </template>
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
      <h3 class="section-subtitle mb-3 d-flex align-items-center">
        Additional Information
        <button type="button" class="btn btn-link p-0 ms-2" @click="showExplanation = !showExplanation" title="Show/hide explanation">
          <svg width="20" height="20" fill="none" stroke="#6366f1" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
        </button>
      </h3>
      <div v-if="showExplanation" class="mb-3">
        <label for="explanation" class="form-label">Explanation <span class="text-muted">(optional)</span></label>
        <textarea v-model="form.explanation" id="explanation" rows="3" class="form-control" placeholder="Provide an explanation for the correct answer..."></textarea>
        <div class="form-text mt-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
          This will be shown to students after they answer
        </div>
      </div>
    </div>
    <div class="d-flex gap-3 mt-4">
      <button type="submit" class="btn btn-primary d-flex align-items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
        <span>{{ isEditMode ? 'Update Question' : 'Create Question' }}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary d-flex align-items-center gap-2" @click="$emit('cancel')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        <span>Cancel</span>
      </button>
    </div>
    
    <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mt-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m0-8h.01"/></svg>
      <span>{{ error }}</span>
    </div>
    <div v-if="success" class="alert alert-success d-flex align-items-center gap-2 mt-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-6"/></svg>
      <span>Question created successfully!</span>
    </div>
  </form>
</template>

<script>
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import axios from 'axios';
export default {
  name: 'QuestionForm',
  props: {
    subjectId: String,
    topicId: String,
    selectedGradeFilter: {
      type: [String, Number],
      required: true,
    },
    hideMeta: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    editQuestion: {
      type: Object,
      default: null,
    },
    
  },
  data() {
    return {
      form: this.editQuestion ? { ...this.editQuestion } : {
        question: '',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        marks: 1,
        difficulty: 'medium',
        is_math: false,
        is_chemistry: false,
        multiple_answers: false,
        required: false,
        
        },
        questionType: this.editQuestion ? this.editQuestion.question_type : 'mcq',
        error: '',
        success: false,
        questionImage: null,
        questionImagePreview: this.editQuestion && this.editQuestion.question_image_url ? this.editQuestion.question_image_url : '',
        isEditMode: !!this.editQuestion,
        showExplanation: !!(this.editQuestion && this.editQuestion.explanation),
        editor: ClassicEditor,
        editorConfig: {
          toolbar: ['bold', 'italic', 'undo', 'redo', 'math'],
          math: {
            engine: 'mathjax',
            outputType: 'span',
            lazyLoad: undefined
          }
      },
      };
  },
  mounted() {
    // Prefill form if editing
    if (this.editQuestion) {
      this.isEditMode = true;
      const q = this.editQuestion;
      this.form = {
        id: q.id,
        question: q.question || '',
        options: Array.isArray(q.options) ? [...q.options] : ['', ''],
        correct_answer: q.correct_answer || '',
        explanation: q.explanation || '',
        marks: q.marks || 1,
        difficulty: q.difficulty || '',
        is_math: !!q.is_math,
        is_chemistry: !!q.is_chemistry,
        multiple_answers: !!q.multiple_answers,
        required: !!q.required,
      };
      this.questionType = q.question_type || 'mcq';
      if (q.question_image_url) {
        this.questionImagePreview = q.question_image_url;
      }
    }
  },
  methods: {
    onMathInput(e) {
      this.form.question = e.target.value;
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
    async handleSubmit() {
      this.error = '';
      this.success = false;
      // Validation
      if (!this.form.question.trim()) {
        this.error = 'Question cannot be empty.';
        return;
      }
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
      // For short_answer, correct_answer is optional (no validation)
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
    formData.append('difficulty_level', this.form.difficulty || 'understanding'); // Default to 'understanding' if not set
    formData.append('is_math', this.form.is_math ? '1' : '0');
    formData.append('is_chemistry', this.form.is_chemistry ? '1' : '0');
    formData.append('multiple_answers', this.form.multiple_answers ? '1' : '0');
    formData.append('is_required', this.form.required ? '1' : '0');

      if (this.questionImage) {
        formData.append('question_image', this.questionImage);
      }
      // If editing, use PUT and include question ID
      let url = '/questions';
      let method = 'post';
      if (this.isEditMode) {
        if (!this.form.id) {
            console.error('Edit mode active but question ID is missing');
            this.error = 'Unable to update question: Missing ID';
            return;
        }
        url = `/questions/${this.form.id}`;
        method = 'put';
        formData.append('_method', 'PUT'); // For Laravel compatibility
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
        if (response.status === 200 || response.status === 201)  {
          this.success = true;
          this.$emit(this.isEditMode ? 'updated' : 'created');          
        } else {
          this.error = (response.data && (response.data.message || response.data.error)) || 'Failed to save question.';
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Network error.';
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
  },
  watch: {
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



