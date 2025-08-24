<template>
  <div class="container" v-if="assessment">
    <div class="card shadow-lg mb-4" style="border-radius: 1.5em;">
      <div class="card-header bg-primary text-white d-flex flex-column flex-md-row justify-content-between align-items-center" style="border-radius: 1.5em 1.5em 0 0;">
        <h2 class="mb-0 fw-bold">{{ assessment.title }}</h2>
        <div class="mt-2 mt-md-0">
          <span class="badge bg-info text-dark me-2">Topic: {{ topicName }}</span>
          <span class="badge bg-secondary me-2">Subject: {{ assessment.subject?.name || 'N/A' }}</span>
          <span class="badge bg-success">Questions: {{ questions ? questions.length : 0 }}</span>
        </div>
      </div>
      <div class="card-body" style="background: #f9fafb; border-radius: 0 0 1.5em 1.5em;">
        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="text-primary">Loading questions...</div>
        </div>
        <div v-else-if="questions && questions.length">
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fw-semibold text-primary">Question {{ currentIndex + 1 }} of {{ questions.length }}</span>
              <div class="progress" style="width: 50%; height: 12px;">
                <div class="progress-bar bg-primary" role="progressbar" :style="{ width: ((currentIndex + 1) / questions.length * 100) + '%' }" :aria-valuenow="currentIndex + 1" :aria-valuemin="0" :aria-valuemax="questions.length"></div>
              </div>
            </div>
            <div class="question-text mb-3 p-3 rounded" style="background: linear-gradient(90deg, #e0e7ff 0%, #f0f4ff 100%); font-size: 1.18em; color: #22223b; font-weight: 500; box-shadow: 0 2px 8px rgba(99,102,241,0.08);"
            v-html=" renderMath(questions[currentIndex].question_text)"

            >
            </div>
            
            <div class="options-list mb-3">
              <div v-for="(option, i) in (questions[currentIndex]?.options || [])"
                   :key="option.id"
                   class="form-check mb-2 p-2 rounded"
                   style="background: #e0e7ff; box-shadow: 0 2px 8px rgba(99,102,241,0.07);">
                <input class="form-check-input"
                       type="radio"
                       :name="'option-' + currentIndex"
                       :value="option.id"
                       v-model="answers[currentIndex]" />
                <label class="form-check-label fw-semibold ms-2">
                  <span class="me-2 fw-bold">{{ String.fromCharCode(65 + i) }}.</span>
                  <span v-html=" renderMath(option.text)"></span>

                </label>
              </div>
            </div>
          </div>
          <div class="d-flex gap-3 justify-content-end">
            <button class="btn btn-outline-secondary px-4 py-2 fw-bold" @click="prevQuestion" :disabled="currentIndex === 0">
              <i class="bi bi-arrow-left-circle me-2"></i>Previous
            </button>
            <button class="btn btn-outline-primary px-4 py-2 fw-bold" @click="nextQuestion" :disabled="currentIndex === questions.length - 1">
              Next<i class="bi bi-arrow-right-circle ms-2"></i>
            </button>
            <button v-if="currentIndex === questions.length - 1" class="btn btn-gradient px-4 py-2 fw-bold" style="background: linear-gradient(90deg, #34d399 0%, #10b981 100%); color: #fff;" @click.prevent="submitAnswers" :disabled="submitting">
              <i class="bi bi-send-check me-2"></i>{{ submitting ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <span class="lead text-muted">No questions found for this assessment.</span>
        </div>
        <div v-if="message" :class="{'text-success fw-bold': submitSuccess, 'text-danger fw-bold': !submitSuccess}" class="mt-4">{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';
export default {
  name: 'PracticeSession',
  data() {
    return {
      assessment: null,
      questions: [],
      answers: [],
      currentIndex: 0,
      message: '',
      submitSuccess: false,
      submitting: false,
      loading: true,
    };
  },
  computed: {
    topicName() {
      // Prefer root topic.topic_name, then assessment.topic_name, then assessment.topic.topic_name
      if (this.topic && this.topic.topic_name) {
        return this.topic.topic_name;
      }
      return this.assessment?.topic_name || this.assessment?.topic?.topic_name || 'N/A';
    }
  },
  async created() {
    const token = localStorage.getItem('auth_token');
  const id = this.$route.params.id;
  this.loading = true;
  try {
    const res = await axios.get(`/assessments/${id}/details`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    this.assessment = res.data.assessment || {};
    this.topic = res.data.topic || {};
    // console.log('Topic:', this.assessment.topic.topic_name);
    // Extract and map questions, and store original assessment questions for IDs
    this.originalAssessmentQuestions = Array.isArray(this.assessment.questions) ? this.assessment.questions : [];
    if (this.originalAssessmentQuestions.length) {
      this.questions = this.originalAssessmentQuestions.map(q => {
        const qObj = q.question || {};
        let options = [];
        // Handle both stringified and array options
        let rawOptions = qObj.options || qObj.option || [];
        if (typeof rawOptions === 'string') {
          try {
            rawOptions = JSON.parse(rawOptions);
          } catch {
            rawOptions = [];
          }
        }
        // If options is [null, null] for true_false, treat as missing
        if (qObj.question_type === 'true_false' && Array.isArray(rawOptions) && rawOptions.every(opt => opt === null)) {
          options = [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' }
          ];
        } else if (Array.isArray(rawOptions) && rawOptions.length > 0) {
          options = rawOptions.map((opt, idx) => ({ id: idx, text: `$${opt}$` }));
        } else if (qObj.question_type === 'true_false') {
          // Provide default options for true/false questions with unique IDs
          options = [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' }
          ];
        }
        return {
          question_text: qObj.question || '',
          options
        };
      });
    } else {
      this.questions = [];
    }
    this.answers = Array(this.questions.length).fill(null);
  } catch (err) {
    this.assessment = {};
    this.questions = [];
    this.answers = [];
    this.message = err.response?.data?.message || 'Failed to load assessment.';
  } finally {
    this.loading = false;
  }
  },
  methods: {
    prevQuestion() {
      if (this.currentIndex > 0) this.currentIndex--;
    },
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
    },
   renderMath(text) {
      if (!text) return '';

      // Replace display math $$...$$
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try { 
          return `<div class="katex-display">${katex.renderToString(math, { displayMode: true, throwOnError: false })}</div>`; 
        }
        catch (e) { 
          console.error(e);
            return `$$${math}$$`; // Return original if error
        }
      });

      // Replace inline math $...$
      text = text.replace(/\$(.+?)\$/g, (_, math) => {
        try { 
          return `<span class="katex-inline">${katex.renderToString(math, { displayMode: false, throwOnError: false })}</span>`;
         }
        catch (e) { 
          console.error(e); 
          return `$${math}$`; 
         }
      });

      return text;
    },
    
     
    async submitAnswers() {
      this.submitting = true;
      this.message = '';
      const token = localStorage.getItem('auth_token');
      try {
        // Build answers array with question_id and answer from originalAssessmentQuestions
        const answers = (this.originalAssessmentQuestions || []).map((q, idx) => ({
          question_id: q.question_id || q.id, // Use question_id from assessment.questions
          answer: this.answers[idx]
        }));
        // Send student_assessment_id if present
        const payload = {
          answers
        };
        if (this.assessment.student_assessment_id) {
          payload.student_assessment_id = this.assessment.student_assessment_id;
        }
        await axios.post('/assessments/submit-answers', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.submitSuccess = true;
        this.message = 'Answers submitted successfully!';
        // Redirect to practice list with success message
        setTimeout(() => {
          this.$router.push({ name: 'StudentPracticeList', query: { success: 'Practice submitted successfully!' } });
        }, 1000);
      } catch (err) {
        this.submitSuccess = false;
        this.message = err.response?.data?.message || 'Submission failed.';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.practice-session-container {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(99,102,241,0.08);
  max-width: 600px;
  margin: 2em auto;
}
.meta {
  color: #6b7280;
  margin-bottom: 1em;
}
.question-block {
  margin-bottom: 1.5em;
}
  .question-header {
    font-weight: 600;
    margin-bottom: 0.7em;
  }
  .qnum {
    font-size: 1.08em;
    color: #6366f1;
  }
  .question-text {
    font-size: 1.18em;
    margin-bottom: 1.2em;
    color: #22223b;
    line-height: 1.5;
    font-weight: 600;
  }
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1.1em;
    margin-bottom: 1.2em;
    margin-left: 1.2em;
  }
  .option-row {
    display: flex;
    align-items: center;
    gap: 0.7em;
  }
  .option-label {
    font-size: 1.08em;
    color: #22223b;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.7em;
  }
.form-check-input {
  accent-color: #6366f1;
  width: 1.2em;
  height: 1.2em;
  border: 2px solid #6366f1;
  box-shadow: 5px 2px 8px rgba(99,102,241,0.10);
  margin-right: 0.9em;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.form-check-input:checked {
  background-color: #6366f1;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(52,211,153,0.15);
}
.form-check-label {
  font-size: 1em;
  color: #22223b;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.actions {
  display: flex;
  gap: 1em;
}
.success { color: #16a34a; }
.error { color: #dc2626; }
</style>
